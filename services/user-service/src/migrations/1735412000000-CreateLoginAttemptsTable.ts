import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLoginAttemptsTable1735412000000 implements MigrationInterface {
  name = 'CreateLoginAttemptsTable1735412000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create login_attempts table
    await queryRunner.query(`
      CREATE TABLE "login_attempts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "ipAddress" character varying NOT NULL,
        "userAgent" character varying,
        "success" boolean NOT NULL,
        "failureReason" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_login_attempts" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_login_attempts_email" ON "login_attempts" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_login_attempts_email_createdAt" ON "login_attempts" ("email", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_login_attempts_ipAddress_createdAt" ON "login_attempts" ("ipAddress", "createdAt")`);

    // Add account lockout fields to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "loginAttempts" integer NOT NULL DEFAULT 0,
      ADD COLUMN "lastFailedLoginAt" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "lockedUntil" TIMESTAMP WITH TIME ZONE
    `);

    // Create function to automatically cleanup old login attempts
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION cleanup_old_login_attempts() RETURNS void AS $$
      BEGIN
        DELETE FROM login_attempts 
        WHERE "createdAt" < NOW() - INTERVAL '30 days';
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop function
    await queryRunner.query(`DROP FUNCTION IF EXISTS cleanup_old_login_attempts()`);

    // Remove columns from users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "loginAttempts",
      DROP COLUMN "lastFailedLoginAt",
      DROP COLUMN "lockedUntil"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_login_attempts_ipAddress_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_login_attempts_email_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_login_attempts_email"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "login_attempts"`);
  }
}