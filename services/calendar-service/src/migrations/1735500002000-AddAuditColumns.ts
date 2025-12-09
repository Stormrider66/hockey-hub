import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddAuditColumns1735500002000 implements MigrationInterface {
    name = 'AddAuditColumns1735500002000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Define audit columns
        const auditColumns = [
            new TableColumn({
                name: "createdBy",
                type: "varchar",
                length: "255",
                isNullable: true
            }),
            new TableColumn({
                name: "updatedBy",
                type: "varchar",
                length: "255",
                isNullable: true
            }),
            new TableColumn({
                name: "deletedAt",
                type: "timestamp",
                isNullable: true
            }),
            new TableColumn({
                name: "deletedBy",
                type: "varchar",
                length: "255",
                isNullable: true
            }),
            new TableColumn({
                name: "lastRequestId",
                type: "varchar",
                length: "255",
                isNullable: true
            }),
            new TableColumn({
                name: "lastIpAddress",
                type: "varchar",
                length: "50",
                isNullable: true
            })
        ];

        // Tables that need audit columns (excluding those that already have them)
        const tablesToUpdate = [
            "resources",
            "recurrence_rules",
            "event_participants",
            "resource_bookings"
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

        // Update existing createdBy column in events table to match audit pattern
        await queryRunner.changeColumn("events", "createdBy", new TableColumn({
            name: "createdBy",
            type: "varchar",
            length: "255",
            isNullable: true
        }));

        // Add missing audit columns to events table
        const eventsTable = await queryRunner.getTable("events");
        const eventsAuditColumns = auditColumns.filter(col => 
            !eventsTable?.columns.some(c => c.name === col.name)
        );

        for (const column of eventsAuditColumns) {
            if (column.name !== "createdBy") { // Skip createdBy as it already exists
                await queryRunner.addColumn("events", column);
            }
        }

        // Create indexes for soft delete queries
        await queryRunner.query(`
            CREATE INDEX "IDX_events_deletedAt" ON "events" ("deletedAt") WHERE "deletedAt" IS NULL;
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_resources_deletedAt" ON "resources" ("deletedAt") WHERE "deletedAt" IS NULL;
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_event_participants_deletedAt" ON "event_participants" ("deletedAt") WHERE "deletedAt" IS NULL;
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_resource_bookings_deletedAt" ON "resource_bookings" ("deletedAt") WHERE "deletedAt" IS NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_events_deletedAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_resources_deletedAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_event_participants_deletedAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_resource_bookings_deletedAt"`);

        // Define audit columns to remove
        const auditColumnNames = [
            "updatedBy",
            "deletedAt",
            "deletedBy",
            "lastRequestId",
            "lastIpAddress"
        ];

        // Tables to update
        const tablesToUpdate = [
            "events",
            "resources",
            "recurrence_rules",
            "event_participants",
            "resource_bookings"
        ];

        // Remove audit columns from each table
        for (const tableName of tablesToUpdate) {
            const table = await queryRunner.getTable(tableName);
            if (!table) continue;

            for (const columnName of auditColumnNames) {
                if (table.columns.some(c => c.name === columnName)) {
                    await queryRunner.dropColumn(tableName, columnName);
                }
            }
        }

        // Restore original createdBy column in events table (non-nullable)
        await queryRunner.changeColumn("events", "createdBy", new TableColumn({
            name: "createdBy",
            type: "varchar",
            length: "255",
            isNullable: false
        }));
    }
}