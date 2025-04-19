import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorize } from '../middleware/authorize';
import {
    createTeamSchema,
    updateTeamSchema,
    addTeamMemberSchema,
    removeTeamMemberSchema,
    getTeamSchema,
} from '../validations/teamValidations';
import {
    createTeamHandler,
    getTeamHandler,
    updateTeamHandler,
    deleteTeamHandler,
    addTeamMemberHandler,
    removeTeamMemberHandler,
    getTeamMembersHandler,
} from '../controllers/teamController';

const router = Router();

// Middleware applied to all /teams routes
router.use(authenticateToken);

// --- Team Routes --- //

// POST /api/v1/teams - Create a new team
router.post(
    '/',
    authorize({ requiredPermissions: ['team:create'] }), // Requires permission to create teams
    validateRequest(createTeamSchema),
    createTeamHandler
);

// GET /api/v1/teams/:teamId - Get team details
router.get(
    '/:teamId',
    validateRequest(getTeamSchema),
    authorize({ requiredPermissions: ['team:read'] }), // Basic read permission needed
    // Note: Further contextual checks happen in the service/controller if needed
    getTeamHandler
);

// PUT /api/v1/teams/:teamId - Update team details
router.put(
    '/:teamId',
    validateRequest(updateTeamSchema),
    authorize({ requiredPermissions: ['team:update'] }), // Requires update permission
    // TODO: Add contextual check - is user admin/club_admin OR coach of THIS team?
    updateTeamHandler
);

// DELETE /api/v1/teams/:teamId - Delete a team
router.delete(
    '/:teamId',
    validateRequest(getTeamSchema),
    authorize({ requiredPermissions: ['team:delete'] }), // Requires delete permission
    // TODO: Add contextual check - is user admin/club_admin?
    deleteTeamHandler
);

// --- Team Member Routes --- //

// GET /api/v1/teams/:teamId/members - Get team members
router.get(
    '/:teamId/members',
    validateRequest(getTeamSchema),
    authorize({ requiredPermissions: ['team:read', 'user:read'] }), // Requires reading team and user info
    // TODO: Add contextual check - is user member of team OR admin/club_admin?
    getTeamMembersHandler
);

// POST /api/v1/teams/:teamId/members - Add a member to the team
router.post(
    '/:teamId/members',
    validateRequest(addTeamMemberSchema),
    authorize({ requiredPermissions: ['team:update'] }), // Adding members modifies the team
    // TODO: Add contextual check - is user admin/club_admin OR coach of THIS team?
    addTeamMemberHandler
);

// DELETE /api/v1/teams/:teamId/members/:userId - Remove a member from the team
router.delete(
    '/:teamId/members/:userId',
    validateRequest(removeTeamMemberSchema),
    authorize({ requiredPermissions: ['team:update'] }), // Removing members modifies the team
     // TODO: Add contextual check - is user admin/club_admin OR coach of THIS team?
    removeTeamMemberHandler
);


export default router; 