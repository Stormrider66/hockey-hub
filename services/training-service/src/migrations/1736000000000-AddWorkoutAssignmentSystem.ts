// @ts-nocheck - TypeORM migration file
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddWorkoutAssignmentSystem1736000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create workout_assignments table
    await queryRunner.createTable(
      new Table({
        name: 'workout_assignments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'workoutSessionId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'organizationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'assignmentType',
            type: 'enum',
            enum: ['individual', 'team', 'line', 'position', 'age_group', 'custom_group'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'active', 'completed', 'cancelled', 'archived'],
            default: "'draft'",
          },
          {
            name: 'assignmentTarget',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'effectiveDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'expiryDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'recurrenceType',
            type: 'enum',
            enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'custom'],
            default: "'none'",
          },
          {
            name: 'recurrencePattern',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'approvedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'approvedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'priority',
            type: 'int',
            default: 0,
          },
          {
            name: 'loadProgression',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'performanceThresholds',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'allowPlayerOverrides',
            type: 'boolean',
            default: true,
          },
          {
            name: 'requireMedicalClearance',
            type: 'boolean',
            default: false,
          },
          {
            name: 'notifications',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'parentAssignmentId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'eventBusMetadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'lastSyncedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['workoutSessionId'],
            referencedTableName: 'workout_sessions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['parentAssignmentId'],
            referencedTableName: 'workout_assignments',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        uniques: [
          {
            columnNames: ['workoutSessionId', 'organizationId', 'effectiveDate'],
          },
        ],
      }),
      true
    );

    // Create indexes for workout_assignments
    await queryRunner.createIndex('workout_assignments', new Index({
      name: 'idx_assignment_organization_date',
      columnNames: ['organizationId', 'effectiveDate'],
    }));

    await queryRunner.createIndex('workout_assignments', new Index({
      name: 'idx_assignment_type_status',
      columnNames: ['assignmentType', 'status'],
    }));

    await queryRunner.createIndex('workout_assignments', new Index({
      name: 'idx_assignment_parent',
      columnNames: ['parentAssignmentId'],
    }));

    await queryRunner.createIndex('workout_assignments', new Index({
      name: 'idx_assignment_created_by',
      columnNames: ['createdBy'],
    }));

    await queryRunner.createIndex('workout_assignments', new Index({
      name: 'idx_assignment_workout',
      columnNames: ['workoutSessionId'],
    }));

    await queryRunner.createIndex('workout_assignments', new Index({
      name: 'idx_assignment_parent_hierarchy',
      columnNames: ['parentAssignmentId'],
    }));

    // Create workout_player_overrides table
    await queryRunner.createTable(
      new Table({
        name: 'workout_player_overrides',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'workoutAssignmentId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'playerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'overrideType',
            type: 'enum',
            enum: ['medical', 'performance', 'scheduling', 'custom'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'approved', 'rejected', 'expired'],
            default: "'pending'",
          },
          {
            name: 'effectiveDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'expiryDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'modifications',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'medicalRecordId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'medicalRestrictions',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'requestedBy',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'requestedAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'approvedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'approvedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'approvalNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'performanceData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'progressionOverride',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'requiresReview',
            type: 'boolean',
            default: false,
          },
          {
            name: 'nextReviewDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'communicationLog',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'eventBusMetadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['workoutAssignmentId'],
            referencedTableName: 'workout_assignments',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        uniques: [
          {
            columnNames: ['workoutAssignmentId', 'playerId', 'effectiveDate'],
          },
        ],
      }),
      true
    );

    // Create indexes for workout_player_overrides
    await queryRunner.createIndex('workout_player_overrides', new Index({
      name: 'idx_override_player_date',
      columnNames: ['playerId', 'effectiveDate'],
    }));

    await queryRunner.createIndex('workout_player_overrides', new Index({
      name: 'idx_override_type_status',
      columnNames: ['overrideType', 'status'],
    }));

    await queryRunner.createIndex('workout_player_overrides', new Index({
      name: 'idx_override_medical_ref',
      columnNames: ['medicalRecordId'],
    }));

    await queryRunner.createIndex('workout_player_overrides', new Index({
      name: 'idx_override_assignment',
      columnNames: ['workoutAssignmentId'],
    }));

    await queryRunner.createIndex('workout_player_overrides', new Index({
      name: 'idx_override_player',
      columnNames: ['playerId'],
    }));

    // Create player_progression_history table
    await queryRunner.createTable(
      new Table({
        name: 'player_progression_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'playerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'organizationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'teamId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'seasonId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'periodType',
            type: 'enum',
            enum: ['weekly', 'monthly', 'quarterly', 'seasonal', 'yearly'],
            isNullable: false,
          },
          {
            name: 'periodStart',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'periodEnd',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['strength', 'speed', 'endurance', 'power', 'flexibility', 'skill', 'recovery', 'overall'],
            isNullable: false,
          },
          {
            name: 'ageAtPeriod',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'position',
            type: 'varchar',
            length: 20,
            isNullable: true,
          },
          {
            name: 'workoutMetrics',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'performanceMetrics',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'comparisonMetrics',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'healthMetrics',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'coachingNotes',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'goals',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'externalData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'overallProgressionScore',
            type: 'float',
            isNullable: false,
          },
          {
            name: 'progressionTrend',
            type: 'varchar',
            length: 50,
            isNullable: false,
          },
          {
            name: 'recommendations',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'eventBusMetadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'version',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        uniques: [
          {
            columnNames: ['playerId', 'periodType', 'periodStart'],
          },
        ],
      }),
      true
    );

    // Create indexes for player_progression_history
    await queryRunner.createIndex('player_progression_history', new Index({
      name: 'idx_progression_player_date',
      columnNames: ['playerId', 'periodStart', 'periodEnd'],
    }));

    await queryRunner.createIndex('player_progression_history', new Index({
      name: 'idx_progression_organization_season',
      columnNames: ['organizationId', 'seasonId'],
    }));

    await queryRunner.createIndex('player_progression_history', new Index({
      name: 'idx_progression_team_category',
      columnNames: ['teamId', 'category'],
    }));

    await queryRunner.createIndex('player_progression_history', new Index({
      name: 'idx_progression_age_position',
      columnNames: ['ageAtPeriod', 'position'],
    }));

    await queryRunner.createIndex('player_progression_history', new Index({
      name: 'idx_progression_player',
      columnNames: ['playerId'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes for player_progression_history
    await queryRunner.dropIndex('player_progression_history', 'idx_progression_player');
    await queryRunner.dropIndex('player_progression_history', 'idx_progression_age_position');
    await queryRunner.dropIndex('player_progression_history', 'idx_progression_team_category');
    await queryRunner.dropIndex('player_progression_history', 'idx_progression_organization_season');
    await queryRunner.dropIndex('player_progression_history', 'idx_progression_player_date');
    
    // Drop player_progression_history table
    await queryRunner.dropTable('player_progression_history');

    // Drop indexes for workout_player_overrides
    await queryRunner.dropIndex('workout_player_overrides', 'idx_override_player');
    await queryRunner.dropIndex('workout_player_overrides', 'idx_override_assignment');
    await queryRunner.dropIndex('workout_player_overrides', 'idx_override_medical_ref');
    await queryRunner.dropIndex('workout_player_overrides', 'idx_override_type_status');
    await queryRunner.dropIndex('workout_player_overrides', 'idx_override_player_date');
    
    // Drop workout_player_overrides table
    await queryRunner.dropTable('workout_player_overrides');

    // Drop indexes for workout_assignments
    await queryRunner.dropIndex('workout_assignments', 'idx_assignment_parent_hierarchy');
    await queryRunner.dropIndex('workout_assignments', 'idx_assignment_workout');
    await queryRunner.dropIndex('workout_assignments', 'idx_assignment_created_by');
    await queryRunner.dropIndex('workout_assignments', 'idx_assignment_parent');
    await queryRunner.dropIndex('workout_assignments', 'idx_assignment_type_status');
    await queryRunner.dropIndex('workout_assignments', 'idx_assignment_organization_date');
    
    // Drop workout_assignments table
    await queryRunner.dropTable('workout_assignments');
  }
}