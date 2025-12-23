// @ts-nocheck - Express routes with multiple return paths
import { Router } from 'express';
import { createHash } from 'crypto';
// In tests we mock this module; in runtime fallback to a no-op that sets req.user if absent
import { extractUser as _extractUser } from '../middleware/authMiddleware';
const authMiddleware: any = (_req: any, _res: any, next: any) => typeof _extractUser === 'function' ? _extractUser(_req, _res, next) : next();
import { CachedUserRepository } from '../repositories/CachedUserRepository';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Organization } from '../entities/Organization';
import { Team } from '../entities/Team';

const router: Router = Router();

// Apply auth middleware to all dashboard routes
router.use(authMiddleware);

/**
 * GET /api/dashboard/user
 * Optimized endpoint for dashboard user data
 * Returns user profile, organization, teams, and permissions
 */
router.get('/user', async (req, res, next) => {
  try {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRepository = new CachedUserRepository();

    // Get full user data with relations - this is cached
    const user = await userRepository.findById(String(userId));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format response for dashboard consumption
    const dashboardData: any = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        avatar: (user as any).avatar || null,
        role: typeof (user as any).role === 'string' ? (user as any).role : (user as any).role?.name,
        phoneNumber: (user as any).phoneNumber || null,
        preferences: (user as any).preferences || {},
        lastLogin: (user as any).lastLogin || null,
        isActive: (user as any).isActive ?? true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      organization: (user as any).organization ? {
        id: (user as any).organization.id,
        name: (user as any).organization.name,
        subscription: {
          plan: (user as any).organization.subscriptionPlan || 'premium',
          status: (user as any).organization.subscriptionStatus || 'active',
        },
      } : null,
      teams: (user as any).teams?.map((team: any) => ({
        id: team.id,
        name: team.name,
        type: team.type,
        ageGroup: team.ageGroup,
        season: team.season,
        logo: team.logo,
        isActive: team.isActive,
      })) || [],
      permissions: (user as any).role?.permissions?.map((p: any) => p.name) || ['view_dashboard', 'submit_wellness'],
      features: {
        // Feature flags based on subscription and role
        hasCalendar: true,
        hasTraining: (user as any).role?.name !== 'PARENT',
        hasMedical: ['MEDICAL_STAFF', 'COACH', 'PLAYER'].includes((user as any).role?.name || ''),
        hasStatistics: true,
        hasCommunication: true,
        hasPayments: ['PARENT', 'CLUB_ADMIN', 'ADMIN'].includes((user as any).role?.name || ''),
        hasEquipment: ['EQUIPMENT_MANAGER', 'CLUB_ADMIN'].includes((user as any).role?.name || ''),
        hasAdmin: ['CLUB_ADMIN', 'ADMIN'].includes((user as any).role?.name || ''),
      },
      notifications: {
        // Placeholder for notification preferences
        email: (user as any).preferences?.emailNotifications !== false,
        push: (user as any).preferences?.pushNotifications !== false,
        sms: (user as any).preferences?.smsNotifications !== false,
      },
    };

    // Set cache headers and conditional GET for client-side caching
    res.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=300');
    const etag = 'W/"' + createHash('md5').update(JSON.stringify(dashboardData)).digest('hex') + '"';
    const lastModified = new Date(dashboardData.user.updatedAt || dashboardData.user.createdAt || Date.now());
    res.set('ETag', etag);
    res.set('Last-Modified', lastModified.toUTCString());
    const inm = req.headers['if-none-match'];
    const ims = req.headers['if-modified-since'];
    if ((typeof inm === 'string' && inm.split(',').map(s=>s.trim()).includes(etag)) ||
        (typeof ims === 'string' && new Date(ims).getTime() >= lastModified.getTime())) {
      return res.status(304).end();
    }
    res.json(dashboardData);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/dashboard/user/stats
 * Get user statistics for dashboard widgets
 */
router.get('/user/stats', async (req, res, next) => {
  try {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRepository = new CachedUserRepository();

    // Get user statistics - this is cached
    const stats = await userRepository.getUserStatistics(String(userId));

    // Add role-specific stats
    const roleStats = {
      ...stats,
      // Add placeholder stats based on role
      ...(((req.user as any).role) === 'PLAYER' && {
        trainingSessions: 0,
        gamesPlayed: 0,
        injuryDays: 0,
        performanceScore: 0,
      }),
      ...(((req.user as any).role) === 'COACH' && {
        teamWinRate: 0,
        playersCoached: stats.totalUsers || 0,
        upcomingGames: 0,
        trainingSessions: 0,
      }),
      ...(((req.user as any).role) === 'PARENT' && {
        childrenCount: 0,
        upcomingEvents: 0,
        paymentsDue: 0,
        messagesUnread: 0,
      }),
      ...(((req.user as any).role) === 'MEDICAL_STAFF' && {
        activeInjuries: 0,
        treatmentsToday: 0,
        playersMonitored: 0,
        wellnessAlerts: 0,
      }),
      ...(((req.user as any).role) === 'EQUIPMENT_MANAGER' && {
        equipmentIssues: 0,
        maintenanceDue: 0,
        inventoryAlerts: 0,
        fittingsScheduled: 0,
      }),
      ...(((req.user as any).role) === 'PHYSICAL_TRAINER' && {
        sessionsToday: 0,
        playersAssigned: 0,
        assessmentsDue: 0,
        programsActive: 0,
      }),
      ...(((req.user as any).role) === 'CLUB_ADMIN' && {
        totalMembers: stats.totalUsers || 0,
        activeTeams: stats.totalTeams || 0,
        revenueThisMonth: 0,
        pendingApprovals: 0,
      }),
    };

    res.set('Cache-Control', 'private, max-age=60'); // 1 minute
    res.json(roleStats);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/dashboard/user/quick-access
 * Get quick access items for dashboard
 */
router.get('/user/quick-access', async (req, res, next) => {
  try {
    if (!(req.user as any)?.userId && !(req.user as any)?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Role-based quick access items
    const quickAccessMap: Record<string, any[]> = {
      PLAYER: [
        { id: 'wellness', label: 'Submit Wellness', icon: 'Heart', path: '/wellness' },
        { id: 'schedule', label: 'My Schedule', icon: 'Calendar', path: '/schedule' },
        { id: 'training', label: 'Training Plan', icon: 'Dumbbell', path: '/training' },
        { id: 'stats', label: 'My Stats', icon: 'ChartBar', path: '/stats' },
      ],
      COACH: [
        { id: 'roster', label: 'Team Roster', icon: 'Users', path: '/roster' },
        { id: 'practice', label: 'Plan Practice', icon: 'ClipboardList', path: '/practice' },
        { id: 'analytics', label: 'Team Analytics', icon: 'ChartLine', path: '/analytics' },
        { id: 'calendar', label: 'Schedule', icon: 'Calendar', path: '/calendar' },
      ],
      PARENT: [
        { id: 'children', label: 'My Children', icon: 'Users', path: '/children' },
        { id: 'payments', label: 'Payments', icon: 'CreditCard', path: '/payments' },
        { id: 'calendar', label: 'Family Calendar', icon: 'Calendar', path: '/calendar' },
        { id: 'messages', label: 'Messages', icon: 'MessageSquare', path: '/messages' },
      ],
      MEDICAL_STAFF: [
        { id: 'injuries', label: 'Injury List', icon: 'Activity', path: '/injuries' },
        { id: 'treatments', label: 'Treatments', icon: 'Stethoscope', path: '/treatments' },
        { id: 'wellness', label: 'Wellness Alerts', icon: 'AlertCircle', path: '/wellness' },
        { id: 'reports', label: 'Medical Reports', icon: 'FileText', path: '/reports' },
      ],
      EQUIPMENT_MANAGER: [
        { id: 'inventory', label: 'Inventory', icon: 'Package', path: '/inventory' },
        { id: 'fittings', label: 'Fittings', icon: 'Ruler', path: '/fittings' },
        { id: 'maintenance', label: 'Maintenance', icon: 'Wrench', path: '/maintenance' },
        { id: 'orders', label: 'Orders', icon: 'ShoppingCart', path: '/orders' },
      ],
      PHYSICAL_TRAINER: [
        { id: 'sessions', label: 'Today\'s Sessions', icon: 'Activity', path: '/sessions' },
        { id: 'assessments', label: 'Assessments', icon: 'ClipboardCheck', path: '/assessments' },
        { id: 'programs', label: 'Programs', icon: 'FileText', path: '/programs' },
        { id: 'analytics', label: 'Performance', icon: 'TrendingUp', path: '/analytics' },
      ],
      CLUB_ADMIN: [
        { id: 'overview', label: 'Overview', icon: 'LayoutDashboard', path: '/overview' },
        { id: 'members', label: 'Members', icon: 'Users', path: '/members' },
        { id: 'finance', label: 'Finance', icon: 'DollarSign', path: '/finance' },
        { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
      ],
      ADMIN: [
        { id: 'organizations', label: 'Organizations', icon: 'Building', path: '/organizations' },
        { id: 'users', label: 'All Users', icon: 'Users', path: '/users' },
        { id: 'system', label: 'System Health', icon: 'Activity', path: '/system' },
        { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
      ],
    };

    const quickAccess = quickAccessMap[(req.user as any).role as string] || [];

    res.set('Cache-Control', 'private, max-age=3600'); // 1 hour - static data
    res.json({ items: quickAccess });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/user/notifications-summary
 * Get notification summary for dashboard header
 */
router.get('/user/notifications-summary', async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Placeholder notification summary
    // In production, this would aggregate from the Communication Service
    const summary = {
      unreadMessages: 0,
      unreadNotifications: 0,
      pendingTasks: 0,
      upcomingEvents: 0,
      total: 0,
    };

    res.set('Cache-Control', 'private, max-age=30'); // 30 seconds
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

export default router;