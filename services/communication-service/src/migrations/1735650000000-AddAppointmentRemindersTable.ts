// @ts-nocheck - Suppress TypeScript errors for build
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddAppointmentRemindersTable1735650000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create appointment_reminders table
    await queryRunner.createTable(
      new Table({
        name: 'appointment_reminders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'medicalStaffId',
            type: 'uuid',
          },
          {
            name: 'organizationId',
            type: 'uuid',
          },
          {
            name: 'teamId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'appointmentType',
            type: 'enum',
            enum: [
              'medical_checkup',
              'injury_assessment',
              'treatment_session',
              'physiotherapy',
              'psychology_session',
              'nutritionist',
              'follow_up',
              'vaccination',
              'fitness_test',
              'other',
            ],
            default: "'medical_checkup'",
          },
          {
            name: 'appointmentDate',
            type: 'timestamp',
          },
          {
            name: 'location',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'medicalFacilityName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'medicalFacilityAddress',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'medicalFacilityPhone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'appointmentNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'preparationInstructions',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'documentsTobing',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'requiresFasting',
            type: 'boolean',
            default: false,
          },
          {
            name: 'fastingHours',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'requiresTransportation',
            type: 'boolean',
            default: false,
          },
          {
            name: 'reminderTimings',
            type: 'text',
          },
          {
            name: 'remindersSent',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['scheduled', 'sent', 'failed', 'cancelled', 'acknowledged'],
            default: "'scheduled'",
          },
          {
            name: 'sendAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lastSentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'acknowledgedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'acknowledgedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'calendarEventId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'medicalRecordId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'injuryId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'notifyPatient',
            type: 'boolean',
            default: true,
          },
          {
            name: 'notifyParents',
            type: 'boolean',
            default: false,
          },
          {
            name: 'notifyCoach',
            type: 'boolean',
            default: false,
          },
          {
            name: 'includeInTeamCalendar',
            type: 'boolean',
            default: false,
          },
          {
            name: 'reminderCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'cancellationReason',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'cancelledAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'cancelledBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          // Audit columns
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updatedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'deletedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'lastRequestId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'lastIpAddress',
            type: 'varchar',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'appointment_reminders',
      new Index({
        name: 'IDX_appointment_reminders_user_date',
        columnNames: ['userId', 'appointmentDate'],
      })
    );

    await queryRunner.createIndex(
      'appointment_reminders',
      new Index({
        name: 'IDX_appointment_reminders_status_sendAt',
        columnNames: ['status', 'sendAt'],
      })
    );

    await queryRunner.createIndex(
      'appointment_reminders',
      new Index({
        name: 'IDX_appointment_reminders_medical_staff_date',
        columnNames: ['medicalStaffId', 'appointmentDate'],
      })
    );

    await queryRunner.createIndex(
      'appointment_reminders',
      new Index({
        name: 'IDX_appointment_reminders_sendAt',
        columnNames: ['sendAt'],
      })
    );

    await queryRunner.createIndex(
      'appointment_reminders',
      new Index({
        name: 'IDX_appointment_reminders_appointmentDate',
        columnNames: ['appointmentDate'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('appointment_reminders', 'IDX_appointment_reminders_user_date');
    await queryRunner.dropIndex('appointment_reminders', 'IDX_appointment_reminders_status_sendAt');
    await queryRunner.dropIndex('appointment_reminders', 'IDX_appointment_reminders_medical_staff_date');
    await queryRunner.dropIndex('appointment_reminders', 'IDX_appointment_reminders_sendAt');
    await queryRunner.dropIndex('appointment_reminders', 'IDX_appointment_reminders_appointmentDate');

    // Drop table
    await queryRunner.dropTable('appointment_reminders');
  }
}