
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, CartItem, Sale, Customer } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { Plus, Minus, Trash2, Search, ScanLine, ShoppingCart, Check, X, Package, Printer, Lock, Mic, MicOff, Calendar, Gift, Ticket, Layers, UserPlus, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { ViewToggle } from '../components/ViewToggle';
import { ViewMode, loadViewMode, saveViewMode, PAGE_IDS, DEFAULT_VIEW_MODE } from '../utils/viewMode';
import { generateUUID } from '../services/supabase/client';
import html2canvas from 'html2canvas';

export const POS: React.FC = () => {
  const { products, customers, categories, t, recordSale, currentUser, updateCustomerDebt, users, language, settings, getGiftCard, addCustomer } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mode, setMode] = useState<'scan' | 'list'>('list');
  const [scanning, setScanning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // View Mode State
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  
  // Load view mode from Supabase on mount
  useEffect(() => {
    const loadMode = async () => {
      if (settings?.shopId && currentUser?.id) {
        const mode = await loadViewMode(PAGE_IDS.POS, settings.shopId, currentUser.id);
        setViewMode(mode);
      } else {
        // Fallback to localStorage
        const mode = await loadViewMode(PAGE_IDS.POS);
        setViewMode(mode);
      }
    };
    loadMode();
  }, [settings?.shopId, currentUser?.id]);
  
  // Save view mode to Supabase
  useEffect(() => {
    if (settings?.shopId && currentUser?.id && viewMode !== DEFAULT_VIEW_MODE) {
      saveViewMode(PAGE_IDS.POS, viewMode, settings.shopId, currentUser.id);
    }
  }, [viewMode, settings?.shopId, currentUser?.id]);
  
  // Checkout State
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash'|'transfer'|'pos'|'credit'>('cash');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(''); // For credit sales
  
  // Gift Card State
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardApplied, setGiftCardApplied] = useState<{code: string, amount: number} | null>(null);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addQty, setAddQty] = useState(1);
  const [addType, setAddType] = useState<'carton' | 'unit'>('unit');
  
  const [showManagerApproval, setShowManagerApproval] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [managerError, setManagerError] = useState('');

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!settings) return null;
  const currentShopId = settings.shopId;
  
  // CRITICAL: Filter by shopId first to ensure data isolation
  const shopProducts = products.filter(p => p.shopId === currentShopId);
  const shopCustomers = customers.filter(c => c.shopId === currentShopId);
  const shopCategories = categories.filter(c => c.shopId === currentShopId);
  
  // --- SMART SEARCH LOGIC ---
  const filteredProducts = shopProducts.filter(p => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || (
        p.name.toLowerCase().includes(term) || 
        p.barcode.includes(term) || 
        (p.translations && Object.values(p.translations).some((trans: any) => 
            trans?.name?.toLowerCase().includes(term) || 
            trans?.category?.toLowerCase().includes(term)
        ))
    );
    
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // --- VOICE SEARCH ---
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice search not supported in this browser");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = language === 'ar' ? 'ar-SA' : language === 'ha' ? 'ha-NG' : 'en-US'; // Basic mapping
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setSearchTerm(result);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // --- ADD TO CART LOGIC ---
  
  const openAddToCart = (product: Product) => {
    setSelectedProduct(product);
    setAddQty(1);
    setAddType('unit');
  };

  const confirmAddToCart = () => {
    if (!selectedProduct) return;
    
    // Check Stock
    const availableTotal = selectedProduct.totalUnits;
    const currentInCartTotal = cart
      .filter(i => i.id === selectedProduct.id)
      .reduce((acc, i) => acc + (i.quantityType === 'carton' ? i.quantity * i.unitsPerCarton : i.quantity), 0);
    
    const addingUnits = addType === 'carton' ? addQty * selectedProduct.unitsPerCarton : addQty;
    
    if (availableTotal - currentInCartTotal < addingUnits) {
      alert(t('lowStock'));
      return;
    }

    setCart(prev => {
      // Check if exact item exists (same id AND same type)
      const existing = prev.find(i => i.id === selectedProduct.id && i.quantityType === addType);
      
      if (existing) {
         return prev.map(i => i.cartId === existing.cartId 
           ? { 
               ...i, 
               quantity: i.quantity + addQty, 
               subtotal: (i.quantity + addQty) * (addType === 'carton' ? i.cartonPrice : i.unitPrice) 
             }
           : i
         );
      }
      
      return [...prev, {
        ...selectedProduct,
        cartId: Math.random().toString(36),
        quantityType: addType,
        quantity: addQty,
        subtotal: addQty * (addType === 'carton' ? selectedProduct.cartonPrice : selectedProduct.unitPrice)
      }];
    });
    
    setSelectedProduct(null);
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  };

  // --- SCANNER LOGIC ---
  const handleScan = (decodedText: string) => {
    // 1. Find product
    const product = shopProducts.find(p => p.barcode === decodedText);
    
    if (product) {
       // Play beep sound (optional)
       const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
       audio.play().catch(() => {}); // Ignore auto-play errors
       
       setMode('list'); // Close scanner
       openAddToCart(product);
    } else {
       alert(`Product not found for barcode: ${decodedText}`);
    }
  };

  // --- GIFT CARD LOGIC ---
  const applyGiftCard = () => {
      const card = getGiftCard(giftCardCode);
      if (!card) {
          alert("Invalid Gift Card Code");
          return;
      }
      
      // Strict Expiry Check
      if (card.expiresAt) {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Start of today
          
          const expiry = new Date(card.expiresAt);
          expiry.setHours(0, 0, 0, 0); // Start of expiry day

          // A card is valid THROUGH its expiry date.
          // So it is expired if today is strictly greater than expiry date.
          if (today > expiry) {
              alert("This Gift Card has expired.");
              return;
          }
      }

      if (card.balance <= 0) {
          alert("Gift Card is empty");
          return;
      }
      
      // Calculate how much to use
      const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
      const amountToUse = Math.min(card.balance, cartTotal);
      
      setGiftCardApplied({
          code: card.code,
          amount: amountToUse
      });
      setGiftCardCode('');
  };

  const removeGiftCard = () => {
      setGiftCardApplied(null);
  };

  // --- CHECKOUT LOGIC ---

  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const payableTotal = Math.max(0, subtotal - (giftCardApplied?.amount || 0));

  const initiateCheckout = () => {
    if (cart.length === 0) return;
    
    if (paymentMethod === 'credit' && currentUser?.role === 'cashier') {
      setShowManagerApproval(true);
      return;
    }
    
    completeSale();
  };

  const verifyManager = () => {
    const manager = users.find(u => ['manager', 'admin', 'superadmin'].includes(u.role) && u.password === managerPin);
    if (manager) {
       setShowManagerApproval(false);
       setManagerPin('');
       completeSale(manager.fullName);
    } else {
       setManagerError('Invalid Manager PIN');
    }
  };

  const completeSale = (approvedBy?: string) => {
    // Determine payment method logic
    let finalMethod: Sale['paymentMethod'] = paymentMethod;
    if (giftCardApplied && payableTotal === 0) {
        finalMethod = 'gift_card';
    } else if (giftCardApplied && payableTotal > 0) {
        // We track it as the selected method (cash/transfer) for the remaining balance, 
        // but the recordSale logic will deduct the GC amount separately.
        finalMethod = paymentMethod; 
    }

    const now = new Date().toISOString();
    const sale: Sale = {
      id: generateUUID(),
      shopId: settings?.shopId || '',
      date: now,
      createdAt: now,
      cashierId: currentUser?.id || '',
      cashierName: currentUser?.fullName || 'Unknown',
      items: cart,
      total: subtotal, // Store original total
      profit: 0, // Calculated in context
      paymentMethod: finalMethod,
      isCredit: paymentMethod === 'credit' && payableTotal > 0,
      customerId: (paymentMethod === 'credit' && payableTotal > 0) ? selectedCustomer : undefined,
      dueDate: (paymentMethod === 'credit' && payableTotal > 0) ? dueDate : undefined,
      giftCardCode: giftCardApplied?.code,
      giftCardAmount: giftCardApplied?.amount
    };

    recordSale(sale);
    
    setLastSale(sale);
    setCart([]);
    setShowCheckout(false);
    setPaymentMethod('cash');
    setSelectedCustomer('');
    setDueDate('');
    setGiftCardApplied(null);
  };

  const handleAddNewCustomer = () => {
      if (!newCustName || !newCustPhone) return;
      const newCustomer: Customer = {
          id: generateUUID(),
          shopId: settings?.shopId || '',
          name: newCustName,
          phone: newCustPhone,
          totalDebt: 0,
          lastPurchaseDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
      };
      addCustomer(newCustomer);
      setSelectedCustomer(newCustomer.id);
      setShowAddCustomer(false);
      setNewCustName('');
      setNewCustPhone('');
  };

  // --- PRINT LOGIC ---
  const handlePrint = () => {
    if (!lastSale) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert("Please allow popups to print receipt");
      return;
    }

    // Unique title for saving as PDF
    const receiptId = lastSale.id.slice(-6);
    const dateStr = new Date().toISOString().split('T')[0];
    const docTitle = `Receipt-${receiptId}-${dateStr}`;
    const currency = settings.currency || '₦';

    const itemsRows = lastSale.items.map(item => `
      <tr>
        <td class="qty">${item.quantity}</td>
        <td class="desc">
          <div class="name">${item.name}</div>
          <div class="meta">${t(item.quantityType)} @ ${currency}${(item.quantityType === 'carton' ? item.cartonPrice : item.unitPrice).toLocaleString()}</div>
        </td>
        <td class="price">${currency}${item.subtotal.toLocaleString()}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${docTitle}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @media print {
            @page { margin: 0; size: auto; }
            body { margin: 0.5cm; }
          }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            max-width: 300px;
            margin: 20px auto;
            background: #fff;
          }
          .header { text-align: center; margin-bottom: 10px; }
          .logo { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
          .address { font-size: 10px; margin-bottom: 2px; }
          .meta { font-size: 10px; }
          
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; font-size: 10px; border-bottom: 1px dashed #000; padding-bottom: 4px; }
          td { padding: 4px 0; vertical-align: top; }
          
          .qty { width: 10%; text-align: center; font-weight: bold; }
          .desc { width: 65%; padding-left: 5px; }
          .price { width: 25%; text-align: right; }
          
          .name { font-weight: bold; }
          .meta { font-size: 10px; color: #333; }
          
          .totals { margin-top: 5px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .total-row { font-weight: bold; font-size: 14px; margin-top: 5px; border-top: 1px dashed #000; padding-top: 5px; }
          
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${settings.businessName}</div>
          <div class="address">${settings.address}</div>
          <div class="meta">Tel: ${settings.phone}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="meta">
          <div>Date: ${new Date(lastSale.date).toLocaleString()}</div>
          <div>Receipt #: ${receiptId}</div>
          <div>Cashier: ${lastSale.cashierName}</div>
        </div>

        <div class="divider"></div>
        
        <table>
          <thead>
            <tr>
              <th class="qty">Qty</th>
              <th class="desc">Item</th>
              <th class="price">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="totals">
          <div class="row">
            <span>Subtotal</span>
            <span>${currency}${lastSale.total.toLocaleString()}</span>
          </div>
          ${lastSale.giftCardAmount ? `
             <div class="row">
                <span>Gift Card (${lastSale.giftCardCode})</span>
                <span>-${currency}${lastSale.giftCardAmount.toLocaleString()}</span>
             </div>
          ` : ''}
          <div class="row total-row">
            <span>Paid Total</span>
            <span>${currency}${(lastSale.total - (lastSale.giftCardAmount || 0)).toLocaleString()}</span>
          </div>
          <div class="row">
            <span>Method</span>
            <span style="text-transform: uppercase">${t(lastSale.paymentMethod)}</span>
          </div>
          ${lastSale.isCredit ? `
            <div class="row">
               <span>Customer</span>
               <span>${shopCustomers.find(c => c.id === lastSale.customerId)?.name || 'N/A'}</span>
            </div>
            ${lastSale.dueDate ? `
              <div class="row">
                <span>Due Date</span>
                <span>${lastSale.dueDate}</span>
              </div>
            ` : ''}
          ` : ''}
        </div>

        <div class="footer">
          <p>${settings.receiptFooter}</p>
          <p>Goods bought in good condition cannot be returned.</p>
          <p>Powered by ShopOS</p>
        </div>

        <script>
          window.onload = function() { 
            setTimeout(function() { 
              window.print(); 
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDownloadImage = async () => {
      if (!receiptRef.current || !lastSale) return;
      
      try {
          const canvas = await html2canvas(receiptRef.current, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff'
          });
          
          const link = document.createElement('a');
          link.download = `Receipt-${lastSale.id.slice(-6)}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
      } catch (err) {
          console.error("Download failed", err);
          alert("Failed to download receipt image");
      }
  };

  // --- RECEIPT MODAL ---
  if (lastSale) {
    return (
      <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
         <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
               <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                 <Check className="w-5 h-5 text-green-500" />
                 {t('success')}
               </h3>
               <button onClick={() => setLastSale(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                 <X className="w-5 h-5 text-gray-500" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-white font-mono text-sm" ref={receiptRef}>
               <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest border-2 border-gray-900 inline-block px-3 py-1 mb-2">{settings.businessName}</h2>
                  <p className="text-[10px] text-gray-500 uppercase">Official Receipt</p>
                  <p className="text-xs text-gray-500 mt-2">{new Date(lastSale.date).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">#{lastSale.id.slice(-6)}</p>
               </div>
               
               <div className="border-t-2 border-b-2 border-dashed border-gray-200 py-4 space-y-4">
                  {lastSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                       <div className="flex gap-2">
                          <span className="font-bold w-6 text-center">{item.quantity}</span>
                          <div>
                             <p className="font-bold text-gray-800 uppercase">{item.name}</p>
                             <p className="text-[10px] text-gray-500">{t(item.quantityType)} @ {settings.currency}{(item.quantityType === 'carton' ? item.cartonPrice : item.unitPrice).toLocaleString()}</p>
                          </div>
                       </div>
                       <p className="font-bold">{settings.currency}{item.subtotal.toLocaleString()}</p>
                    </div>
                  ))}
               </div>
               
               <div className="pt-6 space-y-2">
                  <div className="flex justify-between text-gray-500">
                     <span>{t('subtotal')}</span>
                     <span>{settings.currency}{lastSale.total.toLocaleString()}</span>
                  </div>
                  {lastSale.giftCardAmount && (
                    <div className="flex justify-between text-purple-600 font-bold">
                        <span>Gift Card</span>
                        <span>-{settings.currency}{lastSale.giftCardAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-dashed border-gray-200">
                     <span>{t('total')}</span>
                     <span>{settings.currency}{(lastSale.total - (lastSale.giftCardAmount || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 pt-2 uppercase font-medium">
                     <span>{t('paymentMethod')}</span>
                     <span>{t(lastSale.paymentMethod)}</span>
                  </div>
                  {lastSale.isCredit && (
                    <div className="flex justify-between text-xs text-red-500 pt-1 font-bold">
                       <span>Due Date</span>
                       <span>{lastSale.dueDate || 'N/A'}</span>
                    </div>
                  )}
               </div>

               <div className="mt-8 text-center border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400">Served by: {lastSale.cashierName}</p>
                  <p className="text-xs text-gray-300 mt-2">{settings.receiptFooter}</p>
               </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-2 bg-gray-50">
               <Button variant="outline" className="flex-1 bg-white shadow-sm border-gray-200 hover:bg-gray-50 text-xs px-2" onClick={handlePrint}>
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  {t('print')}
               </Button>
               <Button variant="outline" className="flex-1 bg-white shadow-sm border-gray-200 hover:bg-gray-50 text-xs px-2" onClick={handleDownloadImage}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Img
               </Button>
               <Button className="flex-1 shadow-lg shadow-green-200 text-xs px-2" onClick={() => setLastSale(null)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t('newSale')}
               </Button>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 relative">
      {/* Product List */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
        {/* Search Bar & Filters */}
        <div className="bg-white p-3 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200 shrink-0 sticky top-0 z-10 space-y-3">
            <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-800 placeholder-gray-400 shadow-sm"
                    placeholder={t('searchProduct')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button 
                    onClick={handleVoiceSearch}
                    className={`absolute right-2 top-1.5 p-1.5 rounded-lg transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-gray-100 text-gray-400'}`}
                    >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                </div>
                <ViewToggle viewMode={viewMode} onViewChange={setViewMode} className="hidden sm:flex" />
                <Button variant="secondary" className="rounded-xl px-4 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-100" onClick={() => setMode('scan')}>
                    <ScanLine className="w-5 h-5" />
                </Button>
            </div>
            
            {/* Horizontal Category Scroll (Hidden on Mobile) */}
            <div className="hidden sm:flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${activeCategory === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                >
                    All
                </button>
                {shopCategories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${activeCategory === cat.name ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>

        {/* Real Scanner Mode */}
        {mode === 'scan' && (
           <BarcodeScanner 
              onScan={handleScan} 
              onClose={() => setMode('list')} 
           />
        )}

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1 pb-40 transition-all duration-300">
            {filteredProducts.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Package className="w-16 h-16 mb-4 opacity-20" />
                  <p>No products found</p>
               </div>
            ) : (
              <>
                {/* Small Icons View */}
                {viewMode === 'small' && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {filteredProducts.map(product => {
                      const stockCtn = Math.floor(product.totalUnits / product.unitsPerCarton);
                      const stockUnit = product.totalUnits % product.unitsPerCarton;
                      const isLow = product.totalUnits < product.minStockLevel;
                      return (
                        <button
                          key={product.id}
                          onClick={() => openAddToCart(product)}
                          className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center gap-1.5 transition-all hover:scale-105 hover:shadow-md hover:border-green-100 group"
                          title={product.name}
                        >
                          <div className="w-full aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden relative border border-gray-100">
                            {product.image ? (
                              <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                            ) : (
                              <Package className="w-4 h-4 text-gray-300" />
                            )}
                            {isLow && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                          </div>
                          <p className="text-[10px] font-semibold text-gray-800 line-clamp-2 text-center leading-tight">{product.name}</p>
                          <span className="text-[9px] font-bold text-gray-700">{settings.currency}{product.unitPrice.toLocaleString()}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Large Icons View (Current) */}
                {viewMode === 'large' && (
                  <div className="grid grid-cols-1 min-[340px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredProducts.map(product => {
                      const stockCtn = Math.floor(product.totalUnits / product.unitsPerCarton);
                      const stockUnit = product.totalUnits % product.unitsPerCarton;
                      const isLow = product.totalUnits < product.minStockLevel;
                      return (
                        <button 
                          key={product.id} 
                          onClick={() => openAddToCart(product)}
                          className="bg-white p-3 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200 flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-md hover:border-green-100 group text-left h-full"
                        >
                          <div className="mb-2 w-full">
                            <div className="w-full h-20 bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-gray-300 border border-gray-100 overflow-hidden relative">
                               {product.image ? (
                                 <img src={product.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={product.name} />
                               ) : (
                                 <Package className="w-8 h-8 opacity-20" />
                               )}
                               {isLow && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                            </div>
                            <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight h-9">{product.name}</h3>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-[10px] uppercase tracking-wider text-gray-400 truncate pr-2 max-w-[50%]">{product.category}</p>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isLow ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                 {stockCtn}c {stockUnit}u
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-auto w-full pt-2 border-t border-dashed border-gray-100">
                              <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-400 font-medium">Unit</span>
                                  <span className="font-bold text-gray-800">{settings.currency}{product.unitPrice.toLocaleString()}</span>
                              </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="space-y-2">
                    {filteredProducts.map(product => {
                      const stockCtn = Math.floor(product.totalUnits / product.unitsPerCarton);
                      const stockUnit = product.totalUnits % product.unitsPerCarton;
                      const isLow = product.totalUnits < product.minStockLevel;
                      return (
                        <button
                          key={product.id}
                          onClick={() => openAddToCart(product)}
                          className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 w-full transition-all hover:shadow-md hover:border-green-100 group text-left"
                        >
                          <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 relative">
                            {product.image ? (
                              <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                            ) : (
                              <Package className="w-6 h-6 text-gray-300" />
                            )}
                            {isLow && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1">{product.name}</h3>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{product.category}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>Stock: {stockCtn}c {stockUnit}u</span>
                              <span className={isLow ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                                {isLow ? 'Low Stock' : 'In Stock'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-gray-800 text-sm">{settings.currency}{product.unitPrice.toLocaleString()}</div>
                            <div className="text-xs text-gray-400">Unit</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Details View */}
                {viewMode === 'details' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProducts.map(product => {
                      const stockCtn = Math.floor(product.totalUnits / product.unitsPerCarton);
                      const stockUnit = product.totalUnits % product.unitsPerCarton;
                      const isLow = product.totalUnits < product.minStockLevel;
                      return (
                        <button
                          key={product.id}
                          onClick={() => openAddToCart(product)}
                          className="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200 flex flex-col gap-4 transition-all hover:scale-[1.01] hover:shadow-lg hover:border-green-100 group text-left"
                        >
                          <div className="flex gap-4">
                            <div className="w-32 h-32 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 relative">
                              {product.image ? (
                                <img src={product.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={product.name} />
                              ) : (
                                <Package className="w-10 h-10 text-gray-300" />
                              )}
                              {isLow && <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
                              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">{product.category}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                <span>Barcode: {product.barcode || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <span className="block text-xs text-gray-400 uppercase font-semibold mb-1">Unit Price</span>
                              <span className="font-bold text-gray-800">{settings.currency}{product.unitPrice.toLocaleString()}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <span className="block text-xs text-gray-400 uppercase font-semibold mb-1">Carton Price</span>
                              <span className="font-bold text-gray-800">{settings.currency}{product.cartonPrice.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-100">
                            <div>
                              <span className="block text-xs text-gray-400 uppercase font-semibold mb-1">Stock Level</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isLow ? 'text-red-600' : 'text-green-600'}`}>
                                  {stockCtn} Cartons, {stockUnit} Units
                                </span>
                                {isLow && <span className="text-xs text-red-600 font-bold">(Low Stock)</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block text-xs text-gray-400 uppercase font-semibold mb-1">Total Units</span>
                              <span className="text-sm font-bold text-gray-800">{product.totalUnits}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
      </div>

      {/* Cart Drawer/Modal */}
      <div className={`
        fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300
        md:static md:bg-transparent md:backdrop-blur-none md:w-96 md:block md:z-auto
        ${showCheckout ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'}
      `}>
        <div className={`
           absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl flex flex-col
           transform transition-transform duration-300 md:translate-x-0 md:relative md:h-full md:shadow-[0_4px_20px_rgba(0,0,0,0.05)] md:rounded-3xl md:border md:border-gray-200
           ${showCheckout ? 'translate-x-0' : 'translate-x-full'}
        `}>
          {/* Cart Header */}
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white md:rounded-t-3xl shrink-0">
            <div>
              <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                {t('cart')}
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{cart.length}</span>
              </h2>
            </div>
            <button onClick={() => setShowCheckout(false)} className="md:hidden p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items - Flexible height */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 pb-24">
             {cart.map(item => (
               <div key={item.cartId} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                 <div className="flex-1">
                   <h4 className="font-semibold text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                   <div className="flex items-center gap-2 mt-1">
                     <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${item.quantityType === 'carton' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                       {t(item.quantityType)}
                     </span>
                     <span className="text-xs text-gray-500">x{item.quantity}</span>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <span className="font-bold text-gray-800 text-sm">{settings.currency}{item.subtotal.toLocaleString()}</span>
                   <button onClick={() => removeFromCart(item.cartId)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               </div>
             ))}
             {cart.length === 0 && (
               <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                 <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                 <p className="text-sm">Your cart is empty</p>
               </div>
             )}
          </div>

          {/* Cart Footer - Pinned to bottom of drawer logic */}
          <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10 md:rounded-b-3xl shrink-0 absolute bottom-0 w-full md:relative">
            <div className="space-y-3 mb-4">
               {/* Gift Card Input */}
               {!giftCardApplied ? (
                   <div className="flex gap-2">
                       <div className="relative flex-1">
                           <Gift className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                           <input 
                              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-gray-900"
                              placeholder="Gift card code..."
                              value={giftCardCode}
                              onChange={e => setGiftCardCode(e.target.value)}
                           />
                       </div>
                       <Button size="sm" onClick={applyGiftCard} disabled={!giftCardCode} className="bg-purple-600 hover:bg-purple-700 shadow-purple-200">
                           {t('apply')}
                       </Button>
                   </div>
               ) : (
                   <div className="flex justify-between items-center bg-purple-50 p-2 rounded-lg border border-purple-100 text-sm">
                       <div className="flex items-center gap-2 text-purple-700">
                           <Ticket className="w-4 h-4" />
                           <span className="font-bold">{giftCardApplied.code}</span>
                       </div>
                       <div className="flex items-center gap-2">
                           <span className="font-bold text-purple-700">-{settings.currency}{giftCardApplied.amount.toLocaleString()}</span>
                           <button onClick={removeGiftCard} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                       </div>
                   </div>
               )}

               {/* Payment Method Selector */}
               <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(method => (
                     <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border transition-all ${
                           paymentMethod === method.id 
                           ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' 
                           : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                     >
                        <method.icon className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase truncate w-full text-center">{t(method.labelKey)}</span>
                     </button>
                  ))}
               </div>

               {/* Credit Customer Selector with Add Button */}
               {paymentMethod === 'credit' && (
                 <div className="space-y-2 animate-in slide-in-from-top-2">
                   <div className="flex gap-2">
                       <select 
                         className="flex-1 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 outline-none focus:ring-2 focus:ring-red-500"
                         value={selectedCustomer}
                         onChange={(e) => setSelectedCustomer(e.target.value)}
                       >
                         <option value="">Select Customer</option>
                         {shopCustomers.map(c => (
                           <option key={c.id} value={c.id}>{c.name}</option>
                         ))}
                       </select>
                       <button 
                         onClick={() => setShowAddCustomer(true)}
                         className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg border border-red-200 transition-colors"
                         title="Add New Customer"
                       >
                         <UserPlus className="w-5 h-5" />
                       </button>
                   </div>
                   
                   <div className="relative">
                      <input 
                        type="date"
                        className="w-full p-2 pl-9 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        placeholder="Due Date"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                   </div>
                 </div>
               )}
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 text-sm font-medium">{t('total')}</span>
              <span className="text-2xl font-bold text-gray-900">{settings.currency}{payableTotal.toLocaleString()}</span>
            </div>
            
            <Button 
              className="w-full py-3.5 text-lg font-bold shadow-xl shadow-green-200 hover:shadow-green-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={initiateCheckout}
              disabled={cart.length === 0 || (paymentMethod === 'credit' && (!selectedCustomer || !dueDate))}
            >
              {t('checkout')}
            </Button>
          </div>
        </div>
      </div>
      
      {/* View Cart Button (Mobile Only) */}
      {!showCheckout && cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-20 md:hidden z-[50]">
          <Button 
            onClick={() => setShowCheckout(true)}
            className="w-full py-4 shadow-2xl shadow-green-900/20 flex justify-between items-center bg-gray-900 text-white rounded-2xl border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">
                 {cart.length}
              </div>
              <span className="font-medium">View Cart</span>
            </div>
            <span className="font-bold text-lg">{settings.currency}{subtotal.toLocaleString()}</span>
          </Button>
        </div>
      )}

      {/* Add To Cart Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="font-bold text-xl text-gray-800 mb-1">{selectedProduct.name}</h3>
              <p className="text-gray-500 text-sm mb-6 uppercase tracking-wider">{selectedProduct.category}</p>
              
              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                 <button 
                   onClick={() => setAddType('unit')}
                   className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${addType === 'unit' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   Unit ({settings.currency}{selectedProduct.unitPrice})
                 </button>
                 <button 
                   onClick={() => setAddType('carton')}
                   className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${addType === 'carton' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   Carton ({settings.currency}{selectedProduct.cartonPrice})
                 </button>
              </div>

              <div className="flex items-center justify-center gap-6 mb-8">
                 <button onClick={() => setAddQty(Math.max(1, addQty - 1))} className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-green-500 hover:text-green-500 transition-colors">
                    <Minus className="w-6 h-6" />
                 </button>
                 <span className="text-4xl font-bold text-gray-800 w-16 text-center">{addQty}</span>
                 <button onClick={() => setAddQty(addQty + 1)} className="w-12 h-12 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors shadow-lg shadow-green-100">
                    <Plus className="w-6 h-6" />
                 </button>
              </div>

              <div className="flex gap-3">
                 <Button className="flex-1 py-3 text-lg" onClick={confirmAddToCart}>
                    Add {settings.currency}{(addQty * (addType === 'carton' ? selectedProduct.cartonPrice : selectedProduct.unitPrice)).toLocaleString()}
                 </Button>
                 <Button variant="outline" className="py-3 px-4" onClick={() => setSelectedProduct(null)}>
                    <X className="w-6 h-6" />
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95">
               <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Customer</h3>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                     <input 
                       className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                       value={newCustName}
                       onChange={e => setNewCustName(e.target.value)}
                       placeholder="Customer Name"
                       autoFocus
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                     <input 
                       className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                       value={newCustPhone}
                       onChange={e => setNewCustPhone(e.target.value)}
                       placeholder="Phone Number"
                     />
                  </div>
               </div>
               <div className="flex gap-3 mt-6">
                  <Button className="flex-1" onClick={handleAddNewCustomer}>Save</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddCustomer(false)}>Cancel</Button>
               </div>
            </div>
         </div>
      )}

      {/* Manager Approval Modal */}
      {showManagerApproval && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95">
               <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6" />
               </div>
               <h3 className="text-lg font-bold text-center text-gray-800 mb-2">{t('managerApproval')}</h3>
               <p className="text-xs text-center text-gray-500 mb-6">Cashier limit exceeded. Enter Manager PIN.</p>
               
               <input 
                 type="password" 
                 className="w-full text-center text-2xl tracking-[1em] font-bold border border-gray-200 rounded-xl py-3 mb-2 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none text-gray-900"
                 autoFocus
                 maxLength={6}
                 value={managerPin}
                 onChange={(e) => setManagerPin(e.target.value)}
               />
               {managerError && <p className="text-xs text-red-500 text-center mb-4 font-bold">{managerError}</p>}
               
               <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button onClick={verifyManager} className="bg-red-600 hover:bg-red-700">{t('confirm')}</Button>
                  <Button variant="outline" onClick={() => setShowManagerApproval(false)}>{t('cancel')}</Button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
