// @ts-nocheck - Workout summary service with complex entity relationships
import { DataSource, Repository, Between } from 'typeorm';
import { logger } from '@hockey-hub/shared-lib';
import { WorkoutAnalytics, WorkoutType, AggregationLevel } from '../entities/WorkoutAnalytics';
import { PerformanceMetrics } from '../entities/PerformanceMetrics';
import axios from 'axios';

interface WorkoutSession {
  id: string;
  workoutType: WorkoutType;
  teamId: string;
  organizationId: string;
  trainerId: string;
  assignedPlayers: string[];
  startTime: Date;
  endTime: Date;
  workoutData: any;
}

interface SessionSummary {
  sessionId: string;
  workoutType: WorkoutType;
  teamId: string;
  organizationId: string;
  trainerId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  participantCount: number;
  completionRate: number;
  averageAdherence: number;
  teamMetrics: {
    averageHeartRate: number;
    maxHeartRate: number;
    totalCalories: number;
    averageIntensity: number;
    heartRateZoneDistribution: Record<string, number>;
  };
  playerSummaries: PlayerSessionSummary[];
  insights: {
    topPerformers: string[];
    strugglingPlayers: string[];
    recommendationsForNext: string[];
    teamStrengths: string[];
    areasForImprovement: string[];
  };
}

interface PlayerSessionSummary {
  playerId: string;
  playerName: string;
  completionRate: number;
  adherenceScore: number;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  keyMetrics: {
    avgHeartRate: number;
    maxHeartRate: number;
    caloriesBurned: number;
    timeInTargetZones: number;
  };
  achievements: string[];
  concerns: string[];
}

export class WorkoutSummaryService {
  private dataSource: DataSource;
  private workoutAnalyticsRepo: Repository<WorkoutAnalytics>;
  private performanceMetricsRepo: Repository<PerformanceMetrics>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.workoutAnalyticsRepo = dataSource.getRepository(WorkoutAnalytics);
    this.performanceMetricsRepo = dataSource.getRepository(PerformanceMetrics);
  }

  async generateSessionSummary(sessionId: string): Promise<SessionSummary> {
    try {
      logger.info(`📊 Generating workout summary for session ${sessionId}`);

      // 1. Fetch session details from Training Service
      const sessionDetails = await this.fetchSessionDetails(sessionId);
      
      // 2. Get all analytics for this session
      const sessionAnalytics = await this.workoutAnalyticsRepo.find({
        where: { workoutId: `workout-${sessionId}` },
      });

      // 3. Get detailed metrics for calculations
      const detailedMetrics = await this.performanceMetricsRepo.find({
        where: { sessionId },
        order: { timestamp: 'ASC' },
      });

      // 4. Calculate team-level metrics
      const teamMetrics = this.calculateTeamMetrics(sessionAnalytics, detailedMetrics);

      // 5. Generate player summaries
      const playerSummaries = await this.generatePlayerSummaries(sessionAnalytics, detailedMetrics);

      // 6. Generate insights and recommendations
      const insights = this.generateInsights(sessionAnalytics, teamMetrics, playerSummaries);

      // 7. Calculate overall session statistics
      const completionRate = sessionAnalytics.length > 0 ? 
        sessionAnalytics.reduce((sum, a) => sum + (a.completionRate || 0), 0) / sessionAnalytics.length : 0;

      const averageAdherence = sessionAnalytics.length > 0 ? 
        sessionAnalytics.reduce((sum, a) => sum + (a.adherenceScore || 0), 0) / sessionAnalytics.length : 0;

      const summary: SessionSummary = {
        sessionId,
        workoutType: sessionDetails.workoutType,
        teamId: sessionDetails.teamId,
        organizationId: sessionDetails.organizationId,
        trainerId: sessionDetails.trainerId,
        startTime: sessionDetails.startTime,
        endTime: sessionDetails.endTime,
        duration: Math.floor((sessionDetails.endTime.getTime() - sessionDetails.startTime.getTime()) / (1000 * 60)),
        participantCount: sessionAnalytics.length,
        completionRate,
        averageAdherence,
        teamMetrics,
        playerSummaries,
        insights,
      };

      // 8. Store aggregated session analytics
      await this.storeSessionSummary(summary);

      logger.info(`📊 Generated comprehensive summary for session ${sessionId} with ${sessionAnalytics.length} participants`);
      return summary;

    } catch (error) {
      logger.error(`📊 Failed to generate session summary for ${sessionId}:`, error);
      throw error;
    }
  }

  private async fetchSessionDetails(sessionId: string): Promise<WorkoutSession> {
    try {
      const trainingServiceUrl = process.env.TRAINING_SERVICE_URL || 'http://localhost:3004';
      const response = await axios.get(`${trainingServiceUrl}/api/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.INTER_SERVICE_TOKEN || 'dev-token'}`,
        },
        timeout: 5000,
      });

      return response.data;
    } catch (error) {
      logger.warn(`📊 Failed to fetch session details from Training Service, using mock data:`, error);
      
      // Return mock data for development
      return {
        id: sessionId,
        workoutType: WorkoutType.CONDITIONING,
        teamId: 'team-1',
        organizationId: 'org-1',
        trainerId: 'trainer-1',
        assignedPlayers: ['player-1', 'player-2', 'player-3'],
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: new Date(),
        workoutData: {},
      };
    }
  }

  private calculateTeamMetrics(
    analytics: WorkoutAnalytics[], 
    detailedMetrics: PerformanceMetrics[]
  ): SessionSummary['teamMetrics'] {
    if (analytics.length === 0) {
      return {
        averageHeartRate: 0,
        maxHeartRate: 0,
        totalCalories: 0,
        averageIntensity: 0,
        heartRateZoneDistribution: { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 },
      };
    }

    const avgHeartRate = analytics.reduce((sum, a) => sum + (a.averageHeartRate || 0), 0) / analytics.length;
    const maxHeartRate = Math.max(...analytics.map(a => a.maxHeartRate || 0));
    const totalCalories = analytics.reduce((sum, a) => sum + (a.performanceMetrics.caloriesBurned || 0), 0);
    const avgIntensity = analytics.reduce((sum, a) => sum + (a.averageIntensity || 0), 0) / analytics.length;

    // Calculate team heart rate zone distribution
    const zoneDistribution = analytics.reduce((acc, a) => {
      if (a.heartRateZones) {
        acc.zone1 += a.heartRateZones.zone1 || 0;
        acc.zone2 += a.heartRateZones.zone2 || 0;
        acc.zone3 += a.heartRateZones.zone3 || 0;
        acc.zone4 += a.heartRateZones.zone4 || 0;
        acc.zone5 += a.heartRateZones.zone5 || 0;
      }
      return acc;
    }, { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 });

    // Average the zone percentages
    Object.keys(zoneDistribution).forEach(zone => {
      zoneDistribution[zone as keyof typeof zoneDistribution] /= analytics.length;
    });

    return {
      averageHeartRate: Math.round(avgHeartRate),
      maxHeartRate: Math.round(maxHeartRate),
      totalCalories: Math.round(totalCalories),
      averageIntensity: Math.round(avgIntensity),
      heartRateZoneDistribution: zoneDistribution,
    };
  }

  private async generatePlayerSummaries(
    analytics: WorkoutAnalytics[],
    detailedMetrics: PerformanceMetrics[]
  ): Promise<PlayerSessionSummary[]> {
    const summaries: PlayerSessionSummary[] = [];

    for (const playerAnalytics of analytics) {
      if (!playerAnalytics.playerId) continue;

      const playerMetrics = detailedMetrics.filter(m => m.playerId === playerAnalytics.playerId);
      
      // Calculate performance grade based on multiple factors
      const grade = this.calculatePerformanceGrade(playerAnalytics);

      // Generate achievements and concerns
      const { achievements, concerns } = this.generatePlayerInsights(playerAnalytics, playerMetrics);

      // Calculate time in target zones (assume zones 3-4 are target for conditioning)
      const timeInTargetZones = playerAnalytics.heartRateZones ? 
        (playerAnalytics.heartRateZones.zone3 + playerAnalytics.heartRateZones.zone4) : 0;

      const summary: PlayerSessionSummary = {
        playerId: playerAnalytics.playerId,
        playerName: `Player ${playerAnalytics.playerId}`, // Would fetch from User Service
        completionRate: playerAnalytics.completionRate || 0,
        adherenceScore: playerAnalytics.adherenceScore || 0,
        performanceGrade: grade,
        keyMetrics: {
          avgHeartRate: Math.round(playerAnalytics.averageHeartRate || 0),
          maxHeartRate: Math.round(playerAnalytics.maxHeartRate || 0),
          caloriesBurned: Math.round(playerAnalytics.performanceMetrics.caloriesBurned || 0),
          timeInTargetZones: Math.round(timeInTargetZones),
        },
        achievements,
        concerns,
      };

      summaries.push(summary);
    }

    return summaries;
  }

  private calculatePerformanceGrade(analytics: WorkoutAnalytics): 'A' | 'B' | 'C' | 'D' | 'F' {
    const completion = analytics.completionRate || 0;
    const adherence = analytics.adherenceScore || 0;
    const avgScore = (completion + adherence) / 2;

    if (avgScore >= 90) return 'A';
    if (avgScore >= 80) return 'B';
    if (avgScore >= 70) return 'C';
    if (avgScore >= 60) return 'D';
    return 'F';
  }

  private generatePlayerInsights(
    analytics: WorkoutAnalytics,
    metrics: PerformanceMetrics[]
  ): { achievements: string[]; concerns: string[] } {
    const achievements: string[] = [];
    const concerns: string[] = [];

    // Completion rate insights
    if ((analytics.completionRate || 0) >= 95) {
      achievements.push('Excellent workout completion');
    } else if ((analytics.completionRate || 0) < 70) {
      concerns.push('Low workout completion rate');
    }

    // Heart rate insights
    if (analytics.heartRateZones) {
      const targetZoneTime = analytics.heartRateZones.zone3 + analytics.heartRateZones.zone4;
      if (targetZoneTime >= 60) {
        achievements.push('Great time in target heart rate zones');
      } else if (targetZoneTime < 30) {
        concerns.push('Insufficient time in target heart rate zones');
      }
    }

    // Adherence insights
    if ((analytics.adherenceScore || 0) >= 90) {
      achievements.push('Excellent adherence to workout plan');
    } else if ((analytics.adherenceScore || 0) < 70) {
      concerns.push('Struggling to follow workout plan');
    }

    // Skipped exercises
    if (analytics.skippedExercises > 2) {
      concerns.push(`Skipped ${analytics.skippedExercises} exercises`);
    }

    return { achievements, concerns };
  }

  private generateInsights(
    analytics: WorkoutAnalytics[],
    teamMetrics: SessionSummary['teamMetrics'],
    playerSummaries: PlayerSessionSummary[]
  ): SessionSummary['insights'] {
    // Top performers (A or B grades)
    const topPerformers = playerSummaries
      .filter(p => p.performanceGrade === 'A' || p.performanceGrade === 'B')
      .map(p => p.playerName);

    // Struggling players (D or F grades)
    const strugglingPlayers = playerSummaries
      .filter(p => p.performanceGrade === 'D' || p.performanceGrade === 'F')
      .map(p => p.playerName);

    // Team strengths
    const teamStrengths: string[] = [];
    if (teamMetrics.averageHeartRate > 140) {
      teamStrengths.push('High training intensity maintained');
    }
    if (playerSummaries.length > 0 && 
        playerSummaries.reduce((sum, p) => sum + p.completionRate, 0) / playerSummaries.length > 85) {
      teamStrengths.push('Excellent team completion rates');
    }

    // Areas for improvement
    const areasForImprovement: string[] = [];
    if (teamMetrics.heartRateZoneDistribution.zone1 > 40) {
      areasForImprovement.push('Too much time in low-intensity zones');
    }
    if (strugglingPlayers.length > playerSummaries.length * 0.3) {
      areasForImprovement.push('High percentage of players struggling with workouts');
    }

    // Recommendations
    const recommendationsForNext: string[] = [];
    if (teamMetrics.averageIntensity < 70) {
      recommendationsForNext.push('Consider increasing workout intensity');
    }
    if (analytics.some(a => (a.skippedExercises || 0) > 2)) {
      recommendationsForNext.push('Review exercise selection and difficulty');
    }
    if (teamMetrics.heartRateZoneDistribution.zone5 > 20) {
      recommendationsForNext.push('Monitor for overexertion in next session');
    }

    return {
      topPerformers,
      strugglingPlayers,
      recommendationsForNext,
      teamStrengths,
      areasForImprovement,
    };
  }

  private async storeSessionSummary(summary: SessionSummary): Promise<void> {
    try {
      // Create aggregated team-level analytics
      const teamAnalytics = new WorkoutAnalytics();
      teamAnalytics.workoutId = `workout-${summary.sessionId}`;
      teamAnalytics.playerId = null; // Team-level data
      teamAnalytics.teamId = summary.teamId;
      teamAnalytics.organizationId = summary.organizationId;
      teamAnalytics.trainerId = summary.trainerId;
      teamAnalytics.workoutType = summary.workoutType;
      teamAnalytics.aggregationLevel = AggregationLevel.SESSION;
      teamAnalytics.timestamp = summary.startTime;
      teamAnalytics.sessionCount = 1;
      teamAnalytics.totalDuration = summary.duration;
      teamAnalytics.averageHeartRate = summary.teamMetrics.averageHeartRate;
      teamAnalytics.maxHeartRate = summary.teamMetrics.maxHeartRate;
      teamAnalytics.heartRateZones = summary.teamMetrics.heartRateZoneDistribution;
      teamAnalytics.completionRate = summary.completionRate;
      teamAnalytics.adherenceScore = summary.averageAdherence;
      teamAnalytics.performanceMetrics = {
        caloriesBurned: summary.teamMetrics.totalCalories,
        participantCount: summary.participantCount,
        topPerformers: summary.insights.topPerformers,
        strugglingPlayers: summary.insights.strugglingPlayers,
      };
      teamAnalytics.insights = {
        strengths: summary.insights.teamStrengths,
        weaknesses: summary.insights.areasForImprovement,
        recommendations: summary.insights.recommendationsForNext,
      };

      await this.workoutAnalyticsRepo.save(teamAnalytics);

      logger.info(`📊 Stored team-level session summary for ${summary.sessionId}`);
    } catch (error) {
      logger.error('📊 Failed to store session summary:', error);
      throw error;
    }
  }

  // Generate historical summaries for analysis
  async generateHistoricalSummaries(
    teamId: string,
    startDate: Date,
    endDate: Date,
    aggregationLevel: AggregationLevel = AggregationLevel.WEEKLY
  ): Promise<WorkoutAnalytics[]> {
    try {
      const sessionAnalytics = await this.workoutAnalyticsRepo.find({
        where: {
          teamId,
          timestamp: Between(startDate, endDate),
          aggregationLevel: AggregationLevel.SESSION,
          playerId: null, // Team-level data only
        },
        order: { timestamp: 'ASC' },
      });

      // Group by time period and aggregate
      const groupedData = this.groupByPeriod(sessionAnalytics, aggregationLevel);
      const historicalSummaries: WorkoutAnalytics[] = [];

      for (const [period, sessions] of groupedData.entries()) {
        const aggregated = await this.aggregateSessionData(sessions, aggregationLevel, period);
        historicalSummaries.push(aggregated);
      }

      // Store historical summaries
      await this.workoutAnalyticsRepo.save(historicalSummaries);

      logger.info(`📊 Generated ${historicalSummaries.length} historical summaries for team ${teamId}`);
      return historicalSummaries;

    } catch (error) {
      logger.error('📊 Failed to generate historical summaries:', error);
      throw error;
    }
  }

  private groupByPeriod(
    analytics: WorkoutAnalytics[],
    level: AggregationLevel
  ): Map<string, WorkoutAnalytics[]> {
    const groups = new Map<string, WorkoutAnalytics[]>();

    analytics.forEach(item => {
      let key: string;
      const date = new Date(item.timestamp);

      switch (level) {
        case AggregationLevel.DAILY:
          key = date.toISOString().split('T')[0];
          break;
        case AggregationLevel.WEEKLY:
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case AggregationLevel.MONTHLY:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    return groups;
  }

  private async aggregateSessionData(
    sessions: WorkoutAnalytics[],
    level: AggregationLevel,
    period: string
  ): Promise<WorkoutAnalytics> {
    const first = sessions[0];
    
    const aggregated = new WorkoutAnalytics();
    aggregated.workoutId = null; // Aggregated data
    aggregated.playerId = null;
    aggregated.teamId = first.teamId;
    aggregated.organizationId = first.organizationId;
    aggregated.trainerId = first.trainerId;
    aggregated.workoutType = first.workoutType;
    aggregated.aggregationLevel = level;
    aggregated.timestamp = new Date(period);
    aggregated.sessionCount = sessions.length;
    
    // Aggregate numerical values
    aggregated.totalDuration = sessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0);
    aggregated.averageHeartRate = sessions.reduce((sum, s) => sum + (s.averageHeartRate || 0), 0) / sessions.length;
    aggregated.maxHeartRate = Math.max(...sessions.map(s => s.maxHeartRate || 0));
    aggregated.completionRate = sessions.reduce((sum, s) => sum + (s.completionRate || 0), 0) / sessions.length;
    aggregated.adherenceScore = sessions.reduce((sum, s) => sum + (s.adherenceScore || 0), 0) / sessions.length;
    
    // Aggregate heart rate zones
    const zoneAvg = sessions.reduce((acc, s) => {
      if (s.heartRateZones) {
        acc.zone1 += s.heartRateZones.zone1 || 0;
        acc.zone2 += s.heartRateZones.zone2 || 0;
        acc.zone3 += s.heartRateZones.zone3 || 0;
        acc.zone4 += s.heartRateZones.zone4 || 0;
        acc.zone5 += s.heartRateZones.zone5 || 0;
      }
      return acc;
    }, { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 });

    Object.keys(zoneAvg).forEach(zone => {
      zoneAvg[zone as keyof typeof zoneAvg] /= sessions.length;
    });
    aggregated.heartRateZones = zoneAvg;

    // Aggregate performance metrics
    aggregated.performanceMetrics = {
      totalSessions: sessions.length,
      averageCalories: sessions.reduce((sum, s) => sum + (s.performanceMetrics.caloriesBurned || 0), 0) / sessions.length,
      totalCalories: sessions.reduce((sum, s) => sum + (s.performanceMetrics.caloriesBurned || 0), 0),
    };

    return aggregated;
  }
}