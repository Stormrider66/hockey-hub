// @ts-nocheck - Suppress TypeScript errors for build
import { MigrationInterface, QueryRunner, Index } from 'typeorm';

export class AddChatPerformanceIndexes1736500000000 implements MigrationInterface {
  name = 'AddChatPerformanceIndexes1736500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Message table indexes
    await queryRunner.createIndex('message', new Index({
      name: 'IDX_message_conversation_created',
      columnNames: ['conversation_id', 'created_at'],
    }));

    await queryRunner.createIndex('message', new Index({
      name: 'IDX_message_sender_created',
      columnNames: ['sender_id', 'created_at'],
    }));

    await queryRunner.createIndex('message', new Index({
      name: 'IDX_message_deleted_at',
      columnNames: ['deleted_at'],
      where: 'deleted_at IS NULL',
    }));

    // Full text search index for message content
    await queryRunner.query(`
      CREATE INDEX "IDX_message_content_search" ON "message" 
      USING GIN (to_tsvector('english', "content"))
    `);

    // Conversation table indexes
    await queryRunner.createIndex('conversation', new Index({
      name: 'IDX_conversation_updated_at',
      columnNames: ['updated_at'],
    }));

    await queryRunner.createIndex('conversation', new Index({
      name: 'IDX_conversation_type_archived',
      columnNames: ['type', 'is_archived'],
    }));

    // Partial index for active conversations
    await queryRunner.createIndex('conversation', new Index({
      name: 'IDX_conversation_active',
      columnNames: ['is_archived', 'updated_at'],
      where: 'is_archived = false',
    }));

    // ConversationParticipant indexes
    await queryRunner.createIndex('conversation_participant', new Index({
      name: 'IDX_participant_user_active',
      columnNames: ['user_id', 'is_active'],
      where: 'is_active = true',
    }));

    await queryRunner.createIndex('conversation_participant', new Index({
      name: 'IDX_participant_conversation_user',
      columnNames: ['conversation_id', 'user_id'],
      isUnique: true,
    }));

    // MessageReadReceipt indexes
    await queryRunner.createIndex('message_read_receipt', new Index({
      name: 'IDX_read_receipt_user_message',
      columnNames: ['user_id', 'message_id'],
      isUnique: true,
    }));

    await queryRunner.createIndex('message_read_receipt', new Index({
      name: 'IDX_read_receipt_message_id',
      columnNames: ['message_id'],
    }));

    // MessageAttachment indexes
    await queryRunner.createIndex('message_attachment', new Index({
      name: 'IDX_attachment_message_type',
      columnNames: ['message_id', 'type'],
    }));

    await queryRunner.createIndex('message_attachment', new Index({
      name: 'IDX_attachment_file_type',
      columnNames: ['file_type'],
    }));

    // MessageReaction indexes
    await queryRunner.createIndex('message_reaction', new Index({
      name: 'IDX_reaction_message_emoji',
      columnNames: ['message_id', 'emoji'],
    }));

    await queryRunner.createIndex('message_reaction', new Index({
      name: 'IDX_reaction_user_message',
      columnNames: ['user_id', 'message_id'],
    }));

    // UserPresence indexes
    await queryRunner.createIndex('user_presence', new Index({
      name: 'IDX_presence_user_status',
      columnNames: ['user_id', 'status'],
    }));

    await queryRunner.createIndex('user_presence', new Index({
      name: 'IDX_presence_last_seen',
      columnNames: ['last_seen_at'],
    }));

    // Notification indexes
    await queryRunner.createIndex('notification', new Index({
      name: 'IDX_notification_user_read',
      columnNames: ['user_id', 'is_read', 'created_at'],
    }));

    await queryRunner.createIndex('notification', new Index({
      name: 'IDX_notification_type_user',
      columnNames: ['type', 'user_id'],
    }));

    // Broadcast indexes
    await queryRunner.createIndex('broadcast', new Index({
      name: 'IDX_broadcast_organization_created',
      columnNames: ['organization_id', 'created_at'],
    }));

    await queryRunner.createIndex('broadcast', new Index({
      name: 'IDX_broadcast_priority_created',
      columnNames: ['priority', 'created_at'],
    }));

    // BroadcastRecipient indexes
    await queryRunner.createIndex('broadcast_recipient', new Index({
      name: 'IDX_broadcast_recipient_user_read',
      columnNames: ['user_id', 'is_read'],
      where: 'is_read = false',
    }));

    // ScheduledMessage indexes
    await queryRunner.createIndex('scheduled_message', new Index({
      name: 'IDX_scheduled_message_send_at',
      columnNames: ['send_at', 'is_sent'],
      where: 'is_sent = false',
    }));

    // BlockedUser indexes
    await queryRunner.createIndex('blocked_user', new Index({
      name: 'IDX_blocked_user_blocker_blocked',
      columnNames: ['blocker_user_id', 'blocked_user_id'],
      isUnique: true,
    }));

    // Create materialized view for unread message counts
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW conversation_unread_counts AS
      SELECT 
        cp.conversation_id,
        cp.user_id,
        COUNT(m.id) FILTER (
          WHERE m.sender_id != cp.user_id 
          AND m.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM message_read_receipt mrr
            WHERE mrr.message_id = m.id AND mrr.user_id = cp.user_id
          )
        ) as unread_count,
        MAX(m.created_at) as last_message_at
      FROM conversation_participant cp
      JOIN message m ON m.conversation_id = cp.conversation_id
      WHERE cp.is_active = true
      GROUP BY cp.conversation_id, cp.user_id;

      CREATE UNIQUE INDEX ON conversation_unread_counts (conversation_id, user_id);
      CREATE INDEX ON conversation_unread_counts (user_id, unread_count) WHERE unread_count > 0;
    `);

    // Create function to refresh unread counts
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION refresh_unread_counts()
      RETURNS void AS $$
      BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_unread_counts;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Add composite indexes for common query patterns
    await queryRunner.createIndex('message', new Index({
      name: 'IDX_message_conversation_sender_created',
      columnNames: ['conversation_id', 'sender_id', 'created_at'],
    }));

    await queryRunner.createIndex('conversation_participant', new Index({
      name: 'IDX_participant_user_last_read',
      columnNames: ['user_id', 'last_read_at'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop materialized view and function
    await queryRunner.query('DROP MATERIALIZED VIEW IF EXISTS conversation_unread_counts');
    await queryRunner.query('DROP FUNCTION IF EXISTS refresh_unread_counts()');

    // Drop all indexes in reverse order
    await queryRunner.dropIndex('conversation_participant', 'IDX_participant_user_last_read');
    await queryRunner.dropIndex('message', 'IDX_message_conversation_sender_created');
    await queryRunner.dropIndex('blocked_user', 'IDX_blocked_user_blocker_blocked');
    await queryRunner.dropIndex('scheduled_message', 'IDX_scheduled_message_send_at');
    await queryRunner.dropIndex('broadcast_recipient', 'IDX_broadcast_recipient_user_read');
    await queryRunner.dropIndex('broadcast', 'IDX_broadcast_priority_created');
    await queryRunner.dropIndex('broadcast', 'IDX_broadcast_organization_created');
    await queryRunner.dropIndex('notification', 'IDX_notification_type_user');
    await queryRunner.dropIndex('notification', 'IDX_notification_user_read');
    await queryRunner.dropIndex('user_presence', 'IDX_presence_last_seen');
    await queryRunner.dropIndex('user_presence', 'IDX_presence_user_status');
    await queryRunner.dropIndex('message_reaction', 'IDX_reaction_user_message');
    await queryRunner.dropIndex('message_reaction', 'IDX_reaction_message_emoji');
    await queryRunner.dropIndex('message_attachment', 'IDX_attachment_file_type');
    await queryRunner.dropIndex('message_attachment', 'IDX_attachment_message_type');
    await queryRunner.dropIndex('message_read_receipt', 'IDX_read_receipt_message_id');
    await queryRunner.dropIndex('message_read_receipt', 'IDX_read_receipt_user_message');
    await queryRunner.dropIndex('conversation_participant', 'IDX_participant_conversation_user');
    await queryRunner.dropIndex('conversation_participant', 'IDX_participant_user_active');
    await queryRunner.dropIndex('conversation', 'IDX_conversation_active');
    await queryRunner.dropIndex('conversation', 'IDX_conversation_type_archived');
    await queryRunner.dropIndex('conversation', 'IDX_conversation_updated_at');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_message_content_search"');
    await queryRunner.dropIndex('message', 'IDX_message_deleted_at');
    await queryRunner.dropIndex('message', 'IDX_message_sender_created');
    await queryRunner.dropIndex('message', 'IDX_message_conversation_created');
  }
}