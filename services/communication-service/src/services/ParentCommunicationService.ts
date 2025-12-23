// @ts-nocheck - Parent communication service with complex query patterns
import { Repository, FindOptionsWhere, Between, In, Like, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { 
  ParentCommunication, 
  ParentCommunicationAttachment, 
  ParentCommunicationReminder,
  ParentCommunicationTemplate,
  CommunicationType,
  CommunicationCategory,
  CommunicationPriority
} from '../entities';
import { AppDataSource } from '../config/database';
import { Logger } from '@hockey-hub/shared-lib';
import { NotificationService } from './NotificationService';

export interface CreateParentCommunicationDto {
  organizationId: string;
  teamId: string;
  coachId: string;
  playerId: string;
  parentId: string;
  type: CommunicationType;
  category: CommunicationCategory;
  priority?: CommunicationPriority;
  communicationDate: Date;
  durationMinutes?: number;
  subject: string;
  summary: string;
  detailedNotes?: string;
  additionalParticipants?: {
    id: string;
    name: string;
    role: string;
  }[];
  actionItems?: {
    description: string;
    assignedTo: string;
    dueDate?: Date;
  }[];
  followUpDate?: Date;
  followUpNotes?: string;
  isConfidential?: boolean;
  requiresFollowUp?: boolean;
  tags?: string[];
  location?: string;
  phoneNumber?: string;
  emailThreadId?: string;
  meetingLink?: string;
  metadata?: Record<string, any>;
}

export interface CreateAttachmentDto {
  communicationId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreateReminderDto {
  communicationId: string;
  reminderDate: Date;
  reminderType: string;
  reminderMessage: string;
}

export interface ParentCommunicationFilter {
  organizationId: string;
  teamId?: string;
  coachId?: string;
  playerId?: string;
  parentId?: string;
  type?: CommunicationType;
  category?: CommunicationCategory;
  priority?: CommunicationPriority;
  dateFrom?: Date;
  dateTo?: Date;
  requiresFollowUp?: boolean;
  isFollowUpComplete?: boolean;
  isConfidential?: boolean;
  searchTerm?: string;
  tags?: string[];
}

export interface CommunicationReportOptions {
  organizationId: string;
  dateFrom: Date;
  dateTo: Date;
  groupBy?: 'coach' | 'player' | 'category' | 'type';
  includeConfidential?: boolean;
}

export class ParentCommunicationService {
  private communicationRepository: Repository<ParentCommunication>;
  private attachmentRepository: Repository<ParentCommunicationAttachment>;
  private reminderRepository: Repository<ParentCommunicationReminder>;
  private templateRepository: Repository<ParentCommunicationTemplate>;
  private logger = new Logger('ParentCommunicationService');

  constructor(
    private notificationService: NotificationService
  ) {
    this.communicationRepository = AppDataSource.getRepository(ParentCommunication);
    this.attachmentRepository = AppDataSource.getRepository(ParentCommunicationAttachment);
    this.reminderRepository = AppDataSource.getRepository(ParentCommunicationReminder);
    this.templateRepository = AppDataSource.getRepository(ParentCommunicationTemplate);
  }

  async createCommunication(
    data: CreateParentCommunicationDto,
    userId: string,
    requestId?: string,
    ipAddress?: string
  ): Promise<ParentCommunication> {
    this.logger.info('Creating parent communication', { 
      coachId: data.coachId, 
      playerId: data.playerId,
      type: data.type,
      requestId 
    });

    // Generate action items with IDs
    const actionItems = data.actionItems?.map(item => ({
      id: this.generateId(),
      ...item,
      completed: false
    }));

    const communication = this.communicationRepository.create({
      ...data,
      actionItems,
      priority: data.priority || CommunicationPriority.MEDIUM,
      isConfidential: data.isConfidential || false,
      requiresFollowUp: data.requiresFollowUp || false,
      isFollowUpComplete: false,
      createdBy: userId,
      updatedBy: userId,
      lastRequestId: requestId,
      lastIpAddress: ipAddress
    });

    const savedCommunication = await this.communicationRepository.save(communication);

    // Schedule follow-up reminder if needed
    if (data.requiresFollowUp && data.followUpDate) {
      await this.createReminder({
        communicationId: savedCommunication.id,
        reminderDate: data.followUpDate,
        reminderType: 'follow_up',
        reminderMessage: `Follow-up required for communication with parent regarding: ${data.subject}`
      }, userId, requestId, ipAddress);
    }

    // Send notification to parent (if applicable)
    if (data.type !== CommunicationType.EMAIL && data.type !== CommunicationType.TEXT_MESSAGE) {
      await this.notificationService.sendNotification({
        userId: data.parentId,
        type: 'parent_communication',
        title: 'New Communication from Coach',
        message: `Coach has logged a ${data.type.replace('_', ' ')} regarding ${data.subject}`,
        data: {
          communicationId: savedCommunication.id,
          coachId: data.coachId,
          playerId: data.playerId
        }
      });
    }

    this.logger.audit('Parent communication created', {
      communicationId: savedCommunication.id,
      userId,
      requestId
    });

    return savedCommunication;
  }

  async updateCommunication(
    id: string,
    data: Partial<CreateParentCommunicationDto>,
    userId: string,
    requestId?: string,
    ipAddress?: string
  ): Promise<ParentCommunication> {
    const communication = await this.communicationRepository.findOne({ where: { id } });
    
    if (!communication) {
      throw new Error('Communication not found');
    }

    // Update action items if provided
    if (data.actionItems) {
      data.actionItems = data.actionItems.map(item => ({
        id: item.id || this.generateId(),
        ...item,
        completed: item.completed || false
      }));
    }

    Object.assign(communication, {
      ...data,
      updatedBy: userId,
      lastRequestId: requestId,
      lastIpAddress: ipAddress
    });

    const updated = await this.communicationRepository.save(communication);

    this.logger.audit('Parent communication updated', {
      communicationId: id,
      userId,
      requestId
    });

    return updated;
  }

  async getCommunication(id: string, userId: string): Promise<ParentCommunication | null> {
    const communication = await this.communicationRepository.findOne({
      where: { id },
      relations: ['attachments', 'reminders']
    });

    if (!communication) {
      return null;
    }

    // Check access permissions
    if (!this.hasAccessToCommunication(communication, userId)) {
      throw new Error('Access denied to this communication');
    }

    return communication;
  }

  async listCommunications(
    filter: ParentCommunicationFilter,
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: ParentCommunication[]; total: number; page: number; totalPages: number }> {
    const where: FindOptionsWhere<ParentCommunication> = {
      organizationId: filter.organizationId
    };

    if (filter.teamId) where.teamId = filter.teamId;
    if (filter.coachId) where.coachId = filter.coachId;
    if (filter.playerId) where.playerId = filter.playerId;
    if (filter.parentId) where.parentId = filter.parentId;
    if (filter.type) where.type = filter.type;
    if (filter.category) where.category = filter.category;
    if (filter.priority) where.priority = filter.priority;
    if (filter.requiresFollowUp !== undefined) where.requiresFollowUp = filter.requiresFollowUp;
    if (filter.isFollowUpComplete !== undefined) where.isFollowUpComplete = filter.isFollowUpComplete;
    if (filter.isConfidential !== undefined) where.isConfidential = filter.isConfidential;

    // Date range filter
    if (filter.dateFrom && filter.dateTo) {
      where.communicationDate = Between(filter.dateFrom, filter.dateTo);
    } else if (filter.dateFrom) {
      where.communicationDate = MoreThanOrEqual(filter.dateFrom);
    } else if (filter.dateTo) {
      where.communicationDate = LessThanOrEqual(filter.dateTo);
    }

    // Search term filter
    if (filter.searchTerm) {
      where.subject = Like(`%${filter.searchTerm}%`);
    }

    const [data, total] = await this.communicationRepository.findAndCount({
      where,
      relations: ['attachments', 'reminders'],
      order: { communicationDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Filter out confidential communications if user doesn't have access
    const filteredData = data.filter(comm => this.hasAccessToCommunication(comm, userId));

    return {
      data: filteredData,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async addAttachment(
    data: CreateAttachmentDto,
    userId: string,
    requestId?: string,
    ipAddress?: string
  ): Promise<ParentCommunicationAttachment> {
    const communication = await this.communicationRepository.findOne({ 
      where: { id: data.communicationId } 
    });

    if (!communication) {
      throw new Error('Communication not found');
    }

    const attachment = this.attachmentRepository.create({
      ...data,
      createdBy: userId,
      updatedBy: userId,
      lastRequestId: requestId,
      lastIpAddress: ipAddress
    });

    const saved = await this.attachmentRepository.save(attachment);

    this.logger.info('Attachment added to communication', {
      communicationId: data.communicationId,
      attachmentId: saved.id,
      fileName: data.fileName
    });

    return saved;
  }

  async removeAttachment(
    attachmentId: string,
    userId: string,
    requestId?: string,
    ipAddress?: string
  ): Promise<void> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId },
      relations: ['communication']
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    await this.attachmentRepository.softRemove(attachment);

    this.logger.info('Attachment removed from communication', {
      attachmentId,
      userId,
      requestId
    });
  }

  async createReminder(
    data: CreateReminderDto,
    userId: string,
    requestId?: string,
    ipAddress?: string
  ): Promise<ParentCommunicationReminder> {
    const reminder = this.reminderRepository.create({
      ...data,
      isCompleted: false,
      createdBy: userId,
      updatedBy: userId,
      lastRequestId: requestId,
      lastIpAddress: ipAddress
    });

    const saved = await this.reminderRepository.save(reminder);

    // Schedule notification for reminder
    await this.scheduleReminderNotification(saved);

    return saved;
  }

  async completeReminder(
    reminderId: string,
    completionNotes: string,
    userId: string,
    requestId?: string,
    ipAddress?: string
  ): Promise<ParentCommunicationReminder> {
    const reminder = await this.reminderRepository.findOne({ where: { id: reminderId } });

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    reminder.isCompleted = true;
    reminder.completedAt = new Date();
    reminder.completedBy = userId;
    reminder.completionNotes = completionNotes;
    reminder.updatedBy = userId;
    reminder.lastRequestId = requestId;
    reminder.lastIpAddress = ipAddress;

    return await this.reminderRepository.save(reminder);
  }

  async getUpcomingReminders(
    organizationId: string,
    userId: string,
    days: number = 7
  ): Promise<ParentCommunicationReminder[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const reminders = await this.reminderRepository
      .createQueryBuilder('reminder')
      .innerJoinAndSelect('reminder.communication', 'communication')
      .where('communication.organizationId = :organizationId', { organizationId })
      .andWhere('communication.coachId = :userId', { userId })
      .andWhere('reminder.reminderDate <= :futureDate', { futureDate })
      .andWhere('reminder.reminderDate >= :now', { now: new Date() })
      .andWhere('reminder.isCompleted = :isCompleted', { isCompleted: false })
      .orderBy('reminder.reminderDate', 'ASC')
      .getMany();

    return reminders;
  }

  async updateActionItem(
    communicationId: string,
    actionItemId: string,
    completed: boolean,
    userId: string,
    requestId?: string,
    ipAddress?: string
  ): Promise<ParentCommunication> {
    const communication = await this.communicationRepository.findOne({ 
      where: { id: communicationId } 
    });

    if (!communication) {
      throw new Error('Communication not found');
    }

    if (communication.actionItems) {
      const actionItem = communication.actionItems.find(item => item.id === actionItemId);
      if (actionItem) {
        actionItem.completed = completed;
        communication.updatedBy = userId;
        communication.lastRequestId = requestId;
        communication.lastIpAddress = ipAddress;
        
        await this.communicationRepository.save(communication);
      }
    }

    return communication;
  }

  async generateReport(options: CommunicationReportOptions): Promise<any> {
    const query = this.communicationRepository
      .createQueryBuilder('communication')
      .where('communication.organizationId = :organizationId', { organizationId: options.organizationId })
      .andWhere('communication.communicationDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom: options.dateFrom,
        dateTo: options.dateTo
      });

    if (!options.includeConfidential) {
      query.andWhere('communication.isConfidential = :isConfidential', { isConfidential: false });
    }

    const communications = await query.getMany();

    // Generate report based on groupBy option
    const report: any = {
      totalCommunications: communications.length,
      dateRange: {
        from: options.dateFrom,
        to: options.dateTo
      },
      breakdown: {}
    };

    if (options.groupBy) {
      const grouped = this.groupCommunications(communications, options.groupBy);
      report.breakdown = grouped;
    }

    // Calculate statistics
    report.statistics = {
      byType: this.countByField(communications, 'type'),
      byCategory: this.countByField(communications, 'category'),
      byPriority: this.countByField(communications, 'priority'),
      averageDuration: this.calculateAverageDuration(communications),
      followUpRate: this.calculateFollowUpRate(communications),
      completionRate: this.calculateCompletionRate(communications)
    };

    return report;
  }

  // Template management methods

  async createTemplate(
    data: Partial<ParentCommunicationTemplate>,
    userId: string,
    requestId?: string,
    ipAddress?: string
  ): Promise<ParentCommunicationTemplate> {
    const template = this.templateRepository.create({
      ...data,
      isActive: true,
      usageCount: 0,
      createdBy: userId,
      updatedBy: userId,
      lastRequestId: requestId,
      lastIpAddress: ipAddress
    });

    return await this.templateRepository.save(template);
  }

  async getTemplates(
    organizationId: string,
    category?: CommunicationCategory
  ): Promise<ParentCommunicationTemplate[]> {
    const where: FindOptionsWhere<ParentCommunicationTemplate> = {
      organizationId,
      isActive: true
    };

    if (category) {
      where.category = category;
    }

    return await this.templateRepository.find({
      where,
      order: { usageCount: 'DESC', name: 'ASC' }
    });
  }

  async useTemplate(
    templateId: string,
    userId: string
  ): Promise<ParentCommunicationTemplate> {
    const template = await this.templateRepository.findOne({ where: { id: templateId } });

    if (!template) {
      throw new Error('Template not found');
    }

    template.usageCount++;
    template.lastUsedAt = new Date();
    template.updatedBy = userId;

    return await this.templateRepository.save(template);
  }

  // Private helper methods

  private hasAccessToCommunication(communication: ParentCommunication, userId: string): boolean {
    // Coaches can access their own communications
    if (communication.coachId === userId) {
      return true;
    }

    // Parents can access non-confidential communications about their children
    if (communication.parentId === userId && !communication.isConfidential) {
      return true;
    }

    // TODO: Add admin access check

    return false;
  }

  private async scheduleReminderNotification(reminder: ParentCommunicationReminder): Promise<void> {
    // Schedule notification to be sent at reminder date
    // This would integrate with a job queue system
    this.logger.info('Scheduling reminder notification', {
      reminderId: reminder.id,
      reminderDate: reminder.reminderDate
    });
  }

  private groupCommunications(communications: ParentCommunication[], groupBy: string): Record<string, any> {
    const grouped: Record<string, any> = {};

    communications.forEach(comm => {
      const key = comm[groupBy as keyof ParentCommunication] as string;
      if (!grouped[key]) {
        grouped[key] = {
          count: 0,
          communications: []
        };
      }
      grouped[key].count++;
      grouped[key].communications.push(comm.id);
    });

    return grouped;
  }

  private countByField(communications: ParentCommunication[], field: keyof ParentCommunication): Record<string, number> {
    const counts: Record<string, number> = {};

    communications.forEach(comm => {
      const value = comm[field] as string;
      counts[value] = (counts[value] || 0) + 1;
    });

    return counts;
  }

  private calculateAverageDuration(communications: ParentCommunication[]): number {
    const durationsArray = communications
      .filter(comm => comm.durationMinutes)
      .map(comm => comm.durationMinutes!);

    if (durationsArray.length === 0) return 0;

    const sum = durationsArray.reduce((acc, duration) => acc + duration, 0);
    return Math.round(sum / durationsArray.length);
  }

  private calculateFollowUpRate(communications: ParentCommunication[]): number {
    const requiresFollowUp = communications.filter(comm => comm.requiresFollowUp).length;
    return communications.length > 0 ? (requiresFollowUp / communications.length) * 100 : 0;
  }

  private calculateCompletionRate(communications: ParentCommunication[]): number {
    const requiresFollowUp = communications.filter(comm => comm.requiresFollowUp);
    const completed = requiresFollowUp.filter(comm => comm.isFollowUpComplete).length;
    return requiresFollowUp.length > 0 ? (completed / requiresFollowUp.length) * 100 : 0;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}