// Live session types for real-time workout monitoring

export interface LiveSession {
  id: string;
  workoutId: string;
  workoutName: string;
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility';
  trainerId: string;
  trainerName: string;
  startTime: Date;
  participants: LiveParticipant[];
  status: 'preparing' | 'active' | 'paused' | 'completed';
  currentPhase: string;
  totalDuration: number;
  elapsedTime: number;
}

export interface LiveParticipant {
  id: string;
  playerId: string;
  playerName: string;
  playerNumber: number;
  teamId: string;
  teamName: string;
  status: 'connected' | 'disconnected' | 'paused';
  progress: number; // 0-100
  currentExercise?: string;
  currentSet?: number;
  totalSets?: number;
  metrics: LiveMetrics;
  lastUpdate: Date;
}

export interface LiveMetrics {
  heartRate?: number;
  heartRateZone?: 'rest' | 'zone1' | 'zone2' | 'zone3' | 'zone4' | 'zone5';
  power?: number;
  pace?: string;
  distance?: number;
  calories?: number;
  reps?: number;
  weight?: number;
  restTime?: number;
}

export interface LiveSessionEvent {
  type: 'session_started' | 'session_ended' | 'participant_joined' | 'participant_left' | 
        'metrics_updated' | 'exercise_completed' | 'phase_changed' | 'session_paused' | 
        'session_resumed';
  sessionId: string;
  timestamp: Date;
  data: any;
}

export interface LiveSessionFilters {
  workoutType?: string[];
  trainerIds?: string[];
  teamIds?: string[];
  status?: string[];
}

export interface LiveSessionContextType {
  sessions: LiveSession[];
  selectedSession: LiveSession | null;
  connected: boolean;
  error: string | null;
  selectSession: (sessionId: string) => void;
  clearSelection: () => void;
  filters: LiveSessionFilters;
  setFilters: (filters: LiveSessionFilters) => void;
}