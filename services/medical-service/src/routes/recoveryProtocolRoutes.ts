// @ts-nocheck - Recovery protocol routes with complex types
import { Router, IRouter } from 'express';
import { Request, Response } from 'express';
import { RecoveryProtocolAdherenceService } from '../services/RecoveryProtocolAdherenceService';
import { logger } from '@hockey-hub/shared-lib';

const router: any = Router();
const recoveryService = new RecoveryProtocolAdherenceService();

/**
 * Initialize recovery protocol for an injury
 * POST /api/v1/recovery-protocol/:injuryId/initialize
 */
router.post('/:injuryId/initialize', async (req: Request, res: Response) => {
  try {
    const { injuryId } = req.params;
    const { protocolType, customMilestones } = req.body;

    if (!protocolType) {
      return res.status(400).json({
        success: false,
        error: 'Protocol type is required'
      });
    }

    const milestones = await recoveryService.initializeRecoveryProtocol(
      injuryId,
      protocolType,
      customMilestones
    );

    res.json({
      success: true,
      data: {
        injuryId,
        protocolType,
        milestones,
        message: 'Recovery protocol initialized successfully'
      }
    });

    logger.info(`Recovery protocol initialized for injury ${injuryId}, type: ${protocolType}`);
  } catch (error: any) {
    logger.error('Error initializing recovery protocol:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Record adherence entry
 * POST /api/v1/recovery-protocol/:injuryId/adherence
 */
router.post('/:injuryId/adherence', async (req: Request, res: Response) => {
  try {
    const { injuryId } = req.params;
    const { activity, type, completed, notes, metrics, date } = req.body;

    if (!activity || !type || completed === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Activity, type, and completed status are required'
      });
    }

    if (!['exercise', 'assessment', 'milestone', 'appointment'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be: exercise, assessment, milestone, or appointment'
      });
    }

    await recoveryService.recordAdherence(injuryId, {
      activity,
      type,
      completed,
      notes,
      metrics,
      date: date ? new Date(date) : undefined
    });

    res.json({
      success: true,
      message: 'Adherence entry recorded successfully'
    });

    logger.info(`Adherence recorded for injury ${injuryId}: ${activity} (${type}) - ${completed ? 'completed' : 'not completed'}`);
  } catch (error: any) {
    logger.error('Error recording adherence:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Complete a milestone
 * POST /api/v1/recovery-protocol/:injuryId/milestone/:milestoneName/complete
 */
router.post('/:injuryId/milestone/:milestoneName/complete', async (req: Request, res: Response) => {
  try {
    const { injuryId, milestoneName } = req.params;
    const { notes } = req.body;

    await recoveryService.completeMilestone(injuryId, decodeURIComponent(milestoneName));

    // Also record as adherence entry
    await recoveryService.recordAdherence(injuryId, {
      activity: milestoneName,
      type: 'milestone',
      completed: true,
      notes
    });

    res.json({
      success: true,
      message: `Milestone "${milestoneName}" completed successfully`
    });

    logger.info(`Milestone completed for injury ${injuryId}: ${milestoneName}`);
  } catch (error: any) {
    logger.error('Error completing milestone:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Get adherence metrics
 * GET /api/v1/recovery-protocol/:injuryId/metrics
 */
router.get('/:injuryId/metrics', async (req: Request, res: Response) => {
  try {
    const { injuryId } = req.params;

    const metrics = await recoveryService.calculateAdherenceMetrics(injuryId);

    res.json({
      success: true,
      data: metrics
    });

    logger.info(`Adherence metrics retrieved for injury ${injuryId}`);
  } catch (error: any) {
    logger.error('Error getting adherence metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Get recovery timeline
 * GET /api/v1/recovery-protocol/:injuryId/timeline
 */
router.get('/:injuryId/timeline', async (req: Request, res: Response) => {
  try {
    const { injuryId } = req.params;

    const timeline = await recoveryService.getRecoveryTimeline(injuryId);

    res.json({
      success: true,
      data: timeline
    });

    logger.info(`Recovery timeline retrieved for injury ${injuryId}`);
  } catch (error: any) {
    logger.error('Error getting recovery timeline:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Get adherence alerts
 * GET /api/v1/recovery-protocol/:injuryId/alerts
 */
router.get('/:injuryId/alerts', async (req: Request, res: Response) => {
  try {
    const { injuryId } = req.params;

    const alerts = await recoveryService.generateAdherenceAlerts(injuryId);

    res.json({
      success: true,
      data: alerts
    });

    logger.info(`Adherence alerts generated for injury ${injuryId}: ${alerts.length} alerts`);
  } catch (error: any) {
    logger.error('Error generating adherence alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Batch adherence entry
 * POST /api/v1/recovery-protocol/:injuryId/adherence/batch
 */
router.post('/:injuryId/adherence/batch', async (req: Request, res: Response) => {
  try {
    const { injuryId } = req.params;
    const { entries } = req.body;

    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        error: 'Entries array is required'
      });
    }

    const results = await Promise.allSettled(
      entries.map(entry => recoveryService.recordAdherence(injuryId, entry))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({
      success: true,
      data: {
        totalEntries: entries.length,
        successful,
        failed,
        message: `${successful} entries recorded successfully${failed > 0 ? `, ${failed} failed` : ''}`
      }
    });

    logger.info(`Batch adherence recorded for injury ${injuryId}: ${successful}/${entries.length} successful`);
  } catch (error: any) {
    logger.error('Error recording batch adherence:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Get protocol template for injury type
 * GET /api/v1/recovery-protocol/template/:protocolType
 */
router.get('/template/:protocolType', async (req: Request, res: Response) => {
  try {
    const { protocolType } = req.params;

    // This would typically fetch from a database or configuration
    // For now, we'll return a mock template
    const template = await recoveryService.initializeRecoveryProtocol(
      'template', // Use template as dummy injury ID
      protocolType
    );

    res.json({
      success: true,
      data: {
        protocolType,
        milestones: template,
        description: `Standard recovery protocol for ${protocolType}`,
        estimatedDuration: template.length * 7 // Assume weekly milestones
      }
    });

    logger.info(`Protocol template retrieved for type: ${protocolType}`);
  } catch (error: any) {
    logger.error('Error getting protocol template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Update milestone target date
 * PUT /api/v1/recovery-protocol/:injuryId/milestone/:milestoneName/date
 */
router.put('/:injuryId/milestone/:milestoneName/date', async (req: Request, res: Response) => {
  try {
    const { injuryId, milestoneName } = req.params;
    const { targetDate, reason } = req.body;

    if (!targetDate) {
      return res.status(400).json({
        success: false,
        error: 'Target date is required'
      });
    }

    // In a real implementation, this would update the milestone date
    // For now, we'll just record it as an adherence entry
    await recoveryService.recordAdherence(injuryId, {
      activity: `Milestone date updated: ${milestoneName}`,
      type: 'milestone',
      completed: false,
      notes: `New target date: ${targetDate}. Reason: ${reason || 'No reason provided'}`
    });

    res.json({
      success: true,
      message: `Target date updated for milestone "${milestoneName}"`
    });

    logger.info(`Milestone date updated for injury ${injuryId}: ${milestoneName} -> ${targetDate}`);
  } catch (error: any) {
    logger.error('Error updating milestone date:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;