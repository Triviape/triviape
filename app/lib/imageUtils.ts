/**
 * Utilities for optimizing images
 */

import { getStorageInstance } from './firebase';
import { ref, uploadBytes, getDownloadURL, UploadMetadata } from 'firebase/storage';

/**
 * Image optimization options
 */
export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Resize an image to fit within the specified dimensions while maintaining aspect ratio
 * @param file Image file to resize
 * @param options Optimization options
 * @returns Promise with the resized image as a Blob
 */
export async function resizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'jpeg'
  } = options;
  
  return new Promise((resolve, reject) => {
    // Create an image element to load the file
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      // Scale down if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      // Create a canvas to draw the resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw the image on the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to the desired format
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                       format === 'png' ? 'image/png' : 'image/webp';
      
      // Get the resized image as a blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not create image blob'));
          }
        },
        mimeType,
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Load the image from the file
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload an image to Firebase Storage with optimization
 * @param file Image file to upload
 * @param path Storage path
 * @param options Optimization options
 * @returns Promise with the download URL
 */
export async function uploadOptimizedImage(
  file: File,
  path: string,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  try {
    // Resize the image
    const optimizedBlob = await resizeImage(file, options);
    
    // Create a new file with the optimized blob
    const optimizedFile = new File(
      [optimizedBlob],
      file.name,
      { type: optimizedBlob.type }
    );
    
    // Upload to Firebase Storage
    const storage = getStorageInstance();
    const storageRef = ref(storage, path);
    
    const metadata: UploadMetadata = {
      contentType: optimizedBlob.type,
      customMetadata: {
        originalSize: file.size.toString(),
        optimizedSize: optimizedBlob.size.toString(),
        width: options.maxWidth?.toString() || 'auto',
        height: options.maxHeight?.toString() || 'auto',
        quality: options.quality?.toString() || '0.8',
        format: options.format || 'auto'
      }
    };
    
    await uploadBytes(storageRef, optimizedFile, metadata);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading optimized image:', error);
    throw error;
  }
}

/**
 * Generate a placeholder image for lazy loading
 * @param file Image file
 * @param size Size of the placeholder (width)
 * @returns Promise with the placeholder as a data URL
 */
export async function generatePlaceholder(
  file: File,
  size: number = 20
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Create a small canvas for the placeholder
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = Math.floor(size * (img.height / img.width));
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw a small version of the image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Get the data URL
      const dataURL = canvas.toDataURL('image/jpeg', 0.5);
      resolve(dataURL);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for placeholder'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if an image meets the minimum requirements
 * @param file Image file to check
 * @param minWidth Minimum width
 * @param minHeight Minimum height
 * @returns Promise with validation result
 */
export async function validateImageDimensions(
  file: File,
  minWidth: number = 200,
  minHeight: number = 200
): Promise<{ valid: boolean; width: number; height: number; message?: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const valid = img.width >= minWidth && img.height >= minHeight;
      
      resolve({
        valid,
        width: img.width,
        height: img.height,
        message: valid ? undefined : `Image must be at least ${minWidth}x${minHeight} pixels`
      });
    };
    
    img.onerror = () => {
      resolve({
        valid: false,
        width: 0,
        height: 0,
        message: 'Failed to load image for validation'
      });
    };
    
    img.src = URL.createObjectURL(file);
  });
} 
