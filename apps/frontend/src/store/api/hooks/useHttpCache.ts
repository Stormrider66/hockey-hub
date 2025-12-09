import { useCallback, useEffect, useState } from 'react';
import { clearCache, getCacheStats, clearStaleEntries } from '../cacheUtils';

interface CacheStats {
  size: number;
  entries: number;
  fresh: number;
  stale: number;
}

interface UseHttpCacheResult {
  stats: CacheStats;
  clearCache: () => void;
  clearStale: () => void;
  refreshStats: () => void;
  isCacheEnabled: boolean;
}

export function useHttpCache(): UseHttpCacheResult {
  const [stats, setStats] = useState<CacheStats>({
    size: 0,
    entries: 0,
    fresh: 0,
    stale: 0,
  });

  const isCacheEnabled = process.env.NODE_ENV === 'production' && 
    process.env.NEXT_PUBLIC_ENABLE_HTTP_CACHE !== 'false';

  const refreshStats = useCallback(() => {
    if (isCacheEnabled) {
      setStats(getCacheStats());
    }
  }, [isCacheEnabled]);

  const handleClearCache = useCallback(() => {
    clearCache();
    refreshStats();
  }, [refreshStats]);

  const handleClearStale = useCallback(() => {
    clearStaleEntries();
    refreshStats();
  }, [refreshStats]);

  // Refresh stats periodically
  useEffect(() => {
    if (!isCacheEnabled) return;

    refreshStats();
    const interval = setInterval(refreshStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [refreshStats, isCacheEnabled]);

  return {
    stats,
    clearCache: handleClearCache,
    clearStale: handleClearStale,
    refreshStats,
    isCacheEnabled,
  };
}

// Hook for individual query cache control
export function useQueryCache(endpoint: string) {
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [cacheStatus, setCacheStatus] = useState<'hit' | 'miss' | 'stale' | null>(null);

  const forceRefresh = useCallback(() => {
    // This would be integrated with RTK Query's refetch mechanism
    setLastFetch(new Date());
    setCacheStatus(null);
  }, []);

  return {
    lastFetch,
    cacheStatus,
    forceRefresh,
  };
}