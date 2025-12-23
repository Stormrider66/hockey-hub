// @ts-nocheck - TypeORM migration file
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddSessionTemplates1736100000000 implements MigrationInterface {
  name = 'AddSessionTemplates1736100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "template_category" AS ENUM (
        'pre_season', 'in_season', 'post_season', 'recovery', 
        'strength', 'conditioning', 'skill_development', 
        'injury_prevention', 'custom'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "template_visibility" AS ENUM (
        'private', 'team', 'organization', 'public'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "session_workout_type" AS ENUM (
        'strength', 'cardio', 'flexibility', 'technical', 'recovery', 'mixed'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "difficulty_level" AS ENUM (
        'beginner', 'intermediate', 'advanced', 'professional'
      )
    `);

    // Create session_templates table
    await queryRunner.createTable(
      new Table({
        name: 'session_templates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'template_category',
            default: "'custom'",
          },
          {
            name: 'type',
            type: 'session_workout_type',
            default: "'mixed'",
          },
          {
            name: 'difficulty',
            type: 'difficulty_level',
            default: "'intermediate'",
          },
          {
            name: 'visibility',
            type: 'template_visibility',
            default: "'private'",
          },
          {
            name: 'organizationId',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'teamId',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'estimatedDuration',
            type: 'integer',
            default: 60,
          },
          {
            name: 'exercises',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'warmup',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'cooldown',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'equipment',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'targetGroups',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'goals',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'usageCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'averageRating',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'ratingCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isSystemTemplate',
            type: 'boolean',
            default: false,
          },
          {
            name: 'permissions',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
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
            name: 'lastUsedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'session_templates',
      new Index({
        name: 'IDX_session_templates_org_active',
        columnNames: ['organizationId', 'isActive'],
      })
    );

    await queryRunner.createIndex(
      'session_templates',
      new Index({
        name: 'IDX_session_templates_created_by_active',
        columnNames: ['createdBy', 'isActive'],
      })
    );

    await queryRunner.createIndex(
      'session_templates',
      new Index({
        name: 'IDX_session_templates_category_visibility',
        columnNames: ['category', 'visibility'],
      })
    );

    await queryRunner.createIndex(
      'session_templates',
      new Index({
        name: 'IDX_session_templates_type_difficulty',
        columnNames: ['type', 'difficulty'],
      })
    );

    await queryRunner.createIndex(
      'session_templates',
      new Index({
        name: 'IDX_session_templates_team',
        columnNames: ['teamId'],
      })
    );

    await queryRunner.createIndex(
      'session_templates',
      new Index({
        name: 'IDX_session_templates_created_by',
        columnNames: ['createdBy'],
      })
    );

    await queryRunner.createIndex(
      'session_templates',
      new Index({
        name: 'IDX_session_templates_org',
        columnNames: ['organizationId'],
      })
    );

    // Insert some system templates
    await queryRunner.query(`
      INSERT INTO session_templates (
        name, description, category, type, difficulty, visibility, 
        organizationId, createdBy, estimatedDuration, isSystemTemplate,
        exercises, warmup, cooldown, equipment, goals, tags
      ) VALUES
      (
        'Beginner Strength Training',
        'A basic strength training session for beginners focusing on fundamental movements',
        'strength',
        'strength',
        'beginner',
        'public',
        'system',
        'system',
        45,
        true,
        '[
          {
            "exerciseId": "squat",
            "name": "Bodyweight Squat",
            "category": "strength",
            "sets": 3,
            "reps": 12,
            "restBetweenSets": 60,
            "order": 1,
            "instructions": "Keep chest up, knees tracking over toes"
          },
          {
            "exerciseId": "pushup",
            "name": "Push-ups",
            "category": "strength",
            "sets": 3,
            "reps": 10,
            "restBetweenSets": 60,
            "order": 2,
            "instructions": "Maintain straight line from head to heels"
          },
          {
            "exerciseId": "plank",
            "name": "Plank",
            "category": "core",
            "sets": 3,
            "duration": 30,
            "restBetweenSets": 45,
            "order": 3,
            "instructions": "Keep core engaged, avoid sagging hips"
          }
        ]'::jsonb,
        '{"duration": 10, "activities": ["Light cardio", "Dynamic stretching", "Arm circles", "Leg swings"]}'::jsonb,
        '{"duration": 10, "activities": ["Static stretching", "Foam rolling", "Deep breathing"]}'::jsonb,
        '["None required"]'::jsonb,
        '["Build foundational strength", "Improve form", "Increase endurance"]'::jsonb,
        '["beginner", "strength", "no-equipment"]'::jsonb
      ),
      (
        'Hockey-Specific Conditioning',
        'Sport-specific conditioning workout to improve on-ice performance',
        'conditioning',
        'mixed',
        'intermediate',
        'public',
        'system',
        'system',
        60,
        true,
        '[
          {
            "exerciseId": "shuttle_runs",
            "name": "Shuttle Runs",
            "category": "cardio",
            "sets": 5,
            "distance": 20,
            "restBetweenSets": 90,
            "order": 1,
            "targetMetrics": {"heartRateZone": "zone4"}
          },
          {
            "exerciseId": "box_jumps",
            "name": "Box Jumps",
            "category": "power",
            "sets": 4,
            "reps": 8,
            "restBetweenSets": 90,
            "order": 2,
            "instructions": "Focus on explosive power"
          },
          {
            "exerciseId": "lateral_lunges",
            "name": "Lateral Lunges",
            "category": "strength",
            "sets": 3,
            "reps": 12,
            "restBetweenSets": 60,
            "order": 3
          }
        ]'::jsonb,
        '{"duration": 15, "activities": ["Jogging", "High knees", "Butt kicks", "Dynamic stretching"]}'::jsonb,
        '{"duration": 10, "activities": ["Static stretching", "Foam rolling", "Recovery breathing"]}'::jsonb,
        '["Box or platform", "Cones", "Open space"]'::jsonb,
        '["Improve skating power", "Enhance agility", "Build endurance"]'::jsonb,
        '["hockey", "conditioning", "intermediate"]'::jsonb
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('session_templates', 'IDX_session_templates_org_active');
    await queryRunner.dropIndex('session_templates', 'IDX_session_templates_created_by_active');
    await queryRunner.dropIndex('session_templates', 'IDX_session_templates_category_visibility');
    await queryRunner.dropIndex('session_templates', 'IDX_session_templates_type_difficulty');
    await queryRunner.dropIndex('session_templates', 'IDX_session_templates_team');
    await queryRunner.dropIndex('session_templates', 'IDX_session_templates_created_by');
    await queryRunner.dropIndex('session_templates', 'IDX_session_templates_org');

    // Drop table
    await queryRunner.dropTable('session_templates');

    // Drop enum types
    await queryRunner.query(`DROP TYPE "template_category"`);
    await queryRunner.query(`DROP TYPE "template_visibility"`);
    await queryRunner.query(`DROP TYPE "session_workout_type"`);
    await queryRunner.query(`DROP TYPE "difficulty_level"`);
  }
}