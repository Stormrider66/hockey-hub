# Message Caching Strategy

## Overview

The Hockey Hub chat system implements a comprehensive message caching strategy to improve performance and reduce database load. The caching layer uses Redis to store frequently accessed data with intelligent invalidation and cache warming strategies.

## Architecture

### Cache Layers

1. **Message Cache**
   - Individual messages cached for 24 hours
   - Full message data including attachments and reactions
   - Key format: `comm:msg:{messageId}`

2. **Conversation Messages Cache**
   - Last 100 messages per conversation
   - Stored as Redis sorted sets (score = timestamp)
   - Sliding window with automatic expiration
   - Key format: `comm:convmsgs:{conversationId}`

3. **Conversation List Cache**
   - User's conversation list with metadata
   - Includes unread counts and last message
   - 5-minute TTL for freshness
   - Key format: `comm:convlist:{userId}`

4. **Unread Count Cache**
   - Per-conversation, per-user unread counts
   - Updated in real-time as messages arrive
   - Key format: `comm:unread:{conversationId}:{userId}`

5. **User Presence Cache**
   - Online/offline status with last seen
   - 1-minute TTL for real-time updates
   - Key format: `comm:presence:{userId}`

6. **Typing Indicators**
   - Redis sorted sets with auto-expiration
   - 10-second timeout for typing status
   - Key format: `comm:typing:{conversationId}`

## Implementation Details

### MessageCacheService

The `MessageCacheService` provides a centralized caching layer with the following features:

#### Cache Operations

```typescript
// Cache a message
await messageCacheService.cacheMessage(message);

// Get cached message
const message = await messageCacheService.getCachedMessage(messageId);

// Cache conversation messages
await messageCacheService.cacheMessages(messages);

// Get conversation messages with pagination
const messages = await messageCacheService.getConversationMessages(
  conversationId,
  limit,
  beforeTimestamp
);
```

#### Cache Invalidation

```typescript
// Invalidate specific message
await messageCacheService.invalidateMessage(messageId);

// Invalidate conversation messages
await messageCacheService.invalidateConversationMessages(conversationId);

// Invalidate user's conversation list
await messageCacheService.invalidateConversationList(userId);

// Invalidate all participants' conversation lists
await messageCacheService.invalidateAllConversationLists(conversationId);
```

#### Cache Warming

```typescript
// Warm conversation cache with recent messages
await messageCacheService.warmConversationCache(conversationId);

// Warm user's conversation list
await messageCacheService.warmUserConversationsCache(userId);
```

### Integration Points

#### MessageService

- Caches messages after sending
- Checks cache before database queries
- Invalidates cache on edit/delete
- Updates unread counts in cache

#### ConversationService

- Caches conversation lists
- Uses cached unread counts
- Invalidates on conversation updates

#### PresenceService

- Caches user presence status
- Uses Redis for typing indicators
- Real-time presence updates

## Performance Metrics

The caching system tracks performance metrics:

```typescript
interface MessageCacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  cacheSize: number;
  evictions: number;
}
```

Access metrics via API:
```
GET /api/cache/metrics
```

## Cache Configuration

### TTL Settings

- Messages: 24 hours
- Conversation lists: 5 minutes
- Presence: 1 minute
- Typing indicators: 10 seconds
- Statistics: 1 hour

### Size Limits

- Max messages per conversation: 100
- Sliding window expiration
- Automatic cleanup of old entries

## API Endpoints

### Cache Management

```
GET  /api/cache/metrics              # Get cache performance metrics
POST /api/cache/clear                # Clear all caches (admin only)
POST /api/cache/warm/conversation/:id # Warm conversation cache
POST /api/cache/warm/user            # Warm user cache
```

## Best Practices

### When to Use Cache

1. **Always cache:**
   - Recent messages (last 100 per conversation)
   - Active conversation lists
   - User presence status
   - Unread counts

2. **Skip cache for:**
   - Message search queries
   - Historical data requests
   - Admin operations

### Cache Invalidation Strategy

1. **On message send:**
   - Cache new message
   - Invalidate conversation lists
   - Update unread counts

2. **On message edit/delete:**
   - Invalidate message cache
   - Invalidate conversation messages
   - Update conversation lists

3. **On conversation update:**
   - Invalidate conversation cache
   - Update all participants' lists

### Performance Optimization

1. **Batch operations:**
   - Use pipeline for multiple Redis operations
   - Cache messages in batches
   - Bulk invalidation when needed

2. **Selective caching:**
   - Only cache active conversations
   - Implement cache warming for frequently accessed data
   - Use shorter TTL for volatile data

3. **Monitoring:**
   - Track cache hit rates
   - Monitor cache size
   - Alert on low hit rates

## Troubleshooting

### Common Issues

1. **Stale data:**
   - Check TTL settings
   - Verify invalidation logic
   - Review cache warming strategy

2. **Low hit rate:**
   - Analyze access patterns
   - Adjust TTL values
   - Implement predictive caching

3. **Memory usage:**
   - Monitor Redis memory
   - Implement eviction policies
   - Reduce cache size limits

### Debug Commands

```bash
# Check Redis keys
redis-cli --scan --pattern "comm:*"

# Monitor cache operations
redis-cli monitor | grep comm:

# Check memory usage
redis-cli info memory
```

## Future Enhancements

1. **Distributed caching:**
   - Redis Cluster support
   - Geographic distribution
   - Read replicas

2. **Advanced features:**
   - Predictive pre-fetching
   - ML-based cache optimization
   - Compression for large messages

3. **Analytics:**
   - Cache performance dashboard
   - Usage pattern analysis
   - Cost optimization tools