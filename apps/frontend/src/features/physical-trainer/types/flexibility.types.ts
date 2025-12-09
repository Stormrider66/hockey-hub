/**
 * Flexibility Workout Types
 * 
 * Type definitions for flexibility training sessions with hold-time based mechanics,
 * breathing patterns, and sequential flow management.
 */

import { BaseEntity } from './index';

// Core flexibility types
export type StretchType = 'static' | 'dynamic' | 'pnf' | 'ballistic';
export type FlexibilityPhase = 'warmup' | 'static_stretches' | 'dynamic_stretches' | 'cooldown';
export type BodyPart = 'neck' | 'shoulders' | 'chest' | 'back' | 'arms' | 'core' | 'hips' | 
                      'glutes' | 'quadriceps' | 'hamstrings' | 'calves' | 'ankles' | 'full_body';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type FlexibilityEquipment = 'mat' | 'blocks' | 'straps' | 'foam_roller' | 'resistance_band' | 
                                   'towel' | 'wall' | 'chair' | 'none';

// Breathing pattern configuration
export interface BreathingPattern {
  name: string;
  description: string;
  inhaleCount: number;  // seconds
  holdCount: number;    // seconds
  exhaleCount: number;  // seconds
  cycles: number;       // number of complete breath cycles per stretch
  cue?: string;         // instructional cue for the pattern
}

// Range of motion tracking
export interface RangeOfMotion {
  initial: number;      // starting range in degrees or measurement
  target: number;       // target range to achieve
  current?: number;     // current measured range
  unit: 'degrees' | 'inches' | 'cm' | 'percentage';
  improvementRate?: number; // expected improvement per session
}

// Stretch exercise definition
export interface StretchExercise extends BaseEntity {
  name: string;
  description: string;
  type: StretchType;
  bodyParts: BodyPart[];
  difficulty: DifficultyLevel;
  equipment: FlexibilityEquipment[];
  
  // Timing and progression
  defaultHoldTime: number;      // in seconds
  minHoldTime: number;
  maxHoldTime: number;
  progressionSteps: number[];   // hold time progression [30, 45, 60, 90]
  
  // Breathing and technique
  breathingPattern?: BreathingPattern;
  isUnilateral: boolean;        // requires left/right sides
  requiresPartner: boolean;     // partner-assisted stretch
  
  // Range of motion
  rangeOfMotion?: RangeOfMotion;
  
  // Instructions and safety
  setupInstructions: string[];
  executionCues: string[];
  safetyNotes: string[];
  modifications: string[];      // for different skill levels or restrictions
  
  // Media
  videoUrl?: string;
  imageUrl?: string;
  diagramUrl?: string;
  
  // Sequencing
  idealPreviousStretches?: string[]; // exercise IDs that pair well before
  idealNextStretches?: string[];     // exercise IDs that pair well after
  
  // Analytics
  averageEffectiveness?: number;     // 1-10 rating
  commonMistakes?: string[];
}

// Flexibility program phase
export interface FlexibilityProgramPhase {
  id: string;
  type: FlexibilityPhase;
  name: string;
  description?: string;
  duration: number;             // total phase duration in seconds
  exercises: FlexibilitySequenceItem[];
  instructions?: string;
  musicTempo?: number;          // BPM for background music
  color: string;                // UI color for phase
}

// Individual stretch in a sequence
export interface FlexibilitySequenceItem {
  id: string;
  exerciseId: string;
  exercise?: StretchExercise;   // populated exercise data
  holdTime: number;             // actual hold time for this instance
  repetitions: number;          // how many times to repeat
  side?: 'left' | 'right' | 'both'; // for unilateral stretches
  restAfter?: number;           // rest time after this stretch in seconds
  
  // Customizations for this instance
  customBreathingPattern?: BreathingPattern;
  personalizedCues?: string[];
  targetROM?: number;           // target range of motion for this session
  
  // Transitions
  transitionFrom?: string;      // how to move from previous stretch
  transitionTo?: string;        // how to move to next stretch
  transitionDuration?: number;  // time for transition in seconds
  
  // Execution tracking
  completed?: boolean;
  actualHoldTime?: number;
  actualRepetitions?: number;
  romAchieved?: number;
  playerNotes?: string;
}

// Complete flexibility program
export interface FlexibilityProgram extends BaseEntity {
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  totalDuration: number;        // in seconds
  
  // Program structure
  phases: FlexibilityProgramPhase[];
  
  // Target outcomes
  primaryGoals: ('mobility' | 'recovery' | 'performance' | 'injury_prevention' | 'posture')[];
  targetBodyParts: BodyPart[];
  
  // Session settings
  allowCustomHoldTimes: boolean;
  requiresInstructor: boolean;
  supportsGroupSession: boolean;
  maxParticipants?: number;
  
  // Environment
  recommendedEnvironment: ('quiet' | 'music' | 'guided' | 'nature_sounds')[];
  temperatureRange?: { min: number; max: number }; // Celsius
  
  // Equipment needed
  requiredEquipment: FlexibilityEquipment[];
  optionalEquipment: FlexibilityEquipment[];
  
  // Analytics
  averageRating?: number;
  completionRate?: number;
  averageImprovement?: number;  // ROM improvement percentage
  
  tags: string[];
}

// Session execution and tracking
export interface FlexibilitySessionExecution extends BaseEntity {
  programId: string;
  playerId: string;
  playerName?: string;
  sessionDate: string;
  startTime: string;
  endTime?: string;
  
  status: 'scheduled' | 'in_progress' | 'completed' | 'abandoned';
  currentPhaseIndex: number;
  currentItemIndex: number;
  completionPercentage: number;
  
  // Execution details
  phaseExecutions: FlexibilityPhaseExecution[];
  
  // Session outcomes
  overallRating?: number;       // 1-10 player satisfaction
  perceivedEffort?: number;     // 1-10 RPE
  stiffnessReduction?: number;  // 1-10 subjective improvement
  painReduction?: number;       // 1-10 pain relief
  
  // Session notes
  instructorNotes?: string;
  playerFeedback?: string;
  environmentNotes?: string;    // room temp, music, etc.
  
  // Measurements
  preSessionMeasurements?: { bodyPart: BodyPart; measurement: number; unit: string }[];
  postSessionMeasurements?: { bodyPart: BodyPart; measurement: number; unit: string }[];
}

export interface FlexibilityPhaseExecution extends BaseEntity {
  sessionExecutionId: string;
  phaseId: string;
  phaseName: string;
  startTime: string;
  endTime?: string;
  actualDuration?: number;
  itemExecutions: FlexibilityItemExecution[];
  phaseRating?: number;         // 1-10 effectiveness
  phaseNotes?: string;
}

export interface FlexibilityItemExecution extends BaseEntity {
  phaseExecutionId: string;
  sequenceItemId: string;
  exerciseId: string;
  exerciseName: string;
  side?: 'left' | 'right' | 'both';
  
  // Planned vs actual
  plannedHoldTime: number;
  actualHoldTime: number;
  plannedRepetitions: number;
  actualRepetitions: number;
  
  // Measurements
  startingROM?: number;
  endingROM?: number;
  romImprovement?: number;
  
  // Quality metrics
  formRating?: number;          // 1-10 technique quality
  comfortLevel?: number;        // 1-10 comfort during stretch
  breathingQuality?: number;    // 1-10 breathing pattern adherence
  
  // Completion
  completedAt: string;
  skipped: boolean;
  skipReason?: string;
  modifications?: string[];     // modifications made during execution
}

// Bulk flexibility session configuration
export interface FlexibilityBulkSessionConfig {
  numberOfSessions: number;
  sessionDate: string;
  sessionTime: string;
  duration: number;             // in minutes
  facilityId: string;
  instructorId?: string;
  
  // Session distribution
  sessions: FlexibilityBulkSession[];
  
  // Group settings
  maxParticipantsPerSession: number;
  equipmentRotation: boolean;   // rotate equipment between sessions
  stagOffered: boolean;         // offer different start times
  
  // Customization
  allowPersonalizedPrograms: boolean;
  includeAssessment: boolean;
  provideProgressReports: boolean;
}

export interface FlexibilityBulkSession {
  id: string;
  name: string;
  startTime: string;
  playerIds: string[];
  teamIds: string[];
  equipmentAllocation: { equipment: FlexibilityEquipment; quantity: number }[];
  specialInstructions?: string;
  focusAreas?: BodyPart[];
  notes?: string;
}

// Template and library types
export interface FlexibilityTemplate {
  id: string;
  name: string;
  description: string;
  category: 'recovery' | 'pre_workout' | 'post_workout' | 'injury_prevention' | 'performance';
  program: FlexibilityProgram;
  
  // Template metadata
  createdBy: string;
  isPublic: boolean;
  tags: string[];
  rating?: number;
  usageCount?: number;
  
  // Customization options
  allowModifications: boolean;
  requiredCertifications?: string[];
}

// Pre-built stretch library
export interface StretchLibraryCategory {
  id: string;
  name: string;
  description: string;
  bodyParts: BodyPart[];
  exercises: StretchExercise[];
  color: string;
  icon: string;
}

// Default breathing patterns
export const DEFAULT_BREATHING_PATTERNS: BreathingPattern[] = [
  {
    name: '4-4-4 Equal Breathing',
    description: 'Equal counts for inhale, hold, exhale',
    inhaleCount: 4,
    holdCount: 4,
    exhaleCount: 4,
    cycles: 3,
    cue: 'Breathe in for 4, hold for 4, breathe out for 4'
  },
  {
    name: '4-7-8 Relaxation',
    description: 'Deep relaxation breathing pattern',
    inhaleCount: 4,
    holdCount: 7,
    exhaleCount: 8,
    cycles: 4,
    cue: 'Inhale deeply for 4, hold for 7, slowly exhale for 8'
  },
  {
    name: '6-2-6 Recovery',
    description: 'Recovery-focused breathing',
    inhaleCount: 6,
    holdCount: 2,
    exhaleCount: 6,
    cycles: 5,
    cue: 'Long inhale for 6, brief hold, long exhale for 6'
  },
  {
    name: 'Natural Flow',
    description: 'Follow natural breathing rhythm',
    inhaleCount: 0,
    holdCount: 0,
    exhaleCount: 0,
    cycles: 1,
    cue: 'Breathe naturally and focus on the stretch'
  }
];

// Common hold time progressions
export const HOLD_TIME_PROGRESSIONS = {
  beginner: [15, 20, 25, 30],
  intermediate: [30, 45, 60, 75],
  advanced: [60, 75, 90, 120]
};

// Equipment configurations
export const FLEXIBILITY_EQUIPMENT_CONFIGS: Record<FlexibilityEquipment, {
  name: string;
  description: string;
  icon: string;
  color: string;
  maxCapacity: number;
  setupTime: number; // seconds
}> = {
  mat: {
    name: 'Yoga Mat',
    description: 'Non-slip exercise mat',
    icon: '🧘',
    color: '#10B981',
    maxCapacity: 1,
    setupTime: 10
  },
  blocks: {
    name: 'Yoga Blocks',
    description: 'Support blocks for modified positions',
    icon: '🧱',
    color: '#F59E0B',
    maxCapacity: 2,
    setupTime: 5
  },
  straps: {
    name: 'Yoga Straps',
    description: 'Assist with reach and alignment',
    icon: '🔗',
    color: '#8B5CF6',
    maxCapacity: 1,
    setupTime: 5
  },
  foam_roller: {
    name: 'Foam Roller',
    description: 'Self-myofascial release tool',
    icon: '🏀',
    color: '#06B6D4',
    maxCapacity: 1,
    setupTime: 0
  },
  resistance_band: {
    name: 'Resistance Band',
    description: 'Elastic band for assisted stretching',
    icon: '🔗',
    color: '#EF4444',
    maxCapacity: 1,
    setupTime: 0
  },
  towel: {
    name: 'Towel',
    description: 'Regular towel for assistance',
    icon: '🏳️',
    color: '#6B7280',
    maxCapacity: 1,
    setupTime: 0
  },
  wall: {
    name: 'Wall Support',
    description: 'Wall for supported stretches',
    icon: '🧱',
    color: '#374151',
    maxCapacity: 4,
    setupTime: 0
  },
  chair: {
    name: 'Chair',
    description: 'Chair for seated or supported stretches',
    icon: '🪑',
    color: '#92400E',
    maxCapacity: 1,
    setupTime: 0
  },
  none: {
    name: 'No Equipment',
    description: 'Bodyweight stretches only',
    icon: '🤸',
    color: '#059669',
    maxCapacity: 1,
    setupTime: 0
  }
};

// Utility functions
export const calculateTotalPhaseDuration = (phase: FlexibilityProgramPhase): number => {
  return phase.exercises.reduce((total, item) => {
    const stretchTime = item.holdTime * item.repetitions;
    const sides = item.side === 'both' && item.exercise?.isUnilateral ? 2 : 1;
    const restTime = item.restAfter || 0;
    const transitionTime = item.transitionDuration || 10; // default 10s transition
    
    return total + (stretchTime * sides) + restTime + transitionTime;
  }, 0);
};

export const estimateFlexibilityProgramDuration = (program: FlexibilityProgram): number => {
  return program.phases.reduce((total, phase) => {
    return total + calculateTotalPhaseDuration(phase);
  }, 0);
};

export const getRecommendedHoldTime = (
  exerciseType: StretchType, 
  difficulty: DifficultyLevel
): number => {
  const baseTime = {
    static: 30,
    dynamic: 15,
    pnf: 20,
    ballistic: 10
  }[exerciseType];
  
  const multiplier = {
    beginner: 0.8,
    intermediate: 1.0,
    advanced: 1.3
  }[difficulty];
  
  return Math.round(baseTime * multiplier);
};

export const validateFlexibilitySequence = (program: FlexibilityProgram): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for minimum duration
  if (program.totalDuration < 300) { // 5 minutes minimum
    warnings.push('Program duration is quite short for a flexibility session');
  }
  
  // Check for proper warm-up
  const hasWarmup = program.phases.some(phase => phase.type === 'warmup');
  if (!hasWarmup) {
    warnings.push('Consider adding a warm-up phase for injury prevention');
  }
  
  // Check for cooldown
  const hasCooldown = program.phases.some(phase => phase.type === 'cooldown');
  if (!hasCooldown) {
    warnings.push('Consider adding a cooldown phase for better recovery');
  }
  
  // Validate phase order
  const phaseOrder = program.phases.map(p => p.type);
  const idealOrder = ['warmup', 'dynamic_stretches', 'static_stretches', 'cooldown'];
  
  // Check if phases follow logical progression
  const warmupIndex = phaseOrder.indexOf('warmup');
  const cooldownIndex = phaseOrder.indexOf('cooldown');
  
  if (warmupIndex > 0) {
    warnings.push('Warm-up should typically come first');
  }
  
  if (cooldownIndex !== -1 && cooldownIndex < phaseOrder.length - 1) {
    warnings.push('Cooldown should typically come last');
  }
  
  // Check for equipment conflicts in bulk sessions
  program.phases.forEach(phase => {
    const equipmentUsed = new Set<FlexibilityEquipment>();
    phase.exercises.forEach(item => {
      if (item.exercise) {
        item.exercise.equipment.forEach(eq => {
          if (equipmentUsed.has(eq)) {
            warnings.push(`Multiple exercises require ${eq} simultaneously in ${phase.name}`);
          }
          equipmentUsed.add(eq);
        });
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};