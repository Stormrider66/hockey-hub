import { Router } from 'express';
import {
  createUrgentNotification,
  acknowledgeNotification,
  escalateNotification,
  getNotificationDetails,
  getActiveNotifications,
  generateComplianceReport,
  updateNotificationStatus,
  getUrgencyLevels,
  getMedicalTypes,
  getTargetTypes,
  getDeliveryChannels,
  getAcknowledgmentMethods,
} from '../controllers/urgentMedicalNotificationController';

const router = Router();

// Enum endpoints (public)
router.get('/enums/urgency-levels', getUrgencyLevels);
router.get('/enums/medical-types', getMedicalTypes);
router.get('/enums/target-types', getTargetTypes);
router.get('/enums/delivery-channels', getDeliveryChannels);
router.get('/enums/acknowledgment-methods', getAcknowledgmentMethods);

// Main endpoints (require authentication)
router.post('/create', createUrgentNotification);
router.get('/active', getActiveNotifications);
router.get('/compliance-report', generateComplianceReport);
router.get('/:notificationId', getNotificationDetails);
router.post('/:notificationId/acknowledge', acknowledgeNotification);
router.post('/:notificationId/escalate', escalateNotification);
router.patch('/:notificationId/status', updateNotificationStatus);

export default router;