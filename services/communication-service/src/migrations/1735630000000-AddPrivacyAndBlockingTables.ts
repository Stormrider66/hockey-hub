import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddPrivacyAndBlockingTables1735630000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create blocked_users table
    await queryRunner.createTable(
      new Table({
        name: 'blocked_users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'blocker_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'blocked_user_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true
          }
        ],
        uniques: [
          {
            name: 'UQ_blocked_users_blocker_blocked',
            columnNames: ['blocker_id', 'blocked_user_id']
          }
        ]
      }),
      true
    );

    // Create indexes for blocked_users
    await queryRunner.createIndex(
      'blocked_users',
      new Index({
        name: 'IDX_blocked_users_blocker_id',
        columnNames: ['blocker_id']
      })
    );

    await queryRunner.createIndex(
      'blocked_users',
      new Index({
        name: 'IDX_blocked_users_blocked_user_id',
        columnNames: ['blocked_user_id']
      })
    );

    // Create privacy_settings table
    await queryRunner.createTable(
      new Table({
        name: 'privacy_settings',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true
          },
          {
            name: 'who_can_message',
            type: 'enum',
            enum: ['everyone', 'team_only', 'contacts_only', 'no_one'],
            default: "'everyone'"
          },
          {
            name: 'online_visibility',
            type: 'enum',
            enum: ['everyone', 'team_only', 'contacts_only', 'no_one'],
            default: "'everyone'"
          },
          {
            name: 'show_read_receipts',
            type: 'boolean',
            default: true
          },
          {
            name: 'show_typing_indicators',
            type: 'boolean',
            default: true
          },
          {
            name: 'show_last_seen',
            type: 'boolean',
            default: true
          },
          {
            name: 'allow_profile_views',
            type: 'boolean',
            default: true
          },
          {
            name: 'block_screenshots',
            type: 'boolean',
            default: false
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('privacy_settings');
    await queryRunner.dropTable('blocked_users');
  }
}