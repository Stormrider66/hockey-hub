import { Request, Response } from 'express';
import { ParentCommunicationService } from '../services/ParentCommunicationService';
import { NotificationService } from '../services/NotificationService';
import { AppDataSource } from '../config/database';
import { validationResult } from 'express-validator';
import { Logger } from '@hockey-hub/shared-lib';
import { AuthRequest } from '@hockey-hub/shared-lib/middleware';

const logger = new Logger('ParentCommunicationController');

export class ParentCommunicationController {
  private parentCommunicationService: ParentCommunicationService;

  constructor() {
    const notificationService = new NotificationService(AppDataSource as any);
    this.parentCommunicationService = new ParentCommunicationService(notificationService);
  }

  async createCommunication(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user, requestId, ip } = req;
      const data = req.body;

      // Ensure coach can only create communications for their organization
      if (data.organizationId !== user?.organizationId) {
        return res.status(403).json({ 
          error: 'You can only create communications for your organization' 
        });
      }

      // Set coachId to current user if not provided
      if (!data.coachId) {
        data.coachId = user?.id;
      }

      const communication = await this.parentCommunicationService.createCommunication(
        data,
        user!.id,
        requestId,
        ip
      );

      logger.info('Parent communication created', {
        communicationId: communication.id,
        userId: user?.id,
        requestId
      });

      res.status(201).json(communication);
    } catch (error: any) {
      logger.error('Error creating parent communication', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateCommunication(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { user, requestId, ip } = req;
      const data = req.body;

      const communication = await this.parentCommunicationService.updateCommunication(
        id,
        data,
        user!.id,
        requestId,
        ip
      );

      logger.info('Parent communication updated', {
        communicationId: id,
        userId: user?.id,
        requestId
      });

      res.json(communication);
    } catch (error: any) {
      logger.error('Error updating parent communication', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getCommunication(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;

      const communication = await this.parentCommunicationService.getCommunication(
        id,
        user!.id
      );

      if (!communication) {
        return res.status(404).json({ error: 'Communication not found' });
      }

      res.json(communication);
    } catch (error: any) {
      logger.error('Error getting parent communication', error);
      if (error.message === 'Access denied to this communication') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async listCommunications(req: AuthRequest, res: Response) {
    try {
      const { user } = req;
      const {
        organizationId,
        teamId,
        coachId,
        playerId,
        parentId,
        type,
        category,
        priority,
        dateFrom,
        dateTo,
        requiresFollowUp,
        isFollowUpComplete,
        isConfidential,
        searchTerm,
        tags,
        page = 1,
        limit = 20
      } = req.query;

      const filter = {
        organizationId: organizationId as string || user!.organizationId,
        teamId: teamId as string,
        coachId: coachId as string,
        playerId: playerId as string,
        parentId: parentId as string,
        type: type as any,
        category: category as any,
        priority: priority as any,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        requiresFollowUp: requiresFollowUp === 'true',
        isFollowUpComplete: isFollowUpComplete === 'true',
        isConfidential: isConfidential === 'true',
        searchTerm: searchTerm as string,
        tags: tags ? (tags as string).split(',') : undefined
      };

      const result = await this.parentCommunicationService.listCommunications(
        filter,
        user!.id,
        Number(page),
        Number(limit)
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Error listing parent communications', error);
      res.status(500).json({ error: error.message });
    }
  }

  async addAttachment(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user, requestId, ip } = req;
      const data = req.body;

      const attachment = await this.parentCommunicationService.addAttachment(
        data,
        user!.id,
        requestId,
        ip
      );

      res.status(201).json(attachment);
    } catch (error: any) {
      logger.error('Error adding attachment', error);
      res.status(500).json({ error: error.message });
    }
  }

  async removeAttachment(req: AuthRequest, res: Response) {
    try {
      const { attachmentId } = req.params;
      const { user, requestId, ip } = req;

      await this.parentCommunicationService.removeAttachment(
        attachmentId,
        user!.id,
        requestId,
        ip
      );

      res.status(204).send();
    } catch (error: any) {
      logger.error('Error removing attachment', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createReminder(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user, requestId, ip } = req;
      const data = req.body;

      const reminder = await this.parentCommunicationService.createReminder(
        data,
        user!.id,
        requestId,
        ip
      );

      res.status(201).json(reminder);
    } catch (error: any) {
      logger.error('Error creating reminder', error);
      res.status(500).json({ error: error.message });
    }
  }

  async completeReminder(req: AuthRequest, res: Response) {
    try {
      const { reminderId } = req.params;
      const { completionNotes } = req.body;
      const { user, requestId, ip } = req;

      const reminder = await this.parentCommunicationService.completeReminder(
        reminderId,
        completionNotes,
        user!.id,
        requestId,
        ip
      );

      res.json(reminder);
    } catch (error: any) {
      logger.error('Error completing reminder', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getUpcomingReminders(req: AuthRequest, res: Response) {
    try {
      const { user } = req;
      const { days = 7 } = req.query;

      const reminders = await this.parentCommunicationService.getUpcomingReminders(
        user!.organizationId,
        user!.id,
        Number(days)
      );

      res.json(reminders);
    } catch (error: any) {
      logger.error('Error getting upcoming reminders', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateActionItem(req: AuthRequest, res: Response) {
    try {
      const { communicationId, actionItemId } = req.params;
      const { completed } = req.body;
      const { user, requestId, ip } = req;

      const communication = await this.parentCommunicationService.updateActionItem(
        communicationId,
        actionItemId,
        completed,
        user!.id,
        requestId,
        ip
      );

      res.json(communication);
    } catch (error: any) {
      logger.error('Error updating action item', error);
      res.status(500).json({ error: error.message });
    }
  }

  async generateReport(req: AuthRequest, res: Response) {
    try {
      const { user } = req;
      const {
        organizationId,
        dateFrom,
        dateTo,
        groupBy,
        includeConfidential
      } = req.query;

      const options = {
        organizationId: organizationId as string || user!.organizationId,
        dateFrom: new Date(dateFrom as string),
        dateTo: new Date(dateTo as string),
        groupBy: groupBy as any,
        includeConfidential: includeConfidential === 'true'
      };

      const report = await this.parentCommunicationService.generateReport(options);

      res.json(report);
    } catch (error: any) {
      logger.error('Error generating report', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Template management endpoints

  async createTemplate(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user, requestId, ip } = req;
      const data = {
        ...req.body,
        organizationId: user!.organizationId
      };

      const template = await this.parentCommunicationService.createTemplate(
        data,
        user!.id,
        requestId,
        ip
      );

      res.status(201).json(template);
    } catch (error: any) {
      logger.error('Error creating template', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getTemplates(req: AuthRequest, res: Response) {
    try {
      const { user } = req;
      const { category } = req.query;

      const templates = await this.parentCommunicationService.getTemplates(
        user!.organizationId,
        category as any
      );

      res.json(templates);
    } catch (error: any) {
      logger.error('Error getting templates', error);
      res.status(500).json({ error: error.message });
    }
  }

  async useTemplate(req: AuthRequest, res: Response) {
    try {
      const { templateId } = req.params;
      const { user } = req;

      const template = await this.parentCommunicationService.useTemplate(
        templateId,
        user!.id
      );

      res.json(template);
    } catch (error: any) {
      logger.error('Error using template', error);
      res.status(500).json({ error: error.message });
    }
  }
}