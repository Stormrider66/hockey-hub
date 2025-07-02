import { Repository } from 'typeorm';
import { CachedRepository, CacheManager } from '@hockey-hub/shared-lib';
import { WorkloadAnalytics } from '../entities/WorkloadAnalytics';

export class CachedWorkloadAnalyticsRepository extends CachedRepository<WorkloadAnalytics> {
  constructor(
    repository: Repository<WorkloadAnalytics>,
    cacheManager: CacheManager
  ) {
    super(repository, cacheManager, 'workload_analytics');
  }

  async getPlayerWorkloadTrends(
    playerId: string, 
    weeks: number = 8
  ): Promise<WorkloadAnalytics[]> {
    const cacheKey = `player_workload:${playerId}:${weeks}w`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (weeks * 7));

        return this.repository
          .createQueryBuilder('workload')
          .where('workload.playerId = :playerId', { playerId })
          .andWhere('workload.weekStartDate >= :startDate', { startDate })
          .andWhere('workload.periodType = :periodType', { periodType: 'week' })
          .orderBy('workload.weekStartDate', 'ASC')
          .getMany();
      },
      600 // 10 minutes TTL - workload changes frequently
    );
  }

  async getTeamWorkloadSummary(
    teamId: string, 
    weekStartDate?: Date
  ): Promise<any> {
    const targetDate = weekStartDate || new Date();
    const cacheKey = `team_workload:${teamId}:${targetDate.toISOString().split('T')[0]}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const workloads = await this.repository.find({
          where: {
            teamId,
            weekStartDate: targetDate,
            periodType: 'week'
          }
        });

        if (workloads.length === 0) {
          return null;
        }

        const totalPlayers = workloads.length;
        const riskAnalysis = {
          low: workloads.filter(w => w.riskLevel === 'low').length,
          moderate: workloads.filter(w => w.riskLevel === 'moderate').length,
          high: workloads.filter(w => w.riskLevel === 'high').length,
          critical: workloads.filter(w => w.riskLevel === 'critical').length
        };

        const averages = {
          totalWorkload: workloads.reduce((sum, w) => sum + w.totalWorkload, 0) / totalPlayers,
          acuteChronicRatio: workloads
            .filter(w => w.acuteChronicRatio !== null)
            .reduce((sum, w) => sum + (w.acuteChronicRatio || 0), 0) / 
            workloads.filter(w => w.acuteChronicRatio !== null).length,
          recoveryScore: workloads
            .filter(w => w.recoveryScore !== null)
            .reduce((sum, w) => sum + (w.recoveryScore || 0), 0) / 
            workloads.filter(w => w.recoveryScore !== null).length
        };

        const recommendations = workloads
          .filter(w => w.recommendations && w.recommendations.length > 0)
          .reduce((acc, w) => {
            if (w.recommendations) {
              w.recommendations.forEach(rec => {
                const key = `${rec.type}_${rec.category}`;
                if (!acc[key]) {
                  acc[key] = { ...rec, count: 0, players: [] };
                }
                acc[key].count++;
                acc[key].players.push(w.playerId);
              });
            }
            return acc;
          }, {} as any);

        return {
          teamId,
          weekStartDate: targetDate,
          totalPlayers,
          riskDistribution: riskAnalysis,
          averages,
          topRecommendations: Object.values(recommendations)
            .sort((a: any, b: any) => b.count - a.count)
            .slice(0, 5),
          playersAtRisk: workloads
            .filter(w => w.riskLevel === 'high' || w.riskLevel === 'critical')
            .map(w => ({
              playerId: w.playerId,
              riskLevel: w.riskLevel,
              riskScore: w.injuryRiskScore,
              acwr: w.acuteChronicRatio,
              recommendations: w.recommendations
            }))
        };
      },
      900 // 15 minutes TTL
    );
  }

  async getHighRiskPlayers(
    organizationId: string, 
    riskThreshold: number = 70
  ): Promise<any[]> {
    const cacheKey = `high_risk_players:${organizationId}:${riskThreshold}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const currentWeek = new Date();
        // Get Monday of current week
        currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1);

        const highRiskWorkloads = await this.repository
          .createQueryBuilder('workload')
          .where('workload.organizationId = :organizationId', { organizationId })
          .andWhere('workload.weekStartDate = :weekStartDate', { weekStartDate: currentWeek })
          .andWhere('workload.injuryRiskScore >= :riskThreshold', { riskThreshold })
          .orderBy('workload.injuryRiskScore', 'DESC')
          .getMany();

        return highRiskWorkloads.map(workload => ({
          playerId: workload.playerId,
          teamId: workload.teamId,
          riskScore: workload.injuryRiskScore,
          riskLevel: workload.riskLevel,
          acuteChronicRatio: workload.acuteChronicRatio,
          fatigueIndex: workload.fatigueIndex,
          recommendedAction: workload.recommendedAction,
          recommendations: workload.recommendations?.filter(r => r.priority === 'high' || r.priority === 'urgent')
        }));
      },
      300 // 5 minutes TTL - high priority data
    );
  }

  async getWorkloadComparison(
    playerIds: string[], 
    metric: 'totalWorkload' | 'acuteChronicRatio' | 'recoveryScore' = 'totalWorkload'
  ): Promise<any> {
    const cacheKey = `workload_comparison:${playerIds.sort().join(',')}:${metric}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const currentWeek = new Date();
        currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1);

        const workloads = await this.repository.find({
          where: {
            playerId: playerIds[0], // TypeORM limitation, we'll filter manually
            weekStartDate: currentWeek,
            periodType: 'week'
          }
        });

        // Filter for all requested players
        const playerWorkloads = await this.repository
          .createQueryBuilder('workload')
          .where('workload.playerId IN (:...playerIds)', { playerIds })
          .andWhere('workload.weekStartDate = :weekStartDate', { weekStartDate: currentWeek })
          .andWhere('workload.periodType = :periodType', { periodType: 'week' })
          .getMany();

        const comparison = playerIds.map(playerId => {
          const playerWorkload = playerWorkloads.find(w => w.playerId === playerId);
          
          if (!playerWorkload) {
            return {
              playerId,
              [metric]: null,
              percentileRank: null,
              status: 'no_data'
            };
          }

          return {
            playerId,
            [metric]: playerWorkload[metric],
            percentileRank: playerWorkload.teamPercentileRank,
            riskLevel: playerWorkload.riskLevel,
            recommendedAction: playerWorkload.recommendedAction
          };
        });

        // Calculate team averages and rankings
        const validValues = comparison
          .filter(c => c[metric] !== null)
          .map(c => c[metric]);
        
        const average = validValues.length > 0 ? 
          validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;
        
        const sorted = [...comparison]
          .filter(c => c[metric] !== null)
          .sort((a, b) => b[metric] - a[metric]);

        return {
          metric,
          weekStartDate: currentWeek,
          players: comparison,
          teamAverage: average,
          rankings: sorted,
          insights: {
            highest: sorted[0],
            lowest: sorted[sorted.length - 1],
            aboveAverage: comparison.filter(c => c[metric] > average).length,
            belowAverage: comparison.filter(c => c[metric] < average).length
          }
        };
      },
      600 // 10 minutes TTL
    );
  }

  async getWorkloadOptimizationSuggestions(
    teamId: string, 
    weeks: number = 4
  ): Promise<any> {
    const cacheKey = `workload_optimization:${teamId}:${weeks}w`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (weeks * 7));

        const workloads = await this.repository
          .createQueryBuilder('workload')
          .where('workload.teamId = :teamId', { teamId })
          .andWhere('workload.weekStartDate >= :startDate', { startDate })
          .andWhere('workload.periodType = :periodType', { periodType: 'week' })
          .getMany();

        if (workloads.length === 0) {
          return null;
        }

        // Analyze patterns and generate suggestions
        const riskTrends = workloads.reduce((acc, w) => {
          const week = w.weekStartDate.toISOString().split('T')[0];
          if (!acc[week]) acc[week] = { high: 0, critical: 0, total: 0 };
          if (w.riskLevel === 'high') acc[week].high++;
          if (w.riskLevel === 'critical') acc[week].critical++;
          acc[week].total++;
          return acc;
        }, {} as any);

        const avgACWR = workloads
          .filter(w => w.acuteChronicRatio !== null)
          .reduce((sum, w) => sum + (w.acuteChronicRatio || 0), 0) / 
          workloads.filter(w => w.acuteChronicRatio !== null).length;

        const suggestions = [];

        // ACWR analysis
        if (avgACWR > 1.5) {
          suggestions.push({
            type: 'reduce_load',
            priority: 'high',
            category: 'acute_chronic_ratio',
            description: 'Team average ACWR is elevated, consider reducing training load',
            targetReduction: Math.round((avgACWR - 1.3) * 100),
            affectedPlayers: workloads.filter(w => (w.acuteChronicRatio || 0) > 1.5).length
          });
        }

        // Risk analysis
        const currentHighRisk = workloads
          .filter(w => w.weekStartDate.getTime() === Math.max(...workloads.map(x => x.weekStartDate.getTime())))
          .filter(w => w.riskLevel === 'high' || w.riskLevel === 'critical').length;
        
        if (currentHighRisk > workloads.length * 0.2) {
          suggestions.push({
            type: 'increase_recovery',
            priority: 'urgent',
            category: 'risk_management',
            description: 'High percentage of players at elevated injury risk',
            affectedPlayers: currentHighRisk,
            recommendedRecoveryIncrease: 20
          });
        }

        return {
          teamId,
          analysisWeeks: weeks,
          currentRiskDistribution: {
            low: workloads.filter(w => w.riskLevel === 'low').length,
            moderate: workloads.filter(w => w.riskLevel === 'moderate').length,
            high: workloads.filter(w => w.riskLevel === 'high').length,
            critical: workloads.filter(w => w.riskLevel === 'critical').length
          },
          avgACWR,
          riskTrends,
          suggestions: suggestions.sort((a, b) => {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          })
        };
      },
      1800 // 30 minutes TTL for optimization analysis
    );
  }

  async invalidatePlayerWorkload(playerId: string): Promise<void> {
    const patterns = [
      `player_workload:${playerId}:*`,
      `workload_comparison:*${playerId}*`
    ];
    
    await this.cacheManager.deletePattern(patterns);
  }

  async invalidateTeamWorkload(teamId: string): Promise<void> {
    const patterns = [
      `team_workload:${teamId}:*`,
      `workload_optimization:${teamId}:*`
    ];
    
    await this.cacheManager.deletePattern(patterns);
  }
}