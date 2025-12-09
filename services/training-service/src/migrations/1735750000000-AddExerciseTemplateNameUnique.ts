import { MigrationInterface, QueryRunner, Index } from "typeorm";

export class AddExerciseTemplateNameUnique1735750000000 implements MigrationInterface {
    name = 'AddExerciseTemplateNameUnique1735750000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add unique index on exercise template name
        await queryRunner.createIndex("exercise_templates", new Index({
            name: "UQ_exercise_templates_name",
            columnNames: ["name"],
            isUnique: true
        }));

        // Add index on name for search performance
        await queryRunner.createIndex("exercise_templates", new Index({
            name: "IDX_exercise_templates_name",
            columnNames: ["name"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex("exercise_templates", "IDX_exercise_templates_name");
        await queryRunner.dropIndex("exercise_templates", "UQ_exercise_templates_name");
    }
}