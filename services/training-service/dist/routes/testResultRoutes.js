"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const testController_1 = require("../controllers/testController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.requireAuth);
// Routes for /api/v1/test-results
router.get('/', testController_1.getTestResults);
router.post('/', testController_1.createTestResultHandler);
router.get('/:id', testController_1.getTestResultById);
router.put('/:id', testController_1.updateTestResultHandler);
router.delete('/:id', testController_1.deleteTestResultHandler);
exports.default = router;
