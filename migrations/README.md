# ShopOS Supabase Migrations

This folder contains all database migration files for ShopOS, including tables, indexes, RLS policies, storage buckets, functions, and triggers.

## Migration Files

The migrations are organized in the order they should be executed:

1. **001_initial_setup.sql** - Extensions, helper functions, and trigger functions
2. **002_global_tables.sql** - Global tables (admin_users, admin_config, coupons)
3. **003_shop_scoped_tables.sql** - All shop-scoped tables (shop_settings, users, products, etc.)
4. **004_shop_summaries.sql** - Shop summaries table for admin panel
5. **005_storage_buckets.sql** - Storage buckets and policies for file uploads
6. **006_rls_policies.sql** - Row Level Security policies for all tables
7. **007_initial_data.sql** - Default/initial data

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order (001 through 007)
4. Verify each migration completes successfully

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push
```

### Option 3: Manual Execution

You can also run all migrations at once by concatenating them:

```bash
cat migrations/*.sql | psql -h your-db-host -U postgres -d postgres
```

## Migration Order

**IMPORTANT:** Migrations must be run in numerical order:

1. `001_initial_setup.sql` - Creates functions needed by other migrations
2. `002_global_tables.sql` - Creates global tables
3. `003_shop_scoped_tables.sql` - Creates all shop-scoped tables
4. `004_shop_summaries.sql` - Creates shop summaries table
5. `005_storage_buckets.sql` - Creates storage buckets
6. `006_rls_policies.sql` - Enables RLS and creates policies (requires tables to exist)
7. `007_initial_data.sql` - Inserts initial data

## What's Included

### Tables
- **Global Tables:** admin_users, admin_config, coupons
- **Shop-Scoped Tables:** shop_settings, users, products, categories, suppliers, customers, sales, debt_transactions, stock_movements, expenses, gift_cards, activity_logs, user_preferences, subscriptions, payment_records, payment_verifications, coupon_usages, ai_usage_records
- **Admin Tables:** shop_summaries

### Features
- ✅ All indexes for performance
- ✅ Foreign key constraints
- ✅ Check constraints for data validation
- ✅ RLS policies for multi-tenancy
- ✅ Triggers for auto-updating timestamps
- ✅ Storage bucket setup for product images
- ✅ Default admin config

## Notes

1. **RLS Policies:** The RLS policies use a `get_shop_id()` function that reads from JWT claims. You may need to adjust these based on your authentication setup.

2. **Storage Buckets:** Two buckets are created:
   - `product-images` - For product image uploads (public read, authenticated write)
   - `app` - For APK downloads (public read only)

3. **Admin Access:** The RLS policies for admin tables (admin_config, coupons, shop_summaries) are set to allow all access. You should adjust these based on your authentication requirements.

4. **Idempotent:** All migrations use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` to be idempotent - they can be run multiple times safely.

## Troubleshooting

### If migrations fail:

1. Check if tables already exist - the migrations are idempotent and should handle this
2. Verify you have the correct permissions (need superuser for extensions)
3. Check the Supabase logs for detailed error messages
4. Ensure migrations are run in order

### Common Issues:

- **UUID extension not found:** Make sure to run `001_initial_setup.sql` first
- **Function not found:** Ensure all migrations are run in order
- **Policy conflicts:** Drop existing policies before creating new ones (included in migrations)

## Additional Configuration

After running migrations, you may need to:

1. Configure authentication providers in Supabase dashboard
2. Set up JWT claims to include `shop_id` and `role`
3. Adjust RLS policies based on your authentication setup
4. Configure storage bucket CORS if needed for direct uploads

## Schema Version

Current schema version: **1.0.0**

Last updated: 2025-01-01

