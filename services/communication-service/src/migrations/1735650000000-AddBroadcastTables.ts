// @ts-nocheck - Suppress TypeScript errors for build
import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class AddBroadcastTables1735650000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create broadcasts table
    await queryRunner.createTable(
      new Table({
        name: 'broadcasts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'coach_id',
            type: 'uuid',
          },
          {
            name: 'team_id',
            type: 'uuid',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['normal', 'important', 'urgent'],
            default: "'normal'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
            default: "'draft'",
          },
          {
            name: 'target_type',
            type: 'enum',
            enum: ['team', 'role', 'custom'],
            default: "'team'",
          },
          {
            name: 'target_user_ids',
            type: 'uuid[]',
            isNullable: true,
          },
          {
            name: 'target_roles',
            type: 'varchar[]',
            isNullable: true,
          },
          {
            name: 'scheduled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'attachments',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'total_recipients',
            type: 'integer',
            default: 0,
          },
          {
            name: 'delivered_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'read_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'acknowledged_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'message_id',
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
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'deleted_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'last_request_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'last_ip_address',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create broadcast_recipients table
    await queryRunner.createTable(
      new Table({
        name: 'broadcast_recipients',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'broadcast_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'delivered', 'read', 'acknowledged', 'failed'],
            default: "'pending'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'delivered_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'read_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'acknowledged_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'acknowledgment_note',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'failure_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'device_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'device_type',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'notification_channels',
            type: 'varchar[]',
            default: "'{}'",
          },
        ],
      }),
      true
    );

    // Add broadcast fields to messages table
    await queryRunner.addColumn(
      'messages',
      {
        name: 'broadcast_id',
        type: 'uuid',
        isNullable: true,
      }
    );

    await queryRunner.addColumn(
      'messages',
      {
        name: 'broadcast_priority',
        type: 'enum',
        enum: ['normal', 'important', 'urgent'],
        isNullable: true,
      }
    );

    // Create indexes
    await queryRunner.createIndex(
      'broadcasts',
      new Index({
        name: 'IDX_broadcast_coach_created',
        columnNames: ['coach_id', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'broadcasts',
      new Index({
        name: 'IDX_broadcast_team_status',
        columnNames: ['team_id', 'status'],
      })
    );

    await queryRunner.createIndex(
      'broadcasts',
      new Index({
        name: 'IDX_broadcast_scheduled',
        columnNames: ['scheduled_at'],
        where: 'scheduled_at IS NOT NULL',
      })
    );

    await queryRunner.createIndex(
      'broadcasts',
      new Index({
        name: 'IDX_broadcast_status',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'broadcast_recipients',
      new Index({
        name: 'IDX_recipient_broadcast_status',
        columnNames: ['broadcast_id', 'status'],
      })
    );

    await queryRunner.createIndex(
      'broadcast_recipients',
      new Index({
        name: 'IDX_recipient_user_created',
        columnNames: ['user_id', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'broadcast_recipients',
      new Index({
        name: 'IDX_recipient_status_created',
        columnNames: ['status', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'broadcast_recipients',
      new Index({
        name: 'UQ_broadcast_recipient',
        columnNames: ['broadcast_id', 'user_id'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'messages',
      new Index({
        name: 'IDX_message_broadcast',
        columnNames: ['broadcast_id'],
        where: 'broadcast_id IS NOT NULL',
      })
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'broadcasts',
      new ForeignKey({
        name: 'FK_broadcast_message',
        columnNames: ['message_id'],
        referencedTableName: 'messages',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'broadcast_recipients',
      new ForeignKey({
        name: 'FK_recipient_broadcast',
        columnNames: ['broadcast_id'],
        referencedTableName: 'broadcasts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('broadcast_recipients', 'FK_recipient_broadcast');
    await queryRunner.dropForeignKey('broadcasts', 'FK_broadcast_message');

    // Drop indexes
    await queryRunner.dropIndex('messages', 'IDX_message_broadcast');
    await queryRunner.dropIndex('broadcast_recipients', 'UQ_broadcast_recipient');
    await queryRunner.dropIndex('broadcast_recipients', 'IDX_recipient_status_created');
    await queryRunner.dropIndex('broadcast_recipients', 'IDX_recipient_user_created');
    await queryRunner.dropIndex('broadcast_recipients', 'IDX_recipient_broadcast_status');
    await queryRunner.dropIndex('broadcasts', 'IDX_broadcast_status');
    await queryRunner.dropIndex('broadcasts', 'IDX_broadcast_scheduled');
    await queryRunner.dropIndex('broadcasts', 'IDX_broadcast_team_status');
    await queryRunner.dropIndex('broadcasts', 'IDX_broadcast_coach_created');

    // Drop columns from messages
    await queryRunner.dropColumn('messages', 'broadcast_priority');
    await queryRunner.dropColumn('messages', 'broadcast_id');

    // Drop tables
    await queryRunner.dropTable('broadcast_recipients');
    await queryRunner.dropTable('broadcasts');
  }
}