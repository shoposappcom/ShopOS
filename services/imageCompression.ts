/**
 * Image Compression Utility
 * Compresses images before upload to reduce file size while maintaining quality
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  maxSizeKB?: number; // Target max size in KB
  format?: 'jpeg' | 'webp' | 'png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  maxSizeKB: 200, // Target 200KB
  format: 'jpeg'
};

/**
 * Compress an image file
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image as a File object
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > opts.maxWidth! || height > opts.maxHeight!) {
          const ratio = Math.min(
            opts.maxWidth! / width,
            opts.maxHeight! / height
          );
          width = width * ratio;
          height = height * ratio;
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Use high-quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        const outputFormat = opts.format || 'jpeg';
        const mimeType = outputFormat === 'webp' 
          ? 'image/webp' 
          : outputFormat === 'png'
          ? 'image/png'
          : 'image/jpeg';
        
        // Try to compress to target size
        compressToTargetSize(canvas, mimeType, opts.quality!, opts.maxSizeKB!)
          .then((blob) => {
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, `.${outputFormat}`),
              {
                type: mimeType,
                lastModified: Date.now()
              }
            );
            
            const originalSizeKB = (file.size / 1024).toFixed(2);
            const compressedSizeKB = (compressedFile.size / 1024).toFixed(2);
            const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
            
            console.log(`📦 Image compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${reduction}% reduction)`);
            
            resolve(compressedFile);
          })
          .catch(reject);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Compress canvas to target file size by adjusting quality
 * @param canvas - The canvas element
 * @param mimeType - Output MIME type
 * @param initialQuality - Starting quality (0.1 to 1.0)
 * @param targetSizeKB - Target size in KB
 * @returns Compressed blob
 */
const compressToTargetSize = async (
  canvas: HTMLCanvasElement,
  mimeType: string,
  initialQuality: number,
  targetSizeKB: number
): Promise<Blob> => {
  const targetSizeBytes = targetSizeKB * 1024;
  let quality = initialQuality;
  let blob = await canvasToBlob(canvas, mimeType, quality);
  
  // If already under target, return
  if (blob.size <= targetSizeBytes) {
    return blob;
  }
  
  // Binary search for optimal quality
  let minQuality = 0.1;
  let maxQuality = initialQuality;
  const maxIterations = 10;
  let iterations = 0;
  
  while (iterations < maxIterations && blob.size > targetSizeBytes && quality > 0.1) {
    quality = (minQuality + maxQuality) / 2;
    blob = await canvasToBlob(canvas, mimeType, quality);
    
    if (blob.size > targetSizeBytes) {
      maxQuality = quality;
    } else {
      minQuality = quality;
      // If we're close enough (within 10%), return
      if (blob.size >= targetSizeBytes * 0.9) {
        break;
      }
    }
    
    iterations++;
  }
  
  return blob;
};

/**
 * Convert canvas to blob with specified quality
 */
const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      mimeType,
      quality
    );
  });
};

/**
 * Check if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Get recommended compression options based on file size
 */
export const getCompressionOptions = (file: File): CompressionOptions => {
  const fileSizeMB = file.size / (1024 * 1024);
  
  if (fileSizeMB > 2) {
    // Large files: more aggressive compression
    return {
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.7,
      maxSizeKB: 150,
      format: 'jpeg'
    };
  } else if (fileSizeMB > 1) {
    // Medium files: moderate compression
    return {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.75,
      maxSizeKB: 200,
      format: 'jpeg'
    };
  } else {
    // Small files: light compression
    return {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
      maxSizeKB: 200,
      format: 'jpeg'
    };
  }
};

