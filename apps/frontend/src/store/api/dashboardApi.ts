import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Dashboard data types
interface UserDashboardData {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    avatar?: string;
    role: string;
    phoneNumber?: string;
    preferences: Record<string, unknown>;
    lastLogin?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  organization?: {
    id: string;
    name: string;
    subdomain: string;
    primaryColor?: string;
    secondaryColor?: string;
    logo?: string;
    settings: Record<string, unknown>;
    subscription: {
      plan: string;
      status: string;
      validUntil?: Date;
    };
  };
  teams: Array<{
    id: string;
    name: string;
    type: string;
    ageGroup?: string;
    season?: string;
    logo?: string;
    isActive: boolean;
  }>;
  permissions: string[];
  features: {
    hasCalendar: boolean;
    hasTraining: boolean;
    hasMedical: boolean;
    hasStatistics: boolean;
    hasCommunication: boolean;
    hasPayments: boolean;
    hasEquipment: boolean;
    hasAdmin: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

interface UserStatistics {
  totalUsers?: number;
  totalTeams?: number;
  totalOrganizations?: number;
  // Role-specific stats
  trainingSessions?: number;
  gamesPlayed?: number;
  injuryDays?: number;
  performanceScore?: number;
  teamWinRate?: number;
  playersCoached?: number;
  upcomingGames?: number;
  childrenCount?: number;
  upcomingEvents?: number;
  paymentsDue?: number;
  messagesUnread?: number;
  activeInjuries?: number;
  treatmentsToday?: number;
  playersMonitored?: number;
  wellnessAlerts?: number;
  equipmentIssues?: number;
  maintenanceDue?: number;
  inventoryAlerts?: number;
  fittingsScheduled?: number;
  sessionsToday?: number;
  playersAssigned?: number;
  assessmentsDue?: number;
  programsActive?: number;
  totalMembers?: number;
  activeTeams?: number;
  revenueThisMonth?: number;
  pendingApprovals?: number;
}

interface QuickAccessItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

interface NotificationSummary {
  unreadMessages: number;
  unreadNotifications: number;
  pendingTasks: number;
  upcomingEvents: number;
  total: number;
}

interface CommunicationSummary {
  conversations: {
    total: number;
    unreadCount: number;
    recentConversations: Array<{
      id: string;
      name: string;
      lastMessage?: {
        content: string;
        senderId: string;
        createdAt: Date;
      };
      unreadCount: number;
    }>;
  };
  messages: {
    totalUnread: number;
    mentions: number;
    recentMessages: Array<{
      id: string;
      content: string;
      senderId: string;
      conversationId: string;
      createdAt: Date;
    }>;
  };
  notifications: {
    total: number;
    unread: number;
    byType: Record<string, number>;
    recent: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      createdAt: Date;
      read: boolean;
    }>;
  };
}

interface StatisticsSummary {
  recentPerformance?: {
    games: number;
    wins: number;
    losses: number;
    goals: number;
    assists: number;
  };
  trends?: Array<{
    period: string;
    value: number;
    metric: string;
  }>;
  workload?: {
    weekly: number;
    monthly: number;
    status: 'low' | 'normal' | 'high' | 'critical';
  };
  wellness?: {
    average: number;
    trend: 'up' | 'down' | 'stable';
    alerts: number;
  };
  teamPerformance?: {
    ranking: number;
    winRate: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  topScorers?: Array<{
    playerId: string;
    name: string;
    goals: number;
    assists: number;
    points: number;
  }>;
  workloadSummary?: {
    total: number;
    average: number;
    peak: number;
  };
  workloadOverview?: {
    current: number;
    recommended: number;
    status: string;
  };
  playersAtRisk?: Array<{
    id: string;
    name: string;
    riskLevel: 'low' | 'medium' | 'high';
    factors: string[];
  }>;
  organizationOverview?: {
    totalMembers: number;
    activeTeams: number;
    revenue: number;
    growth: number;
  };
}

// Create the dashboard API slice
export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/dashboard',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['UserData', 'Statistics', 'QuickAccess', 'Notifications', 'Communication'],
  endpoints: (builder) => ({
    // Get complete user dashboard data (cached for 5 minutes)
    getUserDashboardData: builder.query<UserDashboardData, void>({
      query: () => '/user',
      providesTags: ['UserData'],
      // RTK Query will cache this for 5 minutes by default
      keepUnusedDataFor: 300,
    }),

    // Get user statistics (cached for 1 minute)
    getUserStatistics: builder.query<UserStatistics, void>({
      query: () => '/user/stats',
      providesTags: ['Statistics'],
      keepUnusedDataFor: 60,
    }),

    // Get quick access items (cached for 1 hour)
    getQuickAccessItems: builder.query<{ items: QuickAccessItem[] }, void>({
      query: () => '/user/quick-access',
      providesTags: ['QuickAccess'],
      keepUnusedDataFor: 3600,
    }),

    // Get notification summary (cached for 30 seconds)
    getNotificationSummary: builder.query<NotificationSummary, void>({
      query: () => '/user/notifications-summary',
      providesTags: ['Notifications'],
      keepUnusedDataFor: 30,
    }),

    // Get communication summary from Communication Service
    getCommunicationSummary: builder.query<CommunicationSummary, void>({
      query: () => ({
        url: '/communication',
        // This actually hits the Communication Service through API Gateway
        baseUrl: '/api/dashboard',
      }),
      providesTags: ['Communication'],
      keepUnusedDataFor: 60,
    }),

    // Get statistics summary from Statistics Service
    getStatisticsSummary: builder.query<StatisticsSummary, { type: 'player' | 'coach' | 'trainer' | 'admin'; id: string }>({
      query: ({ type, id }) => ({
        url: `/${type}/${id}`,
        // This hits the Statistics Service through API Gateway
        baseUrl: '/api/statistics/dashboard',
      }),
      providesTags: ['Statistics'],
      keepUnusedDataFor: type === 'admin' ? 600 : type === 'coach' ? 300 : 180,
    }),

    // Invalidate all dashboard caches (useful after updates)
    invalidateDashboardCache: builder.mutation<void, void>({
      query: () => ({
        url: '/cache/invalidate',
        method: 'POST',
      }),
      invalidatesTags: ['UserData', 'Statistics', 'QuickAccess', 'Notifications', 'Communication'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetUserDashboardDataQuery,
  useGetUserStatisticsQuery,
  useGetQuickAccessItemsQuery,
  useGetNotificationSummaryQuery,
  useGetCommunicationSummaryQuery,
  useGetStatisticsSummaryQuery,
  useInvalidateDashboardCacheMutation,
} = dashboardApi;

// Export endpoints for prefetching in server components
export const { endpoints: dashboardEndpoints } = dashboardApi;