import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreatePlayerFeedbackTable1736900010000 implements MigrationInterface {
    name = 'CreatePlayerFeedbackTable1736900010000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create player_feedback table
        await queryRunner.createTable(new Table({
            name: "player_feedback",
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
                    name: "type",
                    type: "enum",
                    enum: ["game", "practice", "general", "behavioral", "tactical"]
                },
                {
                    name: "relatedEventId",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "tone",
                    type: "enum",
                    enum: ["positive", "constructive", "critical", "mixed"]
                },
                {
                    name: "message",
                    type: "text"
                },
                {
                    name: "actionItems",
                    type: "text",
                    isArray: true,
                    isNullable: true
                },
                {
                    name: "requiresResponse",
                    type: "boolean",
                    default: false
                },
                {
                    name: "playerResponse",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "playerResponseDate",
                    type: "timestamp",
                    isNullable: true
                },
                {
                    name: "parentVisible",
                    type: "boolean",
                    default: false
                },
                {
                    name: "status",
                    type: "enum",
                    enum: ["unread", "read", "acknowledged", "discussed"],
                    default: "'unread'"
                },
                {
                    name: "discussedInPerson",
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

        // Create indexes for performance
        await queryRunner.createIndex("player_feedback", new TableIndex({
            name: "IDX_player_feedback_player_id",
            columnNames: ["playerId"]
        }));

        await queryRunner.createIndex("player_feedback", new TableIndex({
            name: "IDX_player_feedback_coach_id",
            columnNames: ["coachId"]
        }));

        await queryRunner.createIndex("player_feedback", new TableIndex({
            name: "IDX_player_feedback_type",
            columnNames: ["type"]
        }));

        await queryRunner.createIndex("player_feedback", new TableIndex({
            name: "IDX_player_feedback_tone",
            columnNames: ["tone"]
        }));

        await queryRunner.createIndex("player_feedback", new TableIndex({
            name: "IDX_player_feedback_status",
            columnNames: ["status"]
        }));

        await queryRunner.createIndex("player_feedback", new TableIndex({
            name: "IDX_player_feedback_requires_response",
            columnNames: ["requiresResponse"]
        }));

        await queryRunner.createIndex("player_feedback", new TableIndex({
            name: "IDX_player_feedback_parent_visible",
            columnNames: ["parentVisible"]
        }));

        await queryRunner.createIndex("player_feedback", new TableIndex({
            name: "IDX_player_feedback_related_event_id",
            columnNames: ["relatedEventId"]
        }));

        await queryRunner.createIndex("player_feedback", new TableIndex({
            name: "IDX_player_feedback_created_at",
            columnNames: ["createdAt"]
        }));

        await queryRunner.createIndex("player_feedback", new TableIndex({
            name: "IDX_player_feedback_player_status",
            columnNames: ["playerId", "status"]
        }));

        await queryRunner.createIndex("player_feedback", new TableIndex({
            name: "IDX_player_feedback_coach_pending",
            columnNames: ["coachId", "requiresResponse", "playerResponseDate"]
        }));

        await queryRunner.createIndex("player_feedback", new TableIndex({
            name: "IDX_player_feedback_player_type_created",
            columnNames: ["playerId", "type", "createdAt"]
        }));

        // Full text search index for message content
        await queryRunner.query(`
            CREATE INDEX IDX_player_feedback_message_search 
            ON player_feedback 
            USING gin(to_tsvector('english', message || ' ' || COALESCE(player_response, '')))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.dropIndex("player_feedback", "IDX_player_feedback_message_search");
        await queryRunner.dropIndex("player_feedback", "IDX_player_feedback_player_type_created");
        await queryRunner.dropIndex("player_feedback", "IDX_player_feedback_coach_pending");
        await queryRunner.dropIndex("player_feedback", "IDX_player_feedback_player_status");
        await queryRunner.dropIndex("player_feedback", "IDX_player_feedback_created_at");
        await queryRunner.dropIndex("player_feedback", "IDX_player_feedback_related_event_id");
        await queryRunner.dropIndex("player_feedback", "IDX_player_feedback_parent_visible");
        await queryRunner.dropIndex("player_feedback", "IDX_player_feedback_requires_response");
        await queryRunner.dropIndex("player_feedback", "IDX_player_feedback_status");
        await queryRunner.dropIndex("player_feedback", "IDX_player_feedback_tone");
        await queryRunner.dropIndex("player_feedback", "IDX_player_feedback_type");
        await queryRunner.dropIndex("player_feedback", "IDX_player_feedback_coach_id");
        await queryRunner.dropIndex("player_feedback", "IDX_player_feedback_player_id");

        // Drop table
        await queryRunner.dropTable("player_feedback");
    }
}