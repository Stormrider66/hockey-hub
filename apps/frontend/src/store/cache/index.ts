// Cache Analytics
export {
  cacheAnalytics,
  recordCacheHit,
  recordCacheMiss,
  recordCacheUpdate,
  recordCacheEviction,
  getCacheAnalytics,
  getCacheSummary,
  type CacheMetrics,
  type EndpointMetrics,
  type CacheAnalytics,
  type TimelineEntry
} from './cacheAnalytics';

// Cache Middleware
export {
  cacheAnalyticsMiddleware,
  createCacheInterceptor,
  getCacheEvents,
  clearCacheEvents,
  measureCachePerformance,
  estimateCacheSize,
  checkCacheHealth
} from './cacheMiddleware';

// Cache Warming
export {
  startCacheWarming,
  stopCacheWarming,
  getCacheWarmingStatus,
  startSmartWarming,
  startBackgroundRefresh,
  prefetchForRoute,
  initializeCacheWarming,
  type WarmingEndpoint,
  type WarmingStatus,
  type WarmingEndpointStatus
} from './cacheWarming';

// Cache Migration
export {
  ensureCacheCompatibility
} from './cacheMigration';