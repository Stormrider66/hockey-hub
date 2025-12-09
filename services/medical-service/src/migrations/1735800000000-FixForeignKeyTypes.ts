import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixForeignKeyTypes1735800000000 implements MigrationInterface {
  name = 'FixForeignKeyTypes1735800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, we need to drop existing foreign key constraints and indexes
    
    // Drop foreign keys for injuries table
    await queryRunner.query(`
      ALTER TABLE "injuries" 
      DROP CONSTRAINT IF EXISTS "FK_injuries_player_id"
    `);
    
    // Drop foreign keys for wellness_entries table
    await queryRunner.query(`
      ALTER TABLE "wellness_entries" 
      DROP CONSTRAINT IF EXISTS "FK_wellness_entries_player_id"
    `);
    
    // Drop foreign keys for player_availability table
    await queryRunner.query(`
      ALTER TABLE "player_availability" 
      DROP CONSTRAINT IF EXISTS "FK_player_availability_player_id",
      DROP CONSTRAINT IF EXISTS "FK_player_availability_injury_id"
    `);
    
    // Drop foreign keys for treatments table
    await queryRunner.query(`
      ALTER TABLE "treatments" 
      DROP CONSTRAINT IF EXISTS "FK_treatments_injury_id"
    `);
    
    // Drop indexes on the old columns
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_injuries_player_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wellness_entries_player_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_player_availability_player_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_player_availability_injury_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_treatments_injury_id"`);
    
    // Now alter the column types
    
    // Change injuries table primary key and foreign keys to UUID
    await queryRunner.query(`
      ALTER TABLE "injuries" 
      ALTER COLUMN "id" TYPE uuid USING (uuid_generate_v4()),
      ALTER COLUMN "id" SET DEFAULT uuid_generate_v4(),
      ALTER COLUMN "player_id" TYPE uuid USING (uuid_generate_v4())
    `);
    
    // Change wellness_entries table primary key and foreign keys to UUID
    await queryRunner.query(`
      ALTER TABLE "wellness_entries" 
      ALTER COLUMN "id" TYPE uuid USING (uuid_generate_v4()),
      ALTER COLUMN "id" SET DEFAULT uuid_generate_v4(),
      ALTER COLUMN "player_id" TYPE uuid USING (uuid_generate_v4())
    `);
    
    // Change player_availability table primary key and foreign keys to UUID
    await queryRunner.query(`
      ALTER TABLE "player_availability" 
      ALTER COLUMN "id" TYPE uuid USING (uuid_generate_v4()),
      ALTER COLUMN "id" SET DEFAULT uuid_generate_v4(),
      ALTER COLUMN "player_id" TYPE uuid USING (uuid_generate_v4()),
      ALTER COLUMN "injury_id" TYPE uuid USING (CASE WHEN injury_id IS NULL THEN NULL ELSE uuid_generate_v4() END)
    `);
    
    // Change treatments table primary key and foreign keys to UUID
    await queryRunner.query(`
      ALTER TABLE "treatments" 
      ALTER COLUMN "id" TYPE uuid USING (uuid_generate_v4()),
      ALTER COLUMN "id" SET DEFAULT uuid_generate_v4(),
      ALTER COLUMN "injury_id" TYPE uuid USING (uuid_generate_v4())
    `);
    
    // Change medical_reports table primary key and foreign keys to UUID (if exists)
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_reports') THEN
          ALTER TABLE "medical_reports" 
          ALTER COLUMN "id" TYPE uuid USING (uuid_generate_v4()),
          ALTER COLUMN "id" SET DEFAULT uuid_generate_v4(),
          ALTER COLUMN "injury_id" TYPE uuid USING (uuid_generate_v4());
        END IF;
      END $$;
    `);
    
    // Re-create indexes
    await queryRunner.query(`CREATE INDEX "IDX_injuries_player_id" ON "injuries" ("player_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_wellness_entries_player_id" ON "wellness_entries" ("player_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_player_availability_player_id" ON "player_availability" ("player_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_player_availability_injury_id" ON "player_availability" ("injury_id") WHERE injury_id IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_treatments_injury_id" ON "treatments" ("injury_id")`);
    
    // Re-create foreign key constraints
    // Note: Cross-service foreign keys are generally not recommended in microservices architecture
    // We'll only create constraints for relationships within the medical service
    
    // For treatments table - references injuries table
    await queryRunner.query(`
      ALTER TABLE "treatments" 
      ADD CONSTRAINT "FK_treatments_injury_id" 
      FOREIGN KEY ("injury_id") REFERENCES "injuries"("id") ON DELETE CASCADE
    `);
    
    // For player_availability table - references injuries table
    await queryRunner.query(`
      ALTER TABLE "player_availability" 
      ADD CONSTRAINT "FK_player_availability_injury_id" 
      FOREIGN KEY ("injury_id") REFERENCES "injuries"("id") ON DELETE SET NULL
    `);
    
    // For medical_reports table - references injuries table (if exists)
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_reports') THEN
          ALTER TABLE "medical_reports" 
          ADD CONSTRAINT "FK_medical_reports_injury_id" 
          FOREIGN KEY ("injury_id") REFERENCES "injuries"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "treatments" DROP CONSTRAINT IF EXISTS "FK_treatments_injury_id"`);
    await queryRunner.query(`ALTER TABLE "player_availability" DROP CONSTRAINT IF EXISTS "FK_player_availability_injury_id"`);
    await queryRunner.query(`ALTER TABLE "medical_reports" DROP CONSTRAINT IF EXISTS "FK_medical_reports_injury_id"`);
    
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_injuries_player_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_wellness_entries_player_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_player_availability_player_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_player_availability_injury_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_treatments_injury_id"`);
    
    // Revert column types back to integer
    // Note: This will lose data as we can't convert UUIDs back to integers
    await queryRunner.query(`
      ALTER TABLE "injuries" 
      ALTER COLUMN "id" TYPE integer USING 1,
      ALTER COLUMN "id" DROP DEFAULT,
      ALTER COLUMN "player_id" TYPE integer USING 1
    `);
    
    await queryRunner.query(`
      ALTER TABLE "wellness_entries" 
      ALTER COLUMN "id" TYPE integer USING 1,
      ALTER COLUMN "id" DROP DEFAULT,
      ALTER COLUMN "player_id" TYPE integer USING 1
    `);
    
    await queryRunner.query(`
      ALTER TABLE "player_availability" 
      ALTER COLUMN "id" TYPE integer USING 1,
      ALTER COLUMN "id" DROP DEFAULT,
      ALTER COLUMN "player_id" TYPE integer USING 1,
      ALTER COLUMN "injury_id" TYPE integer USING NULL
    `);
    
    await queryRunner.query(`
      ALTER TABLE "treatments" 
      ALTER COLUMN "id" TYPE integer USING 1,
      ALTER COLUMN "id" DROP DEFAULT,
      ALTER COLUMN "injury_id" TYPE integer USING 1
    `);
    
    // Re-add auto-increment sequences
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS injuries_id_seq`);
    await queryRunner.query(`ALTER TABLE "injuries" ALTER COLUMN "id" SET DEFAULT nextval('injuries_id_seq')`);
    await queryRunner.query(`SELECT setval('injuries_id_seq', (SELECT COALESCE(MAX(id), 1) FROM injuries))`);
    
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS wellness_entries_id_seq`);
    await queryRunner.query(`ALTER TABLE "wellness_entries" ALTER COLUMN "id" SET DEFAULT nextval('wellness_entries_id_seq')`);
    await queryRunner.query(`SELECT setval('wellness_entries_id_seq', (SELECT COALESCE(MAX(id), 1) FROM wellness_entries))`);
    
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS player_availability_id_seq`);
    await queryRunner.query(`ALTER TABLE "player_availability" ALTER COLUMN "id" SET DEFAULT nextval('player_availability_id_seq')`);
    await queryRunner.query(`SELECT setval('player_availability_id_seq', (SELECT COALESCE(MAX(id), 1) FROM player_availability))`);
    
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS treatments_id_seq`);
    await queryRunner.query(`ALTER TABLE "treatments" ALTER COLUMN "id" SET DEFAULT nextval('treatments_id_seq')`);
    await queryRunner.query(`SELECT setval('treatments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM treatments))`);
  }
}