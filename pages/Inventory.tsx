
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/Button';
import { ViewToggle } from '../components/ViewToggle';
import { ViewMode, loadViewMode, saveViewMode, PAGE_IDS, DEFAULT_VIEW_MODE } from '../utils/viewMode';
import { Plus, Edit, Package, Search, Image as ImageIcon, UploadCloud, AlertTriangle, Calendar, Archive, Filter, Truck, History, Printer, X, ArrowRight, HelpCircle } from 'lucide-react';
import { Product, StockMovement } from '../types';
import { generateUUID } from '../services/supabase/client';

export const Inventory: React.FC = () => {
  const { products, categories, suppliers, t, addProduct, editProduct, updateStock, hasPermission, currentUser, stockMovements, settings } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // View Mode State
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  
  // Load view mode from Supabase on mount
  useEffect(() => {
    const loadMode = async () => {
      if (settings?.shopId && currentUser?.id) {
        const mode = await loadViewMode(PAGE_IDS.STOCK, settings.shopId, currentUser.id);
        setViewMode(mode);
      } else {
        const mode = await loadViewMode(PAGE_IDS.STOCK);
        setViewMode(mode);
      }
    };
    loadMode();
  }, [settings?.shopId, currentUser?.id]);
  
  // Save view mode to Supabase
  useEffect(() => {
    if (settings?.shopId && currentUser?.id && viewMode !== DEFAULT_VIEW_MODE) {
      saveViewMode(PAGE_IDS.STOCK, viewMode, settings.shopId, currentUser.id);
    }
  }, [viewMode, settings?.shopId, currentUser?.id]);
  
  // State for Add/Edit Product
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for Restock
  const [restockData, setRestockData] = useState<{id: string, cartons: number, units: number, batch: string, expiry: string, supplierId: string}>({
    id: '', cartons: 0, units: 0, batch: '', expiry: '', supplierId: ''
  });

  // State for History
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [viewingHistoryProduct, setViewingHistoryProduct] = useState<Product | null>(null);

  const canEdit = hasPermission('manage_stock');
  
  if (!settings) return null;
  const currentShopId = settings.shopId;
  
  // CRITICAL: Filter by shopId first to ensure data isolation
  const shopProducts = products.filter(p => p.shopId === currentShopId);
  const shopCategories = categories.filter(c => c.shopId === currentShopId);
  const shopSuppliers = suppliers.filter(s => s.shopId === currentShopId);
  const shopStockMovements = stockMovements.filter(sm => sm.shopId === currentShopId);
  
  // Filter products: Exclude archived items
  const filteredProducts = shopProducts.filter(p => {
    if (p.isArchived) return false;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm);
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ unitsPerCarton: 1, category: shopCategories[0]?.name || 'General' });
    setImagePreview('');
    setUploadedImageFile(null);
    setShowModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setImagePreview(product.image || '');
    setUploadedImageFile(null);
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }
    
    try {
      setUploadingImage(true);
      
      // Compress the image before storing
      const { compressImage, getCompressionOptions } = await import('../services/imageCompression');
      const compressionOptions = getCompressionOptions(file);
      const compressedFile = await compressImage(file, compressionOptions);
      
      // Validate compressed size (should be under 500KB, but check anyway)
      if (compressedFile.size > 500 * 1024) {
        console.warn('Compressed image is still large:', (compressedFile.size / 1024).toFixed(2), 'KB');
      }
      
      // Store the compressed file for later upload
      setUploadedImageFile(compressedFile);
      
      // Show preview of compressed image
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image: result })); // Temporary preview
      };
      reader.readAsDataURL(compressedFile);
      
      console.log('✅ Image compressed and ready for upload');
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Failed to process image. Please try another image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const calculateUnitCost = (cartonCost: number, units: number) => {
    if (!units) return 0;
    return Number((cartonCost / units).toFixed(2));
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.cartonPrice || !formData.unitsPerCarton) {
      alert("Please fill required fields (Name, Price, Units/Carton)");
      return;
    }

    const cartonCost = Number(formData.costPriceCarton) || 0;
    const unitsPerCarton = Number(formData.unitsPerCarton) || 1;
    
    // Auto-generate barcode if not provided (to avoid unique constraint conflicts)
    const autoBarcode = formData.barcode?.trim() || `AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    const productId = editingProduct?.id || generateUUID();
    const shopId = editingProduct?.shopId || settings?.shopId || '';
    
    // Upload image to Supabase Storage if a new file was selected
    let finalImageUrl = imagePreview || editingProduct?.image || '';
    
    if (uploadedImageFile && shopId) {
      try {
        setUploadingImage(true);
        const { uploadProductImage } = await import('../services/supabase/storage');
        finalImageUrl = await uploadProductImage(uploadedImageFile, productId, shopId);
        console.log('✅ Image uploaded to Supabase:', finalImageUrl);
      } catch (error) {
        console.error('❌ Failed to upload image:', error);
        alert('Failed to upload image. Product will be saved without image.');
        // Continue without image
        finalImageUrl = editingProduct?.image || '';
      } finally {
        setUploadingImage(false);
      }
    }
    
    const productData: Product = {
      id: productId,
      shopId: shopId,
      name: formData.name,
      barcode: autoBarcode,
      category: formData.category || 'General',
      supplierId: formData.supplierId,
      image: finalImageUrl,
      
      cartonPrice: Number(formData.cartonPrice),
      unitPrice: Number(formData.unitPrice) || 0,
      costPriceCarton: cartonCost,
      costPriceUnit: calculateUnitCost(cartonCost, unitsPerCarton),
      unitsPerCarton: unitsPerCarton,
      
      stockCartons: Number(formData.stockCartons) || 0,
      stockUnits: Number(formData.stockUnits) || 0,
      minStockLevel: Number(formData.minStockLevel) || 10,
      
      totalUnits: editingProduct 
        ? editingProduct.totalUnits 
        : (Number(formData.stockCartons) || 0) * unitsPerCarton + (Number(formData.stockUnits) || 0),

      batchNumber: formData.batchNumber,
      expiryDate: formData.expiryDate,
      createdAt: editingProduct?.createdAt || new Date().toISOString()
    };

    if (editingProduct) {
      editProduct(productData);
    } else {
      addProduct(productData);
    }
    
    // Reset image upload state
    setUploadedImageFile(null);
    setShowModal(false);
  };

  const handleOpenRestock = (product: Product) => {
    setRestockData({ id: product.id, cartons: 0, units: 0, batch: product.batchNumber || '', expiry: product.expiryDate || '', supplierId: product.supplierId || '' });
    setShowRestockModal(true);
  };

  const handleRestockSubmit = () => {
    updateStock(restockData.id, restockData.cartons, 'carton', { batch: restockData.batch, expiry: restockData.expiry });
    if (restockData.units > 0) {
      updateStock(restockData.id, restockData.units, 'unit', { batch: restockData.batch, expiry: restockData.expiry });
    }
    setShowRestockModal(false);
  };

  const handleViewHistory = (product: Product) => {
      setViewingHistoryProduct(product);
      setShowHistoryModal(true);
  };

  const getProductHistory = (productId: string) => {
      return shopStockMovements.filter(m => m.productId === productId).sort((a, b) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime());
  };

  const handlePrintHistory = () => {
      if (!viewingHistoryProduct) return;
      const history = getProductHistory(viewingHistoryProduct.id);
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) return;

      const rows = history.map(h => `
        <tr>
            <td>${new Date(h.createdAt || h.timestamp).toLocaleDateString()} ${new Date(h.createdAt || h.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td style="text-transform: capitalize">${h.type}</td>
            <td style="text-align: right; color: ${h.quantityChange > 0 ? 'green' : 'red'}">
                ${h.quantityChange > 0 ? '+' : ''}${h.quantityChange} ${h.quantityType === 'carton' ? (Math.abs(h.quantityChange) / viewingHistoryProduct.unitsPerCarton).toFixed(1) + ' Ctn' : 'Units'}
            </td>
            <td style="text-align: right">${Math.floor(h.balanceAfter / viewingHistoryProduct.unitsPerCarton)}c ${h.balanceAfter % viewingHistoryProduct.unitsPerCarton}u</td>
        </tr>
      `).join('');

      const html = `
        <html>
        <head>
            <title>Stock History - ${viewingHistoryProduct.name}</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; }
                .header { text-align: center; margin-bottom: 20px; }
                h2 { margin: 5px 0; text-transform: uppercase; }
                p { margin: 0; color: #555; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { border-bottom: 1px dashed #000; text-align: left; padding: 5px; }
                td { padding: 5px; border-bottom: 1px solid #eee; }
                .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #888; border-top: 1px dashed #ddd; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>${settings.businessName}</h2>
                <p>Stock Audit Log</p>
                <p><strong>${viewingHistoryProduct.name}</strong></p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th style="text-align: right">Change</th>
                        <th style="text-align: right">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
            <div class="footer">
                Printed on ${new Date().toLocaleString()}
            </div>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  // Tooltip Component
  const InfoTooltip = ({ translationKey }: { translationKey: string }) => {
    // Safely retrieve the tooltip text using the translation key logic
    // We access t('tooltips') first (if it returns the object), or handle if flattened
    // Given the structure, we'll try to get it directly or fallback
    
    // Note: The t() function in context usually returns a string. 
    // If the tooltips are nested, we might need to access TRANSLATIONS directly or update t() logic.
    // For simplicity, we'll assume t() handles nested keys like 'tooltips.addCartons' or we do a direct lookup 
    // BUT our current t() implementation is shallow. Let's do a direct lookup via a helper in component or just pass the text.
    
    // Accessing via t() with dot notation if supported, or manual lookup.
    // Since t() is simple, let's use a manual lookup helper for this component context
    const text = (t('tooltips') as any)?.[translationKey] || '';

    return (
      <div className="group relative inline-flex items-center justify-center ml-1.5 align-middle">
        <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-green-500 cursor-help transition-colors" />
        <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-800/95 text-white text-[10px] leading-relaxed p-2.5 rounded-lg shadow-xl z-50 text-center backdrop-blur-sm pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800/95"></div>
        </div>
      </div>
    );
  };

  const inputClass = "w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">{t('stock')}</h2>
           <p className="text-gray-500 text-sm">Manage inventory and pricing</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className={`${inputClass} pl-9 py-2`}
              placeholder={t('searchProduct')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
              <select 
                className={`${inputClass} appearance-none pr-8 py-2`}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                  <option value="all">{t('allCategories')}</option>
                  {shopCategories.filter(c => !c.isArchived).map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
              </select>
              <Filter className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} className="hidden sm:flex" />
          {canEdit && (
            <Button onClick={handleOpenAdd} className="whitespace-nowrap shadow-lg shadow-green-100">
              <Plus className="w-5 h-5 mr-1" />
              <span className="hidden sm:inline">{t('addProduct')}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="transition-all duration-300 animate-in fade-in">
        {viewMode === 'small' && (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {filteredProducts.map(p => {
              const isLowStock = p.totalUnits < p.minStockLevel;
              return (
                <div key={p.id} className="bg-white rounded-xl p-2 shadow-sm border border-gray-100 hover:shadow-md transition-all relative group">
                  {isLowStock && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full z-10" />}
                  <div className="w-full aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden mb-2 border border-gray-100">
                    {p.image ? (
                      <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                    ) : (
                      <Package className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <p className="text-[10px] font-semibold text-gray-800 line-clamp-2 text-center leading-tight mb-1">{p.name}</p>
                  <div className="text-center">
                    <span className="text-[9px] text-gray-500">{t('stock')}: </span>
                    <span className={`text-[9px] font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.floor(p.totalUnits / p.unitsPerCarton)}c
                    </span>
                  </div>
                  {canEdit && (
                    <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(p); }} className="mt-1 w-full text-[9px] text-gray-500 hover:text-green-600">
                      Edit
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'large' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(p => {
              const isLowStock = p.totalUnits < p.minStockLevel;
              const daysLeft = p.expiryDate ? Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
              const isExpired = daysLeft !== null && daysLeft < 0;
              const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;

              return (
                <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                  {isLowStock && <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-bl-lg z-10" />}
                  
                  <div className="flex gap-4 mb-3">
                    <div className="w-20 h-20 bg-gray-50 rounded-xl flex-shrink-0 border border-gray-100 flex items-center justify-center overflow-hidden">
                      {p.image ? (
                        <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                      ) : (
                        <Package className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 line-clamp-2 text-sm mb-1">{p.name}</h3>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{p.category}</p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Archive className="w-3 h-3" />
                        <span>{p.barcode || 'No Barcode'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                       <span className="block text-[10px] text-gray-400 uppercase font-semibold">{t('carton')}</span>
                       <span className="font-bold text-gray-800">{settings.currency}{p.cartonPrice.toLocaleString()}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                       <span className="block text-[10px] text-gray-400 uppercase font-semibold">{t('unit')}</span>
                       <span className="font-bold text-gray-800">{settings.currency}{p.unitPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase font-bold">{t('currentStock')}</span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-lg font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                          {Math.floor(p.totalUnits / p.unitsPerCarton)}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">ctn</span>
                        <span className="text-gray-300 mx-1">/</span>
                        <span className={`text-lg font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                           {p.totalUnits % p.unitsPerCarton}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">units</span>
                      </div>
                    </div>
                    
                    {(isExpired || isExpiringSoon) && (
                      <div 
                        className={`p-2 rounded-lg flex items-center gap-1.5 ${isExpired ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}
                        title={isExpired ? `${t('expired')}: ${p.expiryDate}` : `${t('expiresIn')} ${daysLeft} ${t('days')}`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span className="text-[10px] font-bold">
                           {isExpired ? 'Exp' : `${daysLeft}d`}
                        </span>
                      </div>
                    )}
                  </div>

                  {canEdit && (
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                       <Button variant="secondary" size="sm" onClick={() => handleOpenRestock(p)} className="text-xs shadow-md shadow-orange-100">
                         {t('restock')}
                       </Button>
                       <div className="flex gap-2">
                         <button onClick={() => handleOpenEdit(p)} className="flex-1 bg-white hover:bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center transition-colors border border-gray-200 shadow-sm" title="Edit">
                           <Edit className="w-4 h-4" />
                         </button>
                         <button onClick={() => handleViewHistory(p)} className="flex-1 bg-white hover:bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center transition-colors border border-gray-200 shadow-sm" title="History">
                           <History className="w-4 h-4" />
                         </button>
                       </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredProducts.map(p => {
              const isLowStock = p.totalUnits < p.minStockLevel;
              const daysLeft = p.expiryDate ? Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
              const isExpired = daysLeft !== null && daysLeft < 0;
              const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
              return (
                <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 relative">
                    {p.image ? (
                      <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                    ) : (
                      <Package className="w-8 h-8 text-gray-300" />
                    )}
                    {isLowStock && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm mb-1">{p.name}</h3>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{p.category}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Barcode: {p.barcode || 'N/A'}</span>
                      <span>Stock: {Math.floor(p.totalUnits / p.unitsPerCarton)}c {p.totalUnits % p.unitsPerCarton}u</span>
                      <span className={isLowStock ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                        {isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-gray-400 mb-1">Unit: {settings.currency}{p.unitPrice.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">Carton: {settings.currency}{p.cartonPrice.toLocaleString()}</div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(p)} className="p-2 bg-white hover:bg-gray-50 text-gray-600 rounded-lg transition-colors border border-gray-200" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleViewHistory(p)} className="p-2 bg-white hover:bg-blue-50 text-blue-500 rounded-lg transition-colors border border-gray-200" title="History">
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredProducts.map(p => {
              const isLowStock = p.totalUnits < p.minStockLevel;
              const daysLeft = p.expiryDate ? Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
              const isExpired = daysLeft !== null && daysLeft < 0;
              const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
              return (
                <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                  <div className="flex gap-5 mb-4">
                    <div className="w-32 h-32 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 relative">
                      {p.image ? (
                        <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                      ) : (
                        <Package className="w-10 h-10 text-gray-300" />
                      )}
                      {isLowStock && <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 mb-2">{p.name}</h3>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">{p.category}</p>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div>Barcode: {p.barcode || 'No Barcode'}</div>
                        <div>Units per Carton: {p.unitsPerCarton}</div>
                        {(isExpired || isExpiringSoon) && (
                          <div className={isExpired ? 'text-red-600 font-bold' : 'text-orange-600 font-bold'}>
                            {isExpired ? `Expired: ${p.expiryDate}` : `Expires in ${daysLeft} days`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="block text-xs text-gray-400 uppercase font-semibold mb-1">Unit Price</span>
                      <span className="font-bold text-gray-800">{settings.currency}{p.unitPrice.toLocaleString()}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="block text-xs text-gray-400 uppercase font-semibold mb-1">Carton Price</span>
                      <span className="font-bold text-gray-800">{settings.currency}{p.cartonPrice.toLocaleString()}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="block text-xs text-gray-400 uppercase font-semibold mb-1">Cost Price (Unit)</span>
                      <span className="font-bold text-gray-800">{settings.currency}{p.costPriceUnit.toLocaleString()}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="block text-xs text-gray-400 uppercase font-semibold mb-1">Cost Price (Carton)</span>
                      <span className="font-bold text-gray-800">{settings.currency}{p.costPriceCarton.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-100">
                    <div>
                      <span className="block text-xs text-gray-400 uppercase font-semibold mb-1">Stock Level</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                          {Math.floor(p.totalUnits / p.unitsPerCarton)} Cartons, {p.totalUnits % p.unitsPerCarton} Units
                        </span>
                        {isLowStock && <span className="text-xs text-red-600 font-bold">(Low Stock)</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Total Units: {p.totalUnits} | Min Level: {p.minStockLevel}</div>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex gap-2 mt-4">
                      <Button variant="secondary" size="sm" onClick={() => handleOpenRestock(p)} className="flex-1 text-xs">
                        <Truck className="w-4 h-4 mr-1" />
                        {t('restock')}
                      </Button>
                      <button onClick={() => handleOpenEdit(p)} className="px-4 bg-white hover:bg-gray-50 text-gray-600 rounded-lg transition-colors border border-gray-200" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleViewHistory(p)} className="px-4 bg-white hover:bg-blue-50 text-blue-500 rounded-lg transition-colors border border-gray-200" title="History">
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Modal (Add/Edit) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                 <h3 className="text-xl font-bold text-gray-800">
                    {editingProduct ? t('editProduct') : t('addProduct')}
                 </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* SECTION 1: BASIC INFO */}
                <div className="space-y-5">
                   <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">{t('basicInfo')}</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="col-span-1">
                         <div
                           onClick={() => !uploadingImage && fileInputRef.current?.click()}        
                           className={`aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-green-500 hover:bg-green-50/30 flex flex-col items-center justify-center transition-all overflow-hidden relative group bg-gray-50 ${
                             uploadingImage ? 'cursor-wait opacity-60' : 'cursor-pointer'
                           }`}
                         >
                            {uploadingImage ? (
                              <div className="flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-2"></div>
                                <span className="text-xs text-gray-500 font-medium">Compressing image...</span>
                              </div>
                            ) : imagePreview ? (
                              <>
                                <img src={imagePreview} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                   <p className="text-white text-xs font-bold">{t('uploadImage')}</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <UploadCloud className="w-8 h-8 text-gray-400 mb-2 group-hover:text-green-500 transition-colors" />
                                <span className="text-xs text-gray-500 font-medium">{t('uploadImage')}</span>
                                <span className="text-[10px] text-gray-400 mt-1">Max 10MB, auto-compressed</span>
                              </>
                            )}
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                         </div>
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-4">
                         <div>
                           <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('productName')}</label>
                           <input 
                             className={inputClass}
                             value={formData.name || ''}
                             onChange={e => setFormData({...formData, name: e.target.value})}
                             placeholder="e.g. Peak Milk"
                           />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('category')}</label>
                               <select 
                                 className={`${inputClass} appearance-none bg-no-repeat bg-[right_1rem_center]`}
                                 value={formData.category}
                                 onChange={e => setFormData({...formData, category: e.target.value})}
                               >
                                  {shopCategories.filter(c => !c.isArchived).map(cat => (
                                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                                  ))}
                               </select>
                            </div>
                            <div>
                               <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('barcode')} (Optional)</label>
                               <input 
                                 className={inputClass}
                                 value={formData.barcode || ''}
                                 onChange={e => setFormData({...formData, barcode: e.target.value})}
                                 placeholder="Scan or type"
                               />
                            </div>
                         </div>
                         <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('supplierName')} (Optional)</label>
                            <select 
                                className={inputClass}
                                value={formData.supplierId || ''}
                                onChange={e => setFormData({...formData, supplierId: e.target.value})}
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.filter(s => !s.isArchived).map(sup => (
                                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                                ))}
                            </select>
                         </div>
                      </div>
                   </div>
                </div>

                {/* SECTION 2: PRICING */}
                <div className="space-y-5">
                   <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">{t('pricing')}</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                         <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4 text-green-600" />
                            {t('carton')}
                         </h4>
                         <div className="space-y-4">
                            <div>
                               <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('costPrice')}</label>
                               <div className="relative">
                                  <span className="absolute left-4 top-3 text-gray-400 font-bold text-sm">₦</span>
                                  <input 
                                    type="number" 
                                    className={`${inputClass} pl-8`}
                                    value={formData.costPriceCarton || ''}
                                    onChange={e => setFormData({...formData, costPriceCarton: Number(e.target.value)})}
                                    placeholder="0.00"
                                  />
                               </div>
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('sellingPrice')}</label>
                               <div className="relative">
                                  <span className="absolute left-4 top-3 text-green-600 font-bold text-sm">₦</span>
                                  <input 
                                    type="number" 
                                    className={`${inputClass} pl-8 font-bold text-green-700 border-green-200 bg-green-50/10 focus:ring-green-500/30`}
                                    value={formData.cartonPrice || ''}
                                    onChange={e => setFormData({...formData, cartonPrice: Number(e.target.value)})}
                                    placeholder="0.00"
                                  />
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                         <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                             <div className="w-4 h-4 rounded border border-green-600"></div>
                             {t('unit')}
                         </h4>
                         <div className="space-y-4">
                            <div>
                               <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('unitsPerCarton')}</label>
                               <input 
                                  type="number" 
                                  className={inputClass}
                                  value={formData.unitsPerCarton || ''}
                                  onChange={e => setFormData({...formData, unitsPerCarton: Number(e.target.value)})}
                                  placeholder="e.g. 12 or 24"
                                />
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('sellingPrice')}</label>
                               <div className="relative">
                                  <span className="absolute left-4 top-3 text-green-600 font-bold text-sm">₦</span>
                                  <input 
                                    type="number" 
                                    className={`${inputClass} pl-8 font-bold text-green-700 border-green-200 bg-green-50/10 focus:ring-green-500/30`}
                                    value={formData.unitPrice || ''}
                                    onChange={e => setFormData({...formData, unitPrice: Number(e.target.value)})}
                                    placeholder="0.00"
                                  />
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* SECTION 3: STOCK & TRACKING */}
                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">{t('stockAndTracking')}</h4>
                  
                  {!editingProduct && (
                     <div className="grid grid-cols-2 gap-6 bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50">
                        <div>
                           <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                             {t('addCartons')} (Initial)
                             <InfoTooltip translationKey="addCartons" />
                           </label>
                           <input 
                             type="number" 
                             className={inputClass}
                             value={formData.stockCartons || ''}
                             onChange={e => setFormData({...formData, stockCartons: Number(e.target.value)})}
                             placeholder="0"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center">
                             {t('addUnits')} (Initial)
                             <InfoTooltip translationKey="addUnits" />
                           </label>
                           <input 
                             type="number" 
                             className={inputClass}
                             value={formData.stockUnits || ''}
                             onChange={e => setFormData({...formData, stockUnits: Number(e.target.value)})}
                             placeholder="0"
                           />
                        </div>
                     </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center">
                          {t('minStockLevel')}
                          <InfoTooltip translationKey="minStock" />
                        </label>
                        <input 
                           type="number"
                           className={inputClass}
                           value={formData.minStockLevel || 10}
                           onChange={e => setFormData({...formData, minStockLevel: Number(e.target.value)})}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 flex items-center">
                          {t('batchNumber')} (Optional)
                          <InfoTooltip translationKey="batch" />
                        </label>
                        <input 
                           className={inputClass}
                           placeholder="Optional"
                           value={formData.batchNumber || ''}
                           onChange={e => setFormData({...formData, batchNumber: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5">{t('expiryDate')} (Optional)</label>
                        <input 
                           type="date"
                           className={`${inputClass} px-3 min-h-[46px]`}
                           value={formData.expiryDate || ''}
                           onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                           style={{ colorScheme: 'light' }}
                        />
                     </div>
                  </div>
                </div>

              </div>

              <div className="p-6 border-t border-gray-100 flex gap-4 bg-white sticky bottom-0 z-10">
                 <Button 
                   className="flex-1 py-3 text-lg font-bold shadow-lg shadow-green-200" 
                   onClick={handleSaveProduct}
                   disabled={uploadingImage}
                 >
                   {uploadingImage ? 'Uploading Image...' : t('save')}
                 </Button>
                 <Button 
                   variant="outline" 
                   className="flex-1 py-3 border-gray-200 bg-white" 
                   onClick={() => setShowModal(false)}
                   disabled={uploadingImage}
                 >
                   {t('cancel')}
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-gray-100">
               <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">{t('restock')} Product</h3>
               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 text-center">{t('addCartons')}</label>
                        <input 
                          type="number" 
                          className="w-full bg-white border border-gray-200 p-4 rounded-2xl outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 font-bold text-2xl text-center text-green-700 shadow-sm transition-all"
                          value={restockData.cartons || ''}
                          onChange={e => setRestockData({...restockData, cartons: Number(e.target.value)})}
                          placeholder="0"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 text-center">{t('addUnits')}</label>
                        <input 
                          type="number" 
                          className="w-full bg-white border border-gray-200 p-4 rounded-2xl outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 font-bold text-2xl text-center text-gray-700 shadow-sm transition-all"
                          value={restockData.units || ''}
                          onChange={e => setRestockData({...restockData, units: Number(e.target.value)})}
                          placeholder="0"
                        />
                     </div>
                  </div>

                  <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wide text-center">Batch Tracking (Optional)</p>
                     
                     <select 
                        className={inputClass}
                        value={restockData.supplierId}
                        onChange={e => setRestockData({...restockData, supplierId: e.target.value})}
                     >
                        <option value="">Select Supplier</option>
                        {suppliers.filter(s => !s.isArchived).map(sup => (
                            <option key={sup.id} value={sup.id}>{sup.name}</option>
                        ))}
                     </select>

                     <input 
                        className={inputClass} 
                        placeholder={t('batchNumber')}
                        value={restockData.batch}
                        onChange={e => setRestockData({...restockData, batch: e.target.value})}
                     />
                     <input 
                        type="date"
                        className={`${inputClass} min-h-[46px]`}
                        value={restockData.expiry}
                        onChange={e => setRestockData({...restockData, expiry: e.target.value})}
                        style={{ colorScheme: 'light' }}
                     />
                  </div>

                  <div className="flex gap-4 mt-6">
                     <Button className="flex-1 py-3 text-lg font-bold shadow-lg shadow-green-200" onClick={handleRestockSubmit}>{t('confirm')}</Button>
                     <Button variant="outline" className="flex-1 py-3 bg-white" onClick={() => setShowRestockModal(false)}>{t('cancel')}</Button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Stock History Modal */}
      {showHistoryModal && viewingHistoryProduct && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden max-h-[80vh] flex flex-col">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                  <div>
                     <h3 className="text-xl font-bold text-gray-800">{viewingHistoryProduct.name}</h3>
                     <p className="text-sm text-gray-500">Stock History Log</p>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={handlePrintHistory} className="p-2 hover:bg-gray-100 rounded-full" title="Print History">
                         <Printer className="w-5 h-5 text-gray-600" />
                      </button>
                      <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                         <X className="w-5 h-5 text-gray-400" />
                      </button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-0 bg-white">
                  {(() => {
                      const history = getProductHistory(viewingHistoryProduct.id);
                      if (history.length === 0) {
                          return <div className="p-10 text-center text-gray-400">No stock movement history available.</div>;
                      }
                      return (
                         <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                               <tr>
                                  <th className="p-4 font-semibold text-gray-600">Date/Time</th>
                                  <th className="p-4 font-semibold text-gray-600">Type</th>
                                  <th className="p-4 font-semibold text-gray-600 text-right">Change</th>
                                  <th className="p-4 font-semibold text-gray-600 text-right">Balance</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                               {history.map(h => (
                                  <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                                     <td className="p-4 text-gray-600">
                                        <div className="font-medium">{new Date(h.createdAt || h.timestamp).toLocaleDateString()}</div>
                                        <div className="text-[10px] text-gray-400">{new Date(h.createdAt || h.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                     </td>
                                     <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                            h.type === 'restock' ? 'bg-green-100 text-green-700' :
                                            h.type === 'sale' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                           {h.type}
                                        </span>
                                     </td>
                                     <td className={`p-4 text-right font-bold ${h.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {h.quantityChange > 0 ? '+' : ''}{h.quantityChange}
                                        <span className="text-[10px] ml-1 text-gray-400 font-normal">
                                            {h.quantityType === 'carton' ? 'Ctn' : 'Units'}
                                        </span>
                                     </td>
                                     <td className="p-4 text-right text-gray-700 font-medium">
                                        {Math.floor(h.balanceAfter / viewingHistoryProduct.unitsPerCarton)}c {h.balanceAfter % viewingHistoryProduct.unitsPerCarton}u
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      );
                  })()}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
