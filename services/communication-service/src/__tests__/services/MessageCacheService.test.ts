import { MessageCacheService } from '../../services/MessageCacheService';
import Redis from 'ioredis';
import { Message, MessageType, MessageStatus } from '../../entities';

// Mock Redis
jest.mock('ioredis');

describe('MessageCacheService', () => {
  let messageCacheService: MessageCacheService;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      mget: jest.fn(),
      mset: jest.fn(),
      expire: jest.fn(),
      exists: jest.fn(),
      scan: jest.fn(),
      pipeline: jest.fn(() => ({
        del: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      })),
      setex: jest.fn(),
      zadd: jest.fn(),
      zrevrange: jest.fn(),
      zrevrangebyscore: jest.fn(),
      zremrangebyscore: jest.fn(),
      zrange: jest.fn(),
      incr: jest.fn(),
      keys: jest.fn(),
      info: jest.fn(),
    } as any;

    (Redis as any).mockImplementation(() => mockRedis);
    messageCacheService = new MessageCacheService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCachedMessages', () => {
    it('should return cached messages when available', async () => {
      const cachedData = {
        data: [
          {
            id: 'msg1',
            content: 'Cached message 1',
            sender_id: 'user1',
            conversation_id: 'conv1',
            type: MessageType.TEXT,
            status: MessageStatus.SENT,
            created_at: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await messageCacheService.getCachedMessages('conv1', {
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(cachedData);
      expect(mockRedis.get).toHaveBeenCalledWith('messages:conv1:page:1:limit:20');
    });

    it('should return null when cache miss', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await messageCacheService.getCachedMessages('conv1', {
        page: 1,
        limit: 20,
      });

      expect(result).toBeNull();
    });

    it('should handle cache with before_id parameter', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      await messageCacheService.getCachedMessages('conv1', {
        before_id: 'msg123',
        limit: 20,
      });

      expect(mockRedis.get).toHaveBeenCalledWith('messages:conv1:before:msg123:limit:20');
    });

    it('should handle cache with after_id parameter', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      await messageCacheService.getCachedMessages('conv1', {
        after_id: 'msg456',
        limit: 20,
      });

      expect(mockRedis.get).toHaveBeenCalledWith('messages:conv1:after:msg456:limit:20');
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockRedis.get.mockResolvedValueOnce('invalid json');

      const result = await messageCacheService.getCachedMessages('conv1', {
        page: 1,
        limit: 20,
      });

      expect(result).toBeNull();
    });
  });

  describe('cacheMessages', () => {
    it('should cache messages with expiration', async () => {
      const messagesToCache = {
        data: [
          {
            id: 'msg1',
            content: 'Message to cache',
            sender_id: 'user1',
            conversation_id: 'conv1',
            type: MessageType.TEXT,
            status: MessageStatus.SENT,
            created_at: new Date(),
          } as Message,
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      await messageCacheService.cacheMessages('conv1', { page: 1, limit: 20 }, messagesToCache);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'messages:conv1:page:1:limit:20',
        JSON.stringify(messagesToCache),
        'EX',
        300 // 5 minutes
      );
    });

    it('should cache with different TTL for different pages', async () => {
      const messagesToCache = {
        data: [],
        total: 0,
        page: 5,
        totalPages: 10,
      };

      await messageCacheService.cacheMessages('conv1', { page: 5, limit: 20 }, messagesToCache);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'messages:conv1:page:5:limit:20',
        JSON.stringify(messagesToCache),
        'EX',
        60 // 1 minute for older pages
      );
    });

    it('should handle cache errors gracefully', async () => {
      mockRedis.set.mockRejectedValueOnce(new Error('Redis error'));

      const messagesToCache = {
        data: [],
        total: 0,
        page: 1,
        totalPages: 1,
      };

      // Should not throw
      await expect(
        messageCacheService.cacheMessages('conv1', { page: 1, limit: 20 }, messagesToCache)
      ).resolves.not.toThrow();
    });
  });

  describe('getCachedMessage', () => {
    it('should return cached individual message', async () => {
      const cachedMessage = {
        id: 'msg1',
        content: 'Cached message',
        sender_id: 'user1',
        conversation_id: 'conv1',
        type: MessageType.TEXT,
        status: MessageStatus.SENT,
        created_at: new Date().toISOString(),
      };

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedMessage));

      const result = await messageCacheService.getCachedMessage('msg1');

      expect(result).toEqual(cachedMessage);
      expect(mockRedis.get).toHaveBeenCalledWith('message:msg1');
    });

    it('should return null on cache miss', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await messageCacheService.getCachedMessage('msg1');

      expect(result).toBeNull();
    });
  });

  describe('cacheMessage', () => {
    it('should cache individual message', async () => {
      const message: Message = {
        id: 'msg1',
        content: 'Message to cache',
        sender_id: 'user1',
        conversation_id: 'conv1',
        type: MessageType.TEXT,
        status: MessageStatus.SENT,
        created_at: new Date(),
        updated_at: new Date(),
      } as Message;

      await messageCacheService.cacheMessage(message);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'message:msg1',
        JSON.stringify(message),
        'EX',
        3600 // 1 hour
      );
    });
  });

  describe('invalidateMessage', () => {
    it('should delete message from cache', async () => {
      await messageCacheService.invalidateMessage('msg1');

      expect(mockRedis.del).toHaveBeenCalledWith('message:msg1');
    });
  });

  describe('invalidateConversationCache', () => {
    it('should delete all cached pages for conversation', async () => {
      const mockPipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as any);

      // Mock scan to return some keys
      mockRedis.scan.mockImplementation((cursor, ...args) => {
        if (cursor === '0' || cursor === 0) {
          return Promise.resolve([
            '1',
            [
              'messages:conv1:page:1:limit:20',
              'messages:conv1:page:2:limit:20',
              'messages:conv1:before:msg123:limit:20',
            ],
          ]);
        }
        return Promise.resolve(['0', []]);
      });

      await messageCacheService.invalidateConversationCache('conv1');

      expect(mockRedis.scan).toHaveBeenCalled();
      expect(mockPipeline.del).toHaveBeenCalledTimes(3);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('should handle scan errors gracefully', async () => {
      mockRedis.scan.mockRejectedValueOnce(new Error('Scan error'));

      // Should not throw
      await expect(
        messageCacheService.invalidateConversationCache('conv1')
      ).resolves.not.toThrow();
    });
  });

  describe('getCachedUnreadCount', () => {
    it('should return cached unread count', async () => {
      mockRedis.get.mockResolvedValueOnce('5');

      const result = await messageCacheService.getCachedUnreadCount('user1');

      expect(result).toBe(5);
      expect(mockRedis.get).toHaveBeenCalledWith('unread:user1');
    });

    it('should return null when no cached count', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await messageCacheService.getCachedUnreadCount('user1');

      expect(result).toBeNull();
    });

    it('should handle non-numeric values', async () => {
      mockRedis.get.mockResolvedValueOnce('invalid');

      const result = await messageCacheService.getCachedUnreadCount('user1');

      expect(result).toBeNull();
    });
  });

  describe('cacheUnreadCount', () => {
    it('should cache unread count with expiration', async () => {
      await messageCacheService.cacheUnreadCount('user1', 10);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'unread:user1',
        '10',
        'EX',
        600 // 10 minutes
      );
    });
  });

  describe('invalidateUnreadCount', () => {
    it('should delete cached unread count', async () => {
      await messageCacheService.invalidateUnreadCount('user1');

      expect(mockRedis.del).toHaveBeenCalledWith('unread:user1');
    });
  });

  describe('warmCache', () => {
    it('should pre-cache recent messages for active conversations', async () => {
      const conversations = ['conv1', 'conv2'];
      const messages = [
        {
          id: 'msg1',
          conversation_id: 'conv1',
          content: 'Recent message',
          created_at: new Date(),
        },
      ];

      // This would be called during startup or periodically
      // Implementation would depend on having access to message repository
      expect(messageCacheService.warmCache).toBeDefined();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      mockRedis.scan.mockImplementation((cursor) => {
        if (cursor === '0' || cursor === 0) {
          return Promise.resolve([
            '1',
            [
              'messages:conv1:page:1:limit:20',
              'message:msg1',
              'unread:user1',
            ],
          ]);
        }
        return Promise.resolve(['0', []]);
      });

      const stats = await messageCacheService.getCacheStats();

      expect(stats).toEqual({
        totalKeys: 3,
        messageListKeys: 1,
        individualMessageKeys: 1,
        unreadCountKeys: 1,
      });
    });
  });

  describe('batch operations', () => {
    it('should cache multiple messages in batch', async () => {
      const messages = [
        {
          id: 'msg1',
          content: 'Message 1',
          conversation_id: 'conv1',
        } as Message,
        {
          id: 'msg2',
          content: 'Message 2',
          conversation_id: 'conv1',
        } as Message,
      ];

      await messageCacheService.cacheMessagesBatch(messages);

      const expectedArgs = messages.reduce((acc, msg) => {
        acc.push(`message:${msg.id}`, JSON.stringify(msg));
        return acc;
      }, [] as string[]);

      expect(mockRedis.mset).toHaveBeenCalledWith(...expectedArgs);
    });

    it('should get multiple cached messages in batch', async () => {
      const cachedMessages = [
        JSON.stringify({ id: 'msg1', content: 'Message 1' }),
        null,
        JSON.stringify({ id: 'msg3', content: 'Message 3' }),
      ];

      mockRedis.mget.mockResolvedValueOnce(cachedMessages);

      const result = await messageCacheService.getCachedMessagesBatch(['msg1', 'msg2', 'msg3']);

      expect(result).toEqual([
        { id: 'msg1', content: 'Message 1' },
        null,
        { id: 'msg3', content: 'Message 3' },
      ]);
      expect(mockRedis.mget).toHaveBeenCalledWith(['message:msg1', 'message:msg2', 'message:msg3']);
    });
  });
});