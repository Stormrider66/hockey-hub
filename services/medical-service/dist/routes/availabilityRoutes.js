"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CachedPlayerAvailabilityRepository_1 = require("../repositories/CachedPlayerAvailabilityRepository");
const router = (0, express_1.Router)();
const availabilityRepository = new CachedPlayerAvailabilityRepository_1.CachedPlayerAvailabilityRepository();
// TODO: Apply authentication middleware
// router.use(createAuthMiddleware());
// Get all player availability
router.get('/', async (req, res) => {
    try {
        const availability = await availabilityRepository.findAll();
        res.json({
            success: true,
            data: availability,
            total: availability.length
        });
    }
    catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch player availability'
        });
    }
});
// Get availability for specific player
router.get('/players/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const availability = await availabilityRepository.findByPlayerId(parseInt(playerId));
        res.json({
            success: true,
            data: availability,
            total: availability.length
        });
    }
    catch (error) {
        console.error('Error fetching player availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch player availability'
        });
    }
});
// Get current availability for specific player
router.get('/players/:playerId/current', async (req, res) => {
    try {
        const { playerId } = req.params;
        const availability = await availabilityRepository.findCurrentByPlayerId(parseInt(playerId));
        res.json({
            success: true,
            data: availability
        });
    }
    catch (error) {
        console.error('Error fetching current player availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch current player availability'
        });
    }
});
// Update player availability
router.post('/players/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const availabilityData = {
            ...req.body,
            playerId: parseInt(playerId)
        };
        const availability = await availabilityRepository.save(availabilityData);
        res.status(201).json({
            success: true,
            data: availability,
            message: 'Player availability updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating player availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update player availability'
        });
    }
});
// Get team availability summary
router.get('/team/summary', async (req, res) => {
    try {
        const summary = await availabilityRepository.getTeamAvailabilitySummary();
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('Error fetching team availability summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch team availability summary'
        });
    }
});
exports.default = router;
//# sourceMappingURL=availabilityRoutes.js.map