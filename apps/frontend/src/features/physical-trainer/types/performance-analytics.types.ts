export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number; // percentage change from previous period
  trend: 'up' | 'down' | 'stable';
  color: string;
  target?: number;
  category: 'strength' | 'conditioning' | 'agility' | 'recovery' | 'attendance' | 'load';
}

export interface PlayerPerformanceData {
  playerId: string;
  playerName: string;
  position: string;
  metrics: {
    // Strength metrics
    strengthIndex: number;
    powerOutput: number;
    oneRepMaxEstimate: number;
    // Conditioning metrics
    vo2Max: number;
    lactateThreshold: number;
    heartRateRecovery: number;
    // Agility metrics
    reactionTime: number;
    changOfDirectionSpeed: number;
    footSpeed: number;
    // Recovery metrics
    rpeAverage: number;
    sleepQuality: number;
    wellnessScore: number;
    // Attendance metrics
    sessionAttendance: number;
    completionRate: number;
    punctuality: number;
    // Load metrics
    weeklyLoad: number;
    acuteLoad: number;
    chronicLoad: number;
    acuteChronicRatio: number;
  };
  workoutHistory: WorkoutSessionResult[];
  injuryRisk: {
    overall: 'low' | 'moderate' | 'high';
    factors: string[];
    recommendations: string[];
  };
  progressTrends: {
    strength: TrendData[];
    conditioning: TrendData[];
    agility: TrendData[];
    recovery: TrendData[];
  };
}

export interface TrendData {
  date: string;
  value: number;
  workoutType: WorkoutType;
  metric: string;
}

export interface WorkoutSessionResult {
  sessionId: string;
  workoutType: WorkoutType;
  date: string;
  duration: number; // minutes
  completionRate: number; // percentage
  averageIntensity: number;
  peakHeartRate?: number;
  averageHeartRate?: number;
  rpe: number; // Rate of Perceived Exertion 1-10
  exercises: ExerciseResult[];
  notes?: string;
}

export interface ExerciseResult {
  exerciseId: string;
  exerciseName: string;
  sets: SetResult[];
  totalVolume: number;
  personalRecord: boolean;
}

export interface SetResult {
  reps: number;
  weight?: number;
  duration?: number; // for time-based exercises
  distance?: number; // for cardio
  restTime: number;
  rpe?: number;
}

export interface TeamPerformanceData {
  teamId: string;
  teamName: string;
  playerCount: number;
  metrics: {
    averageAttendance: number;
    averageCompletionRate: number;
    averageWellness: number;
    totalWorkouts: number;
    activeInjuries: number;
    teamReadiness: number;
  };
  workoutDistribution: {
    strength: number;
    conditioning: number;
    hybrid: number;
    agility: number;
  };
  performanceTrends: {
    strength: TeamTrendData[];
    conditioning: TeamTrendData[];
    agility: TeamTrendData[];
    attendance: TeamTrendData[];
  };
  comparisonData: {
    vsLastMonth: PerformanceMetric[];
    vsTarget: PerformanceMetric[];
    vsLeague?: PerformanceMetric[];
  };
}

export interface TeamTrendData {
  date: string;
  average: number;
  median: number;
  standardDeviation: number;
  participantCount: number;
}

export interface WorkoutEffectivenessData {
  workoutType: WorkoutType;
  totalSessions: number;
  averageCompletion: number;
  averageIntensity: number;
  averageRPE: number;
  improvementRate: number; // percentage of players showing improvement
  retentionRate: number; // percentage continuing with workout type
  effectiveness: EffectivenessRating;
  topExercises: ExerciseEffectiveness[];
  recommendedAdjustments: string[];
}

export interface ExerciseEffectiveness {
  exerciseId: string;
  exerciseName: string;
  frequency: number;
  averageImprovement: number;
  playerFeedback: number; // average rating
  injuryRate: number;
  progressionRate: number;
}

export interface EffectivenessRating {
  overall: number; // 1-10
  strength: number;
  conditioning: number;
  engagement: number;
  safety: number;
  progression: number;
}

export interface LoadManagementData {
  playerId: string;
  currentLoad: {
    acute: number; // 7-day rolling average
    chronic: number; // 28-day rolling average
    ratio: number; // acute:chronic ratio
    recommendation: LoadRecommendation;
  };
  loadHistory: LoadHistoryPoint[];
  riskFactors: RiskFactor[];
  adaptationStatus: 'positive' | 'maintaining' | 'declining' | 'overreaching';
}

export interface LoadHistoryPoint {
  date: string;
  dailyLoad: number;
  acuteLoad: number;
  chronicLoad: number;
  ratio: number;
  wellness: number;
  performance: number;
}

export interface RiskFactor {
  type: 'load' | 'wellness' | 'performance' | 'injury' | 'fatigue';
  severity: 'low' | 'moderate' | 'high';
  description: string;
  recommendation: string;
}

export interface LoadRecommendation {
  action: 'increase' | 'maintain' | 'decrease' | 'rest';
  percentage: number;
  reasoning: string;
  duration: string; // e.g., "1-2 weeks"
}

export interface PerformanceComparisonFilter {
  type: 'player-vs-player' | 'player-vs-team' | 'team-vs-team' | 'time-period';
  entities: string[]; // player or team IDs
  metrics: string[];
  timeRange: DateRange;
  normalizationMethod: 'raw' | 'percentile' | 'z-score';
}

export interface ComparisonResult {
  entity1: string;
  entity2: string;
  metrics: ComparisonMetric[];
  summary: string;
  winner?: string;
  improvements: string[];
}

export interface ComparisonMetric {
  name: string;
  entity1Value: number;
  entity2Value: number;
  difference: number;
  percentageDifference: number;
  significance: 'high' | 'moderate' | 'low';
  trend: 'improving' | 'declining' | 'stable';
}

export interface AnalyticsDashboardFilters {
  dateRange: DateRange;
  teams: string[];
  players: string[];
  workoutTypes: WorkoutType[];
  metrics: string[];
  groupBy: 'player' | 'team' | 'position' | 'workout-type';
  aggregation: 'average' | 'median' | 'total' | 'max' | 'min';
}

export interface DateRange {
  from: Date;
  to: Date;
  preset?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'xlsx' | 'png' | 'json';
  sections: ExportSection[];
  includeCharts: boolean;
  includeRawData: boolean;
  dateRange: DateRange;
  players?: string[];
  teams?: string[];
}

export interface ExportSection {
  id: string;
  name: string;
  enabled: boolean;
  options?: Record<string, any>;
}

export interface PerformanceInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'performance' | 'load' | 'injury' | 'attendance' | 'recovery';
  entities: string[]; // affected players or teams
  recommendations: string[];
  dataPoints: any[];
  confidence: number; // 0-1
  timestamp: Date;
}

export interface PerformanceRecommendation {
  id: string;
  type: 'workout' | 'recovery' | 'load' | 'exercise' | 'schedule';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
  targetEntities: string[];
  expectedOutcome: string;
  implementationSteps: string[];
  timeline: string;
  successMetrics: string[];
}

export type WorkoutType = 'strength' | 'conditioning' | 'hybrid' | 'agility';

export interface ChartConfiguration {
  type: 'line' | 'bar' | 'area' | 'scatter' | 'pie' | 'radar' | 'heatmap';
  title: string;
  xAxis: {
    label: string;
    dataKey: string;
    type: 'time' | 'category' | 'number';
  };
  yAxis: {
    label: string;
    dataKey: string;
    type: 'number';
    domain?: [number, number];
  };
  series: ChartSeries[];
  colors: string[];
  responsive: boolean;
  height: number;
}

export interface ChartSeries {
  name: string;
  dataKey: string;
  color: string;
  type?: 'line' | 'bar' | 'area';
  strokeWidth?: number;
  fill?: boolean;
}

export interface PerformanceAlerts {
  id: string;
  playerId: string;
  type: 'performance-decline' | 'injury-risk' | 'overtraining' | 'improvement' | 'milestone';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  triggeredAt: Date;
  acknowledged: boolean;
  actions: AlertAction[];
}

export interface AlertAction {
  id: string;
  label: string;
  action: string;
  params?: Record<string, any>;
}

export interface PerformancePrediction {
  playerId: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  timeHorizon: number; // days
  confidence: number; // 0-1
  factors: PredictionFactor[];
  recommendations: string[];
}

export interface PredictionFactor {
  name: string;
  impact: number; // -1 to 1
  confidence: number;
  description: string;
}

// Dashboard state management
export interface PerformanceAnalyticsState {
  selectedView: 'overview' | 'players' | 'teams' | 'workouts' | 'load' | 'comparison';
  filters: AnalyticsDashboardFilters;
  selectedPlayers: string[];
  selectedTeams: string[];
  dateRange: DateRange;
  isLoading: boolean;
  error: string | null;
  insights: PerformanceInsight[];
  recommendations: PerformanceRecommendation[];
  alerts: PerformanceAlerts[];
}