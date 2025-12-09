# Phase 3 Cache Enhancement Testing Guide

## Test Environment Setup

### 1. Start the Frontend Development Server
```bash
cd /mnt/c/Hockey\ Hub/apps/frontend
pnpm dev
```

### 2. Open Browser DevTools
- Open Chrome/Edge DevTools (F12)
- Go to Application tab → Local Storage
- Look for keys starting with `persist:hockey-hub-root`
- Also check for `hockey-hub-cache-analytics`

## Test Scenarios

### 1. Redux Persistence Testing

#### Test 1.1: State Persistence
1. **Navigate to the app** (http://localhost:3010)
2. **Login and perform actions**:
   - Navigate to different pages
   - Open calendar, view events
   - Access training sessions
3. **Check Local Storage**:
   - Verify `persist:hockey-hub-root` key exists
   - Content should include serialized state for whitelisted reducers
4. **Refresh the browser** (F5)
5. **Verify state is restored**:
   - User should remain logged in
   - Recent data should be available immediately
   - No loading spinners for cached data

#### Test 1.2: Cache Rehydration
1. **Monitor console** for rehydration logs
2. **Check Redux DevTools**:
   - Install Redux DevTools Extension
   - Look for `persist/REHYDRATE` action
   - Verify state is properly restored

#### Test 1.3: Cache Versioning
1. **Check migration system**:
   - In console: `localStorage.getItem('persist:hockey-hub-root')`
   - Look for `_persist` object with version
   - Current version should be 1

### 2. HTTP Caching Testing

#### Test 2.1: ETag Support
1. **Open Network tab** in DevTools
2. **Navigate to pages with API calls**
3. **Look for response headers**:
   - `ETag` header should be present
   - `Cache-Control` header with directives
4. **Refresh the page**
5. **Check request headers**:
   - `If-None-Match` header should be sent
   - Look for 304 Not Modified responses

#### Test 2.2: Stale-While-Revalidate
1. **Make an API call** (navigate to a page)
2. **Note the response time**
3. **Navigate away and back quickly**
4. **Observe**:
   - Data appears instantly (stale data)
   - Background request updates data
   - Check for `X-Cache: STALE` header

#### Test 2.3: Cache Headers
1. **Inspect API responses** for:
   - `Cache-Control: max-age=300, stale-while-revalidate=3600`
   - `ETag: "xxxxx"`
   - `Vary: Authorization, Accept-Language`
2. **Custom cache headers**:
   - `X-Cache: HIT/MISS/STALE/REVALIDATED`
   - `X-Cache-Age: timestamp`

### 3. Cache Management Testing

#### Test 3.1: Cache Analytics Dashboard
1. **Navigate to** `/admin/cache`
2. **Verify dashboard displays**:
   - Hit rate percentage
   - Time saved metrics
   - Cache size
   - Health status

#### Test 3.2: Real-time Updates
1. **Set auto-refresh** to 5 seconds
2. **Navigate around the app** in another tab
3. **Watch analytics update**:
   - Hit/miss counts increase
   - Timeline chart updates
   - Endpoint metrics change

#### Test 3.3: Cache Operations
1. **Test Export**:
   - Click Export button
   - Verify JSON file downloads
   - Check file contains analytics data
2. **Test Clear**:
   - Click Clear button
   - Confirm dialog
   - Verify analytics reset to 0

### 4. Cache Analytics Testing

#### Test 4.1: Performance Metrics
1. **Check Performance Overview tab**:
   - Hit rate over time chart
   - Hits vs Misses area chart
   - Time range toggles (1h, 24h, 7d, all)
2. **Verify data accuracy**:
   - Make specific API calls
   - See them reflected in charts

#### Test 4.2: Endpoint Analysis
1. **Navigate to Endpoint Analysis tab**
2. **Verify tables show**:
   - Top performing endpoints (high hit rate)
   - Low performing endpoints (low hit rate)
   - Time saved per endpoint
   - Payload sizes

#### Test 4.3: Cache Distribution
1. **Navigate to Cache Distribution tab**
2. **Check visualizations**:
   - Pie chart of cache by API slice
   - Bar chart of hits/misses by API
   - Proper data representation

### 5. Cache Warming Testing

#### Test 5.1: Initial Cache Warming
1. **Clear browser cache and storage**
2. **Reload the app**
3. **Check console** for warming logs:
   - "Starting cache warming for X endpoints"
   - Individual endpoint warming success/failure
   - Total time for warming

#### Test 5.2: Manual Cache Warming
1. **Go to Cache Warming tab**
2. **Click "Start Cache Warming"**
3. **Monitor progress**:
   - Progress bar updates
   - Endpoint status changes
   - Completion messages

#### Test 5.3: Priority-based Warming
1. **Check endpoint priorities**:
   - High: User profile, permissions
   - Medium: Calendar, messages
   - Low: Statistics, reports
2. **Verify high priority warms first**

### 6. Performance Impact Testing

#### Test 6.1: Initial Load Time
1. **Clear cache** (hard refresh: Ctrl+Shift+R)
2. **Measure time to interactive**
3. **Refresh normally**
4. **Compare load times**:
   - Cached should be 60-80% faster
   - No loading spinners for cached data

#### Test 6.2: API Call Reduction
1. **Open Network tab**
2. **Navigate between pages**
3. **Count API calls**:
   - First visit: All APIs called
   - Subsequent visits: Minimal/no API calls
   - Background revalidation only

#### Test 6.3: Offline Capability
1. **Load app and navigate around**
2. **Go offline** (DevTools → Network → Offline)
3. **Try navigating**:
   - Cached pages should work
   - Cached data displays
   - Mutations queued for later

### 7. Error Handling Testing

#### Test 7.1: Cache Corruption
1. **Manually corrupt localStorage**:
   ```javascript
   localStorage.setItem('persist:hockey-hub-root', 'invalid-json')
   ```
2. **Reload app**
3. **Verify recovery**:
   - App should still load
   - Migration error handler activates
   - Fresh state initialized

#### Test 7.2: Storage Quota
1. **Fill localStorage** (if possible)
2. **Try to cache more data**
3. **Verify graceful handling**:
   - No app crashes
   - Old data evicted if needed
   - User notified if critical

### 8. Integration Testing

#### Test 8.1: Cross-Tab Synchronization
1. **Open app in multiple tabs**
2. **Make changes in one tab**
3. **Verify other tabs update**:
   - Storage events trigger updates
   - Consistent state across tabs

#### Test 8.2: Authentication Flow
1. **Login in one tab**
2. **Open new tab**
3. **Verify authenticated state**:
   - No need to re-login
   - Auth token persisted
   - User data available

## Expected Results

### Success Criteria
- ✅ Redux state persists across browser sessions
- ✅ ETag/304 responses reduce bandwidth by 60-80%
- ✅ Cache hit rate > 70% after initial warming
- ✅ Page load times reduced by 50%+ with cache
- ✅ Cache analytics accurately track all metrics
- ✅ Cache warming completes in < 10 seconds
- ✅ Stale-while-revalidate provides instant data
- ✅ Cache dashboard shows real-time updates
- ✅ Export/import functionality works correctly
- ✅ Error recovery handles corrupted cache

### Performance Benchmarks
- Initial load (cold): 2-3 seconds
- Subsequent loads (warm): < 500ms
- Cache hit rate: 70-90%
- Time saved: > 10 seconds per session
- Cache size: < 50MB for typical usage

## Troubleshooting

### Cache Not Working
1. Check browser supports localStorage
2. Verify no browser extensions blocking storage
3. Check console for errors
4. Ensure mock API returns proper headers

### Low Hit Rate
1. Check cache TTL settings
2. Verify endpoints are whitelisted
3. Look for forced refetch calls
4. Check if data changes frequently

### Performance Issues
1. Monitor cache size (should be < 50MB)
2. Check for memory leaks in DevTools
3. Verify cleanup runs periodically
4. Look for excessive re-renders

## Advanced Testing

### Browser-Specific Tests
- Chrome: Check Performance tab for memory usage
- Firefox: Use about:memory to check storage
- Safari: Test IndexedDB fallback

### Load Testing
1. Simulate 100+ cached endpoints
2. Monitor performance degradation
3. Verify cleanup handles large caches
4. Test concurrent cache operations

### Security Testing
1. Verify sensitive data is not cached
2. Check cache entries are user-scoped
3. Test cache isolation between users
4. Verify logout clears user cache