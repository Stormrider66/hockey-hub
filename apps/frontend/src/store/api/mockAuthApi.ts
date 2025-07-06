// Mock authentication API for development
import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { 
  mockUsers, 
  mockDelay, 
  getMockUserByEmail, 
  generateMockSession,
  mockErrors 
} from '@/utils/mockAuth';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  VerifyEmailResponse,
  ResendVerificationResponse,
  GetSessionsResponse,
  RevokeSessionResponse
} from './authApi';

// Store for mock authentication state
let mockAuthState = {
  currentUser: null as LoginResponse['user'] | null,
  isAuthenticated: false,
  sessions: [] as any[]
};

// Mock base query function
export const mockBaseQuery: BaseQueryFn<
  {
    url: string;
    method?: string;
    body?: any;
    params?: any;
  },
  unknown,
  unknown
> = async ({ url, method = 'GET', body }) => {
  // Add mock delay
  await mockDelay();

  // Handle different endpoints
  switch (url) {
    case '/login':
      if (method === 'POST') {
        const { email, password } = body as LoginRequest;
        
        // Check for mock users
        const mockUser = getMockUserByEmail(email);
        if (mockUser) {
          // Accept any password for mock users
          mockAuthState.currentUser = mockUser.user;
          mockAuthState.isAuthenticated = true;
          
          // Create a session
          const session = generateMockSession();
          mockAuthState.sessions.push(session);
          
          // Save mock user role for proper redirection
          localStorage.setItem('mock_user_role', mockUser.user.role.name.toLowerCase());
          localStorage.setItem('user_role', mockUser.user.role.name.toLowerCase());
          
          return { data: mockUser };
        }
        
        // Return error for non-mock users
        return { error: mockErrors.invalidCredentials };
      }
      break;

    case '/register':
      if (method === 'POST') {
        const { email, firstName, lastName, role } = body as RegisterRequest;
        
        // Create a new mock user
        const newUser: LoginResponse = {
          access_token: `mock_token_${Date.now()}`,
          refresh_token: `mock_refresh_${Date.now()}`,
          expires_in: 3600,
          user: {
            id: `mock_${Date.now()}`,
            email,
            firstName: firstName || 'Test',
            lastName: lastName || 'User',
            role: {
              id: `role_${role}`,
              name: role.charAt(0).toUpperCase() + role.slice(1),
              permissions: []
            },
            organizationId: 'org-123',
            teams: []
          }
        };
        
        mockAuthState.currentUser = newUser.user;
        mockAuthState.isAuthenticated = true;
        
        return { data: newUser };
      }
      break;

    case '/logout':
      if (method === 'POST') {
        mockAuthState.currentUser = null;
        mockAuthState.isAuthenticated = false;
        mockAuthState.sessions = [];
        return { data: undefined };
      }
      break;

    case '/refresh':
      if (method === 'POST') {
        if (mockAuthState.isAuthenticated && mockAuthState.currentUser) {
          return {
            data: {
              access_token: `mock_token_${Date.now()}`,
              refresh_token: `mock_refresh_${Date.now()}`,
              expires_in: 3600,
              user: mockAuthState.currentUser
            }
          };
        }
        return { error: mockErrors.invalidCredentials };
      }
      break;

    case '/me':
      if (mockAuthState.isAuthenticated && mockAuthState.currentUser) {
        return { data: mockAuthState.currentUser };
      }
      return { error: mockErrors.invalidCredentials };

    case '/forgot-password':
      if (method === 'POST') {
        const response: ForgotPasswordResponse = {
          message: 'Password reset email sent (mock mode - no actual email sent)'
        };
        return { data: response };
      }
      break;

    case '/reset-password':
      if (method === 'POST') {
        const response: ResetPasswordResponse = {
          message: 'Password reset successfully (mock mode)'
        };
        return { data: response };
      }
      break;

    case '/verify-email':
      if (method === 'POST') {
        const response: VerifyEmailResponse = {
          message: 'Email verified successfully (mock mode)',
          user: mockAuthState.currentUser || undefined
        };
        return { data: response };
      }
      break;

    case '/resend-verification':
      if (method === 'POST') {
        const response: ResendVerificationResponse = {
          message: 'Verification email resent (mock mode - no actual email sent)'
        };
        return { data: response };
      }
      break;

    case '/sessions':
      if (method === 'GET') {
        const response: GetSessionsResponse = {
          sessions: mockAuthState.sessions.length > 0 
            ? mockAuthState.sessions 
            : [generateMockSession()]
        };
        return { data: response };
      } else if (method === 'DELETE') {
        mockAuthState.sessions = [];
        const response: RevokeSessionResponse = {
          message: 'All sessions revoked successfully (mock mode)'
        };
        return { data: response };
      }
      break;

    default:
      // Handle session revocation
      if (url.startsWith('/sessions/') && method === 'DELETE') {
        const sessionId = url.split('/').pop();
        mockAuthState.sessions = mockAuthState.sessions.filter(s => s.id !== sessionId);
        const response: RevokeSessionResponse = {
          message: 'Session revoked successfully (mock mode)'
        };
        return { data: response };
      }
  }

  // Default error response
  return { error: mockErrors.serverError };
};