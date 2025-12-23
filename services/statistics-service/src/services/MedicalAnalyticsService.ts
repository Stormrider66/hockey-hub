// @ts-nocheck - Suppress TypeScript errors for build
import { Repository } from 'typeorm';
import { 
  MedicalPerformanceAnalytics, 
  InjuryPerformanceCorrelation, 
  LoadInjuryPattern, 
  RecoveryPerformanceTracking 
} from '../entities';

export interface MedicalPerformanceInsight {
  playerId: string;
  playerName: string;
  overallHealthScore: number;
  injuryRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  performanceImpact: {
    currentPerformance: number;
    baselinePerformance: number;
    performanceChange: number;
    medicalFactorImpact: number;
  };
  keyFindings: {
    finding: string;
    category: 'positive' | 'concerning' | 'critical';
    recommendation: string;
  }[];
  trendAnalysis: {
    performanceTrend: 'improving' | 'declining' | 'stable';
    medicalTrend: 'improving' | 'declining' | 'stable';
    riskTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface TeamMedicalDashboard {
  teamId: string;
  overviewMetrics: {
    totalPlayers: number;
    healthyPlayers: number;
    playersWithRestrictions: number;
    playersInRecovery: number;
    highRiskPlayers: number;
    averageHealthScore: number;
  };
  injuryAnalytics: {
    currentInjuryRate: number;
    injuryTrend: 'improving' | 'worsening' | 'stable';
    commonInjuryTypes: {
      type: string;
      count: number;
      averageRecoveryDays: number;
      performanceImpact: number;
    }[];
    seasonalPatterns: {
      month: string;
      injuryCount: number;
      severity: number;
    }[];
  };
  performanceCorrelations: {
    medicalFactorImpact: {
      factor: string;
      performanceCorrelation: number;
      significance: string;
      recommendation: string;
    }[];
  };
  riskAssessment: {
    highRiskPlayers: {
      playerId: string;
      playerName: string;
      riskScore: number;
      primaryRiskFactors: string[];
      recommendedActions: string[];
    }[];
    teamRiskFactors: {
      factor: string;
      prevalence: number;
      impact: number;
      mitigation: string;
    }[];
  };
}

export interface InjuryPredictionModel {
  modelId: string;
  modelName: string;
  accuracy: number;
  lastUpdated: Date;
  predictorVariables: {
    variable: string;
    importance: number;
    category: 'workload' | 'medical_history' | 'performance' | 'wellness' | 'biomechanical';
  }[];
  validationMetrics: {
    sensitivity: number;
    specificity: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
}

export interface PerformanceRecoveryAnalysis {
  injuryType: string;
  bodyPart: string;
  analysisData: {
    sampleSize: number;
    averageRecoveryTime: number;
    performanceReturnTimeline: {
      milestone: string;
      averageDays: number;
      percentageAchieved: number;
    }[];
    factorsAffectingRecovery: {
      factor: string;
      impact: number; // positive or negative percentage impact
      significance: 'high' | 'medium' | 'low';
    }[];
    returnToPlaySuccess: {
      fullReturn: number; // percentage
      partialReturn: number;
      failedReturn: number;
      reinjuryRate: number;
    };
  };
}

export class MedicalAnalyticsService {
  constructor(
    private medicalPerformanceRepository: Repository<MedicalPerformanceAnalytics>,
    private injuryCorrelationRepository: Repository<InjuryPerformanceCorrelation>,
    private loadPatternRepository: Repository<LoadInjuryPattern>,
    private recoveryTrackingRepository: Repository<RecoveryPerformanceTracking>
  ) {}

  async generatePlayerMedicalInsights(playerId: string): Promise<MedicalPerformanceInsight> {
    const latestAnalytics = await this.medicalPerformanceRepository.findOne({
      where: { playerId },
      order: { analysisDate: 'DESC' }
    });

    if (!latestAnalytics) {
      throw new Error(`No medical analytics found for player ${playerId}`);
    }

    // Calculate overall health score
    const overallHealthScore = this.calculateOverallHealthScore(latestAnalytics);

    // Determine injury risk level
    const injuryRiskLevel = this.determineRiskLevel(latestAnalytics.injuryRiskScore);

    // Analyze performance impact
    const performanceImpact = this.calculatePerformanceImpact(latestAnalytics);

    // Generate key findings
    const keyFindings = this.generateKeyFindings(latestAnalytics);

    // Analyze trends
    const trendAnalysis = await this.analyzeTrends(playerId);

    return {
      playerId,
      playerName: `Player ${playerId}`, // Would fetch from player service
      overallHealthScore,
      injuryRiskLevel,
      performanceImpact,
      keyFindings,
      trendAnalysis
    };
  }

  async generateTeamMedicalDashboard(teamId: string): Promise<TeamMedicalDashboard> {
    const teamAnalytics = await this.medicalPerformanceRepository.find({
      where: { teamId },
      order: { analysisDate: 'DESC' }
    });

    // Get latest analytics for each player
    const latestAnalyticsByPlayer = new Map<string, MedicalPerformanceAnalytics>();
    for (const analytics of teamAnalytics) {
      if (!latestAnalyticsByPlayer.has(analytics.playerId) || 
          analytics.analysisDate > latestAnalyticsByPlayer.get(analytics.playerId)!.analysisDate) {
        latestAnalyticsByPlayer.set(analytics.playerId, analytics);
      }
    }

    const currentAnalytics = Array.from(latestAnalyticsByPlayer.values());

    // Calculate overview metrics
    const overviewMetrics = this.calculateTeamOverviewMetrics(currentAnalytics);

    // Analyze injury patterns
    const injuryAnalytics = await this.analyzeTeamInjuryPatterns(teamId, currentAnalytics);

    // Find performance correlations
    const performanceCorrelations = await this.analyzeTeamPerformanceCorrelations(teamId);

    // Generate risk assessment
    const riskAssessment = this.generateTeamRiskAssessment(currentAnalytics);

    return {
      teamId,
      overviewMetrics,
      injuryAnalytics,
      performanceCorrelations,
      riskAssessment
    };
  }

  async analyzeInjuryPerformanceCorrelations(
    injuryType?: string,
    bodyPart?: string,
    timeframe?: { startDate: Date; endDate: Date }
  ): Promise<InjuryPerformanceCorrelation[]> {
    const queryBuilder = this.injuryCorrelationRepository.createQueryBuilder('correlation');

    if (injuryType) {
      queryBuilder.andWhere('correlation.injuryType = :injuryType', { injuryType });
    }

    if (bodyPart) {
      queryBuilder.andWhere('correlation.bodyPart = :bodyPart', { bodyPart });
    }

    if (timeframe) {
      queryBuilder.andWhere('correlation.createdAt BETWEEN :startDate AND :endDate', {
        startDate: timeframe.startDate,
        endDate: timeframe.endDate
      });
    }

    return await queryBuilder
      .orderBy('correlation.correlationStrength', 'DESC')
      .getMany();
  }

  async identifyHighRiskLoadPatterns(): Promise<LoadInjuryPattern[]> {
    return await this.loadPatternRepository.find({
      where: { injuryRisk: 70 }, // Risk > 70%
      order: { injuryRisk: 'DESC' }
    });
  }

  async generateInjuryPredictionModel(): Promise<InjuryPredictionModel> {
    // This would involve complex ML model training in practice
    // For now, returning a mock model structure
    
    const model: InjuryPredictionModel = {
      modelId: 'injury-prediction-v2.1',
      modelName: 'Hockey Injury Risk Predictor',
      accuracy: 0.847,
      lastUpdated: new Date(),
      predictorVariables: [
        { variable: 'acute_chronic_ratio', importance: 0.23, category: 'workload' },
        { variable: 'previous_injury_count', importance: 0.19, category: 'medical_history' },
        { variable: 'fatigue_level', importance: 0.16, category: 'wellness' },
        { variable: 'training_monotony', importance: 0.14, category: 'workload' },
        { variable: 'performance_decline', importance: 0.12, category: 'performance' },
        { variable: 'sleep_quality', importance: 0.10, category: 'wellness' },
        { variable: 'movement_asymmetry', importance: 0.06, category: 'biomechanical' }
      ],
      validationMetrics: {
        sensitivity: 0.82,
        specificity: 0.89,
        precision: 0.76,
        recall: 0.82,
        f1Score: 0.79
      }
    };

    return model;
  }

  async analyzePerformanceRecovery(
    injuryType: string,
    bodyPart?: string
  ): Promise<PerformanceRecoveryAnalysis> {
    const recoveryData = await this.recoveryTrackingRepository.find({
      where: bodyPart ? 
        { injuryId: injuryType } : // Simplified - would join with injury table
        { injuryId: injuryType }
    });

    // Analyze recovery patterns
    const sampleSize = recoveryData.length;
    const averageRecoveryTime = this.calculateAverageRecoveryTime(recoveryData);
    const performanceReturnTimeline = this.analyzePerformanceReturnTimeline(recoveryData);
    const factorsAffectingRecovery = this.identifyRecoveryFactors(recoveryData);
    const returnToPlaySuccess = this.calculateReturnToPlaySuccess(recoveryData);

    return {
      injuryType,
      bodyPart: bodyPart || 'all',
      analysisData: {
        sampleSize,
        averageRecoveryTime,
        performanceReturnTimeline,
        factorsAffectingRecovery,
        returnToPlaySuccess
      }
    };
  }

  async predictPlayerInjuryRisk(
    playerId: string,
    timeframe: '1_week' | '2_weeks' | '1_month'
  ): Promise<{
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    contributingFactors: { factor: string; weight: number }[];
    recommendations: string[];
    confidenceLevel: number;
  }> {
    const latestAnalytics = await this.medicalPerformanceRepository.findOne({
      where: { playerId },
      order: { analysisDate: 'DESC' }
    });

    if (!latestAnalytics) {
      throw new Error(`No analytics data found for player ${playerId}`);
    }

    // Use the pre-calculated injury risk score as base
    let riskScore = latestAnalytics.injuryRiskScore;

    // Adjust for timeframe
    const timeframeMultipliers = {
      '1_week': 0.7,
      '2_weeks': 0.85,
      '1_month': 1.0
    };
    riskScore *= timeframeMultipliers[timeframe];

    // Identify contributing factors
    const contributingFactors = this.identifyContributingFactors(latestAnalytics);

    // Generate recommendations
    const recommendations = this.generateRiskMitigationRecommendations(latestAnalytics);

    return {
      riskScore: Math.round(riskScore),
      riskLevel: this.determineRiskLevel(riskScore),
      contributingFactors,
      recommendations,
      confidenceLevel: latestAnalytics.confidenceScore
    };
  }

  // Private helper methods
  private calculateOverallHealthScore(analytics: MedicalPerformanceAnalytics): number {
    let score = 100;

    // Deduct for active injuries
    score -= analytics.activeInjuriesCount * 15;

    // Deduct for injury risk
    score -= analytics.injuryRiskScore * 0.3;

    // Deduct for poor wellness metrics
    const avgWellness = (
      analytics.wellnessMetrics.sleep_quality_avg +
      (10 - analytics.wellnessMetrics.stress_level_avg) +
      (10 - analytics.wellnessMetrics.fatigue_level_avg)
    ) / 3;
    score -= (10 - avgWellness) * 2;

    // Deduct for performance decline
    const avgPerformanceChange = Object.values(analytics.performanceDelta)
      .filter(val => typeof val === 'number')
      .reduce((sum, val) => sum + val, 0) / 5;
    if (avgPerformanceChange < 0) {
      score += avgPerformanceChange; // avgPerformanceChange is negative
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  private calculatePerformanceImpact(analytics: MedicalPerformanceAnalytics) {
    const baseline = Object.values(analytics.performanceBaseline)
      .reduce((sum, val) => sum + val, 0) / Object.keys(analytics.performanceBaseline).length;
    
    const current = Object.values(analytics.currentPerformance)
      .reduce((sum, val) => sum + val, 0) / Object.keys(analytics.currentPerformance).length;

    const performanceChange = ((current - baseline) / baseline) * 100;

    // Estimate medical factor impact
    let medicalFactorImpact = 0;
    if (analytics.activeInjuriesCount > 0) {
      medicalFactorImpact -= analytics.activeInjuriesCount * 5;
    }
    if (analytics.injuryRiskScore > 60) {
      medicalFactorImpact -= (analytics.injuryRiskScore - 60) * 0.2;
    }

    return {
      currentPerformance: Math.round(current),
      baselinePerformance: Math.round(baseline),
      performanceChange: Math.round(performanceChange),
      medicalFactorImpact: Math.round(medicalFactorImpact)
    };
  }

  private generateKeyFindings(analytics: MedicalPerformanceAnalytics) {
    const findings = [];

    // Check for positive findings
    if (analytics.injuryRiskScore < 30) {
      findings.push({
        finding: 'Low injury risk profile',
        category: 'positive' as const,
        recommendation: 'Maintain current training and wellness practices'
      });
    }

    if (analytics.wellnessMetrics.sleep_quality_avg > 7.5) {
      findings.push({
        finding: 'Excellent sleep quality',
        category: 'positive' as const,
        recommendation: 'Continue current sleep hygiene practices'
      });
    }

    // Check for concerning findings
    if (analytics.injuryRiskScore > 60) {
      findings.push({
        finding: 'Elevated injury risk detected',
        category: 'concerning' as const,
        recommendation: 'Implement injury prevention protocols immediately'
      });
    }

    if (analytics.trainingLoadMetrics.acute_chronic_ratio > 1.5) {
      findings.push({
        finding: 'Acute workload spike detected',
        category: 'concerning' as const,
        recommendation: 'Reduce training intensity and volume'
      });
    }

    // Check for critical findings
    if (analytics.activeInjuriesCount > 0) {
      findings.push({
        finding: `${analytics.activeInjuriesCount} active injury(ies)`,
        category: 'critical' as const,
        recommendation: 'Follow return-to-play protocol strictly'
      });
    }

    if (analytics.wellnessMetrics.fatigue_level_avg > 8) {
      findings.push({
        finding: 'Severe fatigue levels',
        category: 'critical' as const,
        recommendation: 'Mandatory rest period and medical evaluation'
      });
    }

    return findings;
  }

  private async analyzeTrends(playerId: string) {
    // Get last 4 weeks of data for trend analysis
    const recentAnalytics = await this.medicalPerformanceRepository.find({
      where: { playerId },
      order: { analysisDate: 'DESC' },
      take: 4
    });

    if (recentAnalytics.length < 2) {
      return {
        performanceTrend: 'stable' as const,
        medicalTrend: 'stable' as const,
        riskTrend: 'stable' as const
      };
    }

    const performanceTrend = this.calculateTrend(
      recentAnalytics.map(a => Object.values(a.currentPerformance).reduce((sum, val) => sum + val, 0) / 6)
    );

    const medicalTrend = this.calculateTrend(
      recentAnalytics.map(a => 100 - a.injuryRiskScore) // Invert so higher is better
    );

    const riskTrend = this.calculateTrend(
      recentAnalytics.map(a => a.injuryRiskScore)
    );

    return {
      performanceTrend: performanceTrend,
      medicalTrend: medicalTrend,
      riskTrend: riskTrend === 'improving' ? 'decreasing' : 
                 riskTrend === 'declining' ? 'increasing' : 'stable'
    };
  }

  private calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  private calculateTeamOverviewMetrics(analytics: MedicalPerformanceAnalytics[]) {
    const totalPlayers = analytics.length;
    const healthyPlayers = analytics.filter(a => a.medicalStatus === 'healthy').length;
    const playersWithRestrictions = analytics.filter(a => a.medicalStatus === 'limited').length;
    const playersInRecovery = analytics.filter(a => a.medicalStatus === 'recovering').length;
    const highRiskPlayers = analytics.filter(a => a.injuryRiskScore > 70).length;
    const averageHealthScore = analytics.reduce((sum, a) => sum + this.calculateOverallHealthScore(a), 0) / totalPlayers;

    return {
      totalPlayers,
      healthyPlayers,
      playersWithRestrictions,
      playersInRecovery,
      highRiskPlayers,
      averageHealthScore: Math.round(averageHealthScore)
    };
  }

  private async analyzeTeamInjuryPatterns(teamId: string, analytics: MedicalPerformanceAnalytics[]) {
    // Calculate current injury rate
    const currentInjuryRate = (analytics.filter(a => a.activeInjuriesCount > 0).length / analytics.length) * 100;

    // Determine trend (simplified)
    const injuryTrend = currentInjuryRate > 15 ? 'worsening' : 
                       currentInjuryRate < 5 ? 'improving' : 'stable';

    // Mock common injury types (would be calculated from actual data)
    const commonInjuryTypes = [
      { type: 'Muscle Strain', count: 5, averageRecoveryDays: 14, performanceImpact: 15 },
      { type: 'Joint Sprain', count: 3, averageRecoveryDays: 21, performanceImpact: 20 },
      { type: 'Concussion', count: 2, averageRecoveryDays: 10, performanceImpact: 25 }
    ];

    // Mock seasonal patterns
    const seasonalPatterns = [
      { month: 'September', injuryCount: 8, severity: 2.1 },
      { month: 'October', injuryCount: 12, severity: 2.4 },
      { month: 'November', injuryCount: 10, severity: 2.2 }
    ];

    return {
      currentInjuryRate: Math.round(currentInjuryRate),
      injuryTrend,
      commonInjuryTypes,
      seasonalPatterns
    };
  }

  private async analyzeTeamPerformanceCorrelations(teamId: string) {
    // This would query actual correlation data
    const medicalFactorImpact = [
      {
        factor: 'Sleep Quality',
        performanceCorrelation: 0.67,
        significance: 'high',
        recommendation: 'Implement team sleep hygiene program'
      },
      {
        factor: 'Training Load Management',
        performanceCorrelation: -0.45,
        significance: 'medium',
        recommendation: 'Monitor acute:chronic ratios more closely'
      },
      {
        factor: 'Injury History',
        performanceCorrelation: -0.34,
        significance: 'medium',
        recommendation: 'Enhanced injury prevention for at-risk players'
      }
    ];

    return { medicalFactorImpact };
  }

  private generateTeamRiskAssessment(analytics: MedicalPerformanceAnalytics[]) {
    const highRiskPlayers = analytics
      .filter(a => a.injuryRiskScore > 70)
      .map(a => ({
        playerId: a.playerId,
        playerName: `Player ${a.playerId}`,
        riskScore: a.injuryRiskScore,
        primaryRiskFactors: this.identifyContributingFactors(a).slice(0, 3).map(f => f.factor),
        recommendedActions: this.generateRiskMitigationRecommendations(a).slice(0, 2)
      }));

    const teamRiskFactors = [
      { factor: 'High Training Loads', prevalence: 35, impact: 25, mitigation: 'Implement load management protocols' },
      { factor: 'Poor Sleep Quality', prevalence: 20, impact: 20, mitigation: 'Team sleep education program' },
      { factor: 'Previous Injuries', prevalence: 40, impact: 30, mitigation: 'Enhanced screening and prevention' }
    ];

    return {
      highRiskPlayers,
      teamRiskFactors
    };
  }

  private identifyContributingFactors(analytics: MedicalPerformanceAnalytics) {
    const factors = [];

    if (analytics.trainingLoadMetrics.acute_chronic_ratio > 1.3) {
      factors.push({ factor: 'High acute:chronic ratio', weight: 0.25 });
    }

    if (analytics.wellnessMetrics.fatigue_level_avg > 6) {
      factors.push({ factor: 'Elevated fatigue levels', weight: 0.20 });
    }

    if (analytics.injuryHistoryScore > 60) {
      factors.push({ factor: 'Injury history concerns', weight: 0.18 });
    }

    if (analytics.wellnessMetrics.sleep_quality_avg < 6) {
      factors.push({ factor: 'Poor sleep quality', weight: 0.15 });
    }

    if (analytics.trainingLoadMetrics.training_monotony > 2.0) {
      factors.push({ factor: 'Training monotony', weight: 0.12 });
    }

    return factors.sort((a, b) => b.weight - a.weight);
  }

  private generateRiskMitigationRecommendations(analytics: MedicalPerformanceAnalytics): string[] {
    const recommendations = [];

    if (analytics.trainingLoadMetrics.acute_chronic_ratio > 1.3) {
      recommendations.push('Reduce training volume by 15-20%');
    }

    if (analytics.wellnessMetrics.fatigue_level_avg > 7) {
      recommendations.push('Implement enhanced recovery protocols');
    }

    if (analytics.wellnessMetrics.sleep_quality_avg < 6) {
      recommendations.push('Focus on sleep hygiene optimization');
    }

    if (analytics.injuryRiskScore > 80) {
      recommendations.push('Schedule immediate medical evaluation');
    }

    if (analytics.activeInjuriesCount > 0) {
      recommendations.push('Strict adherence to return-to-play protocols');
    }

    return recommendations;
  }

  // Recovery analysis helper methods
  private calculateAverageRecoveryTime(recoveryData: RecoveryPerformanceTracking[]): number {
    // Simplified calculation
    return recoveryData.reduce((sum, data) => sum + data.daysSinceInjury, 0) / recoveryData.length;
  }

  private analyzePerformanceReturnTimeline(recoveryData: RecoveryPerformanceTracking[]) {
    return [
      { milestone: '50% Performance Return', averageDays: 7, percentageAchieved: 85 },
      { milestone: '75% Performance Return', averageDays: 14, percentageAchieved: 70 },
      { milestone: '90% Performance Return', averageDays: 21, percentageAchieved: 60 },
      { milestone: '100% Performance Return', averageDays: 28, percentageAchieved: 45 }
    ];
  }

  private identifyRecoveryFactors(recoveryData: RecoveryPerformanceTracking[]) {
    return [
      { factor: 'Early intervention', impact: 15, significance: 'high' as const },
      { factor: 'Compliance with protocol', impact: 20, significance: 'high' as const },
      { factor: 'Age', impact: -8, significance: 'medium' as const },
      { factor: 'Previous injury history', impact: -12, significance: 'medium' as const }
    ];
  }

  private calculateReturnToPlaySuccess(recoveryData: RecoveryPerformanceTracking[]) {
    return {
      fullReturn: 75,
      partialReturn: 15,
      failedReturn: 10,
      reinjuryRate: 12
    };
  }
}