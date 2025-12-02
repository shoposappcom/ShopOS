
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/Button';
import { User, UserRole, Language, ShopSettings, Category, Supplier, Expense } from '../types';
import { User as UserIcon, Shield, Power, Trash2, Edit, Plus, Users, Sparkles, FileText, Clock, Store, Layers, Truck, Receipt, Search, Filter, Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import { generateUUID } from '../services/supabase/client';
import { LanguageSelector } from '../components/LanguageSelector';

export const Settings: React.FC = () => {
  const { t, users, currentUser, language, setLanguage, addUser, updateUser, deleteUser, hasPermission, activityLogs, settings, updateSettings, categories, addCategory, editCategory, deleteCategory, suppliers, addSupplier, editSupplier, deleteSupplier, expenses, addExpense, deleteExpense } = useStore();
  const [activeTab, setActiveTab] = useState<'users' | 'profile' | 'logs' | 'business' | 'categories' | 'suppliers' | 'expenses'>('profile');
  
  // User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  // Category Management State
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Partial<Category> | null>(null);

  // Supplier Management State
  const [showSupModal, setShowSupModal] = useState(false);
  const [editingSup, setEditingSup] = useState<Partial<Supplier> | null>(null);

  // Expense Management State
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExp, setEditingExp] = useState<Partial<Expense> | null>(null);

  // Business Settings State
  const [bizForm, setBizForm] = useState<Partial<ShopSettings>>({});

  // Log Filtering State
  const [logSearch, setLogSearch] = useState('');
  const [logUserFilter, setLogUserFilter] = useState('all');
  const [logActionFilter, setLogActionFilter] = useState('all');
  
  // Log Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const LOGS_PER_PAGE = 20;

  const canManageUsers = hasPermission('manage_users');
  const canManageStock = hasPermission('manage_stock');
  const canViewFinancials = hasPermission('view_financials');
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin' || isSuperAdmin;

  if (!settings) return null;
  const currentShopId = settings.shopId;

  // CRITICAL: Filter all data by shopId first to ensure data isolation
  const shopUsers = users.filter(u => u.shopId === currentShopId);
  const shopCategories = categories.filter(c => c.shopId === currentShopId);
  const shopSuppliers = suppliers.filter(s => s.shopId === currentShopId);
  const shopExpenses = expenses.filter(e => e.shopId === currentShopId);
  const shopActivityLogs = activityLogs.filter(log => log.shopId === currentShopId);

  // Filter archived data (after shopId filtering)
  const filteredCategories = shopCategories.filter(c => !c.isArchived);
  const filteredSuppliers = shopSuppliers.filter(s => !s.isArchived);
  const filteredExpenses = shopExpenses.filter(e => !e.isArchived);

  const handleSaveUser = () => {
    if (!editingUser?.username || !editingUser?.fullName || !editingUser?.role) return;
    
    if (editingUser.id) {
      updateUser(editingUser as User);
    } else {
      const newUser: User = {
        id: generateUUID(),
        shopId: settings?.shopId || '',
        username: editingUser.username,
        password: editingUser.password || 'password123',
        fullName: editingUser.fullName,
        role: editingUser.role as UserRole,
        status: 'active',
        language: editingUser.language || 'en',
        createdAt: new Date().toISOString(),
        phone: editingUser.phone
      };
      addUser(newUser);
    }
    setShowUserModal(false);
    setEditingUser(null);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const openCreate = () => {
    setEditingUser({ role: 'cashier', language: 'en' });
    setShowUserModal(true);
  };

  const handleSaveBusiness = () => {
     updateSettings(bizForm);
     alert("Settings saved!");
  };

  const handleSaveCategory = () => {
     if (!editingCat?.name) return;
     if (editingCat.id) {
        editCategory(editingCat as Category);
     } else {
        addCategory({ 
          id: generateUUID(), 
          shopId: settings?.shopId || '', 
          name: editingCat.name,
          createdAt: new Date().toISOString()
        });
     }
     setShowCatModal(false);
     setEditingCat(null);
  };

  const handleSaveSupplier = () => {
     if (!editingSup?.name || !editingSup.phone) return;
     if (editingSup.id) {
        editSupplier(editingSup as Supplier);
     } else {
        addSupplier({ 
            id: generateUUID(), 
            shopId: settings?.shopId || '',
            name: editingSup.name, 
            phone: editingSup.phone, 
            contactPerson: editingSup.contactPerson || '',
            address: editingSup.address || '',
            createdAt: new Date().toISOString()
        });
     }
     setShowSupModal(false);
     setEditingSup(null);
  };

  const handleSaveExpense = () => {
     if (!editingExp?.description || !editingExp.amount) return;
     addExpense({ 
        id: generateUUID(), 
        shopId: settings?.shopId || '',
        description: editingExp.description,
        amount: Number(editingExp.amount),
        category: editingExp.category || 'General',
        date: editingExp.date || new Date().toISOString(),
        recordedByUserId: currentUser?.id || 'unknown',
        createdAt: new Date().toISOString()
     });
     setShowExpModal(false);
     setEditingExp(null);
  };

  const inputClass = "w-full bg-white border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all shadow-sm text-gray-800 placeholder-gray-400";

  // LOGS LOGIC (already filtered by shopId above)
  const filteredLogs = shopActivityLogs.filter(log => {
      const matchesSearch = log.details.toLowerCase().includes(logSearch.toLowerCase()) || 
                            log.action.toLowerCase().includes(logSearch.toLowerCase());
      const matchesUser = logUserFilter === 'all' || log.userId === logUserFilter;
      const matchesAction = logActionFilter === 'all' || log.action === logActionFilter;
      return matchesSearch && matchesUser && matchesAction;
  });

  const uniqueLogUsers = Array.from(new Set(shopActivityLogs.map(l => l.userId))).map(id => {
      const user = shopUsers.find(u => u.id === id);
      return user ? { id: user.id, name: user.fullName } : { id, name: 'Unknown' };
  });

  const uniqueLogActions: string[] = Array.from(new Set(shopActivityLogs.map(l => l.action)));

  // Pagination Logic
  useEffect(() => {
      setCurrentPage(1);
  }, [logSearch, logUserFilter, logActionFilter]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const displayedLogs = filteredLogs.slice((currentPage - 1) * LOGS_PER_PAGE, currentPage * LOGS_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-800">{t('settings')}</h2>
        <div className="flex gap-2">
            <LanguageSelector 
                currentLanguage={language}
                onLanguageChange={setLanguage}
                variant="default"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-2">
          {[
            { id: 'profile', icon: UserIcon, label: t('profile'), show: true },
            { id: 'business', icon: Store, label: t('businessSettings'), show: isAdmin },
            { id: 'users', icon: Users, label: t('manageUsers'), show: canManageUsers },
            { id: 'categories', icon: Layers, label: t('categories'), show: canManageStock },
            { id: 'suppliers', icon: Truck, label: t('suppliers'), show: canManageStock },
            { id: 'expenses', icon: Receipt, label: t('expenses'), show: canViewFinancials },
            { id: 'logs', icon: FileText, label: t('activityLog'), show: isAdmin },
          ].map(tab => (
            tab.show && (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-200' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          {activeTab === 'profile' && currentUser && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-bold text-gray-400">
                     {currentUser.profilePhoto ? <img src={currentUser.profilePhoto} className="w-full h-full rounded-full object-cover"/> : currentUser.fullName.charAt(0)}
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-gray-800">{currentUser.fullName}</h3>
                     <p className="text-gray-500 capitalize">{t(currentUser.role)}</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                     <p className="text-xs text-gray-400 uppercase font-bold">{t('username')}</p>
                     <p className="font-semibold text-gray-800">{currentUser.username}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                     <p className="text-xs text-gray-400 uppercase font-bold">{t('phone')}</p>
                     <p className="font-semibold text-gray-800">{currentUser.phone || 'N/A'}</p>
                  </div>
               </div>

               <div className="pt-6 border-t border-gray-100">
                 <div className="flex items-center gap-2 mb-2">
                   <Sparkles className="w-5 h-5 text-purple-600" />
                   <h4 className="font-bold text-gray-800">{t('aiSettings')}</h4>
                 </div>
                 <p className="text-sm text-gray-500">AI Chat is managed by admin. Contact support if you need to enable or disable AI features.</p>
               </div>
            </div>
          )}

          {activeTab === 'business' && (
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-bold text-gray-800">{t('businessSettings')}</h3>
                </div>
                <div className="space-y-4">
                   <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{t('businessName')}</label>
                      <input 
                        className={inputClass}
                        value={bizForm.businessName ?? settings.businessName}
                        onChange={e => setBizForm({...bizForm, businessName: e.target.value})}
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-1">{t('phone')}</label>
                         <input 
                           className={inputClass}
                           value={bizForm.phone ?? settings.phone}
                           onChange={e => setBizForm({...bizForm, phone: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-1">{t('currency')}</label>
                         <input 
                           className={inputClass}
                           value={bizForm.currency ?? settings.currency}
                           onChange={e => setBizForm({...bizForm, currency: e.target.value})}
                         />
                      </div>
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{t('address')}</label>
                      <input 
                        className={inputClass}
                        value={bizForm.address ?? settings.address}
                        onChange={e => setBizForm({...bizForm, address: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{t('receiptFooter')}</label>
                      <textarea 
                        className={inputClass}
                        rows={2}
                        value={bizForm.receiptFooter ?? settings.receiptFooter}
                        onChange={e => setBizForm({...bizForm, receiptFooter: e.target.value})}
                      />
                   </div>
                   <div className="pt-4">
                      <Button onClick={handleSaveBusiness}>{t('save')}</Button>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'users' && canManageUsers && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">{t('manageUsers')}</h3>
                <Button size="sm" onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-1" /> {t('addUser')}
                </Button>
              </div>
              
              <div className="grid gap-3">
                {shopUsers.map(user => (
                  <div key={user.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center font-bold">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{user.fullName}</p>
                        <p className="text-xs text-gray-500 capitalize">{t(user.role)} • {user.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t(user.status)}
                      </span>
                      <button onClick={() => openEdit(user)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                        <Edit className="w-4 h-4" />
                      </button>
                      {!['superadmin'].includes(user.role) && (
                        <button onClick={() => deleteUser(user.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500">
                           <Power className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'categories' && canManageStock && (
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <h3 className="text-lg font-bold text-gray-800">{t('manageCategories')}</h3>
                   <Button size="sm" onClick={() => { setEditingCat({}); setShowCatModal(true); }}>
                      <Plus className="w-4 h-4 mr-1" /> {t('addCategory')}
                   </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {filteredCategories.map(cat => (
                      <div key={cat.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                         <span className="font-medium text-gray-800">{cat.name}</span>
                         <div className="flex gap-2">
                            <button onClick={() => { setEditingCat(cat); setShowCatModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => deleteCategory(cat.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'suppliers' && canManageStock && (
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <h3 className="text-lg font-bold text-gray-800">{t('manageSuppliers')}</h3>
                   <Button size="sm" onClick={() => { setEditingSup({}); setShowSupModal(true); }}>
                      <Plus className="w-4 h-4 mr-1" /> {t('addSupplier')}
                   </Button>
                </div>
                <div className="space-y-3">
                   {filteredSuppliers.map(sup => (
                      <div key={sup.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                         <div>
                            <p className="font-bold text-gray-800">{sup.name}</p>
                            <p className="text-xs text-gray-500">{sup.contactPerson} • {sup.phone}</p>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => { setEditingSup(sup); setShowSupModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => deleteSupplier(sup.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'expenses' && canViewFinancials && (
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <h3 className="text-lg font-bold text-gray-800">{t('manageExpenses')}</h3>
                   <Button size="sm" onClick={() => { setEditingExp({}); setShowExpModal(true); }}>
                      <Plus className="w-4 h-4 mr-1" /> {t('addExpense')}
                   </Button>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                         <tr>
                            <th className="p-3">{t('description')}</th>
                            <th className="p-3">{t('category')}</th>
                            <th className="p-3">{t('amount')}</th>
                            <th className="p-3">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {filteredExpenses.map(exp => (
                            <tr key={exp.id}>
                               <td className="p-3 font-medium text-gray-800">{exp.description}</td>
                               <td className="p-3 text-gray-500">{exp.category}</td>
                               <td className="p-3 font-bold text-red-600">₦{exp.amount.toLocaleString()}</td>
                               <td className="p-3">
                                  <button onClick={() => deleteExpense(exp.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'logs' && isAdmin && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">{t('activityLog')}</h3>
              
              {/* Log Filters */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[200px] relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input 
                          className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                          placeholder={t('searchLogs')}
                          value={logSearch}
                          onChange={(e) => setLogSearch(e.target.value)}
                      />
                  </div>
                  <div className="w-40">
                      <select 
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none text-gray-900"
                          value={logUserFilter}
                          onChange={(e) => setLogUserFilter(e.target.value)}
                      >
                          <option value="all">{t('allUsers')}</option>
                          {uniqueLogUsers.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                      </select>
                  </div>
                  <div className="w-40">
                      <select 
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none text-gray-900"
                          value={logActionFilter}
                          onChange={(e) => setLogActionFilter(e.target.value)}
                      >
                          <option value="all">{t('allActions')}</option>
                          {uniqueLogActions.map(action => (
                              <option key={action} value={action}>{action}</option>
                          ))}
                      </select>
                  </div>
              </div>

              {/* Logs List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {displayedLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>{t('noActivity')}</p>
                  </div>
                ) : (
                  displayedLogs.map(log => (
                    <div key={log.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-sm">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-gray-700">{log.action}</span>
                        <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-600 mt-1">{log.details}</p>
                      <p className="text-xs text-gray-400 mt-1">By: <span className="font-medium text-gray-600">{log.userName}</span></p>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 pt-2">
                      <button 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                      >
                          <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium text-gray-600">
                          Page {currentPage} of {totalPages}
                      </span>
                      <button 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                      >
                          <ChevronRight className="w-4 h-4" />
                      </button>
                  </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editingUser?.id ? t('editUser') : t('addUser')}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('fullName')}</label>
                <input 
                  className={inputClass}
                  value={editingUser?.fullName || ''}
                  onChange={e => setEditingUser({...editingUser, fullName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('username')}</label>
                <input 
                  className={inputClass}
                  value={editingUser?.username || ''}
                  onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('phone')}</label>
                <input 
                  className={inputClass}
                  value={editingUser?.phone || ''}
                  onChange={e => setEditingUser({...editingUser, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('password')}</label>
                <input 
                  className={inputClass}
                  type="password"
                  placeholder={editingUser?.id ? 'Leave blank to keep current' : ''}
                  value={editingUser?.password || ''}
                  onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('role')}</label>
                <select 
                  className={inputClass}
                  value={editingUser?.role || 'cashier'}
                  onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                >
                  <option value="admin">{t('admin')}</option>
                  <option value="manager">{t('manager')}</option>
                  <option value="cashier">{t('cashier')}</option>
                  <option value="stock_clerk">{t('stock_clerk')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button className="flex-1" onClick={handleSaveUser}>{t('save')}</Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowUserModal(false)}>{t('cancel')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl">
               <h3 className="text-lg font-bold text-gray-800 mb-4">{editingCat?.id ? t('editCategory') : t('addCategory')}</h3>
               <input 
                  className={inputClass}
                  placeholder={t('categoryName')}
                  value={editingCat?.name || ''}
                  onChange={e => setEditingCat({...editingCat, name: e.target.value})}
                  autoFocus
               />
               <div className="flex gap-3 mt-6">
                  <Button className="flex-1" onClick={handleSaveCategory}>{t('save')}</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowCatModal(false)}>{t('cancel')}</Button>
               </div>
            </div>
         </div>
      )}

      {/* Supplier Modal */}
      {showSupModal && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
               <h3 className="text-lg font-bold text-gray-800 mb-4">{editingSup?.id ? t('editSupplier') : t('addSupplier')}</h3>
               <div className="space-y-3">
                  <input className={inputClass} placeholder={t('supplierName')} value={editingSup?.name || ''} onChange={e => setEditingSup({...editingSup, name: e.target.value})} />
                  <input className={inputClass} placeholder={t('contactPerson')} value={editingSup?.contactPerson || ''} onChange={e => setEditingSup({...editingSup, contactPerson: e.target.value})} />
                  <input className={inputClass} placeholder={t('phone')} value={editingSup?.phone || ''} onChange={e => setEditingSup({...editingSup, phone: e.target.value})} />
                  <input className={inputClass} placeholder={t('address')} value={editingSup?.address || ''} onChange={e => setEditingSup({...editingSup, address: e.target.value})} />
               </div>
               <div className="flex gap-3 mt-6">
                  <Button className="flex-1" onClick={handleSaveSupplier}>{t('save')}</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowSupModal(false)}>{t('cancel')}</Button>
               </div>
            </div>
         </div>
      )}

      {/* Expense Modal */}
      {showExpModal && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
               <h3 className="text-lg font-bold text-gray-800 mb-4">{t('addExpense')}</h3>
               <div className="space-y-3">
                  <input className={inputClass} placeholder={t('description')} value={editingExp?.description || ''} onChange={e => setEditingExp({...editingExp, description: e.target.value})} />
                  <div className="relative">
                     <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₦</span>
                     <input type="number" className={`${inputClass} pl-8`} placeholder="0.00" value={editingExp?.amount || ''} onChange={e => setEditingExp({...editingExp, amount: e.target.value})} />
                  </div>
                  <select className={inputClass} value={editingExp?.category || 'General'} onChange={e => setEditingExp({...editingExp, category: e.target.value})}>
                     <option value="General">General</option>
                     <option value="Rent">Rent</option>
                     <option value="Utilities">Utilities</option>
                     <option value="Salary">Salary</option>
                     <option value="Restock">Restock</option>
                  </select>
                  <input type="date" className={inputClass} value={editingExp?.date ? new Date(editingExp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} onChange={e => setEditingExp({...editingExp, date: new Date(e.target.value).toISOString()})} />
               </div>
               <div className="flex gap-3 mt-6">
                  <Button className="flex-1" onClick={handleSaveExpense}>{t('save')}</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowExpModal(false)}>{t('cancel')}</Button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
