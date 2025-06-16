// Define DTO interfaces for user operations

export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    preferredLanguage?: 'sv' | 'en';
    status?: 'active' | 'inactive' | 'pending'; 
    avatarUrl?: string;
}

export interface AssignRoleDto {
    roleName: string; // Name of the role to assign
}

export interface RemoveRoleDto {
    roleName: string; // Name of the role to remove
}

// DTO for ListUsersOptions might not be strictly necessary 
// if params are passed directly from query, but can be useful for type safety
export interface ListUsersQueryDto {
    page?: string; // Use string for query params, transform later
    limit?: string;
    search?: string;
    role?: string;
    teamId?: string;
    status?: 'active' | 'inactive' | 'pending';
    sort?: 'firstName' | 'lastName' | 'email' | 'createdAt';
    order?: 'asc' | 'desc';
    organizationId?: string;
} 