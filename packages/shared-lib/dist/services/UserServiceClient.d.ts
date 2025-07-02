import { ServiceClient } from './ServiceClient';
import { UserDTO, CreateUserDTO, UpdateUserDTO, UserWithRoleDTO, GetUserByIdQuery, GetUsersQuery, UsersResponseDTO, OrganizationDTO, TeamDTO, TeamMemberDTO } from '../dto';
export declare class UserServiceClient extends ServiceClient {
    constructor(baseURL: string);
    getUser(query: GetUserByIdQuery): Promise<UserWithRoleDTO>;
    getUsers(query: GetUsersQuery): Promise<UsersResponseDTO>;
    createUser(data: CreateUserDTO): Promise<UserDTO>;
    updateUser(userId: string, data: UpdateUserDTO): Promise<UserDTO>;
    deleteUser(userId: string): Promise<void>;
    getUserOrganizations(userId: string): Promise<OrganizationDTO[]>;
    addUserToOrganization(userId: string, organizationId: string, role: string): Promise<void>;
    removeUserFromOrganization(userId: string, organizationId: string): Promise<void>;
    getUserTeams(userId: string): Promise<TeamDTO[]>;
    getTeamMembers(teamId: string): Promise<TeamMemberDTO[]>;
    addUserToTeam(teamId: string, userId: string, role: string, jerseyNumber?: number, position?: string): Promise<void>;
    removeUserFromTeam(teamId: string, userId: string): Promise<void>;
    getUsersByIds(userIds: string[]): Promise<UserDTO[]>;
    getUsersByOrganization(organizationId: string, role?: string): Promise<UserDTO[]>;
    getUsersByTeam(teamId: string, role?: string): Promise<UserDTO[]>;
}
//# sourceMappingURL=UserServiceClient.d.ts.map