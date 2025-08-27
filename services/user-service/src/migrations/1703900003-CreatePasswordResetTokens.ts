import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreatePasswordResetTokens1703900003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'token',
            type: 'varchar',
            isUnique: true
          },
          {
            name: 'userId',
            type: 'int'
          },
          {
            name: 'expiresAt',
            type: 'timestamp'
          },
          {
            name: 'used',
            type: 'boolean',
            default: false
          },
          {
            name: 'usedAt',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            isNullable: true
          },
          {
            name: 'userAgent',
            type: 'varchar',
            isNullable: true
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ],
        foreignKeys: [
          {
            name: 'FK_password_reset_user',
            columnNames: ['userId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE'
          }
        ]
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'password_reset_tokens',
      new Index({
        name: 'idx_password_reset_token',
        columnNames: ['token']
      })
    );

    await queryRunner.createIndex(
      'password_reset_tokens',
      new Index({
        name: 'idx_password_reset_expires',
        columnNames: ['expiresAt']
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('password_reset_tokens');
  }
}