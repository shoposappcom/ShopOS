# ShopOS Database Migration Guide

Complete guide for setting up the ShopOS database schema in Supabase.

## Quick Start

Run all migrations in order (001 through 007) in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Run each file in numerical order
3. Verify each migration completes successfully

## Migration Files Overview

### 001_initial_setup.sql
- Enables UUID extension
- Creates helper functions (update_updated_at_column, get_shop_id)

### 002_global_tables.sql
- Creates global tables: `admin_users`, `admin_config`, `coupons`
- These tables are not shop-scoped

### 003_shop_scoped_tables.sql
- Creates all shop-scoped tables
- Includes: shop_settings, users, products, categories, suppliers, customers, sales, etc.
- All tables have `shop_id` for multi-tenancy

### 004_shop_summaries.sql
- Creates `shop_summaries` table for admin panel
- Aggregates shop information for admin view

### 005_storage_buckets.sql
- Creates storage buckets: `product-images`, `app`
- Sets up RLS policies for storage

### 006_rls_policies.sql
- Enables Row Level Security on all tables
- Creates RLS policies for multi-tenancy
- **Important:** Adjust admin policies based on your auth setup

### 007_initial_data.sql
- Inserts default admin config
- Sets up initial configuration

## Step-by-Step Instructions

### Method 1: Supabase Dashboard (Easiest)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run Migrations**
   - Copy and paste contents of `001_initial_setup.sql`
   - Click "Run" or press Ctrl+Enter
   - Repeat for files 002-007 in order

4. **Verify**
   - Go to "Table Editor" and verify tables exist
   - Check "Storage" to verify buckets exist

### Method 2: Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations (if using Supabase CLI migrations)
supabase db push

# Or run SQL files directly
supabase db execute --file migrations/001_initial_setup.sql
supabase db execute --file migrations/002_global_tables.sql
# ... etc
```

### Method 3: psql Command Line

```bash
# Connect to your database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
\i migrations/001_initial_setup.sql
\i migrations/002_global_tables.sql
\i migrations/003_shop_scoped_tables.sql
\i migrations/004_shop_summaries.sql
\i migrations/005_storage_buckets.sql
\i migrations/006_rls_policies.sql
\i migrations/007_initial_data.sql
```

## Post-Migration Configuration

### 1. Configure Authentication

The RLS policies expect JWT tokens with `shop_id` and `role` claims. You may need to:

- Configure JWT signing secrets
- Set up authentication providers
- Customize RLS policies based on your auth setup

### 2. Adjust RLS Policies

Some policies are set to allow all access. Review and adjust:

- `admin_config` - Currently allows all
- `coupons` - Currently allows all  
- `shop_summaries` - Currently allows all

Update these in `006_rls_policies.sql` based on your needs.

### 3. Storage Configuration

Storage buckets are created with public read access. You may want to:

- Adjust bucket policies for more security
- Configure CORS for direct uploads
- Set up automatic image optimization

## Verification Checklist

After running all migrations:

- [ ] All tables exist in Table Editor
- [ ] Storage buckets exist in Storage section
- [ ] RLS is enabled on all tables
- [ ] Default admin_config row exists
- [ ] All indexes are created
- [ ] Triggers are working (test by updating a record)

## Rollback

To rollback migrations, you'll need to:

1. Drop all tables in reverse order
2. Drop functions and extensions
3. Delete storage buckets

**Warning:** This will delete all data! Only do this on development/test databases.

## Troubleshooting

### "Extension uuid-ossp does not exist"
- Ensure you have superuser permissions
- Some Supabase instances may require enabling the extension differently

### "Function get_shop_id() does not exist"
- Make sure `001_initial_setup.sql` was run first

### "Policy already exists"
- The migrations include DROP POLICY statements
- If errors persist, manually drop policies first

### Storage bucket creation fails
- Check if buckets already exist
- Verify you have storage permissions

## Schema Details

See `docs/SUPABASE_SCHEMA.sql` for the original comprehensive schema document.

## Support

For issues or questions:
1. Check Supabase logs in the dashboard
2. Review error messages carefully
3. Verify migration order was followed
4. Check database permissions

