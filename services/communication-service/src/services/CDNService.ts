import { Logger } from '@hockey-hub/shared-lib';
import crypto from 'crypto';

const logger = new Logger('CDNService');

export interface CDNConfig {
  provider: 'cloudfront' | 'cloudflare' | 'fastly' | 'custom';
  baseUrl: string;
  privateKey?: string;
  keyPairId?: string;
  signingEnabled?: boolean;
  cacheTTL?: number;
  customHeaders?: Record<string, string>;
}

export class CDNService {
  private config: CDNConfig;
  private urlCache: Map<string, { url: string; expiresAt: number }> = new Map();

  constructor(config: CDNConfig) {
    this.config = {
      cacheTTL: 3600, // 1 hour default
      signingEnabled: false,
      ...config,
    };

    logger.info(`CDN service initialized with provider: ${this.config.provider}`);
  }

  // Transform origin URL to CDN URL
  getCDNUrl(originUrl: string, options?: {
    expiresIn?: number;
    responseHeaders?: Record<string, string>;
  }): string {
    // Check cache first
    const cacheKey = this.getCacheKey(originUrl, options);
    const cached = this.urlCache.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    let cdnUrl: string;

    // Parse origin URL
    const url = new URL(originUrl);
    const path = url.pathname;

    // Generate CDN URL based on provider
    switch (this.config.provider) {
      case 'cloudfront':
        cdnUrl = this.generateCloudFrontUrl(path, options);
        break;
      case 'cloudflare':
        cdnUrl = this.generateCloudflareUrl(path, options);
        break;
      case 'fastly':
        cdnUrl = this.generateFastlyUrl(path, options);
        break;
      case 'custom':
      default:
        cdnUrl = this.generateCustomUrl(path, options);
    }

    // Cache the URL
    const expiresAt = Date.now() + (options?.expiresIn || this.config.cacheTTL) * 1000;
    this.urlCache.set(cacheKey, { url: cdnUrl, expiresAt });

    // Clean up expired entries periodically
    if (this.urlCache.size > 1000) {
      this.cleanupCache();
    }

    return cdnUrl;
  }

  // Generate CloudFront URL with optional signing
  private generateCloudFrontUrl(path: string, options?: any): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const fullUrl = `${baseUrl}${path}`;

    if (!this.config.signingEnabled || !this.config.privateKey || !this.config.keyPairId) {
      return fullUrl;
    }

    // Generate signed URL
    const expiresIn = options?.expiresIn || 3600;
    const expires = Math.floor(Date.now() / 1000) + expiresIn;

    const policy = {
      Statement: [{
        Resource: fullUrl,
        Condition: {
          DateLessThan: { 'AWS:EpochTime': expires },
        },
      }],
    };

    const policyString = JSON.stringify(policy);
    const base64Policy = Buffer.from(policyString).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const signature = crypto
      .createSign('RSA-SHA1')
      .update(policyString)
      .sign(this.config.privateKey, 'base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return `${fullUrl}?Policy=${base64Policy}&Signature=${signature}&Key-Pair-Id=${this.config.keyPairId}`;
  }

  // Generate Cloudflare URL
  private generateCloudflareUrl(path: string, options?: any): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const fullUrl = `${baseUrl}${path}`;

    // Add Cloudflare-specific transformations
    const params = new URLSearchParams();

    // Image optimization parameters
    if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      if (options?.width) params.append('width', options.width);
      if (options?.height) params.append('height', options.height);
      if (options?.quality) params.append('quality', options.quality);
      if (options?.format) params.append('format', options.format);
    }

    const queryString = params.toString();
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
  }

  // Generate Fastly URL
  private generateFastlyUrl(path: string, options?: any): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const fullUrl = `${baseUrl}${path}`;

    // Add Fastly image optimization
    if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i) && options) {
      const transforms = [];
      if (options.width) transforms.push(`width=${options.width}`);
      if (options.height) transforms.push(`height=${options.height}`);
      if (options.quality) transforms.push(`quality=${options.quality}`);
      
      if (transforms.length > 0) {
        return `${fullUrl}?${transforms.join('&')}`;
      }
    }

    return fullUrl;
  }

  // Generate custom CDN URL
  private generateCustomUrl(path: string, options?: any): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    return `${baseUrl}${path}`;
  }

  // Get image URL with responsive variants
  getResponsiveImageUrls(originUrl: string, sizes?: {
    thumbnail?: { width: number; height: number };
    small?: { width: number; height: number };
    medium?: { width: number; height: number };
    large?: { width: number; height: number };
  }): Record<string, string> {
    const defaultSizes = {
      thumbnail: { width: 150, height: 150 },
      small: { width: 400, height: 400 },
      medium: { width: 800, height: 800 },
      large: { width: 1920, height: 1920 },
    };

    const sizesToUse = { ...defaultSizes, ...sizes };
    const urls: Record<string, string> = {};

    // Original URL
    urls.original = this.getCDNUrl(originUrl);

    // Generate URLs for each size
    Object.entries(sizesToUse).forEach(([sizeName, dimensions]) => {
      urls[sizeName] = this.getCDNUrl(originUrl, {
        width: dimensions.width,
        height: dimensions.height,
        quality: sizeName === 'thumbnail' ? 80 : 90,
      });
    });

    return urls;
  }

  // Preload critical assets
  generatePreloadHeaders(urls: string[]): string[] {
    return urls.map(url => {
      const cdnUrl = this.getCDNUrl(url);
      const type = this.getResourceType(url);
      return `<${cdnUrl}>; rel=preload; as=${type}`;
    });
  }

  // Get resource type for preload hints
  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
        return 'script';
      case 'css':
        return 'style';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
        return 'image';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'otf':
        return 'font';
      case 'mp4':
      case 'webm':
        return 'video';
      case 'mp3':
      case 'ogg':
        return 'audio';
      default:
        return 'fetch';
    }
  }

  // Purge CDN cache
  async purgeCache(urls: string[]): Promise<void> {
    logger.info(`Purging CDN cache for ${urls.length} URLs`);

    switch (this.config.provider) {
      case 'cloudfront':
        await this.purgeCloudFrontCache(urls);
        break;
      case 'cloudflare':
        await this.purgeCloudflareCache(urls);
        break;
      case 'fastly':
        await this.purgeFastlyCache(urls);
        break;
      default:
        logger.warn('Cache purging not implemented for custom CDN provider');
    }

    // Clear local URL cache
    urls.forEach(url => {
      const keys = Array.from(this.urlCache.keys()).filter(key => key.includes(url));
      keys.forEach(key => this.urlCache.delete(key));
    });
  }

  private async purgeCloudFrontCache(urls: string[]): Promise<void> {
    // Implementation would use AWS SDK
    logger.info('CloudFront cache purge requested for:', urls);
  }

  private async purgeCloudflareCache(urls: string[]): Promise<void> {
    // Implementation would use Cloudflare API
    logger.info('Cloudflare cache purge requested for:', urls);
  }

  private async purgeFastlyCache(urls: string[]): Promise<void> {
    // Implementation would use Fastly API
    logger.info('Fastly cache purge requested for:', urls);
  }

  // Generate cache key for URL caching
  private getCacheKey(url: string, options?: any): string {
    const optionsString = options ? JSON.stringify(options) : '';
    return `${url}:${optionsString}`;
  }

  // Clean up expired cache entries
  private cleanupCache(): void {
    const now = Date.now();
    let cleaned = 0;

    this.urlCache.forEach((value, key) => {
      if (value.expiresAt < now) {
        this.urlCache.delete(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired CDN URL cache entries`);
    }
  }

  // Get CDN statistics
  getStatistics(): {
    cacheSize: number;
    cacheHitRate: number;
    provider: string;
    baseUrl: string;
  } {
    return {
      cacheSize: this.urlCache.size,
      cacheHitRate: 0, // Would need to track hits/misses
      provider: this.config.provider,
      baseUrl: this.config.baseUrl,
    };
  }
}