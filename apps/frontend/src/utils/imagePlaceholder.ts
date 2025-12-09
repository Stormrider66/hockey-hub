/**
 * Image placeholder utilities for optimized loading
 */

// Generate a solid color placeholder
export const generateSolidPlaceholder = (
  width: number,
  height: number,
  color: string = '#f3f4f6'
): string => {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) {
    // Return a default placeholder for SSR
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
};

// Generate a gradient placeholder
export const generateGradientPlaceholder = (
  width: number,
  height: number,
  startColor: string = '#e5e7eb',
  endColor: string = '#f3f4f6'
): string => {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
};

// Generate a shimmer/skeleton placeholder
export const generateShimmerPlaceholder = (
  width: number,
  height: number
): string => {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Create shimmer effect
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(0.5, '#e5e7eb');
  gradient.addColorStop(1, '#f3f4f6');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
};

// Generate blur data URL from an image source (client-side only)
export const generateBlurDataURL = async (
  imageSrc: string,
  width: number = 10,
  height: number = 10
): Promise<string> => {
  if (typeof window === 'undefined') {
    // Return default placeholder for SSR
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw scaled down image
      ctx.filter = 'blur(1px)';
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to data URL
      resolve(canvas.toDataURL('image/jpeg', 0.5));
    };
    
    img.onerror = () => {
      // Return fallback on error
      resolve(generateSolidPlaceholder(width, height));
    };
    
    img.src = imageSrc;
  });
};

// Generate LQIP (Low Quality Image Placeholder)
export const generateLQIP = async (
  imageSrc: string,
  quality: number = 0.1
): Promise<string> => {
  if (typeof window === 'undefined') {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 42; // Standard LQIP size
      
      // Calculate dimensions maintaining aspect ratio
      const aspectRatio = img.width / img.height;
      let width, height;
      
      if (aspectRatio > 1) {
        width = maxSize;
        height = Math.round(maxSize / aspectRatio);
      } else {
        height = maxSize;
        width = Math.round(maxSize * aspectRatio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw scaled down image with smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'low';
      ctx.drawImage(img, 0, 0, width, height);
      
      // Apply slight blur
      ctx.filter = 'blur(0.5px)';
      ctx.drawImage(canvas, 0, 0);
      
      // Convert to data URL with low quality
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    
    img.onerror = () => {
      resolve(generateSolidPlaceholder(10, 10));
    };
    
    img.src = imageSrc;
  });
};

// Dominant color extraction for placeholder
export const extractDominantColor = async (imageSrc: string): Promise<string> => {
  if (typeof window === 'undefined') {
    return '#f3f4f6'; // Default gray
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve('#f3f4f6');
        return;
      }
      
      // Use small canvas for performance
      canvas.width = 1;
      canvas.height = 1;
      
      // Draw scaled image
      ctx.drawImage(img, 0, 0, 1, 1);
      
      // Get pixel data
      const imageData = ctx.getImageData(0, 0, 1, 1);
      const [r, g, b] = imageData.data;
      
      // Convert to hex
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      resolve(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
    };
    
    img.onerror = () => {
      resolve('#f3f4f6');
    };
    
    img.src = imageSrc;
  });
};

// Pre-generate placeholders for common sizes
export const PRESET_PLACEHOLDERS = {
  avatar: {
    sm: generateSolidPlaceholder(32, 32, '#e5e7eb'),
    md: generateSolidPlaceholder(40, 40, '#e5e7eb'),
    lg: generateSolidPlaceholder(56, 56, '#e5e7eb'),
    xl: generateSolidPlaceholder(80, 80, '#e5e7eb'),
  },
  thumbnail: {
    sm: generateSolidPlaceholder(64, 64, '#f3f4f6'),
    md: generateSolidPlaceholder(128, 128, '#f3f4f6'),
    lg: generateSolidPlaceholder(256, 256, '#f3f4f6'),
  },
  hero: {
    mobile: generateGradientPlaceholder(375, 200),
    tablet: generateGradientPlaceholder(768, 400),
    desktop: generateGradientPlaceholder(1920, 600),
  },
};

// Utility to check if image is cached
export const isImageCached = (src: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  const img = new Image();
  img.src = src;
  return img.complete && img.naturalHeight !== 0;
};

// Preload images for better performance
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Batch preload multiple images
export const preloadImages = async (
  sources: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> => {
  let loaded = 0;
  const total = sources.length;
  
  const promises = sources.map(async (src) => {
    try {
      await preloadImage(src);
      loaded++;
      onProgress?.(loaded, total);
    } catch (error) {
      console.error(`Failed to preload image: ${src}`, error);
      loaded++;
      onProgress?.(loaded, total);
    }
  });
  
  await Promise.all(promises);
};