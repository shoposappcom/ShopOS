
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Sale } from '../types';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Check, X, Printer, Download, Banknote, TrendingUp, Receipt } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PAYMENT_METHODS } from '../constants';
import html2canvas from 'html2canvas';

export const Transactions: React.FC = () => {
  const { sales, t, currentUser, settings, customers } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  if (!currentUser || !settings) return null;

  const currentShopId = settings.shopId;
  
  // CRITICAL: Filter by shopId first to ensure data isolation
  const shopSales = sales.filter(s => s.shopId === currentShopId);
  const shopCustomers = customers.filter(c => c.shopId === currentShopId);

  // Filter Sales Logic
  const filteredSales = shopSales.filter(s => {
      // 1. Role Check: Cashier sees own, Admin sees all
      if (currentUser.role === 'cashier' && s.cashierId !== currentUser.id) return false;

      // 2. Search (Receipt ID or Customer Name if credit)
      const matchesSearch = s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (s.customerId && shopCustomers.find(c => c.id === s.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // 3. Method Filter
      const matchesMethod = methodFilter === 'all' || s.paymentMethod === methodFilter;

      return matchesSearch && matchesMethod;
  }).reverse(); // Newest first

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const displayedSales = filteredSales.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const revenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const profit = filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0);
    const count = filteredSales.length;
    return { revenue, profit, count };
  }, [filteredSales]);

  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, methodFilter]);

  // --- PRINT LOGIC (Reused) ---
  const handlePrint = () => {
    if (!viewingSale) return;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const receiptId = viewingSale.id.slice(-6);
    const dateStr = new Date().toISOString().split('T')[0];
    const currency = settings.currency || '₦';

    const itemsRows = viewingSale.items.map(item => `
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
        <title>Receipt-${receiptId}</title>
        <style>
          @media print { @page { margin: 0; size: auto; } body { margin: 0.5cm; } }
          body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; max-width: 300px; margin: 20px auto; }
          .header { text-align: center; margin-bottom: 10px; }
          .logo { font-size: 18px; font-weight: bold; text-transform: uppercase; }
          .address { font-size: 10px; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; font-size: 10px; border-bottom: 1px dashed #000; }
          td { padding: 4px 0; vertical-align: top; }
          .qty { width: 10%; text-align: center; font-weight: bold; }
          .desc { width: 65%; padding-left: 5px; }
          .price { width: 25%; text-align: right; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .total-row { font-weight: bold; font-size: 14px; margin-top: 5px; border-top: 1px dashed #000; padding-top: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${settings.businessName}</div>
          <div class="address">${settings.address}</div>
          <div>Tel: ${settings.phone}</div>
        </div>
        <div class="divider"></div>
        <div>Date: ${new Date(viewingSale.date).toLocaleString()}</div>
        <div>Receipt #: ${receiptId}</div>
        <div>Cashier: ${viewingSale.cashierName}</div>
        <div class="divider"></div>
        <table>
          <thead><tr><th class="qty">Qty</th><th class="desc">Item</th><th class="price">Total</th></tr></thead>
          <tbody>${itemsRows}</tbody>
        </table>
        <div class="divider"></div>
        <div class="totals">
          <div class="row"><span>Subtotal</span><span>${currency}${viewingSale.total.toLocaleString()}</span></div>
          <div class="row total-row"><span>Total</span><span>${currency}${viewingSale.total.toLocaleString()}</span></div>
          <div class="row"><span>Method</span><span style="text-transform:uppercase">${t(viewingSale.paymentMethod)}</span></div>
        </div>
        <div class="footer"><p>${settings.receiptFooter}</p></div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDownloadImage = async () => {
      if (!receiptRef.current || !viewingSale) return;
      try {
          const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
          const link = document.createElement('a');
          link.download = `Receipt-${viewingSale.id.slice(-6)}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
      } catch (err) { alert("Download failed"); }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Eye className="w-5 h-5" /></div>
             {t('transactions')}
           </h2>
           <p className="text-gray-500 text-sm">Review past sales and print receipts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder={t('searchTransactions')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="relative min-w-[200px]">
              <select 
                  className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
              >
                  <option value="all">{t('allMethods')}</option>
                  {PAYMENT_METHODS.map(m => (
                      <option key={m.id} value={m.id}>{t(m.labelKey)}</option>
                  ))}
              </select>
              <Filter className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-50 text-green-600 shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1 truncate" title={stats.revenue.toString()}>
              {settings.currency}{stats.revenue.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Net Profit</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1 truncate" title={stats.profit.toString()}>
              {settings.currency}{stats.profit.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Transactions</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1 truncate" title={stats.count.toString()}>
              {stats.count}
            </h3>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                      <tr>
                          <th className="p-4">{t('receiptId')}</th>
                          <th className="p-4">Date</th>
                          <th className="p-4 text-center">{t('items')}</th>
                          <th className="p-4">{t('total')}</th>
                          <th className="p-4">{t('paymentMethod')}</th>
                          {currentUser.role !== 'cashier' && <th className="p-4">{t('soldBy')}</th>}
                          <th className="p-4 text-right">{t('actions')}</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {displayedSales.length === 0 ? (
                          <tr><td colSpan={7} className="p-8 text-center text-gray-400">{t('noTransactions')}</td></tr>
                      ) : (
                          displayedSales.map(sale => (
                              <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="p-4 font-mono text-gray-600">#{sale.id.slice(-6)}</td>
                                  <td className="p-4 text-gray-600">
                                      <div>{new Date(sale.date).toLocaleDateString()}</div>
                                      <div className="text-xs text-gray-400">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                  </td>
                                  <td className="p-4 text-center">
                                      {sale.isDebtPayment || (sale.items.length === 0 && sale.customerId) ? (
                                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">Debt Payment</span>
                                      ) : (
                                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs font-bold">{sale.items.length}</span>
                                      )}
                                  </td>
                                  <td className="p-4 font-bold text-gray-900">{settings.currency}{sale.total.toLocaleString()}</td>
                                  <td className="p-4">
                                      {sale.isDebtPayment || (sale.items.length === 0 && sale.customerId) ? (
                                          <div className="flex flex-col gap-1">
                                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                                  Debt Payment
                                              </span>
                                              <span className="text-[10px] text-gray-500 capitalize">
                                                  {t(sale.paymentMethod)}
                                              </span>
                                          </div>
                                      ) : (
                                          <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium">
                                              {t(sale.paymentMethod)}
                                          </span>
                                      )}
                                  </td>
                                  {currentUser.role !== 'cashier' && (
                                      <td className="p-4 text-gray-600 text-xs">{sale.cashierName}</td>
                                  )}
                                  <td className="p-4 text-right">
                                      <button 
                                          onClick={() => setViewingSale(sale)}
                                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                          title={t('viewDetails')}
                                      >
                                          <Eye className="w-4 h-4" />
                                      </button>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-4">
                  <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-100"
                  >
                      <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-gray-600">
                      Page {currentPage} of {totalPages}
                  </span>
                  <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-100"
                  >
                      <ChevronRight className="w-4 h-4" />
                  </button>
              </div>
          )}
      </div>

      {/* Receipt Modal */}
      {viewingSale && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                 <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                   {t('viewReceipt')}
                 </h3>
                 <button onClick={() => setViewingSale(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                   <X className="w-5 h-5 text-gray-500" />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-white font-mono text-sm" ref={receiptRef}>
                 <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest border-2 border-gray-900 inline-block px-3 py-1 mb-2">{settings.businessName}</h2>
                    <p className="text-[10px] text-gray-500 uppercase">Official Receipt</p>
                    <p className="text-xs text-gray-500 mt-2">{new Date(viewingSale.date).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">#{viewingSale.id.slice(-6)}</p>
                 </div>
                 
                 <div className="border-t-2 border-b-2 border-dashed border-gray-200 py-4 space-y-4">
                    {viewingSale.items.map((item, idx) => (
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
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-dashed border-gray-200">
                       <span>{t('total')}</span>
                       <span>{settings.currency}{viewingSale.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 pt-2 uppercase font-medium">
                       <span>{t('paymentMethod')}</span>
                       <span>{t(viewingSale.paymentMethod)}</span>
                    </div>
                 </div>

                 <div className="mt-8 text-center border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400">Served by: {viewingSale.cashierName}</p>
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
                    {t('downloadReceipt')}
                 </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
