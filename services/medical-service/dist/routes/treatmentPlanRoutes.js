"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const treatmentPlanController_1 = require("../controllers/treatmentPlanController");
const router = (0, express_1.Router)();
// Nested routes for treatment plans under an injury
router.get('/injuries/:injuryId/plans', (0, auth_1.authorize)('medical_staff', 'coach', 'admin'), treatmentPlanController_1.getTreatmentPlans);
router.post('/injuries/:injuryId/plans', (0, auth_1.authorize)('medical_staff'), treatmentPlanController_1.addTreatmentPlan);
// Top-level routes for updating and deleting plans
router.put('/plans/:id', (0, auth_1.authorize)('medical_staff', 'admin'), treatmentPlanController_1.updateTreatmentPlanHandler);
router.delete('/plans/:id', (0, auth_1.authorize)('admin'), treatmentPlanController_1.deleteTreatmentPlanHandler);
exports.default = router;
