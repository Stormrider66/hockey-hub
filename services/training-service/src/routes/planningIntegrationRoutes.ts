// @ts-nocheck - Planning integration routes with complex type mappings
import { Router, Request, Response, type Router as ExpressRouter } from 'express';
import { extractUser, requireAuth } from '../middleware/auth';
import { validationMiddleware } from '@hockey-hub/shared-lib';
import { 
  NotFoundError,
  successResponse,
  errorResponse 
} from '@hockey-hub/shared-lib';
import { PlanningIntegrationService } from '../services/PlanningIntegrationService';
import { AppDataSource } from '../config/database';
import {
  GetCurrentPhaseRequestDto,
  GetCurrentPhaseResponseDto,
  GetSeasonPlanRequestDto,
  GetSeasonPlanResponseDto,
  SyncPhaseAdjustmentsRequestDto,
  SyncPhaseAdjustmentsResponseDto,
  ApplyPhaseTemplateRequestDto,
  ApplyPhaseTemplateResponseDto,
  GetWorkloadAnalyticsRequestDto,
  GetWorkloadAnalyticsResponseDto,
  NotifyTrainingCompletionRequestDto,
  SyncStatusResponseDto
} from '../dto/planning-integration.dto';

const router: ExpressRouter = Router();

// Service instance
let planningIntegrationService: PlanningIntegrationService;

// Initialize service
export const initializePlanningIntegrationRoutes = () => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database must be initialized before planning integration routes');
  }
  planningIntegrationService = new PlanningIntegrationService(AppDataSource);
};

/**
 * @swagger
 * /api/v1/training/planning/current-phase/{teamId}:
 *   get:
 *     summary: Get current training phase for a team
 *     tags: [Planning Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Current phase information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetCurrentPhaseResponseDto'
 *       404:
 *         description: Team or phase not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/current-phase/:teamId',
  extractUser, requireAuth,
  validationMiddleware(GetCurrentPhaseRequestDto),
  async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;

      const phase = await planningIntegrationService.getCurrentPhase(teamId);

      if (!phase) {
        return res.status(404).json(
          errorResponse('No current training phase found for team', 'PHASE_NOT_FOUND')
        );
      }

      const response: GetCurrentPhaseResponseDto = {
        phase,
        message: 'Current phase retrieved successfully'
      };

      res.json(successResponse(response));
    } catch (error) {
      console.error('Error getting current phase:', error);
      const message = error instanceof Error ? error.message : 'Failed to get current phase';
      res.status(500).json(errorResponse(message, 'PHASE_FETCH_ERROR'));
    }
  }
);

/**
 * @swagger
 * /api/v1/training/planning/season-plan/{teamId}:
 *   get:
 *     summary: Get season plan for a team
 *     tags: [Planning Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Season plan information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetSeasonPlanResponseDto'
 *       404:
 *         description: Team or season plan not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/season-plan/:teamId',
  extractUser, requireAuth,
  validationMiddleware(GetSeasonPlanRequestDto),
  async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;

      const plan = await planningIntegrationService.getSeasonPlan(teamId);

      if (!plan) {
        return res.status(404).json(
          errorResponse('No season plan found for team', 'PLAN_NOT_FOUND')
        );
      }

      const response: GetSeasonPlanResponseDto = {
        plan,
        message: 'Season plan retrieved successfully'
      };

      res.json(successResponse(response));
    } catch (error) {
      console.error('Error getting season plan:', error);
      const message = error instanceof Error ? error.message : 'Failed to get season plan';
      res.status(500).json(errorResponse(message, 'PLAN_FETCH_ERROR'));
    }
  }
);

/**
 * @swagger
 * /api/v1/training/planning/sync-phase-adjustments:
 *   post:
 *     summary: Sync and apply phase-based adjustments to workout assignments
 *     tags: [Planning Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SyncPhaseAdjustmentsRequestDto'
 *     responses:
 *       200:
 *         description: Phase adjustments applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SyncPhaseAdjustmentsResponseDto'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Team or phase not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/sync-phase-adjustments',
  extractUser, requireAuth,
  validationMiddleware(SyncPhaseAdjustmentsRequestDto),
  async (req: Request, res: Response) => {
    try {
      const { teamId, phaseId, forceUpdate, playersToInclude, adjustmentTypes } = req.body;

      const adjustments = await planningIntegrationService.applyPhaseAdjustments(
        teamId,
        phaseId,
        {
          forceUpdate,
          playersToInclude,
          adjustmentTypes
        }
      );

      const response: SyncPhaseAdjustmentsResponseDto = {
        adjustments,
        assignmentsUpdated: adjustments.length,
        message: `Applied ${adjustments.length} phase adjustments successfully`
      };

      res.json(successResponse(response));
    } catch (error) {
      console.error('Error syncing phase adjustments:', error);
      
      if (error instanceof NotFoundError) {
        return res.status(404).json(errorResponse(error.message, 'PHASE_NOT_FOUND'));
      }
      
      const message = error instanceof Error ? error.message : 'Failed to sync phase adjustments';
      res.status(500).json(errorResponse(message, 'PHASE_SYNC_ERROR'));
    }
  }
);

/**
 * @swagger
 * /api/v1/training/planning/apply-phase-template:
 *   post:
 *     summary: Apply a phase template to a team
 *     tags: [Planning Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplyPhaseTemplateRequestDto'
 *     responses:
 *       200:
 *         description: Phase template applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplyPhaseTemplateResponseDto'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Template not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/apply-phase-template',
  extractUser, requireAuth,
  validationMiddleware(ApplyPhaseTemplateRequestDto),
  async (req: Request, res: Response) => {
    try {
      const { teamId, templateId, startDate, customizations } = req.body;

      const result = await planningIntegrationService.applyPhaseTemplate(
        teamId,
        templateId,
        {
          startDate: new Date(startDate),
          customizations
        }
      );

      const response: ApplyPhaseTemplateResponseDto = {
        ...result,
        message: `Phase template applied successfully. Created ${result.assignmentsCreated} assignments with ${result.adjustmentsApplied} adjustments.`
      };

      res.json(successResponse(response));
    } catch (error) {
      console.error('Error applying phase template:', error);
      
      if (error instanceof NotFoundError) {
        return res.status(404).json(errorResponse(error.message, 'TEMPLATE_NOT_FOUND'));
      }
      
      const message = error instanceof Error ? error.message : 'Failed to apply phase template';
      res.status(500).json(errorResponse(message, 'TEMPLATE_APPLY_ERROR'));
    }
  }
);

/**
 * @swagger
 * /api/v1/training/planning/workload-analytics:
 *   get:
 *     summary: Get workload analytics for a team
 *     tags: [Planning Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Workload analytics data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetWorkloadAnalyticsResponseDto'
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.get(
  '/workload-analytics',
  extractUser, requireAuth,
  validationMiddleware(GetWorkloadAnalyticsRequestDto),
  async (req: Request, res: Response) => {
    try {
      const { teamId, startDate, endDate } = req.query as any;

      const workloadData = await planningIntegrationService.getWorkloadAnalytics(
        teamId,
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        }
      );

      const response: GetWorkloadAnalyticsResponseDto = {
        workloadData,
        message: `Retrieved workload analytics for ${workloadData.length} data points`
      };

      res.json(successResponse(response));
    } catch (error) {
      console.error('Error getting workload analytics:', error);
      const message = error instanceof Error ? error.message : 'Failed to get workload analytics';
      res.status(500).json(errorResponse(message, 'WORKLOAD_ANALYTICS_ERROR'));
    }
  }
);

/**
 * @swagger
 * /api/v1/training/planning/notify-completion:
 *   post:
 *     summary: Notify planning service of training completion
 *     tags: [Planning Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotifyTrainingCompletionRequestDto'
 *     responses:
 *       200:
 *         description: Training completion notification sent successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
router.post(
  '/notify-completion',
  extractUser, requireAuth,
  validationMiddleware(NotifyTrainingCompletionRequestDto),
  async (req: Request, res: Response) => {
    try {
      const { assignmentId, completionData } = req.body;

      await planningIntegrationService.notifyTrainingCompletion(assignmentId, {
        ...completionData,
        completedAt: new Date(completionData.completedAt)
      });

      res.json(successResponse({ 
        message: 'Training completion notification sent successfully' 
      }));
    } catch (error) {
      console.error('Error notifying training completion:', error);
      const message = error instanceof Error ? error.message : 'Failed to notify training completion';
      res.status(500).json(errorResponse(message, 'COMPLETION_NOTIFICATION_ERROR'));
    }
  }
);

/**
 * @swagger
 * /api/v1/training/planning/sync-status/{teamId}:
 *   get:
 *     summary: Get sync status and perform automatic sync with planning service
 *     tags: [Planning Integration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Sync status and results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SyncStatusResponseDto'
 *       400:
 *         description: Invalid team ID
 *       500:
 *         description: Internal server error
 */
router.get(
  '/sync-status/:teamId',
  extractUser, requireAuth,
  validationMiddleware(GetCurrentPhaseRequestDto),
  async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;

      const syncResult = await planningIntegrationService.syncPhaseUpdates(teamId);

      const response: SyncStatusResponseDto = {
        ...syncResult,
        message: syncResult.errors.length > 0 
          ? `Sync completed with ${syncResult.errors.length} errors`
          : 'Sync completed successfully'
      };

      res.json(successResponse(response));
    } catch (error) {
      console.error('Error getting sync status:', error);
      const message = error instanceof Error ? error.message : 'Failed to get sync status';
      res.status(500).json(errorResponse(message, 'SYNC_STATUS_ERROR'));
    }
  }
);

// Export router and initialization function
export { router as planningIntegrationRoutes, initializePlanningIntegrationRoutes };
export default router;