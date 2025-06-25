"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTeamsHandler = exports.getTeamMembersHandler = exports.removeTeamMemberHandler = exports.addTeamMemberHandler = exports.deleteTeamHandler = exports.updateTeamHandler = exports.getTeamHandler = exports.createTeamHandler = void 0;
const teamService_1 = require("../services/teamService");
const serviceErrors_1 = require("../errors/serviceErrors");
const serviceErrors_2 = require("../errors/serviceErrors");
const logger_1 = __importDefault(require("../config/logger")); // Ensure logger is imported
const createTeamHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const teamService = new teamService_1.TeamService();
    try {
        const user = req.user; // Assumes authenticateToken middleware ran
        const team = yield teamService.createTeam(req.body, user.userId);
        res.status(201).json({ success: true, data: team });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.ConflictError || error instanceof serviceErrors_1.NotFoundError) {
            return res.status(error.statusCode).json({
                error: true,
                message: error.message,
                code: error.code
            });
        }
        next(error);
    }
});
exports.createTeamHandler = createTeamHandler;
const getTeamHandler = (req, // Use GetTeamInput for params
res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const teamService = new teamService_1.TeamService();
    try {
        // Fetch relations like members and organization based on needs
        const team = yield teamService.getTeamById(req.params.teamId, ['organization', 'members', 'members.user']);
        // Await lazy-loaded relations before accessing properties
        const membersData = yield Promise.all(team.members.map((member) => __awaiter(void 0, void 0, void 0, function* () {
            const userData = yield member.user; // Await the user promise
            return {
                userId: userData.id,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: member.role,
                position: member.position,
                jerseyNumber: member.jerseyNumber
            };
        })));
        const organizationData = yield team.organization; // Await the organization promise
        const response = Object.assign(Object.assign({}, team), { organizationName: organizationData === null || organizationData === void 0 ? void 0 : organizationData.name, members: membersData, organization: undefined // Remove the full organization object
         });
        res.status(200).json({ success: true, data: response });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'TEAM_NOT_FOUND' });
        }
        next(error);
    }
});
exports.getTeamHandler = getTeamHandler;
const updateTeamHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const teamService = new teamService_1.TeamService(); // Instantiate inside handler
    try {
        const requestingUser = req.user;
        const targetTeamId = req.params.teamId;
        const updateData = req.body;
        // --- Authorization Check ---
        let isAuthorized = false;
        // 1. Check if Club Admin of the correct organization
        if (requestingUser.roles.includes('club_admin') && requestingUser.organizationId) {
            // Need to fetch the team to check its organization
            const targetTeam = yield teamService.getTeamById(targetTeamId); // Fetch without relations needed here
            if (targetTeam && targetTeam.organizationId === requestingUser.organizationId) {
                isAuthorized = true;
            }
        }
        // 2. Check if Coach/Assistant Coach of THIS team (only if not already authorized as club_admin)
        if (!isAuthorized && (requestingUser.roles.includes('coach') || requestingUser.roles.includes('assistant_coach'))) {
            // Use the existing helper method in TeamService
            const isCoachOfTeam = yield teamService.hasTeamRole(requestingUser.id, targetTeamId, ['coach', 'assistant_coach']);
            if (isCoachOfTeam) {
                isAuthorized = true;
            }
        }
        // 3. Throw error if not authorized by the above checks
        if (!isAuthorized) {
            logger_1.default.warn(`Authorization failed: User ${requestingUser.id} attempted to update team ${targetTeamId} without sufficient permissions.`);
            throw new serviceErrors_2.AuthorizationError('Not authorized to update this team.');
        }
        // --- End Authorization Check ---
        // Proceed with update if authorized
        const updatedTeam = yield teamService.updateTeam(targetTeamId, updateData); // Service method handles actual update
        res.status(200).json({ success: true, data: updatedTeam });
    }
    catch (error) {
        // Catch specific errors first
        if (error instanceof serviceErrors_1.NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'TEAM_NOT_FOUND' });
        }
        if (error instanceof serviceErrors_1.ConflictError) { // e.g., if name conflict during update
            return res.status(409).json({ error: true, message: error.message, code: error.code });
        }
        if (error instanceof serviceErrors_2.AuthorizationError) {
            return res.status(403).json({ error: true, message: error.message, code: error.code || 'FORBIDDEN' });
        }
        // Pass other errors to the general error handler
        next(error);
    }
});
exports.updateTeamHandler = updateTeamHandler;
const deleteTeamHandler = (req, // Use GetTeamInput for params
res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const teamService = new teamService_1.TeamService();
    try {
        const requestingUser = req.user;
        const targetTeamId = req.params.teamId;
        // --- Authorization Check ---
        let isAuthorized = false;
        // Only allow Club Admin of the correct organization
        if (requestingUser.roles.includes('club_admin') && requestingUser.organizationId) {
            // Need to fetch the team to check its organization
            const targetTeam = yield teamService.getTeamById(targetTeamId);
            if (targetTeam && targetTeam.organizationId === requestingUser.organizationId) {
                isAuthorized = true;
            }
        }
        // Throw error if not authorized
        if (!isAuthorized) {
            logger_1.default.warn(`Authorization failed: User ${requestingUser.id} (Role: ${requestingUser.roles.join(',')}) attempted to delete team ${targetTeamId}.`);
            throw new serviceErrors_2.AuthorizationError('Only Club Administrators can delete teams within their organization.');
        }
        // --- End Authorization Check ---
        // Proceed with deletion if authorized
        yield teamService.deleteTeam(targetTeamId);
        res.status(200).json({ success: true, message: 'Team deleted successfully' });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'TEAM_NOT_FOUND' });
        }
        if (error instanceof serviceErrors_2.AuthorizationError) {
            return res.status(403).json({ error: true, message: error.message, code: error.code || 'FORBIDDEN' });
        }
        next(error);
    }
});
exports.deleteTeamHandler = deleteTeamHandler;
const addTeamMemberHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const teamService = new teamService_1.TeamService(); // Instantiate inside handler
    try {
        const requestingUser = req.user;
        const targetTeamId = req.params.teamId;
        const memberData = req.body;
        // --- Authorization Check ---
        let isAuthorized = false;
        // 1. Check if Admin or Club Admin of the team's organization
        if (requestingUser.roles.includes('admin')) {
            isAuthorized = true;
        }
        else if (requestingUser.roles.includes('club_admin') && requestingUser.organizationId) {
            const targetTeam = yield teamService.getTeamById(targetTeamId);
            if (targetTeam && targetTeam.organizationId === requestingUser.organizationId) {
                isAuthorized = true;
            }
        }
        // 2. Check if Coach/Assistant Coach of THIS team (only if not already authorized)
        if (!isAuthorized && (requestingUser.roles.includes('coach') || requestingUser.roles.includes('assistant_coach'))) {
            const isCoachOfTeam = yield teamService.hasTeamRole(requestingUser.id, targetTeamId, ['coach', 'assistant_coach']);
            if (isCoachOfTeam) {
                isAuthorized = true;
            }
        }
        // 3. Throw error if not authorized
        if (!isAuthorized) {
            logger_1.default.warn(`Authorization failed: User ${requestingUser.id} attempted to add member to team ${targetTeamId}.`);
            throw new serviceErrors_2.AuthorizationError('Not authorized to add members to this team.');
        }
        // --- End Authorization Check ---
        // Proceed if authorized
        const member = yield teamService.addMemberToTeam(targetTeamId, memberData);
        res.status(201).json({ success: true, data: member });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError || error instanceof serviceErrors_1.ConflictError) {
            return res.status(error.statusCode).json({
                error: true,
                message: error.message,
                code: error.code
            });
        }
        if (error instanceof serviceErrors_2.AuthorizationError) {
            return res.status(403).json({ error: true, message: error.message, code: error.code || 'FORBIDDEN' });
        }
        next(error);
    }
});
exports.addTeamMemberHandler = addTeamMemberHandler;
const removeTeamMemberHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const teamService = new teamService_1.TeamService(); // Instantiate inside handler
    try {
        const requestingUser = req.user;
        const targetTeamId = req.params.teamId;
        const targetUserId = req.params.userId;
        const targetRole = req.query.role;
        // --- Authorization Check ---
        let isAuthorized = false;
        // Similar logic to adding a member
        if (requestingUser.roles.includes('admin')) {
            isAuthorized = true;
        }
        else if (requestingUser.roles.includes('club_admin') && requestingUser.organizationId) {
            const targetTeam = yield teamService.getTeamById(targetTeamId);
            if (targetTeam && targetTeam.organizationId === requestingUser.organizationId) {
                isAuthorized = true;
            }
        }
        if (!isAuthorized && (requestingUser.roles.includes('coach') || requestingUser.roles.includes('assistant_coach'))) {
            const isCoachOfTeam = yield teamService.hasTeamRole(requestingUser.id, targetTeamId, ['coach', 'assistant_coach']);
            if (isCoachOfTeam) {
                isAuthorized = true;
            }
        }
        // Prevent users from removing themselves? (Optional business rule)
        // if (requestingUser.id === targetUserId) {
        //     isAuthorized = false; // Or throw specific error
        // }
        if (!isAuthorized) {
            logger_1.default.warn(`Authorization failed: User ${requestingUser.id} attempted to remove member ${targetUserId} from team ${targetTeamId}.`);
            throw new serviceErrors_2.AuthorizationError('Not authorized to remove members from this team.');
        }
        // --- End Authorization Check ---
        // Proceed if authorized
        yield teamService.removeMemberFromTeam(targetTeamId, targetUserId, targetRole);
        res.status(200).json({ success: true, message: 'Team member removed successfully' });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'MEMBERSHIP_NOT_FOUND' });
        }
        if (error instanceof serviceErrors_2.AuthorizationError) {
            return res.status(403).json({ error: true, message: error.message, code: error.code || 'FORBIDDEN' });
        }
        next(error);
    }
});
exports.removeTeamMemberHandler = removeTeamMemberHandler;
const getTeamMembersHandler = (req, // Use GetTeamInput for params
res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const teamService = new teamService_1.TeamService();
    try {
        const requestingUser = req.user;
        const targetTeamId = req.params.teamId;
        // --- Authorization Check ---
        let isAuthorized = false;
        // 1. Check if Admin or Club Admin of the team's organization
        if (requestingUser.roles.includes('admin')) {
            isAuthorized = true;
        }
        else if (requestingUser.roles.includes('club_admin') && requestingUser.organizationId) {
            const targetTeam = yield teamService.getTeamById(targetTeamId);
            if (targetTeam && targetTeam.organizationId === requestingUser.organizationId) {
                isAuthorized = true;
            }
        }
        // 2. Check if the user is a member of the team (any role)
        if (!isAuthorized) {
            const isMember = yield teamService.isUserMemberOfTeam(requestingUser.id, targetTeamId);
            if (isMember) {
                isAuthorized = true;
            }
        }
        // 3. Throw error if not authorized
        if (!isAuthorized) {
            logger_1.default.warn(`Authorization failed: User ${requestingUser.id} attempted to view members of team ${targetTeamId}.`);
            throw new serviceErrors_2.AuthorizationError('Not authorized to view members of this team.');
        }
        // --- End Authorization Check ---
        // Proceed if authorized
        const members = yield teamService.getTeamMembers(targetTeamId);
        // Map to basic user info if needed, exclude sensitive data
        const memberResponse = members.map(user => ({
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email, // Consider if email should be exposed here
            // Add role/position if available/needed from TeamMember entity
        }));
        res.status(200).json({ success: true, data: memberResponse });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'TEAM_NOT_FOUND' });
        }
        if (error instanceof serviceErrors_2.AuthorizationError) {
            return res.status(403).json({ error: true, message: error.message, code: error.code || 'FORBIDDEN' });
        }
        next(error);
    }
});
exports.getTeamMembersHandler = getTeamMembersHandler;
// Handler for listing teams
const listTeamsHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const teamService = new teamService_1.TeamService();
    try {
        const user = req.user;
        // Cast to ProcessedListTeamsQuery AFTER validation middleware has run
        const processedQuery = req.query;
        // Apply organization filtering based on user role
        const options = Object.assign(Object.assign({}, processedQuery), { organizationId: user.roles.includes('admin') ? processedQuery.organizationId : user.organizationId });
        // Ensure non-admins MUST have an organizationId context
        if (!options.organizationId && !user.roles.includes('admin')) {
            throw new serviceErrors_2.AuthorizationError('Organization context is required.');
        }
        const { teams, total } = yield teamService.listTeams(options);
        res.status(200).json({
            success: true,
            data: teams,
            meta: {
                total,
                page: options.page,
                limit: options.limit,
                pages: Math.ceil(total / options.limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.listTeamsHandler = listTeamsHandler;
//# sourceMappingURL=teamController.js.map