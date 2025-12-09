import { CachedStatisticsService } from '../../services/CachedStatisticsService';
import { CachedPlayerPerformanceRepository } from '../../repositories/CachedPlayerPerformanceRepository';
import { CachedTeamAnalyticsRepository } from '../../repositories/CachedTeamAnalyticsRepository';
import { CachedWorkloadAnalyticsRepository } from '../../repositories/CachedWorkloadAnalyticsRepository';
import { getCacheManager } from '@hockey-hub/shared-lib/dist/cache/cacheConfig';

jest.mock('@hockey-hub/shared-lib/dist/cache/cacheConfig', () => ({
  getCacheManager: jest.fn(),
}));

jest.mock('../../repositories/CachedPlayerPerformanceRepository');
jest.mock('../../repositories/CachedTeamAnalyticsRepository');
jest.mock('../../repositories/CachedWorkloadAnalyticsRepository');

describe('CachedStatisticsService', () => {
  let service: CachedStatisticsService;
  let mockPlayerPerformanceRepo: jest.Mocked<CachedPlayerPerformanceRepository>;
  let mockTeamAnalyticsRepo: jest.Mocked<CachedTeamAnalyticsRepository>;
  let mockWorkloadRepo: jest.Mocked<CachedWorkloadAnalyticsRepository>;
  let mockCacheManager: any;

  beforeEach(() => {
    mockPlayerPerformanceRepo = {
      getPlayerStats: jest.fn(),
      getAggregatedStats: jest.fn(),
      getPlayerTrends: jest.fn(),
      getTopPerformers: jest.fn(),
    } as any;

    mockTeamAnalyticsRepo = {
      getTeamStats: jest.fn(),
      getSeasonStats: jest.fn(),
      getTeamComparison: jest.fn(),
    } as any;

    mockWorkloadRepo = {
      getPlayerWorkload: jest.fn(),
      getTeamWorkloadSummary: jest.fn(),
      getInjuryRiskAssessment: jest.fn(),
    } as any;

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      getOrSet: jest.fn().mockImplementation(async (_k: string, fn: any) => fn()),
      deletePattern: jest.fn(),
    };

    (getCacheManager as jest.Mock).mockReturnValue(mockCacheManager);
    (CachedPlayerPerformanceRepository as any).mockImplementation(() => mockPlayerPerformanceRepo);
    (CachedTeamAnalyticsRepository as any).mockImplementation(() => mockTeamAnalyticsRepo);
    (CachedWorkloadAnalyticsRepository as any).mockImplementation(() => mockWorkloadRepo);

    // Provide minimal fake DataSource with getRepository to satisfy constructor
    const fakeDataSource: any = {
      getRepository: jest.fn(() => ({
        createQueryBuilder: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
          getRawMany: jest.fn().mockResolvedValue([]),
          getRawOne: jest.fn().mockResolvedValue({}),
        })),
        find: jest.fn().mockResolvedValue([]),
        save: jest.fn().mockResolvedValue({}),
      })),
    };

    service = new CachedStatisticsService(fakeDataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlayerDashboardStats', () => {
    it('should return cached dashboard stats if available', async () => {
      const cachedStats = {
        recentPerformance: { goals: 5, assists: 10 },
        trends: [{ date: '2025-06-29', points: 3 }],
        workload: { acwr: 1.2, riskLevel: 'moderate' },
        wellness: { score: 85, trend: 'up' },
      };

      mockCacheManager.get.mockResolvedValue(cachedStats);

      const result = await service.getPlayerDashboardStats('player-123');

      expect(result).toEqual(cachedStats);
      expect(mockCacheManager.get).toHaveBeenCalledWith('dashboard:player:player-123');
      expect(mockPlayerPerformanceRepo.getAggregatedStats).not.toHaveBeenCalled();
    });

    it('should fetch and cache dashboard stats if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const aggregatedStats = {
        totalGames: 20,
        totalGoals: 15,
        totalAssists: 20,
        totalPoints: 35,
      };
      const trends = [{ date: '2025-06-29', points: 3 }];
      const workload = {
        acwr: 1.2,
        injuryRiskScore: 3.5,
        riskLevel: 'moderate',
      };

      mockPlayerPerformanceRepo.getAggregatedStats.mockResolvedValue(aggregatedStats);
      mockPlayerPerformanceRepo.getPlayerTrends.mockResolvedValue(trends);
      mockWorkloadRepo.getPlayerWorkload.mockResolvedValue(workload);

      const result = await service.getPlayerDashboardStats('player-123');

      expect(result).toMatchObject({
        recentPerformance: aggregatedStats,
        trends: trends,
        workload: workload,
      });

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'dashboard:player:player-123',
        expect.any(Object),
        180 // 3 minutes
      );
    });
  });

  describe('getCoachDashboardStats', () => {
    it('should aggregate team statistics for coach dashboard', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const teamStats = {
        wins: 15,
        losses: 5,
        winPercentage: 75,
        goalsFor: 80,
        goalsAgainst: 40,
      };
      const topPerformers = [
        { playerId: 'player-1', value: 25, rank: 1 },
        { playerId: 'player-2', value: 20, rank: 2 },
      ];
      const workloadSummary = {
        averageACWR: 1.1,
        playersAtRisk: 2,
        totalPlayers: 20,
      };

      mockTeamAnalyticsRepo.getSeasonStats.mockResolvedValue(teamStats);
      mockPlayerPerformanceRepo.getTopPerformers.mockResolvedValue(topPerformers);
      mockWorkloadRepo.getTeamWorkloadSummary.mockResolvedValue(workloadSummary);

      const result = await service.getCoachDashboardStats('team-123');

      expect(result).toMatchObject({
        teamPerformance: teamStats,
        topScorers: topPerformers,
        workloadSummary: workloadSummary,
      });

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'dashboard:coach:team-123',
        expect.any(Object),
        300 // 5 minutes
      );
    });
  });

  describe('getTrainerDashboardStats', () => {
    it('should focus on workload and injury risk for trainer dashboard', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const workloadSummary = {
        averageACWR: 1.15,
        playersAtRisk: 3,
        totalPlayers: 25,
        riskDistribution: {
          low: 15,
          moderate: 7,
          high: 3,
        },
      };
      const riskAssessments = [
        { playerId: 'player-1', riskScore: 8.5, factors: ['high_acwr', 'fatigue'] },
        { playerId: 'player-2', riskScore: 7.2, factors: ['poor_sleep'] },
      ];

      mockWorkloadRepo.getTeamWorkloadSummary.mockResolvedValue(workloadSummary);
      mockWorkloadRepo.getInjuryRiskAssessment.mockResolvedValue(riskAssessments);

      const result = await service.getTrainerDashboardStats('org-123');

      expect(result).toMatchObject({
        workloadOverview: workloadSummary,
        playersAtRisk: riskAssessments,
      });

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'dashboard:trainer:org-123',
        expect.any(Object),
        240 // 4 minutes
      );
    });
  });

  describe('getAdminDashboardStats', () => {
    it('should provide organization-wide statistics', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      // Mock repository methods to return empty arrays/objects
      mockTeamAnalyticsRepo.getSeasonStats.mockResolvedValue({
        totalTeams: 5,
        averageWinRate: 65,
      });
      mockPlayerPerformanceRepo.getTopPerformers.mockResolvedValue([]);
      mockWorkloadRepo.getTeamWorkloadSummary.mockResolvedValue({
        totalPlayers: 100,
        averageACWR: 1.05,
      });

      const result = await service.getAdminDashboardStats('org-123');

      expect(result).toBeDefined();
      expect(result.organizationOverview).toBeDefined();

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'dashboard:admin:org-123',
        expect.any(Object),
        600 // 10 minutes
      );
    });
  });

  describe('Cache invalidation', () => {
    it('should provide method to invalidate player dashboard cache', async () => {
      await service.invalidatePlayerDashboardCache('player-123');

      expect(mockCacheManager.delete).toHaveBeenCalledWith('dashboard:player:player-123');
    });

    it('should provide method to invalidate team dashboard cache', async () => {
      await service.invalidateTeamDashboardCache('team-123');

      expect(mockCacheManager.delete).toHaveBeenCalledWith('dashboard:coach:team-123');
    });

    it('should provide method to invalidate all dashboard caches', async () => {
      const deletePattern = jest.fn();
      mockCacheManager.deletePattern = deletePattern;

      await service.invalidateAllDashboardCaches();

      expect(deletePattern).toHaveBeenCalledWith('dashboard:*');
    });
  });
});