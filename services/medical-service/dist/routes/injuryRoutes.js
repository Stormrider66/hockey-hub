"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CachedMedicalService_1 = require("../services/CachedMedicalService");
const CachedInjuryRepository_1 = require("../repositories/CachedInjuryRepository");
const router = (0, express_1.Router)();
const medicalService = new CachedMedicalService_1.CachedMedicalService();
const injuryRepository = new CachedInjuryRepository_1.CachedInjuryRepository();
// TODO: Apply authentication middleware
// router.use(createAuthMiddleware());
// Get all injuries
router.get('/', async (req, res) => {
    try {
        const injuries = await injuryRepository.findAll();
        res.json({
            success: true,
            data: injuries,
            total: injuries.length
        });
    }
    catch (error) {
        console.error('Error fetching injuries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch injuries'
        });
    }
});
// Get active injuries
router.get('/active', async (req, res) => {
    try {
        const injuries = await injuryRepository.findActiveInjuries();
        res.json({
            success: true,
            data: injuries,
            total: injuries.length
        });
    }
    catch (error) {
        console.error('Error fetching active injuries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active injuries'
        });
    }
});
// Get injury by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const injury = await injuryRepository.findById(parseInt(id));
        if (!injury) {
            return res.status(404).json({
                success: false,
                message: 'Injury not found'
            });
        }
        res.json({
            success: true,
            data: injury
        });
    }
    catch (error) {
        console.error('Error fetching injury:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch injury'
        });
    }
});
// Get injuries by player ID
router.get('/player/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const injuries = await injuryRepository.findByPlayerId(parseInt(playerId));
        res.json({
            success: true,
            data: injuries,
            total: injuries.length
        });
    }
    catch (error) {
        console.error('Error fetching player injuries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch player injuries'
        });
    }
});
// Create new injury
router.post('/', async (req, res) => {
    try {
        const injuryData = req.body;
        const injury = await medicalService.createInjury(injuryData);
        res.status(201).json({
            success: true,
            data: injury,
            message: 'Injury created successfully'
        });
    }
    catch (error) {
        console.error('Error creating injury:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to create injury'
        });
    }
});
// Update injury
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const injury = await medicalService.updateInjury(parseInt(id), updates);
        res.json({
            success: true,
            data: injury,
            message: 'Injury updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating injury:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update injury'
        });
    }
});
// Delete injury
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await injuryRepository.delete(parseInt(id));
        res.json({
            success: true,
            message: 'Injury deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting injury:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete injury'
        });
    }
});
// Get injury statistics by body part
router.get('/stats/body-parts', async (req, res) => {
    try {
        const stats = await injuryRepository.countActiveByBodyPart();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching injury statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch injury statistics'
        });
    }
});
exports.default = router;
//# sourceMappingURL=injuryRoutes.js.map