import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ProtectedRoute } from './ProtectedRoute';
import { authSlice } from '../../store/slices/authSlice';

// Create a test store
const createTestStore = (authState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer
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
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </Provider>,
    options
  );
};

describe('ProtectedRoute', () => {
  describe('Authentication Check', () => {
    it('should render protected content when authenticated', () => {
      const store = createTestStore({
        isAuthenticated: true,
        user: { id: 'user-123', email: 'test@example.com' }
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

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect to login when not authenticated', () => {
      const store = createTestStore({
        isAuthenticated: false
      });

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

      // Should redirect to login
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(window.location.pathname).toBe('/login');
    });

    it('should show loading state while checking auth', () => {
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

    it('should deny access when user lacks required role', () => {
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
          <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="admin">
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>,
        { store }
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });

    it('should allow access with any of the required roles', () => {
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

    it('should require all roles when requireAll is true', () => {
      const store = createTestStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          roles: ['coach'] // Has only one of the required roles
        }
      });

      renderWithProviders(
        <Routes>
          <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute
                requiredRoles={['admin', 'coach']}
                requireAll={true}
              >
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>,
        { store }
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
  });

  describe('Permission-Based Access', () => {
    it('should allow access when user has required permission', () => {
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

    it('should deny access when user lacks required permission', () => {
      const store = createTestStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          permissions: ['read:profile']
        }
      });

      renderWithProviders(
        <Routes>
          <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute requiredPermission="admin:all">
                <TestComponent />
              </ProtectedRoute>
            }
          />
        </Routes>,
        { store }
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect to custom login path', () => {
      const store = createTestStore({
        isAuthenticated: false
      });

      renderWithProviders(
        <Routes>
          <Route path="/auth/signin" element={<div>Custom Login</div>} />
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

      expect(screen.getByText('Custom Login')).toBeInTheDocument();
    });

    it('should redirect to custom unauthorized path', () => {
      const store = createTestStore({
        isAuthenticated: true,
        user: {
          id: 'user-123',
          roles: ['player']
        }
      });

      renderWithProviders(
        <Routes>
          <Route path="/403" element={<div>Access Denied</div>} />
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

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should preserve attempted location for redirect after login', () => {
      const store = createTestStore({
        isAuthenticated: false
      });

      renderWithProviders(
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
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
      const store = createTestStore({
        loading: true
      });

      const { rerender } = renderWithProviders(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        { store }
      );

      // Initially loading
      expect(screen.getByTestId('auth-loading')).toBeInTheDocument();

      // Update to authenticated quickly
      store.dispatch(authSlice.actions.loginSuccess({
        user: { id: 'user-123' },
        accessToken: 'token',
        refreshToken: 'refresh'
      }));

      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <ProtectedRoute>
              <TestComponent />
            </ProtectedRoute>
          </BrowserRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Nested Protected Routes', () => {
    it('should handle nested protection requirements', () => {
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
    it('should handle missing user gracefully', () => {
      const store = createTestStore({
        isAuthenticated: true,
        user: null // Authenticated but no user data
      });

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

      // Should redirect to login
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should handle auth errors', () => {
      const store = createTestStore({
        isAuthenticated: false,
        error: 'Session expired'
      });

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

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });
});