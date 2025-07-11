"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAuditColumns1735500002000 = void 0;
const typeorm_1 = require("typeorm");
class AddAuditColumns1735500002000 {
    constructor() {
        this.name = 'AddAuditColumns1735500002000';
    }
    async up(queryRunner) {
        // Define audit columns
        const auditColumns = [
            new typeorm_1.TableColumn({
                name: "createdBy",
                type: "varchar",
                length: "255",
                isNullable: true
            }),
            new typeorm_1.TableColumn({
                name: "updatedBy",
                type: "varchar",
                length: "255",
                isNullable: true
            }),
            new typeorm_1.TableColumn({
                name: "deletedAt",
                type: "timestamp",
                isNullable: true
            }),
            new typeorm_1.TableColumn({
                name: "deletedBy",
                type: "varchar",
                length: "255",
                isNullable: true
            }),
            new typeorm_1.TableColumn({
                name: "lastRequestId",
                type: "varchar",
                length: "255",
                isNullable: true
            }),
            new typeorm_1.TableColumn({
                name: "lastIpAddress",
                type: "varchar",
                length: "50",
                isNullable: true
            })
        ];
        // Tables that need audit columns
        const tablesToUpdate = [
            "exercises",
            "player_workout_loads",
            "workout_executions",
            "exercise_executions"
        ];
        // Add audit columns to each table
        for (const tableName of tablesToUpdate) {
            // Check if table exists
            const table = await queryRunner.getTable(tableName);
            if (!table) {
                console.warn(`Table ${tableName} not found, skipping...`);
                continue;
            }
            // Add each audit column if it doesn't exist
            for (const column of auditColumns) {
                const columnExists = table.columns.some(c => c.name === column.name);
                if (!columnExists) {
                    await queryRunner.addColumn(tableName, column);
                }
            }
        }
        // Update existing createdBy columns to be nullable
        const tablesWithCreatedBy = ["workout_sessions", "exercise_templates"];
        for (const tableName of tablesWithCreatedBy) {
            const table = await queryRunner.getTable(tableName);
            if (table && table.columns.some(c => c.name === "createdBy")) {
                await queryRunner.changeColumn(tableName, "createdBy", new typeorm_1.TableColumn({
                    name: "createdBy",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                }));
            }
            // Add other audit columns
            const otherAuditColumns = auditColumns.filter(col => col.name !== "createdBy");
            for (const column of otherAuditColumns) {
                if (!table?.columns.some(c => c.name === column.name)) {
                    await queryRunner.addColumn(tableName, column);
                }
            }
        }
        // Create indexes for soft delete queries
        await queryRunner.query(`
            CREATE INDEX "IDX_workout_sessions_deletedAt" ON "workout_sessions" ("deletedAt") WHERE "deletedAt" IS NULL;
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_exercises_deletedAt" ON "exercises" ("deletedAt") WHERE "deletedAt" IS NULL;
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_exercise_templates_deletedAt" ON "exercise_templates" ("deletedAt") WHERE "deletedAt" IS NULL;
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_player_workout_loads_deletedAt" ON "player_workout_loads" ("deletedAt") WHERE "deletedAt" IS NULL;
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_workout_executions_deletedAt" ON "workout_executions" ("deletedAt") WHERE "deletedAt" IS NULL;
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_exercise_executions_deletedAt" ON "exercise_executions" ("deletedAt") WHERE "deletedAt" IS NULL;
        `);
        // Add composite indexes for audit queries
        await queryRunner.query(`
            CREATE INDEX "IDX_workout_sessions_createdBy" ON "workout_sessions" ("createdBy");
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_workout_executions_playerId_createdAt" ON "workout_executions" ("playerId", "createdAt");
        `);
    }
    async down(queryRunner) {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workout_sessions_deletedAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exercises_deletedAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exercise_templates_deletedAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_player_workout_loads_deletedAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workout_executions_deletedAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exercise_executions_deletedAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workout_sessions_createdBy"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workout_executions_playerId_createdAt"`);
        // Define audit columns to remove
        const auditColumnNames = [
            "updatedBy",
            "deletedAt",
            "deletedBy",
            "lastRequestId",
            "lastIpAddress"
        ];
        // Tables to update
        const allTables = [
            "workout_sessions",
            "exercise_templates",
            "exercises",
            "player_workout_loads",
            "workout_executions",
            "exercise_executions"
        ];
        // Remove audit columns from each table
        for (const tableName of allTables) {
            const table = await queryRunner.getTable(tableName);
            if (!table)
                continue;
            for (const columnName of auditColumnNames) {
                if (table.columns.some(c => c.name === columnName)) {
                    await queryRunner.dropColumn(tableName, columnName);
                }
            }
        }
        // Restore original createdBy columns (non-nullable) for specific tables
        const tablesWithRequiredCreatedBy = ["workout_sessions"];
        for (const tableName of tablesWithRequiredCreatedBy) {
            const table = await queryRunner.getTable(tableName);
            if (table && table.columns.some(c => c.name === "createdBy")) {
                await queryRunner.changeColumn(tableName, "createdBy", new typeorm_1.TableColumn({
                    name: "createdBy",
                    type: "varchar",
                    length: "255",
                    isNullable: false
                }));
            }
        }
    }
}
exports.AddAuditColumns1735500002000 = AddAuditColumns1735500002000;
//# sourceMappingURL=1735500002000-AddAuditColumns.js.map