import { WorkoutType } from '../types/workout.types';
import { CustomValidationRules, commonValidationRules } from './useWorkoutValidation';

/**
 * Example validation rules for different workout types
 * These can be used as templates when implementing validation
 */

// Strength workout validation rules
export const strengthWorkoutValidationRules: CustomValidationRules = {
  name: commonValidationRules.required('Workout name'),
  exercises: [
    commonValidationRules.minArrayLength('Exercises', 1),
    (value, fieldPath, workoutData) => {
      // Check for duplicate exercises
      const exercises = value as any[];
      const names = exercises.map(e => e.name);
      const hasDuplicates = names.some((name, index) => names.indexOf(name) !== index);
      
      if (hasDuplicates) {
        return {
          type: 'warning',
          field: fieldPath,
          message: 'Workout contains duplicate exercises',
          code: 'DUPLICATE_EXERCISES',
        };
      }
      return null;
    },
  ],
  'exercises[*].sets': commonValidationRules.numberRange('Sets', 1, 10),
  'exercises[*].reps': commonValidationRules.numberRange('Reps', 1, 50),
  'exercises[*].weight': [
    commonValidationRules.positiveNumber('Weight'),
    (value, fieldPath) => {
      // Warning for very heavy weights
      if (value > 300) {
        return {
          type: 'warning',
          field: fieldPath,
          message: 'Weight seems unusually high. Please verify.',
          code: 'HIGH_WEIGHT_WARNING',
        };
      }
      return null;
    },
  ],
};

// Conditioning workout validation rules
export const conditioningWorkoutValidationRules: CustomValidationRules = {
  name: commonValidationRules.required('Workout name'),
  equipment: commonValidationRules.required('Equipment type'),
  intervals: [
    commonValidationRules.minArrayLength('Intervals', 1),
    (value, fieldPath, workoutData) => {
      // Check total workout duration
      const intervals = value as any[];
      const totalDuration = intervals.reduce((sum, interval) => sum + (interval.duration || 0), 0);
      
      if (totalDuration > 7200) { // 2 hours
        return {
          type: 'warning',
          field: fieldPath,
          message: 'Total workout duration exceeds 2 hours',
          code: 'LONG_DURATION_WARNING',
        };
      }
      return null;
    },
  ],
  'intervals[*].duration': [
    commonValidationRules.positiveNumber('Duration'),
    commonValidationRules.numberRange('Duration', 10, 3600), // 10 seconds to 1 hour
  ],
  'intervals[*].intensity': commonValidationRules.numberRange('Intensity', 0, 100),
  'intervals[*].targetHeartRate': (value, fieldPath) => {
    if (value && (value < 60 || value > 220)) {
      return {
        type: 'error',
        field: fieldPath,
        message: 'Target heart rate must be between 60 and 220 bpm',
        code: 'INVALID_HEART_RATE',
      };
    }
    return null;
  },
};

// Hybrid workout validation rules
export const hybridWorkoutValidationRules: CustomValidationRules = {
  name: commonValidationRules.required('Workout name'),
  blocks: [
    commonValidationRules.minArrayLength('Blocks', 2),
    (value, fieldPath, workoutData) => {
      // Ensure mix of block types
      const blocks = value as any[];
      const types = new Set(blocks.map(b => b.type));
      
      if (types.size < 2) {
        return {
          type: 'warning',
          field: fieldPath,
          message: 'Hybrid workouts should contain multiple block types',
          code: 'SINGLE_BLOCK_TYPE',
        };
      }
      return null;
    },
  ],
  'blocks[*].duration': (value, fieldPath, block) => {
    // Only validate duration for interval and transition blocks
    if (block && (block.type === 'interval' || block.type === 'transition')) {
      if (!value || value <= 0) {
        return {
          type: 'error',
          field: fieldPath,
          message: 'Duration is required for interval and transition blocks',
          code: 'MISSING_DURATION',
        };
      }
    }
    return null;
  },
};

// Agility workout validation rules
export const agilityWorkoutValidationRules: CustomValidationRules = {
  name: commonValidationRules.required('Workout name'),
  drills: [
    commonValidationRules.minArrayLength('Drills', 1),
    (value, fieldPath) => {
      const drills = value as any[];
      const totalDrills = drills.reduce((sum, drill) => sum + (drill.sets || 1), 0);
      
      if (totalDrills > 50) {
        return {
          type: 'warning',
          field: fieldPath,
          message: 'High number of total drill sets may cause fatigue',
          code: 'HIGH_DRILL_COUNT',
        };
      }
      return null;
    },
  ],
  'drills[*].pattern': commonValidationRules.required('Drill pattern'),
  'drills[*].sets': commonValidationRules.numberRange('Sets', 1, 10),
  'drills[*].cones': (value, fieldPath) => {
    if (value && value.length > 20) {
      return {
        type: 'warning',
        field: fieldPath,
        message: 'Complex pattern with many cones may be difficult to set up',
        code: 'COMPLEX_PATTERN',
      };
    }
    return null;
  },
  'phases[*].duration': commonValidationRules.numberRange('Phase duration', 60, 1800),
};

// Cross-workout validation for session planning
export const sessionValidationRules: CustomValidationRules = {
  playerIds: commonValidationRules.minArrayLength('Players', 1),
  workouts: [
    commonValidationRules.minArrayLength('Workouts', 1),
    (value, fieldPath, sessionData) => {
      // Check for mixed workout types in group sessions
      const workouts = value as any[];
      const types = new Set(workouts.map(w => w.type));
      
      if (types.size > 1 && sessionData.playerIds?.length > 1) {
        return {
          type: 'warning',
          field: fieldPath,
          message: 'Group sessions with mixed workout types may be difficult to manage',
          code: 'MIXED_TYPES_GROUP_SESSION',
        };
      }
      return null;
    },
  ],
  scheduledDate: (value, fieldPath) => {
    if (value) {
      const date = new Date(value);
      const now = new Date();
      
      if (date < now) {
        return {
          type: 'error',
          field: fieldPath,
          message: 'Cannot schedule sessions in the past',
          code: 'PAST_DATE',
        };
      }
    }
    return null;
  },
};

// Helper function to get validation rules by workout type
export function getValidationRulesForWorkoutType(
  workoutType: WorkoutType
): CustomValidationRules {
  switch (workoutType) {
    case WorkoutType.STRENGTH:
      return strengthWorkoutValidationRules;
    case WorkoutType.CONDITIONING:
      return conditioningWorkoutValidationRules;
    case WorkoutType.HYBRID:
      return hybridWorkoutValidationRules;
    case WorkoutType.AGILITY:
      return agilityWorkoutValidationRules;
    default:
      return {};
  }
}

// Example of using validation with medical restrictions
export const medicalAwareValidationRules = (
  playerRestrictions: string[]
): CustomValidationRules => ({
  'exercises[*]': (value, fieldPath, workoutData) => {
    const exercise = value as any;
    
    // Check if exercise violates any restrictions
    for (const restriction of playerRestrictions) {
      if (restriction === 'no_overhead' && exercise.name?.toLowerCase().includes('overhead')) {
        return {
          type: 'error',
          field: fieldPath,
          message: `Exercise "${exercise.name}" violates medical restriction: ${restriction}`,
          code: 'MEDICAL_RESTRICTION_VIOLATION',
        };
      }
      
      if (restriction === 'no_jumping' && exercise.name?.toLowerCase().includes('jump')) {
        return {
          type: 'error',
          field: fieldPath,
          message: `Exercise "${exercise.name}" violates medical restriction: ${restriction}`,
          code: 'MEDICAL_RESTRICTION_VIOLATION',
        };
      }
    }
    
    return null;
  },
});