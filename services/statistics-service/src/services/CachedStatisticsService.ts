import { DataSource } from 'typeorm';
import { CacheManager } from '@hockey-hub/shared-lib';
import {
  CachedPlayerPerformanceRepository,
  CachedTeamAnalyticsRepository,
  CachedWorkloadAnalyticsRepository
} from '../repositories';
import {
  PlayerPerformanceStats,
  TeamAnalytics,
  WorkloadAnalytics
} from '../entities';

export class CachedStatisticsService {
  private playerPerformanceRepo: CachedPlayerPerformanceRepository;
  private teamAnalyticsRepo: CachedTeamAnalyticsRepository;
  private workloadAnalyticsRepo: CachedWorkloadAnalyticsRepository;

  constructor(
    private dataSource: DataSource,
    private cacheManager: CacheManager
  ) {
    this.playerPerformanceRepo = new CachedPlayerPerformanceRepository(
      this.dataSource.getRepository(PlayerPerformanceStats),
      this.cacheManager
    );
    
    this.teamAnalyticsRepo = new CachedTeamAnalyticsRepository(
      this.dataSource.getRepository(TeamAnalytics),
      this.cacheManager
    );
    
    this.workloadAnalyticsRepo = new CachedWorkloadAnalyticsRepository(
      this.dataSource.getRepository(WorkloadAnalytics),
      this.cacheManager
    );
  }

  // Dashboard-specific optimized methods
  async getDashboardAnalytics(
    organizationId: string,
    teamId?: string,
    playerId?: string
  ): Promise<any> {
    const cacheKey = `dashboard_analytics:${organizationId}:${teamId || 'all'}:${playerId || 'all'}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const promises = [];

        // Get performance analytics for organization
        promises.push(
          this.playerPerformanceRepo.getPerformanceAnalytics(organizationId, 'week')
        );

        // Get team analytics if teamId provided
        if (teamId) {
          promises.push(
            this.teamAnalyticsRepo.getTeamSeasonStats(teamId),
            this.workloadAnalyticsRepo.getTeamWorkloadSummary(teamId)
          );
        }

        // Get player-specific data if playerId provided
        if (playerId) {
          promises.push(
            this.playerPerformanceRepo.getPlayerStats(playerId),
            this.workloadAnalyticsRepo.getPlayerWorkloadTrends(playerId, 4)
          );
        }

        // Get high-risk players for any dashboard
        promises.push(
          this.workloadAnalyticsRepo.getHighRiskPlayers(organizationId)
        );

        const results = await Promise.all(promises);
        
        return {
          organizationId,
          teamId,
          playerId,
          performanceOverview: results[0],
          teamStats: teamId ? results[1] : null,
          teamWorkload: teamId ? results[2] : null,
          playerStats: playerId ? results[teamId ? 3 : 1] : null,
          playerWorkload: playerId ? results[teamId ? 4 : 2] : null,
          riskAlerts: results[results.length - 1],
          generatedAt: new Date()
        };
      },
      300 // 5 minutes TTL for dashboard data
    );
  }

  async getPlayerDashboardData(playerId: string): Promise<any> {
    const cacheKey = `player_dashboard:${playerId}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const [playerStats, workloadTrends, recentPerformance] = await Promise.all([
          this.playerPerformanceRepo.getPlayerStats(playerId, 
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            new Date()
          ),
          this.workloadAnalyticsRepo.getPlayerWorkloadTrends(playerId, 8),
          this.playerPerformanceRepo.getPlayerPerformanceTrends(playerId, 14)
        ]);

        const latestWorkload = workloadTrends[workloadTrends.length - 1];
        
        return {
          playerId,
          currentWeekStats: playerStats[0] || null,
          performanceTrends: recentPerformance,
          workloadStatus: {
            current: latestWorkload,
            trends: workloadTrends,
            riskLevel: latestWorkload?.riskLevel || 'unknown',
            recommendations: latestWorkload?.recommendations || []
          },
          summaryMetrics: {
            avgGoalsPerGame: playerStats.reduce((sum, s) => sum + s.goals, 0) / Math.max(playerStats.length, 1),
            avgAssistsPerGame: playerStats.reduce((sum, s) => sum + s.assists, 0) / Math.max(playerStats.length, 1),
            avgReadinessScore: playerStats
              .filter(s => s.readinessScore !== null)
              .reduce((sum, s) => sum + (s.readinessScore || 0), 0) / 
              Math.max(playerStats.filter(s => s.readinessScore !== null).length, 1),
            currentPercentileRank: playerStats[0]?.percentileRanking || null
          }
        };
      },
      180 // 3 minutes TTL for individual player dashboard
    );
  }

  async getCoachDashboardData(teamId: string): Promise<any> {
    const cacheKey = `coach_dashboard:${teamId}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const [teamStats, workloadSummary, topPerformers, lineStats] = await Promise.all([
          this.teamAnalyticsRepo.getTeamSeasonStats(teamId),
          this.workloadAnalyticsRepo.getTeamWorkloadSummary(teamId),
          this.playerPerformanceRepo.getTopPerformers(teamId, 'points', 10),
          this.teamAnalyticsRepo.getLinePerformanceStats(teamId, 'week')
        ]);

        const recentStats = teamStats.slice(0, 10); // Last 10 games
        const wins = recentStats.reduce((sum, s) => sum + s.wins, 0);
        const losses = recentStats.reduce((sum, s) => sum + s.losses, 0);
        const ties = recentStats.reduce((sum, s) => sum + s.ties, 0);
        
        return {
          teamId,
          teamPerformance: {
            recentRecord: { wins, losses, ties },
            winPercentage: wins / Math.max(wins + losses + ties, 1),
            avgGoalsFor: recentStats.reduce((sum, s) => sum + s.goalsFor, 0) / Math.max(recentStats.length, 1),
            avgGoalsAgainst: recentStats.reduce((sum, s) => sum + s.goalsAgainst, 0) / Math.max(recentStats.length, 1),
            powerPlayPercentage: recentStats.reduce((sum, s) => sum + (s.powerPlayPercentage || 0), 0) / Math.max(recentStats.length, 1)
          },
          playerInsights: {
            topPerformers,
            workloadRisks: workloadSummary?.playersAtRisk || [],
            teamAverages: workloadSummary?.averages || {}
          },
          tacticalAnalysis: {
            linePerformance: lineStats,
            bestLine: lineStats[0] || null,
            recommendations: workloadSummary?.topRecommendations || []
          }
        };
      },
      300 // 5 minutes TTL for coach dashboard
    );
  }

  async getPhysicalTrainerDashboardData(organizationId: string, teamId?: string): Promise<any> {
    const cacheKey = `trainer_dashboard:${organizationId}:${teamId || 'all'}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const promises = [
          this.workloadAnalyticsRepo.getHighRiskPlayers(organizationId, 60), // Lower threshold for trainer
          this.playerPerformanceRepo.getPerformanceAnalytics(organizationId, 'week')
        ];

        if (teamId) {
          promises.push(
            this.workloadAnalyticsRepo.getWorkloadOptimizationSuggestions(teamId, 4),
            this.workloadAnalyticsRepo.getTeamWorkloadSummary(teamId)
          );
        }

        const results = await Promise.all(promises);
        
        return {
          organizationId,
          teamId,
          riskManagement: {
            highRiskPlayers: results[0],
            riskDistribution: teamId ? results[3]?.riskDistribution : null,
            optimizationSuggestions: teamId ? results[2] : null
          },
          performanceOverview: results[1],
          workloadInsights: teamId ? results[3] : null,
          recommendations: {
            immediate: results[0]?.filter((p: any) => p.riskLevel === 'critical') || [],
            weekly: teamId ? results[2]?.suggestions?.filter((s: any) => s.priority === 'high') || [] : []
          }
        };
      },
      240 // 4 minutes TTL for trainer dashboard
    );
  }

  async getAdminDashboardData(organizationId: string): Promise<any> {
    const cacheKey = `admin_dashboard:${organizationId}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const [orgAnalytics, leagueStandings, riskOverview] = await Promise.all([
          this.playerPerformanceRepo.getPerformanceAnalytics(organizationId, 'month'),
          this.teamAnalyticsRepo.getLeagueStandings(organizationId),
          this.workloadAnalyticsRepo.getHighRiskPlayers(organizationId, 70)
        ]);
        
        return {
          organizationId,
          organizationOverview: orgAnalytics,
          competitiveStandings: leagueStandings,
          riskManagement: {
            totalHighRiskPlayers: riskOverview.length,
            criticalRiskPlayers: riskOverview.filter(p => p.riskLevel === 'critical').length,
            riskTrends: riskOverview.reduce((acc, p) => {
              if (!acc[p.teamId]) acc[p.teamId] = 0;
              acc[p.teamId]++;
              return acc;
            }, {} as any)
          },
          systemHealth: {
            dataQuality: 95, // This would come from actual data quality checks
            lastUpdated: new Date()
          }
        };
      },
      600 // 10 minutes TTL for admin dashboard
    );
  }

  // Utility methods for cache management
  async invalidatePlayerData(playerId: string): Promise<void> {
    await Promise.all([
      this.playerPerformanceRepo.invalidatePlayerCache(playerId),
      this.workloadAnalyticsRepo.invalidatePlayerWorkload(playerId),
      this.cacheManager.delete(`player_dashboard:${playerId}`)
    ]);
  }

  async invalidateTeamData(teamId: string): Promise<void> {
    await Promise.all([
      this.teamAnalyticsRepo.invalidateTeamCache(teamId),
      this.workloadAnalyticsRepo.invalidateTeamWorkload(teamId),
      this.playerPerformanceRepo.invalidateTeamCache(teamId),
      this.cacheManager.delete(`coach_dashboard:${teamId}`)
    ]);
  }

  async invalidateOrganizationData(organizationId: string): Promise<void> {
    await Promise.all([
      this.teamAnalyticsRepo.invalidateOrganizationCache(organizationId),
      this.cacheManager.deletePattern(`dashboard_analytics:${organizationId}:*`),
      this.cacheManager.deletePattern(`trainer_dashboard:${organizationId}:*`),
      this.cacheManager.delete(`admin_dashboard:${organizationId}`)
    ]);
  }
}