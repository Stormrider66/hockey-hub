import { Router, Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { MedicalDiscussionService } from '../services/MedicalDiscussionService';
import { authenticate } from '@hockey-hub/shared-lib/middleware/authenticate';
import {
  MedicalDiscussionStatus,
  MedicalDiscussionPriority,
  MedicalDiscussionType,
} from '../entities';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    organizationId: string;
    teamId?: string;
  };
}

export function createMedicalDiscussionRoutes(dataSource: DataSource): Router {
  const router = Router();
  const medicalDiscussionService = new MedicalDiscussionService(dataSource);

  // Create medical discussion
  router.post('/discussions', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Only medical staff can create medical discussions
      if (user.role !== 'medical_staff' && user.role !== 'admin') {
        return res.status(403).json({ error: 'Only medical staff can create medical discussions' });
      }

      const discussionData = {
        ...req.body,
        organization_id: user.organizationId,
        created_by: user.id,
      };

      const discussion = await medicalDiscussionService.createMedicalDiscussion(discussionData);
      res.status(201).json(discussion);
    } catch (error) {
      next(error);
    }
  });

  // Get medical discussions
  router.get('/discussions', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const filters = {
        organization_id: user.organizationId,
        team_id: req.query.team_id as string,
        player_id: req.query.player_id as string,
        injury_id: req.query.injury_id as string,
        status: req.query.status as MedicalDiscussionStatus,
        priority: req.query.priority as MedicalDiscussionPriority,
        discussion_type: req.query.discussion_type as MedicalDiscussionType,
        created_by: req.query.created_by as string,
        limit: parseInt(req.query.limit as string) || 20,
        offset: parseInt(req.query.offset as string) || 0,
      };

      const result = await medicalDiscussionService.getMedicalDiscussions(filters);

      // Filter based on user access
      const accessibleDiscussions = await Promise.all(
        result.discussions.map(async (discussion) => {
          const hasAccess = await medicalDiscussionService.checkUserAccess(
            discussion.id,
            user.id,
            user.role
          );
          return hasAccess ? discussion : null;
        })
      );

      const filteredDiscussions = accessibleDiscussions.filter(Boolean);

      res.json({
        discussions: filteredDiscussions,
        total: filteredDiscussions.length,
        limit: filters.limit,
        offset: filters.offset,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get single medical discussion
  router.get('/discussions/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const discussion = await medicalDiscussionService.getMedicalDiscussion(req.params.id);
      if (!discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
      }

      // Check access
      const hasAccess = await medicalDiscussionService.checkUserAccess(
        discussion.id,
        user.id,
        user.role
      );

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(discussion);
    } catch (error) {
      next(error);
    }
  });

  // Update medical discussion
  router.put('/discussions/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Only medical staff can update
      if (user.role !== 'medical_staff' && user.role !== 'admin') {
        return res.status(403).json({ error: 'Only medical staff can update medical discussions' });
      }

      const discussion = await medicalDiscussionService.updateMedicalDiscussion(
        req.params.id,
        req.body
      );

      if (!discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
      }

      res.json(discussion);
    } catch (error) {
      next(error);
    }
  });

  // Resolve medical discussion
  router.post('/discussions/:id/resolve', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (user.role !== 'medical_staff' && user.role !== 'admin') {
        return res.status(403).json({ error: 'Only medical staff can resolve medical discussions' });
      }

      const { resolution_notes } = req.body;
      const discussion = await medicalDiscussionService.resolveMedicalDiscussion(
        req.params.id,
        user.id,
        resolution_notes
      );

      if (!discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
      }

      res.json(discussion);
    } catch (error) {
      next(error);
    }
  });

  // Archive medical discussion
  router.post('/discussions/:id/archive', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (user.role !== 'medical_staff' && user.role !== 'admin') {
        return res.status(403).json({ error: 'Only medical staff can archive medical discussions' });
      }

      const discussion = await medicalDiscussionService.archiveMedicalDiscussion(
        req.params.id,
        user.id
      );

      if (!discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
      }

      res.json(discussion);
    } catch (error) {
      next(error);
    }
  });

  // Add authorized viewer
  router.post('/discussions/:id/viewers', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (user.role !== 'medical_staff' && user.role !== 'admin') {
        return res.status(403).json({ error: 'Only medical staff can manage viewers' });
      }

      const { user_id } = req.body;
      const discussion = await medicalDiscussionService.addAuthorizedViewer(
        req.params.id,
        user_id
      );

      if (!discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
      }

      res.json(discussion);
    } catch (error) {
      next(error);
    }
  });

  // Remove authorized viewer
  router.delete('/discussions/:id/viewers/:userId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (user.role !== 'medical_staff' && user.role !== 'admin') {
        return res.status(403).json({ error: 'Only medical staff can manage viewers' });
      }

      const discussion = await medicalDiscussionService.removeAuthorizedViewer(
        req.params.id,
        req.params.userId
      );

      if (!discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
      }

      res.json(discussion);
    } catch (error) {
      next(error);
    }
  });

  // Acknowledge discussion
  router.post('/discussions/:id/acknowledge', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const discussion = await medicalDiscussionService.acknowledgeDiscussion(
        req.params.id,
        user.id
      );

      if (!discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
      }

      res.json(discussion);
    } catch (error) {
      next(error);
    }
  });

  // Create action item
  router.post('/discussions/:id/action-items', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const actionItemData = {
        ...req.body,
        created_by: user.id,
      };

      const actionItem = await medicalDiscussionService.createActionItem(
        req.params.id,
        actionItemData
      );

      res.status(201).json(actionItem);
    } catch (error) {
      next(error);
    }
  });

  // Get action items for a discussion
  router.get('/discussions/:id/action-items', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const actionItems = await medicalDiscussionService.getActionItems(req.params.id);
      res.json(actionItems);
    } catch (error) {
      next(error);
    }
  });

  // Update action item
  router.put('/action-items/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const actionItem = await medicalDiscussionService.updateActionItem(
        req.params.id,
        req.body
      );

      if (!actionItem) {
        return res.status(404).json({ error: 'Action item not found' });
      }

      res.json(actionItem);
    } catch (error) {
      next(error);
    }
  });

  // Complete action item
  router.post('/action-items/:id/complete', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { completion_notes } = req.body;
      const actionItem = await medicalDiscussionService.completeActionItem(
        req.params.id,
        user.id,
        completion_notes
      );

      if (!actionItem) {
        return res.status(404).json({ error: 'Action item not found' });
      }

      res.json(actionItem);
    } catch (error) {
      next(error);
    }
  });

  // Get user's action items
  router.get('/action-items/my', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const status = req.query.status as string;
      const actionItems = await medicalDiscussionService.getUserActionItems(user.id, status);
      res.json(actionItems);
    } catch (error) {
      next(error);
    }
  });

  // Get upcoming follow-ups
  router.get('/discussions/follow-ups/upcoming', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const daysAhead = parseInt(req.query.days_ahead as string) || 7;
      const followUps = await medicalDiscussionService.getUpcomingFollowUps(
        user.organizationId,
        daysAhead
      );

      res.json(followUps);
    } catch (error) {
      next(error);
    }
  });

  return router;
}