"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const testController_1 = require("../controllers/testController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.requireAuth);
// Routes for /api/v1/tests
router.get('/', testController_1.getTestDefinitions);
router.post('/', testController_1.createTestDefinitionHandler);
router.get('/:id', testController_1.getTestDefinitionById);
router.put('/:id', testController_1.updateTestDefinitionHandler);
router.delete('/:id', testController_1.deleteTestDefinitionHandler);
exports.default = router;
