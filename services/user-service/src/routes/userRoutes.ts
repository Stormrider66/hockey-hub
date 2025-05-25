import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorize } from '../middleware/authorize';
import {
    listUsersSchema,
    getUserSchema,
    updateUserSchema,
    assignRoleSchema,
    removeRoleSchema
} from '../validations/userValidations';
import {
    listUsersHandler,
    getUserHandler,
    updateUserHandler,
    deleteUserHandler,
    assignRoleHandler,
    removeRoleHandler
} from '../controllers/userController';

const router: Router = Router();

// All user routes require authentication
router.use(authenticateToken);

// GET /api/v1/users - List users
router.get(
    '/',
    authorize({ requiredPermissions: ['user:read'] }), // Requires general user read permission
    validateRequest(listUsersSchema), // Validate query params
    listUsersHandler
);

// GET /api/v1/users/:userId - Get specific user
router.get(
    '/:userId',
    validateRequest(getUserSchema),
    authorize({ requiredPermissions: ['user:read'] }), // Requires general user read permission
    // Contextual check (can view THIS user) handled in controller/service
    getUserHandler
);

// PUT /api/v1/users/:userId - Update user profile
router.put(
    '/:userId',
    validateRequest(updateUserSchema),
    authorize({ requiredPermissions: ['user:update'] }), // Requires general update permission
    // Contextual check (can update THIS user - self or admin) handled in controller
    updateUserHandler
);

// DELETE /api/v1/users/:userId - Delete a user
router.delete(
    '/:userId',
    validateRequest(getUserSchema),
    authorize({ requiredPermissions: ['user:delete'] }), // Requires delete permission
    // Contextual check (is admin/club_admin) handled in controller/service
    deleteUserHandler
);

// --- Role Management Routes ---

// POST /api/v1/users/:userId/roles - Assign role to user
router.post(
    '/:userId/roles',
    validateRequest(assignRoleSchema),
    authorize({ requiredPermissions: ['user:manage_roles'] }), // Specific permission for role management
    // Contextual check (admin/club_admin) handled in controller/service
    assignRoleHandler
);

// DELETE /api/v1/users/:userId/roles/:roleName - Remove role from user
router.delete(
    '/:userId/roles/:roleName',
    validateRequest(removeRoleSchema),
    authorize({ requiredPermissions: ['user:manage_roles'] }), // Specific permission for role management
     // Contextual check (admin/club_admin) handled in controller/service
    removeRoleHandler
);


export default router; 