import { getRepository } from 'typeorm';
import { User, TeamMember, PlayerParentLink } from '../entities';
import { getRolePermissions } from './permissionService';
import logger from '../config/logger'; // Ensure logger is imported

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
export const canPerformAction = async (
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    resourceOrganizationId?: string
): Promise<boolean> => {
    if (!userId || !action || !resourceType) {
        logger.warn('Authorization check called with missing parameters', { userId, action, resourceType, resourceId });
        return false;
    }

    const userRepository = getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId }, relations: ['roles', 'organization'] });

    if (!user) {
        logger.warn(`Authorization check failed: User not found`, { userId });
        return false;
    }

    const userRoles = user.roles?.map(role => role.name) || [];
    const genericPermission = `${resourceType}:${action}`;
    const resourceWildcard = `${resourceType}:*`;
    const globalWildcard = '*.*';

    // 1. Check static permissions derived from roles
    const staticPermissions = getRolePermissions(userRoles);
    logger.debug('Static permissions', { userId, userRoles, staticPermissions });
    if (staticPermissions.includes(globalWildcard) || userRoles.includes('admin')) {
        logger.debug('Authorization granted: Admin wildcard', { userId });
        return true; // System Admin has access
    }
    if (staticPermissions.includes(resourceWildcard)) {
        logger.debug(`Authorization granted: Resource wildcard`, { userId, resourceType });
        return true; // User has wildcard for this resource type
    }
    if (staticPermissions.includes(genericPermission)) {
         // Check organization context if it's a club_admin
        if (userRoles.includes('club_admin')) {
            if (!user.organization) {
                logger.warn('Club admin user missing organization relation', { userId });
                return false;
            }
            // TODO: Fetch the resource's organization and compare if applicable
            // e.g., if resourceType is 'team', fetch team and check team.organizationId === user.organization.id
            logger.debug('Authorization granted: Generic permission (Club Admin - needs resource org check)', { userId, action, resourceType });
            return true; // Placeholder - Needs Org Check
        } else {
            logger.debug('Authorization granted: Generic permission', { userId, action, resourceType });
            return true; // User has generic permission for this action
        }
    }

    // --- Contextual Checks --- 

    // 2. Ownership (User accessing own data)
    if (resourceType === 'user' && resourceId === userId) {
        // Define permissions a user has on their own profile
        const selfPermissions = ['user:read', 'user:update', 'user:updatePassword']; // Example self-permissions
        if (selfPermissions.includes(genericPermission)) {
            logger.debug(`Authorization granted: User accessing own profile`, { userId, action });
            return true;
        }
    }

    // 3. Team Membership Context (e.g., coach accessing team data)
    if (resourceType === 'team' && resourceId) {
        const teamMemberRepository = getRepository(TeamMember);
        const membership = await teamMemberRepository.findOne({ where: { userId: userId, teamId: resourceId } });
        if (membership) {
            logger.debug(`Authorization check: User is member of target team`, { userId, teamId: resourceId, role: membership.role });
            // Example: Coaches might get specific permissions through membership
            const teamMemberPermissions = getRolePermissions([membership.role]); // Get permissions for the role *within the team*
            if (teamMemberPermissions.includes(genericPermission) || teamMemberPermissions.includes(resourceWildcard)) {
                 logger.debug(`Authorization granted: Team membership role allows action`, { userId, teamId: resourceId, action });
                 return true;
            }
        }
    }
    
    // 4. Accessing data related to a team member (e.g., coach accessing player profile)
    if (resourceType === 'user' && resourceId && resourceId !== userId) {
        const targetUser = await userRepository.findOne({ where: { id: resourceId }, relations: ['teamMemberships'] });
        if (targetUser && targetUser.teamMemberships) {
            const accessorTeamMembers = await getRepository(TeamMember).find({ where: { userId: userId } });
            const commonTeams = targetUser.teamMemberships.filter((targetMember: TeamMember) =>
                accessorTeamMembers.some((accessorMember: TeamMember) => accessorMember.teamId === targetMember.teamId)
            );
            
            if (commonTeams.length > 0) {
                 logger.debug(`Authorization check: User shares a team with target user`, { userId, targetUserId: resourceId });
                 // Check if the user's role in the common team grants permission
                 for (const commonTeamMembership of accessorTeamMembers.filter((am: TeamMember) => commonTeams.some((ct: TeamMember) => ct.teamId === am.teamId))) {
                    const teamRolePermissions = getRolePermissions([commonTeamMembership.role]);
                    // Example: Check if coach role allows reading player data
                    if (teamRolePermissions.includes(genericPermission) || teamRolePermissions.includes(resourceWildcard)) {
                        logger.debug(`Authorization granted: Team role allows accessing member data`, { userId, targetUserId: resourceId, action });
                        return true;
                    }
                 }
            }
        }
    }
    
    // 5. Organization Context (e.g., Club Admin accessing resources in their org)
    if (userRoles.includes('club_admin')) {
        if (!user.organization) {
            logger.warn('Club admin user missing organization relation', { userId });
            return false;
        }
        const userOrgId = user.organization.id;
        let requiresResourceOrgCheck = false; 

        const orgScopedResourceTypes = ['team', 'user', 'team-goal', 'player-goal', 'season', 'development-plan']; 
        if (orgScopedResourceTypes.includes(resourceType) && resourceId) {
            requiresResourceOrgCheck = true;
        }

        if (requiresResourceOrgCheck) {
            logger.debug('Organization context check required', { userId, resourceType, resourceId });

            // Use the provided resourceOrganizationId instead of fetching
            if (!resourceOrganizationId) {
                logger.warn('Authorization check requires resourceOrganizationId, but none was provided by the caller', { userId, resourceType, resourceId });
                return false; // Cannot perform check without the resource's org ID
            }
            
            // Perform the actual check
            if (resourceOrganizationId !== userOrgId) {
                logger.warn('Authorization denied: Resource does not belong to Club Admin\'s organization', { userId, resourceType, resourceId, resourceOrganizationId, userOrgId });
                return false; // Resource is not in the user's organization
            } else {
                 logger.debug(`Authorization granted: Club Admin access within organization`, { userId, action, resourceType, resourceId });
                 // Re-check static permissions to be absolutely sure
                 if (staticPermissions.includes(genericPermission) || staticPermissions.includes(resourceWildcard)) {
                     return true;
                 }
                 logger.warn('Authorization denied: Club Admin role lacks specific permission despite matching organization', { userId, action, resourceType });
                 return false;
            }
        }
    }

    // 6. Parent/Child Context (Parent accessing child data)
    if (userRoles.includes('parent') && resourceType === 'user' && resourceId) {
        const linkRepository = getRepository(PlayerParentLink);
        const link = await linkRepository.findOne({ where: { parentId: userId, childId: resourceId } });
        if (link) {
            logger.debug(`Authorization check: User is parent/guardian of target user`, { userId, childId: resourceId });
            // Define permissions parents have over child data
            const parentPermissions = ['user:read', 'event:read', 'statistics:read']; // Example parent permissions
            if (parentPermissions.includes(genericPermission)) {
                logger.debug(`Authorization granted: Parent accessing child data`, { userId, action });
                return true;
            }
        }
    }

    logger.warn(`Authorization denied: No matching permission found`, { userId, action, resourceType, resourceId, userRoles });
    return false;
};
