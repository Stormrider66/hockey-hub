import { MigrationInterface, QueryRunner, TableColumn, Index } from "typeorm";

export class AddOrganizationIdToExerciseTemplate1735750000001 implements MigrationInterface {
    name = 'AddOrganizationIdToExerciseTemplate1735750000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add organizationId column
        await queryRunner.addColumn("exercise_templates", new TableColumn({
            name: "organizationId",
            type: "uuid",
            isNullable: true
        }));

        // Add index on organizationId for filtering
        await queryRunner.createIndex("exercise_templates", new Index({
            name: "IDX_exercise_templates_organizationId",
            columnNames: ["organizationId"]
        }));

        // Add composite index for organization-specific queries
        await queryRunner.createIndex("exercise_templates", new Index({
            name: "IDX_exercise_templates_organizationId_category",
            columnNames: ["organizationId", "category"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex("exercise_templates", "IDX_exercise_templates_organizationId_category");
        await queryRunner.dropIndex("exercise_templates", "IDX_exercise_templates_organizationId");
        await queryRunner.dropColumn("exercise_templates", "organizationId");
    }
}