import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateDrillLibraryTable1736900005000 implements MigrationInterface {
    name = 'CreateDrillLibraryTable1736900005000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create drill_library table
        await queryRunner.createTable(new Table({
            name: "drill_library",
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
                    name: "createdBy",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "category",
                    type: "enum",
                    enum: ["skating", "passing", "shooting", "checking", "positioning", "conditioning", "goalie", "team_systems", "small_games"]
                },
                {
                    name: "skillFocus",
                    type: "text",
                    isArray: true
                },
                {
                    name: "difficulty",
                    type: "enum",
                    enum: ["beginner", "intermediate", "advanced", "elite"]
                },
                {
                    name: "minPlayers",
                    type: "int"
                },
                {
                    name: "maxPlayers",
                    type: "int"
                },
                {
                    name: "duration",
                    type: "int"
                },
                {
                    name: "requiredEquipment",
                    type: "text",
                    isArray: true
                },
                {
                    name: "setup",
                    type: "jsonb"
                },
                {
                    name: "description",
                    type: "text"
                },
                {
                    name: "progressions",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "coachingPoints",
                    type: "text",
                    isArray: true,
                    isNullable: true
                },
                {
                    name: "commonMistakes",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "videoUrl",
                    type: "varchar",
                    length: "500",
                    isNullable: true
                },
                {
                    name: "diagramUrl",
                    type: "varchar",
                    length: "500",
                    isNullable: true
                },
                {
                    name: "isPublic",
                    type: "boolean",
                    default: true
                },
                {
                    name: "usageCount",
                    type: "int",
                    default: 0
                },
                {
                    name: "rating",
                    type: "float",
                    default: 0
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
        await queryRunner.createIndex("drill_library", new TableIndex({
            name: "IDX_drill_library_created_by",
            columnNames: ["createdBy"]
        }));

        await queryRunner.createIndex("drill_library", new TableIndex({
            name: "IDX_drill_library_category",
            columnNames: ["category"]
        }));

        await queryRunner.createIndex("drill_library", new TableIndex({
            name: "IDX_drill_library_difficulty",
            columnNames: ["difficulty"]
        }));

        await queryRunner.createIndex("drill_library", new TableIndex({
            name: "IDX_drill_library_is_public",
            columnNames: ["isPublic"]
        }));

        await queryRunner.createIndex("drill_library", new TableIndex({
            name: "IDX_drill_library_usage_count",
            columnNames: ["usageCount"]
        }));

        await queryRunner.createIndex("drill_library", new TableIndex({
            name: "IDX_drill_library_rating",
            columnNames: ["rating"]
        }));

        await queryRunner.createIndex("drill_library", new TableIndex({
            name: "IDX_drill_library_category_difficulty",
            columnNames: ["category", "difficulty"]
        }));

        await queryRunner.createIndex("drill_library", new TableIndex({
            name: "IDX_drill_library_players_range",
            columnNames: ["minPlayers", "maxPlayers"]
        }));

        // Full text search index for name and description
        await queryRunner.query(`
            CREATE INDEX IDX_drill_library_search 
            ON drill_library 
            USING gin(to_tsvector('english', name || ' ' || description))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.dropIndex("drill_library", "IDX_drill_library_search");
        await queryRunner.dropIndex("drill_library", "IDX_drill_library_players_range");
        await queryRunner.dropIndex("drill_library", "IDX_drill_library_category_difficulty");
        await queryRunner.dropIndex("drill_library", "IDX_drill_library_rating");
        await queryRunner.dropIndex("drill_library", "IDX_drill_library_usage_count");
        await queryRunner.dropIndex("drill_library", "IDX_drill_library_is_public");
        await queryRunner.dropIndex("drill_library", "IDX_drill_library_difficulty");
        await queryRunner.dropIndex("drill_library", "IDX_drill_library_category");
        await queryRunner.dropIndex("drill_library", "IDX_drill_library_created_by");

        // Drop table
        await queryRunner.dropTable("drill_library");
    }
}