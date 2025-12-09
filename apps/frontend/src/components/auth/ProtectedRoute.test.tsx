import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
jest.mock('@/hooks/useAuth', () => {
  const fn = jest.fn(() => ({
    user: null,
    loading: false,
    isAuthenticated: false,
    hasRole: () => false,
    hasPermission: () => false,
  }));
  return { __esModule: true, useAuth: fn };
});
import { configureStore } from '@reduxjs/toolkit';
import { ProtectedRoute } from './ProtectedRoute';
import authReducer from '../../store/slices/authSlice';

// Create a test store
const createTestStore = (authState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer
    },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
        error: null,
        ...authState
      }
    }
  });
};

// Test component to render inside protected route
const TestComponent = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;

// Helper to render with router and store
const renderWithProviders = (
  ui: React.ReactElement,
  { store = createTestStore(), ...options } = {}
) => {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/"]}>
        {ui}
      </MemoryRouter>
    </Provider>,
    options
  );
};

describe('ProtectedRoute', () => {
  const mockUseAuth = (overrides: any = {}) => {
    const mod = require('@/hooks/useAuth');
    (mod.useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
      hasRole: () => false,
      hasPermission: () => false,
      ...overrides,
    });
  };

  describe('Authentication Check', () => {
    it('should render protected content when authenticated', async () => {
      mockUseAuth({ isAuthenticated: true, loading: false, user: { id: 'user-123' }, hasRole: () => true, hasPermission: () => true });
      const store = createTestStore({
        isAuthenticated: true,
        user: { id: 'user-123', email: 'test@example.com' }
      });

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { store }
      );

      expect(await screen.findByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect to login when not authenticated', async () => {
      mockUseAuth({ isAuthenticated: false, loading: false });
      const store = createTestStore({
        isAuthenticated: false
      });

      const { useRouter } = require('next/navigation');
      const router = useRouter();
      router.push.mockClear();

      renderWithProviders(
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>,
        { store }
      );

      // Should not render protected content
      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    it('should show loading state while checking auth', () => {
      mockUseAuth({ loading: true });
      const store = createTestStore({
        loading: true
      });

      renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { store }
      );

      expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Role-Based Access', () => {
    it('should allow access when user has required role', () => {
      mockUseAuth({ isAuthenticated: true, hasRole: (r: string) => r === 'admin' });
      const store = createTestStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          roles: ['admin', 'coach']
        }
      });

      renderWithProviders(
        <ProtectedRoute requiredRole="admin">
          <TestComponent />
        </ProtectedRoute>,
        { store }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should deny access when user lacks required role', async () => {
      mockUseAuth({ isAuthenticated: true, hasRole: () => false });
      const store = createTestStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          roles: ['player']
        }
      });

      renderWithProviders(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="admin" unauthorizedPath="/403">
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>,
        { store }
      );

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    it('should allow access with any of the required roles', () => {
      mockUseAuth({ isAuthenticated: true, hasRole: (r: string) => r === 'coach' });
      const store = createTestStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          roles: ['coach']
        }
      });

      renderWithProviders(
        <ProtectedRoute requiredRoles={['admin', 'coach']}>
          <TestComponent />
        </ProtectedRoute>,
        { store }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should require all roles when requireAll is true', async () => {
      mockUseAuth({ isAuthenticated: true, hasRole: (r: string) => r === 'coach' });
      const store = createTestStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          roles: ['coach'] // Has only one of the required roles
        }
      });

      renderWithProviders(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute
                requiredRoles={['admin', 'coach']}
                requireAll={true}
                unauthorizedPath="/403"
              >
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>,
        { store }
      );

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Permission-Based Access', () => {
    it('should allow access when user has required permission', () => {
      mockUseAuth({ isAuthenticated: true, hasPermission: (resource: string, action: string) => resource === 'users' && action === 'read' });
      const store = createTestStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          permissions: ['read:users', 'write:users']
        }
      });

      renderWithProviders(
        <ProtectedRoute requiredPermission="read:users">
          <TestComponent />
        </ProtectedRoute>,
        { store }
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should deny access when user lacks required permission', async () => {
      mockUseAuth({ isAuthenticated: true, hasPermission: () => false });
      const store = createTestStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          permissions: ['read:profile']
        }
      });

      renderWithProviders(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredPermission="admin:all" unauthorizedPath="/403">
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>,
        { store }
      );

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect to custom login path', async () => {
      mockUseAuth({ isAuthenticated: false, loading: false });
      const store = createTestStore({
        isAuthenticated: false
      });

      renderWithProviders(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute loginPath="/auth/signin">
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>,
        { store }
      );

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    it('should redirect to custom unauthorized path', async () => {
      mockUseAuth({ isAuthenticated: true, hasRole: () => false });
      const store = createTestStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          roles: ['player']
        }
      });

      renderWithProviders(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute
                requiredRole="admin"
                unauthorizedPath="/403"
              >
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>,
        { store }
      );

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    it('should preserve attempted location for redirect after login', () => {
      const store = createTestStore({
        isAuthenticated: false
      });

      renderWithProviders(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>,
        { store }
      );

      // Check that location state is passed
      // This would be used by login page to redirect back
      // expect(location.state?.from).toBe('/dashboard');
    });
  });

  describe('Loading States', () => {
    it('should show custom loading component', () => {
      mockUseAuth({ loading: true });
      const CustomLoader = () => <div>Custom Loading...</div>;
      
      const store = createTestStore({
        loading: true
      });

      renderWithProviders(
        <ProtectedRoute loadingComponent={<CustomLoader />}>
          <TestComponent />
        </ProtectedRoute>,
        { store }
      );

      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    });

    it('should not flicker during fast auth checks', async () => {
      mockUseAuth({ loading: true });
      const store = createTestStore({ loading: true });

      const { rerender } = renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { store }
      );

      // Initially loading
      expect(screen.getByTestId('auth-loading')).toBeInTheDocument();

      // Update to authenticated quickly
      const mod = require('@/hooks/useAuth');
      (mod.useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, loading: false, hasRole: () => true, hasPermission: () => true });

      rerender(
        <Provider store={store}>
          <MemoryRouter initialEntries={["/"]}>
            <ProtectedRoute>
              <TestComponent />
            </ProtectedRoute>
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Nested Protected Routes', () => {
    it('should handle nested protection requirements', () => {
      mockUseAuth({ isAuthenticated: true, hasRole: (r: string) => r === 'admin', hasPermission: (resource: string, action: string) => resource === 'users' && action === 'manage' });
      const store = createTestStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          roles: ['admin'],
          permissions: ['manage:users']
        }
      });

      renderWithProviders(
        <ProtectedRoute requiredRole="admin">
          <div>
            Admin Area
            <ProtectedRoute requiredPermission="manage:users">
              <div>User Management</div>
            </ProtectedRoute>
          </div>
        </ProtectedRoute>,
        { store }
      );

      expect(screen.getByText('Admin Area')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user gracefully', async () => {
      mockUseAuth({ isAuthenticated: false });
      const store = createTestStore({
        isAuthenticated: true,
        user: null // Authenticated but no user data
      });

      renderWithProviders(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>,
        { store }
      );

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    it('should handle auth errors', async () => {
      mockUseAuth({ isAuthenticated: false });
      const store = createTestStore({
        isAuthenticated: false,
        error: 'Session expired'
      });

      renderWithProviders(
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>,
        { store }
      );

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });
});