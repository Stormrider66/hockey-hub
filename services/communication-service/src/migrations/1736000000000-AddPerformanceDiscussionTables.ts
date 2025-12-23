// @ts-nocheck - Suppress TypeScript errors for build
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddPerformanceDiscussionTables1736000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create performance_discussions table
    await queryRunner.createTable(
      new Table({
        name: 'performance_discussions',
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
            name: 'player_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'coach_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'training_discussion_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'period',
            type: 'enum',
            enum: ['session', 'weekly', 'monthly', 'quarterly', 'seasonal'],
            default: "'session'",
          },
          {
            name: 'start_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'timestamp',
            isNullable: false,
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
            name: 'performance_metrics',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'goals',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'action_items',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'strengths',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'areas_for_improvement',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'training_recommendations',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'overall_assessment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'overall_rating',
            type: 'decimal',
            precision: 3,
            scale: 1,
            isNullable: true,
          },
          {
            name: 'is_confidential',
            type: 'boolean',
            default: false,
          },
          {
            name: 'parent_can_view',
            type: 'boolean',
            default: true,
          },
          {
            name: 'shared_with',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'scheduled_review_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create performance_feedback table
    await queryRunner.createTable(
      new Table({
        name: 'performance_feedback',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'performance_discussion_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provided_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'feedback_type',
            type: 'enum',
            enum: ['coach', 'player', 'parent', 'peer'],
            isNullable: false,
          },
          {
            name: 'feedback_content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'specific_metrics',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'attachments',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_private',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create indexes for performance_discussions
    await queryRunner.createIndex(
      'performance_discussions',
      new Index({
        name: 'IDX_performance_discussions_player_period',
        columnNames: ['player_id', 'period', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'performance_discussions',
      new Index({
        name: 'IDX_performance_discussions_training',
        columnNames: ['training_discussion_id'],
      })
    );

    await queryRunner.createIndex(
      'performance_discussions',
      new Index({
        name: 'IDX_performance_discussions_org_team',
        columnNames: ['organization_id', 'team_id'],
      })
    );

    await queryRunner.createIndex(
      'performance_discussions',
      new Index({
        name: 'IDX_performance_discussions_unique',
        columnNames: ['player_id', 'period', 'start_date', 'end_date'],
        isUnique: true,
      })
    );

    // Create indexes for performance_feedback
    await queryRunner.createIndex(
      'performance_feedback',
      new Index({
        name: 'IDX_performance_feedback_discussion',
        columnNames: ['performance_discussion_id', 'created_at'],
      })
    );

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE performance_discussions 
      ADD CONSTRAINT FK_performance_discussions_conversation 
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE performance_discussions 
      ADD CONSTRAINT FK_performance_discussions_training 
      FOREIGN KEY (training_discussion_id) REFERENCES training_discussions(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE performance_feedback 
      ADD CONSTRAINT FK_performance_feedback_discussion 
      FOREIGN KEY (performance_discussion_id) REFERENCES performance_discussions(id) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE performance_feedback DROP CONSTRAINT FK_performance_feedback_discussion`);
    await queryRunner.query(`ALTER TABLE performance_discussions DROP CONSTRAINT FK_performance_discussions_training`);
    await queryRunner.query(`ALTER TABLE performance_discussions DROP CONSTRAINT FK_performance_discussions_conversation`);

    // Drop indexes
    await queryRunner.dropIndex('performance_feedback', 'IDX_performance_feedback_discussion');
    await queryRunner.dropIndex('performance_discussions', 'IDX_performance_discussions_unique');
    await queryRunner.dropIndex('performance_discussions', 'IDX_performance_discussions_org_team');
    await queryRunner.dropIndex('performance_discussions', 'IDX_performance_discussions_training');
    await queryRunner.dropIndex('performance_discussions', 'IDX_performance_discussions_player_period');

    // Drop tables
    await queryRunner.dropTable('performance_feedback');
    await queryRunner.dropTable('performance_discussions');
  }
}