// User DTOs for cross-service communication

export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  jerseyNumber?: number;
  position?: string;
  handedness?: 'left' | 'right' | 'ambidextrous';
  profileImageUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  jerseyNumber?: number;
  position?: string;
  handedness?: 'left' | 'right' | 'ambidextrous';
  profileImageUrl?: string;
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  jerseyNumber?: number;
  position?: string;
  handedness?: 'left' | 'right' | 'ambidextrous';
  profileImageUrl?: string;
  isActive?: boolean;
}

export interface UserWithRoleDTO extends UserDTO {
  organizationId: string;
  organizationRole: string;
  teams: {
    teamId: string;
    teamName: string;
    teamRole: string;
    jerseyNumber?: number;
    position?: string;
  }[];
}

// Event DTOs for cross-service communication
export interface UserCreatedEvent {
  userId: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  timestamp: string;
}

export interface UserUpdatedEvent {
  userId: string;
  changes: Partial<UserDTO>;
  timestamp: string;
}

export interface UserDeletedEvent {
  userId: string;
  organizationId: string;
  timestamp: string;
}

export interface UserRoleChangedEvent {
  userId: string;
  organizationId: string;
  oldRole: string;
  newRole: string;
  timestamp: string;
}

// Query DTOs
export interface GetUserByIdQuery {
  userId: string;
  includeOrganizations?: boolean;
  includeTeams?: boolean;
}

export interface GetUsersQuery {
  organizationId?: string;
  teamId?: string;
  role?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface UsersResponseDTO {
  users: UserDTO[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}