"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeamAnalyticsRoutes = void 0;
const express_1 = require("express");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const express_validator_1 = require("express-validator");
function createTeamAnalyticsRoutes(teamAnalyticsRepo) {
    const router = (0, express_1.Router)();
    // Apply authentication to all routes
    router.use(shared_lib_1.authMiddleware);
    /**
     * GET /api/teams/:teamId/season-stats
     * Get team season statistics
     */
    router.get('/:teamId/season-stats', [
        (0, express_validator_1.param)('teamId').isUUID().withMessage('Valid team ID required'),
        (0, express_validator_1.query)('seasonId').optional().isUUID().withMessage('Season ID must be valid UUID')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { teamId } = req.params;
            const { seasonId } = req.query;
            const seasonStats = await teamAnalyticsRepo.getTeamSeasonStats(teamId, seasonId);
            res.json({
                success: true,
                data: seasonStats
            });
        }
        catch (error) {
            console.error('Team season stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch team season statistics'
            });
        }
    });
    /**
     * GET /api/teams/:teamId/advanced-stats
     * Get advanced team analytics (Corsi, Fenwick, etc.)
     */
    router.get('/:teamId/advanced-stats', [
        (0, express_validator_1.param)('teamId').isUUID().withMessage('Valid team ID required'),
        (0, express_validator_1.query)('gameType').optional().isIn(['regular', 'playoff', 'practice', 'scrimmage'])
            .withMessage('Game type must be one of: regular, playoff, practice, scrimmage')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { teamId } = req.params;
            const gameType = req.query.gameType || 'regular';
            const advancedStats = await teamAnalyticsRepo.getAdvancedTeamStats(teamId, gameType);
            res.json({
                success: true,
                data: advancedStats
            });
        }
        catch (error) {
            console.error('Advanced team stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch advanced team statistics'
            });
        }
    });
    /**
     * GET /api/teams/:teamId/line-performance
     * Get line combination performance statistics
     */
    router.get('/:teamId/line-performance', [
        (0, express_validator_1.param)('teamId').isUUID().withMessage('Valid team ID required'),
        (0, express_validator_1.query)('period').optional().isIn(['week', 'month']).withMessage('Period must be week or month')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { teamId } = req.params;
            const period = req.query.period || 'week';
            const lineStats = await teamAnalyticsRepo.getLinePerformanceStats(teamId, period);
            res.json({
                success: true,
                data: lineStats,
                metadata: {
                    period,
                    teamId
                }
            });
        }
        catch (error) {
            console.error('Line performance error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch line performance statistics'
            });
        }
    });
    /**
     * GET /api/organizations/:organizationId/standings
     * Get league standings for organization
     */
    router.get('/organizations/:organizationId/standings', [
        (0, express_validator_1.param)('organizationId').isUUID().withMessage('Valid organization ID required'),
        (0, express_validator_1.query)('seasonId').optional().isUUID().withMessage('Season ID must be valid UUID')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { organizationId } = req.params;
            const { seasonId } = req.query;
            const standings = await teamAnalyticsRepo.getLeagueStandings(organizationId, seasonId);
            res.json({
                success: true,
                data: standings
            });
        }
        catch (error) {
            console.error('League standings error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch league standings'
            });
        }
    });
    /**
     * POST /api/teams/compare
     * Compare multiple teams across various metrics
     */
    router.post('/compare', [
        (0, express_validator_1.query)('period').optional().isIn(['week', 'month', 'season']).withMessage('Period must be week, month, or season')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { teamIds } = req.body;
            const period = req.query.period || 'month';
            if (!Array.isArray(teamIds) || teamIds.length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'At least 2 team IDs required for comparison'
                });
            }
            if (teamIds.length > 10) {
                return res.status(400).json({
                    success: false,
                    error: 'Maximum 10 teams can be compared at once'
                });
            }
            const comparison = await teamAnalyticsRepo.getTeamComparison(teamIds, period);
            res.json({
                success: true,
                data: comparison
            });
        }
        catch (error) {
            console.error('Team comparison error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to compare teams'
            });
        }
    });
    /**
     * POST /api/teams/:teamId/analytics
     * Create or update team analytics record
     */
    router.post('/:teamId/analytics', [
        (0, express_validator_1.param)('teamId').isUUID().withMessage('Valid team ID required')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { teamId } = req.params;
            const analyticsData = req.body;
            const newAnalytics = await teamAnalyticsRepo.create({
                ...analyticsData,
                teamId
            });
            // Invalidate relevant caches
            await teamAnalyticsRepo.invalidateTeamCache(teamId);
            res.status(201).json({
                success: true,
                data: newAnalytics
            });
        }
        catch (error) {
            console.error('Create team analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create team analytics'
            });
        }
    });
    /**
     * PUT /api/teams/analytics/:analyticsId
     * Update specific team analytics record
     */
    router.put('/analytics/:analyticsId', [
        (0, express_validator_1.param)('analyticsId').isUUID().withMessage('Valid analytics ID required')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { analyticsId } = req.params;
            const updateData = req.body;
            const updatedAnalytics = await teamAnalyticsRepo.update(analyticsId, updateData);
            if (updatedAnalytics) {
                // Invalidate relevant caches
                await teamAnalyticsRepo.invalidateTeamCache(updatedAnalytics.teamId);
                await teamAnalyticsRepo.invalidateOrganizationCache(updatedAnalytics.organizationId);
                res.json({
                    success: true,
                    data: updatedAnalytics
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    error: 'Team analytics record not found'
                });
            }
        }
        catch (error) {
            console.error('Update team analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update team analytics'
            });
        }
    });
    /**
     * GET /api/teams/:teamId/insights
     * Get AI-generated insights and recommendations for team
     */
    router.get('/:teamId/insights', [
        (0, express_validator_1.param)('teamId').isUUID().withMessage('Valid team ID required')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { teamId } = req.params;
            // Get multiple data sources for insights
            const [seasonStats, advancedStats, lineStats] = await Promise.all([
                teamAnalyticsRepo.getTeamSeasonStats(teamId),
                teamAnalyticsRepo.getAdvancedTeamStats(teamId),
                teamAnalyticsRepo.getLinePerformanceStats(teamId, 'month')
            ]);
            // Generate insights based on the data
            const insights = {
                teamId,
                generatedAt: new Date(),
                performance: {
                    trend: seasonStats.length > 0 ? seasonStats[0].performanceTrend : null,
                    strengths: [],
                    weaknesses: [],
                    recommendations: []
                },
                tactical: {
                    bestLines: lineStats.slice(0, 3),
                    linesNeedingWork: lineStats.slice(-2),
                    suggestedLineChanges: []
                },
                advanced: advancedStats
            };
            // Add specific insights based on data analysis
            if (advancedStats?.advanced?.corsiPercentage > 55) {
                insights.performance.strengths.push('Strong puck possession');
            }
            if (advancedStats?.advanced?.powerPlayPercentage > 20) {
                insights.performance.strengths.push('Excellent power play');
            }
            if (advancedStats?.advanced?.penaltyKillPercentage > 85) {
                insights.performance.strengths.push('Strong penalty kill');
            }
            res.json({
                success: true,
                data: insights
            });
        }
        catch (error) {
            console.error('Team insights error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate team insights'
            });
        }
    });
    return router;
}
exports.createTeamAnalyticsRoutes = createTeamAnalyticsRoutes;
//# sourceMappingURL=teamAnalyticsRoutes.js.map