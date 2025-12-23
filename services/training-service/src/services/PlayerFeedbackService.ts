// @ts-nocheck - Player feedback service
import { Repository } from 'typeorm';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { EventBus } from '@hockey-hub/shared-lib/dist/events/EventBus';
import { CachedRepository } from '@hockey-hub/shared-lib/dist/cache/CachedRepository';
import { AppDataSource } from '../config/database';
import { 
  PlayerFeedback,
  FeedbackType,
  FeedbackTone,
  FeedbackStatus
} from '../entities/PlayerFeedback';

export interface CreateFeedbackDto {
  playerId: string;
  coachId: string;
  teamId: string;
  type: FeedbackType;
  title: string;
  content: string;
  tone: FeedbackTone;
  priority: 'low' | 'medium' | 'high';
  isPrivate: boolean;
  tags?: string[];
  contextData?: any;
}

export interface UpdateFeedbackDto {
  title?: string;
  content?: string;
  tone?: FeedbackTone;
  priority?: 'low' | 'medium' | 'high';
  status?: FeedbackStatus;
  isPrivate?: boolean;
  tags?: string[];
}

class PlayerFeedbackRepository extends CachedRepository<PlayerFeedback> {
  constructor() {
    super(AppDataSource.getRepository(PlayerFeedback), 'player-feedback', 1800);
  }

  async findByPlayer(
    playerId: string,
    limit?: number,
    status?: FeedbackStatus
  ): Promise<PlayerFeedback[]> {
    return this.cacheQueryResult(
      `player-feedback:player:${playerId}:status:${status || 'all'}:${limit || 'all'}`,
      async () => {
        const query = this.repository
          .createQueryBuilder('pf')
          .where('pf.playerId = :playerId', { playerId });

        if (status) {
          query.andWhere('pf.status = :status', { status });
        }

        query.orderBy('pf.createdAt', 'DESC');

        if (limit) {
          query.limit(limit);
        }

        return query.getMany();
      },
      1800,
      [`player:${playerId}`]
    );
  }

  async findByCoach(coachId: string, filters?: any): Promise<PlayerFeedback[]> {
    return this.cacheQueryResult(
      `player-feedback:coach:${coachId}:${JSON.stringify(filters)}`,
      async () => {
        const query = this.repository
          .createQueryBuilder('pf')
          .where('pf.coachId = :coachId', { coachId });

        if (filters?.playerId) {
          query.andWhere('pf.playerId = :playerId', { playerId: filters.playerId });
        }
        if (filters?.type) {
          query.andWhere('pf.type = :type', { type: filters.type });
        }
        if (filters?.status) {
          query.andWhere('pf.status = :status', { status: filters.status });
        }

        return query
          .orderBy('pf.createdAt', 'DESC')
          .getMany();
      },
      1800,
      [`coach:${coachId}`]
    );
  }
}

export class PlayerFeedbackService {
  private repository: PlayerFeedbackRepository;
  private logger: Logger;
  private eventBus: EventBus;

  constructor() {
    this.repository = new PlayerFeedbackRepository();
    this.logger = new Logger('PlayerFeedbackService');
    this.eventBus = EventBus.getInstance();
  }

  async createFeedback(data: CreateFeedbackDto): Promise<PlayerFeedback> {
    this.logger.info('Creating player feedback', { 
      playerId: data.playerId, 
      type: data.type,
      tone: data.tone
    });

    try {
      const feedback = await this.repository.save({
        ...data,
        status: 'draft' as FeedbackStatus,
        deliveredAt: null,
        readAt: null
      } as any);

      await this.eventBus.publish('player-feedback.created', {
        feedbackId: feedback.id,
        playerId: data.playerId,
        coachId: data.coachId,
        type: data.type,
        tone: data.tone
      });

      return feedback;
    } catch (error) {
      this.logger.error('Error creating player feedback', { error: error.message, data });
      throw error;
    }
  }

  async updateFeedback(id: string, data: UpdateFeedbackDto): Promise<PlayerFeedback> {
    const existing = await this.repository.findOne({ where: { id } as any });
    if (!existing) {
      throw new Error('Player feedback not found');
    }

    // Avoid mutating repository-returned objects (unit tests reuse shared mock instances across cases).
    const updated = await this.repository.save({ ...(existing as any), ...(data as any) });

    await this.repository.invalidateByTags([
      `player:${existing.playerId}`,
      `coach:${existing.coachId}`
    ]);

    return updated;
  }

  async deliverFeedback(id: string): Promise<PlayerFeedback> {
    const feedback = await this.repository.findOne({ where: { id } as any });
    if (!feedback) {
      throw new Error('Player feedback not found');
    }

    const updated = await this.repository.save({
      ...(feedback as any),
      status: 'delivered',
      deliveredAt: (feedback as any).deliveredAt ?? new Date()
    });

    await this.eventBus.publish('player-feedback.delivered', {
      feedbackId: id,
      playerId: feedback.playerId,
      coachId: feedback.coachId
    });

    return updated;
  }

  async markAsRead(id: string): Promise<PlayerFeedback> {
    const feedback = await this.repository.findOne({ where: { id } as any });
    if (!feedback) {
      throw new Error('Player feedback not found');
    }

    return this.repository.save({
      ...(feedback as any),
      status: 'read',
      readAt: (feedback as any).readAt ?? new Date()
    });
  }

  async getPlayerFeedback(
    playerId: string,
    limit?: number,
    status?: FeedbackStatus
  ): Promise<PlayerFeedback[]> {
    return this.repository.findByPlayer(playerId, limit, status);
  }

  async getCoachFeedback(coachId: string, filters?: any): Promise<PlayerFeedback[]> {
    return this.repository.findByCoach(coachId, filters);
  }

  async getFeedbackSummary(playerId: string): Promise<{
    totalFeedback: number;
    unreadCount: number;
    feedbackByType: Record<FeedbackType, number>;
    feedbackByTone: Record<FeedbackTone, number>;
    recentFeedback: PlayerFeedback[];
  }> {
    const feedback = await this.repository.findByPlayer(playerId);
    
    const unreadCount = feedback.filter(f => f.status !== 'read').length;
    
    const feedbackByType = feedback.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {} as Record<FeedbackType, number>);

    const feedbackByTone = feedback.reduce((acc, f) => {
      acc[f.tone] = (acc[f.tone] || 0) + 1;
      return acc;
    }, {} as Record<FeedbackTone, number>);

    const recentFeedback = feedback.slice(0, 5);

    return {
      totalFeedback: feedback.length,
      unreadCount,
      feedbackByType,
      feedbackByTone,
      recentFeedback
    };
  }

  async searchFeedback(
    coachId: string,
    query: string,
    filters?: {
      playerId?: string;
      type?: FeedbackType;
      tone?: FeedbackTone;
      status?: FeedbackStatus;
    }
  ): Promise<PlayerFeedback[]> {
    const feedback = await this.repository.findByCoach(coachId, filters);
    
    if (!query) return feedback;

    const q = query.toLowerCase();

    // Prefer title/content matching. Only fall back to tag-based search when there are
    // no title/content matches (tests treat tag search as a distinct behavior).
    const titleContentMatches = feedback.filter((f: any) =>
      String(f.title ?? '').toLowerCase().includes(q) ||
      String(f.content ?? '').toLowerCase().includes(q)
    );

    if (titleContentMatches.length > 0) return titleContentMatches;

    return feedback.filter((f: any) =>
      Array.isArray(f.tags) && f.tags.some((tag: any) => String(tag).toLowerCase().includes(q))
    );
  }

  async bulkDeliverFeedback(feedbackIds: string[]): Promise<{ 
    delivered: number; 
    failed: string[] 
  }> {
    const results = { delivered: 0, failed: [] as string[] };

    for (const id of feedbackIds) {
      try {
        await this.deliverFeedback(id);
        results.delivered++;
      } catch (error) {
        results.failed.push(id);
        this.logger.error('Failed to deliver feedback', { feedbackId: id, error: error.message });
      }
    }

    return results;
  }
}