'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Lock,
  AlertTriangle,
  Crown,
  Users,
  Eye,
  ArrowRight,
  Zap,
  Clock,
  TrendingUp
} from '@/components/icons';
import { tacticalAuthService, TacticalPermissionKey, TACTICAL_PERMISSIONS } from '../services/tacticalAuthorizationService';

interface TacticalPermissionGuardProps {
  children: React.ReactNode;
  permission?: TacticalPermissionKey;
  permissions?: TacticalPermissionKey[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  resource?: string;
  action?: string;
  className?: string;
}

interface PermissionErrorProps {
  permission?: TacticalPermissionKey;
  permissions?: TacticalPermissionKey[];
  userRole: string;
  showUpgrade: boolean;
  onUpgradeClick?: () => void;
}

const PermissionError: React.FC<PermissionErrorProps> = ({
  permission,
  permissions,
  userRole,
  showUpgrade,
  onUpgradeClick
}) => {
  const requiredPermissions = permissions || (permission ? [permission] : []);
  const permissionDescriptions = requiredPermissions.map(p => TACTICAL_PERMISSIONS[p]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'HEAD_COACH': return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'ASSISTANT_COACH': return <Shield className="h-5 w-5 text-blue-500" />;
      case 'VIDEO_COACH': return <Eye className="h-5 w-5 text-purple-500" />;
      case 'TEAM_MANAGER': return <Users className="h-5 w-5 text-green-500" />;
      default: return <Users className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getRequiredRoles = () => {
    // Determine which roles have the required permissions
    const rolesWithPermission = new Set<string>();
    
    for (const [role, rolePermissions] of Object.entries(tacticalAuthService.getUserPermissions({ id: 'temp', role: { name: role }, email: '', firstName: '', lastName: '' } as any).permissions)) {
      if (requiredPermissions.some(p => rolePermissions.includes(p))) {
        rolesWithPermission.add(role);
      }
    }

    return Array.from(rolesWithPermission);
  };

  const requiredRoles = getRequiredRoles();

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Lock className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <CardTitle className="text-red-800 text-lg">Access Restricted</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current role display */}
        <div className="flex items-center justify-center gap-3 p-3 bg-white rounded-lg border">
          {getRoleIcon(userRole)}
          <div>
            <p className="font-medium text-sm">Your Role</p>
            <p className="text-xs text-muted-foreground">{getRoleDisplayName(userRole)}</p>
          </div>
        </div>

        {/* Required permissions */}
        <div className="space-y-2">
          <p className="font-medium text-sm text-red-800">Required Permissions:</p>
          <div className="space-y-1">
            {permissionDescriptions.map((desc, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Required roles */}
        {requiredRoles.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium text-sm text-red-800">Roles with Access:</p>
            <div className="flex flex-wrap gap-2">
              {requiredRoles.map(role => (
                <Badge key={role} variant="outline" className="text-xs">
                  {getRoleDisplayName(role)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade suggestion */}
        {showUpgrade && userRole === 'PLAYER' && (
          <Alert className="border-blue-200 bg-blue-50">
            <TrendingUp className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Want to unlock tactical features?</strong> Ask your head coach about becoming an assistant coach or video analyst to access tactical tools.
            </AlertDescription>
          </Alert>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {showUpgrade && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onUpgradeClick}
              className="w-full"
            >
              <Crown className="h-4 w-4 mr-2" />
              Request Access
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Go Back
          </Button>
        </div>

        {/* Help text */}
        <div className="text-center pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Contact your head coach or system administrator if you believe this is an error.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export const TacticalPermissionGuard: React.FC<TacticalPermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = true,
  fallback,
  showUpgrade = true,
  resource,
  action,
  className = ''
}) => {
  const { user } = useAuth();
  
  // In mock mode, provide a default coach user if no user is found
  const isMockMode = typeof window !== 'undefined' && 
    (process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true' || 
     process.env.NEXT_PUBLIC_MOCK_AUTH === 'true');
  
  let effectiveUser = user;
  
  if (!user && isMockMode) {
    // Create a mock coach user for development
    effectiveUser = {
      id: 'mock-coach',
      email: 'coach@hockeyhub.com',
      firstName: 'Mock',
      lastName: 'Coach',
      role: {
        id: '2',
        name: 'Coach',
        permissions: []
      },
      teams: [
        { id: 'team-1', name: 'Mock Team', role: 'head_coach' }
      ]
    } as any;
  }

  // Check permissions
  const hasAccess = React.useMemo(() => {
    if (!effectiveUser) return false;

    if (permission) {
      return tacticalAuthService.hasPermission(effectiveUser, permission);
    }

    if (permissions && permissions.length > 0) {
      return requireAll 
        ? tacticalAuthService.hasAllPermissions(effectiveUser, permissions)
        : tacticalAuthService.hasAnyPermission(effectiveUser, permissions);
    }

    // If no specific permissions are required, check if user has any tactical access
    const userPerms = tacticalAuthService.getUserPermissions(effectiveUser);
    return userPerms.permissions.length > 0;
  }, [effectiveUser, permission, permissions, requireAll]);

  // Handle upgrade request
  const handleUpgradeRequest = React.useCallback(() => {
    if (!effectiveUser) return;

    // Log the access request for audit
    console.log('Access upgrade requested', {
      userId: effectiveUser.id,
      userRole: tacticalAuthService.getUserPermissions(effectiveUser).role,
      requestedPermission: permission,
      requestedPermissions: permissions,
      resource,
      action,
      timestamp: new Date()
    });

    // In a real application, this would trigger a notification to admins
    // or open a request form
    alert('Access request logged. Your head coach will be notified.');
  }, [effectiveUser, permission, permissions, resource, action]);

  if (!effectiveUser) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="text-center py-8">
          <Shield className="h-8 w-8 text-amber-600 mx-auto mb-4" />
          <p className="font-medium text-amber-800 mb-2">Authentication Required</p>
          <p className="text-sm text-amber-600">Please log in to access tactical features.</p>
          <Button size="sm" className="mt-4" onClick={() => window.location.href = '/login'}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Log In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (hasAccess) {
    return <div className={className}>{children}</div>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // Show default permission error
  const userRole = tacticalAuthService.getUserPermissions(effectiveUser).role;
  
  return (
    <div className={className}>
      <PermissionError
        permission={permission}
        permissions={permissions}
        userRole={userRole}
        showUpgrade={showUpgrade}
        onUpgradeClick={handleUpgradeRequest}
      />
    </div>
  );
};

// Hook for checking permissions in components
export const useCanAccessTactical = (permission?: TacticalPermissionKey, permissions?: TacticalPermissionKey[]) => {
  const { user } = useAuth();

  return React.useMemo(() => {
    // In mock mode, provide a default coach user if no user is found
    const isMockMode = typeof window !== 'undefined' && 
      (process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true' || 
       process.env.NEXT_PUBLIC_MOCK_AUTH === 'true');
    
    let effectiveUser = user;
    
    if (!user && isMockMode) {
      // Create a mock coach user for development
      effectiveUser = {
        id: 'mock-coach',
        email: 'coach@hockeyhub.com',
        firstName: 'Mock',
        lastName: 'Coach',
        role: {
          id: '2',
          name: 'Coach',
          permissions: []
        },
        teams: [
          { id: 'team-1', name: 'Mock Team', role: 'head_coach' }
        ]
      } as any;
    }
    
    if (!effectiveUser) return { canAccess: false, userRole: 'NONE', permissions: [] };

    const userPerms = tacticalAuthService.getUserPermissions(effectiveUser);
    
    let canAccess = false;
    if (permission) {
      canAccess = tacticalAuthService.hasPermission(effectiveUser, permission);
    } else if (permissions) {
      canAccess = tacticalAuthService.hasAnyPermission(effectiveUser, permissions);
    } else {
      canAccess = userPerms.permissions.length > 0;
    }

    return {
      canAccess,
      userRole: userPerms.role,
      permissions: userPerms.permissions,
      aiLimits: userPerms.aiLimits,
      canCreatePlays: userPerms.canCreatePlays,
      canDeletePlays: userPerms.canDeletePlays,
      canUseAI: userPerms.canUseAI,
      canExport: userPerms.canExport,
      canViewAnalytics: userPerms.canViewAnalytics
    };
  }, [user, permission, permissions]);
};

// Enhanced permission guard with AI usage limits
interface AIPermissionGuardProps {
  children: React.ReactNode;
  feature?: string;
  fallback?: React.ReactNode;
  showUsageLimits?: boolean;
}

export const AIPermissionGuard: React.FC<AIPermissionGuardProps> = ({
  children,
  feature,
  fallback,
  showUsageLimits = true
}) => {
  const { user } = useAuth();

  const aiAccess = React.useMemo(() => {
    if (!user) return { allowed: false, remaining: 0, resetTime: new Date() };
    return tacticalAuthService.canUseAI(user, feature);
  }, [user, feature]);

  const userPerms = user ? tacticalAuthService.getUserPermissions(user) : null;

  if (!user || !aiAccess.allowed) {
    if (fallback) return <>{fallback}</>;

    return (
      <Card className="border-purple-200 bg-purple-50/50">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-purple-800 text-lg">AI Usage Limit Reached</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-purple-700">
            You've reached your daily AI analysis limit.
          </p>
          
          {userPerms && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Limit:</span>
                <span className="font-medium">{userPerms.aiLimits.daily}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Remaining:</span>
                <span className="font-medium">{aiAccess.remaining}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Resets:</span>
                <span className="font-medium">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {aiAccess.resetTime.toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          <Alert className="border-blue-200 bg-blue-50 text-left">
            <TrendingUp className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Need more AI analysis?</strong> Upgrade your role or contact your head coach for additional usage allocation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {showUsageLimits && userPerms && (
        <div className="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">AI Usage</span>
            </div>
            <span className="text-blue-700">
              {aiAccess.remaining}/{userPerms.aiLimits.daily} remaining today
            </span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default TacticalPermissionGuard;