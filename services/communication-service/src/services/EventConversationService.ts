import { Repository, In, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database';
import {
  EventConversation,
  EventConversationStatus,
  EventConversationScope,
  Conversation,
  ConversationType,
  ConversationParticipant,
  ParticipantRole,
  Message,
  MessageType,
} from '../entities';
import { ConversationService } from './ConversationService';
import { NotFoundError, ConflictError, ForbiddenError } from '@hockey-hub/shared-lib';
import axios from 'axios';

export interface CreateEventConversationDto {
  event_id: string;
  scope?: EventConversationScope;
  name?: string;
  description?: string;
  auto_add_participants?: boolean;
  send_welcome_message?: boolean;
  settings?: Record<string, any>;
  custom_participant_ids?: string[]; // For CUSTOM scope
}

export interface EventConversationFilters {
  event_id?: string;
  status?: EventConversationStatus;
  scope?: EventConversationScope;
  created_by?: string;
  active_only?: boolean;
}

export interface EventDetails {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  type: string;
  status: string;
  participants: Array<{
    userId: string;
    role: string;
    status: string;
  }>;
}

export class EventConversationService {
  private eventConversationRepo: Repository<EventConversation>;
  private conversationRepo: Repository<Conversation>;
  private participantRepo: Repository<ConversationParticipant>;
  private messageRepo: Repository<Message>;
  private conversationService: ConversationService;

  constructor() {
    this.eventConversationRepo = AppDataSource.getRepository(EventConversation);
    this.conversationRepo = AppDataSource.getRepository(Conversation);
    this.participantRepo = AppDataSource.getRepository(ConversationParticipant);
    this.messageRepo = AppDataSource.getRepository(Message);
    this.conversationService = new ConversationService();
  }

  async createEventConversation(
    userId: string,
    data: CreateEventConversationDto
  ): Promise<EventConversation> {
    // Check if event conversation already exists
    const existing = await this.eventConversationRepo.findOne({
      where: {
        event_id: data.event_id,
        scope: data.scope || EventConversationScope.ALL_PARTICIPANTS,
        status: EventConversationStatus.ACTIVE,
      },
    });

    if (existing) {
      throw new ConflictError('Event conversation already exists for this scope');
    }

    // Get event details from calendar service
    const eventDetails = await this.getEventDetails(data.event_id);
    if (!eventDetails) {
      throw new NotFoundError('Event not found');
    }

    // Determine participants based on scope
    const participantIds = await this.getParticipantsForScope(
      data.scope || EventConversationScope.ALL_PARTICIPANTS,
      eventDetails,
      data.custom_participant_ids
    );

    // Create conversation name if not provided
    const conversationName = data.name || `${eventDetails.title} Discussion`;
    const conversationDescription = data.description || 
      `Chat for event: ${eventDetails.title} on ${eventDetails.startTime.toLocaleDateString()}`;

    // Create the conversation
    const conversation = await this.conversationService.createConversation(userId, {
      type: ConversationType.GROUP,
      name: conversationName,
      description: conversationDescription,
      participant_ids: participantIds,
      metadata: {
        eventId: data.event_id,
        eventTitle: eventDetails.title,
        eventDate: eventDetails.startTime,
        eventLocation: eventDetails.location,
        isEventConversation: true,
      },
    });

    // Create event conversation record
    const eventConversation = this.eventConversationRepo.create({
      event_id: data.event_id,
      conversation_id: conversation.id,
      scope: data.scope || EventConversationScope.ALL_PARTICIPANTS,
      created_by: userId,
      auto_add_participants: data.auto_add_participants ?? true,
      send_welcome_message: data.send_welcome_message ?? true,
      settings: {
        allowFileSharing: true,
        allowVoiceMessages: true,
        allowVideoMessages: true,
        moderatedMode: false,
        notifyOnEventReminders: true,
        notifyOnEventChanges: true,
        notifyOnRSVPChanges: true,
        autoArchiveAfterEvent: true,
        archiveDelayHours: 24,
        showEventDetails: true,
        allowQuickActions: true,
        ...data.settings,
      },
      metadata: {
        calendarServiceUrl: process.env.CALENDAR_SERVICE_URL || 'http://localhost:3003',
        eventType: eventDetails.type,
        eventTitle: eventDetails.title,
        eventDate: eventDetails.startTime,
        eventLocation: eventDetails.location,
        totalParticipants: participantIds.length,
        lastActivityAt: new Date(),
      },
    });

    await this.eventConversationRepo.save(eventConversation);

    // Send welcome message if enabled
    if (data.send_welcome_message ?? true) {
      await this.sendWelcomeMessage(conversation.id, eventDetails);
    }

    // Schedule auto-archive if event has ended
    await this.scheduleAutoArchive(eventConversation.id, eventDetails);

    return this.getEventConversationById(eventConversation.id, userId);
  }

  async getEventConversationById(
    eventConversationId: string,
    userId: string
  ): Promise<EventConversation> {
    const eventConversation = await this.eventConversationRepo
      .createQueryBuilder('ec')
      .leftJoinAndSelect('ec.conversation', 'conversation')
      .leftJoinAndSelect('conversation.participants', 'participants', 'participants.left_at IS NULL')
      .where('ec.id = :eventConversationId', { eventConversationId })
      .getOne();

    if (!eventConversation) {
      throw new NotFoundError('Event conversation not found');
    }

    // Check if user is participant
    const isParticipant = eventConversation.conversation.participants.some(
      p => p.user_id === userId
    );

    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant in this event conversation');
    }

    // Enhance with event details and statistics
    eventConversation.eventDetails = await this.getEventDetails(eventConversation.event_id);
    eventConversation.participantCount = eventConversation.conversation.participants.length;
    
    // Get message count
    eventConversation.messageCount = await this.messageRepo.count({
      where: {
        conversation_id: eventConversation.conversation_id,
        deleted_at: IsNull(),
      },
    });

    // Get last activity
    const lastMessage = await this.messageRepo.findOne({
      where: {
        conversation_id: eventConversation.conversation_id,
        deleted_at: IsNull(),
      },
      order: { created_at: 'DESC' },
    });

    eventConversation.lastActivity = lastMessage?.created_at;

    return eventConversation;
  }

  async getEventConversations(
    filters: EventConversationFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    eventConversations: EventConversation[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const query = this.eventConversationRepo
      .createQueryBuilder('ec')
      .leftJoinAndSelect('ec.conversation', 'conversation')
      .leftJoinAndSelect('conversation.participants', 'participants', 'participants.left_at IS NULL');

    if (filters.event_id) {
      query.andWhere('ec.event_id = :eventId', { eventId: filters.event_id });
    }

    if (filters.status) {
      query.andWhere('ec.status = :status', { status: filters.status });
    }

    if (filters.scope) {
      query.andWhere('ec.scope = :scope', { scope: filters.scope });
    }

    if (filters.created_by) {
      query.andWhere('ec.created_by = :createdBy', { createdBy: filters.created_by });
    }

    if (filters.active_only) {
      query.andWhere('ec.status = :activeStatus', { activeStatus: EventConversationStatus.ACTIVE });
    }

    const [eventConversations, total] = await query
      .orderBy('ec.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Enhance with event details
    const enhancedEventConversations = await Promise.all(
      eventConversations.map(async (ec) => {
        ec.eventDetails = await this.getEventDetails(ec.event_id);
        ec.participantCount = ec.conversation.participants.length;
        
        // Get message count and last activity
        const messageInfo = await this.messageRepo
          .createQueryBuilder('message')
          .select('COUNT(*)', 'count')
          .addSelect('MAX(message.created_at)', 'lastActivity')
          .where('message.conversation_id = :conversationId', { conversationId: ec.conversation_id })
          .andWhere('message.deleted_at IS NULL')
          .getRawOne();

        ec.messageCount = parseInt(messageInfo.count) || 0;
        ec.lastActivity = messageInfo.lastActivity;

        return ec;
      })
    );

    return {
      eventConversations: enhancedEventConversations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEventConversationsForEvent(
    eventId: string,
    userId: string
  ): Promise<EventConversation[]> {
    const result = await this.getEventConversations(
      { event_id: eventId, active_only: true },
      1,
      50
    );

    // Filter to only conversations where user is a participant
    return result.eventConversations.filter(ec =>
      ec.conversation.participants.some(p => p.user_id === userId)
    );
  }

  async addParticipantsToEventConversation(
    eventConversationId: string,
    userId: string,
    participantIds: string[]
  ): Promise<void> {
    const eventConversation = await this.getEventConversationById(eventConversationId, userId);

    // Check if user is admin of the conversation
    const isAdmin = eventConversation.conversation.participants.some(
      p => p.user_id === userId && p.role === ParticipantRole.ADMIN
    );

    if (!isAdmin) {
      throw new ForbiddenError('You must be an admin to add participants');
    }

    // Add participants to the conversation
    await this.conversationService.addParticipants(
      eventConversation.conversation_id,
      userId,
      participantIds
    );

    // Update metadata
    const newParticipantCount = eventConversation.participantCount! + participantIds.length;
    eventConversation.metadata = {
      ...eventConversation.metadata,
      totalParticipants: newParticipantCount,
      lastActivityAt: new Date(),
    };

    await this.eventConversationRepo.save(eventConversation);
  }

  async archiveEventConversation(
    eventConversationId: string,
    userId: string
  ): Promise<void> {
    const eventConversation = await this.getEventConversationById(eventConversationId, userId);

    // Check if user can archive (admin or creator)
    const isAdmin = eventConversation.conversation.participants.some(
      p => p.user_id === userId && p.role === ParticipantRole.ADMIN
    );

    if (!isAdmin && eventConversation.created_by !== userId) {
      throw new ForbiddenError('You do not have permission to archive this event conversation');
    }

    // Update status
    eventConversation.status = EventConversationStatus.ARCHIVED;
    eventConversation.updated_by = userId;
    
    await this.eventConversationRepo.save(eventConversation);

    // Archive the conversation
    await this.conversationService.archiveConversation(
      eventConversation.conversation_id,
      userId
    );
  }

  async sendEventReminder(
    eventConversationId: string,
    reminderMessage: string,
    systemUserId: string = 'system'
  ): Promise<void> {
    const eventConversation = await this.eventConversationRepo.findOne({
      where: { id: eventConversationId },
    });

    if (!eventConversation) {
      throw new NotFoundError('Event conversation not found');
    }

    // Create system message for reminder
    const message = this.messageRepo.create({
      conversation_id: eventConversation.conversation_id,
      sender_id: systemUserId,
      content: reminderMessage,
      type: MessageType.SYSTEM,
      metadata: {
        isEventReminder: true,
        eventId: eventConversation.event_id,
        reminderSentAt: new Date(),
      },
    });

    await this.messageRepo.save(message);
  }

  async notifyEventChanges(
    eventId: string,
    changeDescription: string,
    systemUserId: string = 'system'
  ): Promise<void> {
    // Get all active event conversations for this event
    const eventConversations = await this.eventConversationRepo.find({
      where: {
        event_id: eventId,
        status: EventConversationStatus.ACTIVE,
      },
    });

    // Send notification to each conversation that has notifications enabled
    for (const ec of eventConversations) {
      if (ec.settings?.notifyOnEventChanges !== false) {
        const message = this.messageRepo.create({
          conversation_id: ec.conversation_id,
          sender_id: systemUserId,
          content: `📅 Event Update: ${changeDescription}`,
          type: MessageType.SYSTEM,
          metadata: {
            isEventUpdate: true,
            eventId: eventId,
            updateSentAt: new Date(),
          },
        });

        await this.messageRepo.save(message);
      }
    }
  }

  // Private helper methods
  private async getEventDetails(eventId: string): Promise<EventDetails | null> {
    try {
      const calendarServiceUrl = process.env.CALENDAR_SERVICE_URL || 'http://localhost:3003';
      const response = await axios.get(`${calendarServiceUrl}/api/events/${eventId}`);
      
      if (response.data.success) {
        const event = response.data.data;
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          location: event.location,
          type: event.type,
          status: event.status,
          participants: event.participants || [],
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching event details:', error);
      return null;
    }
  }

  private async getParticipantsForScope(
    scope: EventConversationScope,
    eventDetails: EventDetails,
    customParticipantIds?: string[]
  ): Promise<string[]> {
    switch (scope) {
      case EventConversationScope.ALL_PARTICIPANTS:
        return eventDetails.participants.map(p => p.userId);
      
      case EventConversationScope.COACHES_ONLY:
        return eventDetails.participants
          .filter(p => ['coach', 'assistant_coach', 'head_coach'].includes(p.role))
          .map(p => p.userId);
      
      case EventConversationScope.PLAYERS_ONLY:
        return eventDetails.participants
          .filter(p => p.role === 'player')
          .map(p => p.userId);
      
      case EventConversationScope.PARENTS_ONLY:
        return eventDetails.participants
          .filter(p => p.role === 'parent')
          .map(p => p.userId);
      
      case EventConversationScope.CUSTOM:
        return customParticipantIds || [];
      
      default:
        return eventDetails.participants.map(p => p.userId);
    }
  }

  private async sendWelcomeMessage(
    conversationId: string,
    eventDetails: EventDetails
  ): Promise<void> {
    const welcomeContent = `Welcome to the discussion for **${eventDetails.title}**!

📅 **When:** ${eventDetails.startTime.toLocaleDateString()} at ${eventDetails.startTime.toLocaleTimeString()}
📍 **Where:** ${eventDetails.location || 'TBD'}

This chat is for coordination, questions, and updates related to this event. Feel free to ask questions or share information!`;

    const message = this.messageRepo.create({
      conversation_id: conversationId,
      sender_id: 'system',
      content: welcomeContent,
      type: MessageType.SYSTEM,
      metadata: {
        isWelcomeMessage: true,
        eventId: eventDetails.id,
      },
    });

    await this.messageRepo.save(message);
  }

  private async scheduleAutoArchive(
    eventConversationId: string,
    eventDetails: EventDetails
  ): Promise<void> {
    const eventConversation = await this.eventConversationRepo.findOne({
      where: { id: eventConversationId },
    });

    if (!eventConversation || !eventConversation.settings?.autoArchiveAfterEvent) {
      return;
    }

    const archiveDelayHours = eventConversation.settings.archiveDelayHours || 24;
    const autoArchiveAt = new Date(eventDetails.endTime.getTime() + (archiveDelayHours * 60 * 60 * 1000));

    eventConversation.auto_archive_at = autoArchiveAt;
    await this.eventConversationRepo.save(eventConversation);
  }
}