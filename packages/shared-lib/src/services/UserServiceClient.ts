import { ServiceClient } from './ServiceClient';
import {
  UserDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserWithRoleDTO,
  GetUserByIdQuery,
  GetUsersQuery,
  UsersResponseDTO,
  OrganizationDTO,
  TeamDTO,
  TeamMemberDTO,
} from '../dto';

export class UserServiceClient extends ServiceClient {
  constructor(baseURL: string) {
    super({
      serviceName: 'user-service',
      serviceVersion: '1.0.0',
      baseURL,
    });
  }

  // User operations
  async getUser(query: GetUserByIdQuery): Promise<UserWithRoleDTO> {
    const params = new URLSearchParams();
    if (query.includeOrganizations) params.append('includeOrganizations', 'true');
    if (query.includeTeams) params.append('includeTeams', 'true');
    
    return this.get<UserWithRoleDTO>(`/users/${query.userId}?${params.toString()}`);
  }

  async getUsers(query: GetUsersQuery): Promise<UsersResponseDTO> {
    return this.get<UsersResponseDTO>('/users', { params: query });
  }

  async createUser(data: CreateUserDTO): Promise<UserDTO> {
    return this.post<UserDTO>('/users', data);
  }

  async updateUser(userId: string, data: UpdateUserDTO): Promise<UserDTO> {
    return this.patch<UserDTO>(`/users/${userId}`, data);
  }

  async deleteUser(userId: string): Promise<void> {
    return this.delete<void>(`/users/${userId}`);
  }

  // Organization operations
  async getUserOrganizations(userId: string): Promise<OrganizationDTO[]> {
    return this.get<OrganizationDTO[]>(`/users/${userId}/organizations`);
  }

  async addUserToOrganization(
    userId: string,
    organizationId: string,
    role: string
  ): Promise<void> {
    return this.post<void>(`/users/${userId}/organizations`, {
      organizationId,
      role,
    });
  }

  async removeUserFromOrganization(
    userId: string,
    organizationId: string
  ): Promise<void> {
    return this.delete<void>(`/users/${userId}/organizations/${organizationId}`);
  }

  // Team operations
  async getUserTeams(userId: string): Promise<TeamDTO[]> {
    return this.get<TeamDTO[]>(`/users/${userId}/teams`);
  }

  async getTeamMembers(teamId: string): Promise<TeamMemberDTO[]> {
    return this.get<TeamMemberDTO[]>(`/teams/${teamId}/members`);
  }

  async addUserToTeam(
    teamId: string,
    userId: string,
    role: string,
    jerseyNumber?: number,
    position?: string
  ): Promise<void> {
    return this.post<void>(`/teams/${teamId}/members`, {
      userId,
      role,
      jerseyNumber,
      position,
    });
  }

  async removeUserFromTeam(teamId: string, userId: string): Promise<void> {
    return this.delete<void>(`/teams/${teamId}/members/${userId}`);
  }

  // Bulk operations
  async getUsersByIds(userIds: string[]): Promise<UserDTO[]> {
    return this.post<UserDTO[]>('/users/bulk', { userIds });
  }

  async getUsersByOrganization(
    organizationId: string,
    role?: string
  ): Promise<UserDTO[]> {
    const params = role ? { role } : {};
    return this.get<UserDTO[]>(`/organizations/${organizationId}/users`, {
      params,
    });
  }

  async getUsersByTeam(teamId: string, role?: string): Promise<UserDTO[]> {
    const params = role ? { role } : {};
    return this.get<UserDTO[]>(`/teams/${teamId}/users`, { params });
  }
}