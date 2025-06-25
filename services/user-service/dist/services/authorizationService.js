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
exports.canPerformAction = void 0;
const typeorm_1 = require("typeorm");
const entities_1 = require("../entities");
const permissionService_1 = require("./permissionService");
const logger_1 = __importDefault(require("../config/logger")); // Ensure logger is imported
/**
 * Checks if a user has permission to perform an action on a resource.
 * This service centralizes authorization logic.
 *
 * @param userId The ID of the user attempting the action.
 * @param action The action being performed (e.g., 'read', 'update', 'delete').
 * @param resourceType The type of resource being accessed (e.g., 'team', 'user', 'event').
 * @param resourceId Optional ID of the specific resource being accessed.
 * @param resourceOrganizationId Optional ID of the organization the resource belongs to (provided by caller).
 * @returns Promise<boolean> True if authorized, false otherwise.
 */
const canPerformAction = (userId, action, resourceType, resourceId, resourceOrganizationId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!userId || !action || !resourceType) {
        logger_1.default.warn('Authorization check called with missing parameters', { userId, action, resourceType, resourceId });
        return false;
    }
    const userRepository = (0, typeorm_1.getRepository)(entities_1.User);
    const user = yield userRepository.findOne({ where: { id: userId }, relations: ['roles', 'organization'] });
    if (!user) {
        logger_1.default.warn(`Authorization check failed: User not found`, { userId });
        return false;
    }
    const userRoles = ((_a = user.roles) === null || _a === void 0 ? void 0 : _a.map(role => role.name)) || [];
    const genericPermission = `${resourceType}:${action}`;
    const resourceWildcard = `${resourceType}:*`;
    const globalWildcard = '*.*';
    // 1. Check static permissions derived from roles
    const staticPermissions = (0, permissionService_1.getRolePermissions)(userRoles);
    logger_1.default.debug('Static permissions', { userId, userRoles, staticPermissions });
    if (staticPermissions.includes(globalWildcard) || userRoles.includes('admin')) {
        logger_1.default.debug('Authorization granted: Admin wildcard', { userId });
        return true; // System Admin has access
    }
    if (staticPermissions.includes(resourceWildcard)) {
        logger_1.default.debug(`Authorization granted: Resource wildcard`, { userId, resourceType });
        return true; // User has wildcard for this resource type
    }
    if (staticPermissions.includes(genericPermission)) {
        // Check organization context if it's a club_admin
        if (userRoles.includes('club_admin')) {
            if (!user.organization) {
                logger_1.default.warn('Club admin user missing organization relation', { userId });
                return false;
            }
            const clubOrg = yield user.organization;
            if (!clubOrg) {
                logger_1.default.warn('Club admin user missing organization after await', { userId });
                return false;
            }
            // TODO: Fetch the resource's organization and compare if applicable
            // e.g., if resourceType is 'team', fetch team and check team.organizationId === user.organization.id
            logger_1.default.debug('Authorization granted: Generic permission (Club Admin - needs resource org check)', { userId, action, resourceType });
            return true; // Placeholder - Needs Org Check
        }
        else {
            logger_1.default.debug('Authorization granted: Generic permission', { userId, action, resourceType });
            return true; // User has generic permission for this action
        }
    }
    // --- Contextual Checks --- 
    // 2. Ownership (User accessing own data)
    if (resourceType === 'user' && resourceId === userId) {
        // Define permissions a user has on their own profile
        const selfPermissions = ['user:read', 'user:update', 'user:updatePassword']; // Example self-permissions
        if (selfPermissions.includes(genericPermission)) {
            logger_1.default.debug(`Authorization granted: User accessing own profile`, { userId, action });
            return true;
        }
    }
    // 3. Team Membership Context (e.g., coach accessing team data)
    if (resourceType === 'team' && resourceId) {
        const teamMemberRepository = (0, typeorm_1.getRepository)(entities_1.TeamMember);
        const membership = yield teamMemberRepository.findOne({ where: { userId: userId, teamId: resourceId } });
        if (membership) {
            logger_1.default.debug(`Authorization check: User is member of target team`, { userId, teamId: resourceId, role: membership.role });
            // Example: Coaches might get specific permissions through membership
            const teamMemberPermissions = (0, permissionService_1.getRolePermissions)([membership.role]); // Get permissions for the role *within the team*
            if (teamMemberPermissions.includes(genericPermission) || teamMemberPermissions.includes(resourceWildcard)) {
                logger_1.default.debug(`Authorization granted: Team membership role allows action`, { userId, teamId: resourceId, action });
                return true;
            }
        }
    }
    // 4. Accessing data related to a team member (e.g., coach accessing player profile)
    if (resourceType === 'user' && resourceId && resourceId !== userId) {
        const targetUser = yield userRepository.findOne({ where: { id: resourceId }, relations: ['teamMemberships'] });
        if (targetUser && targetUser.teamMemberships) {
            const accessorTeamMembers = yield (0, typeorm_1.getRepository)(entities_1.TeamMember).find({ where: { userId: userId } });
            const commonTeams = targetUser.teamMemberships.filter((targetMember) => accessorTeamMembers.some((accessorMember) => accessorMember.teamId === targetMember.teamId));
            if (commonTeams.length > 0) {
                logger_1.default.debug(`Authorization check: User shares a team with target user`, { userId, targetUserId: resourceId });
                // Check if the user's role in the common team grants permission
                for (const commonTeamMembership of accessorTeamMembers.filter((am) => commonTeams.some((ct) => ct.teamId === am.teamId))) {
                    const teamRolePermissions = (0, permissionService_1.getRolePermissions)([commonTeamMembership.role]);
                    // Example: Check if coach role allows reading player data
                    if (teamRolePermissions.includes(genericPermission) || teamRolePermissions.includes(resourceWildcard)) {
                        logger_1.default.debug(`Authorization granted: Team role allows accessing member data`, { userId, targetUserId: resourceId, action });
                        return true;
                    }
                }
            }
        }
    }
    // 5. Organization Context (e.g., Club Admin accessing resources in their org)
    if (userRoles.includes('club_admin')) {
        const org = yield user.organization; // organization is a lazy Promise relation
        const userOrgId = org === null || org === void 0 ? void 0 : org.id;
        if (!userOrgId) {
            logger_1.default.warn('Club admin user has no organization loaded', { userId });
            return false;
        }
        let requiresResourceOrgCheck = false;
        const orgScopedResourceTypes = ['team', 'user', 'team-goal', 'player-goal', 'season', 'development-plan'];
        if (orgScopedResourceTypes.includes(resourceType) && resourceId) {
            requiresResourceOrgCheck = true;
        }
        if (requiresResourceOrgCheck) {
            logger_1.default.debug('Organization context check required', { userId, resourceType, resourceId });
            // Use the provided resourceOrganizationId instead of fetching
            if (!resourceOrganizationId) {
                logger_1.default.warn('Authorization check requires resourceOrganizationId, but none was provided by the caller', { userId, resourceType, resourceId });
                return false; // Cannot perform check without the resource's org ID
            }
            // Perform the actual check
            if (resourceOrganizationId !== userOrgId) {
                logger_1.default.warn('Authorization denied: Resource does not belong to Club Admin\'s organization', { userId, resourceType, resourceId, resourceOrganizationId, userOrgId });
                return false; // Resource is not in the user's organization
            }
            else {
                logger_1.default.debug(`Authorization granted: Club Admin access within organization`, { userId, action, resourceType, resourceId });
                // Re-check static permissions to be absolutely sure
                if (staticPermissions.includes(genericPermission) || staticPermissions.includes(resourceWildcard)) {
                    return true;
                }
                logger_1.default.warn('Authorization denied: Club Admin role lacks specific permission despite matching organization', { userId, action, resourceType });
                return false;
            }
        }
    }
    // 6. Parent/Child Context (Parent accessing child data)
    if (userRoles.includes('parent') && resourceType === 'user' && resourceId) {
        const linkRepository = (0, typeorm_1.getRepository)(entities_1.PlayerParentLink);
        const link = yield linkRepository.findOne({ where: { parentId: userId, childId: resourceId } });
        if (link) {
            logger_1.default.debug(`Authorization check: User is parent/guardian of target user`, { userId, childId: resourceId });
            // Define permissions parents have over child data
            const parentPermissions = ['user:read', 'event:read', 'statistics:read']; // Example parent permissions
            if (parentPermissions.includes(genericPermission)) {
                logger_1.default.debug(`Authorization granted: Parent accessing child data`, { userId, action });
                return true;
            }
        }
    }
    logger_1.default.warn(`Authorization denied: No matching permission found`, { userId, action, resourceType, resourceId, userRoles });
    return false;
});
exports.canPerformAction = canPerformAction;
//# sourceMappingURL=authorizationService.js.map