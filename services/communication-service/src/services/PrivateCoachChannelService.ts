import { Repository, In, IsNull, Not } from 'typeorm';
import { 
  Conversation, 
  ConversationType, 
  ConversationParticipant, 
  ParticipantRole,
  CoachAvailability,
  MeetingRequest,
  MeetingRequestStatus,
  AvailabilityType,
} from '../entities';
import { AppDataSource } from '../config/database';
import { 
  ApplicationError, 
  ErrorCode, 
  ConflictError, 
  NotFoundError,
  ForbiddenError,
} from '@hockey-hub/shared-lib';

export interface CreatePrivateCoachChannelDto {
  playerId: string;
  parentId: string;
  coachIds: string[];
  teamId: string;
  organizationId: string;
  playerName?: string;
}

export interface CreateMeetingRequestDto {
  conversationId: string;
  requesterId: string;
  coachId: string;
  playerId: string;
  type: string;
  purpose: string;
  subject: string;
  message: string;
  proposedDate: Date;
  alternateDate1?: Date;
  alternateDate2?: Date;
  duration?: number;
  location?: string;
  metadata?: any;
}

export interface UpdateCoachAvailabilityDto {
  type?: AvailabilityType;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  specificDate?: Date;
  isRecurring?: boolean;
  notes?: string;
  allowMeetingRequests?: boolean;
  defaultMeetingDuration?: number;
  bufferTime?: number;
  metadata?: any;
}

export class PrivateCoachChannelService {
  private conversationRepo: Repository<Conversation>;
  private participantRepo: Repository<ConversationParticipant>;
  private coachAvailabilityRepo: Repository<CoachAvailability>;
  private meetingRequestRepo: Repository<MeetingRequest>;

  constructor() {
    this.conversationRepo = AppDataSource.getRepository(Conversation);
    this.participantRepo = AppDataSource.getRepository(ConversationParticipant);
    this.coachAvailabilityRepo = AppDataSource.getRepository(CoachAvailability);
    this.meetingRequestRepo = AppDataSource.getRepository(MeetingRequest);
  }

  async createPrivateCoachChannel(data: CreatePrivateCoachChannelDto): Promise<Conversation> {
    // Check if channel already exists
    const existingChannel = await this.findExistingChannel(data.playerId, data.parentId, data.teamId);
    if (existingChannel) {
      // Add any new coaches to the existing channel
      await this.addCoachesToChannel(existingChannel.id, data.coachIds);
      return existingChannel;
    }

    // Create new private coach channel
    const conversation = this.conversationRepo.create({
      type: ConversationType.PRIVATE_COACH_CHANNEL,
      name: `Private Channel - ${data.playerName || data.playerId}`,
      description: 'Private communication channel between parent and coaches',
      created_by: data.parentId,
      metadata: {
        playerId: data.playerId,
        parentId: data.parentId,
        coachIds: data.coachIds,
        teamId: data.teamId,
        organizationId: data.organizationId,
        isAutoCreated: true,
      },
    });

    const savedConversation = await this.conversationRepo.save(conversation);

    // Add participants
    const participants = [
      // Parent as admin
      {
        conversation_id: savedConversation.id,
        user_id: data.parentId,
        role: ParticipantRole.ADMIN,
      },
      // Coaches as members
      ...data.coachIds.map(coachId => ({
        conversation_id: savedConversation.id,
        user_id: coachId,
        role: ParticipantRole.MEMBER,
      })),
    ];

    await this.participantRepo.save(participants);

    return savedConversation;
  }

  async findExistingChannel(playerId: string, parentId: string, teamId: string): Promise<Conversation | null> {
    const conversation = await this.conversationRepo.findOne({
      where: {
        type: ConversationType.PRIVATE_COACH_CHANNEL,
        metadata: {
          playerId,
          parentId,
          teamId,
        } as any,
      },
      relations: ['participants'],
    });

    return conversation;
  }

  async addCoachesToChannel(conversationId: string, coachIds: string[]): Promise<void> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Get existing participant user IDs
    const existingUserIds = conversation.participants.map(p => p.user_id);

    // Filter out coaches that are already participants
    const newCoachIds = coachIds.filter(id => !existingUserIds.includes(id));

    if (newCoachIds.length > 0) {
      const newParticipants = newCoachIds.map(coachId => ({
        conversation_id: conversationId,
        user_id: coachId,
        role: ParticipantRole.MEMBER,
      }));

      await this.participantRepo.save(newParticipants);

      // Update metadata
      const currentCoachIds = conversation.metadata?.coachIds || [];
      conversation.metadata = {
        ...conversation.metadata,
        coachIds: [...new Set([...currentCoachIds, ...coachIds])],
      };
      await this.conversationRepo.save(conversation);
    }
  }

  async getParentCoachChannels(parentId: string): Promise<Conversation[]> {
    const conversations = await this.conversationRepo
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .where('conversation.type = :type', { type: ConversationType.PRIVATE_COACH_CHANNEL })
      .andWhere('participants.user_id = :parentId', { parentId })
      .andWhere('participants.left_at IS NULL')
      .getMany();

    return conversations;
  }

  async getCoachPrivateChannels(coachId: string): Promise<Conversation[]> {
    const conversations = await this.conversationRepo
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .where('conversation.type = :type', { type: ConversationType.PRIVATE_COACH_CHANNEL })
      .andWhere('participants.user_id = :coachId', { coachId })
      .andWhere('participants.left_at IS NULL')
      .getMany();

    return conversations;
  }

  async getChannelByPlayer(playerId: string, parentId: string): Promise<Conversation | null> {
    const conversation = await this.conversationRepo
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participants')
      .where('conversation.type = :type', { type: ConversationType.PRIVATE_COACH_CHANNEL })
      .andWhere('conversation.metadata->\'playerId\' = :playerId', { playerId })
      .andWhere('conversation.metadata->\'parentId\' = :parentId', { parentId })
      .getOne();

    return conversation;
  }

  // Coach Availability Management
  async setCoachAvailability(
    coachId: string, 
    teamId: string, 
    organizationId: string,
    availability: UpdateCoachAvailabilityDto[]
  ): Promise<CoachAvailability[]> {
    // Remove existing availability for this coach and team
    await this.coachAvailabilityRepo.delete({ coachId, teamId });

    // Create new availability entries
    const availabilityEntries = availability.map(avail => 
      this.coachAvailabilityRepo.create({
        coachId,
        teamId,
        organizationId,
        ...avail,
      })
    );

    return this.coachAvailabilityRepo.save(availabilityEntries);
  }

  async getCoachAvailability(coachId: string, teamId?: string): Promise<CoachAvailability[]> {
    const where: any = { coachId, isActive: true };
    if (teamId) {
      where.teamId = teamId;
    }

    return this.coachAvailabilityRepo.find({
      where,
      order: {
        dayOfWeek: 'ASC',
        startTime: 'ASC',
      },
    });
  }

  async getTeamCoachesAvailability(teamId: string): Promise<Record<string, CoachAvailability[]>> {
    const availability = await this.coachAvailabilityRepo.find({
      where: { teamId, isActive: true },
      order: {
        coachId: 'ASC',
        dayOfWeek: 'ASC',
        startTime: 'ASC',
      },
    });

    // Group by coach ID
    const grouped: Record<string, CoachAvailability[]> = {};
    availability.forEach(avail => {
      if (!grouped[avail.coachId]) {
        grouped[avail.coachId] = [];
      }
      grouped[avail.coachId].push(avail);
    });

    return grouped;
  }

  // Meeting Request Management
  async createMeetingRequest(data: CreateMeetingRequestDto): Promise<MeetingRequest> {
    // Verify the requester has access to the conversation
    const participant = await this.participantRepo.findOne({
      where: {
        conversation_id: data.conversationId,
        user_id: data.requesterId,
        left_at: IsNull(),
      },
    });

    if (!participant) {
      throw new ForbiddenError('You do not have access to this conversation');
    }

    // Get conversation details
    const conversation = await this.conversationRepo.findOne({
      where: { id: data.conversationId },
    });

    if (!conversation || conversation.type !== ConversationType.PRIVATE_COACH_CHANNEL) {
      throw new ApplicationError('Invalid conversation type for meeting request', ErrorCode.VALIDATION_ERROR);
    }

    const meetingRequest = this.meetingRequestRepo.create({
      ...data,
      teamId: conversation.metadata?.teamId,
      organizationId: conversation.metadata?.organizationId,
      status: MeetingRequestStatus.PENDING,
    });

    return this.meetingRequestRepo.save(meetingRequest);
  }

  async updateMeetingRequest(
    requestId: string, 
    coachId: string,
    update: {
      status: MeetingRequestStatus;
      scheduledDate?: Date;
      location?: string;
      meetingUrl?: string;
      coachNotes?: string;
      declineReason?: string;
      rescheduleReason?: string;
    }
  ): Promise<MeetingRequest> {
    const request = await this.meetingRequestRepo.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError('Meeting request not found');
    }

    if (request.coachId !== coachId) {
      throw new ForbiddenError('You cannot update this meeting request');
    }

    Object.assign(request, update);
    request.respondedAt = new Date();

    if (update.status === MeetingRequestStatus.COMPLETED) {
      request.completedAt = new Date();
    }

    return this.meetingRequestRepo.save(request);
  }

  async getMeetingRequests(
    userId: string,
    role: 'parent' | 'coach',
    status?: MeetingRequestStatus
  ): Promise<MeetingRequest[]> {
    const where: any = {};
    
    if (role === 'parent') {
      where.requesterId = userId;
    } else {
      where.coachId = userId;
    }

    if (status) {
      where.status = status;
    }

    return this.meetingRequestRepo.find({
      where,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getConversationMeetingRequests(conversationId: string): Promise<MeetingRequest[]> {
    return this.meetingRequestRepo.find({
      where: { conversationId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Auto-create channels when player joins team
  async autoCreateChannelsForTeam(
    teamId: string, 
    playerId: string, 
    parentIds: string[],
    coachIds: string[],
    organizationId: string,
    playerName?: string
  ): Promise<Conversation[]> {
    const channels: Conversation[] = [];

    for (const parentId of parentIds) {
      const channel = await this.createPrivateCoachChannel({
        playerId,
        parentId,
        coachIds,
        teamId,
        organizationId,
        playerName,
      });
      channels.push(channel);
    }

    return channels;
  }

  async removeCoachFromChannels(coachId: string, teamId: string): Promise<void> {
    // Find all private coach channels for the team where this coach is a participant
    const participants = await this.participantRepo
      .createQueryBuilder('participant')
      .innerJoin('participant.conversation', 'conversation')
      .where('participant.user_id = :coachId', { coachId })
      .andWhere('conversation.type = :type', { type: ConversationType.PRIVATE_COACH_CHANNEL })
      .andWhere('conversation.metadata->\'teamId\' = :teamId', { teamId })
      .andWhere('participant.left_at IS NULL')
      .getMany();

    // Soft delete the coach from these channels
    for (const participant of participants) {
      participant.left_at = new Date();
      await this.participantRepo.save(participant);

      // Update conversation metadata to remove coach from coachIds
      const conversation = await this.conversationRepo.findOne({
        where: { id: participant.conversation_id },
      });

      if (conversation && conversation.metadata?.coachIds) {
        conversation.metadata.coachIds = conversation.metadata.coachIds.filter(
          (id: string) => id !== coachId
        );
        await this.conversationRepo.save(conversation);
      }
    }
  }
}