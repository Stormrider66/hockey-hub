// Statistics and analytics related events

export interface WorkoutCompletedEvent {
  sessionId: string;
  playerId: string;
  workoutType: string;
  duration: number;
  exercises?: number;
  intervals?: number;
  overallCompliance: number;
  caloriesBurned: number;
  summary: {
    averageHeartRate?: number;
    maxHeartRate?: number;
    averagePower?: number;
    totalVolume?: number;
    timeInZones?: Record<number, number>;
  };
  timestamp: Date;
}

export interface PerformanceMetricEvent {
  playerId: string;
  metricType: 'strength' | 'endurance' | 'power' | 'flexibility' | 'speed';
  value: number;
  unit: string;
  improvement?: number; // Percentage improvement
  benchmark?: string; // e.g., "team_average", "personal_best"
  timestamp: Date;
}

export interface TeamAnalyticsEvent {
  teamId: string;
  sessionId?: string;
  analyticsType: 'performance' | 'compliance' | 'attendance' | 'injury_risk';
  data: {
    average?: number;
    min?: number;
    max?: number;
    distribution?: Record<string, number>;
    trends?: number[];
  };
  insights?: string[];
  timestamp: Date;
}

export interface InjuryRiskEvent {
  playerId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    workload?: number;
    fatigue?: number;
    biomechanics?: number;
    history?: number;
  };
  recommendations: string[];
  confidenceScore: number;
  timestamp: Date;
}

export interface ExportRequestEvent {
  userId: string;
  reportType: string;
  format: 'pdf' | 'excel' | 'csv' | 'html';
  filters?: {
    dateRange?: { start: Date; end: Date };
    players?: string[];
    teams?: string[];
    workoutTypes?: string[];
  };
  status: 'requested' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  error?: string;
  timestamp: Date;
}