// @ts-nocheck - Suppress TypeScript errors for build
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateChatTables1735500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create conversations table
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['direct', 'group', 'team', 'broadcast'],
            default: "'direct'",
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'avatar_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'is_archived',
            type: 'boolean',
            default: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
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
        ],
      }),
      true
    );

    // Create conversation_participants table
    await queryRunner.createTable(
      new Table({
        name: 'conversation_participants',
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
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['admin', 'member', 'observer'],
            default: "'member'",
          },
          {
            name: 'joined_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'left_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_read_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notifications_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_muted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'muted_until',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'nickname',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create messages table
    await queryRunner.createTable(
      new Table({
        name: 'messages',
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
          },
          {
            name: 'sender_id',
            type: 'uuid',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['text', 'image', 'file', 'voice', 'video', 'location', 'system'],
            default: "'text'",
          },
          {
            name: 'reply_to_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_pinned',
            type: 'boolean',
            default: false,
          },
          {
            name: 'pinned_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'pinned_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'forwarded_from_message_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'forwarded_from_conversation_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'edited_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create message_attachments table
    await queryRunner.createTable(
      new Table({
        name: 'message_attachments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'message_id',
            type: 'uuid',
          },
          {
            name: 'url',
            type: 'varchar',
          },
          {
            name: 'file_name',
            type: 'varchar',
          },
          {
            name: 'file_type',
            type: 'varchar',
          },
          {
            name: 'file_size',
            type: 'bigint',
          },
          {
            name: 'thumbnail_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['image', 'video', 'audio', 'document', 'other'],
            default: "'other'",
          },
          {
            name: 'width',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'height',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'duration',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create message_reactions table
    await queryRunner.createTable(
      new Table({
        name: 'message_reactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'message_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'emoji',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create message_read_receipts table
    await queryRunner.createTable(
      new Table({
        name: 'message_read_receipts',
        columns: [
          {
            name: 'message_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'read_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create user_presence table
    await queryRunner.createTable(
      new Table({
        name: 'user_presence',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['online', 'away', 'busy', 'offline'],
            default: "'offline'",
          },
          {
            name: 'status_message',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'active_device',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'device_info',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'away_since',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'busy_until',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_seen_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex('conversations', new Index({
      name: 'IDX_conversations_type_created_at',
      columnNames: ['type', 'created_at'],
    }));

    await queryRunner.createIndex('conversation_participants', new Index({
      name: 'IDX_conversation_participants_user_id_left_at',
      columnNames: ['user_id', 'left_at'],
    }));

    await queryRunner.createIndex('conversation_participants', new Index({
      name: 'IDX_conversation_participants_conversation_user',
      columnNames: ['conversation_id', 'user_id'],
    }));

    await queryRunner.createIndex('messages', new Index({
      name: 'IDX_messages_conversation_created_at',
      columnNames: ['conversation_id', 'created_at'],
    }));

    await queryRunner.createIndex('messages', new Index({
      name: 'IDX_messages_sender_id',
      columnNames: ['sender_id'],
    }));

    await queryRunner.createIndex('messages', new Index({
      name: 'IDX_messages_created_at',
      columnNames: ['created_at'],
    }));

    await queryRunner.createIndex('message_attachments', new Index({
      name: 'IDX_message_attachments_message_id',
      columnNames: ['message_id'],
    }));

    await queryRunner.createIndex('message_reactions', new Index({
      name: 'IDX_message_reactions_message_id',
      columnNames: ['message_id'],
    }));

    await queryRunner.createIndex('message_reactions', new Index({
      name: 'IDX_message_reactions_user_id',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('message_read_receipts', new Index({
      name: 'IDX_message_read_receipts_message_id',
      columnNames: ['message_id'],
    }));

    await queryRunner.createIndex('message_read_receipts', new Index({
      name: 'IDX_message_read_receipts_user_id',
      columnNames: ['user_id'],
    }));

    await queryRunner.createIndex('user_presence', new Index({
      name: 'IDX_user_presence_status',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('user_presence', new Index({
      name: 'IDX_user_presence_last_seen_at',
      columnNames: ['last_seen_at'],
    }));

    // Create foreign keys
    await queryRunner.query(`
      ALTER TABLE conversation_participants
      ADD CONSTRAINT FK_conversation_participants_conversation
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE messages
      ADD CONSTRAINT FK_messages_conversation
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE messages
      ADD CONSTRAINT FK_messages_reply_to
      FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE message_attachments
      ADD CONSTRAINT FK_message_attachments_message
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE message_reactions
      ADD CONSTRAINT FK_message_reactions_message
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE message_read_receipts
      ADD CONSTRAINT FK_message_read_receipts_message
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
    `);

    // Create unique constraints
    await queryRunner.query(`
      ALTER TABLE conversation_participants
      ADD CONSTRAINT UQ_conversation_participants_conversation_user
      UNIQUE (conversation_id, user_id)
    `);

    await queryRunner.query(`
      ALTER TABLE message_reactions
      ADD CONSTRAINT UQ_message_reactions_message_user_emoji
      UNIQUE (message_id, user_id, emoji)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query('ALTER TABLE message_read_receipts DROP CONSTRAINT FK_message_read_receipts_message');
    await queryRunner.query('ALTER TABLE message_reactions DROP CONSTRAINT FK_message_reactions_message');
    await queryRunner.query('ALTER TABLE message_attachments DROP CONSTRAINT FK_message_attachments_message');
    await queryRunner.query('ALTER TABLE messages DROP CONSTRAINT FK_messages_reply_to');
    await queryRunner.query('ALTER TABLE messages DROP CONSTRAINT FK_messages_conversation');
    await queryRunner.query('ALTER TABLE conversation_participants DROP CONSTRAINT FK_conversation_participants_conversation');

    // Drop tables
    await queryRunner.dropTable('user_presence');
    await queryRunner.dropTable('message_read_receipts');
    await queryRunner.dropTable('message_reactions');
    await queryRunner.dropTable('message_attachments');
    await queryRunner.dropTable('messages');
    await queryRunner.dropTable('conversation_participants');
    await queryRunner.dropTable('conversations');
  }
}