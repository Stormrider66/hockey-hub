"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDashboardRoutes = void 0;
const express_1 = require("express");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const express_validator_1 = require("express-validator");
function createDashboardRoutes(statisticsService) {
    const router = (0, express_1.Router)();
    // Apply authentication to all routes
    router.use(shared_lib_1.authMiddleware);
    /**
     * GET /api/dashboard/analytics
     * Get comprehensive dashboard analytics for organization/team/player
     * This is the KEY endpoint that will speed up ALL dashboards
     */
    router.get('/analytics', [
        (0, express_validator_1.query)('organizationId').isUUID().withMessage('Valid organization ID required'),
        (0, express_validator_1.query)('teamId').optional().isUUID().withMessage('Team ID must be valid UUID'),
        (0, express_validator_1.query)('playerId').optional().isUUID().withMessage('Player ID must be valid UUID')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { organizationId, teamId, playerId } = req.query;
            const analytics = await statisticsService.getDashboardAnalytics(organizationId, teamId, playerId);
            res.json({
                success: true,
                data: analytics
            });
        }
        catch (error) {
            console.error('Dashboard analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch dashboard analytics'
            });
        }
    });
    /**
     * GET /api/dashboard/player/:playerId
     * Optimized player dashboard data
     */
    router.get('/player/:playerId', [
        (0, express_validator_1.param)('playerId').isUUID().withMessage('Valid player ID required')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { playerId } = req.params;
            const dashboardData = await statisticsService.getPlayerDashboardData(playerId);
            res.json({
                success: true,
                data: dashboardData
            });
        }
        catch (error) {
            console.error('Player dashboard error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch player dashboard data'
            });
        }
    });
    /**
     * GET /api/dashboard/coach/:teamId
     * Optimized coach dashboard data
     */
    router.get('/coach/:teamId', [
        (0, express_validator_1.param)('teamId').isUUID().withMessage('Valid team ID required')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { teamId } = req.params;
            const dashboardData = await statisticsService.getCoachDashboardData(teamId);
            res.json({
                success: true,
                data: dashboardData
            });
        }
        catch (error) {
            console.error('Coach dashboard error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch coach dashboard data'
            });
        }
    });
    /**
     * GET /api/dashboard/trainer
     * Optimized physical trainer dashboard data
     */
    router.get('/trainer', [
        (0, express_validator_1.query)('organizationId').isUUID().withMessage('Valid organization ID required'),
        (0, express_validator_1.query)('teamId').optional().isUUID().withMessage('Team ID must be valid UUID')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { organizationId, teamId } = req.query;
            const dashboardData = await statisticsService.getPhysicalTrainerDashboardData(organizationId, teamId);
            res.json({
                success: true,
                data: dashboardData
            });
        }
        catch (error) {
            console.error('Trainer dashboard error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch trainer dashboard data'
            });
        }
    });
    /**
     * GET /api/dashboard/admin/:organizationId
     * Optimized admin dashboard data
     */
    router.get('/admin/:organizationId', [
        (0, express_validator_1.param)('organizationId').isUUID().withMessage('Valid organization ID required')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { organizationId } = req.params;
            const dashboardData = await statisticsService.getAdminDashboardData(organizationId);
            res.json({
                success: true,
                data: dashboardData
            });
        }
        catch (error) {
            console.error('Admin dashboard error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch admin dashboard data'
            });
        }
    });
    /**
     * POST /api/dashboard/invalidate
     * Invalidate dashboard caches when data changes
     */
    router.post('/invalidate', [
        (0, express_validator_1.query)('type').isIn(['player', 'team', 'organization']).withMessage('Type must be player, team, or organization'),
        (0, express_validator_1.query)('id').isUUID().withMessage('Valid ID required')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { type, id } = req.query;
            switch (type) {
                case 'player':
                    await statisticsService.invalidatePlayerData(id);
                    break;
                case 'team':
                    await statisticsService.invalidateTeamData(id);
                    break;
                case 'organization':
                    await statisticsService.invalidateOrganizationData(id);
                    break;
            }
            res.json({
                success: true,
                message: `${type} cache invalidated successfully`
            });
        }
        catch (error) {
            console.error('Cache invalidation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to invalidate cache'
            });
        }
    });
    return router;
}
exports.createDashboardRoutes = createDashboardRoutes;
//# sourceMappingURL=dashboardRoutes.js.map