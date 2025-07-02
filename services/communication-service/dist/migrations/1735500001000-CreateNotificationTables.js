"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateNotificationTables1735500001000 = void 0;
class CreateNotificationTables1735500001000 {
    constructor() {
        this.name = 'CreateNotificationTables1735500001000';
    }
    async up(queryRunner) {
        // Create notification_templates table
        await queryRunner.query(`
      CREATE TABLE "notification_templates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(100) NOT NULL,
        "description" text,
        "type" character varying NOT NULL,
        "channel" character varying NOT NULL,
        "organization_id" uuid,
        "subject_template" character varying(255) NOT NULL,
        "body_template" text NOT NULL,
        "format" character varying NOT NULL DEFAULT 'text',
        "variables" jsonb,
        "default_values" jsonb,
        "language" character varying(10) NOT NULL DEFAULT 'en',
        "is_active" boolean NOT NULL DEFAULT true,
        "is_system_template" boolean NOT NULL DEFAULT false,
        "usage_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "PK_notification_templates" PRIMARY KEY ("id")
      )
    `);
        // Create notifications table
        await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "recipient_id" uuid NOT NULL,
        "organization_id" uuid,
        "team_id" uuid,
        "type" character varying NOT NULL,
        "priority" character varying NOT NULL DEFAULT 'normal',
        "status" character varying NOT NULL DEFAULT 'pending',
        "title" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "action_url" text,
        "action_text" character varying(100),
        "related_entity_id" uuid,
        "related_entity_type" character varying(100),
        "channels" jsonb,
        "channel_data" jsonb,
        "scheduled_for" TIMESTAMP,
        "sent_at" TIMESTAMP,
        "delivered_at" TIMESTAMP,
        "read_at" TIMESTAMP,
        "expires_at" TIMESTAMP,
        "retry_count" integer NOT NULL DEFAULT 0,
        "max_retries" integer NOT NULL DEFAULT 3,
        "error_message" text,
        "next_retry_at" TIMESTAMP,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);
        // Create notification_preferences table
        await queryRunner.query(`
      CREATE TABLE "notification_preferences" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "organization_id" uuid,
        "type" character varying NOT NULL,
        "channel" character varying NOT NULL,
        "is_enabled" boolean NOT NULL DEFAULT true,
        "reminder_minutes_before" integer,
        "send_immediately" boolean NOT NULL DEFAULT false,
        "send_daily_digest" boolean NOT NULL DEFAULT false,
        "send_weekly_digest" boolean NOT NULL DEFAULT false,
        "quiet_hours_start" time,
        "quiet_hours_end" time,
        "timezone" character varying(50),
        "channel_settings" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_preferences" PRIMARY KEY ("id")
      )
    `);
        // Create notification_queue table
        await queryRunner.query(`
      CREATE TABLE "notification_queue" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "notification_id" uuid NOT NULL,
        "channel" character varying NOT NULL,
        "priority" character varying NOT NULL DEFAULT 'normal',
        "status" character varying NOT NULL DEFAULT 'pending',
        "scheduled_for" TIMESTAMP NOT NULL,
        "started_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "attempt_count" integer NOT NULL DEFAULT 0,
        "max_attempts" integer NOT NULL DEFAULT 3,
        "error_message" text,
        "next_attempt_at" TIMESTAMP,
        "processing_data" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_queue" PRIMARY KEY ("id")
      )
    `);
        // Create indexes for notification_templates
        await queryRunner.query(`CREATE INDEX "IDX_notification_templates_type_channel" ON "notification_templates" ("type", "channel")`);
        await queryRunner.query(`CREATE INDEX "IDX_notification_templates_organization_id" ON "notification_templates" ("organization_id")`);
        // Create indexes for notifications
        await queryRunner.query(`CREATE INDEX "IDX_notifications_recipient_id_created_at" ON "notifications" ("recipient_id", "created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_type_status" ON "notifications" ("type", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_scheduled_for" ON "notifications" ("scheduled_for")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_organization_id" ON "notifications" ("organization_id")`);
        // Create indexes for notification_preferences
        await queryRunner.query(`CREATE INDEX "IDX_notification_preferences_user_id" ON "notification_preferences" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_notification_preferences_organization_id" ON "notification_preferences" ("organization_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_notification_preferences_unique" ON "notification_preferences" ("user_id", "type", "channel")`);
        // Create indexes for notification_queue
        await queryRunner.query(`CREATE INDEX "IDX_notification_queue_status_scheduled_for" ON "notification_queue" ("status", "scheduled_for")`);
        await queryRunner.query(`CREATE INDEX "IDX_notification_queue_channel_priority" ON "notification_queue" ("channel", "priority")`);
        await queryRunner.query(`CREATE INDEX "IDX_notification_queue_notification_id" ON "notification_queue" ("notification_id")`);
        // Add foreign key constraint for notification_queue -> notifications
        await queryRunner.query(`
      ALTER TABLE "notification_queue" 
      ADD CONSTRAINT "FK_notification_queue_notification_id" 
      FOREIGN KEY ("notification_id") 
      REFERENCES "notifications"("id") 
      ON DELETE CASCADE
    `);
    }
    async down(queryRunner) {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "notification_queue" DROP CONSTRAINT "FK_notification_queue_notification_id"`);
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_notification_queue_notification_id"`);
        await queryRunner.query(`DROP INDEX "IDX_notification_queue_channel_priority"`);
        await queryRunner.query(`DROP INDEX "IDX_notification_queue_status_scheduled_for"`);
        await queryRunner.query(`DROP INDEX "IDX_notification_preferences_unique"`);
        await queryRunner.query(`DROP INDEX "IDX_notification_preferences_organization_id"`);
        await queryRunner.query(`DROP INDEX "IDX_notification_preferences_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_notifications_organization_id"`);
        await queryRunner.query(`DROP INDEX "IDX_notifications_scheduled_for"`);
        await queryRunner.query(`DROP INDEX "IDX_notifications_type_status"`);
        await queryRunner.query(`DROP INDEX "IDX_notifications_recipient_id_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_notification_templates_organization_id"`);
        await queryRunner.query(`DROP INDEX "IDX_notification_templates_type_channel"`);
        // Drop tables
        await queryRunner.query(`DROP TABLE "notification_queue"`);
        await queryRunner.query(`DROP TABLE "notification_preferences"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "notification_templates"`);
    }
}
exports.CreateNotificationTables1735500001000 = CreateNotificationTables1735500001000;
//# sourceMappingURL=1735500001000-CreateNotificationTables.js.map