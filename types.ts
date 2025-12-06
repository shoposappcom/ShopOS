
export type Language = 'en' | 'ha' | 'yo' | 'ig' | 'ar' | 'fr';

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'cashier' | 'stock_clerk';

export type UserStatus = 'active' | 'inactive';

export type SubscriptionPlan = 'monthly' | 'yearly';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';

export interface Subscription {
  id: string;
  shopId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialStartDate: string; // ISO date
  trialEndDate: string; // ISO date (trialStartDate + 7 days)
  subscriptionStartDate?: string; // ISO date (when payment made)
  subscriptionEndDate?: string; // ISO date (when subscription expires)
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  paymentReference?: string; // Paystack reference
  createdAt: string;
  updatedAt: string;
  // Anti-tampering fields
  lastVerifiedAt: string; // Last time subscription was checked
  verificationChecksum?: string; // Hash to detect tampering
}

export interface User {
  id: string;
  shopId?: string; // Link user to specific shop
  username: string;
  password: string; // In a real app, this would be hashed
  fullName: string;
  role: UserRole;
  phone?: string;
  email?: string;
  status: UserStatus;
  language: Language;
  createdAt: string;
  lastLogin?: string;
  profilePhoto?: string;
  isArchived?: boolean;
}

export interface ActivityLog {
  id: string;
  shopId: string; // Foreign Key: shopId → ShopSettings.shopId
  userId: string; // Foreign Key: userId → User.id
  userName: string; // Denormalized for performance
  action: string;
  details: string;
  createdAt: string; // ISO date (renamed from timestamp)
}

export interface Category {
  id: string;
  shopId: string; // Foreign Key: shopId → ShopSettings.shopId
  name: string;
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
  isArchived?: boolean;
}

export interface Supplier {
  id: string;
  shopId: string; // Foreign Key: shopId → ShopSettings.shopId
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
  isArchived?: boolean;
}

export interface Expense {
  id: string;
  shopId: string; // Foreign Key: shopId → ShopSettings.shopId
  description: string;
  amount: number;
  category: string; // e.g., Rent, Utilities, Salary, Miscellaneous
  date: string; // ISO date
  recordedByUserId: string; // Foreign Key: recordedByUserId → User.id
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
  isArchived?: boolean;
}

export interface StockMovement {
  id: string;
  shopId: string; // Foreign Key: shopId → ShopSettings.shopId
  productId: string; // Foreign Key: productId → Product.id
  type: 'restock' | 'sale' | 'adjustment' | 'return' | 'audit';
  quantityChange: number; // Positive or Negative
  quantityType: 'carton' | 'unit';
  balanceAfter: number; // Total units after movement
  createdAt: string; // ISO date (renamed from timestamp)
  userId: string; // Foreign Key: userId → User.id
  note?: string;
  batchNumber?: string;
}

export interface Product {
  id: string;
  shopId: string; // Foreign Key: shopId → ShopSettings.shopId
  name: string; // Default name (English)
  translations?: Partial<Record<Language, { name: string; category: string }>>;
  barcode: string;
  category: string; // Display category name (kept for UI speed)
  categoryId?: string; // Foreign Key: categoryId → Category.id
  supplierId?: string; // Foreign Key: supplierId → Supplier.id
  image?: string; // Base64 or URL
  
  // Pricing & Units
  costPriceCarton: number;
  costPriceUnit: number; // Auto-calculated: costPriceCarton / unitsPerCarton
  cartonPrice: number; // Selling Price
  unitPrice: number; // Selling Price
  unitsPerCarton: number;
  
  // Stock (Computed from totalUnits usually, but kept for UI convenience)
  stockCartons: number; 
  stockUnits: number;
  totalUnits: number; // Master source of truth: (stockCartons * unitsPerCarton) + stockUnits
  
  minStockLevel: number;
  
  // Pharmacy / Specific
  batchNumber?: string;
  expiryDate?: string;
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
  isArchived?: boolean;
}

export interface CartItem extends Product {
  cartId: string;
  quantityType: 'carton' | 'unit';
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  shopId: string; // Foreign Key: shopId → ShopSettings.shopId
  date: string; // ISO date
  cashierId: string; // Foreign Key: cashierId → User.id
  cashierName: string; // Denormalized for performance
  items: CartItem[]; // Embedded array (can be JSONB in Supabase)
  total: number;
  profit: number;
  paymentMethod: 'cash' | 'transfer' | 'pos' | 'credit' | 'gift_card' | 'split';
  customerId?: string; // Foreign Key: customerId → Customer.id (if tracked)
  isCredit: boolean;
  isDebtPayment?: boolean; // True if this sale represents a debt payment
  dueDate?: string; // ISO date (for credit sales)
  giftCardCode?: string; // If a gift card was used
  giftCardAmount?: number; // How much was deducted from the gift card
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
}

// Normalized Transaction (moved out of Customer object)
export interface DebtTransaction {
  id: string;
  shopId: string; // Foreign Key: shopId → ShopSettings.shopId
  customerId: string; // Foreign Key: customerId → Customer.id
  date: string; // ISO date
  type: 'credit' | 'payment';
  amount: number;
  saleId?: string; // Foreign Key: saleId → Sale.id (if linked)
  note?: string;
  createdAt: string; // ISO date
}

export interface Customer {
  id: string;
  shopId: string; // Foreign Key: shopId → ShopSettings.shopId
  name: string;
  phone: string;
  totalDebt: number;
  lastPurchaseDate?: string; // ISO date
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
  isArchived?: boolean;
}

export interface GiftCard {
  id: string;
  shopId: string; // Foreign Key: shopId → ShopSettings.shopId
  code: string;
  initialValue: number;
  balance: number;
  status: 'active' | 'empty';
  theme: 'standard' | 'gold' | 'dark' | 'festive';
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
  expiresAt?: string; // ISO date
}

export interface ShopSettings {
  shopId: string; // Unique ID for the shop tenant (Primary Key)
  businessName: string;
  address: string;
  phone: string;
  country: string;
  state: string;
  currency: string;
  receiptFooter: string;
  taxRate: number;
  autoBackup: 'off' | 'daily' | 'weekly' | 'monthly';
  lastBackupDate?: string; // ISO date
  showAIChatByDefault?: boolean; // Whether to show AI chat icon by default (default: true)
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
}

export interface RegistrationData {
  fullName: string;
  email: string;
  shopName: string;
  country: string;
  state: string;
  password: string;
}

export interface PaymentRecord {
  id: string;
  shopId: string;
  shopName: string;
  subscriptionId: string;
  plan: SubscriptionPlan;
  amount: number;
  paymentReference: string; // Paystack reference
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentDate: string; // ISO date
  verifiedAt?: string; // When payment was verified
  email: string;
  country: string;
  state: string;
  notes?: string;
  createdAt: string;
  couponCode?: string; // Coupon code used
  discountAmount?: number; // Discount applied
  originalAmount?: number; // Amount before discount
}

export interface Coupon {
  id: string;
  code: string; // Coupon code (uppercase, alphanumeric)
  discountType: 'percentage' | 'fixed'; // Type of discount
  discountValue: number; // Percentage (0-100) or fixed amount
  applicablePlans: SubscriptionPlan[]; // ['monthly', 'yearly'] or both
  expirationDate?: string; // ISO date, optional
  maxUses?: number; // Maximum number of times coupon can be used, optional
  currentUses: number; // Current usage count
  isActive: boolean; // Enable/disable coupon
  description?: string; // Optional description
  createdAt: string;
  updatedAt: string;
  createdBy: string; // Admin username
}

export interface CouponUsage {
  id: string; // Primary key (was missing)
  couponId: string; // Foreign Key: couponId → Coupon.id
  couponCode: string; // Denormalized for performance
  shopId: string; // Foreign Key: shopId → ShopSettings.shopId
  shopName: string; // Denormalized for performance
  paymentId: string; // Foreign Key: paymentId → PaymentRecord.id
  discountAmount: number; // Actual discount applied
  usedAt: string; // ISO date
}

export interface AIUsageRecord {
  id: string;
  shopId: string; // Foreign Key: shopId → ShopSettings.shopId
  shopName: string; // Denormalized for performance
  userId: string; // Foreign Key: userId → User.id
  userName: string; // Denormalized for performance
  prompt: string;
  response?: string;
  createdAt: string; // ISO date (renamed from timestamp)
  updatedAt?: string; // ISO date (for abuse marking)
  isAbuse?: boolean; // Manually marked by admin
  abuseReason?: string;
}

export interface AdminConfig {
  trialDays: number; // Default 7
  trialEnabled: boolean; // Can disable trial
  geminiApiKey?: string; // Stored in admin config
  paystackTestPublicKey?: string;
  paystackTestSecretKey?: string;
  paystackLivePublicKey?: string;
  paystackLiveSecretKey?: string;
  paystackMode?: 'test' | 'live'; // Default 'test'
  createdAt: string;
  updatedAt: string;
}

export interface ShopSummary {
  shopId: string;
  shopName: string;
  ownerEmail: string;
  ownerName: string;
  country: string;
  state: string;
  registeredDate: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan?: SubscriptionPlan;
  lastPaymentDate?: string;
  subscriptionEndDate?: string; // When subscription expires (for calculating days remaining)
  trialEndDate?: string; // When trial expires
  totalRevenue: number; // Total payments from this shop
  isActive: boolean;
  aiEnabled: boolean; // Per-shop AI control, default true
}

export interface AppState {
  users: User[];
  products: Product[];
  categories: Category[];
  suppliers: Supplier[]; // New table
  expenses: Expense[];   // New table
  sales: Sale[];
  customers: Customer[];
  debtTransactions: DebtTransaction[]; // New normalized table
  stockMovements: StockMovement[]; // New Audit Table
  giftCards: GiftCard[];
  activityLogs: ActivityLog[];
  settings: ShopSettings;
  currentUser: User | null;
  subscription: Subscription | null;
  payments: PaymentRecord[];
}

// AI Specific Types
export interface AIAction {
  type: 'RESTOCK' | 'NAVIGATE';
  payload: any;
  summary: string;
}

export interface AIMessage {
  role: 'user' | 'ai';
  text: string;
  action?: AIAction;
  timestamp?: number;
}

// Permission keys
export type PermissionAction = 
  | 'process_sales'
  | 'manage_stock'
  | 'manage_users'
  | 'view_reports'
  | 'view_financials'
  | 'manage_settings'
  | 'manage_debtors'
  | 'approve_credit'
  | 'manage_gift_cards';

export const PERMISSIONS: Record<UserRole, PermissionAction[] | '*'> = {
  superadmin: '*',
  admin: [
    'manage_users', // Limited to non-superadmin
    'manage_stock', 
    'process_sales', 
    'view_reports', 
    'view_financials', 
    'manage_settings', 
    'manage_debtors',
    'approve_credit',
    'manage_gift_cards'
  ],
  manager: [
    'process_sales', 
    'manage_stock', 
    'view_reports', // Limited
    'manage_debtors',
    'approve_credit', // Limited
    'manage_gift_cards'
  ],
  cashier: [
    'process_sales'
  ],
  stock_clerk: [
    'manage_stock'
  ]
};
