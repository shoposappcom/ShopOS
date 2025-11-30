
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, User, Product, Sale, Customer, Language, UserRole, PermissionAction, PERMISSIONS, ActivityLog, DebtTransaction, ShopSettings, GiftCard, Category, Supplier, Expense, StockMovement, RegistrationData } from '../types';
import { loadState, saveState } from '../services/storage';
import { TRANSLATIONS, INITIAL_CATEGORIES } from '../constants';

interface StoreContextType extends AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  login: (username: string, pin: string) => boolean;
  registerShop: (data: RegistrationData) => boolean;
  logout: () => void;
  addProduct: (product: Product) => void;
  editProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  updateStock: (productId: string, quantity: number, type: 'carton' | 'unit', batchInfo?: {batch: string, expiry: string}) => void;
  recordSale: (sale: Sale) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomerDebt: (customerId: string, amount: number) => void;
  recordDebtPayment: (customerId: string, amount: number) => void;
  getDebtHistory: (customerId: string) => DebtTransaction[];
  addGiftCard: (card: GiftCard) => void;
  deleteGiftCard: (id: string) => void;
  getGiftCard: (code: string) => GiftCard | undefined;
  
  // Category Management
  addCategory: (category: Category) => void;
  editCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;

  // Supplier Management
  addSupplier: (supplier: Supplier) => void;
  editSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;

  // Expense Management
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;

  t: (key: string) => string;
  hasPermission: (action: PermissionAction | string) => boolean;
  
  // User Management
  addUser: (user: User) => boolean;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void; // Soft delete/Deactivate

  // Settings & System
  updateSettings: (settings: Partial<ShopSettings>) => void;
  toggleAI: (enable: boolean) => void;
  isOnline: boolean;
  isSyncing: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadState());
  const [language, setLanguage] = useState<Language>('en');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load language from storage if exists
  useEffect(() => {
    const storedLang = localStorage.getItem('shopos_lang') as Language;
    if (storedLang && ['en', 'ha', 'yo', 'ig', 'ar', 'fr'].includes(storedLang)) {
      setLanguage(storedLang);
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Update document direction
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('shopos_lang', language);
  }, [language]);

  // Network Status Listeners
  useEffect(() => {
    const handleOnline = () => {
       setIsOnline(true);
       setIsSyncing(true);
       // Simulate sync delay
       setTimeout(() => setIsSyncing(false), 2000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const logActivity = (action: string, details: string) => {
    if (!state.currentUser) return;
    const log: ActivityLog = {
      id: Date.now().toString(),
      userId: state.currentUser.id,
      userName: state.currentUser.fullName,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setState(prev => ({ ...prev, activityLogs: [log, ...prev.activityLogs] }));
  };

  const login = (username: string, pin: string) => {
    const user = state.users.find(u => u.username === username && u.password === pin);
    
    if (user) {
      if (user.status === 'inactive') return false;
      
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      setState(prev => ({ 
        ...prev, 
        currentUser: updatedUser,
        users: prev.users.map(u => u.id === user.id ? updatedUser : u)
      }));
      
      return true;
    }
    return false;
  };

  const registerShop = (data: RegistrationData) => {
    const shopId = 'shop_' + Date.now() + Math.floor(Math.random() * 1000);
    
    // Generate username from email prefix or sanitize shop name
    let baseUsername = data.email.split('@')[0];
    // Ensure uniqueness not strictly necessary in local mode if we wipe, but good practice
    
    const newUser: User = {
        id: 'user_' + Date.now(),
        shopId: shopId,
        username: baseUsername,
        password: data.password,
        fullName: data.fullName,
        email: data.email,
        role: 'superadmin',
        status: 'active',
        language: 'en',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };

    // Clean Settings for New Shop
    const newSettings: ShopSettings = {
        shopId: shopId,
        businessName: data.shopName,
        country: data.country,
        state: data.state,
        phone: '', // Empty as requested
        address: '', // Empty as requested
        currency: '₦', // Default or could map based on country
        receiptFooter: 'Thank you for your patronage!',
        taxRate: 0,
        autoBackup: 'off'
    };

    // WIPE STATE for new shop isolation
    // This removes all previous products, sales, customers, etc.
    setState({
        users: [newUser],
        products: [],
        categories: INITIAL_CATEGORIES, // Keep default categories as helper
        suppliers: [],
        expenses: [],
        sales: [],
        customers: [],
        debtTransactions: [],
        stockMovements: [],
        giftCards: [],
        activityLogs: [],
        settings: newSettings,
        currentUser: newUser, // Auto login
        enableAI: true
    });

    return true;
  };

  const logout = () => {
    logActivity('LOGOUT', 'User logged out');
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const addProduct = (product: Product) => {
    setState(prev => ({ ...prev, products: [...prev.products, product] }));
    logActivity('ADD_PRODUCT', `Added product: ${product.name}`);
  };

  const editProduct = (product: Product) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === product.id ? product : p)
    }));
    logActivity('EDIT_PRODUCT', `Edited product: ${product.name}`);
  };

  // Soft Delete for Products
  const deleteProduct = (productId: string) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === productId ? { ...p, isArchived: true } : p)
    }));
    logActivity('DELETE_PRODUCT', `Archived product ID: ${productId}`);
  };

  const updateStock = (productId: string, quantity: number, type: 'carton' | 'unit', batchInfo?: {batch: string, expiry: string}) => {
    setState(prev => {
      let movementLog: StockMovement | null = null;

      const products = prev.products.map(p => {
        if (p.id === productId) {
          const unitsToAdd = type === 'carton' ? quantity * p.unitsPerCarton : quantity;
          const newTotal = p.totalUnits + unitsToAdd;
          
          // Create Audit Record
          movementLog = {
             id: Date.now().toString(),
             productId: p.id,
             type: 'restock',
             quantityChange: unitsToAdd,
             quantityType: type,
             balanceAfter: newTotal,
             timestamp: new Date().toISOString(),
             userId: prev.currentUser?.id || 'system',
             note: 'Manual Restock',
             batchNumber: batchInfo?.batch
          };

          return {
            ...p,
            totalUnits: newTotal,
            stockCartons: Math.floor(newTotal / p.unitsPerCarton),
            stockUnits: newTotal % p.unitsPerCarton,
            batchNumber: batchInfo?.batch || p.batchNumber,
            expiryDate: batchInfo?.expiry || p.expiryDate
          };
        }
        return p;
      });
      
      const newMovements = movementLog ? [...prev.stockMovements, movementLog] : prev.stockMovements;
      return { ...prev, products, stockMovements: newMovements };
    });
    logActivity('UPDATE_STOCK', `Updated stock for product ID: ${productId}`);
  };

  const recordSale = (sale: Sale) => {
    let totalProfit = 0;
    
    setState(prev => {
      const newMovements: StockMovement[] = [];

      // 1. Update Product Stock & Log Movements
      const products = prev.products.map(p => {
        const item = sale.items.find(i => i.id === p.id);
        if (item) {
          const unitsSold = item.quantityType === 'carton' 
            ? item.quantity * p.unitsPerCarton 
            : item.quantity;
            
          const cost = item.quantityType === 'carton' ? p.costPriceCarton : p.costPriceUnit;
          const revenue = item.quantityType === 'carton' ? p.cartonPrice : p.unitPrice;
          totalProfit += (revenue - cost) * item.quantity;

          const newTotal = p.totalUnits - unitsSold;

          // Audit Log
          newMovements.push({
             id: Date.now().toString() + Math.random(),
             productId: p.id,
             type: 'sale',
             quantityChange: -unitsSold, // Negative for sale
             quantityType: item.quantityType,
             balanceAfter: newTotal,
             timestamp: sale.date,
             userId: sale.cashierId,
             note: `Sale ID: ${sale.id}`
          });

          return {
            ...p,
            totalUnits: newTotal,
            stockCartons: Math.floor(newTotal / p.unitsPerCarton),
            stockUnits: newTotal % p.unitsPerCarton
          };
        }
        return p;
      });

      // 2. Credit Sale Logic
      let customers = prev.customers;
      let debtTransactions = prev.debtTransactions;

      if (sale.isCredit && sale.customerId) {
        customers = prev.customers.map(c => {
          if (c.id === sale.customerId) {
             return {
                ...c,
                totalDebt: c.totalDebt + sale.total,
                lastPurchaseDate: sale.date
             };
          }
          return c;
        });

        const transaction: DebtTransaction = {
            id: Date.now().toString(),
            customerId: sale.customerId,
            date: sale.date,
            type: 'credit',
            amount: sale.total,
            saleId: sale.id,
            note: `Credit Sale (Due: ${sale.dueDate || 'N/A'})`
        };
        debtTransactions = [...prev.debtTransactions, transaction];
      }

      // 3. Gift Card Logic
      let giftCards = prev.giftCards || [];
      if (sale.giftCardCode && sale.giftCardAmount) {
         giftCards = giftCards.map(gc => {
             if (gc.code === sale.giftCardCode) {
                 const newBalance = Math.max(0, gc.balance - (sale.giftCardAmount || 0));
                 return { 
                     ...gc, 
                     balance: newBalance,
                     status: newBalance <= 0 ? 'empty' : 'active'
                 };
             }
             return gc;
         });
      }
      
      const saleWithProfit = { ...sale, profit: totalProfit };
      
      return { 
          ...prev, 
          products, 
          sales: [...prev.sales, saleWithProfit], 
          customers, 
          debtTransactions, 
          giftCards,
          stockMovements: [...prev.stockMovements, ...newMovements] 
      };
    });
    logActivity('SALE', `Recorded sale: ₦${sale.total}`);
  };

  const addCustomer = (customer: Customer) => {
    setState(prev => ({ ...prev, customers: [...prev.customers, customer] }));
    logActivity('ADD_CUSTOMER', `Added customer: ${customer.name}`);
  };

  const updateCustomerDebt = (customerId: string, amount: number) => {
     setState(prev => {
       const customers = prev.customers.map(c => 
         c.id === customerId ? { ...c, totalDebt: c.totalDebt + amount } : c
       );
       return { ...prev, customers };
     });
  };

  const recordDebtPayment = (customerId: string, amount: number) => {
     setState(prev => {
        const customers = prev.customers.map(c => {
           if (c.id === customerId) {
              return {
                 ...c,
                 totalDebt: Math.max(0, c.totalDebt - amount),
              };
           }
           return c;
        });

        const transaction: DebtTransaction = {
            id: Date.now().toString(),
            customerId: customerId,
            date: new Date().toISOString(),
            type: 'payment',
            amount: amount,
            note: 'Debt Repayment'
        };

        return { ...prev, customers, debtTransactions: [...prev.debtTransactions, transaction] };
     });
     logActivity('DEBT_PAYMENT', `Recorded payment of ₦${amount} for customer ${customerId}`);
  };

  const getDebtHistory = (customerId: string) => {
      return state.debtTransactions.filter(t => t.customerId === customerId);
  };

  // Gift Cards
  const addGiftCard = (card: GiftCard) => {
    setState(prev => ({ ...prev, giftCards: [...(prev.giftCards || []), card] }));
    logActivity('ADD_GIFT_CARD', `Created gift card: ${card.code}`);
  };

  const deleteGiftCard = (id: string) => {
    setState(prev => ({ ...prev, giftCards: (prev.giftCards || []).filter(g => g.id !== id) }));
  };

  const getGiftCard = (code: string) => {
      return (state.giftCards || []).find(gc => gc.code === code && gc.status === 'active');
  };

  // Category Management
  const addCategory = (category: Category) => {
    setState(prev => ({ ...prev, categories: [...prev.categories, category] }));
    logActivity('ADD_CATEGORY', `Created category: ${category.name}`);
  };

  const editCategory = (category: Category) => {
    setState(prev => ({
       ...prev,
       categories: prev.categories.map(c => c.id === category.id ? category : c)
    }));
    logActivity('EDIT_CATEGORY', `Edited category: ${category.name}`);
  };

  // Soft Delete for Category
  const deleteCategory = (id: string) => {
    setState(prev => ({ 
        ...prev, 
        categories: prev.categories.map(c => c.id === id ? { ...c, isArchived: true } : c)
    }));
    logActivity('DELETE_CATEGORY', `Archived category ID: ${id}`);
  };

  // Supplier Management
  const addSupplier = (supplier: Supplier) => {
    setState(prev => ({ ...prev, suppliers: [...prev.suppliers, supplier] }));
    logActivity('ADD_SUPPLIER', `Added supplier: ${supplier.name}`);
  };

  const editSupplier = (supplier: Supplier) => {
    setState(prev => ({
       ...prev,
       suppliers: prev.suppliers.map(s => s.id === supplier.id ? supplier : s)
    }));
    logActivity('EDIT_SUPPLIER', `Edited supplier: ${supplier.name}`);
  };

  // Soft Delete for Supplier
  const deleteSupplier = (id: string) => {
    setState(prev => ({ 
        ...prev, 
        suppliers: prev.suppliers.map(s => s.id === id ? { ...s, isArchived: true } : s)
    }));
    logActivity('DELETE_SUPPLIER', `Archived supplier ID: ${id}`);
  };

  // Expense Management
  const addExpense = (expense: Expense) => {
    setState(prev => ({ ...prev, expenses: [...prev.expenses, expense] }));
    logActivity('ADD_EXPENSE', `Added expense: ${expense.amount} (${expense.category})`);
  };

  // Soft Delete for Expense
  const deleteExpense = (id: string) => {
    setState(prev => ({ 
        ...prev, 
        expenses: prev.expenses.map(e => e.id === id ? { ...e, isArchived: true } : e)
    }));
    logActivity('DELETE_EXPENSE', `Archived expense ID: ${id}`);
  };

  // User Management
  const addUser = (user: User) => {
    if (state.users.some(u => u.username === user.username)) return false;
    setState(prev => ({ ...prev, users: [...prev.users, user] }));
    logActivity('ADD_USER', `Created user: ${user.username} (${user.role})`);
    return true;
  };

  const updateUser = (user: User) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === user.id ? user : u)
    }));
    logActivity('EDIT_USER', `Updated user: ${user.username}`);
  };

  const deleteUser = (userId: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u)
    }));
    logActivity('TOGGLE_USER_STATUS', `Toggled status for user ID: ${userId}`);
  };
  
  const updateSettings = (newSettings: Partial<ShopSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  const toggleAI = (enable: boolean) => {
    setState(prev => ({ ...prev, enableAI: enable }));
  };

  const t = (key: string) => {
    return TRANSLATIONS[language][key] || key;
  };

  const hasPermission = (action: PermissionAction | string): boolean => {
    if (!state.currentUser) return false;
    
    const role = state.currentUser.role;
    const permissions = PERMISSIONS[role];
    
    if (permissions === '*') return true;
    return permissions.includes(action as PermissionAction);
  };

  return (
    <StoreContext.Provider value={{
      ...state,
      language,
      setLanguage,
      login,
      registerShop,
      logout,
      addProduct,
      editProduct,
      deleteProduct,
      updateStock,
      recordSale,
      addCustomer,
      updateCustomerDebt,
      recordDebtPayment,
      getDebtHistory,
      addGiftCard,
      deleteGiftCard,
      getGiftCard,
      addCategory,
      editCategory,
      deleteCategory,
      addSupplier,
      editSupplier,
      deleteSupplier,
      addExpense,
      deleteExpense,
      t,
      hasPermission,
      addUser,
      updateUser,
      deleteUser,
      updateSettings,
      toggleAI,
      isOnline,
      isSyncing,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
