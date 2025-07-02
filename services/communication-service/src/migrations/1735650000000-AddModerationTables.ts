import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModerationTables1735650000000 implements MigrationInterface {
  name = 'AddModerationTables1735650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create moderation_rules table
    await queryRunner.query(`
      CREATE TABLE "moderation_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "ruleType" character varying NOT NULL,
        "action" character varying NOT NULL,
        "severity" character varying NOT NULL DEFAULT 'medium',
        "criteria" json NOT NULL,
        "exceptions" json,
        "isActive" boolean NOT NULL DEFAULT true,
        "priority" integer NOT NULL DEFAULT 0,
        "expiresAt" TIMESTAMP,
        "createdBy" uuid NOT NULL,
        "updatedBy" uuid,
        "statistics" json,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_moderation_rules" PRIMARY KEY ("id")
      )
    `);

    // Create moderated_content table
    await queryRunner.query(`
      CREATE TABLE "moderated_content" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "messageId" uuid NOT NULL,
        "reporterId" uuid NOT NULL,
        "moderatorId" uuid,
        "status" character varying NOT NULL DEFAULT 'pending',
        "reason" character varying NOT NULL,
        "description" text,
        "action" character varying NOT NULL DEFAULT 'none',
        "moderatorNotes" text,
        "reviewedAt" TIMESTAMP,
        "metadata" json,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_moderated_content" PRIMARY KEY ("id")
      )
    `);

    // Create user_moderation table
    await queryRunner.query(`
      CREATE TABLE "user_moderation" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "moderatorId" uuid NOT NULL,
        "status" character varying NOT NULL DEFAULT 'active',
        "reason" character varying NOT NULL,
        "description" text NOT NULL,
        "moderatorNotes" text,
        "expiresAt" TIMESTAMP,
        "isActive" boolean NOT NULL DEFAULT false,
        "restrictions" json,
        "metadata" json,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_moderation" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "moderated_content" 
      ADD CONSTRAINT "FK_moderated_content_message" 
      FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE
    `);

    // Create indexes for moderation_rules
    await queryRunner.query(`
      CREATE INDEX "IDX_moderation_rules_isActive" ON "moderation_rules" ("isActive")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_moderation_rules_ruleType" ON "moderation_rules" ("ruleType")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_moderation_rules_severity" ON "moderation_rules" ("severity")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_moderation_rules_createdBy" ON "moderation_rules" ("createdBy")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_moderation_rules_updatedBy" ON "moderation_rules" ("updatedBy")
    `);

    // Create indexes for moderated_content
    await queryRunner.query(`
      CREATE INDEX "IDX_moderated_content_status_createdAt" ON "moderated_content" ("status", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_moderated_content_messageId" ON "moderated_content" ("messageId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_moderated_content_reporterId" ON "moderated_content" ("reporterId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_moderated_content_moderatorId" ON "moderated_content" ("moderatorId")
    `);

    // Create indexes for user_moderation
    await queryRunner.query(`
      CREATE INDEX "IDX_user_moderation_userId_status" ON "user_moderation" ("userId", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_moderation_moderatorId" ON "user_moderation" ("moderatorId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_moderation_status" ON "user_moderation" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_moderation_expiresAt" ON "user_moderation" ("expiresAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_moderation_userId" ON "user_moderation" ("userId")
    `);

    // Add CHECK constraints for enum values
    await queryRunner.query(`
      ALTER TABLE "moderation_rules"
      ADD CONSTRAINT "CHK_moderation_rules_ruleType" 
      CHECK ("ruleType" IN ('keyword_filter', 'pattern_match', 'content_length', 'rate_limit', 'attachment_filter', 'link_filter'))
    `);

    await queryRunner.query(`
      ALTER TABLE "moderation_rules"
      ADD CONSTRAINT "CHK_moderation_rules_action" 
      CHECK ("action" IN ('flag_for_review', 'auto_delete', 'auto_mute', 'require_approval', 'quarantine'))
    `);

    await queryRunner.query(`
      ALTER TABLE "moderation_rules"
      ADD CONSTRAINT "CHK_moderation_rules_severity" 
      CHECK ("severity" IN ('low', 'medium', 'high', 'critical'))
    `);

    await queryRunner.query(`
      ALTER TABLE "moderated_content"
      ADD CONSTRAINT "CHK_moderated_content_status" 
      CHECK ("status" IN ('pending', 'approved', 'rejected', 'flagged'))
    `);

    await queryRunner.query(`
      ALTER TABLE "moderated_content"
      ADD CONSTRAINT "CHK_moderated_content_reason" 
      CHECK ("reason" IN ('spam', 'harassment', 'inappropriate_content', 'hate_speech', 'violence', 'privacy_violation', 'copyright', 'other'))
    `);

    await queryRunner.query(`
      ALTER TABLE "moderated_content"
      ADD CONSTRAINT "CHK_moderated_content_action" 
      CHECK ("action" IN ('none', 'warning', 'delete_message', 'mute_user', 'suspend_user', 'ban_user'))
    `);

    await queryRunner.query(`
      ALTER TABLE "user_moderation"
      ADD CONSTRAINT "CHK_user_moderation_status" 
      CHECK ("status" IN ('active', 'warning', 'muted', 'suspended', 'banned'))
    `);

    await queryRunner.query(`
      ALTER TABLE "user_moderation"
      ADD CONSTRAINT "CHK_user_moderation_reason" 
      CHECK ("reason" IN ('spam', 'harassment', 'inappropriate_behavior', 'repeated_violations', 'hate_speech', 'privacy_violation', 'other'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "moderated_content" 
      DROP CONSTRAINT "FK_moderated_content_message"
    `);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "user_moderation"`);
    await queryRunner.query(`DROP TABLE "moderated_content"`);
    await queryRunner.query(`DROP TABLE "moderation_rules"`);
  }
}