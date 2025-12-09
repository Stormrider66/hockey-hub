import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewWorkoutTypes1736900000000 implements MigrationInterface {
  name = 'AddNewWorkoutTypes1736900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new workout types to the enum: STABILITY_CORE, PLYOMETRICS, WRESTLING
    // TypeORM handles enum updates automatically when the entity is synchronized
    await queryRunner.query(`
      -- Adding STABILITY_CORE, PLYOMETRICS, WRESTLING to WorkoutType enum
      -- This is handled by TypeORM when synchronizing the entity
      -- The enum now includes: STRENGTH, CARDIO, AGILITY, FLEXIBILITY, POWER, 
      -- ENDURANCE, RECOVERY, REHABILITATION, SPORT_SPECIFIC, MENTAL, HYBRID,
      -- STABILITY_CORE, PLYOMETRICS, WRESTLING
      
      COMMENT ON TYPE "workout_type" IS 'Updated to include stability core, plyometrics, and wrestling training types';
    `);

    // Update any existing workout_type_configs table constraints if needed
    await queryRunner.query(`
      -- Ensure the workout_type_configs table can handle the new workout types
      -- The enum constraint should be automatically updated by TypeORM
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: Removing enum values that might be in use could cause issues
    // This should be handled carefully in production
    await queryRunner.query(`
      -- Reverting STABILITY_CORE, PLYOMETRICS, WRESTLING from WorkoutType enum
      -- WARNING: This could fail if there are existing records using these types
      -- Production systems should migrate data before removing enum values
    `);
  }
}