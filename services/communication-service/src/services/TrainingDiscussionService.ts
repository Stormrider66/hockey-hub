import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { 
  TrainingDiscussion, 
  ExerciseDiscussion, 
  TrainingSessionType, 
  DiscussionStatus 
} from '../entities/TrainingDiscussion';
import { 
  Conversation, 
  ConversationType 
} from '../entities/Conversation';
import { MessageType } from '../entities/Message';
import { 
  ConversationParticipant, 
  ParticipantRole 
} from '../entities/ConversationParticipant';
import { ConversationService } from './ConversationService';
import { MessageService } from './MessageService';
import { Logger } from '@hockey-hub/shared-lib';

interface CreateTrainingDiscussionDto {
  sessionId: string;
  sessionType: TrainingSessionType;
  sessionTitle: string;
  sessionDate: Date;
  sessionLocation?: string;
  organizationId: string;
  teamId?: string;
  coachIds?: string[];
  trainerIds?: string[];
  playerIds?: string[];
  exerciseIds?: string[];
  metadata?: Record<string, any>;
  createdBy: string;
}

interface CreateExerciseThreadDto {
  trainingDiscussionId: string;
  exerciseId: string;
  exerciseName: string;
  exerciseDescription?: string;
  metadata?: Record<string, any>;
  createdBy: string;
}

export class TrainingDiscussionService {
  private readonly logger = new Logger('TrainingDiscussionService');

  constructor(
    private trainingDiscussionRepo: Repository<TrainingDiscussion>,
    private exerciseDiscussionRepo: Repository<ExerciseDiscussion>,
    private conversationRepo: Repository<Conversation>,
    private participantRepo: Repository<ConversationParticipant>,
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  async createTrainingDiscussion(dto: CreateTrainingDiscussionDto): Promise<TrainingDiscussion> {
    try {
      // Check if discussion already exists
      const existing = await this.trainingDiscussionRepo.findOne({
        where: {
          session_id: dto.sessionId,
          session_type: dto.sessionType,
        },
      });

      if (existing) {
        this.logger.debug('Training discussion already exists', { 
          sessionId: dto.sessionId, 
          sessionType: dto.sessionType 
        });
        return existing;
      }

      // Create the conversation
      const conversation = await this.conversationService.createConversation(dto.createdBy, {
        type: ConversationType.TRAINING_SESSION,
        name: `${dto.sessionTitle} - Discussion`,
        description: `Training session discussion for ${dto.sessionTitle}`,
        participant_ids: [],
        metadata: {
          sessionId: dto.sessionId,
          sessionType: dto.sessionType,
          sessionDate: dto.sessionDate.toISOString(),
          location: dto.sessionLocation,
          organizationId: dto.organizationId,
          teamId: dto.teamId,
        },
      });

      // Add participants
      const participantIds = new Set<string>([dto.createdBy]);
      
      // Add coaches
      if (dto.coachIds?.length) {
        dto.coachIds.forEach(id => participantIds.add(id));
      }
      
      // Add trainers
      if (dto.trainerIds?.length) {
        dto.trainerIds.forEach(id => participantIds.add(id));
      }
      
      // Add players
      if (dto.playerIds?.length) {
        dto.playerIds.forEach(id => participantIds.add(id));
      }

      // Add participants using the addParticipants method
      const otherParticipants = Array.from(participantIds).filter(id => id !== dto.createdBy);
      if (otherParticipants.length > 0) {
        await this.conversationService.addParticipants(
          conversation.id,
          dto.createdBy,
          otherParticipants
        );
      }
      
      // Update roles for coaches and trainers
      const moderatorIds = [
        ...(dto.coachIds || []),
        ...(dto.trainerIds || [])
      ].filter(id => id !== dto.createdBy);
      
      for (const moderatorId of moderatorIds) {
        await this.participantRepo.update(
          { conversation_id: conversation.id, user_id: moderatorId },
          { role: ParticipantRole.MODERATOR }
        );
      }

      // Create training discussion
      const trainingDiscussion = this.trainingDiscussionRepo.create({
        conversation_id: conversation.id,
        conversation,
        session_id: dto.sessionId,
        session_type: dto.sessionType,
        session_title: dto.sessionTitle,
        session_date: dto.sessionDate,
        session_location: dto.sessionLocation,
        organization_id: dto.organizationId,
        team_id: dto.teamId,
        status: DiscussionStatus.SCHEDULED,
        session_metadata: {
          coach_ids: dto.coachIds,
          trainer_ids: dto.trainerIds,
          player_ids: dto.playerIds,
          exercise_ids: dto.exerciseIds,
          ...dto.metadata,
        },
        created_by: dto.createdBy,
      });

      const saved = await this.trainingDiscussionRepo.save(trainingDiscussion);

      // Send initial message
      await this.messageService.sendMessage(conversation.id, dto.createdBy, {
        content: `Training session discussion created for "${dto.sessionTitle}"`,
        type: MessageType.SYSTEM,
        metadata: {
          sessionDate: dto.sessionDate.toISOString(),
          location: dto.sessionLocation,
          participantCount: participantIds.size,
        },
      });

      this.logger.info('Training discussion created', { 
        id: saved.id, 
        sessionId: dto.sessionId 
      });

      return saved;
    } catch (error) {
      this.logger.error('Failed to create training discussion', error);
      throw error;
    }
  }

  async createExerciseThread(dto: CreateExerciseThreadDto): Promise<ExerciseDiscussion> {
    try {
      // Get the training discussion
      const trainingDiscussion = await this.trainingDiscussionRepo.findOne({
        where: { id: dto.trainingDiscussionId },
        relations: ['conversation'],
      });

      if (!trainingDiscussion) {
        throw new Error('Training discussion not found');
      }

      // Create conversation for exercise thread
      const conversation = await this.conversationService.createConversation(dto.createdBy, {
        type: ConversationType.EXERCISE_THREAD,
        name: `${dto.exerciseName} - Feedback`,
        description: dto.exerciseDescription,
        participant_ids: [],
        metadata: {
          trainingDiscussionId: dto.trainingDiscussionId,
          exerciseId: dto.exerciseId,
          parentConversationId: trainingDiscussion.conversation_id,
        },
      });

      // Copy participants from parent conversation
      const parentParticipants = await this.participantRepo.find({
        where: { conversation_id: trainingDiscussion.conversation_id },
      });

      for (const participant of parentParticipants) {
        await this.participantRepo.insert({
          conversation_id: conversation.id,
          user_id: participant.user_id,
          role: participant.role,
          joined_at: new Date(),
          added_by: dto.createdBy,
        });
      }

      // Create exercise discussion
      const exerciseDiscussion = this.exerciseDiscussionRepo.create({
        training_discussion_id: dto.trainingDiscussionId,
        exercise_id: dto.exerciseId,
        exercise_name: dto.exerciseName,
        exercise_description: dto.exerciseDescription,
        thread_conversation_id: conversation.id,
        exercise_metadata: dto.metadata,
      });

      const saved = await this.exerciseDiscussionRepo.save(exerciseDiscussion);

      // Send initial message
      await this.messageService.sendMessage(conversation.id, dto.createdBy, {
        content: `Exercise feedback thread created for "${dto.exerciseName}"`,
        type: MessageType.SYSTEM,
      });

      this.logger.info('Exercise thread created', { 
        id: saved.id, 
        exerciseId: dto.exerciseId 
      });

      return saved;
    } catch (error) {
      this.logger.error('Failed to create exercise thread', error);
      throw error;
    }
  }

  async getTrainingDiscussion(sessionId: string, sessionType: TrainingSessionType): Promise<TrainingDiscussion | null> {
    return this.trainingDiscussionRepo.findOne({
      where: {
        session_id: sessionId,
        session_type: sessionType,
      },
      relations: ['conversation', 'exercise_discussions'],
    });
  }

  async getTrainingDiscussionById(id: string): Promise<TrainingDiscussion | null> {
    return this.trainingDiscussionRepo.findOne({
      where: { id },
      relations: ['conversation', 'exercise_discussions', 'exercise_discussions.thread_conversation'],
    });
  }

  async getExerciseDiscussions(trainingDiscussionId: string): Promise<ExerciseDiscussion[]> {
    return this.exerciseDiscussionRepo.find({
      where: { training_discussion_id: trainingDiscussionId },
      relations: ['thread_conversation'],
      order: { created_at: 'ASC' },
    });
  }

  async updateDiscussionStatus(id: string, status: DiscussionStatus, userId: string): Promise<TrainingDiscussion> {
    const discussion = await this.trainingDiscussionRepo.findOne({ where: { id } });
    if (!discussion) {
      throw new Error('Training discussion not found');
    }

    discussion.status = status;
    if (status === DiscussionStatus.ARCHIVED) {
      discussion.archived_at = new Date();
      discussion.archived_by = userId;
    }

    return this.trainingDiscussionRepo.save(discussion);
  }

  async getActiveDiscussionsForUser(userId: string): Promise<TrainingDiscussion[]> {
    // Get conversations where user is a participant
    const participants = await this.participantRepo.find({
      where: { user_id: userId },
      select: ['conversation_id'],
    });

    const conversationIds = participants.map(p => p.conversation_id);

    if (!conversationIds.length) {
      return [];
    }

    return this.trainingDiscussionRepo.find({
      where: {
        conversation_id: In(conversationIds),
        status: In([DiscussionStatus.SCHEDULED, DiscussionStatus.ACTIVE]),
      },
      relations: ['conversation'],
      order: { session_date: 'ASC' },
    });
  }

  async getUpcomingDiscussions(organizationId: string, teamId?: string): Promise<TrainingDiscussion[]> {
    const query = this.trainingDiscussionRepo.createQueryBuilder('td')
      .leftJoinAndSelect('td.conversation', 'conversation')
      .where('td.organization_id = :organizationId', { organizationId })
      .andWhere('td.status = :status', { status: DiscussionStatus.SCHEDULED })
      .andWhere('td.session_date >= :now', { now: new Date() });

    if (teamId) {
      query.andWhere('td.team_id = :teamId', { teamId });
    }

    return query.orderBy('td.session_date', 'ASC').getMany();
  }

  async activateDiscussion(id: string): Promise<TrainingDiscussion> {
    return this.updateDiscussionStatus(id, DiscussionStatus.ACTIVE, 'system');
  }

  async completeDiscussion(id: string): Promise<TrainingDiscussion> {
    return this.updateDiscussionStatus(id, DiscussionStatus.COMPLETED, 'system');
  }

  async archiveOldDiscussions(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.trainingDiscussionRepo.update(
      {
        status: DiscussionStatus.COMPLETED,
        session_date: cutoffDate,
      },
      {
        status: DiscussionStatus.ARCHIVED,
        archived_at: new Date(),
        archived_by: 'system',
      }
    );

    return result.affected || 0;
  }

  async updateExerciseFeedbackCount(exerciseDiscussionId: string): Promise<void> {
    const discussion = await this.exerciseDiscussionRepo.findOne({
      where: { id: exerciseDiscussionId },
    });

    if (!discussion) return;

    // Count messages in the thread conversation
    const messageRepo = AppDataSource.getRepository('Message');
    const count = await messageRepo.count({
      where: { conversation_id: discussion.thread_conversation_id },
    });
    
    discussion.feedback_count = count;
    await this.exerciseDiscussionRepo.save(discussion);
  }

  async updateExerciseAttachmentCount(exerciseDiscussionId: string): Promise<void> {
    const discussion = await this.exerciseDiscussionRepo.findOne({
      where: { id: exerciseDiscussionId },
    });

    if (!discussion) return;

    // Count attachments in the thread conversation
    const attachmentRepo = AppDataSource.getRepository('MessageAttachment');
    const count = await attachmentRepo
      .createQueryBuilder('attachment')
      .innerJoin('attachment.message', 'message')
      .where('message.conversation_id = :conversationId', { 
        conversationId: discussion.thread_conversation_id 
      })
      .getCount();
    
    discussion.attachment_count = count;
    await this.exerciseDiscussionRepo.save(discussion);
  }
}