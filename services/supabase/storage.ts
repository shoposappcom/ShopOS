import { supabase } from './client';

const PRODUCT_IMAGES_BUCKET = 'product-images';

/**
 * Upload a product image to Supabase Storage
 * Images are automatically compressed to < 500KB before upload
 * @param file - The image file to upload (should already be compressed)
 * @param productId - The product ID to associate with the image
 * @param shopId - The shop ID for organization
 * @returns The public URL of the uploaded image
 */
export const uploadProductImage = async (
  file: File,
  productId: string,
  shopId: string
): Promise<string> => {
  try {
    // Generate unique filename: shopId/productId-timestamp.extension
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${shopId}/${productId}-${timestamp}.${fileExt}`;
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading image:', error);
      
      // Provide helpful error message if bucket doesn't exist
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        throw new Error('Storage bucket "product-images" not found. Please create it in Supabase Dashboard > Storage. See docs/SUPABASE_STORAGE_SETUP.md for instructions.');
      }
      
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(fileName);
    
    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }
    
    console.log('✅ Image uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadProductImage:', error);
    throw error;
  }
};

/**
 * Delete a product image from Supabase Storage
 * @param imageUrl - The public URL of the image to delete
 * @returns true if successful
 */
export const deleteProductImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/product-images/shopId/productId-timestamp.ext
    const urlParts = imageUrl.split('/');
    const fileName = urlParts.slice(urlParts.indexOf('product-images') + 1).join('/');
    
    if (!fileName) {
      console.warn('Could not extract filename from URL:', imageUrl);
      return false;
    }
    
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([fileName]);
    
    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }
    
    console.log('✅ Image deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteProductImage:', error);
    return false;
  }
};

/**
 * Check if an image URL is from Supabase Storage
 * @param url - The image URL to check
 * @returns true if the URL is from Supabase Storage
 */
export const isSupabaseImageUrl = (url: string): boolean => {
  return url.includes('supabase.co/storage') || url.includes('supabase.co/storage/v1/object/public');
};

/**
 * Check if an image is a base64 data URL
 * @param url - The image URL to check
 * @returns true if the URL is a base64 data URL
 */
export const isBase64Image = (url: string): boolean => {
  return url.startsWith('data:image/');
};

