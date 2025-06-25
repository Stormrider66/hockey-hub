"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const injuryController_1 = require("../controllers/injuryController");
const router = (0, express_1.Router)();
// Routes for /api/v1/treatments
router.put('/:id', (0, auth_1.authorize)('medical_staff'), injuryController_1.updateTreatmentHandler);
router.delete('/:id', (0, auth_1.authorize)('medical_staff', 'admin'), injuryController_1.deleteTreatmentHandler);
exports.default = router;
