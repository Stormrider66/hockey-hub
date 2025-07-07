import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventMetadataToWorkoutAssignment1736200000000 implements MigrationInterface {
  name = 'AddEventMetadataToWorkoutAssignment1736200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new fields to workout_assignments table
    await queryRunner.query(`
      ALTER TABLE "workout_assignments" 
      ADD COLUMN IF NOT EXISTS "sessionTemplateId" uuid,
      ADD COLUMN IF NOT EXISTS "playerId" uuid NOT NULL DEFAULT gen_random_uuid(),
      ADD COLUMN IF NOT EXISTS "teamId" uuid NOT NULL DEFAULT gen_random_uuid(),
      ADD COLUMN IF NOT EXISTS "scheduledDate" TIMESTAMP NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "exercisesCompleted" integer,
      ADD COLUMN IF NOT EXISTS "exercisesTotal" integer,
      ADD COLUMN IF NOT EXISTS "eventMetadata" jsonb
    `);

    // Remove defaults after adding columns
    await queryRunner.query(`
      ALTER TABLE "workout_assignments" 
      ALTER COLUMN "playerId" DROP DEFAULT,
      ALTER COLUMN "teamId" DROP DEFAULT,
      ALTER COLUMN "scheduledDate" DROP DEFAULT
    `);

    // Add indexes for the new fields
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_assignment_player" ON "workout_assignments" ("playerId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_assignment_team" ON "workout_assignments" ("teamId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_assignment_scheduled" ON "workout_assignments" ("scheduledDate");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_assignment_template" ON "workout_assignments" ("sessionTemplateId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_assignment_player"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_assignment_team"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_assignment_scheduled"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_assignment_template"`);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "workout_assignments" 
      DROP COLUMN IF EXISTS "sessionTemplateId",
      DROP COLUMN IF EXISTS "playerId",
      DROP COLUMN IF EXISTS "teamId",
      DROP COLUMN IF EXISTS "scheduledDate",
      DROP COLUMN IF EXISTS "startedAt",
      DROP COLUMN IF EXISTS "completedAt",
      DROP COLUMN IF EXISTS "exercisesCompleted",
      DROP COLUMN IF EXISTS "exercisesTotal",
      DROP COLUMN IF EXISTS "eventMetadata"
    `);
  }
}