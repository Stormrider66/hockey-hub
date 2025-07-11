"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SessionTemplateService_1 = require("../services/SessionTemplateService");
const shared_lib_1 = require("@hockey-hub/shared-lib");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
const sessionTemplateService = new SessionTemplateService_1.SessionTemplateService();
// Validation schemas
const createTemplateValidation = [
    (0, express_validator_1.body)('name').isString().trim().notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('description').optional().isString().trim(),
    (0, express_validator_1.body)('category').isString().notEmpty().withMessage('Category is required'),
    (0, express_validator_1.body)('type').isString().notEmpty().withMessage('Type is required'),
    (0, express_validator_1.body)('difficulty').isString().notEmpty().withMessage('Difficulty is required'),
    (0, express_validator_1.body)('visibility').isString().notEmpty().withMessage('Visibility is required'),
    (0, express_validator_1.body)('estimatedDuration').isInt({ min: 1 }).withMessage('Estimated duration must be a positive integer'),
    (0, express_validator_1.body)('exercises').isArray().notEmpty().withMessage('Exercises array is required'),
    (0, express_validator_1.body)('exercises.*.exerciseId').isString().notEmpty(),
    (0, express_validator_1.body)('exercises.*.name').isString().notEmpty(),
    (0, express_validator_1.body)('exercises.*.sets').isInt({ min: 1 }),
    (0, express_validator_1.body)('exercises.*.order').isInt({ min: 0 }),
    (0, express_validator_1.body)('warmup').optional().isObject(),
    (0, express_validator_1.body)('cooldown').optional().isObject(),
    (0, express_validator_1.body)('equipment').optional().isArray(),
    (0, express_validator_1.body)('targetGroups').optional().isObject(),
    (0, express_validator_1.body)('goals').optional().isArray(),
    (0, express_validator_1.body)('tags').optional().isArray(),
];
const updateTemplateValidation = [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid template ID'),
    (0, express_validator_1.body)('name').optional().isString().trim().notEmpty(),
    (0, express_validator_1.body)('description').optional().isString().trim(),
    (0, express_validator_1.body)('category').optional().isString(),
    (0, express_validator_1.body)('type').optional().isString(),
    (0, express_validator_1.body)('difficulty').optional().isString(),
    (0, express_validator_1.body)('visibility').optional().isString(),
    (0, express_validator_1.body)('estimatedDuration').optional().isInt({ min: 1 }),
    (0, express_validator_1.body)('exercises').optional().isArray(),
    (0, express_validator_1.body)('warmup').optional().isObject(),
    (0, express_validator_1.body)('cooldown').optional().isObject(),
    (0, express_validator_1.body)('equipment').optional().isArray(),
    (0, express_validator_1.body)('targetGroups').optional().isObject(),
    (0, express_validator_1.body)('goals').optional().isArray(),
    (0, express_validator_1.body)('tags').optional().isArray(),
];
// Apply authentication to all routes
router.use(shared_lib_1.authenticateUser);
// Get popular templates (must come before :id route)
router.get('/templates/popular', [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
], shared_lib_1.validateRequest, async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const limit = Number(req.query.limit) || 10;
        const templates = await sessionTemplateService.getPopularTemplates(organizationId, limit);
        res.json({ success: true, data: templates });
    }
    catch (error) {
        console.error('Error fetching popular templates:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch popular templates'
        });
    }
});
// Get all session templates with filtering
router.get('/templates', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('category').optional().isString(),
    (0, express_validator_1.query)('type').optional().isString(),
    (0, express_validator_1.query)('difficulty').optional().isString(),
    (0, express_validator_1.query)('visibility').optional().isString(),
    (0, express_validator_1.query)('search').optional().isString().trim(),
    (0, express_validator_1.query)('tags').optional().isArray(),
    (0, express_validator_1.query)('createdBy').optional().isString(),
], shared_lib_1.validateRequest, async (req, res) => {
    try {
        const { page = 1, limit = 20, ...filters } = req.query;
        const userId = req.user?.id;
        const organizationId = req.user?.organizationId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const filter = {
            ...filters,
            organizationId,
            teamId: req.user?.teamId,
        };
        const result = await sessionTemplateService.findAll(filter, userId, Number(page), Number(limit));
        res.json({ success: true, ...result });
    }
    catch (error) {
        console.error('Error fetching session templates:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch session templates'
        });
    }
});
// Get single session template
router.get('/templates/:id', [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid template ID')], shared_lib_1.validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const template = await sessionTemplateService.findById(req.params.id, userId);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.json({ success: true, data: template });
    }
    catch (error) {
        console.error('Error fetching session template:', error);
        if (error.message === 'Access denied to this template') {
            return res.status(403).json({ success: false, error: error.message });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch session template'
        });
    }
});
// Create new session template
router.post('/templates', createTemplateValidation, shared_lib_1.validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        const organizationId = req.user?.organizationId;
        if (!userId || !organizationId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const templateData = {
            ...req.body,
            createdBy: userId,
            organizationId,
            teamId: req.user?.teamId || req.body.teamId,
        };
        const template = await sessionTemplateService.create(templateData);
        res.status(201).json({ success: true, data: template });
    }
    catch (error) {
        console.error('Error creating session template:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create session template'
        });
    }
});
// Update session template
router.put('/templates/:id', updateTemplateValidation, shared_lib_1.validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const template = await sessionTemplateService.update(req.params.id, req.body, userId);
        res.json({ success: true, data: template });
    }
    catch (error) {
        console.error('Error updating session template:', error);
        if (error.message === 'Template not found') {
            return res.status(404).json({ success: false, error: error.message });
        }
        if (error.message === 'Permission denied to edit this template') {
            return res.status(403).json({ success: false, error: error.message });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update session template'
        });
    }
});
// Delete session template
router.delete('/templates/:id', [(0, express_validator_1.param)('id').isUUID().withMessage('Invalid template ID')], shared_lib_1.validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        await sessionTemplateService.delete(req.params.id, userId);
        res.json({ success: true, message: 'Template deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting session template:', error);
        if (error.message === 'Template not found') {
            return res.status(404).json({ success: false, error: error.message });
        }
        if (error.message === 'Permission denied to delete this template') {
            return res.status(403).json({ success: false, error: error.message });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete session template'
        });
    }
});
// Duplicate a template
router.post('/templates/:id/duplicate', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid template ID'),
    (0, express_validator_1.body)('name').isString().trim().notEmpty().withMessage('New name is required'),
], shared_lib_1.validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const template = await sessionTemplateService.duplicateTemplate(req.params.id, userId, req.body.name);
        res.status(201).json({ success: true, data: template });
    }
    catch (error) {
        console.error('Error duplicating session template:', error);
        if (error.message === 'Template not found') {
            return res.status(404).json({ success: false, error: error.message });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to duplicate session template'
        });
    }
});
// Bulk assign template to workouts
router.post('/templates/:id/bulk-assign', [
    (0, express_validator_1.param)('id').isUUID().withMessage('Invalid template ID'),
    (0, express_validator_1.body)('playerIds').isArray().notEmpty().withMessage('Player IDs are required'),
    (0, express_validator_1.body)('playerIds.*').isString(),
    (0, express_validator_1.body)('teamId').isString().notEmpty().withMessage('Team ID is required'),
    (0, express_validator_1.body)('scheduledDates').isArray().notEmpty().withMessage('Scheduled dates are required'),
    (0, express_validator_1.body)('scheduledDates.*').isISO8601().withMessage('Invalid date format'),
], shared_lib_1.validateRequest, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
        const assignmentData = {
            ...req.body,
            userId,
            scheduledDates: req.body.scheduledDates.map((date) => new Date(date)),
        };
        const result = await sessionTemplateService.bulkAssignToWorkouts(req.params.id, assignmentData);
        res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('Error bulk assigning template:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to bulk assign template'
        });
    }
});
exports.default = router;
//# sourceMappingURL=sessionTemplateRoutes.js.map