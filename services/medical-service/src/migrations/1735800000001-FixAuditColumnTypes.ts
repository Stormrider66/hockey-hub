import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAuditColumnTypes1735800000001 implements MigrationInterface {
  name = 'FixAuditColumnTypes1735800000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fix audit column types in all tables that use AuditableEntity
    
    // Fix injuries table audit columns
    await queryRunner.query(`
      ALTER TABLE "injuries" 
      ALTER COLUMN "created_by" TYPE uuid USING (
        CASE 
          WHEN "created_by" IS NULL THEN NULL
          WHEN "created_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "created_by"::uuid
          ELSE NULL
        END
      ),
      ALTER COLUMN "updated_by" TYPE uuid USING (
        CASE 
          WHEN "updated_by" IS NULL THEN NULL
          WHEN "updated_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "updated_by"::uuid
          ELSE NULL
        END
      ),
      ALTER COLUMN "deleted_by" TYPE uuid USING (
        CASE 
          WHEN "deleted_by" IS NULL THEN NULL
          WHEN "deleted_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "deleted_by"::uuid
          ELSE NULL
        END
      )
    `);

    // Fix wellness_entries table audit columns
    await queryRunner.query(`
      ALTER TABLE "wellness_entries" 
      ALTER COLUMN "created_by" TYPE uuid USING (
        CASE 
          WHEN "created_by" IS NULL THEN NULL
          WHEN "created_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "created_by"::uuid
          ELSE NULL
        END
      ),
      ALTER COLUMN "updated_by" TYPE uuid USING (
        CASE 
          WHEN "updated_by" IS NULL THEN NULL
          WHEN "updated_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "updated_by"::uuid
          ELSE NULL
        END
      ),
      ALTER COLUMN "deleted_by" TYPE uuid USING (
        CASE 
          WHEN "deleted_by" IS NULL THEN NULL
          WHEN "deleted_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "deleted_by"::uuid
          ELSE NULL
        END
      )
    `);

    // Fix player_availability table audit columns
    await queryRunner.query(`
      ALTER TABLE "player_availability" 
      ALTER COLUMN "created_by" TYPE uuid USING (
        CASE 
          WHEN "created_by" IS NULL THEN NULL
          WHEN "created_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "created_by"::uuid
          ELSE NULL
        END
      ),
      ALTER COLUMN "updated_by" TYPE uuid USING (
        CASE 
          WHEN "updated_by" IS NULL THEN NULL
          WHEN "updated_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "updated_by"::uuid
          ELSE NULL
        END
      ),
      ALTER COLUMN "deleted_by" TYPE uuid USING (
        CASE 
          WHEN "deleted_by" IS NULL THEN NULL
          WHEN "deleted_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "deleted_by"::uuid
          ELSE NULL
        END
      )
    `);

    // Fix treatments table audit columns
    await queryRunner.query(`
      ALTER TABLE "treatments" 
      ALTER COLUMN "created_by" TYPE uuid USING (
        CASE 
          WHEN "created_by" IS NULL THEN NULL
          WHEN "created_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "created_by"::uuid
          ELSE NULL
        END
      ),
      ALTER COLUMN "updated_by" TYPE uuid USING (
        CASE 
          WHEN "updated_by" IS NULL THEN NULL
          WHEN "updated_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "updated_by"::uuid
          ELSE NULL
        END
      ),
      ALTER COLUMN "deleted_by" TYPE uuid USING (
        CASE 
          WHEN "deleted_by" IS NULL THEN NULL
          WHEN "deleted_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "deleted_by"::uuid
          ELSE NULL
        END
      )
    `);

    // Fix medical_reports table audit columns (if exists)
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_reports') THEN
          ALTER TABLE "medical_reports" 
          ALTER COLUMN "created_by" TYPE uuid USING (
            CASE 
              WHEN "created_by" IS NULL THEN NULL
              WHEN "created_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "created_by"::uuid
              ELSE NULL
            END
          ),
          ALTER COLUMN "updated_by" TYPE uuid USING (
            CASE 
              WHEN "updated_by" IS NULL THEN NULL
              WHEN "updated_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "updated_by"::uuid
              ELSE NULL
            END
          ),
          ALTER COLUMN "deleted_by" TYPE uuid USING (
            CASE 
              WHEN "deleted_by" IS NULL THEN NULL
              WHEN "deleted_by"::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN "deleted_by"::uuid
              ELSE NULL
            END
          );
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert audit column types back to varchar
    
    // Revert injuries table audit columns
    await queryRunner.query(`
      ALTER TABLE "injuries" 
      ALTER COLUMN "created_by" TYPE varchar,
      ALTER COLUMN "updated_by" TYPE varchar,
      ALTER COLUMN "deleted_by" TYPE varchar
    `);

    // Revert wellness_entries table audit columns
    await queryRunner.query(`
      ALTER TABLE "wellness_entries" 
      ALTER COLUMN "created_by" TYPE varchar,
      ALTER COLUMN "updated_by" TYPE varchar,
      ALTER COLUMN "deleted_by" TYPE varchar
    `);

    // Revert player_availability table audit columns
    await queryRunner.query(`
      ALTER TABLE "player_availability" 
      ALTER COLUMN "created_by" TYPE varchar,
      ALTER COLUMN "updated_by" TYPE varchar,
      ALTER COLUMN "deleted_by" TYPE varchar
    `);

    // Revert treatments table audit columns
    await queryRunner.query(`
      ALTER TABLE "treatments" 
      ALTER COLUMN "created_by" TYPE varchar,
      ALTER COLUMN "updated_by" TYPE varchar,
      ALTER COLUMN "deleted_by" TYPE varchar
    `);

    // Revert medical_reports table audit columns (if exists)
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_reports') THEN
          ALTER TABLE "medical_reports" 
          ALTER COLUMN "created_by" TYPE varchar,
          ALTER COLUMN "updated_by" TYPE varchar,
          ALTER COLUMN "deleted_by" TYPE varchar;
        END IF;
      END $$;
    `);
  }
}