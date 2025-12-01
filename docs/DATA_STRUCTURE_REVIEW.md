# ShopOS Data Structure Review

## Entity Inventory & Field Documentation

### Core Shop Entities (Per-Shop Data)

#### 1. User
**Purpose:** Authentication and authorization for shop staff
**Fields:**
- `id: string` - Unique identifier
- `shopId?: string` - Foreign key to ShopSettings.shopId (optional for superadmin)
- `username: string` - Login username
- `password: string` - Hashed password (plain text in current implementation)
- `fullName: string` - Display name
- `role: UserRole` - 'superadmin' | 'admin' | 'manager' | 'cashier' | 'stock_clerk'
- `phone?: string` - Phone number
- `email?: string` - Email address
- `status: UserStatus` - 'active' | 'inactive'
- `language: Language` - Preferred language
- `createdAt: string` - ISO date timestamp
- `lastLogin?: string` - ISO date timestamp
- `profilePhoto?: string` - Profile image URL
- `isArchived?: boolean` - Soft delete flag

**Relationships:**
- shopId → ShopSettings.shopId (optional)
- Referenced by: ActivityLog.userId, StockMovement.userId, Sale.cashierId

**Missing for Supabase:**
- ✅ Has shopId (optional)
- ✅ Has timestamps
- ⚠️ Password should be properly hashed in production

---

#### 2. Product
**Purpose:** Inventory items/products sold in shop
**Fields:**
- `id: string` - Unique identifier
- `name: string` - Product name (English)
- `translations?: Partial<Record<Language, { name: string; category: string }>>` - Multi-language support
- `barcode: string` - Product barcode
- `category: string` - Display category name (denormalized)
- `categoryId?: string` - Foreign key to Category.id
- `supplierId?: string` - Foreign key to Supplier.id
- `image?: string` - Product image (Base64 or URL)
- `costPriceCarton: number` - Cost per carton
- `costPriceUnit: number` - Cost per unit (auto-calculated)
- `cartonPrice: number` - Selling price per carton
- `unitPrice: number` - Selling price per unit
- `unitsPerCarton: number` - Units in one carton
- `stockCartons: number` - Current stock in cartons
- `stockUnits: number` - Current stock in units
- `totalUnits: number` - Master source of truth
- `minStockLevel: number` - Minimum stock alert level
- `batchNumber?: string` - Batch number (pharmacy)
- `expiryDate?: string` - Expiry date (pharmacy)
- `isArchived?: boolean` - Soft delete flag

**Relationships:**
- categoryId → Category.id (optional)
- supplierId → Supplier.id (optional)
- Referenced by: StockMovement.productId, Sale.items[].id

**Missing for Supabase:**
- ❌ No shopId (CRITICAL for multi-tenancy)
- ❌ No createdAt/updatedAt timestamps
- ⚠️ Consider adding shopId to all shop-scoped entities

---

#### 3. Category
**Purpose:** Product categorization
**Fields:**
- `id: string` - Unique identifier
- `name: string` - Category name
- `isArchived?: boolean` - Soft delete flag

**Relationships:**
- Referenced by: Product.categoryId

**Missing for Supabase:**
- ❌ No shopId (CRITICAL for multi-tenancy)
- ❌ No createdAt/updatedAt timestamps

---

#### 4. Supplier
**Purpose:** Supplier/vendor management
**Fields:**
- `id: string` - Unique identifier
- `name: string` - Supplier name
- `contactPerson: string` - Contact person name
- `phone: string` - Phone number
- `email?: string` - Email address
- `address?: string` - Physical address
- `isArchived?: boolean` - Soft delete flag

**Relationships:**
- Referenced by: Product.supplierId

**Missing for Supabase:**
- ❌ No shopId (CRITICAL for multi-tenancy)
- ❌ No createdAt/updatedAt timestamps

---

#### 5. Customer
**Purpose:** Customer database for credit sales and tracking
**Fields:**
- `id: string` - Unique identifier
- `name: string` - Customer name
- `phone: string` - Phone number
- `totalDebt: number` - Total outstanding debt (denormalized)
- `lastPurchaseDate?: string` - ISO date of last purchase
- `isArchived?: boolean` - Soft delete flag

**Relationships:**
- Referenced by: DebtTransaction.customerId, Sale.customerId

**Missing for Supabase:**
- ❌ No shopId (CRITICAL for multi-tenancy)
- ❌ No createdAt/updatedAt timestamps

---

#### 6. Sale
**Purpose:** Sales transactions/orders
**Fields:**
- `id: string` - Unique identifier
- `date: string` - ISO date
- `cashierId: string` - Foreign key to User.id
- `cashierName: string` - Denormalized cashier name
- `items: CartItem[]` - Array of sold items (embedded)
- `total: number` - Total sale amount
- `profit: number` - Calculated profit
- `paymentMethod: 'cash' | 'transfer' | 'pos' | 'credit' | 'gift_card' | 'split'` - Payment type
- `customerId?: string` - Foreign key to Customer.id (optional)
- `isCredit: boolean` - Whether sale is on credit
- `dueDate?: string` - ISO date for credit sales
- `giftCardCode?: string` - Gift card code if used
- `giftCardAmount?: number` - Amount deducted from gift card

**Relationships:**
- cashierId → User.id
- customerId → Customer.id (optional)
- Referenced by: DebtTransaction.saleId

**Missing for Supabase:**
- ❌ No shopId (CRITICAL for multi-tenancy)
- ❌ No createdAt/updatedAt timestamps
- ⚠️ Consider normalizing Sale.items into SaleItem table

---

#### 7. DebtTransaction
**Purpose:** Normalized debt/credit transaction tracking
**Fields:**
- `id: string` - Unique identifier
- `customerId: string` - Foreign key to Customer.id
- `date: string` - ISO date
- `type: 'credit' | 'payment'` - Transaction type
- `amount: number` - Transaction amount
- `saleId?: string` - Foreign key to Sale.id (optional)
- `note?: string` - Additional notes

**Relationships:**
- customerId → Customer.id
- saleId → Sale.id (optional)

**Missing for Supabase:**
- ❌ No shopId (CRITICAL for multi-tenancy)
- ❌ No createdAt/updatedAt timestamps

---

#### 8. StockMovement
**Purpose:** Stock audit trail and movement tracking
**Fields:**
- `id: string` - Unique identifier
- `productId: string` - Foreign key to Product.id
- `type: 'restock' | 'sale' | 'adjustment' | 'return' | 'audit'` - Movement type
- `quantityChange: number` - Positive or negative change
- `quantityType: 'carton' | 'unit'` - Unit type
- `balanceAfter: number` - Stock balance after movement
- `timestamp: string` - ISO date timestamp
- `userId: string` - Foreign key to User.id
- `note?: string` - Additional notes
- `batchNumber?: string` - Batch number if applicable

**Relationships:**
- productId → Product.id
- userId → User.id

**Missing for Supabase:**
- ❌ No shopId (CRITICAL for multi-tenancy)
- ⚠️ Uses `timestamp` instead of `createdAt` (inconsistent)

---

#### 9. Expense
**Purpose:** Business expense tracking
**Fields:**
- `id: string` - Unique identifier
- `description: string` - Expense description
- `amount: number` - Expense amount
- `category: string` - Expense category (e.g., Rent, Utilities)
- `date: string` - ISO date
- `recordedBy: string` - User ID who recorded it
- `isArchived?: boolean` - Soft delete flag

**Relationships:**
- recordedBy → User.id (should be explicit FK)

**Missing for Supabase:**
- ❌ No shopId (CRITICAL for multi-tenancy)
- ❌ No createdAt/updatedAt timestamps
- ⚠️ `recordedBy` should be `recordedById` for clarity

---

#### 10. GiftCard
**Purpose:** Gift card system
**Fields:**
- `id: string` - Unique identifier
- `code: string` - Unique gift card code
- `initialValue: number` - Original value
- `balance: number` - Current balance
- `status: 'active' | 'empty'` - Card status
- `theme: 'standard' | 'gold' | 'dark' | 'festive'` - Visual theme
- `createdAt: string` - ISO date timestamp
- `expiresAt?: string` - Optional expiration date

**Relationships:**
- Referenced by: Sale.giftCardCode (code match)

**Missing for Supabase:**
- ❌ No shopId (CRITICAL for multi-tenancy)
- ❌ No updatedAt timestamp

---

#### 11. ActivityLog
**Purpose:** Audit log for user actions
**Fields:**
- `id: string` - Unique identifier
- `userId: string` - Foreign key to User.id
- `userName: string` - Denormalized user name
- `action: string` - Action type (e.g., 'ADD_PRODUCT')
- `details: string` - Action details
- `timestamp: string` - ISO date timestamp

**Relationships:**
- userId → User.id

**Missing for Supabase:**
- ❌ No shopId (CRITICAL for multi-tenancy)
- ⚠️ Uses `timestamp` instead of `createdAt` (inconsistent)

---

#### 12. ShopSettings
**Purpose:** Shop configuration and tenant entity
**Fields:**
- `shopId: string` - Unique shop identifier (primary key)
- `businessName: string` - Shop name
- `address: string` - Physical address
- `phone: string` - Contact phone
- `country: string` - Country
- `state: string` - State/province
- `currency: string` - Currency symbol
- `receiptFooter: string` - Receipt footer text
- `taxRate: number` - Tax rate percentage
- `autoBackup: 'off' | 'daily' | 'weekly' | 'monthly'` - Backup frequency
- `lastBackupDate?: string` - Last backup timestamp

**Relationships:**
- shopId is referenced by: User.shopId, Subscription.shopId, PaymentRecord.shopId

**Missing for Supabase:**
- ❌ No createdAt/updatedAt timestamps

---

#### 13. Subscription
**Purpose:** Subscription and trial management
**Fields:**
- `id: string` - Unique identifier
- `shopId: string` - Foreign key to ShopSettings.shopId
- `plan: SubscriptionPlan` - 'monthly' | 'yearly'
- `status: SubscriptionStatus` - 'trial' | 'active' | 'expired' | 'cancelled'
- `trialStartDate: string` - ISO date
- `trialEndDate: string` - ISO date
- `subscriptionStartDate?: string` - ISO date
- `subscriptionEndDate?: string` - ISO date
- `lastPaymentDate?: string` - ISO date
- `lastPaymentAmount?: number` - Last payment amount
- `paymentReference?: string` - Paystack reference
- `createdAt: string` - ISO date timestamp
- `updatedAt: string` - ISO date timestamp
- `lastVerifiedAt: string` - Last verification timestamp
- `verificationChecksum?: string` - Anti-tampering hash

**Relationships:**
- shopId → ShopSettings.shopId

**Missing for Supabase:**
- ✅ Has shopId
- ✅ Has timestamps

---

### Admin Entities (Global Data)

#### 14. AdminConfig
**Purpose:** Site creator/admin configuration
**Fields:**
- `trialDays: number` - Default trial period days
- `trialEnabled: boolean` - Whether trials are enabled
- `geminiApiKey?: string` - Gemini AI API key
- `paystackTestPublicKey?: string` - Paystack test public key
- `paystackTestSecretKey?: string` - Paystack test secret key
- `paystackLivePublicKey?: string` - Paystack live public key
- `paystackLiveSecretKey?: string` - Paystack live secret key
- `paystackMode?: 'test' | 'live'` - Paystack environment mode
- `createdAt: string` - ISO date timestamp
- `updatedAt: string` - ISO date timestamp

**Missing for Supabase:**
- ✅ Has timestamps
- ⚠️ Single row table (no shopId needed)

---

#### 15. ShopSummary
**Purpose:** Admin view of all shops (aggregated data)
**Fields:**
- `shopId: string` - Foreign key to ShopSettings.shopId
- `shopName: string` - Shop name
- `ownerEmail: string` - Owner email
- `ownerName: string` - Owner name
- `country: string` - Country
- `state: string` - State/province
- `registeredDate: string` - ISO date
- `subscriptionStatus: SubscriptionStatus` - Current status
- `subscriptionPlan?: SubscriptionPlan` - Current plan
- `lastPaymentDate?: string` - ISO date
- `totalRevenue: number` - Total payments
- `isActive: boolean` - Active status
- `aiEnabled: boolean` - AI chat enabled

**Relationships:**
- shopId → ShopSettings.shopId

**Missing for Supabase:**
- ✅ Has shopId
- ❌ No createdAt/updatedAt timestamps (optional, as it's a view/aggregate)

---

#### 16. PaymentRecord
**Purpose:** Payment transaction records
**Fields:**
- `id: string` - Unique identifier
- `shopId: string` - Foreign key to ShopSettings.shopId
- `shopName: string` - Denormalized shop name
- `subscriptionId: string` - Foreign key to Subscription.id
- `plan: SubscriptionPlan` - Subscription plan
- `amount: number` - Payment amount
- `paymentReference: string` - Paystack reference
- `status: 'pending' | 'completed' | 'failed' | 'refunded'` - Payment status
- `paymentDate: string` - ISO date
- `verifiedAt?: string` - Verification timestamp
- `email: string` - Customer email
- `country: string` - Country
- `state: string` - State/province
- `notes?: string` - Additional notes
- `createdAt: string` - ISO date timestamp
- `couponCode?: string` - Coupon code used
- `discountAmount?: number` - Discount applied
- `originalAmount?: number` - Amount before discount

**Relationships:**
- shopId → ShopSettings.shopId
- subscriptionId → Subscription.id

**Missing for Supabase:**
- ✅ Has shopId
- ✅ Has timestamps

---

#### 17. Coupon
**Purpose:** Discount coupon management
**Fields:**
- `id: string` - Unique identifier
- `code: string` - Coupon code (uppercase)
- `discountType: 'percentage' | 'fixed'` - Discount type
- `discountValue: number` - Discount amount/percentage
- `applicablePlans: SubscriptionPlan[]` - Applicable subscription plans
- `expirationDate?: string` - Optional expiration date
- `maxUses?: number` - Optional maximum uses
- `currentUses: number` - Current usage count
- `isActive: boolean` - Active status
- `description?: string` - Optional description
- `createdAt: string` - ISO date timestamp
- `updatedAt: string` - ISO date timestamp
- `createdBy: string` - Admin username

**Relationships:**
- Referenced by: CouponUsage.couponId

**Missing for Supabase:**
- ✅ Has timestamps
- ⚠️ Global entity (no shopId needed)

---

#### 18. CouponUsage
**Purpose:** Track coupon usage per payment
**Fields:**
- `couponId: string` - Foreign key to Coupon.id
- `couponCode: string` - Denormalized coupon code
- `shopId: string` - Foreign key to ShopSettings.shopId
- `shopName: string` - Denormalized shop name
- `paymentId: string` - Foreign key to PaymentRecord.id
- `discountAmount: number` - Discount applied
- `usedAt: string` - ISO date timestamp

**Relationships:**
- couponId → Coupon.id
- shopId → ShopSettings.shopId
- paymentId → PaymentRecord.id

**Missing for Supabase:**
- ✅ Has shopId
- ⚠️ Uses `usedAt` instead of `createdAt` (acceptable)

---

#### 19. AIUsageRecord
**Purpose:** Track AI chat usage per shop
**Fields:**
- `id: string` - Unique identifier
- `shopId: string` - Foreign key to ShopSettings.shopId
- `shopName: string` - Denormalized shop name
- `userId: string` - Foreign key to User.id
- `userName: string` - Denormalized user name
- `prompt: string` - User prompt
- `response?: string` - AI response
- `timestamp: string` - ISO date timestamp
- `isAbuse?: boolean` - Abuse flag
- `abuseReason?: string` - Abuse reason

**Relationships:**
- shopId → ShopSettings.shopId
- userId → User.id

**Missing for Supabase:**
- ✅ Has shopId
- ⚠️ Uses `timestamp` instead of `createdAt` (inconsistent)

---

## Summary of Missing Fields

### Critical (Multi-Tenancy)
All shop-scoped entities need `shopId: string`:
1. ❌ Product
2. ❌ Category
3. ❌ Supplier
4. ❌ Customer
5. ❌ Sale
6. ❌ DebtTransaction
7. ❌ StockMovement
8. ❌ Expense
9. ❌ GiftCard
10. ❌ ActivityLog

### Standardization (Timestamps)
Entities needing `createdAt` and/or `updatedAt`:
1. ❌ Product (both)
2. ❌ Category (both)
3. ❌ Supplier (both)
4. ❌ Customer (both)
5. ❌ Sale (both)
6. ❌ DebtTransaction (both)
7. ⚠️ StockMovement (has `timestamp`, should be `createdAt`)
8. ❌ Expense (has `date`, needs `createdAt`, `updatedAt`)
9. ⚠️ GiftCard (has `createdAt`, needs `updatedAt`)
10. ⚠️ ActivityLog (has `timestamp`, should be `createdAt`)
11. ❌ ShopSettings (both)
12. ⚠️ AIUsageRecord (has `timestamp`, should be `createdAt`)

### Foreign Key Relationships
All foreign keys should be explicitly documented in comments.
