import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { PerformanceDiscussionService } from '../services/PerformanceDiscussionService';
import { ConversationService } from '../services/ConversationService';
import { MessageService } from '../services/MessageService';
import { NotificationService } from '../services/NotificationService';
import { 
  PerformanceDiscussion, 
  PerformanceFeedback,
  PerformancePeriod,
  PerformanceMetricType,
  PerformanceTrend
} from '../entities/PerformanceDiscussion';
import { Conversation } from '../entities/Conversation';
import { Message } from '../entities/Message';
import { ConversationParticipant } from '../entities/ConversationParticipant';
import { authenticateToken } from '@hockey-hub/shared-lib';
import { Logger } from '@hockey-hub/shared-lib';

const router = Router();
const logger = new Logger('PerformanceDiscussionRoutes');

// Initialize repositories and services
const performanceDiscussionRepo = AppDataSource.getRepository(PerformanceDiscussion);
const performanceFeedbackRepo = AppDataSource.getRepository(PerformanceFeedback);
const conversationRepo = AppDataSource.getRepository(Conversation);
const messageRepo = AppDataSource.getRepository(Message);
const participantRepo = AppDataSource.getRepository(ConversationParticipant);

const conversationService = new ConversationService(
  conversationRepo,
  participantRepo,
  messageRepo
);

const messageService = new MessageService(
  messageRepo,
  conversationRepo,
  participantRepo,
  AppDataSource.getRepository('MessageAttachment')
);

const notificationService = new NotificationService(
  AppDataSource.getRepository('Notification'),
  AppDataSource.getRepository('NotificationTemplate'),
  AppDataSource.getRepository('NotificationPreference'),
  AppDataSource.getRepository('NotificationQueue')
);

const performanceDiscussionService = new PerformanceDiscussionService(
  performanceDiscussionRepo,
  performanceFeedbackRepo,
  conversationRepo,
  participantRepo,
  conversationService,
  messageService,
  notificationService
);

// Create a new performance discussion
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const {
      playerId,
      trainingDiscussionId,
      period,
      startDate,
      endDate,
      performanceMetrics,
      goals,
      strengths,
      areasForImprovement,
      trainingRecommendations,
      overallAssessment,
      overallRating,
      isConfidential,
      parentCanView,
      sharedWith,
      scheduledReviewDate,
    } = req.body;

    // Validate required fields
    if (!playerId || !period || !startDate || !endDate || !performanceMetrics?.length) {
      return res.status(400).json({ 
        error: 'Missing required fields: playerId, period, startDate, endDate, performanceMetrics' 
      });
    }

    // Validate coach permission
    if (!user.roles?.includes('coach') && !user.roles?.includes('trainer')) {
      return res.status(403).json({ error: 'Only coaches and trainers can create performance discussions' });
    }

    // Create the performance discussion
    const discussion = await performanceDiscussionService.createPerformanceDiscussion({
      playerId,
      coachId: user.id,
      trainingDiscussionId,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      organizationId: user.organizationId,
      teamId: user.teamId,
      performanceMetrics,
      goals,
      strengths,
      areasForImprovement,
      trainingRecommendations,
      overallAssessment,
      overallRating,
      isConfidential,
      parentCanView,
      sharedWith,
      scheduledReviewDate: scheduledReviewDate ? new Date(scheduledReviewDate) : undefined,
    });

    logger.info('Performance discussion created', { 
      discussionId: discussion.id, 
      playerId, 
      coachId: user.id 
    });

    res.status(201).json(discussion);
  } catch (error) {
    logger.error('Failed to create performance discussion', error);
    res.status(500).json({ error: 'Failed to create performance discussion' });
  }
});

// Get performance discussion by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const discussion = await performanceDiscussionService.getPerformanceDiscussion(id);
    
    if (!discussion) {
      return res.status(404).json({ error: 'Performance discussion not found' });
    }

    // Check access permissions
    const hasAccess = 
      discussion.player_id === user.id ||
      discussion.coach_id === user.id ||
      discussion.shared_with?.includes(user.id) ||
      (discussion.parent_can_view && user.roles?.includes('parent')) ||
      user.roles?.includes('admin');

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(discussion);
  } catch (error) {
    logger.error('Failed to get performance discussion', error);
    res.status(500).json({ error: 'Failed to get performance discussion' });
  }
});

// Get player's performance discussions
router.get('/player/:playerId', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { period, limit } = req.query;
    const { user } = req;

    // Check access permissions
    const hasAccess = 
      playerId === user.id ||
      user.roles?.includes('coach') ||
      user.roles?.includes('trainer') ||
      (user.roles?.includes('parent') && user.childIds?.includes(playerId)) ||
      user.roles?.includes('admin');

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const discussions = await performanceDiscussionService.getPlayerPerformanceDiscussions(
      playerId,
      {
        period: period as PerformancePeriod,
        limit: limit ? parseInt(limit as string) : undefined,
      }
    );

    // Filter based on access level
    const filteredDiscussions = discussions.filter(d => {
      if (user.roles?.includes('parent') && !d.parent_can_view && d.is_confidential) {
        return false;
      }
      return true;
    });

    res.json(filteredDiscussions);
  } catch (error) {
    logger.error('Failed to get player performance discussions', error);
    res.status(500).json({ error: 'Failed to get performance discussions' });
  }
});

// Add performance feedback
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const {
      feedbackContent,
      specificMetrics,
      attachments,
      isPrivate,
    } = req.body;

    if (!feedbackContent) {
      return res.status(400).json({ error: 'Feedback content is required' });
    }

    // Determine feedback type based on user role
    let feedbackType: 'coach' | 'player' | 'parent' | 'peer' = 'peer';
    if (user.roles?.includes('coach') || user.roles?.includes('trainer')) {
      feedbackType = 'coach';
    } else if (user.roles?.includes('parent')) {
      feedbackType = 'parent';
    } else if (user.roles?.includes('player')) {
      feedbackType = 'player';
    }

    const feedback = await performanceDiscussionService.addPerformanceFeedback({
      performanceDiscussionId: id,
      providedBy: user.id,
      feedbackType,
      feedbackContent,
      specificMetrics,
      attachments,
      isPrivate,
    });

    res.status(201).json(feedback);
  } catch (error) {
    logger.error('Failed to add performance feedback', error);
    res.status(500).json({ error: 'Failed to add performance feedback' });
  }
});

// Update performance metrics
router.put('/:id/metrics', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { metrics } = req.body;

    if (!metrics?.length) {
      return res.status(400).json({ error: 'Metrics are required' });
    }

    // Only coaches and trainers can update metrics
    if (!user.roles?.includes('coach') && !user.roles?.includes('trainer')) {
      return res.status(403).json({ error: 'Only coaches and trainers can update metrics' });
    }

    const updatedDiscussion = await performanceDiscussionService.updatePerformanceMetrics({
      performanceDiscussionId: id,
      metrics,
      userId: user.id,
    });

    res.json(updatedDiscussion);
  } catch (error) {
    logger.error('Failed to update performance metrics', error);
    res.status(500).json({ error: 'Failed to update performance metrics' });
  }
});

// Add action item
router.post('/:id/action-items', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { description, assignedTo, dueDate } = req.body;

    if (!description || !assignedTo) {
      return res.status(400).json({ error: 'Description and assignedTo are required' });
    }

    // Only coaches and trainers can add action items
    if (!user.roles?.includes('coach') && !user.roles?.includes('trainer')) {
      return res.status(403).json({ error: 'Only coaches and trainers can add action items' });
    }

    const updatedDiscussion = await performanceDiscussionService.addActionItem({
      performanceDiscussionId: id,
      description,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: user.id,
    });

    res.json(updatedDiscussion);
  } catch (error) {
    logger.error('Failed to add action item', error);
    res.status(500).json({ error: 'Failed to add action item' });
  }
});

// Complete action item
router.put('/:id/action-items/:actionId/complete', authenticateToken, async (req, res) => {
  try {
    const { id, actionId } = req.params;
    const { user } = req;

    const discussion = await performanceDiscussionService.getPerformanceDiscussion(id);
    if (!discussion) {
      return res.status(404).json({ error: 'Performance discussion not found' });
    }

    const actionItems = discussion.action_items || [];
    const actionItem = actionItems.find(item => item.id === actionId);
    
    if (!actionItem) {
      return res.status(404).json({ error: 'Action item not found' });
    }

    // Only assigned user or coaches can complete action items
    if (actionItem.assigned_to !== user.id && 
        !user.roles?.includes('coach') && 
        !user.roles?.includes('trainer')) {
      return res.status(403).json({ error: 'Only assigned user or coaches can complete action items' });
    }

    // Update action item
    actionItem.completed = true;
    actionItem.completed_at = new Date().toISOString();

    await performanceDiscussionRepo.save(discussion);

    res.json(discussion);
  } catch (error) {
    logger.error('Failed to complete action item', error);
    res.status(500).json({ error: 'Failed to complete action item' });
  }
});

// Get upcoming reviews
router.get('/organization/upcoming', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { daysAhead = '7' } = req.query;

    // Only coaches, trainers, and admins can view upcoming reviews
    if (!user.roles?.includes('coach') && 
        !user.roles?.includes('trainer') && 
        !user.roles?.includes('admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const reviews = await performanceDiscussionService.getUpcomingReviews(
      user.organizationId,
      parseInt(daysAhead as string)
    );

    res.json(reviews);
  } catch (error) {
    logger.error('Failed to get upcoming reviews', error);
    res.status(500).json({ error: 'Failed to get upcoming reviews' });
  }
});

// Get performance trends
router.get('/player/:playerId/trends/:metricType', authenticateToken, async (req, res) => {
  try {
    const { playerId, metricType } = req.params;
    const { startDate, endDate } = req.query;
    const { user } = req;

    // Check access permissions
    const hasAccess = 
      playerId === user.id ||
      user.roles?.includes('coach') ||
      user.roles?.includes('trainer') ||
      (user.roles?.includes('parent') && user.childIds?.includes(playerId)) ||
      user.roles?.includes('admin');

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const trends = await performanceDiscussionService.getPerformanceTrends(
      playerId,
      metricType as PerformanceMetricType,
      {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      }
    );

    res.json(trends);
  } catch (error) {
    logger.error('Failed to get performance trends', error);
    res.status(500).json({ error: 'Failed to get performance trends' });
  }
});

// Complete performance discussion
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    // Only coaches and trainers can complete discussions
    if (!user.roles?.includes('coach') && !user.roles?.includes('trainer')) {
      return res.status(403).json({ error: 'Only coaches and trainers can complete discussions' });
    }

    const discussion = await performanceDiscussionService.completePerformanceDiscussion(id, user.id);

    res.json(discussion);
  } catch (error) {
    logger.error('Failed to complete performance discussion', error);
    res.status(500).json({ error: 'Failed to complete performance discussion' });
  }
});

export default router;