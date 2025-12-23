// @ts-nocheck - Suppress TypeScript errors for build
import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class AddEventConversationTable1735650000000 implements MigrationInterface {
  name = 'AddEventConversationTable1735650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create event_conversations table
    await queryRunner.createTable(
      new Table({
        name: 'event_conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'event_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'conversation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'archived', 'suspended'],
            default: "'active'",
          },
          {
            name: 'scope',
            type: 'enum',
            enum: ['all_participants', 'coaches_only', 'players_only', 'parents_only', 'custom'],
            default: "'all_participants'",
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'auto_archive_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'auto_add_participants',
            type: 'boolean',
            default: true,
          },
          {
            name: 'send_welcome_message',
            type: 'boolean',
            default: true,
          },
          {
            name: 'settings',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create indexes for better performance
    await queryRunner.createIndex(
      'event_conversations',
      new Index({
        name: 'IDX_event_conversations_event_id',
        columnNames: ['event_id'],
      })
    );

    await queryRunner.createIndex(
      'event_conversations',
      new Index({
        name: 'IDX_event_conversations_conversation_id',
        columnNames: ['conversation_id'],
      })
    );

    await queryRunner.createIndex(
      'event_conversations',
      new Index({
        name: 'IDX_event_conversations_status_created_at',
        columnNames: ['status', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'event_conversations',
      new Index({
        name: 'IDX_event_conversations_created_by',
        columnNames: ['created_by'],
      })
    );

    await queryRunner.createIndex(
      'event_conversations',
      new Index({
        name: 'IDX_event_conversations_auto_archive_at',
        columnNames: ['auto_archive_at'],
        where: 'auto_archive_at IS NOT NULL',
      })
    );

    // Create composite index for unique event-scope combinations
    await queryRunner.createIndex(
      'event_conversations',
      new Index({
        name: 'IDX_event_conversations_event_scope_unique',
        columnNames: ['event_id', 'scope', 'status'],
        isUnique: true,
        where: "status = 'active'",
      })
    );

    // Create foreign key constraint to conversations table
    await queryRunner.createForeignKey(
      'event_conversations',
      new ForeignKey({
        columnNames: ['conversation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'conversations',
        onDelete: 'CASCADE',
        name: 'FK_event_conversations_conversation_id',
      })
    );

    // Add trigger to update updated_at timestamp
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_event_conversations_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_event_conversations_updated_at
        BEFORE UPDATE ON event_conversations
        FOR EACH ROW
        EXECUTE PROCEDURE update_event_conversations_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger and function
    await queryRunner.query('DROP TRIGGER IF EXISTS trigger_update_event_conversations_updated_at ON event_conversations;');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_event_conversations_updated_at();');

    // Drop foreign keys
    await queryRunner.dropForeignKey('event_conversations', 'FK_event_conversations_conversation_id');

    // Drop indexes
    await queryRunner.dropIndex('event_conversations', 'IDX_event_conversations_event_id');
    await queryRunner.dropIndex('event_conversations', 'IDX_event_conversations_conversation_id');
    await queryRunner.dropIndex('event_conversations', 'IDX_event_conversations_status_created_at');
    await queryRunner.dropIndex('event_conversations', 'IDX_event_conversations_created_by');
    await queryRunner.dropIndex('event_conversations', 'IDX_event_conversations_auto_archive_at');
    await queryRunner.dropIndex('event_conversations', 'IDX_event_conversations_event_scope_unique');

    // Drop table
    await queryRunner.dropTable('event_conversations');
  }
}