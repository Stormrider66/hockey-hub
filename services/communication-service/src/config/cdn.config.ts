import { CDNConfig } from '../services/CDNService';

// CDN configuration based on environment
export const getCDNConfig = (): CDNConfig => {
  const provider = process.env.CDN_PROVIDER as CDNConfig['provider'] || 'cloudflare';
  
  const configs: Record<string, CDNConfig> = {
    cloudfront: {
      provider: 'cloudfront',
      baseUrl: process.env.CDN_URL || 'https://d1234567890.cloudfront.net',
      privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
      signingEnabled: process.env.CLOUDFRONT_SIGNING_ENABLED === 'true',
      cacheTTL: 86400, // 24 hours
      customHeaders: {
        'Cache-Control': 'public, max-age=31536000', // 1 year for immutable assets
      },
    },
    cloudflare: {
      provider: 'cloudflare',
      baseUrl: process.env.CDN_URL || 'https://cdn.hockeyhub.com',
      cacheTTL: 86400, // 24 hours
      customHeaders: {
        'Cache-Control': 'public, max-age=31536000',
        'CF-Cache-Tag': 'chat-media',
      },
    },
    fastly: {
      provider: 'fastly',
      baseUrl: process.env.CDN_URL || 'https://hockeyhub.global.ssl.fastly.net',
      cacheTTL: 86400, // 24 hours
      customHeaders: {
        'Cache-Control': 'public, max-age=31536000',
        'Surrogate-Control': 'max-age=86400',
      },
    },
    custom: {
      provider: 'custom',
      baseUrl: process.env.CDN_URL || 'https://static.hockeyhub.com',
      cacheTTL: 3600, // 1 hour
    },
  };

  return configs[provider] || configs.custom;
};

// Cache control headers for different content types
export const getCacheHeaders = (contentType: string): Record<string, string> => {
  const headers: Record<string, string> = {};

  // Images - long cache
  if (contentType.startsWith('image/')) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    headers['Vary'] = 'Accept';
  }
  // Videos - moderate cache
  else if (contentType.startsWith('video/') || contentType.startsWith('audio/')) {
    headers['Cache-Control'] = 'public, max-age=604800'; // 1 week
  }
  // Documents - short cache
  else if (contentType.includes('pdf') || contentType.includes('document')) {
    headers['Cache-Control'] = 'public, max-age=3600'; // 1 hour
  }
  // Default
  else {
    headers['Cache-Control'] = 'public, max-age=86400'; // 24 hours
  }

  // Add security headers
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-Frame-Options'] = 'DENY';

  return headers;
};

// Get optimized image format based on browser support
export const getOptimizedImageFormat = (acceptHeader: string, originalFormat: string): string => {
  // Check WebP support
  if (acceptHeader.includes('image/webp')) {
    return 'webp';
  }
  
  // Check AVIF support (next-gen format)
  if (acceptHeader.includes('image/avif')) {
    return 'avif';
  }

  // Fallback to original format
  return originalFormat;
};

// CDN URL patterns for different asset types
export const CDN_PATHS = {
  // User uploads
  USER_UPLOADS: '/uploads/users',
  MESSAGE_ATTACHMENTS: '/uploads/messages',
  PROFILE_AVATARS: '/uploads/avatars',
  TEAM_LOGOS: '/uploads/teams',
  
  // Static assets
  STATIC_IMAGES: '/static/images',
  STATIC_VIDEOS: '/static/videos',
  STATIC_DOCUMENTS: '/static/docs',
  
  // Processed images
  THUMBNAILS: '/processed/thumbnails',
  OPTIMIZED: '/processed/optimized',
};

// Image transformation presets
export const IMAGE_PRESETS = {
  CHAT_THUMBNAIL: {
    width: 200,
    height: 200,
    quality: 80,
    format: 'webp',
  },
  CHAT_PREVIEW: {
    width: 600,
    height: 600,
    quality: 85,
    format: 'webp',
  },
  CHAT_FULL: {
    width: 1200,
    height: 1200,
    quality: 90,
    format: 'webp',
  },
  AVATAR_SMALL: {
    width: 40,
    height: 40,
    quality: 85,
    format: 'webp',
  },
  AVATAR_MEDIUM: {
    width: 80,
    height: 80,
    quality: 85,
    format: 'webp',
  },
  AVATAR_LARGE: {
    width: 200,
    height: 200,
    quality: 90,
    format: 'webp',
  },
};

// List of file extensions that should bypass CDN
export const CDN_BYPASS_EXTENSIONS = [
  '.html',
  '.json',
  '.xml',
  '.txt',
  '.csv',
];

// Maximum file size for CDN caching (in bytes)
export const MAX_CDN_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// CDN health check configuration
export const CDN_HEALTH_CHECK = {
  enabled: process.env.CDN_HEALTH_CHECK_ENABLED === 'true',
  interval: 60000, // 1 minute
  timeout: 5000, // 5 seconds
  testFile: '/health/test.jpg',
};

export default getCDNConfig();