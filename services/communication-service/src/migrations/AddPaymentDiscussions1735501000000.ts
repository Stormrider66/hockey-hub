import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddPaymentDiscussions1735501000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_discussions table
    await queryRunner.createTable(
      new Table({
        name: 'payment_discussions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['invoice', 'payment_plan', 'dispute', 'receipt_request', 'refund_request', 'seasonal_fees', 'general_inquiry'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['open', 'in_progress', 'awaiting_response', 'resolved', 'closed', 'escalated'],
            default: "'open'",
          },
          {
            name: 'paymentStatus',
            type: 'enum',
            enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'],
            isNullable: true,
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
            name: 'paymentId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'invoiceId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'paymentPlanId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'outstandingAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            isNullable: true,
          },
          {
            name: 'parentUserId',
            type: 'uuid',
          },
          {
            name: 'billingStaffIds',
            type: 'uuid',
            isArray: true,
            default: 'ARRAY[]::uuid[]',
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
            name: 'conversationId',
            type: 'uuid',
          },
          {
            name: 'paymentPlanProposal',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'quickActions',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'attachedDocuments',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'auditLog',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'containsSensitiveInfo',
            type: 'boolean',
            default: false,
          },
          {
            name: 'complianceFlags',
            type: 'jsonb',
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
          {
            name: 'resolvedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'resolvedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'resolutionNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            name: 'FK_payment_discussion_conversation',
            columnNames: ['conversationId'],
            referencedTableName: 'conversations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Create indexes for payment_discussions
    await queryRunner.createIndex(
      'payment_discussions',
      new Index({
        name: 'IDX_payment_discussion_payment_status',
        columnNames: ['paymentId', 'status'],
      })
    );

    await queryRunner.createIndex(
      'payment_discussions',
      new Index({
        name: 'IDX_payment_discussion_parent_created',
        columnNames: ['parentUserId', 'createdAt'],
      })
    );

    await queryRunner.createIndex(
      'payment_discussions',
      new Index({
        name: 'IDX_payment_discussion_org_type',
        columnNames: ['organizationId', 'type'],
      })
    );

    // Create payment_discussion_attachments table
    await queryRunner.createTable(
      new Table({
        name: 'payment_discussion_attachments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'paymentDiscussionId',
            type: 'uuid',
          },
          {
            name: 'messageId',
            type: 'uuid',
          },
          {
            name: 'fileName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'fileType',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'fileSize',
            type: 'integer',
          },
          {
            name: 'fileUrl',
            type: 'text',
          },
          {
            name: 'documentType',
            type: 'enum',
            enum: ['invoice', 'receipt', 'statement', 'agreement', 'other'],
          },
          {
            name: 'isVerified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'verifiedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'verifiedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'uploadedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'uploadedBy',
            type: 'uuid',
          },
        ],
        foreignKeys: [
          {
            name: 'FK_attachment_payment_discussion',
            columnNames: ['paymentDiscussionId'],
            referencedTableName: 'payment_discussions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_attachment_message',
            columnNames: ['messageId'],
            referencedTableName: 'messages',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Create payment_discussion_reminders table
    await queryRunner.createTable(
      new Table({
        name: 'payment_discussion_reminders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'paymentDiscussionId',
            type: 'uuid',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['payment_due', 'response_needed', 'document_required', 'payment_plan_installment', 'follow_up', 'escalation_warning'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['scheduled', 'sent', 'acknowledged', 'cancelled', 'failed'],
            default: "'scheduled'",
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
            name: 'scheduledFor',
            type: 'timestamp',
          },
          {
            name: 'sentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'acknowledgedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'recipientIds',
            type: 'uuid',
            isArray: true,
          },
          {
            name: 'notificationChannels',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'retryCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'failureDetails',
            type: 'jsonb',
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
          {
            name: 'createdBy',
            type: 'uuid',
          },
          {
            name: 'cancelledBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'cancelledAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'cancellationReason',
            type: 'text',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            name: 'FK_reminder_payment_discussion',
            columnNames: ['paymentDiscussionId'],
            referencedTableName: 'payment_discussions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Create indexes for reminders
    await queryRunner.createIndex(
      'payment_discussion_reminders',
      new Index({
        name: 'IDX_reminder_discussion_status',
        columnNames: ['paymentDiscussionId', 'status'],
      })
    );

    await queryRunner.createIndex(
      'payment_discussion_reminders',
      new Index({
        name: 'IDX_reminder_scheduled_status',
        columnNames: ['scheduledFor', 'status'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('payment_discussion_reminders', 'IDX_reminder_scheduled_status');
    await queryRunner.dropIndex('payment_discussion_reminders', 'IDX_reminder_discussion_status');
    await queryRunner.dropIndex('payment_discussions', 'IDX_payment_discussion_org_type');
    await queryRunner.dropIndex('payment_discussions', 'IDX_payment_discussion_parent_created');
    await queryRunner.dropIndex('payment_discussions', 'IDX_payment_discussion_payment_status');

    // Drop tables
    await queryRunner.dropTable('payment_discussion_reminders');
    await queryRunner.dropTable('payment_discussion_attachments');
    await queryRunner.dropTable('payment_discussions');
  }
}