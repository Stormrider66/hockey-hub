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
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeRoleHandler = exports.assignRoleHandler = exports.deleteUserHandler = exports.updateUserHandler = exports.getUserHandler = exports.listUsersHandler = void 0;
const userService_1 = require("../services/userService");
const serviceErrors_1 = require("../errors/serviceErrors");
// --- User Handlers --- //
const listUsersHandler = (
// Use the original DTO for typing the raw query, validation middleware handles transformation
req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userService = new userService_1.UserService();
    try {
        // The query object might still be typed as ParsedQs | undefined by Express,
        // but validateRequest middleware ensures it matches ListUsersInput schema
        // and transforms page/limit. We cast it to our processed type.
        const processedQuery = req.query;
        // TODO: Add authorization check based on organizationId or role
        const organizationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organizationId; // Example extraction
        const options = Object.assign(Object.assign({}, processedQuery), { 
            // Ensure organizationId is applied based on role
            organizationId: ((_b = req.user) === null || _b === void 0 ? void 0 : _b.roles.includes('admin')) ? processedQuery.organizationId : organizationId });
        const { users, total } = yield userService.listUsers(options); // Pass processed options
        res.status(200).json({
            success: true,
            data: users,
            meta: {
                total,
                page: options.page, // Use number from options
                limit: options.limit, // Use number from options
                pages: Math.ceil(total / options.limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.listUsersHandler = listUsersHandler;
const getUserHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userService = new userService_1.UserService();
    try {
        // TODO: Add finer-grained authorization (can user view this specific profile?)
        const user = yield userService.findById(req.params.userId, ['roles', 'teamMemberships', 'teamMemberships.team']);
        // Potentially filter response based on requester's role
        res.status(200).json({ success: true, data: user });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'USER_NOT_FOUND' });
        }
        next(error);
    }
});
exports.getUserHandler = getUserHandler;
const updateUserHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userService = new userService_1.UserService();
    try {
        const requestingUser = req.user;
        const targetUserId = req.params.userId;
        // Authorization: User can update self, Admins can update others (basic check)
        // More specific checks (e.g., club admin within org) might be needed
        if (requestingUser.userId !== targetUserId && !requestingUser.roles.includes('admin') && !requestingUser.roles.includes('club_admin')) {
            throw new serviceErrors_1.AuthorizationError('Cannot update another user\'s profile.');
        }
        // Pass requesting user's info for service-level checks
        const user = yield userService.updateUser(targetUserId, req.body, requestingUser.userId, requestingUser.roles);
        res.status(200).json({ success: true, data: user });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'USER_NOT_FOUND' });
        }
        if (error instanceof serviceErrors_1.AuthorizationError) {
            return res.status(403).json({ error: true, message: error.message, code: error.code });
        }
        next(error);
    }
});
exports.updateUserHandler = updateUserHandler;
const deleteUserHandler = (req, // Uses the same param schema as getUser
res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userService = new userService_1.UserService();
    try {
        const requestingUser = req.user;
        // Authorization handled by the authorize middleware on the route
        yield userService.deleteUser(req.params.userId, requestingUser.userId);
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'USER_NOT_FOUND' });
        }
        next(error); // Pass other errors (like potential auth errors from service) on
    }
});
exports.deleteUserHandler = deleteUserHandler;
// --- Role Management Handlers --- //
const assignRoleHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userService = new userService_1.UserService();
    try {
        const requestingUser = req.user;
        const targetUserId = req.params.userId;
        const roleNameToAssign = req.body.roleName;
        // Fetch target user to check organization
        const targetUser = yield userService.findUserEntityById(targetUserId);
        if (!targetUser) {
            throw new serviceErrors_1.NotFoundError('Target user not found.');
        }
        // Authorization Checks
        const isSystemAdmin = requestingUser.roles.includes('admin');
        const isClubAdmin = requestingUser.roles.includes('club_admin');
        if (isSystemAdmin) {
            // System Admin can assign any role
        }
        else if (isClubAdmin) {
            // Club Admin checks
            if (requestingUser.organizationId !== targetUser.organizationId) {
                throw new serviceErrors_1.AuthorizationError('Club admin can only manage roles within their own organization.');
            }
            if (roleNameToAssign === 'admin') {
                throw new serviceErrors_1.AuthorizationError('Club admin cannot assign the system admin role.');
            }
        }
        else {
            // Other roles cannot assign roles
            throw new serviceErrors_1.AuthorizationError('Insufficient permissions to assign roles.');
        }
        // Authorization passed, proceed with assignment
        const user = yield userService.assignRoleToUser(targetUserId, roleNameToAssign, requestingUser.userId);
        res.status(200).json({ success: true, data: user }); // Return updated user
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError || error instanceof serviceErrors_1.ConflictError) {
            return res.status(error.statusCode).json({
                error: true,
                message: error.message,
                code: error.code
            });
        }
        if (error instanceof serviceErrors_1.AuthorizationError) {
            return res.status(403).json({ error: true, message: error.message, code: error.code });
        }
        next(error); // Pass other errors (like potential auth errors from service) on
    }
});
exports.assignRoleHandler = assignRoleHandler;
const removeRoleHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userService = new userService_1.UserService();
    try {
        const requestingUser = req.user;
        const targetUserId = req.params.userId;
        const roleNameToRemove = req.params.roleName;
        // Fetch target user to check organization
        const targetUser = yield userService.findUserEntityById(targetUserId);
        if (!targetUser) {
            throw new serviceErrors_1.NotFoundError('Target user not found.');
        }
        // Authorization Checks
        const isSystemAdmin = requestingUser.roles.includes('admin');
        const isClubAdmin = requestingUser.roles.includes('club_admin');
        if (isSystemAdmin) {
            // System Admin can remove any role
            if (targetUser.id === requestingUser.userId && roleNameToRemove === 'admin') {
                throw new serviceErrors_1.AuthorizationError('System admin cannot remove their own admin role.');
            }
        }
        else if (isClubAdmin) {
            // Club Admin checks
            if (requestingUser.organizationId !== targetUser.organizationId) {
                throw new serviceErrors_1.AuthorizationError('Club admin can only manage roles within their own organization.');
            }
            if (roleNameToRemove === 'admin') {
                throw new serviceErrors_1.AuthorizationError('Club admin cannot remove the system admin role.');
            }
            // Prevent club admin removing their own club_admin role if they are the target?
            // (Consider adding this check if needed)
        }
        else {
            // Other roles cannot remove roles
            throw new serviceErrors_1.AuthorizationError('Insufficient permissions to remove roles.');
        }
        // Authorization passed, proceed with removal
        const user = yield userService.removeRoleFromUser(targetUserId, roleNameToRemove, requestingUser.userId);
        res.status(200).json({ success: true, data: user }); // Return updated user
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError) {
            return res.status(404).json({
                error: true,
                message: error.message,
                code: 'ROLE_ASSIGNMENT_NOT_FOUND' // More specific code
            });
        }
        if (error instanceof serviceErrors_1.AuthorizationError) {
            return res.status(403).json({ error: true, message: error.message, code: error.code });
        }
        next(error); // Pass other errors (like potential auth errors from service) on
    }
});
exports.removeRoleHandler = removeRoleHandler;
//# sourceMappingURL=userController.js.map