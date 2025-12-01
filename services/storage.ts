import { AppState, ShopSettings, DebtTransaction, Customer } from '../types';
import { INITIAL_USERS as DEF_USERS, INITIAL_PRODUCTS as DEF_PRODS, INITIAL_CUSTOMERS as DEF_CUST, INITIAL_SETTINGS as DEF_SETTINGS, INITIAL_CATEGORIES as DEF_CATS, INITIAL_SUPPLIERS as DEF_SUP, INITIAL_EXPENSES as DEF_EXP } from '../constants';
import { createTrialSubscription } from './subscription';
import { isOnline } from './supabase/client';
import * as db from './supabase/database';

const STORAGE_KEY = 'shopos_data_v1';
const CURRENT_SHOP_KEY = 'shopos_current_shop';

// ============================================================================
// LOCAL STORAGE OPERATIONS (Fallback & Cache)
// ============================================================================

export const loadStateFromLocalStorage = (): AppState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    
    // --- MIGRATION: Normalize Debt Transactions ---
    let debtTransactions: DebtTransaction[] = parsed.debtTransactions || [];
    let customers: Customer[] = parsed.customers || DEF_CUST;

    const hasNestedTransactions = customers.some((c: any) => c.transactions && c.transactions.length > 0);
    
    if (hasNestedTransactions && debtTransactions.length === 0) {
       console.log("Migrating nested transactions to global table...");
       const migratedTransactions: DebtTransaction[] = [];
       
       customers = customers.map((c: any) => {
          if (c.transactions && Array.isArray(c.transactions)) {
             c.transactions.forEach((t: any) => {
                migratedTransactions.push({
                   ...t,
                   customerId: c.id, 
                   saleId: t.saleId || `migration_${Date.now()}_${Math.random()}`
                });
             });
          }
          const { transactions, ...cleanCustomer } = c;
          return cleanCustomer;
       });
       
       debtTransactions = migratedTransactions;
    }

    // Migration: Create subscription for existing shops without one
    let subscription = parsed.subscription || null;
    if (!subscription && parsed.settings?.shopId) {
      subscription = createTrialSubscription(parsed.settings.shopId);
    }

    return {
      users: parsed.users || DEF_USERS,
      products: parsed.products || DEF_PRODS,
      categories: parsed.categories || DEF_CATS,
      suppliers: parsed.suppliers || DEF_SUP,
      expenses: parsed.expenses || DEF_EXP,
      sales: parsed.sales || [],
      customers: customers,
      debtTransactions: debtTransactions,
      stockMovements: Array.isArray(parsed.stockMovements) ? parsed.stockMovements : [],
      giftCards: parsed.giftCards || [], 
      activityLogs: parsed.activityLogs || [],
      settings: parsed.settings || DEF_SETTINGS,
      currentUser: null,
      subscription,
      payments: parsed.payments || [],
    };
  }
  return {
    users: DEF_USERS,
    products: DEF_PRODS,
    categories: DEF_CATS,
    suppliers: DEF_SUP,
    expenses: DEF_EXP,
    sales: [],
    customers: DEF_CUST,
    debtTransactions: [],
    stockMovements: [],
    giftCards: [],
    activityLogs: [],
    settings: DEF_SETTINGS,
    currentUser: null,
    subscription: null,
    payments: []
  };
};

export const saveStateToLocalStorage = (state: AppState) => {
  const { currentUser, ...persistentState } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentState));
};

// ============================================================================
// SUPABASE + LOCAL STORAGE HYBRID OPERATIONS
// ============================================================================

/**
 * Load state - tries Supabase first, falls back to localStorage
 */
export const loadState = async (): Promise<AppState> => {
  // First, get local state as fallback
  const localState = loadStateFromLocalStorage();
  
  // If offline or no shopId, use local state
  if (!isOnline() || !localState.settings?.shopId || localState.settings.shopId === 'default_shop') {
    console.log('📦 Loading from localStorage (offline or no shop)');
    return localState;
  }
  
  try {
    console.log('☁️ Loading from Supabase...');
    const shopId = localState.settings.shopId;
    const shopData = await db.loadAllShopData(shopId);
    
    // If no data in Supabase, return local state
    if (!shopData.settings) {
      console.log('📦 No Supabase data found, using localStorage');
      return localState;
    }
    
    const state: AppState = {
      users: shopData.users,
      products: shopData.products,
      categories: shopData.categories,
      suppliers: shopData.suppliers,
      expenses: shopData.expenses,
      sales: shopData.sales,
      customers: shopData.customers,
      debtTransactions: shopData.debtTransactions,
      stockMovements: shopData.stockMovements,
      giftCards: shopData.giftCards,
      activityLogs: shopData.activityLogs,
      settings: shopData.settings,
      currentUser: null,
      subscription: shopData.subscription,
      payments: shopData.payments,
    };
    
    // Cache to localStorage
    saveStateToLocalStorage(state);
    console.log('✅ Loaded from Supabase and cached locally');
    return state;
  } catch (error) {
    console.error('❌ Supabase load failed, using localStorage:', error);
    return localState;
  }
};

/**
 * Save state - saves to both localStorage and Supabase
 */
export const saveState = (state: AppState) => {
  // Always save to localStorage first (fast, works offline)
  saveStateToLocalStorage(state);
  
  // If online and has a valid shopId, sync to Supabase
  if (isOnline() && state.settings?.shopId && state.settings.shopId !== 'default_shop') {
    syncToSupabase(state).catch(error => {
      console.error('Background sync to Supabase failed:', error);
    });
  }
};

/**
 * Sync state to Supabase (background operation)
 */
const syncToSupabase = async (state: AppState): Promise<void> => {
  // This is called in the background, so we don't block the UI
  // In a real app, you'd implement more sophisticated syncing
  // For now, we rely on individual operations syncing data
  console.log('🔄 Background sync to Supabase...');
};

// ============================================================================
// STORE CURRENT SHOP ID
// ============================================================================

export const setCurrentShopId = (shopId: string) => {
  localStorage.setItem(CURRENT_SHOP_KEY, shopId);
};

export const getCurrentShopId = (): string | null => {
  return localStorage.getItem(CURRENT_SHOP_KEY);
};

export const clearCurrentShopId = () => {
  localStorage.removeItem(CURRENT_SHOP_KEY);
};

// ============================================================================
// BACKUP UTILITIES
// ============================================================================

export const shouldAutoBackup = (settings: ShopSettings): boolean => {
  if (settings.autoBackup === 'off') return false;
  if (!settings.lastBackupDate) return true;

  const last = new Date(settings.lastBackupDate).getTime();
  const now = Date.now();
  const daysDiff = (now - last) / (1000 * 60 * 60 * 24);

  switch (settings.autoBackup) {
    case 'daily': return daysDiff >= 1;
    case 'weekly': return daysDiff >= 7;
    case 'monthly': return daysDiff >= 30;
    default: return false;
  }
};

// ============================================================================
// SYNC STATUS
// ============================================================================

let syncInProgress = false;
let lastSyncTime: Date | null = null;

export const isSyncInProgress = () => syncInProgress;
export const getLastSyncTime = () => lastSyncTime;

export const markSyncStart = () => {
  syncInProgress = true;
};

export const markSyncComplete = () => {
  syncInProgress = false;
  lastSyncTime = new Date();
};
