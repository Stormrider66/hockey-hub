/**
 * Metadata Migration Utilities
 * Provides utilities for migrating existing workout metadata to standardized format
 */

import {
  StandardMetadata,
  WorkoutTypeMetadata,
  PartialMetadata
} from '../types/metadata-standard.types';
import { MetadataUtils, ValidationResult } from './metadataUtils';

// Legacy workout interfaces for migration
interface LegacyStrengthWorkout {
  id: string;
  name: string;
  description?: string;
  exercises: any[];
  difficulty?: string;
  duration?: number;
  createdBy?: string;
  createdAt?: string;
  tags?: string[];
  equipment?: string[];
}

interface LegacyConditioningWorkout {
  id: string;
  title: string;
  notes?: string;
  intervals: any[];
  intensity?: number;
  estimatedTime?: number;
  authorId?: string;
  created?: string;
  labels?: string[];
  requiredEquipment?: string[];
}

interface LegacyHybridWorkout {
  id: string;
  workoutName: string;
  blocks: any[];
  level?: string;
  totalDuration?: number;
  owner?: string;
  timestamp?: string;
  categories?: string[];
  gear?: string[];
}

interface LegacyAgilityWorkout {
  id: string;
  drillName: string;
  pattern: any;
  complexity?: number;
  timeRequired?: number;
  instructor?: string;
  dateCreated?: string;
  skillAreas?: string[];
  materials?: string[];
}

// Migration result interface
export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: {
    workoutId: string;
    error: string;
    originalData: any;
  }[];
  validationResults: {
    workoutId: string;
    validation: ValidationResult;
  }[];
  migratedWorkouts: StandardMetadata[];
}

// Migration options
export interface MigrationOptions {
  preserveOriginalIds: boolean;
  validateAfterMigration: boolean;
  skipInvalid: boolean;
  addMigrationTags: boolean;
  defaultOrganizationId: string;
  defaultCreatedBy: string;
  batchSize: number;
}

// Default migration options
const DEFAULT_MIGRATION_OPTIONS: MigrationOptions = {
  preserveOriginalIds: true,
  validateAfterMigration: true,
  skipInvalid: false,
  addMigrationTags: true,
  defaultOrganizationId: 'default',
  defaultCreatedBy: 'system',
  batchSize: 100
};

export class MetadataMigrationUtils {
  /**
   * Migrate strength workouts to standard metadata
   */
  static migrateStrengthWorkouts(
    workouts: LegacyStrengthWorkout[],
    options: Partial<MigrationOptions> = {}
  ): MigrationResult {
    const opts = { ...DEFAULT_MIGRATION_OPTIONS, ...options };
    
    return this.migrateBatch(
      workouts,
      (workout) => this.migrateStrengthWorkout(workout, opts),
      opts
    );
  }

  /**
   * Migrate conditioning workouts to standard metadata
   */
  static migrateConditioningWorkouts(
    workouts: LegacyConditioningWorkout[],
    options: Partial<MigrationOptions> = {}
  ): MigrationResult {
    const opts = { ...DEFAULT_MIGRATION_OPTIONS, ...options };
    
    return this.migrateBatch(
      workouts,
      (workout) => this.migrateConditioningWorkout(workout, opts),
      opts
    );
  }

  /**
   * Migrate hybrid workouts to standard metadata
   */
  static migrateHybridWorkouts(
    workouts: LegacyHybridWorkout[],
    options: Partial<MigrationOptions> = {}
  ): MigrationResult {
    const opts = { ...DEFAULT_MIGRATION_OPTIONS, ...options };
    
    return this.migrateBatch(
      workouts,
      (workout) => this.migrateHybridWorkout(workout, opts),
      opts
    );
  }

  /**
   * Migrate agility workouts to standard metadata
   */
  static migrateAgilityWorkouts(
    workouts: LegacyAgilityWorkout[],
    options: Partial<MigrationOptions> = {}
  ): MigrationResult {
    const opts = { ...DEFAULT_MIGRATION_OPTIONS, ...options };
    
    return this.migrateBatch(
      workouts,
      (workout) => this.migrateAgilityWorkout(workout, opts),
      opts
    );
  }

  /**
   * Auto-detect and migrate mixed workout types
   */
  static migrateAllWorkouts(
    workouts: any[],
    options: Partial<MigrationOptions> = {}
  ): MigrationResult {
    const opts = { ...DEFAULT_MIGRATION_OPTIONS, ...options };
    
    return this.migrateBatch(
      workouts,
      (workout) => this.detectAndMigrateWorkout(workout, opts),
      opts
    );
  }

  /**
   * Batch migration utility
   */
  private static migrateBatch<T>(
    workouts: T[],
    migrationFunction: (workout: T) => StandardMetadata | null,
    options: MigrationOptions
  ): MigrationResult {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      failedCount: 0,
      errors: [],
      validationResults: [],
      migratedWorkouts: []
    };

    const batches = this.chunkArray(workouts, options.batchSize);
    
    for (const batch of batches) {
      for (const workout of batch) {
        try {
          const migrated = migrationFunction(workout);
          
          if (migrated) {
            // Validate if requested
            if (options.validateAfterMigration) {
              const validation = MetadataUtils.validateMetadata(migrated);
              result.validationResults.push({
                workoutId: migrated.id,
                validation
              });
              
              if (!validation.isValid && options.skipInvalid) {
                result.failedCount++;
                result.errors.push({
                  workoutId: migrated.id,
                  error: `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
                  originalData: workout
                });
                continue;
              }
            }
            
            result.migratedWorkouts.push(migrated);
            result.migratedCount++;
          } else {
            result.failedCount++;
            result.errors.push({
              workoutId: (workout as any).id || 'unknown',
              error: 'Migration function returned null',
              originalData: workout
            });
          }
        } catch (error) {
          result.failedCount++;
          result.errors.push({
            workoutId: (workout as any).id || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
            originalData: workout
          });
        }
      }
    }

    result.success = result.failedCount === 0;
    return result;
  }

  /**
   * Migrate individual strength workout
   */
  private static migrateStrengthWorkout(
    workout: LegacyStrengthWorkout,
    options: MigrationOptions
  ): StandardMetadata {
    const migrationTags = options.addMigrationTags ? ['migrated', 'strength-legacy'] : [];
    
    const partialMetadata: PartialMetadata = {
      id: options.preserveOriginalIds ? workout.id : undefined,
      name: workout.name,
      description: workout.description,
      tags: [...(workout.tags || []), ...migrationTags],
      category: 'strength',
      estimatedDuration: workout.duration,
      equipment: workout.equipment || [],
      createdAt: workout.createdAt,
      isTemplate: false
    };

    return MetadataUtils.generateMetadata(
      partialMetadata,
      workout.createdBy || options.defaultCreatedBy,
      options.defaultOrganizationId
    );
  }

  /**
   * Migrate individual conditioning workout
   */
  private static migrateConditioningWorkout(
    workout: LegacyConditioningWorkout,
    options: MigrationOptions
  ): StandardMetadata {
    const migrationTags = options.addMigrationTags ? ['migrated', 'conditioning-legacy'] : [];
    
    const partialMetadata: PartialMetadata = {
      id: options.preserveOriginalIds ? workout.id : undefined,
      name: workout.title,
      description: workout.notes,
      tags: [...(workout.labels || []), ...migrationTags],
      category: 'conditioning',
      estimatedDuration: workout.estimatedTime,
      intensityScore: workout.intensity,
      equipment: workout.requiredEquipment || [],
      createdAt: workout.created,
      isTemplate: false
    };

    return MetadataUtils.generateMetadata(
      partialMetadata,
      workout.authorId || options.defaultCreatedBy,
      options.defaultOrganizationId
    );
  }

  /**
   * Migrate individual hybrid workout
   */
  private static migrateHybridWorkout(
    workout: LegacyHybridWorkout,
    options: MigrationOptions
  ): StandardMetadata {
    const migrationTags = options.addMigrationTags ? ['migrated', 'hybrid-legacy'] : [];
    
    const partialMetadata: PartialMetadata = {
      id: options.preserveOriginalIds ? workout.id : undefined,
      name: workout.workoutName,
      tags: [...(workout.categories || []), ...migrationTags],
      category: 'hybrid',
      estimatedDuration: workout.totalDuration,
      equipment: workout.gear || [],
      createdAt: workout.timestamp,
      isTemplate: false
    };

    return MetadataUtils.generateMetadata(
      partialMetadata,
      workout.owner || options.defaultCreatedBy,
      options.defaultOrganizationId
    );
  }

  /**
   * Migrate individual agility workout
   */
  private static migrateAgilityWorkout(
    workout: LegacyAgilityWorkout,
    options: MigrationOptions
  ): StandardMetadata {
    const migrationTags = options.addMigrationTags ? ['migrated', 'agility-legacy'] : [];
    
    const partialMetadata: PartialMetadata = {
      id: options.preserveOriginalIds ? workout.id : undefined,
      name: workout.drillName,
      tags: [...(workout.skillAreas || []), ...migrationTags],
      category: 'agility',
      estimatedDuration: workout.timeRequired,
      complexityScore: workout.complexity,
      equipment: workout.materials || [],
      createdAt: workout.dateCreated,
      isTemplate: false
    };

    return MetadataUtils.generateMetadata(
      partialMetadata,
      workout.instructor || options.defaultCreatedBy,
      options.defaultOrganizationId
    );
  }

  /**
   * Auto-detect workout type and migrate
   */
  private static detectAndMigrateWorkout(
    workout: any,
    options: MigrationOptions
  ): StandardMetadata | null {
    // Try to detect workout type based on properties
    if (workout.exercises || workout.sets) {
      return this.migrateStrengthWorkout(workout, options);
    }
    
    if (workout.intervals || workout.interval) {
      return this.migrateConditioningWorkout(workout, options);
    }
    
    if (workout.blocks || workout.phases) {
      return this.migrateHybridWorkout(workout, options);
    }
    
    if (workout.pattern || workout.drills || workout.drill) {
      return this.migrateAgilityWorkout(workout, options);
    }

    // Fallback to generic migration
    return MetadataUtils.normalizeMetadata(workout, 'general');
  }

  /**
   * Create migration report
   */
  static generateMigrationReport(result: MigrationResult): string {
    const totalWorkouts = result.migratedCount + result.failedCount;
    const successRate = totalWorkouts > 0 ? (result.migratedCount / totalWorkouts * 100).toFixed(1) : '0';
    
    let report = `Migration Report\n`;
    report += `================\n\n`;
    report += `Total Workouts: ${totalWorkouts}\n`;
    report += `Successfully Migrated: ${result.migratedCount}\n`;
    report += `Failed: ${result.failedCount}\n`;
    report += `Success Rate: ${successRate}%\n\n`;
    
    if (result.validationResults.length > 0) {
      const validationIssues = result.validationResults.filter(r => !r.validation.isValid);
      report += `Validation Issues: ${validationIssues.length}\n\n`;
      
      if (validationIssues.length > 0) {
        report += `Validation Errors:\n`;
        validationIssues.forEach(issue => {
          report += `- ${issue.workoutId}: ${issue.validation.errors.map(e => e.message).join(', ')}\n`;
        });
        report += `\n`;
      }
    }
    
    if (result.errors.length > 0) {
      report += `Migration Errors:\n`;
      result.errors.slice(0, 10).forEach(error => { // Show first 10 errors
        report += `- ${error.workoutId}: ${error.error}\n`;
      });
      
      if (result.errors.length > 10) {
        report += `... and ${result.errors.length - 10} more errors\n`;
      }
    }
    
    return report;
  }

  /**
   * Save migration backup
   */
  static createMigrationBackup(workouts: any[]): string {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      workoutCount: workouts.length,
      workouts
    };
    
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Restore from migration backup
   */
  static restoreFromBackup(backupData: string): any[] {
    try {
      const backup = JSON.parse(backupData);
      return backup.workouts || [];
    } catch (error) {
      throw new Error('Invalid backup data format');
    }
  }

  /**
   * Verify migration integrity
   */
  static verifyMigration(
    originalWorkouts: any[],
    migratedWorkouts: StandardMetadata[]
  ): {
    isValid: boolean;
    issues: string[];
    statistics: {
      originalCount: number;
      migratedCount: number;
      missingIds: string[];
      duplicateIds: string[];
    };
  } {
    const issues: string[] = [];
    const originalIds = new Set(originalWorkouts.map(w => w.id).filter(Boolean));
    const migratedIds = new Set(migratedWorkouts.map(w => w.id));
    
    // Check for missing workouts
    const missingIds = Array.from(originalIds).filter(id => !migratedIds.has(id));
    if (missingIds.length > 0) {
      issues.push(`Missing ${missingIds.length} workouts after migration`);
    }
    
    // Check for duplicate IDs
    const duplicateIds: string[] = [];
    const seenIds = new Set<string>();
    migratedWorkouts.forEach(workout => {
      if (seenIds.has(workout.id)) {
        duplicateIds.push(workout.id);
      }
      seenIds.add(workout.id);
    });
    
    if (duplicateIds.length > 0) {
      issues.push(`Found ${duplicateIds.length} duplicate IDs`);
    }
    
    // Check data integrity
    migratedWorkouts.forEach(workout => {
      if (!workout.name || workout.name.trim() === '') {
        issues.push(`Workout ${workout.id} has empty name`);
      }
      
      if (!workout.createdBy) {
        issues.push(`Workout ${workout.id} has no creator`);
      }
      
      if (!workout.organizationId) {
        issues.push(`Workout ${workout.id} has no organization`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues,
      statistics: {
        originalCount: originalWorkouts.length,
        migratedCount: migratedWorkouts.length,
        missingIds,
        duplicateIds
      }
    };
  }

  /**
   * Utility to chunk array for batch processing
   */
  private static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Export common migration functions
export const {
  migrateStrengthWorkouts,
  migrateConditioningWorkouts,
  migrateHybridWorkouts,
  migrateAgilityWorkouts,
  migrateAllWorkouts,
  generateMigrationReport,
  createMigrationBackup,
  restoreFromBackup,
  verifyMigration
} = MetadataMigrationUtils;

// Migration presets for common scenarios
export const MIGRATION_PRESETS = {
  production: {
    preserveOriginalIds: true,
    validateAfterMigration: true,
    skipInvalid: false,
    addMigrationTags: false,
    batchSize: 50
  },
  development: {
    preserveOriginalIds: true,
    validateAfterMigration: true,
    skipInvalid: true,
    addMigrationTags: true,
    batchSize: 100
  },
  testing: {
    preserveOriginalIds: false,
    validateAfterMigration: true,
    skipInvalid: false,
    addMigrationTags: true,
    batchSize: 10
  }
} as const;