"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const playerAvailabilityController_1 = require("../controllers/playerAvailabilityController");
const router = (0, express_1.Router)();
// Player availability status endpoints
router.get('/players/:playerId/availability', (0, auth_1.authorize)('medical_staff', 'coach', 'admin'), playerAvailabilityController_1.getAvailability);
router.post('/players/:playerId/availability', (0, auth_1.authorize)('medical_staff', 'coach', 'admin'), playerAvailabilityController_1.setAvailability);
exports.default = router;
