import { Router } from 'express';
import { authMiddleware, validationMiddleware, asyncWrapper } from '@hockey-hub/shared-lib';
import { MedicalIntegrationService } from '../services/MedicalIntegrationService';
import { AppDataSource } from '../config/database';
import {
  SyncMedicalRestrictionsDTO,
  ComplianceCheckDTO,
  ReportMedicalConcernDTO,
  GetAlternativesDTO,
  CreateMedicalOverrideDTO
} from '../dto/medical-integration.dto';

const router = Router();
let medicalIntegrationService: MedicalIntegrationService;

// Initialize service when database is ready
export const initializeMedicalIntegrationRoutes = () => {
  if (AppDataSource.isInitialized) {
    medicalIntegrationService = new MedicalIntegrationService(AppDataSource);
  }
};

// Middleware to ensure service is initialized
const ensureServiceInitialized = (req: any, res: any, next: any) => {
  if (!medicalIntegrationService && AppDataSource.isInitialized) {
    medicalIntegrationService = new MedicalIntegrationService(AppDataSource);
  }
  
  if (!medicalIntegrationService) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Medical integration service is not initialized'
      }
    });
  }
  
  next();
};

/**
 * @route   POST /api/v1/training/medical-sync/restrictions
 * @desc    Sync medical restrictions from medical service
 * @access  Private (Medical Staff, Physical Trainer)
 */
router.post(
  '/restrictions',
  authMiddleware({ requiredPermissions: ['medical:read', 'training:write'] }),
  validationMiddleware(SyncMedicalRestrictionsDTO),
  ensureServiceInitialized,
  asyncWrapper(async (req, res) => {
    const user = req.user!;
    const dto: SyncMedicalRestrictionsDTO = {
      ...req.body,
      organizationId: user.organizationId
    };

    const result = await medicalIntegrationService.syncMedicalRestrictions(dto);

    res.json({
      success: true,
      data: result,
      message: `Successfully synced ${result.synced} restrictions (${result.created} created, ${result.updated} updated)`
    });
  })
);

/**
 * @route   GET /api/v1/training/medical-sync/compliance/:sessionId
 * @desc    Check medical compliance for a training session
 * @access  Private (Coaches, Medical Staff, Physical Trainer)
 */
router.get(
  '/compliance/:sessionId',
  authMiddleware({ requiredPermissions: ['training:read'] }),
  ensureServiceInitialized,
  asyncWrapper(async (req, res) => {
    const dto: ComplianceCheckDTO = {
      sessionId: req.params.sessionId,
      playerId: req.query.playerId as string,
      detailed: req.query.detailed === 'true'
    };

    const result = await medicalIntegrationService.checkSessionCompliance(dto);

    res.json({
      success: true,
      data: result
    });
  })
);

/**
 * @route   POST /api/v1/training/medical-sync/report-concern
 * @desc    Report a medical concern during training
 * @access  Private (Players, Coaches, Medical Staff, Physical Trainer)
 */
router.post(
  '/report-concern',
  authMiddleware({ requiredPermissions: ['training:write'] }),
  validationMiddleware(ReportMedicalConcernDTO),
  ensureServiceInitialized,
  asyncWrapper(async (req, res) => {
    const user = req.user!;
    const dto: ReportMedicalConcernDTO = {
      ...req.body,
      reportedBy: user.id,
      occurredAt: req.body.occurredAt || new Date()
    };

    const result = await medicalIntegrationService.reportMedicalConcern(dto);

    res.json({
      success: true,
      data: result,
      message: 'Medical concern reported successfully'
    });
  })
);

/**
 * @route   GET /api/v1/training/medical-sync/alternatives/:playerId
 * @desc    Get alternative exercises for a player based on medical restrictions
 * @access  Private (Coaches, Medical Staff, Physical Trainer)
 */
router.get(
  '/alternatives/:playerId',
  authMiddleware({ requiredPermissions: ['training:read'] }),
  ensureServiceInitialized,
  asyncWrapper(async (req, res) => {
    const dto: GetAlternativesDTO = {
      playerId: req.params.playerId,
      exerciseIds: req.query.exerciseIds 
        ? (req.query.exerciseIds as string).split(',') 
        : undefined,
      workoutId: req.query.workoutId as string,
      includeRationale: req.query.includeRationale === 'true'
    };

    const result = await medicalIntegrationService.getExerciseAlternatives(dto);

    res.json({
      success: true,
      data: result
    });
  })
);

/**
 * @route   POST /api/v1/training/medical-sync/override
 * @desc    Create a medical override for a workout assignment
 * @access  Private (Medical Staff, Physical Trainer with approval)
 */
router.post(
  '/override',
  authMiddleware({ requiredPermissions: ['medical:write', 'training:write'] }),
  validationMiddleware(CreateMedicalOverrideDTO),
  ensureServiceInitialized,
  asyncWrapper(async (req, res) => {
    const user = req.user!;
    const dto: CreateMedicalOverrideDTO = req.body;

    // Auto-approve if user is medical staff
    if (user.roles?.includes('medical_staff')) {
      dto.autoApprove = true;
    }

    const result = await medicalIntegrationService.createMedicalOverride(dto);

    res.json({
      success: true,
      data: result,
      message: 'Medical override created successfully'
    });
  })
);

/**
 * @route   GET /api/v1/training/medical-sync/active-restrictions
 * @desc    Get all active medical restrictions for the organization
 * @access  Private (Medical Staff, Physical Trainer)
 */
router.get(
  '/active-restrictions',
  authMiddleware({ requiredPermissions: ['medical:read', 'training:read'] }),
  ensureServiceInitialized,
  asyncWrapper(async (req, res) => {
    const user = req.user!;
    const { teamId, includeExpired } = req.query;

    const dto: SyncMedicalRestrictionsDTO = {
      organizationId: user.organizationId,
      teamId: teamId as string,
      includeExpired: includeExpired === 'true'
    };

    // This endpoint reuses the sync method but only returns the data
    const restrictions = await medicalIntegrationService.syncMedicalRestrictions(dto);

    res.json({
      success: true,
      data: restrictions,
      message: 'Active restrictions retrieved successfully'
    });
  })
);

/**
 * @route   POST /api/v1/training/medical-sync/bulk-compliance
 * @desc    Check compliance for multiple sessions or players
 * @access  Private (Coaches, Medical Staff, Physical Trainer)
 */
router.post(
  '/bulk-compliance',
  authMiddleware({ requiredPermissions: ['training:read'] }),
  ensureServiceInitialized,
  asyncWrapper(async (req, res) => {
    const { sessionIds, playerIds, detailed } = req.body;
    const results = [];

    // Check compliance for each session
    for (const sessionId of sessionIds || []) {
      if (playerIds?.length) {
        for (const playerId of playerIds) {
          const dto: ComplianceCheckDTO = {
            sessionId,
            playerId,
            detailed: detailed || false
          };
          const result = await medicalIntegrationService.checkSessionCompliance(dto);
          results.push(result);
        }
      } else {
        const dto: ComplianceCheckDTO = {
          sessionId,
          detailed: detailed || false
        };
        const result = await medicalIntegrationService.checkSessionCompliance(dto);
        results.push(result);
      }
    }

    res.json({
      success: true,
      data: results,
      summary: {
        total: results.length,
        compliant: results.filter(r => r.overallStatus === 'compliant').length,
        partial: results.filter(r => r.overallStatus === 'partial').length,
        nonCompliant: results.filter(r => r.overallStatus === 'non_compliant').length,
        notApplicable: results.filter(r => r.overallStatus === 'not_applicable').length
      }
    });
  })
);

/**
 * @route   GET /api/v1/training/medical-sync/health
 * @desc    Health check for medical integration
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: medicalIntegrationService ? 'ready' : 'initializing',
      service: 'medical-integration',
      features: [
        'restriction-sync',
        'compliance-check',
        'concern-reporting',
        'exercise-alternatives',
        'medical-overrides'
      ]
    }
  });
});

export default router;