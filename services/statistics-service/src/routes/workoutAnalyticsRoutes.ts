import { Router } from 'express';
import { DataSource } from 'typeorm';
import { authMiddleware, logger } from '@hockey-hub/shared-lib';
import { WorkoutAnalytics, AggregationLevel, WorkoutType } from '../entities/WorkoutAnalytics';
import { PerformanceMetrics } from '../entities/PerformanceMetrics';
import { WorkoutSummaryService } from '../services/WorkoutSummaryService';

export function createWorkoutAnalyticsRoutes(
  dataSource: DataSource,
  workoutSummaryService: WorkoutSummaryService
): Router {
  const router = Router();
  const workoutAnalyticsRepo = dataSource.getRepository(WorkoutAnalytics);
  const performanceMetricsRepo = dataSource.getRepository(PerformanceMetrics);

  // Get workout session summary
  router.get('/sessions/:sessionId/summary', authMiddleware, async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Check if summary already exists
      let summary = await workoutAnalyticsRepo.findOne({
        where: {
          workoutId: `workout-${sessionId}`,
          playerId: null, // Team-level summary
          aggregationLevel: AggregationLevel.SESSION,
        },
      });

      if (!summary) {
        // Generate summary if not exists
        logger.info(`📊 Generating on-demand summary for session ${sessionId}`);
        const fullSummary = await workoutSummaryService.generateSessionSummary(sessionId);
        
        // Return the full summary with insights
        return res.json({
          success: true,
          data: fullSummary,
        });
      }

      // Get player-level data for complete summary
      const playerAnalytics = await workoutAnalyticsRepo.find({
        where: {
          workoutId: `workout-${sessionId}`,
          aggregationLevel: AggregationLevel.SESSION,
        },
      });

      res.json({
        success: true,
        data: {
          sessionSummary: summary,
          playerBreakdown: playerAnalytics.filter(a => a.playerId !== null),
          participantCount: playerAnalytics.filter(a => a.playerId !== null).length,
        },
      });
    } catch (error) {
      logger.error('📊 Failed to get session summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve session summary',
      });
    }
  });

  // Get player performance analytics
  router.get('/players/:playerId/analytics', authMiddleware, async (req, res) => {
    try {
      const { playerId } = req.params;
      const { 
        startDate, 
        endDate, 
        workoutType, 
        aggregationLevel = AggregationLevel.SESSION 
      } = req.query as {
        startDate?: string;
        endDate?: string;
        workoutType?: WorkoutType;
        aggregationLevel?: AggregationLevel;
      };

      const whereConditions: any = { playerId };

      if (workoutType) {
        whereConditions.workoutType = workoutType;
      }

      if (aggregationLevel) {
        whereConditions.aggregationLevel = aggregationLevel;
      }

      if (startDate && endDate) {
        whereConditions.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const analytics = await workoutAnalyticsRepo.find({
        where: whereConditions,
        order: { timestamp: 'DESC' },
        take: 100, // Limit to last 100 records
      });

      // Calculate trends
      const trends = this.calculatePlayerTrends(analytics);

      res.json({
        success: true,
        data: {
          analytics,
          trends,
          summary: {
            totalSessions: analytics.length,
            averageCompletion: analytics.length > 0 ? 
              analytics.reduce((sum, a) => sum + (a.completionRate || 0), 0) / analytics.length : 0,
            averageAdherence: analytics.length > 0 ? 
              analytics.reduce((sum, a) => sum + (a.adherenceScore || 0), 0) / analytics.length : 0,
          },
        },
      });
    } catch (error) {
      logger.error('📊 Failed to get player analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve player analytics',
      });
    }
  });

  // Get team performance analytics
  router.get('/teams/:teamId/analytics', authMiddleware, async (req, res) => {
    try {
      const { teamId } = req.params;
      const { 
        startDate, 
        endDate, 
        workoutType,
        aggregationLevel = AggregationLevel.WEEKLY 
      } = req.query as {
        startDate?: string;
        endDate?: string;
        workoutType?: WorkoutType;
        aggregationLevel?: AggregationLevel;
      };

      const whereConditions: any = { 
        teamId,
        playerId: null, // Team-level data only
      };

      if (workoutType) {
        whereConditions.workoutType = workoutType;
      }

      if (aggregationLevel) {
        whereConditions.aggregationLevel = aggregationLevel;
      }

      if (startDate && endDate) {
        whereConditions.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const teamAnalytics = await workoutAnalyticsRepo.find({
        where: whereConditions,
        order: { timestamp: 'DESC' },
        take: 52, // Up to 1 year of weekly data
      });

      // Get recent player-level data for team composition insights
      const recentPlayerData = await workoutAnalyticsRepo.find({
        where: {
          teamId,
          playerId: { $ne: null },
          timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        order: { timestamp: 'DESC' },
      });

      // Calculate team insights
      const insights = this.calculateTeamInsights(teamAnalytics, recentPlayerData);

      res.json({
        success: true,
        data: {
          teamAnalytics,
          insights,
          playerComposition: this.summarizePlayerComposition(recentPlayerData),
        },
      });
    } catch (error) {
      logger.error('📊 Failed to get team analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve team analytics',
      });
    }
  });

  // Get real-time session metrics
  router.get('/sessions/:sessionId/live-metrics', authMiddleware, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { playerId } = req.query;

      const whereConditions: any = { sessionId };
      if (playerId) {
        whereConditions.playerId = playerId;
      }

      // Get metrics from last 10 minutes
      const recentMetrics = await performanceMetricsRepo.find({
        where: {
          ...whereConditions,
          timestamp: {
            $gte: new Date(Date.now() - 10 * 60 * 1000),
          },
        },
        order: { timestamp: 'DESC' },
        take: 200, // Last 200 data points
      });

      // Calculate live statistics
      const liveStats = this.calculateLiveStats(recentMetrics);

      res.json({
        success: true,
        data: {
          metrics: recentMetrics,
          liveStats,
          lastUpdate: recentMetrics.length > 0 ? recentMetrics[0].timestamp : null,
        },
      });
    } catch (error) {
      logger.error('📊 Failed to get live metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve live metrics',
      });
    }
  });

  // Get workout comparison data
  router.post('/compare', authMiddleware, async (req, res) => {
    try {
      const { sessionIds, playerIds, metric = 'completionRate' } = req.body;

      if (!sessionIds && !playerIds) {
        return res.status(400).json({
          success: false,
          error: 'Either sessionIds or playerIds required',
        });
      }

      let analytics: WorkoutAnalytics[] = [];

      if (sessionIds) {
        const workoutIds = sessionIds.map((id: string) => `workout-${id}`);
        analytics = await workoutAnalyticsRepo.find({
          where: {
            workoutId: { $in: workoutIds },
          },
          order: { timestamp: 'ASC' },
        });
      }

      if (playerIds) {
        analytics = await workoutAnalyticsRepo.find({
          where: {
            playerId: { $in: playerIds },
            timestamp: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
          },
          order: { timestamp: 'ASC' },
        });
      }

      const comparisonData = this.generateComparisonData(analytics, metric);

      res.json({
        success: true,
        data: comparisonData,
      });
    } catch (error) {
      logger.error('📊 Failed to generate comparison:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate comparison data',
      });
    }
  });

  // Get performance trends
  router.get('/trends/:entityType/:entityId', authMiddleware, async (req, res) => {
    try {
      const { entityType, entityId } = req.params; // player or team
      const { 
        metric = 'completionRate',
        period = '30d',
        aggregationLevel = AggregationLevel.DAILY 
      } = req.query as {
        metric?: string;
        period?: string;
        aggregationLevel?: AggregationLevel;
      };

      const days = parseInt(period.replace('d', ''));
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const whereConditions: any = {
        timestamp: { $gte: startDate },
        aggregationLevel,
      };

      if (entityType === 'player') {
        whereConditions.playerId = entityId;
      } else if (entityType === 'team') {
        whereConditions.teamId = entityId;
        whereConditions.playerId = null; // Team-level data
      }

      const analytics = await workoutAnalyticsRepo.find({
        where: whereConditions,
        order: { timestamp: 'ASC' },
      });

      const trendData = this.calculateTrendData(analytics, metric);

      res.json({
        success: true,
        data: {
          trends: trendData,
          summary: {
            totalDataPoints: analytics.length,
            trend: trendData.length > 1 ? this.calculateTrendDirection(trendData) : 'stable',
            averageValue: trendData.length > 0 ? 
              trendData.reduce((sum, t) => sum + t.value, 0) / trendData.length : 0,
          },
        },
      });
    } catch (error) {
      logger.error('📊 Failed to get performance trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance trends',
      });
    }
  });

  // Helper methods
  function calculatePlayerTrends(analytics: WorkoutAnalytics[]) {
    if (analytics.length < 2) return null;

    const recent = analytics.slice(0, 5);
    const older = analytics.slice(-5);

    return {
      completionRate: {
        recent: recent.reduce((sum, a) => sum + (a.completionRate || 0), 0) / recent.length,
        previous: older.reduce((sum, a) => sum + (a.completionRate || 0), 0) / older.length,
      },
      adherenceScore: {
        recent: recent.reduce((sum, a) => sum + (a.adherenceScore || 0), 0) / recent.length,
        previous: older.reduce((sum, a) => sum + (a.adherenceScore || 0), 0) / older.length,
      },
      averageHeartRate: {
        recent: recent.reduce((sum, a) => sum + (a.averageHeartRate || 0), 0) / recent.length,
        previous: older.reduce((sum, a) => sum + (a.averageHeartRate || 0), 0) / older.length,
      },
    };
  }

  function calculateTeamInsights(teamAnalytics: WorkoutAnalytics[], playerData: WorkoutAnalytics[]) {
    const insights: any = {
      performanceTrend: 'stable',
      strongestAreas: [],
      improvementAreas: [],
      playerParticipation: {},
    };

    if (teamAnalytics.length >= 2) {
      const recent = teamAnalytics[0];
      const previous = teamAnalytics[1];
      
      if ((recent.completionRate || 0) > (previous.completionRate || 0)) {
        insights.performanceTrend = 'improving';
      } else if ((recent.completionRate || 0) < (previous.completionRate || 0)) {
        insights.performanceTrend = 'declining';
      }
    }

    // Analyze player participation
    const playerParticipation = new Map<string, number>();
    playerData.forEach(p => {
      if (p.playerId) {
        playerParticipation.set(p.playerId, (playerParticipation.get(p.playerId) || 0) + 1);
      }
    });

    insights.playerParticipation = Object.fromEntries(playerParticipation);

    return insights;
  }

  function summarizePlayerComposition(playerData: WorkoutAnalytics[]) {
    const players = new Set(playerData.map(p => p.playerId).filter(Boolean));
    const avgCompletion = playerData.length > 0 ? 
      playerData.reduce((sum, p) => sum + (p.completionRate || 0), 0) / playerData.length : 0;

    return {
      activePlayerCount: players.size,
      averageCompletion,
      totalSessions: playerData.length,
    };
  }

  function calculateLiveStats(metrics: PerformanceMetrics[]) {
    if (metrics.length === 0) {
      return {
        averageHeartRate: 0,
        maxHeartRate: 0,
        averagePower: 0,
        totalCalories: 0,
        activeParticipants: 0,
      };
    }

    const uniqueParticipants = new Set(metrics.map(m => m.playerId)).size;

    return {
      averageHeartRate: Math.round(metrics.reduce((sum, m) => sum + (m.heartRate || 0), 0) / metrics.length),
      maxHeartRate: Math.max(...metrics.map(m => m.heartRate || 0)),
      averagePower: Math.round(metrics.reduce((sum, m) => sum + (m.power || 0), 0) / metrics.length),
      totalCalories: Math.round(metrics.reduce((sum, m) => sum + (m.calories || 0), 0)),
      activeParticipants: uniqueParticipants,
    };
  }

  function generateComparisonData(analytics: WorkoutAnalytics[], metric: string) {
    const grouped = new Map<string, WorkoutAnalytics[]>();

    analytics.forEach(a => {
      const key = a.playerId || a.workoutId || a.teamId || 'unknown';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(a);
    });

    const comparisonData: any[] = [];

    for (const [key, data] of grouped.entries()) {
      const avgValue = data.reduce((sum, item) => {
        const value = (item as any)[metric] || 0;
        return sum + value;
      }, 0) / data.length;

      comparisonData.push({
        id: key,
        label: key,
        value: avgValue,
        dataPoints: data.length,
        trend: data.length > 1 ? calculateTrendDirection(
          data.map(d => ({ timestamp: d.timestamp, value: (d as any)[metric] || 0 }))
        ) : 'stable',
      });
    }

    return comparisonData.sort((a, b) => b.value - a.value);
  }

  function calculateTrendData(analytics: WorkoutAnalytics[], metric: string) {
    return analytics.map(a => ({
      timestamp: a.timestamp,
      value: (a as any)[metric] || 0,
    }));
  }

  function calculateTrendDirection(data: { timestamp: Date; value: number }[]): 'improving' | 'declining' | 'stable' {
    if (data.length < 2) return 'stable';

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    const threshold = firstAvg * 0.05; // 5% threshold

    if (difference > threshold) return 'improving';
    if (difference < -threshold) return 'declining';
    return 'stable';
  }

  return router;
}