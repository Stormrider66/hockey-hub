"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlayerPerformanceRoutes = void 0;
const express_1 = require("express");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const express_validator_1 = require("express-validator");
function createPlayerPerformanceRoutes(playerPerformanceRepo) {
    const router = (0, express_1.Router)();
    // Apply authentication to all routes
    router.use(shared_lib_1.authMiddleware);
    /**
     * GET /api/players/:playerId/stats
     * Get player statistics with optional date range
     */
    router.get('/:playerId/stats', [
        (0, express_validator_1.param)('playerId').isUUID().withMessage('Valid player ID required'),
        (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 format'),
        (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 format')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { playerId } = req.params;
            const { startDate, endDate } = req.query;
            const stats = await playerPerformanceRepo.getPlayerStats(playerId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Player stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch player statistics'
            });
        }
    });
    /**
     * GET /api/players/:playerId/trends
     * Get player performance trends over time
     */
    router.get('/:playerId/trends', [
        (0, express_validator_1.param)('playerId').isUUID().withMessage('Valid player ID required'),
        (0, express_validator_1.query)('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { playerId } = req.params;
            const days = req.query.days ? parseInt(req.query.days) : 30;
            const trends = await playerPerformanceRepo.getPlayerPerformanceTrends(playerId, days);
            res.json({
                success: true,
                data: trends
            });
        }
        catch (error) {
            console.error('Player trends error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch player trends'
            });
        }
    });
    /**
     * GET /api/teams/:teamId/players/stats
     * Get all player stats for a team on a specific date
     */
    router.get('/teams/:teamId/stats', [
        (0, express_validator_1.param)('teamId').isUUID().withMessage('Valid team ID required'),
        (0, express_validator_1.query)('date').isISO8601().withMessage('Date must be valid ISO8601 format')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { teamId } = req.params;
            const { date } = req.query;
            const stats = await playerPerformanceRepo.getTeamPlayerStats(teamId, new Date(date));
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Team player stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch team player statistics'
            });
        }
    });
    /**
     * GET /api/teams/:teamId/top-performers
     * Get top performing players for a team
     */
    router.get('/teams/:teamId/top-performers', [
        (0, express_validator_1.param)('teamId').isUUID().withMessage('Valid team ID required'),
        (0, express_validator_1.query)('metric').optional().isIn(['goals', 'assists', 'points', 'readinessScore', 'improvementRate'])
            .withMessage('Metric must be one of: goals, assists, points, readinessScore, improvementRate'),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { teamId } = req.params;
            const metric = req.query.metric || 'points';
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const topPerformers = await playerPerformanceRepo.getTopPerformers(teamId, metric, limit);
            res.json({
                success: true,
                data: topPerformers,
                metadata: {
                    metric,
                    limit,
                    teamId
                }
            });
        }
        catch (error) {
            console.error('Top performers error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch top performers'
            });
        }
    });
    /**
     * GET /api/organizations/:organizationId/analytics
     * Get performance analytics for entire organization
     */
    router.get('/organizations/:organizationId/analytics', [
        (0, express_validator_1.param)('organizationId').isUUID().withMessage('Valid organization ID required'),
        (0, express_validator_1.query)('period').optional().isIn(['week', 'month', 'season'])
            .withMessage('Period must be one of: week, month, season')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { organizationId } = req.params;
            const period = req.query.period || 'week';
            const analytics = await playerPerformanceRepo.getPerformanceAnalytics(organizationId, period);
            res.json({
                success: true,
                data: analytics
            });
        }
        catch (error) {
            console.error('Organization analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch organization analytics'
            });
        }
    });
    /**
     * POST /api/players/:playerId/stats
     * Create or update player performance statistics
     */
    router.post('/:playerId/stats', [
        (0, express_validator_1.param)('playerId').isUUID().withMessage('Valid player ID required')
        // Additional validation would be added based on the actual DTO structure
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { playerId } = req.params;
            const statsData = req.body;
            // Create new performance stat record
            const newStat = await playerPerformanceRepo.create({
                ...statsData,
                playerId
            });
            // Invalidate relevant caches
            await playerPerformanceRepo.invalidatePlayerCache(playerId);
            res.status(201).json({
                success: true,
                data: newStat
            });
        }
        catch (error) {
            console.error('Create player stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create player statistics'
            });
        }
    });
    /**
     * PUT /api/players/stats/:statId
     * Update specific player performance statistic
     */
    router.put('/stats/:statId', [
        (0, express_validator_1.param)('statId').isUUID().withMessage('Valid stat ID required')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { statId } = req.params;
            const updateData = req.body;
            const updatedStat = await playerPerformanceRepo.update(statId, updateData);
            if (updatedStat) {
                // Invalidate relevant caches
                await playerPerformanceRepo.invalidatePlayerCache(updatedStat.playerId);
                res.json({
                    success: true,
                    data: updatedStat
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    error: 'Player statistic not found'
                });
            }
        }
        catch (error) {
            console.error('Update player stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update player statistics'
            });
        }
    });
    return router;
}
exports.createPlayerPerformanceRoutes = createPlayerPerformanceRoutes;
//# sourceMappingURL=playerPerformanceRoutes.js.map