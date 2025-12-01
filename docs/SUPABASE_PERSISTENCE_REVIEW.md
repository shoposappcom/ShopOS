# Supabase Persistence Review

## Overview
This document outlines all data persistence in the ShopOS application and confirms that all user preferences and settings are now stored in Supabase instead of localStorage.

## ✅ Migrated to Supabase

### 1. User Preferences (NEW)
**Table:** `user_preferences`
- **View Modes**: POS, Stock, Debtors, Gift Cards view preferences
- **Language**: User language preference (per user)
- **Storage**: Supabase with localStorage fallback

**Pages Updated:**
- `pages/POS.tsx` - View mode now in Supabase
- `pages/Inventory.tsx` - View mode now in Supabase
- `pages/Debtors.tsx` - View mode now in Supabase
- `pages/GiftCards.tsx` - View mode now in Supabase
- `context/StoreContext.tsx` - Language preference now in Supabase

### 2. Admin Credentials
**Table:** `admin_users`
- Admin username and password hash
- Last login timestamp
- **Storage**: Supabase (primary) with localStorage fallback

### 3. Payment Verifications
**Table:** `payment_verifications`
- Payment verification records
- Paystack API responses
- Verification status and timestamps
- **Storage**: Supabase (primary), localStorage is cache only

### 4. All Business Data
All shop-scoped data is stored in Supabase:
- Products, Categories, Suppliers
- Customers, Sales, Debt Transactions
- Stock Movements, Expenses
- Gift Cards, Activity Logs
- Subscriptions, Payment Records
- Shop Settings

## ✅ Remaining localStorage Usage (By Design)

### 1. Sync Queue (`services/syncQueue.ts`)
**Purpose**: Offline operation queue
**Why localStorage**: 
- Temporary storage for operations when offline
- Synced to Supabase when online
- Not user preferences, just operational queue

### 2. Time Anchors (`services/timeIntegrity.ts`)
**Purpose**: Security/integrity checks
**Why localStorage**:
- Local time tracking for tampering detection
- Not user data, just security mechanism
- Needs to be local for integrity checks

### 3. Admin Session (`services/adminAuth.ts`)
**Purpose**: Admin authentication session
**Why localStorage**:
- Session token storage (24-hour expiry)
- Standard practice for session management
- Not user preferences

### 4. Application State Cache (`services/storage.ts`)
**Purpose**: Local cache of application state
**Why localStorage**:
- Offline fallback
- Fast initial load
- Synced to Supabase when online
- Not user preferences

### 5. Payment Verifications Cache (`services/paystack.ts`)
**Purpose**: Quick access cache
**Why localStorage**:
- Cache for fast lookups
- Primary storage is Supabase
- localStorage is just for performance

## Migration Summary

### Before Migration
- View modes: localStorage only
- Language: localStorage only
- Admin credentials: localStorage only
- Payment verifications: localStorage only

### After Migration
- View modes: ✅ Supabase (per user, per shop)
- Language: ✅ Supabase (per user, per shop)
- Admin credentials: ✅ Supabase
- Payment verifications: ✅ Supabase (with cache)
- All business data: ✅ Supabase

## User Preferences Schema

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  shop_id UUID NOT NULL,
  user_id UUID NOT NULL,
  preference_key TEXT NOT NULL,  -- e.g., 'pos_view_mode', 'language'
  preference_value TEXT NOT NULL, -- e.g., 'large', 'en'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(shop_id, user_id, preference_key)
);
```

## How It Works

1. **On Page Load**: 
   - Checks Supabase for user preferences
   - Falls back to localStorage if offline or no data
   - Loads default if neither exists

2. **On Preference Change**:
   - Saves to Supabase immediately
   - Also caches in localStorage for offline access
   - Syncs across all devices for same user

3. **Multi-Device Support**:
   - Preferences sync across devices
   - Each user has their own preferences
   - Shop-scoped for multi-tenancy

## Benefits

1. **Cross-Device Sync**: View modes and language sync across devices
2. **Per-User Preferences**: Each user has their own settings
3. **Offline Support**: localStorage fallback for offline access
4. **Data Integrity**: Centralized storage in Supabase
5. **Multi-Tenancy**: Preferences are shop-scoped

## Testing Checklist

- [ ] View mode changes persist across page refreshes
- [ ] View mode syncs across different devices
- [ ] Language preference persists and syncs
- [ ] Each user has independent preferences
- [ ] Works offline with localStorage fallback
- [ ] Preferences load correctly on login

