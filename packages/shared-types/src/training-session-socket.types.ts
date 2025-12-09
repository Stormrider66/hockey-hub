// Training Session WebSocket Event Types
export enum TrainingSessionSocketEvent {
  // Connection events
  JOIN_SESSION = 'training:session:join',
  LEAVE_SESSION = 'training:session:leave',
  SESSION_JOINED = 'training:session:joined',
  SESSION_LEFT = 'training:session:left',
  
  // Session lifecycle events
  SESSION_START = 'training:session:start',
  SESSION_END = 'training:session:end',
  SESSION_PAUSE = 'training:session:pause',
  SESSION_RESUME = 'training:session:resume',
  SESSION_UPDATE = 'training:session:update',
  
  // Player events
  PLAYER_JOIN = 'training:player:join',
  PLAYER_LEAVE = 'training:player:leave',
  PLAYER_METRICS_UPDATE = 'training:player:metrics',
  PLAYER_EXERCISE_PROGRESS = 'training:player:exercise:progress',
  PLAYER_INTERVAL_PROGRESS = 'training:player:interval:progress',
  PLAYER_STATUS_UPDATE = 'training:player:status',
  
  // Dashboard real-time events
  MEDICAL_STATUS_CHANGED = 'training:medical:status:changed',
  SESSION_PROGRESS = 'training:session:progress',
  CALENDAR_EVENT_CHANGED = 'training:calendar:event:changed',
  PLAYER_AVAILABILITY_CHANGED = 'training:player:availability:changed',
  WORKOUT_TEMPLATE_UPDATED = 'training:template:updated',
  TEAM_ASSIGNMENT_CHANGED = 'training:team:assignment:changed',
  
  // Error events
  ERROR = 'training:error',
  
  // Admin events
  FORCE_END_SESSION = 'training:session:force:end',
  KICK_PLAYER = 'training:player:kick',
  
  // PHASE 3.3: Type-Specific Real-Time Events
  
  // Strength workout events
  STRENGTH_SET_COMPLETION = 'training:strength:set:completion',
  STRENGTH_WEIGHT_UPDATE = 'training:strength:weight:update', 
  STRENGTH_REST_TIMER = 'training:strength:rest:timer',
  STRENGTH_FORM_FEEDBACK = 'training:strength:form:feedback',
  
  // Conditioning workout events
  CONDITIONING_INTERVAL_TRANSITION = 'training:conditioning:interval:transition',
  CONDITIONING_HEART_RATE_UPDATE = 'training:conditioning:hr:update',
  CONDITIONING_ZONE_COMPLIANCE = 'training:conditioning:zone:compliance',
  CONDITIONING_POWER_UPDATE = 'training:conditioning:power:update',
  
  // Hybrid workout events
  HYBRID_BLOCK_TRANSITION = 'training:hybrid:block:transition',
  HYBRID_MIXED_METRICS = 'training:hybrid:mixed:metrics',
  HYBRID_MODE_SWITCH = 'training:hybrid:mode:switch',
  
  // Agility workout events
  AGILITY_DRILL_COMPLETION = 'training:agility:drill:completion',
  AGILITY_ERROR_TRACKING = 'training:agility:error:tracking',
  AGILITY_PATTERN_PROGRESS = 'training:agility:pattern:progress',
  AGILITY_TIMING_UPDATE = 'training:agility:timing:update',
  
  // Bulk session events
  BULK_SESSION_CREATED = 'training:bulk:session:created',
  BULK_SESSION_UPDATE = 'training:bulk:session:update',
  BULK_OPERATION_STATUS = 'training:bulk:operation:status',
  CROSS_SESSION_PARTICIPANT_MOVE = 'training:bulk:participant:move',
  AGGREGATE_METRICS_BROADCAST = 'training:bulk:metrics:aggregate',
  
  // Enhanced error events
  TYPE_SPECIFIC_ERROR = 'training:error:type:specific',
  BULK_OPERATION_ERROR = 'training:error:bulk:operation',
}

// Player metrics data
export interface PlayerMetrics {
  playerId: string;
  sessionId: string;
  timestamp: Date;
  heartRate?: number;
  power?: number; // watts
  pace?: number; // km/h or min/km depending on activity
  cadence?: number; // rpm
  distance?: number; // meters
  calories?: number;
  equipment?: string;
}

// Exercise progress data
export interface ExerciseProgress {
  playerId: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  totalSets: number;
  reps?: number;
  weight?: number;
  duration?: number; // seconds
  restTime?: number; // seconds
  completed: boolean;
  timestamp: Date;
}

// Interval progress data  
export interface IntervalProgress {
  playerId: string;
  sessionId: string;
  intervalId: string;
  intervalName: string;
  currentInterval: number;
  totalIntervals: number;
  timeRemaining: number; // seconds
  intensity: 'easy' | 'moderate' | 'hard' | 'max';
  targetHeartRate?: { min: number; max: number };
  targetPower?: { min: number; max: number };
  targetPace?: { min: number; max: number };
  completed: boolean;
  timestamp: Date;
}

// Player status in session
export interface PlayerSessionStatus {
  playerId: string;
  playerName: string;
  status: 'waiting' | 'active' | 'paused' | 'completed' | 'dropped';
  joinedAt: Date;
  lastActivity: Date;
  currentExercise?: string;
  currentInterval?: string;
  metrics?: PlayerMetrics;
}

// Session state
export interface TrainingSessionState {
  sessionId: string;
  workoutId: string;
  workoutName: string;
  workoutType: 'strength' | 'conditioning' | 'hybrid' | 'agility';
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  pausedAt?: Date;
  duration: number; // seconds
  trainerId: string;
  trainerName: string;
  players: PlayerSessionStatus[];
  totalPlayers: number;
  activePlayers: number;
  completedPlayers: number;
}

// Socket event payloads
export interface JoinSessionPayload {
  sessionId: string;
  role: 'trainer' | 'player' | 'observer';
  playerId?: string; // Required for players
}

export interface SessionJoinedPayload {
  session: TrainingSessionState;
  role: 'trainer' | 'player' | 'observer';
}

export interface SessionUpdatePayload {
  sessionId: string;
  updates: Partial<TrainingSessionState>;
}

export interface PlayerJoinPayload {
  sessionId: string;
  player: PlayerSessionStatus;
}

export interface PlayerLeavePayload {
  sessionId: string;
  playerId: string;
  reason: 'completed' | 'dropped' | 'kicked' | 'disconnected';
}

export interface MetricsUpdatePayload {
  sessionId: string;
  metrics: PlayerMetrics;
}

export interface ExerciseProgressPayload {
  sessionId: string;
  progress: ExerciseProgress;
}

export interface IntervalProgressPayload {
  sessionId: string;
  progress: IntervalProgress;
}

export interface PlayerStatusUpdatePayload {
  sessionId: string;
  playerId: string;
  status: PlayerSessionStatus['status'];
  reason?: string;
}

export interface TrainingErrorPayload {
  event: string;
  message: string;
  code?: string;
  sessionId?: string;
  playerId?: string;
}

// Dashboard-specific event payloads
export interface MedicalStatusChangedPayload {
  playerId: string;
  previousStatus: 'healthy' | 'injured' | 'limited' | 'recovery';
  newStatus: 'healthy' | 'injured' | 'limited' | 'recovery';
  restrictions?: string[];
  clearedDate?: Date;
  updatedBy: string;
  timestamp: Date;
}

export interface SessionProgressPayload {
  sessionId: string;
  workoutId: string;
  progress: number; // 0-100
  currentPhase: string;
  exercisesCompleted: number;
  totalExercises: number;
  playersActive: number;
  playersCompleted: number;
  timestamp: Date;
}

export interface CalendarEventChangedPayload {
  eventId: string;
  eventType: 'created' | 'updated' | 'deleted' | 'rescheduled';
  event: {
    id: string;
    title: string;
    type: 'training' | 'game' | 'meeting' | 'medical' | 'other';
    startTime: Date;
    endTime: Date;
    teamId?: string;
    playerIds?: string[];
  };
  changedBy: string;
  timestamp: Date;
}

export interface PlayerAvailabilityChangedPayload {
  playerId: string;
  date: Date;
  previousAvailability: 'available' | 'unavailable' | 'limited';
  newAvailability: 'available' | 'unavailable' | 'limited';
  reason?: string;
  affectedSessions?: string[];
  timestamp: Date;
}

export interface WorkoutTemplateUpdatedPayload {
  templateId: string;
  templateName: string;
  updateType: 'created' | 'updated' | 'deleted' | 'shared';
  updatedBy: string;
  sharedWith?: string[]; // User IDs or team IDs
  timestamp: Date;
}

export interface TeamAssignmentChangedPayload {
  playerId: string;
  previousTeamId?: string;
  newTeamId?: string;
  effectiveDate: Date;
  updatedBy: string;
  timestamp: Date;
}

// Rate limiting config
export interface RateLimitConfig {
  metricsUpdateInterval: number; // milliseconds
  maxUpdatesPerMinute: number;
  burstAllowance: number;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  metricsUpdateInterval: 2000, // 2 seconds
  maxUpdatesPerMinute: 30,
  burstAllowance: 5,
};

// PHASE 3.3: Extended Interfaces for Type-Specific Events

// Enhanced metrics for different workout types
export interface StrengthMetrics extends PlayerMetrics {
  workoutType: 'strength';
  currentExercise: string;
  currentSet: number;
  totalSets: number;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  reps: number;
  targetReps: number;
  rpe?: number; // Rate of Perceived Exertion
  tempo?: string;
  restTimeRemaining?: number;
  formRating?: number; // 1-5
  oneRepMax?: number;
  percentageOfMax?: number;
}

export interface ConditioningMetrics extends PlayerMetrics {
  workoutType: 'conditioning';
  currentInterval: string;
  intervalType: 'work' | 'rest' | 'warmup' | 'cooldown';
  timeRemaining: number;
  targetZone: { min: number; max: number; name: string };
  currentZone?: string;
  zoneCompliance: number; // 0-100
  powerTarget?: number;
  paceTarget?: string;
  equipment: string;
  totalDistance?: number;
  averagePower?: number;
  normalizedPower?: number;
}

export interface HybridMetrics extends PlayerMetrics {
  workoutType: 'hybrid';
  currentBlock: {
    id: string;
    type: 'exercise' | 'interval' | 'transition';
    name: string;
    index: number;
  };
  blockProgress: number; // 0-100
  // Can contain both strength and conditioning metrics
  strengthData?: Partial<StrengthMetrics>;
  conditioningData?: Partial<ConditioningMetrics>;
  transitionTimeRemaining?: number;
  fatigueLevelEstimate?: number; // 1-10
}

export interface AgilityMetrics extends PlayerMetrics {
  workoutType: 'agility';
  currentDrill: string;
  drillPhase: 'setup' | 'execution' | 'recovery' | 'feedback';
  currentAttempt: number;
  totalAttempts: number;
  currentTime?: number; // milliseconds for current attempt
  bestTime?: number;
  averageTime?: number;
  errorCount: number;
  errorTypes: string[];
  patternAccuracy: number; // 0-100
  reactionTime?: number;
  performanceRating?: 'excellent' | 'good' | 'average' | 'needs_improvement';
}

// Bulk session management
export interface BulkSessionState {
  bundleId: string;
  bundleName: string;
  sessions: TrainingSessionState[];
  status: 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  scheduledStart: Date;
  actualStart?: Date;
  estimatedDuration: number; // minutes
  
  // Resource management
  facilities: { name: string; capacity: number; assigned: number }[];
  equipment: { type: string; total: number; inUse: number }[];
  
  // Participant distribution
  participantDistribution: {
    sessionId: string;
    workoutType: string;
    assignedParticipants: number;
    activeParticipants: number;
    completedParticipants: number;
  }[];
  
  // Cross-session metrics
  aggregateMetrics: {
    totalParticipants: number;
    overallProgress: number;
    averageIntensity?: number;
    totalCaloriesBurned?: number;
    performanceAlerts: number;
  };
}

// Enhanced event payloads for type-specific events
export interface StrengthSetCompletionPayload {
  sessionId: string;
  playerId: string;
  exerciseId: string;
  exerciseName: string;
  setData: {
    setNumber: number;
    totalSets: number;
    reps: number;
    weight: number;
    weightUnit: 'kg' | 'lbs';
    rpe?: number;
    tempo?: string;
    formRating?: number;
  };
  nextSetPreview?: {
    weight: number;
    targetReps: number;
    estimatedRest: number;
  };
  timestamp: Date;
}

export interface ConditioningIntervalTransitionPayload {
  sessionId: string;
  playerId: string;
  transition: {
    fromInterval: { name: string; type: string; intensity: number };
    toInterval: { name: string; type: string; intensity: number; duration: number };
  };
  metrics: {
    lastIntervalAvgHR?: number;
    zoneCompliance: number;
    powerAverage?: number;
  };
  timestamp: Date;
}

export interface HybridBlockTransitionPayload {
  sessionId: string;
  playerId: string;
  blockTransition: {
    fromBlock: { id: string; type: string; name: string };
    toBlock: { id: string; type: string; name: string; estimatedDuration: number };
  };
  overallProgress: number;
  adaptiveAdjustments?: {
    intensityModifier?: number;
    durationModifier?: number;
    reason?: string;
  };
  timestamp: Date;
}

export interface AgilityDrillCompletionPayload {
  sessionId: string;
  playerId: string;
  drillResult: {
    drillId: string;
    drillName: string;
    attemptNumber: number;
    completionTime: number;
    errors: { type: string; description: string }[];
    performanceRating: string;
    improvement?: {
      fromPrevious: number; // milliseconds
      fromBest: number;
      trend: 'improving' | 'stable' | 'declining';
    };
  };
  timestamp: Date;
}

export interface BulkSessionOperationPayload {
  bundleId: string;
  operation: 'start_all' | 'pause_all' | 'resume_all' | 'emergency_stop_all' | 'rebalance_participants';
  affectedSessions: string[];
  operationStatus: 'initiated' | 'in_progress' | 'completed' | 'failed';
  progress: { completed: number; total: number; errors?: string[] };
  executedBy: string;
  estimatedCompletion?: Date;
  timestamp: Date;
}

// Type guards
export function isPlayerMetrics(data: any): data is PlayerMetrics {
  return (
    data &&
    typeof data.playerId === 'string' &&
    typeof data.sessionId === 'string' &&
    data.timestamp instanceof Date
  );
}

export function isExerciseProgress(data: any): data is ExerciseProgress {
  return (
    data &&
    typeof data.playerId === 'string' &&
    typeof data.sessionId === 'string' &&
    typeof data.exerciseId === 'string' &&
    typeof data.setNumber === 'number' &&
    typeof data.completed === 'boolean'
  );
}

export function isIntervalProgress(data: any): data is IntervalProgress {
  return (
    data &&
    typeof data.playerId === 'string' &&
    typeof data.sessionId === 'string' &&
    typeof data.intervalId === 'string' &&
    typeof data.currentInterval === 'number' &&
    typeof data.completed === 'boolean'
  );
}

export function isStrengthMetrics(data: any): data is StrengthMetrics {
  return (
    isPlayerMetrics(data) &&
    (data as Partial<StrengthMetrics>).workoutType === 'strength' &&
    typeof (data as Partial<StrengthMetrics>).currentExercise === 'string' &&
    typeof (data as Partial<StrengthMetrics>).weight === 'number'
  );
}

export function isConditioningMetrics(data: any): data is ConditioningMetrics {
  return (
    isPlayerMetrics(data) &&
    (data as Partial<ConditioningMetrics>).workoutType === 'conditioning' &&
    typeof (data as Partial<ConditioningMetrics>).currentInterval === 'string' &&
    typeof (data as Partial<ConditioningMetrics>).timeRemaining === 'number'
  );
}

export function isHybridMetrics(data: any): data is HybridMetrics {
  return (
    isPlayerMetrics(data) &&
    (data as Partial<HybridMetrics>).workoutType === 'hybrid' &&
    (data as Partial<HybridMetrics>).currentBlock !== undefined &&
    typeof (data as Partial<HybridMetrics>).currentBlock!.type === 'string'
  );
}

export function isAgilityMetrics(data: any): data is AgilityMetrics {
  return (
    isPlayerMetrics(data) &&
    (data as Partial<AgilityMetrics>).workoutType === 'agility' &&
    typeof (data as Partial<AgilityMetrics>).currentDrill === 'string' &&
    typeof (data as Partial<AgilityMetrics>).drillPhase === 'string'
  );
}

export function isBulkSessionOperation(data: any): data is BulkSessionOperationPayload {
  return (
    data &&
    typeof data.bundleId === 'string' &&
    typeof data.operation === 'string' &&
    Array.isArray(data.affectedSessions)
  );
}