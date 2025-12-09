/**
 * Medical Analytics Types
 * 
 * Type definitions for medical data integration with performance analytics.
 * Ensures HIPAA compliance and data privacy throughout the system.
 */

import { BaseEntity, Player, TestResult, WorkoutSession } from './base-types';
import { Injury, Treatment, MedicalReport } from '@/store/api/medicalApi';

// Medical Analytics Data Types
export interface InjuryAnalytics extends BaseEntity {
  playerId: string;
  playerName: string;
  injuries: InjuryWithAnalytics[];
  recoveryTimeline: RecoveryTimelineData[];
  riskFactors: RiskFactor[];
  workloadCorrelation: WorkloadInjuryData[];
  preventionRecommendations: string[];
  currentRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
}

export interface InjuryWithAnalytics extends Injury {
  daysLost: number;
  recoveryProgress: number; // 0-100%
  complianceRate: number; // 0-100%
  relatedExercises: string[];
  possibleCauses: string[];
  preventativeMeasures: string[];
}

export interface RecoveryTimelineData {
  date: string;
  status: 'injured' | 'rehabilitation' | 'return-to-play' | 'cleared';
  progressPercentage: number;
  milestones: RecoveryMilestone[];
  metrics: RecoveryMetrics;
  notes?: string;
}

export interface RecoveryMilestone {
  id: string;
  name: string;
  targetDate: string;
  actualDate?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'missed';
  criteria: string[];
  assessmentResults?: AssessmentResult[];
}

export interface RecoveryMetrics {
  painLevel: number; // 0-10
  mobilityScore: number; // 0-100
  strengthScore: number; // 0-100
  functionalScore: number; // 0-100
  confidenceLevel: number; // 0-100
}

export interface AssessmentResult {
  testName: string;
  value: number;
  unit: string;
  baseline: number;
  targetValue: number;
  passedCriteria: boolean;
}

export interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
  relatedInjuries: string[];
}

export interface WorkloadInjuryData {
  week: string;
  workload: number;
  acuteChronicRatio: number;
  injuryOccurred: boolean;
  injuryType?: string;
  injurySeverity?: string;
}

// Return to Play Protocol Types
export interface ReturnToPlayProtocol extends BaseEntity {
  playerId: string;
  playerName: string;
  injuryId: string;
  protocolName: string;
  startDate: string;
  targetReturnDate: string;
  currentPhase: number;
  totalPhases: number;
  phases: ReturnToPlayPhase[];
  clearanceStatus: ClearanceStatus;
  medicalTeam: MedicalTeamMember[];
}

export interface ReturnToPlayPhase {
  phaseNumber: number;
  name: string;
  description: string;
  duration: string;
  startDate?: string;
  completedDate?: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  activities: PhaseActivity[];
  criteria: PhaseCriteria[];
  restrictions: string[];
}

export interface PhaseActivity {
  name: string;
  type: 'exercise' | 'drill' | 'game' | 'assessment';
  intensity: 'low' | 'moderate' | 'high';
  duration: number; // minutes
  frequency: string;
  progressionNotes?: string;
}

export interface PhaseCriteria {
  criterion: string;
  type: 'objective' | 'subjective' | 'clinical';
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  met: boolean;
  assessedDate?: string;
  assessedBy?: string;
}

export interface ClearanceStatus {
  status: 'not-started' | 'in-progress' | 'cleared' | 'setback';
  clearedBy?: string;
  clearedDate?: string;
  restrictions?: string[];
  notes?: string;
}

export interface MedicalTeamMember {
  id: string;
  name: string;
  role: 'physician' | 'physiotherapist' | 'athletic-trainer' | 'specialist';
  specialty?: string;
  contactInfo?: string;
}

// Medical Compliance Types
export interface MedicalCompliance extends BaseEntity {
  playerId: string;
  playerName: string;
  complianceScore: number; // 0-100
  adherenceRate: number; // 0-100
  missedAppointments: number;
  completedProtocols: number;
  totalProtocols: number;
  violations: ComplianceViolation[];
  achievements: ComplianceAchievement[];
}

export interface ComplianceViolation {
  date: string;
  type: 'missed-appointment' | 'exceeded-limits' | 'skipped-protocol' | 'unauthorized-activity';
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  resolved: boolean;
  resolutionNotes?: string;
}

export interface ComplianceAchievement {
  date: string;
  type: 'perfect-week' | 'milestone-reached' | 'early-recovery' | 'full-compliance';
  description: string;
  points: number;
}

// Rehabilitation Analytics Types
export interface RehabilitationAnalytics extends BaseEntity {
  playerId: string;
  playerName: string;
  programId: string;
  programName: string;
  startDate: string;
  projectedEndDate: string;
  actualEndDate?: string;
  effectiveness: RehabEffectiveness;
  exercises: RehabExerciseAnalytics[];
  progressTrend: ProgressDataPoint[];
  comparisons: RehabComparison[];
}

export interface RehabEffectiveness {
  overallScore: number; // 0-100
  timeEfficiency: number; // vs projected timeline
  outcomeQuality: number; // vs expected outcomes
  patientSatisfaction: number; // 0-100
  costEffectiveness: number; // 0-100
}

export interface RehabExerciseAnalytics {
  exerciseId: string;
  exerciseName: string;
  totalSessions: number;
  completionRate: number;
  averagePerformance: number;
  progressionRate: number;
  patientFeedback: number; // 0-10
  effectiveness: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface ProgressDataPoint {
  date: string;
  metric: string;
  value: number;
  target: number;
  percentageOfTarget: number;
}

export interface RehabComparison {
  similarInjuryType: string;
  averageRecoveryDays: number;
  thisRecoveryDays: number;
  performanceDifference: number; // percentage
  factors: string[];
}

// Privacy and Audit Types
export interface MedicalDataAccess {
  userId: string;
  userName: string;
  role: string;
  accessType: 'view' | 'edit' | 'export' | 'share';
  dataCategory: 'injury' | 'treatment' | 'recovery' | 'compliance' | 'analytics';
  timestamp: string;
  ipAddress?: string;
  justification?: string;
}

export interface ConsentRecord {
  playerId: string;
  consentType: 'data-sharing' | 'analytics' | 'research' | 'third-party';
  granted: boolean;
  grantedDate?: string;
  expiryDate?: string;
  scope: string[];
  restrictions?: string[];
}

export interface AnonymizedTeamReport {
  reportDate: string;
  injuryTrends: {
    type: string;
    count: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }[];
  recoveryMetrics: {
    averageDays: number;
    complianceRate: number;
    successRate: number;
  };
  riskFactors: {
    factor: string;
    affectedPercentage: number;
  }[];
  recommendations: string[];
}

// Integration Types
export interface MedicalPerformanceCorrelation {
  playerId: string;
  periodStart: string;
  periodEnd: string;
  injuryStatus: 'healthy' | 'recovering' | 'injured';
  performanceMetrics: {
    metric: string;
    preInjuryValue: number;
    currentValue: number;
    percentageChange: number;
    expectedRecovery: number; // days
  }[];
  workloadAdjustments: WorkloadAdjustment[];
}

export interface WorkloadAdjustment {
  date: string;
  originalLoad: number;
  adjustedLoad: number;
  reason: string;
  approvedBy: string;
}

// Medical Insights Types
export interface InjuryPrediction {
  playerId: string;
  playerName: string;
  predictionDate: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  primaryFactors: PredictionFactor[];
  preventativeActions: PreventativeAction[];
  confidenceLevel: number; // 0-100
}

export interface PredictionFactor {
  factor: string;
  weight: number; // 0-1
  currentValue: number;
  thresholdValue: number;
  trend: 'improving' | 'stable' | 'worsening';
  description: string;
}

export interface PreventativeAction {
  action: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedImpact: number; // risk reduction percentage
  implementation: string;
  timeline: string;
}

// Team Medical Trends
export interface TeamMedicalTrends {
  teamId: string;
  periodStart: string;
  periodEnd: string;
  injuryRate: number; // injuries per 1000 hours
  commonInjuries: {
    type: string;
    count: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  seasonalPatterns: SeasonalPattern[];
  comparisonToLeague: {
    metric: string;
    teamValue: number;
    leagueAverage: number;
    percentile: number;
  }[];
}

export interface SeasonalPattern {
  period: string;
  injuryRate: number;
  commonTypes: string[];
  contributingFactors: string[];
  recommendations: string[];
}

// Medical Dashboard Configuration
export interface MedicalDashboardConfig {
  userId: string;
  role: string;
  widgets: MedicalWidget[];
  defaultView: 'team' | 'individual' | 'trends' | 'compliance';
  dataRetentionDays: number;
  privacySettings: PrivacySettings;
}

export interface MedicalWidget {
  id: string;
  type: 'injury-timeline' | 'recovery-progress' | 'compliance' | 'predictions' | 'trends';
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  visible: boolean;
}

export interface PrivacySettings {
  showPlayerNames: boolean;
  anonymizeReports: boolean;
  requireJustification: boolean;
  exportRestrictions: string[];
  allowedRoles: string[];
}