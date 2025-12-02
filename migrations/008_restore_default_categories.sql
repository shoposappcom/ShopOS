-- Migration: Restore Default Categories
-- This script restores default categories for shops
-- Usage: Replace 'YOUR_SHOP_ID' with the actual shop_id UUID

-- Common default categories for retail/shop POS systems
-- You can customize these category names as needed

DO $$
DECLARE
    target_shop_id UUID := 'YOUR_SHOP_ID'::UUID; -- REPLACE WITH YOUR SHOP ID
    category_names TEXT[] := ARRAY[
        'General',
        'Food & Beverages',
        'Electronics',
        'Clothing & Apparel',
        'Pharmacy & Health',
        'Household Items',
        'Stationery',
        'Personal Care'
    ];
    cat_name TEXT;
BEGIN
    -- Check if shop exists
    IF NOT EXISTS (SELECT 1 FROM shop_settings WHERE shop_id = target_shop_id) THEN
        RAISE EXCEPTION 'Shop with id % does not exist', target_shop_id;
    END IF;

    -- Insert default categories if they don't exist
    FOREACH cat_name IN ARRAY category_names
    LOOP
        -- Only insert if category doesn't already exist for this shop
        IF NOT EXISTS (
            SELECT 1 FROM categories 
            WHERE shop_id = target_shop_id 
            AND name = cat_name
            AND is_archived = false
        ) THEN
            INSERT INTO categories (shop_id, name, is_archived, created_at)
            VALUES (target_shop_id, cat_name, false, NOW());
            
            RAISE NOTICE 'Created category: % for shop %', cat_name, target_shop_id;
        ELSE
            RAISE NOTICE 'Category "%" already exists for shop %, skipping', cat_name, target_shop_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Default categories restoration completed for shop %', target_shop_id;
END $$;

