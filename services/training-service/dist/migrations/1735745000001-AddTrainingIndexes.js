"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTrainingIndexes1735745000001 = void 0;
class AddTrainingIndexes1735745000001 {
    constructor() {
        this.name = 'AddTrainingIndexes1735745000001';
    }
    async up(queryRunner) {
        // Add index on workout_sessions.created_by for faster trainer session lookups
        await queryRunner.query(`
            CREATE INDEX "idx_workout_sessions_created_by" 
            ON "workout_sessions" ("created_by")
        `);
    }
    async down(queryRunner) {
        // Drop the index
        await queryRunner.query(`
            DROP INDEX "idx_workout_sessions_created_by"
        `);
    }
}
exports.AddTrainingIndexes1735745000001 = AddTrainingIndexes1735745000001;
//# sourceMappingURL=1735745000001-AddTrainingIndexes.js.map