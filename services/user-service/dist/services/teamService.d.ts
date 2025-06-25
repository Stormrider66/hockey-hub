import { User } from '../entities/User';
import { Team } from '../entities/Team';
import { TeamMember } from '../entities/TeamMember';
interface CreateTeamDto {
    name: string;
    organizationId: string;
    description?: string;
    logoUrl?: string;
    teamColor?: string;
}
interface UpdateTeamDto {
    name?: string;
    description?: string;
    logoUrl?: string;
    teamColor?: string;
}
interface AddMemberDto {
    userId: string;
    role: 'player' | 'coach' | 'assistant_coach' | 'manager' | 'staff';
    position?: string;
    jerseyNumber?: string;
    startDate?: Date;
}
interface ListTeamsOptions {
    page?: number;
    limit?: number;
    search?: string;
    organizationId?: string;
    sort?: 'name' | 'createdAt';
    order?: 'asc' | 'desc';
}
export declare class TeamService {
    private teamRepository;
    private memberRepository;
    private userRepository;
    private orgRepository;
    constructor();
    createTeam(data: CreateTeamDto, createdByUserId: string): Promise<Team>;
    getTeamById(teamId: string, relations?: string[]): Promise<Team>;
    private ensureTeamExists;
    getTeamsByOrganization(organizationId: string): Promise<Team[]>;
    updateTeam(teamId: string, data: UpdateTeamDto): Promise<Team>;
    deleteTeam(teamId: string): Promise<void>;
    addMemberToTeam(teamId: string, memberData: AddMemberDto): Promise<TeamMember>;
    removeMemberFromTeam(teamId: string, userId: string, role?: string): Promise<void>;
    getTeamMembers(teamId: string): Promise<User[]>;
    isUserMemberOfTeam(userId: string, teamId: string): Promise<boolean>;
    hasTeamRole(userId: string, teamId: string, roles: string[]): Promise<boolean>;
    listTeams(options: ListTeamsOptions): Promise<{
        teams: Team[];
        total: number;
    }>;
}
export {};
//# sourceMappingURL=teamService.d.ts.map