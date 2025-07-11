"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const WorkoutAssignmentService_1 = require("../services/WorkoutAssignmentService");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const dto_1 = require("../dto");
const router = (0, express_1.Router)();
const assignmentService = new WorkoutAssignmentService_1.WorkoutAssignmentService();
// Apply authentication to all routes
router.use(shared_lib_1.authenticate);
// Middleware to check database connection
const checkDatabase = (req, res, next) => {
    if (!database_1.AppDataSource.isInitialized) {
        return res.status(503).json({
            success: false,
            error: 'Database service unavailable',
            message: 'Please ensure the database is created and running'
        });
    }
    next();
};
/**
 * POST /api/v1/training/workouts/bulk-assign
 * Bulk assignment to organization/team/group
 */
router.post('/bulk-assign', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin']), (0, shared_lib_1.validationMiddleware)(dto_1.BulkAssignWorkoutDto), checkDatabase, async (req, res) => {
    try {
        const user = req.user;
        const organizationId = user?.organizationId || req.body.organizationId;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }
        const result = await assignmentService.bulkAssign(req.body, user.id, organizationId);
        res.status(201).json({
            success: true,
            data: result,
            message: `Successfully created ${result.created} assignments. ${result.failed} failed. ${result.conflicts.length} conflicts detected.`
        });
    }
    catch (error) {
        console.error('Error in bulk assignment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform bulk assignment',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/v1/training/workouts/cascade
 * Cascade assignments with hierarchy
 */
router.post('/cascade', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin']), (0, shared_lib_1.validationMiddleware)(dto_1.CascadeAssignmentDto), checkDatabase, async (req, res) => {
    try {
        const user = req.user;
        const organizationId = user?.organizationId || req.body.organizationId;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }
        const result = await assignmentService.cascadeAssignment(req.body, user.id, organizationId);
        res.status(201).json({
            success: true,
            data: result,
            message: `Successfully cascaded ${result.created} assignments. ${result.failed} failed. ${result.conflicts.length} conflicts detected.`
        });
    }
    catch (error) {
        console.error('Error in cascade assignment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cascade assignment',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/v1/training/workouts/conflicts
 * Check for scheduling conflicts
 */
router.get('/conflicts', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin', 'medical_staff']), (0, shared_lib_1.validationMiddleware)(dto_1.ConflictCheckDto, 'query'), checkDatabase, async (req, res) => {
    try {
        // Convert query params to proper types
        const dto = {
            playerIds: Array.isArray(req.query.playerIds)
                ? req.query.playerIds
                : [req.query.playerIds],
            startDate: new Date(req.query.startDate),
            endDate: new Date(req.query.endDate),
            workoutTypes: req.query.workoutTypes,
            checkMedicalRestrictions: req.query.checkMedicalRestrictions === 'true',
            checkLoadLimits: req.query.checkLoadLimits === 'true',
            maxDailyLoad: req.query.maxDailyLoad ? parseInt(req.query.maxDailyLoad) : undefined,
            maxWeeklyLoad: req.query.maxWeeklyLoad ? parseInt(req.query.maxWeeklyLoad) : undefined
        };
        const conflicts = await assignmentService.checkConflicts(dto);
        res.json({
            success: true,
            data: conflicts,
            message: `Found ${conflicts.length} potential conflicts`
        });
    }
    catch (error) {
        console.error('Error checking conflicts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check conflicts',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/v1/training/workouts/resolve-conflicts
 * Resolve detected conflicts
 */
router.post('/resolve-conflicts', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin']), (0, shared_lib_1.validationMiddleware)(dto_1.ResolveConflictDto), checkDatabase, async (req, res) => {
    try {
        const user = req.user;
        await assignmentService.resolveConflict(req.body, user.id);
        res.json({
            success: true,
            message: 'Conflict resolved successfully'
        });
    }
    catch (error) {
        console.error('Error resolving conflict:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resolve conflict',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/v1/training/workouts/assignments/:playerId
 * Get player's assignments
 */
router.get('/assignments/:playerId', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin', 'player', 'parent', 'medical_staff']), checkDatabase, async (req, res) => {
    try {
        const { playerId } = req.params;
        const user = req.user;
        // Check authorization: players can only view their own assignments
        if (user.role === 'player' && user.id !== playerId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized to view other player assignments'
            });
        }
        // Parse filter parameters
        const filter = {
            status: req.query.status,
            assignmentType: req.query.assignmentType,
            startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            includeExpired: req.query.includeExpired === 'true',
            includeOverrides: req.query.includeOverrides === 'true'
        };
        const assignments = await assignmentService.getPlayerAssignments(playerId, filter);
        res.json({
            success: true,
            data: assignments,
            message: `Found ${assignments.length} assignments`
        });
    }
    catch (error) {
        console.error('Error fetching player assignments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch player assignments',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * PUT /api/v1/training/workouts/assignments/:id/override
 * Create player override
 */
router.put('/assignments/:id/override', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin', 'medical_staff']), (0, shared_lib_1.validationMiddleware)(dto_1.CreatePlayerOverrideDto), checkDatabase, async (req, res) => {
    try {
        const { id: assignmentId } = req.params;
        const user = req.user;
        const override = await assignmentService.createPlayerOverride(req.body, user.id, assignmentId);
        res.json({
            success: true,
            data: override,
            message: 'Player override created successfully'
        });
    }
    catch (error) {
        console.error('Error creating player override:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create player override',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/v1/training/workouts/assignments
 * Get all assignments with filters (admin view)
 */
router.get('/assignments', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin']), checkDatabase, async (req, res) => {
    try {
        const user = req.user;
        const organizationId = user?.organizationId;
        // Parse pagination parameters
        const paginationParams = (0, shared_lib_1.parsePaginationParams)(req.query, {
            page: 1,
            limit: 20,
            maxLimit: 100
        });
        // Parse filter parameters
        const filter = {
            playerId: req.query.playerId,
            teamId: req.query.teamId,
            status: req.query.status,
            assignmentType: req.query.assignmentType,
            startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            includeExpired: req.query.includeExpired === 'true',
            includeOverrides: req.query.includeOverrides === 'true',
            page: paginationParams.page,
            limit: paginationParams.limit
        };
        // TODO: Implement organization-wide assignment search
        res.json({
            success: true,
            data: [],
            pagination: {
                page: paginationParams.page,
                limit: paginationParams.limit,
                total: 0,
                totalPages: 0
            },
            message: 'Organization-wide assignment search not yet implemented'
        });
    }
    catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch assignments',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/v1/training/workouts/assignments/:id/complete
 * Mark assignment as completed
 */
router.post('/assignments/:id/complete', (0, shared_lib_1.authorize)(['physical_trainer', 'coach', 'admin', 'player']), checkDatabase, async (req, res) => {
    try {
        const { id: assignmentId } = req.params;
        const user = req.user;
        // TODO: Implement assignment completion logic
        // This would update the assignment status and trigger events
        res.json({
            success: true,
            message: 'Assignment marked as completed'
        });
    }
    catch (error) {
        console.error('Error completing assignment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete assignment',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Apply checkDatabase middleware to all routes
router.use(checkDatabase);
exports.default = router;
//# sourceMappingURL=workoutAssignmentRoutes.js.map