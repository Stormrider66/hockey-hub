import { client } from '../lib/httpClient';
import { AxiosError } from 'axios';

// Base URL for the User Service
const USER_SERVICE_BASE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001/api/v1'; 

// --- Refactored Helper for calling the Authorization Check Endpoint ---
async function checkAuthorization(
    userId: string, 
    action: string, 
    resourceType: string, 
    resourceId?: string,
    authToken?: string, // Keep token forwarding
    resourceOrganizationId?: string // ADD: Optional Org ID of the resource itself
): Promise<boolean> {
    const endpoint = '/authorization/check';
    const url = `${USER_SERVICE_BASE_URL}${endpoint}`;
    // Add resourceOrganizationId to params if provided
    const params: Record<string, string> = { userId, action, resourceType };
    if (resourceId) {
        params.resourceId = resourceId;
    }
    if (resourceOrganizationId) {
        params.resourceOrganizationId = resourceOrganizationId;
    }

    try {
        console.log(`[Authz Service] Calling User Service Auth Check: GET ${url} with params:`, params);
        const headers: Record<string, string> = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await client.get<{ authorized: boolean }>(
            url, 
            { 
                params, 
                timeout: 5000, 
                headers 
            }
        );

        if (response.data && typeof response.data.authorized === 'boolean') {
            console.log(`[Authz Service] Auth check result: ${response.data.authorized}`);
            return response.data.authorized;
        } else {
            console.warn(`[Authz Service] User Service Auth Check request to ${url} returned unexpected data:`, response.data);
            return false; 
        }
    } catch (error) {
        // Keep existing detailed error logging
        const axiosError = error as AxiosError;
        if (axiosError.response) {
            const status = axiosError.response.status;
            const data = axiosError.response.data;
            console.error(`[Authz Service] Error calling User Service Auth Check at ${url}: Status=${status}`, data);
            if (status === 401 || status === 403) {
                 console.error(`[Authz Service] Authorization denied by User Service for ${url}`);
            }
        } else if (axiosError.request) {
            console.error(`[Authz Service] No response received from User Service Auth Check at ${url}:`, axiosError.message);
        } else {
            console.error(`[Authz Service] Error setting up request to User Service Auth Check at ${url}:`, axiosError.message);
        }
        return false; // Default to unauthorized on error
    }
}

// --- Remove old data fetching functions (fetchUserTeams, fetchTeamOrganization, etc.) ---
// These are no longer needed as the User Service handles the checks internally.


// --- Refactored Authorization Logic Implementation ---

/**
 * Checks if a user has permission to perform an action on a specific team.
 */
export const checkTeamAccess = async (
    userId: string, 
    teamId: string,
    action: string = 'team:read', 
    authToken?: string,
    teamOrganizationId?: string // ADD: Optional Org ID of the team
): Promise<boolean> => {
    if (!userId || !teamId) return false;
    
    // Pass the team's organization ID if provided
    return await checkAuthorization(userId, action, 'team', teamId, authToken, teamOrganizationId);
};

/**
 * Checks if an accessor user can access data related to a target player.
 */
export const checkPlayerAccess = async (
    accessorUserId: string, 
    targetPlayerId: string,
    action: string = 'user:read', 
    authToken?: string,
    targetPlayerOrganizationId?: string // ADD: Optional Org ID of the player
): Promise<boolean> => {
    if (!accessorUserId || !targetPlayerId) return false;
    // Self access check removed, let User Service handle it based on action
    // if (accessorUserId === targetPlayerId) return true; 
    
    // Pass the target player's organization ID if provided
    return await checkAuthorization(accessorUserId, action, 'user', targetPlayerId, authToken, targetPlayerOrganizationId);
};

// TODO: Consider adding specific check functions for other resources like goals, seasons etc.
// Example:
// export const checkGoalAccess = async (
//     userId: string,
//     goalId: string,
//     action: string,
//     authToken?: string,
//     goalOrganizationId?: string
// ): Promise<boolean> => {
//     if (!userId || !goalId) return false;
//     return await checkAuthorization(userId, action, 'goal', goalId, authToken, goalOrganizationId);
// };
