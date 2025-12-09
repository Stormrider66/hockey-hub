'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermissions?: Array<{ resource: string; action: string }>;
  fallbackPath?: string;
  loginPath?: string;
  unauthorizedPath?: string;
  loadingComponent?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermissions,
  fallbackPath = '/login',
  loginPath,
  unauthorizedPath = '/unauthorized',
  loadingComponent,
}) => {
  const { user, loading, isAuthenticated, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated
      if (!isAuthenticated) {
        router.push(loginPath || fallbackPath);
        return;
      }

      // Check role requirement
      if (requiredRole && !hasRole(requiredRole)) {
        router.push(unauthorizedPath);
        return;
      }

      // Check permission requirements
      if (requiredPermissions && requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(
          ({ resource, action }) => hasPermission(resource, action)
        );

        if (!hasAllPermissions) {
          router.push(unauthorizedPath);
          return;
        }
      }
    }
  }, [
    loading,
    isAuthenticated,
    requiredRole,
    requiredPermissions,
    hasRole,
    hasPermission,
    router,
    fallbackPath,
    loginPath,
    unauthorizedPath,
  ]);

  // Show loading component while checking auth
  if (loading) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center min-h-screen" data-testid="auth-loading" role="status" aria-live="polite" aria-busy="true">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </div>
      )
    );
  }

  // Synchronous guard to make redirects observable in tests
  if (!loading && !isAuthenticated) {
    router.push(loginPath || fallbackPath);
    return null;
  }

  if (!loading && requiredRole && !hasRole(requiredRole)) {
    router.push(unauthorizedPath);
    return null;
  }

  if (!loading && requiredPermissions && requiredPermissions.length > 0) {
    const hasAllPermissionsSync = requiredPermissions.every(({ resource, action }) => hasPermission(resource, action));
    if (!hasAllPermissionsSync) {
      router.push(unauthorizedPath);
      return null;
    }
  }

  // Don't render children if not authenticated or authorized
  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(
      ({ resource, action }) => hasPermission(resource, action)
    );

    if (!hasAllPermissions) {
      return null;
    }
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

// Higher-order component alternative
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: string;
    requiredPermissions?: Array<{ resource: string; action: string }>;
    fallbackPath?: string;
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute
        requiredRole={options?.requiredRole}
        requiredPermissions={options?.requiredPermissions}
        fallbackPath={options?.fallbackPath}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Role-specific protected route components for convenience
export const PlayerProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="player">{children}</ProtectedRoute>
);

export const CoachProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="coach">{children}</ProtectedRoute>
);

export const ParentProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="parent">{children}</ProtectedRoute>
);

export const MedicalStaffProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="medical_staff">{children}</ProtectedRoute>
);

export const EquipmentManagerProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="equipment_manager">{children}</ProtectedRoute>
);

export const PhysicalTrainerProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="physical_trainer">{children}</ProtectedRoute>
);

export const ClubAdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="club_admin">{children}</ProtectedRoute>
);

export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
);