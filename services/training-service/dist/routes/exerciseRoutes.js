"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = require("express");
const exerciseController_1 = require("../controllers/exerciseController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.requireAuth);
router.get('/', exerciseController_1.getExercises);
router.post('/', exerciseController_1.createExerciseHandler);
router.get('/:id', exerciseController_1.getExerciseById);
router.put('/:id', exerciseController_1.updateExerciseHandler);
router.delete('/:id', exerciseController_1.deleteExerciseHandler);
// TODO: Add route for getting exercise categories?
// router.get('/categories', ...);
exports.default = router;
