import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddScheduleClarificationTables1735500003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create schedule_clarifications table
    await queryRunner.createTable(
      new Table({
        name: 'schedule_clarifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversation_id',
            type: 'uuid',
          },
          {
            name: 'event_id',
            type: 'uuid',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['schedule_conflict', 'time_change', 'location_change', 'cancellation', 
                   'weather_concern', 'transportation_coordination', 'general_inquiry', 'rescheduling_request'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['open', 'in_progress', 'resolved', 'cancelled', 'escalated'],
            default: "'open'",
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'urgent'],
            default: "'medium'",
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'team_id',
            type: 'uuid',
          },
          {
            name: 'initiated_by',
            type: 'uuid',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'event_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'conflict_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'weather_info',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'resolution',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'participant_ids',
            type: 'text[]',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'text[]',
            isNullable: true,
          },
          {
            name: 'deadline',
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
            name: 'deleted_at',
            type: 'timestamp',
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
            isNullable: true,
          },
          {
            name: 'last_ip_address',
            type: 'varchar',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['conversation_id'],
            referencedTableName: 'conversations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Create indexes for schedule_clarifications
    await queryRunner.createIndex(
      'schedule_clarifications',
      new Index({
        name: 'IDX_schedule_clarifications_event_type',
        columnNames: ['event_id', 'type'],
      })
    );

    await queryRunner.createIndex(
      'schedule_clarifications',
      new Index({
        name: 'IDX_schedule_clarifications_status_created',
        columnNames: ['status', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'schedule_clarifications',
      new Index({
        name: 'IDX_schedule_clarifications_org_team',
        columnNames: ['organization_id', 'team_id'],
      })
    );

    // Create carpool_offers table
    await queryRunner.createTable(
      new Table({
        name: 'carpool_offers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'schedule_clarification_id',
            type: 'uuid',
          },
          {
            name: 'driver_id',
            type: 'uuid',
          },
          {
            name: 'event_id',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['available', 'partially_filled', 'full', 'cancelled', 'completed'],
            default: "'available'",
          },
          {
            name: 'vehicle_type',
            type: 'enum',
            enum: ['car', 'suv', 'van', 'minibus', 'other'],
            default: "'car'",
          },
          {
            name: 'available_seats',
            type: 'int',
          },
          {
            name: 'occupied_seats',
            type: 'int',
            default: 0,
          },
          {
            name: 'pickup_location',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'pickup_coordinates',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'departure_time',
            type: 'time',
          },
          {
            name: 'return_time',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'is_round_trip',
            type: 'boolean',
            default: true,
          },
          {
            name: 'event_date',
            type: 'date',
          },
          {
            name: 'pickup_stops',
            type: 'text[]',
            isNullable: true,
          },
          {
            name: 'driver_preferences',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'contact_info',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'cancelled_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cancelled_at',
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
            name: 'deleted_at',
            type: 'timestamp',
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
            isNullable: true,
          },
          {
            name: 'last_ip_address',
            type: 'varchar',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['schedule_clarification_id'],
            referencedTableName: 'schedule_clarifications',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Create indexes for carpool_offers
    await queryRunner.createIndex(
      'carpool_offers',
      new Index({
        name: 'IDX_carpool_offers_clarification_status',
        columnNames: ['schedule_clarification_id', 'status'],
      })
    );

    await queryRunner.createIndex(
      'carpool_offers',
      new Index({
        name: 'IDX_carpool_offers_driver_date',
        columnNames: ['driver_id', 'event_date'],
      })
    );

    await queryRunner.createIndex(
      'carpool_offers',
      new Index({
        name: 'IDX_carpool_offers_location_date',
        columnNames: ['pickup_location', 'event_date'],
      })
    );

    // Create carpool_requests table
    await queryRunner.createTable(
      new Table({
        name: 'carpool_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'carpool_offer_id',
            type: 'uuid',
          },
          {
            name: 'requester_id',
            type: 'uuid',
          },
          {
            name: 'player_id',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
            default: "'pending'",
          },
          {
            name: 'seats_requested',
            type: 'int',
            default: 1,
          },
          {
            name: 'pickup_address',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'pickup_coordinates',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'needs_return_trip',
            type: 'boolean',
            default: true,
          },
          {
            name: 'special_requirements',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'response_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'responded_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'cancelled_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cancelled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'confirmed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'feedback',
            type: 'jsonb',
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
            name: 'deleted_at',
            type: 'timestamp',
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
            isNullable: true,
          },
          {
            name: 'last_ip_address',
            type: 'varchar',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['carpool_offer_id'],
            referencedTableName: 'carpool_offers',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Create indexes for carpool_requests
    await queryRunner.createIndex(
      'carpool_requests',
      new Index({
        name: 'IDX_carpool_requests_offer_status',
        columnNames: ['carpool_offer_id', 'status'],
      })
    );

    await queryRunner.createIndex(
      'carpool_requests',
      new Index({
        name: 'IDX_carpool_requests_requester',
        columnNames: ['requester_id', 'created_at'],
      })
    );

    // Create availability_polls table
    await queryRunner.createTable(
      new Table({
        name: 'availability_polls',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'schedule_clarification_id',
            type: 'uuid',
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['date_time', 'time_only', 'location', 'general'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'closed', 'cancelled', 'decided'],
            default: "'active'",
          },
          {
            name: 'options',
            type: 'jsonb',
          },
          {
            name: 'target_user_ids',
            type: 'text[]',
            isNullable: true,
          },
          {
            name: 'deadline',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'allow_multiple_choices',
            type: 'boolean',
            default: false,
          },
          {
            name: 'anonymous_responses',
            type: 'boolean',
            default: true,
          },
          {
            name: 'show_results_immediately',
            type: 'boolean',
            default: true,
          },
          {
            name: 'final_decision',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'reminder_settings',
            type: 'jsonb',
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
          {
            name: 'closed_at',
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
            name: 'deleted_at',
            type: 'timestamp',
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
            isNullable: true,
          },
          {
            name: 'last_ip_address',
            type: 'varchar',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['schedule_clarification_id'],
            referencedTableName: 'schedule_clarifications',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Create indexes for availability_polls
    await queryRunner.createIndex(
      'availability_polls',
      new Index({
        name: 'IDX_availability_polls_clarification_status',
        columnNames: ['schedule_clarification_id', 'status'],
      })
    );

    await queryRunner.createIndex(
      'availability_polls',
      new Index({
        name: 'IDX_availability_polls_creator',
        columnNames: ['created_by', 'created_at'],
      })
    );

    // Create availability_responses table
    await queryRunner.createTable(
      new Table({
        name: 'availability_responses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'availability_poll_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'player_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'selected_option_ids',
            type: 'text[]',
          },
          {
            name: 'overall_status',
            type: 'enum',
            enum: ['available', 'not_available', 'maybe', 'no_response'],
            default: "'no_response'",
          },
          {
            name: 'option_preferences',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'comments',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'constraints',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_tentative',
            type: 'boolean',
            default: false,
          },
          {
            name: 'responded_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'updated_response_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notification_preferences',
            type: 'jsonb',
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
            name: 'deleted_at',
            type: 'timestamp',
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
            isNullable: true,
          },
          {
            name: 'last_ip_address',
            type: 'varchar',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['availability_poll_id'],
            referencedTableName: 'availability_polls',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        uniques: [
          {
            name: 'UQ_availability_response_poll_user',
            columnNames: ['availability_poll_id', 'user_id'],
          },
        ],
      }),
      true
    );

    // Create indexes for availability_responses
    await queryRunner.createIndex(
      'availability_responses',
      new Index({
        name: 'IDX_availability_responses_poll_user',
        columnNames: ['availability_poll_id', 'user_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('availability_responses', 'IDX_availability_responses_poll_user');
    await queryRunner.dropIndex('availability_polls', 'IDX_availability_polls_creator');
    await queryRunner.dropIndex('availability_polls', 'IDX_availability_polls_clarification_status');
    await queryRunner.dropIndex('carpool_requests', 'IDX_carpool_requests_requester');
    await queryRunner.dropIndex('carpool_requests', 'IDX_carpool_requests_offer_status');
    await queryRunner.dropIndex('carpool_offers', 'IDX_carpool_offers_location_date');
    await queryRunner.dropIndex('carpool_offers', 'IDX_carpool_offers_driver_date');
    await queryRunner.dropIndex('carpool_offers', 'IDX_carpool_offers_clarification_status');
    await queryRunner.dropIndex('schedule_clarifications', 'IDX_schedule_clarifications_org_team');
    await queryRunner.dropIndex('schedule_clarifications', 'IDX_schedule_clarifications_status_created');
    await queryRunner.dropIndex('schedule_clarifications', 'IDX_schedule_clarifications_event_type');

    // Drop tables
    await queryRunner.dropTable('availability_responses');
    await queryRunner.dropTable('availability_polls');
    await queryRunner.dropTable('carpool_requests');
    await queryRunner.dropTable('carpool_offers');
    await queryRunner.dropTable('schedule_clarifications');
  }
}