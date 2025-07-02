import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export enum PerformanceMetricType {
  SPEED = 'speed',
  POWER = 'power',
  ENDURANCE = 'endurance',
  TECHNIQUE = 'technique',
  CONSISTENCY = 'consistency',
  MENTAL_FOCUS = 'mental_focus',
  TEAM_PLAY = 'team_play',
  LEADERSHIP = 'leadership',
  OVERALL = 'overall',
}

export enum PerformancePeriod {
  SESSION = 'session',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEASONAL = 'seasonal',
}

export enum PerformanceTrend {
  IMPROVING = 'improving',
  CONSISTENT = 'consistent',
  DECLINING = 'declining',
  VARIABLE = 'variable',
}

export interface PerformanceMetric {
  metric_type: PerformanceMetricType;
  current_value: number;
  previous_value?: number;
  target_value?: number;
  trend: PerformanceTrend;
  notes?: string;
}

export interface Goal {
  id: string;
  description: string;
  target_date?: string;
  status: 'pending' | 'in_progress' | 'achieved' | 'missed';
  progress?: number;
}

export interface ActionItem {
  id: string;
  description: string;
  assigned_to: string;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
}

export interface TrainingRecommendation {
  area: string;
  exercises: string[];
  frequency?: string;
  notes?: string;
}

export interface PerformanceDiscussion {
  id: string;
  conversation_id: string;
  player_id: string;
  coach_id: string;
  training_discussion_id?: string;
  period: PerformancePeriod;
  start_date: string;
  end_date: string;
  organization_id: string;
  team_id?: string;
  performance_metrics: PerformanceMetric[];
  goals?: Goal[];
  action_items?: ActionItem[];
  strengths?: string[];
  areas_for_improvement?: string[];
  training_recommendations?: TrainingRecommendation[];
  overall_assessment?: string;
  overall_rating?: number;
  is_confidential: boolean;
  parent_can_view: boolean;
  shared_with?: string[];
  scheduled_review_date?: string;
  completed_at?: string;
  completed_by?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  conversation?: any;
  training_discussion?: any;
}

export interface PerformanceFeedback {
  id: string;
  performance_discussion_id: string;
  provided_by: string;
  feedback_type: 'coach' | 'player' | 'parent' | 'peer';
  feedback_content: string;
  specific_metrics?: {
    metric_type: PerformanceMetricType;
    rating: number;
    comments?: string;
  }[];
  attachments?: {
    type: 'video' | 'image' | 'document';
    url: string;
    title?: string;
    description?: string;
  }[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePerformanceDiscussionRequest {
  playerId: string;
  trainingDiscussionId?: string;
  period: PerformancePeriod;
  startDate: string;
  endDate: string;
  performanceMetrics: PerformanceMetric[];
  goals?: Omit<Goal, 'id' | 'status' | 'progress'>[];
  strengths?: string[];
  areasForImprovement?: string[];
  trainingRecommendations?: TrainingRecommendation[];
  overallAssessment?: string;
  overallRating?: number;
  isConfidential?: boolean;
  parentCanView?: boolean;
  sharedWith?: string[];
  scheduledReviewDate?: string;
}

export interface AddPerformanceFeedbackRequest {
  discussionId: string;
  feedbackContent: string;
  specificMetrics?: {
    metric_type: PerformanceMetricType;
    rating: number;
    comments?: string;
  }[];
  attachments?: {
    type: 'video' | 'image' | 'document';
    url: string;
    title?: string;
    description?: string;
  }[];
  isPrivate?: boolean;
}

export interface UpdatePerformanceMetricsRequest {
  discussionId: string;
  metrics: {
    metric_type: PerformanceMetricType;
    current_value: number;
    trend: PerformanceTrend;
    notes?: string;
  }[];
}

export interface AddActionItemRequest {
  discussionId: string;
  description: string;
  assignedTo: string;
  dueDate?: string;
}

export interface CompleteActionItemRequest {
  discussionId: string;
  actionId: string;
}

export interface PerformanceTrendData {
  metric_type: PerformanceMetricType;
  data_points: { date: string; value: number; notes?: string }[];
  trend: PerformanceTrend;
  average_value: number;
}

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api';

export const performanceApi = createApi({
  reducerPath: 'performanceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_GATEWAY_URL}/communication/performance-discussions`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['PerformanceDiscussion', 'PerformanceFeedback', 'PerformanceTrend'],
  endpoints: (builder) => ({
    // Create performance discussion
    createPerformanceDiscussion: builder.mutation<PerformanceDiscussion, CreatePerformanceDiscussionRequest>({
      query: (body) => ({
        url: '/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PerformanceDiscussion'],
    }),

    // Get performance discussion by ID
    getPerformanceDiscussion: builder.query<PerformanceDiscussion, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'PerformanceDiscussion', id }],
    }),

    // Get player's performance discussions
    getPlayerPerformanceDiscussions: builder.query<PerformanceDiscussion[], {
      playerId: string;
      period?: PerformancePeriod;
      limit?: number;
    }>({
      query: ({ playerId, period, limit }) => ({
        url: `/player/${playerId}`,
        params: { period, limit },
      }),
      providesTags: (result) => 
        result
          ? [
              ...result.map(({ id }) => ({ type: 'PerformanceDiscussion' as const, id })),
              { type: 'PerformanceDiscussion', id: 'LIST' },
            ]
          : [{ type: 'PerformanceDiscussion', id: 'LIST' }],
    }),

    // Add performance feedback
    addPerformanceFeedback: builder.mutation<PerformanceFeedback, AddPerformanceFeedbackRequest>({
      query: ({ discussionId, ...body }) => ({
        url: `/${discussionId}/feedback`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { discussionId }) => [
        { type: 'PerformanceDiscussion', id: discussionId },
      ],
    }),

    // Update performance metrics
    updatePerformanceMetrics: builder.mutation<PerformanceDiscussion, UpdatePerformanceMetricsRequest>({
      query: ({ discussionId, ...body }) => ({
        url: `/${discussionId}/metrics`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { discussionId }) => [
        { type: 'PerformanceDiscussion', id: discussionId },
      ],
    }),

    // Add action item
    addActionItem: builder.mutation<PerformanceDiscussion, AddActionItemRequest>({
      query: ({ discussionId, ...body }) => ({
        url: `/${discussionId}/action-items`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { discussionId }) => [
        { type: 'PerformanceDiscussion', id: discussionId },
      ],
    }),

    // Complete action item
    completeActionItem: builder.mutation<PerformanceDiscussion, CompleteActionItemRequest>({
      query: ({ discussionId, actionId }) => ({
        url: `/${discussionId}/action-items/${actionId}/complete`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, { discussionId }) => [
        { type: 'PerformanceDiscussion', id: discussionId },
      ],
    }),

    // Get upcoming reviews
    getUpcomingReviews: builder.query<PerformanceDiscussion[], { daysAhead?: number }>({
      query: ({ daysAhead = 7 }) => ({
        url: '/organization/upcoming',
        params: { daysAhead },
      }),
      providesTags: ['PerformanceDiscussion'],
    }),

    // Get performance trends
    getPerformanceTrends: builder.query<PerformanceTrendData, {
      playerId: string;
      metricType: PerformanceMetricType;
      startDate: string;
      endDate: string;
    }>({
      query: ({ playerId, metricType, startDate, endDate }) => ({
        url: `/player/${playerId}/trends/${metricType}`,
        params: { startDate, endDate },
      }),
      providesTags: ['PerformanceTrend'],
    }),

    // Complete performance discussion
    completePerformanceDiscussion: builder.mutation<PerformanceDiscussion, string>({
      query: (id) => ({
        url: `/${id}/complete`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'PerformanceDiscussion', id },
      ],
    }),
  }),
});

export const {
  useCreatePerformanceDiscussionMutation,
  useGetPerformanceDiscussionQuery,
  useGetPlayerPerformanceDiscussionsQuery,
  useAddPerformanceFeedbackMutation,
  useUpdatePerformanceMetricsMutation,
  useAddActionItemMutation,
  useCompleteActionItemMutation,
  useGetUpcomingReviewsQuery,
  useGetPerformanceTrendsQuery,
  useCompletePerformanceDiscussionMutation,
} = performanceApi;