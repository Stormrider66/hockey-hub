"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validateRequest_1 = require("../middleware/validateRequest");
const authenticateToken_1 = require("../middleware/authenticateToken");
const authorize_1 = require("../middleware/authorize");
const teamValidations_1 = require("../validations/teamValidations");
const teamController_1 = require("../controllers/teamController");
const router = (0, express_1.Router)();
// Middleware applied to all /teams routes
router.use(authenticateToken_1.authenticateToken);
// --- Team Routes --- //
// GET /api/v1/teams - List teams
router.get('/', (0, authorize_1.authorize)({ requiredPermissions: ['team:read'] }), (0, validateRequest_1.validateRequest)(teamValidations_1.listTeamsSchema), teamController_1.listTeamsHandler);
// POST /api/v1/teams - Create a new team
router.post('/', (0, authorize_1.authorize)({ requiredPermissions: ['team:create'] }), // Requires permission to create teams
(0, validateRequest_1.validateRequest)(teamValidations_1.createTeamSchema), teamController_1.createTeamHandler);
// GET /api/v1/teams/:teamId - Get team details
router.get('/:teamId', (0, validateRequest_1.validateRequest)(teamValidations_1.getTeamSchema), (0, authorize_1.authorize)({ requiredPermissions: ['team:read'] }), // Basic read permission needed
// Note: Further contextual checks happen in the service/controller if needed
teamController_1.getTeamHandler);
// PUT /api/v1/teams/:teamId - Update team details
router.put('/:teamId', (0, validateRequest_1.validateRequest)(teamValidations_1.updateTeamSchema), (0, authorize_1.authorize)({ requiredPermissions: ['team:update'] }), // Requires update permission
// TODO: Add contextual check - is user admin/club_admin OR coach of THIS team?
teamController_1.updateTeamHandler);
// DELETE /api/v1/teams/:teamId - Delete a team
router.delete('/:teamId', (0, validateRequest_1.validateRequest)(teamValidations_1.getTeamSchema), (0, authorize_1.authorize)({ requiredPermissions: ['team:delete'] }), // Requires delete permission
// TODO: Add contextual check - is user admin/club_admin?
teamController_1.deleteTeamHandler);
// --- Team Member Routes --- //
// GET /api/v1/teams/:teamId/members - Get team members
router.get('/:teamId/members', (0, validateRequest_1.validateRequest)(teamValidations_1.getTeamSchema), (0, authorize_1.authorize)({ requiredPermissions: ['team:read', 'user:read'] }), // Requires reading team and user info
// TODO: Add contextual check - is user member of team OR admin/club_admin?
teamController_1.getTeamMembersHandler);
// POST /api/v1/teams/:teamId/members - Add a member to the team
router.post('/:teamId/members', (0, validateRequest_1.validateRequest)(teamValidations_1.addTeamMemberSchema), (0, authorize_1.authorize)({ requiredPermissions: ['team:update'] }), // Adding members modifies the team
// TODO: Add contextual check - is user admin/club_admin OR coach of THIS team?
teamController_1.addTeamMemberHandler);
// DELETE /api/v1/teams/:teamId/members/:userId - Remove a member from the team
router.delete('/:teamId/members/:userId', (0, validateRequest_1.validateRequest)(teamValidations_1.removeTeamMemberSchema), (0, authorize_1.authorize)({ requiredPermissions: ['team:update'] }), // Removing members modifies the team
// TODO: Add contextual check - is user admin/club_admin OR coach of THIS team?
teamController_1.removeTeamMemberHandler);
exports.default = router;
//# sourceMappingURL=teamRoutes.js.map