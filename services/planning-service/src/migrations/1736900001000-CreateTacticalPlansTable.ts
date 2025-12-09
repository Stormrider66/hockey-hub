import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateTacticalPlansTable1736900001000 implements MigrationInterface {
    name = 'CreateTacticalPlansTable1736900001000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create tactical_plans table
        await queryRunner.createTable(new Table({
            name: "tactical_plans",
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
                    name: "name",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "category",
                    type: "enum",
                    enum: ["offensive", "defensive", "transition", "special_teams"]
                },
                {
                    name: "formation",
                    type: "jsonb"
                },
                {
                    name: "playerAssignments",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "description",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "triggers",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "videoReferences",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "isActive",
                    type: "boolean",
                    default: true
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
        await queryRunner.createIndex("tactical_plans", new TableIndex({
            name: "IDX_tactical_plans_coach_id",
            columnNames: ["coachId"]
        }));

        await queryRunner.createIndex("tactical_plans", new TableIndex({
            name: "IDX_tactical_plans_team_id",
            columnNames: ["teamId"]
        }));

        await queryRunner.createIndex("tactical_plans", new TableIndex({
            name: "IDX_tactical_plans_category",
            columnNames: ["category"]
        }));

        await queryRunner.createIndex("tactical_plans", new TableIndex({
            name: "IDX_tactical_plans_is_active",
            columnNames: ["isActive"]
        }));

        await queryRunner.createIndex("tactical_plans", new TableIndex({
            name: "IDX_tactical_plans_team_category",
            columnNames: ["teamId", "category"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.dropIndex("tactical_plans", "IDX_tactical_plans_team_category");
        await queryRunner.dropIndex("tactical_plans", "IDX_tactical_plans_is_active");
        await queryRunner.dropIndex("tactical_plans", "IDX_tactical_plans_category");
        await queryRunner.dropIndex("tactical_plans", "IDX_tactical_plans_team_id");
        await queryRunner.dropIndex("tactical_plans", "IDX_tactical_plans_coach_id");

        // Drop table
        await queryRunner.dropTable("tactical_plans");
    }
}