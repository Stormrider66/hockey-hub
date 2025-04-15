// Define a type for the decoded user payload from JWT
// Should match the payload structure defined in User Service
export interface AuthenticatedUser {
    id: string;
    email: string;
    roles: string[];
    organizationId?: string;
    teamIds?: string[];
    preferredLanguage: string;
    firstName?: string; 
    lastName?: string; 
    // Add other fields present in your JWT payload
} 