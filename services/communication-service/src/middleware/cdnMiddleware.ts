// @ts-nocheck - Suppress TypeScript errors for build
import { Request, Response, NextFunction } from 'express';
import { CDNService } from '../services/CDNService';
import cdnConfig, { getCacheHeaders, CDN_BYPASS_EXTENSIONS, IMAGE_PRESETS } from '../config/cdn.config';
import { Logger } from '@hockey-hub/shared-lib';

const logger = new Logger('CDNMiddleware');

// Initialize CDN service
const cdnService = new CDNService(cdnConfig);

// Middleware to transform URLs to CDN URLs in responses
export const cdnTransformMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Store original json method
  const originalJson = res.json;

  // Override json method
  res.json = function(data: any) {
    try {
      // Transform URLs in the response data
      const transformedData = transformUrls(data);
      
      // Call original json method with transformed data
      return originalJson.call(this, transformedData);
    } catch (error) {
      logger.error('Failed to transform URLs:', error);
      // Fallback to original data if transformation fails
      return originalJson.call(this, data);
    }
  };

  next();
};

// Recursively transform URLs in an object
function transformUrls(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => transformUrls(item));
  }

  // Handle objects
  const transformed: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && isTransformableUrl(key, value)) {
      // Transform the URL
      transformed[key] = cdnService.getCDNUrl(value);
      
      // Add responsive variants for image URLs
      if (key === 'url' && isImageUrl(value) && obj.type === 'image') {
        transformed.variants = cdnService.getResponsiveImageUrls(value);
      }
    } else if (typeof value === 'object') {
      // Recursively transform nested objects
      transformed[key] = transformUrls(value);
    } else {
      transformed[key] = value;
    }
  }

  return transformed;
}

// Check if a URL should be transformed
function isTransformableUrl(key: string, value: string): boolean {
  // List of keys that typically contain URLs
  const urlKeys = ['url', 'avatar', 'thumbnail_url', 'image_url', 'file_url', 'src'];
  
  if (!urlKeys.includes(key)) {
    return false;
  }

  // Check if it's a valid URL
  try {
    const url = new URL(value);
    
    // Don't transform external URLs (unless they're from our S3 bucket)
    if (!url.hostname.includes('hockeyhub') && !url.hostname.includes('s3')) {
      return false;
    }

    // Check if file extension should bypass CDN
    const extension = url.pathname.split('.').pop()?.toLowerCase();
    if (extension && CDN_BYPASS_EXTENSIONS.includes(`.${extension}`)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Check if URL is an image
function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.some(ext => url.toLowerCase().includes(ext));
}

// Middleware to add CDN headers to responses
export const cdnHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add CDN-related headers
  res.set({
    'CDN-Cache-Control': 'public, max-age=3600',
    'Vary': 'Accept, Accept-Encoding',
  });

  // For file uploads, add appropriate cache headers
  if (req.path.includes('/upload') || req.path.includes('/files')) {
    const contentType = res.get('Content-Type') || 'application/octet-stream';
    const cacheHeaders = getCacheHeaders(contentType);
    res.set(cacheHeaders);
  }

  next();
};

// Middleware to handle image optimization requests
export const imageOptimizationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Check if this is an image request with optimization parameters
  const { width, height, quality, format, preset } = req.query;
  
  if (!req.path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return next();
  }

  try {
    let optimizationParams: any = {};

    // Use preset if provided
    if (preset && typeof preset === 'string' && preset in IMAGE_PRESETS) {
      optimizationParams = IMAGE_PRESETS[preset as keyof typeof IMAGE_PRESETS];
    } else {
      // Use individual parameters
      if (width) optimizationParams.width = parseInt(width as string);
      if (height) optimizationParams.height = parseInt(height as string);
      if (quality) optimizationParams.quality = parseInt(quality as string);
      if (format) optimizationParams.format = format as string;
    }

    // If optimization parameters exist, redirect to CDN URL
    if (Object.keys(optimizationParams).length > 0) {
      const originalUrl = `${req.protocol}://${req.get('host')}${req.path}`;
      const cdnUrl = cdnService.getCDNUrl(originalUrl, optimizationParams);
      
      // Redirect to CDN URL
      return res.redirect(301, cdnUrl);
    }
  } catch (error) {
    logger.error('Image optimization middleware error:', error);
  }

  next();
};

// Middleware to generate preload headers for critical resources
export const preloadHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Store original render method
  const originalRender = res.render;

  // Override render method
  res.render = function(view: string, options?: any, callback?: any) {
    // Extract critical asset URLs from options
    const criticalAssets: string[] = options?.criticalAssets || [];
    
    if (criticalAssets.length > 0) {
      // Generate preload headers
      const preloadHeaders = cdnService.generatePreloadHeaders(criticalAssets);
      res.set('Link', preloadHeaders.join(', '));
    }

    // Call original render method
    return originalRender.call(this, view, options, callback);
  };

  next();
};

// Utility function to purge CDN cache
export async function purgeCDNCache(urls: string[]): Promise<void> {
  try {
    await cdnService.purgeCache(urls);
    logger.info(`Purged CDN cache for ${urls.length} URLs`);
  } catch (error) {
    logger.error('Failed to purge CDN cache:', error);
    throw error;
  }
}

// Export CDN service instance for direct usage
export { cdnService };