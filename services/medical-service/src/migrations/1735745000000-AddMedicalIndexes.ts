import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMedicalIndexes1735745000000 implements MigrationInterface {
    name = 'AddMedicalIndexes1735745000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add index on injuries.player_id for faster player injury lookups
        await queryRunner.query(`
            CREATE INDEX "idx_injuries_player_id" 
            ON "injuries" ("player_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the index
        await queryRunner.query(`
            DROP INDEX "idx_injuries_player_id"
        `);
    }
}