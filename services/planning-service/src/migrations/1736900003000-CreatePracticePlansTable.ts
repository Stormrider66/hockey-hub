import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreatePracticePlansTable1736900003000 implements MigrationInterface {
    name = 'CreatePracticePlansTable1736900003000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create practice_plans table
        await queryRunner.createTable(new Table({
            name: "practice_plans",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "coachId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "teamId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "date",
                    type: "date"
                },
                {
                    name: "startTime",
                    type: "time"
                },
                {
                    name: "duration",
                    type: "int"
                },
                {
                    name: "facilityId",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "type",
                    type: "enum",
                    enum: ["on_ice", "off_ice", "video", "classroom"]
                },
                {
                    name: "segments",
                    type: "jsonb"
                },
                {
                    name: "equipmentNeeded",
                    type: "text",
                    isArray: true,
                    isNullable: true
                },
                {
                    name: "assistantCoachAssignments",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "objectives",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "postPracticeNotes",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "playerAttendance",
                    type: "jsonb",
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

        // Create indexes for performance
        await queryRunner.createIndex("practice_plans", new TableIndex({
            name: "IDX_practice_plans_coach_id",
            columnNames: ["coachId"]
        }));

        await queryRunner.createIndex("practice_plans", new TableIndex({
            name: "IDX_practice_plans_team_id",
            columnNames: ["teamId"]
        }));

        await queryRunner.createIndex("practice_plans", new TableIndex({
            name: "IDX_practice_plans_date",
            columnNames: ["date"]
        }));

        await queryRunner.createIndex("practice_plans", new TableIndex({
            name: "IDX_practice_plans_type",
            columnNames: ["type"]
        }));

        await queryRunner.createIndex("practice_plans", new TableIndex({
            name: "IDX_practice_plans_team_date",
            columnNames: ["teamId", "date"]
        }));

        await queryRunner.createIndex("practice_plans", new TableIndex({
            name: "IDX_practice_plans_facility_date",
            columnNames: ["facilityId", "date"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.dropIndex("practice_plans", "IDX_practice_plans_facility_date");
        await queryRunner.dropIndex("practice_plans", "IDX_practice_plans_team_date");
        await queryRunner.dropIndex("practice_plans", "IDX_practice_plans_type");
        await queryRunner.dropIndex("practice_plans", "IDX_practice_plans_date");
        await queryRunner.dropIndex("practice_plans", "IDX_practice_plans_team_id");
        await queryRunner.dropIndex("practice_plans", "IDX_practice_plans_coach_id");

        // Drop table
        await queryRunner.dropTable("practice_plans");
    }
}