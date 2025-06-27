import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Types
export interface PlayerStats {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  position: string;
  stats: {
    physical: {
      verticalJump: { value: number; unit: string; percentile: number; trend: number };
      benchPress: { value: number; unit: string; percentile: number; trend: number };
      vo2Max: { value: number; unit: string; percentile: number; trend: number };
      sprint40m: { value: number; unit: string; percentile: number; trend: number };
      flexibility: { value: number; unit: string; percentile: number; trend: number };
    };
    training: {
      sessionsCompleted: number;
      totalHours: number;
      avgIntensity: number;
      attendance: number; // percentage
    };
    wellness: {
      avgHRV: number;
      avgSleepQuality: number;
      avgRecoveryScore: number;
      injuryDays: number;
    };
  };
  lastUpdated: string;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  totalPlayers: number;
  stats: {
    physical: {
      avgVerticalJump: number;
      avgBenchPress: number;
      avgVO2Max: number;
      avgSprint40m: number;
    };
    training: {
      totalSessions: number;
      avgAttendance: number;
      totalHours: number;
      completionRate: number;
    };
    performance: {
      improvementRate: number;
      topPerformers: { playerId: string; name: string; score: number }[];
      needsAttention: { playerId: string; name: string; reason: string }[];
    };
  };
  comparison: {
    vsLastMonth: number; // percentage change
    vsTeamAverage: number; // percentage difference
    ranking: number; // within organization
  };
}

export interface PerformanceTrend {
  date: string;
  metric: string;
  value: number;
  change: number;
}

export interface TrainingLoad {
  playerId: string;
  date: string;
  acuteLoad: number; // 7-day average
  chronicLoad: number; // 28-day average
  ratio: number; // acute:chronic ratio
  risk: 'low' | 'moderate' | 'high';
  recommendation: string;
}

export interface InjuryRisk {
  playerId: string;
  playerName: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  factors: {
    trainingLoad: number;
    fatigue: number;
    previousInjuries: number;
    testResults: number;
  };
  recommendations: string[];
}

export interface AnalyticsReport {
  reportId: string;
  type: 'player' | 'team' | 'physical' | 'training';
  title: string;
  dateRange: { start: string; end: string };
  summary: string;
  data: any; // Flexible based on report type
  charts: {
    type: 'line' | 'bar' | 'radar' | 'pie';
    data: any[];
    config: any;
  }[];
  insights: string[];
  createdAt: string;
}

// API configuration
const STATISTICS_SERVICE_URL = process.env.NEXT_PUBLIC_STATISTICS_SERVICE_URL || 'http://localhost:3007';

// Create the API slice
export const statisticsApi = createApi({
  reducerPath: 'statisticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${STATISTICS_SERVICE_URL}/api`,
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['PlayerStats', 'TeamStats', 'Report'],
  endpoints: (builder) => ({
    // Player Statistics
    getPlayerStats: builder.query<PlayerStats, string>({
      query: (playerId) => `/players/${playerId}/stats`,
      providesTags: (result, error, playerId) => [{ type: 'PlayerStats', id: playerId }],
    }),

    getPlayerStatsByTeam: builder.query<PlayerStats[], string>({
      query: (teamId) => `/teams/${teamId}/player-stats`,
      providesTags: ['PlayerStats'],
    }),

    getPlayerTrends: builder.query<PerformanceTrend[], { 
      playerId: string; 
      metric?: string; 
      days?: number 
    }>({
      query: ({ playerId, metric, days = 30 }) => ({
        url: `/players/${playerId}/trends`,
        params: { metric, days },
      }),
    }),

    // Team Statistics
    getTeamStats: builder.query<TeamStats, string>({
      query: (teamId) => `/teams/${teamId}/stats`,
      providesTags: (result, error, teamId) => [{ type: 'TeamStats', id: teamId }],
    }),

    getAllTeamsStats: builder.query<TeamStats[], void>({
      query: () => '/teams/stats',
      providesTags: ['TeamStats'],
    }),

    getTeamComparison: builder.query<{
      teams: TeamStats[];
      metrics: { name: string; values: number[] }[];
    }, string[]>({
      query: (teamIds) => ({
        url: '/teams/compare',
        params: { teamIds: teamIds.join(',') },
      }),
    }),

    // Training Load & Risk
    getTrainingLoad: builder.query<TrainingLoad, string>({
      query: (playerId) => `/players/${playerId}/training-load`,
    }),

    getTeamTrainingLoads: builder.query<TrainingLoad[], string>({
      query: (teamId) => `/teams/${teamId}/training-loads`,
    }),

    getInjuryRisk: builder.query<InjuryRisk, string>({
      query: (playerId) => `/players/${playerId}/injury-risk`,
    }),

    getTeamInjuryRisks: builder.query<InjuryRisk[], string>({
      query: (teamId) => `/teams/${teamId}/injury-risks`,
    }),

    // Analytics Reports
    generateReport: builder.mutation<AnalyticsReport, {
      type: 'player' | 'team' | 'physical' | 'training';
      entityId: string;
      dateRange?: { start: string; end: string };
      metrics?: string[];
    }>({
      query: (params) => ({
        url: '/reports/generate',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['Report'],
    }),

    getReports: builder.query<AnalyticsReport[], {
      type?: string;
      entityId?: string;
      limit?: number;
    }>({
      query: (params) => ({
        url: '/reports',
        params,
      }),
      providesTags: ['Report'],
    }),

    getReportById: builder.query<AnalyticsReport, string>({
      query: (reportId) => `/reports/${reportId}`,
      providesTags: (result, error, id) => [{ type: 'Report', id }],
    }),

    // Physical Test Analytics
    getTestAnalytics: builder.query<{
      summary: {
        totalTests: number;
        avgImprovement: number;
        completionRate: number;
      };
      byTestType: {
        testType: string;
        count: number;
        avgValue: number;
        avgImprovement: number;
      }[];
      topPerformers: {
        playerId: string;
        name: string;
        improvement: number;
        tests: { type: string; value: number; percentile: number }[];
      }[];
    }, { teamId?: string; dateRange?: { start: string; end: string } }>({
      query: (params) => ({
        url: '/analytics/physical-tests',
        params,
      }),
    }),

    // Performance Insights
    getPerformanceInsights: builder.query<{
      insights: {
        type: 'improvement' | 'concern' | 'milestone' | 'recommendation';
        priority: 'low' | 'medium' | 'high';
        title: string;
        description: string;
        affectedPlayers: string[];
        suggestedActions: string[];
      }[];
    }, string>({
      query: (teamId) => `/teams/${teamId}/insights`,
    }),

    // Benchmarks
    getBenchmarks: builder.query<{
      testType: string;
      benchmarks: {
        level: string;
        value: number;
        percentile: number;
      }[];
    }[], { position?: string; ageGroup?: string }>({
      query: (params) => ({
        url: '/benchmarks',
        params,
      }),
    }),
  }),
});

// Export hooks
export const {
  // Player Stats
  useGetPlayerStatsQuery,
  useGetPlayerStatsByTeamQuery,
  useGetPlayerTrendsQuery,
  
  // Team Stats
  useGetTeamStatsQuery,
  useGetAllTeamsStatsQuery,
  useGetTeamComparisonQuery,
  
  // Training Load & Risk
  useGetTrainingLoadQuery,
  useGetTeamTrainingLoadsQuery,
  useGetInjuryRiskQuery,
  useGetTeamInjuryRisksQuery,
  
  // Reports
  useGenerateReportMutation,
  useGetReportsQuery,
  useGetReportByIdQuery,
  
  // Analytics
  useGetTestAnalyticsQuery,
  useGetPerformanceInsightsQuery,
  useGetBenchmarksQuery,
} = statisticsApi;