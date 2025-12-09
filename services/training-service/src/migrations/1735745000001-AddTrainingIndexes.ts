import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTrainingIndexes1735745000001 implements MigrationInterface {
    name = 'AddTrainingIndexes1735745000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add index on workout_sessions.created_by for faster trainer session lookups
        await queryRunner.query(`
            CREATE INDEX "idx_workout_sessions_created_by" 
            ON "workout_sessions" ("created_by")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the index
        await queryRunner.query(`
            DROP INDEX "idx_workout_sessions_created_by"
        `);
    }
}