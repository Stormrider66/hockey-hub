import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAuditColumns1735500002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Define audit columns
    const auditColumns = [
      new TableColumn({
        name: 'created_by',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'updated_by',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'deleted_by',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'last_request_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
      new TableColumn({
        name: 'last_ip_address',
        type: 'varchar',
        length: '45',
        isNullable: true,
      }),
    ];

    // Tables that need audit columns
    const tablesToUpdate = [
      'conversations',
      'messages',
      'notifications',
      'notification_preferences',
      'notification_templates',
    ];

    // Add audit columns to each table
    for (const tableName of tablesToUpdate) {
      // Check if table exists
      const tableExists = await queryRunner.hasTable(tableName);
      if (!tableExists) {
        console.log(`Table ${tableName} does not exist, skipping...`);
        continue;
      }

      // Add columns if they don't exist
      for (const column of auditColumns) {
        const columnExists = await queryRunner.hasColumn(tableName, column.name);
        if (!columnExists) {
          // Skip created_by for tables that already have it
          if (column.name === 'created_by') {
            const hasCreatedBy = await queryRunner.hasColumn(tableName, 'created_by');
            if (hasCreatedBy) {
              continue;
            }
          }
          await queryRunner.addColumn(tableName, column);
        }
      }
    }

    // Add updated_at column to messages table if it doesn't exist
    const messagesHasUpdatedAt = await queryRunner.hasColumn('messages', 'updated_at');
    if (!messagesHasUpdatedAt) {
      await queryRunner.addColumn('messages', new TableColumn({
        name: 'updated_at',
        type: 'timestamp',
        default: 'CURRENT_TIMESTAMP',
      }));
    }

    // Add updated_at column to conversations table if it doesn't exist
    const conversationsHasUpdatedAt = await queryRunner.hasColumn('conversations', 'updated_at');
    if (!conversationsHasUpdatedAt) {
      // The table already has updated_at from the initial migration
    }

    // Update conversations table to remove NOT NULL constraint from created_by if needed
    await queryRunner.query(`
      ALTER TABLE conversations 
      ALTER COLUMN created_by DROP NOT NULL
    `);

    // Create indexes for audit columns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
      CREATE INDEX IF NOT EXISTS idx_conversations_updated_by ON conversations(updated_by);
      CREATE INDEX IF NOT EXISTS idx_conversations_deleted_at ON conversations(deleted_at);
      
      CREATE INDEX IF NOT EXISTS idx_messages_created_by ON messages(created_by);
      CREATE INDEX IF NOT EXISTS idx_messages_updated_by ON messages(updated_by);
      CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at);
      
      CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON notifications(created_by);
      CREATE INDEX IF NOT EXISTS idx_notifications_updated_by ON notifications(updated_by);
      CREATE INDEX IF NOT EXISTS idx_notifications_deleted_at ON notifications(deleted_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_conversations_created_by;
      DROP INDEX IF EXISTS idx_conversations_updated_by;
      DROP INDEX IF EXISTS idx_conversations_deleted_at;
      
      DROP INDEX IF EXISTS idx_messages_created_by;
      DROP INDEX IF EXISTS idx_messages_updated_by;
      DROP INDEX IF EXISTS idx_messages_deleted_at;
      
      DROP INDEX IF EXISTS idx_notifications_created_by;
      DROP INDEX IF EXISTS idx_notifications_updated_by;
      DROP INDEX IF EXISTS idx_notifications_deleted_at;
    `);

    // Remove audit columns
    const auditColumns = ['created_by', 'updated_by', 'deleted_by', 'last_request_id', 'last_ip_address'];
    const tablesToUpdate = [
      'conversations',
      'messages',
      'notifications',
      'notification_preferences',
      'notification_templates',
    ];

    for (const tableName of tablesToUpdate) {
      const tableExists = await queryRunner.hasTable(tableName);
      if (!tableExists) continue;

      for (const columnName of auditColumns) {
        const columnExists = await queryRunner.hasColumn(tableName, columnName);
        if (columnExists) {
          // Don't remove created_by from conversations as it's part of the initial schema
          if (tableName === 'conversations' && columnName === 'created_by') {
            // Add back NOT NULL constraint
            await queryRunner.query(`
              ALTER TABLE conversations 
              ALTER COLUMN created_by SET NOT NULL
            `);
            continue;
          }
          await queryRunner.dropColumn(tableName, columnName);
        }
      }
    }
  }
}