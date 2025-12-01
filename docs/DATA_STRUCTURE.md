# ShopOS Data Structure Documentation

## Overview

This document provides a comprehensive overview of all data entities, their relationships, and structure for the ShopOS application. This structure is designed to be scalable and easily migratable to Supabase.

## Entity Inventory

### Core Shop Entities (Per-Shop Data)

These entities are scoped to individual shops and require `shopId` for multi-tenant isolation.

#### 1. User
**Purpose:** Authentication and authorization for shop users

**Fields:**
- `id: string` - Unique identifier
- `shopId?: string` - Foreign key to Shop (optional for superadmin)
- `username: string` - Login username
- `password: string` - Password (should be hashed in production)
- `fullName: string` - Display name
- `role: UserRole` - superadmin | admin | manager | cashier | stock_clerk
- `phone?: string` - Contact phone
- `email?: string` - Contact email
- `status: UserStatus` - active | inactive
- `language: Language` - User's preferred language
- `createdAt: string` - ISO date
- `lastLogin?: string` - ISO date
- `profilePhoto?: string` - Profile image URL
- `isArchived?: boolean` - Soft delete flag

**Relationships:**
- Foreign Key: `shopId` → ShopSettings.shopId
- Referenced by: ActivityLog.userId, StockMovement.userId, Sale.cashierId

**Missing for Supabase:**
- ❌ `shopId` should be required (not optional) for non-superadmin users
- ❌ Missing `updatedAt` timestamp

---

#### 2. Product
**Purpose:** Inventory items/products for sale

**Fields:**
- `id: string` - Unique identifier
- `name: string` - Product name (default English)
- `translations?: Partial<Record<Language, { name: string; category: string }>>` - Multi-language support
- `barcode: string` - Product barcode
- `category: string` - Display category name (denormalized for performance)
- `categoryId?: string` - Foreign Key to Category.id
- `supplierId?: string` - Foreign Key to Supplier.id
- `image?: string` - Product image (Base64 or URL)
- `costPriceCarton: number` - Cost per carton
- `costPriceUnit: number` - Cost per unit (calculated)
- `cartonPrice: number` - Selling price per carton
- `unitPrice: number` - Selling price per unit
- `unitsPerCarton: number` - Units in one carton
- `stockCartons: number` - Current stock in cartons
- `stockUnits: number` - Current stock in units
- `totalUnits: number` - Master source of truth for stock
- `minStockLevel: number` - Minimum stock threshold
- `batchNumber?: string` - Batch number (pharmacy)
- `expiryDate?: string` - Expiry date (pharmacy)
- `isArchived?: boolean` - Soft delete flag

**Relationships:**
- Foreign Key: `categoryId` → Category.id
- Foreign Key: `supplierId` → Supplier.id
- Referenced by: StockMovement.productId, Sale.items[].id

**Missing for Supabase:**
- ❌ Missing `shopId` foreign key
- ❌ Missing `createdAt` and `updatedAt` timestamps

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
- ❌ Missing `shopId` foreign key
- ❌ Missing `createdAt` and `updatedAt` timestamps

---

#### 4. Supplier
**Purpose:** Supplier/vendor management

**Fields:**
- `id: string` - Unique identifier
- `name: string` - Supplier name
- `contactPerson: string` - Contact person name
- `phone: string` - Contact phone
- `email?: string` - Contact email
- `address?: string` - Physical address
- `isArchived?: boolean` - Soft delete flag

**Relationships:**
- Referenced by: Product.supplierId

**Missing for Supabase:**
- ❌ Missing `shopId` foreign key
- ❌ Missing `createdAt` and `updatedAt` timestamps

---

#### 5. Customer
**Purpose:** Customer database

**Fields:**
- `id: string` - Unique identifier
- `name: string` - Customer name
- `phone: string` - Contact phone
- `totalDebt: number` - Total outstanding debt
- `lastPurchaseDate?: string` - ISO date of last purchase
- `isArchived?: boolean` - Soft delete flag

**Relationships:**
- Referenced by: DebtTransaction.customerId, Sale.customerId

**Missing for Supabase:**
- ❌ Missing `shopId` foreign key
- ❌ Missing `createdAt` and `updatedAt` timestamps

---

#### 6. Sale
**Purpose:** Sales transactions

**Fields:**
- `id: string` - Unique identifier
- `date: string` - ISO date
- `cashierId: string` - Foreign Key to User.id
- `cashierName: string` - Denormalized cashier name
- `items: CartItem[]` - Array of sold items (JSON/embedded)
- `total: number` - Total sale amount
- `profit: number` - Calculated profit
- `paymentMethod: 'cash' | 'transfer' | 'pos' | 'credit' | 'gift_card' | 'split'` - Payment method
- `customerId?: string` - Foreign Key to Customer.id (if tracked)
- `isCredit: boolean` - Whether sale is on credit
- `dueDate?: string` - ISO date (for credit sales)
- `giftCardCode?: string` - Gift card code used
- `giftCardAmount?: number` - Amount deducted from gift card

**Relationships:**
- Foreign Key: `cashierId` → User.id
- Foreign Key: `customerId` → Customer.id
- Referenced by: DebtTransaction.saleId

**Missing for Supabase:**
- ❌ Missing `shopId` foreign key
- ❌ Missing `createdAt` and `updatedAt` timestamps
- ⚠️ Consider normalizing `items` into SaleItem table

---

#### 7. DebtTransaction
**Purpose:** Normalized debt tracking (credit sales and payments)

**Fields:**
- `id: string` - Unique identifier
- `customerId: string` - Foreign Key to Customer.id
- `date: string` - ISO date
- `type: 'credit' | 'payment'` - Transaction type
- `amount: number` - Transaction amount
- `saleId?: string` - Foreign Key to Sale.id (if linked)
- `note?: string` - Optional note

**Relationships:**
- Foreign Key: `customerId` → Customer.id
- Foreign Key: `saleId` → Sale.id

**Missing for Supabase:**
- ❌ Missing `shopId` foreign key
- ❌ Missing `createdAt` timestamp

---

#### 8. StockMovement
**Purpose:** Stock audit trail and movements

**Fields:**
- `id: string` - Unique identifier
- `productId: string` - Foreign Key to Product.id
- `type: 'restock' | 'sale' | 'adjustment' | 'return' | 'audit'` - Movement type
- `quantityChange: number` - Positive or negative quantity change
- `quantityType: 'carton' | 'unit'` - Unit type
- `balanceAfter: number` - Stock balance after movement
- `timestamp: string` - ISO date
- `userId: string` - Foreign Key to User.id
- `note?: string` - Optional note
- `batchNumber?: string` - Batch number (if applicable)

**Relationships:**
- Foreign Key: `productId` → Product.id
- Foreign Key: `userId` → User.id

**Missing for Supabase:**
- ❌ Missing `shopId` foreign key
- ⚠️ Consider renaming `timestamp` to `createdAt` for consistency

---

#### 9. Expense
**Purpose:** Business expense tracking

**Fields:**
- `id: string` - Unique identifier
- `description: string` - Expense description
- `amount: number` - Expense amount
- `category: string` - Expense category (Rent, Utilities, Salary, etc.)
- `date: string` - ISO date
- `recordedBy: string` - User who recorded (userId)
- `isArchived?: boolean` - Soft delete flag

**Relationships:**
- Foreign Key: `recordedBy` → User.id (should be explicit userId)

**Missing for Supabase:**
- ❌ Missing `shopId` foreign key
- ❌ Missing `createdAt` and `updatedAt` timestamps
- ⚠️ `recordedBy` should be `recordedByUserId: string` for clarity

---

#### 10. GiftCard
**Purpose:** Gift card management

**Fields:**
- `id: string` - Unique identifier
- `code: string` - Gift card code
- `initialValue: number` - Original card value
- `balance: number` - Current balance
- `status: 'active' | 'empty'` - Card status
- `theme: 'standard' | 'gold' | 'dark' | 'festive'` - Card theme
- `createdAt: string` - ISO date
- `expiresAt?: string` - ISO date (optional expiry)

**Relationships:**
- Referenced by: Sale.giftCardCode

**Missing for Supabase:**
- ❌ Missing `shopId` foreign key
- ❌ Missing `updatedAt` timestamp

---

#### 11. ActivityLog
**Purpose:** Audit logs for all system actions

**Fields:**
- `id: string` - Unique identifier
- `userId: string` - Foreign Key to User.id
- `userName: string` - Denormalized user name
- `action: string` - Action type (e.g., 'ADD_PRODUCT')
- `details: string` - Action details
- `timestamp: string` - ISO date

**Relationships:**
- Foreign Key: `userId` → User.id

**Missing for Supabase:**
- ❌ Missing `shopId` foreign key
- ⚠️ Consider renaming `timestamp` to `createdAt` for consistency

---

#### 12. ShopSettings
**Purpose:** Shop configuration and tenant data

**Fields:**
- `shopId: string` - Unique shop identifier (Primary Key)
- `businessName: string` - Shop business name
- `address: string` - Shop address
- `phone: string` - Shop phone
- `country: string` - Country
- `state: string` - State/Region
- `currency: string` - Currency symbol
- `receiptFooter: string` - Receipt footer text
- `taxRate: number` - Tax rate percentage
- `autoBackup: 'off' | 'daily' | 'weekly' | 'monthly'` - Backup frequency
- `lastBackupDate?: string` - ISO date of last backup

**Relationships:**
- Primary Key: `shopId`
- Referenced by: All shop-scoped entities via shopId

**Missing for Supabase:**
- ❌ Missing `createdAt` and `updatedAt` timestamps

---

#### 13. Subscription
**Purpose:** Shop subscription management

**Fields:**
- `id: string` - Unique identifier
- `shopId: string` - Foreign Key to ShopSettings.shopId
- `plan: SubscriptionPlan` - monthly | yearly
- `status: SubscriptionStatus` - trial | active | expired | cancelled
- `trialStartDate: string` - ISO date
- `trialEndDate: string` - ISO date
- `subscriptionStartDate?: string` - ISO date
- `subscriptionEndDate?: string` - ISO date
- `lastPaymentDate?: string` - ISO date
- `lastPaymentAmount?: number` - Last payment amount
- `paymentReference?: string` - Paystack reference
- `createdAt: string` - ISO date
- `updatedAt: string` - ISO date
- `lastVerifiedAt: string` - ISO date
- `verificationChecksum?: string` - Anti-tampering hash

**Relationships:**
- Foreign Key: `shopId` → ShopSettings.shopId
- Referenced by: PaymentRecord.subscriptionId

**Status:** ✅ Complete (has shopId and timestamps)

---

### Admin Entities (Global Data)

These entities are stored in admin storage and are not shop-scoped.

#### 14. AdminConfig
**Purpose:** Global admin configuration

**Fields:**
- `trialDays: number` - Default trial period days
- `trialEnabled: boolean` - Whether trials are enabled
- `geminiApiKey?: string` - Gemini AI API key
- `paystackTestPublicKey?: string` - Paystack test public key
- `paystackTestSecretKey?: string` - Paystack test secret key
- `paystackLivePublicKey?: string` - Paystack live public key
- `paystackLiveSecretKey?: string` - Paystack live secret key
- `paystackMode?: 'test' | 'live'` - Paystack mode
- `createdAt: string` - ISO date
- `updatedAt: string` - ISO date

**Status:** ✅ Complete

---

#### 15. ShopSummary
**Purpose:** Admin dashboard summary view of shops

**Fields:**
- `shopId: string` - Foreign Key to ShopSettings.shopId
- `shopName: string` - Shop name
- `ownerEmail: string` - Owner email
- `ownerName: string` - Owner name
- `country: string` - Country
- `state: string` - State
- `registeredDate: string` - ISO date
- `subscriptionStatus: SubscriptionStatus` - Current status
- `subscriptionPlan?: SubscriptionPlan` - Current plan
- `lastPaymentDate?: string` - ISO date
- `totalRevenue: number` - Total revenue from shop
- `isActive: boolean` - Whether shop is active
- `aiEnabled: boolean` - Whether AI is enabled for shop

**Relationships:**
- Foreign Key: `shopId` → ShopSettings.shopId

**Status:** ✅ Complete

---

#### 16. PaymentRecord
**Purpose:** Payment tracking across all shops

**Fields:**
- `id: string` - Unique identifier
- `shopId: string` - Foreign Key to ShopSettings.shopId
- `shopName: string` - Denormalized shop name
- `subscriptionId: string` - Foreign Key to Subscription.id
- `plan: SubscriptionPlan` - monthly | yearly
- `amount: number` - Payment amount
- `paymentReference: string` - Paystack reference
- `status: 'pending' | 'completed' | 'failed' | 'refunded'` - Payment status
- `paymentDate: string` - ISO date
- `verifiedAt?: string` - ISO date
- `email: string` - Customer email
- `country: string` - Country
- `state: string` - State
- `notes?: string` - Optional notes
- `createdAt: string` - ISO date
- `couponCode?: string` - Coupon code used
- `discountAmount?: number` - Discount applied
- `originalAmount?: number` - Amount before discount

**Relationships:**
- Foreign Key: `shopId` → ShopSettings.shopId
- Foreign Key: `subscriptionId` → Subscription.id

**Status:** ✅ Complete

---

#### 17. Coupon
**Purpose:** Discount coupon management

**Fields:**
- `id: string` - Unique identifier
- `code: string` - Coupon code (uppercase)
- `discountType: 'percentage' | 'fixed'` - Discount type
- `discountValue: number` - Discount value
- `applicablePlans: SubscriptionPlan[]` - Applicable plans
- `expirationDate?: string` - ISO date
- `maxUses?: number` - Maximum uses
- `currentUses: number` - Current usage count
- `isActive: boolean` - Whether coupon is active
- `description?: string` - Optional description
- `createdAt: string` - ISO date
- `updatedAt: string` - ISO date
- `createdBy: string` - Admin username

**Relationships:**
- Referenced by: CouponUsage.couponId

**Status:** ✅ Complete

---

#### 18. CouponUsage
**Purpose:** Coupon usage tracking

**Fields:**
- `couponId: string` - Foreign Key to Coupon.id
- `couponCode: string` - Denormalized coupon code
- `shopId: string` - Foreign Key to ShopSettings.shopId
- `shopName: string` - Denormalized shop name
- `paymentId: string` - Foreign Key to PaymentRecord.id
- `discountAmount: number` - Discount applied
- `usedAt: string` - ISO date

**Relationships:**
- Foreign Key: `couponId` → Coupon.id
- Foreign Key: `shopId` → ShopSettings.shopId
- Foreign Key: `paymentId` → PaymentRecord.id

**Missing for Supabase:**
- ❌ Missing `id` primary key

**Status:** ⚠️ Needs primary key

---

#### 19. AIUsageRecord
**Purpose:** AI usage tracking and abuse detection

**Fields:**
- `id: string` - Unique identifier
- `shopId: string` - Foreign Key to ShopSettings.shopId
- `shopName: string` - Denormalized shop name
- `userId: string` - Foreign Key to User.id
- `userName: string` - Denormalized user name
- `prompt: string` - User prompt
- `response?: string` - AI response
- `timestamp: string` - ISO date
- `isAbuse?: boolean` - Whether marked as abuse
- `abuseReason?: string` - Abuse reason

**Relationships:**
- Foreign Key: `shopId` → ShopSettings.shopId
- Foreign Key: `userId` → User.id

**Missing for Supabase:**
- ⚠️ Consider renaming `timestamp` to `createdAt` for consistency

**Status:** ✅ Mostly complete

---

## Summary of Missing Fields for Supabase Migration

### shopId Foreign Keys (Required for RLS)
- ❌ Category
- ❌ Supplier
- ❌ Expense
- ❌ GiftCard
- ❌ Product
- ❌ Customer
- ❌ Sale
- ❌ DebtTransaction
- ❌ StockMovement
- ❌ ActivityLog

### Timestamp Standardization
- ❌ Category: missing createdAt, updatedAt
- ❌ Supplier: missing createdAt, updatedAt
- ❌ Expense: missing createdAt, updatedAt (has date only)
- ❌ Customer: missing createdAt, updatedAt
- ❌ GiftCard: missing updatedAt
- ❌ ShopSettings: missing createdAt, updatedAt
- ⚠️ ActivityLog: has timestamp (should be createdAt)
- ⚠️ StockMovement: has timestamp (should be createdAt)
- ⚠️ AIUsageRecord: has timestamp (should be createdAt)

### Other Improvements
- ❌ CouponUsage: missing primary key `id`
- ⚠️ Expense.recordedBy: should be `recordedByUserId: string` for clarity
- ⚠️ Sale.items: Consider normalizing into SaleItem table

## Entity Relationships Diagram

```
ShopSettings (shopId)
  ├── User (shopId)
  ├── Product (shopId)
  │   ├── Category (shopId)
  │   └── Supplier (shopId)
  ├── Customer (shopId)
  ├── Sale (shopId)
  │   └── CartItem[] (embedded)
  ├── DebtTransaction (shopId)
  ├── StockMovement (shopId)
  ├── Expense (shopId)
  ├── GiftCard (shopId)
  ├── ActivityLog (shopId)
  └── Subscription (shopId)
      └── PaymentRecord
          └── CouponUsage
              └── Coupon

AdminConfig (global)
  └── ShopSummary[]
```

## Next Steps

See implementation plan for systematic improvements to prepare for Supabase migration.

