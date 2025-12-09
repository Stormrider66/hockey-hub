import { useRef, useCallback, useEffect } from 'react';

interface TabCacheConfig {
  maxCachedTabs?: number;
  cacheTimeout?: number;
  priorityTabs?: string[];
}

interface CachedTabState {
  lastAccessed: number;
  isPriority: boolean;
}

export const useTabCache = (config: TabCacheConfig = {}) => {
  const {
    maxCachedTabs = 5,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    priorityTabs = ['overview', 'calendar', 'sessions']
  } = config;

  const cacheStateRef = useRef<Map<string, CachedTabState>>(new Map());
  const cleanupTimerRef = useRef<NodeJS.Timeout>();

  // Mark a tab as accessed
  const markTabAccessed = useCallback((tabName: string) => {
    const state = cacheStateRef.current.get(tabName) || {
      lastAccessed: Date.now(),
      isPriority: priorityTabs.includes(tabName)
    };
    
    state.lastAccessed = Date.now();
    cacheStateRef.current.set(tabName, state);
    
    // Trigger cleanup if we exceed max cached tabs
    if (cacheStateRef.current.size > maxCachedTabs) {
      cleanupCache();
    }
  }, [maxCachedTabs, priorityTabs]);

  // Cleanup old cached tabs
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const entries = Array.from(cacheStateRef.current.entries());
    
    // Sort by priority and last accessed time
    entries.sort((a, b) => {
      // Priority tabs come first
      if (a[1].isPriority && !b[1].isPriority) return -1;
      if (!a[1].isPriority && b[1].isPriority) return 1;
      
      // Then sort by last accessed time (most recent first)
      return b[1].lastAccessed - a[1].lastAccessed;
    });
    
    // Keep only the allowed number of tabs
    const toKeep = entries.slice(0, maxCachedTabs);
    const newCache = new Map(toKeep);
    
    // Also remove tabs that are too old (unless they're priority)
    newCache.forEach((state, tabName) => {
      if (!state.isPriority && now - state.lastAccessed > cacheTimeout) {
        newCache.delete(tabName);
      }
    });
    
    cacheStateRef.current = newCache;
  }, [maxCachedTabs, cacheTimeout]);

  // Should a tab be cached?
  const shouldCacheTab = useCallback((tabName: string): boolean => {
    const state = cacheStateRef.current.get(tabName);
    if (!state) return true; // Not in cache, should be cached
    
    const now = Date.now();
    
    // Always cache priority tabs
    if (state.isPriority) return true;
    
    // Cache if recently accessed
    return now - state.lastAccessed < cacheTimeout;
  }, [cacheTimeout]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const entries = Array.from(cacheStateRef.current.entries());
    const now = Date.now();
    
    return {
      totalCached: entries.length,
      priorityCached: entries.filter(([_, state]) => state.isPriority).length,
      activeCached: entries.filter(([_, state]) => now - state.lastAccessed < 60000).length, // Active in last minute
      oldestCached: entries.reduce((oldest, [name, state]) => {
        if (!oldest || state.lastAccessed < oldest.lastAccessed) {
          return { name, ...state };
        }
        return oldest;
      }, null as { name: string; lastAccessed: number; isPriority: boolean } | null)
    };
  }, []);

  // Setup periodic cleanup
  useEffect(() => {
    cleanupTimerRef.current = setInterval(() => {
      cleanupCache();
    }, 60000); // Run cleanup every minute
    
    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [cleanupCache]);

  return {
    markTabAccessed,
    shouldCacheTab,
    getCacheStats,
    cleanupCache
  };
};