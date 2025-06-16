// Define the mapping from roles to permissions
// Based on the detailed permission matrix in enhanced-role-permissions.md
// This mapping defines the BASE permissions. Contextual permissions (like specific team access)
// are typically handled during the authorization check itself or potentially added to the token
// if the scope is known at login (like user's own teams). For now, we derive static permissions.

const rolePermissionMap: Record<string, string[]> = {
    admin: [
        '*:*', // Wildcard permission - all access
    ],
    club_admin: [
        'organization:read', 'organization:update',
        'team:*',
        'user:*', // Includes managing users within their org
        'event:*',
        'resource:*',
        'chat:*',
        'subscription:read', 'subscription:update', // Manage org subscription
        'invoice:read',
        'payment-method:*',
        'role:read', // Can see roles
        'language:read',
        'translation:read',
        'metrics:read:usage', // Can see org usage metrics
        'planning:*',
        'medical:*', // Full access within their org
        'training:*', // Full access within their org
        'statistics:*', // Full access within their org
    ],
    coach: [
        'team:read', 'team:update', // Can manage their teams
        'user:read', // Can read user profiles (mainly players in their teams)
        'event:*', // Full event management for their teams
        'training:*', // Full training management for their teams
        'game:*', // Manage games for their teams
        'statistics:read', // Read stats for their teams/players
        'player-goal:*', // Manage player goals for their players
        'team-goal:*', // Manage team goals
        'chat:*', // Full chat access relevant to their teams/players
        'notification:*', // Receive and manage relevant notifications
        'injury:read', 'injury:create', // Can report injuries, view limited info
        'player-status:read', // View player availability
        'test:*', // Manage tests
        'test-result:*', // Manage test results
        'exercise:read', 'exercise:create', // Can use and create exercises
        'planning:read', // View season plans
        'development-plan:*', // Manage development plans for their players
        'role:read',
        'language:read',
        'translation:read',
    ],
    assistant_coach: [ // Inherits from Coach but might have fewer update/delete rights in practice
        // For JWT purposes, grant similar base permissions, enforce stricter checks in service logic if needed
        'team:read', 'team:update',
        'user:read',
        'event:*',
        'training:*',
        'game:*',
        'statistics:read',
        'player-goal:*',
        'team-goal:*',
        'chat:*',
        'notification:*',
        'injury:read', 'injury:create',
        'player-status:read',
        'test:*',
        'test-result:*',
        'exercise:read', 'exercise:create',
        'planning:read',
        'development-plan:*',
        'role:read',
        'language:read',
        'translation:read',
    ],
    fys_coach: [ // Physical Trainer
        'team:read',
        'user:read',
        'event:read', 'event:create', 'event:update', // Can create/manage physical training events
        'training:*', // Full access to training module
        'test:*', // Full access to test module
        'test-result:*',
        'exercise:*', // Full access to exercises
        'chat:*',
        'notification:*',
        'player-status:read',
        'role:read',
        'language:read',
        'translation:read',
    ],
    rehab: [ // Medical Staff
        'team:read',
        'user:read',
        'event:read', 'event:create', 'event:update', // Can create/manage medical appointments
        'injury:*', // Full access to injury module
        'treatment:*', // Full access to treatments
        'treatment-plan:*',
        'player-status:*', // Manage player availability
        'medical-record:*', // Access medical journal info
        'medical-document:*', // Manage medical documents
        'chat:*',
        'notification:*',
        'exercise:read', // Can view exercises for rehab planning
        'role:read',
        'language:read',
        'translation:read',
    ],
    equipment_manager: [
        'team:read',
        'user:read', // Read basic user info
        'event:read', // See schedule
        // Potentially 'inventory:*' if that module existed
        'chat:*',
        'notification:*',
        'role:read',
        'language:read',
        'translation:read',
    ],
    player: [
        'team:read',
        'user:read', 'user:update', // Read own profile, update own profile
        'event:read', // Read own schedule/team events
        'training:read', // Read assigned training
        'test-result:read', // Read own test results
        'injury:read', // Read own injury info
        'player-status:read', // Read own status
        'medical-record:read', // Read own medical info
        'chat:*', // Participate in relevant chats
        'notification:*', // Receive relevant notifications
        'player-goal:read', 'player-goal:create', 'player-goal:update', // Manage own goals
        'statistics:read', // View own stats
        'development-plan:read', // Read own development plan
        'role:read',
        'language:read',
        'translation:read',
    ],
    parent: [
        'user:read', 'user:update', // Read/update own profile
        'team:read', // Read child's team info
        'event:read', // Read child's schedule/team events
        'training:read', // Read child's assigned training
        'test-result:read', // Read child's test results
        'player-status:read', // Read child's availability status
        'chat:*', // Participate in relevant chats (e.g., with coach)
        'notification:*', // Receive relevant notifications
        'statistics:read', // View child's stats
        'role:read',
        'language:read',
        'translation:read',
        // Note: Access to specific child data is contextual, enforced by endpoints
    ]
};

// Function to get all permissions for a set of roles
export const getRolePermissions = (roles: string[]): string[] => {
    const permissions = new Set<string>();

    roles.forEach(role => {
        const rolePerms = rolePermissionMap[role] || [];
        rolePerms.forEach(perm => permissions.add(perm));
    });

    // Handle inheritance (simple example, could be more complex)
    // Assistant Coach inherits Coach permissions (already duplicated above for simplicity)
    // Club Admin has Coach, FysCoach, Rehab, EquipMgr permissions (implicitly included by broad grants)

    // If a user is both Coach and FysCoach, they get the union of permissions.
    // Set automatically handles duplicates.

    return Array.from(permissions);
};

// Function to check if a user with given roles has a specific permission
// This is a basic check, context might be needed for full authorization
export const hasPermission = (userRoles: string[], requiredPermission: string): boolean => {
    const userPermissions = getRolePermissions(userRoles);

    // Check for exact match or wildcard match
    if (userPermissions.includes(requiredPermission) || userPermissions.includes('*:*')) {
        return true;
    }

    // Check for resource-level wildcard (e.g., 'team:*' matches 'team:read')
    const [resource, action] = requiredPermission.split(':');
    if (action && userPermissions.includes(`${resource}:*`)) {
        return true;
    }

    return false;
}; 