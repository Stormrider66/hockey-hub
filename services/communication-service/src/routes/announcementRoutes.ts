import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcementController';
import { authenticate } from '@hockey-hub/shared-lib';

const router = Router();
const announcementController = new AnnouncementController();

// All routes require authentication
router.use(authenticate);

// Announcement channel routes
router.post('/channels', announcementController.createAnnouncementChannel);
router.get('/channels', announcementController.getAnnouncementChannels);
router.patch('/channels/:conversationId/settings', announcementController.updateAnnouncementChannelSettings);

// Announcement posting and management
router.post('/channels/:conversationId/announcements', announcementController.postAnnouncement);
router.get('/channels/:conversationId/pinned', announcementController.getPinnedAnnouncements);
router.patch('/channels/:conversationId/announcements/:messageId/pin', announcementController.togglePinAnnouncement);

// Reactions and read receipts
router.post('/channels/:conversationId/announcements/:messageId/react', announcementController.reactToAnnouncement);
router.get('/announcements/:messageId/read-receipts', announcementController.getAnnouncementReadReceipts);

// Moderator management
router.post('/channels/:conversationId/moderators', announcementController.addModerator);

export const announcementRoutes = router;