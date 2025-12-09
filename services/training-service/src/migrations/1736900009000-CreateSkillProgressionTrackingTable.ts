import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateSkillProgressionTrackingTable1736900009000 implements MigrationInterface {
    name = 'CreateSkillProgressionTrackingTable1736900009000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create skill_progression_tracking table
        await queryRunner.createTable(new Table({
            name: "skill_progression_tracking",
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
                    name: "skill",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "category",
                    type: "varchar",
                    length: "100"
                },
                {
                    name: "measurements",
                    type: "jsonb"
                },
                {
                    name: "benchmarks",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "drillHistory",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "currentLevel",
                    type: "float",
                    isNullable: true
                },
                {
                    name: "targetLevel",
                    type: "float",
                    isNullable: true
                },
                {
                    name: "improvementRate",
                    type: "float",
                    isNullable: true
                },
                {
                    name: "startDate",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "lastUpdated",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);

        // Create indexes for performance
        await queryRunner.createIndex("skill_progression_tracking", new TableIndex({
            name: "IDX_skill_progression_tracking_player_id",
            columnNames: ["playerId"]
        }));

        await queryRunner.createIndex("skill_progression_tracking", new TableIndex({
            name: "IDX_skill_progression_tracking_coach_id",
            columnNames: ["coachId"]
        }));

        await queryRunner.createIndex("skill_progression_tracking", new TableIndex({
            name: "IDX_skill_progression_tracking_skill",
            columnNames: ["skill"]
        }));

        await queryRunner.createIndex("skill_progression_tracking", new TableIndex({
            name: "IDX_skill_progression_tracking_category",
            columnNames: ["category"]
        }));

        await queryRunner.createIndex("skill_progression_tracking", new TableIndex({
            name: "IDX_skill_progression_tracking_current_level",
            columnNames: ["currentLevel"]
        }));

        await queryRunner.createIndex("skill_progression_tracking", new TableIndex({
            name: "IDX_skill_progression_tracking_improvement_rate",
            columnNames: ["improvementRate"]
        }));

        await queryRunner.createIndex("skill_progression_tracking", new TableIndex({
            name: "IDX_skill_progression_tracking_player_skill",
            columnNames: ["playerId", "skill"],
            isUnique: true
        }));

        await queryRunner.createIndex("skill_progression_tracking", new TableIndex({
            name: "IDX_skill_progression_tracking_player_category",
            columnNames: ["playerId", "category"]
        }));

        await queryRunner.createIndex("skill_progression_tracking", new TableIndex({
            name: "IDX_skill_progression_tracking_last_updated",
            columnNames: ["lastUpdated"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.dropIndex("skill_progression_tracking", "IDX_skill_progression_tracking_last_updated");
        await queryRunner.dropIndex("skill_progression_tracking", "IDX_skill_progression_tracking_player_category");
        await queryRunner.dropIndex("skill_progression_tracking", "IDX_skill_progression_tracking_player_skill");
        await queryRunner.dropIndex("skill_progression_tracking", "IDX_skill_progression_tracking_improvement_rate");
        await queryRunner.dropIndex("skill_progression_tracking", "IDX_skill_progression_tracking_current_level");
        await queryRunner.dropIndex("skill_progression_tracking", "IDX_skill_progression_tracking_category");
        await queryRunner.dropIndex("skill_progression_tracking", "IDX_skill_progression_tracking_skill");
        await queryRunner.dropIndex("skill_progression_tracking", "IDX_skill_progression_tracking_coach_id");
        await queryRunner.dropIndex("skill_progression_tracking", "IDX_skill_progression_tracking_player_id");

        // Drop table
        await queryRunner.dropTable("skill_progression_tracking");
    }
}