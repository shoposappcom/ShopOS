-- Restore Default Categories - Auto-detect Your Shop
-- This script finds your shop automatically and restores default categories
-- Just replace 'YOUR_BUSINESS_NAME' with your shop name!

DO $$
DECLARE
    my_shop_id UUID;
    my_business_name TEXT := 'YOUR_BUSINESS_NAME'; -- Replace with your shop/business name
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
    categories_created INT := 0;
BEGIN
    -- Find shop by business name
    SELECT shop_id INTO my_shop_id
    FROM shop_settings
    WHERE LOWER(business_name) = LOWER(my_business_name);
    
    IF my_shop_id IS NULL THEN
        RAISE EXCEPTION 'Shop with business name "%" not found. Please check the name or use a different script.', my_business_name;
    END IF;
    
    RAISE NOTICE 'Found shop: % (ID: %)', my_business_name, my_shop_id;
    RAISE NOTICE 'Creating default categories...';
    
    -- Insert default categories
    FOREACH cat_name IN ARRAY category_names
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM categories 
            WHERE shop_id = my_shop_id 
            AND name = cat_name
            AND is_archived = false
        ) THEN
            INSERT INTO categories (shop_id, name, is_archived, created_at)
            VALUES (my_shop_id, cat_name, false, NOW());
            
            categories_created := categories_created + 1;
            RAISE NOTICE '  ✓ Created: %', cat_name;
        ELSE
            RAISE NOTICE '  ⊗ Already exists: %', cat_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    IF categories_created > 0 THEN
        RAISE NOTICE '✓ Successfully created % default categories for shop: %', categories_created, my_business_name;
    ELSE
        RAISE NOTICE '✓ All default categories already exist for shop: %', my_business_name;
    END IF;
END $$;

-- Verify categories were created
SELECT name, created_at 
FROM categories 
WHERE shop_id = (
    SELECT shop_id FROM shop_settings 
    WHERE LOWER(business_name) = LOWER('YOUR_BUSINESS_NAME')
)
AND is_archived = false
ORDER BY name;

