import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface ChatAnalyticsOverview {
  totalMessages: number;
  totalConversations: number;
  activeUsers: number;
  messageGrowth: number;
  conversationGrowth: number;
  userGrowth: number;
  avgMessagesPerConversation: number;
  avgResponseTime: number;
}

export interface MessageVolumeData {
  date: string;
  messages: number;
  conversations: number;
  activeUsers: number;
}

export interface UserEngagementMetrics {
  totalUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  avgSessionDuration: number;
  avgMessagesPerUser: number;
  topActiveUsers: Array<{
    userId: string;
    userName: string;
    messageCount: number;
    conversationCount: number;
    lastActive: string;
  }>;
}

export interface ConversationAnalytics {
  typeBreakdown: Array<{
    type: string;
    count: number;
    percentage: number;
    avgParticipants: number;
    avgMessages: number;
  }>;
  popularConversations: Array<{
    id: string;
    name: string;
    type: string;
    participantCount: number;
    messageCount: number;
    lastActivity: string;
  }>;
  responseTimesByType: Array<{
    type: string;
    avgResponseTime: number;
    medianResponseTime: number;
  }>;
}

export interface UsagePatterns {
  hourlyActivity: Array<{
    hour: number;
    messageCount: number;
    activeUsers: number;
  }>;
  weeklyActivity: Array<{
    dayOfWeek: number;
    messageCount: number;
    activeUsers: number;
  }>;
  peakUsageTimes: Array<{
    timeRange: string;
    messageCount: number;
    description: string;
  }>;
}

export interface ContentAnalytics {
  messageTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  attachmentStats: {
    totalAttachments: number;
    imageCount: number;
    videoCount: number;
    audioCount: number;
    documentCount: number;
    avgFileSize: number;
  };
  reactionStats: {
    totalReactions: number;
    uniqueEmojis: number;
    topReactions: Array<{
      emoji: string;
      count: number;
    }>;
  };
  broadcastStats: {
    totalBroadcasts: number;
    totalRecipients: number;
    avgDeliveryRate: number;
    avgReadRate: number;
  };
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  organizationId?: string;
  teamId?: string;
  conversationType?: string;
  userId?: string;
}

export interface ExportData {
  overview: ChatAnalyticsOverview;
  messageVolume: MessageVolumeData[];
  userEngagement: UserEngagementMetrics;
  conversationAnalytics: ConversationAnalytics;
  usagePatterns: UsagePatterns;
  contentAnalytics: ContentAnalytics;
  exportedAt: string;
}

export const chatAnalyticsApi = createApi({
  reducerPath: 'chatAnalyticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL ? `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/communication/chat-analytics` : 'http://localhost:3000/api/communication/chat-analytics',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['ChatAnalytics'],
  endpoints: (builder) => ({
    getAnalyticsOverview: builder.query<ChatAnalyticsOverview, AnalyticsFilters>({
      query: (filters) => ({
        url: '/overview',
        params: filters,
      }),
      providesTags: ['ChatAnalytics'],
    }),

    getMessageVolumeData: builder.query<MessageVolumeData[], AnalyticsFilters>({
      query: (filters) => ({
        url: '/message-volume',
        params: filters,
      }),
      providesTags: ['ChatAnalytics'],
    }),

    getUserEngagementMetrics: builder.query<UserEngagementMetrics, AnalyticsFilters>({
      query: (filters) => ({
        url: '/user-engagement',
        params: filters,
      }),
      providesTags: ['ChatAnalytics'],
    }),

    getConversationAnalytics: builder.query<ConversationAnalytics, AnalyticsFilters>({
      query: (filters) => ({
        url: '/conversations',
        params: filters,
      }),
      providesTags: ['ChatAnalytics'],
    }),

    getUsagePatterns: builder.query<UsagePatterns, AnalyticsFilters>({
      query: (filters) => ({
        url: '/usage-patterns',
        params: filters,
      }),
      providesTags: ['ChatAnalytics'],
    }),

    getContentAnalytics: builder.query<ContentAnalytics, AnalyticsFilters>({
      query: (filters) => ({
        url: '/content',
        params: filters,
      }),
      providesTags: ['ChatAnalytics'],
    }),

    exportAnalyticsData: builder.query<ExportData, AnalyticsFilters>({
      query: (filters) => ({
        url: '/export',
        params: filters,
      }),
    }),
  }),
});

export const {
  useGetAnalyticsOverviewQuery,
  useGetMessageVolumeDataQuery,
  useGetUserEngagementMetricsQuery,
  useGetConversationAnalyticsQuery,
  useGetUsagePatternsQuery,
  useGetContentAnalyticsQuery,
  useExportAnalyticsDataQuery,
} = chatAnalyticsApi;