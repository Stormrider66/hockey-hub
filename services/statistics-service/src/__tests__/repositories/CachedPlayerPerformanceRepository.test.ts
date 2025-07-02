import { Repository } from 'typeorm';
import { CachedPlayerPerformanceRepository } from '../../repositories/CachedPlayerPerformanceRepository';
import { PlayerPerformanceStats } from '../../entities/PlayerPerformanceStats';
import { getCacheManager } from '@hockey-hub/shared-lib';

jest.mock('@hockey-hub/shared-lib', () => ({
  getCacheManager: jest.fn(),
}));

describe('CachedPlayerPerformanceRepository', () => {
  let repository: CachedPlayerPerformanceRepository;
  let mockRepository: jest.Mocked<Repository<PlayerPerformanceStats>>;
  let mockCacheManager: any;

  const mockStats = {
    id: 'stat-123',
    playerId: 'player-123',
    date: new Date('2025-06-29'),
    periodType: 'game',
    goals: 2,
    assists: 1,
    points: 3,
    plusMinus: 2,
    shots: 5,
    shootingPercentage: 40,
  } as PlayerPerformanceStats;

  const mockAggregatedStats = {
    totalGames: 20,
    totalGoals: 15,
    totalAssists: 20,
    totalPoints: 35,
    avgPointsPerGame: 1.75,
    shootingPercentage: 15.5,
  };

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deletePattern: jest.fn(),
    };

    (getCacheManager as jest.Mock).mockReturnValue(mockCacheManager);

    repository = new CachedPlayerPerformanceRepository(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlayerStats', () => {
    it('should return cached stats if available', async () => {
      mockCacheManager.get.mockResolvedValue([mockStats]);

      const result = await repository.getPlayerStats('player-123', new Date('2025-06-01'), new Date('2025-06-30'));

      expect(result).toEqual([mockStats]);
      expect(mockCacheManager.get).toHaveBeenCalledWith('player:stats:player-123:2025-06-01:2025-06-30');
      expect(mockRepository.find).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue([mockStats]);

      const result = await repository.getPlayerStats('player-123', new Date('2025-06-01'), new Date('2025-06-30'));

      expect(result).toEqual([mockStats]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          playerId: 'player-123',
          date: expect.any(Object),
        },
        order: { date: 'DESC' },
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'player:stats:player-123:2025-06-01:2025-06-30',
        [mockStats],
        180 // 3 minutes
      );
    });

    it('should support pagination', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue([mockStats]);

      await repository.getPlayerStats('player-123', new Date('2025-06-01'), new Date('2025-06-30'), 10, 20);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          playerId: 'player-123',
          date: expect.any(Object),
        },
        order: { date: 'DESC' },
        take: 10,
        skip: 20,
      });
    });
  });

  describe('getAggregatedStats', () => {
    it('should cache aggregated statistics', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalGames: '20',
          totalGoals: '15',
          totalAssists: '20',
          totalPoints: '35',
          avgPointsPerGame: '1.75',
          shootingPercentage: '15.5',
        }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await repository.getAggregatedStats('player-123', 'season');

      expect(result).toEqual(mockAggregatedStats);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'player:aggregated:player-123:season',
        mockAggregatedStats,
        300 // 5 minutes
      );
    });

    it('should return cached aggregated stats if available', async () => {
      mockCacheManager.get.mockResolvedValue(mockAggregatedStats);

      const result = await repository.getAggregatedStats('player-123', 'season');

      expect(result).toEqual(mockAggregatedStats);
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('getPlayerTrends', () => {
    it('should calculate and cache player trends', async () => {
      const trends = [
        { date: '2025-06-01', points: 2, goals: 1 },
        { date: '2025-06-02', points: 3, goals: 2 },
      ];

      mockCacheManager.get.mockResolvedValue(null);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(trends),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await repository.getPlayerTrends('player-123', 30);

      expect(result).toEqual(trends);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'player:trends:player-123:30',
        trends,
        600 // 10 minutes
      );
    });
  });

  describe('getTopPerformers', () => {
    it('should cache top performers by metric', async () => {
      const topPerformers = [
        { playerId: 'player-1', value: 50, rank: 1 },
        { playerId: 'player-2', value: 45, rank: 2 },
      ];

      mockCacheManager.get.mockResolvedValue(null);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(topPerformers),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await repository.getTopPerformers('org-123', 'goals', 'season', 10);

      expect(result).toEqual(topPerformers);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'top:performers:org-123:goals:season:10',
        topPerformers,
        300
      );
    });
  });

  describe('saveStats', () => {
    it('should invalidate related caches when saving stats', async () => {
      mockRepository.save.mockResolvedValue(mockStats);

      await repository.saveStats(mockStats);

      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('player:stats:player-123:*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('player:aggregated:player-123:*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('player:trends:player-123:*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('top:performers:*');
      expect(mockCacheManager.deletePattern).toHaveBeenCalledWith('dashboard:player:player-123');
    });
  });

  describe('getPlayerComparison', () => {
    it('should cache player comparison data', async () => {
      const comparison = {
        player1: { playerId: 'player-123', goals: 20, assists: 30 },
        player2: { playerId: 'player-456', goals: 15, assists: 35 },
      };

      mockCacheManager.get.mockResolvedValue(null);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { playerId: 'player-123', goals: '20', assists: '30' },
          { playerId: 'player-456', goals: '15', assists: '35' },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await repository.getPlayerComparison(['player-123', 'player-456'], 'season');

      expect(result).toBeDefined();
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'player:comparison:player-123,player-456:season',
        expect.any(Object),
        300
      );
    });
  });
});