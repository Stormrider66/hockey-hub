import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddParentCommunicationTables1735900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create parent_communications table
    await queryRunner.createTable(
      new Table({
        name: 'parent_communications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'organizationId',
            type: 'uuid'
          },
          {
            name: 'teamId',
            type: 'uuid'
          },
          {
            name: 'coachId',
            type: 'uuid'
          },
          {
            name: 'playerId',
            type: 'uuid'
          },
          {
            name: 'parentId',
            type: 'uuid'
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['in_person_meeting', 'phone_call', 'video_call', 'email', 'chat_message', 'text_message', 'other'],
            default: "'in_person_meeting'"
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['academic', 'behavioral', 'medical', 'performance', 'administrative', 'social', 'other'],
            default: "'other'"
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['low', 'medium', 'high', 'urgent'],
            default: "'medium'"
          },
          {
            name: 'communicationDate',
            type: 'timestamp'
          },
          {
            name: 'durationMinutes',
            type: 'int',
            isNullable: true
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'summary',
            type: 'text'
          },
          {
            name: 'detailedNotes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'additionalParticipants',
            type: 'json',
            isNullable: true
          },
          {
            name: 'actionItems',
            type: 'json',
            isNullable: true
          },
          {
            name: 'followUpDate',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'followUpNotes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'isConfidential',
            type: 'boolean',
            default: false
          },
          {
            name: 'requiresFollowUp',
            type: 'boolean',
            default: false
          },
          {
            name: 'isFollowUpComplete',
            type: 'boolean',
            default: false
          },
          {
            name: 'tags',
            type: 'json',
            isNullable: true
          },
          {
            name: 'location',
            type: 'varchar',
            length: '100',
            isNullable: true
          },
          {
            name: 'phoneNumber',
            type: 'varchar',
            length: '50',
            isNullable: true
          },
          {
            name: 'emailThreadId',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'meetingLink',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'updatedBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'deletedBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'lastRequestId',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'lastIpAddress',
            type: 'varchar',
            length: '255',
            isNullable: true
          }
        ]
      }),
      true
    );

    // Create indexes for parent_communications
    await queryRunner.createIndex('parent_communications', new Index({
      name: 'IDX_parent_comm_org_coach',
      columnNames: ['organizationId', 'coachId']
    }));
    await queryRunner.createIndex('parent_communications', new Index({
      name: 'IDX_parent_comm_org_player',
      columnNames: ['organizationId', 'playerId']
    }));
    await queryRunner.createIndex('parent_communications', new Index({
      name: 'IDX_parent_comm_org_parent',
      columnNames: ['organizationId', 'parentId']
    }));
    await queryRunner.createIndex('parent_communications', new Index({
      name: 'IDX_parent_comm_org_date',
      columnNames: ['organizationId', 'communicationDate']
    }));
    await queryRunner.createIndex('parent_communications', new Index({
      name: 'IDX_parent_comm_org_category',
      columnNames: ['organizationId', 'category']
    }));
    await queryRunner.createIndex('parent_communications', new Index({
      name: 'IDX_parent_comm_org_type',
      columnNames: ['organizationId', 'type']
    }));

    // Create parent_communication_attachments table
    await queryRunner.createTable(
      new Table({
        name: 'parent_communication_attachments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'communicationId',
            type: 'uuid'
          },
          {
            name: 'fileName',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'fileUrl',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'fileType',
            type: 'varchar',
            length: '50'
          },
          {
            name: 'fileSize',
            type: 'int'
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'updatedBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'deletedBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'lastRequestId',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'lastIpAddress',
            type: 'varchar',
            length: '255',
            isNullable: true
          }
        ],
        foreignKeys: [
          {
            columnNames: ['communicationId'],
            referencedTableName: 'parent_communications',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE'
          }
        ]
      }),
      true
    );

    // Create index for attachments
    await queryRunner.createIndex('parent_communication_attachments', new Index({
      name: 'IDX_parent_comm_attach_comm',
      columnNames: ['communicationId']
    }));

    // Create parent_communication_reminders table
    await queryRunner.createTable(
      new Table({
        name: 'parent_communication_reminders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'communicationId',
            type: 'uuid'
          },
          {
            name: 'reminderDate',
            type: 'timestamp'
          },
          {
            name: 'reminderType',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'reminderMessage',
            type: 'text'
          },
          {
            name: 'isCompleted',
            type: 'boolean',
            default: false
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'completedBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'completionNotes',
            type: 'text',
            isNullable: true
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'updatedBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'deletedBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'lastRequestId',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'lastIpAddress',
            type: 'varchar',
            length: '255',
            isNullable: true
          }
        ],
        foreignKeys: [
          {
            columnNames: ['communicationId'],
            referencedTableName: 'parent_communications',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE'
          }
        ]
      }),
      true
    );

    // Create indexes for reminders
    await queryRunner.createIndex('parent_communication_reminders', new Index({
      name: 'IDX_parent_comm_reminder_comm',
      columnNames: ['communicationId']
    }));
    await queryRunner.createIndex('parent_communication_reminders', new Index({
      name: 'IDX_parent_comm_reminder_date',
      columnNames: ['reminderDate']
    }));
    await queryRunner.createIndex('parent_communication_reminders', new Index({
      name: 'IDX_parent_comm_reminder_completed',
      columnNames: ['isCompleted']
    }));

    // Create parent_communication_templates table
    await queryRunner.createTable(
      new Table({
        name: 'parent_communication_templates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'organizationId',
            type: 'uuid'
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['in_person_meeting', 'phone_call', 'video_call', 'email', 'chat_message', 'text_message', 'other']
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['academic', 'behavioral', 'medical', 'performance', 'administrative', 'social', 'other']
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'content',
            type: 'text'
          },
          {
            name: 'variables',
            type: 'json',
            isNullable: true
          },
          {
            name: 'actionItemTemplates',
            type: 'json',
            isNullable: true
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true
          },
          {
            name: 'usageCount',
            type: 'int',
            default: 0
          },
          {
            name: 'lastUsedAt',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'updatedBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'deletedBy',
            type: 'uuid',
            isNullable: true
          },
          {
            name: 'lastRequestId',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'lastIpAddress',
            type: 'varchar',
            length: '255',
            isNullable: true
          }
        ]
      }),
      true
    );

    // Create indexes for templates
    await queryRunner.createIndex('parent_communication_templates', new Index({
      name: 'IDX_parent_comm_template_org_active',
      columnNames: ['organizationId', 'isActive']
    }));
    await queryRunner.createIndex('parent_communication_templates', new Index({
      name: 'IDX_parent_comm_template_org_category',
      columnNames: ['organizationId', 'category']
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes and tables in reverse order
    await queryRunner.dropTable('parent_communication_reminders');
    await queryRunner.dropTable('parent_communication_attachments');
    await queryRunner.dropTable('parent_communication_templates');
    await queryRunner.dropTable('parent_communications');
  }
}