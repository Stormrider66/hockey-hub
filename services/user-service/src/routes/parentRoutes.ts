import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorize } from '../middleware/authorize';
import {
    addParentLinkSchema,
    removeParentLinkSchema,
    getRelatedUsersSchema
} from '../validations/parentValidations';
import {
    addParentLinkHandler,
    removeParentLinkHandler,
    getChildrenHandler,
    getParentsHandler
} from '../controllers/parentController';

const router = Router();

// All parent-child routes require authentication
router.use(authenticateToken);

// POST /api/v1/parent-child - Create a new parent-child link
router.post(
    '/', // Route for creating links
    authorize({ allowedRoles: ['admin', 'club_admin'] }), // Only admins can create links
    validateRequest(addParentLinkSchema),
    addParentLinkHandler
);

// DELETE /api/v1/parent-child/:linkId - Remove a parent-child link
router.delete(
    '/:linkId', // Route for removing links by ID
    authorize({ allowedRoles: ['admin', 'club_admin'] }), // Only admins can remove links
    validateRequest(removeParentLinkSchema),
    removeParentLinkHandler
);

// GET /api/v1/users/:userId/children - Get children for a parent user
router.get(
    '/users/:userId/children', // Mounted under /users for context
    validateRequest(getRelatedUsersSchema),
    // Authorization is handled within the controller for context (checking if user is self or admin)
    getChildrenHandler
);

// GET /api/v1/users/:userId/parents - Get parents for a child user
router.get(
    '/users/:userId/parents', // Mounted under /users for context
    validateRequest(getRelatedUsersSchema),
    // Authorization is handled within the controller for context (checking user role/relationship)
    getParentsHandler
);


export default router; 