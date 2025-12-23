// @ts-nocheck - Migration file with TypeORM table definitions
import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class AddEquipmentInventorySystem1736800000000 implements MigrationInterface {
  name = 'AddEquipmentInventorySystem1736800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create equipment_items table
    await queryRunner.createTable(
      new Table({
        name: 'equipment_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['ROWER', 'BIKE_ERG', 'SKI_ERG', 'ASSAULT_BIKE', 'TREADMILL', 'SPIN_BIKE', 'ELLIPTICAL', 'STAIR_CLIMBER'],
            isNullable: false
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'serialNumber',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_ORDER', 'RESERVED'],
            default: "'AVAILABLE'"
          },
          {
            name: 'facilityId',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'lastMaintenanceDate',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'nextMaintenanceDate',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'specifications',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true
          }
        ]
      }),
      true
    );

    // Create equipment_reservations table
    await queryRunner.createTable(
      new Table({
        name: 'equipment_reservations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'equipmentItemId',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'sessionId',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'playerId',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'reservedFrom',
            type: 'timestamp',
            isNullable: false
          },
          {
            name: 'reservedUntil',
            type: 'timestamp',
            isNullable: false
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['ACTIVE', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
            default: "'ACTIVE'"
          },
          {
            name: 'reservedBy',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'checkInTime',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'checkOutTime',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'sessionData',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true
          }
        ]
      }),
      true
    );

    // Create facility_equipment_config table
    await queryRunner.createTable(
      new Table({
        name: 'facility_equipment_config',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()'
          },
          {
            name: 'facilityId',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'equipmentType',
            type: 'enum',
            enum: ['ROWER', 'BIKE_ERG', 'SKI_ERG', 'ASSAULT_BIKE', 'TREADMILL', 'SPIN_BIKE', 'ELLIPTICAL', 'STAIR_CLIMBER'],
            isNullable: false
          },
          {
            name: 'totalCount',
            type: 'int',
            isNullable: false
          },
          {
            name: 'availableCount',
            type: 'int',
            default: 0
          },
          {
            name: 'defaultLocation',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'configuration',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'restrictions',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true
          },
          {
            name: 'lastInventoryCheck',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'managedBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()'
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true
          }
        ]
      }),
      true
    );

    // Create indexes for equipment_items
    await queryRunner.createIndex(
      'equipment_items',
      new Index('IDX_equipment_items_facility_type', ['facilityId', 'type'])
    );
    await queryRunner.createIndex(
      'equipment_items',
      new Index('IDX_equipment_items_status', ['status'])
    );
    await queryRunner.createIndex(
      'equipment_items',
      new Index('IDX_equipment_items_type', ['type'])
    );
    await queryRunner.createIndex(
      'equipment_items',
      new Index('IDX_equipment_items_facility', ['facilityId'])
    );

    // Create indexes for equipment_reservations
    await queryRunner.createIndex(
      'equipment_reservations',
      new Index('IDX_reservations_equipment_time', ['equipmentItemId', 'reservedFrom', 'reservedUntil'])
    );
    await queryRunner.createIndex(
      'equipment_reservations',
      new Index('IDX_reservations_session', ['sessionId'])
    );
    await queryRunner.createIndex(
      'equipment_reservations',
      new Index('IDX_reservations_player', ['playerId'])
    );
    await queryRunner.createIndex(
      'equipment_reservations',
      new Index('IDX_reservations_status', ['status'])
    );
    await queryRunner.createIndex(
      'equipment_reservations',
      new Index('IDX_reservations_time_range', ['reservedFrom', 'reservedUntil'])
    );
    await queryRunner.createIndex(
      'equipment_reservations',
      new Index('IDX_reservations_reserved_by', ['reservedBy'])
    );

    // Create indexes for facility_equipment_config
    await queryRunner.createIndex(
      'facility_equipment_config',
      new Index('IDX_facility_config_facility', ['facilityId'])
    );
    await queryRunner.createIndex(
      'facility_equipment_config',
      new Index('IDX_facility_config_equipment_type', ['equipmentType'])
    );

    // Create unique constraint for facility_equipment_config
    await queryRunner.createIndex(
      'facility_equipment_config',
      new Index('IDX_facility_config_unique', ['facilityId', 'equipmentType'], { isUnique: true })
    );

    // Create foreign key for equipment_reservations -> equipment_items
    await queryRunner.createForeignKey(
      'equipment_reservations',
      new ForeignKey({
        columnNames: ['equipmentItemId'],
        referencedTableName: 'equipment_items',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      })
    );

    // Create triggers for updated_at timestamps
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updatedAt = now();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_equipment_items_updated_at
          BEFORE UPDATE ON equipment_items
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_equipment_reservations_updated_at
          BEFORE UPDATE ON equipment_reservations
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_facility_equipment_config_updated_at
          BEFORE UPDATE ON facility_equipment_config
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);

    // Create function to automatically update available count in facility_equipment_config
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_equipment_available_count()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Update available count when equipment status changes
        IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
          UPDATE facility_equipment_config 
          SET availableCount = (
            SELECT COUNT(*) 
            FROM equipment_items 
            WHERE facilityId = NEW.facilityId 
              AND type = NEW.type 
              AND status = 'AVAILABLE' 
              AND isActive = true
          )
          WHERE facilityId = NEW.facilityId AND equipmentType = NEW.type;
        END IF;
        
        -- Update available count when equipment is created
        IF TG_OP = 'INSERT' THEN
          UPDATE facility_equipment_config 
          SET availableCount = (
            SELECT COUNT(*) 
            FROM equipment_items 
            WHERE facilityId = NEW.facilityId 
              AND type = NEW.type 
              AND status = 'AVAILABLE' 
              AND isActive = true
          )
          WHERE facilityId = NEW.facilityId AND equipmentType = NEW.type;
        END IF;
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER trigger_update_equipment_available_count
          AFTER INSERT OR UPDATE ON equipment_items
          FOR EACH ROW
          EXECUTE FUNCTION update_equipment_available_count();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers first
    await queryRunner.query('DROP TRIGGER IF EXISTS trigger_update_equipment_available_count ON equipment_items;');
    await queryRunner.query('DROP TRIGGER IF EXISTS update_facility_equipment_config_updated_at ON facility_equipment_config;');
    await queryRunner.query('DROP TRIGGER IF EXISTS update_equipment_reservations_updated_at ON equipment_reservations;');
    await queryRunner.query('DROP TRIGGER IF EXISTS update_equipment_items_updated_at ON equipment_items;');

    // Drop functions
    await queryRunner.query('DROP FUNCTION IF EXISTS update_equipment_available_count();');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_updated_at_column();');

    // Drop foreign keys
    const reservationTable = await queryRunner.getTable('equipment_reservations');
    const foreignKey = reservationTable?.foreignKeys.find(fk => fk.columnNames.indexOf('equipmentItemId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('equipment_reservations', foreignKey);
    }

    // Drop tables in reverse order
    await queryRunner.dropTable('facility_equipment_config');
    await queryRunner.dropTable('equipment_reservations');
    await queryRunner.dropTable('equipment_items');
  }
}