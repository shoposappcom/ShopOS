import { AdminConfig, ShopSummary, PaymentRecord, Coupon, CouponUsage, AIUsageRecord } from '../types';
import { isOnline } from './supabase/client';
import * as db from './supabase/database';

const ADMIN_STORAGE_KEY = 'shopos_admin_data';

export interface AdminData {
  adminConfig: AdminConfig;
  shops: ShopSummary[];
  payments: PaymentRecord[];
  coupons: Coupon[];
  couponUsages: CouponUsage[];
  aiUsageRecords: AIUsageRecord[];
  adminCredentials?: {
    username: string;
    passwordHash: string;
  };
}

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  trialDays: 7,
  trialEnabled: true,
  paystackMode: 'test',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Simple hash function for password
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// ============================================================================
// LOCAL STORAGE OPERATIONS (Fallback & Cache)
// ============================================================================

const loadAdminDataFromLocalStorage = (): AdminData => {
  const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      
      if (!parsed.adminConfig) {
        parsed.adminConfig = DEFAULT_ADMIN_CONFIG;
      }
      
      const shops = (parsed.shops || []).map((shop: any) => ({
        ...shop,
        aiEnabled: shop.aiEnabled !== undefined ? shop.aiEnabled : true
      }));
      
      return {
        adminConfig: parsed.adminConfig || DEFAULT_ADMIN_CONFIG,
        shops: shops,
        payments: parsed.payments || [],
        coupons: parsed.coupons || [],
        couponUsages: parsed.couponUsages || [],
        aiUsageRecords: parsed.aiUsageRecords || [],
        adminCredentials: parsed.adminCredentials || undefined
      };
    } catch {
      // If parse fails, return default
    }
  }
  
  const defaultData: AdminData = {
    adminConfig: DEFAULT_ADMIN_CONFIG,
    shops: [],
    payments: [],
    coupons: [],
    couponUsages: [],
    aiUsageRecords: [],
    adminCredentials: undefined // No default credentials - must be set up
  };
  
  saveAdminDataToLocalStorage(defaultData);
  return defaultData;
};

const saveAdminDataToLocalStorage = (data: AdminData): void => {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
};

// ============================================================================
// HYBRID OPERATIONS (Supabase + Local)
// ============================================================================

export const loadAdminData = async (): Promise<AdminData> => {
  const localData = loadAdminDataFromLocalStorage();
  
  if (!isOnline()) {
    console.log('📦 Loading admin data from localStorage (offline)');
    return localData;
  }
  
  try {
    console.log('☁️ Loading admin data from Supabase...');
    const [adminConfig, shops, payments, coupons, couponUsages, aiUsageRecords] = await Promise.all([
      db.getAdminConfigDb(),
      db.getAllShopSummariesDb(),
      db.getAllPaymentsDb(),
      db.getAllCouponsDb(),
      db.getAllCouponUsagesDb(),
      db.getAllAIUsageRecordsDb(),
    ]);
    
    const data: AdminData = {
      adminConfig: adminConfig || DEFAULT_ADMIN_CONFIG,
      shops,
      payments,
      coupons,
      couponUsages,
      aiUsageRecords,
      adminCredentials: localData.adminCredentials // Keep local credentials
    };
    
    // Cache to localStorage
    saveAdminDataToLocalStorage(data);
    console.log('✅ Loaded admin data from Supabase');
    return data;
  } catch (error) {
    console.error('❌ Supabase admin load failed, using localStorage:', error);
    return localData;
  }
};

// Synchronous version for backward compatibility
export const loadAdminDataSync = (): AdminData => {
  return loadAdminDataFromLocalStorage();
};

export const saveAdminData = (data: AdminData): void => {
  saveAdminDataToLocalStorage(data);
};

// ============================================================================
// SHOP OPERATIONS
// ============================================================================

export const addShopToAdminData = async (shopSummary: ShopSummary): Promise<void> => {
  // Update local storage first
  const adminData = loadAdminDataFromLocalStorage();
  const existingIndex = adminData.shops.findIndex(s => s.shopId === shopSummary.shopId);
  
  if (existingIndex >= 0) {
    adminData.shops[existingIndex] = {
      ...adminData.shops[existingIndex],
      ...shopSummary,
      aiEnabled: shopSummary.aiEnabled !== undefined ? shopSummary.aiEnabled : adminData.shops[existingIndex].aiEnabled !== undefined ? adminData.shops[existingIndex].aiEnabled : true
    };
  } else {
    adminData.shops.push({
      ...shopSummary,
      aiEnabled: shopSummary.aiEnabled !== undefined ? shopSummary.aiEnabled : true
    });
  }
  
  saveAdminDataToLocalStorage(adminData);
  
  // Sync to Supabase if online
  if (isOnline()) {
    try {
      const existing = await db.getShopSummaryDb(shopSummary.shopId);
      if (existing) {
        await db.updateShopSummaryDb(shopSummary.shopId, shopSummary);
      } else {
        await db.createShopSummaryDb({
          ...shopSummary,
          aiEnabled: shopSummary.aiEnabled !== undefined ? shopSummary.aiEnabled : true
        });
      }
      console.log('✅ Shop summary synced to Supabase');
    } catch (error) {
      console.error('❌ Failed to sync shop summary to Supabase:', error);
    }
  }
};

export const updateShopInAdminData = async (shopId: string, updates: Partial<ShopSummary>): Promise<void> => {
  // Update local storage
  const adminData = loadAdminDataFromLocalStorage();
  const shopIndex = adminData.shops.findIndex(s => s.shopId === shopId);
  
  if (shopIndex >= 0) {
    adminData.shops[shopIndex] = {
      ...adminData.shops[shopIndex],
      ...updates
    };
    saveAdminDataToLocalStorage(adminData);
  }
  
  // Sync to Supabase if online
  if (isOnline()) {
    try {
      await db.updateShopSummaryDb(shopId, updates);
      console.log('✅ Shop summary updated in Supabase');
    } catch (error) {
      console.error('❌ Failed to update shop summary in Supabase:', error);
    }
  }
};

// ============================================================================
// PAYMENT OPERATIONS
// ============================================================================

export const addPaymentToAdminData = async (payment: PaymentRecord): Promise<void> => {
  // Update local storage
  const adminData = loadAdminDataFromLocalStorage();
  const existing = adminData.payments.find(p => p.id === payment.id);
  
  if (!existing) {
    adminData.payments.push(payment);
    
    const shopIndex = adminData.shops.findIndex(s => s.shopId === payment.shopId);
    if (shopIndex >= 0 && payment.status === 'completed') {
      adminData.shops[shopIndex].totalRevenue = 
        (adminData.shops[shopIndex].totalRevenue || 0) + payment.amount;
      adminData.shops[shopIndex].lastPaymentDate = payment.paymentDate;
    }
    
    saveAdminDataToLocalStorage(adminData);
  }
  
  // Sync to Supabase if online
  if (isOnline()) {
    try {
      await db.createPaymentRecordDb(payment);
      console.log('✅ Payment record synced to Supabase');
    } catch (error) {
      console.error('❌ Failed to sync payment to Supabase:', error);
    }
  }
};

export const updatePaymentInAdminData = async (paymentId: string, updates: Partial<PaymentRecord>): Promise<void> => {
  const adminData = loadAdminDataFromLocalStorage();
  const paymentIndex = adminData.payments.findIndex(p => p.id === paymentId);
  
  if (paymentIndex >= 0) {
    const oldPayment = adminData.payments[paymentIndex];
    adminData.payments[paymentIndex] = {
      ...oldPayment,
      ...updates
    };
    
    if (updates.status === 'completed' && oldPayment.status !== 'completed') {
      const shopIndex = adminData.shops.findIndex(s => s.shopId === oldPayment.shopId);
      if (shopIndex >= 0) {
        adminData.shops[shopIndex].totalRevenue = 
          (adminData.shops[shopIndex].totalRevenue || 0) + oldPayment.amount;
        adminData.shops[shopIndex].lastPaymentDate = oldPayment.paymentDate;
      }
    }
    
    saveAdminDataToLocalStorage(adminData);
  }
};

// ============================================================================
// ADMIN CONFIG OPERATIONS
// ============================================================================

export const getAdminConfig = (): AdminConfig => {
  const adminData = loadAdminDataFromLocalStorage();
  return adminData.adminConfig;
};

export const updateAdminConfig = async (config: Partial<AdminConfig>): Promise<void> => {
  // Update local storage
  const adminData = loadAdminDataFromLocalStorage();
  adminData.adminConfig = {
    ...adminData.adminConfig,
    ...config,
    updatedAt: new Date().toISOString()
  };
  saveAdminDataToLocalStorage(adminData);
  
  // Sync to Supabase if online
  if (isOnline()) {
    try {
      await db.updateAdminConfigDb(adminData.adminConfig);
      console.log('✅ Admin config synced to Supabase');
    } catch (error) {
      console.error('❌ Failed to sync admin config to Supabase:', error);
    }
  }
};

// ============================================================================
// GETTERS (Synchronous for backward compatibility)
// ============================================================================

export const getAllShops = (): ShopSummary[] => {
  const adminData = loadAdminDataFromLocalStorage();
  return adminData.shops;
};

export const getAllPayments = (): PaymentRecord[] => {
  const adminData = loadAdminDataFromLocalStorage();
  return adminData.payments;
};

export const getShopById = (shopId: string): ShopSummary | undefined => {
  const adminData = loadAdminDataFromLocalStorage();
  return adminData.shops.find(s => s.shopId === shopId);
};

// ============================================================================
// ADMIN AUTH
// ============================================================================

export const hasAdminCredentials = async (): Promise<boolean> => {
  // Check Supabase first if online
  if (isOnline()) {
    try {
      const hasAdmin = await db.hasAdminUserDb();
      console.log('🔍 Checking Supabase for admin users:', hasAdmin);
      if (hasAdmin) {
        console.log('✅ Admin credentials found in Supabase');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to check admin users in Supabase:', error);
    }
  }
  
  // Fallback to local storage
  const adminData = loadAdminDataFromLocalStorage();
  const hasLocal = !!adminData.adminCredentials;
  console.log('🔍 Checking localStorage for admin credentials:', hasLocal);
  
  // If we have local credentials but not in Supabase, and we're online, 
  // we should verify against Supabase (might be stale local data)
  if (hasLocal && isOnline()) {
    // Don't trust local storage if Supabase says no admin exists
    // This handles the case where local storage has old data
    try {
      const hasAdmin = await db.hasAdminUserDb();
      if (!hasAdmin) {
        console.log('⚠️ Local storage has credentials but Supabase does not - clearing local data');
        // Clear stale local credentials
        adminData.adminCredentials = undefined;
        saveAdminDataToLocalStorage(adminData);
        return false;
      }
    } catch (error) {
      console.error('Failed to verify against Supabase:', error);
    }
  }
  
  return hasLocal;
};

export const createAdminCredentials = async (username: string, password: string): Promise<void> => {
  const passwordHash = hashPassword(password);
  
  // Create in Supabase if online
  if (isOnline()) {
    try {
      await db.createAdminUserDb(username, passwordHash);
      console.log('✅ Admin user created in Supabase');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        throw new Error('Admin user already exists. Please use a different username.');
      }
      console.error('Failed to create admin user in Supabase:', error);
      throw error;
    }
  }
  
  // Also save to local storage as backup
  const adminData = loadAdminDataFromLocalStorage();
  
  if (adminData.adminCredentials) {
    throw new Error('Admin credentials already exist. Use updateAdminPassword to change password.');
  }
  
  adminData.adminCredentials = {
    username: username.trim(),
    passwordHash: passwordHash
  };
  
  saveAdminDataToLocalStorage(adminData);
};

export const verifyAdminPassword = async (username: string, password: string): Promise<boolean> => {
  const passwordHash = hashPassword(password);
  
  // Check Supabase first if online
  if (isOnline()) {
    try {
      const isValid = await db.verifyAdminUserDb(username, passwordHash);
      if (isValid) {
        // Update last login
        await db.updateAdminUserLastLoginDb(username);
        return true;
      }
    } catch (error) {
      console.error('Failed to verify admin password in Supabase:', error);
    }
  }
  
  // Fallback to local storage
  const adminData = loadAdminDataFromLocalStorage();
  
  if (!adminData.adminCredentials) {
    return false;
  }
  
  const isValid = adminData.adminCredentials.username === username &&
         adminData.adminCredentials.passwordHash === passwordHash;
  
  if (isValid && isOnline()) {
    // Update last login in Supabase
    db.updateAdminUserLastLoginDb(username).catch(err => 
      console.error('Failed to update last login:', err)
    );
  }
  
  return isValid;
};

export const updateAdminPassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
  const newPasswordHash = hashPassword(newPassword);
  
  // Get current username from local storage or Supabase
  const adminData = loadAdminDataFromLocalStorage();
  let username = adminData.adminCredentials?.username;
  
  if (!username && isOnline()) {
    // Try to get username from Supabase (we'd need to know it, but for now use local)
    return false;
  }
  
  if (!username) {
    return false;
  }
  
  // Verify current password first
  const isValid = await verifyAdminPassword(username, currentPassword);
  if (!isValid) {
    return false;
  }
  
  // Update in Supabase if online
  if (isOnline()) {
    try {
      await db.updateAdminUserPasswordDb(username, newPasswordHash);
      console.log('✅ Admin password updated in Supabase');
    } catch (error) {
      console.error('Failed to update admin password in Supabase:', error);
      return false;
    }
  }
  
  // Update local storage
  adminData.adminCredentials = {
    username: username,
    passwordHash: newPasswordHash
  };
  
  saveAdminDataToLocalStorage(adminData);
  return true;
};

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

export const getGeminiApiKey = async (): Promise<string | undefined> => {
  // Check Supabase first if online
  if (isOnline()) {
    try {
      const adminConfig = await db.getAdminConfigDb();
      if (adminConfig?.geminiApiKey) {
        // Cache to localStorage for offline access
        const adminData = loadAdminDataFromLocalStorage();
        adminData.adminConfig.geminiApiKey = adminConfig.geminiApiKey;
        saveAdminDataToLocalStorage(adminData);
        return adminConfig.geminiApiKey;
      }
    } catch (error) {
      console.error('❌ Failed to get Gemini API key from Supabase:', error);
    }
  }
  
  // Fallback to localStorage
  const adminData = loadAdminDataFromLocalStorage();
  return adminData.adminConfig.geminiApiKey;
};

// Synchronous version for backward compatibility (reads from localStorage cache only)
export const getGeminiApiKeySync = (): string | undefined => {
  const adminData = loadAdminDataFromLocalStorage();
  return adminData.adminConfig.geminiApiKey;
};

export const updateGeminiApiKey = async (key: string): Promise<void> => {
  await updateAdminConfig({
    geminiApiKey: key.trim() || undefined
  });
};

export const getPaystackPublicKey = (): string | undefined => {
  const adminData = loadAdminDataFromLocalStorage();
  const mode = adminData.adminConfig.paystackMode || 'test';
  
  if (mode === 'live') {
    return adminData.adminConfig.paystackLivePublicKey;
  } else {
    return adminData.adminConfig.paystackTestPublicKey;
  }
};

export const getPaystackSecretKey = (): string | undefined => {
  const adminData = loadAdminDataFromLocalStorage();
  const mode = adminData.adminConfig.paystackMode || 'test';
  
  if (mode === 'live') {
    return adminData.adminConfig.paystackLiveSecretKey;
  } else {
    return adminData.adminConfig.paystackTestSecretKey;
  }
};

export const getPaystackMode = (): 'test' | 'live' => {
  const adminData = loadAdminDataFromLocalStorage();
  return adminData.adminConfig.paystackMode || 'test';
};

export const updatePaystackKeys = async (keys: {
  testPublicKey?: string;
  testSecretKey?: string;
  livePublicKey?: string;
  liveSecretKey?: string;
  mode?: 'test' | 'live';
}): Promise<void> => {
  const adminData = loadAdminDataFromLocalStorage();
  
  await updateAdminConfig({
    paystackTestPublicKey: keys.testPublicKey !== undefined ? (keys.testPublicKey.trim() || undefined) : adminData.adminConfig.paystackTestPublicKey,
    paystackTestSecretKey: keys.testSecretKey !== undefined ? (keys.testSecretKey.trim() || undefined) : adminData.adminConfig.paystackTestSecretKey,
    paystackLivePublicKey: keys.livePublicKey !== undefined ? (keys.livePublicKey.trim() || undefined) : adminData.adminConfig.paystackLivePublicKey,
    paystackLiveSecretKey: keys.liveSecretKey !== undefined ? (keys.liveSecretKey.trim() || undefined) : adminData.adminConfig.paystackLiveSecretKey,
    paystackMode: keys.mode !== undefined ? keys.mode : adminData.adminConfig.paystackMode || 'test'
  });
};

// ============================================================================
// COUPON MANAGEMENT
// ============================================================================

export const addCoupon = async (coupon: Coupon): Promise<void> => {
  const adminData = loadAdminDataFromLocalStorage();
  
  const existing = adminData.coupons.find(c => c.code.toUpperCase() === coupon.code.toUpperCase());
  if (existing) {
    throw new Error('Coupon code already exists');
  }
  
  adminData.coupons.push(coupon);
  saveAdminDataToLocalStorage(adminData);
  
  // Sync to Supabase if online
  if (isOnline()) {
    try {
      await db.createCouponDb(coupon);
      console.log('✅ Coupon synced to Supabase');
    } catch (error) {
      console.error('❌ Failed to sync coupon to Supabase:', error);
    }
  }
};

export const updateCouponInAdminData = async (couponId: string, updates: Partial<Coupon>): Promise<void> => {
  const adminData = loadAdminDataFromLocalStorage();
  const couponIndex = adminData.coupons.findIndex(c => c.id === couponId);
  
  if (couponIndex >= 0) {
    if (updates.code) {
      const existing = adminData.coupons.find(
        c => c.id !== couponId && c.code.toUpperCase() === updates.code!.toUpperCase()
      );
      if (existing) {
        throw new Error('Coupon code already exists');
      }
    }
    
    adminData.coupons[couponIndex] = {
      ...adminData.coupons[couponIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveAdminDataToLocalStorage(adminData);
    
    // Sync to Supabase if online
    if (isOnline()) {
      try {
        await db.updateCouponDb(couponId, updates);
        console.log('✅ Coupon updated in Supabase');
      } catch (error) {
        console.error('❌ Failed to update coupon in Supabase:', error);
      }
    }
  }
};

export const deleteCouponFromAdminData = async (couponId: string): Promise<void> => {
  const adminData = loadAdminDataFromLocalStorage();
  adminData.coupons = adminData.coupons.filter(c => c.id !== couponId);
  saveAdminDataToLocalStorage(adminData);
  
  // Sync to Supabase if online
  if (isOnline()) {
    try {
      await db.deleteCouponDb(couponId);
      console.log('✅ Coupon deleted from Supabase');
    } catch (error) {
      console.error('❌ Failed to delete coupon from Supabase:', error);
    }
  }
};

export const addCouponUsage = async (usage: CouponUsage): Promise<void> => {
  const adminData = loadAdminDataFromLocalStorage();
  adminData.couponUsages.push(usage);
  
  const couponIndex = adminData.coupons.findIndex(c => c.id === usage.couponId);
  if (couponIndex >= 0) {
    adminData.coupons[couponIndex].currentUses += 1;
  }
  
  saveAdminDataToLocalStorage(adminData);
  
  // Sync to Supabase if online
  if (isOnline()) {
    try {
      await db.createCouponUsageDb(usage);
      if (couponIndex >= 0) {
        await db.updateCouponDb(adminData.coupons[couponIndex].id, {
          currentUses: adminData.coupons[couponIndex].currentUses
        });
      }
      console.log('✅ Coupon usage synced to Supabase');
    } catch (error) {
      console.error('❌ Failed to sync coupon usage to Supabase:', error);
    }
  }
};

export const getAllCoupons = (): Coupon[] => {
  const adminData = loadAdminDataFromLocalStorage();
  return adminData.coupons;
};

// Async version that refreshes from Supabase if online
export const getAllCouponsAsync = async (): Promise<Coupon[]> => {
  if (isOnline()) {
    try {
      const coupons = await db.getAllCouponsDb();
      // Update localStorage cache
      const adminData = loadAdminDataFromLocalStorage();
      adminData.coupons = coupons;
      saveAdminDataToLocalStorage(adminData);
      return coupons;
    } catch (error) {
      console.error('❌ Failed to load coupons from Supabase, using localStorage:', error);
    }
  }
  // Fallback to localStorage
  return getAllCoupons();
};

export const getAllCouponUsages = (): CouponUsage[] => {
  const adminData = loadAdminDataFromLocalStorage();
  return adminData.couponUsages;
};

// ============================================================================
// AI USAGE TRACKING
// ============================================================================

export const addAIUsageRecord = async (record: AIUsageRecord): Promise<void> => {
  const adminData = loadAdminDataFromLocalStorage();
  adminData.aiUsageRecords.push(record);
  saveAdminDataToLocalStorage(adminData);
  
  // Sync to Supabase if online
  if (isOnline()) {
    try {
      await db.createAIUsageRecordDb(record);
      console.log('✅ AI usage record synced to Supabase');
    } catch (error) {
      console.error('❌ Failed to sync AI usage record to Supabase:', error);
    }
  }
};

export const updateAIUsageRecord = async (recordId: string, updates: Partial<AIUsageRecord>): Promise<void> => {
  const adminData = loadAdminDataFromLocalStorage();
  const recordIndex = adminData.aiUsageRecords.findIndex(r => r.id === recordId);
  
  if (recordIndex >= 0) {
    adminData.aiUsageRecords[recordIndex] = {
      ...adminData.aiUsageRecords[recordIndex],
      ...updates
    };
    saveAdminDataToLocalStorage(adminData);
    
    // Sync to Supabase if online
    if (isOnline()) {
      try {
        await db.updateAIUsageRecordDb(recordId, updates);
        console.log('✅ AI usage record updated in Supabase');
      } catch (error) {
        console.error('❌ Failed to update AI usage record in Supabase:', error);
      }
    }
  }
};

export const getAllAIUsageRecords = (): AIUsageRecord[] => {
  const adminData = loadAdminDataFromLocalStorage();
  return adminData.aiUsageRecords;
};

export const getAIUsageByShop = (shopId: string): AIUsageRecord[] => {
  const adminData = loadAdminDataFromLocalStorage();
  return adminData.aiUsageRecords.filter(r => r.shopId === shopId);
};

export const markAbuse = async (recordId: string, reason: string): Promise<void> => {
  await updateAIUsageRecord(recordId, {
    isAbuse: true,
    abuseReason: reason
  });
};

// ============================================================================
// PER-SHOP AI CONTROL
// ============================================================================

export const toggleShopAI = async (shopId: string, enabled: boolean): Promise<void> => {
  await updateShopInAdminData(shopId, { aiEnabled: enabled });
};

export const isShopAIEnabled = (shopId: string): boolean => {
  const adminData = loadAdminDataFromLocalStorage();
  const shop = adminData.shops.find(s => s.shopId === shopId);
  return shop ? (shop.aiEnabled !== undefined ? shop.aiEnabled : true) : true;
};

