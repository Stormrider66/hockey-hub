/**
 * DTOs for Player Wellness API endpoints
 */

export interface PlayerStatusDto {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  readinessScore: number; // 1-100
  status: 'ready' | 'limited' | 'injured' | 'resting';
  lastSessionDate?: string;
  nextSessionDate?: string;
  trainingLoad: {
    currentWeek: number;
    previousWeek: number;
    change: number; // percentage change
    status: 'normal' | 'high' | 'overload' | 'deload';
  };
  wellness: {
    sleep: number; // 1-10
    stress: number; // 1-10
    energy: number; // 1-10
    soreness: number; // 1-10
    mood: number; // 1-10
    lastUpdated: string;
  };
  medical?: {
    hasActiveInjury: boolean;
    injuryType?: string;
    returnDate?: string;
    restrictions: string[];
  };
}

export interface TeamPlayerStatusDto {
  teamId: string;
  teamName: string;
  players: PlayerStatusDto[];
  teamAverages: {
    readinessScore: number;
    trainingLoad: number;
    wellnessScores: {
      sleep: number;
      stress: number;
      energy: number;
      soreness: number;
      mood: number;
    };
  };
  alerts: {
    highRisk: string[]; // Player IDs
    injured: string[];
    overloaded: string[];
    wellnessDecline: string[];
  };
}

export interface PlayerWellnessDetailDto {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  currentWellness: {
    sleep: number;
    stress: number;
    energy: number;
    soreness: number;
    mood: number;
    notes?: string;
    submittedAt: string;
  };
  wellnessHistory: Array<{
    date: string;
    sleep: number;
    stress: number;
    energy: number;
    soreness: number;
    mood: number;
    average: number;
  }>;
  trends: {
    sleep: 'improving' | 'stable' | 'declining';
    stress: 'improving' | 'stable' | 'declining';
    energy: 'improving' | 'stable' | 'declining';
    soreness: 'improving' | 'stable' | 'declining';
    mood: 'improving' | 'stable' | 'declining';
    overall: 'improving' | 'stable' | 'declining';
  };
  recommendations: string[];
  medicalNotes?: string;
}

export interface PlayerTrainingMetricsDto {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  hrVariability: {
    current: number; // ms
    baseline: number; // ms
    trend: 'improving' | 'stable' | 'declining';
    readiness: 'ready' | 'caution' | 'rest';
    history: Array<{
      date: string;
      value: number;
    }>;
  };
  powerOutput: {
    peak: number; // watts
    average: number; // watts
    threshold: number; // watts
    trend: 'improving' | 'stable' | 'declining';
    history: Array<{
      date: string;
      peak: number;
      average: number;
    }>;
  };
  recovery: {
    score: number; // 1-100
    sleepHours: number;
    restingHR: number;
    trend: 'improving' | 'stable' | 'declining';
    recommendations: string[];
    history: Array<{
      date: string;
      score: number;
    }>;
  };
  trainingLoad: {
    acute: number; // 7-day rolling average
    chronic: number; // 28-day rolling average
    ratio: number; // acute:chronic ratio
    status: 'optimal' | 'high' | 'overload' | 'deload';
    recommendations: string[];
    history: Array<{
      date: string;
      load: number;
    }>;
  };
  performance: {
    vo2Max: number;
    lactateThreshold: number;
    maxHR: number;
    restingHR: number;
    bodyComposition: {
      weight: number;
      bodyFat: number;
      muscleMass: number;
    };
    testResults: Array<{
      test: string;
      value: number;
      date: string;
      percentile: number;
    }>;
  };
}

export interface CreateWellnessEntryDto {
  playerId: string;
  sleep: number;
  stress: number;
  energy: number;
  soreness: number;
  mood: number;
  notes?: string;
}

export interface UpdateTrainingMetricsDto {
  playerId: string;
  hrVariability?: number;
  restingHR?: number;
  sleepHours?: number;
  trainingLoad?: number;
  notes?: string;
}