import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddPrivateCoachChannels1735500003000 implements MigrationInterface {
  name = 'AddPrivateCoachChannels1735500003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create coach_availability table
    await queryRunner.createTable(
      new Table({
        name: 'coach_availability',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'coachId',
            type: 'uuid',
          },
          {
            name: 'teamId',
            type: 'uuid',
          },
          {
            name: 'organizationId',
            type: 'uuid',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['office_hours', 'by_appointment', 'emergency', 'not_available'],
            default: "'office_hours'",
          },
          {
            name: 'dayOfWeek',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'startTime',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'endTime',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'specificDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'isRecurring',
            type: 'boolean',
            default: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'allowMeetingRequests',
            type: 'boolean',
            default: true,
          },
          {
            name: 'defaultMeetingDuration',
            type: 'int',
            default: 30,
          },
          {
            name: 'bufferTime',
            type: 'int',
            default: 15,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
        ],
      }),
      true
    );

    // Create meeting_requests table
    await queryRunner.createTable(
      new Table({
        name: 'meeting_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversationId',
            type: 'uuid',
          },
          {
            name: 'requesterId',
            type: 'uuid',
          },
          {
            name: 'coachId',
            type: 'uuid',
          },
          {
            name: 'playerId',
            type: 'uuid',
          },
          {
            name: 'teamId',
            type: 'uuid',
          },
          {
            name: 'organizationId',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'accepted', 'declined', 'rescheduled', 'cancelled', 'completed'],
            default: "'pending'",
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['in_person', 'video_call', 'phone_call'],
            default: "'in_person'",
          },
          {
            name: 'purpose',
            type: 'enum',
            enum: [
              'general_discussion',
              'performance_review',
              'injury_discussion',
              'academic_concern',
              'behavioral_concern',
              'progress_update',
              'emergency',
              'other',
            ],
            default: "'general_discussion'",
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'proposedDate',
            type: 'timestamp',
          },
          {
            name: 'alternateDate1',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'alternateDate2',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'scheduledDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'duration',
            type: 'int',
            default: 30,
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'meetingUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'coachNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'declineReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'rescheduleReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'respondedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create indexes for coach_availability
    await queryRunner.createIndex(
      'coach_availability',
      new Index({
        name: 'IDX_coach_availability_coach_team',
        columnNames: ['coachId', 'teamId'],
      })
    );

    await queryRunner.createIndex(
      'coach_availability',
      new Index({
        name: 'IDX_coach_availability_schedule',
        columnNames: ['dayOfWeek', 'startTime', 'endTime'],
      })
    );

    // Create indexes for meeting_requests
    await queryRunner.createIndex(
      'meeting_requests',
      new Index({
        name: 'IDX_meeting_requests_conversation',
        columnNames: ['conversationId'],
      })
    );

    await queryRunner.createIndex(
      'meeting_requests',
      new Index({
        name: 'IDX_meeting_requests_requester',
        columnNames: ['requesterId', 'status'],
      })
    );

    await queryRunner.createIndex(
      'meeting_requests',
      new Index({
        name: 'IDX_meeting_requests_coach',
        columnNames: ['coachId', 'status'],
      })
    );

    await queryRunner.createIndex(
      'meeting_requests',
      new Index({
        name: 'IDX_meeting_requests_scheduled',
        columnNames: ['scheduledDate', 'status'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('meeting_requests', 'IDX_meeting_requests_scheduled');
    await queryRunner.dropIndex('meeting_requests', 'IDX_meeting_requests_coach');
    await queryRunner.dropIndex('meeting_requests', 'IDX_meeting_requests_requester');
    await queryRunner.dropIndex('meeting_requests', 'IDX_meeting_requests_conversation');
    await queryRunner.dropIndex('coach_availability', 'IDX_coach_availability_schedule');
    await queryRunner.dropIndex('coach_availability', 'IDX_coach_availability_coach_team');

    // Drop tables
    await queryRunner.dropTable('meeting_requests');
    await queryRunner.dropTable('coach_availability');
  }
}