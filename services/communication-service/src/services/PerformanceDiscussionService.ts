import { Repository, Between, In, IsNull, Not } from 'typeorm';
import { AppDataSource } from '../config/database';
import { 
  PerformanceDiscussion, 
  PerformanceFeedback,
  PerformanceMetricType, 
  PerformancePeriod,
  PerformanceTrend 
} from '../entities/PerformanceDiscussion';
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
import { NotificationService } from './NotificationService';
import { Logger } from '@hockey-hub/shared-lib';

interface CreatePerformanceDiscussionDto {
  playerId: string;
  coachId: string;
  trainingDiscussionId?: string;
  period: PerformancePeriod;
  startDate: Date;
  endDate: Date;
  organizationId: string;
  teamId?: string;
  performanceMetrics: {
    metric_type: PerformanceMetricType;
    current_value: number;
    previous_value?: number;
    target_value?: number;
    trend: PerformanceTrend;
    notes?: string;
  }[];
  goals?: {
    description: string;
    target_date?: string;
  }[];
  strengths?: string[];
  areasForImprovement?: string[];
  trainingRecommendations?: {
    area: string;
    exercises: string[];
    frequency?: string;
    notes?: string;
  }[];
  overallAssessment?: string;
  overallRating?: number;
  isConfidential?: boolean;
  parentCanView?: boolean;
  sharedWith?: string[];
  scheduledReviewDate?: Date;
}

interface CreatePerformanceFeedbackDto {
  performanceDiscussionId: string;
  providedBy: string;
  feedbackType: 'coach' | 'player' | 'parent' | 'peer';
  feedbackContent: string;
  specificMetrics?: {
    metric_type: PerformanceMetricType;
    rating: number;
    comments?: string;
  }[];
  attachments?: {
    type: 'video' | 'image' | 'document';
    url: string;
    title?: string;
    description?: string;
  }[];
  isPrivate?: boolean;
}

interface UpdatePerformanceMetricsDto {
  performanceDiscussionId: string;
  metrics: {
    metric_type: PerformanceMetricType;
    current_value: number;
    trend: PerformanceTrend;
    notes?: string;
  }[];
  userId: string;
}

interface AddActionItemDto {
  performanceDiscussionId: string;
  description: string;
  assignedTo: string;
  dueDate?: Date;
  createdBy: string;
}

export class PerformanceDiscussionService {
  private readonly logger = new Logger('PerformanceDiscussionService');

  constructor(
    private performanceDiscussionRepo: Repository<PerformanceDiscussion>,
    private performanceFeedbackRepo: Repository<PerformanceFeedback>,
    private conversationRepo: Repository<Conversation>,
    private participantRepo: Repository<ConversationParticipant>,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private notificationService: NotificationService,
  ) {}

  async createPerformanceDiscussion(dto: CreatePerformanceDiscussionDto): Promise<PerformanceDiscussion> {
    try {
      // Create the conversation
      const conversation = await this.conversationService.createConversation(dto.coachId, {
        type: ConversationType.PERFORMANCE_REVIEW,
        name: `Performance Review - ${dto.period}`,
        description: `Performance discussion for the period ${dto.startDate.toLocaleDateString()} to ${dto.endDate.toLocaleDateString()}`,
        participant_ids: [dto.playerId],
        metadata: {
          playerId: dto.playerId,
          coachId: dto.coachId,
          period: dto.period,
          startDate: dto.startDate.toISOString(),
          endDate: dto.endDate.toISOString(),
          organizationId: dto.organizationId,
          teamId: dto.teamId,
          isConfidential: dto.isConfidential,
        },
      });

      // Add parent as participant if allowed
      if (dto.parentCanView) {
        // In a real implementation, we would look up the parent ID
        // For now, we'll just add a note in the metadata
        await this.conversationRepo.update(conversation.id, {
          metadata: {
            ...conversation.metadata,
            parentCanView: true,
          },
        });
      }

      // Add additional shared users
      if (dto.sharedWith?.length) {
        await Promise.all(
          dto.sharedWith.map(userId => 
            this.conversationService.addParticipants(
              conversation.id,
              dto.coachId,
              [userId]
            )
          )
        );
      }

      // Create performance discussion
      const performanceDiscussion = this.performanceDiscussionRepo.create({
        conversation_id: conversation.id,
        conversation,
        player_id: dto.playerId,
        coach_id: dto.coachId,
        training_discussion_id: dto.trainingDiscussionId,
        period: dto.period,
        start_date: dto.startDate,
        end_date: dto.endDate,
        organization_id: dto.organizationId,
        team_id: dto.teamId,
        performance_metrics: dto.performanceMetrics,
        goals: dto.goals?.map((goal, index) => ({
          id: `goal_${index}_${Date.now()}`,
          ...goal,
          status: 'pending' as const,
          progress: 0,
        })),
        action_items: [],
        strengths: dto.strengths,
        areas_for_improvement: dto.areasForImprovement,
        training_recommendations: dto.trainingRecommendations,
        overall_assessment: dto.overallAssessment,
        overall_rating: dto.overallRating,
        is_confidential: dto.isConfidential || false,
        parent_can_view: dto.parentCanView !== false,
        shared_with: dto.sharedWith,
        scheduled_review_date: dto.scheduledReviewDate,
        created_by: dto.coachId,
      });

      const saved = await this.performanceDiscussionRepo.save(performanceDiscussion);

      // Send initial message
      const summaryMessage = this.generatePerformanceSummary(saved);
      await this.messageService.sendMessage(conversation.id, dto.coachId, {
        content: summaryMessage,
        type: MessageType.SYSTEM,
        metadata: {
          performanceDiscussionId: saved.id,
          period: dto.period,
          overallRating: dto.overallRating,
        },
      });

      // Send notification to player
      await this.notificationService.createNotification({
        userId: dto.playerId,
        type: 'performance_review',
        title: 'New Performance Review',
        message: `Your coach has created a performance review for ${dto.period}`,
        priority: 'medium',
        metadata: {
          performanceDiscussionId: saved.id,
          conversationId: conversation.id,
          coachId: dto.coachId,
        },
      });

      this.logger.info('Performance discussion created', { 
        id: saved.id, 
        playerId: dto.playerId,
        period: dto.period,
      });

      return saved;
    } catch (error) {
      this.logger.error('Failed to create performance discussion', error);
      throw error;
    }
  }

  async addPerformanceFeedback(dto: CreatePerformanceFeedbackDto): Promise<PerformanceFeedback> {
    try {
      // Get the performance discussion
      const discussion = await this.performanceDiscussionRepo.findOne({
        where: { id: dto.performanceDiscussionId },
        relations: ['conversation'],
      });

      if (!discussion) {
        throw new Error('Performance discussion not found');
      }

      // Create feedback
      const feedback = this.performanceFeedbackRepo.create({
        performance_discussion_id: dto.performanceDiscussionId,
        provided_by: dto.providedBy,
        feedback_type: dto.feedbackType,
        feedback_content: dto.feedbackContent,
        specific_metrics: dto.specificMetrics,
        attachments: dto.attachments,
        is_private: dto.isPrivate || false,
      });

      const saved = await this.performanceFeedbackRepo.save(feedback);

      // Send message to conversation if not private
      if (!dto.isPrivate) {
        await this.messageService.sendMessage(discussion.conversation_id, dto.providedBy, {
          content: `${dto.feedbackType} feedback: ${dto.feedbackContent}`,
          type: MessageType.TEXT,
          metadata: {
            feedbackId: saved.id,
            feedbackType: dto.feedbackType,
            specificMetrics: dto.specificMetrics,
          },
        });
      }

      this.logger.info('Performance feedback added', { 
        id: saved.id, 
        discussionId: dto.performanceDiscussionId,
        providedBy: dto.providedBy,
      });

      return saved;
    } catch (error) {
      this.logger.error('Failed to add performance feedback', error);
      throw error;
    }
  }

  async updatePerformanceMetrics(dto: UpdatePerformanceMetricsDto): Promise<PerformanceDiscussion> {
    try {
      const discussion = await this.performanceDiscussionRepo.findOne({
        where: { id: dto.performanceDiscussionId },
      });

      if (!discussion) {
        throw new Error('Performance discussion not found');
      }

      // Update metrics
      const updatedMetrics = discussion.performance_metrics.map(metric => {
        const update = dto.metrics.find(m => m.metric_type === metric.metric_type);
        if (update) {
          return {
            ...metric,
            previous_value: metric.current_value,
            current_value: update.current_value,
            trend: update.trend,
            notes: update.notes || metric.notes,
          };
        }
        return metric;
      });

      discussion.performance_metrics = updatedMetrics;
      const saved = await this.performanceDiscussionRepo.save(discussion);

      // Send update message
      await this.messageService.sendMessage(discussion.conversation_id, dto.userId, {
        content: 'Performance metrics have been updated',
        type: MessageType.SYSTEM,
        metadata: {
          updatedMetrics: dto.metrics,
        },
      });

      return saved;
    } catch (error) {
      this.logger.error('Failed to update performance metrics', error);
      throw error;
    }
  }

  async addActionItem(dto: AddActionItemDto): Promise<PerformanceDiscussion> {
    try {
      const discussion = await this.performanceDiscussionRepo.findOne({
        where: { id: dto.performanceDiscussionId },
      });

      if (!discussion) {
        throw new Error('Performance discussion not found');
      }

      const newActionItem = {
        id: `action_${Date.now()}`,
        description: dto.description,
        assigned_to: dto.assignedTo,
        due_date: dto.dueDate?.toISOString(),
        completed: false,
      };

      discussion.action_items = [...(discussion.action_items || []), newActionItem];
      const saved = await this.performanceDiscussionRepo.save(discussion);

      // Send notification to assigned user
      if (dto.assignedTo !== dto.createdBy) {
        await this.notificationService.createNotification({
          userId: dto.assignedTo,
          type: 'action_item_assigned',
          title: 'New Action Item',
          message: `You have been assigned: ${dto.description}`,
          priority: 'medium',
          metadata: {
            actionItemId: newActionItem.id,
            performanceDiscussionId: dto.performanceDiscussionId,
            dueDate: dto.dueDate?.toISOString(),
          },
        });
      }

      return saved;
    } catch (error) {
      this.logger.error('Failed to add action item', error);
      throw error;
    }
  }

  async getPerformanceDiscussion(id: string): Promise<PerformanceDiscussion | null> {
    return this.performanceDiscussionRepo.findOne({
      where: { id },
      relations: ['conversation', 'training_discussion'],
    });
  }

  async getPlayerPerformanceDiscussions(
    playerId: string, 
    options?: { period?: PerformancePeriod; limit?: number }
  ): Promise<PerformanceDiscussion[]> {
    const query = this.performanceDiscussionRepo.createQueryBuilder('pd')
      .leftJoinAndSelect('pd.conversation', 'conversation')
      .where('pd.player_id = :playerId', { playerId })
      .orderBy('pd.created_at', 'DESC');

    if (options?.period) {
      query.andWhere('pd.period = :period', { period: options.period });
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    return query.getMany();
  }

  async getUpcomingReviews(organizationId: string, daysAhead: number = 7): Promise<PerformanceDiscussion[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    return this.performanceDiscussionRepo.find({
      where: {
        organization_id: organizationId,
        scheduled_review_date: Between(startDate, endDate),
        completed_at: IsNull(),
      },
      relations: ['conversation'],
      order: { scheduled_review_date: 'ASC' },
    });
  }

  async completePerformanceDiscussion(id: string, userId: string): Promise<PerformanceDiscussion> {
    const discussion = await this.performanceDiscussionRepo.findOne({
      where: { id },
    });

    if (!discussion) {
      throw new Error('Performance discussion not found');
    }

    discussion.completed_at = new Date();
    discussion.completed_by = userId;

    return this.performanceDiscussionRepo.save(discussion);
  }

  async getPerformanceTrends(
    playerId: string, 
    metricType: PerformanceMetricType,
    period: { startDate: Date; endDate: Date }
  ): Promise<{
    metric_type: PerformanceMetricType;
    data_points: { date: Date; value: number; notes?: string }[];
    trend: PerformanceTrend;
    average_value: number;
  }> {
    const discussions = await this.performanceDiscussionRepo.find({
      where: {
        player_id: playerId,
        created_at: Between(period.startDate, period.endDate),
      },
      order: { created_at: 'ASC' },
    });

    const dataPoints = discussions
      .map(d => {
        const metric = d.performance_metrics.find(m => m.metric_type === metricType);
        if (metric) {
          return {
            date: d.created_at,
            value: metric.current_value,
            notes: metric.notes,
          };
        }
        return null;
      })
      .filter(Boolean) as { date: Date; value: number; notes?: string }[];

    // Calculate trend
    let trend: PerformanceTrend = PerformanceTrend.CONSISTENT;
    if (dataPoints.length >= 2) {
      const firstValue = dataPoints[0].value;
      const lastValue = dataPoints[dataPoints.length - 1].value;
      const percentChange = ((lastValue - firstValue) / firstValue) * 100;

      if (percentChange > 10) {
        trend = PerformanceTrend.IMPROVING;
      } else if (percentChange < -10) {
        trend = PerformanceTrend.DECLINING;
      } else {
        // Check for variability
        const values = dataPoints.map(d => d.value);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = (stdDev / avg) * 100;

        if (coefficientOfVariation > 20) {
          trend = PerformanceTrend.VARIABLE;
        }
      }
    }

    const averageValue = dataPoints.reduce((sum, d) => sum + d.value, 0) / dataPoints.length || 0;

    return {
      metric_type: metricType,
      data_points: dataPoints,
      trend,
      average_value: averageValue,
    };
  }

  private generatePerformanceSummary(discussion: PerformanceDiscussion): string {
    const lines = [`🎯 Performance Review Created - ${discussion.period}`];
    
    if (discussion.overall_rating) {
      lines.push(`Overall Rating: ${discussion.overall_rating}/10`);
    }

    if (discussion.strengths?.length) {
      lines.push('\n💪 Strengths:');
      discussion.strengths.forEach(s => lines.push(`• ${s}`));
    }

    if (discussion.areas_for_improvement?.length) {
      lines.push('\n📈 Areas for Improvement:');
      discussion.areas_for_improvement.forEach(a => lines.push(`• ${a}`));
    }

    if (discussion.goals?.length) {
      lines.push('\n🎯 Goals:');
      discussion.goals.forEach(g => lines.push(`• ${g.description}`));
    }

    if (discussion.overall_assessment) {
      lines.push(`\n📝 Assessment: ${discussion.overall_assessment}`);
    }

    return lines.join('\n');
  }
}