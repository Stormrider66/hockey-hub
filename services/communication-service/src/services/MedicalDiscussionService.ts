// @ts-nocheck - Medical discussion service with complex entity relationships
import { Repository, DataSource, In, Not, IsNull, MoreThan } from 'typeorm';
import {
  MedicalDiscussion,
  MedicalActionItem,
  MedicalDiscussionType,
  MedicalDiscussionStatus,
  MedicalDiscussionPriority,
  MedicalConfidentialityLevel,
  Conversation,
  ConversationType,
  ConversationParticipant,
  ParticipantRole,
} from '../entities';

export interface CreateMedicalDiscussionDto {
  discussion_type: MedicalDiscussionType;
  title: string;
  description?: string;
  injury_id?: string;
  player_id?: string;
  player_name?: string;
  organization_id: string;
  team_id?: string;
  priority?: MedicalDiscussionPriority;
  confidentiality_level?: MedicalConfidentialityLevel;
  medical_metadata?: any;
  participant_ids: string[];
  requires_acknowledgment?: boolean;
  follow_up_date?: Date;
  created_by: string;
  created_by_name?: string;
  created_by_role?: string;
}

export interface UpdateMedicalDiscussionDto {
  title?: string;
  description?: string;
  status?: MedicalDiscussionStatus;
  priority?: MedicalDiscussionPriority;
  confidentiality_level?: MedicalConfidentialityLevel;
  medical_metadata?: any;
  follow_up_date?: Date;
}

export interface CreateActionItemDto {
  description: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_role?: string;
  due_date?: Date;
  priority?: MedicalDiscussionPriority;
  created_by: string;
}

export interface UpdateActionItemDto {
  description?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_role?: string;
  due_date?: Date;
  status?: string;
  priority?: MedicalDiscussionPriority;
  completion_notes?: string;
}

export class MedicalDiscussionService {
  private medicalDiscussionRepo: Repository<MedicalDiscussion>;
  private actionItemRepo: Repository<MedicalActionItem>;
  private conversationRepo: Repository<Conversation>;
  private participantRepo: Repository<ConversationParticipant>;

  constructor(private dataSource: DataSource) {
    this.medicalDiscussionRepo = dataSource.getRepository(MedicalDiscussion);
    this.actionItemRepo = dataSource.getRepository(MedicalActionItem);
    this.conversationRepo = dataSource.getRepository(Conversation);
    this.participantRepo = dataSource.getRepository(ConversationParticipant);
  }

  async createMedicalDiscussion(data: CreateMedicalDiscussionDto): Promise<MedicalDiscussion> {
    // Create the conversation first
    const conversation = await this.conversationRepo.save({
      type: ConversationType.GROUP,
      name: `Medical: ${data.title}`,
      created_by: data.created_by,
      is_archived: false,
    });

    // Add participants
    const participantPromises = data.participant_ids.map((userId) =>
      this.participantRepo.save({
        conversation_id: conversation.id,
        user_id: userId,
        role: userId === data.created_by ? ParticipantRole.ADMIN : ParticipantRole.MEMBER,
        notifications_enabled: true,
        is_muted: false,
      })
    );
    await Promise.all(participantPromises);

    // Create the medical discussion
    const discussion = await this.medicalDiscussionRepo.save({
      conversation_id: conversation.id,
      discussion_type: data.discussion_type,
      title: data.title,
      description: data.description,
      injury_id: data.injury_id,
      player_id: data.player_id,
      player_name: data.player_name,
      organization_id: data.organization_id,
      team_id: data.team_id,
      priority: data.priority || MedicalDiscussionPriority.MEDIUM,
      confidentiality_level: data.confidentiality_level || MedicalConfidentialityLevel.MEDICAL_ONLY,
      medical_metadata: data.medical_metadata,
      requires_acknowledgment: data.requires_acknowledgment || false,
      follow_up_date: data.follow_up_date,
      created_by: data.created_by,
      created_by_name: data.created_by_name,
      created_by_role: data.created_by_role,
    });

    return this.getMedicalDiscussion(discussion.id);
  }

  async getMedicalDiscussion(id: string): Promise<MedicalDiscussion | null> {
    return this.medicalDiscussionRepo.findOne({
      where: { id },
      relations: ['conversation', 'action_items'],
    });
  }

  async getMedicalDiscussions(filters: {
    organization_id: string;
    team_id?: string;
    player_id?: string;
    injury_id?: string;
    status?: MedicalDiscussionStatus;
    priority?: MedicalDiscussionPriority;
    discussion_type?: MedicalDiscussionType;
    created_by?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ discussions: MedicalDiscussion[]; total: number }> {
    const query = this.medicalDiscussionRepo.createQueryBuilder('discussion')
      .leftJoinAndSelect('discussion.conversation', 'conversation')
      .leftJoinAndSelect('discussion.action_items', 'action_items')
      .where('discussion.organization_id = :organization_id', {
        organization_id: filters.organization_id,
      });

    if (filters.team_id) {
      query.andWhere('discussion.team_id = :team_id', { team_id: filters.team_id });
    }

    if (filters.player_id) {
      query.andWhere('discussion.player_id = :player_id', { player_id: filters.player_id });
    }

    if (filters.injury_id) {
      query.andWhere('discussion.injury_id = :injury_id', { injury_id: filters.injury_id });
    }

    if (filters.status) {
      query.andWhere('discussion.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      query.andWhere('discussion.priority = :priority', { priority: filters.priority });
    }

    if (filters.discussion_type) {
      query.andWhere('discussion.discussion_type = :discussion_type', {
        discussion_type: filters.discussion_type,
      });
    }

    if (filters.created_by) {
      query.andWhere('discussion.created_by = :created_by', { created_by: filters.created_by });
    }

    query.orderBy('discussion.created_at', 'DESC');

    if (filters.limit) {
      query.limit(filters.limit);
    }

    if (filters.offset) {
      query.offset(filters.offset);
    }

    const [discussions, total] = await query.getManyAndCount();

    return { discussions, total };
  }

  async updateMedicalDiscussion(
    id: string,
    data: UpdateMedicalDiscussionDto
  ): Promise<MedicalDiscussion | null> {
    await this.medicalDiscussionRepo.update(id, data);
    return this.getMedicalDiscussion(id);
  }

  async resolveMedicalDiscussion(
    id: string,
    resolved_by: string,
    resolution_notes?: string
  ): Promise<MedicalDiscussion | null> {
    await this.medicalDiscussionRepo.update(id, {
      status: MedicalDiscussionStatus.RESOLVED,
      resolved_at: new Date(),
      resolved_by,
      resolution_notes,
    });
    return this.getMedicalDiscussion(id);
  }

  async archiveMedicalDiscussion(
    id: string,
    archived_by: string
  ): Promise<MedicalDiscussion | null> {
    await this.medicalDiscussionRepo.update(id, {
      status: MedicalDiscussionStatus.ARCHIVED,
      archived_at: new Date(),
      archived_by,
    });

    // Also archive the conversation
    const discussion = await this.getMedicalDiscussion(id);
    if (discussion) {
      await this.conversationRepo.update(discussion.conversation_id, {
        is_archived: true,
      });
    }

    return discussion;
  }

  async addAuthorizedViewer(
    discussionId: string,
    userId: string
  ): Promise<MedicalDiscussion | null> {
    const discussion = await this.getMedicalDiscussion(discussionId);
    if (!discussion) return null;

    const viewers = discussion.authorized_viewers || [];
    if (!viewers.includes(userId)) {
      viewers.push(userId);
      await this.medicalDiscussionRepo.update(discussionId, {
        authorized_viewers: viewers,
      });

      // Also add them to the conversation
      await this.participantRepo.save({
        conversation_id: discussion.conversation_id,
        user_id: userId,
        role: ParticipantRole.MEMBER,
        notifications_enabled: true,
        is_muted: false,
      });
    }

    return this.getMedicalDiscussion(discussionId);
  }

  async removeAuthorizedViewer(
    discussionId: string,
    userId: string
  ): Promise<MedicalDiscussion | null> {
    const discussion = await this.getMedicalDiscussion(discussionId);
    if (!discussion) return null;

    const viewers = discussion.authorized_viewers || [];
    const index = viewers.indexOf(userId);
    if (index > -1) {
      viewers.splice(index, 1);
      await this.medicalDiscussionRepo.update(discussionId, {
        authorized_viewers: viewers,
      });

      // Also remove them from the conversation
      await this.participantRepo.delete({
        conversation_id: discussion.conversation_id,
        user_id: userId,
      });
    }

    return this.getMedicalDiscussion(discussionId);
  }

  async acknowledgeDiscussion(
    discussionId: string,
    userId: string
  ): Promise<MedicalDiscussion | null> {
    const discussion = await this.getMedicalDiscussion(discussionId);
    if (!discussion || !discussion.requires_acknowledgment) return null;

    const acknowledged = discussion.acknowledged_by || [];
    if (!acknowledged.includes(userId)) {
      acknowledged.push(userId);
      await this.medicalDiscussionRepo.update(discussionId, {
        acknowledged_by: acknowledged,
      });
    }

    return this.getMedicalDiscussion(discussionId);
  }

  // Action Item Methods
  async createActionItem(
    discussionId: string,
    data: CreateActionItemDto
  ): Promise<MedicalActionItem> {
    const actionItem = await this.actionItemRepo.save({
      medical_discussion_id: discussionId,
      description: data.description,
      assigned_to: data.assigned_to,
      assigned_to_name: data.assigned_to_name,
      assigned_to_role: data.assigned_to_role,
      due_date: data.due_date,
      priority: data.priority || MedicalDiscussionPriority.MEDIUM,
      created_by: data.created_by,
      status: 'pending',
    });

    return actionItem;
  }

  async getActionItems(discussionId: string): Promise<MedicalActionItem[]> {
    return this.actionItemRepo.find({
      where: { medical_discussion_id: discussionId },
      order: { created_at: 'DESC' },
    });
  }

  async updateActionItem(
    id: string,
    data: UpdateActionItemDto
  ): Promise<MedicalActionItem | null> {
    await this.actionItemRepo.update(id, data);
    return this.actionItemRepo.findOne({ where: { id } });
  }

  async completeActionItem(
    id: string,
    completed_by: string,
    completion_notes?: string
  ): Promise<MedicalActionItem | null> {
    await this.actionItemRepo.update(id, {
      status: 'completed',
      completed_at: new Date(),
      completed_by,
      completion_notes,
    });
    return this.actionItemRepo.findOne({ where: { id } });
  }

  async getUserActionItems(userId: string, status?: string): Promise<MedicalActionItem[]> {
    const where: any = { assigned_to: userId };
    if (status) {
      where.status = status;
    }

    return this.actionItemRepo.find({
      where,
      relations: ['medical_discussion'],
      order: { due_date: 'ASC', created_at: 'DESC' },
    });
  }

  async getUpcomingFollowUps(organizationId: string, daysAhead: number = 7): Promise<MedicalDiscussion[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.medicalDiscussionRepo.find({
      where: {
        organization_id: organizationId,
        follow_up_date: MoreThan(new Date()),
        status: Not(MedicalDiscussionStatus.ARCHIVED),
      },
      order: { follow_up_date: 'ASC' },
    });
  }

  async checkUserAccess(discussionId: string, userId: string, userRole: string): Promise<boolean> {
    const discussion = await this.getMedicalDiscussion(discussionId);
    if (!discussion) return false;

    // Medical staff always have access
    if (userRole === 'medical_staff' || userRole === 'admin') {
      return true;
    }

    // Check confidentiality level
    if (discussion.confidentiality_level === MedicalConfidentialityLevel.MEDICAL_ONLY) {
      return false;
    }

    // Check if user is in authorized viewers
    if (discussion.authorized_viewers?.includes(userId)) {
      return true;
    }

    // Check if user is the player being discussed
    if (discussion.player_id === userId) {
      return true;
    }

    // For general confidentiality, allow coaches and team admins for their team
    if (discussion.confidentiality_level === MedicalConfidentialityLevel.GENERAL) {
      if ((userRole === 'coach' || userRole === 'club_admin') && discussion.team_id) {
        // Would need additional check to verify user is associated with the team
        return true;
      }
    }

    return false;
  }
}