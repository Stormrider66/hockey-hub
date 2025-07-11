"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixUuidForeignKeys1735745000002 = void 0;
class FixUuidForeignKeys1735745000002 {
    constructor() {
        this.name = 'FixUuidForeignKeys1735745000002';
    }
    async up(queryRunner) {
        // Fix workout_sessions table foreign key types
        await queryRunner.query(`
            ALTER TABLE "workout_sessions" 
            ALTER COLUMN "created_by" TYPE uuid USING "created_by"::uuid,
            ALTER COLUMN "team_id" TYPE uuid USING "team_id"::uuid
        `);
        // Fix exercises table foreign key types
        await queryRunner.query(`
            ALTER TABLE "exercises" 
            ALTER COLUMN "workout_session_id" TYPE uuid USING "workout_session_id"::uuid
        `);
        // Fix player_workout_loads table foreign key types
        await queryRunner.query(`
            ALTER TABLE "player_workout_loads" 
            ALTER COLUMN "player_id" TYPE uuid USING "player_id"::uuid,
            ALTER COLUMN "workout_session_id" TYPE uuid USING "workout_session_id"::uuid
        `);
        // Fix workout_executions table foreign key types
        await queryRunner.query(`
            ALTER TABLE "workout_executions" 
            ALTER COLUMN "player_id" TYPE uuid USING "player_id"::uuid,
            ALTER COLUMN "workout_session_id" TYPE uuid USING "workout_session_id"::uuid
        `);
        // Fix exercise_executions table foreign key types
        await queryRunner.query(`
            ALTER TABLE "exercise_executions" 
            ALTER COLUMN "exercise_id" TYPE uuid USING "exercise_id"::uuid,
            ALTER COLUMN "workout_execution_id" TYPE uuid USING "workout_execution_id"::uuid
        `);
        // Fix exercise_templates table foreign key types
        await queryRunner.query(`
            ALTER TABLE "exercise_templates" 
            ALTER COLUMN "created_by" TYPE uuid USING "created_by"::uuid
        `);
    }
    async down(queryRunner) {
        // Revert workout_sessions table foreign key types
        await queryRunner.query(`
            ALTER TABLE "workout_sessions" 
            ALTER COLUMN "created_by" TYPE varchar,
            ALTER COLUMN "team_id" TYPE varchar
        `);
        // Revert exercises table foreign key types
        await queryRunner.query(`
            ALTER TABLE "exercises" 
            ALTER COLUMN "workout_session_id" TYPE varchar
        `);
        // Revert player_workout_loads table foreign key types
        await queryRunner.query(`
            ALTER TABLE "player_workout_loads" 
            ALTER COLUMN "player_id" TYPE varchar,
            ALTER COLUMN "workout_session_id" TYPE varchar
        `);
        // Revert workout_executions table foreign key types
        await queryRunner.query(`
            ALTER TABLE "workout_executions" 
            ALTER COLUMN "player_id" TYPE varchar,
            ALTER COLUMN "workout_session_id" TYPE varchar
        `);
        // Revert exercise_executions table foreign key types
        await queryRunner.query(`
            ALTER TABLE "exercise_executions" 
            ALTER COLUMN "exercise_id" TYPE varchar,
            ALTER COLUMN "workout_execution_id" TYPE varchar
        `);
        // Revert exercise_templates table foreign key types
        await queryRunner.query(`
            ALTER TABLE "exercise_templates" 
            ALTER COLUMN "created_by" TYPE varchar
        `);
    }
}
exports.FixUuidForeignKeys1735745000002 = FixUuidForeignKeys1735745000002;
//# sourceMappingURL=1735745000002-FixUuidForeignKeys.js.map