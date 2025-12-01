# Quick Test Guide - Subscription Fix

## 🎯 What Was Fixed

Your subscription system was showing accounts as "expired" after page reload, even after successful Paystack payment. This is now fixed!

## 🔧 What Changed

1. **Status Check Priority**: Paid subscriptions now take priority over trial dates
2. **Date Calculations**: Subscription end dates are correctly calculated (30 days or 365 days from now)
3. **State Persistence**: Added logging to verify everything is saved correctly

## 🧪 How to Test

### Quick Test (5 minutes)

1. **Open your app** in the browser
2. **Open DevTools** (Press F12)
3. **Go to Console tab** (to see the logs)
4. **Navigate to Payment page**
5. **Select Monthly plan** (₦5,000)
6. **Complete Paystack payment**
7. **Watch console** - you should see:
   ```
   💰 Payment processed - Subscription updated:
      Status: active
      Plan: monthly
      End: 2025-01-01... (about 30 days from today)
   ✅ Payment processing complete
   ```
8. **Verify account is unlocked** (no lock icon, can access POS/Dashboard)
9. **RELOAD THE PAGE** (Press Ctrl + R or F5)
10. **Check console again** - you should see:
    ```
    🔍 Verifying subscription on app load...
       Status (calculated): active
    ✅ Status matches - no update needed
    ```
11. **Verify account is STILL unlocked** ✅

### Expected Results

✅ Account unlocks after payment
✅ Console shows "Status: active"
✅ Console shows end date ~30 days in future (monthly) or ~365 days (yearly)
✅ After reload: Account is STILL unlocked
✅ After reload: Console shows "Status (calculated): active"
✅ No errors in console

### What You'll See in Console

**After Payment:**
```
💰 Payment processed - Subscription updated:
   Status: active
   Plan: monthly
   Start: 2024-12-01T...
   End: 2025-01-01T...
   Payment Ref: ...
💾 Saving subscription state to localStorage...
✅ State saved successfully
✅ Payment processing complete - subscription should be active
```

**After Reload:**
```
🔍 Verifying subscription on app load...
   Subscription ID: sub_...
   Status (stored): active
   Plan: monthly
   Subscription End: 2025-01-01T...
✅ Subscription integrity verified
✅ Time integrity validated
🔄 Recalculating subscription status...
   Status (calculated): active
   Is Active: true
✅ Status matches - no update needed
```

## ❌ If Something Goes Wrong

### Problem: Still shows "expired" after reload

1. **Check the console logs** - look for:
   - "Status (calculated): expired" ← This shouldn't happen!
   - "Subscription End:" date ← Is this in the future?

2. **Check localStorage**:
   - Press F12 → Application tab → Local Storage
   - Find `shopos_data_v1`
   - Look at `subscription.subscriptionEndDate`
   - Is it in the future?

3. **Clear cache and retry**:
   ```
   Press Ctrl + Shift + Delete
   Clear "Cached images and files"
   Reload page
   Try payment again
   ```

### Problem: Payment succeeds but account still locked

1. **Check console** for errors
2. **Verify Paystack callback** executed
3. **Check Payment History** - is the payment there?

## 📋 Full Test Scenarios

### Test 1: Monthly Subscription (Expired Account)
- [ ] Start with expired/locked account
- [ ] Purchase monthly plan (₦5,000)
- [ ] Paystack payment succeeds
- [ ] Account unlocks immediately
- [ ] Console shows "active" status
- [ ] Console shows end date ~30 days ahead
- [ ] Reload page
- [ ] Account STILL unlocked
- [ ] Console shows "active" status
- [ ] Reload 2-3 more times
- [ ] Account STILL unlocked each time

### Test 2: Yearly Subscription (Expired Account)
- [ ] Start with expired/locked account
- [ ] Purchase yearly plan (₦48,000)
- [ ] Paystack payment succeeds
- [ ] Account unlocks immediately
- [ ] Console shows "active" status
- [ ] Console shows end date ~365 days ahead
- [ ] Reload page
- [ ] Account STILL unlocked
- [ ] Console shows "active" status

### Test 3: Browser Restart
- [ ] After successful payment
- [ ] Close browser completely
- [ ] Reopen browser
- [ ] Navigate to your app
- [ ] Account should STILL be unlocked

## 🎊 Success!

If all tests pass:
- ✅ Subscription system is working correctly
- ✅ Payments persist across reloads
- ✅ Monthly/yearly subscriptions are correctly calculated
- ✅ Account lock/unlock works properly

## 📞 If Issues Persist

Share:
1. Screenshot of console logs after payment
2. Screenshot of console logs after reload
3. The "Subscription End" date shown in console
4. What plan was selected (monthly/yearly)

---

**Ready to test!** Open your app, make a test payment, and watch it work! 🚀

