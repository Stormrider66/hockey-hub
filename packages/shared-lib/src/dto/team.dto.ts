// Team DTOs for cross-service communication

export interface TeamDTO {
  id: string;
  organizationId: string;
  name: string;
  teamType: 'youth' | 'junior' | 'senior' | 'recreational';
  ageGroup?: string;
  season?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamDTO {
  organizationId: string;
  name: string;
  teamType: 'youth' | 'junior' | 'senior' | 'recreational';
  ageGroup?: string;
  season?: string;
  logoUrl?: string;
}

export interface UpdateTeamDTO {
  name?: string;
  teamType?: 'youth' | 'junior' | 'senior' | 'recreational';
  ageGroup?: string;
  season?: string;
  logoUrl?: string;
  isActive?: boolean;
}

export interface TeamWithMembersDTO extends TeamDTO {
  members: TeamMemberDTO[];
  stats: {
    totalPlayers: number;
    totalCoaches: number;
    totalStaff: number;
  };
}

export interface TeamMemberDTO {
  userId: string;
  teamId: string;
  role: 'player' | 'coach' | 'assistant_coach' | 'team_manager' | 'medical_staff';
  jerseyNumber?: number;
  position?: string;
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
}

export interface AddTeamMemberDTO {
  userId: string;
  role: 'player' | 'coach' | 'assistant_coach' | 'team_manager' | 'medical_staff';
  jerseyNumber?: number;
  position?: string;
}

// Events
export interface TeamCreatedEvent {
  teamId: string;
  organizationId: string;
  name: string;
  teamType: string;
  season?: string;
  timestamp: string;
}

export interface TeamMemberAddedEvent {
  teamId: string;
  userId: string;
  role: string;
  timestamp: string;
}

export interface TeamMemberRemovedEvent {
  teamId: string;
  userId: string;
  reason?: string;
  timestamp: string;
}

export interface TeamDeactivatedEvent {
  teamId: string;
  organizationId: string;
  timestamp: string;
}