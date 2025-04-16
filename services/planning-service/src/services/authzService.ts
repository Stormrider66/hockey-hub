import axios, { AxiosError } from 'axios';

// Base URL for the User Service (adjust if necessary, e.g., from env vars)
const USER_SERVICE_BASE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001/api/v1'; 

// --- Helper for making API calls (with refined error handling) ---

async function makeUserServiceRequest<T>(endpoint: string): Promise<T | null> {
    const url = `${USER_SERVICE_BASE_URL}${endpoint}`;
    try {
        console.log(`[Authz Service] Calling User Service: GET ${url}`);
        // TODO: Implement proper authentication if needed for service-to-service calls (e.g., service token)
        const response = await axios.get<{ success: boolean; data: T }>(url, {
            timeout: 5000 // Add a timeout
        });
        // Check for successful response and presence of data
        if (response.data && response.data.success && response.data.data !== undefined) {
            return response.data.data;
        } else {
            // Log cases where the request succeeded but the expected data format wasn't returned
            console.warn(`[Authz Service] User Service request to ${url} returned success=${response.data?.success} but data was unexpected:`, response.data);
            return null;
        }
    } catch (error) {
        const axiosError = error as AxiosError;
        // Log detailed error information
        if (axiosError.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const status = axiosError.response.status;
            const data = axiosError.response.data;
            console.error(`[Authz Service] Error calling User Service at ${url}: Status=${status}`, data);
            // Specific handling based on status? e.g., 404 might be common and less severe than 500
            if (status === 404) {
                console.warn(`[Authz Service] User Service returned 404 Not Found for ${url}`);
            } else {
                // Log other non-2xx errors more severely
                console.error(`[Authz Service] User Service request failed with status ${status} for ${url}`);
            }
        } else if (axiosError.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of http.ClientRequest in node.js
            console.error(`[Authz Service] No response received from User Service at ${url}:`, axiosError.message);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error(`[Authz Service] Error setting up request to User Service at ${url}:`, axiosError.message);
        }
        // Return null to indicate failure to get necessary authorization data
        return null; 
    }
}

// --- Actual API Calls Definitions ---

// Expected response structure from User Service GET /users/:id/teams
// Adjust based on actual User Service API contract
interface UserTeamMembership {
    id: string; // Team ID
    role: string; // User's role in that team
    name?: string; // Optional team name
}

// Expected response structure from User Service GET /teams/:id
interface TeamDetails {
    id: string;
    name: string;
    organizationId: string;
    // ... other team fields
}

// Expected response structure from User Service GET /users/:id
interface UserDetails {
    id: string;
    email: string;
    organizationId?: string; // User might not belong to an org directly
    // ... other user fields
}

// Expected response structure from User Service GET /users/:id/children
interface ChildLink {
    linkId: string;
    childId: string;
    // ... other link fields
}

async function fetchUserTeams(userId: string): Promise<UserTeamMembership[]> {
    // Adapt the expected type <T> based on the actual structure returned by User Service
    // Assuming the endpoint returns { success: true, data: UserTeamMembership[] }
    const teams = await makeUserServiceRequest<UserTeamMembership[]>(`/users/${userId}/teams`);
    return teams || [];
}

async function fetchTeamOrganization(teamId: string): Promise<string | null> {
    // Assuming endpoint returns { success: true, data: { organizationId: string, ... } }
    const teamDetails = await makeUserServiceRequest<TeamDetails>(`/teams/${teamId}`);
    return teamDetails?.organizationId || null;
}

async function fetchUserOrganization(userId: string): Promise<string | null> {
    // Assuming endpoint returns { success: true, data: { organizationId?: string, ... } }
    const userDetails = await makeUserServiceRequest<UserDetails>(`/users/${userId}`);
    return userDetails?.organizationId || null;
}

async function fetchChildLinks(parentId: string): Promise<string[]> {
     // Assuming endpoint returns { success: true, data: [{ childId: string }, ...] }
     const childrenResponse = await makeUserServiceRequest<ChildLink[]>(`/users/${parentId}/children`);
    return childrenResponse ? childrenResponse.map(c => c.childId) : [];
}

// --- Authorization Logic Implementation (using actual API calls) ---

/**
 * Checks if a user is an admin, club admin, or coach with access to a specific team.
 */
export const checkTeamAccess = async (userId: string, userRoles: string[], userOrgId: string | undefined, teamId: string): Promise<boolean> => {
    if (!userId || !teamId) return false;
    if (userRoles.includes('admin')) return true; // Admin has global access
    
    // Check Club Admin access by comparing user's org with team's org
    if (userRoles.includes('club_admin')) {
        if (!userOrgId) return false; // Club admin must be associated with an org
        const teamOrgId = await fetchTeamOrganization(teamId);
        console.log(`[Authz checkTeamAccess] ClubAdmin Check: UserOrg=${userOrgId}, TeamOrg=${teamOrgId}`);
        return !!teamOrgId && teamOrgId === userOrgId;
    }
    
    // Check Coach access by seeing if they are listed as a coach/assistant for the team
    if (userRoles.includes('coach') || userRoles.includes('assistant_coach')) {
        const userTeams = await fetchUserTeams(userId);
        const hasAccess = userTeams.some(team => team.id === teamId && (team.role === 'coach' || team.role === 'assistant_coach'));
        console.log(`[Authz checkTeamAccess] Coach Check: User=${userId}, Team=${teamId}, HasAccess=${hasAccess}`);
        return hasAccess;
    }
    
    console.log(`[Authz checkTeamAccess] Denied: User=${userId}, Roles=${userRoles.join(',')}, Team=${teamId}`);
    return false;
};

/**
 * Checks if an accessor user can access data related to a target player.
 */
export const checkPlayerAccess = async (
    accessorUserId: string, 
    accessorRoles: string[], 
    accessorOrgId: string | undefined, 
    targetPlayerId: string
): Promise<boolean> => {
    if (!accessorUserId || !targetPlayerId) return false;
    if (accessorUserId === targetPlayerId) return true; // User accessing their own data
    if (accessorRoles.includes('admin')) return true; // Admin has global access

    // Check Club Admin access by comparing accessor's org with player's org
    if (accessorRoles.includes('club_admin')) {
        if (!accessorOrgId) return false;
        const playerOrgId = await fetchUserOrganization(targetPlayerId);
         console.log(`[Authz checkPlayerAccess] ClubAdmin Check: AccessorOrg=${accessorOrgId}, PlayerOrg=${playerOrgId}`);
        return !!playerOrgId && playerOrgId === accessorOrgId; // Player must be in the admin's org
    }
    
    // Check Coach access by seeing if player is on any team the coach manages
    if (accessorRoles.includes('coach') || accessorRoles.includes('assistant_coach')) {
        const coachTeams = await fetchUserTeams(accessorUserId);
        if (!coachTeams || coachTeams.length === 0) return false;
        const playerTeams = await fetchUserTeams(targetPlayerId);
        if (!playerTeams || playerTeams.length === 0) return false;
        
        const hasAccess = coachTeams.some(coachTeam => 
            (coachTeam.role === 'coach' || coachTeam.role === 'assistant_coach') && 
            playerTeams.some(playerTeam => playerTeam.id === coachTeam.id)
        );
         console.log(`[Authz checkPlayerAccess] Coach Check: Coach=${accessorUserId}, Player=${targetPlayerId}, HasAccess=${hasAccess}`);
        return hasAccess;
    }
    
    // Check Parent access by checking linked children
    if (accessorRoles.includes('parent')) {
        const childIds = await fetchChildLinks(accessorUserId);
        const hasAccess = childIds.includes(targetPlayerId);
        console.log(`[Authz checkPlayerAccess] Parent Check: Parent=${accessorUserId}, Player=${targetPlayerId}, HasAccess=${hasAccess}`);
        return hasAccess;
    }

    console.log(`[Authz checkPlayerAccess] Denied: Accessor=${accessorUserId}, Roles=${accessorRoles.join(',')}, TargetPlayer=${targetPlayerId}`);
    return false;
}; 