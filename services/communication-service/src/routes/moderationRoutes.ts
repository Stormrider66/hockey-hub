import { Router } from 'express';
import { authMiddleware } from '@hockey-hub/shared-lib';
import { ModerationService } from '../services/ModerationService';
import { validationMiddleware } from '@hockey-hub/shared-lib';
import { body, param, query } from 'express-validator';
import { ModerationReason, ModerationStatus, ModerationAction } from '../entities/ModeratedContent';
import { UserModerationStatus, UserModerationReason } from '../entities/UserModeration';
import { RuleType, RuleAction, RuleSeverity } from '../entities/ModerationRule';

const router = Router();
const moderationService = new ModerationService();

// Content Moderation Routes

/**
 * POST /api/moderation/report
 * Report content for moderation
 */
router.post('/report',
  authMiddleware,
  [
    body('messageId').isUUID().withMessage('Valid message ID required'),
    body('reason').isIn(Object.values(ModerationReason)).withMessage('Valid reason required'),
    body('description').optional().isString().isLength({ max: 500 })
  ],
  validationMiddleware,
  async (req, res) => {
    try {
      const { messageId, reason, description, metadata } = req.body;
      const reporterId = req.user!.id;

      const moderatedContent = await moderationService.reportContent({
        messageId,
        reporterId,
        reason,
        description,
        metadata
      });

      res.status(201).json({
        success: true,
        data: moderatedContent
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to report content'
      });
    }
  }
);

/**
 * GET /api/moderation/pending
 * Get pending content for review (Admin only)
 */
router.get('/pending',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validationMiddleware,
  async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user!.roles?.includes('admin') && !req.user!.roles?.includes('moderator')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      const page = req.query.page as number || 1;
      const limit = req.query.limit as number || 20;

      const result = await moderationService.getPendingContent(page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending content'
      });
    }
  }
);

/**
 * POST /api/moderation/decide
 * Make moderation decision (Admin only)
 */
router.post('/decide',
  authMiddleware,
  [
    body('moderatedContentId').isUUID().withMessage('Valid content ID required'),
    body('status').isIn(Object.values(ModerationStatus)).withMessage('Valid status required'),
    body('action').isIn(Object.values(ModerationAction)).withMessage('Valid action required'),
    body('moderatorNotes').optional().isString().isLength({ max: 1000 })
  ],
  validationMiddleware,
  async (req, res) => {
    try {
      // Check if user is admin/moderator
      if (!req.user!.roles?.includes('admin') && !req.user!.roles?.includes('moderator')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      const { moderatedContentId, status, action, moderatorNotes } = req.body;
      const moderatorId = req.user!.id;

      const result = await moderationService.makeDecision({
        moderatedContentId,
        moderatorId,
        status,
        action,
        moderatorNotes
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to make decision'
      });
    }
  }
);

/**
 * GET /api/moderation/history
 * Get moderation history
 */
router.get('/history',
  authMiddleware,
  [
    query('messageId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validationMiddleware,
  async (req, res) => {
    try {
      // Check if user is admin/moderator
      if (!req.user!.roles?.includes('admin') && !req.user!.roles?.includes('moderator')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      const messageId = req.query.messageId as string;
      const page = req.query.page as number || 1;
      const limit = req.query.limit as number || 20;

      const result = await moderationService.getModerationHistory(messageId, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch moderation history'
      });
    }
  }
);

// User Moderation Routes

/**
 * POST /api/moderation/users
 * Moderate a user (Admin only)
 */
router.post('/users',
  authMiddleware,
  [
    body('userId').isUUID().withMessage('Valid user ID required'),
    body('status').isIn(Object.values(UserModerationStatus)).withMessage('Valid status required'),
    body('reason').isIn(Object.values(UserModerationReason)).withMessage('Valid reason required'),
    body('description').isString().isLength({ min: 10, max: 500 }),
    body('expiresAt').optional().isISO8601().toDate(),
    body('restrictions').optional().isObject(),
    body('moderatorNotes').optional().isString().isLength({ max: 1000 })
  ],
  validationMiddleware,
  async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user!.roles?.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const moderatorId = req.user!.id;
      const userModeration = await moderationService.moderateUser({
        ...req.body,
        moderatorId
      });

      res.status(201).json({
        success: true,
        data: userModeration
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to moderate user'
      });
    }
  }
);

/**
 * DELETE /api/moderation/users/:userId
 * Remove user moderation (Admin only)
 */
router.delete('/users/:userId',
  authMiddleware,
  [
    param('userId').isUUID().withMessage('Valid user ID required')
  ],
  validationMiddleware,
  async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user!.roles?.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { userId } = req.params;
      const moderatorId = req.user!.id;

      await moderationService.removeUserModeration(userId, moderatorId);

      res.json({
        success: true,
        message: 'User moderation removed successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to remove user moderation'
      });
    }
  }
);

/**
 * GET /api/moderation/users/:userId/status
 * Get user moderation status
 */
router.get('/users/:userId/status',
  authMiddleware,
  [
    param('userId').isUUID().withMessage('Valid user ID required')
  ],
  validationMiddleware,
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Users can check their own status, admins can check anyone
      if (userId !== req.user!.id && !req.user!.roles?.includes('admin') && !req.user!.roles?.includes('moderator')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      const status = await moderationService.getUserModerationStatus(userId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user moderation status'
      });
    }
  }
);

/**
 * GET /api/moderation/users
 * Get moderated users (Admin only)
 */
router.get('/users',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  validationMiddleware,
  async (req, res) => {
    try {
      // Check if user is admin/moderator
      if (!req.user!.roles?.includes('admin') && !req.user!.roles?.includes('moderator')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      const page = req.query.page as number || 1;
      const limit = req.query.limit as number || 20;

      const result = await moderationService.getModeratedUsers(page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch moderated users'
      });
    }
  }
);

// Moderation Rules Routes

/**
 * POST /api/moderation/rules
 * Create moderation rule (Admin only)
 */
router.post('/rules',
  authMiddleware,
  [
    body('name').isString().isLength({ min: 3, max: 255 }),
    body('description').isString().isLength({ min: 10, max: 500 }),
    body('ruleType').isIn(Object.values(RuleType)).withMessage('Valid rule type required'),
    body('action').isIn(Object.values(RuleAction)).withMessage('Valid action required'),
    body('severity').optional().isIn(Object.values(RuleSeverity)),
    body('criteria').isObject(),
    body('exceptions').optional().isObject(),
    body('priority').optional().isInt({ min: 0, max: 100 }),
    body('expiresAt').optional().isISO8601().toDate()
  ],
  validationMiddleware,
  async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user!.roles?.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const createdBy = req.user!.id;
      const rule = await moderationService.createRule({
        ...req.body,
        createdBy
      });

      res.status(201).json({
        success: true,
        data: rule
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create rule'
      });
    }
  }
);

/**
 * PUT /api/moderation/rules/:ruleId
 * Update moderation rule (Admin only)
 */
router.put('/rules/:ruleId',
  authMiddleware,
  [
    param('ruleId').isUUID().withMessage('Valid rule ID required'),
    body('name').optional().isString().isLength({ min: 3, max: 255 }),
    body('description').optional().isString().isLength({ min: 10, max: 500 }),
    body('ruleType').optional().isIn(Object.values(RuleType)),
    body('action').optional().isIn(Object.values(RuleAction)),
    body('severity').optional().isIn(Object.values(RuleSeverity)),
    body('criteria').optional().isObject(),
    body('exceptions').optional().isObject(),
    body('priority').optional().isInt({ min: 0, max: 100 }),
    body('isActive').optional().isBoolean()
  ],
  validationMiddleware,
  async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user!.roles?.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { ruleId } = req.params;
      const updatedBy = req.user!.id;

      const rule = await moderationService.updateRule(ruleId, req.body, updatedBy);

      res.json({
        success: true,
        data: rule
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update rule'
      });
    }
  }
);

/**
 * DELETE /api/moderation/rules/:ruleId
 * Delete moderation rule (Admin only)
 */
router.delete('/rules/:ruleId',
  authMiddleware,
  [
    param('ruleId').isUUID().withMessage('Valid rule ID required')
  ],
  validationMiddleware,
  async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user!.roles?.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { ruleId } = req.params;
      const deletedBy = req.user!.id;

      await moderationService.deleteRule(ruleId, deletedBy);

      res.json({
        success: true,
        message: 'Rule deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to delete rule'
      });
    }
  }
);

/**
 * GET /api/moderation/rules
 * Get moderation rules (Admin only)
 */
router.get('/rules',
  authMiddleware,
  [
    query('isActive').optional().isBoolean().toBoolean()
  ],
  validationMiddleware,
  async (req, res) => {
    try {
      // Check if user is admin/moderator
      if (!req.user!.roles?.includes('admin') && !req.user!.roles?.includes('moderator')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      const isActive = req.query.isActive !== undefined ? req.query.isActive as boolean : true;
      const rules = await moderationService.getRules(isActive);

      res.json({
        success: true,
        data: rules
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch rules'
      });
    }
  }
);

// Statistics Routes

/**
 * GET /api/moderation/stats
 * Get moderation statistics (Admin only)
 */
router.get('/stats',
  authMiddleware,
  [
    query('days').optional().isInt({ min: 1, max: 365 }).toInt()
  ],
  validationMiddleware,
  async (req, res) => {
    try {
      // Check if user is admin/moderator
      if (!req.user!.roles?.includes('admin') && !req.user!.roles?.includes('moderator')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      const days = req.query.days as number || 30;
      const stats = await moderationService.getModerationStats(days);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch moderation statistics'
      });
    }
  }
);

export default router;