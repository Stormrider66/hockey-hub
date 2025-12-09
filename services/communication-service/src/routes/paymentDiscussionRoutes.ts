import { Router } from 'express';
import { paymentDiscussionController } from '../controllers/paymentDiscussionController';
import { authMiddleware } from '@hockey-hub/shared-lib/middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all routes (do not invoke to avoid calling with undefined req/res in tests)
router.use(authMiddleware as any);

// Payment discussion management
router.post('/discussions', paymentDiscussionController.createPaymentDiscussion);
router.get('/discussions', paymentDiscussionController.getPaymentDiscussions);
router.get('/discussions/:id', paymentDiscussionController.getPaymentDiscussion);
router.put('/discussions/:id', paymentDiscussionController.updatePaymentDiscussion);

// Document management
router.post('/discussions/documents', paymentDiscussionController.attachDocument);
router.put('/discussions/documents/:attachmentId/verify', paymentDiscussionController.verifyDocument);

// Payment plan management
router.post('/discussions/:discussionId/payment-plan', paymentDiscussionController.proposePaymentPlan);
router.post('/discussions/:discussionId/payment-plan/approve', paymentDiscussionController.approvePaymentPlan);

// Quick actions
router.post('/discussions/:discussionId/quick-action', paymentDiscussionController.trackQuickAction);

// Escalation
router.post('/discussions/:discussionId/escalate', paymentDiscussionController.escalateDiscussion);

// Reminders
router.post('/discussions/reminders', paymentDiscussionController.createReminder);

// Query by payment/invoice
router.get('/payments/:paymentId/discussions', paymentDiscussionController.getDiscussionsByPayment);
router.get('/invoices/:invoiceId/discussions', paymentDiscussionController.getDiscussionsByInvoice);

// Admin routes
router.get('/organizations/:organizationId/overdue-discussions', paymentDiscussionController.getOverdueDiscussions);

export default router;