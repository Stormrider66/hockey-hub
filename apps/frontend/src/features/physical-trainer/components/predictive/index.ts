// Predictive Analytics Components for Hockey Hub Physical Trainer Dashboard
// Phase 8: Analytics & Performance Insights Implementation

// Core Components
export { FatigueMonitor } from './FatigueMonitor';
export { PredictiveInsightsPanel } from './PredictiveInsightsPanel';
export { InjuryRiskIndicator } from './InjuryRiskIndicator';
export { RecoveryRecommendations } from './RecoveryRecommendations';
export { PlateauDetectionAlert } from './PlateauDetectionAlert';
export { RiskFactorsBreakdown } from './RiskFactorsBreakdown';

// Dashboard Components
export { FatigueMonitoringPanel } from './FatigueMonitoringPanel';
export { InjuryRiskDashboard } from './InjuryRiskDashboard';
export { LoadRecommendationWidget } from './LoadRecommendationWidget';

// Types and Interfaces
export interface PredictiveInsight {
  id: string;
  playerId: string;
  type: 'fatigue' | 'injury_risk' | 'performance' | 'readiness';
  riskScore: number;
  confidence: number;
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

export interface FatigueData {
  currentFatigueLevel: number;
  fatigueVelocity: number;
  projectedPeakFatigue: Date;
  recoveryRecommendations: string[];
  warningThresholds: {
    yellow: number;
    red: number;
  };
}

export interface InjuryRiskData {
  overallRisk: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;
  bodyPartRisks: Array<{
    bodyPart: string;
    risk: number;
    injuryTypes: string[];
    preventionPriority: 'low' | 'medium' | 'high';
  }>;
  preventionRecommendations: Array<{
    category: string;
    actions: string[];
    timeframe: string;
    effectiveness: number;
  }>;
}

export interface LoadRecommendation {
  playerId: string;
  playerName: string;
  currentLoad: number;
  recommendedLoad: number;
  adjustmentPercentage: number;
  adjustmentType: 'increase' | 'decrease' | 'maintain';
  reasoning: string[];
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedOutcomes: {
    performanceGain: number;
    injuryRiskChange: number;
    fatigueImpact: number;
  };
}

export interface PlateauData {
  plateauDetected: boolean;
  plateauDuration: number;
  plateauConfidence: number;
  breakoutProbability: number;
  recommendations: Array<{
    strategy: string;
    category: 'training' | 'recovery' | 'nutrition' | 'psychology';
    expectedImpact: number;
    timeToEffect: number;
    difficulty: 'low' | 'medium' | 'high';
  }>;
}

export interface RecoveryData {
  currentRecoveryLevel: number;
  estimatedFullRecovery: Date;
  recoveryVelocity: number;
  readinessScore: number;
  recoveryPhases: Array<{
    phase: string;
    duration: number;
    activities: string[];
    intensity: 'rest' | 'light' | 'moderate' | 'normal';
    status: 'pending' | 'current' | 'completed';
  }>;
}