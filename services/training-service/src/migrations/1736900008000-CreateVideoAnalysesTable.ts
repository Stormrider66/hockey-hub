import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateVideoAnalysesTable1736900008000 implements MigrationInterface {
    name = 'CreateVideoAnalysesTable1736900008000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create video_analyses table
        await queryRunner.createTable(new Table({
            name: "video_analyses",
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
                    name: "playerId",
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
                    name: "gameId",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "videoUrl",
                    type: "varchar",
                    length: "500"
                },
                {
                    name: "title",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "type",
                    type: "enum",
                    enum: ["game", "practice", "skills", "tactical"]
                },
                {
                    name: "clips",
                    type: "jsonb"
                },
                {
                    name: "playerPerformance",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "teamAnalysis",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "summary",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "tags",
                    type: "text",
                    isArray: true,
                    isNullable: true
                },
                {
                    name: "sharedWithPlayer",
                    type: "boolean",
                    default: false
                },
                {
                    name: "sharedWithTeam",
                    type: "boolean",
                    default: false
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
        await queryRunner.createIndex("video_analyses", new TableIndex({
            name: "IDX_video_analyses_coach_id",
            columnNames: ["coachId"]
        }));

        await queryRunner.createIndex("video_analyses", new TableIndex({
            name: "IDX_video_analyses_player_id",
            columnNames: ["playerId"]
        }));

        await queryRunner.createIndex("video_analyses", new TableIndex({
            name: "IDX_video_analyses_team_id",
            columnNames: ["teamId"]
        }));

        await queryRunner.createIndex("video_analyses", new TableIndex({
            name: "IDX_video_analyses_game_id",
            columnNames: ["gameId"]
        }));

        await queryRunner.createIndex("video_analyses", new TableIndex({
            name: "IDX_video_analyses_type",
            columnNames: ["type"]
        }));

        await queryRunner.createIndex("video_analyses", new TableIndex({
            name: "IDX_video_analyses_shared_with_player",
            columnNames: ["sharedWithPlayer"]
        }));

        await queryRunner.createIndex("video_analyses", new TableIndex({
            name: "IDX_video_analyses_shared_with_team",
            columnNames: ["sharedWithTeam"]
        }));

        await queryRunner.createIndex("video_analyses", new TableIndex({
            name: "IDX_video_analyses_coach_player",
            columnNames: ["coachId", "playerId"]
        }));

        await queryRunner.createIndex("video_analyses", new TableIndex({
            name: "IDX_video_analyses_player_type",
            columnNames: ["playerId", "type"]
        }));

        // Full text search index for title and summary
        await queryRunner.query(`
            CREATE INDEX IDX_video_analyses_search 
            ON video_analyses 
            USING gin(to_tsvector('english', title || ' ' || COALESCE(summary, '')))
        `);

        // GIN index for tags array
        await queryRunner.query(`
            CREATE INDEX IDX_video_analyses_tags 
            ON video_analyses 
            USING gin(tags)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.dropIndex("video_analyses", "IDX_video_analyses_tags");
        await queryRunner.dropIndex("video_analyses", "IDX_video_analyses_search");
        await queryRunner.dropIndex("video_analyses", "IDX_video_analyses_player_type");
        await queryRunner.dropIndex("video_analyses", "IDX_video_analyses_coach_player");
        await queryRunner.dropIndex("video_analyses", "IDX_video_analyses_shared_with_team");
        await queryRunner.dropIndex("video_analyses", "IDX_video_analyses_shared_with_player");
        await queryRunner.dropIndex("video_analyses", "IDX_video_analyses_type");
        await queryRunner.dropIndex("video_analyses", "IDX_video_analyses_game_id");
        await queryRunner.dropIndex("video_analyses", "IDX_video_analyses_team_id");
        await queryRunner.dropIndex("video_analyses", "IDX_video_analyses_player_id");
        await queryRunner.dropIndex("video_analyses", "IDX_video_analyses_coach_id");

        // Drop table
        await queryRunner.dropTable("video_analyses");
    }
}