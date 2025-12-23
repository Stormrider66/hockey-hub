// @ts-nocheck - Suppress TypeScript errors for build
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddTrainingDiscussionTables1735800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create training_discussions table
    await queryRunner.createTable(
      new Table({
        name: 'training_discussions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'session_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'session_type',
            type: 'enum',
            enum: ['ice_practice', 'physical_training', 'video_review', 'combined'],
            isNullable: false,
          },
          {
            name: 'session_title',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'session_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'session_location',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'team_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['scheduled', 'active', 'completed', 'archived'],
            default: "'scheduled'",
          },
          {
            name: 'session_metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'archived_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'archived_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['conversation_id'],
            referencedTableName: 'conversations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Create indexes for training_discussions
    await queryRunner.createIndex(
      'training_discussions',
      new Index({
        name: 'IDX_training_discussions_session',
        columnNames: ['session_id', 'session_type'],
      })
    );

    await queryRunner.createIndex(
      'training_discussions',
      new Index({
        name: 'IDX_training_discussions_status_date',
        columnNames: ['status', 'session_date'],
      })
    );

    // Create unique constraint
    await queryRunner.createIndex(
      'training_discussions',
      new Index({
        name: 'UQ_training_discussions_session',
        columnNames: ['session_id', 'session_type'],
        isUnique: true,
      })
    );

    // Create exercise_discussions table
    await queryRunner.createTable(
      new Table({
        name: 'exercise_discussions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'training_discussion_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'exercise_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'exercise_name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'exercise_description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'thread_conversation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'exercise_metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'feedback_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'attachment_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['training_discussion_id'],
            referencedTableName: 'training_discussions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['thread_conversation_id'],
            referencedTableName: 'conversations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Create indexes for exercise_discussions
    await queryRunner.createIndex(
      'exercise_discussions',
      new Index({
        name: 'IDX_exercise_discussions_training',
        columnNames: ['training_discussion_id', 'exercise_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes for exercise_discussions
    await queryRunner.dropIndex('exercise_discussions', 'IDX_exercise_discussions_training');

    // Drop exercise_discussions table
    await queryRunner.dropTable('exercise_discussions');

    // Drop indexes for training_discussions
    await queryRunner.dropIndex('training_discussions', 'UQ_training_discussions_session');
    await queryRunner.dropIndex('training_discussions', 'IDX_training_discussions_status_date');
    await queryRunner.dropIndex('training_discussions', 'IDX_training_discussions_session');

    // Drop training_discussions table
    await queryRunner.dropTable('training_discussions');
  }
}