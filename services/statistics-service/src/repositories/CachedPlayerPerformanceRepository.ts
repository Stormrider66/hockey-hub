import { Repository } from 'typeorm';
import { CachedRepository, CacheManager } from '@hockey-hub/shared-lib';
import { PlayerPerformanceStats } from '../entities/PlayerPerformanceStats';

export class CachedPlayerPerformanceRepository extends CachedRepository<PlayerPerformanceStats> {
  constructor(
    repository: Repository<PlayerPerformanceStats>,
    cacheManager: CacheManager
  ) {
    super(repository, cacheManager, 'player_performance');
  }

  async getPlayerStats(
    playerId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<PlayerPerformanceStats[]> {
    const cacheKey = `player_stats:${playerId}:${startDate?.toISOString()}:${endDate?.toISOString()}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const query = this.repository
          .createQueryBuilder('stats')
          .where('stats.playerId = :playerId', { playerId })
          .orderBy('stats.date', 'DESC');

        if (startDate) {
          query.andWhere('stats.date >= :startDate', { startDate });
        }
        if (endDate) {
          query.andWhere('stats.date <= :endDate', { endDate });
        }

        return query.getMany();
      },
      300 // 5 minutes TTL - frequent updates for performance tracking
    );
  }

  async getTeamPlayerStats(
    teamId: string, 
    date: Date
  ): Promise<PlayerPerformanceStats[]> {
    const cacheKey = `team_player_stats:${teamId}:${date.toISOString().split('T')[0]}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        return this.repository.find({
          where: {
            teamId,
            date
          },
          order: {
            percentileRanking: 'DESC'
          }
        });
      },
      600 // 10 minutes TTL
    );
  }

  async getPlayerPerformanceTrends(
    playerId: string, 
    days: number = 30
  ): Promise<PlayerPerformanceStats[]> {
    const cacheKey = `player_trends:${playerId}:${days}d`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return this.repository
          .createQueryBuilder('stats')
          .where('stats.playerId = :playerId', { playerId })
          .andWhere('stats.date >= :startDate', { startDate })
          .orderBy('stats.date', 'ASC')
          .getMany();
      },
      1800 // 30 minutes TTL - trends don't change frequently
    );
  }

  async getTopPerformers(
    teamId: string, 
    metric: string, 
    limit: number = 10
  ): Promise<PlayerPerformanceStats[]> {
    const cacheKey = `top_performers:${teamId}:${metric}:${limit}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const today = new Date();
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const query = this.repository
          .createQueryBuilder('stats')
          .where('stats.teamId = :teamId', { teamId })
          .andWhere('stats.date >= :startDate', { startDate: oneWeekAgo })
          .limit(limit);

        // Add ordering based on metric
        switch (metric) {
          case 'goals':
            query.orderBy('stats.goals', 'DESC');
            break;
          case 'assists':
            query.orderBy('stats.assists', 'DESC');
            break;
          case 'points':
            query.addSelect('stats.goals + stats.assists', 'points')
                 .orderBy('points', 'DESC');
            break;
          case 'readinessScore':
            query.orderBy('stats.readinessScore', 'DESC');
            break;
          case 'improvementRate':
            query.orderBy('stats.improvementRate', 'DESC');
            break;
          default:
            query.orderBy('stats.percentileRanking', 'DESC');
        }

        return query.getMany();
      },
      900 // 15 minutes TTL
    );
  }

  async getPerformanceAnalytics(
    organizationId: string, 
    period: 'week' | 'month' | 'season' = 'week'
  ): Promise<any> {
    const cacheKey = `performance_analytics:${organizationId}:${period}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const endDate = new Date();
        const startDate = new Date();
        
        switch (period) {
          case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
          case 'season':
            startDate.setMonth(endDate.getMonth() - 6);
            break;
        }

        const stats = await this.repository
          .createQueryBuilder('stats')
          .where('stats.organizationId = :organizationId', { organizationId })
          .andWhere('stats.date >= :startDate', { startDate })
          .andWhere('stats.date <= :endDate', { endDate })
          .getMany();

        // Calculate analytics
        const totalPlayers = new Set(stats.map(s => s.playerId)).size;
        const avgGoals = stats.reduce((sum, s) => sum + s.goals, 0) / stats.length;
        const avgAssists = stats.reduce((sum, s) => sum + s.assists, 0) / stats.length;
        const avgReadiness = stats
          .filter(s => s.readinessScore !== null)
          .reduce((sum, s) => sum + (s.readinessScore || 0), 0) / 
          stats.filter(s => s.readinessScore !== null).length;

        return {
          period,
          totalPlayers,
          totalRecords: stats.length,
          averages: {
            goals: avgGoals,
            assists: avgAssists,
            points: avgGoals + avgAssists,
            readinessScore: avgReadiness
          },
          trends: {
            improving: stats.filter(s => (s.improvementRate || 0) > 0).length,
            declining: stats.filter(s => (s.improvementRate || 0) < 0).length,
            stable: stats.filter(s => (s.improvementRate || 0) === 0).length
          }
        };
      },
      1800 // 30 minutes TTL for analytics
    );
  }

  async invalidatePlayerCache(playerId: string): Promise<void> {
    const patterns = [
      `player_stats:${playerId}:*`,
      `player_trends:${playerId}:*`,
      `top_performers:*` // May need to refresh if this player was in top performers
    ];
    
    await this.cacheManager.deletePattern(patterns);
  }

  async invalidateTeamCache(teamId: string): Promise<void> {
    const patterns = [
      `team_player_stats:${teamId}:*`,
      `top_performers:${teamId}:*`
    ];
    
    await this.cacheManager.deletePattern(patterns);
  }
}