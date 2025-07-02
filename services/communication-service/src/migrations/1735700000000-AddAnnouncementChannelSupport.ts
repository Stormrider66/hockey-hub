import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnnouncementChannelSupport1735700000000 implements MigrationInterface {
  name = 'AddAnnouncementChannelSupport1735700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add ANNOUNCEMENT to ConversationType enum
    await queryRunner.query(`
      ALTER TYPE "conversation_type_enum" ADD VALUE 'announcement' AFTER 'broadcast';
    `);

    // Add ANNOUNCEMENT to MessageType enum
    await queryRunner.query(`
      ALTER TYPE "message_type_enum" ADD VALUE 'announcement' AFTER 'broadcast';
    `);

    // Create indexes for announcement-specific queries
    await queryRunner.query(`
      CREATE INDEX "IDX_conversation_type_announcement" 
      ON "conversations" ("type", "is_archived") 
      WHERE type = 'announcement';
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_message_pinned" 
      ON "messages" ("conversation_id", "is_pinned", "pinned_at") 
      WHERE is_pinned = true;
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_message_announcement_priority" 
      ON "messages" ("conversation_id", "created_at") 
      WHERE type = 'announcement';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_conversation_type_announcement"`);
    await queryRunner.query(`DROP INDEX "IDX_message_pinned"`);
    await queryRunner.query(`DROP INDEX "IDX_message_announcement_priority"`);

    // Note: Removing enum values in PostgreSQL is complex and not recommended
    // The enum values will remain but won't be used
  }
}