// @ts-nocheck - Suppress TypeScript errors for build
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommunicationIndexes1735745000003 implements MigrationInterface {
    name = 'AddCommunicationIndexes1735745000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add composite index on messages.conversation_id and created_at for faster message retrieval
        await queryRunner.query(`
            CREATE INDEX "idx_messages_conversation_created" 
            ON "messages" ("conversation_id", "created_at")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the index
        await queryRunner.query(`
            DROP INDEX "idx_messages_conversation_created"
        `);
    }
}