import { Middleware, isRejectedWithValue, isFulfilled } from '@reduxjs/toolkit';
import { BaseQueryApi, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import {
  recordCacheHit,
  recordCacheMiss,
  recordCacheUpdate,
  recordCacheEviction,
  getCacheAnalytics,
  cacheAnalytics
} from './cacheAnalytics';

interface CacheEvent {
  type: 'hit' | 'miss' | 'update' | 'eviction';
  endpoint: string;
  slice: string;
  timestamp: number;
  metadata?: {
    responseTime?: number;
    cacheTime?: number;
    payloadSize?: number;
    error?: any;
  };
}

class CacheEventLogger {
  private events: CacheEvent[] = [];
  private readonly MAX_EVENTS = 1000;

  log(event: CacheEvent): void {
    this.events.push(event);
    
    // Keep events array manageable
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Cache Event]', {
        type: event.type,
        slice: event.slice,
        endpoint: event.endpoint,
        ...event.metadata
      });
    }
  }

  getEvents(): CacheEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}

const cacheEventLogger = new CacheEventLogger();

// Track request start times
const requestTimings = new Map<string, number>();

export const cacheAnalyticsMiddleware: Middleware = (store) => (next) => (action) => {
  // Handle RTK Query lifecycle actions
  if (action.type?.endsWith('/pending')) {
    // Request started
    const requestId = action.meta?.requestId;
    if (requestId) {
      requestTimings.set(requestId, Date.now());
    }
  }

  // Process the action
  const result = next(action);

  // Analyze cache-related actions
  if (action.type?.includes('api/queries/')) {
    handleQueryAction(action, store);
  } else if (action.type?.includes('api/mutations/')) {
    handleMutationAction(action, store);
  }

  // Handle fulfilled requests
  if (isFulfilled(action)) {
    const requestId = action.meta?.requestId;
    const startTime = requestId ? requestTimings.get(requestId) : undefined;
    
    if (startTime) {
      const responseTime = Date.now() - startTime;
      requestTimings.delete(requestId);
      
      // Extract endpoint info
      const { endpointName, baseQueryMeta } = action.meta?.arg || {};
      const slice = extractSliceName(action.type);
      
      if (endpointName && slice) {
        // Check if this was a cache hit or miss
        const wasCached = baseQueryMeta?.cached || false;
        const payloadSize = estimatePayloadSize(action.payload);
        
        if (wasCached) {
          recordCacheHit(endpointName, slice, responseTime, payloadSize);
          
          cacheEventLogger.log({
            type: 'hit',
            endpoint: endpointName,
            slice,
            timestamp: Date.now(),
            metadata: {
              cacheTime: responseTime,
              payloadSize
            }
          });
        } else {
          recordCacheMiss(endpointName, slice, responseTime, payloadSize);
          
          cacheEventLogger.log({
            type: 'miss',
            endpoint: endpointName,
            slice,
            timestamp: Date.now(),
            metadata: {
              responseTime,
              payloadSize
            }
          });
        }
      }
    }
  }

  // Handle rejected requests
  if (isRejectedWithValue(action)) {
    const requestId = action.meta?.requestId;
    if (requestId) {
      requestTimings.delete(requestId);
    }
  }

  return result;
};

function handleQueryAction(action: any, store: any): void {
  const { type, meta } = action;
  
  // Check for cache updates
  if (type.includes('/executeQuery/fulfilled')) {
    const { endpointName, forceRefetch } = meta?.arg || {};
    const slice = extractSliceName(type);
    
    if (endpointName && slice && forceRefetch) {
      recordCacheUpdate(endpointName, slice);
      
      cacheEventLogger.log({
        type: 'update',
        endpoint: endpointName,
        slice,
        timestamp: Date.now()
      });
    }
  }
  
  // Check for cache invalidations
  if (type.includes('/invalidateTags')) {
    const slice = extractSliceName(type);
    const invalidatedTags = action.payload;
    
    if (slice && invalidatedTags?.length > 0) {
      // Record evictions for invalidated endpoints
      invalidatedTags.forEach((tag: any) => {
        recordCacheEviction(tag.type, slice);
        
        cacheEventLogger.log({
          type: 'eviction',
          endpoint: tag.type,
          slice,
          timestamp: Date.now(),
          metadata: {
            error: 'Tag invalidation'
          }
        });
      });
    }
  }
}

function handleMutationAction(action: any, store: any): void {
  const { type, meta } = action;
  
  // Mutations often trigger cache invalidations
  if (type.includes('/executeMutation/fulfilled')) {
    const { endpointName } = meta?.arg || {};
    const slice = extractSliceName(type);
    
    if (endpointName && slice) {
      // Log mutation as potential cache update trigger
      cacheEventLogger.log({
        type: 'update',
        endpoint: `mutation:${endpointName}`,
        slice,
        timestamp: Date.now(),
        metadata: {
          error: 'Mutation triggered update'
        }
      });
    }
  }
}

function extractSliceName(actionType: string): string {
  // Extract slice name from action type
  // Example: "api/userApi/executeQuery/fulfilled" -> "userApi"
  const parts = actionType.split('/');
  if (parts.length >= 3 && parts[0] === 'api') {
    return parts[1];
  }
  return 'unknown';
}

function estimatePayloadSize(payload: any): number {
  try {
    // Rough estimation of payload size in bytes
    const jsonString = JSON.stringify(payload);
    return new Blob([jsonString]).size;
  } catch {
    return 0;
  }
}

// Enhanced middleware that intercepts RTK Query cache operations
export const createCacheInterceptor = (api: any) => {
  const originalBaseQuery = api.baseQuery;
  
  return async (args: any, apiObj: BaseQueryApi, extraOptions: any) => {
    const startTime = Date.now();
    const cacheKey = `${apiObj.endpoint}-${JSON.stringify(args)}`;
    
    // Check if this is a cache hit
    const cachedData = apiObj.getCacheEntry();
    const isCacheHit = cachedData?.isSuccess && !apiObj.forced;
    
    try {
      const result = await originalBaseQuery(args, apiObj, extraOptions);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Add cache metadata to result
      if (result.meta) {
        result.meta.cached = isCacheHit;
        result.meta.duration = duration;
      }
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Log cache miss on error
      if (apiObj.endpoint) {
        recordCacheMiss(apiObj.endpoint, api.reducerPath, duration);
      }
      
      throw error;
    }
  };
};

// Export utilities
export const getCacheEvents = () => cacheEventLogger.getEvents();
export const clearCacheEvents = () => cacheEventLogger.clear();

// Performance monitoring utilities
export const measureCachePerformance = (enabled: boolean = true) => {
  if (!enabled) {
    requestTimings.clear();
    return;
  }
  
  // Enable performance monitoring
  if (typeof window !== 'undefined' && window.performance) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource' && entry.name.includes('/api/')) {
          // Log API performance metrics
          console.debug('[Performance]', {
            url: entry.name,
            duration: entry.duration,
            transferSize: (entry as any).transferSize || 0,
            cached: (entry as any).transferSize === 0
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }
};

// Cache size estimation
export const estimateCacheSize = (store: any): number => {
  let totalSize = 0;
  
  try {
    const state = store.getState();
    
    // Iterate through all API slices
    Object.keys(state).forEach(key => {
      if (key.endsWith('Api') && state[key]?.queries) {
        const queries = state[key].queries;
        
        Object.values(queries).forEach((query: any) => {
          if (query?.data) {
            totalSize += estimatePayloadSize(query.data);
          }
        });
      }
    });
  } catch (error) {
    console.error('Failed to estimate cache size:', error);
  }
  
  return totalSize;
};

// Cache health check
export const checkCacheHealth = (store: any): {
  healthy: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    const cacheSize = estimateCacheSize(store);
    const analytics = getCacheAnalytics();
    const summary = cacheAnalytics.getCacheSummary();
    const { overallHitRate, totalTimeSaved } = summary;
    
    // Check cache size
    if (cacheSize > 50 * 1024 * 1024) { // 50MB
      issues.push('Cache size exceeds 50MB');
      recommendations.push('Consider implementing cache eviction policies');
    }
    
    // Check hit rate
    if (overallHitRate < 50) {
      issues.push(`Low cache hit rate: ${overallHitRate.toFixed(1)}%`);
      recommendations.push('Review cache TTL settings and prefetching strategies');
    }
    
    // Check for memory leaks
    const oldEntries = Object.values(analytics.byEndpoint).filter(
      (metrics: any) => Date.now() - metrics.lastAccessed > 3600000 // 1 hour
    );
    
    if (oldEntries.length > 100) {
      issues.push('Many stale cache entries detected');
      recommendations.push('Implement automatic cache cleanup for unused entries');
    }
    
    // Check performance impact
    if (totalTimeSaved < 1000) { // Less than 1 second saved
      issues.push('Minimal performance benefit from caching');
      recommendations.push('Identify and cache more expensive operations');
    }
  } catch (error) {
    issues.push('Failed to analyze cache health');
  }
  
  return {
    healthy: issues.length === 0,
    issues,
    recommendations
  };
};