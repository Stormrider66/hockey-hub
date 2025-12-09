// Session Builder Types

export type SessionPhaseType = 'warmup' | 'main' | 'accessory' | 'core' | 'cooldown';
export type SessionType = 'strength' | 'conditioning' | 'mixed' | 'agility' | 'hybrid' | 'flexibility' | 'wrestling' | 'power' | 'stability_core' | 'plyometrics' | 'recovery' | 'sprint' | 'sport_specific';
export type LoadUnit = 'kg' | 'lbs' | '%' | 'rpe' | 'time' | 'distance' | 'm/s' | 'watts' | 'seconds' | 'cm';
export type IntensityLevel = 'low' | 'medium' | 'high' | 'max';

/**
 * Strength training modes with specific focus areas
 */
export type StrengthMode = 'strength' | 'power' | 'stability_core' | 'plyometrics';

/**
 * Mode-specific metrics for different strength training types
 */
export interface ModeSpecificMetrics {
  // Power mode metrics
  velocity?: number; // m/s
  powerOutput?: number; // watts
  peakVelocity?: number; // m/s
  
  // Stability/Core mode metrics
  holdTime?: number; // seconds
  balanceDuration?: number; // seconds
  stabilityScore?: number; // 1-10
  
  // Plyometrics mode metrics
  jumpHeight?: number; // cm
  contactTime?: number; // milliseconds
  reactiveStrengthIndex?: number; // calculated
  flightTime?: number; // milliseconds
  landingForce?: number; // relative to bodyweight
}

/**
 * Mode-specific configuration for strength training
 */
export interface StrengthModeConfig {
  mode: StrengthMode;
  name: string;
  description: string;
  color: string;
  icon: string;
  
  // Exercise parameters
  exerciseCategories: string[];
  defaultRestPeriods: {
    betweenSets: number; // seconds
    betweenExercises: number; // seconds
  };
  
  // Rep and set ranges
  defaultRepRange: {
    min: number;
    max: number;
    recommended: number;
  };
  defaultSetRange: {
    min: number;
    max: number;
    recommended: number;
  };
  
  // Intensity characteristics
  intensityFocus: 'strength' | 'power' | 'endurance' | 'stability';
  loadCharacteristics: {
    usePercentage1RM: boolean;
    useVelocity: boolean;
    useTime: boolean;
    useBodyweight: boolean;
  };
  
  // Available metrics
  availableMetrics: (keyof ModeSpecificMetrics)[];
  
  // Equipment preferences
  preferredEquipment: string[];
  
  // Phase emphasis
  phaseEmphasis: Record<SessionPhaseType, number>; // percentage allocation
}

export interface ExerciseFilters {
  category: SessionPhaseType | 'all';
  equipment: string[];
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all';
  searchTerm: string;
  showMostUsed: boolean;
  strengthMode?: StrengthMode; // Filter by strength mode
}

export interface DroppableExercise {
  id: string;
  templateId: string;
  name: string;
  category: string;
  equipment: string[];
  muscleGroups: string[];
  defaultSets: number;
  defaultReps: number;
  defaultDuration?: number;
  restPeriod: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string;
  coachingCues?: string[];
}

export interface SessionExercise extends DroppableExercise {
  sessionExerciseId: string; // Unique ID for this instance in the session
  phaseType: SessionPhaseType;
  orderIndex: number;
  sets: number;
  reps?: number;
  duration?: number;
  distance?: number;
  weight?: number;
  rest: number;
  intensity?: IntensityLevel;
  loadCalculation?: LoadCalculation;
  notes?: string;
  targetRPE?: number;
  supersetWith?: string[]; // IDs of exercises in same superset
  
  // Mode-specific metrics
  modeSpecificMetrics?: ModeSpecificMetrics;
  
  // Mode-specific exercise properties
  strengthMode?: StrengthMode;
  isExplosive?: boolean; // For power/plyometrics
  requiresStability?: boolean; // For stability_core
  usesEccentricControl?: boolean; // For strength
}

export interface LoadCalculation {
  type: 'percentage' | 'absolute' | 'rpe' | 'bodyweight';
  referenceTest?: string; // e.g., "Squat 1RM", "Bench Press 1RM"
  percentage?: number; // e.g., 75 for 75%
  absoluteValue?: number;
  unit?: LoadUnit;
  playerLoads?: PlayerLoad[]; // Individual calculations
}

export interface PlayerLoad {
  playerId: string;
  playerName: string;
  calculatedLoad: number;
  unit: LoadUnit;
  adjustmentFactor?: number; // For fatigue, wellness, etc.
  note?: string;
}

export interface SessionPhase {
  type: SessionPhaseType;
  name: string;
  exercises: SessionExercise[];
  duration: number; // Total duration in minutes
  targetIntensity?: IntensityLevel;
}

export interface SessionTemplate {
  id?: string;
  name: string;
  description?: string;
  type: SessionType;
  phases: SessionPhase[];
  totalDuration: number;
  equipmentRequired: string[];
  targetPlayers?: string[];
  targetTeams?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isPublic?: boolean;
  organizationId?: string;
  schedule?: {
    startDate: Date;
    startTime: string;
    location?: string;
    recurrence?: any;
    reminders?: any;
  };
  
  // Strength-specific properties
  strengthMode?: StrengthMode;
  modeConfig?: StrengthModeConfig;
}

export interface SessionBuilderState {
  currentSession: SessionTemplate | null;
  isDirty: boolean;
  history: SessionTemplate[];
  historyIndex: number;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt?: Date;
  draftId?: string;
}

export interface DragItem {
  id: string;
  type: 'exercise' | 'phase';
  exercise?: DroppableExercise;
  sourcePhase?: SessionPhaseType;
  sourceIndex?: number;
}

export interface DropResult {
  targetPhase: SessionPhaseType;
  targetIndex: number;
}

export interface SessionSchedule {
  startDate: Date;
  startTime: string;
  location?: string;
  participants: {
    playerIds?: string[];
    teamIds?: string[];
  };
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: Date;
    count?: number;
  };
  reminders?: {
    enabled: boolean;
    minutesBefore: number[];
  };
}

export interface BulkAssignment {
  sessionTemplate: SessionTemplate;
  targets: {
    playerIds?: string[];
    teamIds?: string[];
  };
  schedule: SessionSchedule;
  individualizeLoads: boolean;
  skipConflicts: boolean;
}

export interface TestData {
  id: string;
  playerId: string;
  testType: string;
  value: number;
  unit: string;
  date: Date;
  category: string;
}

export interface SessionBuilderAnalytics {
  totalVolume: number;
  estimatedCalories: number;
  muscleGroupDistribution: Record<string, number>;
  equipmentNeeded: string[];
  difficultyScore: number;
  restToWorkRatio: number;
  peakIntensityPhase: SessionPhaseType;
}

export interface ExerciseUsageStats {
  exerciseId: string;
  timesUsed: number;
  lastUsed?: Date;
  averageRating?: number;
  playerFeedback?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}