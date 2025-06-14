import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateOutboxMessages1672531200000 implements MigrationInterface {
    name = 'CreateOutboxMessages1672531200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create uuid-ossp extension if it doesn't exist
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        // Create outbox_messages table
        await queryRunner.createTable(
            new Table({
                name: 'outbox_messages',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'topic',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'payload',
                        type: 'jsonb',
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['pending', 'processed', 'failed'],
                        default: "'pending'",
                    },
                    {
                        name: 'attemptCount',
                        type: 'integer',
                        default: 0,
                    },
                    {
                        name: 'nextAttemptAt',
                        type: 'timestamptz',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamptz',
                        default: 'NOW()',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamptz',
                        default: 'NOW()',
                    },
                ],
                indices: [
                    {
                        name: 'IDX_outbox_messages_status',
                        columnNames: ['status'],
                    },
                    {
                        name: 'IDX_outbox_messages_next_attempt',
                        columnNames: ['nextAttemptAt'],
                    },
                    {
                        name: 'IDX_outbox_messages_created_at',
                        columnNames: ['createdAt'],
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('outbox_messages');
    }
} 