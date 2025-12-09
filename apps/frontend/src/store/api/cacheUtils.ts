import type { FetchBaseQueryArgs } from '@reduxjs/toolkit/query';

// Cache storage interface
interface CacheEntry {
  etag?: string;
  data: any;
  timestamp: number;
  maxAge?: number;
  staleWhileRevalidate?: number;
  mustRevalidate?: boolean;
  vary?: Record<string, string>;
}

// In-memory cache storage (can be replaced with localStorage or IndexedDB)
const cacheStorage = new Map<string, CacheEntry>();

// Parse Cache-Control header
export function parseCacheControl(cacheControlHeader: string | null): {
  maxAge?: number;
  staleWhileRevalidate?: number;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  private?: boolean;
  public?: boolean;
} {
  if (!cacheControlHeader) return {};

  const directives: Record<string, any> = {};
  const parts = cacheControlHeader.toLowerCase().split(',');

  parts.forEach(part => {
    const [directive, value] = part.trim().split('=');
    
    switch (directive) {
      case 'max-age':
        directives.maxAge = parseInt(value, 10);
        break;
      case 'stale-while-revalidate':
        directives.staleWhileRevalidate = parseInt(value, 10);
        break;
      case 'no-cache':
        directives.noCache = true;
        break;
      case 'no-store':
        directives.noStore = true;
        break;
      case 'must-revalidate':
        directives.mustRevalidate = true;
        break;
      case 'private':
        directives.private = true;
        break;
      case 'public':
        directives.public = true;
        break;
    }
  });

  return directives;
}

// Generate cache key from request details
export function generateCacheKey(
  url: string,
  method: string = 'GET',
  params?: Record<string, any>,
  varyHeaders?: Record<string, string>
): string {
  const sortedParams = params ? Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {} as Record<string, any>) : {};

  const varyPart = varyHeaders ? JSON.stringify(varyHeaders) : '';
  
  return `${method}:${url}:${JSON.stringify(sortedParams)}:${varyPart}`;
}

// Store response in cache with metadata
export function setCacheEntry(
  key: string,
  data: any,
  etag?: string,
  cacheControl?: string,
  vary?: string
): void {
  const parsed = parseCacheControl(cacheControl || '');
  
  // Don't cache if no-store is set
  if (parsed.noStore) return;

  const entry: CacheEntry = {
    data,
    etag,
    timestamp: Date.now(),
    maxAge: parsed.maxAge,
    staleWhileRevalidate: parsed.staleWhileRevalidate,
    mustRevalidate: parsed.mustRevalidate,
  };

  // Parse Vary header if present
  if (vary) {
    entry.vary = vary.split(',').reduce((acc, header) => {
      acc[header.trim()] = '';
      return acc;
    }, {} as Record<string, string>);
  }

  cacheStorage.set(key, entry);
}

// Get cache entry with freshness check
export function getCacheEntry(key: string): {
  data: any;
  etag?: string;
  isFresh: boolean;
  isStale: boolean;
  shouldRevalidate: boolean;
} | null {
  const entry = cacheStorage.get(key);
  if (!entry) return null;

  const age = (Date.now() - entry.timestamp) / 1000; // age in seconds
  const maxAge = entry.maxAge || 0;
  const staleWhileRevalidate = entry.staleWhileRevalidate || 0;

  const isFresh = maxAge > 0 && age <= maxAge;
  const isStale = maxAge > 0 && age > maxAge && age <= (maxAge + staleWhileRevalidate);
  const shouldRevalidate = !isFresh || entry.mustRevalidate;

  return {
    data: entry.data,
    etag: entry.etag,
    isFresh,
    isStale,
    shouldRevalidate,
  };
}

// Check if request varies by headers
export function getVaryHeaders(key: string): Record<string, string> | undefined {
  const entry = cacheStorage.get(key);
  return entry?.vary;
}

// Clear stale entries from cache
export function clearStaleEntries(): void {
  const now = Date.now();
  
  for (const [key, entry] of cacheStorage.entries()) {
    if (entry.maxAge) {
      const age = (now - entry.timestamp) / 1000;
      const totalValidTime = entry.maxAge + (entry.staleWhileRevalidate || 0);
      
      if (age > totalValidTime) {
        cacheStorage.delete(key);
      }
    }
  }
}

// Clear all cache entries
export function clearCache(): void {
  cacheStorage.clear();
}

// Get cache statistics
export function getCacheStats(): {
  size: number;
  entries: number;
  fresh: number;
  stale: number;
} {
  let fresh = 0;
  let stale = 0;
  const now = Date.now();

  for (const entry of cacheStorage.values()) {
    if (entry.maxAge) {
      const age = (now - entry.timestamp) / 1000;
      if (age <= entry.maxAge) {
        fresh++;
      } else {
        stale++;
      }
    }
  }

  return {
    size: cacheStorage.size,
    entries: cacheStorage.size,
    fresh,
    stale,
  };
}

// Periodic cleanup
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCacheCleanup(intervalMs: number = 60000): void {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    clearStaleEntries();
  }, intervalMs);
}

export function stopCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}