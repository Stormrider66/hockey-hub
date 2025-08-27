// Common types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Training types
export type WorkoutType = 'strength' | 'cardio' | 'skill' | 'recovery' | 'mixed';
export type WorkoutStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type ExerciseCategory = 'strength' | 'cardio' | 'skill' | 'mobility' | 'recovery';
export type ExerciseUnit = 'reps' | 'seconds' | 'meters' | 'watts' | 'kilograms';
export type ExecutionStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'abandoned';

export interface WorkoutSession {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  type: WorkoutType;
  status: WorkoutStatus;
  scheduledDate: Date;
  location: string;
  teamId: string;
  playerIds: string[];
  estimatedDuration: number;
  settings: {
    allowIndividualLoads: boolean;
    displayMode: 'grid' | 'focus' | 'tv';
    showMetrics: boolean;
    autoRotation: boolean;
    rotationInterval: number;
  };
  exercises: Exercise[];
  playerLoads: PlayerWorkoutLoad[];
  executions?: WorkoutExecution[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  orderIndex: number;
  sets?: number;
  reps?: number;
  duration?: number;
  restDuration?: number;
  unit: ExerciseUnit;
  targetValue?: number;
  equipment?: string;
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
  intensityZones?: {
    zone1: { min: number; max: number; name: string };
    zone2: { min: number; max: number; name: string };
    zone3: { min: number; max: number; name: string };
    zone4: { min: number; max: number; name: string };
    zone5: { min: number; max: number; name: string };
  };
  workoutSessionId: string;
}

export interface PlayerWorkoutLoad {
  id: string;
  playerId: string;
  loadModifier: number;
  exerciseModifications?: {
    [exerciseId: string]: {
      sets?: number;
      reps?: number;
      duration?: number;
      targetValue?: number;
      restDuration?: number;
      notes?: string;
    };
  };
  notes?: string;
  isActive: boolean;
  workoutSessionId: string;
  createdAt: Date;
}

export interface WorkoutExecution {
  id: string;
  playerId: string;
  workoutSessionId: string;
  status: ExecutionStatus;
  startedAt?: Date;
  completedAt?: Date;
  currentExerciseIndex: number;
  currentSetNumber: number;
  completionPercentage?: number;
  metrics?: {
    heartRate?: number[];
    power?: number[];
    speed?: number[];
    calories?: number;
    averageHeartRate?: number;
    maxHeartRate?: number;
    averagePower?: number;
  };
  deviceData?: {
    deviceId?: string;
    deviceType?: string;
    lastSync?: Date;
  };
  exerciseExecutions?: ExerciseExecution[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseExecution {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  actualReps?: number;
  actualWeight?: number;
  actualDuration?: number;
  actualDistance?: number;
  actualPower?: number;
  restTaken?: number;
  performanceMetrics?: {
    heartRate?: number;
    maxHeartRate?: number;
    averagePower?: number;
    maxPower?: number;
    speed?: number;
    cadence?: number;
    rpe?: number;
  };
  notes?: string;
  skipped: boolean;
  workoutExecutionId: string;
  completedAt: Date;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  category: ExerciseCategory;
  description?: string;
  primaryUnit: ExerciseUnit;
  equipment?: string[];
  muscleGroups?: string[];
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
  defaultParameters?: {
    sets?: number;
    reps?: number;
    duration?: number;
    restDuration?: number;
    intensityLevel?: 'low' | 'medium' | 'high' | 'max';
  };
  progressionGuidelines?: {
    beginnerRange?: { min: number; max: number };
    intermediateRange?: { min: number; max: number };
    advancedRange?: { min: number; max: number };
    unit: string;
  };
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Common constants
export const USER_ROLES = {
  ADMIN: 'admin',
  CLUB_ADMIN: 'club_admin',
  COACH: 'coach',
  PLAYER: 'player',
  PARENT: 'parent',
  MEDICAL_STAFF: 'medical_staff',
  EQUIPMENT_MANAGER: 'equipment_manager',
  PHYSICAL_TRAINER: 'physical_trainer'
} as const;

// Base entities
export * from './entities';

// DTOs
export * from './dto';

// Services
export * from './services';

// Saga
export * from './saga';

// Cache
export * from './cache';

// Validation
export * from './validation';

// Middleware: export specific to avoid name clashes
export { validationMiddleware, validateBody, validateQuery, validateParams, validate } from './middleware/validationMiddleware';
export { createAuthMiddleware, SharedAuthMiddleware } from './middleware/auth.middleware';
export { createLoggingMiddleware, errorLoggingMiddleware } from './middleware/loggingMiddleware';
export { sanitize, sanitizeAndValidate, validateFileUpload } from './middleware/sanitizationMiddleware';
// Additional compat re-exports for tests referencing file paths
export { SharedAuthMiddleware as authMiddleware } from './middleware/auth.middleware';
export { errorHandler } from './errors/ErrorHandler';

// Explicit named exports to ensure availability across project refs
// (already exported above, keep single definition)

// Errors
export * from './errors';

// Utilities
export * from './utils';

// Socket events
export * from './types/socket-events';

// Events
export { EventBus, getGlobalEventBus } from './events/EventBus';
export { EventFactory } from './events/EventFactory';
export * from './events/EventPublisher';
export * from './events/training-events';
export * from './events/training-event-listeners';

// Testing utilities (explicit re-exports for test environments)
export * from './testing';
// Explicit named exports to ensure availability when tests partially mock the module
import { MockFactory as __MockFactory } from './testing/mockFactory';
export { __MockFactory as MockFactory };
export * as testHelpers from './testing/testHelpers';

// Testing utilities (only export in non-production environments)
if (process.env.NODE_ENV !== 'production') {
  module.exports.testing = require('./testing');
  try {
    // Ensure MockFactory is available even under CommonJS jest mocks
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    module.exports.MockFactory = require('./testing/mockFactory').MockFactory;
  } catch {}
}

// Utility functions
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const parseJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString());
  } catch (error) {
    return null;
  }
};

// Pagination types
export * from './types/pagination';