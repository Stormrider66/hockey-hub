"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkloadRoutes = void 0;
const express_1 = require("express");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const express_validator_1 = require("express-validator");
function createWorkloadRoutes(workloadRepo) {
    const router = (0, express_1.Router)();
    // Apply authentication to all routes
    router.use(shared_lib_1.authMiddleware);
    /**
     * GET /api/workload/players/:playerId/trends
     * Get player workload trends over time
     */
    router.get('/players/:playerId/trends', [
        (0, express_validator_1.param)('playerId').isUUID().withMessage('Valid player ID required'),
        (0, express_validator_1.query)('weeks').optional().isInt({ min: 1, max: 52 }).withMessage('Weeks must be between 1 and 52')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { playerId } = req.params;
            const weeks = req.query.weeks ? parseInt(req.query.weeks) : 8;
            const trends = await workloadRepo.getPlayerWorkloadTrends(playerId, weeks);
            res.json({
                success: true,
                data: trends
            });
        }
        catch (error) {
            console.error('Player workload trends error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch player workload trends'
            });
        }
    });
    /**
     * GET /api/workload/teams/:teamId/summary
     * Get team workload summary for a specific week
     */
    router.get('/teams/:teamId/summary', [
        (0, express_validator_1.param)('teamId').isUUID().withMessage('Valid team ID required'),
        (0, express_validator_1.query)('weekStartDate').optional().isISO8601().withMessage('Week start date must be valid ISO8601 format')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { teamId } = req.params;
            const weekStartDate = req.query.weekStartDate ?
                new Date(req.query.weekStartDate) : undefined;
            const summary = await workloadRepo.getTeamWorkloadSummary(teamId, weekStartDate);
            res.json({
                success: true,
                data: summary
            });
        }
        catch (error) {
            console.error('Team workload summary error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch team workload summary'
            });
        }
    });
    /**
     * GET /api/workload/organizations/:organizationId/high-risk
     * Get players at high injury risk across organization
     */
    router.get('/organizations/:organizationId/high-risk', [
        (0, express_validator_1.param)('organizationId').isUUID().withMessage('Valid organization ID required'),
        (0, express_validator_1.query)('riskThreshold').optional().isFloat({ min: 0, max: 100 })
            .withMessage('Risk threshold must be between 0 and 100')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { organizationId } = req.params;
            const riskThreshold = req.query.riskThreshold ?
                parseFloat(req.query.riskThreshold) : 70;
            const highRiskPlayers = await workloadRepo.getHighRiskPlayers(organizationId, riskThreshold);
            res.json({
                success: true,
                data: highRiskPlayers,
                metadata: {
                    riskThreshold,
                    totalHighRiskPlayers: highRiskPlayers.length,
                    criticalRiskPlayers: highRiskPlayers.filter(p => p.riskLevel === 'critical').length
                }
            });
        }
        catch (error) {
            console.error('High risk players error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch high risk players'
            });
        }
    });
    /**
     * POST /api/workload/compare
     * Compare workload metrics across multiple players
     */
    router.post('/compare', [
        (0, express_validator_1.query)('metric').optional().isIn(['totalWorkload', 'acuteChronicRatio', 'recoveryScore'])
            .withMessage('Metric must be one of: totalWorkload, acuteChronicRatio, recoveryScore')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { playerIds } = req.body;
            const metric = req.query.metric || 'totalWorkload';
            if (!Array.isArray(playerIds) || playerIds.length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'At least 2 player IDs required for comparison'
                });
            }
            if (playerIds.length > 20) {
                return res.status(400).json({
                    success: false,
                    error: 'Maximum 20 players can be compared at once'
                });
            }
            const comparison = await workloadRepo.getWorkloadComparison(playerIds, metric);
            res.json({
                success: true,
                data: comparison
            });
        }
        catch (error) {
            console.error('Workload comparison error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to compare player workloads'
            });
        }
    });
    /**
     * GET /api/workload/teams/:teamId/optimization
     * Get workload optimization suggestions for team
     */
    router.get('/teams/:teamId/optimization', [
        (0, express_validator_1.param)('teamId').isUUID().withMessage('Valid team ID required'),
        (0, express_validator_1.query)('weeks').optional().isInt({ min: 1, max: 12 }).withMessage('Weeks must be between 1 and 12')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { teamId } = req.params;
            const weeks = req.query.weeks ? parseInt(req.query.weeks) : 4;
            const optimization = await workloadRepo.getWorkloadOptimizationSuggestions(teamId, weeks);
            res.json({
                success: true,
                data: optimization
            });
        }
        catch (error) {
            console.error('Workload optimization error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch workload optimization suggestions'
            });
        }
    });
    /**
     * POST /api/workload/players/:playerId/analytics
     * Create or update player workload analytics
     */
    router.post('/players/:playerId/analytics', [
        (0, express_validator_1.param)('playerId').isUUID().withMessage('Valid player ID required')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { playerId } = req.params;
            const workloadData = req.body;
            const newWorkload = await workloadRepo.create({
                ...workloadData,
                playerId
            });
            // Invalidate relevant caches
            await workloadRepo.invalidatePlayerWorkload(playerId);
            res.status(201).json({
                success: true,
                data: newWorkload
            });
        }
        catch (error) {
            console.error('Create workload analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create workload analytics'
            });
        }
    });
    /**
     * PUT /api/workload/analytics/:analyticsId
     * Update specific workload analytics record
     */
    router.put('/analytics/:analyticsId', [
        (0, express_validator_1.param)('analyticsId').isUUID().withMessage('Valid analytics ID required')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { analyticsId } = req.params;
            const updateData = req.body;
            const updatedWorkload = await workloadRepo.update(analyticsId, updateData);
            if (updatedWorkload) {
                // Invalidate relevant caches
                await workloadRepo.invalidatePlayerWorkload(updatedWorkload.playerId);
                await workloadRepo.invalidateTeamWorkload(updatedWorkload.teamId);
                res.json({
                    success: true,
                    data: updatedWorkload
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    error: 'Workload analytics record not found'
                });
            }
        }
        catch (error) {
            console.error('Update workload analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update workload analytics'
            });
        }
    });
    /**
     * GET /api/workload/alerts
     * Get real-time workload alerts and notifications
     */
    router.get('/alerts', [
        (0, express_validator_1.query)('organizationId').isUUID().withMessage('Valid organization ID required'),
        (0, express_validator_1.query)('severity').optional().isIn(['low', 'medium', 'high', 'critical'])
            .withMessage('Severity must be one of: low, medium, high, critical')
    ], shared_lib_1.validateRequest, async (req, res) => {
        try {
            const { organizationId, severity } = req.query;
            // Get high-risk players as basis for alerts
            const highRiskPlayers = await workloadRepo.getHighRiskPlayers(organizationId, severity === 'critical' ? 90 : severity === 'high' ? 75 : 60);
            // Transform into alert format
            const alerts = highRiskPlayers.map(player => ({
                id: `workload-${player.playerId}-${Date.now()}`,
                type: 'workload_risk',
                severity: player.riskLevel,
                playerId: player.playerId,
                teamId: player.teamId,
                message: `Player at ${player.riskLevel} injury risk (${player.riskScore}%)`,
                recommendations: player.recommendations,
                urgency: player.riskLevel === 'critical' ? 'immediate' :
                    player.riskLevel === 'high' ? 'urgent' : 'normal',
                createdAt: new Date()
            }));
            res.json({
                success: true,
                data: alerts,
                metadata: {
                    totalAlerts: alerts.length,
                    severityFilter: severity,
                    organizationId
                }
            });
        }
        catch (error) {
            console.error('Workload alerts error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch workload alerts'
            });
        }
    });
    return router;
}
exports.createWorkloadRoutes = createWorkloadRoutes;
//# sourceMappingURL=workloadRoutes.js.map