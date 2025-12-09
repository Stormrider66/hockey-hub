import { User } from '@/contexts/AuthContext';
import { TacticalPlayData } from './tacticalCommunicationService';

// Role-based permissions for tactical features
export interface TacticalRole {
  HEAD_COACH: 'HEAD_COACH';
  ASSISTANT_COACH: 'ASSISTANT_COACH';
  VIDEO_COACH: 'VIDEO_COACH';
  PLAYER: 'PLAYER';
  TEAM_MANAGER: 'TEAM_MANAGER';
}

// Granular tactical permissions
export const TACTICAL_PERMISSIONS = {
  // Play management
  'tactical.play.create': 'Create new tactical plays',
  'tactical.play.edit': 'Edit existing tactical plays',
  'tactical.play.delete': 'Delete tactical plays',
  'tactical.play.share': 'Share plays with team members',
  'tactical.play.duplicate': 'Copy existing plays',
  
  // Formation management
  'tactical.formation.create': 'Create new formations',
  'tactical.formation.modify': 'Modify team formations',
  'tactical.formation.delete': 'Delete formations',
  
  // Video analysis
  'tactical.video.upload': 'Upload video content',
  'tactical.video.analyze': 'Perform video analysis',
  'tactical.video.annotate': 'Add video annotations',
  'tactical.video.share': 'Share video analysis',
  
  // AI analysis
  'tactical.ai.analyze': 'Use AI tactical analysis',
  'tactical.ai.suggestions': 'View AI suggestions',
  'tactical.ai.apply': 'Apply AI recommendations',
  'tactical.ai.history': 'View AI analysis history',
  
  // Analytics and statistics
  'tactical.analytics.view': 'View tactical analytics',
  'tactical.analytics.export': 'Export analytics data',
  'tactical.analytics.advanced': 'Access advanced analytics',
  
  // Calendar and scheduling
  'tactical.calendar.schedule': 'Schedule tactical sessions',
  'tactical.calendar.modify': 'Modify scheduled sessions',
  'tactical.calendar.view': 'View tactical calendar',
  
  // Export permissions
  'tactical.export.pdf': 'Export plays as PDF',
  'tactical.export.video': 'Export video analysis',
  'tactical.export.presentation': 'Export tactical presentations',
  'tactical.export.bulk': 'Bulk export capabilities',
  
  // Administrative
  'tactical.admin.audit': 'View audit logs',
  'tactical.admin.settings': 'Modify tactical settings',
  'tactical.admin.permissions': 'Manage user permissions'
} as const;

export type TacticalPermissionKey = keyof typeof TACTICAL_PERMISSIONS;

// Permission sets by role
export const ROLE_PERMISSIONS: Record<string, TacticalPermissionKey[]> = {
  'HEAD_COACH': [
    // Full access to all tactical features
    'tactical.play.create',
    'tactical.play.edit',
    'tactical.play.delete',
    'tactical.play.share',
    'tactical.play.duplicate',
    'tactical.formation.create',
    'tactical.formation.modify',
    'tactical.formation.delete',
    'tactical.video.upload',
    'tactical.video.analyze',
    'tactical.video.annotate',
    'tactical.video.share',
    'tactical.ai.analyze',
    'tactical.ai.suggestions',
    'tactical.ai.apply',
    'tactical.ai.history',
    'tactical.analytics.view',
    'tactical.analytics.export',
    'tactical.analytics.advanced',
    'tactical.calendar.schedule',
    'tactical.calendar.modify',
    'tactical.calendar.view',
    'tactical.export.pdf',
    'tactical.export.video',
    'tactical.export.presentation',
    'tactical.export.bulk',
    'tactical.admin.audit',
    'tactical.admin.settings',
    'tactical.admin.permissions'
  ],
  
  'ASSISTANT_COACH': [
    // Can create, edit, and share plays, but limited deletion
    'tactical.play.create',
    'tactical.play.edit',
    'tactical.play.share',
    'tactical.play.duplicate',
    'tactical.formation.modify',
    'tactical.video.upload',
    'tactical.video.analyze',
    'tactical.video.annotate',
    'tactical.video.share',
    'tactical.ai.analyze',
    'tactical.ai.suggestions',
    'tactical.ai.apply',
    'tactical.ai.history',
    'tactical.analytics.view',
    'tactical.analytics.export',
    'tactical.calendar.schedule',
    'tactical.calendar.modify',
    'tactical.calendar.view',
    'tactical.export.pdf',
    'tactical.export.video',
    'tactical.export.presentation'
  ],
  
  'VIDEO_COACH': [
    // Specializes in video analysis with play review access
    'tactical.play.edit', // Limited to video-related aspects
    'tactical.play.share',
    'tactical.video.upload',
    'tactical.video.analyze',
    'tactical.video.annotate',
    'tactical.video.share',
    'tactical.ai.analyze',
    'tactical.ai.suggestions',
    'tactical.ai.history',
    'tactical.analytics.view',
    'tactical.calendar.view',
    'tactical.export.pdf',
    'tactical.export.video'
  ],
  
  'PLAYER': [
    // View assigned plays and learning mode access
    'tactical.calendar.view',
    'tactical.analytics.view' // Only own performance
  ],
  
  'TEAM_MANAGER': [
    // View access and schedule practices
    'tactical.calendar.schedule',
    'tactical.calendar.view',
    'tactical.analytics.view',
    'tactical.export.pdf'
  ]
};

// Play visibility levels
export type PlayVisibility = 'public' | 'team-only' | 'position-specific' | 'coaching-staff' | 'private';

export interface PlayAccessControl {
  visibility: PlayVisibility;
  allowedRoles: string[];
  allowedPositions?: string[];
  allowedUserIds?: string[];
  restrictedUsers?: string[];
}

// AI usage limits by role
export const AI_USAGE_LIMITS: Record<string, { daily: number; monthly: number; features: string[] }> = {
  'HEAD_COACH': { daily: 50, monthly: 1500, features: ['all'] },
  'ASSISTANT_COACH': { daily: 30, monthly: 900, features: ['analysis', 'suggestions', 'optimization'] },
  'VIDEO_COACH': { daily: 25, monthly: 750, features: ['video_analysis', 'pattern_detection'] },
  'PLAYER': { daily: 5, monthly: 150, features: ['basic_analysis'] },
  'TEAM_MANAGER': { daily: 10, monthly: 300, features: ['basic_analysis'] }
};

// Audit log entry interface
export interface TacticalAuditLog {
  id: string;
  userId: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class TacticalAuthorizationService {
  private static instance: TacticalAuthorizationService;
  private auditLogs: TacticalAuditLog[] = [];
  private aiUsageTracking: Map<string, { daily: number; monthly: number; lastReset: Date }> = new Map();

  public static getInstance(): TacticalAuthorizationService {
    if (!TacticalAuthorizationService.instance) {
      TacticalAuthorizationService.instance = new TacticalAuthorizationService();
    }
    return TacticalAuthorizationService.instance;
  }

  private constructor() {
    // Load audit logs from storage if available
    this.loadAuditLogs();
    this.initializeUsageTracking();
  }

  /**
   * Check if user has specific tactical permission
   */
  public hasPermission(user: User | null, permission: TacticalPermissionKey): boolean {
    if (!user) return false;

    // Get user's role - check both role.name and direct role strings
    const userRole = this.getUserRole(user);
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    
    const hasPermission = rolePermissions.includes(permission);
    
    // Log permission check for audit
    this.logAction(user.id, userRole, 'permission_check', 'tactical_permission', {
      permission,
      granted: hasPermission
    });

    return hasPermission;
  }

  /**
   * Check multiple permissions (user must have all)
   */
  public hasAllPermissions(user: User | null, permissions: TacticalPermissionKey[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if user has any of the specified permissions
   */
  public hasAnyPermission(user: User | null, permissions: TacticalPermissionKey[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * Get user's tactical role with fallback logic
   */
  private getUserRole(user: User): string {
    // In mock mode, map basic roles to tactical roles
    const isMockMode = typeof window !== 'undefined' && 
      (process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true' || 
       process.env.NEXT_PUBLIC_MOCK_AUTH === 'true');
    
    // Check role.name first
    if (user.role?.name) {
      const roleName = user.role.name.toUpperCase().replace(/\s+/g, '_');
      
      // Map mock roles to tactical roles
      if (isMockMode) {
        switch (roleName) {
          case 'COACH':
            return 'HEAD_COACH';
          case 'ASSISTANT_COACH':
            return 'ASSISTANT_COACH';
          case 'PLAYER':
            return 'PLAYER';
          case 'PARENT':
            return 'PLAYER'; // Parents get player-level access for viewing
          case 'MEDICAL_STAFF':
          case 'PHYSICAL_TRAINER':
            return 'ASSISTANT_COACH'; // Medical/training staff get assistant coach level
          case 'ADMIN':
          case 'CLUB_ADMIN':
            return 'HEAD_COACH'; // Admins get full access
          default:
            if (ROLE_PERMISSIONS[roleName]) {
              return roleName;
            }
        }
      }
      
      if (ROLE_PERMISSIONS[roleName]) {
        return roleName;
      }
    }

    // Check team roles for more specific permissions
    if (user.teams && Array.isArray(user.teams) && user.teams.length > 0) {
      for (const team of user.teams) {
        if (team.role) {
          const teamRole = team.role.toUpperCase().replace(/\s+/g, '_');
          if (teamRole === 'HEAD_COACH') return 'HEAD_COACH';
          if (teamRole === 'ASSISTANT_COACH') return 'ASSISTANT_COACH';
        }
      }
    }

    // Fallback to role string or roles array
    if (typeof (user as any).role === 'string') {
      const roleName = (user as any).role.toUpperCase().replace(/\s+/g, '_');
      if (ROLE_PERMISSIONS[roleName]) {
        return roleName;
      }
    }

    // Check roles array
    if ((user as any).roles && Array.isArray((user as any).roles)) {
      for (const role of (user as any).roles) {
        const roleName = role.toUpperCase().replace(/\s+/g, '_');
        if (ROLE_PERMISSIONS[roleName]) {
          return roleName;
        }
      }
    }

    // Default to PLAYER if no matching role found
    return 'PLAYER';
  }

  /**
   * Check if user can access a specific play
   */
  public canAccessPlay(user: User | null, play: TacticalPlayData, accessControl?: PlayAccessControl): boolean {
    if (!user || !play) return false;

    const userRole = this.getUserRole(user);

    // Default access control if not specified
    const ac = accessControl || {
      visibility: 'team-only' as PlayVisibility,
      allowedRoles: ['HEAD_COACH', 'ASSISTANT_COACH', 'PLAYER']
    };

    // Check visibility level
    switch (ac.visibility) {
      case 'public':
        return true;
        
      case 'private':
        return ac.allowedUserIds?.includes(user.id) || false;
        
      case 'coaching-staff':
        return ['HEAD_COACH', 'ASSISTANT_COACH', 'VIDEO_COACH'].includes(userRole);
        
      case 'position-specific':
        const userPosition = (user as any).position;
        return ac.allowedPositions?.includes(userPosition) || ac.allowedRoles.includes(userRole);
        
      case 'team-only':
      default:
        return ac.allowedRoles.includes(userRole) && !ac.restrictedUsers?.includes(user.id);
    }
  }

  /**
   * Check AI usage limits
   */
  public canUseAI(user: User | null, feature?: string): { allowed: boolean; remaining: number; resetTime: Date } {
    if (!user) return { allowed: false, remaining: 0, resetTime: new Date() };

    const userRole = this.getUserRole(user);
    const limits = AI_USAGE_LIMITS[userRole] || AI_USAGE_LIMITS['PLAYER'];
    
    // Check if feature is allowed for this role
    if (feature && !limits.features.includes('all') && !limits.features.includes(feature)) {
      return { allowed: false, remaining: 0, resetTime: new Date() };
    }

    const usage = this.aiUsageTracking.get(user.id) || { daily: 0, monthly: 0, lastReset: new Date() };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastResetDate = new Date(usage.lastReset.getFullYear(), usage.lastReset.getMonth(), usage.lastReset.getDate());

    // Reset daily count if it's a new day
    if (today.getTime() > lastResetDate.getTime()) {
      usage.daily = 0;
      usage.lastReset = now;
    }

    // Reset monthly count if it's a new month
    if (now.getMonth() !== usage.lastReset.getMonth() || now.getFullYear() !== usage.lastReset.getFullYear()) {
      usage.monthly = 0;
      usage.lastReset = now;
    }

    const dailyRemaining = Math.max(0, limits.daily - usage.daily);
    const monthlyRemaining = Math.max(0, limits.monthly - usage.monthly);
    const remaining = Math.min(dailyRemaining, monthlyRemaining);

    const nextResetDate = new Date(today);
    nextResetDate.setDate(nextResetDate.getDate() + 1);

    return {
      allowed: remaining > 0,
      remaining,
      resetTime: nextResetDate
    };
  }

  /**
   * Track AI usage
   */
  public trackAIUsage(user: User, feature: string): void {
    const usage = this.aiUsageTracking.get(user.id) || { daily: 0, monthly: 0, lastReset: new Date() };
    usage.daily += 1;
    usage.monthly += 1;
    this.aiUsageTracking.set(user.id, usage);

    // Log AI usage
    this.logAction(user.id, this.getUserRole(user), 'ai_usage', 'ai_feature', {
      feature,
      dailyUsage: usage.daily,
      monthlyUsage: usage.monthly
    });

    // Persist usage tracking
    this.saveUsageTracking();
  }

  /**
   * Get user's permissions for UI rendering
   */
  public getUserPermissions(user: User | null): {
    permissions: TacticalPermissionKey[];
    role: string;
    canCreatePlays: boolean;
    canDeletePlays: boolean;
    canUseAI: boolean;
    canExport: boolean;
    canViewAnalytics: boolean;
    aiLimits: { daily: number; monthly: number; remaining: number };
  } {
    if (!user) {
      return {
        permissions: [],
        role: 'NONE',
        canCreatePlays: false,
        canDeletePlays: false,
        canUseAI: false,
        canExport: false,
        canViewAnalytics: false,
        aiLimits: { daily: 0, monthly: 0, remaining: 0 }
      };
    }

    const userRole = this.getUserRole(user);
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    const aiCheck = this.canUseAI(user);

    return {
      permissions,
      role: userRole,
      canCreatePlays: this.hasPermission(user, 'tactical.play.create'),
      canDeletePlays: this.hasPermission(user, 'tactical.play.delete'),
      canUseAI: aiCheck.allowed,
      canExport: this.hasPermission(user, 'tactical.export.pdf'),
      canViewAnalytics: this.hasPermission(user, 'tactical.analytics.view'),
      aiLimits: {
        daily: AI_USAGE_LIMITS[userRole]?.daily || 0,
        monthly: AI_USAGE_LIMITS[userRole]?.monthly || 0,
        remaining: aiCheck.remaining
      }
    };
  }

  /**
   * Log user actions for audit trail
   */
  private logAction(
    userId: string,
    userRole: string,
    action: string,
    resource: string,
    details: Record<string, any> = {},
    resourceId?: string
  ): void {
    const auditEntry: TacticalAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userRole,
      action,
      resource,
      resourceId,
      details,
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    this.auditLogs.push(auditEntry);
    
    // Keep only last 1000 entries to prevent memory issues
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    // Persist audit logs
    this.saveAuditLogs();
  }

  /**
   * Get audit logs with filtering
   */
  public getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): TacticalAuditLog[] {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.resource) {
        logs = logs.filter(log => log.resource === filters.resource);
      }
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  }

  /**
   * Export audit logs
   */
  public exportAuditLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getAuditLogs();
    
    if (format === 'csv') {
      const headers = ['ID', 'User ID', 'Role', 'Action', 'Resource', 'Resource ID', 'Timestamp', 'Details'];
      const csvData = logs.map(log => [
        log.id,
        log.userId,
        log.userRole,
        log.action,
        log.resource,
        log.resourceId || '',
        log.timestamp.toISOString(),
        JSON.stringify(log.details)
      ]);
      
      return [headers, ...csvData].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Clear old audit logs (for maintenance)
   */
  public clearOldAuditLogs(daysToKeep: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const originalLength = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter(log => log.timestamp >= cutoffDate);
    const removedCount = originalLength - this.auditLogs.length;

    if (removedCount > 0) {
      this.saveAuditLogs();
    }

    return removedCount;
  }

  // Private utility methods
  private getClientIP(): string {
    // In a real application, this would be handled server-side
    return 'client-side';
  }

  private loadAuditLogs(): void {
    try {
      const stored = localStorage.getItem('tactical_audit_logs');
      if (stored) {
        const logs = JSON.parse(stored);
        this.auditLogs = logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load audit logs:', error);
    }
  }

  private saveAuditLogs(): void {
    try {
      localStorage.setItem('tactical_audit_logs', JSON.stringify(this.auditLogs));
    } catch (error) {
      console.warn('Failed to save audit logs:', error);
    }
  }

  private initializeUsageTracking(): void {
    try {
      const stored = localStorage.getItem('tactical_ai_usage');
      if (stored) {
        const usage = JSON.parse(stored);
        for (const [userId, data] of Object.entries(usage as any)) {
          this.aiUsageTracking.set(userId, {
            ...(data as any),
            lastReset: new Date((data as any).lastReset)
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load AI usage tracking:', error);
    }
  }

  private saveUsageTracking(): void {
    try {
      const usage: Record<string, any> = {};
      for (const [userId, data] of this.aiUsageTracking.entries()) {
        usage[userId] = data;
      }
      localStorage.setItem('tactical_ai_usage', JSON.stringify(usage));
    } catch (error) {
      console.warn('Failed to save AI usage tracking:', error);
    }
  }
}

// Export singleton instance
export const tacticalAuthService = TacticalAuthorizationService.getInstance();