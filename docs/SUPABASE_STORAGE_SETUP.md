# Supabase Storage Setup for Product Images

## Create Storage Bucket

To enable product image uploads, you need to create a storage bucket in your Supabase project:

### Option 1: Via Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Name: `product-images`
5. **Public bucket**: ✅ Enable (so images can be accessed via public URLs)
6. Click **Create bucket**

### Option 2: Via SQL (Run in Supabase SQL Editor)

```sql
-- Create the storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for public access
-- Note: Drop existing policies first, then create new ones
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images');
```

### Verify Setup

After creating the bucket, test by:
1. Going to the Inventory page
2. Adding/editing a product
3. Uploading an image
4. The image should upload and display correctly

## Storage Structure

Images are stored with the following path structure:
```
product-images/
  └── {shopId}/
      └── {productId}-{timestamp}.{ext}
```

This ensures:
- Images are organized by shop
- Each product can have multiple versions (timestamped)
- Easy to identify and manage images

## File Size Limits & Compression

- **Maximum upload size**: 10MB per image (before compression)
- **Compressed size**: Images are automatically compressed to **< 500KB** (target: ~200KB)
- **Supported formats**: All image formats (JPEG, PNG, GIF, WebP, etc.)
- **Compression features**:
  - Automatic resizing (max 1200x1200px while maintaining aspect ratio)
  - Quality optimization (targets 200KB file size)
  - Format conversion to JPEG for better compression
  - High-quality image rendering

## Notes

- Images are stored permanently in Supabase Storage
- Old images are not automatically deleted when products are updated
- To clean up old images, you can manually delete them from the Storage dashboard

