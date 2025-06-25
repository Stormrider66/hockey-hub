export interface CreateTeamDto {
    name: string;
    organizationId: string;
    category?: string;
    season?: string;
    logoUrl?: string;
    primaryColor?: string;
    description?: string;
}
export interface UpdateTeamDto {
    name?: string;
    category?: string;
    season?: string;
    logoUrl?: string;
    primaryColor?: string;
    description?: string;
    status?: 'active' | 'inactive' | 'archived';
}
export interface AddMemberDto {
    userId: string;
    role: 'player' | 'coach' | 'assistant_coach' | 'manager' | 'staff';
    position?: string;
    jerseyNumber?: string;
    startDate?: Date | string;
}
export interface RemoveMemberDto {
    userId: string;
    role?: string;
}
//# sourceMappingURL=team.dto.d.ts.map