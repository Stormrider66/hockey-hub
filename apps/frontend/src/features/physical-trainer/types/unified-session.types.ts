/**
 * Unified Workout Session Types
 * 
 * This file provides a unified data structure for all workout types (Strength, Conditioning, Hybrid, Agility)
 * while maintaining type safety through discriminated unions.
 */

import type { 
  Exercise, 
  ExerciseSet, 
  WorkoutExercise 
} from './exercise.types';
import type { 
  IntervalProgram, 
  IntervalBlock 
} from './interval.types';
import type { 
  HybridProgram, 
  HybridBlock 
} from './hybrid.types';
import type { 
  AgilityProgram, 
  AgilityDrill 
} from './agility.types';

// ============================================================================
// Enums and Constants
// ============================================================================

export enum WorkoutType {
  STRENGTH = 'STRENGTH',
  CONDITIONING = 'CONDITIONING',
  HYBRID = 'HYBRID',
  AGILITY = 'AGILITY'
}

export enum WorkoutStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  TEMPLATE = 'TEMPLATE'
}

export enum WorkoutDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  ELITE = 'ELITE'
}

export enum WorkoutVisibility {
  PRIVATE = 'PRIVATE',
  TEAM = 'TEAM',
  ORGANIZATION = 'ORGANIZATION',
  PUBLIC = 'PUBLIC'
}

// ============================================================================
// Base Program Types (for reference)
// ============================================================================

export interface StrengthProgram {
  exercises: WorkoutExercise[];
  supersets?: number[][];
  circuits?: {
    name: string;
    exerciseIndices: number[];
    rounds: number;
    restBetweenRounds: number;
  }[];
}

// ============================================================================
// Discriminated Union for Workout Content
// ============================================================================

export type WorkoutContent = 
  | { type: WorkoutType.STRENGTH; program: StrengthProgram }
  | { type: WorkoutType.CONDITIONING; program: IntervalProgram }
  | { type: WorkoutType.HYBRID; program: HybridProgram }
  | { type: WorkoutType.AGILITY; program: AgilityProgram };

// ============================================================================
// Common Metadata
// ============================================================================

export interface SessionMetadata {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  category?: string;
  imageUrl?: string;
  
  // Tracking
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy?: string;
  
  // Versioning
  version: number;
  parentId?: string; // For tracking template relationships
  isTemplate: boolean;
  templateId?: string; // If created from template
  
  // Status and visibility
  status: WorkoutStatus;
  visibility: WorkoutVisibility;
  
  // Performance metrics
  estimatedDuration: number; // in minutes
  actualDuration?: number; // tracked during execution
  difficulty: WorkoutDifficulty;
  intensityLevel?: number; // 1-10 scale
  
  // Analytics
  timesUsed: number;
  lastUsedAt?: Date;
  averageRating?: number;
  completionRate?: number;
}

// ============================================================================
// Assignment and Scheduling
// ============================================================================

export interface PlayerAssignment {
  playerId: string;
  playerName: string;
  customizations?: {
    loadAdjustment?: number; // percentage adjustment
    alternativeExercises?: Record<string, string>; // exerciseId -> alternativeId
    notes?: string;
  };
}

export interface TeamAssignment {
  teamId: string;
  teamName: string;
  includedPlayers?: string[]; // specific player IDs, undefined = all
  excludedPlayers?: string[]; // player IDs to exclude
}

export interface AssignmentData {
  players?: PlayerAssignment[];
  teams?: TeamAssignment[];
  groups?: {
    groupId: string;
    groupName: string;
    playerIds: string[];
  }[];
  
  // Assignment metadata
  assignedBy: string;
  assignedAt: Date;
  dueDate?: Date;
  mandatory: boolean;
  allowModifications: boolean;
}

export interface ScheduleData {
  scheduledDate: Date;
  scheduledTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  
  location?: {
    facilityId?: string;
    facilityName: string;
    area?: string; // e.g., "Weight Room", "Track", "Field"
    notes?: string;
  };
  
  recurring?: {
    frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    daysOfWeek?: number[]; // 0-6, Sunday-Saturday
    endDate?: Date;
    exceptions?: Date[]; // dates to skip
  };
  
  reminders?: {
    type: 'EMAIL' | 'PUSH' | 'SMS';
    timing: number; // minutes before
  }[];
}

// ============================================================================
// Equipment and Resources
// ============================================================================

export interface EquipmentRequirement {
  equipmentId: string;
  name: string;
  quantity?: number;
  alternatives?: string[]; // alternative equipment IDs
  optional?: boolean;
}

export interface ResourceRequirements {
  equipment: EquipmentRequirement[];
  space?: {
    type: 'INDOOR' | 'OUTDOOR' | 'BOTH';
    minimumArea?: number; // square meters
    specificRequirements?: string[]; // e.g., "turf", "track", "mirrors"
  };
  staffing?: {
    trainersRequired: number;
    assistantsRequired?: number;
    specializations?: string[]; // e.g., "strength coach", "physio"
  };
}

// ============================================================================
// Medical Considerations
// ============================================================================

export interface MedicalConsiderations {
  restrictions?: {
    exerciseIds?: string[]; // specific exercises to avoid
    movementPatterns?: string[]; // e.g., "overhead", "jumping"
    intensityLimit?: number; // max heart rate or percentage
    loadLimit?: number; // max weight in kg
  };
  
  warnings?: {
    level: 'INFO' | 'CAUTION' | 'WARNING' | 'CRITICAL';
    message: string;
    affectedPlayers?: string[];
    suggestedActions?: string[];
  }[];
  
  adaptations?: {
    playerId: string;
    originalExerciseId: string;
    alternativeExerciseId: string;
    reason: string;
    approvedBy?: string;
    approvedAt?: Date;
  }[];
  
  clearanceRequired?: {
    players: string[];
    clearedBy?: string;
    clearedAt?: Date;
    expiresAt?: Date;
  };
}

// ============================================================================
// Unified Workout Session
// ============================================================================

export interface UnifiedWorkoutSession {
  // Core identity
  content: WorkoutContent;
  metadata: SessionMetadata;
  
  // Assignment and scheduling
  assignment?: AssignmentData;
  schedule?: ScheduleData;
  
  // Resources and requirements
  resources: ResourceRequirements;
  
  // Medical and safety
  medical?: MedicalConsiderations;
  
  // Additional data
  notes?: {
    coachNotes?: string;
    internalNotes?: string;
    playerInstructions?: string;
  };
  
  // Performance targets
  targets?: {
    heartRateZones?: {
      zone1?: [number, number]; // [min, max] bpm
      zone2?: [number, number];
      zone3?: [number, number];
      zone4?: [number, number];
      zone5?: [number, number];
    };
    powerTargets?: {
      ftp?: number; // watts
      zones?: Record<string, [number, number]>;
    };
    paceTargets?: {
      easy?: number; // min/km
      moderate?: number;
      hard?: number;
      sprint?: number;
    };
  };
  
  // Completion tracking
  completion?: {
    startedAt?: Date;
    completedAt?: Date;
    completedBy?: string[];
    partialCompletion?: {
      playerId: string;
      percentageComplete: number;
      lastActivityAt: Date;
    }[];
  };
  
  // Feedback and results
  results?: {
    playerId: string;
    completedAt: Date;
    duration: number;
    feedback?: {
      rpe?: number; // 1-10
      difficulty?: number; // 1-10
      comments?: string;
    };
    performance?: Record<string, any>; // flexible for different workout types
  }[];
}

// ============================================================================
// Type Guards
// ============================================================================

export function isStrengthWorkout(
  content: WorkoutContent
): content is { type: WorkoutType.STRENGTH; program: StrengthProgram } {
  return content.type === WorkoutType.STRENGTH;
}

export function isConditioningWorkout(
  content: WorkoutContent
): content is { type: WorkoutType.CONDITIONING; program: IntervalProgram } {
  return content.type === WorkoutType.CONDITIONING;
}

export function isHybridWorkout(
  content: WorkoutContent
): content is { type: WorkoutType.HYBRID; program: HybridProgram } {
  return content.type === WorkoutType.HYBRID;
}

export function isAgilityWorkout(
  content: WorkoutContent
): content is { type: WorkoutType.AGILITY; program: AgilityProgram } {
  return content.type === WorkoutType.AGILITY;
}

// ============================================================================
// Utility Types
// ============================================================================

export type WorkoutSessionCreate = Omit<UnifiedWorkoutSession, 
  'metadata' | 'completion' | 'results'
> & {
  metadata: Omit<SessionMetadata, 
    'id' | 'createdAt' | 'updatedAt' | 'version' | 
    'timesUsed' | 'lastUsedAt' | 'averageRating' | 'completionRate'
  >;
};

export type WorkoutSessionUpdate = Partial<WorkoutSessionCreate>;

export type WorkoutSessionSummary = Pick<UnifiedWorkoutSession, 
  'metadata' | 'content'
> & {
  content: {
    type: WorkoutType;
  };
  assignment?: {
    playerCount: number;
    teamCount: number;
  };
  schedule?: Pick<ScheduleData, 'scheduledDate' | 'location'>;
};

// ============================================================================
// Default Generators
// ============================================================================

export function createDefaultMetadata(
  overrides?: Partial<SessionMetadata>
): Omit<SessionMetadata, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: 'New Workout Session',
    tags: [],
    createdBy: '',
    version: 1,
    isTemplate: false,
    status: WorkoutStatus.DRAFT,
    visibility: WorkoutVisibility.PRIVATE,
    estimatedDuration: 60,
    difficulty: WorkoutDifficulty.INTERMEDIATE,
    timesUsed: 0,
    ...overrides
  };
}

export function createDefaultResourceRequirements(): ResourceRequirements {
  return {
    equipment: [],
    space: {
      type: 'BOTH'
    },
    staffing: {
      trainersRequired: 1
    }
  };
}

// ============================================================================
// Conversion Utilities
// ============================================================================

export function convertToUnifiedSession(
  type: WorkoutType,
  program: StrengthProgram | IntervalProgram | HybridProgram | AgilityProgram,
  metadata: Partial<SessionMetadata> = {}
): Omit<UnifiedWorkoutSession, 'metadata'> & { 
  metadata: Omit<SessionMetadata, 'id' | 'createdAt' | 'updatedAt'> 
} {
  let content: WorkoutContent;
  
  switch (type) {
    case WorkoutType.STRENGTH:
      content = { type, program: program as StrengthProgram };
      break;
    case WorkoutType.CONDITIONING:
      content = { type, program: program as IntervalProgram };
      break;
    case WorkoutType.HYBRID:
      content = { type, program: program as HybridProgram };
      break;
    case WorkoutType.AGILITY:
      content = { type, program: program as AgilityProgram };
      break;
  }
  
  return {
    content,
    metadata: createDefaultMetadata(metadata),
    resources: createDefaultResourceRequirements()
  };
}

// ============================================================================
// Validation Schemas (using type predicates for now)
// ============================================================================

export function validateWorkoutSession(
  session: unknown
): session is UnifiedWorkoutSession {
  if (!session || typeof session !== 'object') return false;
  
  const s = session as any;
  
  // Check required fields
  if (!s.content || !s.metadata || !s.resources) return false;
  
  // Check content type
  if (!Object.values(WorkoutType).includes(s.content.type)) return false;
  if (!s.content.program) return false;
  
  // Check metadata
  if (!s.metadata.id || !s.metadata.name || !s.metadata.createdBy) return false;
  if (!Object.values(WorkoutStatus).includes(s.metadata.status)) return false;
  if (!Object.values(WorkoutVisibility).includes(s.metadata.visibility)) return false;
  if (!Object.values(WorkoutDifficulty).includes(s.metadata.difficulty)) return false;
  
  // Basic type checks pass
  return true;
}

// ============================================================================
// Migration Helpers
// ============================================================================

export interface LegacyWorkoutSession {
  id: number;
  name: string;
  exercises?: WorkoutExercise[];
  intervalProgram?: IntervalProgram;
  // ... other legacy fields
}

export function migrateLegacySession(
  legacy: LegacyWorkoutSession,
  createdBy: string
): UnifiedWorkoutSession {
  // Determine type based on content
  let content: WorkoutContent;
  let estimatedDuration = 60;
  
  if (legacy.intervalProgram) {
    content = {
      type: WorkoutType.CONDITIONING,
      program: legacy.intervalProgram
    };
    estimatedDuration = legacy.intervalProgram.intervals.reduce(
      (sum, interval) => sum + interval.duration + (interval.restDuration || 0),
      0
    ) / 60;
  } else if (legacy.exercises) {
    content = {
      type: WorkoutType.STRENGTH,
      program: {
        exercises: legacy.exercises
      }
    };
    estimatedDuration = legacy.exercises.length * 3; // rough estimate
  } else {
    throw new Error('Cannot determine workout type from legacy session');
  }
  
  return {
    content,
    metadata: {
      id: String(legacy.id),
      name: legacy.name,
      tags: [],
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      isTemplate: false,
      status: WorkoutStatus.PUBLISHED,
      visibility: WorkoutVisibility.TEAM,
      estimatedDuration,
      difficulty: WorkoutDifficulty.INTERMEDIATE,
      timesUsed: 0
    },
    resources: createDefaultResourceRequirements()
  };
}