# Hockey Hub Cache Analytics & Performance System

This cache system provides comprehensive monitoring, analytics, and optimization for RTK Query cache operations in the Hockey Hub application.

## Features

### 1. Cache Analytics (`cacheAnalytics.ts`)
- **Real-time Metrics Tracking**
  - Cache hits, misses, updates, and evictions
  - Response time tracking
  - Payload size monitoring
  - Time saved calculations
  
- **Performance Analysis**
  - Hit rate calculations per endpoint and API slice
  - Top/low performing endpoints identification
  - Timeline tracking for historical analysis
  - Automatic data persistence in localStorage

### 2. Cache Middleware (`cacheMiddleware.ts`)
- **Automatic Event Tracking**
  - Intercepts all RTK Query operations
  - Records cache events with timing data
  - Estimates payload sizes
  - Provides performance monitoring hooks

- **Health Monitoring**
  - Cache size estimation
  - Memory leak detection
  - Performance impact analysis
  - Automatic issue detection and recommendations

### 3. Cache Warming (`cacheWarming.ts`)
- **Intelligent Preloading**
  - Priority-based endpoint warming
  - Role-based conditional warming
  - Smart warming based on usage patterns
  - Background refresh for critical data

- **Route-based Prefetching**
  - Automatic data loading for specific routes
  - Configurable refresh intervals
  - Abort capabilities for cancellation

### 4. Visual Dashboard (`CacheDashboard.tsx`)
- **Performance Overview**
  - Real-time hit rate monitoring
  - Time saved visualization
  - Cache size tracking
  - Health status indicators

- **Detailed Analytics**
  - Hit rate trends over time
  - Endpoint performance tables
  - Cache distribution by API slice
  - Export capabilities for further analysis

## Usage

### Basic Setup

The cache system is automatically initialized when the store is created:

```typescript
// In store.ts
import { cacheAnalyticsMiddleware } from './cache/cacheMiddleware';
import { initializeCacheWarming } from './cache/cacheWarming';

// Add middleware to store
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware().concat(
    cacheAnalyticsMiddleware,
    // ... other middleware
  )

// Initialize cache warming
if (typeof window !== 'undefined') {
  setTimeout(() => {
    initializeCacheWarming(store.dispatch);
  }, 1000);
}
```

### Accessing the Dashboard

Navigate to `/admin/cache` to view the cache performance dashboard.

### Manual Cache Operations

```typescript
import { 
  startCacheWarming, 
  prefetchForRoute,
  getCacheSummary 
} from '@/store/cache';

// Manually trigger cache warming
await startCacheWarming(dispatch);

// Prefetch data for a specific route
await prefetchForRoute('/calendar', dispatch);

// Get current cache statistics
const summary = getCacheSummary();
console.log(`Cache hit rate: ${summary.overallHitRate}%`);
```

### Monitoring Cache Health

```typescript
import { checkCacheHealth } from '@/store/cache';

const health = checkCacheHealth(store);
if (!health.healthy) {
  console.warn('Cache issues detected:', health.issues);
  console.log('Recommendations:', health.recommendations);
}
```

## Configuration

### Cache Warming Endpoints

Edit `cacheWarming.ts` to customize which endpoints are warmed:

```typescript
private initializeEndpoints(): void {
  this.warmingEndpoints = [
    {
      name: 'Critical Data',
      api: myApi,
      endpoint: 'getImportantData',
      priority: 'high',
      condition: () => userRole === 'admin'
    }
  ];
}
```

### Analytics Settings

Adjust analytics configuration in `cacheAnalytics.ts`:

```typescript
private readonly MAX_TIMELINE_ENTRIES = 10000; // Timeline history limit
private readonly ANALYTICS_STORAGE_KEY = 'hockey-hub-cache-analytics';
```

## Performance Impact

The cache system has minimal performance overhead:
- Analytics operations are debounced
- Timeline data is automatically pruned
- Storage operations are batched
- Monitoring can be toggled on/off

## Best Practices

1. **Regular Monitoring**: Check the dashboard regularly for performance issues
2. **Cache Warming**: Use role-based warming to preload relevant data
3. **Route Prefetching**: Implement prefetching for frequently accessed routes
4. **Export Analytics**: Periodically export data for trend analysis
5. **Health Checks**: Address issues and recommendations promptly

## Troubleshooting

### High Memory Usage
- Check cache size in dashboard
- Implement cache eviction policies
- Review endpoint payload sizes

### Low Hit Rates
- Adjust cache TTL settings
- Review cache invalidation logic
- Implement smart warming

### Performance Issues
- Check for memory leaks in timeline
- Review middleware impact
- Optimize payload sizes