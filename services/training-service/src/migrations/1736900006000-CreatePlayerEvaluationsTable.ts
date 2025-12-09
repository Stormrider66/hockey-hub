import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreatePlayerEvaluationsTable1736900006000 implements MigrationInterface {
    name = 'CreatePlayerEvaluationsTable1736900006000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create player_evaluations table
        await queryRunner.createTable(new Table({
            name: "player_evaluations",
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
                    name: "teamId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "evaluationDate",
                    type: "date"
                },
                {
                    name: "type",
                    type: "enum",
                    enum: ["preseason", "midseason", "postseason", "monthly", "game", "practice"]
                },
                {
                    name: "technicalSkills",
                    type: "jsonb"
                },
                {
                    name: "tacticalSkills",
                    type: "jsonb"
                },
                {
                    name: "physicalAttributes",
                    type: "jsonb"
                },
                {
                    name: "mentalAttributes",
                    type: "jsonb"
                },
                {
                    name: "strengths",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "areasForImprovement",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "coachComments",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "gameSpecificNotes",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "developmentPriorities",
                    type: "jsonb"
                },
                {
                    name: "overallRating",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "potential",
                    type: "varchar",
                    length: "50",
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
        await queryRunner.createIndex("player_evaluations", new TableIndex({
            name: "IDX_player_evaluations_player_id",
            columnNames: ["playerId"]
        }));

        await queryRunner.createIndex("player_evaluations", new TableIndex({
            name: "IDX_player_evaluations_coach_id",
            columnNames: ["coachId"]
        }));

        await queryRunner.createIndex("player_evaluations", new TableIndex({
            name: "IDX_player_evaluations_team_id",
            columnNames: ["teamId"]
        }));

        await queryRunner.createIndex("player_evaluations", new TableIndex({
            name: "IDX_player_evaluations_evaluation_date",
            columnNames: ["evaluationDate"]
        }));

        await queryRunner.createIndex("player_evaluations", new TableIndex({
            name: "IDX_player_evaluations_type",
            columnNames: ["type"]
        }));

        await queryRunner.createIndex("player_evaluations", new TableIndex({
            name: "IDX_player_evaluations_overall_rating",
            columnNames: ["overallRating"]
        }));

        await queryRunner.createIndex("player_evaluations", new TableIndex({
            name: "IDX_player_evaluations_potential",
            columnNames: ["potential"]
        }));

        await queryRunner.createIndex("player_evaluations", new TableIndex({
            name: "IDX_player_evaluations_player_date",
            columnNames: ["playerId", "evaluationDate"]
        }));

        await queryRunner.createIndex("player_evaluations", new TableIndex({
            name: "IDX_player_evaluations_team_date",
            columnNames: ["teamId", "evaluationDate"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.dropIndex("player_evaluations", "IDX_player_evaluations_team_date");
        await queryRunner.dropIndex("player_evaluations", "IDX_player_evaluations_player_date");
        await queryRunner.dropIndex("player_evaluations", "IDX_player_evaluations_potential");
        await queryRunner.dropIndex("player_evaluations", "IDX_player_evaluations_overall_rating");
        await queryRunner.dropIndex("player_evaluations", "IDX_player_evaluations_type");
        await queryRunner.dropIndex("player_evaluations", "IDX_player_evaluations_evaluation_date");
        await queryRunner.dropIndex("player_evaluations", "IDX_player_evaluations_team_id");
        await queryRunner.dropIndex("player_evaluations", "IDX_player_evaluations_coach_id");
        await queryRunner.dropIndex("player_evaluations", "IDX_player_evaluations_player_id");

        // Drop table
        await queryRunner.dropTable("player_evaluations");
    }
}