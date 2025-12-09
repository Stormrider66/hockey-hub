// Strength Training Types

import { BaseEntity } from './base-types';
import { WorkoutCreationContext } from './index';

// Core strength workout structure
export interface StrengthWorkout {
  id?: string;
  name: string;
  description?: string;
  exercises: StrengthExercise[];
  totalDuration: number; // estimated in minutes
  warmupExercises?: StrengthExercise[];
  cooldownExercises?: StrengthExercise[];
  notes?: string;
}

// Individual strength exercise
export interface StrengthExercise extends BaseEntity {
  name: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  equipment: EquipmentType[];
  
  // Exercise parameters
  sets: number;
  reps?: number; // Can be undefined for time-based or to-failure exercises
  duration?: number; // For timed exercises (in seconds)
  weight?: number; // In kg
  restBetweenSets: number; // In seconds
  
  // Advanced parameters
  tempo?: string; // e.g., "3-1-2-1" (eccentric-pause-concentric-pause)
  rpe?: number; // Rate of Perceived Exertion (1-10)
  percentage1RM?: number; // Percentage of 1-rep max
  
  // Exercise guidance
  instructions?: string[];
  coachingCues?: string[];
  videoUrl?: string;
  imageUrl?: string;
  
  // Progression tracking
  orderIndex: number;
  supersetGroup?: string; // Groups exercises into supersets
  isCompound: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  
  // Safety and modifications
  spotterRequired?: boolean;
  safetyNotes?: string[];
  modifications?: ExerciseModification[];
  contraindications?: string[];
}

// Exercise categories for organization
export enum ExerciseCategory {
  SQUAT = 'squat',
  DEADLIFT = 'deadlift',
  BENCH_PRESS = 'bench_press',
  OVERHEAD_PRESS = 'overhead_press',
  ROW = 'row',
  PULL_UP = 'pull_up',
  LUNGE = 'lunge',
  CORE = 'core',
  ACCESSORY = 'accessory',
  MOBILITY = 'mobility',
  PLYOMETRIC = 'plyometric',
  OLYMPIC_LIFT = 'olympic_lift'
}

// Muscle groups for targeting
export enum MuscleGroup {
  CHEST = 'chest',
  BACK = 'back',
  SHOULDERS = 'shoulders',
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  FOREARMS = 'forearms',
  CORE = 'core',
  QUADRICEPS = 'quadriceps',
  HAMSTRINGS = 'hamstrings',
  GLUTES = 'glutes',
  CALVES = 'calves',
  FULL_BODY = 'full_body'
}

// Equipment types
export enum EquipmentType {
  BARBELL = 'barbell',
  DUMBBELLS = 'dumbbells',
  KETTLEBELLS = 'kettlebells',
  CABLE_MACHINE = 'cable_machine',
  SMITH_MACHINE = 'smith_machine',
  BENCH = 'bench',
  SQUAT_RACK = 'squat_rack',
  PULL_UP_BAR = 'pull_up_bar',
  RESISTANCE_BANDS = 'resistance_bands',
  MEDICINE_BALL = 'medicine_ball',
  BODYWEIGHT = 'bodyweight',
  PLATE_LOADED = 'plate_loaded',
  MACHINE = 'machine',
  SUSPENSION_TRAINER = 'suspension_trainer',
  BATTLE_ROPES = 'battle_ropes'
}

// Exercise modifications for different fitness levels or restrictions
export interface ExerciseModification {
  id: string;
  name: string;
  description: string;
  difficulty: 'easier' | 'harder';
  equipment?: EquipmentType[];
  suitableFor?: string[]; // e.g., ['beginners', 'injured_shoulder', 'low_mobility']
}

// Superset grouping
export interface Superset {
  id: string;
  name: string;
  exercises: StrengthExercise[];
  restBetweenExercises: number; // seconds
  restBetweenSets: number; // seconds
  totalSets: number;
}

// Exercise execution data for tracking performance
export interface ExerciseExecution extends BaseEntity {
  exerciseId: string;
  sessionId: string;
  playerId: string;
  
  // Actual performance
  actualSets: number;
  actualReps?: number[];
  actualWeight?: number[];
  actualDuration?: number[];
  actualRest?: number[];
  
  // Performance metrics
  peakPower?: number;
  averagePower?: number;
  velocityData?: number[];
  heartRate?: number[];
  
  // Subjective measures
  rpe: number;
  form: number; // 1-10 scale
  difficulty: number; // 1-10 scale
  
  // Notes and feedback
  notes?: string;
  coachFeedback?: string;
  videoRecording?: string;
  
  // Completion status
  completed: boolean;
  skipped: boolean;
  skipReason?: string;
}

// Strength workout templates
export interface StrengthTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'full_body' | 'upper_body' | 'lower_body' | 'push' | 'pull' | 'legs' | 'custom';
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  duration: number; // estimated minutes
  exercises: StrengthExercise[];
  focusAreas: MuscleGroup[];
  equipmentRequired: EquipmentType[];
  
  // Template metadata
  createdBy: string;
  usageCount: number;
  averageRating: number;
  lastUsed?: string;
  tags: string[];
  isPublic: boolean;
}

// Load calculation methods
export interface LoadCalculation {
  method: 'percentage' | 'rpe' | 'velocity' | 'absolute';
  referenceType?: '1rm' | '3rm' | '5rm' | 'previous_session';
  percentage?: number;
  targetRpe?: number;
  targetVelocity?: number;
  absoluteWeight?: number;
}

// Player-specific load assignments
export interface PlayerLoad {
  playerId: string;
  playerName: string;
  exerciseId: string;
  
  // Calculated loads
  calculatedWeight: number;
  adjustmentFactor: number; // Based on readiness, fatigue, etc.
  finalWeight: number;
  
  // Context for calculation
  referenceValue?: number; // 1RM, previous best, etc.
  calculationMethod: LoadCalculation;
  lastUpdated: string;
  
  // Restrictions and modifications
  restrictions?: string[];
  modifications?: string[];
  approved: boolean;
  approvedBy?: string;
}

// Strength workout analytics
export interface StrengthAnalytics {
  sessionId: string;
  playerId: string;
  
  // Volume metrics
  totalVolume: number; // Total weight lifted (kg)
  volumeByMuscleGroup: Record<MuscleGroup, number>;
  volumeByExercise: Record<string, number>;
  
  // Intensity metrics
  averageIntensity: number; // % of 1RM
  peakIntensity: number;
  timeUnderTension: number; // Total seconds
  
  // Performance indicators
  powerOutput?: number;
  velocityLoss?: number;
  strengthGain?: number; // Compared to previous sessions
  
  // Efficiency metrics
  restEfficiency: number; // Actual vs. planned rest
  formScore: number; // Average form rating
  completionRate: number; // % of planned work completed
}

// Progression tracking
export interface StrengthProgression {
  playerId: string;
  exerciseId: string;
  exerciseName: string;
  
  // Historical data
  sessions: {
    date: string;
    bestSet: {
      weight: number;
      reps: number;
      rpe?: number;
      estimated1RM?: number;
    };
    volume: number;
    averageRpe: number;
  }[];
  
  // Current status
  current1RM?: number;
  lastImprovement?: string;
  plateauDuration?: number; // Days since last improvement
  
  // Recommendations
  nextProgression?: {
    type: 'weight' | 'reps' | 'sets' | 'frequency';
    value: number;
    reason: string;
  };
}

// Export utility types
export type ExerciseCategoryType = keyof typeof ExerciseCategory;
export type MuscleGroupType = keyof typeof MuscleGroup;
export type EquipmentTypeName = keyof typeof EquipmentType;

// New types for StrengthWorkoutBuilder component
export type PhaseType = 'warmup' | 'main' | 'accessory' | 'core' | 'cooldown';

export interface StrengthPhase {
  id: string;
  type: PhaseType;
  name: string;
  exercises: StrengthExercise[];
  duration?: number; // Estimated in minutes
  targetRPE?: number;
  notes?: string;
}

export interface StrengthProgram {
  id: string;
  name: string;
  description?: string;
  phases: StrengthPhase[];
  totalDuration: number; // In minutes
  equipmentRequired: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  focusAreas: MuscleGroup[];
  totalVolume?: number; // Total weight moved
  metadata?: {
    sessionId?: string;
    sessionType?: string;
    sessionDate?: string;
    sessionTime?: string;
    sessionLocation?: string;
  };
}

export interface StrengthWorkoutBuilderProps {
  onSave: (program: StrengthProgram, playerIds?: string[], teamIds?: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: StrengthProgram;
  workoutId?: string;
  workoutContext?: WorkoutCreationContext | null;
}

// Constants
export const PHASE_CONFIGS: Record<PhaseType, { label: string; color: string; defaultDuration: number }> = {
  warmup: { label: 'Warm Up', color: '#10b981', defaultDuration: 10 },
  main: { label: 'Main Work', color: '#3b82f6', defaultDuration: 30 },
  accessory: { label: 'Accessory', color: '#8b5cf6', defaultDuration: 15 },
  core: { label: 'Core', color: '#f59e0b', defaultDuration: 10 },
  cooldown: { label: 'Cool Down', color: '#6b7280', defaultDuration: 5 }
};

export const DEFAULT_REST_PERIODS = {
  strength: 180, // 3 minutes
  hypertrophy: 90, // 1.5 minutes
  endurance: 45, // 45 seconds
  power: 240 // 4 minutes
};