"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const testAnalyticsController_1 = require("../controllers/testAnalyticsController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.requireAuth);
// Endpoint for Pearson correlation analytics
router.get('/correlation', testAnalyticsController_1.getCorrelation);
// Endpoint for multi-linear regression analytics
router.post('/regression', testAnalyticsController_1.postRegression);
// TODO: Add regression analytics endpoint (e.g., POST /regression)
exports.default = router;
