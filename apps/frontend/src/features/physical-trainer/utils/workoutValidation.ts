import { Player, Team } from '../types';
import { WorkoutSession, WorkoutType } from '../types/session.types';
import { StrengthWorkout } from '../types/strength.types';
import { IntervalProgram } from '../types/conditioning.types';
import { HybridProgram } from '../types/hybrid.types';
import { AgilityProgram } from '../types/agility.types';

// Validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface WorkoutValidationRules {
  requirePlayers: boolean;
  minDuration?: number;
  maxDuration?: number;
  requireContent: boolean;
  customValidation?: (session: Partial<WorkoutSession>) => ValidationError[];
}

// Default validation rules by workout type
const WORKOUT_VALIDATION_RULES: Record<WorkoutType, WorkoutValidationRules> = {
  [WorkoutType.STRENGTH]: {
    requirePlayers: true,
    requireContent: true,
    customValidation: (session) => {
      const errors: ValidationError[] = [];
      const workout = session.strengthWorkout as StrengthWorkout | undefined;
      
      if (!workout?.exercises || workout.exercises.length === 0) {
        errors.push({
          field: 'exercises',
          message: 'At least one exercise is required',
          code: 'EMPTY_WORKOUT'
        });
      }
      
      return errors;
    }
  },
  [WorkoutType.CONDITIONING]: {
    requirePlayers: true,
    requireContent: true,
    minDuration: 5,
    maxDuration: 180,
    customValidation: (session) => {
      const errors: ValidationError[] = [];
      const program = session.intervalProgram as IntervalProgram | undefined;
      
      if (!program?.intervals || program.intervals.length === 0) {
        errors.push({
          field: 'intervals',
          message: 'At least one interval is required',
          code: 'EMPTY_PROGRAM'
        });
      }
      
      // Validate interval durations
      program?.intervals.forEach((interval, index) => {
        if (interval.duration < 10) {
          errors.push({
            field: `intervals[${index}].duration`,
            message: 'Interval duration must be at least 10 seconds',
            code: 'INVALID_DURATION'
          });
        }
      });
      
      return errors;
    }
  },
  [WorkoutType.HYBRID]: {
    requirePlayers: true,
    requireContent: true,
    customValidation: (session) => {
      const errors: ValidationError[] = [];
      const workout = session.hybridWorkout as HybridProgram | undefined;
      
      if (!workout?.blocks || workout.blocks.length === 0) {
        errors.push({
          field: 'blocks',
          message: 'At least one block is required',
          code: 'EMPTY_WORKOUT'
        });
      }
      
      // Validate block content
      workout?.blocks.forEach((block, index) => {
        if (block.type === 'exercise' && (!block.exercises || block.exercises.length === 0)) {
          errors.push({
            field: `blocks[${index}].exercises`,
            message: 'Exercise block must contain at least one exercise',
            code: 'EMPTY_BLOCK'
          });
        }
        
        if (block.type === 'interval' && (!block.intervals || block.intervals.length === 0)) {
          errors.push({
            field: `blocks[${index}].intervals`,
            message: 'Interval block must contain interval configuration',
            code: 'MISSING_INTERVAL'
          });
        }
      });
      
      return errors;
    }
  },
  [WorkoutType.AGILITY]: {
    requirePlayers: true,
    requireContent: true,
    customValidation: (session) => {
      const errors: ValidationError[] = [];
      const workout = session.agilityWorkout as AgilityProgram | undefined;
      
      if (!workout?.drills || workout.drills.length === 0) {
        errors.push({
          field: 'drills',
          message: 'At least one drill is required',
          code: 'EMPTY_WORKOUT'
        });
      }
      
      // Validate drill configurations
      workout?.drills.forEach((drill, index) => {
        if (!drill.reps || drill.reps < 1) {
          errors.push({
            field: `drills[${index}].reps`,
            message: 'Drill must have at least 1 repetition',
            code: 'INVALID_REPETITIONS'
          });
        }
      });
      
      return errors;
    }
  }
};

// Main validation functions
export function validatePlayerAssignments(
  assignedPlayers: Player[],
  assignedTeams: Team[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if ((!assignedPlayers || assignedPlayers.length === 0) && 
      (!assignedTeams || assignedTeams.length === 0)) {
    errors.push({
      field: 'assignments',
      message: 'At least one player or team must be selected',
      code: 'NO_ASSIGNMENTS'
    });
  }
  
  return errors;
}

export function validateWorkoutContent(
  session: Partial<WorkoutSession>,
  type: WorkoutType
): ValidationError[] {
  const rules = WORKOUT_VALIDATION_RULES[type];
  const errors: ValidationError[] = [];
  
  // If no rules defined for this type, return empty errors
  if (!rules) {
    console.warn(`No validation rules defined for workout type: ${type}`);
    return errors;
  }
  
  // Check for required content based on type
  if (rules.requireContent) {
    const hasContent = getWorkoutContent(session, type) !== null;
    if (!hasContent) {
      errors.push({
        field: 'content',
        message: 'Workout content is required',
        code: 'MISSING_CONTENT'
      });
    }
  }
  
  // Apply custom validation rules
  if (rules.customValidation) {
    errors.push(...rules.customValidation(session));
  }
  
  // Validate duration if specified
  if (rules.minDuration || rules.maxDuration) {
    const duration = calculateWorkoutDuration(session, type);
    
    if (rules.minDuration && duration < rules.minDuration) {
      errors.push({
        field: 'duration',
        message: `Workout duration must be at least ${rules.minDuration} minutes`,
        code: 'DURATION_TOO_SHORT'
      });
    }
    
    if (rules.maxDuration && duration > rules.maxDuration) {
      errors.push({
        field: 'duration',
        message: `Workout duration cannot exceed ${rules.maxDuration} minutes`,
        code: 'DURATION_TOO_LONG'
      });
    }
  }
  
  return errors;
}

export async function validateMedicalCompliance(
  players: Player[],
  session: Partial<WorkoutSession>,
  getMedicalReports: (playerIds: string[]) => Promise<any[]>
): Promise<ValidationWarning[]> {
  const warnings: ValidationWarning[] = [];
  
  try {
    const playerIds = players.map(p => p.id);
    const medicalReports = await getMedicalReports(playerIds);
    
    // Check each player's medical restrictions
    for (const report of medicalReports) {
      if (report.status === 'injured' || report.status === 'limited') {
        const playerName = players.find(p => p.id === report.playerId)?.name || 'Unknown';
        
        // Check for exercise restrictions based on workout type
        const conflicts = checkExerciseConflicts(session, report.restrictions);
        
        if (conflicts.length > 0) {
          warnings.push({
            field: 'medical',
            message: `${playerName} has medical restrictions that may conflict with: ${conflicts.join(', ')}`,
            code: 'MEDICAL_RESTRICTION'
          });
        }
      }
    }
  } catch (error) {
    warnings.push({
      field: 'medical',
      message: 'Unable to verify medical compliance',
      code: 'MEDICAL_CHECK_FAILED'
    });
  }
  
  return warnings;
}

export function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.map(error => {
    switch (error.code) {
      case 'NO_ASSIGNMENTS':
        return 'Please select at least one player or team';
      case 'EMPTY_WORKOUT':
        return 'Please add exercises to the workout';
      case 'EMPTY_PROGRAM':
        return 'Please add intervals to the program';
      case 'MISSING_CONTENT':
        return 'Please complete the workout configuration';
      case 'INVALID_DURATION':
        return error.message;
      case 'MEDICAL_RESTRICTION':
        return error.message;
      default:
        return error.message;
    }
  });
}

// Helper functions
function getWorkoutContent(session: Partial<WorkoutSession>, type: WorkoutType): any {
  switch (type) {
    case WorkoutType.STRENGTH:
      return session.strengthWorkout;
    case WorkoutType.CONDITIONING:
      return session.intervalProgram;
    case WorkoutType.HYBRID:
      return session.hybridWorkout;
    case WorkoutType.AGILITY:
      return session.agilityWorkout;
    default:
      return null;
  }
}

function calculateWorkoutDuration(session: Partial<WorkoutSession>, type: WorkoutType): number {
  switch (type) {
    case WorkoutType.CONDITIONING:
      const program = session.intervalProgram as IntervalProgram | undefined;
      if (!program) return 0;
      
      return program.intervals.reduce((total, interval) => {
        return total + interval.duration + (interval.restDuration || 0);
      }, 0) / 60; // Convert to minutes
      
    case WorkoutType.HYBRID:
      const hybrid = session.hybridWorkout as HybridProgram | undefined;
      if (!hybrid) return 0;
      
      return hybrid.blocks.reduce((total, block) => {
        if (block.type === 'transition') return total + (block.duration || 30) / 60;
        if (block.type === 'interval' && block.intervals) {
          return total + block.intervals.reduce((intervalTotal, interval) => {
            return intervalTotal + (interval.duration + (interval.restDuration || 0)) / 60;
          }, 0);
        }
        // Estimate 45 seconds per exercise in exercise blocks
        if (block.type === 'exercise') {
          return total + (block.exercises?.length || 0) * 0.75;
        }
        return total;
      }, 0);
      
    case WorkoutType.AGILITY:
      const agility = session.agilityWorkout as AgilityProgram | undefined;
      if (!agility) return 0;
      
      // Estimate based on drills and rest periods
      return agility.drills.reduce((total, drill) => {
        const drillTime = (drill.duration || 30) * drill.reps;
        const restTime = (drill.restBetweenReps || 15) * (drill.reps - 1);
        return total + (drillTime + restTime) / 60;
      }, 0);
      
    default:
      return session.duration || 0;
  }
}

function checkExerciseConflicts(
  session: Partial<WorkoutSession>,
  restrictions: any[]
): string[] {
  const conflicts: string[] = [];
  
  // This is a simplified version - in a real app, you'd have more detailed
  // mapping between exercises and body parts/movement patterns
  restrictions.forEach(restriction => {
    if (restriction.type === 'bodyPart' && session.strengthWorkout) {
      const workout = session.strengthWorkout as StrengthWorkout;
      const hasConflict = workout.exercises.some(exercise => 
        exercise.name.toLowerCase().includes(restriction.value.toLowerCase())
      );
      if (hasConflict) {
        conflicts.push(`${restriction.value} exercises`);
      }
    }
    
    if (restriction.type === 'intensity' && session.intervalProgram) {
      const program = session.intervalProgram as IntervalProgram;
      const hasHighIntensity = program.intervals.some(interval => 
        interval.targetHeartRate && interval.targetHeartRate.max > 160
      );
      if (hasHighIntensity && restriction.maxIntensity < 'high') {
        conflicts.push('high intensity intervals');
      }
    }
  });
  
  return conflicts;
}

// Validation runner
export async function validateWorkoutSession(
  session: Partial<WorkoutSession>,
  players: Player[],
  teams: Team[],
  getMedicalReports?: (playerIds: string[]) => Promise<any[]>
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Validate required fields
  if (!session.name || session.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Session name is required',
      code: 'MISSING_NAME'
    });
  }
  
  if (!session.type) {
    errors.push({
      field: 'type',
      message: 'Workout type is required',
      code: 'MISSING_TYPE'
    });
  }
  
  if (!session.date) {
    errors.push({
      field: 'date',
      message: 'Session date is required',
      code: 'MISSING_DATE'
    });
  }
  
  // Validate player assignments
  const rules = session.type ? WORKOUT_VALIDATION_RULES[session.type] : null;
  if (rules?.requirePlayers) {
    errors.push(...validatePlayerAssignments(players, teams));
  }
  
  // Validate workout content
  if (session.type) {
    errors.push(...validateWorkoutContent(session, session.type));
  }
  
  // Check medical compliance if handler provided
  if (getMedicalReports && players.length > 0) {
    warnings.push(...await validateMedicalCompliance(players, session, getMedicalReports));
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Simplified validation function for hook usage
export function validateWorkout(
  type: WorkoutType,
  workoutData: any
): ValidationResult {
  const session: Partial<WorkoutSession> = {
    type,
    name: workoutData.name || '',
    date: workoutData.date || new Date().toISOString(),
    duration: workoutData.duration,
    strengthWorkout: type === WorkoutType.STRENGTH ? workoutData : undefined,
    intervalProgram: type === WorkoutType.CONDITIONING ? (workoutData.intervalProgram || workoutData) : undefined,
    hybridWorkout: type === WorkoutType.HYBRID ? (workoutData.hybridProgram || workoutData) : undefined,
    agilityWorkout: type === WorkoutType.AGILITY ? (workoutData.agilityProgram || workoutData) : undefined,
  };

  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate content based on type
  if (type) {
    errors.push(...validateWorkoutContent(session, type));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Format validation messages for display
export function formatValidationMessages(
  errors: ValidationError[],
  separator: string = '\n'
): string {
  return formatValidationErrors(errors).join(separator);
}

// Get validation summary
export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid) {
    return 'Validation passed';
  }
  
  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;
  
  if (errorCount > 0 && warningCount > 0) {
    return `${errorCount} error${errorCount > 1 ? 's' : ''}, ${warningCount} warning${warningCount > 1 ? 's' : ''}`;
  } else if (errorCount > 0) {
    return `${errorCount} error${errorCount > 1 ? 's' : ''}`;
  } else {
    return `${warningCount} warning${warningCount > 1 ? 's' : ''}`;
  }
}