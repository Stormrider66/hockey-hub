import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreatePlayerDevelopmentPlansTable1736900007000 implements MigrationInterface {
    name = 'CreatePlayerDevelopmentPlansTable1736900007000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create player_development_plans table
        await queryRunner.createTable(new Table({
            name: "player_development_plans",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "playerId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "coachId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "seasonId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "startDate",
                    type: "date"
                },
                {
                    name: "endDate",
                    type: "date"
                },
                {
                    name: "currentLevel",
                    type: "jsonb"
                },
                {
                    name: "goals",
                    type: "jsonb"
                },
                {
                    name: "weeklyPlan",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "milestones",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "parentCommunication",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "externalResources",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "status",
                    type: "enum",
                    enum: ["active", "paused", "completed", "archived"],
                    default: "'active'"
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

        // Create indexes for performance
        await queryRunner.createIndex("player_development_plans", new TableIndex({
            name: "IDX_player_development_plans_player_id",
            columnNames: ["playerId"]
        }));

        await queryRunner.createIndex("player_development_plans", new TableIndex({
            name: "IDX_player_development_plans_coach_id",
            columnNames: ["coachId"]
        }));

        await queryRunner.createIndex("player_development_plans", new TableIndex({
            name: "IDX_player_development_plans_season_id",
            columnNames: ["seasonId"]
        }));

        await queryRunner.createIndex("player_development_plans", new TableIndex({
            name: "IDX_player_development_plans_status",
            columnNames: ["status"]
        }));

        await queryRunner.createIndex("player_development_plans", new TableIndex({
            name: "IDX_player_development_plans_start_date",
            columnNames: ["startDate"]
        }));

        await queryRunner.createIndex("player_development_plans", new TableIndex({
            name: "IDX_player_development_plans_end_date",
            columnNames: ["endDate"]
        }));

        await queryRunner.createIndex("player_development_plans", new TableIndex({
            name: "IDX_player_development_plans_player_season",
            columnNames: ["playerId", "seasonId"]
        }));

        await queryRunner.createIndex("player_development_plans", new TableIndex({
            name: "IDX_player_development_plans_date_range",
            columnNames: ["startDate", "endDate"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.dropIndex("player_development_plans", "IDX_player_development_plans_date_range");
        await queryRunner.dropIndex("player_development_plans", "IDX_player_development_plans_player_season");
        await queryRunner.dropIndex("player_development_plans", "IDX_player_development_plans_end_date");
        await queryRunner.dropIndex("player_development_plans", "IDX_player_development_plans_start_date");
        await queryRunner.dropIndex("player_development_plans", "IDX_player_development_plans_status");
        await queryRunner.dropIndex("player_development_plans", "IDX_player_development_plans_season_id");
        await queryRunner.dropIndex("player_development_plans", "IDX_player_development_plans_coach_id");
        await queryRunner.dropIndex("player_development_plans", "IDX_player_development_plans_player_id");

        // Drop table
        await queryRunner.dropTable("player_development_plans");
    }
}