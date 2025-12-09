import { DataSource, Repository } from 'typeorm';
import { CacheManager } from '@hockey-hub/shared-lib';
import { PredictionData, PredictionType, PredictionTimeframe, ModelType } from '../entities';
import { PlayerPerformanceStats, WorkloadAnalytics } from '../entities';
import { FatiguePredictionModel } from './FatiguePredictionModel';
import { InjuryRiskAssessment } from './InjuryRiskAssessment';
import { RecoveryTimePredictor } from './RecoveryTimePredictor';
import { PerformancePlateauDetector } from './PerformancePlateauDetector';
import { LoadManagementOptimizer } from './LoadManagementOptimizer';

export interface PredictiveInsight {
  id: string;
  playerId: string;
  type: PredictionType;
  riskScore: number; // 0-100
  confidence: number; // 0-100
  predictions: any;
  recommendations: string[];
  riskFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  validUntil: Date;
  metadata: any;
}

export interface AggregatedRiskProfile {
  playerId: string;
  playerName: string;
  position: string;
  overallRiskScore: number;
  fatigueRisk: number;
  injuryRisk: number;
  performanceRisk: number;
  topRiskFactors: string[];
  urgentRecommendations: string[];
  nextAssessmentDate: Date;
}

export class PredictiveAnalyticsService {
  private predictionRepository: Repository<PredictionData>;
  private playerStatsRepository: Repository<PlayerPerformanceStats>;
  private workloadRepository: Repository<WorkloadAnalytics>;
  
  private fatigueModel: FatiguePredictionModel;
  private injuryModel: InjuryRiskAssessment;
  private recoveryModel: RecoveryTimePredictor;
  private plateauDetector: PerformancePlateauDetector;
  private loadOptimizer: LoadManagementOptimizer;

  constructor(
    private dataSource: DataSource,
    private cacheManager: CacheManager
  ) {
    this.predictionRepository = this.dataSource.getRepository(PredictionData);
    this.playerStatsRepository = this.dataSource.getRepository(PlayerPerformanceStats);
    this.workloadRepository = this.dataSource.getRepository(WorkloadAnalytics);
    
    this.fatigueModel = new FatiguePredictionModel();
    this.injuryModel = new InjuryRiskAssessment();
    this.recoveryModel = new RecoveryTimePredictor();
    this.plateauDetector = new PerformancePlateauDetector();
    this.loadOptimizer = new LoadManagementOptimizer();
  }

  // Main prediction orchestrator
  async generatePredictiveInsights(
    playerId: string,
    organizationId: string,
    types?: PredictionType[]
  ): Promise<PredictiveInsight[]> {
    const cacheKey = `predictive_insights:${playerId}:${types?.join(',') || 'all'}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        // Get recent player data
        const [playerStats, workloadData] = await Promise.all([
          this.getRecentPlayerStats(playerId, 30), // Last 30 days
          this.getRecentWorkloadData(playerId, 30)
        ]);

        const predictionsToRun = types || [
          PredictionType.FATIGUE,
          PredictionType.INJURY_RISK,
          PredictionType.PERFORMANCE,
          PredictionType.READINESS
        ];

        const insights: PredictiveInsight[] = [];

        for (const type of predictionsToRun) {
          try {
            const insight = await this.runSpecificPrediction(
              type,
              playerId,
              organizationId,
              playerStats,
              workloadData
            );
            if (insight) {
              insights.push(insight);
            }
          } catch (error) {
            console.error(`Error generating ${type} prediction for player ${playerId}:`, error);
          }
        }

        // Store predictions in database
        await this.storePredictions(insights, organizationId);

        return insights;
      },
      300 // 5 minutes cache
    );
  }

  // Generate team-wide risk assessment
  async generateTeamRiskProfile(
    teamId: string,
    organizationId: string
  ): Promise<AggregatedRiskProfile[]> {
    const cacheKey = `team_risk_profile:${teamId}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        // Get all team players
        const teamPlayers = await this.getTeamPlayers(teamId);
        
        const riskProfiles: AggregatedRiskProfile[] = [];

        for (const player of teamPlayers) {
          try {
            const insights = await this.generatePredictiveInsights(
              player.id,
              organizationId
            );

            const profile = this.aggregatePlayerRisk(player, insights);
            riskProfiles.push(profile);
          } catch (error) {
            console.error(`Error generating risk profile for player ${player.id}:`, error);
          }
        }

        // Sort by overall risk score (highest first)
        riskProfiles.sort((a, b) => b.overallRiskScore - a.overallRiskScore);

        return riskProfiles;
      },
      600 // 10 minutes cache for team data
    );
  }

  // Get real-time fatigue monitoring
  async getFatigueMonitoring(
    playerId: string,
    organizationId: string
  ): Promise<{
    currentFatigueLevel: number;
    fatigueVelocity: number; // Rate of change
    projectedPeakFatigue: Date;
    recoveryRecommendations: string[];
    warningThresholds: {
      yellow: number;
      red: number;
    };
  }> {
    const cacheKey = `fatigue_monitoring:${playerId}`;
    
    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const recentData = await this.getRecentWorkloadData(playerId, 7);
        return this.fatigueModel.generateRealTimeMonitoring(recentData);
      },
      60 // 1 minute cache for real-time data
    );
  }

  // Get recovery optimization recommendations
  async getRecoveryOptimization(
    playerId: string,
    targetRecoveryDate?: Date
  ): Promise<{
    estimatedRecoveryTime: number; // hours
    optimizedRecoveryPlan: Array<{
      phase: string;
      duration: number; // hours
      activities: string[];
      intensity: 'low' | 'moderate' | 'high';
    }>;
    factors: {
      accelerating: string[];
      hindering: string[];
    };
    monitoringPoints: Array<{
      timestamp: Date;
      metrics: string[];
      expectedValues: Record<string, number>;
    }>;
  }> {
    const recentData = await this.getRecentPlayerStats(playerId, 14);
    const workloadData = await this.getRecentWorkloadData(playerId, 14);
    
    return this.recoveryModel.generateOptimizedRecoveryPlan(
      recentData,
      workloadData,
      targetRecoveryDate
    );
  }

  // Detect performance plateaus
  async detectPerformancePlateaus(
    playerId: string
  ): Promise<{
    plateauDetected: boolean;
    plateauDuration: number; // days
    plateauMetrics: string[];
    breakoutProbability: number;
    recommendations: Array<{
      strategy: string;
      expectedImpact: number;
      timeToEffect: number; // days
      difficulty: 'low' | 'medium' | 'high';
    }>;
  }> {
    const historicalData = await this.getRecentPlayerStats(playerId, 90);
    return this.plateauDetector.detectPlateau(historicalData);
  }

  // Load management optimization
  async optimizeLoadManagement(
    teamId: string,
    timeframeWeeks: number = 4
  ): Promise<{
    teamOptimization: {
      currentLoadDistribution: Record<string, number>;
      recommendedAdjustments: Array<{
        playerId: string;
        currentLoad: number;
        recommendedLoad: number;
        adjustment: number; // percentage
        reasoning: string;
      }>;
      projectedOutcomes: {
        injuryRiskReduction: number;
        performanceImprovement: number;
        fatigueOptimization: number;
      };
    };
    individualRecommendations: Array<{
      playerId: string;
      recommendations: string[];
      priority: 'high' | 'medium' | 'low';
    }>;
  }> {
    const teamWorkloadData = await this.getTeamWorkloadData(teamId, timeframeWeeks * 7);
    return this.loadOptimizer.optimizeTeamLoad(teamWorkloadData);
  }

  // Private helper methods

  private async runSpecificPrediction(
    type: PredictionType,
    playerId: string,
    organizationId: string,
    playerStats: any[],
    workloadData: any[]
  ): Promise<PredictiveInsight | null> {
    switch (type) {
      case PredictionType.FATIGUE:
        return this.fatigueModel.predict(playerId, workloadData, playerStats);
      
      case PredictionType.INJURY_RISK:
        return this.injuryModel.assessRisk(playerId, playerStats, workloadData);
      
      case PredictionType.PERFORMANCE:
        return this.plateauDetector.predictPerformance(playerId, playerStats);
      
      case PredictionType.READINESS:
        return this.recoveryModel.predictReadiness(playerId, playerStats, workloadData);
      
      default:
        console.warn(`Unknown prediction type: ${type}`);
        return null;
    }
  }

  private aggregatePlayerRisk(
    player: any,
    insights: PredictiveInsight[]
  ): AggregatedRiskProfile {
    const fatigueInsight = insights.find(i => i.type === PredictionType.FATIGUE);
    const injuryInsight = insights.find(i => i.type === PredictionType.INJURY_RISK);
    const performanceInsight = insights.find(i => i.type === PredictionType.PERFORMANCE);

    const fatigueRisk = fatigueInsight?.riskScore || 0;
    const injuryRisk = injuryInsight?.riskScore || 0;
    const performanceRisk = performanceInsight?.riskScore || 0;

    // Weighted overall risk calculation
    const overallRiskScore = Math.round(
      (fatigueRisk * 0.4) + (injuryRisk * 0.5) + (performanceRisk * 0.1)
    );

    // Collect top risk factors
    const allRiskFactors = insights
      .flatMap(i => i.riskFactors || [])
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3)
      .map(f => f.factor);

    // Collect urgent recommendations
    const urgentRecommendations = insights
      .flatMap(i => i.recommendations || [])
      .filter((rec, index, arr) => arr.indexOf(rec) === index) // Remove duplicates
      .slice(0, 3);

    return {
      playerId: player.id,
      playerName: player.name || `Player ${player.id}`,
      position: player.position || 'Unknown',
      overallRiskScore,
      fatigueRisk,
      injuryRisk,
      performanceRisk,
      topRiskFactors: allRiskFactors,
      urgentRecommendations,
      nextAssessmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    };
  }

  private async storePredictions(
    insights: PredictiveInsight[],
    organizationId: string
  ): Promise<void> {
    const predictions = insights.map(insight => {
      const prediction = new PredictionData();
      prediction.entityId = insight.playerId;
      prediction.entityType = 'player';
      prediction.organizationId = organizationId;
      prediction.predictionType = insight.type;
      prediction.timeframe = PredictionTimeframe.NEXT_WEEK;
      prediction.modelType = ModelType.ENSEMBLE;
      prediction.modelVersion = '1.0.0';
      prediction.confidence = insight.confidence;
      prediction.prediction = insight.predictions;
      prediction.riskFactors = {
        identified: insight.riskFactors,
        mitigations: insight.recommendations,
        riskScore: insight.riskScore
      };
      prediction.recommendations = {
        primary: insight.recommendations,
        secondary: [],
        actions: insight.recommendations.map(rec => ({
          action: rec,
          priority: 'medium' as const,
          impact: 'Reduces identified risk factors',
          effort: 'Moderate'
        }))
      };
      prediction.validUntil = insight.validUntil;
      prediction.isActive = true;
      prediction.metadata = insight.metadata;

      return prediction;
    });

    await this.predictionRepository.save(predictions);
  }

  // Data fetching helpers
  private async getRecentPlayerStats(playerId: string, days: number) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.playerStatsRepository.find({
      where: {
        playerId,
        createdAt: { $gte: startDate } as any
      },
      order: { createdAt: 'DESC' }
    });
  }

  private async getRecentWorkloadData(playerId: string, days: number) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.workloadRepository.find({
      where: {
        playerId,
        createdAt: { $gte: startDate } as any
      },
      order: { createdAt: 'DESC' }
    });
  }

  private async getTeamPlayers(teamId: string) {
    // Mock implementation - in real app, this would query the user service
    return [
      { id: 'player1', name: 'Sidney Crosby', position: 'C' },
      { id: 'player2', name: 'Connor McDavid', position: 'C' },
      { id: 'player3', name: 'Nathan MacKinnon', position: 'C' },
      { id: 'player4', name: 'Leon Draisaitl', position: 'C' },
      { id: 'player5', name: 'Auston Matthews', position: 'C' }
    ];
  }

  private async getTeamWorkloadData(teamId: string, days: number) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.workloadRepository.find({
      where: {
        teamId,
        createdAt: { $gte: startDate } as any
      },
      order: { createdAt: 'DESC' }
    });
  }
}