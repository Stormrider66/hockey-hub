import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAuth } from './useAuth';
import { authSlice } from '../store/slices/authSlice';
import { authApi } from '../store/api/authApi';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock server for API calls
const server = setupServer(
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { email, password } = req.body as any;
    if (email === 'test@example.com' && password === 'password123') {
      return res(
        ctx.json({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            roles: ['player']
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        })
      );
    }
    return res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }));
  }),
  
  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(ctx.json({ message: 'Logged out successfully' }));
  }),
  
  rest.post('/api/auth/refresh', (req, res, ctx) => {
    const { refreshToken } = req.body as any;
    if (refreshToken === 'valid-refresh-token') {
      return res(
        ctx.json({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        })
      );
    }
    return res(ctx.status(401), ctx.json({ message: 'Invalid refresh token' }));
  }),
  
  rest.get('/api/auth/me', (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (authHeader === 'Bearer mock-access-token') {
      return res(
        ctx.json({
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          roles: ['player'],
          permissions: ['read:profile', 'write:profile']
        })
      );
    }
    return res(ctx.status(401), ctx.json({ message: 'Unauthorized' }));
  })
);

// Setup and teardown
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Helper to create a test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      [authApi.reducerPath]: authApi.reducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware),
    preloadedState: {
      auth: {
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
        error: null,
        ...initialState
      }
    }
  });
};

// Wrapper component for tests
const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useAuth Hook', () => {
  describe('Initial State', () => {
    it('should return unauthenticated state initially', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should return authenticated state when user exists', () => {
      const store = createTestStore({
        isAuthenticated: true,
        user: { id: 'user-123', email: 'test@example.com' },
        accessToken: 'token'
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com'
      });
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123'
        });
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual({
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          roles: ['player']
        });
      });
    });

    it('should handle login failure', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      await act(async () => {
        try {
          await result.current.login({
            email: 'wrong@example.com',
            password: 'wrongpassword'
          });
        } catch (error) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toBe('Invalid credentials');
      });
    });

    it('should show loading state during login', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      let loadingDuringRequest = false;

      act(() => {
        result.current.login({
          email: 'test@example.com',
          password: 'password123'
        });
        loadingDuringRequest = result.current.loading;
      });

      expect(loadingDuringRequest).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      const store = createTestStore({
        isAuthenticated: true,
        user: { id: 'user-123', email: 'test@example.com' },
        accessToken: 'token',
        refreshToken: 'refresh-token'
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.accessToken).toBeNull();
      });
    });

    it('should clear local storage on logout', async () => {
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
      
      const store = createTestStore({
        isAuthenticated: true,
        user: { id: 'user-123' },
        accessToken: 'token',
        refreshToken: 'refresh'
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(removeItemSpy).toHaveBeenCalledWith('accessToken');
      expect(removeItemSpy).toHaveBeenCalledWith('refreshToken');
      
      removeItemSpy.mockRestore();
    });
  });

  describe('Token Refresh', () => {
    it('should refresh tokens successfully', async () => {
      const store = createTestStore({
        refreshToken: 'valid-refresh-token'
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      await act(async () => {
        await result.current.refreshTokens();
      });

      await waitFor(() => {
        expect(result.current.accessToken).toBe('new-access-token');
        expect(result.current.refreshToken).toBe('new-refresh-token');
      });
    });

    it('should handle refresh token failure', async () => {
      const store = createTestStore({
        refreshToken: 'invalid-refresh-token'
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      await act(async () => {
        try {
          await result.current.refreshTokens();
        } catch (error) {
          // Expected to fail
        }
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.accessToken).toBeNull();
      });
    });
  });

  describe('Check Auth', () => {
    it('should verify authentication status', async () => {
      const store = createTestStore({
        accessToken: 'mock-access-token'
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      await act(async () => {
        await result.current.checkAuth();
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(
          expect.objectContaining({
            id: 'user-123',
            email: 'test@example.com'
          })
        );
      });
    });

    it('should handle expired token', async () => {
      server.use(
        rest.get('/api/auth/me', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({ message: 'Token expired' }));
        })
      );

      const store = createTestStore({
        accessToken: 'expired-token'
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      await act(async () => {
        await result.current.checkAuth();
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
      });
    });
  });

  describe('Permission Checks', () => {
    it('should check if user has permission', () => {
      const store = createTestStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          permissions: ['read:profile', 'write:profile']
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      expect(result.current.hasPermission('read:profile')).toBe(true);
      expect(result.current.hasPermission('admin:all')).toBe(false);
    });

    it('should check if user has role', () => {
      const store = createTestStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          roles: ['player', 'coach']
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      expect(result.current.hasRole('player')).toBe(true);
      expect(result.current.hasRole('admin')).toBe(false);
    });

    it('should check multiple roles', () => {
      const store = createTestStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          roles: ['player', 'coach']
        }
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      expect(result.current.hasAnyRole(['admin', 'coach'])).toBe(true);
      expect(result.current.hasAllRoles(['player', 'coach'])).toBe(true);
      expect(result.current.hasAllRoles(['player', 'admin'])).toBe(false);
    });
  });

  describe('Token Storage', () => {
    it('should store tokens in localStorage on login', async () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      
      const store = createTestStore();
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123'
        });
      });

      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith('accessToken', 'mock-access-token');
        expect(setItemSpy).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');
      });
      
      setItemSpy.mockRestore();
    });

    it('should load tokens from localStorage on mount', () => {
      // Set tokens in localStorage
      localStorage.setItem('accessToken', 'stored-token');
      localStorage.setItem('refreshToken', 'stored-refresh');

      const store = createTestStore();
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      // Hook should initialize with stored tokens
      expect(result.current.accessToken).toBe('stored-token');
      expect(result.current.refreshToken).toBe('stored-refresh');

      // Cleanup
      localStorage.clear();
    });
  });

  describe('Error Handling', () => {
    it('should clear error on successful action', async () => {
      const store = createTestStore({ error: 'Previous error' });
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      expect(result.current.error).toBe('Previous error');

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123'
        });
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle network errors', async () => {
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      const store = createTestStore();
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(store)
      });

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'password123'
          });
        } catch (error) {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).toContain('Network error');
      });
    });
  });
});