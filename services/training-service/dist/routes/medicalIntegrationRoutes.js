"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMedicalIntegrationRoutes = void 0;
const express_1 = require("express");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const MedicalIntegrationService_1 = require("../services/MedicalIntegrationService");
const database_1 = require("../config/database");
const medical_integration_dto_1 = require("../dto/medical-integration.dto");
const router = (0, express_1.Router)();
let medicalIntegrationService;
// Initialize service when database is ready
const initializeMedicalIntegrationRoutes = () => {
    if (database_1.AppDataSource.isInitialized) {
        medicalIntegrationService = new MedicalIntegrationService_1.MedicalIntegrationService(database_1.AppDataSource);
    }
};
exports.initializeMedicalIntegrationRoutes = initializeMedicalIntegrationRoutes;
// Middleware to ensure service is initialized
const ensureServiceInitialized = (req, res, next) => {
    if (!medicalIntegrationService && database_1.AppDataSource.isInitialized) {
        medicalIntegrationService = new MedicalIntegrationService_1.MedicalIntegrationService(database_1.AppDataSource);
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
router.post('/restrictions', (0, shared_lib_1.authMiddleware)({ requiredPermissions: ['medical:read', 'training:write'] }), (0, shared_lib_1.validationMiddleware)(medical_integration_dto_1.SyncMedicalRestrictionsDTO), ensureServiceInitialized, (0, shared_lib_1.asyncWrapper)(async (req, res) => {
    const user = req.user;
    const dto = {
        ...req.body,
        organizationId: user.organizationId
    };
    const result = await medicalIntegrationService.syncMedicalRestrictions(dto);
    res.json({
        success: true,
        data: result,
        message: `Successfully synced ${result.synced} restrictions (${result.created} created, ${result.updated} updated)`
    });
}));
/**
 * @route   GET /api/v1/training/medical-sync/compliance/:sessionId
 * @desc    Check medical compliance for a training session
 * @access  Private (Coaches, Medical Staff, Physical Trainer)
 */
router.get('/compliance/:sessionId', (0, shared_lib_1.authMiddleware)({ requiredPermissions: ['training:read'] }), ensureServiceInitialized, (0, shared_lib_1.asyncWrapper)(async (req, res) => {
    const dto = {
        sessionId: req.params.sessionId,
        playerId: req.query.playerId,
        detailed: req.query.detailed === 'true'
    };
    const result = await medicalIntegrationService.checkSessionCompliance(dto);
    res.json({
        success: true,
        data: result
    });
}));
/**
 * @route   POST /api/v1/training/medical-sync/report-concern
 * @desc    Report a medical concern during training
 * @access  Private (Players, Coaches, Medical Staff, Physical Trainer)
 */
router.post('/report-concern', (0, shared_lib_1.authMiddleware)({ requiredPermissions: ['training:write'] }), (0, shared_lib_1.validationMiddleware)(medical_integration_dto_1.ReportMedicalConcernDTO), ensureServiceInitialized, (0, shared_lib_1.asyncWrapper)(async (req, res) => {
    const user = req.user;
    const dto = {
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
}));
/**
 * @route   GET /api/v1/training/medical-sync/alternatives/:playerId
 * @desc    Get alternative exercises for a player based on medical restrictions
 * @access  Private (Coaches, Medical Staff, Physical Trainer)
 */
router.get('/alternatives/:playerId', (0, shared_lib_1.authMiddleware)({ requiredPermissions: ['training:read'] }), ensureServiceInitialized, (0, shared_lib_1.asyncWrapper)(async (req, res) => {
    const dto = {
        playerId: req.params.playerId,
        exerciseIds: req.query.exerciseIds
            ? req.query.exerciseIds.split(',')
            : undefined,
        workoutId: req.query.workoutId,
        includeRationale: req.query.includeRationale === 'true'
    };
    const result = await medicalIntegrationService.getExerciseAlternatives(dto);
    res.json({
        success: true,
        data: result
    });
}));
/**
 * @route   POST /api/v1/training/medical-sync/override
 * @desc    Create a medical override for a workout assignment
 * @access  Private (Medical Staff, Physical Trainer with approval)
 */
router.post('/override', (0, shared_lib_1.authMiddleware)({ requiredPermissions: ['medical:write', 'training:write'] }), (0, shared_lib_1.validationMiddleware)(medical_integration_dto_1.CreateMedicalOverrideDTO), ensureServiceInitialized, (0, shared_lib_1.asyncWrapper)(async (req, res) => {
    const user = req.user;
    const dto = req.body;
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
}));
/**
 * @route   GET /api/v1/training/medical-sync/active-restrictions
 * @desc    Get all active medical restrictions for the organization
 * @access  Private (Medical Staff, Physical Trainer)
 */
router.get('/active-restrictions', (0, shared_lib_1.authMiddleware)({ requiredPermissions: ['medical:read', 'training:read'] }), ensureServiceInitialized, (0, shared_lib_1.asyncWrapper)(async (req, res) => {
    const user = req.user;
    const { teamId, includeExpired } = req.query;
    const dto = {
        organizationId: user.organizationId,
        teamId: teamId,
        includeExpired: includeExpired === 'true'
    };
    // This endpoint reuses the sync method but only returns the data
    const restrictions = await medicalIntegrationService.syncMedicalRestrictions(dto);
    res.json({
        success: true,
        data: restrictions,
        message: 'Active restrictions retrieved successfully'
    });
}));
/**
 * @route   POST /api/v1/training/medical-sync/bulk-compliance
 * @desc    Check compliance for multiple sessions or players
 * @access  Private (Coaches, Medical Staff, Physical Trainer)
 */
router.post('/bulk-compliance', (0, shared_lib_1.authMiddleware)({ requiredPermissions: ['training:read'] }), ensureServiceInitialized, (0, shared_lib_1.asyncWrapper)(async (req, res) => {
    const { sessionIds, playerIds, detailed } = req.body;
    const results = [];
    // Check compliance for each session
    for (const sessionId of sessionIds || []) {
        if (playerIds?.length) {
            for (const playerId of playerIds) {
                const dto = {
                    sessionId,
                    playerId,
                    detailed: detailed || false
                };
                const result = await medicalIntegrationService.checkSessionCompliance(dto);
                results.push(result);
            }
        }
        else {
            const dto = {
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
}));
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
exports.default = router;
//# sourceMappingURL=medicalIntegrationRoutes.js.map