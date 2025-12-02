-- Simple script to restore default categories
-- INSTRUCTIONS:
-- 1. Replace 'REPLACE_WITH_YOUR_SHOP_ID' below with your actual shop ID (UUID format)
-- 2. Run this script in Supabase SQL Editor

-- ============================================================
-- STEP 1: Replace this with your shop ID from the app settings
-- ============================================================
DO $$
DECLARE
    my_shop_id UUID := 'REPLACE_WITH_YOUR_SHOP_ID'::UUID;
BEGIN
    -- Insert default categories (only if they don't exist)
    INSERT INTO categories (shop_id, name, is_archived, created_at)
    SELECT my_shop_id, 'General', false, NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM categories 
        WHERE shop_id = my_shop_id AND name = 'General' AND is_archived = false
    );

    INSERT INTO categories (shop_id, name, is_archived, created_at)
    SELECT my_shop_id, 'Food & Beverages', false, NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM categories 
        WHERE shop_id = my_shop_id AND name = 'Food & Beverages' AND is_archived = false
    );

    INSERT INTO categories (shop_id, name, is_archived, created_at)
    SELECT my_shop_id, 'Electronics', false, NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM categories 
        WHERE shop_id = my_shop_id AND name = 'Electronics' AND is_archived = false
    );

    INSERT INTO categories (shop_id, name, is_archived, created_at)
    SELECT my_shop_id, 'Clothing & Apparel', false, NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM categories 
        WHERE shop_id = my_shop_id AND name = 'Clothing & Apparel' AND is_archived = false
    );

    INSERT INTO categories (shop_id, name, is_archived, created_at)
    SELECT my_shop_id, 'Pharmacy & Health', false, NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM categories 
        WHERE shop_id = my_shop_id AND name = 'Pharmacy & Health' AND is_archived = false
    );

    INSERT INTO categories (shop_id, name, is_archived, created_at)
    SELECT my_shop_id, 'Household Items', false, NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM categories 
        WHERE shop_id = my_shop_id AND name = 'Household Items' AND is_archived = false
    );

    INSERT INTO categories (shop_id, name, is_archived, created_at)
    SELECT my_shop_id, 'Stationery', false, NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM categories 
        WHERE shop_id = my_shop_id AND name = 'Stationery' AND is_archived = false
    );

    INSERT INTO categories (shop_id, name, is_archived, created_at)
    SELECT my_shop_id, 'Personal Care', false, NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM categories 
        WHERE shop_id = my_shop_id AND name = 'Personal Care' AND is_archived = false
    );

    RAISE NOTICE 'Default categories restored for shop %', my_shop_id;
END $$;

-- Verify the categories were created:
SELECT id, shop_id, name, created_at 
FROM categories 
WHERE shop_id = 'REPLACE_WITH_YOUR_SHOP_ID'::UUID 
ORDER BY name;

