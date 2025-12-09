import { PlayerFeedbackService, CreateFeedbackDto, UpdateFeedbackDto } from '../../../services/PlayerFeedbackService';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';
import { CachedRepository } from '@hockey-hub/shared-lib/dist/cache/CachedRepository';
import { PlayerFeedback, FeedbackType, FeedbackTone, FeedbackStatus } from '../../../entities/PlayerFeedback';

// Mock dependencies
jest.mock('@hockey-hub/shared-lib/dist/utils/Logger');
jest.mock('@hockey-hub/shared-lib/dist/events/EventBus');
jest.mock('@hockey-hub/shared-lib/dist/cache/CachedRepository');

describe('PlayerFeedbackService', () => {
  let service: PlayerFeedbackService;
  let mockRepository: jest.Mocked<CachedRepository<PlayerFeedback>>;
  let mockLogger: jest.Mocked<Logger>;
  let mockEventBus: jest.Mocked<EventBus>;

  const mockPlayerFeedback: PlayerFeedback = {
    id: 'feedback-1',
    playerId: 'player-1',
    coachId: 'coach-1',
    teamId: 'team-1',
    type: 'performance' as FeedbackType,
    title: 'Great improvement in skating',
    content: 'You have shown significant improvement in your skating technique during the last practice.',
    tone: 'positive' as FeedbackTone,
    priority: 'medium',
    isPrivate: false,
    status: 'draft' as FeedbackStatus,
    tags: ['skating', 'improvement'],
    contextData: { practiceId: 'practice-123' },
    deliveredAt: null,
    readAt: null,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15')
  };

  const mockDeliveredFeedback: PlayerFeedback = {
    ...mockPlayerFeedback,
    id: 'feedback-2',
    status: 'delivered' as FeedbackStatus,
    deliveredAt: new Date('2025-01-16')
  };

  const mockReadFeedback: PlayerFeedback = {
    ...mockPlayerFeedback,
    id: 'feedback-3',
    status: 'read' as FeedbackStatus,
    deliveredAt: new Date('2025-01-16'),
    readAt: new Date('2025-01-17')
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;
    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(() => mockLogger);

    // Mock EventBus
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    } as any;
    (EventBus.getInstance as jest.Mock).mockReturnValue(mockEventBus);

    // Mock CachedRepository
    mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      findMany: jest.fn(),
      findByPlayer: jest.fn(),
      findByCoach: jest.fn(),
      delete: jest.fn(),
      cacheQueryResult: jest.fn(),
      invalidateCache: jest.fn(),
      invalidateByTags: jest.fn(),
      clearCache: jest.fn()
    } as any;

    // Mock the CachedRepository constructor to return our mock
    (CachedRepository as jest.MockedClass<typeof CachedRepository>).mockImplementation(() => mockRepository);

    service = new PlayerFeedbackService();
  });

  describe('createFeedback', () => {
    it('should create feedback successfully', async () => {
      const createDto: CreateFeedbackDto = {
        playerId: 'player-1',
        coachId: 'coach-1',
        teamId: 'team-1',
        type: 'performance' as FeedbackType,
        title: 'Great improvement in skating',
        content: 'You have shown significant improvement in your skating technique.',
        tone: 'positive' as FeedbackTone,
        priority: 'medium',
        isPrivate: false,
        tags: ['skating', 'improvement'],
        contextData: { practiceId: 'practice-123' }
      };

      mockRepository.save.mockResolvedValue(mockPlayerFeedback);

      const result = await service.createFeedback(createDto);

      expect(result).toBe(mockPlayerFeedback);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createDto,
        status: 'draft',
        deliveredAt: null,
        readAt: null
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith('player-feedback.created', {
        feedbackId: 'feedback-1',
        playerId: 'player-1',
        coachId: 'coach-1',
        type: 'performance',
        tone: 'positive'
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Creating player feedback', {
        playerId: 'player-1',
        type: 'performance',
        tone: 'positive'
      });
    });

    it('should handle create feedback errors', async () => {
      const createDto: CreateFeedbackDto = {
        playerId: 'player-1',
        coachId: 'coach-1',
        teamId: 'team-1',
        type: 'behavioral' as FeedbackType,
        title: 'Attendance issue',
        content: 'Please improve your attendance.',
        tone: 'constructive' as FeedbackTone,
        priority: 'high',
        isPrivate: true
      };

      const error = new Error('Database error');
      mockRepository.save.mockRejectedValue(error);

      await expect(service.createFeedback(createDto)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith('Error creating player feedback', {
        error: 'Database error',
        data: createDto
      });
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should create feedback with minimal required data', async () => {
      const createDto: CreateFeedbackDto = {
        playerId: 'player-2',
        coachId: 'coach-2',
        teamId: 'team-2',
        type: 'tactical' as FeedbackType,
        title: 'Positioning feedback',
        content: 'Work on defensive positioning.',
        tone: 'neutral' as FeedbackTone,
        priority: 'low',
        isPrivate: false
      };

      const minimalFeedback = {
        ...mockPlayerFeedback,
        ...createDto,
        tags: undefined,
        contextData: undefined
      };

      mockRepository.save.mockResolvedValue(minimalFeedback);

      const result = await service.createFeedback(createDto);

      expect(result).toBe(minimalFeedback);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createDto,
        status: 'draft',
        deliveredAt: null,
        readAt: null
      });
    });
  });

  describe('updateFeedback', () => {
    it('should update feedback successfully', async () => {
      const updateDto: UpdateFeedbackDto = {
        title: 'Updated title',
        content: 'Updated content',
        priority: 'high',
        tags: ['updated', 'revised']
      };

      const updatedFeedback = {
        ...mockPlayerFeedback,
        ...updateDto
      };

      mockRepository.findOne.mockResolvedValue(mockPlayerFeedback);
      mockRepository.save.mockResolvedValue(updatedFeedback);

      const result = await service.updateFeedback('feedback-1', updateDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'feedback-1' } });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockPlayerFeedback,
        ...updateDto
      });
      expect(mockRepository.invalidateByTags).toHaveBeenCalledWith([
        'player:player-1',
        'coach:coach-1'
      ]);
      expect(result).toBe(updatedFeedback);
    });

    it('should throw error when feedback not found for update', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateFeedback('nonexistent-id', { title: 'New title' })).rejects.toThrow('Player feedback not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockRepository.invalidateByTags).not.toHaveBeenCalled();
    });

    it('should update feedback status', async () => {
      const updateDto: UpdateFeedbackDto = {
        status: 'delivered' as FeedbackStatus
      };

      mockRepository.findOne.mockResolvedValue(mockPlayerFeedback);
      mockRepository.save.mockResolvedValue({ ...mockPlayerFeedback, status: 'delivered' });

      await service.updateFeedback('feedback-1', updateDto);

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockPlayerFeedback,
        status: 'delivered'
      });
    });
  });

  describe('deliverFeedback', () => {
    it('should deliver feedback successfully', async () => {
      const deliveredFeedback = {
        ...mockPlayerFeedback,
        status: 'delivered' as FeedbackStatus,
        deliveredAt: expect.any(Date)
      };

      mockRepository.findOne.mockResolvedValue(mockPlayerFeedback);
      mockRepository.save.mockResolvedValue(deliveredFeedback);

      const result = await service.deliverFeedback('feedback-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'feedback-1' } });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockPlayerFeedback,
        status: 'delivered',
        deliveredAt: expect.any(Date)
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith('player-feedback.delivered', {
        feedbackId: 'feedback-1',
        playerId: 'player-1',
        coachId: 'coach-1'
      });
      expect(result).toBe(deliveredFeedback);
    });

    it('should throw error when feedback not found for delivery', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deliverFeedback('nonexistent-id')).rejects.toThrow('Player feedback not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should deliver already delivered feedback', async () => {
      mockRepository.findOne.mockResolvedValue(mockDeliveredFeedback);
      mockRepository.save.mockResolvedValue(mockDeliveredFeedback);

      const result = await service.deliverFeedback('feedback-2');

      expect(result.status).toBe('delivered');
      expect(result.deliveredAt).toEqual(expect.any(Date));
    });
  });

  describe('markAsRead', () => {
    it('should mark feedback as read successfully', async () => {
      const readFeedback = {
        ...mockDeliveredFeedback,
        status: 'read' as FeedbackStatus,
        readAt: expect.any(Date)
      };

      mockRepository.findOne.mockResolvedValue(mockDeliveredFeedback);
      mockRepository.save.mockResolvedValue(readFeedback);

      const result = await service.markAsRead('feedback-2');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'feedback-2' } });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockDeliveredFeedback,
        status: 'read',
        readAt: expect.any(Date)
      });
      expect(result).toBe(readFeedback);
    });

    it('should throw error when feedback not found for marking as read', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent-id')).rejects.toThrow('Player feedback not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should mark already read feedback as read again', async () => {
      mockRepository.findOne.mockResolvedValue(mockReadFeedback);
      mockRepository.save.mockResolvedValue(mockReadFeedback);

      const result = await service.markAsRead('feedback-3');

      expect(result.status).toBe('read');
      expect(result.readAt).toEqual(expect.any(Date));
    });
  });

  describe('getPlayerFeedback', () => {
    it('should return player feedback with no filters', async () => {
      const feedbackList = [mockPlayerFeedback, mockDeliveredFeedback, mockReadFeedback];
      mockRepository.findByPlayer.mockResolvedValue(feedbackList);

      const result = await service.getPlayerFeedback('player-1');

      expect(result).toEqual(feedbackList);
      expect(mockRepository.findByPlayer).toHaveBeenCalledWith('player-1', undefined, undefined);
    });

    it('should return player feedback with limit', async () => {
      const feedbackList = [mockPlayerFeedback];
      mockRepository.findByPlayer.mockResolvedValue(feedbackList);

      const result = await service.getPlayerFeedback('player-1', 1);

      expect(result).toEqual(feedbackList);
      expect(mockRepository.findByPlayer).toHaveBeenCalledWith('player-1', 1, undefined);
    });

    it('should return player feedback with status filter', async () => {
      const unreadFeedback = [mockPlayerFeedback, mockDeliveredFeedback];
      mockRepository.findByPlayer.mockResolvedValue(unreadFeedback);

      const result = await service.getPlayerFeedback('player-1', undefined, 'delivered');

      expect(result).toEqual(unreadFeedback);
      expect(mockRepository.findByPlayer).toHaveBeenCalledWith('player-1', undefined, 'delivered');
    });

    it('should return empty array for player with no feedback', async () => {
      mockRepository.findByPlayer.mockResolvedValue([]);

      const result = await service.getPlayerFeedback('player-without-feedback');

      expect(result).toEqual([]);
    });
  });

  describe('getCoachFeedback', () => {
    it('should return coach feedback without filters', async () => {
      const feedbackList = [mockPlayerFeedback, mockDeliveredFeedback];
      mockRepository.findByCoach.mockResolvedValue(feedbackList);

      const result = await service.getCoachFeedback('coach-1');

      expect(result).toEqual(feedbackList);
      expect(mockRepository.findByCoach).toHaveBeenCalledWith('coach-1', undefined);
    });

    it('should return coach feedback with filters', async () => {
      const filters = {
        playerId: 'player-1',
        type: 'performance' as FeedbackType,
        status: 'delivered' as FeedbackStatus
      };

      const filteredFeedback = [mockDeliveredFeedback];
      mockRepository.findByCoach.mockResolvedValue(filteredFeedback);

      const result = await service.getCoachFeedback('coach-1', filters);

      expect(result).toEqual(filteredFeedback);
      expect(mockRepository.findByCoach).toHaveBeenCalledWith('coach-1', filters);
    });

    it('should return empty array for coach with no feedback', async () => {
      mockRepository.findByCoach.mockResolvedValue([]);

      const result = await service.getCoachFeedback('coach-without-feedback');

      expect(result).toEqual([]);
    });
  });

  describe('getFeedbackSummary', () => {
    it('should generate comprehensive feedback summary', async () => {
      const performanceFeedback = { ...mockPlayerFeedback, type: 'performance' as FeedbackType, tone: 'positive' as FeedbackTone };
      const tacticalFeedback = { ...mockPlayerFeedback, id: 'feedback-2', type: 'tactical' as FeedbackType, tone: 'constructive' as FeedbackTone };
      const behavioralFeedback = { ...mockPlayerFeedback, id: 'feedback-3', type: 'behavioral' as FeedbackType, tone: 'negative' as FeedbackTone, status: 'read' as FeedbackStatus };

      const feedbackList = [performanceFeedback, tacticalFeedback, behavioralFeedback];
      mockRepository.findByPlayer.mockResolvedValue(feedbackList);

      const result = await service.getFeedbackSummary('player-1');

      expect(result).toEqual({
        totalFeedback: 3,
        unreadCount: 2, // Only behavioralFeedback is read
        feedbackByType: {
          performance: 1,
          tactical: 1,
          behavioral: 1
        },
        feedbackByTone: {
          positive: 1,
          constructive: 1,
          negative: 1
        },
        recentFeedback: [performanceFeedback, tacticalFeedback, behavioralFeedback]
      });
      expect(mockRepository.findByPlayer).toHaveBeenCalledWith('player-1');
    });

    it('should handle empty feedback list', async () => {
      mockRepository.findByPlayer.mockResolvedValue([]);

      const result = await service.getFeedbackSummary('player-without-feedback');

      expect(result).toEqual({
        totalFeedback: 0,
        unreadCount: 0,
        feedbackByType: {},
        feedbackByTone: {},
        recentFeedback: []
      });
    });

    it('should limit recent feedback to 5 items', async () => {
      const feedbackList = Array.from({ length: 10 }, (_, i) => ({
        ...mockPlayerFeedback,
        id: `feedback-${i + 1}`
      }));

      mockRepository.findByPlayer.mockResolvedValue(feedbackList);

      const result = await service.getFeedbackSummary('player-1');

      expect(result.totalFeedback).toBe(10);
      expect(result.recentFeedback).toHaveLength(5);
    });
  });

  describe('searchFeedback', () => {
    it('should search feedback by title and content', async () => {
      const feedbackList = [
        { ...mockPlayerFeedback, title: 'Great skating improvement', content: 'Your skating has improved significantly' },
        { ...mockPlayerFeedback, id: 'feedback-2', title: 'Shooting technique', content: 'Work on your wrist shot accuracy' },
        { ...mockPlayerFeedback, id: 'feedback-3', title: 'Team communication', content: 'Better communication with teammates needed' }
      ];

      mockRepository.findByCoach.mockResolvedValue(feedbackList);

      const result = await service.searchFeedback('coach-1', 'skating');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Great skating improvement');
      expect(mockRepository.findByCoach).toHaveBeenCalledWith('coach-1', undefined);
    });

    it('should search feedback by tags', async () => {
      const feedbackList = [
        { ...mockPlayerFeedback, tags: ['skating', 'improvement'] },
        { ...mockPlayerFeedback, id: 'feedback-2', tags: ['shooting', 'accuracy'] },
        { ...mockPlayerFeedback, id: 'feedback-3', tags: ['teamwork', 'communication'] }
      ];

      mockRepository.findByCoach.mockResolvedValue(feedbackList);

      const result = await service.searchFeedback('coach-1', 'accuracy');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('feedback-2');
    });

    it('should return all feedback when query is empty', async () => {
      const feedbackList = [mockPlayerFeedback, mockDeliveredFeedback];
      mockRepository.findByCoach.mockResolvedValue(feedbackList);

      const result = await service.searchFeedback('coach-1', '');

      expect(result).toEqual(feedbackList);
    });

    it('should search with filters applied', async () => {
      const filters = {
        playerId: 'player-1',
        type: 'performance' as FeedbackType
      };

      const filteredFeedback = [mockPlayerFeedback];
      mockRepository.findByCoach.mockResolvedValue(filteredFeedback);

      const result = await service.searchFeedback('coach-1', 'improvement', filters);

      expect(mockRepository.findByCoach).toHaveBeenCalledWith('coach-1', filters);
      expect(result).toEqual(filteredFeedback);
    });

    it('should return empty array when no matches found', async () => {
      const feedbackList = [mockPlayerFeedback];
      mockRepository.findByCoach.mockResolvedValue(feedbackList);

      const result = await service.searchFeedback('coach-1', 'nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('bulkDeliverFeedback', () => {
    it('should deliver multiple feedback items successfully', async () => {
      const feedbackIds = ['feedback-1', 'feedback-2', 'feedback-3'];
      
      // Mock successful delivery for all items
      mockRepository.findOne
        .mockResolvedValueOnce(mockPlayerFeedback)
        .mockResolvedValueOnce({ ...mockPlayerFeedback, id: 'feedback-2' })
        .mockResolvedValueOnce({ ...mockPlayerFeedback, id: 'feedback-3' });

      mockRepository.save
        .mockResolvedValueOnce({ ...mockPlayerFeedback, status: 'delivered' })
        .mockResolvedValueOnce({ ...mockPlayerFeedback, id: 'feedback-2', status: 'delivered' })
        .mockResolvedValueOnce({ ...mockPlayerFeedback, id: 'feedback-3', status: 'delivered' });

      const result = await service.bulkDeliverFeedback(feedbackIds);

      expect(result).toEqual({
        delivered: 3,
        failed: []
      });
      expect(mockRepository.findOne).toHaveBeenCalledTimes(3);
      expect(mockRepository.save).toHaveBeenCalledTimes(3);
      expect(mockEventBus.publish).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in bulk delivery', async () => {
      const feedbackIds = ['feedback-1', 'feedback-2', 'feedback-3'];
      
      // Mock successful delivery for first item, failure for second, success for third
      mockRepository.findOne
        .mockResolvedValueOnce(mockPlayerFeedback)
        .mockResolvedValueOnce(null) // Not found
        .mockResolvedValueOnce({ ...mockPlayerFeedback, id: 'feedback-3' });

      mockRepository.save
        .mockResolvedValueOnce({ ...mockPlayerFeedback, status: 'delivered' })
        .mockResolvedValueOnce({ ...mockPlayerFeedback, id: 'feedback-3', status: 'delivered' });

      const result = await service.bulkDeliverFeedback(feedbackIds);

      expect(result).toEqual({
        delivered: 2,
        failed: ['feedback-2']
      });
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to deliver feedback', {
        feedbackId: 'feedback-2',
        error: 'Player feedback not found'
      });
    });

    it('should handle complete failure in bulk delivery', async () => {
      const feedbackIds = ['feedback-1', 'feedback-2'];
      
      // Mock failure for both items
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.bulkDeliverFeedback(feedbackIds);

      expect(result).toEqual({
        delivered: 0,
        failed: ['feedback-1', 'feedback-2']
      });
      expect(mockLogger.error).toHaveBeenCalledTimes(2);
    });

    it('should handle empty feedback ID array', async () => {
      const result = await service.bulkDeliverFeedback([]);

      expect(result).toEqual({
        delivered: 0,
        failed: []
      });
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it('should handle database errors in bulk delivery', async () => {
      const feedbackIds = ['feedback-1'];
      
      mockRepository.findOne.mockResolvedValue(mockPlayerFeedback);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      const result = await service.bulkDeliverFeedback(feedbackIds);

      expect(result).toEqual({
        delivered: 0,
        failed: ['feedback-1']
      });
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to deliver feedback', {
        feedbackId: 'feedback-1',
        error: 'Database error'
      });
    });
  });

  describe('error handling', () => {
    it('should handle repository findOne errors', async () => {
      const error = new Error('Database connection failed');
      mockRepository.findOne.mockRejectedValue(error);

      await expect(service.updateFeedback('feedback-1', { title: 'New title' })).rejects.toThrow('Database connection failed');
    });

    it('should handle repository findByPlayer errors', async () => {
      const error = new Error('Query failed');
      mockRepository.findByPlayer.mockRejectedValue(error);

      await expect(service.getPlayerFeedback('player-1')).rejects.toThrow('Query failed');
    });

    it('should handle repository findByCoach errors', async () => {
      const error = new Error('Index error');
      mockRepository.findByCoach.mockRejectedValue(error);

      await expect(service.getCoachFeedback('coach-1')).rejects.toThrow('Index error');
    });

    it('should handle event bus publish errors gracefully', async () => {
      const createDto: CreateFeedbackDto = {
        playerId: 'player-1',
        coachId: 'coach-1',
        teamId: 'team-1',
        type: 'performance' as FeedbackType,
        title: 'Test feedback',
        content: 'Test content',
        tone: 'positive' as FeedbackTone,
        priority: 'medium',
        isPrivate: false
      };

      mockRepository.save.mockResolvedValue(mockPlayerFeedback);
      mockEventBus.publish.mockRejectedValue(new Error('Event bus error'));

      // Should still complete the creation even if event publishing fails
      await expect(service.createFeedback(createDto)).rejects.toThrow('Event bus error');
    });
  });

  describe('edge cases', () => {
    it('should handle feedback with no tags in search', async () => {
      const feedbackList = [
        { ...mockPlayerFeedback, tags: null },
        { ...mockPlayerFeedback, id: 'feedback-2', tags: undefined },
        { ...mockPlayerFeedback, id: 'feedback-3', tags: ['searchable'] }
      ];

      mockRepository.findByCoach.mockResolvedValue(feedbackList);

      const result = await service.searchFeedback('coach-1', 'searchable');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('feedback-3');
    });

    it('should handle case-insensitive search', async () => {
      const feedbackList = [
        { ...mockPlayerFeedback, title: 'Great SKATING Improvement', content: 'skating technique' }
      ];

      mockRepository.findByCoach.mockResolvedValue(feedbackList);

      const result = await service.searchFeedback('coach-1', 'skating');

      expect(result).toHaveLength(1);
    });

    it('should handle feedback with no content in search', async () => {
      const feedbackList = [
        { ...mockPlayerFeedback, content: '', title: 'Empty content feedback' }
      ];

      mockRepository.findByCoach.mockResolvedValue(feedbackList);

      const result = await service.searchFeedback('coach-1', 'empty');

      expect(result).toHaveLength(1);
    });

    it('should handle very long feedback lists in summary', async () => {
      const feedbackList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockPlayerFeedback,
        id: `feedback-${i + 1}`,
        type: (i % 3 === 0 ? 'performance' : i % 3 === 1 ? 'tactical' : 'behavioral') as FeedbackType,
        status: (i < 900 ? 'draft' : 'read') as FeedbackStatus
      }));

      mockRepository.findByPlayer.mockResolvedValue(feedbackList);

      const result = await service.getFeedbackSummary('player-1');

      expect(result.totalFeedback).toBe(1000);
      expect(result.unreadCount).toBe(900);
      expect(result.recentFeedback).toHaveLength(5);
    });
  });
});