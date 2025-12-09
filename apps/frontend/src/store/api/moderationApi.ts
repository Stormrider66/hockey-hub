import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Moderation Types
export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged'
}

export enum ModerationReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  HATE_SPEECH = 'hate_speech',
  VIOLENCE = 'violence',
  PRIVACY_VIOLATION = 'privacy_violation',
  COPYRIGHT = 'copyright',
  OTHER = 'other'
}

export enum ModerationAction {
  NONE = 'none',
  WARNING = 'warning',
  DELETE_MESSAGE = 'delete_message',
  MUTE_USER = 'mute_user',
  SUSPEND_USER = 'suspend_user',
  BAN_USER = 'ban_user'
}

export enum UserModerationStatus {
  ACTIVE = 'active',
  WARNING = 'warning',
  MUTED = 'muted',
  SUSPENDED = 'suspended',
  BANNED = 'banned'
}

export enum UserModerationReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  INAPPROPRIATE_BEHAVIOR = 'inappropriate_behavior',
  REPEATED_VIOLATIONS = 'repeated_violations',
  HATE_SPEECH = 'hate_speech',
  PRIVACY_VIOLATION = 'privacy_violation',
  OTHER = 'other'
}

export enum RuleType {
  KEYWORD_FILTER = 'keyword_filter',
  PATTERN_MATCH = 'pattern_match',
  CONTENT_LENGTH = 'content_length',
  RATE_LIMIT = 'rate_limit',
  ATTACHMENT_FILTER = 'attachment_filter',
  LINK_FILTER = 'link_filter'
}

export enum RuleAction {
  FLAG_FOR_REVIEW = 'flag_for_review',
  AUTO_DELETE = 'auto_delete',
  AUTO_MUTE = 'auto_mute',
  REQUIRE_APPROVAL = 'require_approval',
  QUARANTINE = 'quarantine'
}

export enum RuleSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Interfaces
export interface ModeratedContent {
  id: string;
  messageId: string;
  reporterId: string;
  moderatorId?: string;
  status: ModerationStatus;
  reason: ModerationReason;
  description?: string;
  action: ModerationAction;
  moderatorNotes?: string;
  reviewedAt?: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    automaticFlags?: string[];
    severity?: number;
  };
  createdAt: string;
  updatedAt: string;
  message?: {
    id: string;
    content: string;
    senderId: string;
    conversationId: string;
    createdAt: string;
  };
}

export interface UserModeration {
  id: string;
  userId: string;
  moderatorId: string;
  status: UserModerationStatus;
  reason: UserModerationReason;
  description: string;
  moderatorNotes?: string;
  expiresAt?: string;
  isActive: boolean;
  restrictions?: {
    canSendMessages?: boolean;
    canJoinConversations?: boolean;
    canCreateConversations?: boolean;
    canUploadFiles?: boolean;
    canReact?: boolean;
  };
  metadata?: {
    appealable?: boolean;
    appealDeadline?: string;
    relatedContentId?: string;
    warningCount?: number;
    escalationLevel?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ModerationRule {
  id: string;
  name: string;
  description: string;
  ruleType: RuleType;
  action: RuleAction;
  severity: RuleSeverity;
  criteria: {
    keywords?: string[];
    patterns?: string[];
    maxLength?: number;
    maxMessagesPerMinute?: number;
    allowedFileTypes?: string[];
    blockedDomains?: string[];
    customRegex?: string;
  };
  exceptions?: {
    roles?: string[];
    users?: string[];
    conversationTypes?: string[];
    timeRanges?: Array<{
      start: string;
      end: string;
      days: string[];
    }>;
  };
  isActive: boolean;
  priority: number;
  expiresAt?: string;
  createdBy: string;
  updatedBy?: string;
  statistics?: {
    triggeredCount?: number;
    lastTriggered?: string;
    falsePositives?: number;
    effectiveness?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ModerationStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  moderatedUsers: number;
  topReasons: Array<{ reason: string; count: number }>;
  topActions: Array<{ action: string; count: number }>;
}

// Request Types
export interface ReportContentRequest {
  messageId: string;
  reason: ModerationReason;
  description?: string;
  metadata?: any;
}

export interface ModerationDecisionRequest {
  moderatedContentId: string;
  status: ModerationStatus;
  action: ModerationAction;
  moderatorNotes?: string;
}

export interface UserModerationRequest {
  userId: string;
  status: UserModerationStatus;
  reason: UserModerationReason;
  description: string;
  expiresAt?: string;
  restrictions?: any;
  moderatorNotes?: string;
}

export interface CreateRuleRequest {
  name: string;
  description: string;
  ruleType: RuleType;
  action: RuleAction;
  severity: RuleSeverity;
  criteria: any;
  exceptions?: any;
  priority?: number;
  expiresAt?: string;
}

export interface UpdateRuleRequest extends Partial<CreateRuleRequest> {
  isActive?: boolean;
}

// Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const moderationApi = createApi({
  reducerPath: 'moderationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api'}/communication/moderation`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['ModeratedContent', 'UserModeration', 'ModerationRule', 'ModerationStats'],
  endpoints: (builder) => ({
    // Content Moderation
    reportContent: builder.mutation<ApiResponse<ModeratedContent>, ReportContentRequest>({
      query: (data) => ({
        url: '/report',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ModeratedContent', 'ModerationStats'],
    }),

    getPendingContent: builder.query<ApiResponse<PaginatedResponse<ModeratedContent>>, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: `/pending?page=${page}&limit=${limit}`,
      }),
      providesTags: ['ModeratedContent'],
    }),

    makeDecision: builder.mutation<ApiResponse<ModeratedContent>, ModerationDecisionRequest>({
      query: (data) => ({
        url: '/decide',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ModeratedContent', 'ModerationStats'],
    }),

    getModerationHistory: builder.query<ApiResponse<PaginatedResponse<ModeratedContent>>, { messageId?: string; page?: number; limit?: number }>({
      query: ({ messageId, page = 1, limit = 20 } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (messageId) {
          params.append('messageId', messageId);
        }
        return {
          url: `/history?${params.toString()}`,
        };
      },
      providesTags: ['ModeratedContent'],
    }),

    // User Moderation
    moderateUser: builder.mutation<ApiResponse<UserModeration>, UserModerationRequest>({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['UserModeration', 'ModerationStats'],
    }),

    removeUserModeration: builder.mutation<ApiResponse<string>, string>({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UserModeration', 'ModerationStats'],
    }),

    getUserModerationStatus: builder.query<ApiResponse<UserModeration | null>, string>({
      query: (userId) => ({
        url: `/users/${userId}/status`,
      }),
      providesTags: ['UserModeration'],
    }),

    getModeratedUsers: builder.query<ApiResponse<PaginatedResponse<UserModeration>>, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: `/users?page=${page}&limit=${limit}`,
      }),
      providesTags: ['UserModeration'],
    }),

    // Moderation Rules
    createRule: builder.mutation<ApiResponse<ModerationRule>, CreateRuleRequest>({
      query: (data) => ({
        url: '/rules',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ModerationRule'],
    }),

    updateRule: builder.mutation<ApiResponse<ModerationRule>, { ruleId: string; updates: UpdateRuleRequest }>({
      query: ({ ruleId, updates }) => ({
        url: `/rules/${ruleId}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['ModerationRule'],
    }),

    deleteRule: builder.mutation<ApiResponse<string>, string>({
      query: (ruleId) => ({
        url: `/rules/${ruleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ModerationRule'],
    }),

    getRules: builder.query<ApiResponse<ModerationRule[]>, { isActive?: boolean }>({
      query: ({ isActive = true } = {}) => ({
        url: `/rules?isActive=${isActive}`,
      }),
      providesTags: ['ModerationRule'],
    }),

    // Statistics
    getModerationStats: builder.query<ApiResponse<ModerationStats>, { days?: number }>({
      query: ({ days = 30 } = {}) => ({
        url: `/stats?days=${days}`,
      }),
      providesTags: ['ModerationStats'],
    }),
  }),
});

export const {
  // Content Moderation
  useReportContentMutation,
  useGetPendingContentQuery,
  useMakeDecisionMutation,
  useGetModerationHistoryQuery,
  
  // User Moderation
  useModerateUserMutation,
  useRemoveUserModerationMutation,
  useGetUserModerationStatusQuery,
  useGetModeratedUsersQuery,
  
  // Moderation Rules
  useCreateRuleMutation,
  useUpdateRuleMutation,
  useDeleteRuleMutation,
  useGetRulesQuery,
  
  // Statistics
  useGetModerationStatsQuery,
} = moderationApi;