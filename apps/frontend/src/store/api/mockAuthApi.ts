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
import { safeLocalStorage } from '@/utils/safeStorage';

// Initialize mock auth state from localStorage if available
const initializeMockAuthState = () => {
  const storedUser = safeLocalStorage.getItem('mock_user');
  const storedToken = safeLocalStorage.getItem('access_token');

  if (storedUser && storedToken) {
    try {
      const user = JSON.parse(storedUser);
      return {
        currentUser: user,
        isAuthenticated: true,
        sessions: []
      };
    } catch (e) {
      console.error('Failed to parse stored user:', e);
    }
  }

  return {
    currentUser: null as LoginResponse['user'] | null,
    isAuthenticated: false,
    sessions: [] as any[]
  };
};

// Store for mock authentication state
let mockAuthState = initializeMockAuthState();

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

  // Ensure url is defined
  if (!url) {
    return { error: { status: 400, data: { message: 'URL is required' } } };
  }

  // Normalize URL - remove any base path
  const normalizedUrl = url.replace(/^\/api\/auth/, '').replace(/^\/auth/, '') || url;
  
  // Debug logging for auth endpoints
  if (url.includes('/me') || url.includes('getCurrentUser')) {
    console.log('[MockAuth] Request:', { url, normalizedUrl, method, body });
  }
  
  // Handle different endpoints
  switch (normalizedUrl) {
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
          safeLocalStorage.setItem('mock_user_role', mockUser.user.role.name.toLowerCase());
          safeLocalStorage.setItem('user_role', mockUser.user.role.name.toLowerCase());
          safeLocalStorage.setItem('mock_user', JSON.stringify(mockUser.user));
          safeLocalStorage.setItem('access_token', mockUser.access_token);
          
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
        
        // Clear localStorage
        safeLocalStorage.removeItem('mock_user');
        safeLocalStorage.removeItem('access_token');
        safeLocalStorage.removeItem('mock_user_role');
        safeLocalStorage.removeItem('user_role');
        
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
      if (method === 'GET') {
        console.log('[MockAuth] /me endpoint hit:', { 
          isAuthenticated: mockAuthState.isAuthenticated, 
          hasCurrentUser: !!mockAuthState.currentUser,
          currentUser: mockAuthState.currentUser 
        });
        
        // Check if we have a stored mock user
        if (mockAuthState.isAuthenticated && mockAuthState.currentUser) {
          return { data: mockAuthState.currentUser };
        }
        
        // In mock mode, always return a default user for development
        const storedRole = safeLocalStorage.getItem('user_role') || safeLocalStorage.getItem('mock_user_role') || 'physicaltrainer';
        const defaultUser = getMockUserByEmail(`${storedRole}@team.com`);

        if (defaultUser) {
          // Auto-login with default user for development
          mockAuthState.currentUser = defaultUser.user;
          mockAuthState.isAuthenticated = true;
          safeLocalStorage.setItem('mock_user', JSON.stringify(defaultUser.user));
          safeLocalStorage.setItem('access_token', defaultUser.access_token);
          safeLocalStorage.setItem('mock_user_role', defaultUser.user.role.name.toLowerCase());
          safeLocalStorage.setItem('user_role', defaultUser.user.role.name.toLowerCase());
          return { data: defaultUser.user };
        }
        
        // Fallback to physical trainer if no user found
        const fallbackUser = getMockUserByEmail('physicaltrainer@team.com');
        if (fallbackUser) {
          mockAuthState.currentUser = fallbackUser.user;
          mockAuthState.isAuthenticated = true;
          return { data: fallbackUser.user };
        }
        
        // If all else fails, return a basic user object to prevent crashes
        const basicUser = {
          id: 'trainer-123',
          email: 'trainer@hockeyhub.com',
          firstName: 'John',
          lastName: 'Trainer',
          role: {
            id: 'physical_trainer',
            name: 'physicaltrainer',
            permissions: []
          },
          organizationId: 'org-123'
        };
        return { data: basicUser };
      }
      break;

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
      if (typeof normalizedUrl === 'string' && normalizedUrl.startsWith('/sessions/') && method === 'DELETE') {
        const sessionId = normalizedUrl.split('/').pop();
        mockAuthState.sessions = mockAuthState.sessions.filter(s => s.id !== sessionId);
        const response: RevokeSessionResponse = {
          message: 'Session revoked successfully (mock mode)'
        };
        return { data: response };
      }
  }

  // Log unhandled endpoints for debugging
  console.warn('[MockAuth] Unhandled endpoint:', { url, normalizedUrl, method });
  
  // For /me endpoint that somehow didn't match, return a default user
  if ((normalizedUrl === '/me' || url.includes('/me')) && method === 'GET') {
    console.log('[MockAuth] Fallback /me handler triggered');
    const basicUser = {
      id: 'trainer-123',
      email: 'trainer@hockeyhub.com',
      firstName: 'John',
      lastName: 'Trainer',
      role: {
        id: 'physical_trainer',
        name: 'physicaltrainer',
        permissions: []
      },
      organizationId: 'org-123'
    };
    return { data: basicUser };
  }
  
  // Default error response
  return { error: mockErrors.serverError };
};