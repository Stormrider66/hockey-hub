/**
 * Predictive Analytics Engine Types
 * Comprehensive type definitions for player health and performance predictions
 */

// Base Types
export interface PlayerMetrics {
  playerId: string;
  playerName: string;
  position: string;
  age: number;
  weight: number;
  height: number;
  teamId: string;
}

export interface WorkloadData {
  date: Date;
  duration: number; // minutes
  intensity: number; // 0-10 scale
  type: 'strength' | 'conditioning' | 'hybrid' | 'agility' | 'game' | 'practice';
  tss: number; // Training Stress Score
  rpe: number; // Rate of Perceived Exertion (1-10)
  distance?: number; // meters
  heartRateAvg?: number;
  heartRateMax?: number;
}

export interface MedicalHistory {
  injuryDate: Date;
  injuryType: string;
  severity: 'minor' | 'moderate' | 'severe';
  recoveryDays: number;
  bodyPart: string;
  recurrence: boolean;
}

// Fatigue Prediction Types
export interface FatiguePrediction {
  playerId: string;
  currentFatigue: number; // 0-100
  predictedFatigue: number; // 0-100
  trend: 'increasing' | 'stable' | 'decreasing';
  acuteLoad: number; // 7-day load
  chronicLoad: number; // 28-day load
  acwr: number; // Acute:Chronic Workload Ratio
  recommendation: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  confidenceScore: number; // 0-1
}

// Injury Risk Types
export interface InjuryRiskAssessment {
  playerId: string;
  overallRisk: number; // 0-100
  riskFactors: RiskFactor[];
  primaryConcern: string;
  preventionStrategies: string[];
  monitoringPriority: 'low' | 'medium' | 'high' | 'critical';
  nextAssessmentDate: Date;
  confidenceScore: number; // 0-1
}

export interface RiskFactor {
  factor: string;
  weight: number; // 0-1
  currentValue: number;
  threshold: number;
  contribution: number; // percentage contribution to overall risk
  trend: 'improving' | 'stable' | 'worsening';
}

// Recovery Time Types
export interface RecoveryEstimation {
  playerId: string;
  currentRecoveryStatus: number; // 0-100 (100 = fully recovered)
  estimatedHoursToFullRecovery: number;
  recoveryFactors: RecoveryFactor[];
  recommendations: RecoveryRecommendation[];
  nextWorkoutReadiness: Date;
  optimalIntensity: number; // 0-10
}

export interface RecoveryFactor {
  factor: string;
  impact: 'positive' | 'negative';
  magnitude: number; // -1 to 1
  description: string;
}

export interface RecoveryRecommendation {
  category: 'sleep' | 'nutrition' | 'hydration' | 'activity' | 'treatment';
  priority: 'low' | 'medium' | 'high';
  action: string;
  expectedBenefit: string;
}

// Performance Optimization Types
export interface PerformanceAnalysis {
  playerId: string;
  currentPerformanceIndex: number; // 0-100
  plateauDetected: boolean;
  plateauDuration?: number; // days
  performanceTrend: PerformanceTrend;
  optimalLoadRange: LoadRange;
  recommendations: OptimizationRecommendation[];
  projectedImprovement: number; // percentage
}

export interface PerformanceTrend {
  shortTerm: 'improving' | 'stable' | 'declining'; // 7 days
  mediumTerm: 'improving' | 'stable' | 'declining'; // 30 days
  longTerm: 'improving' | 'stable' | 'declining'; // 90 days
  keyMetrics: {
    power?: number;
    endurance?: number;
    speed?: number;
    strength?: number;
  };
}

export interface LoadRange {
  minIntensity: number;
  maxIntensity: number;
  optimalIntensity: number;
  minDuration: number;
  maxDuration: number;
  optimalDuration: number;
  weeklyVolume: number;
}

export interface OptimizationRecommendation {
  type: 'load_adjustment' | 'exercise_variation' | 'recovery_focus' | 'skill_development';
  priority: number; // 1-5
  description: string;
  expectedOutcome: string;
  timeframe: string;
}

// Alert System Types
export interface AnalyticsAlert {
  id: string;
  playerId: string;
  playerName: string;
  type: 'fatigue' | 'injury_risk' | 'recovery' | 'performance' | 'load';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  recommendations: string[];
  timestamp: Date;
  acknowledged: boolean;
  expiresAt?: Date;
}

// Aggregate Analytics Types
export interface TeamAnalytics {
  teamId: string;
  date: Date;
  averageFatigue: number;
  playersAtRisk: number;
  teamReadiness: number; // 0-100
  alerts: AnalyticsAlert[];
  trends: {
    fatigue: 'improving' | 'stable' | 'worsening';
    injuries: 'improving' | 'stable' | 'worsening';
    performance: 'improving' | 'stable' | 'worsening';
  };
}

// Configuration Types
export interface AnalyticsConfig {
  acwrThresholds: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  fatigueThresholds: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  injuryRiskWeights: {
    workload: number;
    history: number;
    biomechanics: number;
    recovery: number;
    age: number;
  };
  updateFrequency: number; // minutes
  historicalDataWindow: number; // days
}

// Utility Types
export interface TimeSeriesData<T> {
  timestamp: Date;
  value: T;
}

export interface PredictionResult<T> {
  prediction: T;
  confidence: number;
  factors: string[];
  timestamp: Date;
}

export interface AnalyticsResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    calculationTime: number;
    dataPoints: number;
    lastUpdated: Date;
  };
}