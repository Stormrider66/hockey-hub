"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const physicalCategoryController_1 = require("../controllers/physicalCategoryController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.requireAuth);
// Assuming routes like /api/v1/physical-categories
router.get('/', physicalCategoryController_1.getCategories);
router.post('/', physicalCategoryController_1.createCategoryHandler);
router.get('/:id', physicalCategoryController_1.getCategoryById);
router.put('/:id', physicalCategoryController_1.updateCategoryHandler);
router.delete('/:id', physicalCategoryController_1.deleteCategoryHandler);
exports.default = router;
