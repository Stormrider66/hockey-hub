"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validate_middleware_1 = require("../middleware/validate.middleware");
const authValidations_1 = require("../validations/authValidations");
/**
 * Authentication routes handler
 * Defines validation for authentication operations using Zod schemas
 *
 * TODO: This implementation uses Zod for validation instead of express-validator
 * to avoid TypeScript type conflicts with express-validator. A more permanent fix
 * would be to address the ts-node version conflict (needs ^10.7.0 for typeorm, but
 * other dependencies require ^9.1.1).
 */
const router = (0, express_1.Router)();
// /register endpoint with Zod validation
router.post('/register', (0, validate_middleware_1.validateRequest)(authValidations_1.registerSchema), authController_1.registerHandler);
// /login endpoint with Zod validation
router.post('/login', (0, validate_middleware_1.validateRequest)(authValidations_1.loginSchema), authController_1.loginHandler);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map