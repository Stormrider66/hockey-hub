import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class InitialMedicalSchema1735500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create injuries table
    await queryRunner.createTable(
      new Table({
        name: 'injuries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'player_id',
            type: 'uuid',
          },
          {
            name: 'team_id',
            type: 'uuid',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'body_part',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'side',
            type: 'enum',
            enum: ['left', 'right', 'both', 'n/a'],
            default: "'n/a'",
          },
          {
            name: 'severity',
            type: 'enum',
            enum: ['minor', 'moderate', 'severe', 'critical'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'recovering', 'resolved', 'chronic'],
            default: "'active'",
          },
          {
            name: 'injury_date',
            type: 'date',
          },
          {
            name: 'incident_description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'mechanism_of_injury',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'diagnosis',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'initial_treatment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'expected_recovery_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'actual_recovery_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'reported_by',
            type: 'uuid',
          },
          {
            name: 'medical_staff_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'attachments',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'deleted_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'last_request_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'last_ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create treatments table
    await queryRunner.createTable(
      new Table({
        name: 'treatments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'injury_id',
            type: 'uuid',
          },
          {
            name: 'player_id',
            type: 'uuid',
          },
          {
            name: 'medical_staff_id',
            type: 'uuid',
          },
          {
            name: 'treatment_date',
            type: 'timestamp',
          },
          {
            name: 'treatment_type',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'duration_minutes',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'medications',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'exercises',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'equipment_used',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'progress_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'follow_up_required',
            type: 'boolean',
            default: false,
          },
          {
            name: 'follow_up_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'attachments',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'last_request_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'last_ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create player_availability table
    await queryRunner.createTable(
      new Table({
        name: 'player_availability',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'player_id',
            type: 'uuid',
          },
          {
            name: 'team_id',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['available', 'limited', 'unavailable', 'day_to_day'],
            default: "'available'",
          },
          {
            name: 'start_date',
            type: 'date',
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'injury_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'limitations',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'return_to_play_protocol',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'medical_clearance_required',
            type: 'boolean',
            default: false,
          },
          {
            name: 'medical_clearance_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'cleared_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'last_request_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'last_ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create wellness_entries table
    await queryRunner.createTable(
      new Table({
        name: 'wellness_entries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'player_id',
            type: 'uuid',
          },
          {
            name: 'team_id',
            type: 'uuid',
          },
          {
            name: 'entry_date',
            type: 'date',
          },
          {
            name: 'sleep_hours',
            type: 'decimal',
            precision: 3,
            scale: 1,
            isNullable: true,
          },
          {
            name: 'sleep_quality',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'fatigue_level',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'muscle_soreness',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'stress_level',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'mood',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'hydration_level',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'nutrition_quality',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'energy_level',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'hrv',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'resting_heart_rate',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'weight',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'body_temperature',
            type: 'decimal',
            precision: 4,
            scale: 1,
            isNullable: true,
          },
          {
            name: 'wellness_score',
            type: 'decimal',
            precision: 4,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'custom_metrics',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_flagged',
            type: 'boolean',
            default: false,
          },
          {
            name: 'flag_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reviewed_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'reviewed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'last_request_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'last_ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create medical_reports table
    await queryRunner.createTable(
      new Table({
        name: 'medical_reports',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'player_id',
            type: 'uuid',
          },
          {
            name: 'team_id',
            type: 'uuid',
          },
          {
            name: 'report_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'report_date',
            type: 'date',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'injury_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'medical_staff_id',
            type: 'uuid',
          },
          {
            name: 'attachments',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_confidential',
            type: 'boolean',
            default: false,
          },
          {
            name: 'shared_with',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'last_request_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'last_ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex('injuries', new Index({
      name: 'IDX_injuries_player_id',
      columnNames: ['player_id'],
    }));

    await queryRunner.createIndex('injuries', new Index({
      name: 'IDX_injuries_team_id',
      columnNames: ['team_id'],
    }));

    await queryRunner.createIndex('injuries', new Index({
      name: 'IDX_injuries_status',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('injuries', new Index({
      name: 'IDX_injuries_injury_date',
      columnNames: ['injury_date'],
    }));

    await queryRunner.createIndex('treatments', new Index({
      name: 'IDX_treatments_injury_id',
      columnNames: ['injury_id'],
    }));

    await queryRunner.createIndex('treatments', new Index({
      name: 'IDX_treatments_player_id',
      columnNames: ['player_id'],
    }));

    await queryRunner.createIndex('treatments', new Index({
      name: 'IDX_treatments_treatment_date',
      columnNames: ['treatment_date'],
    }));

    await queryRunner.createIndex('player_availability', new Index({
      name: 'IDX_player_availability_player_id',
      columnNames: ['player_id'],
    }));

    await queryRunner.createIndex('player_availability', new Index({
      name: 'IDX_player_availability_team_id',
      columnNames: ['team_id'],
    }));

    await queryRunner.createIndex('player_availability', new Index({
      name: 'IDX_player_availability_status',
      columnNames: ['status'],
    }));

    await queryRunner.createIndex('player_availability', new Index({
      name: 'IDX_player_availability_dates',
      columnNames: ['start_date', 'end_date'],
    }));

    await queryRunner.createIndex('wellness_entries', new Index({
      name: 'IDX_wellness_entries_player_id',
      columnNames: ['player_id'],
    }));

    await queryRunner.createIndex('wellness_entries', new Index({
      name: 'IDX_wellness_entries_team_id',
      columnNames: ['team_id'],
    }));

    await queryRunner.createIndex('wellness_entries', new Index({
      name: 'IDX_wellness_entries_entry_date',
      columnNames: ['entry_date'],
    }));

    await queryRunner.createIndex('wellness_entries', new Index({
      name: 'IDX_wellness_entries_is_flagged',
      columnNames: ['is_flagged'],
    }));

    await queryRunner.createIndex('medical_reports', new Index({
      name: 'IDX_medical_reports_player_id',
      columnNames: ['player_id'],
    }));

    await queryRunner.createIndex('medical_reports', new Index({
      name: 'IDX_medical_reports_report_date',
      columnNames: ['report_date'],
    }));

    // Add unique constraint for wellness entries (one per player per day)
    await queryRunner.createIndex('wellness_entries', new Index({
      name: 'UQ_wellness_entries_player_date',
      columnNames: ['player_id', 'entry_date'],
      isUnique: true,
    }));

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE treatments
      ADD CONSTRAINT FK_treatments_injury
      FOREIGN KEY (injury_id) REFERENCES injuries(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE player_availability
      ADD CONSTRAINT FK_player_availability_injury
      FOREIGN KEY (injury_id) REFERENCES injuries(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE medical_reports
      ADD CONSTRAINT FK_medical_reports_injury
      FOREIGN KEY (injury_id) REFERENCES injuries(id) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query('ALTER TABLE medical_reports DROP CONSTRAINT FK_medical_reports_injury');
    await queryRunner.query('ALTER TABLE player_availability DROP CONSTRAINT FK_player_availability_injury');
    await queryRunner.query('ALTER TABLE treatments DROP CONSTRAINT FK_treatments_injury');

    // Drop tables
    await queryRunner.dropTable('medical_reports');
    await queryRunner.dropTable('wellness_entries');
    await queryRunner.dropTable('player_availability');
    await queryRunner.dropTable('treatments');
    await queryRunner.dropTable('injuries');
  }
}