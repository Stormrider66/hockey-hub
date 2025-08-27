import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServiceApiKeysTable1735413000000 implements MigrationInterface {
  name = 'CreateServiceApiKeysTable1735413000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create service_api_keys table
    await queryRunner.query(`
      CREATE TABLE "service_api_keys" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "serviceName" character varying NOT NULL,
        "apiKey" character varying NOT NULL,
        "description" text,
        "permissions" text NOT NULL,
        "allowedIps" text NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "lastUsedAt" TIMESTAMP WITH TIME ZONE,
        "usageCount" integer NOT NULL DEFAULT 0,
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying,
        "revokedBy" character varying,
        "revokedAt" TIMESTAMP WITH TIME ZONE,
        "revocationReason" character varying,
        CONSTRAINT "UQ_service_name" UNIQUE ("serviceName"),
        CONSTRAINT "UQ_api_key" UNIQUE ("apiKey"),
        CONSTRAINT "PK_service_api_keys" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_service_api_keys_serviceName" ON "service_api_keys" ("serviceName")`);
    await queryRunner.query(`CREATE INDEX "IDX_service_api_keys_apiKey" ON "service_api_keys" ("apiKey")`);
    await queryRunner.query(`CREATE INDEX "IDX_service_api_keys_apiKey_isActive" ON "service_api_keys" ("apiKey", "isActive")`);

    // Create function to clean up inactive keys older than 90 days
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION cleanup_old_service_keys() RETURNS void AS $$
      BEGIN
        DELETE FROM service_api_keys 
        WHERE "isActive" = false 
        AND "revokedAt" < NOW() - INTERVAL '90 days';
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop function
    await queryRunner.query(`DROP FUNCTION IF EXISTS cleanup_old_service_keys()`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_service_api_keys_apiKey_isActive"`);
    await queryRunner.query(`DROP INDEX "IDX_service_api_keys_apiKey"`);
    await queryRunner.query(`DROP INDEX "IDX_service_api_keys_serviceName"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "service_api_keys"`);
  }
}