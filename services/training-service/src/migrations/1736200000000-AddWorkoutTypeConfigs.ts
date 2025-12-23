// @ts-nocheck - TypeORM migration file
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddWorkoutTypeConfigs1736200000000 implements MigrationInterface {
  name = 'AddWorkoutTypeConfigs1736200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create workout_type_configs table
    await queryRunner.createTable(
      new Table({
        name: 'workout_type_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'workoutType',
            type: 'enum',
            enum: [
              'STRENGTH',
              'CARDIO', 
              'AGILITY',
              'FLEXIBILITY',
              'POWER',
              'ENDURANCE',
              'RECOVERY',
              'REHABILITATION',
              'SPORT_SPECIFIC',
              'MENTAL'
            ],
            isNullable: false,
          },
          {
            name: 'organizationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metricsConfig',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'equipmentRequirements',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'progressionModels',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'safetyProtocols',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'customSettings',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'usageCount',
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
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updatedBy',
            type: 'uuid',
            isNullable: true,
          },
        ],
        uniques: [
          {
            name: 'UQ_workout_type_config_org',
            columnNames: ['organizationId', 'workoutType'],
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'workout_type_configs',
      new Index({
        name: 'IDX_workout_type_config_org',
        columnNames: ['organizationId'],
      })
    );

    await queryRunner.createIndex(
      'workout_type_configs',
      new Index({
        name: 'IDX_workout_type_config_type',
        columnNames: ['workoutType'],
      })
    );

    await queryRunner.createIndex(
      'workout_type_configs',
      new Index({
        name: 'IDX_workout_type_config_active',
        columnNames: ['isActive'],
      })
    );

    // Update workout_sessions table to use new enum
    await queryRunner.query(`
      ALTER TABLE workout_sessions 
      DROP COLUMN type
    `);

    await queryRunner.query(`
      CREATE TYPE "workout_sessions_type_enum" AS ENUM(
        'STRENGTH',
        'CARDIO',
        'AGILITY', 
        'FLEXIBILITY',
        'POWER',
        'ENDURANCE',
        'RECOVERY',
        'REHABILITATION',
        'SPORT_SPECIFIC',
        'MENTAL'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE workout_sessions
      ADD COLUMN type "workout_sessions_type_enum" NOT NULL DEFAULT 'STRENGTH'
    `);

    // Update session_templates table to use new enum
    await queryRunner.query(`
      ALTER TABLE session_templates
      DROP COLUMN type
    `);

    await queryRunner.query(`
      CREATE TYPE "session_templates_type_enum" AS ENUM(
        'STRENGTH',
        'CARDIO',
        'AGILITY',
        'FLEXIBILITY', 
        'POWER',
        'ENDURANCE',
        'RECOVERY',
        'REHABILITATION',
        'SPORT_SPECIFIC',
        'MENTAL'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE session_templates
      ADD COLUMN type "session_templates_type_enum" NOT NULL DEFAULT 'STRENGTH'
    `);

    // Add workoutType column to workout_assignments
    await queryRunner.query(`
      CREATE TYPE "workout_assignments_workouttype_enum" AS ENUM(
        'STRENGTH',
        'CARDIO',
        'AGILITY',
        'FLEXIBILITY',
        'POWER', 
        'ENDURANCE',
        'RECOVERY',
        'REHABILITATION',
        'SPORT_SPECIFIC',
        'MENTAL'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE workout_assignments
      ADD COLUMN "workoutType" "workout_assignments_workouttype_enum"
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE workout_type_configs
      ADD CONSTRAINT "FK_workout_type_config_organization"
      FOREIGN KEY ("organizationId") 
      REFERENCES "organizations"("id") 
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.query(`
      ALTER TABLE workout_type_configs
      DROP CONSTRAINT "FK_workout_type_config_organization"
    `);

    // Remove workoutType from workout_assignments
    await queryRunner.query(`
      ALTER TABLE workout_assignments
      DROP COLUMN "workoutType"
    `);

    await queryRunner.query(`
      DROP TYPE "workout_assignments_workouttype_enum"
    `);

    // Revert session_templates type column
    await queryRunner.query(`
      ALTER TABLE session_templates
      DROP COLUMN type
    `);

    await queryRunner.query(`
      DROP TYPE "session_templates_type_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE session_templates
      ADD COLUMN type varchar(50) NOT NULL DEFAULT 'mixed'
    `);

    // Revert workout_sessions type column
    await queryRunner.query(`
      ALTER TABLE workout_sessions
      DROP COLUMN type
    `);

    await queryRunner.query(`
      DROP TYPE "workout_sessions_type_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE workout_sessions
      ADD COLUMN type varchar(50) NOT NULL DEFAULT 'mixed'
    `);

    // Drop indexes
    await queryRunner.dropIndex('workout_type_configs', 'IDX_workout_type_config_active');
    await queryRunner.dropIndex('workout_type_configs', 'IDX_workout_type_config_type');
    await queryRunner.dropIndex('workout_type_configs', 'IDX_workout_type_config_org');

    // Drop table
    await queryRunner.dropTable('workout_type_configs');
  }
}