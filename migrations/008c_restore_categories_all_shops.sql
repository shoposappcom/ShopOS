-- Restore Default Categories for ALL Existing Shops
-- This script automatically creates default categories for every shop in your database
-- No need to specify shop IDs manually!

-- Default category names to create for each shop
DO $$
DECLARE
    shop_record RECORD;
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
    categories_created INT;
BEGIN
    -- Loop through all shops
    FOR shop_record IN 
        SELECT shop_id, business_name 
        FROM shop_settings
    LOOP
        categories_created := 0;
        
        RAISE NOTICE 'Processing shop: % (ID: %)', shop_record.business_name, shop_record.shop_id;
        
        -- Insert default categories for this shop
        FOREACH cat_name IN ARRAY category_names
        LOOP
            -- Only insert if category doesn't already exist for this shop
            IF NOT EXISTS (
                SELECT 1 FROM categories 
                WHERE shop_id = shop_record.shop_id 
                AND name = cat_name
                AND is_archived = false
            ) THEN
                INSERT INTO categories (shop_id, name, is_archived, created_at)
                VALUES (shop_record.shop_id, cat_name, false, NOW());
                
                categories_created := categories_created + 1;
                RAISE NOTICE '  ✓ Created category: %', cat_name;
            END IF;
        END LOOP;
        
        IF categories_created > 0 THEN
            RAISE NOTICE '  → Created % default categories for shop: %', categories_created, shop_record.business_name;
        ELSE
            RAISE NOTICE '  → All default categories already exist for shop: %', shop_record.business_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✓ Default categories restoration completed for all shops!';
END $$;

-- Verify: Show all categories created for all shops
SELECT 
    s.business_name AS shop_name,
    c.name AS category_name,
    c.created_at
FROM categories c
JOIN shop_settings s ON c.shop_id = s.shop_id
WHERE c.is_archived = false
ORDER BY s.business_name, c.name;

