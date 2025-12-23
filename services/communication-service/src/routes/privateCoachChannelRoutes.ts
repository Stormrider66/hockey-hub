// @ts-nocheck - Suppress TypeScript errors for build
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PrivateCoachChannelController } from '../controllers/privateCoachChannelController';
import { authMiddleware } from '@hockey-hub/shared-lib';

const router: any = Router();
const controller = new PrivateCoachChannelController();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create or get private coach channel
router.post(
  '/channels',
  [
    body('playerId').isUUID().withMessage('Valid player ID is required'),
    body('parentId').isUUID().withMessage('Valid parent ID is required'),
    body('coachIds').isArray().withMessage('Coach IDs must be an array'),
    body('coachIds.*').isUUID().withMessage('Each coach ID must be a valid UUID'),
    body('teamId').isUUID().withMessage('Valid team ID is required'),
    body('organizationId').isUUID().withMessage('Valid organization ID is required'),
    body('playerName').optional().isString(),
  ],
  controller.createChannel
);

// Get parent's private coach channels
router.get(
  '/parent/:parentId/channels',
  [
    param('parentId').isUUID().withMessage('Valid parent ID is required'),
  ],
  controller.getParentChannels
);

// Get coach's private channels
router.get(
  '/coach/:coachId/channels',
  [
    param('coachId').isUUID().withMessage('Valid coach ID is required'),
  ],
  controller.getCoachChannels
);

// Get channel by player
router.get(
  '/player/:playerId/channel',
  [
    param('playerId').isUUID().withMessage('Valid player ID is required'),
    query('parentId').isUUID().withMessage('Valid parent ID is required'),
  ],
  controller.getChannelByPlayer
);

// Coach availability routes
router.post(
  '/coach/:coachId/availability',
  [
    param('coachId').isUUID().withMessage('Valid coach ID is required'),
    body('teamId').isUUID().withMessage('Valid team ID is required'),
    body('organizationId').isUUID().withMessage('Valid organization ID is required'),
    body('availability').isArray().withMessage('Availability must be an array'),
  ],
  controller.setCoachAvailability
);

router.get(
  '/coach/:coachId/availability',
  [
    param('coachId').isUUID().withMessage('Valid coach ID is required'),
    query('teamId').optional().isUUID(),
  ],
  controller.getCoachAvailability
);

router.get(
  '/team/:teamId/coaches/availability',
  [
    param('teamId').isUUID().withMessage('Valid team ID is required'),
  ],
  controller.getTeamCoachesAvailability
);

// Meeting request routes
router.post(
  '/meeting-requests',
  [
    body('conversationId').isUUID().withMessage('Valid conversation ID is required'),
    body('requesterId').isUUID().withMessage('Valid requester ID is required'),
    body('coachId').isUUID().withMessage('Valid coach ID is required'),
    body('playerId').isUUID().withMessage('Valid player ID is required'),
    body('type').isString().withMessage('Meeting type is required'),
    body('purpose').isString().withMessage('Meeting purpose is required'),
    body('subject').isString().withMessage('Subject is required'),
    body('message').isString().withMessage('Message is required'),
    body('proposedDate').isISO8601().withMessage('Valid proposed date is required'),
    body('alternateDate1').optional().isISO8601(),
    body('alternateDate2').optional().isISO8601(),
    body('duration').optional().isInt({ min: 15, max: 120 }),
    body('location').optional().isString(),
  ],
  controller.createMeetingRequest
);

router.patch(
  '/meeting-requests/:requestId',
  [
    param('requestId').isUUID().withMessage('Valid request ID is required'),
    body('coachId').isUUID().withMessage('Valid coach ID is required'),
    body('status').isString().withMessage('Status is required'),
    body('scheduledDate').optional().isISO8601(),
    body('location').optional().isString(),
    body('meetingUrl').optional().isURL(),
    body('coachNotes').optional().isString(),
    body('declineReason').optional().isString(),
    body('rescheduleReason').optional().isString(),
  ],
  controller.updateMeetingRequest
);

router.get(
  '/meeting-requests/:userId/:role',
  [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    param('role').isIn(['parent', 'coach']).withMessage('Role must be parent or coach'),
    query('status').optional().isString(),
  ],
  controller.getMeetingRequests
);

router.get(
  '/conversation/:conversationId/meeting-requests',
  [
    param('conversationId').isUUID().withMessage('Valid conversation ID is required'),
  ],
  controller.getConversationMeetingRequests
);

// Auto-create and management routes
router.post(
  '/auto-create',
  [
    body('teamId').isUUID().withMessage('Valid team ID is required'),
    body('playerId').isUUID().withMessage('Valid player ID is required'),
    body('parentIds').isArray().withMessage('Parent IDs must be an array'),
    body('parentIds.*').isUUID().withMessage('Each parent ID must be a valid UUID'),
    body('coachIds').isArray().withMessage('Coach IDs must be an array'),
    body('coachIds.*').isUUID().withMessage('Each coach ID must be a valid UUID'),
    body('organizationId').isUUID().withMessage('Valid organization ID is required'),
    body('playerName').optional().isString(),
  ],
  controller.autoCreateChannels
);

router.delete(
  '/coach/:coachId/team/:teamId',
  [
    param('coachId').isUUID().withMessage('Valid coach ID is required'),
    param('teamId').isUUID().withMessage('Valid team ID is required'),
  ],
  controller.removeCoachFromChannels
);

export default router;