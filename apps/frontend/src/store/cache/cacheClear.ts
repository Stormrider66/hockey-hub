/**
 * Cache Clear Utilities
 *
 * Provides functions for selective and complete cache clearing,
 * including expired entries and size management.
 */

import { api } from '../api';
import { CacheEntry } from './cacheMigration';
import { safeLocalStorage } from '@/utils/safeStorage';

export interface CacheClearOptions {
  includeVersion?: boolean;
  includeCredentials?: boolean;
  preserveKeys?: string[];
}

export interface CacheSizeInfo {
  totalSize: number;
  entryCount: number;
  sizeByApi: Record<string, number>;
  oldestEntry?: number;
  newestEntry?: number;
}

/**
 * Clear cache for a specific API slice
 */
export function clearApiCache(apiName: string): number {
  const prefix = `rtkq:${apiName}:`;
  let clearedCount = 0;

  const allKeys = safeLocalStorage.keys();
  const keysToRemove = allKeys.filter(key => key.startsWith(prefix));

  for (const key of keysToRemove) {
    safeLocalStorage.removeItem(key);
    clearedCount++;
  }

  return clearedCount;
}

/**
 * Clear all RTK Query cache
 */
export function clearAllRTKQueryCache(options: CacheClearOptions = {}): number {
  const { preserveKeys = [] } = options;
  let clearedCount = 0;

  const allKeys = safeLocalStorage.keys();
  const keysToRemove = allKeys.filter(
    key => key.startsWith('rtkq:') && !preserveKeys.includes(key)
  );

  for (const key of keysToRemove) {
    safeLocalStorage.removeItem(key);
    clearedCount++;
  }

  // Optionally clear version info
  if (options.includeVersion) {
    safeLocalStorage.removeItem('hockey-hub-cache-version');
  }

  // Optionally clear credentials
  if (options.includeCredentials) {
    safeLocalStorage.removeItem('hockey-hub-auth-token');
    safeLocalStorage.removeItem('hockey-hub-refresh-token');
  }

  return clearedCount;
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(maxAge: number = 24 * 60 * 60 * 1000): number {
  const now = Date.now();
  let clearedCount = 0;

  const keysToRemove: string[] = [];
  const allKeys = safeLocalStorage.keys();

  for (const key of allKeys) {
    if (key.startsWith('rtkq:')) {
      try {
        const rawData = safeLocalStorage.getItem(key);
        if (rawData) {
          const entry: CacheEntry = JSON.parse(rawData);
          if (entry.timestamp && (now - entry.timestamp) > maxAge) {
            keysToRemove.push(key);
          }
        }
      } catch (error) {
        // If we can't parse it, it's probably corrupted, so remove it
        keysToRemove.push(key);
      }
    }
  }

  for (const key of keysToRemove) {
    safeLocalStorage.removeItem(key);
    clearedCount++;
  }

  return clearedCount;
}

/**
 * Get cache size information
 */
export function getCacheSizeInfo(): CacheSizeInfo {
  const info: CacheSizeInfo = {
    totalSize: 0,
    entryCount: 0,
    sizeByApi: {}
  };

  let oldestTimestamp: number | undefined;
  let newestTimestamp: number | undefined;

  const allKeys = safeLocalStorage.keys();

  for (const key of allKeys) {
    if (key.startsWith('rtkq:')) {
      try {
        const value = safeLocalStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          info.totalSize += size;
          info.entryCount++;

          // Extract API name from key (rtkq:apiName:...)
          const match = key.match(/^rtkq:([^:]+):/);
          if (match) {
            const apiName = match[1];
            info.sizeByApi[apiName] = (info.sizeByApi[apiName] || 0) + size;
          }

          // Try to get timestamp
          try {
            const entry: CacheEntry = JSON.parse(value);
            if (entry.timestamp) {
              if (!oldestTimestamp || entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
              }
              if (!newestTimestamp || entry.timestamp > newestTimestamp) {
                newestTimestamp = entry.timestamp;
              }
            }
          } catch {
            // Ignore parse errors for timestamp extraction
          }
        }
      } catch (error) {
        console.error(`Failed to process cache key ${key}:`, error);
      }
    }
  }

  info.oldestEntry = oldestTimestamp;
  info.newestEntry = newestTimestamp;

  return info;
}

/**
 * Clear cache by size limit
 */
export function clearCacheBySize(maxSizeBytes: number): number {
  const entries: Array<{ key: string; size: number; timestamp?: number }> = [];

  // Collect all cache entries with their sizes
  const allKeys = safeLocalStorage.keys();

  for (const key of allKeys) {
    if (key.startsWith('rtkq:')) {
      try {
        const value = safeLocalStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          let timestamp: number | undefined;

          try {
            const entry: CacheEntry = JSON.parse(value);
            timestamp = entry.timestamp;
          } catch {
            // Ignore parse errors
          }

          entries.push({ key, size, timestamp });
        }
      } catch (error) {
        console.error(`Failed to process cache key ${key}:`, error);
      }
    }
  }

  // Sort by timestamp (oldest first) or by key if no timestamp
  entries.sort((a, b) => {
    if (a.timestamp && b.timestamp) {
      return a.timestamp - b.timestamp;
    }
    return a.key.localeCompare(b.key);
  });

  // Calculate total size and remove oldest entries until under limit
  let totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
  let clearedCount = 0;

  while (totalSize > maxSizeBytes && entries.length > 0) {
    const entry = entries.shift();
    if (entry) {
      safeLocalStorage.removeItem(entry.key);
      totalSize -= entry.size;
      clearedCount++;
    }
  }

  return clearedCount;
}

/**
 * Clear cache for specific endpoints
 */
export function clearEndpointCache(endpoints: string[]): number {
  let clearedCount = 0;

  const keysToRemove: string[] = [];
  const allKeys = safeLocalStorage.keys();

  for (const key of allKeys) {
    if (key.startsWith('rtkq:')) {
      // Check if key contains any of the endpoints
      const containsEndpoint = endpoints.some(endpoint =>
        key.toLowerCase().includes(endpoint.toLowerCase())
      );

      if (containsEndpoint) {
        keysToRemove.push(key);
      }
    }
  }

  for (const key of keysToRemove) {
    safeLocalStorage.removeItem(key);
    clearedCount++;
  }

  return clearedCount;
}

/**
 * Invalidate cache tags (for RTK Query)
 */
export function invalidateCacheTags(tags: string[]): void {
  // This would typically be done through RTK Query's API
  // but we can also manually clear related cache entries
  api.util.invalidateTags(tags);
}
