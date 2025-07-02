import { Request, Response } from 'express';
import { PaymentDiscussionService } from '../services/PaymentDiscussionService';
import { Logger } from '@hockey-hub/shared-lib';
import {
  PaymentDiscussionType,
  PaymentDiscussionStatus,
  PaymentReminderType,
} from '../entities';

const paymentDiscussionService = new PaymentDiscussionService();
const logger = new Logger('PaymentDiscussionController');

export const paymentDiscussionController = {
  async createPaymentDiscussion(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        type,
        title,
        description,
        paymentId,
        invoiceId,
        paymentPlanId,
        amount,
        outstandingAmount,
        currency,
        parentUserId,
        billingStaffIds,
        organizationId,
        teamId,
        metadata,
      } = req.body;

      // Validate required fields
      if (!type || !title || !parentUserId || !billingStaffIds || !organizationId) {
        return res.status(400).json({
          error: 'Missing required fields: type, title, parentUserId, billingStaffIds, organizationId',
        });
      }

      const discussion = await paymentDiscussionService.createPaymentDiscussion(
        {
          type,
          title,
          description,
          paymentId,
          invoiceId,
          paymentPlanId,
          amount,
          outstandingAmount,
          currency,
          parentUserId,
          billingStaffIds,
          organizationId,
          teamId,
          metadata,
        },
        userId
      );

      res.status(201).json(discussion);
    } catch (error) {
      logger.error('Error creating payment discussion', error);
      res.status(500).json({ error: 'Failed to create payment discussion' });
    }
  },

  async getPaymentDiscussion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const discussion = await paymentDiscussionService.getPaymentDiscussion(id);

      if (!discussion) {
        return res.status(404).json({ error: 'Payment discussion not found' });
      }

      res.json(discussion);
    } catch (error) {
      logger.error('Error fetching payment discussion', error);
      res.status(500).json({ error: 'Failed to fetch payment discussion' });
    }
  },

  async getPaymentDiscussions(req: Request, res: Response) {
    try {
      const {
        parentUserId,
        organizationId,
        status,
        type,
        paymentId,
        invoiceId,
      } = req.query;

      const discussions = await paymentDiscussionService.getPaymentDiscussions({
        parentUserId: parentUserId as string,
        organizationId: organizationId as string,
        status: status as PaymentDiscussionStatus,
        type: type as PaymentDiscussionType,
        paymentId: paymentId as string,
        invoiceId: invoiceId as string,
      });

      res.json(discussions);
    } catch (error) {
      logger.error('Error fetching payment discussions', error);
      res.status(500).json({ error: 'Failed to fetch payment discussions' });
    }
  },

  async updatePaymentDiscussion(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const {
        status,
        paymentStatus,
        paymentPlanProposal,
        quickActions,
        resolutionNotes,
        metadata,
      } = req.body;

      const discussion = await paymentDiscussionService.updatePaymentDiscussion(
        id,
        {
          status,
          paymentStatus,
          paymentPlanProposal,
          quickActions,
          resolutionNotes,
          metadata,
        },
        userId
      );

      res.json(discussion);
    } catch (error) {
      logger.error('Error updating payment discussion', error);
      res.status(500).json({ error: 'Failed to update payment discussion' });
    }
  },

  async attachDocument(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        paymentDiscussionId,
        messageId,
        fileName,
        fileType,
        fileSize,
        fileUrl,
        documentType,
        metadata,
      } = req.body;

      // Validate required fields
      if (!paymentDiscussionId || !messageId || !fileName || !fileUrl || !documentType) {
        return res.status(400).json({
          error: 'Missing required fields',
        });
      }

      const attachment = await paymentDiscussionService.attachDocument({
        paymentDiscussionId,
        messageId,
        fileName,
        fileType,
        fileSize,
        fileUrl,
        documentType,
        uploadedBy: userId,
        metadata,
      });

      res.status(201).json(attachment);
    } catch (error) {
      logger.error('Error attaching document', error);
      res.status(500).json({ error: 'Failed to attach document' });
    }
  },

  async verifyDocument(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { attachmentId } = req.params;

      const attachment = await paymentDiscussionService.verifyDocument(
        attachmentId,
        userId
      );

      res.json(attachment);
    } catch (error) {
      logger.error('Error verifying document', error);
      res.status(500).json({ error: 'Failed to verify document' });
    }
  },

  async createReminder(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        paymentDiscussionId,
        type,
        subject,
        message,
        scheduledFor,
        recipientIds,
        notificationChannels,
        metadata,
      } = req.body;

      // Validate required fields
      if (!paymentDiscussionId || !type || !subject || !message || !scheduledFor || !recipientIds) {
        return res.status(400).json({
          error: 'Missing required fields',
        });
      }

      const reminder = await paymentDiscussionService.createReminder(
        {
          paymentDiscussionId,
          type,
          subject,
          message,
          scheduledFor: new Date(scheduledFor),
          recipientIds,
          notificationChannels,
          metadata,
        },
        userId
      );

      res.status(201).json(reminder);
    } catch (error) {
      logger.error('Error creating reminder', error);
      res.status(500).json({ error: 'Failed to create reminder' });
    }
  },

  async proposePaymentPlan(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { discussionId } = req.params;
      const { installments, notes } = req.body;

      if (!installments || !Array.isArray(installments) || installments.length === 0) {
        return res.status(400).json({
          error: 'Invalid installments data',
        });
      }

      const discussion = await paymentDiscussionService.proposePaymentPlan(
        discussionId,
        { installments, notes },
        userId
      );

      res.json(discussion);
    } catch (error) {
      logger.error('Error proposing payment plan', error);
      res.status(500).json({ error: 'Failed to propose payment plan' });
    }
  },

  async approvePaymentPlan(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { discussionId } = req.params;

      const discussion = await paymentDiscussionService.approvePaymentPlan(
        discussionId,
        userId
      );

      res.json(discussion);
    } catch (error) {
      logger.error('Error approving payment plan', error);
      res.status(500).json({ error: 'Failed to approve payment plan' });
    }
  },

  async trackQuickAction(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { discussionId } = req.params;
      const { action } = req.body;

      if (!['receipt', 'paymentPlan', 'dispute', 'refund'].includes(action)) {
        return res.status(400).json({
          error: 'Invalid action. Must be one of: receipt, paymentPlan, dispute, refund',
        });
      }

      const discussion = await paymentDiscussionService.trackQuickAction(
        discussionId,
        action,
        userId
      );

      res.json(discussion);
    } catch (error) {
      logger.error('Error tracking quick action', error);
      res.status(500).json({ error: 'Failed to track quick action' });
    }
  },

  async getDiscussionsByPayment(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;

      const discussions = await paymentDiscussionService.getDiscussionsByPayment(
        paymentId
      );

      res.json(discussions);
    } catch (error) {
      logger.error('Error fetching discussions by payment', error);
      res.status(500).json({ error: 'Failed to fetch discussions' });
    }
  },

  async getDiscussionsByInvoice(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;

      const discussions = await paymentDiscussionService.getDiscussionsByInvoice(
        invoiceId
      );

      res.json(discussions);
    } catch (error) {
      logger.error('Error fetching discussions by invoice', error);
      res.status(500).json({ error: 'Failed to fetch discussions' });
    }
  },

  async escalateDiscussion(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { discussionId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          error: 'Escalation reason is required',
        });
      }

      const discussion = await paymentDiscussionService.escalateDiscussion(
        discussionId,
        userId,
        reason
      );

      res.json(discussion);
    } catch (error) {
      logger.error('Error escalating discussion', error);
      res.status(500).json({ error: 'Failed to escalate discussion' });
    }
  },

  async getOverdueDiscussions(req: Request, res: Response) {
    try {
      const { organizationId } = req.params;

      const discussions = await paymentDiscussionService.getOverdueDiscussions(
        organizationId
      );

      res.json(discussions);
    } catch (error) {
      logger.error('Error fetching overdue discussions', error);
      res.status(500).json({ error: 'Failed to fetch overdue discussions' });
    }
  },
};