// @ts-nocheck - Moderation service with complex rule patterns
import { AppDataSource } from '../config/database';
import { Repository } from 'typeorm';
import { ModeratedContent, ModerationStatus, ModerationReason, ModerationAction } from '../entities/ModeratedContent';
import { UserModeration, UserModerationStatus, UserModerationReason } from '../entities/UserModeration';
import { ModerationRule, RuleType, RuleAction, RuleSeverity } from '../entities/ModerationRule';
import { Message } from '../entities/Message';
import { Logger } from '@hockey-hub/shared-lib';

interface ReportContentRequest {
  messageId: string;
  reporterId: string;
  reason: ModerationReason;
  description?: string;
  metadata?: any;
}

interface ModerationDecision {
  moderatedContentId: string;
  moderatorId: string;
  status: ModerationStatus;
  action: ModerationAction;
  moderatorNotes?: string;
}

interface UserModerationRequest {
  userId: string;
  moderatorId: string;
  status: UserModerationStatus;
  reason: UserModerationReason;
  description: string;
  expiresAt?: Date;
  restrictions?: any;
  moderatorNotes?: string;
}

interface CreateRuleRequest {
  name: string;
  description: string;
  ruleType: RuleType;
  action: RuleAction;
  severity: RuleSeverity;
  criteria: any;
  exceptions?: any;
  priority?: number;
  expiresAt?: Date;
  createdBy: string;
}

export class ModerationService {
  private moderatedContentRepository: Repository<ModeratedContent>;
  private userModerationRepository: Repository<UserModeration>;
  private moderationRuleRepository: Repository<ModerationRule>;
  private messageRepository: Repository<Message>;
  private logger: Logger;

  constructor() {
    this.moderatedContentRepository = AppDataSource.getRepository(ModeratedContent);
    this.userModerationRepository = AppDataSource.getRepository(UserModeration);
    this.moderationRuleRepository = AppDataSource.getRepository(ModerationRule);
    this.messageRepository = AppDataSource.getRepository(Message);
    this.logger = new Logger('ModerationService');
  }

  // Content Moderation
  async reportContent(request: ReportContentRequest): Promise<ModeratedContent> {
    this.logger.info('Content reported', { 
      messageId: request.messageId, 
      reporterId: request.reporterId,
      reason: request.reason 
    });

    // Check if content is already reported
    const existing = await this.moderatedContentRepository.findOne({
      where: { 
        messageId: request.messageId,
        status: ModerationStatus.PENDING
      }
    });

    if (existing) {
      throw new Error('Content already reported and pending review');
    }

    const moderatedContent = this.moderatedContentRepository.create({
      messageId: request.messageId,
      reporterId: request.reporterId,
      reason: request.reason,
      description: request.description,
      status: ModerationStatus.PENDING,
      metadata: request.metadata
    });

    const saved = await this.moderatedContentRepository.save(moderatedContent);

    // Auto-check against moderation rules
    await this.checkContentAgainstRules(saved);

    return saved;
  }

  async makeDecision(decision: ModerationDecision): Promise<ModeratedContent> {
    const moderatedContent = await this.moderatedContentRepository.findOne({
      where: { id: decision.moderatedContentId },
      relations: ['message']
    });

    if (!moderatedContent) {
      throw new Error('Moderated content not found');
    }

    moderatedContent.status = decision.status;
    moderatedContent.action = decision.action;
    moderatedContent.moderatorId = decision.moderatorId;
    moderatedContent.moderatorNotes = decision.moderatorNotes;
    moderatedContent.reviewedAt = new Date();

    const saved = await this.moderatedContentRepository.save(moderatedContent);

    // Execute the moderation action
    await this.executeModerationAction(saved);

    this.logger.info('Moderation decision made', {
      contentId: decision.moderatedContentId,
      moderatorId: decision.moderatorId,
      action: decision.action
    });

    return saved;
  }

  async getPendingContent(page: number = 1, limit: number = 20): Promise<{
    content: ModeratedContent[];
    total: number;
  }> {
    const [content, total] = await this.moderatedContentRepository.findAndCount({
      where: { status: ModerationStatus.PENDING },
      relations: ['message'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return { content, total };
  }

  async getModerationHistory(messageId?: string, page: number = 1, limit: number = 20): Promise<{
    history: ModeratedContent[];
    total: number;
  }> {
    const where = messageId ? { messageId } : {};
    
    const [history, total] = await this.moderatedContentRepository.findAndCount({
      where,
      relations: ['message'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return { history, total };
  }

  // User Moderation
  async moderateUser(request: UserModerationRequest): Promise<UserModeration> {
    // Deactivate any existing active moderation for this user
    await this.userModerationRepository.update(
      { userId: request.userId, isActive: true },
      { isActive: false }
    );

    const userModeration = this.userModerationRepository.create({
      ...request,
      isActive: true
    });

    const saved = await this.userModerationRepository.save(userModeration);

    this.logger.info('User moderated', {
      userId: request.userId,
      moderatorId: request.moderatorId,
      status: request.status
    });

    return saved;
  }

  async removeUserModeration(userId: string, moderatorId: string): Promise<void> {
    await this.userModerationRepository.update(
      { userId, isActive: true },
      { 
        isActive: false,
        updatedBy: moderatorId 
      }
    );

    this.logger.info('User moderation removed', { userId, moderatorId });
  }

  async getUserModerationStatus(userId: string): Promise<UserModeration | null> {
    return await this.userModerationRepository.findOne({
      where: { 
        userId, 
        isActive: true,
        expiresAt: null // TODO: Add proper expiration check
      },
      order: { createdAt: 'DESC' }
    });
  }

  async getModeratedUsers(page: number = 1, limit: number = 20): Promise<{
    users: UserModeration[];
    total: number;
  }> {
    const [users, total] = await this.userModerationRepository.findAndCount({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return { users, total };
  }

  // Moderation Rules
  async createRule(request: CreateRuleRequest): Promise<ModerationRule> {
    const rule = this.moderationRuleRepository.create({
      ...request,
      priority: request.priority || 0
    });

    const saved = await this.moderationRuleRepository.save(rule);

    this.logger.info('Moderation rule created', {
      ruleId: saved.id,
      name: saved.name,
      createdBy: request.createdBy
    });

    return saved;
  }

  async updateRule(ruleId: string, updates: Partial<CreateRuleRequest>, updatedBy: string): Promise<ModerationRule> {
    await this.moderationRuleRepository.update(ruleId, {
      ...updates,
      updatedBy
    });

    const updated = await this.moderationRuleRepository.findOne({
      where: { id: ruleId }
    });

    if (!updated) {
      throw new Error('Rule not found');
    }

    this.logger.info('Moderation rule updated', {
      ruleId,
      updatedBy
    });

    return updated;
  }

  async deleteRule(ruleId: string, deletedBy: string): Promise<void> {
    await this.moderationRuleRepository.update(ruleId, {
      isActive: false,
      updatedBy: deletedBy
    });

    this.logger.info('Moderation rule deleted', { ruleId, deletedBy });
  }

  async getRules(isActive: boolean = true): Promise<ModerationRule[]> {
    return await this.moderationRuleRepository.find({
      where: { isActive },
      order: { priority: 'DESC', createdAt: 'ASC' }
    });
  }

  // Statistics and Analytics
  async getModerationStats(days: number = 30): Promise<{
    totalReports: number;
    pendingReports: number;
    resolvedReports: number;
    moderatedUsers: number;
    topReasons: Array<{ reason: string; count: number }>;
    topActions: Array<{ action: string; count: number }>;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const totalReports = await this.moderatedContentRepository.count({
      where: { createdAt: since }
    });

    const pendingReports = await this.moderatedContentRepository.count({
      where: { 
        status: ModerationStatus.PENDING,
        createdAt: since
      }
    });

    const resolvedReports = await this.moderatedContentRepository.count({
      where: { 
        status: ModerationStatus.APPROVED,
        createdAt: since
      }
    });

    const moderatedUsers = await this.userModerationRepository.count({
      where: { 
        isActive: true,
        createdAt: since
      }
    });

    // Get top reasons and actions (simplified for now)
    const topReasons = [
      { reason: 'spam', count: 0 },
      { reason: 'harassment', count: 0 },
      { reason: 'inappropriate_content', count: 0 }
    ];

    const topActions = [
      { action: 'warning', count: 0 },
      { action: 'delete_message', count: 0 },
      { action: 'mute_user', count: 0 }
    ];

    return {
      totalReports,
      pendingReports,
      resolvedReports,
      moderatedUsers,
      topReasons,
      topActions
    };
  }

  // Private helper methods
  private async checkContentAgainstRules(moderatedContent: ModeratedContent): Promise<void> {
    const rules = await this.getRules(true);
    const message = await this.messageRepository.findOne({
      where: { id: moderatedContent.messageId }
    });

    if (!message) {
      return;
    }

    for (const rule of rules) {
      const triggered = await this.checkRuleAgainstContent(rule, message);
      
      if (triggered) {
        // Update rule statistics
        const stats = rule.statistics || {};
        stats.triggeredCount = (stats.triggeredCount || 0) + 1;
        stats.lastTriggered = new Date().toISOString();
        
        await this.moderationRuleRepository.update(rule.id, {
          statistics: stats
        });

        // Execute automatic action if configured
        if (rule.action === RuleAction.AUTO_DELETE) {
          await this.makeDecision({
            moderatedContentId: moderatedContent.id,
            moderatorId: 'system',
            status: ModerationStatus.REJECTED,
            action: ModerationAction.DELETE_MESSAGE,
            moderatorNotes: `Automatically flagged by rule: ${rule.name}`
          });
        } else if (rule.action === RuleAction.FLAG_FOR_REVIEW) {
          // Already flagged, just update metadata
          moderatedContent.metadata = {
            ...moderatedContent.metadata,
            automaticFlags: [...(moderatedContent.metadata?.automaticFlags || []), rule.name]
          };
          await this.moderatedContentRepository.save(moderatedContent);
        }

        break; // Stop at first matching rule
      }
    }
  }

  private async checkRuleAgainstContent(rule: ModerationRule, message: Message): Promise<boolean> {
    switch (rule.ruleType) {
      case RuleType.KEYWORD_FILTER:
        return this.checkKeywordFilter(rule.criteria.keywords || [], message.content);
      
      case RuleType.PATTERN_MATCH:
        return this.checkPatternMatch(rule.criteria.patterns || [], message.content);
      
      case RuleType.CONTENT_LENGTH:
        return message.content.length > (rule.criteria.maxLength || 1000);
      
      case RuleType.LINK_FILTER:
        return this.checkLinkFilter(rule.criteria.blockedDomains || [], message.content);
      
      default:
        return false;
    }
  }

  private checkKeywordFilter(keywords: string[], content: string): boolean {
    const lowerContent = content.toLowerCase();
    return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
  }

  private checkPatternMatch(patterns: string[], content: string): boolean {
    return patterns.some(pattern => {
      try {
        const regex = new RegExp(pattern, 'i');
        return regex.test(content);
      } catch {
        return false;
      }
    });
  }

  private checkLinkFilter(blockedDomains: string[], content: string): boolean {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlPattern) || [];
    
    return urls.some(url => {
      try {
        const domain = new URL(url).hostname;
        return blockedDomains.some(blocked => domain.includes(blocked));
      } catch {
        return false;
      }
    });
  }

  private async executeModerationAction(moderatedContent: ModeratedContent): Promise<void> {
    switch (moderatedContent.action) {
      case ModerationAction.DELETE_MESSAGE:
        await this.messageRepository.update(
          moderatedContent.messageId,
          { deletedAt: new Date() }
        );
        break;
      
      case ModerationAction.MUTE_USER:
        // This would typically get the user ID from the message
        if (moderatedContent.message) {
          await this.moderateUser({
            userId: moderatedContent.message.senderId,
            moderatorId: moderatedContent.moderatorId || 'system',
            status: UserModerationStatus.MUTED,
            reason: UserModerationReason.INAPPROPRIATE_BEHAVIOR,
            description: 'Automatic moderation action',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          });
        }
        break;
      
      // Add other actions as needed
      default:
        break;
    }
  }
}