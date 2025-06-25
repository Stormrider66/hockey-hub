"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const injuryController_1 = require("../controllers/injuryController");
// TODO: Add auth middleware
const router = (0, express_1.Router)();
// Routes for /api/v1/injuries (temporarily without auth for testing)
router.get('/', injuryController_1.getInjuries);
router.post('/', injuryController_1.createInjuryHandler);
router.get('/:id', injuryController_1.getInjuryById);
router.put('/:id', injuryController_1.updateInjuryHandler);
router.delete('/:id', injuryController_1.deleteInjuryHandler);
// Nested routes for injury updates (temporarily without auth for testing)
router.get('/:injuryId/updates', injuryController_1.getInjuryUpdates);
router.post('/:injuryId/updates', injuryController_1.addInjuryUpdate);
// Nested routes for injury treatments
router.get('/:injuryId/treatments', (0, auth_1.authorize)('medical_staff', 'coach', 'admin'), injuryController_1.getInjuryTreatments);
router.post('/:injuryId/treatments', (0, auth_1.authorize)('medical_staff'), injuryController_1.addInjuryTreatment);
exports.default = router;
