import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, User, Product, Sale, Customer, Language, UserRole, PermissionAction, PERMISSIONS, ActivityLog, DebtTransaction, ShopSettings, GiftCard, Category, Supplier, Expense, StockMovement, RegistrationData, Subscription, SubscriptionPlan, ShopSummary } from '../types';
import { loadStateFromLocalStorage, saveStateToLocalStorage } from '../services/storage';
import { TRANSLATIONS, INITIAL_CATEGORIES } from '../constants';
import { createTrialSubscription, checkSubscriptionStatus, isSubscriptionActive, extendSubscription, verifySubscriptionIntegrity, getDaysRemaining, getSubscriptionPrice } from '../services/subscription';
import { validateTimeIntegrity, initializeTimeAnchors, addTimeAnchor } from '../services/timeIntegrity';
import { isOnline, generateUUID } from '../services/supabase/client';
import * as db from '../services/supabase/database';
import { isValidUUID } from '../utils/uuid';
import { 
  queueOperation, 
  getPendingOperations, 
  removeOperation, 
  markOperationFailed,
  updateLastSyncAttempt,
  updateLastSuccessfulSync,
  hasPendingOperations,
  getPendingCount,
  SyncOperation
} from '../services/syncQueue';

interface StoreContextType extends AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  login: (username: string, pin: string) => Promise<boolean>;
  registerShop: (data: RegistrationData) => Promise<boolean>;
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
  deleteUser: (userId: string) => void;

  // Settings & System
  updateSettings: (settings: Partial<ShopSettings>) => void;
  isAIEnabledForCurrentShop: () => boolean;
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  
  // Subscription Management
  getSubscription: () => Subscription | null;
  checkSubscription: () => boolean;
  isAccountLocked: () => boolean;
  processPayment: (plan: SubscriptionPlan, paymentReference: string, paymentAmount: number, couponCode?: string, discountAmount?: number, originalAmount?: number) => Promise<boolean>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadStateFromLocalStorage());
  const [language, setLanguage] = useState<Language>('en');
  const [online, setOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(getPendingCount());

  // Load language from Supabase (per user) or localStorage fallback
  useEffect(() => {
    const loadLanguage = async () => {
      if (state.currentUser?.id && state.settings?.shopId && isOnline()) {
        try {
          const lang = await db.getUserPreference(
            state.settings.shopId,
            state.currentUser.id,
            'language'
          );
          if (lang && ['en', 'ha', 'yo', 'ig', 'ar', 'fr'].includes(lang)) {
            setLanguage(lang as Language);
            return;
          }
        } catch (error) {
          console.error('Failed to load language from Supabase:', error);
        }
      }
      
      // Fallback to localStorage
      const storedLang = localStorage.getItem('shopos_lang') as Language;
      if (storedLang && ['en', 'ha', 'yo', 'ig', 'ar', 'fr'].includes(storedLang)) {
        setLanguage(storedLang);
      }
    };
    
    loadLanguage();
  }, [state.currentUser?.id, state.settings?.shopId]);

  // Persist state changes to localStorage
  useEffect(() => {
    saveStateToLocalStorage(state);
  }, [state]);

  // Update document direction and save language to Supabase
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Save to Supabase if we have user and shop
    if (state.currentUser?.id && state.settings?.shopId && isOnline()) {
      db.setUserPreference(
        state.settings.shopId,
        state.currentUser.id,
        'language',
        language
      ).catch(err => console.error('Failed to save language to Supabase:', err));
    }
    
    // Also save to localStorage as backup
    localStorage.setItem('shopos_lang', language);
  }, [language, state.currentUser?.id, state.settings?.shopId]);

  // Network Status Listeners
  useEffect(() => {
    const handleOnline = () => {
       setOnline(true);
       setIsSyncing(true);
       // Trigger sync when back online
       syncToSupabase().finally(() => {
         setIsSyncing(false);
         setPendingSyncCount(getPendingCount());
       });
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state]);
  
  // Update pending sync count periodically
  useEffect(() => {
    const updatePendingCount = () => {
      setPendingSyncCount(getPendingCount());
    };
    
    // Update immediately
    updatePendingCount();
    
    // Check every 5 seconds
    const interval = setInterval(updatePendingCount, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Auto-sync pending operations periodically when online
  useEffect(() => {
    if (!canSyncToSupabase()) return;
    
    const pendingOps = getPendingOperations();
    if (pendingOps.length === 0) return;
    
    // Sync every 10 seconds if there are pending operations
    const syncInterval = setInterval(() => {
      if (canSyncToSupabase() && getPendingOperations().length > 0) {
        console.log('🔄 Auto-syncing pending operations...');
        syncToSupabase();
      }
    }, 10000);
    
    return () => clearInterval(syncInterval);
  }, [state.settings?.shopId, online]);

  // Helper: Check if we can sync to Supabase (online + valid UUID shopId)
  const canSyncToSupabase = (): boolean => {
    const shopId = state.settings?.shopId;
    if (!shopId || shopId === 'default_shop') return false;
    if (!isOnline()) return false;
    if (!isValidUUID(shopId)) {
      // Legacy shop ID - skip Supabase
      return false;
    }
    return true;
  };

  // Process a single sync operation
  const processSyncOperation = async (operation: SyncOperation): Promise<boolean> => {
    try {
      switch (operation.type) {
        case 'CREATE_PRODUCT':
          await db.createProduct(operation.data);
          break;
        case 'UPDATE_PRODUCT':
          await db.updateProduct(operation.entityId!, operation.data);
          break;
        case 'CREATE_SALE':
          await db.createSale(operation.data);
          break;
        case 'CREATE_CUSTOMER':
          await db.createCustomer(operation.data);
          break;
        case 'UPDATE_CUSTOMER':
          await db.updateCustomer(operation.entityId!, operation.data);
          break;
        case 'CREATE_CATEGORY':
          await db.createCategory(operation.data);
          break;
        case 'UPDATE_CATEGORY':
          await db.updateCategory(operation.entityId!, operation.data);
          break;
        case 'CREATE_SUPPLIER':
          await db.createSupplier(operation.data);
          break;
        case 'UPDATE_SUPPLIER':
          await db.updateSupplier(operation.entityId!, operation.data);
          break;
        case 'CREATE_EXPENSE':
          await db.createExpense(operation.data);
          break;
        case 'UPDATE_EXPENSE':
          await db.updateExpense(operation.entityId!, operation.data);
          break;
        case 'CREATE_GIFT_CARD':
          await db.createGiftCard(operation.data);
          break;
        case 'UPDATE_GIFT_CARD':
          await db.updateGiftCard(operation.entityId!, operation.data);
          break;
        case 'DELETE_GIFT_CARD':
          await db.deleteGiftCardDb(operation.entityId!);
          break;
        case 'CREATE_STOCK_MOVEMENT':
          await db.createStockMovement(operation.data);
          break;
        case 'CREATE_DEBT_TRANSACTION':
          await db.createDebtTransaction(operation.data);
          break;
        case 'CREATE_USER':
          await db.createUser(operation.data);
          break;
        case 'UPDATE_USER':
          await db.updateUser(operation.entityId!, operation.data);
          break;
        case 'UPDATE_SETTINGS':
          await db.updateShopSettings(operation.entityId!, operation.data);
          break;
        case 'CREATE_ACTIVITY_LOG':
          await db.createActivityLog(operation.data);
          break;
        case 'UPDATE_SUBSCRIPTION':
          await db.updateSubscription(operation.entityId!, operation.data);
          break;
        case 'CREATE_PAYMENT':
          await db.createPaymentRecordDb(operation.data);
          break;
        default:
          console.warn(`Unknown sync operation type: ${operation.type}`);
          return true; // Mark as success to remove from queue
      }
      return true;
    } catch (error: any) {
      // Handle duplicate key errors - mark as success since data already exists
      if (error?.message?.includes('duplicate key') || error?.code === '23505') {
        console.log(`ℹ️ ${operation.type} already exists in Supabase, marking as synced:`, operation.entityId || operation.id);
        return true; // Mark as success to remove from queue
      }
      console.error(`Failed to sync ${operation.type}:`, error);
      return false;
    }
  };

  // Sync data to Supabase when online
  const syncToSupabase = async () => {
    if (!canSyncToSupabase()) {
      console.log('⚠️ Cannot sync: offline or invalid shop ID');
      return;
    }
    
    const pendingOps = getPendingOperations();
    if (pendingOps.length === 0) {
      console.log('✅ No pending operations to sync');
      updateLastSuccessfulSync();
      setPendingSyncCount(0);
      return;
    }
    
    console.log(`🔄 Syncing ${pendingOps.length} pending operations to Supabase...`);
    updateLastSyncAttempt();
    setIsSyncing(true);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const operation of pendingOps) {
      try {
        const success = await processSyncOperation(operation);
        if (success) {
          removeOperation(operation.id);
          successCount++;
        } else {
          markOperationFailed(operation.id);
          failCount++;
        }
      } catch (error) {
        console.error(`Error processing operation ${operation.type}:`, error);
        markOperationFailed(operation.id);
        failCount++;
      }
    }
    
    // Update pending count after sync
    setPendingSyncCount(getPendingCount());
    
    if (failCount === 0) {
      updateLastSuccessfulSync();
      console.log(`✅ Sync complete: ${successCount} operations synced successfully`);
    } else {
      console.log(`⚠️ Sync partial: ${successCount} succeeded, ${failCount} failed (will retry)`);
    }
    
    setIsSyncing(false);
  };

  // Log activity with Supabase sync
  const logActivity = async (action: string, details: string) => {
    if (!state.currentUser) return;
    const shopId = state.settings?.shopId || 'unknown';
    const log: ActivityLog = {
      id: generateUUID(),
      shopId: shopId,
      userId: state.currentUser.id,
      userName: state.currentUser.fullName,
      action,
      details,
      createdAt: new Date().toISOString()
    };
    
    setState(prev => ({ ...prev, activityLogs: [log, ...prev.activityLogs] }));
    
    // Sync to Supabase or queue for later
    if (shopId !== 'unknown' && isValidUUID(shopId)) {
      if (canSyncToSupabase()) {
        db.createActivityLog(log).catch(err => {
          console.error('Failed to sync activity log:', err);
          queueOperation('CREATE_ACTIVITY_LOG', log, log.id);
        });
      } else {
        queueOperation('CREATE_ACTIVITY_LOG', log, log.id);
      }
    }
  };

  // Initialize test shop with sample data
  const initializeTestShop = async (testShopId: string): Promise<void> => {
    const {
      createTestShopSettings,
      createTestUsers,
      createTestCategories,
      createTestSuppliers,
      createTestProducts,
      createTestCustomers,
      createTestSales,
      createTestStockMovements,
      createTestExpenses,
      createTestSubscription
    } = await import('../services/testData');
    
    const settings = createTestShopSettings();
    const users = createTestUsers();
    const categories = createTestCategories();
    const suppliers = createTestSuppliers();
    const products = createTestProducts(categories, suppliers);
    const customers = createTestCustomers();
    const sales = createTestSales(products, customers, users);
    const stockMovements = createTestStockMovements(products, users);
    const expenses = createTestExpenses(users);
    const subscription = createTestSubscription();
    
    // Update local state
    setState({
      users,
      products,
      categories,
      suppliers,
      expenses,
      sales,
      customers,
      debtTransactions: [],
      stockMovements,
      giftCards: [],
      activityLogs: [],
      settings,
      currentUser: null,
      subscription,
      payments: []
    });
    
    // Save to local storage
    saveStateToLocalStorage({
      users,
      products,
      categories,
      suppliers,
      expenses,
      sales,
      customers,
      debtTransactions: [],
      stockMovements,
      giftCards: [],
      activityLogs: [],
      settings,
      currentUser: null,
      subscription,
      payments: []
    });
    
    // Sync to Supabase if online
    if (isOnline() && isValidUUID(testShopId)) {
      try {
        console.log('☁️ Syncing test shop to Supabase...');
        
        // Create shop settings
        await db.createShopSettings(settings);
        
        // Create users
        for (const user of users) {
          await db.createUser(user);
        }
        
        // Create categories
        for (const cat of categories) {
          await db.createCategory(cat);
        }
        
        // Create suppliers
        for (const supplier of suppliers) {
          await db.createSupplier(supplier);
        }
        
        // Create products
        for (const product of products) {
          await db.createProduct(product);
        }
        
        // Create customers
        for (const customer of customers) {
          await db.createCustomer(customer);
        }
        
        // Create sales
        for (const sale of sales) {
          await db.createSale(sale);
        }
        
        // Create stock movements
        for (const movement of stockMovements) {
          await db.createStockMovement(movement);
        }
        
        // Create expenses
        for (const expense of expenses) {
          await db.createExpense(expense);
        }
        
        // Create subscription
        await db.createSubscription(subscription);
        
        console.log('✅ Test shop synced to Supabase');
      } catch (error) {
        console.error('❌ Failed to sync test shop to Supabase:', error);
      }
    }
  };

  const login = async (usernameOrEmail: string, pin: string): Promise<boolean> => {
    // Trim whitespace to fix browser autofill issues
    const trimmedUsername = usernameOrEmail.trim();
    const trimmedPin = pin.trim();
    
    let user: User | null = null;
    let shopSettings: ShopSettings | null = null;
    let subscription: Subscription | null = null;
    let allShopUsers: User[] = [];
    
    // Check if this is a test account login
    const { TEST_ACCOUNTS, getTestShopId, isTestAccount } = await import('../services/testData');
    const testAccount = TEST_ACCOUNTS.find(acc => 
      acc.username.toLowerCase() === trimmedUsername.toLowerCase() && acc.password === trimmedPin
    );
    
    // If test account, ensure test shop exists
    if (testAccount) {
      const testShopId = getTestShopId();
      console.log('🧪 Test account login detected - initializing test shop...');
      
      try {
        // Check if test shop exists in Supabase
        if (isOnline()) {
          const existingShop = await db.getShopSettings(testShopId).catch(() => null);
          
          if (!existingShop) {
            console.log('📦 Creating test shop with sample data...');
            await initializeTestShop(testShopId);
          }
        } else {
          // Offline: Check local storage
          const localState = loadStateFromLocalStorage();
          if (!localState.settings || localState.settings.shopId !== testShopId) {
            console.log('📦 Initializing test shop locally...');
            await initializeTestShop(testShopId);
          }
        }
      } catch (error) {
        console.error('❌ Failed to initialize test shop:', error);
      }
    }
    
    // PRIMARY: Try Supabase authentication first (if online)
    if (isOnline()) {
      try {
        console.log('🔐 Authenticating via Supabase...');
        const authResult = await db.authenticateUser(trimmedUsername, trimmedPin);
        
        if (authResult.user) {
          user = authResult.user;
          shopSettings = authResult.shopSettings;
          
          // Load full shop data if we have a valid shop
          if (user.shopId && isValidUUID(user.shopId)) {
            console.log('☁️ Loading shop data from Supabase...');
            const shopData = await db.loadShopDataAfterAuth(user.shopId);
            allShopUsers = shopData.users;
            subscription = shopData.subscription;
            
            // Also load full shop data
            const fullShopData = await db.loadAllShopData(user.shopId);
            
            // CRITICAL: REPLACE all data with current shop's data to prevent data mixing
            // Do NOT merge with previous shop's data
            setState(prev => ({
              ...prev,
              // Always use the loaded shop data, or empty arrays if none exists
              users: fullShopData.users || [],
              products: fullShopData.products || [],
              categories: fullShopData.categories || [],
              suppliers: fullShopData.suppliers || [],
              expenses: fullShopData.expenses || [],
              sales: fullShopData.sales || [],
              customers: fullShopData.customers || [],
              debtTransactions: fullShopData.debtTransactions || [],
              stockMovements: fullShopData.stockMovements || [],
              giftCards: fullShopData.giftCards || [],
              activityLogs: fullShopData.activityLogs || [],
              settings: fullShopData.settings || shopSettings || prev.settings,
              subscription: fullShopData.subscription || subscription || prev.subscription,
              payments: fullShopData.payments || [],
            }));
            
            console.log('✅ Shop data loaded from Supabase');
          }
        }
      } catch (error) {
        console.error('Supabase authentication failed:', error);
      }
    }
    
    // FALLBACK: Try local users if Supabase auth failed or offline
    if (!user) {
      console.log('🔐 Trying local authentication...');
      user = state.users.find(u => {
        const matchesCredential = 
          u.username.toLowerCase() === trimmedUsername.toLowerCase() ||
          (u.email && u.email.toLowerCase() === trimmedUsername.toLowerCase());
        return matchesCredential && u.password === trimmedPin;
      }) || null;
      
      // If local user found, filter all data by their shopId to prevent data mixing
      if (user && user.shopId) {
        console.log('🔍 Filtering local data by shopId:', user.shopId);
        const userShopId = user.shopId;
        
        // Filter all data to only include current shop's data
        setState(prev => ({
          ...prev,
          users: prev.users.filter(u => u.shopId === userShopId),
          products: prev.products.filter(p => p.shopId === userShopId),
          categories: prev.categories.filter(c => c.shopId === userShopId),
          suppliers: prev.suppliers.filter(s => s.shopId === userShopId),
          expenses: prev.expenses.filter(e => e.shopId === userShopId),
          sales: prev.sales.filter(s => s.shopId === userShopId),
          customers: prev.customers.filter(c => c.shopId === userShopId),
          debtTransactions: prev.debtTransactions.filter(dt => dt.shopId === userShopId),
          stockMovements: prev.stockMovements.filter(sm => sm.shopId === userShopId),
          giftCards: prev.giftCards.filter(gc => gc.shopId === userShopId),
          activityLogs: prev.activityLogs.filter(al => al.shopId === userShopId),
          settings: prev.settings?.shopId === userShopId ? prev.settings : null,
          subscription: prev.subscription?.shopId === userShopId ? prev.subscription : null,
          payments: prev.payments.filter(p => p.shopId === userShopId),
        }));
        
        console.log('✅ Local data filtered by shopId');
      }
    }
    
    // Process authenticated user
    if (user) {
      if (user.status === 'inactive') {
        console.log('❌ User account is inactive');
        return false;
      }
      
      // Use subscription from state if not loaded from Supabase
      const currentSubscription = subscription || state.subscription;
      
      // Check subscription status
      if (user.shopId && currentSubscription) {
        const subscriptionStatus = checkSubscriptionStatus(currentSubscription);
        if (subscriptionStatus === 'expired') {
          const updatedUser = { ...user, lastLogin: new Date().toISOString() };
          setState(prev => ({ 
            ...prev, 
            currentUser: updatedUser,
            users: prev.users.some(u => u.id === user!.id) 
              ? prev.users.map(u => u.id === user!.id ? updatedUser : u)
              : [...prev.users, updatedUser]
          }));
          console.log('✅ Login successful (subscription expired)');
          return true;
        }
      }
      
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      
      // If we have a shopId, ensure we reload fresh data from Supabase (if online) to prevent data mixing
      if (user.shopId && isValidUUID(user.shopId) && isOnline()) {
        try {
          console.log('🔄 Reloading fresh shop data after login...');
          const freshShopData = await db.loadAllShopData(user.shopId);
          
          // REPLACE all data with fresh shop data
          setState(prev => ({
            ...prev,
            currentUser: updatedUser,
            users: freshShopData.users || [],
            products: freshShopData.products || [],
            categories: freshShopData.categories || [],
            suppliers: freshShopData.suppliers || [],
            expenses: freshShopData.expenses || [],
            sales: freshShopData.sales || [],
            customers: freshShopData.customers || [],
            debtTransactions: freshShopData.debtTransactions || [],
            stockMovements: freshShopData.stockMovements || [],
            giftCards: freshShopData.giftCards || [],
            activityLogs: freshShopData.activityLogs || [],
            settings: freshShopData.settings || prev.settings,
            subscription: freshShopData.subscription || prev.subscription,
            payments: freshShopData.payments || [],
          }));
          
          console.log('✅ Fresh shop data loaded');
        } catch (error) {
          console.error('Failed to reload fresh shop data:', error);
          // Fallback to setting user only
          setState(prev => ({ 
            ...prev, 
            currentUser: updatedUser,
            users: prev.users.some(u => u.id === user!.id) 
              ? prev.users.map(u => u.id === user!.id ? updatedUser : u)
              : [...prev.users, updatedUser]
          }));
        }
      } else {
        // Offline or no valid shopId - just set user
        setState(prev => ({ 
          ...prev, 
          currentUser: updatedUser,
          users: prev.users.some(u => u.id === user!.id) 
            ? prev.users.map(u => u.id === user!.id ? updatedUser : u)
            : [...prev.users, updatedUser]
        }));
      }
      
      // Update last login in Supabase
      if (isOnline() && user.shopId && isValidUUID(user.shopId)) {
        db.updateUser(user.id, { lastLogin: updatedUser.lastLogin }).catch(err => 
          console.error('Failed to update last login:', err)
        );
      }
      
      console.log('✅ Login successful');
      return true;
    }
    
    console.log('❌ Login failed - invalid credentials');
    return false;
  };

  const registerShop = async (data: RegistrationData): Promise<boolean> => {
    const shopId = generateUUID();
    const userId = generateUUID();
    const now = new Date().toISOString();
    
    let baseUsername = data.email.split('@')[0];
    
    const newUser: User = {
        id: userId,
        shopId: shopId,
        username: baseUsername,
        password: data.password,
        fullName: data.fullName,
        email: data.email,
        role: 'superadmin',
        status: 'active',
        language: 'en',
        createdAt: now,
        lastLogin: now
    };

    const newSettings: ShopSettings = {
        shopId: shopId,
        businessName: data.shopName,
        country: data.country,
        state: data.state,
        phone: '',
        address: '',
        currency: '₦',
        receiptFooter: 'Thank you for your patronage!',
        taxRate: 0,
        autoBackup: 'off',
        createdAt: now,
        updatedAt: now
    };

    const subscription = createTrialSubscription(shopId);
    initializeTimeAnchors();
    
    // Create default categories with shopId
    const categoriesWithShopId: Category[] = INITIAL_CATEGORIES.map(cat => ({
      ...cat,
      id: generateUUID(),
      shopId: shopId,
      createdAt: now
    }));
    
    // Update local state first
    setState({
        users: [newUser],
        products: [],
        categories: categoriesWithShopId,
        suppliers: [],
        expenses: [],
        sales: [],
        customers: [],
        debtTransactions: [],
        stockMovements: [],
        giftCards: [],
        activityLogs: [],
        settings: newSettings,
        currentUser: newUser,
        subscription: subscription,
        payments: []
    });
    
    // Sync to Supabase if online
    if (isOnline()) {
      try {
        console.log('☁️ Creating shop in Supabase...');
        
        // Create shop settings
        await db.createShopSettings(newSettings);
        
        // Create user
        await db.createUser(newUser);
        
        // Create categories
        for (const cat of categoriesWithShopId) {
          await db.createCategory(cat);
        }
        
        // Create subscription
        await db.createSubscription(subscription);
        
        // Create shop summary
        const shopSummary: ShopSummary = {
          shopId: shopId,
          shopName: data.shopName,
          ownerEmail: data.email,
          ownerName: data.fullName,
          country: data.country,
          state: data.state,
          registeredDate: now,
          subscriptionStatus: checkSubscriptionStatus(subscription),
          subscriptionPlan: subscription.plan,
          subscriptionEndDate: subscription.subscriptionEndDate,
          trialEndDate: subscription.trialEndDate,
          totalRevenue: 0,
          isActive: checkSubscriptionStatus(subscription) === 'trial' || checkSubscriptionStatus(subscription) === 'active',
          aiEnabled: true
        };
        await db.createShopSummaryDb(shopSummary);
        
        console.log('✅ Shop created in Supabase');
      } catch (error) {
        console.error('❌ Failed to create shop in Supabase:', error);
        // Continue with local-only operation
      }
    }
    
    // Also update admin storage
    import('../services/adminStorage').then(({ addShopToAdminData }) => {
      const shopSummary: ShopSummary = {
        shopId: shopId,
        shopName: data.shopName,
        ownerEmail: data.email,
        ownerName: data.fullName,
        country: data.country,
        state: data.state,
        registeredDate: now,
        subscriptionStatus: checkSubscriptionStatus(subscription),
        subscriptionPlan: subscription.plan,
        subscriptionEndDate: subscription.subscriptionEndDate,
        trialEndDate: subscription.trialEndDate,
        totalRevenue: 0,
        isActive: checkSubscriptionStatus(subscription) === 'trial' || checkSubscriptionStatus(subscription) === 'active',
        aiEnabled: true
      };
      addShopToAdminData(shopSummary);
    });

    return true;
  };

  const logout = () => {
    logActivity('LOGOUT', 'User logged out');
    // Clear current user but keep shop data for potential re-login
    // Data will be filtered by shopId on next login
    setState(prev => ({ ...prev, currentUser: null }));
    // Note: We keep remembered username in localStorage so user doesn't have to re-enter it
    // Only password needs to be re-entered for security
  };

  const addProduct = async (product: Product) => {
    // Ensure product has shopId
    const productWithShop = {
      ...product,
      shopId: product.shopId || state.settings?.shopId || '',
      createdAt: product.createdAt || new Date().toISOString()
    };
    
    // Check for duplicate barcode in local state
    const existingProduct = state.products.find(
      p => p.barcode === productWithShop.barcode && 
           p.shopId === productWithShop.shopId && 
           !p.isArchived &&
           productWithShop.barcode // Only check if barcode is not empty
    );
    
    if (existingProduct) {
      console.warn(`Product with barcode "${productWithShop.barcode}" already exists: ${existingProduct.name}`);
    }
    
    setState(prev => ({ ...prev, products: [...prev.products, productWithShop] }));
    logActivity('ADD_PRODUCT', `Added product: ${product.name}`);
    
    // Sync to Supabase or queue for later
    if (productWithShop.shopId && isValidUUID(productWithShop.shopId)) {
      if (canSyncToSupabase()) {
        db.createProduct(productWithShop).catch(err => {
          if (err.message?.includes('duplicate key')) {
            console.error(`❌ Product "${product.name}" has a duplicate barcode. Saved locally only.`);
          } else {
            console.error('Failed to sync product:', err);
            // Queue for retry
            queueOperation('CREATE_PRODUCT', productWithShop, productWithShop.id);
          }
        });
      } else {
        // Offline - queue for sync
        queueOperation('CREATE_PRODUCT', productWithShop, productWithShop.id);
      }
    }
  };

  const editProduct = async (product: Product) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === product.id ? product : p)
    }));
    logActivity('EDIT_PRODUCT', `Edited product: ${product.name}`);
    
    // Sync to Supabase or queue for later
    if (isValidUUID(state.settings?.shopId || '')) {
      if (canSyncToSupabase()) {
        db.updateProduct(product.id, product).catch(err => {
          console.error('Failed to sync product update:', err);
          queueOperation('UPDATE_PRODUCT', product, product.id);
        });
      } else {
        queueOperation('UPDATE_PRODUCT', product, product.id);
      }
    }
  };

  const deleteProduct = async (productId: string) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === productId ? { ...p, isArchived: true } : p)
    }));
    logActivity('DELETE_PRODUCT', `Archived product ID: ${productId}`);
    
    // Sync to Supabase or queue for later
    if (isValidUUID(state.settings?.shopId || '')) {
      if (canSyncToSupabase()) {
        db.updateProduct(productId, { isArchived: true }).catch(err => {
          console.error('Failed to sync product deletion:', err);
          queueOperation('UPDATE_PRODUCT', { isArchived: true }, productId);
        });
      } else {
        queueOperation('UPDATE_PRODUCT', { isArchived: true }, productId);
      }
    }
  };

  const updateStock = async (productId: string, quantity: number, type: 'carton' | 'unit', batchInfo?: {batch: string, expiry: string}) => {
    const shopId = state.settings?.shopId || '';
    const canSync = canSyncToSupabase();
    const hasValidShopId = isValidUUID(shopId);
    
    console.log('📦 Updating stock...', { productId, quantity, type, shopId, canSync, hasValidShopId });

    // Find the product and calculate updates BEFORE setState
    const product = state.products.find(p => p.id === productId);
    if (!product) {
      console.error('❌ Product not found:', productId);
      return;
    }
    
    const unitsToAdd = type === 'carton' ? quantity * product.unitsPerCarton : quantity;
    const newTotal = product.totalUnits + unitsToAdd;
    
    // Create the movement log
    const movementLog: StockMovement = {
      id: generateUUID(),
      shopId: shopId,
      productId: product.id,
      type: 'restock',
      quantityChange: unitsToAdd,
      quantityType: type,
      balanceAfter: newTotal,
      createdAt: new Date().toISOString(),
      userId: state.currentUser?.id || 'system',
      note: 'Manual Restock',
      batchNumber: batchInfo?.batch
    };
    
    // Create the product update
    const productUpdate = {
      totalUnits: newTotal,
      stockCartons: Math.floor(newTotal / product.unitsPerCarton),
      stockUnits: newTotal % product.unitsPerCarton,
      batchNumber: batchInfo?.batch || product.batchNumber,
      expiryDate: batchInfo?.expiry || product.expiryDate
    };
    
    // Update local state
    setState(prev => {
      const products = prev.products.map(p => {
        if (p.id === productId) {
          return { ...p, ...productUpdate };
        }
        return p;
      });
      
      console.log('✅ Local stock updated', { 
        productId, 
        oldTotal: product.totalUnits, 
        newTotal: productUpdate.totalUnits 
      });
      
      return { 
        ...prev, 
        products, 
        stockMovements: [...prev.stockMovements, movementLog] 
      };
    });
    
    // Log activity
    logActivity('UPDATE_STOCK', `Updated stock for product ID: ${productId}`);
    
    // Sync to Supabase AFTER state update
    if (hasValidShopId) {
      if (canSync) {
        console.log('☁️ Syncing stock update to Supabase...');
        try {
          await db.createStockMovement(movementLog);
          console.log('✅ Stock movement synced');
          
          await db.updateProduct(productId, productUpdate);
          console.log('✅ Product stock synced');
        } catch (error) {
          console.error('❌ Failed to sync stock update:', error);
          queueOperation('CREATE_STOCK_MOVEMENT', movementLog, movementLog.id);
          queueOperation('UPDATE_PRODUCT', productUpdate, productId);
        }
      } else {
        console.log('📴 Offline - queuing stock update');
        queueOperation('CREATE_STOCK_MOVEMENT', movementLog, movementLog.id);
        queueOperation('UPDATE_PRODUCT', productUpdate, productId);
      }
    }
  };

  const recordSale = async (sale: Sale) => {
    const shopId = state.settings?.shopId || '';
    const canSync = canSyncToSupabase();
    const hasValidShopId = isValidUUID(shopId);
    
    console.log('📝 Recording sale...', { shopId, canSync, hasValidShopId, saleId: sale.id });
    
    // Ensure sale has required fields
    const saleWithShop: Sale = {
      ...sale,
      shopId: shopId,
      createdAt: sale.createdAt || new Date().toISOString()
    };
    
    // Pre-calculate profit and prepare all data BEFORE setState
    let calculatedProfit = 0;
    const newMovements: StockMovement[] = [];
    const updatedProducts: Map<string, { totalUnits: number; stockCartons: number; stockUnits: number }> = new Map();
    
    // Calculate profit and stock changes from current state
    saleWithShop.items.forEach(item => {
      const product = state.products.find(p => p.id === item.id);
      if (product) {
        const unitsSold = item.quantityType === 'carton' 
          ? item.quantity * product.unitsPerCarton 
          : item.quantity;
          
        const cost = item.quantityType === 'carton' ? product.costPriceCarton : product.costPriceUnit;
        const revenue = item.quantityType === 'carton' ? product.cartonPrice : product.unitPrice;
        calculatedProfit += (revenue - cost) * item.quantity;
        
        const newTotal = Math.max(0, product.totalUnits - unitsSold);
        
        // Create stock movement
        const movement: StockMovement = {
          id: generateUUID(),
          shopId: shopId,
          productId: product.id,
          type: 'sale',
          quantityChange: -unitsSold,
          quantityType: item.quantityType,
          balanceAfter: newTotal,
          createdAt: saleWithShop.date,
          userId: saleWithShop.cashierId,
          note: `Sale ID: ${saleWithShop.id}`
        };
        newMovements.push(movement);
        
        // Track product updates
        updatedProducts.set(product.id, {
          totalUnits: newTotal,
          stockCartons: Math.floor(newTotal / product.unitsPerCarton),
          stockUnits: newTotal % product.unitsPerCarton
        });
      }
    });
    
    const saleWithProfit: Sale = { ...saleWithShop, profit: calculatedProfit };
    
    // Prepare debt transaction if credit sale
    let debtTransaction: DebtTransaction | null = null;
    if (saleWithShop.isCredit && saleWithShop.customerId) {
      debtTransaction = {
        id: generateUUID(),
        shopId: shopId,
        customerId: saleWithShop.customerId,
        date: saleWithShop.date,
        createdAt: saleWithShop.date,
        type: 'credit',
        amount: saleWithShop.total,
        saleId: saleWithShop.id,
        note: `Credit Sale (Due: ${saleWithShop.dueDate || 'N/A'})`
      };
    }
    
    // Update local state synchronously
    setState(prev => {
      // Update products
      const products = prev.products.map(p => {
        const update = updatedProducts.get(p.id);
        if (update) {
          return { ...p, ...update };
        }
        return p;
      });
      
      // Update customers for credit sales
      let customers = prev.customers;
      if (saleWithShop.isCredit && saleWithShop.customerId) {
        customers = prev.customers.map(c => {
          if (c.id === saleWithShop.customerId) {
            return {
              ...c,
              totalDebt: c.totalDebt + saleWithShop.total,
              lastPurchaseDate: saleWithShop.date
            };
          }
          return c;
        });
      }
      
      // Update gift cards
      let giftCards = prev.giftCards || [];
      if (saleWithShop.giftCardCode && saleWithShop.giftCardAmount) {
        giftCards = giftCards.map(gc => {
          if (gc.code === saleWithShop.giftCardCode) {
            const newBalance = Math.max(0, gc.balance - (saleWithShop.giftCardAmount || 0));
            return { 
              ...gc, 
              balance: newBalance,
              status: newBalance <= 0 ? 'empty' as const : 'active' as const
            };
          }
          return gc;
        });
      }
      
      console.log('✅ Local state updated', { 
        productsUpdated: updatedProducts.size, 
        movementsCreated: newMovements.length,
        saleTotal: saleWithProfit.total,
        profit: saleWithProfit.profit
      });
      
      return { 
        ...prev, 
        products, 
        sales: [...prev.sales, saleWithProfit], 
        customers, 
        debtTransactions: debtTransaction 
          ? [...prev.debtTransactions, debtTransaction] 
          : prev.debtTransactions, 
        giftCards,
        stockMovements: [...prev.stockMovements, ...newMovements] 
      };
    });
    
    // Log activity
    logActivity('SALE', `Recorded sale: ₦${saleWithShop.total}`);
    
    // Sync to Supabase AFTER state update (not inside setState)
    if (hasValidShopId && canSync) {
      console.log('☁️ Syncing sale to Supabase...');
      
      try {
        // Create sale in Supabase
        await db.createSale(saleWithProfit);
        console.log('✅ Sale synced to Supabase');
        
        // Create stock movements
        for (const movement of newMovements) {
          await db.createStockMovement(movement);
        }
        console.log(`✅ ${newMovements.length} stock movements synced`);
        
        // Update product stock levels
        for (const [productId, stockUpdate] of updatedProducts) {
          await db.updateProduct(productId, stockUpdate);
        }
        console.log(`✅ ${updatedProducts.size} product stock levels updated`);
        
        // Handle credit sale sync
        if (debtTransaction) {
          await db.createDebtTransaction(debtTransaction);
          const customer = state.customers.find(c => c.id === saleWithShop.customerId);
          if (customer) {
            await db.updateCustomer(saleWithShop.customerId!, {
              totalDebt: customer.totalDebt + saleWithShop.total,
              lastPurchaseDate: saleWithShop.date
            });
          }
          console.log('✅ Debt transaction synced');
        }
        
        // Handle gift card sync
        if (saleWithShop.giftCardCode && saleWithShop.giftCardAmount) {
          const gc = state.giftCards?.find(g => g.code === saleWithShop.giftCardCode);
          if (gc) {
            const newBalance = Math.max(0, gc.balance - (saleWithShop.giftCardAmount || 0));
            await db.updateGiftCard(gc.id, { 
              balance: newBalance, 
              status: newBalance <= 0 ? 'empty' : 'active' 
            });
            console.log('✅ Gift card balance updated');
          }
        }
        
        console.log('✅ All sale data synced to Supabase');
        // Update pending count and trigger sync of any other pending operations
        setPendingSyncCount(getPendingCount());
        // Trigger sync of any other pending operations
        if (getPendingOperations().length > 0) {
          setTimeout(() => syncToSupabase(), 1000);
        }
      } catch (error) {
        console.error('❌ Failed to sync sale to Supabase:', error);
        // Queue for retry
        queueOperation('CREATE_SALE', saleWithProfit, saleWithProfit.id);
        newMovements.forEach(movement => {
          queueOperation('CREATE_STOCK_MOVEMENT', movement, movement.id);
        });
        for (const [productId, stockUpdate] of updatedProducts) {
          queueOperation('UPDATE_PRODUCT', stockUpdate, productId);
        }
        if (debtTransaction) {
          queueOperation('CREATE_DEBT_TRANSACTION', debtTransaction, debtTransaction.id);
        }
        setPendingSyncCount(getPendingCount());
      }
    } else if (hasValidShopId && !canSync) {
      // Offline - queue everything for later sync
      console.log('📴 Offline - queuing sale for later sync');
      queueOperation('CREATE_SALE', saleWithProfit, saleWithProfit.id);
      newMovements.forEach(movement => {
        queueOperation('CREATE_STOCK_MOVEMENT', movement, movement.id);
      });
      for (const [productId, stockUpdate] of updatedProducts) {
        queueOperation('UPDATE_PRODUCT', stockUpdate, productId);
      }
      if (debtTransaction) {
        queueOperation('CREATE_DEBT_TRANSACTION', debtTransaction, debtTransaction.id);
      }
      setPendingSyncCount(getPendingCount());
    }
  };

  const addCustomer = async (customer: Customer) => {
    const customerWithShop = {
      ...customer,
      shopId: customer.shopId || state.settings?.shopId || '',
      createdAt: customer.createdAt || new Date().toISOString()
    };
    
    setState(prev => ({ ...prev, customers: [...prev.customers, customerWithShop] }));
    logActivity('ADD_CUSTOMER', `Added customer: ${customer.name}`);
    
    // Sync to Supabase or queue for later
    if (customerWithShop.shopId && isValidUUID(customerWithShop.shopId)) {
      if (canSyncToSupabase()) {
        db.createCustomer(customerWithShop).catch(err => {
          console.error('Failed to sync customer:', err);
          queueOperation('CREATE_CUSTOMER', customerWithShop, customerWithShop.id);
        });
      } else {
        queueOperation('CREATE_CUSTOMER', customerWithShop, customerWithShop.id);
      }
    }
  };

  const updateCustomerDebt = async (customerId: string, amount: number) => {
     const hasValidShopId = isValidUUID(state.settings?.shopId || '');
     const canSync = canSyncToSupabase();
     
     setState(prev => {
       const customers = prev.customers.map(c => 
         c.id === customerId ? { ...c, totalDebt: c.totalDebt + amount } : c
       );
       
       // Sync to Supabase or queue for later
       if (hasValidShopId) {
         const customer = customers.find(c => c.id === customerId);
         if (customer) {
           if (canSync) {
             db.updateCustomer(customerId, { totalDebt: customer.totalDebt })
               .catch(err => {
                 console.error('Failed to sync customer debt:', err);
                 queueOperation('UPDATE_CUSTOMER', { totalDebt: customer.totalDebt }, customerId);
               });
           } else {
             queueOperation('UPDATE_CUSTOMER', { totalDebt: customer.totalDebt }, customerId);
           }
         }
       }
       
       return { ...prev, customers };
     });
  };

  const recordDebtPayment = async (customerId: string, amount: number) => {
     const shopId = state.settings?.shopId || 'unknown';
     const hasValidShopId = isValidUUID(shopId);
     const canSync = canSyncToSupabase();
     const customer = state.customers.find(c => c.id === customerId);
     
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

        const customer = customers.find(c => c.id === customerId);
        const now = new Date().toISOString();
        const transaction: DebtTransaction = {
            id: generateUUID(),
            shopId: shopId,
            customerId: customerId,
            date: now,
            createdAt: now,
            type: 'payment',
            amount: amount,
            note: 'Debt Repayment'
        };

        // Create a Sale record for the debt payment so it appears in Transactions and Dashboard
        const paymentSale: Sale = {
          id: generateUUID(),
          shopId: shopId,
          date: now,
          cashierId: prev.currentUser?.id || '',
          cashierName: prev.currentUser?.fullName || 'System',
          items: [], // Empty items array for debt payments
          total: amount,
          profit: 0, // No profit on debt payments
          paymentMethod: 'cash', // Default to cash for debt payments
          customerId: customerId,
          isCredit: false,
          createdAt: now
        };

        // Sync to Supabase or queue for later
        if (hasValidShopId) {
          if (canSync) {
            db.createDebtTransaction(transaction).catch(err => {
              console.error('Failed to sync debt payment:', err);
              queueOperation('CREATE_DEBT_TRANSACTION', transaction, transaction.id);
            });
            // Create sale record in Supabase
            db.createSale(paymentSale).catch(err => {
              console.error('Failed to sync debt payment sale:', err);
              queueOperation('CREATE_SALE', paymentSale, paymentSale.id);
            });
            if (customer) {
              db.updateCustomer(customerId, { totalDebt: customer.totalDebt })
                .catch(err => {
                  console.error('Failed to sync customer debt:', err);
                  queueOperation('UPDATE_CUSTOMER', { totalDebt: customer.totalDebt }, customerId);
                });
            }
          } else {
            queueOperation('CREATE_DEBT_TRANSACTION', transaction, transaction.id);
            queueOperation('CREATE_SALE', paymentSale, paymentSale.id);
            if (customer) {
              queueOperation('UPDATE_CUSTOMER', { totalDebt: customer.totalDebt }, customerId);
            }
          }
        }

        return { 
          ...prev, 
          customers, 
          debtTransactions: [...prev.debtTransactions, transaction],
          sales: [paymentSale, ...prev.sales] // Add sale record for debt payment
        };
     });
     logActivity('DEBT_PAYMENT', `Recorded payment of ₦${amount.toLocaleString()} for customer ${customer?.name || customerId}`);
  };

  const getDebtHistory = (customerId: string) => {
      const currentShopId = state.settings?.shopId;
      if (!currentShopId) return [];
      // CRITICAL: Filter by shopId first to ensure data isolation
      return state.debtTransactions.filter(t => 
        t.shopId === currentShopId && t.customerId === customerId
      );
  };

  // Gift Cards
  const addGiftCard = async (card: GiftCard) => {
    const cardWithShop = {
      ...card,
      shopId: card.shopId || state.settings?.shopId || ''
    };
    
    setState(prev => ({ ...prev, giftCards: [...(prev.giftCards || []), cardWithShop] }));
    logActivity('ADD_GIFT_CARD', `Created gift card: ${card.code}`);
    
    // Sync to Supabase or queue for later
    if (cardWithShop.shopId && isValidUUID(cardWithShop.shopId)) {
      if (canSyncToSupabase()) {
        db.createGiftCard(cardWithShop).catch(err => {
          console.error('Failed to sync gift card:', err);
          queueOperation('CREATE_GIFT_CARD', cardWithShop, cardWithShop.id);
        });
      } else {
        queueOperation('CREATE_GIFT_CARD', cardWithShop, cardWithShop.id);
      }
    }
  };

  const deleteGiftCard = async (id: string) => {
    setState(prev => ({ ...prev, giftCards: (prev.giftCards || []).filter(g => g.id !== id) }));
    
    // Sync to Supabase or queue for later
    if (isValidUUID(state.settings?.shopId || '')) {
      if (canSyncToSupabase()) {
        db.deleteGiftCardDb(id).catch(err => {
          console.error('Failed to delete gift card from Supabase:', err);
          queueOperation('DELETE_GIFT_CARD', null, id);
        });
      } else {
        queueOperation('DELETE_GIFT_CARD', null, id);
      }
    }
  };

  const getGiftCard = (code: string) => {
      const currentShopId = state.settings?.shopId;
      if (!currentShopId) return undefined;
      // CRITICAL: Filter by shopId first to ensure data isolation
      return (state.giftCards || []).find(gc => 
        gc.shopId === currentShopId && gc.code === code && gc.status === 'active'
      );
  };

  // Category Management
  const addCategory = async (category: Category) => {
    const categoryWithShop = {
      ...category,
      shopId: category.shopId || state.settings?.shopId || '',
      createdAt: category.createdAt || new Date().toISOString()
    };
    
    setState(prev => ({ ...prev, categories: [...prev.categories, categoryWithShop] }));
    logActivity('ADD_CATEGORY', `Created category: ${category.name}`);
    
    // Sync to Supabase or queue for later
    if (categoryWithShop.shopId && isValidUUID(categoryWithShop.shopId)) {
      if (canSyncToSupabase()) {
        db.createCategory(categoryWithShop).catch(err => {
          console.error('Failed to sync category:', err);
          queueOperation('CREATE_CATEGORY', categoryWithShop, categoryWithShop.id);
        });
      } else {
        queueOperation('CREATE_CATEGORY', categoryWithShop, categoryWithShop.id);
      }
    }
  };

  const editCategory = async (category: Category) => {
    setState(prev => ({
       ...prev,
       categories: prev.categories.map(c => c.id === category.id ? category : c)
    }));
    logActivity('EDIT_CATEGORY', `Edited category: ${category.name}`);
    
    // Sync to Supabase or queue for later
    if (isValidUUID(state.settings?.shopId || '')) {
      if (canSyncToSupabase()) {
        db.updateCategory(category.id, category).catch(err => {
          console.error('Failed to sync category update:', err);
          queueOperation('UPDATE_CATEGORY', category, category.id);
        });
      } else {
        queueOperation('UPDATE_CATEGORY', category, category.id);
      }
    }
  };

  const deleteCategory = async (id: string) => {
    setState(prev => ({ 
        ...prev, 
        categories: prev.categories.map(c => c.id === id ? { ...c, isArchived: true } : c)
    }));
    logActivity('DELETE_CATEGORY', `Archived category ID: ${id}`);
    
    // Sync to Supabase or queue for later
    if (isValidUUID(state.settings?.shopId || '')) {
      if (canSyncToSupabase()) {
        db.updateCategory(id, { isArchived: true }).catch(err => {
          console.error('Failed to sync category deletion:', err);
          queueOperation('UPDATE_CATEGORY', { isArchived: true }, id);
        });
      } else {
        queueOperation('UPDATE_CATEGORY', { isArchived: true }, id);
      }
    }
  };

  // Supplier Management
  const addSupplier = async (supplier: Supplier) => {
    const supplierWithShop = {
      ...supplier,
      shopId: supplier.shopId || state.settings?.shopId || '',
      createdAt: supplier.createdAt || new Date().toISOString()
    };
    
    setState(prev => ({ ...prev, suppliers: [...prev.suppliers, supplierWithShop] }));
    logActivity('ADD_SUPPLIER', `Added supplier: ${supplier.name}`);
    
    // Sync to Supabase or queue for later
    if (supplierWithShop.shopId && isValidUUID(supplierWithShop.shopId)) {
      if (canSyncToSupabase()) {
        db.createSupplier(supplierWithShop).catch(err => {
          console.error('Failed to sync supplier:', err);
          queueOperation('CREATE_SUPPLIER', supplierWithShop, supplierWithShop.id);
        });
      } else {
        queueOperation('CREATE_SUPPLIER', supplierWithShop, supplierWithShop.id);
      }
    }
  };

  const editSupplier = async (supplier: Supplier) => {
    setState(prev => ({
       ...prev,
       suppliers: prev.suppliers.map(s => s.id === supplier.id ? supplier : s)
    }));
    logActivity('EDIT_SUPPLIER', `Edited supplier: ${supplier.name}`);
    
    // Sync to Supabase or queue for later
    if (isValidUUID(state.settings?.shopId || '')) {
      if (canSyncToSupabase()) {
        db.updateSupplier(supplier.id, supplier).catch(err => {
          console.error('Failed to sync supplier update:', err);
          queueOperation('UPDATE_SUPPLIER', supplier, supplier.id);
        });
      } else {
        queueOperation('UPDATE_SUPPLIER', supplier, supplier.id);
      }
    }
  };

  const deleteSupplier = async (id: string) => {
    setState(prev => ({ 
        ...prev, 
        suppliers: prev.suppliers.map(s => s.id === id ? { ...s, isArchived: true } : s)
    }));
    logActivity('DELETE_SUPPLIER', `Archived supplier ID: ${id}`);
    
    // Sync to Supabase or queue for later
    if (isValidUUID(state.settings?.shopId || '')) {
      if (canSyncToSupabase()) {
        db.updateSupplier(id, { isArchived: true }).catch(err => {
          console.error('Failed to sync supplier deletion:', err);
          queueOperation('UPDATE_SUPPLIER', { isArchived: true }, id);
        });
      } else {
        queueOperation('UPDATE_SUPPLIER', { isArchived: true }, id);
      }
    }
  };

  // Expense Management
  const addExpense = async (expense: Expense) => {
    const expenseWithShop = {
      ...expense,
      shopId: expense.shopId || state.settings?.shopId || '',
      createdAt: expense.createdAt || new Date().toISOString()
    };
    
    setState(prev => ({ ...prev, expenses: [...prev.expenses, expenseWithShop] }));
    logActivity('ADD_EXPENSE', `Added expense: ${expense.amount} (${expense.category})`);
    
    // Sync to Supabase or queue for later
    if (expenseWithShop.shopId && isValidUUID(expenseWithShop.shopId)) {
      if (canSyncToSupabase()) {
        db.createExpense(expenseWithShop).catch(err => {
          console.error('Failed to sync expense:', err);
          queueOperation('CREATE_EXPENSE', expenseWithShop, expenseWithShop.id);
        });
      } else {
        queueOperation('CREATE_EXPENSE', expenseWithShop, expenseWithShop.id);
      }
    }
  };

  const deleteExpense = async (id: string) => {
    setState(prev => ({ 
        ...prev, 
        expenses: prev.expenses.map(e => e.id === id ? { ...e, isArchived: true } : e)
    }));
    logActivity('DELETE_EXPENSE', `Archived expense ID: ${id}`);
    
    // Sync to Supabase or queue for later
    if (isValidUUID(state.settings?.shopId || '')) {
      if (canSyncToSupabase()) {
        db.updateExpense(id, { isArchived: true }).catch(err => {
          console.error('Failed to sync expense deletion:', err);
          queueOperation('UPDATE_EXPENSE', { isArchived: true }, id);
        });
      } else {
        queueOperation('UPDATE_EXPENSE', { isArchived: true }, id);
      }
    }
  };

  // User Management
  const addUser = (user: User): boolean => {
    if (state.users.some(u => u.username === user.username)) return false;
    
    const userWithShop = {
      ...user,
      shopId: user.shopId || state.settings?.shopId || '',
      createdAt: user.createdAt || new Date().toISOString()
    };
    
    setState(prev => ({ ...prev, users: [...prev.users, userWithShop] }));
    logActivity('ADD_USER', `Created user: ${user.username} (${user.role})`);
    
    // Sync to Supabase or queue for later
    if (userWithShop.shopId && isValidUUID(userWithShop.shopId)) {
      if (canSyncToSupabase()) {
        db.createUser(userWithShop).catch(err => {
          console.error('Failed to sync user:', err);
          queueOperation('CREATE_USER', userWithShop, userWithShop.id);
        });
      } else {
        queueOperation('CREATE_USER', userWithShop, userWithShop.id);
      }
    }
    
    return true;
  };

  const updateUser = async (user: User) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === user.id ? user : u)
    }));
    logActivity('EDIT_USER', `Updated user: ${user.username}`);
    
    // Sync to Supabase or queue for later
    if (isValidUUID(state.settings?.shopId || '')) {
      if (canSyncToSupabase()) {
        db.updateUser(user.id, user).catch(err => {
          console.error('Failed to sync user update:', err);
          queueOperation('UPDATE_USER', user, user.id);
        });
      } else {
        queueOperation('UPDATE_USER', user, user.id);
      }
    }
  };

  const deleteUser = async (userId: string) => {
    const user = state.users.find(u => u.id === userId);
    const newStatus = user?.status === 'active' ? 'inactive' : 'active';
    
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, status: newStatus as 'active' | 'inactive' } : u)
    }));
    logActivity('TOGGLE_USER_STATUS', `Toggled status for user ID: ${userId}`);
    
    // Sync to Supabase or queue for later
    if (isValidUUID(state.settings?.shopId || '')) {
      if (canSyncToSupabase()) {
        db.updateUser(userId, { status: newStatus }).catch(err => {
          console.error('Failed to sync user status:', err);
          queueOperation('UPDATE_USER', { status: newStatus }, userId);
        });
      } else {
        queueOperation('UPDATE_USER', { status: newStatus }, userId);
      }
    }
  };
  
  const updateSettings = async (newSettings: Partial<ShopSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
    
    // Sync to Supabase or queue for later
    if (state.settings?.shopId && isValidUUID(state.settings.shopId)) {
      if (canSyncToSupabase()) {
        db.updateShopSettings(state.settings.shopId, newSettings)
          .catch(err => {
            console.error('Failed to sync settings:', err);
            queueOperation('UPDATE_SETTINGS', newSettings, state.settings.shopId);
          });
      } else {
        queueOperation('UPDATE_SETTINGS', newSettings, state.settings.shopId);
      }
    }
  };

  const isAIEnabledForCurrentShop = (): boolean => {
    const shopId = state.settings?.shopId;
    if (!shopId) return false;
    
    const { isShopAIEnabled } = require('../services/adminStorage');
    return isShopAIEnabled(shopId);
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

  // Subscription Management Functions
  const getSubscription = (): Subscription | null => {
    return state.subscription || null;
  };

  // Verify subscription against server (async, for background checks)
  const verifySubscriptionWithServer = async (): Promise<void> => {
    if (!state.subscription || !canSyncToSupabase() || !state.settings?.shopId) return;
    
    try {
      const serverSubscription = await db.getSubscriptionByShop(state.settings.shopId);
      if (serverSubscription) {
        const localTrialEnd = new Date(state.subscription.trialEndDate);
        const serverTrialEnd = new Date(serverSubscription.trialEndDate);
        
        // If local trial end date is later than server, use server date (prevent manipulation)
        if (localTrialEnd > serverTrialEnd) {
          console.warn('⚠️ Trial date manipulation detected - using server date');
          const correctedSubscription = {
            ...state.subscription,
            trialStartDate: serverSubscription.trialStartDate,
            trialEndDate: serverSubscription.trialEndDate,
            subscriptionStartDate: serverSubscription.subscriptionStartDate,
            subscriptionEndDate: serverSubscription.subscriptionEndDate,
            lastVerifiedAt: new Date().toISOString()
          };
          
          setState(prev => ({
            ...prev,
            subscription: correctedSubscription
          }));
          
          const updatedState = { ...state, subscription: correctedSubscription };
          saveStateToLocalStorage(updatedState);
        }
      }
    } catch (error) {
      console.error('❌ Failed to verify subscription with server:', error);
    }
  };

  const checkSubscription = (): boolean => {
    if (!state.subscription) return false;
    
    // Background verification with server (non-blocking)
    verifySubscriptionWithServer().catch(err => 
      console.error('Background subscription verification failed:', err)
    );
    
    // Only warn about integrity, don't block functionality
    if (!verifySubscriptionIntegrity(state.subscription)) {
      console.warn('⚠️ Subscription integrity check failed - this may be due to migration. Continuing...');
    }
    
    const timeCheck = validateTimeIntegrity();
    if (!timeCheck.isValid) {
      console.warn('⚠️ Time integrity check failed:', timeCheck.reason);
      // If time manipulation detected, lock account
      if (timeCheck.reason?.includes('manipulation')) {
        console.error('🔒 Account locked due to time manipulation');
        return false;
      }
    }
    
    const currentStatus = checkSubscriptionStatus(state.subscription);
    if (currentStatus !== state.subscription.status) {
      const updatedSubscription = {
        ...state.subscription,
        status: currentStatus,
        updatedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString()
      };
      
      setState(prev => ({
        ...prev,
        subscription: updatedSubscription
      }));
      
      // Sync to Supabase
      if (canSyncToSupabase()) {
        db.updateSubscription(state.subscription.id, {
          status: currentStatus,
          lastVerifiedAt: new Date().toISOString()
        }).catch(err => console.error('Failed to sync subscription status:', err));
      }
    }
    
    return isSubscriptionActive(state.subscription);
  };

  const isAccountLocked = (): boolean => {
    if (!state.subscription) return false;
    // Synchronous check - use cached status
    const currentStatus = checkSubscriptionStatus(state.subscription);
    return currentStatus !== 'trial' && currentStatus !== 'active';
  };

  const processPayment = async (
    plan: SubscriptionPlan,
    paymentReference: string,
    paymentAmount: number,
    couponCode?: string,
    discountAmount?: number,
    originalAmount?: number
  ): Promise<boolean> => {
    let subscriptionToExtend = state.subscription;
    
    if (!subscriptionToExtend) {
      const shopId = state.settings?.shopId || generateUUID();
      subscriptionToExtend = createTrialSubscription(shopId);
    }
    
    if (!subscriptionToExtend) return false;
    
    const { createPaymentRecord } = await import('../services/paymentTracking');
    const { addPaymentToAdminData } = await import('../services/adminStorage');
    const { verifyPayment } = await import('../services/paystack');
    const { recordCouponUsage, getCouponByCode } = await import('../services/couponService');
    
    const shopId = state.settings?.shopId || subscriptionToExtend.shopId;
    const shopName = state.settings?.businessName || 'Unknown Shop';
    const userEmail = state.currentUser?.email || '';
    
    // SECURITY: Verify payment with Paystack API BEFORE unlocking account
    // This prevents users from tricking the system by clicking pay then canceling
    console.log('🔐 Verifying payment with Paystack API...');
    
    // Skip verification for free payments (100% off coupons)
    const needsVerification = paymentAmount > 0;
    
    if (needsVerification) {
      const verification = await verifyPayment(paymentReference, paymentAmount, false);
      
      if (!verification.verified) {
        console.error('❌ Payment verification failed:', verification.error || 'Payment not verified');
        
        // Create failed payment record for audit
        const failedPaymentRecord = createPaymentRecord(
          shopId,
          shopName,
          subscriptionToExtend.id,
          plan,
          paymentAmount,
          paymentReference,
          userEmail,
          state.settings?.country || '',
          state.settings?.state || '',
          'failed',
          couponCode,
          discountAmount,
          originalAmount
        );
        
        // Store failed payment in Supabase for audit
        if (canSyncToSupabase()) {
          try {
            await db.createPaymentRecordDb(failedPaymentRecord);
            // Store verification failure in Supabase
            await db.createPaymentVerificationDb({
              paymentReference,
              shopId,
              status: 'failed',
              verifiedAt: new Date().toISOString(),
              amount: paymentAmount,
              currency: 'NGN',
              customerEmail: userEmail,
              errorMessage: verification.error || 'Payment verification failed',
              verificationMethod: 'api'
            });
          } catch (error) {
            console.error('❌ Failed to sync failed payment to Supabase:', error);
          }
        }
        
        return false; // DO NOT unlock account
      }
      
      console.log('✅ Payment verified successfully via Paystack API');
      
      // Store successful verification in Supabase
      if (canSyncToSupabase() && verification.verification) {
        try {
          await db.createPaymentVerificationDb({
            paymentReference,
            shopId,
            status: 'success',
            verifiedAt: verification.verification.verifiedAt,
            amount: verification.verification.amount || paymentAmount,
            currency: verification.verification.currency || 'NGN',
            customerEmail: verification.verification.customer?.email || userEmail,
            paystackResponse: verification.verification.metadata || {},
            verificationMethod: 'api'
          });
        } catch (error) {
          console.error('❌ Failed to store payment verification in Supabase:', error);
        }
      }
    } else {
      console.log('ℹ️ Free payment (coupon) - skipping Paystack verification');
    }
    
    // Payment verified - proceed with unlocking account
    const paymentRecord = createPaymentRecord(
      shopId,
      shopName,
      subscriptionToExtend.id,
      plan,
      paymentAmount,
      paymentReference,
      userEmail,
      state.settings?.country || '',
      state.settings?.state || '',
      'completed',
      couponCode,
      discountAmount,
      originalAmount
    );
    
    if (couponCode && discountAmount !== undefined) {
      const coupon = getCouponByCode(couponCode);
      if (coupon) {
        recordCouponUsage(
          coupon.id,
          coupon.code,
          shopId,
          shopName,
          paymentRecord.id,
          discountAmount || 0
        );
      }
    }
    
    const updatedSubscription = extendSubscription(
      subscriptionToExtend,
      plan,
      paymentReference,
      paymentAmount
    );
    
    console.log('💰 Payment processed - Subscription updated');
    
    setState(prev => {
      const newState = {
        ...prev,
        subscription: updatedSubscription,
        payments: [paymentRecord, ...(prev.payments || [])]
      };
      
      saveStateToLocalStorage(newState);
      return newState;
    });
    
    // Sync to Supabase
    if (canSyncToSupabase()) {
      try {
        await db.updateSubscription(updatedSubscription.id, updatedSubscription);
        await db.createPaymentRecordDb(paymentRecord);
        console.log('✅ Payment synced to Supabase');
      } catch (error) {
        console.error('❌ Failed to sync payment to Supabase:', error);
      }
    }
    
    addPaymentToAdminData(paymentRecord);
    
    const { updateShopInAdminData } = await import('../services/adminStorage');
    updateShopInAdminData(shopId, {
      subscriptionStatus: updatedSubscription.status,
      subscriptionPlan: updatedSubscription.plan,
      lastPaymentDate: updatedSubscription.lastPaymentDate,
      subscriptionEndDate: updatedSubscription.subscriptionEndDate,
      trialEndDate: updatedSubscription.trialEndDate,
      isActive: true,
      totalRevenue: 0
    });
    
    logActivity('PAYMENT_PROCESSED', `Payment processed: ${plan} plan, Reference: ${paymentReference}, Amount: ₦${paymentAmount}`);
    addTimeAnchor();
    
    return true;
  };

  // Periodic subscription check (every 5 minutes) to ensure account locks when expired
  useEffect(() => {
    if (!state.currentUser) return;
    
    const subscriptionCheckInterval = setInterval(() => {
      const subscription = getSubscription();
      if (subscription) {
        const wasActive = isSubscriptionActive(subscription);
        checkSubscription();
        const currentSubscription = getSubscription();
        const isNowActive = currentSubscription ? isSubscriptionActive(currentSubscription) : false;
        
        // If subscription just expired, log warning (UI will handle locking)
        if (wasActive && !isNowActive) {
          console.warn('⚠️ Subscription expired - account will be locked');
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(subscriptionCheckInterval);
  }, [state.currentUser]);

  // Initial load from Supabase
  useEffect(() => {
    const loadFromSupabase = async () => {
      if (!isOnline() || !state.settings?.shopId || state.settings.shopId === 'default_shop') {
        return;
      }
      
      // Skip Supabase for legacy non-UUID shop IDs
      if (!isValidUUID(state.settings.shopId)) {
        console.log('⚠️ Legacy shop ID detected - skipping Supabase sync. Please re-register to enable cloud sync.');
        return;
      }
      
      try {
        console.log('☁️ Loading data from Supabase...');
        setIsSyncing(true);
        const shopData = await db.loadAllShopData(state.settings.shopId);
        
        if (shopData.settings) {
          setState(prev => ({
            ...prev,
            users: shopData.users.length > 0 ? shopData.users : prev.users,
            products: shopData.products.length > 0 ? shopData.products : prev.products,
            categories: shopData.categories.length > 0 ? shopData.categories : prev.categories,
            suppliers: shopData.suppliers.length > 0 ? shopData.suppliers : prev.suppliers,
            expenses: shopData.expenses.length > 0 ? shopData.expenses : prev.expenses,
            sales: shopData.sales.length > 0 ? shopData.sales : prev.sales,
            customers: shopData.customers.length > 0 ? shopData.customers : prev.customers,
            debtTransactions: shopData.debtTransactions.length > 0 ? shopData.debtTransactions : prev.debtTransactions,
            stockMovements: shopData.stockMovements.length > 0 ? shopData.stockMovements : prev.stockMovements,
            giftCards: shopData.giftCards.length > 0 ? shopData.giftCards : prev.giftCards,
            activityLogs: shopData.activityLogs.length > 0 ? shopData.activityLogs : prev.activityLogs,
            settings: shopData.settings,
            subscription: shopData.subscription || prev.subscription,
            payments: shopData.payments.length > 0 ? shopData.payments : prev.payments,
          }));
          console.log('✅ Data loaded from Supabase');
        }
      } catch (error) {
        console.error('❌ Failed to load from Supabase:', error);
      } finally {
        setIsSyncing(false);
      }
    };
    
    loadFromSupabase();
  }, [state.settings?.shopId]);

  // Validate subscription on app load
  useEffect(() => {
    if (state.subscription) {
      console.log('🔍 Verifying subscription on app load...');
      
      if (!verifySubscriptionIntegrity(state.subscription)) {
        console.warn('⚠️ Subscription data may have been tampered with');
      }
      
      const timeCheck = validateTimeIntegrity();
      if (!timeCheck.isValid) {
        console.warn('⚠️ Time manipulation detected:', timeCheck.reason);
      }
      
      const currentStatus = checkSubscriptionStatus(state.subscription);
      
      if (currentStatus !== state.subscription.status) {
        setState(prev => ({
          ...prev,
          subscription: prev.subscription ? {
            ...prev.subscription,
            status: currentStatus,
            updatedAt: new Date().toISOString(),
            lastVerifiedAt: new Date().toISOString()
          } : null
        }));
        
        import('../services/adminStorage').then(({ updateShopInAdminData }) => {
          if (state.settings?.shopId && state.subscription) {
            const isNowActive = currentStatus === 'trial' || currentStatus === 'active';
            updateShopInAdminData(state.settings.shopId, {
              subscriptionStatus: currentStatus,
              subscriptionEndDate: state.subscription.subscriptionEndDate,
              trialEndDate: state.subscription.trialEndDate,
              isActive: isNowActive
            });
          }
        });
      }
    }
  }, []);

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
      isAIEnabledForCurrentShop,
      isOnline: online,
      isSyncing,
      pendingSyncCount,
      getSubscription,
      checkSubscription,
      isAccountLocked,
      processPayment,
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

