import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIntervalProgramToWorkoutSession1736400000000 implements MigrationInterface {
  name = 'AddIntervalProgramToWorkoutSession1736400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workout_sessions" 
      ADD COLUMN "intervalProgram" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workout_sessions" 
      DROP COLUMN "intervalProgram"
    `);
  }
}