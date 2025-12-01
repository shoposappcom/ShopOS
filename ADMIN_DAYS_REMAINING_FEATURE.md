# Admin Panel - Days Remaining Feature

## Feature Added
The Creator Admin panel now displays **how many days are left** for each shop's subscription, in addition to the Active/Expired status.

## What Was Changed

### 1. Updated ShopSummary Type
**File**: `types.ts`

Added two new optional fields to track subscription dates:
```typescript
export interface ShopSummary {
  // ... existing fields
  subscriptionEndDate?: string; // When paid subscription expires
  trialEndDate?: string; // When trial expires
  // ... other fields
}
```

### 2. Updated Data Storage
**File**: `context/StoreContext.tsx`

Now saves subscription dates to admin storage:

**After Payment:**
```typescript
updateShopInAdminData(shopId, {
  subscriptionStatus: updatedSubscription.status,
  subscriptionPlan: updatedSubscription.plan,
  lastPaymentDate: updatedSubscription.lastPaymentDate,
  subscriptionEndDate: updatedSubscription.subscriptionEndDate, // NEW
  trialEndDate: updatedSubscription.trialEndDate, // NEW
  isActive: true,
  totalRevenue: 0
});
```

**On App Load (Sync):**
```typescript
updateShopInAdminData(state.settings.shopId, {
  subscriptionStatus: currentStatus,
  subscriptionEndDate: state.subscription.subscriptionEndDate, // NEW
  trialEndDate: state.subscription.trialEndDate, // NEW
  isActive: isNowActive
});
```

**During Registration:**
```typescript
const shopSummary: ShopSummary = {
  // ... other fields
  subscriptionEndDate: subscription.subscriptionEndDate, // NEW
  trialEndDate: subscription.trialEndDate, // NEW
  // ... other fields
};
```

### 3. Added Days Calculation Function
**File**: `pages/Admin.tsx`

Created a helper function to calculate days remaining:
```typescript
const getShopDaysRemaining = (shop: ShopSummary): number => {
  const now = new Date();
  
  // If shop has a paid subscription end date, use that
  if (shop.subscriptionEndDate) {
    const endDate = new Date(shop.subscriptionEndDate);
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  
  // If shop is on trial, use trial end date
  if (shop.subscriptionStatus === 'trial' && shop.trialEndDate) {
    const trialEnd = new Date(shop.trialEndDate);
    const diff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  
  return 0;
};
```

### 4. Updated Display UI
**File**: `pages/Admin.tsx` - Shops table status column

Changed from simple status badge to stacked display:

**Before:**
```
Active
```

**After:**
```
Active
🕐 31 days left
```

The display shows:
- Status badge (Active/Expired) with appropriate colors
- Days remaining with clock icon (only for active shops)

## Visual Example

### Shops Table - Status Column

| Status Display |
|----------------|
| **Active** (green badge)<br/>🕐 31 days left |
| **Active** (green badge)<br/>🕐 7 days left |
| **Active** (green badge)<br/>🕐 365 days left |
| **Expired** (red badge) |

## How It Works

1. **For Active Paid Subscriptions:**
   - Uses `subscriptionEndDate` to calculate days remaining
   - Example: If end date is Jan 1, 2025 and today is Dec 1, 2024 → shows "31 days left"

2. **For Trial Subscriptions:**
   - Uses `trialEndDate` to calculate days remaining
   - Example: If trial ends in 5 days → shows "5 days left"

3. **For Expired Subscriptions:**
   - Only shows "Expired" status
   - No days remaining displayed (since it's 0)

## Benefits

### For Admins:
- ✅ Quick visibility into subscription health
- ✅ Know which shops are about to expire
- ✅ Better revenue forecasting
- ✅ Proactive customer engagement

### For Shop Owners:
- ℹ️ Transparent subscription information
- ℹ️ No hidden expiration surprises

## Testing

### Test Scenario 1: Active Monthly Subscription
1. Make a monthly payment (₦5,000)
2. Go to Creator Admin → Shops tab
3. Find the shop
4. **Verify:**
   - Status shows "Active" (green)
   - Shows "~30 days left"

### Test Scenario 2: Active Yearly Subscription
1. Make a yearly payment (₦48,000)
2. Go to Creator Admin → Shops tab
3. **Verify:**
   - Status shows "Active" (green)
   - Shows "~365 days left"

### Test Scenario 3: Trial Subscription
1. Register a new shop (with trial enabled)
2. Go to Creator Admin → Shops tab
3. **Verify:**
   - Status shows "Active" (green)
   - Shows "7 days left" (or configured trial days)

### Test Scenario 4: Expired Subscription
1. Wait for subscription to expire, OR
2. Look at a shop with expired subscription
3. **Verify:**
   - Status shows "Expired" (red)
   - No days remaining shown

### Test Scenario 5: Multiple Shops
1. Register multiple shops with different subscription states
2. Make payments for some
3. Go to Creator Admin → Shops tab
4. **Verify:**
   - Each shop shows correct days remaining
   - Days decrease over time (check after 24 hours)

## Console Logs to Verify

After payment:
```
✅ Updated shop status in admin data - isActive: true, End date: 2025-01-01T...
```

After reload:
```
✅ Synced shop status to admin data - isActive: true
```

## Files Modified

1. ✅ `types.ts` - Added `subscriptionEndDate` and `trialEndDate` to ShopSummary
2. ✅ `context/StoreContext.tsx` - Save dates in 3 places:
   - Registration
   - After payment
   - On app load sync
3. ✅ `pages/Admin.tsx` - Added calculation function and updated display

## Edge Cases Handled

- ✅ Expired subscriptions show 0 days (handled by `Math.max(0, ...)`)
- ✅ Missing dates show 0 days (returns 0 if no dates found)
- ✅ Singular/plural text ("1 day" vs "2 days")
- ✅ Only shows days for active shops (expired shops don't show days)

## Future Enhancements

Possible improvements:
- Color coding for urgency (red if < 7 days, yellow if < 30 days)
- Sorting by days remaining
- Filtering by expiration date
- Email notifications for expiring subscriptions
- Bulk renewal options

---

**Status**: ✅ Complete - Ready to Use
**Date**: December 1, 2024

The admin panel now provides comprehensive subscription information at a glance!

