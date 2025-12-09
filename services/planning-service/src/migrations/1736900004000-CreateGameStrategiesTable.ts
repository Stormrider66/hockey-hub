import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateGameStrategiesTable1736900004000 implements MigrationInterface {
    name = 'CreateGameStrategiesTable1736900004000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create game_strategies table
        await queryRunner.createTable(new Table({
            name: "game_strategies",
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
                    name: "gameId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "opponentTeamId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "lineups",
                    type: "jsonb"
                },
                {
                    name: "matchups",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "specialInstructions",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "opponentScouting",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "preGameSpeech",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "periodAdjustments",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "postGameAnalysis",
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
        await queryRunner.createIndex("game_strategies", new TableIndex({
            name: "IDX_game_strategies_coach_id",
            columnNames: ["coachId"]
        }));

        await queryRunner.createIndex("game_strategies", new TableIndex({
            name: "IDX_game_strategies_team_id",
            columnNames: ["teamId"]
        }));

        await queryRunner.createIndex("game_strategies", new TableIndex({
            name: "IDX_game_strategies_game_id",
            columnNames: ["gameId"],
            isUnique: true
        }));

        await queryRunner.createIndex("game_strategies", new TableIndex({
            name: "IDX_game_strategies_opponent_team_id",
            columnNames: ["opponentTeamId"]
        }));

        await queryRunner.createIndex("game_strategies", new TableIndex({
            name: "IDX_game_strategies_team_opponent",
            columnNames: ["teamId", "opponentTeamId"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.dropIndex("game_strategies", "IDX_game_strategies_team_opponent");
        await queryRunner.dropIndex("game_strategies", "IDX_game_strategies_opponent_team_id");
        await queryRunner.dropIndex("game_strategies", "IDX_game_strategies_game_id");
        await queryRunner.dropIndex("game_strategies", "IDX_game_strategies_team_id");
        await queryRunner.dropIndex("game_strategies", "IDX_game_strategies_coach_id");

        // Drop table
        await queryRunner.dropTable("game_strategies");
    }
}