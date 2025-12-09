# HTTP Caching with Enhanced Base Query

This document explains how to use the enhanced base query with HTTP caching support in the Hockey Hub frontend.

## Overview

The enhanced base query adds intelligent HTTP caching to RTK Query, providing:

- **ETag Support**: Automatic handling of `If-None-Match` headers and 304 responses
- **Cache-Control Parsing**: Respects server-side cache directives
- **Stale-While-Revalidate**: Returns stale data immediately while fetching fresh data in the background
- **Vary Header Support**: Correctly handles cache variations based on request headers
- **Smart Cache Management**: Automatic cleanup of expired entries

## Features

### 1. ETag Support
The enhanced base query automatically:
- Stores ETag values from responses
- Sends `If-None-Match` headers on subsequent requests
- Handles 304 Not Modified responses by returning cached data

### 2. Cache-Control Directives
Supports standard Cache-Control directives:
- `max-age`: How long the response is fresh
- `stale-while-revalidate`: How long stale data can be used while revalidating
- `no-cache`: Forces revalidation
- `no-store`: Prevents caching
- `must-revalidate`: Forces revalidation when stale

### 3. Stale-While-Revalidate
When a cached response is stale but within the stale-while-revalidate window:
1. Returns stale data immediately (fast user experience)
2. Fetches fresh data in the background
3. Updates the cache with fresh data for next request

### 4. Vary Header Support
Correctly handles responses that vary by request headers (e.g., Authorization, Accept-Language).

## Usage

### Basic Setup

The enhanced base query is automatically used in production:

```typescript
// In development or when disabled, uses standard base query
// In production, uses enhanced base query with caching
import baseQuery from '@/store/api/baseQuery';
```

### Environment Variables

Control caching behavior with environment variables:

```bash
# Enable/disable HTTP caching (default: enabled in production)
NEXT_PUBLIC_ENABLE_HTTP_CACHE=true

# Show cache monitor in production (default: false)
NEXT_PUBLIC_SHOW_CACHE_MONITOR=true
```

### API Configuration

Configure caching for individual endpoints:

```typescript
import { createApi } from '@reduxjs/toolkit/query/react';
import { enhancedBaseQueryWithRetry } from '@/store/api/enhancedBaseQuery';

const api = createApi({
  baseQuery: enhancedBaseQueryWithRetry,
  endpoints: (builder) => ({
    // Basic caching (relies on server headers)
    getUser: builder.query({
      query: (id) => `/users/${id}`,
    }),

    // Explicit cache control
    getTeamRoster: builder.query({
      query: (teamId) => ({
        url: `/teams/${teamId}/roster`,
        useCache: true,        // Enable caching
        cacheTime: 300000,     // Cache for 5 minutes
      }),
    }),

    // Force refresh
    refreshUser: builder.query({
      query: (id) => ({
        url: `/users/${id}`,
        forceRefresh: true,    // Bypass cache
      }),
    }),

    // Conditional caching
    searchPlayers: builder.query({
      query: ({ query, includeInactive }) => ({
        url: '/players/search',
        params: { q: query, includeInactive },
        useCache: !includeInactive,  // Don't cache when including inactive
      }),
    }),
  }),
});
```

### Cache Control Hook

Use the `useHttpCache` hook for cache management:

```typescript
import { useHttpCache } from '@/store/api/hooks/useHttpCache';

function CacheSettings() {
  const { stats, clearCache, clearStale, isCacheEnabled } = useHttpCache();

  return (
    <div>
      <p>Cache entries: {stats.entries}</p>
      <p>Fresh: {stats.fresh}, Stale: {stats.stale}</p>
      <button onClick={clearStale}>Clear Stale Entries</button>
      <button onClick={clearCache}>Clear All Cache</button>
    </div>
  );
}
```

### Cache Monitor Component

In development, use the cache monitor for debugging:

```typescript
// Add to your app layout
import { CacheMonitor } from '@/components/dev/CacheMonitor';

function Layout({ children }) {
  return (
    <>
      {children}
      <CacheMonitor />
    </>
  );
}
```

## Server-Side Configuration

For optimal caching, configure your backend to send appropriate headers:

### Example: Express Middleware

```javascript
// Cache static data for 5 minutes
app.get('/api/teams/:id/info', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
    'ETag': generateETag(data),
  });
  res.json(data);
});

// Cache with revalidation
app.get('/api/users/:id', (req, res) => {
  const etag = generateETag(userData);
  
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }
  
  res.set({
    'Cache-Control': 'private, max-age=60, must-revalidate',
    'ETag': etag,
  });
  res.json(userData);
});

// Vary by authorization
app.get('/api/user/profile', (req, res) => {
  res.set({
    'Cache-Control': 'private, max-age=300',
    'Vary': 'Authorization',
  });
  res.json(profile);
});
```

## Best Practices

### 1. Choose Appropriate Cache Times

```typescript
// Static data - cache longer
getReferenceData: builder.query({
  query: () => ({
    url: '/reference/equipment-types',
    cacheTime: 3600000, // 1 hour
  }),
}),

// Dynamic data - cache shorter
getPlayerStatus: builder.query({
  query: (id) => ({
    url: `/players/${id}/status`,
    cacheTime: 60000, // 1 minute
  }),
}),

// Real-time data - don't cache
getLiveScore: builder.query({
  query: (gameId) => ({
    url: `/games/${gameId}/live`,
    useCache: false,
  }),
}),
```

### 2. Use Tags for Cache Invalidation

```typescript
// Combine caching with RTK Query's tag system
updatePlayer: builder.mutation({
  query: ({ id, data }) => ({
    url: `/players/${id}`,
    method: 'PATCH',
    body: data,
  }),
  // This will invalidate cached queries with these tags
  invalidatesTags: (result, error, { id }) => [
    { type: 'Player', id },
    'PlayerList',
  ],
}),
```

### 3. Handle Stale Data Gracefully

```typescript
function PlayerCard({ playerId }) {
  const { data, isFetching } = useGetPlayerQuery(playerId);
  
  return (
    <div className={isFetching ? 'opacity-75' : ''}>
      {data && <PlayerInfo player={data} />}
      {isFetching && <LoadingOverlay />}
    </div>
  );
}
```

### 4. Monitor Cache Performance

```typescript
// Log cache statistics in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = getCacheStats();
    console.log('Cache hit rate:', 
      (stats.fresh / stats.entries * 100).toFixed(1) + '%'
    );
  }, 30000);
}
```

## Troubleshooting

### Cache Not Working

1. Check if caching is enabled:
   - Must be in production mode or explicitly enabled
   - Check `NEXT_PUBLIC_ENABLE_HTTP_CACHE` env var

2. Verify server sends cache headers:
   - Check for `Cache-Control` or `ETag` headers
   - Use browser DevTools Network tab

3. Ensure GET requests:
   - Only GET requests are cached by default

### Stale Data Issues

1. Adjust cache times:
   ```typescript
   query: () => ({
     url: '/data',
     cacheTime: 30000, // Reduce from default
   })
   ```

2. Use cache invalidation:
   ```typescript
   // Force refetch after mutation
   const [updateData] = useUpdateDataMutation();
   const { refetch } = useGetDataQuery();
   
   const handleUpdate = async () => {
     await updateData();
     refetch(); // Force fresh data
   };
   ```

### Memory Usage

The cache automatically cleans up expired entries. For manual control:

```typescript
import { clearStaleEntries, clearCache } from '@/store/api/enhancedBaseQuery';

// Clear stale entries
clearStaleEntries();

// Clear all cache (use sparingly)
clearCache();
```

## Migration Guide

To migrate existing APIs to use enhanced caching:

1. **No changes needed** - The enhanced base query is backwards compatible
2. **Optional optimization** - Add cache configuration to endpoints:
   ```typescript
   // Before
   getTeam: builder.query({
     query: (id) => `/teams/${id}`,
   }),
   
   // After (with explicit caching)
   getTeam: builder.query({
     query: (id) => ({
       url: `/teams/${id}`,
       useCache: true,
       cacheTime: 300000,
     }),
   }),
   ```

3. **Server-side** - Add cache headers for better control

## Performance Impact

The enhanced base query provides:
- **Reduced latency**: Instant responses for cached data
- **Lower bandwidth**: 304 responses save data transfer
- **Better UX**: Stale-while-revalidate prevents loading states
- **Reduced server load**: Fewer requests to backend

Typical improvements:
- 50-90% reduction in API response time for cached requests
- 30-70% reduction in bandwidth usage
- Near-instant navigation between previously visited pages