import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTokenTables1735411000000 implements MigrationInterface {
  name = 'CreateTokenTables1735411000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create refresh_tokens table
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "token" character varying NOT NULL,
        "userId" uuid NOT NULL,
        "organizationId" uuid,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "revokedAt" TIMESTAMP WITH TIME ZONE,
        "userAgent" character varying,
        "ipAddress" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_refresh_token" UNIQUE ("token"),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for refresh_tokens
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_token_isActive" ON "refresh_tokens" ("token", "isActive")`);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_userId_isActive" ON "refresh_tokens" ("userId", "isActive")`);

    // Add foreign key for user
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens" 
      ADD CONSTRAINT "FK_refresh_tokens_user" 
      FOREIGN KEY ("userId") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create blacklisted_tokens table
    await queryRunner.query(`
      CREATE TABLE "blacklisted_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "jti" character varying NOT NULL,
        "userId" uuid NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "reason" character varying,
        "blacklistedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_blacklisted_token_jti" UNIQUE ("jti"),
        CONSTRAINT "PK_blacklisted_tokens" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for blacklisted_tokens
    await queryRunner.query(`CREATE INDEX "IDX_blacklisted_tokens_jti" ON "blacklisted_tokens" ("jti")`);
    await queryRunner.query(`CREATE INDEX "IDX_blacklisted_tokens_jti_expiresAt" ON "blacklisted_tokens" ("jti", "expiresAt")`);

    // Add preferredLanguage column to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "preferredLanguage" character varying(5) NOT NULL DEFAULT 'en'
    `);

    // Create cleanup job for expired tokens (PostgreSQL specific)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION cleanup_expired_tokens() RETURNS void AS $$
      BEGIN
        -- Delete expired refresh tokens older than 30 days
        DELETE FROM refresh_tokens 
        WHERE "expiresAt" < NOW() - INTERVAL '30 days';
        
        -- Delete expired blacklisted tokens
        DELETE FROM blacklisted_tokens 
        WHERE "expiresAt" < NOW();
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop function
    await queryRunner.query(`DROP FUNCTION IF EXISTS cleanup_expired_tokens()`);

    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_user"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_blacklisted_tokens_jti_expiresAt"`);
    await queryRunner.query(`DROP INDEX "IDX_blacklisted_tokens_jti"`);
    await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_userId_isActive"`);
    await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_token_isActive"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "blacklisted_tokens"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);

    // Remove column from users
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "preferredLanguage"`);
  }
}