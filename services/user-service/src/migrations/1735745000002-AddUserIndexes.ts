import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIndexes1735745000002 implements MigrationInterface {
    name = 'AddUserIndexes1735745000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add composite index on users.email and is_active for faster active user lookups
        await queryRunner.query(`
            CREATE INDEX "idx_users_email_active" 
            ON "users" ("email", "is_active")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the index
        await queryRunner.query(`
            DROP INDEX "idx_users_email_active"
        `);
    }
}