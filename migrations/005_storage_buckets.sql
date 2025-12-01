-- ============================================================================
-- Migration: 005_storage_buckets.sql
-- Description: Create storage buckets and policies for file uploads
-- ============================================================================

-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create app storage bucket (for APK downloads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('app', 'app', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for product-images bucket
-- Drop existing policies first
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Public read access
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT 
USING (bucket_id = 'product-images');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT 
WITH CHECK (bucket_id = 'product-images');

-- Authenticated users can update
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE 
USING (bucket_id = 'product-images');

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE 
USING (bucket_id = 'product-images');

-- Storage RLS Policies for app bucket (public read only)
DROP POLICY IF EXISTS "Public app access" ON storage.objects;

CREATE POLICY "Public app access" ON storage.objects
FOR SELECT 
USING (bucket_id = 'app');

