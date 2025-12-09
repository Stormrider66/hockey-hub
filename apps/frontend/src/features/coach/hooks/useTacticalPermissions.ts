'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  tacticalAuthService, 
  TacticalPermissionKey, 
  PlayAccessControl,
  TacticalAuditLog
} from '../services/tacticalAuthorizationService';
import { TacticalPlayData } from '../services/tacticalCommunicationService';

/**
 * Comprehensive hook for managing tactical permissions
 */
export const useTacticalPermissions = () => {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) {
      return {
        // Permission checks
        hasPermission: () => false,
        hasAllPermissions: () => false,
        hasAnyPermission: () => false,
        canAccessPlay: () => false,
        canUseAI: () => ({ allowed: false, remaining: 0, resetTime: new Date() }),
        
        // User info
        userRole: 'NONE',
        userPermissions: [],
        
        // Capabilities
        canCreatePlays: false,
        canEditPlays: false,
        canDeletePlays: false,
        canSharePlays: false,
        canManageFormations: false,
        canUploadVideo: false,
        canAnalyzeVideo: false,
        canUseAIAnalysis: false,
        canViewAnalytics: false,
        canScheduleSessions: false,
        canExportData: false,
        canViewAuditLogs: false,
        canManageSettings: false,
        
        // AI limits
        aiLimits: { daily: 0, monthly: 0, remaining: 0 },
        
        // Utility functions
        trackAIUsage: () => {},
        getAuditLogs: () => [],
        exportAuditLogs: () => '',
        checkFeatureAccess: () => ({ available: false, reason: 'Not authenticated' })
      };
    }

    const userPerms = tacticalAuthService.getUserPermissions(user);
    const aiCheck = tacticalAuthService.canUseAI(user);

    return {
      // Core permission checks
      hasPermission: (permission: TacticalPermissionKey) => 
        tacticalAuthService.hasPermission(user, permission),
      
      hasAllPermissions: (permissions: TacticalPermissionKey[]) =>
        tacticalAuthService.hasAllPermissions(user, permissions),
      
      hasAnyPermission: (permissions: TacticalPermissionKey[]) =>
        tacticalAuthService.hasAnyPermission(user, permissions),
      
      canAccessPlay: (play: TacticalPlayData, accessControl?: PlayAccessControl) =>
        tacticalAuthService.canAccessPlay(user, play, accessControl),
      
      canUseAI: (feature?: string) => tacticalAuthService.canUseAI(user, feature),
      
      // User information
      userRole: userPerms.role,
      userPermissions: userPerms.permissions,
      
      // Specific capabilities (common checks)
      canCreatePlays: userPerms.canCreatePlays,
      canEditPlays: tacticalAuthService.hasPermission(user, 'tactical.play.edit'),
      canDeletePlays: userPerms.canDeletePlays,
      canSharePlays: tacticalAuthService.hasPermission(user, 'tactical.play.share'),
      canManageFormations: tacticalAuthService.hasPermission(user, 'tactical.formation.modify'),
      canUploadVideo: tacticalAuthService.hasPermission(user, 'tactical.video.upload'),
      canAnalyzeVideo: tacticalAuthService.hasPermission(user, 'tactical.video.analyze'),
      canUseAIAnalysis: userPerms.canUseAI && aiCheck.allowed,
      canViewAnalytics: userPerms.canViewAnalytics,
      canScheduleSessions: tacticalAuthService.hasPermission(user, 'tactical.calendar.schedule'),
      canExportData: userPerms.canExport,
      canViewAuditLogs: tacticalAuthService.hasPermission(user, 'tactical.admin.audit'),
      canManageSettings: tacticalAuthService.hasPermission(user, 'tactical.admin.settings'),
      
      // AI usage information
      aiLimits: {
        ...userPerms.aiLimits,
        remaining: aiCheck.remaining
      },
      
      // Utility functions
      trackAIUsage: (feature: string) => tacticalAuthService.trackAIUsage(user, feature),
      
      getAuditLogs: (filters?: Parameters<typeof tacticalAuthService.getAuditLogs>[0]) =>
        tacticalAuthService.getAuditLogs(filters),
      
      exportAuditLogs: (format?: 'json' | 'csv') => tacticalAuthService.exportAuditLogs(format),
      
      // Feature availability check with reasons
      checkFeatureAccess: (feature: string) => {
        switch (feature) {
          case 'create_plays':
            return {
              available: userPerms.canCreatePlays,
              reason: userPerms.canCreatePlays ? '' : 'Requires coach or higher role'
            };
          case 'ai_analysis':
            return {
              available: userPerms.canUseAI && aiCheck.allowed,
              reason: !userPerms.canUseAI ? 'AI analysis not available for your role' :
                     !aiCheck.allowed ? 'Daily AI usage limit reached' : ''
            };
          case 'video_upload':
            const canUpload = tacticalAuthService.hasPermission(user, 'tactical.video.upload');
            return {
              available: canUpload,
              reason: canUpload ? '' : 'Video upload requires coach permissions'
            };
          case 'export_data':
            return {
              available: userPerms.canExport,
              reason: userPerms.canExport ? '' : 'Export functionality requires elevated permissions'
            };
          case 'delete_plays':
            return {
              available: userPerms.canDeletePlays,
              reason: userPerms.canDeletePlays ? '' : 'Play deletion requires head coach permissions'
            };
          default:
            return { available: false, reason: 'Unknown feature' };
        }
      }
    };
  }, [user]);

  return permissions;
};

/**
 * Hook for specific play access control
 */
export const usePlayAccess = (play: TacticalPlayData | null, accessControl?: PlayAccessControl) => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user || !play) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canShare: false,
        canDuplicate: false,
        accessLevel: 'none' as const,
        restrictions: ['Not authenticated or no play selected']
      };
    }

    const canView = tacticalAuthService.canAccessPlay(user, play, accessControl);
    const canEdit = canView && tacticalAuthService.hasPermission(user, 'tactical.play.edit');
    const canDelete = canView && tacticalAuthService.hasPermission(user, 'tactical.play.delete');
    const canShare = canView && tacticalAuthService.hasPermission(user, 'tactical.play.share');
    const canDuplicate = canView && tacticalAuthService.hasPermission(user, 'tactical.play.duplicate');

    const userRole = tacticalAuthService.getUserPermissions(user).role;
    let accessLevel: 'none' | 'view' | 'edit' | 'full' = 'none';
    
    if (canDelete && canEdit && canShare) accessLevel = 'full';
    else if (canEdit) accessLevel = 'edit';
    else if (canView) accessLevel = 'view';

    const restrictions: string[] = [];
    if (!canView) restrictions.push('Cannot view this play');
    if (!canEdit && canView) restrictions.push('Read-only access');
    if (!canDelete && canEdit) restrictions.push('Cannot delete plays');
    if (!canShare) restrictions.push('Cannot share with others');

    return {
      canView,
      canEdit,
      canDelete,
      canShare,
      canDuplicate,
      accessLevel,
      restrictions,
      userRole
    };
  }, [user, play, accessControl]);
};

/**
 * Hook for AI usage tracking and limits
 */
export const useAIUsage = (feature?: string) => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return {
        canUse: false,
        remaining: 0,
        dailyLimit: 0,
        monthlyLimit: 0,
        resetTime: new Date(),
        trackUsage: () => {},
        isLimitReached: true
      };
    }

    const aiCheck = tacticalAuthService.canUseAI(user, feature);
    const userPerms = tacticalAuthService.getUserPermissions(user);

    return {
      canUse: aiCheck.allowed,
      remaining: aiCheck.remaining,
      dailyLimit: userPerms.aiLimits.daily,
      monthlyLimit: userPerms.aiLimits.monthly,
      resetTime: aiCheck.resetTime,
      trackUsage: () => {
        if (feature) {
          tacticalAuthService.trackAIUsage(user, feature);
        }
      },
      isLimitReached: !aiCheck.allowed
    };
  }, [user, feature]);
};

/**
 * Hook for audit log management
 */
export const useAuditLogs = () => {
  const { user } = useAuth();

  return useMemo(() => {
    const canViewAudit = user ? tacticalAuthService.hasPermission(user, 'tactical.admin.audit') : false;

    return {
      canViewAudit,
      getLogs: (filters?: Parameters<typeof tacticalAuthService.getAuditLogs>[0]) =>
        canViewAudit ? tacticalAuthService.getAuditLogs(filters) : [],
      
      exportLogs: (format?: 'json' | 'csv') =>
        canViewAudit ? tacticalAuthService.exportAuditLogs(format) : '',
      
      clearOldLogs: (daysToKeep?: number) =>
        canViewAudit ? tacticalAuthService.clearOldAuditLogs(daysToKeep) : 0
    };
  }, [user]);
};

/**
 * Hook for role-based UI configuration
 */
export const useTacticalUI = () => {
  const permissions = useTacticalPermissions();

  return useMemo(() => {
    const { userRole } = permissions;

    // UI configuration based on role
    const uiConfig = {
      showCreateButton: permissions.canCreatePlays,
      showDeleteButton: permissions.canDeletePlays,
      showAIAnalysis: permissions.canUseAIAnalysis,
      showVideoUpload: permissions.canUploadVideo,
      showAnalytics: permissions.canViewAnalytics,
      showAuditLogs: permissions.canViewAuditLogs,
      showAdvancedSettings: permissions.canManageSettings,
      
      // Navigation items
      navigationItems: [
        { key: 'plays', label: 'Play Library', available: true },
        { key: 'editor', label: 'Play Editor', available: permissions.canCreatePlays || permissions.canEditPlays },
        { key: 'video', label: 'Video Analysis', available: permissions.canAnalyzeVideo },
        { key: 'ai', label: 'AI Analysis', available: permissions.canUseAIAnalysis },
        { key: 'analytics', label: 'Analytics', available: permissions.canViewAnalytics },
        { key: 'calendar', label: 'Schedule', available: permissions.canScheduleSessions },
        { key: 'settings', label: 'Settings', available: permissions.canManageSettings },
        { key: 'audit', label: 'Audit Logs', available: permissions.canViewAuditLogs }
      ].filter(item => item.available),
      
      // Feature limitations
      limitations: {
        maxPlaysPerDay: userRole === 'HEAD_COACH' ? -1 : userRole === 'ASSISTANT_COACH' ? 50 : 10,
        maxVideoUploadsPerDay: userRole === 'HEAD_COACH' || userRole === 'VIDEO_COACH' ? -1 : 5,
        maxExportsPerDay: permissions.canExport ? (userRole === 'HEAD_COACH' ? -1 : 20) : 0,
        canBulkOperations: userRole === 'HEAD_COACH',
        canAccessTemplateLibrary: permissions.canCreatePlays,
        canCreateCustomTemplates: userRole === 'HEAD_COACH' || userRole === 'ASSISTANT_COACH'
      },
      
      // Warning messages
      warnings: {
        limitedAccess: userRole === 'PLAYER' ? 'You have limited access to tactical features. Contact your coach for more permissions.' : null,
        aiLimitApproaching: permissions.aiLimits.remaining < 5 ? 'AI usage limit approaching. Consider upgrading your plan.' : null,
        readOnlyMode: !permissions.canEditPlays && userRole !== 'PLAYER' ? 'You have read-only access to plays.' : null
      }
    };

    return uiConfig;
  }, [permissions]);
};

export default useTacticalPermissions;