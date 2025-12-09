import { Repository, SelectQueryBuilder } from 'typeorm';
import { CachedMessageRepository } from '../../repositories/CachedMessageRepository';
import { Message } from '../../entities/Message';
import { getCacheManager } from '@hockey-hub/shared-lib';

jest.mock('@hockey-hub/shared-lib', () => ({
  getCacheManager: jest.fn(),
}));

describe('CachedMessageRepository', () => {
  let repository: CachedMessageRepository;
  let mockRepository: jest.Mocked<Repository<Message>>;
  let mockCacheManager: any;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<Message>>;

  const mockMessage = {
    id: 'msg-123',
    conversationId: 'conv-123',
    senderId: 'user-123',
    content: 'Test message',
    type: 'text',
    createdAt: new Date('2025-06-29T10:00:00Z'),
    updatedAt: new Date('2025-06-29T10:00:00Z'),
    readBy: [],
    mentions: [],
    reactions: [],
  } as Message;

  beforeEach(() => {
    // Mock query builder
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    } as any;

    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deletePattern: jest.fn(),
    };

    (getCacheManager as jest.Mock).mockReturnValue(mockCacheManager);

    repository = new CachedMessageRepository(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConversationMessages', () => {
    it('should return cached messages if available', async () => {
      const cachedResult = {
        messages: [mockMessage],
        total: 1,
      };
      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result = await repository.getConversationMessages('conv-123', 20, 0);

      expect(result).toEqual(cachedResult);
      expect(mockCacheManager.get).toHaveBeenCalledWith('messages:conv-123:20:0');
      expect(mockQueryBuilder.getManyAndCount).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockMessage], 1]);

      const result = await repository.getConversationMessages('conv-123', 20, 0);

      expect(result).toEqual({
        messages: [mockMessage],
        total: 1,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('message.conversationId = :conversationId', {
        conversationId: 'conv-123',
      });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('message.createdAt', 'DESC');
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'messages:conv-123:20:0',
        { messages: [mockMessage], total: 1 },
        60 // 1 minute TTL
      );
    });
  });

  describe('getUnreadMessages', () => {
    it('should cache unread messages by user', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue([mockMessage]);

      const result = await repository.getUnreadMessages('user-123');

      expect(result).toEqual([mockMessage]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          readBy: expect.objectContaining({
            userId: 'user-123',
          }),
        },
        relations: ['sender', 'conversation'],
        order: { createdAt: 'DESC' },
        take: 100,
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'messages:unread:user-123',
        [mockMessage],
        30 // 30 seconds TTL
      );
    });
  });

  describe('searchMessages', () => {
    it('should cache search results', async () => {
      const searchResults = {
        messages: [mockMessage],
        total: 1,
      };
      mockCacheManager.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockMessage], 1]);

      const result = await repository.searchMessages({
        query: 'test',
        userId: 'user-123',
        conversationIds: ['conv-123'],
        limit: 20,
        offset: 0,
      });

      expect(result).toEqual(searchResults);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('messages:search:'),
        searchResults,
        300 // 5 minutes TTL
      );
    });

    it('should handle date range searches', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockMessage], 1]);

      await repository.searchMessages({
        query: 'test',
        userId: 'user-123',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-30'),
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'message.createdAt >= :startDate',
        { startDate: new Date('2025-06-01') }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'message.createdAt <= :endDate',
        { endDate: new Date('2025-06-30') }
      );
    });

    it('should filter by sender if specified', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockMessage], 1]);

      await repository.searchMessages({
        query: 'test',
        userId: 'user-123',
        senderId: 'sender-123',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'message.senderId = :senderId',
        { senderId: 'sender-123' }
      );
    });
  });

  describe('saveMessage', () => {
    it('should invalidate conversation cache when saving message', async () => {
      mockRepository.save.mockResolvedValue(mockMessage);

      await repository.saveMessage(mockMessage);

      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('messages:conv-123:*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('conversations:*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('messages:unread:*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('dashboard:communication:*');
    });
  });

  describe('markAsRead', () => {
    it('should update message and invalidate cache', async () => {
      mockRepository.findOne.mockResolvedValue(mockMessage);
      mockRepository.save.mockResolvedValue({
        ...mockMessage,
        readBy: [{ userId: 'user-123', readAt: new Date() }],
      });

      const result = await repository.markAsRead('msg-123', 'user-123');

      expect(result).toBe(true);
      expect(mockCacheManager.delete).toHaveBeenCalledWith('messages:msg-123');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('messages:unread:user-123');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('messages:conv-123:*');
    });

    it('should return false if message not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.markAsRead('msg-123', 'user-123');

      expect(result).toBe(false);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('addReaction', () => {
    it('should add reaction and invalidate cache', async () => {
      mockRepository.findOne.mockResolvedValue(mockMessage);
      mockRepository.save.mockResolvedValue({
        ...mockMessage,
        reactions: [{ userId: 'user-123', emoji: '👍', createdAt: new Date() }],
      });

      await repository.addReaction('msg-123', 'user-123', '👍');

      expect(mockCacheManager.delete).toHaveBeenCalledWith('messages:msg-123');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('messages:conv-123:*');
    });
  });

  describe('getMentions', () => {
    it('should cache user mentions', async () => {
      const mentionedMessage = {
        ...mockMessage,
        mentions: ['user-123'],
      };
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue([mentionedMessage]);

      const result = await repository.getMentions('user-123', 50);

      expect(result).toEqual([mentionedMessage]);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'messages:mentions:user-123',
        [mentionedMessage],
        120 // 2 minutes TTL
      );
    });
  });
});