import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddUserEncryptionKeyTable1735610000000 implements MigrationInterface {
  name = 'AddUserEncryptionKeyTable1735610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_encryption_keys table
    await queryRunner.createTable(
      new Table({
        name: 'user_encryption_keys',
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
            isUnique: true,
          },
          {
            name: 'public_key',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'key_version',
            type: 'integer',
            default: 1,
          },
          {
            name: 'algorithm',
            type: 'varchar',
            length: '50',
            default: "'RSA-OAEP'",
          },
          {
            name: 'key_size',
            type: 'integer',
            default: 2048,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_used_at',
            type: 'timestamp',
            isNullable: true,
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
      'user_encryption_keys',
      new Index({
        name: 'IDX_user_encryption_keys_user_id',
        columnNames: ['user_id'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'user_encryption_keys',
      new Index({
        name: 'IDX_user_encryption_keys_active',
        columnNames: ['is_active'],
        where: 'is_active = true',
      })
    );

    await queryRunner.createIndex(
      'user_encryption_keys',
      new Index({
        name: 'IDX_user_encryption_keys_expires_at',
        columnNames: ['expires_at'],
      })
    );

    await queryRunner.createIndex(
      'user_encryption_keys',
      new Index({
        name: 'IDX_user_encryption_keys_algorithm',
        columnNames: ['algorithm'],
      })
    );

    await queryRunner.createIndex(
      'user_encryption_keys',
      new Index({
        name: 'IDX_user_encryption_keys_user_active',
        columnNames: ['user_id', 'is_active'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('user_encryption_keys', 'IDX_user_encryption_keys_user_active');
    await queryRunner.dropIndex('user_encryption_keys', 'IDX_user_encryption_keys_algorithm');
    await queryRunner.dropIndex('user_encryption_keys', 'IDX_user_encryption_keys_expires_at');
    await queryRunner.dropIndex('user_encryption_keys', 'IDX_user_encryption_keys_active');
    await queryRunner.dropIndex('user_encryption_keys', 'IDX_user_encryption_keys_user_id');

    // Drop table
    await queryRunner.dropTable('user_encryption_keys');
  }
}