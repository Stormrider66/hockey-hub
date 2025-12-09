import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CreatePlaybookPlaysTable1736900002000 implements MigrationInterface {
    name = 'CreatePlaybookPlaysTable1736900002000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create playbook_plays table
        await queryRunner.createTable(new Table({
            name: "playbook_plays",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "tacticalPlanId",
                    type: "uuid"
                },
                {
                    name: "name",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "type",
                    type: "enum",
                    enum: ["breakout", "forecheck", "cycle", "rush", "faceoff", "powerplay", "penalty_kill"]
                },
                {
                    name: "sequence",
                    type: "jsonb"
                },
                {
                    name: "contingencies",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "coachingPoints",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "practiceNotes",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "usageCount",
                    type: "int",
                    default: 0
                },
                {
                    name: "successRate",
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

        // Create foreign key relationship with tactical_plans
        await queryRunner.createForeignKey("playbook_plays", new TableForeignKey({
            columnNames: ["tacticalPlanId"],
            referencedColumnNames: ["id"],
            referencedTableName: "tactical_plans",
            onDelete: "CASCADE"
        }));

        // Create indexes for performance
        await queryRunner.createIndex("playbook_plays", new TableIndex({
            name: "IDX_playbook_plays_tactical_plan_id",
            columnNames: ["tacticalPlanId"]
        }));

        await queryRunner.createIndex("playbook_plays", new TableIndex({
            name: "IDX_playbook_plays_type",
            columnNames: ["type"]
        }));

        await queryRunner.createIndex("playbook_plays", new TableIndex({
            name: "IDX_playbook_plays_usage_count",
            columnNames: ["usageCount"]
        }));

        await queryRunner.createIndex("playbook_plays", new TableIndex({
            name: "IDX_playbook_plays_success_rate",
            columnNames: ["successRate"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.dropIndex("playbook_plays", "IDX_playbook_plays_success_rate");
        await queryRunner.dropIndex("playbook_plays", "IDX_playbook_plays_usage_count");
        await queryRunner.dropIndex("playbook_plays", "IDX_playbook_plays_type");
        await queryRunner.dropIndex("playbook_plays", "IDX_playbook_plays_tactical_plan_id");

        // Drop foreign key
        const table = await queryRunner.getTable("playbook_plays");
        const foreignKey = table!.foreignKeys.find(fk => fk.columnNames.indexOf("tacticalPlanId") !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey("playbook_plays", foreignKey);
        }

        // Drop table
        await queryRunner.dropTable("playbook_plays");
    }
}