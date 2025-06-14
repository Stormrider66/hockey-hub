import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddPhysicalTestEntities1703030400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure UUID extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Check if tables already exist before creating them
    const definitionsTableExists = await queryRunner.hasTable('physical_test_definitions');
    const resultsTableExists = await queryRunner.hasTable('physical_test_results');

    if (!definitionsTableExists) {
      // Create definitions table
      await queryRunner.createTable(new Table({
        name: 'physical_test_definitions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'varchar', length: '255', isNullable: false },
          { name: 'category', type: 'varchar', length: '100', isNullable: false },
          { name: 'is_on_ice', type: 'boolean', default: false },
          { name: 'protocol', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'NOW()' },
          { name: 'updated_at', type: 'timestamptz', default: 'NOW()' },
        ],
      }), true);
    }

    if (!resultsTableExists) {
      // Create results table
      await queryRunner.createTable(new Table({
        name: 'physical_test_results',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'player_id', type: 'uuid', isNullable: false },
          { name: 'test_definition_id', type: 'uuid', isNullable: false },
          { name: 'value', type: 'decimal', precision: 10, scale: 2, isNullable: false },
          { name: 'timestamp', type: 'timestamptz', isNullable: false },
          { name: 'created_at', type: 'timestamptz', default: 'NOW()' },
          { name: 'updated_at', type: 'timestamptz', default: 'NOW()' },
        ],
      }), true);

      // Add foreign key to link results to definitions
      await queryRunner.createForeignKey('physical_test_results', new TableForeignKey({
        columnNames: ['test_definition_id'],
        referencedTableName: 'physical_test_definitions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }));
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('physical_test_results', true, true);
    await queryRunner.dropTable('physical_test_definitions', true, true);
  }
} 