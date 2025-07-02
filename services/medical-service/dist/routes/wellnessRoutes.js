"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CachedMedicalService_1 = require("../services/CachedMedicalService");
const CachedWellnessRepository_1 = require("../repositories/CachedWellnessRepository");
const router = (0, express_1.Router)();
const medicalService = new CachedMedicalService_1.CachedMedicalService();
const wellnessRepository = new CachedWellnessRepository_1.CachedWellnessRepository();
// TODO: Apply authentication middleware
// router.use(createAuthMiddleware());
// Submit wellness entry
router.post('/players/:playerId/wellness', async (req, res) => {
    try {
        const { playerId } = req.params;
        const wellnessData = {
            ...req.body,
            playerId: parseInt(playerId)
        };
        const entry = await medicalService.submitWellnessEntry(wellnessData);
        res.status(201).json({
            success: true,
            message: 'Wellness data submitted successfully',
            data: entry
        });
    }
    catch (error) {
        console.error('Error submitting wellness:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to submit wellness data'
        });
    }
});
// Get wellness history for a player
router.get('/players/:playerId/wellness', async (req, res) => {
    try {
        const { playerId } = req.params;
        const { limit } = req.query;
        const wellness = await wellnessRepository.findByPlayerId(parseInt(playerId), limit ? parseInt(limit) : 30);
        res.json({
            success: true,
            data: wellness,
            total: wellness.length
        });
    }
    catch (error) {
        console.error('Error fetching wellness:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wellness data'
        });
    }
});
// Get latest wellness entry for a player
router.get('/players/:playerId/wellness/latest', async (req, res) => {
    try {
        const { playerId } = req.params;
        const wellness = await wellnessRepository.findLatestByPlayerId(parseInt(playerId));
        res.json({
            success: true,
            data: wellness
        });
    }
    catch (error) {
        console.error('Error fetching latest wellness:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch latest wellness data'
        });
    }
});
// Get wellness data for date range
router.get('/players/:playerId/wellness/range', async (req, res) => {
    try {
        const { playerId } = req.params;
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        const wellness = await wellnessRepository.findByPlayerIdAndDateRange(parseInt(playerId), new Date(startDate), new Date(endDate));
        res.json({
            success: true,
            data: wellness,
            total: wellness.length
        });
    }
    catch (error) {
        console.error('Error fetching wellness range:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wellness data for date range'
        });
    }
});
// Get team wellness summary
router.get('/team/wellness/summary', async (req, res) => {
    try {
        const summary = await wellnessRepository.getTeamWellnessSummary();
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('Error fetching team wellness summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch team wellness summary'
        });
    }
});
exports.default = router;
//# sourceMappingURL=wellnessRoutes.js.map