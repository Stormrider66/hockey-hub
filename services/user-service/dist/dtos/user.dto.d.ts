export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    preferredLanguage?: 'sv' | 'en';
    status?: 'active' | 'inactive' | 'pending';
    avatarUrl?: string;
}
export interface AssignRoleDto {
    roleName: string;
}
export interface RemoveRoleDto {
    roleName: string;
}
export interface ListUsersQueryDto {
    page?: string;
    limit?: string;
    search?: string;
    role?: string;
    teamId?: string;
    status?: 'active' | 'inactive' | 'pending';
    sort?: 'firstName' | 'lastName' | 'email' | 'createdAt';
    order?: 'asc' | 'desc';
    organizationId?: string;
}
//# sourceMappingURL=user.dto.d.ts.map