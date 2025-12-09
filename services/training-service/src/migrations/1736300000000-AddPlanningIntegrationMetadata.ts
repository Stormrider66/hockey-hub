import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlanningIntegrationMetadata1736300000000 implements MigrationInterface {
  name = 'AddPlanningIntegrationMetadata1736300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add indexes to improve query performance for planning-related queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_workout_assignment_planning_phase" 
      ON "workout_assignments" 
      USING GIN ((metadata->'planningPhaseId'));
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_workout_assignment_season_plan" 
      ON "workout_assignments" 
      USING GIN ((metadata->'seasonPlanId'));
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_workout_assignment_last_phase_adjustment" 
      ON "workout_assignments" 
      USING BTREE ((metadata->>'lastPhaseAdjustment'));
    `);

    // Add partial index for assignments with planning metadata
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_workout_assignment_with_planning_data"
      ON "workout_assignments" (team_id, status, effective_date)
      WHERE metadata->>'planningPhaseId' IS NOT NULL;
    `);

    // Add index for efficient phase-based queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_workout_assignment_team_phase_status"
      ON "workout_assignments" (team_id, status) 
      INCLUDE (effective_date, scheduled_date)
      WHERE metadata->>'planningPhaseId' IS NOT NULL;
    `);

    // Add comments to document the planning integration metadata structure
    await queryRunner.query(`
      COMMENT ON COLUMN "workout_assignments"."metadata" IS 
      'Assignment metadata including planning integration data:
      - planningPhaseId: ID of the current training phase
      - seasonPlanId: ID of the season plan
      - lastPhaseAdjustment: Date of last automatic phase adjustment
      - phaseAdjustments: Array of phase-based adjustments applied
      - originalPlanningData: Original values before phase adjustments';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the planning-related indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_workout_assignment_planning_phase"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_workout_assignment_season_plan"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_workout_assignment_last_phase_adjustment"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_workout_assignment_with_planning_data"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_workout_assignment_team_phase_status"`);

    // Remove the comment
    await queryRunner.query(`COMMENT ON COLUMN "workout_assignments"."metadata" IS NULL`);
  }
}