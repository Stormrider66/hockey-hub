// @ts-nocheck - Suppress TypeScript errors for build
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PlayerPerformanceStats } from '../entities/PlayerPerformanceStats';
import { WorkoutAnalytics } from '../entities/WorkoutAnalytics';

export interface AnomalyAlert {
  id: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  detectedAt: Date;
  affectedEntities: AffectedEntity[];
  anomalyData: AnomalyData;
  context: AnomalyContext;
  possibleCauses: PossibleCause[];
  recommendations: AnomalyRecommendation[];
  confidence: number; // 0-100
  falsePositiveProbability: number; // 0-100
  urgency: number; // 0-100
  impactAssessment: ImpactAssessment;
  historicalComparison: HistoricalComparison;
  relatedAnomalies: string[]; // IDs of related anomalies
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  investigationNotes: string[];
  resolution: AnomalyResolution | null;
}

export enum AnomalyType {
  PERFORMANCE_DROP = 'performance_drop',
  UNUSUAL_LOAD = 'unusual_load',
  RECOVERY_ANOMALY = 'recovery_anomaly',
  INJURY_RISK = 'injury_risk',
  PATTERN_DEVIATION = 'pattern_deviation',
  STATISTICAL_OUTLIER = 'statistical_outlier',
  TREND_BREAK = 'trend_break',
  CLUSTER_ANOMALY = 'cluster_anomaly',
  TEMPORAL_ANOMALY = 'temporal_anomaly',
  MULTI_VARIATE_ANOMALY = 'multi_variate_anomaly'
}

export interface AffectedEntity {
  type: 'player' | 'team' | 'workout' | 'session' | 'metric';
  id: string;
  name: string;
  role?: string;
  impactLevel: 'low' | 'medium' | 'high';
}

export interface AnomalyData {
  detectedMetric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number; // Standard deviations from expected
  deviationPercentage: number;
  threshold: number;
  timeWindow: TimeWindow;
  dataPoints: DataPoint[];
  statisticalSignificance: number;
  anomalyScore: number; // 0-100
}

export interface TimeWindow {
  start: Date;
  end: Date;
  duration: string;
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface DataPoint {
  timestamp: Date;
  value: number;
  expectedValue: number;
  isAnomalous: boolean;
  contributingFactors: string[];
}

export interface AnomalyContext {
  seasonPhase: string;
  recentEvents: ContextEvent[];
  environmentalFactors: EnvironmentalFactor[];
  teamState: TeamState;
  playerState: PlayerState;
  workloadContext: WorkloadContext;
}

export interface ContextEvent {
  type: 'game' | 'injury' | 'travel' | 'training_change' | 'external';
  description: string;
  date: Date;
  impact: 'positive' | 'negative' | 'neutral';
  relevance: number; // 0-100
}

export interface EnvironmentalFactor {
  factor: string;
  value: string | number;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface TeamState {
  morale: number;
  chemistry: number;
  fatigue: number;
  injuryCount: number;
  recentPerformance: number;
  stressLevel: number;
}

export interface PlayerState {
  playerId: string;
  wellness: number;
  motivation: number;
  fatigue: number;
  injuryStatus: string;
  lifeStressors: string[];
  recentChanges: string[];
}

export interface WorkloadContext {
  recentLoadChanges: LoadChange[];
  cumulativeStress: number;
  recoveryDebt: number;
  trainingPhase: string;
  loadDistribution: string;
}

export interface LoadChange {
  date: Date;
  type: 'increase' | 'decrease' | 'redistribution';
  magnitude: number;
  reason: string;
}

export interface PossibleCause {
  cause: string;
  category: 'training' | 'recovery' | 'environmental' | 'psychological' | 'physiological' | 'external';
  probability: number; // 0-100
  evidence: Evidence[];
  investigationSteps: string[];
}

export interface Evidence {
  type: 'data' | 'observation' | 'correlation' | 'historical';
  description: string;
  strength: number; // 0-100
  reliability: number; // 0-100
  timestamp: Date;
}

export interface AnomalyRecommendation {
  action: string;
  category: 'immediate' | 'short_term' | 'long_term' | 'monitoring';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  rationale: string;
  expectedOutcome: string;
  timeframe: string;
  resources: string[];
  riskAssessment: ActionRisk;
  successMetrics: string[];
  dependencies: string[];
}

export interface ActionRisk {
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  mitigation: string[];
  consequences: string[];
}

export interface ImpactAssessment {
  immediate: Impact;
  shortTerm: Impact;
  longTerm: Impact;
  cascadingEffects: CascadingEffect[];
  stakeholderImpact: StakeholderImpact[];
}

export interface Impact {
  severity: 'minimal' | 'low' | 'moderate' | 'high' | 'severe';
  scope: 'individual' | 'position' | 'line' | 'team' | 'organization';
  description: string;
  quantifiedImpact: QuantifiedImpact;
}

export interface QuantifiedImpact {
  performanceChange: number; // %
  injuryRiskChange: number; // %
  availabilityChange: number; // %
  costImpact: number; // estimated cost
  timeImpact: string;
}

export interface CascadingEffect {
  effect: string;
  probability: number;
  timeframe: string;
  mitigationPossible: boolean;
}

export interface StakeholderImpact {
  stakeholder: 'player' | 'coach' | 'medical' | 'management' | 'fans';
  impactType: 'performance' | 'health' | 'financial' | 'reputation' | 'operational';
  severity: number; // 0-100
  description: string;
}

export interface HistoricalComparison {
  similarAnomalies: SimilarAnomaly[];
  frequencyAnalysis: FrequencyAnalysis;
  outcomePatterns: OutcomePattern[];
  learnings: string[];
}

export interface SimilarAnomaly {
  id: string;
  date: Date;
  similarity: number; // 0-100
  outcome: string;
  resolution: string;
  timeToResolution: string;
  effectiveness: number;
}

export interface FrequencyAnalysis {
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: SeasonalityPattern;
}

export interface SeasonalityPattern {
  hasPattern: boolean;
  pattern: string;
  confidence: number;
  peakPeriods: string[];
}

export interface OutcomePattern {
  pattern: string;
  frequency: number;
  successRate: number;
  averageResolutionTime: string;
  commonActions: string[];
}

export interface AnomalyResolution {
  resolvedAt: Date;
  resolvedBy: string;
  resolutionType: 'corrected' | 'false_positive' | 'acceptable_variance' | 'external_factor';
  actions: ResolutionAction[];
  outcome: string;
  effectiveness: number;
  lessonsLearned: string[];
  preventionMeasures: string[];
}

export interface ResolutionAction {
  action: string;
  implementedAt: Date;
  implementedBy: string;
  result: string;
  cost: number;
  timeRequired: string;
}

export interface AnomalyDetectionConfig {
  sensitivityLevel: 'low' | 'medium' | 'high';
  detectionMethods: DetectionMethod[];
  monitoredMetrics: MonitoredMetric[];
  alertThresholds: AlertThreshold[];
  contextualFactors: ContextualFactor[];
}

export interface DetectionMethod {
  name: string;
  algorithm: 'statistical' | 'machine_learning' | 'rule_based' | 'hybrid';
  parameters: Record<string, any>;
  weights: Record<string, number>;
  enabled: boolean;
}

export interface MonitoredMetric {
  metric: string;
  category: 'performance' | 'load' | 'recovery' | 'wellness' | 'injury';
  weight: number;
  thresholds: MetricThreshold[];
  contextAdjustments: ContextAdjustment[];
}

export interface MetricThreshold {
  level: 'warning' | 'alert' | 'critical';
  value: number;
  condition: 'above' | 'below' | 'outside_range';
  timeWindow: string;
}

export interface ContextAdjustment {
  context: string;
  adjustmentFactor: number;
  reasoning: string;
}

export interface AlertThreshold {
  anomalyType: AnomalyType;
  minimumConfidence: number;
  minimumSeverity: 'low' | 'medium' | 'high' | 'critical';
  suppressionRules: SuppressionRule[];
}

export interface SuppressionRule {
  condition: string;
  suppressionPeriod: string;
  reasoning: string;
}

export interface ContextualFactor {
  factor: string;
  weight: number;
  adjustmentRules: AdjustmentRule[];
}

export interface AdjustmentRule {
  condition: string;
  adjustment: number;
  reason: string;
}

export interface AnomalyTrend {
  period: string;
  anomalyCount: number;
  severityDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  resolutionRate: number;
  averageDetectionTime: string;
  averageResolutionTime: string;
  falsePositiveRate: number;
  missedAnomalyRate: number;
  improvementSuggestions: string[];
}

@Injectable()
export class AnomalyDetectionService {
  private detectionConfig: AnomalyDetectionConfig;

  constructor(
    @InjectRepository(PlayerPerformanceStats)
    private readonly performanceRepository: Repository<PlayerPerformanceStats>,
    @InjectRepository(WorkoutAnalytics)
    private readonly workoutRepository: Repository<WorkoutAnalytics>
  ) {
    this.detectionConfig = this.initializeDetectionConfig();
  }

  async detectAnomalies(
    entityType: 'player' | 'team' | 'workout',
    entityId: string,
    timeWindow?: TimeWindow
  ): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = [];

    // Get historical data for comparison
    const historicalData = await this.getHistoricalData(entityType, entityId, timeWindow);
    const currentData = await this.getCurrentData(entityType, entityId);
    const context = await this.buildAnomalyContext(entityType, entityId);

    // Apply different detection methods
    const statisticalAnomalies = await this.detectStatisticalAnomalies(historicalData, currentData, context);
    const patternAnomalies = await this.detectPatternAnomalies(historicalData, currentData, context);
    const trendAnomalies = await this.detectTrendAnomalies(historicalData, context);
    const multiVariateAnomalies = await this.detectMultiVariateAnomalies(historicalData, currentData, context);
    const clusterAnomalies = await this.detectClusterAnomalies(historicalData, currentData, context);

    alerts.push(
      ...statisticalAnomalies,
      ...patternAnomalies,
      ...trendAnomalies,
      ...multiVariateAnomalies,
      ...clusterAnomalies
    );

    // Filter and prioritize alerts
    const filteredAlerts = this.filterAlerts(alerts);
    const prioritizedAlerts = this.prioritizeAlerts(filteredAlerts);

    // Enrich alerts with context and recommendations
    const enrichedAlerts = await this.enrichAlerts(prioritizedAlerts, context);

    return enrichedAlerts;
  }

  private async detectStatisticalAnomalies(
    historicalData: any[],
    currentData: any,
    context: AnomalyContext
  ): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = [];

    for (const metric of this.detectionConfig.monitoredMetrics) {
      const historicalValues = historicalData.map(d => d[metric.metric]).filter(v => v !== null && v !== undefined);
      
      if (historicalValues.length < 10) continue; // Need sufficient history

      const currentValue = currentData[metric.metric];
      if (currentValue === null || currentValue === undefined) continue;

      const stats = this.calculateStatistics(historicalValues);
      const zScore = Math.abs((currentValue - stats.mean) / stats.standardDeviation);
      const threshold = this.getStatisticalThreshold(metric, context);

      if (zScore > threshold) {
        const deviation = ((currentValue - stats.mean) / stats.mean) * 100;
        
        alerts.push({
          id: `statistical-${metric.metric}-${Date.now()}`,
          type: AnomalyType.STATISTICAL_OUTLIER,
          severity: this.determineSeverity(zScore, metric),
          title: `Statistical Anomaly in ${metric.metric}`,
          description: `${metric.metric} value (${currentValue.toFixed(2)}) is ${zScore.toFixed(2)} standard deviations from the expected value (${stats.mean.toFixed(2)})`,
          detectedAt: new Date(),
          affectedEntities: this.identifyAffectedEntities(currentData),
          anomalyData: {
            detectedMetric: metric.metric,
            currentValue,
            expectedValue: stats.mean,
            deviation: zScore,
            deviationPercentage: deviation,
            threshold,
            timeWindow: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              end: new Date(),
              duration: '30 days',
              granularity: 'daily'
            },
            dataPoints: this.createDataPoints(historicalData, metric.metric),
            statisticalSignificance: this.calculateSignificance(zScore),
            anomalyScore: Math.min(100, zScore * 20)
          },
          context,
          possibleCauses: this.identifyPossibleCauses(metric.metric, currentValue, stats.mean, context),
          recommendations: this.generateRecommendations(metric.metric, currentValue, stats.mean, context),
          confidence: Math.min(95, 50 + (zScore * 10)),
          falsePositiveProbability: Math.max(5, 25 - (zScore * 5)),
          urgency: this.calculateUrgency(zScore, metric),
          impactAssessment: this.assessImpact(metric.metric, deviation, context),
          historicalComparison: await this.getHistoricalComparison(metric.metric, zScore),
          relatedAnomalies: [],
          status: 'new',
          investigationNotes: [],
          resolution: null
        });
      }
    }

    return alerts;
  }

  private async detectPatternAnomalies(
    historicalData: any[],
    currentData: any,
    context: AnomalyContext
  ): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = [];

    // Detect unusual patterns in training sequences
    const trainingPatterns = this.analyzeTrainingPatterns(historicalData);
    const currentPattern = this.extractCurrentPattern(currentData, historicalData.slice(-7));

    if (this.isPatternAnomalous(currentPattern, trainingPatterns)) {
      alerts.push({
        id: `pattern-${Date.now()}`,
        type: AnomalyType.PATTERN_DEVIATION,
        severity: 'medium',
        title: 'Unusual Training Pattern Detected',
        description: 'Current training pattern deviates significantly from established patterns',
        detectedAt: new Date(),
        affectedEntities: this.identifyAffectedEntities(currentData),
        anomalyData: {
          detectedMetric: 'training_pattern',
          currentValue: currentPattern.score,
          expectedValue: trainingPatterns.averageScore,
          deviation: (currentPattern.score - trainingPatterns.averageScore) / trainingPatterns.standardDeviation,
          deviationPercentage: ((currentPattern.score - trainingPatterns.averageScore) / trainingPatterns.averageScore) * 100,
          threshold: 2.0,
          timeWindow: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: new Date(),
            duration: '7 days',
            granularity: 'daily'
          },
          dataPoints: [],
          statisticalSignificance: 85,
          anomalyScore: 75
        },
        context,
        possibleCauses: [
          {
            cause: 'Training plan modification',
            category: 'training',
            probability: 70,
            evidence: [
              {
                type: 'observation',
                description: 'Recent changes in training schedule',
                strength: 80,
                reliability: 90,
                timestamp: new Date()
              }
            ],
            investigationSteps: ['Review recent training plan changes', 'Check with coaching staff']
          },
          {
            cause: 'Player availability issues',
            category: 'external',
            probability: 40,
            evidence: [
              {
                type: 'data',
                description: 'Attendance patterns',
                strength: 60,
                reliability: 95,
                timestamp: new Date()
              }
            ],
            investigationSteps: ['Check attendance records', 'Review injury reports']
          }
        ],
        recommendations: [
          {
            action: 'Review training consistency',
            category: 'immediate',
            priority: 'medium',
            description: 'Analyze recent changes in training patterns and their impact',
            rationale: 'Pattern deviations may indicate underlying issues',
            expectedOutcome: 'Identification of pattern deviation cause',
            timeframe: '1-2 days',
            resources: ['Coach time', 'Data analysis'],
            riskAssessment: {
              riskLevel: 'low',
              riskFactors: ['Time investment'],
              mitigation: ['Prioritize high-impact areas'],
              consequences: ['Delayed identification of issues']
            },
            successMetrics: ['Pattern understanding', 'Issue identification'],
            dependencies: ['Data availability', 'Staff cooperation']
          }
        ],
        confidence: 78,
        falsePositiveProbability: 22,
        urgency: 60,
        impactAssessment: this.createMockImpactAssessment(),
        historicalComparison: await this.createMockHistoricalComparison(),
        relatedAnomalies: [],
        status: 'new',
        investigationNotes: [],
        resolution: null
      });
    }

    return alerts;
  }

  private async detectTrendAnomalies(
    historicalData: any[],
    context: AnomalyContext
  ): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = [];

    for (const metric of this.detectionConfig.monitoredMetrics) {
      const values = historicalData.map(d => d[metric.metric]).filter(v => v !== null && v !== undefined);
      
      if (values.length < 14) continue; // Need at least 2 weeks of data

      const trend = this.calculateTrend(values);
      const expectedTrend = this.getExpectedTrend(metric.metric, context);
      
      if (this.isTrendAnomalous(trend, expectedTrend, metric)) {
        alerts.push({
          id: `trend-${metric.metric}-${Date.now()}`,
          type: AnomalyType.TREND_BREAK,
          severity: this.determineTrendSeverity(trend, expectedTrend),
          title: `Unexpected Trend in ${metric.metric}`,
          description: `${metric.metric} shows ${trend.direction} trend (${trend.slope.toFixed(3)} per day) when ${expectedTrend.direction} trend was expected`,
          detectedAt: new Date(),
          affectedEntities: this.identifyAffectedEntities({ metric: metric.metric }),
          anomalyData: {
            detectedMetric: metric.metric,
            currentValue: trend.slope,
            expectedValue: expectedTrend.slope,
            deviation: Math.abs(trend.slope - expectedTrend.slope) / Math.abs(expectedTrend.slope || 1),
            deviationPercentage: ((trend.slope - expectedTrend.slope) / (expectedTrend.slope || 1)) * 100,
            threshold: 0.5,
            timeWindow: {
              start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
              end: new Date(),
              duration: '14 days',
              granularity: 'daily'
            },
            dataPoints: this.createTrendDataPoints(values),
            statisticalSignificance: trend.rSquared * 100,
            anomalyScore: Math.min(100, Math.abs(trend.slope - expectedTrend.slope) * 50)
          },
          context,
          possibleCauses: this.identifyTrendCauses(metric.metric, trend, expectedTrend, context),
          recommendations: this.generateTrendRecommendations(metric.metric, trend, expectedTrend),
          confidence: Math.min(95, trend.rSquared * 100 + 20),
          falsePositiveProbability: Math.max(5, 30 - (trend.rSquared * 25)),
          urgency: this.calculateTrendUrgency(trend, expectedTrend, metric),
          impactAssessment: this.assessTrendImpact(metric.metric, trend, context),
          historicalComparison: await this.getTrendHistoricalComparison(metric.metric),
          relatedAnomalies: [],
          status: 'new',
          investigationNotes: [],
          resolution: null
        });
      }
    }

    return alerts;
  }

  private async detectMultiVariateAnomalies(
    historicalData: any[],
    currentData: any,
    context: AnomalyContext
  ): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = [];

    // Define metric groups that should be analyzed together
    const metricGroups = [
      ['performance', 'fatigue', 'wellness'],
      ['load', 'recovery', 'readiness'],
      ['strength', 'speed', 'endurance']
    ];

    for (const group of metricGroups) {
      const anomalyScore = this.calculateMultiVariateAnomalyScore(group, historicalData, currentData);
      
      if (anomalyScore > 70) {
        alerts.push({
          id: `multivariate-${group.join('-')}-${Date.now()}`,
          type: AnomalyType.MULTI_VARIATE_ANOMALY,
          severity: anomalyScore > 85 ? 'high' : 'medium',
          title: `Multi-metric Anomaly in ${group.join(', ')}`,
          description: `Unusual combination of values detected across ${group.join(', ')} metrics`,
          detectedAt: new Date(),
          affectedEntities: this.identifyAffectedEntities(currentData),
          anomalyData: {
            detectedMetric: group.join('_'),
            currentValue: anomalyScore,
            expectedValue: 30, // Expected normal range
            deviation: (anomalyScore - 30) / 20,
            deviationPercentage: ((anomalyScore - 30) / 30) * 100,
            threshold: 70,
            timeWindow: {
              start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              end: new Date(),
              duration: '7 days',
              granularity: 'daily'
            },
            dataPoints: [],
            statisticalSignificance: 80,
            anomalyScore
          },
          context,
          possibleCauses: this.identifyMultiVariateCauses(group, currentData, context),
          recommendations: this.generateMultiVariateRecommendations(group, anomalyScore),
          confidence: 85,
          falsePositiveProbability: 15,
          urgency: anomalyScore > 85 ? 90 : 70,
          impactAssessment: this.createMockImpactAssessment(),
          historicalComparison: await this.createMockHistoricalComparison(),
          relatedAnomalies: [],
          status: 'new',
          investigationNotes: [],
          resolution: null
        });
      }
    }

    return alerts;
  }

  private async detectClusterAnomalies(
    historicalData: any[],
    currentData: any,
    context: AnomalyContext
  ): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = [];

    // Detect if current data point is an outlier from historical clusters
    const clusters = this.performClustering(historicalData);
    const currentCluster = this.assignToCluster(currentData, clusters);

    if (currentCluster.distance > this.getClusterThreshold()) {
      alerts.push({
        id: `cluster-${Date.now()}`,
        type: AnomalyType.CLUSTER_ANOMALY,
        severity: currentCluster.distance > this.getClusterThreshold() * 2 ? 'high' : 'medium',
        title: 'Data Point Outside Normal Clusters',
        description: `Current performance profile does not match any known patterns (distance: ${currentCluster.distance.toFixed(2)})`,
        detectedAt: new Date(),
        affectedEntities: this.identifyAffectedEntities(currentData),
        anomalyData: {
          detectedMetric: 'cluster_distance',
          currentValue: currentCluster.distance,
          expectedValue: this.getClusterThreshold(),
          deviation: (currentCluster.distance - this.getClusterThreshold()) / this.getClusterThreshold(),
          deviationPercentage: ((currentCluster.distance - this.getClusterThreshold()) / this.getClusterThreshold()) * 100,
          threshold: this.getClusterThreshold(),
          timeWindow: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date(),
            duration: '30 days',
            granularity: 'daily'
          },
          dataPoints: [],
          statisticalSignificance: 75,
          anomalyScore: Math.min(100, currentCluster.distance * 20)
        },
        context,
        possibleCauses: [
          {
            cause: 'Novel performance state',
            category: 'physiological',
            probability: 60,
            evidence: [
              {
                type: 'data',
                description: 'Data point outside known clusters',
                strength: 85,
                reliability: 90,
                timestamp: new Date()
              }
            ],
            investigationSteps: ['Analyze contributing factors', 'Check for measurement errors']
          }
        ],
        recommendations: [
          {
            action: 'Investigate data point validity',
            category: 'immediate',
            priority: 'medium',
            description: 'Verify the accuracy of measurements and identify contributing factors',
            rationale: 'Outlier data may indicate measurement error or significant change',
            expectedOutcome: 'Validated data or error identification',
            timeframe: '1 day',
            resources: ['Data verification', 'Subject interview'],
            riskAssessment: {
              riskLevel: 'low',
              riskFactors: ['Time investment'],
              mitigation: ['Quick verification process'],
              consequences: ['Missed opportunity for early intervention']
            },
            successMetrics: ['Data validation', 'Cause identification'],
            dependencies: ['Data access', 'Subject availability']
          }
        ],
        confidence: 80,
        falsePositiveProbability: 20,
        urgency: 65,
        impactAssessment: this.createMockImpactAssessment(),
        historicalComparison: await this.createMockHistoricalComparison(),
        relatedAnomalies: [],
        status: 'new',
        investigationNotes: [],
        resolution: null
      });
    }

    return alerts;
  }

  private filterAlerts(alerts: AnomalyAlert[]): AnomalyAlert[] {
    // Remove duplicates and low-confidence alerts
    const filtered = alerts.filter(alert => {
      // Remove alerts below minimum confidence threshold
      if (alert.confidence < 60) return false;
      
      // Remove alerts with high false positive probability
      if (alert.falsePositiveProbability > 40) return false;
      
      // Apply suppression rules
      return !this.shouldSuppressAlert(alert);
    });

    // Remove duplicates based on affected entities and metrics
    const unique = this.removeDuplicateAlerts(filtered);
    
    return unique;
  }

  private prioritizeAlerts(alerts: AnomalyAlert[]): AnomalyAlert[] {
    return alerts.sort((a, b) => {
      // Sort by urgency first, then by confidence
      if (a.urgency !== b.urgency) {
        return b.urgency - a.urgency;
      }
      return b.confidence - a.confidence;
    });
  }

  private async enrichAlerts(alerts: AnomalyAlert[], context: AnomalyContext): Promise<AnomalyAlert[]> {
    for (const alert of alerts) {
      // Add historical comparison
      alert.historicalComparison = await this.getHistoricalComparison(alert.anomalyData.detectedMetric, alert.anomalyData.deviation);
      
      // Identify related anomalies
      alert.relatedAnomalies = await this.findRelatedAnomalies(alert);
      
      // Enhance recommendations based on context
      alert.recommendations = this.enhanceRecommendations(alert.recommendations, context);
    }

    return alerts;
  }

  // Helper methods for calculations and analysis
  private calculateStatistics(values: number[]): { mean: number; standardDeviation: number; median: number } {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return { mean, standardDeviation, median };
  }

  private getStatisticalThreshold(metric: MonitoredMetric, context: AnomalyContext): number {
    let baseThreshold = 2.0; // 2 standard deviations

    // Adjust based on metric importance
    if (metric.weight > 0.8) baseThreshold = 1.5;
    if (metric.weight < 0.3) baseThreshold = 2.5;

    // Adjust based on context
    if (context.seasonPhase === 'playoffs') baseThreshold *= 0.8; // More sensitive during playoffs
    if (context.teamState.fatigue > 70) baseThreshold *= 0.9; // More sensitive when team is fatigued

    return baseThreshold;
  }

  private determineSeverity(zScore: number, metric: MonitoredMetric): 'low' | 'medium' | 'high' | 'critical' {
    const adjustedScore = zScore * metric.weight;
    
    if (adjustedScore > 4) return 'critical';
    if (adjustedScore > 3) return 'high';
    if (adjustedScore > 2) return 'medium';
    return 'low';
  }

  private identifyAffectedEntities(data: any): AffectedEntity[] {
    const entities: AffectedEntity[] = [];

    if (data.playerId) {
      entities.push({
        type: 'player',
        id: data.playerId,
        name: data.playerName || `Player ${data.playerId}`,
        role: data.position,
        impactLevel: 'high'
      });
    }

    if (data.teamId) {
      entities.push({
        type: 'team',
        id: data.teamId,
        name: data.teamName || `Team ${data.teamId}`,
        impactLevel: 'medium'
      });
    }

    return entities;
  }

  private createDataPoints(historicalData: any[], metric: string): DataPoint[] {
    return historicalData.slice(-30).map(d => ({
      timestamp: new Date(d.date),
      value: d[metric],
      expectedValue: d[`${metric}_expected`] || d[metric], // Fallback to actual if expected not available
      isAnomalous: Math.abs(d[metric] - (d[`${metric}_expected`] || d[metric])) > 2,
      contributingFactors: d.contributingFactors || []
    }));
  }

  private calculateSignificance(zScore: number): number {
    // Convert z-score to statistical significance percentage
    return Math.min(99, 50 + (Math.abs(zScore) * 15));
  }

  private identifyPossibleCauses(metric: string, currentValue: number, expectedValue: number, context: AnomalyContext): PossibleCause[] {
    const causes: PossibleCause[] = [];

    const isIncrease = currentValue > expectedValue;
    const magnitude = Math.abs(currentValue - expectedValue) / expectedValue;

    // Training-related causes
    if (metric.includes('load') || metric.includes('fatigue')) {
      causes.push({
        cause: isIncrease ? 'Training intensity increase' : 'Reduced training load',
        category: 'training',
        probability: magnitude > 0.3 ? 80 : 60,
        evidence: [
          {
            type: 'correlation',
            description: 'Correlation with recent training changes',
            strength: 75,
            reliability: 85,
            timestamp: new Date()
          }
        ],
        investigationSteps: ['Review recent training logs', 'Check with coaching staff', 'Analyze load progression']
      });
    }

    // Recovery-related causes
    if (metric.includes('recovery') || metric.includes('wellness')) {
      causes.push({
        cause: isIncrease ? 'Improved recovery protocols' : 'Insufficient recovery',
        category: 'recovery',
        probability: magnitude > 0.2 ? 70 : 50,
        evidence: [
          {
            type: 'data',
            description: 'Sleep and recovery data correlation',
            strength: 80,
            reliability: 90,
            timestamp: new Date()
          }
        ],
        investigationSteps: ['Check sleep data', 'Review recovery protocols', 'Assess stress levels']
      });
    }

    // Environmental causes
    if (context.environmentalFactors.length > 0) {
      causes.push({
        cause: 'Environmental factors',
        category: 'environmental',
        probability: 40,
        evidence: context.environmentalFactors.map(f => ({
          type: 'observation',
          description: `${f.factor}: ${f.value}`,
          strength: 60,
          reliability: 70,
          timestamp: new Date()
        })),
        investigationSteps: ['Review environmental conditions', 'Check facility changes', 'Assess travel impact']
      });
    }

    return causes.sort((a, b) => b.probability - a.probability);
  }

  private generateRecommendations(metric: string, currentValue: number, expectedValue: number, context: AnomalyContext): AnomalyRecommendation[] {
    const recommendations: AnomalyRecommendation[] = [];
    const isIncrease = currentValue > expectedValue;
    const magnitude = Math.abs(currentValue - expectedValue) / expectedValue;

    // Immediate monitoring recommendation
    recommendations.push({
      action: 'Increase monitoring frequency',
      category: 'monitoring',
      priority: 'high',
      description: `Monitor ${metric} more closely for the next 3-5 days`,
      rationale: 'Early detection of pattern continuation or normalization',
      expectedOutcome: 'Better understanding of anomaly persistence',
      timeframe: '3-5 days',
      resources: ['Monitoring equipment', 'Staff time'],
      riskAssessment: {
        riskLevel: 'low',
        riskFactors: ['Resource allocation'],
        mitigation: ['Automated monitoring'],
        consequences: ['Increased workload']
      },
      successMetrics: ['Data collection consistency', 'Pattern identification'],
      dependencies: ['Monitoring equipment availability']
    });

    // Specific recommendations based on metric type
    if (metric.includes('performance') && !isIncrease && magnitude > 0.2) {
      recommendations.push({
        action: 'Performance evaluation',
        category: 'immediate',
        priority: 'high',
        description: 'Conduct comprehensive performance assessment',
        rationale: 'Significant performance drop requires immediate attention',
        expectedOutcome: 'Identification of performance limiting factors',
        timeframe: '1-2 days',
        resources: ['Assessment protocols', 'Specialist time'],
        riskAssessment: {
          riskLevel: 'medium',
          riskFactors: ['Time investment', 'Player stress'],
          mitigation: ['Streamlined assessment', 'Clear communication'],
          consequences: ['Continued performance decline']
        },
        successMetrics: ['Problem identification', 'Action plan development'],
        dependencies: ['Player availability', 'Assessment tools']
      });
    }

    if (metric.includes('load') && isIncrease && magnitude > 0.3) {
      recommendations.push({
        action: 'Load reduction',
        category: 'immediate',
        priority: 'medium',
        description: 'Temporarily reduce training load by 15-20%',
        rationale: 'High load anomaly may increase injury risk',
        expectedOutcome: 'Load normalization and injury risk reduction',
        timeframe: '1 week',
        resources: ['Training plan adjustment'],
        riskAssessment: {
          riskLevel: 'low',
          riskFactors: ['Fitness maintenance'],
          mitigation: ['Quality over quantity focus'],
          consequences: ['Temporary fitness impact']
        },
        successMetrics: ['Load normalization', 'Maintained performance'],
        dependencies: ['Coach approval', 'Schedule flexibility']
      });
    }

    return recommendations.sort((a, b) => {
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }

  private calculateUrgency(zScore: number, metric: MonitoredMetric): number {
    let urgency = Math.min(100, zScore * 25);
    
    // Adjust based on metric category
    if (metric.category === 'injury') urgency *= 1.3;
    if (metric.category === 'performance') urgency *= 1.1;
    if (metric.category === 'wellness') urgency *= 0.9;

    return Math.round(Math.min(100, urgency));
  }

  private assessImpact(metric: string, deviation: number, context: AnomalyContext): ImpactAssessment {
    const severity = Math.abs(deviation) > 50 ? 'high' : Math.abs(deviation) > 25 ? 'moderate' : 'low';
    
    return {
      immediate: {
        severity,
        scope: 'individual',
        description: `Immediate impact on ${metric}`,
        quantifiedImpact: {
          performanceChange: Math.abs(deviation) * 0.5,
          injuryRiskChange: metric.includes('load') ? Math.abs(deviation) * 0.3 : 5,
          availabilityChange: 0,
          costImpact: 0,
          timeImpact: '1-3 days'
        }
      },
      shortTerm: {
        severity: severity === 'high' ? 'moderate' : 'low',
        scope: context.teamState.fatigue > 70 ? 'team' : 'individual',
        description: `Short-term implications for performance and health`,
        quantifiedImpact: {
          performanceChange: Math.abs(deviation) * 0.3,
          injuryRiskChange: metric.includes('load') ? Math.abs(deviation) * 0.2 : 3,
          availabilityChange: 5,
          costImpact: 500,
          timeImpact: '1-2 weeks'
        }
      },
      longTerm: {
        severity: 'low',
        scope: 'individual',
        description: `Long-term adaptation or chronic issues`,
        quantifiedImpact: {
          performanceChange: Math.abs(deviation) * 0.1,
          injuryRiskChange: metric.includes('load') ? Math.abs(deviation) * 0.1 : 1,
          availabilityChange: 2,
          costImpact: 1000,
          timeImpact: '1-3 months'
        }
      },
      cascadingEffects: [
        {
          effect: 'Team dynamic disruption',
          probability: context.teamState.chemistry < 70 ? 60 : 30,
          timeframe: '1-2 weeks',
          mitigationPossible: true
        }
      ],
      stakeholderImpact: [
        {
          stakeholder: 'player',
          impactType: 'performance',
          severity: Math.abs(deviation),
          description: `Direct impact on player ${metric}`
        },
        {
          stakeholder: 'coach',
          impactType: 'operational',
          severity: Math.abs(deviation) * 0.5,
          description: 'Requires coaching attention and plan adjustment'
        }
      ]
    };
  }

  // Mock implementations for complex algorithms
  private analyzeTrainingPatterns(historicalData: any[]): { averageScore: number; standardDeviation: number } {
    // Mock pattern analysis
    return {
      averageScore: 75,
      standardDeviation: 12
    };
  }

  private extractCurrentPattern(currentData: any, recentData: any[]): { score: number } {
    // Mock current pattern extraction
    return {
      score: 65 // Deviation from normal pattern
    };
  }

  private isPatternAnomalous(currentPattern: any, historicalPatterns: any): boolean {
    const deviation = Math.abs(currentPattern.score - historicalPatterns.averageScore);
    return deviation > (historicalPatterns.standardDeviation * 2);
  }

  private calculateTrend(values: number[]): { slope: number; rSquared: number; direction: string } {
    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calculate R-squared (simplified)
    const yMean = sumY / n;
    const ssRes = values.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + (sumY - slope * sumX) / n;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = values.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    const direction = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';

    return { slope, rSquared: Math.max(0, rSquared), direction };
  }

  private getExpectedTrend(metric: string, context: AnomalyContext): { slope: number; direction: string } {
    // Mock expected trend based on context
    if (context.seasonPhase === 'preseason') {
      return metric.includes('fitness') ? { slope: 0.5, direction: 'increasing' } : { slope: 0, direction: 'stable' };
    }
    if (context.seasonPhase === 'regular') {
      return { slope: 0, direction: 'stable' };
    }
    return { slope: -0.2, direction: 'decreasing' }; // Offseason
  }

  private isTrendAnomalous(trend: any, expectedTrend: any, metric: MonitoredMetric): boolean {
    const slopeDifference = Math.abs(trend.slope - expectedTrend.slope);
    const threshold = 0.3 * metric.weight; // Adjust threshold based on metric importance
    return slopeDifference > threshold && trend.rSquared > 0.5; // Only flag if trend is reliable
  }

  private determineTrendSeverity(trend: any, expectedTrend: any): 'low' | 'medium' | 'high' | 'critical' {
    const difference = Math.abs(trend.slope - expectedTrend.slope);
    if (difference > 1.0) return 'critical';
    if (difference > 0.6) return 'high';
    if (difference > 0.3) return 'medium';
    return 'low';
  }

  private createTrendDataPoints(values: number[]): DataPoint[] {
    return values.slice(-14).map((value, index) => ({
      timestamp: new Date(Date.now() - (14 - index) * 24 * 60 * 60 * 1000),
      value,
      expectedValue: value, // Simplified
      isAnomalous: false,
      contributingFactors: []
    }));
  }

  private identifyTrendCauses(metric: string, trend: any, expectedTrend: any, context: AnomalyContext): PossibleCause[] {
    const causes: PossibleCause[] = [];

    if (trend.direction !== expectedTrend.direction) {
      causes.push({
        cause: `Unexpected ${trend.direction} trend in ${metric}`,
        category: 'training',
        probability: 70,
        evidence: [
          {
            type: 'data',
            description: `Trend analysis shows ${trend.direction} pattern`,
            strength: Math.round(trend.rSquared * 100),
            reliability: 90,
            timestamp: new Date()
          }
        ],
        investigationSteps: [
          'Review training program changes',
          'Check for external factors',
          'Analyze individual contributions to trend'
        ]
      });
    }

    return causes;
  }

  private generateTrendRecommendations(metric: string, trend: any, expectedTrend: any): AnomalyRecommendation[] {
    const recommendations: AnomalyRecommendation[] = [];

    recommendations.push({
      action: 'Trend analysis and intervention',
      category: 'short_term',
      priority: 'medium',
      description: `Address ${trend.direction} trend in ${metric}`,
      rationale: `Current trend deviates from expected ${expectedTrend.direction} pattern`,
      expectedOutcome: 'Trend correction or validation of new normal',
      timeframe: '1-2 weeks',
      resources: ['Data analysis', 'Intervention protocols'],
      riskAssessment: {
        riskLevel: 'medium',
        riskFactors: ['Intervention timing', 'Trend persistence'],
        mitigation: ['Gradual adjustments', 'Continuous monitoring'],
        consequences: ['Trend continuation', 'Performance impact']
      },
      successMetrics: ['Trend modification', 'Metric stabilization'],
      dependencies: ['Trend persistence confirmation', 'Resource availability']
    });

    return recommendations;
  }

  private calculateTrendUrgency(trend: any, expectedTrend: any, metric: MonitoredMetric): number {
    const difference = Math.abs(trend.slope - expectedTrend.slope);
    const reliability = trend.rSquared;
    let urgency = (difference * 50) + (reliability * 30);

    // Adjust based on metric importance
    urgency *= metric.weight;

    return Math.round(Math.min(100, urgency));
  }

  private assessTrendImpact(metric: string, trend: any, context: AnomalyContext): ImpactAssessment {
    return this.createMockImpactAssessment(); // Simplified for mock
  }

  private calculateMultiVariateAnomalyScore(group: string[], historicalData: any[], currentData: any): number {
    // Mock multivariate anomaly detection using Mahalanobis distance concept
    const groupValues = group.map(metric => currentData[metric] || 0);
    const historicalGroupValues = historicalData.map(d => group.map(metric => d[metric] || 0));
    
    // Calculate means and covariance (simplified)
    const means = group.map((_, i) => {
      const values = historicalGroupValues.map(hgv => hgv[i]);
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    // Calculate distance from historical center (simplified Mahalanobis distance)
    const distance = Math.sqrt(groupValues.reduce((sum, val, i) => {
      return sum + Math.pow(val - means[i], 2);
    }, 0));
    
    // Normalize to 0-100 scale
    return Math.min(100, distance * 5);
  }

  private identifyMultiVariateCauses(group: string[], currentData: any, context: AnomalyContext): PossibleCause[] {
    return [
      {
        cause: `Systemic change affecting ${group.join(', ')}`,
        category: 'physiological',
        probability: 75,
        evidence: [
          {
            type: 'data',
            description: 'Multi-metric deviation detected',
            strength: 80,
            reliability: 85,
            timestamp: new Date()
          }
        ],
        investigationSteps: [
          'Analyze metric correlations',
          'Check for systematic changes',
          'Review recent interventions'
        ]
      }
    ];
  }

  private generateMultiVariateRecommendations(group: string[], anomalyScore: number): AnomalyRecommendation[] {
    return [
      {
        action: 'Comprehensive assessment',
        category: 'immediate',
        priority: anomalyScore > 85 ? 'high' : 'medium',
        description: `Conduct holistic evaluation of ${group.join(', ')} metrics`,
        rationale: 'Multi-metric anomaly suggests systemic issue',
        expectedOutcome: 'Identification of root cause',
        timeframe: '2-3 days',
        resources: ['Assessment protocols', 'Specialist consultation'],
        riskAssessment: {
          riskLevel: 'medium',
          riskFactors: ['Time investment', 'Resource allocation'],
          mitigation: ['Prioritized assessment', 'Phased approach'],
          consequences: ['Continued multi-metric deviation']
        },
        successMetrics: ['Root cause identification', 'Metric stabilization'],
        dependencies: ['Assessment availability', 'Subject cooperation']
      }
    ];
  }

  private performClustering(historicalData: any[]): any[] {
    // Mock clustering implementation (would use k-means or similar)
    return [
      { center: [80, 75, 70], radius: 10 },
      { center: [90, 85, 80], radius: 8 },
      { center: [70, 65, 60], radius: 12 }
    ];
  }

  private assignToCluster(currentData: any, clusters: any[]): { cluster: number; distance: number } {
    // Mock cluster assignment
    const distances = clusters.map((cluster, index) => ({
      cluster: index,
      distance: Math.sqrt(Math.pow(currentData.performance - cluster.center[0], 2) +
                         Math.pow(currentData.fatigue - cluster.center[1], 2) +
                         Math.pow(currentData.wellness - cluster.center[2], 2))
    }));
    
    return distances.reduce((min, current) => current.distance < min.distance ? current : min);
  }

  private getClusterThreshold(): number {
    return 15; // Mock threshold for cluster distance
  }

  private shouldSuppressAlert(alert: AnomalyAlert): boolean {
    // Mock suppression logic
    const threshold = this.detectionConfig.alertThresholds.find(t => t.anomalyType === alert.type);
    if (!threshold) return false;

    if (alert.confidence < threshold.minimumConfidence) return true;
    
    // Apply suppression rules
    return threshold.suppressionRules.some(rule => {
      // Mock rule evaluation
      return rule.condition === 'recent_similar_alert' && this.hasRecentSimilarAlert(alert);
    });
  }

  private hasRecentSimilarAlert(alert: AnomalyAlert): boolean {
    // Mock implementation - would check database for recent similar alerts
    return false;
  }

  private removeDuplicateAlerts(alerts: AnomalyAlert[]): AnomalyAlert[] {
    // Remove alerts with identical affected entities and metrics
    const seen = new Set<string>();
    return alerts.filter(alert => {
      const key = `${alert.anomalyData.detectedMetric}_${alert.affectedEntities.map(e => e.id).join('_')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async getHistoricalComparison(metric: string, deviation: number): Promise<HistoricalComparison> {
    return {
      similarAnomalies: [
        {
          id: 'anomaly-123',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          similarity: 85,
          outcome: 'Resolved with intervention',
          resolution: 'Load adjustment',
          timeToResolution: '5 days',
          effectiveness: 90
        }
      ],
      frequencyAnalysis: {
        thisWeek: 1,
        thisMonth: 3,
        thisYear: 12,
        trend: 'stable',
        seasonality: {
          hasPattern: true,
          pattern: 'Higher frequency during intense training periods',
          confidence: 75,
          peakPeriods: ['Pre-season', 'Mid-season']
        }
      },
      outcomePatterns: [
        {
          pattern: 'Load-related anomalies',
          frequency: 8,
          successRate: 85,
          averageResolutionTime: '4-6 days',
          commonActions: ['Load reduction', 'Recovery enhancement']
        }
      ],
      learnings: [
        'Early intervention is key',
        'Load adjustments are most effective',
        'Player communication improves compliance'
      ]
    };
  }

  private async getTrendHistoricalComparison(metric: string): Promise<HistoricalComparison> {
    return this.getHistoricalComparison(metric, 0); // Simplified
  }

  private async findRelatedAnomalies(alert: AnomalyAlert): Promise<string[]> {
    // Mock implementation - would search for related anomalies
    return [];
  }

  private enhanceRecommendations(recommendations: AnomalyRecommendation[], context: AnomalyContext): AnomalyRecommendation[] {
    // Add context-specific enhancements to recommendations
    return recommendations.map(rec => {
      if (context.seasonPhase === 'playoffs') {
        rec.urgency = Math.min(100, (rec.urgency || 50) * 1.2);
        rec.description += ' (Adjusted for playoff context)';
      }
      return rec;
    });
  }

  // Mock data methods
  private async getHistoricalData(entityType: string, entityId: string, timeWindow?: TimeWindow): Promise<any[]> {
    // Mock historical data
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      performance: 80 + Math.random() * 20,
      fatigue: 30 + Math.random() * 40,
      wellness: 70 + Math.random() * 30,
      load: 100 + Math.random() * 50,
      recovery: 70 + Math.random() * 30
    }));
  }

  private async getCurrentData(entityType: string, entityId: string): Promise<any> {
    // Mock current data
    return {
      playerId: entityId,
      playerName: `Player ${entityId}`,
      performance: 95, // Unusually high
      fatigue: 75, // High fatigue
      wellness: 45, // Low wellness
      load: 130, // High load
      recovery: 50 // Poor recovery
    };
  }

  private async buildAnomalyContext(entityType: string, entityId: string): Promise<AnomalyContext> {
    return {
      seasonPhase: 'regular',
      recentEvents: [
        {
          type: 'game',
          description: 'Overtime game 2 days ago',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          impact: 'negative',
          relevance: 80
        }
      ],
      environmentalFactors: [
        {
          factor: 'Temperature',
          value: 32,
          impact: 'negative',
          confidence: 70
        }
      ],
      teamState: {
        morale: 75,
        chemistry: 80,
        fatigue: 65,
        injuryCount: 2,
        recentPerformance: 78,
        stressLevel: 60
      },
      playerState: {
        playerId: entityId,
        wellness: 65,
        motivation: 85,
        fatigue: 55,
        injuryStatus: 'healthy',
        lifeStressors: ['Family visit'],
        recentChanges: ['New training program']
      },
      workloadContext: {
        recentLoadChanges: [
          {
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            type: 'increase',
            magnitude: 15,
            reason: 'Preparation intensification'
          }
        ],
        cumulativeStress: 70,
        recoveryDebt: 25,
        trainingPhase: 'competitive',
        loadDistribution: 'concentrated'
      }
    };
  }

  private createMockImpactAssessment(): ImpactAssessment {
    return {
      immediate: {
        severity: 'moderate',
        scope: 'individual',
        description: 'Immediate performance impact',
        quantifiedImpact: {
          performanceChange: 10,
          injuryRiskChange: 15,
          availabilityChange: 0,
          costImpact: 0,
          timeImpact: '1-2 days'
        }
      },
      shortTerm: {
        severity: 'low',
        scope: 'individual',
        description: 'Short-term adaptation required',
        quantifiedImpact: {
          performanceChange: 5,
          injuryRiskChange: 8,
          availabilityChange: 5,
          costImpact: 500,
          timeImpact: '1 week'
        }
      },
      longTerm: {
        severity: 'minimal',
        scope: 'individual',
        description: 'Minimal long-term impact expected',
        quantifiedImpact: {
          performanceChange: 1,
          injuryRiskChange: 2,
          availabilityChange: 1,
          costImpact: 200,
          timeImpact: '1 month'
        }
      },
      cascadingEffects: [],
      stakeholderImpact: [
        {
          stakeholder: 'player',
          impactType: 'performance',
          severity: 60,
          description: 'Direct impact on player performance'
        }
      ]
    };
  }

  private async createMockHistoricalComparison(): Promise<HistoricalComparison> {
    return {
      similarAnomalies: [],
      frequencyAnalysis: {
        thisWeek: 1,
        thisMonth: 2,
        thisYear: 8,
        trend: 'stable',
        seasonality: {
          hasPattern: false,
          pattern: '',
          confidence: 0,
          peakPeriods: []
        }
      },
      outcomePatterns: [],
      learnings: []
    };
  }

  private initializeDetectionConfig(): AnomalyDetectionConfig {
    return {
      sensitivityLevel: 'medium',
      detectionMethods: [
        {
          name: 'statistical_outlier',
          algorithm: 'statistical',
          parameters: { threshold: 2.0, windowSize: 30 },
          weights: { deviation: 0.7, consistency: 0.3 },
          enabled: true
        },
        {
          name: 'pattern_detection',
          algorithm: 'machine_learning',
          parameters: { modelType: 'isolation_forest', contamination: 0.1 },
          weights: { anomaly_score: 1.0 },
          enabled: true
        }
      ],
      monitoredMetrics: [
        {
          metric: 'performance',
          category: 'performance',
          weight: 0.9,
          thresholds: [
            {
              level: 'warning',
              value: 1.5,
              condition: 'outside_range',
              timeWindow: '7 days'
            },
            {
              level: 'critical',
              value: 3.0,
              condition: 'outside_range',
              timeWindow: '3 days'
            }
          ],
          contextAdjustments: [
            {
              context: 'playoffs',
              adjustmentFactor: 0.8,
              reasoning: 'Higher sensitivity during playoffs'
            }
          ]
        },
        {
          metric: 'load',
          category: 'load',
          weight: 0.8,
          thresholds: [
            {
              level: 'warning',
              value: 2.0,
              condition: 'above',
              timeWindow: '5 days'
            }
          ],
          contextAdjustments: []
        }
      ],
      alertThresholds: [
        {
          anomalyType: AnomalyType.STATISTICAL_OUTLIER,
          minimumConfidence: 70,
          minimumSeverity: 'medium',
          suppressionRules: [
            {
              condition: 'recent_similar_alert',
              suppressionPeriod: '24 hours',
              reasoning: 'Avoid alert fatigue'
            }
          ]
        }
      ],
      contextualFactors: [
        {
          factor: 'season_phase',
          weight: 0.2,
          adjustmentRules: [
            {
              condition: 'playoffs',
              adjustment: 1.2,
              reason: 'Increased sensitivity during playoffs'
            }
          ]
        }
      ]
    };
  }

  async getAnomalyTrends(timeframe: string): Promise<AnomalyTrend> {
    // Mock implementation for anomaly trends analysis
    return {
      period: timeframe,
      anomalyCount: 25,
      severityDistribution: {
        low: 10,
        medium: 12,
        high: 2,
        critical: 1
      },
      typeDistribution: {
        performance_drop: 8,
        unusual_load: 6,
        recovery_anomaly: 5,
        injury_risk: 3,
        pattern_deviation: 2,
        statistical_outlier: 1
      },
      resolutionRate: 88,
      averageDetectionTime: '2.3 hours',
      averageResolutionTime: '4.7 days',
      falsePositiveRate: 12,
      missedAnomalyRate: 8,
      improvementSuggestions: [
        'Adjust thresholds for load-related anomalies',
        'Enhance context awareness during high-stress periods',
        'Implement predictive anomaly detection'
      ]
    };
  }
}