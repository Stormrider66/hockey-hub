// @ts-nocheck - TypeORM migration types are complex
import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class InitialCalendarSchema1735500000000 implements MigrationInterface {
    name = 'InitialCalendarSchema1735500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create resources table
        await queryRunner.createTable(new Table({
            name: "resources",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "name",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "type",
                    type: "varchar",
                    length: "50"
                },
                {
                    name: "description",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "capacity",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "location",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "isActive",
                    type: "boolean",
                    default: true
                },
                {
                    name: "metadata",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "organizationId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);

        // Create recurrence_rules table
        await queryRunner.createTable(new Table({
            name: "recurrence_rules",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "frequency",
                    type: "varchar",
                    length: "20"
                },
                {
                    name: "interval",
                    type: "int",
                    default: 1
                },
                {
                    name: "byDay",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "byMonth",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "byMonthDay",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "count",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "until",
                    type: "timestamp",
                    isNullable: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);

        // Create events table
        await queryRunner.createTable(new Table({
            name: "events",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "title",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "description",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "type",
                    type: "varchar",
                    length: "50"
                },
                {
                    name: "startTime",
                    type: "timestamp"
                },
                {
                    name: "endTime",
                    type: "timestamp"
                },
                {
                    name: "isAllDay",
                    type: "boolean",
                    default: false
                },
                {
                    name: "location",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "status",
                    type: "varchar",
                    length: "50",
                    default: "'scheduled'"
                },
                {
                    name: "visibility",
                    type: "varchar",
                    length: "50",
                    default: "'public'"
                },
                {
                    name: "color",
                    type: "varchar",
                    length: "7",
                    isNullable: true
                },
                {
                    name: "metadata",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "createdBy",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "organizationId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "teamId",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "recurrenceRuleId",
                    type: "uuid",
                    isNullable: true
                },
                {
                    name: "parentEventId",
                    type: "uuid",
                    isNullable: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);

        // Create event_participants table
        await queryRunner.createTable(new Table({
            name: "event_participants",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "eventId",
                    type: "uuid"
                },
                {
                    name: "userId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "role",
                    type: "varchar",
                    length: "50",
                    default: "'participant'"
                },
                {
                    name: "status",
                    type: "varchar",
                    length: "50",
                    default: "'pending'"
                },
                {
                    name: "responseTime",
                    type: "timestamp",
                    isNullable: true
                },
                {
                    name: "notes",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);

        // Create resource_bookings table
        await queryRunner.createTable(new Table({
            name: "resource_bookings",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "resourceId",
                    type: "uuid"
                },
                {
                    name: "eventId",
                    type: "uuid"
                },
                {
                    name: "startTime",
                    type: "timestamp"
                },
                {
                    name: "endTime",
                    type: "timestamp"
                },
                {
                    name: "status",
                    type: "varchar",
                    length: "50",
                    default: "'confirmed'"
                },
                {
                    name: "notes",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "bookedBy",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);

        // Add foreign keys
        await queryRunner.createForeignKey("events", new TableForeignKey({
            columnNames: ["recurrenceRuleId"],
            referencedColumnNames: ["id"],
            referencedTableName: "recurrence_rules",
            onDelete: "SET NULL"
        }));

        await queryRunner.createForeignKey("events", new TableForeignKey({
            columnNames: ["parentEventId"],
            referencedColumnNames: ["id"],
            referencedTableName: "events",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("event_participants", new TableForeignKey({
            columnNames: ["eventId"],
            referencedColumnNames: ["id"],
            referencedTableName: "events",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("resource_bookings", new TableForeignKey({
            columnNames: ["resourceId"],
            referencedColumnNames: ["id"],
            referencedTableName: "resources",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("resource_bookings", new TableForeignKey({
            columnNames: ["eventId"],
            referencedColumnNames: ["id"],
            referencedTableName: "events",
            onDelete: "CASCADE"
        }));

        // Add indexes for performance
        await queryRunner.createIndex("events", new TableIndex({
            name: "IDX_events_startTime",
            columnNames: ["startTime"]
        }));

        await queryRunner.createIndex("events", new TableIndex({
            name: "IDX_events_endTime",
            columnNames: ["endTime"]
        }));

        await queryRunner.createIndex("events", new TableIndex({
            name: "IDX_events_organizationId",
            columnNames: ["organizationId"]
        }));

        await queryRunner.createIndex("events", new TableIndex({
            name: "IDX_events_teamId",
            columnNames: ["teamId"]
        }));

        await queryRunner.createIndex("events", new TableIndex({
            name: "IDX_events_type",
            columnNames: ["type"]
        }));

        await queryRunner.createIndex("events", new TableIndex({
            name: "IDX_events_status",
            columnNames: ["status"]
        }));

        await queryRunner.createIndex("event_participants", new TableIndex({
            name: "IDX_event_participants_userId",
            columnNames: ["userId"]
        }));

        await queryRunner.createIndex("event_participants", new TableIndex({
            name: "IDX_event_participants_eventId_userId",
            columnNames: ["eventId", "userId"],
            isUnique: true
        }));

        await queryRunner.createIndex("resource_bookings", new TableIndex({
            name: "IDX_resource_bookings_resourceId",
            columnNames: ["resourceId"]
        }));

        await queryRunner.createIndex("resource_bookings", new TableIndex({
            name: "IDX_resource_bookings_startTime_endTime",
            columnNames: ["startTime", "endTime"]
        }));

        await queryRunner.createIndex("resources", new TableIndex({
            name: "IDX_resources_organizationId",
            columnNames: ["organizationId"]
        }));

        await queryRunner.createIndex("resources", new TableIndex({
            name: "IDX_resources_type",
            columnNames: ["type"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.dropIndex("resources", "IDX_resources_type");
        await queryRunner.dropIndex("resources", "IDX_resources_organizationId");
        await queryRunner.dropIndex("resource_bookings", "IDX_resource_bookings_startTime_endTime");
        await queryRunner.dropIndex("resource_bookings", "IDX_resource_bookings_resourceId");
        await queryRunner.dropIndex("event_participants", "IDX_event_participants_eventId_userId");
        await queryRunner.dropIndex("event_participants", "IDX_event_participants_userId");
        await queryRunner.dropIndex("events", "IDX_events_status");
        await queryRunner.dropIndex("events", "IDX_events_type");
        await queryRunner.dropIndex("events", "IDX_events_teamId");
        await queryRunner.dropIndex("events", "IDX_events_organizationId");
        await queryRunner.dropIndex("events", "IDX_events_endTime");
        await queryRunner.dropIndex("events", "IDX_events_startTime");

        // Drop tables
        await queryRunner.dropTable("resource_bookings");
        await queryRunner.dropTable("event_participants");
        await queryRunner.dropTable("events");
        await queryRunner.dropTable("recurrence_rules");
        await queryRunner.dropTable("resources");
    }
}