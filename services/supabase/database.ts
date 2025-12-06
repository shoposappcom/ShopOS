import { supabase, generateUUID, isOnline } from './client';
import {
  DbShopSettings, DbUser, DbCategory, DbSupplier, DbProduct, DbCustomer,
  DbSale, DbDebtTransaction, DbStockMovement, DbExpense, DbGiftCard,
  DbActivityLog, DbSubscription, DbPaymentRecord, DbAdminConfig, DbCoupon,
  DbCouponUsage, DbAIUsageRecord, DbShopSummary
} from './types';
import {
  ShopSettings, User, Category, Supplier, Product, Customer, Sale,
  DebtTransaction, StockMovement, Expense, GiftCard, ActivityLog,
  Subscription, PaymentRecord, AdminConfig, Coupon, CouponUsage,
  AIUsageRecord, ShopSummary, Language
} from '../../types';

// ============================================================================
// CONVERSION UTILITIES: Convert between DB format (snake_case) and App format (camelCase)
// ============================================================================

// Shop Settings
export const dbToShopSettings = (db: DbShopSettings): ShopSettings => ({
  shopId: db.shop_id,
  businessName: db.business_name,
  address: db.address,
  phone: db.phone,
  country: db.country,
  state: db.state,
  currency: db.currency,
  receiptFooter: db.receipt_footer,
  taxRate: db.tax_rate,
  autoBackup: db.auto_backup,
  lastBackupDate: db.last_backup_date || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at || undefined,
});

export const shopSettingsToDb = (app: ShopSettings): Omit<DbShopSettings, 'created_at' | 'updated_at'> => ({
  shop_id: app.shopId,
  business_name: app.businessName,
  address: app.address,
  phone: app.phone,
  country: app.country,
  state: app.state,
  currency: app.currency,
  receipt_footer: app.receiptFooter,
  tax_rate: app.taxRate,
  auto_backup: app.autoBackup,
  last_backup_date: app.lastBackupDate || null,
});

// User
export const dbToUser = (db: DbUser): User => ({
  id: db.id,
  shopId: db.shop_id || undefined,
  username: db.username,
  password: db.password,
  fullName: db.full_name,
  phone: db.phone || undefined,
  email: db.email || undefined,
  role: db.role,
  status: db.status,
  language: db.language as Language,
  profilePhoto: db.profile_photo || undefined,
  isArchived: db.is_archived || undefined,
  lastLogin: db.last_login || undefined,
  createdAt: db.created_at,
});

export const userToDb = (app: User): Omit<DbUser, 'created_at'> => ({
  id: app.id,
  shop_id: app.shopId || null,
  username: app.username,
  password: app.password,
  full_name: app.fullName,
  phone: app.phone || null,
  email: app.email || null,
  role: app.role,
  status: app.status,
  language: app.language,
  profile_photo: app.profilePhoto || null,
  is_archived: app.isArchived || false,
  last_login: app.lastLogin || null,
});

// Category
export const dbToCategory = (db: DbCategory): Category => ({
  id: db.id,
  shopId: db.shop_id,
  name: db.name,
  isArchived: db.is_archived || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at || undefined,
});

export const categoryToDb = (app: Category): Omit<DbCategory, 'created_at' | 'updated_at'> => ({
  id: app.id,
  shop_id: app.shopId,
  name: app.name,
  is_archived: app.isArchived || false,
});

// Supplier
export const dbToSupplier = (db: DbSupplier): Supplier => ({
  id: db.id,
  shopId: db.shop_id,
  name: db.name,
  contactPerson: db.contact_person,
  phone: db.phone,
  email: db.email || undefined,
  address: db.address || undefined,
  isArchived: db.is_archived || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at || undefined,
});

export const supplierToDb = (app: Supplier): Omit<DbSupplier, 'created_at' | 'updated_at'> => ({
  id: app.id,
  shop_id: app.shopId,
  name: app.name,
  contact_person: app.contactPerson,
  phone: app.phone,
  email: app.email || null,
  address: app.address || null,
  is_archived: app.isArchived || false,
});

// Product
export const dbToProduct = (db: DbProduct): Product => ({
  id: db.id,
  shopId: db.shop_id,
  name: db.name,
  translations: db.translations as any || undefined,
  barcode: db.barcode,
  category: db.category,
  categoryId: db.category_id || undefined,
  supplierId: db.supplier_id || undefined,
  image: db.image || undefined,
  costPriceCarton: db.cost_price_carton,
  costPriceUnit: db.cost_price_unit,
  cartonPrice: db.carton_price,
  unitPrice: db.unit_price,
  unitsPerCarton: db.units_per_carton,
  stockCartons: db.stock_cartons,
  stockUnits: db.stock_units,
  totalUnits: db.total_units,
  minStockLevel: db.min_stock_level,
  batchNumber: db.batch_number || undefined,
  expiryDate: db.expiry_date || undefined,
  isArchived: db.is_archived || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at || undefined,
});

export const productToDb = (app: Product): Omit<DbProduct, 'created_at' | 'updated_at'> => ({
  id: app.id,
  shop_id: app.shopId,
  name: app.name,
  translations: app.translations as any || null,
  barcode: app.barcode,
  category: app.category,
  category_id: app.categoryId || null,
  supplier_id: app.supplierId || null,
  image: app.image || null,
  cost_price_carton: app.costPriceCarton,
  cost_price_unit: app.costPriceUnit,
  carton_price: app.cartonPrice,
  unit_price: app.unitPrice,
  units_per_carton: app.unitsPerCarton,
  stock_cartons: app.stockCartons,
  stock_units: app.stockUnits,
  total_units: app.totalUnits,
  min_stock_level: app.minStockLevel,
  batch_number: app.batchNumber || null,
  expiry_date: app.expiryDate || null,
  is_archived: app.isArchived || false,
});

// Customer
export const dbToCustomer = (db: DbCustomer): Customer => ({
  id: db.id,
  shopId: db.shop_id,
  name: db.name,
  phone: db.phone,
  totalDebt: db.total_debt,
  lastPurchaseDate: db.last_purchase_date || undefined,
  isArchived: db.is_archived || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at || undefined,
});

export const customerToDb = (app: Customer): Omit<DbCustomer, 'created_at' | 'updated_at'> => ({
  id: app.id,
  shop_id: app.shopId,
  name: app.name,
  phone: app.phone,
  total_debt: app.totalDebt,
  last_purchase_date: app.lastPurchaseDate || null,
  is_archived: app.isArchived || false,
});

// Sale
export const dbToSale = (db: DbSale): Sale => ({
  id: db.id,
  shopId: db.shop_id,
  date: db.date,
  cashierId: db.cashier_id,
  cashierName: db.cashier_name,
  items: db.items,
  total: db.total,
  profit: db.profit,
  paymentMethod: db.payment_method,
  customerId: db.customer_id || undefined,
  isCredit: db.is_credit,
  dueDate: db.due_date || undefined,
  giftCardCode: db.gift_card_code || undefined,
  giftCardAmount: db.gift_card_amount || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at || undefined,
});

export const saleToDb = (app: Sale): Omit<DbSale, 'created_at' | 'updated_at'> => ({
  id: app.id,
  shop_id: app.shopId,
  date: app.date,
  cashier_id: app.cashierId,
  cashier_name: app.cashierName,
  items: app.items,
  total: app.total,
  profit: app.profit,
  payment_method: app.paymentMethod,
  customer_id: app.customerId || null,
  is_credit: app.isCredit,
  due_date: app.dueDate || null,
  gift_card_code: app.giftCardCode || null,
  gift_card_amount: app.giftCardAmount || null,
});

// DebtTransaction
export const dbToDebtTransaction = (db: DbDebtTransaction): DebtTransaction => ({
  id: db.id,
  shopId: db.shop_id,
  customerId: db.customer_id,
  date: db.date,
  type: db.type,
  amount: db.amount,
  saleId: db.sale_id || undefined,
  note: db.note || undefined,
  createdAt: db.created_at,
});

export const debtTransactionToDb = (app: DebtTransaction): Omit<DbDebtTransaction, 'created_at'> => ({
  id: app.id,
  shop_id: app.shopId,
  customer_id: app.customerId,
  date: app.date,
  type: app.type,
  amount: app.amount,
  sale_id: app.saleId || null,
  note: app.note || null,
});

// StockMovement
export const dbToStockMovement = (db: DbStockMovement): StockMovement => ({
  id: db.id,
  shopId: db.shop_id,
  productId: db.product_id,
  type: db.type,
  quantityChange: db.quantity_change,
  quantityType: db.quantity_type,
  balanceAfter: db.balance_after,
  userId: db.user_id,
  note: db.note || undefined,
  batchNumber: db.batch_number || undefined,
  createdAt: db.created_at,
});

export const stockMovementToDb = (app: StockMovement): Omit<DbStockMovement, 'created_at'> => ({
  id: app.id,
  shop_id: app.shopId,
  product_id: app.productId,
  type: app.type,
  quantity_change: app.quantityChange,
  quantity_type: app.quantityType,
  balance_after: app.balanceAfter,
  user_id: app.userId,
  note: app.note || null,
  batch_number: app.batchNumber || null,
});

// Expense
export const dbToExpense = (db: DbExpense): Expense => ({
  id: db.id,
  shopId: db.shop_id,
  description: db.description,
  amount: db.amount,
  category: db.category,
  date: db.date,
  recordedByUserId: db.recorded_by_user_id,
  isArchived: db.is_archived || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at || undefined,
});

export const expenseToDb = (app: Expense): Omit<DbExpense, 'created_at' | 'updated_at'> => ({
  id: app.id,
  shop_id: app.shopId,
  description: app.description,
  amount: app.amount,
  category: app.category,
  date: app.date,
  recorded_by_user_id: app.recordedByUserId,
  is_archived: app.isArchived || false,
});

// GiftCard
export const dbToGiftCard = (db: DbGiftCard): GiftCard => ({
  id: db.id,
  shopId: db.shop_id,
  code: db.code,
  initialValue: db.initial_value,
  balance: db.balance,
  status: db.status,
  theme: db.theme,
  expiresAt: db.expires_at || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at || undefined,
});

export const giftCardToDb = (app: GiftCard): Omit<DbGiftCard, 'created_at' | 'updated_at'> => ({
  id: app.id,
  shop_id: app.shopId,
  code: app.code,
  initial_value: app.initialValue,
  balance: app.balance,
  status: app.status,
  theme: app.theme,
  expires_at: app.expiresAt || null,
});

// ActivityLog
export const dbToActivityLog = (db: DbActivityLog): ActivityLog => ({
  id: db.id,
  shopId: db.shop_id,
  userId: db.user_id,
  userName: db.user_name,
  action: db.action,
  details: db.details,
  createdAt: db.created_at,
});

export const activityLogToDb = (app: ActivityLog): Omit<DbActivityLog, 'created_at'> => ({
  id: app.id,
  shop_id: app.shopId,
  user_id: app.userId,
  user_name: app.userName,
  action: app.action,
  details: app.details,
});

// Subscription
export const dbToSubscription = (db: DbSubscription): Subscription => ({
  id: db.id,
  shopId: db.shop_id,
  plan: db.plan,
  status: db.status,
  trialStartDate: db.trial_start_date,
  trialEndDate: db.trial_end_date,
  subscriptionStartDate: db.subscription_start_date || undefined,
  subscriptionEndDate: db.subscription_end_date || undefined,
  lastPaymentDate: db.last_payment_date || undefined,
  lastPaymentAmount: db.last_payment_amount || undefined,
  paymentReference: db.payment_reference || undefined,
  lastVerifiedAt: db.last_verified_at,
  verificationChecksum: db.verification_checksum || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export const subscriptionToDb = (app: Subscription): Omit<DbSubscription, 'created_at' | 'updated_at'> => ({
  id: app.id,
  shop_id: app.shopId,
  plan: app.plan,
  status: app.status,
  trial_start_date: app.trialStartDate,
  trial_end_date: app.trialEndDate,
  subscription_start_date: app.subscriptionStartDate || null,
  subscription_end_date: app.subscriptionEndDate || null,
  last_payment_date: app.lastPaymentDate || null,
  last_payment_amount: app.lastPaymentAmount || null,
  payment_reference: app.paymentReference || null,
  last_verified_at: app.lastVerifiedAt,
  verification_checksum: app.verificationChecksum || null,
});

// PaymentRecord
export const dbToPaymentRecord = (db: DbPaymentRecord): PaymentRecord => ({
  id: db.id,
  shopId: db.shop_id,
  shopName: db.shop_name,
  subscriptionId: db.subscription_id,
  plan: db.plan,
  amount: db.amount,
  paymentReference: db.payment_reference,
  status: db.status,
  paymentDate: db.payment_date,
  verifiedAt: db.verified_at || undefined,
  email: db.email,
  country: db.country,
  state: db.state,
  notes: db.notes || undefined,
  couponCode: db.coupon_code || undefined,
  discountAmount: db.discount_amount || undefined,
  originalAmount: db.original_amount || undefined,
  createdAt: db.created_at,
});

export const paymentRecordToDb = (app: PaymentRecord): Omit<DbPaymentRecord, 'created_at'> => ({
  id: app.id,
  shop_id: app.shopId,
  shop_name: app.shopName,
  subscription_id: app.subscriptionId,
  plan: app.plan,
  amount: app.amount,
  payment_reference: app.paymentReference,
  status: app.status,
  payment_date: app.paymentDate,
  verified_at: app.verifiedAt || null,
  email: app.email,
  country: app.country,
  state: app.state,
  notes: app.notes || null,
  coupon_code: app.couponCode || null,
  discount_amount: app.discountAmount || null,
  original_amount: app.originalAmount || null,
});

// AdminConfig
export const dbToAdminConfig = (db: DbAdminConfig): AdminConfig => ({
  trialDays: db.trial_days,
  trialEnabled: db.trial_enabled,
  geminiApiKey: db.gemini_api_key || undefined,
  paystackTestPublicKey: db.paystack_test_public_key || undefined,
  paystackTestSecretKey: db.paystack_test_secret_key || undefined,
  paystackLivePublicKey: db.paystack_live_public_key || undefined,
  paystackLiveSecretKey: db.paystack_live_secret_key || undefined,
  paystackMode: db.paystack_mode || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export const adminConfigToDb = (app: AdminConfig): Partial<DbAdminConfig> => ({
  trial_days: app.trialDays,
  trial_enabled: app.trialEnabled,
  gemini_api_key: app.geminiApiKey || null,
  paystack_test_public_key: app.paystackTestPublicKey || null,
  paystack_test_secret_key: app.paystackTestSecretKey || null,
  paystack_live_public_key: app.paystackLivePublicKey || null,
  paystack_live_secret_key: app.paystackLiveSecretKey || null,
  paystack_mode: app.paystackMode || null,
});

// Coupon
export const dbToCoupon = (db: DbCoupon): Coupon => ({
  id: db.id,
  code: db.code,
  discountType: db.discount_type,
  discountValue: db.discount_value,
  applicablePlans: db.applicable_plans as any[],
  expirationDate: db.expiration_date || undefined,
  maxUses: db.max_uses || undefined,
  currentUses: db.current_uses,
  isActive: db.is_active,
  description: db.description || undefined,
  createdBy: db.created_by,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export const couponToDb = (app: Coupon): Omit<DbCoupon, 'created_at' | 'updated_at'> => ({
  id: app.id,
  code: app.code,
  discount_type: app.discountType,
  discount_value: app.discountValue,
  applicable_plans: app.applicablePlans,
  expiration_date: app.expirationDate || null,
  max_uses: app.maxUses || null,
  current_uses: app.currentUses,
  is_active: app.isActive,
  description: app.description || null,
  created_by: app.createdBy,
});

// CouponUsage
export const dbToCouponUsage = (db: DbCouponUsage): CouponUsage => ({
  id: db.id,
  couponId: db.coupon_id,
  couponCode: db.coupon_code,
  shopId: db.shop_id,
  shopName: db.shop_name,
  paymentId: db.payment_id,
  discountAmount: db.discount_amount,
  usedAt: db.used_at,
});

export const couponUsageToDb = (app: CouponUsage): Omit<DbCouponUsage, 'used_at'> => ({
  id: app.id,
  coupon_id: app.couponId,
  coupon_code: app.couponCode,
  shop_id: app.shopId,
  shop_name: app.shopName,
  payment_id: app.paymentId,
  discount_amount: app.discountAmount,
});

// AIUsageRecord
export const dbToAIUsageRecord = (db: DbAIUsageRecord): AIUsageRecord => ({
  id: db.id,
  shopId: db.shop_id,
  shopName: db.shop_name,
  userId: db.user_id,
  userName: db.user_name,
  prompt: db.prompt,
  response: db.response || undefined,
  isAbuse: db.is_abuse || undefined,
  abuseReason: db.abuse_reason || undefined,
  createdAt: db.created_at,
  updatedAt: db.updated_at || undefined,
});

export const aiUsageRecordToDb = (app: AIUsageRecord): Omit<DbAIUsageRecord, 'created_at' | 'updated_at'> => ({
  id: app.id,
  shop_id: app.shopId,
  shop_name: app.shopName,
  user_id: app.userId,
  user_name: app.userName,
  prompt: app.prompt,
  response: app.response || null,
  is_abuse: app.isAbuse || false,
  abuse_reason: app.abuseReason || null,
});

// ShopSummary
export const dbToShopSummary = (db: DbShopSummary): ShopSummary => ({
  shopId: db.shop_id,
  shopName: db.shop_name,
  ownerEmail: db.owner_email,
  ownerName: db.owner_name,
  country: db.country,
  state: db.state,
  registeredDate: db.registered_date,
  subscriptionStatus: db.subscription_status,
  subscriptionPlan: db.subscription_plan || undefined,
  lastPaymentDate: db.last_payment_date || undefined,
  subscriptionEndDate: db.subscription_end_date || undefined,
  trialEndDate: db.trial_end_date || undefined,
  totalRevenue: db.total_revenue,
  isActive: db.is_active,
  aiEnabled: db.ai_enabled,
});

export const shopSummaryToDb = (app: ShopSummary): Omit<DbShopSummary, 'created_at' | 'updated_at'> => ({
  shop_id: app.shopId,
  shop_name: app.shopName,
  owner_email: app.ownerEmail,
  owner_name: app.ownerName,
  country: app.country,
  state: app.state,
  registered_date: app.registeredDate,
  subscription_status: app.subscriptionStatus,
  subscription_plan: app.subscriptionPlan || null,
  last_payment_date: app.lastPaymentDate || null,
  subscription_end_date: app.subscriptionEndDate || null,
  trial_end_date: app.trialEndDate || null,
  total_revenue: app.totalRevenue,
  is_active: app.isActive,
  ai_enabled: app.aiEnabled,
});

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

// Helper to handle Supabase errors
const handleError = (error: any, operation: string) => {
  console.error(`Supabase ${operation} error:`, error);
  throw new Error(`Database error during ${operation}: ${error.message}`);
};

// ============================================================================
// SHOP SETTINGS OPERATIONS
// ============================================================================

export const createShopSettings = async (settings: ShopSettings): Promise<ShopSettings> => {
  const dbData = shopSettingsToDb(settings);
  const { data, error } = await supabase
    .from('shop_settings')
    .insert(dbData)
    .select()
    .single();
  
  if (error) handleError(error, 'createShopSettings');
  return dbToShopSettings(data);
};

export const getShopSettings = async (shopId: string): Promise<ShopSettings | null> => {
  const { data, error } = await supabase
    .from('shop_settings')
    .select('*')
    .eq('shop_id', shopId)
    .single();
  
  if (error && error.code !== 'PGRST116') handleError(error, 'getShopSettings');
  return data ? dbToShopSettings(data) : null;
};

export const updateShopSettings = async (shopId: string, updates: Partial<ShopSettings>): Promise<ShopSettings> => {
  const dbUpdates: any = {};
  if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.country !== undefined) dbUpdates.country = updates.country;
  if (updates.state !== undefined) dbUpdates.state = updates.state;
  if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
  if (updates.receiptFooter !== undefined) dbUpdates.receipt_footer = updates.receiptFooter;
  if (updates.taxRate !== undefined) dbUpdates.tax_rate = updates.taxRate;
  if (updates.autoBackup !== undefined) dbUpdates.auto_backup = updates.autoBackup;
  if (updates.lastBackupDate !== undefined) dbUpdates.last_backup_date = updates.lastBackupDate;
  
  const { data, error } = await supabase
    .from('shop_settings')
    .update(dbUpdates)
    .eq('shop_id', shopId)
    .select()
    .single();
  
  if (error) handleError(error, 'updateShopSettings');
  return dbToShopSettings(data);
};

// ============================================================================
// USER OPERATIONS
// ============================================================================

export const createUser = async (user: User): Promise<User> => {
  const dbData = userToDb(user);
  const { data, error } = await supabase
    .from('users')
    .insert(dbData)
    .select()
    .single();
  
  if (error) handleError(error, 'createUser');
  return dbToUser(data);
};

export const getUsersByShop = async (shopId: string): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('shop_id', shopId);
  
  if (error) handleError(error, 'getUsersByShop');
  return (data || []).map(dbToUser);
};

export const getUserByCredentials = async (shopId: string, usernameOrEmail: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('shop_id', shopId)
    .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
    .single();
  
  if (error && error.code !== 'PGRST116') handleError(error, 'getUserByCredentials');
  return data ? dbToUser(data) : null;
};

// Authenticate user globally (without needing shop_id first)
// Returns user and their shop settings if found
export const authenticateUser = async (usernameOrEmail: string, password: string): Promise<{
  user: User | null;
  shopSettings: ShopSettings | null;
}> => {
  // Search for user by email or username (case-insensitive)
  const searchTerm = usernameOrEmail.toLowerCase().trim();
  
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.ilike."${searchTerm}",email.ilike."${searchTerm}"`);
  
  if (error) {
    console.error('Supabase authenticateUser error:', error);
    return { user: null, shopSettings: null };
  }
  
  // Find user with matching password
  const matchingUser = users?.find(u => u.password === password);
  
  if (!matchingUser) {
    return { user: null, shopSettings: null };
  }
  
  const user = dbToUser(matchingUser);
  
  // Get shop settings for this user
  let shopSettings: ShopSettings | null = null;
  if (user.shopId) {
    try {
      shopSettings = await getShopSettings(user.shopId);
    } catch (e) {
      console.error('Failed to get shop settings:', e);
    }
  }
  
  return { user, shopSettings };
};

// Get all users and data for a shop (for loading after authentication)
export const loadShopDataAfterAuth = async (shopId: string): Promise<{
  users: User[];
  settings: ShopSettings | null;
  subscription: Subscription | null;
}> => {
  const [users, settings, subscription] = await Promise.all([
    getUsersByShop(shopId),
    getShopSettings(shopId).catch(() => null),
    getSubscriptionByShop(shopId).catch(() => null)
  ]);
  
  return { users, settings, subscription };
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  const dbUpdates: any = {};
  if (updates.username !== undefined) dbUpdates.username = updates.username;
  if (updates.password !== undefined) dbUpdates.password = updates.password;
  if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.language !== undefined) dbUpdates.language = updates.language;
  if (updates.profilePhoto !== undefined) dbUpdates.profile_photo = updates.profilePhoto;
  if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
  if (updates.lastLogin !== undefined) dbUpdates.last_login = updates.lastLogin;
  
  const { data, error } = await supabase
    .from('users')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) handleError(error, 'updateUser');
  return dbToUser(data);
};

// ============================================================================
// CATEGORY OPERATIONS
// ============================================================================

export const createCategory = async (category: Category): Promise<Category> => {
  const dbData = categoryToDb(category);
  const { data, error } = await supabase
    .from('categories')
    .insert(dbData)
    .select()
    .single();
  
  if (error) handleError(error, 'createCategory');
  return dbToCategory(data);
};

// System shop ID for default categories (available to all shops)
const SYSTEM_SHOP_ID = 'e02e8276-32da-4d4e-a455-0f1f232ffffe';

export const getDefaultCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('shop_id', SYSTEM_SHOP_ID)
    .eq('is_archived', false);
  
  if (error) {
    console.error('Error fetching default categories:', error);
    return [];
  }
  return (data || []).map(dbToCategory);
};

export const getCategoriesByShop = async (shopId: string): Promise<Category[]> => {
  // Fetch both shop-specific categories and default categories
  const [shopCategories, defaultCategories] = await Promise.all([
    (async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_archived', false);
      
      if (error) {
        console.error('Error fetching shop categories:', error);
        return [];
      }
      return (data || []).map(dbToCategory);
    })(),
    getDefaultCategories()
  ]);
  
  // Merge categories, avoiding duplicates by name (case-insensitive)
  const categoryMap = new Map<string, Category>();
  
  // First add default categories
  defaultCategories.forEach(cat => {
    const key = cat.name.toLowerCase();
    if (!categoryMap.has(key)) {
      categoryMap.set(key, cat);
    }
  });
  
  // Then add shop-specific categories (these will override defaults if same name)
  shopCategories.forEach(cat => {
    const key = cat.name.toLowerCase();
    categoryMap.set(key, cat);
  });
  
  return Array.from(categoryMap.values());
};

export const updateCategory = async (categoryId: string, updates: Partial<Category>): Promise<Category> => {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
  
  const { data, error } = await supabase
    .from('categories')
    .update(dbUpdates)
    .eq('id', categoryId)
    .select()
    .single();
  
  if (error) handleError(error, 'updateCategory');
  return dbToCategory(data);
};

// ============================================================================
// SUPPLIER OPERATIONS
// ============================================================================

export const createSupplier = async (supplier: Supplier): Promise<Supplier> => {
  const dbData = supplierToDb(supplier);
  const { data, error } = await supabase
    .from('suppliers')
    .insert(dbData)
    .select()
    .single();
  
  if (error) handleError(error, 'createSupplier');
  return dbToSupplier(data);
};

export const getSuppliersByShop = async (shopId: string): Promise<Supplier[]> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('shop_id', shopId);
  
  if (error) handleError(error, 'getSuppliersByShop');
  return (data || []).map(dbToSupplier);
};

export const updateSupplier = async (supplierId: string, updates: Partial<Supplier>): Promise<Supplier> => {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.contactPerson !== undefined) dbUpdates.contact_person = updates.contactPerson;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
  
  const { data, error } = await supabase
    .from('suppliers')
    .update(dbUpdates)
    .eq('id', supplierId)
    .select()
    .single();
  
  if (error) handleError(error, 'updateSupplier');
  return dbToSupplier(data);
};

// ============================================================================
// PRODUCT OPERATIONS
// ============================================================================

export const createProduct = async (product: Product): Promise<Product> => {
  const dbData = productToDb(product);
  
  // Use upsert to handle potential duplicates (updates if exists, inserts if not)
  const { data, error } = await supabase
    .from('products')
    .upsert(dbData, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    })
    .select()
    .single();
  
  if (error) handleError(error, 'createProduct');
  return dbToProduct(data);
};

export const getProductsByShop = async (shopId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId);
  
  if (error) handleError(error, 'getProductsByShop');
  return (data || []).map(dbToProduct);
};

export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<Product> => {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.translations !== undefined) dbUpdates.translations = updates.translations;
  if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
  if (updates.supplierId !== undefined) dbUpdates.supplier_id = updates.supplierId;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.costPriceCarton !== undefined) dbUpdates.cost_price_carton = updates.costPriceCarton;
  if (updates.costPriceUnit !== undefined) dbUpdates.cost_price_unit = updates.costPriceUnit;
  if (updates.cartonPrice !== undefined) dbUpdates.carton_price = updates.cartonPrice;
  if (updates.unitPrice !== undefined) dbUpdates.unit_price = updates.unitPrice;
  if (updates.unitsPerCarton !== undefined) dbUpdates.units_per_carton = updates.unitsPerCarton;
  if (updates.stockCartons !== undefined) dbUpdates.stock_cartons = updates.stockCartons;
  if (updates.stockUnits !== undefined) dbUpdates.stock_units = updates.stockUnits;
  if (updates.totalUnits !== undefined) dbUpdates.total_units = updates.totalUnits;
  if (updates.minStockLevel !== undefined) dbUpdates.min_stock_level = updates.minStockLevel;
  if (updates.batchNumber !== undefined) dbUpdates.batch_number = updates.batchNumber;
  if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate;
  if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
  
  const { data, error } = await supabase
    .from('products')
    .update(dbUpdates)
    .eq('id', productId)
    .select()
    .single();
  
  if (error) handleError(error, 'updateProduct');
  return dbToProduct(data);
};

// ============================================================================
// CUSTOMER OPERATIONS
// ============================================================================

export const createCustomer = async (customer: Customer): Promise<Customer> => {
  const dbData = customerToDb(customer);
  const { data, error } = await supabase
    .from('customers')
    .insert(dbData)
    .select()
    .single();
  
  if (error) handleError(error, 'createCustomer');
  return dbToCustomer(data);
};

export const getCustomersByShop = async (shopId: string): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shopId);
  
  if (error) handleError(error, 'getCustomersByShop');
  return (data || []).map(dbToCustomer);
};

export const updateCustomer = async (customerId: string, updates: Partial<Customer>): Promise<Customer> => {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.totalDebt !== undefined) dbUpdates.total_debt = updates.totalDebt;
  if (updates.lastPurchaseDate !== undefined) dbUpdates.last_purchase_date = updates.lastPurchaseDate;
  if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
  
  const { data, error } = await supabase
    .from('customers')
    .update(dbUpdates)
    .eq('id', customerId)
    .select()
    .single();
  
  if (error) handleError(error, 'updateCustomer');
  return dbToCustomer(data);
};

// ============================================================================
// SALE OPERATIONS
// ============================================================================

export const createSale = async (sale: Sale): Promise<Sale> => {
  const dbData = saleToDb(sale);
  
  // Check if sale already exists (duplicate key scenario)
  const { data: existing } = await supabase
    .from('sales')
    .select('*')
    .eq('id', sale.id)
    .single();
  
  if (existing) {
    // Sale already exists, return it
    console.log('ℹ️ Sale already exists in Supabase, skipping insert:', sale.id);
    return dbToSale(existing);
  }
  
  // Use upsert to handle potential race conditions
  const { data, error } = await supabase
    .from('sales')
    .upsert(dbData, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    })
    .select()
    .single();
  
  if (error) {
    // If it's a duplicate key error, try to fetch the existing sale
    if (error.code === '23505') {
      console.log('ℹ️ Duplicate sale detected, fetching existing:', sale.id);
      const { data: existingSale } = await supabase
        .from('sales')
        .select('*')
        .eq('id', sale.id)
        .single();
      if (existingSale) {
        return dbToSale(existingSale);
      }
    }
    handleError(error, 'createSale');
  }
  return dbToSale(data);
};

export const getSalesByShop = async (shopId: string): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  
  if (error) handleError(error, 'getSalesByShop');
  return (data || []).map(dbToSale);
};

// ============================================================================
// DEBT TRANSACTION OPERATIONS
// ============================================================================

export const createDebtTransaction = async (transaction: DebtTransaction): Promise<DebtTransaction> => {
  const dbData = debtTransactionToDb(transaction);
  
  // Check if transaction already exists
  const { data: existing } = await supabase
    .from('debt_transactions')
    .select('*')
    .eq('id', transaction.id)
    .single();
  
  if (existing) {
    console.log('ℹ️ Debt transaction already exists, skipping insert:', transaction.id);
    return dbToDebtTransaction(existing);
  }
  
  // Use upsert to handle duplicates
  const { data, error } = await supabase
    .from('debt_transactions')
    .upsert(dbData, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    })
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') {
      const { data: existingTransaction } = await supabase
        .from('debt_transactions')
        .select('*')
        .eq('id', transaction.id)
        .single();
      if (existingTransaction) {
        return dbToDebtTransaction(existingTransaction);
      }
    }
    handleError(error, 'createDebtTransaction');
  }
  return dbToDebtTransaction(data);
};

export const getDebtTransactionsByShop = async (shopId: string): Promise<DebtTransaction[]> => {
  const { data, error } = await supabase
    .from('debt_transactions')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  
  if (error) handleError(error, 'getDebtTransactionsByShop');
  return (data || []).map(dbToDebtTransaction);
};

// ============================================================================
// STOCK MOVEMENT OPERATIONS
// ============================================================================

export const createStockMovement = async (movement: StockMovement): Promise<StockMovement> => {
  const dbData = stockMovementToDb(movement);
  
  // Check if movement already exists
  const { data: existing } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('id', movement.id)
    .single();
  
  if (existing) {
    console.log('ℹ️ Stock movement already exists, skipping insert:', movement.id);
    return dbToStockMovement(existing);
  }
  
  // Use upsert to handle duplicates
  const { data, error } = await supabase
    .from('stock_movements')
    .upsert(dbData, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    })
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') {
      const { data: existingMovement } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('id', movement.id)
        .single();
      if (existingMovement) {
        return dbToStockMovement(existingMovement);
      }
    }
    handleError(error, 'createStockMovement');
  }
  return dbToStockMovement(data);
};

export const getStockMovementsByShop = async (shopId: string): Promise<StockMovement[]> => {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  
  if (error) handleError(error, 'getStockMovementsByShop');
  return (data || []).map(dbToStockMovement);
};

// ============================================================================
// EXPENSE OPERATIONS
// ============================================================================

export const createExpense = async (expense: Expense): Promise<Expense> => {
  const dbData = expenseToDb(expense);
  const { data, error } = await supabase
    .from('expenses')
    .insert(dbData)
    .select()
    .single();
  
  if (error) handleError(error, 'createExpense');
  return dbToExpense(data);
};

export const getExpensesByShop = async (shopId: string): Promise<Expense[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('shop_id', shopId);
  
  if (error) handleError(error, 'getExpensesByShop');
  return (data || []).map(dbToExpense);
};

export const updateExpense = async (expenseId: string, updates: Partial<Expense>): Promise<Expense> => {
  const dbUpdates: any = {};
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;
  
  const { data, error } = await supabase
    .from('expenses')
    .update(dbUpdates)
    .eq('id', expenseId)
    .select()
    .single();
  
  if (error) handleError(error, 'updateExpense');
  return dbToExpense(data);
};

// ============================================================================
// GIFT CARD OPERATIONS
// ============================================================================

export const createGiftCard = async (giftCard: GiftCard): Promise<GiftCard> => {
  const dbData = giftCardToDb(giftCard);
  const { data, error } = await supabase
    .from('gift_cards')
    .insert(dbData)
    .select()
    .single();
  
  if (error) handleError(error, 'createGiftCard');
  return dbToGiftCard(data);
};

export const getGiftCardsByShop = async (shopId: string): Promise<GiftCard[]> => {
  const { data, error } = await supabase
    .from('gift_cards')
    .select('*')
    .eq('shop_id', shopId);
  
  if (error) handleError(error, 'getGiftCardsByShop');
  return (data || []).map(dbToGiftCard);
};

export const updateGiftCard = async (giftCardId: string, updates: Partial<GiftCard>): Promise<GiftCard> => {
  const dbUpdates: any = {};
  if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  
  const { data, error } = await supabase
    .from('gift_cards')
    .update(dbUpdates)
    .eq('id', giftCardId)
    .select()
    .single();
  
  if (error) handleError(error, 'updateGiftCard');
  return dbToGiftCard(data);
};

export const deleteGiftCardDb = async (giftCardId: string): Promise<void> => {
  const { error } = await supabase
    .from('gift_cards')
    .delete()
    .eq('id', giftCardId);
  
  if (error) handleError(error, 'deleteGiftCard');
};

// ============================================================================
// ACTIVITY LOG OPERATIONS
// ============================================================================

export const createActivityLog = async (log: ActivityLog): Promise<ActivityLog> => {
  const dbData = activityLogToDb(log);
  
  // Check if log already exists
  const { data: existing } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('id', log.id)
    .single();
  
  if (existing) {
    console.log('ℹ️ Activity log already exists, skipping insert:', log.id);
    return dbToActivityLog(existing);
  }
  
  // Use upsert to handle duplicates
  const { data, error } = await supabase
    .from('activity_logs')
    .upsert(dbData, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    })
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') {
      const { data: existingLog } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('id', log.id)
        .single();
      if (existingLog) {
        return dbToActivityLog(existingLog);
      }
    }
    handleError(error, 'createActivityLog');
  }
  return dbToActivityLog(data);
};

export const getActivityLogsByShop = async (shopId: string): Promise<ActivityLog[]> => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  
  if (error) handleError(error, 'getActivityLogsByShop');
  return (data || []).map(dbToActivityLog);
};

// ============================================================================
// SUBSCRIPTION OPERATIONS
// ============================================================================

export const createSubscription = async (subscription: Subscription): Promise<Subscription> => {
  const dbData = subscriptionToDb(subscription);
  const { data, error } = await supabase
    .from('subscriptions')
    .insert(dbData)
    .select()
    .single();
  
  if (error) handleError(error, 'createSubscription');
  return dbToSubscription(data);
};

export const getSubscriptionByShop = async (shopId: string): Promise<Subscription | null> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('shop_id', shopId)
    .single();
  
  if (error && error.code !== 'PGRST116') handleError(error, 'getSubscriptionByShop');
  return data ? dbToSubscription(data) : null;
};

export const updateSubscription = async (subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription> => {
  const dbUpdates: any = {};
  if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.subscriptionStartDate !== undefined) dbUpdates.subscription_start_date = updates.subscriptionStartDate;
  if (updates.subscriptionEndDate !== undefined) dbUpdates.subscription_end_date = updates.subscriptionEndDate;
  if (updates.lastPaymentDate !== undefined) dbUpdates.last_payment_date = updates.lastPaymentDate;
  if (updates.lastPaymentAmount !== undefined) dbUpdates.last_payment_amount = updates.lastPaymentAmount;
  if (updates.paymentReference !== undefined) dbUpdates.payment_reference = updates.paymentReference;
  if (updates.lastVerifiedAt !== undefined) dbUpdates.last_verified_at = updates.lastVerifiedAt;
  if (updates.verificationChecksum !== undefined) dbUpdates.verification_checksum = updates.verificationChecksum;
  
  const { data, error } = await supabase
    .from('subscriptions')
    .update(dbUpdates)
    .eq('id', subscriptionId)
    .select()
    .single();
  
  if (error) handleError(error, 'updateSubscription');
  return dbToSubscription(data);
};

// ============================================================================
// PAYMENT RECORD OPERATIONS
// ============================================================================

export const createPaymentRecordDb = async (payment: PaymentRecord): Promise<PaymentRecord> => {
  const dbData = paymentRecordToDb(payment);
  const { data, error } = await supabase
    .from('payment_records')
    .insert(dbData)
    .select()
    .single();
  
  if (error) handleError(error, 'createPaymentRecord');
  return dbToPaymentRecord(data);
};

export const getPaymentsByShop = async (shopId: string): Promise<PaymentRecord[]> => {
  const { data, error } = await supabase
    .from('payment_records')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  
  if (error) handleError(error, 'getPaymentsByShop');
  return (data || []).map(dbToPaymentRecord);
};

export const getAllPaymentsDb = async (): Promise<PaymentRecord[]> => {
  const { data, error } = await supabase
    .from('payment_records')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) handleError(error, 'getAllPayments');
  return (data || []).map(dbToPaymentRecord);
};

// ============================================================================
// PAYMENT VERIFICATION OPERATIONS
// ============================================================================

export interface PaymentVerificationDb {
  payment_reference: string;
  shop_id: string;
  status: 'success' | 'failed' | 'pending';
  verified_at: string;
  amount?: number;
  currency?: string;
  customer_email?: string;
  paystack_response?: Record<string, any>;
  error_message?: string;
  verification_method: 'api' | 'callback' | 'manual';
}

export const createPaymentVerificationDb = async (
  verification: PaymentVerificationDb
): Promise<void> => {
  const { error } = await supabase
    .from('payment_verifications')
    .upsert({
      payment_reference: verification.payment_reference,
      shop_id: verification.shop_id,
      status: verification.status,
      verified_at: verification.verified_at,
      amount: verification.amount || null,
      currency: verification.currency || 'NGN',
      customer_email: verification.customer_email || null,
      paystack_response: verification.paystack_response || null,
      error_message: verification.error_message || null,
      verification_method: verification.verification_method,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'payment_reference'
    });
  
  if (error) {
    console.error('❌ Failed to create payment verification:', error);
    // Don't throw - verification is for audit, not critical for payment flow
  }
};

export const getPaymentVerificationDb = async (
  paymentReference: string
): Promise<PaymentVerificationDb | null> => {
  const { data, error } = await supabase
    .from('payment_verifications')
    .select('*')
    .eq('payment_reference', paymentReference)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('❌ Failed to get payment verification:', error);
    return null;
  }
  
  return data;
};

// ============================================================================
// ADMIN USER OPERATIONS
// ============================================================================

export interface AdminUserDb {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export const createAdminUserDb = async (
  username: string,
  passwordHash: string
): Promise<void> => {
  // Check if admin user already exists
  const existing = await getAdminUserByUsernameDb(username);
  if (existing) {
    throw new Error('Admin user already exists');
  }
  
  const { error } = await supabase
    .from('admin_users')
    .insert({
      username: username.trim(),
      password_hash: passwordHash
    });
  
  if (error) handleError(error, 'createAdminUser');
};

export const getAdminUserByUsernameDb = async (
  username: string
): Promise<AdminUserDb | null> => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username.trim())
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    handleError(error, 'getAdminUserByUsername');
  }
  
  return data;
};

export const verifyAdminUserDb = async (
  username: string,
  passwordHash: string
): Promise<boolean> => {
  const user = await getAdminUserByUsernameDb(username);
  if (!user) return false;
  
  return user.password_hash === passwordHash;
};

export const updateAdminUserPasswordDb = async (
  username: string,
  newPasswordHash: string
): Promise<void> => {
  const { error } = await supabase
    .from('admin_users')
    .update({
      password_hash: newPasswordHash,
      updated_at: new Date().toISOString()
    })
    .eq('username', username.trim());
  
  if (error) handleError(error, 'updateAdminUserPassword');
};

export const updateAdminUserLastLoginDb = async (
  username: string
): Promise<void> => {
  const { error } = await supabase
    .from('admin_users')
    .update({
      last_login: new Date().toISOString()
    })
    .eq('username', username.trim());
  
  if (error) {
    console.error('Failed to update admin last login:', error);
    // Don't throw - this is not critical
  }
};

export const hasAdminUserDb = async (): Promise<boolean> => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .limit(1);
  
  if (error) {
    console.error('Failed to check admin users:', error);
    return false;
  }
  
  return (data?.length || 0) > 0;
};

// ============================================================================
// USER PREFERENCES OPERATIONS
// ============================================================================

export interface UserPreferenceDb {
  id: string;
  shop_id: string;
  user_id: string;
  preference_key: string;
  preference_value: string;
  created_at: string;
  updated_at: string;
}

export const getUserPreference = async (
  shopId: string,
  userId: string,
  preferenceKey: string
): Promise<string | null> => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('preference_value')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .eq('preference_key', preferenceKey)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Failed to get user preference:', error);
    return null;
  }
  
  return data?.preference_value || null;
};

export const setUserPreference = async (
  shopId: string,
  userId: string,
  preferenceKey: string,
  preferenceValue: string
): Promise<void> => {
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      shop_id: shopId,
      user_id: userId,
      preference_key: preferenceKey,
      preference_value: preferenceValue,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'shop_id,user_id,preference_key'
    });
  
  if (error) {
    console.error('Failed to set user preference:', error);
    // Don't throw - preferences are not critical
  }
};

export const getUserPreferences = async (
  shopId: string,
  userId: string
): Promise<Record<string, string>> => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('preference_key, preference_value')
    .eq('shop_id', shopId)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Failed to get user preferences:', error);
    return {};
  }
  
  const preferences: Record<string, string> = {};
  (data || []).forEach(pref => {
    preferences[pref.preference_key] = pref.preference_value;
  });
  
  return preferences;
};

// ============================================================================
// ADMIN CONFIG OPERATIONS
// ============================================================================

export const getAdminConfigDb = async (): Promise<AdminConfig | null> => {
  const { data, error } = await supabase
    .from('admin_config')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000000')
    .single();
  
  if (error && error.code !== 'PGRST116') handleError(error, 'getAdminConfig');
  return data ? dbToAdminConfig(data) : null;
};

export const updateAdminConfigDb = async (updates: Partial<AdminConfig>): Promise<AdminConfig> => {
  const dbUpdates = adminConfigToDb(updates as AdminConfig);
  const { data, error } = await supabase
    .from('admin_config')
    .update(dbUpdates)
    .eq('id', '00000000-0000-0000-0000-000000000000')
    .select()
    .single();
  
  if (error) handleError(error, 'updateAdminConfig');
  return dbToAdminConfig(data);
};

// ============================================================================
// COUPON OPERATIONS
// ============================================================================

export const createCouponDb = async (coupon: Coupon): Promise<Coupon> => {
  const dbData = couponToDb(coupon);
  const { data, error } = await supabase
    .from('coupons')
    .insert(dbData)
    .select()
    .single();
  
  if (error) handleError(error, 'createCoupon');
  return dbToCoupon(data);
};

export const getAllCouponsDb = async (): Promise<Coupon[]> => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) handleError(error, 'getAllCoupons');
  return (data || []).map(dbToCoupon);
};

export const updateCouponDb = async (couponId: string, updates: Partial<Coupon>): Promise<Coupon> => {
  const dbUpdates: any = {};
  if (updates.code !== undefined) dbUpdates.code = updates.code;
  if (updates.discountType !== undefined) dbUpdates.discount_type = updates.discountType;
  if (updates.discountValue !== undefined) dbUpdates.discount_value = updates.discountValue;
  if (updates.applicablePlans !== undefined) dbUpdates.applicable_plans = updates.applicablePlans;
  if (updates.expirationDate !== undefined) dbUpdates.expiration_date = updates.expirationDate;
  if (updates.maxUses !== undefined) dbUpdates.max_uses = updates.maxUses;
  if (updates.currentUses !== undefined) dbUpdates.current_uses = updates.currentUses;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  
  const { data, error } = await supabase
    .from('coupons')
    .update(dbUpdates)
    .eq('id', couponId)
    .select()
    .single();
  
  if (error) handleError(error, 'updateCoupon');
  return dbToCoupon(data);
};

export const deleteCouponDb = async (couponId: string): Promise<void> => {
  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', couponId);
  
  if (error) handleError(error, 'deleteCoupon');
};

// ============================================================================
// COUPON USAGE OPERATIONS
// ============================================================================

export const createCouponUsageDb = async (usage: CouponUsage): Promise<CouponUsage> => {
  const dbData = couponUsageToDb(usage);
  const { data, error } = await supabase
    .from('coupon_usages')
    .insert(dbData)
    .select()
    .single();
  
  if (error) handleError(error, 'createCouponUsage');
  return dbToCouponUsage(data);
};

export const getAllCouponUsagesDb = async (): Promise<CouponUsage[]> => {
  const { data, error } = await supabase
    .from('coupon_usages')
    .select('*')
    .order('used_at', { ascending: false });
  
  if (error) handleError(error, 'getAllCouponUsages');
  return (data || []).map(dbToCouponUsage);
};

// ============================================================================
// AI USAGE RECORD OPERATIONS
// ============================================================================

export const createAIUsageRecordDb = async (record: AIUsageRecord): Promise<AIUsageRecord> => {
  const dbData = aiUsageRecordToDb(record);
  const { data, error } = await supabase
    .from('ai_usage_records')
    .insert(dbData)
    .select()
    .single();
  
  if (error) handleError(error, 'createAIUsageRecord');
  return dbToAIUsageRecord(data);
};

export const getAllAIUsageRecordsDb = async (): Promise<AIUsageRecord[]> => {
  const { data, error } = await supabase
    .from('ai_usage_records')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) handleError(error, 'getAllAIUsageRecords');
  return (data || []).map(dbToAIUsageRecord);
};

export const updateAIUsageRecordDb = async (recordId: string, updates: Partial<AIUsageRecord>): Promise<AIUsageRecord> => {
  const dbUpdates: any = {};
  if (updates.response !== undefined) dbUpdates.response = updates.response;
  if (updates.isAbuse !== undefined) dbUpdates.is_abuse = updates.isAbuse;
  if (updates.abuseReason !== undefined) dbUpdates.abuse_reason = updates.abuseReason;
  
  const { data, error } = await supabase
    .from('ai_usage_records')
    .update(dbUpdates)
    .eq('id', recordId)
    .select()
    .single();
  
  if (error) handleError(error, 'updateAIUsageRecord');
  return dbToAIUsageRecord(data);
};

// ============================================================================
// SHOP SUMMARY OPERATIONS
// ============================================================================

export const createShopSummaryDb = async (summary: ShopSummary): Promise<ShopSummary> => {
  const dbData = shopSummaryToDb(summary);
  const { data, error } = await supabase
    .from('shop_summaries')
    .insert(dbData)
    .select()
    .single();
  
  if (error) handleError(error, 'createShopSummary');
  return dbToShopSummary(data);
};

export const getAllShopSummariesDb = async (): Promise<ShopSummary[]> => {
  const { data, error } = await supabase
    .from('shop_summaries')
    .select('*')
    .order('registered_date', { ascending: false });
  
  if (error) handleError(error, 'getAllShopSummaries');
  return (data || []).map(dbToShopSummary);
};

export const getShopSummaryDb = async (shopId: string): Promise<ShopSummary | null> => {
  const { data, error } = await supabase
    .from('shop_summaries')
    .select('*')
    .eq('shop_id', shopId)
    .single();
  
  if (error && error.code !== 'PGRST116') handleError(error, 'getShopSummary');
  return data ? dbToShopSummary(data) : null;
};

export const updateShopSummaryDb = async (shopId: string, updates: Partial<ShopSummary>): Promise<ShopSummary> => {
  const dbUpdates: any = {};
  if (updates.shopName !== undefined) dbUpdates.shop_name = updates.shopName;
  if (updates.subscriptionStatus !== undefined) dbUpdates.subscription_status = updates.subscriptionStatus;
  if (updates.subscriptionPlan !== undefined) dbUpdates.subscription_plan = updates.subscriptionPlan;
  if (updates.lastPaymentDate !== undefined) dbUpdates.last_payment_date = updates.lastPaymentDate;
  if (updates.subscriptionEndDate !== undefined) dbUpdates.subscription_end_date = updates.subscriptionEndDate;
  if (updates.trialEndDate !== undefined) dbUpdates.trial_end_date = updates.trialEndDate;
  if (updates.totalRevenue !== undefined) dbUpdates.total_revenue = updates.totalRevenue;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.aiEnabled !== undefined) dbUpdates.ai_enabled = updates.aiEnabled;
  
  const { data, error } = await supabase
    .from('shop_summaries')
    .update(dbUpdates)
    .eq('shop_id', shopId)
    .select()
    .single();
  
  if (error) handleError(error, 'updateShopSummary');
  return dbToShopSummary(data);
};

// ============================================================================
// BATCH OPERATIONS - Load all shop data at once
// ============================================================================

export const loadAllShopData = async (shopId: string) => {
  const [
    settings,
    users,
    categories,
    suppliers,
    products,
    customers,
    sales,
    debtTransactions,
    stockMovements,
    expenses,
    giftCards,
    activityLogs,
    subscription,
    payments,
  ] = await Promise.all([
    getShopSettings(shopId),
    getUsersByShop(shopId),
    getCategoriesByShop(shopId),
    getSuppliersByShop(shopId),
    getProductsByShop(shopId),
    getCustomersByShop(shopId),
    getSalesByShop(shopId),
    getDebtTransactionsByShop(shopId),
    getStockMovementsByShop(shopId),
    getExpensesByShop(shopId),
    getGiftCardsByShop(shopId),
    getActivityLogsByShop(shopId),
    getSubscriptionByShop(shopId),
    getPaymentsByShop(shopId),
  ]);

  return {
    settings,
    users,
    categories,
    suppliers,
    products,
    customers,
    sales,
    debtTransactions,
    stockMovements,
    expenses,
    giftCards,
    activityLogs,
    subscription,
    payments,
  };
};

// ============================================================================
// SHOP DATA RESET FUNCTIONS (Admin Only)
// ============================================================================

export const resetShopSales = async (shopId: string): Promise<void> => {
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('shop_id', shopId);
  
  if (error) handleError(error, 'resetShopSales');
};

export const resetShopCustomers = async (shopId: string): Promise<void> => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('shop_id', shopId);
  
  if (error) handleError(error, 'resetShopCustomers');
};

export const resetShopDebtTransactions = async (shopId: string): Promise<void> => {
  const { error } = await supabase
    .from('debt_transactions')
    .delete()
    .eq('shop_id', shopId);
  
  if (error) handleError(error, 'resetShopDebtTransactions');
};

export const resetShopExpenses = async (shopId: string): Promise<void> => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('shop_id', shopId);
  
  if (error) handleError(error, 'resetShopExpenses');
};

export const resetShopGiftCards = async (shopId: string): Promise<void> => {
  const { error } = await supabase
    .from('gift_cards')
    .delete()
    .eq('shop_id', shopId);
  
  if (error) handleError(error, 'resetShopGiftCards');
};

export const resetShopActivityLogs = async (shopId: string): Promise<void> => {
  const { error } = await supabase
    .from('activity_logs')
    .delete()
    .eq('shop_id', shopId);
  
  if (error) handleError(error, 'resetShopActivityLogs');
};

export const resetShopStockMovements = async (shopId: string): Promise<void> => {
  const { error } = await supabase
    .from('stock_movements')
    .delete()
    .eq('shop_id', shopId);
  
  if (error) handleError(error, 'resetShopStockMovements');
};

export interface ResetShopDataOptions {
  sales?: boolean;
  customers?: boolean;
  debtTransactions?: boolean;
  expenses?: boolean;
  giftCards?: boolean;
  activityLogs?: boolean;
  stockMovements?: boolean;
  // Note: products/stocks are NOT reset by default
}

export const resetShopData = async (shopId: string, options: ResetShopDataOptions): Promise<void> => {
  const resetPromises: Promise<void>[] = [];
  
  if (options.sales) {
    resetPromises.push(resetShopSales(shopId));
  }
  if (options.customers) {
    resetPromises.push(resetShopCustomers(shopId));
  }
  if (options.debtTransactions) {
    resetPromises.push(resetShopDebtTransactions(shopId));
  }
  if (options.expenses) {
    resetPromises.push(resetShopExpenses(shopId));
  }
  if (options.giftCards) {
    resetPromises.push(resetShopGiftCards(shopId));
  }
  if (options.activityLogs) {
    resetPromises.push(resetShopActivityLogs(shopId));
  }
  if (options.stockMovements) {
    resetPromises.push(resetShopStockMovements(shopId));
  }
  
  await Promise.all(resetPromises);
};

