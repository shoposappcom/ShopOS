
import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/Button';
import { Phone, Calendar, Clock, ArrowRight, Search, CheckCircle, MessageSquare, History, Upload, Plus, UserPlus, Printer, X } from 'lucide-react';
import { Customer, DebtTransaction } from '../types';

export const Debtors: React.FC = () => {
  const { customers, t, recordDebtPayment, addCustomer, getDebtHistory, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payment Modal
  const [selectedDebtor, setSelectedDebtor] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [viewingHistory, setViewingHistory] = useState<Customer | null>(null);
  
  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustDebt, setNewCustDebt] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter out archived customers
  const filteredDebtors = customers.filter(c => 
    !c.isArchived &&
    (c.totalDebt > 0 || searchTerm) && 
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm))
  );

  const handleOpenPayment = (customer: Customer) => {
    setSelectedDebtor(customer);
    setPaymentAmount('');
  };

  const handleProcessPayment = () => {
    if (!selectedDebtor || !paymentAmount) return;
    const amount = Number(paymentAmount);
    if (amount <= 0) return;
    if (amount > selectedDebtor.totalDebt) {
        alert("Amount exceeds total debt");
        return;
    }

    recordDebtPayment(selectedDebtor.id, amount);
    alert(t('paymentSuccess'));
    setSelectedDebtor(null);
  };

  const handleSendReminder = (customer: Customer) => {
    const message = `Hello ${customer.name}, this is a reminder from ShopOS regarding your outstanding balance of ₦${customer.totalDebt.toLocaleString()}. Please make a payment soon. Thank you.`;
    const url = `https://wa.me/${customer.phone.replace(/^0/, '234')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleViewHistory = (customer: Customer) => {
     setViewingHistory(customer);
     setShowHistoryModal(true);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          const lines = text.split('\n');
          let count = 0;
          
          lines.forEach(line => {
              const [name, phone, debtStr] = line.split(',').map(s => s.trim());
              if (name && phone) {
                  const debt = Number(debtStr) || 0;
                  // Basic check to avoid duplicates by phone
                  if (!customers.find(c => c.phone === phone)) {
                      addCustomer({
                          id: Date.now().toString() + Math.random(),
                          name,
                          phone,
                          totalDebt: debt,
                          lastPurchaseDate: new Date().toISOString()
                      });
                      count++;
                  }
              }
          });
          alert(`Successfully imported ${count} customers.`);
      };
      reader.readAsText(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddSingleCustomer = () => {
      if (!newCustName || !newCustPhone) return;
      
      addCustomer({
          id: Date.now().toString(),
          name: newCustName,
          phone: newCustPhone,
          totalDebt: Number(newCustDebt) || 0,
          lastPurchaseDate: new Date().toISOString()
      });
      
      setShowAddModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustDebt('');
  };

  // Fetch transactions for the viewing customer
  const transactions = viewingHistory ? getDebtHistory(viewingHistory.id) : [];

  const handlePrintStatement = () => {
      if (!viewingHistory) return;
      const sortedTransactions = [...transactions].reverse();
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) return;

      const rows = sortedTransactions.map(tx => `
        <tr>
            <td>${new Date(tx.date).toLocaleDateString()}</td>
            <td>${tx.note || (tx.type === 'credit' ? 'Credit Sale' : 'Payment')}</td>
            <td style="text-align: right; color: ${tx.type === 'credit' ? 'red' : 'green'}">
               ${tx.type === 'credit' ? '+' : '-'}₦${tx.amount.toLocaleString()}
            </td>
        </tr>
      `).join('');

      const html = `
        <html>
        <head>
            <title>Statement - ${viewingHistory.name}</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; max-width: 400px; margin: 0 auto; }
                h2 { text-align: center; margin-bottom: 2px; text-transform: uppercase; }
                .sub-header { text-align: center; font-size: 10px; margin-bottom: 20px; color: #555; }
                
                .customer-info { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                
                table { width: 100%; border-collapse: collapse; }
                th { border-bottom: 1px dashed #000; text-align: left; padding: 5px; }
                td { padding: 5px; border-bottom: 1px solid #eee; }
                
                .balance-section { margin-top: 20px; text-align: right; font-size: 14px; font-weight: bold; border-top: 1px dashed #000; padding-top: 10px; }
                .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #888; }
            </style>
        </head>
        <body>
            <h2>${settings.businessName}</h2>
            <div class="sub-header">Statement of Account</div>
            
            <div class="customer-info">
                <strong>Customer:</strong> ${viewingHistory.name}<br/>
                <strong>Phone:</strong> ${viewingHistory.phone}<br/>
                <strong>Date:</strong> ${new Date().toLocaleDateString()}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th style="text-align: right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
            
            <div class="balance-section">
                Current Balance: ₦${viewingHistory.totalDebt.toLocaleString()}
            </div>

            <div class="footer">
                Thank you for your business.
            </div>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">{t('debtors')}</h2>
           <p className="text-gray-500 text-sm">Manage credit customers and payments</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                    className="w-full bg-white border border-gray-200 rounded-xl pl-9 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    placeholder="Search name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv"
                    onChange={handleImportCSV}
                />
                <Button onClick={() => fileInputRef.current?.click()} className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
                    <Upload className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Import CSV</span>
                </Button>
                <Button onClick={() => setShowAddModal(true)} className="whitespace-nowrap bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100">
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
        </div>
      </div>
      
      {filteredDebtors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
           <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8" />
           </div>
           <h3 className="text-lg font-bold text-gray-800">{t('noDebtors')}</h3>
           <p className="text-gray-400 text-sm">All clear! No pending debts found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDebtors.map(c => {
             const daysSincePurchase = c.lastPurchaseDate 
                ? Math.floor((Date.now() - new Date(c.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24))
                : 0;
             const isOverdue = daysSincePurchase > 30; // Simple logic: overdue if > 30 days

             return (
               <div key={c.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                 {isOverdue && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">{t('overdue')}</div>}
                 
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <h3 className="font-bold text-lg text-gray-800">{c.name}</h3>
                     <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                        <Phone className="w-3.5 h-3.5" />
                        {c.phone}
                     </div>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                       <span className="text-xs text-red-400 uppercase font-bold tracking-wide">{t('totalDebt')}</span>
                       <p className="text-xl font-bold text-red-600">₦{c.totalDebt.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                       <span className="text-xs text-gray-400 uppercase font-bold tracking-wide">Last Active</span>
                       <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-700">{daysSincePurchase}d ago</span>
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-2">
                    <Button onClick={() => handleOpenPayment(c)} className="flex-1 bg-green-600 hover:bg-green-700 shadow-green-100 text-sm">
                       {t('recordPayment')}
                    </Button>
                    <button onClick={() => handleSendReminder(c)} className="p-2.5 bg-gray-100 hover:bg-green-50 text-gray-600 hover:text-green-600 rounded-xl transition-colors">
                       <MessageSquare className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleViewHistory(c)} className="p-2.5 bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl transition-colors">
                       <History className="w-5 h-5" />
                    </button>
                 </div>
               </div>
             );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {selectedDebtor && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
               <h3 className="text-xl font-bold text-gray-800 mb-1">{t('recordPayment')}</h3>
               <p className="text-sm text-gray-500 mb-6">For {selectedDebtor.name}</p>

               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 text-center">
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-wide">{t('totalDebt')}</span>
                  <p className="text-3xl font-bold text-red-600">₦{selectedDebtor.totalDebt.toLocaleString()}</p>
               </div>

               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('amount')}</label>
                     <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-400 font-bold">₦</span>
                        <input 
                           type="number" 
                           className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-bold text-gray-800"
                           placeholder="0.00"
                           value={paymentAmount}
                           onChange={(e) => setPaymentAmount(e.target.value)}
                           autoFocus
                        />
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => setPaymentAmount(selectedDebtor.totalDebt.toString())} className="py-2 px-3 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors">
                        {t('fullPayment')}
                     </button>
                     <button onClick={() => setPaymentAmount((selectedDebtor.totalDebt / 2).toString())} className="py-2 px-3 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors">
                        50%
                     </button>
                  </div>

                  {paymentAmount && Number(paymentAmount) > 0 && (
                     <div className="p-3 bg-green-50 rounded-xl border border-green-100 flex justify-between items-center text-sm">
                        <span className="text-green-800 font-medium">{t('remainingDebt')}:</span>
                        <span className="font-bold text-green-700">₦{Math.max(0, selectedDebtor.totalDebt - Number(paymentAmount)).toLocaleString()}</span>
                     </div>
                  )}

                  <div className="flex gap-3 mt-4">
                     <Button className="flex-1 py-3 text-lg" onClick={handleProcessPayment} disabled={!paymentAmount || Number(paymentAmount) <= 0}>
                        {t('confirm')}
                     </Button>
                     <Button variant="outline" className="flex-1 py-3" onClick={() => setSelectedDebtor(null)}>
                        {t('cancel')}</Button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
               <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Customer</h3>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Name</label>
                     <input 
                       className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                       value={newCustName}
                       onChange={e => setNewCustName(e.target.value)}
                       placeholder="Customer Name"
                       autoFocus
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone</label>
                     <input 
                       className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                       value={newCustPhone}
                       onChange={e => setNewCustPhone(e.target.value)}
                       placeholder="Phone Number"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Initial Debt (Optional)</label>
                     <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-400 font-bold">₦</span>
                        <input 
                           type="number"
                           className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                           value={newCustDebt}
                           onChange={e => setNewCustDebt(e.target.value)}
                           placeholder="0.00"
                        />
                     </div>
                  </div>
               </div>
               <div className="flex gap-3 mt-6">
                  <Button className="flex-1" onClick={handleAddSingleCustomer}>Save Customer</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
               </div>
            </div>
         </div>
      )}

      {/* History Modal */}
      {showHistoryModal && viewingHistory && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden max-h-[80vh] flex flex-col">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                  <div>
                     <h3 className="text-xl font-bold text-gray-800">{viewingHistory.name}</h3>
                     <p className="text-sm text-gray-500">{t('paymentHistory')}</p>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={handlePrintStatement} className="p-2 hover:bg-gray-100 rounded-full" title="Print Statement">
                         <Printer className="w-5 h-5 text-gray-600" />
                      </button>
                      <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                         <X className="w-5 h-5 text-gray-400" />
                      </button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-0">
                  {transactions.length > 0 ? (
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                           <tr>
                              <th className="p-4 font-semibold text-gray-600">Date</th>
                              <th className="p-4 font-semibold text-gray-600">Type</th>
                              <th className="p-4 font-semibold text-gray-600 text-right">Amount</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {[...transactions].reverse().map(tx => (
                              <tr key={tx.id}>
                                 <td className="p-4 text-gray-600">
                                    {new Date(tx.date).toLocaleDateString()}
                                    <div className="text-[10px] text-gray-400">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                 </td>
                                 <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${tx.type === 'credit' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                       {tx.type === 'credit' ? 'Debt' : 'Paid'}
                                    </span>
                                 </td>
                                 <td className={`p-4 text-right font-bold ${tx.type === 'credit' ? 'text-red-600' : 'text-green-600'}`}>
                                    {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  ) : (
                     <div className="p-10 text-center text-gray-400">
                        No transaction history available.
                     </div>
                  )}
               </div>
               
               <div className="p-4 bg-gray-50 border-t border-gray-100 text-center sticky bottom-0">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Current Balance</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">₦{viewingHistory.totalDebt.toLocaleString()}</p>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
