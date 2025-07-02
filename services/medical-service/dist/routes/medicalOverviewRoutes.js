"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CachedMedicalService_1 = require("../services/CachedMedicalService");
const router = (0, express_1.Router)();
const medicalService = new CachedMedicalService_1.CachedMedicalService();
// TODO: Apply authentication middleware
// router.use(createAuthMiddleware());
// Get player medical overview
router.get('/players/:playerId/overview', async (req, res) => {
    try {
        const { playerId } = req.params;
        const overview = await medicalService.getPlayerMedicalOverview(parseInt(playerId));
        res.json({
            success: true,
            data: overview
        });
    }
    catch (error) {
        console.error('Error fetching player medical overview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch player medical overview'
        });
    }
});
// Get team medical statistics
router.get('/team/stats', async (req, res) => {
    try {
        const stats = await medicalService.getTeamMedicalStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching team medical stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch team medical statistics'
        });
    }
});
exports.default = router;
//# sourceMappingURL=medicalOverviewRoutes.js.map