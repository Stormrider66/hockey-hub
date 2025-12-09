import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  PlayerPerformanceStats, 
  TeamAnalytics, 
  TrainingStatistics, 
  WorkloadAnalytics,
  WorkoutAnalytics,
  PerformanceMetrics 
} from '../entities';
import { ReportFilters } from '../entities/ReportTemplate';

export interface DataSourceConfig {
  name: string;
  description: string;
  fields: DataField[];
  filters: FilterConfig[];
  aggregations: string[];
}

export interface DataField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  label: string;
  description?: string;
}

export interface FilterConfig {
  field: string;
  type: 'date_range' | 'select' | 'multi_select' | 'text' | 'number_range';
  options?: string[];
  required?: boolean;
}

@Injectable()
export class ReportDataAggregatorService {
  private dataSources = new Map<string, DataSourceConfig>();

  constructor(
    @InjectRepository(PlayerPerformanceStats)
    private playerPerformanceRepository: Repository<PlayerPerformanceStats>,
    @InjectRepository(TeamAnalytics)
    private teamAnalyticsRepository: Repository<TeamAnalytics>,
    @InjectRepository(TrainingStatistics)
    private trainingStatisticsRepository: Repository<TrainingStatistics>,
    @InjectRepository(WorkloadAnalytics)
    private workloadAnalyticsRepository: Repository<WorkloadAnalytics>,
    @InjectRepository(WorkoutAnalytics)
    private workoutAnalyticsRepository: Repository<WorkoutAnalytics>,
    @InjectRepository(PerformanceMetrics)
    private performanceMetricsRepository: Repository<PerformanceMetrics>
  ) {
    this.initializeDataSources();
  }

  async fetchData(dataSource: string, filters: ReportFilters): Promise<any> {
    const sourceConfig = this.dataSources.get(dataSource);
    if (!sourceConfig) {
      throw new Error(`Data source '${dataSource}' not found`);
    }

    switch (dataSource) {
      case 'player_performance_stats':
        return await this.fetchPlayerPerformanceStats(filters);
      case 'team_analytics':
        return await this.fetchTeamAnalytics(filters);
      case 'training_statistics':
        return await this.fetchTrainingStatistics(filters);
      case 'workload_analytics':
        return await this.fetchWorkloadAnalytics(filters);
      case 'workout_analytics':
        return await this.fetchWorkoutAnalytics(filters);
      case 'performance_metrics':
        return await this.fetchPerformanceMetrics(filters);
      case 'team_performance_metrics':
        return await this.fetchTeamPerformanceMetrics(filters);
      case 'team_performance_trend':
        return await this.fetchTeamPerformanceTrend(filters);
      case 'player_progress_summary':
        return await this.fetchPlayerProgressSummary(filters);
      case 'workout_effectiveness':
        return await this.fetchWorkoutEffectiveness(filters);
      case 'attendance_statistics':
        return await this.fetchAttendanceStatistics(filters);
      case 'injury_report_data':
        return await this.fetchInjuryReportData(filters);
      case 'executive_summary_data':
        return await this.fetchExecutiveSummaryData(filters);
      default:
        return await this.fetchCustomData(dataSource, filters);
    }
  }

  private async fetchPlayerPerformanceStats(filters: ReportFilters): Promise<any[]> {
    const query = this.playerPerformanceRepository.createQueryBuilder('stats');

    this.applyCommonFilters(query, filters, 'stats');

    if (filters.players && filters.players.length > 0) {
      query.andWhere('stats.playerId IN (:...players)', { players: filters.players });
    }

    const results = await query.getMany();
    
    return results.map(stat => ({
      playerId: stat.playerId,
      playerName: stat.playerName || 'Unknown Player',
      performanceScore: stat.performanceScore,
      skillLevel: stat.skillLevel,
      endurance: stat.endurance,
      strength: stat.strength,
      speed: stat.speed,
      accuracy: stat.accuracy,
      teamwork: stat.teamwork,
      gamesPlayed: stat.gamesPlayed,
      goals: stat.goals,
      assists: stat.assists,
      date: stat.createdAt
    }));
  }

  private async fetchTeamAnalytics(filters: ReportFilters): Promise<any[]> {
    const query = this.teamAnalyticsRepository.createQueryBuilder('analytics');

    this.applyCommonFilters(query, filters, 'analytics');

    if (filters.teams && filters.teams.length > 0) {
      query.andWhere('analytics.teamId IN (:...teams)', { teams: filters.teams });
    }

    const results = await query.getMany();
    
    return results.map(analytics => ({
      teamId: analytics.teamId,
      teamName: analytics.teamName || 'Unknown Team',
      averagePerformance: analytics.averagePerformance,
      totalGames: analytics.totalGames,
      wins: analytics.wins,
      losses: analytics.losses,
      winRate: analytics.totalGames > 0 ? (analytics.wins / analytics.totalGames) * 100 : 0,
      averageGoals: analytics.averageGoals,
      averageAssists: analytics.averageAssists,
      teamworkScore: analytics.teamworkScore,
      date: analytics.createdAt
    }));
  }

  private async fetchTrainingStatistics(filters: ReportFilters): Promise<any[]> {
    const query = this.trainingStatisticsRepository.createQueryBuilder('training');

    this.applyCommonFilters(query, filters, 'training');

    if (filters.workoutTypes && filters.workoutTypes.length > 0) {
      query.andWhere('training.workoutType IN (:...workoutTypes)', { workoutTypes: filters.workoutTypes });
    }

    const results = await query.getMany();
    
    return results.map(training => ({
      sessionId: training.sessionId,
      workoutType: training.workoutType,
      duration: training.duration,
      averageIntensity: training.averageIntensity,
      participants: training.participants,
      completionRate: training.completionRate,
      averageRating: training.averageRating,
      caloriesBurned: training.caloriesBurned,
      date: training.createdAt
    }));
  }

  private async fetchWorkloadAnalytics(filters: ReportFilters): Promise<any[]> {
    const query = this.workloadAnalyticsRepository.createQueryBuilder('workload');

    this.applyCommonFilters(query, filters, 'workload');

    if (filters.players && filters.players.length > 0) {
      query.andWhere('workload.playerId IN (:...players)', { players: filters.players });
    }

    const results = await query.getMany();
    
    return results.map(workload => ({
      playerId: workload.playerId,
      playerName: workload.playerName || 'Unknown Player',
      totalLoad: workload.totalLoad,
      weeklyLoad: workload.weeklyLoad,
      monthlyLoad: workload.monthlyLoad,
      injuryRisk: workload.injuryRisk,
      recoveryTime: workload.recoveryTime,
      readinessScore: workload.readinessScore,
      date: workload.createdAt
    }));
  }

  private async fetchWorkoutAnalytics(filters: ReportFilters): Promise<any[]> {
    const query = this.workoutAnalyticsRepository.createQueryBuilder('workout');

    this.applyCommonFilters(query, filters, 'workout');

    const results = await query.getMany();
    
    return results.map(workout => ({
      workoutId: workout.workoutId,
      workoutType: workout.workoutType,
      effectiveness: workout.effectiveness,
      participantCount: workout.participantCount,
      averageCompletion: workout.averageCompletion,
      averageDifficulty: workout.averageDifficulty,
      averageRating: workout.averageRating,
      improvementRate: workout.improvementRate,
      date: workout.createdAt
    }));
  }

  private async fetchPerformanceMetrics(filters: ReportFilters): Promise<any[]> {
    const query = this.performanceMetricsRepository.createQueryBuilder('metrics');

    this.applyCommonFilters(query, filters, 'metrics');

    const results = await query.getMany();
    
    return results.map(metrics => ({
      entityId: metrics.entityId,
      entityType: metrics.entityType,
      metricType: metrics.metricType,
      value: metrics.value,
      unit: metrics.unit,
      context: metrics.context,
      date: metrics.createdAt
    }));
  }

  // Specialized aggregated data methods
  private async fetchTeamPerformanceMetrics(filters: ReportFilters): Promise<any> {
    const teamAnalytics = await this.fetchTeamAnalytics(filters);
    
    if (teamAnalytics.length === 0) {
      return {
        averagePerformance: 0,
        totalGames: 0,
        winRate: 0,
        teamCount: 0
      };
    }

    return {
      averagePerformance: teamAnalytics.reduce((sum, team) => sum + team.averagePerformance, 0) / teamAnalytics.length,
      totalGames: teamAnalytics.reduce((sum, team) => sum + team.totalGames, 0),
      winRate: teamAnalytics.reduce((sum, team) => sum + team.winRate, 0) / teamAnalytics.length,
      teamCount: teamAnalytics.length,
      topPerformingTeam: teamAnalytics.reduce((best, current) => 
        current.averagePerformance > best.averagePerformance ? current : best
      )
    };
  }

  private async fetchTeamPerformanceTrend(filters: ReportFilters): Promise<any[]> {
    const teamAnalytics = await this.fetchTeamAnalytics(filters);
    
    // Group by date and calculate daily averages
    const dailyAverages = new Map<string, { total: number; count: number }>();
    
    for (const team of teamAnalytics) {
      const dateKey = team.date.toISOString().split('T')[0];
      const existing = dailyAverages.get(dateKey) || { total: 0, count: 0 };
      existing.total += team.averagePerformance;
      existing.count += 1;
      dailyAverages.set(dateKey, existing);
    }

    const trendData = Array.from(dailyAverages.entries()).map(([date, data]) => ({
      date,
      score: data.total / data.count,
      teamCount: data.count
    })).sort((a, b) => a.date.localeCompare(b.date));

    return trendData;
  }

  private async fetchPlayerProgressSummary(filters: ReportFilters): Promise<any[]> {
    const playerStats = await this.fetchPlayerPerformanceStats(filters);
    const workloadData = await this.fetchWorkloadAnalytics(filters);
    
    // Combine player stats with workload data
    const playerMap = new Map<string, any>();
    
    for (const stat of playerStats) {
      if (!playerMap.has(stat.playerId)) {
        playerMap.set(stat.playerId, {
          playerId: stat.playerId,
          playerName: stat.playerName,
          currentPerformance: stat.performanceScore,
          gamesPlayed: stat.gamesPlayed,
          goals: stat.goals,
          assists: stat.assists,
          performanceHistory: []
        });
      }
      playerMap.get(stat.playerId).performanceHistory.push({
        date: stat.date,
        score: stat.performanceScore
      });
    }

    for (const workload of workloadData) {
      const player = playerMap.get(workload.playerId);
      if (player) {
        player.injuryRisk = workload.injuryRisk;
        player.readinessScore = workload.readinessScore;
        player.totalLoad = workload.totalLoad;
      }
    }

    return Array.from(playerMap.values()).map(player => {
      // Calculate performance trend
      const history = player.performanceHistory.sort((a: any, b: any) => a.date.getTime() - b.date.getTime());
      const trend = history.length > 1 
        ? history[history.length - 1].score - history[0].score
        : 0;

      return {
        ...player,
        performanceTrend: trend,
        trendDirection: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable'
      };
    });
  }

  private async fetchWorkoutEffectiveness(filters: ReportFilters): Promise<any[]> {
    const workoutAnalytics = await this.fetchWorkoutAnalytics(filters);
    const trainingStats = await this.fetchTrainingStatistics(filters);
    
    // Group by workout type
    const effectivenessMap = new Map<string, any>();
    
    for (const workout of workoutAnalytics) {
      if (!effectivenessMap.has(workout.workoutType)) {
        effectivenessMap.set(workout.workoutType, {
          workoutType: workout.workoutType,
          totalSessions: 0,
          averageEffectiveness: 0,
          averageRating: 0,
          improvementRate: 0,
          participantCount: 0
        });
      }
      
      const existing = effectivenessMap.get(workout.workoutType);
      existing.totalSessions += 1;
      existing.averageEffectiveness += workout.effectiveness;
      existing.averageRating += workout.averageRating;
      existing.improvementRate += workout.improvementRate;
      existing.participantCount += workout.participantCount;
    }

    // Calculate averages
    for (const [_, data] of effectivenessMap) {
      data.averageEffectiveness /= data.totalSessions;
      data.averageRating /= data.totalSessions;
      data.improvementRate /= data.totalSessions;
      data.participantCount /= data.totalSessions;
    }

    return Array.from(effectivenessMap.values()).sort((a, b) => b.averageEffectiveness - a.averageEffectiveness);
  }

  private async fetchAttendanceStatistics(filters: ReportFilters): Promise<any[]> {
    const trainingStats = await this.fetchTrainingStatistics(filters);
    
    // Group by date and calculate attendance rates
    const attendanceMap = new Map<string, any>();
    
    for (const training of trainingStats) {
      const dateKey = training.date.toISOString().split('T')[0];
      if (!attendanceMap.has(dateKey)) {
        attendanceMap.set(dateKey, {
          date: dateKey,
          totalSessions: 0,
          totalParticipants: 0,
          averageCompletion: 0
        });
      }
      
      const existing = attendanceMap.get(dateKey);
      existing.totalSessions += 1;
      existing.totalParticipants += training.participants;
      existing.averageCompletion += training.completionRate;
    }

    // Calculate averages
    for (const [_, data] of attendanceMap) {
      data.averageParticipants = data.totalParticipants / data.totalSessions;
      data.averageCompletion /= data.totalSessions;
    }

    return Array.from(attendanceMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  private async fetchInjuryReportData(filters: ReportFilters): Promise<any> {
    // This would integrate with the medical service in a real implementation
    // For now, return mock data based on workload analytics
    const workloadData = await this.fetchWorkloadAnalytics(filters);
    
    const highRiskPlayers = workloadData.filter(player => player.injuryRisk > 70);
    const averageRisk = workloadData.reduce((sum, player) => sum + player.injuryRisk, 0) / workloadData.length;
    
    return {
      totalPlayers: workloadData.length,
      highRiskPlayers: highRiskPlayers.length,
      averageInjuryRisk: averageRisk,
      highRiskPlayersList: highRiskPlayers.map(player => ({
        playerId: player.playerId,
        playerName: player.playerName,
        injuryRisk: player.injuryRisk,
        recommendedAction: player.injuryRisk > 90 ? 'Immediate rest' : 'Reduced training load'
      })),
      riskDistribution: {
        low: workloadData.filter(p => p.injuryRisk < 30).length,
        medium: workloadData.filter(p => p.injuryRisk >= 30 && p.injuryRisk <= 70).length,
        high: workloadData.filter(p => p.injuryRisk > 70).length
      }
    };
  }

  private async fetchExecutiveSummaryData(filters: ReportFilters): Promise<any> {
    const [
      teamMetrics,
      playerProgress,
      workoutEffectiveness,
      attendanceStats
    ] = await Promise.all([
      this.fetchTeamPerformanceMetrics(filters),
      this.fetchPlayerProgressSummary(filters),
      this.fetchWorkoutEffectiveness(filters),
      this.fetchAttendanceStatistics(filters)
    ]);

    const totalAttendance = attendanceStats.reduce((sum, day) => sum + day.totalParticipants, 0);
    const averageAttendance = attendanceStats.length > 0 ? totalAttendance / attendanceStats.length : 0;

    return {
      overview: {
        reportPeriod: filters.dateRange ? 
          `${filters.dateRange.start.toLocaleDateString()} - ${filters.dateRange.end.toLocaleDateString()}` :
          'All time',
        totalTeams: teamMetrics.teamCount,
        totalPlayers: playerProgress.length,
        totalSessions: attendanceStats.reduce((sum, day) => sum + day.totalSessions, 0)
      },
      performance: {
        averageTeamPerformance: teamMetrics.averagePerformance,
        winRate: teamMetrics.winRate,
        improvingPlayers: playerProgress.filter(p => p.trendDirection === 'improving').length,
        decliningPlayers: playerProgress.filter(p => p.trendDirection === 'declining').length
      },
      training: {
        mostEffectiveWorkout: workoutEffectiveness[0],
        averageAttendance: averageAttendance,
        completionRate: attendanceStats.reduce((sum, day) => sum + day.averageCompletion, 0) / attendanceStats.length
      },
      keyInsights: [
        `Team performance average: ${teamMetrics.averagePerformance.toFixed(1)}%`,
        `${playerProgress.filter(p => p.trendDirection === 'improving').length} players showing improvement`,
        `${workoutEffectiveness[0]?.workoutType || 'N/A'} is the most effective workout type`,
        `Average attendance: ${averageAttendance.toFixed(0)} participants per session`
      ]
    };
  }

  private async fetchCustomData(dataSource: string, filters: ReportFilters): Promise<any> {
    // Handle custom data sources that might be added by users
    console.warn(`Custom data source '${dataSource}' not implemented. Returning mock data.`);
    
    return {
      message: `Data for custom source '${dataSource}' would be fetched here`,
      filters: filters,
      timestamp: new Date()
    };
  }

  private applyCommonFilters(query: any, filters: ReportFilters, alias: string): void {
    if (filters.dateRange) {
      query.andWhere(`${alias}.createdAt >= :startDate`, { startDate: filters.dateRange.start });
      query.andWhere(`${alias}.createdAt <= :endDate`, { endDate: filters.dateRange.end });
    }

    if (filters.customFilters) {
      for (const filter of filters.customFilters) {
        const fieldName = `${alias}.${filter.field}`;
        switch (filter.operator) {
          case 'eq':
            query.andWhere(`${fieldName} = :${filter.field}`, { [filter.field]: filter.value });
            break;
          case 'ne':
            query.andWhere(`${fieldName} != :${filter.field}`, { [filter.field]: filter.value });
            break;
          case 'gt':
            query.andWhere(`${fieldName} > :${filter.field}`, { [filter.field]: filter.value });
            break;
          case 'gte':
            query.andWhere(`${fieldName} >= :${filter.field}`, { [filter.field]: filter.value });
            break;
          case 'lt':
            query.andWhere(`${fieldName} < :${filter.field}`, { [filter.field]: filter.value });
            break;
          case 'lte':
            query.andWhere(`${fieldName} <= :${filter.field}`, { [filter.field]: filter.value });
            break;
          case 'in':
            query.andWhere(`${fieldName} IN (:...${filter.field})`, { [filter.field]: filter.value });
            break;
          case 'contains':
            query.andWhere(`${fieldName} ILIKE :${filter.field}`, { [filter.field]: `%${filter.value}%` });
            break;
        }
      }
    }
  }

  // Data source configuration methods
  getAvailableDataSources(): DataSourceConfig[] {
    return Array.from(this.dataSources.values());
  }

  getDataSourceConfig(sourceName: string): DataSourceConfig | null {
    return this.dataSources.get(sourceName) || null;
  }

  private initializeDataSources(): void {
    // Define available data sources with their configurations
    const sources: DataSourceConfig[] = [
      {
        name: 'player_performance_stats',
        description: 'Individual player performance statistics',
        fields: [
          { name: 'playerId', type: 'string', label: 'Player ID' },
          { name: 'playerName', type: 'string', label: 'Player Name' },
          { name: 'performanceScore', type: 'number', label: 'Performance Score' },
          { name: 'skillLevel', type: 'number', label: 'Skill Level' },
          { name: 'gamesPlayed', type: 'number', label: 'Games Played' },
          { name: 'goals', type: 'number', label: 'Goals' },
          { name: 'assists', type: 'number', label: 'Assists' }
        ],
        filters: [
          { field: 'playerId', type: 'multi_select' },
          { field: 'performanceScore', type: 'number_range' }
        ],
        aggregations: ['avg', 'sum', 'min', 'max', 'count']
      },
      {
        name: 'team_analytics',
        description: 'Team-level analytics and performance data',
        fields: [
          { name: 'teamId', type: 'string', label: 'Team ID' },
          { name: 'teamName', type: 'string', label: 'Team Name' },
          { name: 'averagePerformance', type: 'number', label: 'Average Performance' },
          { name: 'totalGames', type: 'number', label: 'Total Games' },
          { name: 'wins', type: 'number', label: 'Wins' },
          { name: 'losses', type: 'number', label: 'Losses' },
          { name: 'winRate', type: 'number', label: 'Win Rate %' }
        ],
        filters: [
          { field: 'teamId', type: 'multi_select' }
        ],
        aggregations: ['avg', 'sum', 'min', 'max', 'count']
      },
      {
        name: 'training_statistics',
        description: 'Training session statistics and metrics',
        fields: [
          { name: 'sessionId', type: 'string', label: 'Session ID' },
          { name: 'workoutType', type: 'string', label: 'Workout Type' },
          { name: 'duration', type: 'number', label: 'Duration (minutes)' },
          { name: 'participants', type: 'number', label: 'Participants' },
          { name: 'completionRate', type: 'number', label: 'Completion Rate %' },
          { name: 'averageRating', type: 'number', label: 'Average Rating' }
        ],
        filters: [
          { field: 'workoutType', type: 'multi_select' },
          { field: 'duration', type: 'number_range' }
        ],
        aggregations: ['avg', 'sum', 'min', 'max', 'count']
      },
      {
        name: 'team_performance_metrics',
        description: 'Aggregated team performance metrics',
        fields: [
          { name: 'averagePerformance', type: 'number', label: 'Average Performance' },
          { name: 'totalGames', type: 'number', label: 'Total Games' },
          { name: 'winRate', type: 'number', label: 'Win Rate' },
          { name: 'teamCount', type: 'number', label: 'Team Count' }
        ],
        filters: [],
        aggregations: ['value']
      }
    ];

    for (const source of sources) {
      this.dataSources.set(source.name, source);
    }
  }
}