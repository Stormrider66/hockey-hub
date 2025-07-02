import { MigrationInterface, QueryRunner, TableColumn, Index } from 'typeorm';

export class AddMessageEncryptionFields1735620000000 implements MigrationInterface {
  name = 'AddMessageEncryptionFields1735620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add encryption columns to messages table
    await queryRunner.addColumns('messages', [
      new TableColumn({
        name: 'is_encrypted',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'encrypted_content',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'encryption_iv',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'encryption_key',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'encryption_algorithm',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    ]);

    // Create index for encrypted messages
    await queryRunner.createIndex(
      'messages',
      new Index({
        name: 'IDX_messages_is_encrypted',
        columnNames: ['is_encrypted'],
      })
    );

    // Create index for conversation and encryption status
    await queryRunner.createIndex(
      'messages',
      new Index({
        name: 'IDX_messages_conversation_encrypted',
        columnNames: ['conversation_id', 'is_encrypted'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('messages', 'IDX_messages_conversation_encrypted');
    await queryRunner.dropIndex('messages', 'IDX_messages_is_encrypted');

    // Drop columns
    await queryRunner.dropColumns('messages', [
      'encryption_algorithm',
      'encryption_key',
      'encryption_iv',
      'encrypted_content',
      'is_encrypted',
    ]);
  }
}