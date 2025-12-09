import { 
  UnifiedWorkoutSession, 
  StandardMetadata,
  WorkoutContent,
  ExerciseBlock,
  IntervalBlock,
  TransitionBlock,
  RestBlock,
  WorkoutBlock
} from '../types/unified';
import { 
  SessionTemplate, 
  Exercise, 
  WorkoutSet,
  WorkoutExercise 
} from '../types';
import { 
  IntervalProgram, 
  Interval as ConditioningInterval,
  Equipment as ConditioningEquipment 
} from '../types/conditioning.types';
import { 
  HybridWorkout,
  HybridBlock as LegacyHybridBlock,
  ExerciseBlock as LegacyExerciseBlock,
  IntervalBlock as LegacyIntervalBlock,
  TransitionBlock as LegacyTransitionBlock
} from '../types/hybrid.types';
import { 
  AgilityWorkout,
  AgilityPhase,
  Drill,
  DrillPattern
} from '../types/agility.types';

// Migration result types
export interface MigrationResult<T> {
  success: boolean;
  data?: T;
  errors: MigrationError[];
  warnings: MigrationWarning[];
  metadata: MigrationMetadata;
}

export interface MigrationError {
  field: string;
  message: string;
  originalValue?: any;
  code: string;
}

export interface MigrationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface MigrationMetadata {
  sourceType: 'strength' | 'conditioning' | 'hybrid' | 'agility';
  sourceVersion?: string;
  migratedAt: Date;
  fieldsModified: string[];
  dataLoss: boolean;
}

export interface BatchMigrationOptions {
  batchSize: number;
  validateBeforeMigration: boolean;
  stopOnError: boolean;
  preserveOriginal: boolean;
  dryRun: boolean;
}

export interface BatchMigrationProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  warnings: number;
  currentBatch: number;
  estimatedTimeRemaining: number;
}

// Data format detection
export function detectWorkoutFormat(data: any): 'strength' | 'conditioning' | 'hybrid' | 'agility' | 'unified' | 'unknown' {
  if (!data || typeof data !== 'object') return 'unknown';

  // Check for unified format
  if (data.version && data.type && data.content && data.metadata) {
    return 'unified';
  }

  // Check for strength format (SessionTemplate)
  if (data.exercises && Array.isArray(data.exercises) && data.exercises.every((e: any) => e.exerciseId && e.sets)) {
    return 'strength';
  }

  // Check for conditioning format (IntervalProgram)
  if (data.intervals && data.equipment && data.totalDuration) {
    return 'conditioning';
  }

  // Check for hybrid format
  if (data.blocks && Array.isArray(data.blocks) && data.blocks.some((b: any) => b.type)) {
    return 'hybrid';
  }

  // Check for agility format
  if (data.phases && data.phases.some((p: any) => p.drills)) {
    return 'agility';
  }

  return 'unknown';
}

// Migration functions for each type
export function migrateStrengthWorkout(
  template: SessionTemplate,
  options?: Partial<MigrationOptions>
): MigrationResult<UnifiedWorkoutSession> {
  const errors: MigrationError[] = [];
  const warnings: MigrationWarning[] = [];
  const fieldsModified: string[] = [];

  try {
    // Validate input
    if (!template.exercises || !Array.isArray(template.exercises)) {
      errors.push({
        field: 'exercises',
        message: 'Invalid or missing exercises array',
        code: 'INVALID_EXERCISES'
      });
      return createFailedResult(errors, warnings, 'strength');
    }

    // Convert exercises to exercise blocks
    const exerciseBlocks: ExerciseBlock[] = template.exercises.map((exercise, index) => {
      const block: ExerciseBlock = {
        id: `exercise-${index}`,
        type: 'exercise',
        exercises: [{
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exercise?.name || 'Unknown Exercise',
          sets: exercise.sets.map(set => ({
            type: set.type || 'working',
            reps: set.reps,
            weight: set.weight,
            duration: set.duration,
            distance: set.distance,
            completed: false
          })),
          instructions: exercise.notes,
          restBetweenSets: exercise.restBetweenSets || 60
        }],
        notes: exercise.notes
      };

      return block;
    });

    // Add rest blocks between exercises
    const blocks: WorkoutBlock[] = [];
    exerciseBlocks.forEach((block, index) => {
      blocks.push(block);
      
      if (index < exerciseBlocks.length - 1 && template.restBetweenExercises) {
        blocks.push({
          id: `rest-${index}`,
          type: 'rest',
          duration: template.restBetweenExercises,
          message: 'Rest between exercises'
        } as RestBlock);
      }
    });

    // Create unified workout
    const unifiedWorkout: UnifiedWorkoutSession = {
      id: template.id,
      version: '1.0.0',
      type: 'strength',
      name: template.name,
      description: template.description,
      
      content: {
        blocks,
        warmup: template.warmupDuration ? {
          duration: template.warmupDuration,
          exercises: [],
          instructions: 'Standard warmup routine'
        } : undefined,
        cooldown: template.cooldownDuration ? {
          duration: template.cooldownDuration,
          exercises: [],
          instructions: 'Standard cooldown routine'
        } : undefined,
        totalDuration: calculateTotalDuration(blocks),
        estimatedCalories: template.estimatedCalories,
        targetMuscleGroups: template.focusAreas || [],
        difficulty: template.difficulty || 'intermediate',
        progressionRules: template.progressionRules
      },

      metadata: {
        createdBy: template.createdBy || 'system',
        createdAt: template.createdAt || new Date(),
        lastModifiedBy: template.updatedBy || 'system',
        lastModifiedAt: template.updatedAt || new Date(),
        tags: template.tags || [],
        category: template.category || 'general',
        isTemplate: template.isTemplate !== undefined ? template.isTemplate : true,
        version: 1,
        equipment: extractEquipmentFromExercises(template.exercises),
        targetAudience: template.targetLevel ? [template.targetLevel] : ['intermediate'],
        language: 'en',
        visibility: template.isPublic ? 'public' : 'private',
        permissions: {
          canEdit: ['owner', 'admin'],
          canView: template.isPublic ? ['all'] : ['owner', 'team'],
          canShare: ['owner', 'admin']
        }
      },

      assignments: template.assignedPlayers ? {
        playerIds: template.assignedPlayers,
        teamIds: template.assignedTeams || [],
        startDate: template.scheduledDate,
        endDate: template.scheduledDate,
        recurrence: template.recurrence
      } : undefined
    };

    fieldsModified.push('structure', 'metadata', 'content.blocks');
    
    return {
      success: true,
      data: unifiedWorkout,
      errors,
      warnings,
      metadata: {
        sourceType: 'strength',
        migratedAt: new Date(),
        fieldsModified,
        dataLoss: false
      }
    };

  } catch (error) {
    errors.push({
      field: 'general',
      message: `Migration failed: ${error.message}`,
      code: 'MIGRATION_ERROR'
    });
    return createFailedResult(errors, warnings, 'strength');
  }
}

export function migrateConditioningWorkout(
  program: IntervalProgram,
  options?: Partial<MigrationOptions>
): MigrationResult<UnifiedWorkoutSession> {
  const errors: MigrationError[] = [];
  const warnings: MigrationWarning[] = [];
  const fieldsModified: string[] = [];

  try {
    // Convert intervals to interval blocks
    const intervalBlocks: (IntervalBlock | RestBlock)[] = [];
    
    program.intervals.forEach((interval, index) => {
      // Add interval block
      intervalBlocks.push({
        id: `interval-${index}`,
        type: 'interval',
        duration: interval.duration,
        intensity: interval.intensity,
        targetMetrics: {
          heartRate: interval.targetHeartRate,
          power: interval.targetPower,
          pace: interval.targetPace,
          cadence: interval.targetCadence
        },
        equipment: interval.equipment || program.equipment,
        notes: interval.notes
      } as IntervalBlock);

      // Add rest block if specified
      if (interval.restAfter) {
        intervalBlocks.push({
          id: `rest-${index}`,
          type: 'rest',
          duration: interval.restAfter,
          message: 'Recovery period'
        } as RestBlock);
      }
    });

    const unifiedWorkout: UnifiedWorkoutSession = {
      id: program.id || generateId(),
      version: '1.0.0',
      type: 'conditioning',
      name: program.name,
      description: program.description,

      content: {
        blocks: intervalBlocks,
        warmup: program.warmupDuration ? {
          duration: program.warmupDuration,
          exercises: [],
          instructions: program.warmupInstructions || 'Dynamic warmup'
        } : undefined,
        cooldown: program.cooldownDuration ? {
          duration: program.cooldownDuration,
          exercises: [],
          instructions: program.cooldownInstructions || 'Light cardio and stretching'
        } : undefined,
        totalDuration: program.totalDuration,
        estimatedCalories: program.estimatedCalories,
        difficulty: mapIntensityToDifficulty(program.averageIntensity),
        targetSystems: program.targetSystems || ['cardiovascular'],
        intervalSettings: {
          restBetweenIntervals: program.restBetweenIntervals,
          audioCues: program.audioCues,
          countdownBeeps: program.countdownBeeps
        }
      },

      metadata: {
        createdBy: program.createdBy || 'system',
        createdAt: program.createdAt || new Date(),
        lastModifiedBy: program.createdBy || 'system',
        lastModifiedAt: program.updatedAt || new Date(),
        tags: program.tags || [],
        category: program.category || 'conditioning',
        isTemplate: true,
        version: 1,
        equipment: [program.equipment],
        targetAudience: ['all'],
        language: 'en',
        visibility: 'private',
        permissions: {
          canEdit: ['owner', 'admin'],
          canView: ['owner', 'team'],
          canShare: ['owner', 'admin']
        },
        testRequirements: program.testBasedTargets ? 
          Object.keys(program.testBasedTargets) : undefined
      }
    };

    fieldsModified.push('structure', 'intervals', 'metadata');

    return {
      success: true,
      data: unifiedWorkout,
      errors,
      warnings,
      metadata: {
        sourceType: 'conditioning',
        migratedAt: new Date(),
        fieldsModified,
        dataLoss: false
      }
    };

  } catch (error) {
    errors.push({
      field: 'general',
      message: `Migration failed: ${error.message}`,
      code: 'MIGRATION_ERROR'
    });
    return createFailedResult(errors, warnings, 'conditioning');
  }
}

export function migrateHybridWorkout(
  workout: HybridWorkout,
  options?: Partial<MigrationOptions>
): MigrationResult<UnifiedWorkoutSession> {
  const errors: MigrationError[] = [];
  const warnings: MigrationWarning[] = [];
  const fieldsModified: string[] = [];

  try {
    // Convert hybrid blocks to unified blocks
    const unifiedBlocks: WorkoutBlock[] = workout.blocks.map((block, index) => {
      switch (block.type) {
        case 'exercise': {
          const exerciseBlock = block as LegacyExerciseBlock;
          return {
            id: block.id || `block-${index}`,
            type: 'exercise',
            exercises: exerciseBlock.exercises.map(ex => ({
              exerciseId: ex.id,
              exerciseName: ex.name,
              sets: ex.sets.map(set => ({
                type: set.type || 'working',
                reps: set.reps,
                weight: set.weight,
                duration: set.duration,
                completed: false
              })),
              restBetweenSets: ex.restBetweenSets || 60,
              instructions: ex.instructions
            })),
            notes: exerciseBlock.notes
          } as ExerciseBlock;
        }

        case 'interval': {
          const intervalBlock = block as LegacyIntervalBlock;
          return {
            id: block.id || `block-${index}`,
            type: 'interval',
            duration: intervalBlock.duration,
            intensity: intervalBlock.intensity,
            equipment: intervalBlock.equipment,
            targetMetrics: intervalBlock.targetMetrics,
            notes: intervalBlock.notes
          } as IntervalBlock;
        }

        case 'transition': {
          const transitionBlock = block as LegacyTransitionBlock;
          return {
            id: block.id || `block-${index}`,
            type: 'transition',
            duration: transitionBlock.duration,
            fromActivity: transitionBlock.fromActivity,
            toActivity: transitionBlock.toActivity,
            instructions: transitionBlock.instructions
          } as TransitionBlock;
        }

        case 'rest': {
          return {
            id: block.id || `block-${index}`,
            type: 'rest',
            duration: block.duration,
            message: block.notes || 'Rest period'
          } as RestBlock;
        }

        default:
          warnings.push({
            field: `blocks[${index}]`,
            message: `Unknown block type: ${block.type}`,
            suggestion: 'Block will be skipped'
          });
          return null;
      }
    }).filter(Boolean) as WorkoutBlock[];

    const unifiedWorkout: UnifiedWorkoutSession = {
      id: workout.id || generateId(),
      version: '1.0.0',
      type: 'hybrid',
      name: workout.name,
      description: workout.description,

      content: {
        blocks: unifiedBlocks,
        warmup: workout.warmup,
        cooldown: workout.cooldown,
        totalDuration: workout.totalDuration,
        estimatedCalories: workout.estimatedCalories,
        difficulty: workout.difficulty || 'intermediate',
        targetMuscleGroups: workout.targetMuscleGroups,
        targetSystems: workout.targetSystems,
        transitionTime: workout.transitionTime
      },

      metadata: {
        createdBy: workout.createdBy || 'system',
        createdAt: workout.createdAt || new Date(),
        lastModifiedBy: workout.createdBy || 'system',
        lastModifiedAt: workout.updatedAt || new Date(),
        tags: workout.tags || [],
        category: workout.category || 'hybrid',
        isTemplate: workout.isTemplate !== undefined ? workout.isTemplate : true,
        version: 1,
        equipment: workout.equipment || [],
        targetAudience: ['intermediate', 'advanced'],
        language: 'en',
        visibility: 'private',
        permissions: {
          canEdit: ['owner', 'admin'],
          canView: ['owner', 'team'],
          canShare: ['owner', 'admin']
        }
      }
    };

    fieldsModified.push('blocks', 'structure', 'metadata');

    return {
      success: true,
      data: unifiedWorkout,
      errors,
      warnings,
      metadata: {
        sourceType: 'hybrid',
        migratedAt: new Date(),
        fieldsModified,
        dataLoss: false
      }
    };

  } catch (error) {
    errors.push({
      field: 'general',
      message: `Migration failed: ${error.message}`,
      code: 'MIGRATION_ERROR'
    });
    return createFailedResult(errors, warnings, 'hybrid');
  }
}

export function migrateAgilityWorkout(
  workout: AgilityWorkout,
  options?: Partial<MigrationOptions>
): MigrationResult<UnifiedWorkoutSession> {
  const errors: MigrationError[] = [];
  const warnings: MigrationWarning[] = [];
  const fieldsModified: string[] = [];

  try {
    // Convert agility phases to blocks
    const agilityBlocks: WorkoutBlock[] = [];

    workout.phases.forEach((phase, phaseIndex) => {
      phase.drills.forEach((drill, drillIndex) => {
        // Add agility drill as custom block
        agilityBlocks.push({
          id: `drill-${phaseIndex}-${drillIndex}`,
          type: 'agility',
          drillId: drill.id,
          drillName: drill.name,
          pattern: drill.pattern,
          duration: drill.duration,
          sets: drill.sets || 1,
          equipment: drill.equipment,
          instructions: drill.instructions,
          metrics: {
            trackTime: drill.trackTime !== false,
            trackErrors: drill.trackErrors !== false,
            targetTime: drill.targetTime
          }
        } as any); // Custom agility block

        // Add rest between drills
        if (drill.restAfter) {
          agilityBlocks.push({
            id: `rest-${phaseIndex}-${drillIndex}`,
            type: 'rest',
            duration: drill.restAfter,
            message: 'Rest between drills'
          } as RestBlock);
        }
      });

      // Add rest between phases
      if (phaseIndex < workout.phases.length - 1 && phase.restAfter) {
        agilityBlocks.push({
          id: `phase-rest-${phaseIndex}`,
          type: 'rest',
          duration: phase.restAfter,
          message: `Rest after ${phase.name}`
        } as RestBlock);
      }
    });

    const unifiedWorkout: UnifiedWorkoutSession = {
      id: workout.id || generateId(),
      version: '1.0.0',
      type: 'agility',
      name: workout.name,
      description: workout.description,

      content: {
        blocks: agilityBlocks,
        warmup: workout.warmup,
        cooldown: workout.cooldown,
        totalDuration: workout.totalDuration,
        estimatedCalories: workout.estimatedCalories,
        difficulty: workout.difficulty || 'intermediate',
        focusAreas: workout.focusAreas,
        equipment: workout.equipment
      },

      metadata: {
        createdBy: workout.createdBy || 'system',
        createdAt: workout.createdAt || new Date(),
        lastModifiedBy: workout.createdBy || 'system',
        lastModifiedAt: workout.updatedAt || new Date(),
        tags: workout.tags || [],
        category: workout.category || 'agility',
        isTemplate: workout.isTemplate !== undefined ? workout.isTemplate : true,
        version: 1,
        equipment: workout.equipment || [],
        targetAudience: workout.targetLevel ? [workout.targetLevel] : ['intermediate'],
        language: 'en',
        visibility: 'private',
        permissions: {
          canEdit: ['owner', 'admin'],
          canView: ['owner', 'team'],
          canShare: ['owner', 'admin']
        }
      }
    };

    fieldsModified.push('phases', 'drills', 'structure');

    return {
      success: true,
      data: unifiedWorkout,
      errors,
      warnings,
      metadata: {
        sourceType: 'agility',
        migratedAt: new Date(),
        fieldsModified,
        dataLoss: false
      }
    };

  } catch (error) {
    errors.push({
      field: 'general',
      message: `Migration failed: ${error.message}`,
      code: 'MIGRATION_ERROR'
    });
    return createFailedResult(errors, warnings, 'agility');
  }
}

// Batch migration
export async function batchMigrateWorkouts(
  workouts: any[],
  options: BatchMigrationOptions,
  onProgress?: (progress: BatchMigrationProgress) => void
): Promise<BatchMigrationResult> {
  const results: MigrationResult<UnifiedWorkoutSession>[] = [];
  const progress: BatchMigrationProgress = {
    total: workouts.length,
    processed: 0,
    successful: 0,
    failed: 0,
    warnings: 0,
    currentBatch: 0,
    estimatedTimeRemaining: 0
  };

  const startTime = Date.now();
  const batches = Math.ceil(workouts.length / options.batchSize);

  for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
    const batchStart = batchIndex * options.batchSize;
    const batchEnd = Math.min(batchStart + options.batchSize, workouts.length);
    const batch = workouts.slice(batchStart, batchEnd);

    progress.currentBatch = batchIndex + 1;

    for (const workout of batch) {
      try {
        // Detect format
        const format = detectWorkoutFormat(workout);
        
        if (format === 'unified') {
          progress.processed++;
          progress.successful++;
          continue; // Already in unified format
        }

        if (format === 'unknown') {
          results.push({
            success: false,
            errors: [{
              field: 'format',
              message: 'Unknown workout format',
              code: 'UNKNOWN_FORMAT'
            }],
            warnings: [],
            metadata: {
              sourceType: 'unknown' as any,
              migratedAt: new Date(),
              fieldsModified: [],
              dataLoss: false
            }
          });
          progress.processed++;
          progress.failed++;
          
          if (options.stopOnError) {
            break;
          }
          continue;
        }

        // Validate before migration if requested
        if (options.validateBeforeMigration) {
          const validationResult = validateWorkoutData(workout, format);
          if (!validationResult.isValid) {
            results.push({
              success: false,
              errors: validationResult.errors.map(e => ({
                field: e.field,
                message: e.message,
                code: 'VALIDATION_ERROR'
              })),
              warnings: [],
              metadata: {
                sourceType: format,
                migratedAt: new Date(),
                fieldsModified: [],
                dataLoss: false
              }
            });
            progress.processed++;
            progress.failed++;
            
            if (options.stopOnError) {
              break;
            }
            continue;
          }
        }

        // Perform migration based on format
        let result: MigrationResult<UnifiedWorkoutSession>;
        
        switch (format) {
          case 'strength':
            result = migrateStrengthWorkout(workout);
            break;
          case 'conditioning':
            result = migrateConditioningWorkout(workout);
            break;
          case 'hybrid':
            result = migrateHybridWorkout(workout);
            break;
          case 'agility':
            result = migrateAgilityWorkout(workout);
            break;
          default:
            throw new Error(`Unsupported format: ${format}`);
        }

        results.push(result);
        progress.processed++;
        
        if (result.success) {
          progress.successful++;
        } else {
          progress.failed++;
          if (options.stopOnError) {
            break;
          }
        }

        if (result.warnings.length > 0) {
          progress.warnings += result.warnings.length;
        }

      } catch (error) {
        results.push({
          success: false,
          errors: [{
            field: 'general',
            message: `Migration error: ${error.message}`,
            code: 'MIGRATION_ERROR'
          }],
          warnings: [],
          metadata: {
            sourceType: 'unknown' as any,
            migratedAt: new Date(),
            fieldsModified: [],
            dataLoss: false
          }
        });
        progress.processed++;
        progress.failed++;
        
        if (options.stopOnError) {
          break;
        }
      }

      // Update progress
      const elapsed = Date.now() - startTime;
      const avgTimePerItem = elapsed / progress.processed;
      progress.estimatedTimeRemaining = Math.round(
        avgTimePerItem * (progress.total - progress.processed)
      );

      if (onProgress) {
        onProgress(progress);
      }
    }

    if (options.stopOnError && progress.failed > 0) {
      break;
    }

    // Small delay between batches to prevent overwhelming the system
    if (batchIndex < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return {
    results,
    summary: {
      total: progress.total,
      successful: progress.successful,
      failed: progress.failed,
      warnings: progress.warnings,
      duration: Date.now() - startTime
    }
  };
}

// Rollback functionality
export function rollbackMigration(
  unifiedWorkout: UnifiedWorkoutSession,
  targetFormat: 'strength' | 'conditioning' | 'hybrid' | 'agility'
): MigrationResult<any> {
  const errors: MigrationError[] = [];
  const warnings: MigrationWarning[] = [];

  try {
    switch (targetFormat) {
      case 'strength':
        return rollbackToStrength(unifiedWorkout);
      case 'conditioning':
        return rollbackToConditioning(unifiedWorkout);
      case 'hybrid':
        return rollbackToHybrid(unifiedWorkout);
      case 'agility':
        return rollbackToAgility(unifiedWorkout);
      default:
        throw new Error(`Unsupported rollback format: ${targetFormat}`);
    }
  } catch (error) {
    errors.push({
      field: 'general',
      message: `Rollback failed: ${error.message}`,
      code: 'ROLLBACK_ERROR'
    });
    return createFailedResult(errors, warnings, targetFormat);
  }
}

// Helper functions
function createFailedResult(
  errors: MigrationError[],
  warnings: MigrationWarning[],
  sourceType: string
): MigrationResult<any> {
  return {
    success: false,
    errors,
    warnings,
    metadata: {
      sourceType: sourceType as any,
      migratedAt: new Date(),
      fieldsModified: [],
      dataLoss: false
    }
  };
}

function generateId(): string {
  return `migrated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateTotalDuration(blocks: WorkoutBlock[]): number {
  return blocks.reduce((total, block) => {
    if ('duration' in block && typeof block.duration === 'number') {
      return total + block.duration;
    }
    if (block.type === 'exercise') {
      const exerciseBlock = block as ExerciseBlock;
      return total + exerciseBlock.exercises.reduce((exTotal, ex) => {
        const setTime = ex.sets.length * (60 + (ex.restBetweenSets || 60));
        return exTotal + setTime;
      }, 0);
    }
    return total;
  }, 0);
}

function extractEquipmentFromExercises(exercises: WorkoutExercise[]): string[] {
  const equipment = new Set<string>();
  exercises.forEach(ex => {
    if (ex.exercise?.equipment) {
      ex.exercise.equipment.forEach(eq => equipment.add(eq));
    }
  });
  return Array.from(equipment);
}

function mapIntensityToDifficulty(intensity?: number): 'beginner' | 'intermediate' | 'advanced' | 'elite' {
  if (!intensity) return 'intermediate';
  if (intensity < 40) return 'beginner';
  if (intensity < 70) return 'intermediate';
  if (intensity < 90) return 'advanced';
  return 'elite';
}

// Validation
export function validateWorkoutData(
  data: any,
  format: string
): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  switch (format) {
    case 'strength':
      if (!data.exercises || !Array.isArray(data.exercises)) {
        errors.push({
          field: 'exercises',
          message: 'Exercises array is required'
        });
      }
      break;

    case 'conditioning':
      if (!data.intervals || !Array.isArray(data.intervals)) {
        errors.push({
          field: 'intervals',
          message: 'Intervals array is required'
        });
      }
      if (!data.equipment) {
        errors.push({
          field: 'equipment',
          message: 'Equipment is required'
        });
      }
      break;

    case 'hybrid':
      if (!data.blocks || !Array.isArray(data.blocks)) {
        errors.push({
          field: 'blocks',
          message: 'Blocks array is required'
        });
      }
      break;

    case 'agility':
      if (!data.phases || !Array.isArray(data.phases)) {
        errors.push({
          field: 'phases',
          message: 'Phases array is required'
        });
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Rollback implementations
function rollbackToStrength(unified: UnifiedWorkoutSession): MigrationResult<SessionTemplate> {
  // Implementation for rolling back to strength format
  const template: SessionTemplate = {
    id: unified.id,
    name: unified.name,
    description: unified.description,
    exercises: [],
    createdBy: unified.metadata.createdBy,
    createdAt: unified.metadata.createdAt,
    isTemplate: unified.metadata.isTemplate,
    tags: unified.metadata.tags
  };

  // Extract exercises from blocks
  unified.content.blocks.forEach(block => {
    if (block.type === 'exercise') {
      const exerciseBlock = block as ExerciseBlock;
      exerciseBlock.exercises.forEach(ex => {
        template.exercises.push({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          notes: ex.instructions,
          restBetweenSets: ex.restBetweenSets
        } as any);
      });
    }
  });

  return {
    success: true,
    data: template,
    errors: [],
    warnings: [],
    metadata: {
      sourceType: 'strength',
      migratedAt: new Date(),
      fieldsModified: ['structure'],
      dataLoss: true // Some unified features may be lost
    }
  };
}

function rollbackToConditioning(unified: UnifiedWorkoutSession): MigrationResult<IntervalProgram> {
  // Implementation for rolling back to conditioning format
  const intervals: ConditioningInterval[] = [];
  let equipment: ConditioningEquipment = 'bike';

  unified.content.blocks.forEach(block => {
    if (block.type === 'interval') {
      const intervalBlock = block as IntervalBlock;
      intervals.push({
        duration: intervalBlock.duration,
        intensity: intervalBlock.intensity,
        targetHeartRate: intervalBlock.targetMetrics?.heartRate,
        targetPower: intervalBlock.targetMetrics?.power,
        targetPace: intervalBlock.targetMetrics?.pace,
        equipment: intervalBlock.equipment,
        notes: intervalBlock.notes
      } as ConditioningInterval);
      
      if (intervalBlock.equipment) {
        equipment = intervalBlock.equipment;
      }
    }
  });

  const program: IntervalProgram = {
    id: unified.id,
    name: unified.name,
    description: unified.description,
    intervals,
    equipment,
    totalDuration: unified.content.totalDuration,
    warmupDuration: unified.content.warmup?.duration,
    cooldownDuration: unified.content.cooldown?.duration,
    createdBy: unified.metadata.createdBy,
    createdAt: unified.metadata.createdAt
  };

  return {
    success: true,
    data: program,
    errors: [],
    warnings: [{
      field: 'metadata',
      message: 'Some unified metadata was lost in rollback'
    }],
    metadata: {
      sourceType: 'conditioning',
      migratedAt: new Date(),
      fieldsModified: ['structure', 'metadata'],
      dataLoss: true
    }
  };
}

function rollbackToHybrid(unified: UnifiedWorkoutSession): MigrationResult<HybridWorkout> {
  // Convert unified blocks back to hybrid blocks
  const hybridBlocks: LegacyHybridBlock[] = unified.content.blocks.map(block => {
    return {
      id: block.id,
      type: block.type,
      ...block
    } as any;
  });

  const workout: HybridWorkout = {
    id: unified.id,
    name: unified.name,
    description: unified.description,
    blocks: hybridBlocks,
    warmup: unified.content.warmup,
    cooldown: unified.content.cooldown,
    totalDuration: unified.content.totalDuration,
    estimatedCalories: unified.content.estimatedCalories,
    difficulty: unified.content.difficulty,
    createdBy: unified.metadata.createdBy,
    createdAt: unified.metadata.createdAt,
    isTemplate: unified.metadata.isTemplate,
    tags: unified.metadata.tags
  };

  return {
    success: true,
    data: workout,
    errors: [],
    warnings: [],
    metadata: {
      sourceType: 'hybrid',
      migratedAt: new Date(),
      fieldsModified: ['metadata'],
      dataLoss: false
    }
  };
}

function rollbackToAgility(unified: UnifiedWorkoutSession): MigrationResult<AgilityWorkout> {
  // Group agility blocks back into phases
  const phases: AgilityPhase[] = [{
    id: 'main',
    name: 'Main Phase',
    description: 'Converted from unified format',
    drills: [],
    order: 0
  }];

  unified.content.blocks.forEach(block => {
    if (block.type === 'agility' || (block as any).drillId) {
      const agilityBlock = block as any;
      phases[0].drills.push({
        id: agilityBlock.drillId,
        name: agilityBlock.drillName,
        pattern: agilityBlock.pattern,
        duration: agilityBlock.duration,
        sets: agilityBlock.sets,
        equipment: agilityBlock.equipment,
        instructions: agilityBlock.instructions,
        trackTime: agilityBlock.metrics?.trackTime,
        trackErrors: agilityBlock.metrics?.trackErrors,
        targetTime: agilityBlock.metrics?.targetTime
      });
    }
  });

  const workout: AgilityWorkout = {
    id: unified.id,
    name: unified.name,
    description: unified.description,
    phases,
    warmup: unified.content.warmup,
    cooldown: unified.content.cooldown,
    totalDuration: unified.content.totalDuration,
    estimatedCalories: unified.content.estimatedCalories,
    difficulty: unified.content.difficulty,
    createdBy: unified.metadata.createdBy,
    createdAt: unified.metadata.createdAt,
    isTemplate: unified.metadata.isTemplate,
    tags: unified.metadata.tags
  };

  return {
    success: true,
    data: workout,
    errors: [],
    warnings: [{
      field: 'phases',
      message: 'Phase structure was simplified during rollback'
    }],
    metadata: {
      sourceType: 'agility',
      migratedAt: new Date(),
      fieldsModified: ['phases', 'metadata'],
      dataLoss: true
    }
  };
}

// Type definitions
interface MigrationOptions {
  preserveIds: boolean;
  generateNewIds: boolean;
  validateData: boolean;
  strictMode: boolean;
}

interface BatchMigrationResult {
  results: MigrationResult<UnifiedWorkoutSession>[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    warnings: number;
    duration: number;
  };
}

interface ValidationError {
  field: string;
  message: string;
}

export type { MigrationOptions, BatchMigrationResult, ValidationError };