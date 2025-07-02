import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddPushSubscriptionTable1735600000000 implements MigrationInterface {
  name = 'AddPushSubscriptionTable1735600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create push_subscriptions table
    await queryRunner.createTable(
      new Table({
        name: 'push_subscriptions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'endpoint',
            type: 'text',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'p256dh_key',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'auth_key',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'browser_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'device_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'last_used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'push_subscriptions',
      new Index({
        name: 'IDX_push_subscriptions_user_id',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'push_subscriptions',
      new Index({
        name: 'IDX_push_subscriptions_endpoint',
        columnNames: ['endpoint'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'push_subscriptions',
      new Index({
        name: 'IDX_push_subscriptions_active',
        columnNames: ['is_active'],
        where: 'is_active = true',
      })
    );

    await queryRunner.createIndex(
      'push_subscriptions',
      new Index({
        name: 'IDX_push_subscriptions_last_used',
        columnNames: ['last_used_at'],
      })
    );

    await queryRunner.createIndex(
      'push_subscriptions',
      new Index({
        name: 'IDX_push_subscriptions_user_active',
        columnNames: ['user_id', 'is_active'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('push_subscriptions', 'IDX_push_subscriptions_user_active');
    await queryRunner.dropIndex('push_subscriptions', 'IDX_push_subscriptions_last_used');
    await queryRunner.dropIndex('push_subscriptions', 'IDX_push_subscriptions_active');
    await queryRunner.dropIndex('push_subscriptions', 'IDX_push_subscriptions_endpoint');
    await queryRunner.dropIndex('push_subscriptions', 'IDX_push_subscriptions_user_id');

    // Drop table
    await queryRunner.dropTable('push_subscriptions');
  }
}