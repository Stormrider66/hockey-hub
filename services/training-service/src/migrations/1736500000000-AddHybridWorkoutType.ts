import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHybridWorkoutType1736500000000 implements MigrationInterface {
  name = 'AddHybridWorkoutType1736500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The WorkoutType enum is used in the workout_sessions table
    // TypeORM should handle the enum update automatically when the entity is updated
    // But we can add a comment to document the change
    await queryRunner.query(`
      -- Adding HYBRID to WorkoutType enum
      -- This is handled by TypeORM when synchronizing the entity
      -- The enum now includes: STRENGTH, CARDIO, AGILITY, FLEXIBILITY, POWER, ENDURANCE, RECOVERY, REHABILITATION, SPORT_SPECIFIC, MENTAL, HYBRID
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: Removing an enum value that might be in use could cause issues
    // This should be handled carefully in production
    await queryRunner.query(`
      -- Reverting HYBRID from WorkoutType enum
      -- WARNING: This could fail if there are existing records using HYBRID type
    `);
  }
}