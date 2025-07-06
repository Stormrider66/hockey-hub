// Mock authentication system for development
import { LoginResponse } from '@/store/api/authApi';

// Mock user data for different roles
export const mockUsers: Record<string, LoginResponse> = {
  player: {
    access_token: 'mock_player_token_123',
    refresh_token: 'mock_player_refresh_123',
    expires_in: 3600,
    user: {
      id: '1',
      email: 'player@hockeyhub.com',
      firstName: 'Erik',
      lastName: 'Johansson',
      role: {
        id: '1',
        name: 'Player',
        permissions: [
          { id: '1', name: 'view_own_stats', resource: 'stats', action: 'view' },
          { id: '2', name: 'update_own_profile', resource: 'profile', action: 'update' },
          { id: '3', name: 'view_schedule', resource: 'schedule', action: 'view' },
          { id: '4', name: 'submit_wellness', resource: 'wellness', action: 'create' },
          { id: '5', name: 'view_training', resource: 'training', action: 'view' },
        ]
      },
      organizationId: 'org-123',
      teams: [
        { id: 'team-1', name: 'Stockholm Eagles U20', role: 'forward' }
      ]
    }
  },
  coach: {
    access_token: 'mock_coach_token_123',
    refresh_token: 'mock_coach_refresh_123',
    expires_in: 3600,
    user: {
      id: '2',
      email: 'coach@hockeyhub.com',
      firstName: 'Lars',
      lastName: 'Andersson',
      role: {
        id: '2',
        name: 'Coach',
        permissions: [
          { id: '6', name: 'view_all_stats', resource: 'stats', action: 'view' },
          { id: '7', name: 'manage_team', resource: 'team', action: 'manage' },
          { id: '8', name: 'create_training', resource: 'training', action: 'create' },
          { id: '9', name: 'manage_schedule', resource: 'schedule', action: 'manage' },
          { id: '10', name: 'view_wellness', resource: 'wellness', action: 'view' },
        ]
      },
      organizationId: 'org-123',
      teams: [
        { id: 'team-1', name: 'Stockholm Eagles U20', role: 'head_coach' },
        { id: 'team-2', name: 'Stockholm Eagles U18', role: 'assistant_coach' }
      ]
    }
  },
  parent: {
    access_token: 'mock_parent_token_123',
    refresh_token: 'mock_parent_refresh_123',
    expires_in: 3600,
    user: {
      id: '3',
      email: 'parent@hockeyhub.com',
      firstName: 'Anna',
      lastName: 'Nilsson',
      role: {
        id: '3',
        name: 'Parent',
        permissions: [
          { id: '11', name: 'view_child_stats', resource: 'stats', action: 'view' },
          { id: '12', name: 'view_child_schedule', resource: 'schedule', action: 'view' },
          { id: '13', name: 'manage_payments', resource: 'payments', action: 'manage' },
          { id: '14', name: 'communicate_coach', resource: 'communication', action: 'send' },
        ]
      },
      organizationId: 'org-123',
      teams: []
    }
  },
  medical_staff: {
    access_token: 'mock_medical_token_123',
    refresh_token: 'mock_medical_refresh_123',
    expires_in: 3600,
    user: {
      id: '4',
      email: 'medical@hockeyhub.com',
      firstName: 'Dr. Maria',
      lastName: 'Svensson',
      role: {
        id: '4',
        name: 'Medical Staff',
        permissions: [
          { id: '15', name: 'view_medical_records', resource: 'medical', action: 'view' },
          { id: '16', name: 'update_medical_records', resource: 'medical', action: 'update' },
          { id: '17', name: 'manage_injuries', resource: 'injuries', action: 'manage' },
          { id: '18', name: 'view_wellness', resource: 'wellness', action: 'view' },
        ]
      },
      organizationId: 'org-123',
      teams: [
        { id: 'team-1', name: 'Stockholm Eagles U20', role: 'team_doctor' }
      ]
    }
  },
  equipment_manager: {
    access_token: 'mock_equipment_token_123',
    refresh_token: 'mock_equipment_refresh_123',
    expires_in: 3600,
    user: {
      id: '5',
      email: 'equipment@hockeyhub.com',
      firstName: 'Johan',
      lastName: 'Berg',
      role: {
        id: '5',
        name: 'Equipment Manager',
        permissions: [
          { id: '19', name: 'manage_equipment', resource: 'equipment', action: 'manage' },
          { id: '20', name: 'view_inventory', resource: 'inventory', action: 'view' },
          { id: '21', name: 'create_orders', resource: 'orders', action: 'create' },
        ]
      },
      organizationId: 'org-123',
      teams: [
        { id: 'team-1', name: 'Stockholm Eagles U20', role: 'equipment_manager' }
      ]
    }
  },
  physical_trainer: {
    access_token: 'mock_trainer_token_123',
    refresh_token: 'mock_trainer_refresh_123',
    expires_in: 3600,
    user: {
      id: '6',
      email: 'trainer@hockeyhub.com',
      firstName: 'Magnus',
      lastName: 'Lindgren',
      role: {
        id: '6',
        name: 'Physical Trainer',
        permissions: [
          { id: '22', name: 'create_training_programs', resource: 'training', action: 'create' },
          { id: '23', name: 'view_performance', resource: 'performance', action: 'view' },
          { id: '24', name: 'manage_tests', resource: 'tests', action: 'manage' },
          { id: '25', name: 'view_wellness', resource: 'wellness', action: 'view' },
        ]
      },
      organizationId: 'org-123',
      teams: [
        { id: 'team-1', name: 'Stockholm Eagles U20', role: 'physical_trainer' }
      ]
    }
  },
  club_admin: {
    access_token: 'mock_clubadmin_token_123',
    refresh_token: 'mock_clubadmin_refresh_123',
    expires_in: 3600,
    user: {
      id: '7',
      email: 'clubadmin@hockeyhub.com',
      firstName: 'Karin',
      lastName: 'Olsson',
      role: {
        id: '7',
        name: 'Club Admin',
        permissions: [
          { id: '26', name: 'manage_organization', resource: 'organization', action: 'manage' },
          { id: '27', name: 'manage_users', resource: 'users', action: 'manage' },
          { id: '28', name: 'view_analytics', resource: 'analytics', action: 'view' },
          { id: '29', name: 'manage_facilities', resource: 'facilities', action: 'manage' },
        ]
      },
      organizationId: 'org-123',
      teams: []
    }
  },
  admin: {
    access_token: 'mock_admin_token_123',
    refresh_token: 'mock_admin_refresh_123',
    expires_in: 3600,
    user: {
      id: '8',
      email: 'admin@hockeyhub.com',
      firstName: 'System',
      lastName: 'Administrator',
      role: {
        id: '8',
        name: 'Admin',
        permissions: [
          { id: '30', name: 'system_admin', resource: '*', action: '*' },
        ]
      },
      organizationId: 'org-123',
      teams: []
    }
  }
};

// Mock delay to simulate network latency
export const mockDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Check if mock mode is enabled
export const isMockMode = () => 
  process.env.NEXT_PUBLIC_MOCK_AUTH === 'true' || 
  (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true');

// Get mock user by role
export const getMockUserByRole = (role: string): LoginResponse | null => {
  const normalizedRole = role.toLowerCase().replace(/\s+/g, '_');
  return mockUsers[normalizedRole] || null;
};

// Get mock user by email
export const getMockUserByEmail = (email: string): LoginResponse | null => {
  const user = Object.values(mockUsers).find(u => u.user.email === email);
  return user || null;
};

// Generate mock session data
export const generateMockSession = () => ({
  id: `session_${Date.now()}`,
  userId: 'mock_user_id',
  deviceInfo: {
    userAgent: navigator.userAgent,
    browser: 'Chrome',
    os: 'Windows',
    device: 'Desktop'
  },
  ipAddress: '127.0.0.1',
  location: {
    city: 'Stockholm',
    country: 'Sweden'
  },
  createdAt: new Date().toISOString(),
  lastActivity: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  isCurrent: true
});

// Mock error responses
export const mockErrors = {
  invalidCredentials: {
    status: 401,
    data: { message: 'Invalid email or password' }
  },
  userNotFound: {
    status: 404,
    data: { message: 'User not found' }
  },
  accountLocked: {
    status: 403,
    data: { message: 'Account is locked due to too many failed attempts' }
  },
  serverError: {
    status: 500,
    data: { message: 'Internal server error' }
  }
};