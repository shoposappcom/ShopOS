# Restore Default Categories

This guide helps you restore default categories that were accidentally deleted from your Supabase categories table.

**Important Note:** Categories are shop-specific (each shop has its own categories stored in the database), but the default category names are the same for all shops. This is why they're called "global defaults" - every shop gets the same set of default category names when they're created. When you restore them, they're created for each shop separately but with the same names.

## Quick Start - Choose Your Method

### 🚀 Method 1: Restore for ALL Shops (Easiest)
Use `008c_restore_categories_all_shops.sql` - automatically creates default categories for every shop in your database. No need to specify shop IDs or names!

### 🎯 Method 2: Restore for One Shop (By Business Name)
Use `008d_restore_categories_for_my_shop.sql` - just replace `'YOUR_BUSINESS_NAME'` with your shop name.

### ⚙️ Method 3: Restore for One Shop (By Shop ID)
Use `008b_restore_categories_simple.sql` - replace the shop ID with your UUID.

## Step-by-Step Instructions

### Method 1A: Restore for ALL Shops (Recommended if you want to fix all shops at once)

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Navigate to "SQL Editor"
   - Click "New Query"

2. **Run the All-Shops Script**
   - Open `migrations/008c_restore_categories_all_shops.sql`
   - Copy the entire script (no changes needed!)
   - Paste it into the SQL Editor
   - Click "Run"

This will automatically create default categories for every shop in your database.

### Method 1B: Restore for One Shop (By Business Name)

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Navigate to "SQL Editor"
   - Click "New Query"

2. **Update and Run**
   - Open `migrations/008d_restore_categories_for_my_shop.sql`
   - Replace `'YOUR_BUSINESS_NAME'` with your actual shop/business name (the name you see in the app)
   - Copy the script
   - Paste it into the SQL Editor
   - Click "Run"

### Method 1C: Restore for One Shop (By Shop ID - Using Supabase SQL Editor)

1. **Get Your Shop ID**
   - Option A: Run this query in Supabase to see all shops:
     ```sql
     SELECT shop_id, business_name FROM shop_settings;
     ```
   - Option B: Check your ShopOS app Settings page (if shop ID is displayed)

2. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Navigate to "SQL Editor"
   - Click "New Query"

3. **Update and Run the Script**
   - Open `migrations/008b_restore_categories_simple.sql`
   - Replace `'REPLACE_WITH_YOUR_SHOP_ID'` (appears twice) with your actual shop ID UUID
   - Copy and paste into SQL Editor
   - Click "Run"

### Method 2: Using Supabase Migration

If you prefer to use the migration system:

1. Update `migrations/008_restore_default_categories.sql` with your shop ID
2. Apply the migration using Supabase CLI:
   ```bash
   supabase migration up
   ```

## Default Categories That Will Be Created

The script will create these categories (if they don't already exist):

1. **General** - For miscellaneous items
2. **Food & Beverages** - For food and drink products
3. **Electronics** - For electronic items
4. **Clothing & Apparel** - For clothing items
5. **Pharmacy & Health** - For health and pharmaceutical products
6. **Household Items** - For household products
7. **Stationery** - For office and school supplies
8. **Personal Care** - For personal care products

## Customizing Categories

You can modify the `category_names` array in the SQL script to add or remove categories as needed for your shop.

## Notes

- The script will only create categories that don't already exist
- It will skip categories that are already present
- Categories are created with `is_archived = false`
- Each category will have a unique UUID generated automatically

## Troubleshooting

**Error: "Shop with id ... does not exist"**
- Verify that your shop ID is correct
- Check the `shop_settings` table to find your shop ID

**Categories not appearing in the app**
- Make sure the shop ID matches exactly (UUID format)
- Check that the categories were created by running:
  ```sql
  SELECT * FROM categories WHERE shop_id = 'YOUR_SHOP_ID';
  ```

## Quick Reference: Finding Your Shop ID

**From Supabase Dashboard:**
```sql
SELECT shop_id, business_name, created_at 
FROM shop_settings 
ORDER BY created_at DESC;
```

**From ShopOS App:**
- Log into the app
- Go to Settings page
- Shop ID should be visible there (if implemented)

