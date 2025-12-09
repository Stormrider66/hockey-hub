/**
 * Cache Management Hooks
 * 
 * React hooks for managing cache operations including
 * clearing, status monitoring, and size management.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { api } from '../store/api';
import {
  clearApiCache,
  clearAllRTKQueryCache,
  clearExpiredCache,
  clearCacheBySize,
  clearEndpointCache,
  getCacheSizeInfo,
  CacheClearOptions,
  CacheSizeInfo
} from '../store/cache/cacheClear';
import {
  getCurrentCacheVersion,
  needsCacheMigration,
  CACHE_VERSION
} from '../store/cache/cacheVersion';
import { ensureCacheCompatibility } from '../store/cache/cacheMigration';

export interface CacheStatus {
  version: string;
  currentVersion: string;
  needsMigration: boolean;
  lastMigration?: string;
  sizeInfo: CacheSizeInfo;
}

export interface CacheClearResult {
  success: boolean;
  clearedCount: number;
  error?: string;
}

/**
 * Hook for clearing cache with various options
 */
export function useClearCache() {
  const dispatch = useAppDispatch();
  const [isClearing, setIsClearing] = useState(false);
  const [lastResult, setLastResult] = useState<CacheClearResult | null>(null);

  const clearCache = useCallback(async (
    type: 'all' | 'api' | 'expired' | 'endpoint' | 'size',
    options?: {
      apiName?: string;
      maxAge?: number;
      endpoints?: string[];
      maxSize?: number;
      clearOptions?: CacheClearOptions;
    }
  ): Promise<CacheClearResult> => {
    setIsClearing(true);
    
    try {
      let clearedCount = 0;
      
      switch (type) {
        case 'all':
          clearedCount = clearAllRTKQueryCache(options?.clearOptions || {});
          // Also reset RTK Query cache state
          dispatch(api.util.resetApiState());
          break;
          
        case 'api':
          if (options?.apiName) {
            clearedCount = clearApiCache(options.apiName);
          } else {
            throw new Error('API name required for api clear type');
          }
          break;
          
        case 'expired':
          clearedCount = clearExpiredCache(options?.maxAge);
          break;
          
        case 'endpoint':
          if (options?.endpoints) {
            clearedCount = clearEndpointCache(options.endpoints);
          } else {
            throw new Error('Endpoints required for endpoint clear type');
          }
          break;
          
        case 'size':
          if (options?.maxSize !== undefined) {
            clearedCount = clearCacheBySize(options.maxSize);
          } else {
            throw new Error('Max size required for size clear type');
          }
          break;
      }
      
      const result: CacheClearResult = {
        success: true,
        clearedCount
      };
      
      setLastResult(result);
      return result;
      
    } catch (error) {
      const result: CacheClearResult = {
        success: false,
        clearedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setLastResult(result);
      return result;
      
    } finally {
      setIsClearing(false);
    }
  }, [dispatch]);

  const clearAllCache = useCallback(async () => {
    return clearCache('all', {
      clearOptions: {
        includeVersion: true,
        includeCredentials: false
      }
    });
  }, [clearCache]);

  const clearExpired = useCallback(async (maxAgeHours: number = 24) => {
    return clearCache('expired', {
      maxAge: maxAgeHours * 60 * 60 * 1000
    });
  }, [clearCache]);

  const clearBySize = useCallback(async (maxSizeMB: number) => {
    return clearCache('size', {
      maxSize: maxSizeMB * 1024 * 1024
    });
  }, [clearCache]);

  return {
    clearCache,
    clearAllCache,
    clearExpired,
    clearBySize,
    isClearing,
    lastResult
  };
}

/**
 * Hook for monitoring cache status
 */
export function useCacheStatus() {
  const [status, setStatus] = useState<CacheStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Ensure cache compatibility
      await ensureCacheCompatibility();
      
      const versionInfo = getCurrentCacheVersion();
      const sizeInfo = getCacheSizeInfo();
      
      setStatus({
        version: versionInfo?.version || 'unknown',
        currentVersion: CACHE_VERSION,
        needsMigration: needsCacheMigration(),
        lastMigration: versionInfo?.lastMigration,
        sizeInfo
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get cache status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    isLoading,
    error,
    refreshStatus
  };
}

/**
 * Hook for monitoring cache size
 */
export function useCacheSize() {
  const [sizeInfo, setSizeInfo] = useState<CacheSizeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshSize = useCallback(() => {
    setIsLoading(true);
    try {
      const info = getCacheSizeInfo();
      setSizeInfo(info);
    } catch (error) {
      console.error('Failed to get cache size:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSize();
    
    // Refresh size info every 30 seconds if the hook is active
    const interval = setInterval(refreshSize, 30000);
    
    return () => clearInterval(interval);
  }, [refreshSize]);

  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getCacheAge = useCallback((): string | null => {
    if (!sizeInfo?.oldestEntry) return null;
    
    const ageMs = Date.now() - sizeInfo.oldestEntry;
    const hours = Math.floor(ageMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }, [sizeInfo]);

  return {
    sizeInfo,
    isLoading,
    refreshSize,
    formatSize,
    getCacheAge,
    totalSizeFormatted: sizeInfo ? formatSize(sizeInfo.totalSize) : '0 Bytes',
    apiSizes: sizeInfo ? Object.entries(sizeInfo.sizeByApi).map(([api, size]) => ({
      api,
      size,
      formatted: formatSize(size)
    })) : []
  };
}

/**
 * Hook for auto-clearing old cache entries
 */
export function useAutoCacheClear(
  enabled: boolean = true,
  maxAgeHours: number = 24,
  checkIntervalMinutes: number = 60
) {
  const { clearExpired } = useClearCache();
  const [lastClearTime, setLastClearTime] = useState<Date | null>(null);
  const [clearedCount, setClearedCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const clearOldCache = async () => {
      const result = await clearExpired(maxAgeHours);
      if (result.success) {
        setLastClearTime(new Date());
        setClearedCount(prev => prev + result.clearedCount);
      }
    };

    // Clear on mount
    clearOldCache();

    // Set up interval
    const interval = setInterval(clearOldCache, checkIntervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, maxAgeHours, checkIntervalMinutes, clearExpired]);

  return {
    lastClearTime,
    clearedCount
  };
}