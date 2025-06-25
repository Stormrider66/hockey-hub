"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const physicalTemplateController_1 = require("../controllers/physicalTemplateController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.requireAuth);
// Assuming routes like /api/v1/physical-templates
router.get('/', (0, authMiddleware_1.requireRole)(['admin', 'club_admin', 'coach', 'fys_coach', 'rehab']), physicalTemplateController_1.getTemplates);
router.post('/', (0, authMiddleware_1.requireRole)(['admin', 'club_admin', 'coach', 'fys_coach']), physicalTemplateController_1.createTemplateHandler);
router.get('/:id', (0, authMiddleware_1.requireRole)(['admin', 'club_admin', 'coach', 'fys_coach', 'rehab']), physicalTemplateController_1.getTemplateById);
router.put('/:id', (0, authMiddleware_1.requireRole)(['admin', 'club_admin', 'coach', 'fys_coach']), physicalTemplateController_1.updateTemplateHandler);
router.delete('/:id', (0, authMiddleware_1.requireRole)(['admin', 'club_admin', 'coach', 'fys_coach']), physicalTemplateController_1.deleteTemplateHandler);
router.post('/:id/copy', (0, authMiddleware_1.requireRole)(['admin', 'club_admin', 'coach', 'fys_coach', 'rehab']), physicalTemplateController_1.copyTemplateHandler); // Route for copying
exports.default = router;
