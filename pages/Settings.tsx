
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/Button';
import { User, UserRole, Language, ShopSettings, Category, Supplier, Expense, ExpenseCategory, ExpenseTemplate } from '../types';
import { User as UserIcon, Shield, Power, Trash2, Edit, Plus, Users, Sparkles, FileText, Clock, Store, Layers, Truck, Receipt, Search, Filter, Archive, ChevronLeft, ChevronRight, Package, RotateCcw, GripVertical, Calendar, TrendingDown, X } from 'lucide-react';
import { generateUUID } from '../services/supabase/client';
import { LanguageSelector } from '../components/LanguageSelector';

export const Settings: React.FC = () => {
  const { t, users, currentUser, language, setLanguage, addUser, updateUser, deleteUser, hasPermission, activityLogs, settings, updateSettings, categories, addCategory, editCategory, deleteCategory, suppliers, addSupplier, editSupplier, deleteSupplier, expenses, addExpense, deleteExpense, products, restoreProduct, expenseCategories, addExpenseCategory, expenseTemplates, addExpenseTemplate, editExpenseTemplate, deleteExpenseTemplate } = useStore();
  const [activeTab, setActiveTab] = useState<'users' | 'profile' | 'logs' | 'business' | 'categories' | 'suppliers' | 'expenses' | 'products'>('profile');
  
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
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  // Expense Template Management State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<ExpenseTemplate> | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [draggedExpense, setDraggedExpense] = useState<Expense | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Expense Filtering State
  const [expenseDateFilter, setExpenseDateFilter] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);

  // Business Settings State
  const [bizForm, setBizForm] = useState<Partial<ShopSettings>>({});

  // Log Filtering State
  const [logSearch, setLogSearch] = useState('');
  const [logUserFilter, setLogUserFilter] = useState('all');
  const [logActionFilter, setLogActionFilter] = useState('all');
  
  // Log Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const LOGS_PER_PAGE = 20;

  // Products (Archived) Filtering State
  const [productSearch, setProductSearch] = useState('');

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
  const shopProducts = products.filter(p => p.shopId === currentShopId);
  const shopActivityLogs = activityLogs.filter(log => log.shopId === currentShopId);
  const shopExpenseTemplates = (expenseTemplates || []).filter(t => t.shopId === currentShopId);

  // Filter archived data (after shopId filtering)
  const filteredCategories = shopCategories.filter(c => !c.isArchived);
  const filteredSuppliers = shopSuppliers.filter(s => !s.isArchived);
  const baseFilteredExpenses = shopExpenses.filter(e => !e.isArchived);
  const filteredExpenseTemplates = shopExpenseTemplates.filter(t => !t.isArchived);
  const archivedProducts = shopProducts.filter(p => p.isArchived);

  // Date range calculation for expense filtering
  const getExpenseDateRange = () => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    if (expenseDateFilter === 'custom' && customStartDate && customEndDate) {
      start.setTime(new Date(customStartDate).getTime());
      end.setTime(new Date(customEndDate).getTime());
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (expenseDateFilter === 'today') {
      // Already set to today
    } else if (expenseDateFilter === 'week') {
      const day = start.getDay();
      start.setDate(start.getDate() - day); // Start of week (Sunday)
    } else if (expenseDateFilter === 'month') {
      start.setDate(1); // First day of month
    } else if (expenseDateFilter === 'all') {
      start.setTime(0); // Beginning of time
      end.setTime(Date.now() + 86400000); // Future date
    }

    return { start, end };
  };

  // Filter expenses by date and category
  const filteredExpenses = useMemo(() => {
    let filtered = [...baseFilteredExpenses];

    // Apply date filter
    if (expenseDateFilter !== 'all') {
      const { start, end } = getExpenseDateRange();
      filtered = filtered.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= start && expDate <= end;
      });
    }

    // Apply category filter
    if (expenseCategoryFilter !== 'all') {
      filtered = filtered.filter(exp => exp.category === expenseCategoryFilter);
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [baseFilteredExpenses, expenseDateFilter, expenseCategoryFilter, customStartDate, customEndDate]);

  // Calculate expense statistics
  const expenseStats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const count = filteredExpenses.length;
    const avg = count > 0 ? total / count : 0;
    
    // Group by category
    const byCategory = filteredExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    return { total, count, avg, byCategory };
  }, [filteredExpenses]);

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
     setShowAddCategory(false);
     setNewCategoryName('');
     setSelectedTemplateId(null);
  };

  const handleSaveTemplate = () => {
     if (!editingTemplate?.name || !editingTemplate.description || !editingTemplate.amount) return;
     if (editingTemplate.id) {
        editExpenseTemplate({
           id: editingTemplate.id,
           shopId: settings?.shopId || '',
           name: editingTemplate.name,
           description: editingTemplate.description,
           amount: Number(editingTemplate.amount),
           category: editingTemplate.category || 'General',
           createdAt: editingTemplate.createdAt || new Date().toISOString(),
           updatedAt: new Date().toISOString()
        } as ExpenseTemplate);
     } else {
        addExpenseTemplate({
           id: generateUUID(),
           shopId: settings?.shopId || '',
           name: editingTemplate.name,
           description: editingTemplate.description,
           amount: Number(editingTemplate.amount),
           category: editingTemplate.category || 'General',
           createdAt: new Date().toISOString()
        });
     }
     setShowTemplateModal(false);
     setEditingTemplate(null);
     setDraggedExpense(null);
  };

  const handleUseTemplate = (template: ExpenseTemplate) => {
     setSelectedTemplateId(template.id);
     setEditingExp({
        description: template.description,
        amount: template.amount,
        category: template.category,
        date: new Date().toISOString()
     });
     setShowExpModal(true);
  };

  const handleDragStart = (e: React.DragEvent, expense: Expense) => {
     setDraggedExpense(expense);
     e.dataTransfer.effectAllowed = 'move';
     e.dataTransfer.setData('text/plain', expense.id);
     // Add visual feedback
     if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = '0.5';
     }
  };

  const handleDragEnd = (e: React.DragEvent) => {
     setDraggedExpense(null);
     if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = '1';
     }
  };

  const handleDragOver = (e: React.DragEvent) => {
     e.preventDefault();
     e.dataTransfer.dropEffect = 'move';
     setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
     e.preventDefault();
     setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
     e.preventDefault();
     setIsDraggingOver(false);
     
     if (draggedExpense) {
        // Open template modal with expense data pre-filled
        setEditingTemplate({
           name: draggedExpense.description, // Use description as default name
           description: draggedExpense.description,
           amount: draggedExpense.amount,
           category: draggedExpense.category
        });
        setShowTemplateModal(true);
        setDraggedExpense(null);
     }
  };

  // Default expense categories
  const defaultExpenseCategories = ['General', 'Rent', 'Utilities', 'Salary', 'Restock'];
  
  // Get shop-specific expense categories
  const shopExpenseCategories = expenseCategories.filter(ec => ec.shopId === currentShopId && !ec.isArchived);
  
  // Combine default and custom categories, remove duplicates
  const allExpenseCategories = Array.from(new Set([
    ...defaultExpenseCategories, 
    ...shopExpenseCategories.map(ec => ec.name)
  ])).sort();

  const handleAddExpenseCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed && !allExpenseCategories.includes(trimmed)) {
      const newCategory: ExpenseCategory = {
        id: generateUUID(),
        shopId: currentShopId,
        name: trimmed,
        createdAt: new Date().toISOString()
      };
      addExpenseCategory(newCategory);
      setEditingExp({...editingExp, category: trimmed});
      setNewCategoryName('');
      setShowAddCategory(false);
    }
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
            { id: 'products', icon: Package, label: 'Archived Products', show: canManageStock },
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
                   
                   {/* AI Chat Visibility Toggle */}
                   <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                               <Sparkles className="w-5 h-5 text-purple-600" />
                               <label className="block text-sm font-semibold text-gray-700">{t('showAIChatByDefault') || 'Show AI Chat by Default'}</label>
                            </div>
                            <p className="text-xs text-gray-500">Control whether the AI chat icon appears on most pages. It will always be available in Settings.</p>
                         </div>
                         <label className="relative inline-flex items-center cursor-pointer ml-4">
                            <input
                               type="checkbox"
                               className="sr-only peer"
                               checked={bizForm.showAIChatByDefault !== undefined ? bizForm.showAIChatByDefault : (settings.showAIChatByDefault !== false)}
                               onChange={e => setBizForm({...bizForm, showAIChatByDefault: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                         </label>
                      </div>
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
             <div className="space-y-6">
                {/* Expense Templates Section */}
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <div>
                         <h3 className="text-lg font-bold text-gray-800">Expense Templates</h3>
                         <p className="text-sm text-gray-500">Create templates for recurring expenses</p>
                      </div>
                      <Button size="sm" onClick={() => { setEditingTemplate({}); setShowTemplateModal(true); }}>
                         <Plus className="w-4 h-4 mr-1" /> Add Template
                      </Button>
                   </div>
                   <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`rounded-xl border-2 border-dashed transition-all ${
                         isDraggingOver 
                           ? 'border-green-500 bg-green-50 scale-105' 
                           : 'border-gray-200 bg-gray-50'
                      }`}
                   >
                      {filteredExpenseTemplates.length === 0 ? (
                         <div className={`p-8 text-center ${isDraggingOver ? 'text-green-600' : ''}`}>
                            <Receipt className={`w-12 h-12 mx-auto mb-3 ${isDraggingOver ? 'text-green-500' : 'text-gray-300'}`} />
                            <p className={`font-medium ${isDraggingOver ? 'text-green-600' : 'text-gray-400'}`}>
                               {isDraggingOver ? 'Drop expense here to create template' : 'No expense templates'}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                               {isDraggingOver ? 'Release to create template' : 'Drag an expense here or create manually'}
                            </p>
                         </div>
                      ) : (
                         <div className="p-4">
                            {isDraggingOver && (
                               <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-center">
                                  <p className="text-sm font-medium text-green-700">Drop expense here to create a new template</p>
                               </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               {filteredExpenseTemplates.map(template => (
                                  <div key={template.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                     <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                           <h4 className="font-bold text-gray-800">{template.name}</h4>
                                           <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                                        </div>
                                        <div className="flex gap-2 ml-2">
                                           <button 
                                              onClick={() => handleUseTemplate(template)}
                                              className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                                              title="Use Template"
                                           >
                                              <Plus className="w-4 h-4" />
                                           </button>
                                           <button 
                                              onClick={() => { setEditingTemplate(template); setShowTemplateModal(true); }}
                                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                                              title="Edit Template"
                                           >
                                              <Edit className="w-4 h-4" />
                                           </button>
                                           <button 
                                              onClick={() => deleteExpenseTemplate(template.id)}
                                              className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                                              title="Delete Template"
                                           >
                                              <Trash2 className="w-4 h-4" />
                                           </button>
                                        </div>
                                     </div>
                                     <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                        <span className="text-xs text-gray-500">{template.category}</span>
                                        <span className="font-bold text-red-600">₦{template.amount.toLocaleString()}</span>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>
                      )}
                   </div>
                </div>

                {/* Expenses List Section */}
                <div className="space-y-4">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                         <h3 className="text-lg font-bold text-gray-800">{t('manageExpenses')}</h3>
                         <p className="text-sm text-gray-500">Track and analyze your expenses</p>
                      </div>
                      <Button size="sm" onClick={() => { setEditingExp({}); setSelectedTemplateId(null); setShowExpModal(true); }}>
                         <Plus className="w-4 h-4 mr-1" /> {t('addExpense')}
                      </Button>
                   </div>

                   {/* Expense Statistics */}
                   {filteredExpenses.length > 0 && (
                      <>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                               <div className="flex items-center justify-between">
                                  <div>
                                     <p className="text-xs font-medium text-red-600 uppercase mb-1">Total Expenses</p>
                                     <p className="text-2xl font-bold text-red-700">₦{expenseStats.total.toLocaleString()}</p>
                                  </div>
                                  <TrendingDown className="w-8 h-8 text-red-400" />
                               </div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                               <div className="flex items-center justify-between">
                                  <div>
                                     <p className="text-xs font-medium text-blue-600 uppercase mb-1">Number of Expenses</p>
                                     <p className="text-2xl font-bold text-blue-700">{expenseStats.count}</p>
                                  </div>
                                  <Receipt className="w-8 h-8 text-blue-400" />
                               </div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                               <div className="flex items-center justify-between">
                                  <div>
                                     <p className="text-xs font-medium text-purple-600 uppercase mb-1">Average Expense</p>
                                     <p className="text-2xl font-bold text-purple-700">₦{expenseStats.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                  </div>
                                  <FileText className="w-8 h-8 text-purple-400" />
                               </div>
                            </div>
                         </div>

                         {/* Category Breakdown */}
                         {Object.keys(expenseStats.byCategory).length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                               <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                                  <Filter className="w-4 h-4" />
                                  Expenses by Category
                               </h4>
                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {Object.entries(expenseStats.byCategory)
                                     .sort(([, a], [, b]) => b - a)
                                     .map(([category, amount]) => {
                                        const percentage = ((amount / expenseStats.total) * 100).toFixed(1);
                                        return (
                                           <button
                                              key={category}
                                              onClick={() => setExpenseCategoryFilter(category)}
                                              className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all hover:border-green-300 hover:shadow-sm"
                                           >
                                              <div className="flex items-center justify-between mb-1">
                                                 <span className="text-sm font-semibold text-gray-800">{category}</span>
                                                 <span className="text-xs font-medium text-gray-500">{percentage}%</span>
                                              </div>
                                              <p className="text-lg font-bold text-red-600">₦{amount.toLocaleString()}</p>
                                              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                 <div 
                                                    className="h-full bg-red-500 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                 />
                                              </div>
                                           </button>
                                        );
                                     })}
                               </div>
                            </div>
                         )}
                      </>
                   )}

                   {/* Filters */}
                   <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row gap-4">
                         {/* Date Filter */}
                         <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Date Range</label>
                            <div className="flex gap-2">
                               <select 
                                  className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium"
                                  value={expenseDateFilter}
                                  onChange={(e) => {
                                     const value = e.target.value as typeof expenseDateFilter;
                                     setExpenseDateFilter(value);
                                     if (value === 'custom') {
                                        setShowCustomDateRange(true);
                                     } else {
                                        setShowCustomDateRange(false);
                                     }
                                  }}
                               >
                                  <option value="all">All Time</option>
                                  <option value="today">Today</option>
                                  <option value="week">This Week</option>
                                  <option value="month">This Month</option>
                                  <option value="custom">Custom Range</option>
                               </select>
                               {expenseDateFilter === 'custom' && (
                                  <div className="flex gap-2 flex-1">
                                     <input
                                        type="date"
                                        className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        placeholder="Start Date"
                                     />
                                     <input
                                        type="date"
                                        className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        placeholder="End Date"
                                     />
                                     {(customStartDate || customEndDate) && (
                                        <button
                                           onClick={() => {
                                              setCustomStartDate('');
                                              setCustomEndDate('');
                                              setExpenseDateFilter('all');
                                              setShowCustomDateRange(false);
                                           }}
                                           className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                                           title="Clear date filter"
                                        >
                                           <X className="w-4 h-4" />
                                        </button>
                                     )}
                                  </div>
                               )}
                            </div>
                         </div>

                         {/* Category Filter */}
                         <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Category</label>
                            <div className="flex gap-2">
                               <select 
                                  className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium"
                                  value={expenseCategoryFilter}
                                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                               >
                                  <option value="all">All Categories</option>
                                  {allExpenseCategories.map(cat => (
                                     <option key={cat} value={cat}>{cat}</option>
                                  ))}
                               </select>
                               {expenseCategoryFilter !== 'all' && (
                                  <button
                                     onClick={() => setExpenseCategoryFilter('all')}
                                     className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                                     title="Clear category filter"
                                  >
                                     <X className="w-4 h-4" />
                                  </button>
                               )}
                            </div>
                         </div>
                      </div>

                      {/* Active Filters Display */}
                      {(expenseDateFilter !== 'all' || expenseCategoryFilter !== 'all') && (
                         <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                            <span className="text-xs text-gray-500">Active filters:</span>
                            {expenseDateFilter !== 'all' && (
                               <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  {expenseDateFilter === 'custom' 
                                     ? `Custom: ${customStartDate ? new Date(customStartDate).toLocaleDateString() : '...'} - ${customEndDate ? new Date(customEndDate).toLocaleDateString() : '...'}`
                                     : expenseDateFilter.charAt(0).toUpperCase() + expenseDateFilter.slice(1)}
                                  <button onClick={() => setExpenseDateFilter('all')} className="hover:text-blue-900">
                                     <X className="w-3 h-3" />
                                  </button>
                               </span>
                            )}
                            {expenseCategoryFilter !== 'all' && (
                               <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  Category: {expenseCategoryFilter}
                                  <button onClick={() => setExpenseCategoryFilter('all')} className="hover:text-green-900">
                                     <X className="w-3 h-3" />
                                  </button>
                               </span>
                            )}
                         </div>
                      )}
                   </div>

                   {/* Expenses Table */}
                   {filteredExpenses.length === 0 ? (
                      <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8 text-center">
                         <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                         <p className="text-gray-400 font-medium">No expenses found</p>
                         <p className="text-sm text-gray-400 mt-1">
                            {expenseDateFilter !== 'all' || expenseCategoryFilter !== 'all' 
                               ? 'Try adjusting your filters' 
                               : 'Add expenses manually or use a template'}
                         </p>
                      </div>
                   ) : (
                      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                               <thead className="bg-gray-50 text-gray-500 font-medium">
                                  <tr>
                                     <th className="p-3 w-8"></th>
                                     <th className="p-3">Date</th>
                                     <th className="p-3">{t('description')}</th>
                                     <th className="p-3">{t('category')}</th>
                                     <th className="p-3 text-right">{t('amount')}</th>
                                     <th className="p-3 text-center">Action</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-gray-100">
                                  {filteredExpenses.map(exp => (
                                     <tr 
                                        key={exp.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, exp)}
                                        onDragEnd={handleDragEnd}
                                        className="cursor-move hover:bg-gray-50 transition-colors group"
                                        title="Drag to templates section to create a template"
                                     >
                                        <td className="p-3 text-gray-400 group-hover:text-gray-600">
                                           <GripVertical className="w-4 h-4" />
                                        </td>
                                        <td className="p-3 text-gray-600">
                                           {new Date(exp.date).toLocaleDateString('en-US', { 
                                              month: 'short', 
                                              day: 'numeric', 
                                              year: 'numeric' 
                                           })}
                                        </td>
                                        <td className="p-3 font-medium text-gray-800">{exp.description}</td>
                                        <td className="p-3">
                                           <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                              {exp.category}
                                           </span>
                                        </td>
                                        <td className="p-3 text-right font-bold text-red-600">₦{exp.amount.toLocaleString()}</td>
                                        <td className="p-3 text-center">
                                           <button onClick={() => deleteExpense(exp.id)} className="text-red-500 hover:text-red-700 transition-colors">
                                              <Trash2 className="w-4 h-4" />
                                           </button>
                                        </td>
                                     </tr>
                                  ))}
                               </tbody>
                               <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                  <tr>
                                     <td colSpan={4} className="p-3 font-bold text-gray-700 text-right">Total:</td>
                                     <td className="p-3 text-right font-bold text-red-600 text-lg">₦{expenseStats.total.toLocaleString()}</td>
                                     <td></td>
                                  </tr>
                               </tfoot>
                            </table>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          )}

          {activeTab === 'products' && canManageStock && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Archived Products</h3>
                <p className="text-sm text-gray-500">{archivedProducts.length} archived</p>
              </div>
              
              {/* Search Filter */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input 
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                    placeholder="Search archived products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Archived Products List */}
              {archivedProducts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400 font-medium">No archived products</p>
                  <p className="text-sm text-gray-400 mt-1">Archived products will appear here</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="p-4">Product Name</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Barcode</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {archivedProducts
                        .filter(p => 
                          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.barcode.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.category.toLowerCase().includes(productSearch.toLowerCase())
                        )
                        .map(product => (
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-medium text-gray-800">{product.name}</td>
                            <td className="p-4 text-gray-500">{product.category}</td>
                            <td className="p-4 text-gray-500 font-mono text-xs">{product.barcode || 'N/A'}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => {
                                  restoreProduct(product.id);
                                  alert(`Product "${product.name}" has been restored`);
                                }}
                                className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                                title="Restore Product"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Restore
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                        <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
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
                  {/* Template Selection */}
                  {filteredExpenseTemplates.length > 0 && (
                     <div className="mb-4 pb-4 border-b border-gray-200">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Use Template (Optional)</label>
                        <select 
                           className={inputClass}
                           value={selectedTemplateId || ''}
                           onChange={e => {
                              const templateId = e.target.value;
                              setSelectedTemplateId(templateId || null);
                              if (templateId) {
                                 const template = filteredExpenseTemplates.find(t => t.id === templateId);
                                 if (template) {
                                    setEditingExp({
                                       description: template.description,
                                       amount: template.amount,
                                       category: template.category,
                                       date: new Date().toISOString()
                                    });
                                 }
                              }
                           }}
                        >
                           <option value="">Select a template...</option>
                           {filteredExpenseTemplates.map(template => (
                              <option key={template.id} value={template.id}>{template.name}</option>
                           ))}
                        </select>
                        {selectedTemplateId && (
                           <p className="text-xs text-gray-500 mt-1">Template loaded. You can modify the values below.</p>
                        )}
                     </div>
                  )}
                  
                  <input className={inputClass} placeholder={t('description')} value={editingExp?.description || ''} onChange={e => setEditingExp({...editingExp, description: e.target.value})} />
                  <div className="relative">
                     <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₦</span>
                     <input type="number" className={`${inputClass} pl-8`} placeholder="0.00" value={editingExp?.amount || ''} onChange={e => setEditingExp({...editingExp, amount: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <div className="flex gap-2">
                        <select 
                           className={`${inputClass} flex-1`} 
                           value={editingExp?.category || 'General'} 
                           onChange={e => {
                              setEditingExp({...editingExp, category: e.target.value});
                              setShowAddCategory(false);
                           }}
                        >
                           {allExpenseCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                           ))}
                        </select>
                        <button
                           type="button"
                           onClick={() => {
                              setShowAddCategory(!showAddCategory);
                              setNewCategoryName('');
                           }}
                           className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 font-medium transition-all flex items-center gap-1.5"
                           title="Add Custom Category"
                        >
                           <Plus className="w-4 h-4" />
                        </button>
                     </div>
                     {showAddCategory && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                           <input
                              type="text"
                              className={inputClass}
                              placeholder="Enter category name"
                              value={newCategoryName}
                              onChange={e => setNewCategoryName(e.target.value)}
                              onKeyPress={e => {
                                 if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddExpenseCategory();
                                 }
                              }}
                              autoFocus
                           />
                           <button
                              type="button"
                              onClick={handleAddExpenseCategory}
                              disabled={!newCategoryName.trim() || allExpenseCategories.includes(newCategoryName.trim())}
                              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
                           >
                              Add
                           </button>
                           <button
                              type="button"
                              onClick={() => {
                                 setShowAddCategory(false);
                                 setNewCategoryName('');
                              }}
                              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all"
                           >
                              Cancel
                           </button>
                        </div>
                     )}
                  </div>
                  <input type="date" className={inputClass} value={editingExp?.date ? new Date(editingExp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} onChange={e => setEditingExp({...editingExp, date: new Date(e.target.value).toISOString()})} />
               </div>
               <div className="flex gap-3 mt-6">
                  <Button className="flex-1" onClick={handleSaveExpense}>{t('save')}</Button>
                  <Button variant="outline" className="flex-1" onClick={() => { setShowExpModal(false); setSelectedTemplateId(null); }}>{t('cancel')}</Button>
               </div>
            </div>
         </div>
      )}

      {/* Expense Template Modal */}
      {showTemplateModal && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
               <h3 className="text-lg font-bold text-gray-800 mb-4">{editingTemplate?.id ? 'Edit Template' : 'Create Expense Template'}</h3>
               {draggedExpense && !editingTemplate?.id && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                     <p className="text-sm text-green-700">
                        <strong>Template from expense:</strong> Pre-filled from "{draggedExpense.description}". You can edit all fields including the price.
                     </p>
                  </div>
               )}
               <div className="space-y-3">
                  <input 
                     className={inputClass} 
                     placeholder="Template Name (e.g., Daily Rent, Monthly Utilities)" 
                     value={editingTemplate?.name || ''} 
                     onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} 
                     autoFocus
                  />
                  <input 
                     className={inputClass} 
                     placeholder={t('description')} 
                     value={editingTemplate?.description || ''} 
                     onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})} 
                  />
                  <div className="relative">
                     <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₦</span>
                     <input 
                        type="number" 
                        className={`${inputClass} pl-8`} 
                        placeholder="0.00" 
                        value={editingTemplate?.amount || ''} 
                        onChange={e => setEditingTemplate({...editingTemplate, amount: e.target.value})} 
                     />
                  </div>
                  <select 
                     className={inputClass} 
                     value={editingTemplate?.category || 'General'} 
                     onChange={e => setEditingTemplate({...editingTemplate, category: e.target.value})}
                  >
                     {allExpenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                     ))}
                  </select>
               </div>
               <div className="flex gap-3 mt-6">
                  <Button className="flex-1" onClick={handleSaveTemplate}>{t('save')}</Button>
                  <Button variant="outline" className="flex-1" onClick={() => { setShowTemplateModal(false); setDraggedExpense(null); }}>{t('cancel')}</Button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
