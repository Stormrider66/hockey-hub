/**
 * Analytics Types for Performance Analytics Dashboard
 * 
 * Comprehensive type definitions for analytics components, data visualization,
 * and performance metrics tracking.
 */

import { 
  WorkoutSession, 
  Player, 
  PlayerReadiness, 
  TestResult,
  WorkoutExecution,
  OverallMetrics 
} from './base-types';

// Time period types
export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'season' | 'year';
export type DateRange = { from: Date; to: Date };

// Analytics data types
export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number; // percentage change
  changeDirection: 'up' | 'down' | 'stable';
  trend: number[]; // array of values over time
  target?: number;
  isGood: boolean; // whether current value is positive
}

export interface PlayerPerformanceData {
  playerId: string;
  playerName: string;
  position: string;
  photo?: string;
  metrics: {
    workloadScore: PerformanceMetric;
    attendanceRate: PerformanceMetric;
    performanceIndex: PerformanceMetric;
    recoveryScore: PerformanceMetric;
    injuryRisk: PerformanceMetric;
    improvementRate: PerformanceMetric;
  };
  workouts: {
    total: number;
    completed: number;
    missed: number;
    completionRate: number;
  };
  testResults: TestResult[];
  recentExecutions: WorkoutExecution[];
  readiness: PlayerReadiness;
}

export interface TeamPerformanceData {
  teamId: string;
  teamName: string;
  period: TimePeriod;
  dateRange: DateRange;
  overallHealth: number; // 0-100
  metrics: {
    averageAttendance: PerformanceMetric;
    workloadBalance: PerformanceMetric;
    performanceConsistency: PerformanceMetric;
    injuryRate: PerformanceMetric;
    readinessScore: PerformanceMetric;
    progressRate: PerformanceMetric;
  };
  playerDistribution: {
    byReadiness: Record<string, number>;
    byPosition: Record<string, number>;
    byWorkload: Record<string, number>;
  };
  topPerformers: PlayerPerformanceData[];
  needsAttention: PlayerPerformanceData[];
}

export interface WorkoutEffectivenessData {
  workoutType: string;
  totalSessions: number;
  averageDuration: number;
  completionRate: number;
  averageRPE: number;
  performanceGains: {
    metric: string;
    improvement: number;
    confidence: number; // statistical confidence
  }[];
  popularExercises: {
    name: string;
    frequency: number;
    effectiveness: number;
  }[];
  optimalIntensity: string;
  recommendedFrequency: number; // per week
}

export interface LoadManagementData {
  playerId: string;
  playerName: string;
  currentLoad: number;
  optimalLoadRange: { min: number; max: number };
  acuteChronicRatio: number; // ACWR
  loadTrend: {
    date: Date;
    load: number;
    type: string;
  }[];
  recommendations: {
    type: 'increase' | 'maintain' | 'decrease';
    percentage: number;
    reason: string;
  };
  riskFactors: string[];
}

export interface RecoveryStatusData {
  playerId: string;
  playerName: string;
  recoveryScore: number; // 0-100
  components: {
    sleep: number;
    nutrition: number;
    hydration: number;
    stress: number;
    soreness: number;
  };
  trend: {
    date: Date;
    score: number;
  }[];
  recommendations: string[];
  nextOptimalTraining: Date;
}

export interface ComparisonData {
  type: 'player-to-team' | 'player-to-player' | 'period-to-period' | 'team-to-team';
  subjects: {
    name: string;
    id: string;
    data: Record<string, number>;
  }[];
  metrics: string[];
  period: TimePeriod;
  insights: {
    metric: string;
    difference: number;
    significance: 'high' | 'medium' | 'low';
    interpretation: string;
  }[];
}

// Chart and visualization types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    type?: 'line' | 'bar' | 'area';
    yAxisID?: string;
  }[];
}

export interface HeatmapData {
  rows: string[]; // player names
  columns: string[]; // dates or metrics
  data: number[][]; // values
  colorScale: {
    min: number;
    max: number;
    colors: string[];
  };
}

export interface RadarChartData {
  categories: string[];
  players: {
    name: string;
    values: number[];
    color: string;
  }[];
  maxValues: number[];
}

// Filter and export types
export interface AnalyticsFilters {
  period: TimePeriod;
  customDateRange?: DateRange;
  teamIds: string[];
  playerIds: string[];
  workoutTypes: string[];
  metrics: string[];
  comparison?: {
    enabled: boolean;
    type: ComparisonData['type'];
    subjects: string[];
  };
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'png';
  sections: string[];
  dateRange: DateRange;
  includeCharts: boolean;
  includeRawData: boolean;
  recipients?: string[]; // email addresses
}

// Dashboard state types
export interface AnalyticsDashboardState {
  filters: AnalyticsFilters;
  selectedView: 'overview' | 'player' | 'team' | 'workouts' | 'comparison';
  isLoading: boolean;
  error: string | null;
  data: {
    team?: TeamPerformanceData;
    players?: PlayerPerformanceData[];
    workouts?: WorkoutEffectivenessData[];
    loadManagement?: LoadManagementData[];
    recovery?: RecoveryStatusData[];
    comparisons?: ComparisonData[];
  };
  cache: {
    lastUpdated: Date;
    isStale: boolean;
  };
}

// Insight and recommendation types
export interface PerformanceInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  category: 'performance' | 'health' | 'training' | 'recovery';
  title: string;
  description: string;
  affectedPlayers: string[];
  suggestedActions: string[];
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  expiresAt?: Date;
}

export interface TrainingRecommendation {
  playerId: string;
  playerName: string;
  recommendations: {
    workoutTypes: string[];
    intensity: string;
    duration: number;
    frequency: number;
    focusAreas: string[];
    avoidExercises: string[];
  };
  reasoning: string;
  confidence: number;
  validUntil: Date;
}

// Aggregated statistics types
export interface TeamStatistics {
  totalWorkouts: number;
  totalPlayerHours: number;
  averageSessionDuration: number;
  mostActiveDay: string;
  peakLoadDay: string;
  workoutTypeDistribution: Record<string, number>;
  intensityDistribution: Record<string, number>;
  equipmentUsage: Record<string, number>;
  locationUsage: Record<string, number>;
}

export interface PlayerStatistics {
  playerId: string;
  totalWorkouts: number;
  totalDuration: number;
  averageIntensity: number;
  favoriteExercises: string[];
  strongestMetrics: string[];
  improvementAreas: string[];
  consistencyScore: number;
  progressScore: number;
}

// Real-time monitoring types
export interface LiveSessionMetrics {
  sessionId: string;
  activePlayers: number;
  completionPercentage: number;
  averageHeartRate: number;
  averageRPE: number;
  alerts: {
    playerId: string;
    type: 'high-hr' | 'low-effort' | 'technique' | 'fatigue';
    severity: 'info' | 'warning' | 'critical';
    message: string;
  }[];
  projectedFinishTime: Date;
}

// Goal tracking types
export interface PerformanceGoal {
  id: string;
  playerId?: string;
  teamId?: string;
  metric: string;
  targetValue: number;
  currentValue: number;
  deadline: Date;
  progress: number;
  status: 'on-track' | 'at-risk' | 'behind' | 'achieved';
  milestones: {
    date: Date;
    value: number;
    achieved: boolean;
  }[];
}

// Analytics API response types
export interface AnalyticsResponse<T> {
  data: T;
  metadata: {
    period: TimePeriod;
    dateRange: DateRange;
    lastUpdated: Date;
    dataQuality: number; // 0-100
    missingDataPoints: number;
  };
  insights: PerformanceInsight[];
  recommendations: TrainingRecommendation[];
}

// Component prop types
export interface MetricCardProps {
  metric: PerformanceMetric;
  size?: 'small' | 'medium' | 'large';
  showTrend?: boolean;
  showTarget?: boolean;
  onClick?: () => void;
}

export interface PerformanceChartProps {
  data: ChartData;
  type: 'line' | 'bar' | 'area' | 'mixed';
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  interactive?: boolean;
  onDataPointClick?: (data: any) => void;
}

export interface PlayerComparisonProps {
  players: PlayerPerformanceData[];
  metrics: string[];
  period: TimePeriod;
  view: 'table' | 'chart' | 'radar';
}

export interface LoadManagementChartProps {
  data: LoadManagementData[];
  showRecommendations?: boolean;
  showRiskZones?: boolean;
  height?: number;
}

// Utility types
export type MetricAggregation = 'sum' | 'average' | 'max' | 'min' | 'median';
export type TrendDirection = 'improving' | 'declining' | 'stable' | 'volatile';

export interface TrendAnalysis {
  direction: TrendDirection;
  changeRate: number; // percentage per period
  confidence: number; // 0-100
  prediction: {
    nextValue: number;
    range: { min: number; max: number };
    confidence: number;
  };
}