"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const treatmentPlanItemController_1 = require("../controllers/treatmentPlanItemController");
const router = (0, express_1.Router)();
// Nested routes for treatment plan items under a plan
router.get('/plans/:planId/items', (0, auth_1.authorize)('medical_staff', 'coach', 'admin'), treatmentPlanItemController_1.getTreatmentPlanItems);
router.post('/plans/:planId/items', (0, auth_1.authorize)('medical_staff'), treatmentPlanItemController_1.addTreatmentPlanItem);
// Top-level routes for updating and deleting items
router.put('/items/:id', (0, auth_1.authorize)('medical_staff'), treatmentPlanItemController_1.updateTreatmentPlanItemHandler);
router.delete('/items/:id', (0, auth_1.authorize)('medical_staff', 'admin'), treatmentPlanItemController_1.deleteTreatmentPlanItemHandler);
exports.default = router;
