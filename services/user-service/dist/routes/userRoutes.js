"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validateRequest_1 = require("../middleware/validateRequest");
const authenticateToken_1 = require("../middleware/authenticateToken");
const authorize_1 = require("../middleware/authorize");
const userValidations_1 = require("../validations/userValidations");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
// All user routes require authentication
router.use(authenticateToken_1.authenticateToken);
// GET /api/v1/users - List users
router.get('/', (0, authorize_1.authorize)({ requiredPermissions: ['user:read'] }), // Requires general user read permission
(0, validateRequest_1.validateRequest)(userValidations_1.listUsersSchema), // Validate query params
userController_1.listUsersHandler);
// GET /api/v1/users/:userId - Get specific user
router.get('/:userId', (0, validateRequest_1.validateRequest)(userValidations_1.getUserSchema), (0, authorize_1.authorize)({ requiredPermissions: ['user:read'] }), // Requires general user read permission
// Contextual check (can view THIS user) handled in controller/service
userController_1.getUserHandler);
// PUT /api/v1/users/:userId - Update user profile
router.put('/:userId', (0, validateRequest_1.validateRequest)(userValidations_1.updateUserSchema), (0, authorize_1.authorize)({ requiredPermissions: ['user:update'] }), // Requires general update permission
// Contextual check (can update THIS user - self or admin) handled in controller
userController_1.updateUserHandler);
// DELETE /api/v1/users/:userId - Delete a user
router.delete('/:userId', (0, validateRequest_1.validateRequest)(userValidations_1.getUserSchema), (0, authorize_1.authorize)({ requiredPermissions: ['user:delete'] }), // Requires delete permission
// Contextual check (is admin/club_admin) handled in controller/service
userController_1.deleteUserHandler);
// --- Role Management Routes ---
// POST /api/v1/users/:userId/roles - Assign role to user
router.post('/:userId/roles', (0, validateRequest_1.validateRequest)(userValidations_1.assignRoleSchema), (0, authorize_1.authorize)({ requiredPermissions: ['user:manage_roles'] }), // Specific permission for role management
// Contextual check (admin/club_admin) handled in controller/service
userController_1.assignRoleHandler);
// DELETE /api/v1/users/:userId/roles/:roleName - Remove role from user
router.delete('/:userId/roles/:roleName', (0, validateRequest_1.validateRequest)(userValidations_1.removeRoleSchema), (0, authorize_1.authorize)({ requiredPermissions: ['user:manage_roles'] }), // Specific permission for role management
// Contextual check (admin/club_admin) handled in controller/service
userController_1.removeRoleHandler);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map