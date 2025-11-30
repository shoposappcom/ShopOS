
import { AppState, ShopSettings, DebtTransaction, Customer } from '../types';
import { INITIAL_USERS as DEF_USERS, INITIAL_PRODUCTS as DEF_PRODS, INITIAL_CUSTOMERS as DEF_CUST, INITIAL_SETTINGS as DEF_SETTINGS, INITIAL_CATEGORIES as DEF_CATS, INITIAL_SUPPLIERS as DEF_SUP, INITIAL_EXPENSES as DEF_EXP } from '../constants';

const STORAGE_KEY = 'shopos_data_v1';

export const loadState = (): AppState => {
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

    return {
      users: parsed.users || DEF_USERS,
      products: parsed.products || DEF_PRODS,
      categories: parsed.categories || DEF_CATS,
      suppliers: parsed.suppliers || DEF_SUP,
      expenses: parsed.expenses || DEF_EXP,
      sales: parsed.sales || [],
      customers: customers,
      debtTransactions: debtTransactions,
      stockMovements: Array.isArray(parsed.stockMovements) ? parsed.stockMovements : [], // Safely initialize
      giftCards: parsed.giftCards || [], 
      activityLogs: parsed.activityLogs || [],
      settings: parsed.settings || DEF_SETTINGS,
      currentUser: null, // Always null on reload
      enableAI: parsed.enableAI !== undefined ? parsed.enableAI : true,
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
    enableAI: true
  };
};

export const saveState = (state: AppState) => {
  // Don't save currentUser to localStorage for security, only persistent data
  const { currentUser, ...persistentState } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentState));
};

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
