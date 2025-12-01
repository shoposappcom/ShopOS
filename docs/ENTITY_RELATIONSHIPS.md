# ShopOS Entity Relationships Documentation

## Relationship Diagram Overview

```
ShopSettings (shopId)
├── User (shopId → ShopSettings.shopId)
├── Product (shopId → ShopSettings.shopId)
├── Category (shopId → ShopSettings.shopId)
├── Supplier (shopId → ShopSettings.shopId)
├── Customer (shopId → ShopSettings.shopId)
├── Sale (shopId → ShopSettings.shopId)
├── DebtTransaction (shopId → ShopSettings.shopId)
├── StockMovement (shopId → ShopSettings.shopId)
├── Expense (shopId → ShopSettings.shopId)
├── GiftCard (shopId → ShopSettings.shopId)
├── ActivityLog (shopId → ShopSettings.shopId)
├── Subscription (shopId → ShopSettings.shopId)
└── PaymentRecord (shopId → ShopSettings.shopId)

Product
├── categoryId → Category.id
├── supplierId → Supplier.id
└── Referenced by: StockMovement.productId, Sale.items[].id

Sale
├── cashierId → User.id
├── customerId → Customer.id (optional)
└── Referenced by: DebtTransaction.saleId

DebtTransaction
├── customerId → Customer.id
└── saleId → Sale.id (optional)

StockMovement
├── productId → Product.id
└── userId → User.id

ActivityLog
└── userId → User.id

Expense
└── recordedByUserId → User.id

Subscription
└── shopId → ShopSettings.shopId

PaymentRecord
├── shopId → ShopSettings.shopId
└── subscriptionId → Subscription.id

CouponUsage
├── couponId → Coupon.id
├── shopId → ShopSettings.shopId
└── paymentId → PaymentRecord.id

AIUsageRecord
├── shopId → ShopSettings.shopId
└── userId → User.id
```

## Detailed Foreign Key Relationships

### ShopSettings (Root Entity)
- **Primary Key:** `shopId: string`
- **Referenced By:**
  - User.shopId
  - Product.shopId
  - Category.shopId
  - Supplier.shopId
  - Customer.shopId
  - Sale.shopId
  - DebtTransaction.shopId
  - StockMovement.shopId
  - Expense.shopId
  - GiftCard.shopId
  - ActivityLog.shopId
  - Subscription.shopId
  - PaymentRecord.shopId
  - CouponUsage.shopId
  - AIUsageRecord.shopId

### User
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `shopId?: string` → ShopSettings.shopId (optional for superadmin)
- **Referenced By:**
  - ActivityLog.userId
  - StockMovement.userId
  - Sale.cashierId
  - Expense.recordedByUserId
  - AIUsageRecord.userId

### Product
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `shopId: string` → ShopSettings.shopId
  - `categoryId?: string` → Category.id
  - `supplierId?: string` → Supplier.id
- **Referenced By:**
  - StockMovement.productId
  - Sale.items[].id (embedded in CartItem)

### Category
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `shopId: string` → ShopSettings.shopId
- **Referenced By:**
  - Product.categoryId

### Supplier
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `shopId: string` → ShopSettings.shopId
- **Referenced By:**
  - Product.supplierId

### Customer
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `shopId: string` → ShopSettings.shopId
- **Referenced By:**
  - Sale.customerId (optional)
  - DebtTransaction.customerId

### Sale
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `shopId: string` → ShopSettings.shopId
  - `cashierId: string` → User.id
  - `customerId?: string` → Customer.id (optional)
- **Referenced By:**
  - DebtTransaction.saleId (optional)

### DebtTransaction
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `shopId: string` → ShopSettings.shopId
  - `customerId: string` → Customer.id
  - `saleId?: string` → Sale.id (optional)

### StockMovement
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `shopId: string` → ShopSettings.shopId
  - `productId: string` → Product.id
  - `userId: string` → User.id

### Expense
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `shopId: string` → ShopSettings.shopId
  - `recordedByUserId: string` → User.id

### GiftCard
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `shopId: string` → ShopSettings.shopId
- **Referenced By:**
  - Sale.giftCardCode (by code match, not FK)

### ActivityLog
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `shopId: string` → ShopSettings.shopId
  - `userId: string` → User.id

### Subscription
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `shopId: string` → ShopSettings.shopId
- **Referenced By:**
  - PaymentRecord.subscriptionId

### PaymentRecord
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `shopId: string` → ShopSettings.shopId
  - `subscriptionId: string` → Subscription.id
- **Referenced By:**
  - CouponUsage.paymentId

### Coupon (Global Entity)
- **Primary Key:** `id: string`
- **No Foreign Keys** (global entity, not shop-scoped)
- **Referenced By:**
  - CouponUsage.couponId

### CouponUsage
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `couponId: string` → Coupon.id
  - `shopId: string` → ShopSettings.shopId
  - `paymentId: string` → PaymentRecord.id

### AIUsageRecord
- **Primary Key:** `id: string`
- **Foreign Keys:**
  - `shopId: string` → ShopSettings.shopId
  - `userId: string` → User.id

### AdminConfig (Global Entity)
- **No Primary Key** (single-row configuration table)
- **No Foreign Keys**

### ShopSummary (Admin View)
- **Primary Key:** `shopId: string` (derived from ShopSettings)
- **Foreign Keys:**
  - `shopId: string` → ShopSettings.shopId
- **Note:** This is an aggregated view for admin dashboard, not a separate entity

## Multi-Tenancy Architecture

All shop-scoped entities include `shopId` for Row Level Security (RLS) in Supabase:

1. **ShopSettings** - Root tenant entity
2. **User** - Shop staff (optional shopId for superadmin)
3. **Product** - Inventory items
4. **Category** - Product categories
5. **Supplier** - Suppliers
6. **Customer** - Customers
7. **Sale** - Sales transactions
8. **DebtTransaction** - Debt records
9. **StockMovement** - Stock audit trail
10. **Expense** - Business expenses
11. **GiftCard** - Gift cards
12. **ActivityLog** - Audit logs
13. **Subscription** - Subscription records
14. **PaymentRecord** - Payment records
15. **CouponUsage** - Coupon usage tracking
16. **AIUsageRecord** - AI usage tracking

Global entities (no shopId):
- **Coupon** - Admin-managed coupons
- **AdminConfig** - System configuration

## Cascading Considerations

When migrating to Supabase, consider cascade rules:

- **ON DELETE CASCADE:** Most shop-scoped entities should cascade when ShopSettings is deleted
- **ON DELETE SET NULL:** Optional foreign keys (e.g., Product.categoryId, Sale.customerId)
- **ON DELETE RESTRICT:** Critical relationships (e.g., PaymentRecord.subscriptionId)

