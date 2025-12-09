import type { IntervalProgram, WorkoutCreationContext } from '../../types';

export interface BulkSessionWrapperProps {
  onSave: (program: IntervalProgram, playerIds?: string[], teamIds?: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: IntervalProgram;
  workoutId?: string;
  workoutContext?: WorkoutCreationContext | null;
}

export interface BulkSessionConfig {
  enabled: boolean;
  maxSessions: number;
  allowTeamCopies: boolean;
  allowDateRange: boolean;
}

export interface BulkSessionOptions {
  sessionCount: number;
  copyForTeams: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
    interval: 'daily' | 'weekly' | 'biweekly';
  };
  namePattern: string;
  customizations: {
    allowIndividualEdits: boolean;
    preservePlayerAssignments: boolean;
    adjustIntensityBySession: boolean;
  };
}

export type SessionMode = 'single' | 'bulk';

// Session Bundle View Types
export interface SessionBundle {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
  sessions: BundleSession[];
  totalParticipants: number;
  status: 'preparing' | 'active' | 'paused' | 'completed';
}

export interface BundleSession {
  id: string;
  name: string;
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility';
  equipment?: string;
  participants: SessionParticipant[];
  status: 'preparing' | 'active' | 'paused' | 'completed';
  progress: number; // 0-100
  startTime?: Date;
  elapsedTime: number; // seconds
  estimatedDuration: number; // seconds
  currentPhase: string;
  location?: string;
}

export interface SessionParticipant {
  id: string;
  playerId: string;
  playerName: string;
  playerNumber: number;
  teamId: string;
  teamName: string;
  status: 'connected' | 'disconnected' | 'paused';
  progress: number; // 0-100
  currentActivity?: string;
  metrics: ParticipantMetrics;
}

export interface ParticipantMetrics {
  heartRate?: number;
  heartRateZone?: 'rest' | 'zone1' | 'zone2' | 'zone3' | 'zone4' | 'zone5';
  power?: number;
  pace?: string;
  distance?: number;
  calories?: number;
  reps?: number;
  weight?: number;
}

export interface BundleMetrics {
  totalSessions: number;
  activeSessions: number;
  totalParticipants: number;
  activeParticipants: number;
  averageProgress: number;
  averageHeartRate?: number;
  totalCaloriesBurned?: number;
  averageIntensity?: number;
}

export interface SessionBundleViewProps {
  bundleId: string;
  onSessionClick?: (sessionId: string) => void;
  onBulkAction?: (action: BulkActionType, sessionIds: string[]) => void;
  className?: string;
}

export type BulkActionType = 'pause_all' | 'resume_all' | 'broadcast_message' | 'export_data' | 'export_by_type' | 'filter_by_type';