import { Router } from 'express';
import { authMiddleware } from '@hockey-hub/shared-lib';
import { CachedUserRepository } from '../repositories/CachedUserRepository';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Organization } from '../entities/Organization';
import { Team } from '../entities/Team';

const router = Router();

// Apply auth middleware to all dashboard routes
router.use(authMiddleware);

/**
 * GET /api/dashboard/user
 * Optimized endpoint for dashboard user data
 * Returns user profile, organization, teams, and permissions
 */
router.get('/user', async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRepository = new CachedUserRepository(
      AppDataSource.getRepository(User),
      AppDataSource.getRepository(Organization),
      AppDataSource.getRepository(Team)
    );

    // Get full user data with relations - this is cached
    const user = await userRepository.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format response for dashboard consumption
    const dashboardData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        role: user.role,
        phoneNumber: user.phoneNumber,
        preferences: user.preferences || {},
        lastLogin: user.lastLogin,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      organization: user.organization ? {
        id: user.organization.id,
        name: user.organization.name,
        subdomain: user.organization.subdomain,
        primaryColor: user.organization.primaryColor,
        secondaryColor: user.organization.secondaryColor,
        logo: user.organization.logo,
        settings: user.organization.settings || {},
        subscription: {
          plan: user.organization.subscriptionPlan,
          status: user.organization.subscriptionStatus,
          validUntil: user.organization.subscriptionValidUntil,
        },
      } : null,
      teams: user.teams?.map(team => ({
        id: team.id,
        name: team.name,
        type: team.type,
        ageGroup: team.ageGroup,
        season: team.season,
        logo: team.logo,
        isActive: team.isActive,
      })) || [],
      permissions: user.role?.permissions?.map(p => p.name) || [],
      features: {
        // Feature flags based on subscription and role
        hasCalendar: true,
        hasTraining: user.role?.name !== 'PARENT',
        hasMedical: ['MEDICAL_STAFF', 'COACH', 'PLAYER'].includes(user.role?.name || ''),
        hasStatistics: true,
        hasCommunication: true,
        hasPayments: ['PARENT', 'CLUB_ADMIN', 'ADMIN'].includes(user.role?.name || ''),
        hasEquipment: ['EQUIPMENT_MANAGER', 'CLUB_ADMIN'].includes(user.role?.name || ''),
        hasAdmin: ['CLUB_ADMIN', 'ADMIN'].includes(user.role?.name || ''),
      },
      notifications: {
        // Placeholder for notification preferences
        email: user.preferences?.emailNotifications !== false,
        push: user.preferences?.pushNotifications !== false,
        sms: user.preferences?.smsNotifications !== false,
      },
    };

    // Set cache headers for client-side caching
    res.set('Cache-Control', 'private, max-age=300'); // 5 minutes
    res.json(dashboardData);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/user/stats
 * Get user statistics for dashboard widgets
 */
router.get('/user/stats', async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRepository = new CachedUserRepository(
      AppDataSource.getRepository(User),
      AppDataSource.getRepository(Organization),
      AppDataSource.getRepository(Team)
    );

    // Get user statistics - this is cached
    const stats = await userRepository.getUserStatistics(req.user.id);

    // Add role-specific stats
    const roleStats = {
      ...stats,
      // Add placeholder stats based on role
      ...(req.user.role === 'PLAYER' && {
        trainingSessions: 0,
        gamesPlayed: 0,
        injuryDays: 0,
        performanceScore: 0,
      }),
      ...(req.user.role === 'COACH' && {
        teamWinRate: 0,
        playersCoached: stats.totalUsers || 0,
        upcomingGames: 0,
        trainingSessions: 0,
      }),
      ...(req.user.role === 'PARENT' && {
        childrenCount: 0,
        upcomingEvents: 0,
        paymentsDue: 0,
        messagesUnread: 0,
      }),
      ...(req.user.role === 'MEDICAL_STAFF' && {
        activeInjuries: 0,
        treatmentsToday: 0,
        playersMonitored: 0,
        wellnessAlerts: 0,
      }),
      ...(req.user.role === 'EQUIPMENT_MANAGER' && {
        equipmentIssues: 0,
        maintenanceDue: 0,
        inventoryAlerts: 0,
        fittingsScheduled: 0,
      }),
      ...(req.user.role === 'PHYSICAL_TRAINER' && {
        sessionsToday: 0,
        playersAssigned: 0,
        assessmentsDue: 0,
        programsActive: 0,
      }),
      ...(req.user.role === 'CLUB_ADMIN' && {
        totalMembers: stats.totalUsers || 0,
        activeTeams: stats.totalTeams || 0,
        revenueThisMonth: 0,
        pendingApprovals: 0,
      }),
    };

    res.set('Cache-Control', 'private, max-age=60'); // 1 minute
    res.json(roleStats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/user/quick-access
 * Get quick access items for dashboard
 */
router.get('/user/quick-access', async (req, res, next) => {
  try {
    if (!req.user?.id) {
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

    const quickAccess = quickAccessMap[req.user.role] || [];

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