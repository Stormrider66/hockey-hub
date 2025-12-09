import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { AuthProvider, useAuth, withAuth } from './AuthContext';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Setup MSW server
const server = setupServer(
  rest.post('http://localhost:3000/api/auth/login', async (req, res, ctx) => {
    const { email, password } = await req.json();

    if (email === 'test@example.com' && password === 'password123') {
      return res(
        ctx.json({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: {
              id: 'role-1',
              name: 'player',
              permissions: [
                { id: 'perm-1', name: 'read:profile', resource: 'profile', action: 'read' },
                { id: 'perm-2', name: 'write:profile', resource: 'profile', action: 'write' }
              ]
            },
            organizationId: 'org-123',
            teams: [{ id: 'team-1', name: 'Team A', role: 'player' }]
          },
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600
        })
      );
    }

    if (email === 'locked@example.com') {
      return res(
        ctx.status(401),
        ctx.json({ message: 'Account is locked due to too many failed attempts' })
      );
    }

    return res(
      ctx.status(401),
      ctx.json({ message: 'Invalid email or password' })
    );
  }),

  rest.post('http://localhost:3000/api/auth/register', async (req, res, ctx) => {
    const { email } = await req.json();

    if (email === 'existing@example.com') {
      return res(
        ctx.status(409),
        ctx.json({ message: 'Email already exists' })
      );
    }

    return res(
      ctx.json({
        user: {
          id: 'new-user-123',
          email: req.body.email,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          role: {
            id: 'role-1',
            name: 'player',
            permissions: []
          }
        },
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600
      })
    );
  }),

  rest.post('http://localhost:3000/api/auth/logout', (req, res, ctx) => {
    return res(ctx.json({ message: 'Logged out successfully' }));
  }),

  rest.post('http://localhost:3000/api/auth/refresh', async (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader === 'Bearer mock-refresh-token') {
      return res(
        ctx.json({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: {
              id: 'role-1',
              name: 'player',
              permissions: []
            }
          },
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600
        })
      );
    }

    return res(
      ctx.status(401),
      ctx.json({ message: 'Invalid refresh token' })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockPush.mockClear();
  localStorage.clear();
  sessionStorage.clear();
  document.cookie = '';
});
afterAll(() => server.close());

// Wrapper component
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>
    <AuthProvider>{children}</AuthProvider>
  </Provider>
);

describe('AuthContext', () => {
  describe('Initial State', () => {
    it('should have initial unauthenticated state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should load user data from localStorage if remember me was set', () => {
      // Set up localStorage with user data
      const userData = {
        id: 'stored-user',
        email: 'stored@example.com',
        firstName: 'Stored',
        lastName: 'User',
        role: {
          id: 'role-1',
          name: 'player',
          permissions: []
        }
      };

      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('token_expiry', (Date.now() + 3600000).toString());
      localStorage.setItem('remember_me', 'true');

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toEqual(userData);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should load user data from sessionStorage if remember me was not set', () => {
      // Set up sessionStorage with user data
      const userData = {
        id: 'session-user',
        email: 'session@example.com',
        firstName: 'Session',
        lastName: 'User',
        role: {
          id: 'role-1',
          name: 'coach',
          permissions: []
        }
      };

      sessionStorage.setItem('user_data', JSON.stringify(userData));
      sessionStorage.setItem('token_expiry', (Date.now() + 3600000).toString());

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toEqual(userData);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear expired tokens on load', () => {
      // Set up localStorage with expired token
      const userData = {
        id: 'expired-user',
        email: 'expired@example.com',
        firstName: 'Expired',
        lastName: 'User',
        role: {
          id: 'role-1',
          name: 'player',
          permissions: []
        }
      };

      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('token_expiry', (Date.now() - 1000).toString()); // Expired
      localStorage.setItem('remember_me', 'true');

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('user_data')).toBeNull();
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123', false);
      });

      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: expect.objectContaining({
          name: 'player',
          permissions: expect.arrayContaining([
            expect.objectContaining({ resource: 'profile', action: 'read' })
          ])
        }),
        organizationId: 'org-123',
        teams: expect.any(Array)
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/player');
    });

    it('should save to localStorage when remember me is true', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123', true);
      });

      expect(localStorage.getItem('user_data')).not.toBeNull();
      expect(localStorage.getItem('token_expiry')).not.toBeNull();
      expect(localStorage.getItem('remember_me')).toBe('true');
      expect(localStorage.getItem('current_user_id')).toBe('user-123');
    });

    it('should save to sessionStorage when remember me is false', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123', false);
      });

      expect(sessionStorage.getItem('user_data')).not.toBeNull();
      expect(sessionStorage.getItem('token_expiry')).not.toBeNull();
      expect(localStorage.getItem('remember_me')).toBeNull();
    });

    it('should handle invalid credentials', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login('wrong@example.com', 'wrongpassword');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Invalid email or password');
    });

    it('should handle account lockout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login('locked@example.com', 'anypassword');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Account is locked due to too many failed attempts');
    });

    it('should redirect based on user role', async () => {
      server.use(
        rest.post('http://localhost:3000/api/auth/login', (req, res, ctx) => {
          return res(
            ctx.json({
              user: {
                id: 'coach-123',
                email: 'coach@example.com',
                firstName: 'Coach',
                lastName: 'User',
                role: {
                  id: 'role-2',
                  name: 'coach',
                  permissions: []
                }
              },
              access_token: 'mock-token',
              refresh_token: 'mock-refresh',
              expires_in: 3600
            })
          );
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('coach@example.com', 'password123');
      });

      expect(mockPush).toHaveBeenCalledWith('/coach');
    });
  });

  describe('Register', () => {
    it('should register successfully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          firstName: 'New',
          lastName: 'User',
          organizationId: 'org-123'
        });
      });

      expect(result.current.user).toEqual(
        expect.objectContaining({
          id: 'new-user-123',
          email: 'newuser@example.com'
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/verify-email');
    });

    it('should handle existing email error', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.register({
            email: 'existing@example.com',
            password: 'SecurePass123!',
            firstName: 'Existing',
            lastName: 'User'
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Email already exists');
      expect(result.current.user).toBeNull();
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // First login
      await act(async () => {
        await result.current.login('test@example.com', 'password123', true);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('user_data')).toBeNull();
      expect(localStorage.getItem('current_user_id')).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should clear all storage on logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Setup some data
      localStorage.setItem('user_data', 'test');
      localStorage.setItem('token_expiry', 'test');
      localStorage.setItem('remember_me', 'true');
      sessionStorage.setItem('user_data', 'test');
      sessionStorage.setItem('token_expiry', 'test');

      await act(async () => {
        await result.current.logout();
      });

      expect(localStorage.getItem('user_data')).toBeNull();
      expect(localStorage.getItem('token_expiry')).toBeNull();
      expect(localStorage.getItem('remember_me')).toBeNull();
      expect(sessionStorage.getItem('user_data')).toBeNull();
      expect(sessionStorage.getItem('token_expiry')).toBeNull();
    });

    it('should clear cookies on logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      document.cookie = 'access_token=test; path=/';
      document.cookie = 'refresh_token=test; path=/';

      await act(async () => {
        await result.current.logout();
      });

      expect(document.cookie).not.toContain('access_token');
      expect(document.cookie).not.toContain('refresh_token');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token automatically before expiry', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login with short expiry
      server.use(
        rest.post('http://localhost:3000/api/auth/login', (req, res, ctx) => {
          return res(
            ctx.json({
              user: {
                id: 'user-123',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: { id: 'role-1', name: 'player', permissions: [] }
              },
              access_token: 'short-lived-token',
              refresh_token: 'mock-refresh-token',
              expires_in: 360 // 6 minutes
            })
          );
        })
      );

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Fast forward to just before token refresh (1 minute before expiry)
      act(() => {
        jest.advanceTimersByTime(60 * 1000); // 1 minute
      });

      // Token should be refreshed
      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      jest.useRealTimers();
    });

    it('should handle refresh token failure', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set invalid refresh token
      server.use(
        rest.post('http://localhost:3000/api/auth/refresh', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({ message: 'Invalid refresh token' })
          );
        })
      );

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Permissions and Roles', () => {
    it('should check permissions correctly', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.hasPermission('profile', 'read')).toBe(true);
      expect(result.current.hasPermission('profile', 'write')).toBe(true);
      expect(result.current.hasPermission('admin', 'all')).toBe(false);
    });

    it('should check roles correctly', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.hasRole('player')).toBe(true);
      expect(result.current.hasRole('PLAYER')).toBe(true); // Case insensitive
      expect(result.current.hasRole('coach')).toBe(false);
    });

    it('should return false for permissions/roles when not authenticated', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasPermission('profile', 'read')).toBe(false);
      expect(result.current.hasRole('player')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should clear error', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Trigger an error
      await act(async () => {
        try {
          await result.current.login('wrong@example.com', 'wrong');
        } catch (error) {
          // Expected
        }
      });

      expect(result.current.error).not.toBeNull();

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle network errors with retry', async () => {
      let attempts = 0;
      server.use(
        rest.post('http://localhost:3000/api/auth/login', (req, res, ctx) => {
          attempts++;
          if (attempts < 2) {
            return res.networkError('Network error');
          }
          return res(
            ctx.json({
              user: {
                id: 'user-123',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: { id: 'role-1', name: 'player', permissions: [] }
              },
              access_token: 'token',
              refresh_token: 'refresh',
              expires_in: 3600
            })
          );
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(attempts).toBe(2);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('withAuth HOC', () => {
    const TestComponent = () => <div>Protected Content</div>;

    it('should render component when authenticated', () => {
      const ProtectedComponent = withAuth(TestComponent);

      // Set authenticated user
      localStorage.setItem('user_data', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        role: { name: 'player', permissions: [] }
      }));
      localStorage.setItem('token_expiry', (Date.now() + 3600000).toString());
      localStorage.setItem('remember_me', 'true');

      render(
        <Provider store={store}>
          <AuthProvider>
            <ProtectedComponent />
          </AuthProvider>
        </Provider>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect when not authenticated', () => {
      const ProtectedComponent = withAuth(TestComponent);

      render(
        <Provider store={store}>
          <AuthProvider>
            <ProtectedComponent />
          </AuthProvider>
        </Provider>
      );

      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should check required role', () => {
      const ProtectedComponent = withAuth(TestComponent, {
        requiredRole: 'admin',
        redirectTo: '/unauthorized'
      });

      // Set authenticated user with wrong role
      localStorage.setItem('user_data', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        role: { name: 'player', permissions: [] }
      }));
      localStorage.setItem('token_expiry', (Date.now() + 3600000).toString());

      render(
        <Provider store={store}>
          <AuthProvider>
            <ProtectedComponent />
          </AuthProvider>
        </Provider>
      );

      expect(mockPush).toHaveBeenCalledWith('/unauthorized');
    });

    it('should check required permission', () => {
      const ProtectedComponent = withAuth(TestComponent, {
        requiredPermission: { resource: 'admin', action: 'all' }
      });

      // Set authenticated user without required permission
      localStorage.setItem('user_data', JSON.stringify({
        id: 'user-123',
        email: 'test@example.com',
        role: {
          name: 'player',
          permissions: [
            { resource: 'profile', action: 'read' }
          ]
        }
      }));
      localStorage.setItem('token_expiry', (Date.now() + 3600000).toString());

      render(
        <Provider store={store}>
          <AuthProvider>
            <ProtectedComponent />
          </AuthProvider>
        </Provider>
      );

      expect(mockPush).toHaveBeenCalledWith('/unauthorized');
    });

    it('should show loading state', () => {
      const ProtectedComponent = withAuth(TestComponent);

      // Mock loading state
      jest.spyOn(React, 'useState')
        .mockImplementationOnce(() => [null, jest.fn()])
        .mockImplementationOnce(() => [true, jest.fn()]); // loading = true

      render(
        <Provider store={store}>
          <AuthProvider>
            <ProtectedComponent />
          </AuthProvider>
        </Provider>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });
});