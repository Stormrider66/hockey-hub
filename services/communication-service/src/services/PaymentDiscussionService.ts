import { Repository, In, IsNull, Not, LessThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Logger } from '@hockey-hub/shared-lib';
import {
  PaymentDiscussion,
  PaymentDiscussionAttachment,
  PaymentDiscussionType,
  PaymentDiscussionStatus,
  PaymentStatus,
  PaymentDiscussionReminder,
  PaymentReminderType,
  PaymentReminderStatus,
  Conversation,
  ConversationType,
  ConversationParticipant,
  ParticipantRole,
  Message,
  MessageType,
} from '../entities';
import { ConversationService } from './ConversationService';
import { NotificationService } from './NotificationService';

interface CreatePaymentDiscussionDto {
  type: PaymentDiscussionType;
  title: string;
  description?: string;
  paymentId?: string;
  invoiceId?: string;
  paymentPlanId?: string;
  amount?: number;
  outstandingAmount?: number;
  currency?: string;
  parentUserId: string;
  billingStaffIds: string[];
  organizationId: string;
  teamId?: string;
  metadata?: any;
}

interface UpdatePaymentDiscussionDto {
  status?: PaymentDiscussionStatus;
  paymentStatus?: PaymentStatus;
  paymentPlanProposal?: any;
  quickActions?: any;
  resolvedBy?: string;
  resolutionNotes?: string;
  metadata?: any;
}

interface CreatePaymentReminderDto {
  paymentDiscussionId: string;
  type: PaymentReminderType;
  subject: string;
  message: string;
  scheduledFor: Date;
  recipientIds: string[];
  notificationChannels?: any;
  metadata?: any;
}

interface AttachDocumentDto {
  paymentDiscussionId: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  documentType: 'invoice' | 'receipt' | 'statement' | 'agreement' | 'other';
  uploadedBy: string;
  metadata?: any;
}

export class PaymentDiscussionService {
  private discussionRepo: Repository<PaymentDiscussion>;
  private attachmentRepo: Repository<PaymentDiscussionAttachment>;
  private reminderRepo: Repository<PaymentDiscussionReminder>;
  private conversationService: ConversationService;
  private notificationService: NotificationService;
  private logger: Logger;

  constructor() {
    this.discussionRepo = AppDataSource.getRepository(PaymentDiscussion);
    this.attachmentRepo = AppDataSource.getRepository(PaymentDiscussionAttachment);
    this.reminderRepo = AppDataSource.getRepository(PaymentDiscussionReminder);
    this.conversationService = new ConversationService();
    this.notificationService = new NotificationService();
    this.logger = new Logger('PaymentDiscussionService');
  }

  async createPaymentDiscussion(
    data: CreatePaymentDiscussionDto,
    createdBy: string
  ): Promise<PaymentDiscussion> {
    try {
      // Create the conversation first
      const conversation = await this.conversationService.createConversation(createdBy, {
        type: ConversationType.PAYMENT_DISCUSSION,
        name: data.title,
        description: data.description,
        participant_ids: [data.parentUserId, ...data.billingStaffIds],
        metadata: {
          paymentId: data.paymentId,
          invoiceId: data.invoiceId,
          paymentAmount: data.amount,
          billingStaffIds: data.billingStaffIds,
          organizationId: data.organizationId,
          teamId: data.teamId,
        },
      });

      // Note: In production, we would need to update participant roles for billing staff to be moderators
      // This would require extending ConversationService with an updateParticipantRole method

      // Create the payment discussion
      const discussion = this.discussionRepo.create({
        ...data,
        conversationId: conversation.id,
        status: PaymentDiscussionStatus.OPEN,
        containsSensitiveInfo: true,
        complianceFlags: {
          requiresEncryption: true,
          requiresSecureTransmission: true,
          retentionPeriodDays: 2555, // 7 years for financial records
        },
        auditLog: [{
          action: 'DISCUSSION_CREATED',
          performedBy: createdBy,
          performedAt: new Date(),
          details: { type: data.type },
        }],
      });

      const savedDiscussion = await this.discussionRepo.save(discussion);

      // Update conversation metadata with discussion ID
      await this.conversationService.updateConversation(conversation.id, createdBy, {
        metadata: {
          ...conversation.metadata,
          paymentDiscussionId: savedDiscussion.id,
        },
      });

      // Send initial notification
      await this.notificationService.sendNotification({
        userId: data.parentUserId,
        type: 'payment_discussion',
        title: 'New Payment Discussion',
        message: `A new payment discussion "${data.title}" has been created.`,
        priority: 'high',
        metadata: {
          discussionId: savedDiscussion.id,
          conversationId: conversation.id,
        },
      });

      // Log the action
      this.logger.info('Payment discussion created', {
        discussionId: savedDiscussion.id,
        type: data.type,
        parentUserId: data.parentUserId,
      });

      return savedDiscussion;
    } catch (error) {
      this.logger.error('Error creating payment discussion', error);
      throw error;
    }
  }

  async getPaymentDiscussion(id: string): Promise<PaymentDiscussion | null> {
    return this.discussionRepo.findOne({
      where: { id },
      relations: ['conversation'],
    });
  }

  async getPaymentDiscussions(filters: {
    parentUserId?: string;
    organizationId?: string;
    status?: PaymentDiscussionStatus;
    type?: PaymentDiscussionType;
    paymentId?: string;
    invoiceId?: string;
  }): Promise<PaymentDiscussion[]> {
    const query = this.discussionRepo.createQueryBuilder('discussion')
      .leftJoinAndSelect('discussion.conversation', 'conversation');

    if (filters.parentUserId) {
      query.andWhere('discussion.parentUserId = :parentUserId', {
        parentUserId: filters.parentUserId,
      });
    }

    if (filters.organizationId) {
      query.andWhere('discussion.organizationId = :organizationId', {
        organizationId: filters.organizationId,
      });
    }

    if (filters.status) {
      query.andWhere('discussion.status = :status', { status: filters.status });
    }

    if (filters.type) {
      query.andWhere('discussion.type = :type', { type: filters.type });
    }

    if (filters.paymentId) {
      query.andWhere('discussion.paymentId = :paymentId', {
        paymentId: filters.paymentId,
      });
    }

    if (filters.invoiceId) {
      query.andWhere('discussion.invoiceId = :invoiceId', {
        invoiceId: filters.invoiceId,
      });
    }

    query.orderBy('discussion.createdAt', 'DESC');

    return query.getMany();
  }

  async updatePaymentDiscussion(
    id: string,
    data: UpdatePaymentDiscussionDto,
    updatedBy: string
  ): Promise<PaymentDiscussion> {
    const discussion = await this.getPaymentDiscussion(id);
    if (!discussion) {
      throw new Error('Payment discussion not found');
    }

    // Add audit log entry
    const auditEntry = {
      action: 'DISCUSSION_UPDATED',
      performedBy: updatedBy,
      performedAt: new Date(),
      details: data,
    };

    // Handle status changes
    if (data.status === PaymentDiscussionStatus.RESOLVED && !discussion.resolvedAt) {
      data.resolvedBy = updatedBy;
      (data as any).resolvedAt = new Date();
    }

    await this.discussionRepo.update(id, {
      ...data,
      auditLog: [...discussion.auditLog, auditEntry],
    });

    const updated = await this.getPaymentDiscussion(id);

    // Send notification for status changes
    if (data.status && data.status !== discussion.status) {
      await this.notificationService.sendNotification({
        userId: discussion.parentUserId,
        type: 'payment_discussion',
        title: 'Payment Discussion Updated',
        message: `Your payment discussion "${discussion.title}" status has been updated to ${data.status}.`,
        priority: 'medium',
        metadata: {
          discussionId: id,
          conversationId: discussion.conversationId,
          newStatus: data.status,
        },
      });
    }

    return updated!;
  }

  async attachDocument(data: AttachDocumentDto): Promise<PaymentDiscussionAttachment> {
    const discussion = await this.getPaymentDiscussion(data.paymentDiscussionId);
    if (!discussion) {
      throw new Error('Payment discussion not found');
    }

    const attachment = this.attachmentRepo.create(data);
    const saved = await this.attachmentRepo.save(attachment);

    // Update discussion with attached document info
    const attachedDocuments = discussion.attachedDocuments || [];
    attachedDocuments.push({
      id: saved.id,
      type: data.documentType,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      uploadedBy: data.uploadedBy,
      uploadedAt: new Date(),
    });

    await this.discussionRepo.update(discussion.id, {
      attachedDocuments,
      auditLog: [
        ...discussion.auditLog,
        {
          action: 'DOCUMENT_ATTACHED',
          performedBy: data.uploadedBy,
          performedAt: new Date(),
          details: {
            fileName: data.fileName,
            documentType: data.documentType,
          },
        },
      ],
    });

    this.logger.info('Document attached to payment discussion', {
      discussionId: data.paymentDiscussionId,
      attachmentId: saved.id,
      documentType: data.documentType,
    });

    return saved;
  }

  async verifyDocument(
    attachmentId: string,
    verifiedBy: string
  ): Promise<PaymentDiscussionAttachment> {
    const attachment = await this.attachmentRepo.findOne({
      where: { id: attachmentId },
      relations: ['paymentDiscussion'],
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    attachment.isVerified = true;
    attachment.verifiedBy = verifiedBy;
    attachment.verifiedAt = new Date();

    const saved = await this.attachmentRepo.save(attachment);

    // Update discussion audit log
    const discussion = attachment.paymentDiscussion;
    await this.discussionRepo.update(discussion.id, {
      auditLog: [
        ...discussion.auditLog,
        {
          action: 'DOCUMENT_VERIFIED',
          performedBy: verifiedBy,
          performedAt: new Date(),
          details: {
            attachmentId,
            fileName: attachment.fileName,
          },
        },
      ],
    });

    return saved;
  }

  async createReminder(
    data: CreatePaymentReminderDto,
    createdBy: string
  ): Promise<PaymentDiscussionReminder> {
    const reminder = this.reminderRepo.create({
      ...data,
      createdBy,
      status: PaymentReminderStatus.SCHEDULED,
    });

    const saved = await this.reminderRepo.save(reminder);

    this.logger.info('Payment reminder created', {
      reminderId: saved.id,
      discussionId: data.paymentDiscussionId,
      scheduledFor: data.scheduledFor,
    });

    return saved;
  }

  async processScheduledReminders(): Promise<void> {
    const now = new Date();
    const reminders = await this.reminderRepo.find({
      where: {
        status: PaymentReminderStatus.SCHEDULED,
        scheduledFor: LessThan(now),
      },
      relations: ['paymentDiscussion'],
    });

    for (const reminder of reminders) {
      try {
        // Send notifications through various channels
        for (const recipientId of reminder.recipientIds) {
          await this.notificationService.sendNotification({
            userId: recipientId,
            type: 'payment_reminder',
            title: reminder.subject,
            message: reminder.message,
            priority: 'high',
            metadata: {
              discussionId: reminder.paymentDiscussionId,
              reminderType: reminder.type,
              ...reminder.metadata,
            },
          });
        }

        // Update reminder status
        reminder.status = PaymentReminderStatus.SENT;
        reminder.sentAt = new Date();
        await this.reminderRepo.save(reminder);

        this.logger.info('Payment reminder sent', {
          reminderId: reminder.id,
          recipientCount: reminder.recipientIds.length,
        });
      } catch (error) {
        this.logger.error('Error sending payment reminder', {
          reminderId: reminder.id,
          error,
        });

        // Update retry count and failure details
        reminder.retryCount++;
        reminder.failureDetails = {
          lastAttemptAt: new Date(),
          errorMessage: error.message,
        };
        await this.reminderRepo.save(reminder);
      }
    }
  }

  async proposePaymentPlan(
    discussionId: string,
    proposal: {
      installments: Array<{
        amount: number;
        dueDate: Date;
        description?: string;
      }>;
      notes?: string;
    },
    proposedBy: string
  ): Promise<PaymentDiscussion> {
    const discussion = await this.getPaymentDiscussion(discussionId);
    if (!discussion) {
      throw new Error('Payment discussion not found');
    }

    const paymentPlanProposal = {
      proposedBy,
      proposedAt: new Date(),
      installments: proposal.installments,
      notes: proposal.notes,
      approved: false,
    };

    await this.discussionRepo.update(discussionId, {
      paymentPlanProposal,
      status: PaymentDiscussionStatus.AWAITING_RESPONSE,
      auditLog: [
        ...discussion.auditLog,
        {
          action: 'PAYMENT_PLAN_PROPOSED',
          performedBy: proposedBy,
          performedAt: new Date(),
          details: {
            totalAmount: proposal.installments.reduce((sum, i) => sum + i.amount, 0),
            installmentCount: proposal.installments.length,
          },
        },
      ],
    });

    // Send notification to billing staff
    for (const staffId of discussion.billingStaffIds) {
      await this.notificationService.sendNotification({
        userId: staffId,
        type: 'payment_discussion',
        title: 'New Payment Plan Proposal',
        message: `A payment plan has been proposed for discussion "${discussion.title}".`,
        priority: 'high',
        metadata: {
          discussionId,
          conversationId: discussion.conversationId,
        },
      });
    }

    return (await this.getPaymentDiscussion(discussionId))!;
  }

  async approvePaymentPlan(
    discussionId: string,
    approvedBy: string
  ): Promise<PaymentDiscussion> {
    const discussion = await this.getPaymentDiscussion(discussionId);
    if (!discussion || !discussion.paymentPlanProposal) {
      throw new Error('Payment discussion or proposal not found');
    }

    const proposal = discussion.paymentPlanProposal;
    proposal.approved = true;
    proposal.approvedBy = approvedBy;
    proposal.approvedAt = new Date();

    await this.discussionRepo.update(discussionId, {
      paymentPlanProposal: proposal,
      status: PaymentDiscussionStatus.IN_PROGRESS,
      auditLog: [
        ...discussion.auditLog,
        {
          action: 'PAYMENT_PLAN_APPROVED',
          performedBy: approvedBy,
          performedAt: new Date(),
          details: { proposal },
        },
      ],
    });

    // Send notification to parent
    await this.notificationService.sendNotification({
      userId: discussion.parentUserId,
      type: 'payment_discussion',
      title: 'Payment Plan Approved',
      message: `Your payment plan for "${discussion.title}" has been approved.`,
      priority: 'high',
      metadata: {
        discussionId,
        conversationId: discussion.conversationId,
      },
    });

    return (await this.getPaymentDiscussion(discussionId))!;
  }

  async trackQuickAction(
    discussionId: string,
    action: 'receipt' | 'paymentPlan' | 'dispute' | 'refund',
    userId: string
  ): Promise<PaymentDiscussion> {
    const discussion = await this.getPaymentDiscussion(discussionId);
    if (!discussion) {
      throw new Error('Payment discussion not found');
    }

    const quickActions = discussion.quickActions || {};
    const now = new Date();

    switch (action) {
      case 'receipt':
        quickActions.receiptRequested = true;
        quickActions.receiptRequestedAt = now;
        break;
      case 'paymentPlan':
        quickActions.paymentPlanRequested = true;
        quickActions.paymentPlanRequestedAt = now;
        break;
      case 'dispute':
        quickActions.disputeRaised = true;
        quickActions.disputeRaisedAt = now;
        break;
      case 'refund':
        quickActions.refundRequested = true;
        quickActions.refundRequestedAt = now;
        break;
    }

    await this.discussionRepo.update(discussionId, {
      quickActions,
      status: PaymentDiscussionStatus.AWAITING_RESPONSE,
      auditLog: [
        ...discussion.auditLog,
        {
          action: `QUICK_ACTION_${action.toUpperCase()}`,
          performedBy: userId,
          performedAt: now,
        },
      ],
    });

    // Send notification to billing staff
    for (const staffId of discussion.billingStaffIds) {
      await this.notificationService.sendNotification({
        userId: staffId,
        type: 'payment_discussion',
        title: 'Quick Action Requested',
        message: `${action} requested for payment discussion "${discussion.title}".`,
        priority: 'high',
        metadata: {
          discussionId,
          action,
          conversationId: discussion.conversationId,
        },
      });
    }

    return (await this.getPaymentDiscussion(discussionId))!;
  }

  async getDiscussionsByPayment(paymentId: string): Promise<PaymentDiscussion[]> {
    return this.discussionRepo.find({
      where: { paymentId },
      relations: ['conversation'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDiscussionsByInvoice(invoiceId: string): Promise<PaymentDiscussion[]> {
    return this.discussionRepo.find({
      where: { invoiceId },
      relations: ['conversation'],
      order: { createdAt: 'DESC' },
    });
  }

  async escalateDiscussion(
    discussionId: string,
    escalatedBy: string,
    reason: string
  ): Promise<PaymentDiscussion> {
    const discussion = await this.getPaymentDiscussion(discussionId);
    if (!discussion) {
      throw new Error('Payment discussion not found');
    }

    await this.discussionRepo.update(discussionId, {
      status: PaymentDiscussionStatus.ESCALATED,
      metadata: {
        ...discussion.metadata,
        priority: 'urgent',
        escalationReason: reason,
        escalatedAt: new Date(),
        escalatedBy,
      },
      auditLog: [
        ...discussion.auditLog,
        {
          action: 'DISCUSSION_ESCALATED',
          performedBy: escalatedBy,
          performedAt: new Date(),
          details: { reason },
        },
      ],
    });

    // Notify organization admins
    // This would typically query for admin users, but for now we'll just log
    this.logger.warn('Payment discussion escalated', {
      discussionId,
      reason,
      escalatedBy,
    });

    return (await this.getPaymentDiscussion(discussionId))!;
  }

  async getOverdueDiscussions(organizationId: string): Promise<PaymentDiscussion[]> {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    return this.discussionRepo.find({
      where: {
        organizationId,
        status: PaymentDiscussionStatus.AWAITING_RESPONSE,
        updatedAt: LessThan(twoDaysAgo),
      },
      relations: ['conversation'],
      order: { updatedAt: 'ASC' },
    });
  }
}