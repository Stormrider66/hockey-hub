import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';
import { createMockEnabledBaseQuery } from './mockBaseQuery';

export interface Broadcast {
  id: string;
  coach_id: string;
  team_id: string;
  organization_id: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  target_type: 'team' | 'role' | 'custom';
  target_user_ids?: string[];
  target_roles?: string[];
  scheduled_at?: string;
  sent_at?: string;
  expires_at?: string;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
    mime_type: string;
  }>;
  metadata?: {
    require_acknowledgment?: boolean;
    allow_replies?: boolean;
    pin_duration_hours?: number;
    notification_channels?: string[];
  };
  total_recipients: number;
  delivered_count: number;
  read_count: number;
  acknowledged_count: number;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
  coach?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface BroadcastRecipient {
  id: string;
  broadcast_id: string;
  user_id: string;
  status: 'pending' | 'delivered' | 'read' | 'acknowledged' | 'failed';
  delivered_at?: string;
  read_at?: string;
  acknowledged_at?: string;
  acknowledgment_note?: string;
  failure_reason?: string;
  retry_count: number;
  notification_channels: string[];
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
}

export interface CreateBroadcastDto {
  teamId: string;
  organizationId: string;
  title: string;
  content: string;
  priority?: 'normal' | 'important' | 'urgent';
  targetType?: 'team' | 'role' | 'custom';
  targetUserIds?: string[];
  targetRoles?: string[];
  scheduledAt?: Date;
  expiresAt?: Date;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
    mime_type: string;
  }>;
  metadata?: {
    require_acknowledgment?: boolean;
    allow_replies?: boolean;
    pin_duration_hours?: number;
    notification_channels?: string[];
  };
}

export interface UpdateBroadcastDto {
  title?: string;
  content?: string;
  priority?: 'normal' | 'important' | 'urgent';
  targetType?: 'team' | 'role' | 'custom';
  targetUserIds?: string[];
  targetRoles?: string[];
  scheduledAt?: Date;
  expiresAt?: Date;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
    mime_type: string;
  }>;
  metadata?: Record<string, any>;
}

export interface BroadcastFilters {
  teamId?: string;
  coachId?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
}

export const communicationApi = createApi({
  reducerPath: 'communicationApi',
  baseQuery: createMockEnabledBaseQuery(
    fetchBaseQuery({
      baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api`,
      prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token;
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
      },
    })
  ),
  tagTypes: ['Broadcast', 'BroadcastRecipient'],
  endpoints: (builder) => ({
    // Broadcast endpoints
    createBroadcast: builder.mutation<Broadcast, CreateBroadcastDto>({
      query: (data) => ({
        url: '/broadcasts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Broadcast'],
    }),

    updateBroadcast: builder.mutation<Broadcast, { id: string; data: UpdateBroadcastDto }>({
      query: ({ id, data }) => ({
        url: `/broadcasts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Broadcast', id }],
    }),

    sendBroadcast: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/broadcasts/${id}/send`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Broadcast', id }],
    }),

    sendBroadcastNow: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/broadcasts/${id}/send`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Broadcast', id }],
    }),

    cancelBroadcast: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/broadcasts/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Broadcast', id }],
    }),

    deleteBroadcast: builder.mutation<void, string>({
      query: (id) => ({
        url: `/broadcasts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Broadcast'],
    }),

    getBroadcast: builder.query<Broadcast, string>({
      query: (id) => `/broadcasts/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Broadcast', id }],
    }),

    getBroadcasts: builder.query<{ broadcasts: Broadcast[]; total: number }, BroadcastFilters>({
      query: (filters) => ({
        url: '/broadcasts',
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.broadcasts.map(({ id }) => ({ type: 'Broadcast' as const, id })),
              { type: 'Broadcast', id: 'LIST' },
            ]
          : [{ type: 'Broadcast', id: 'LIST' }],
    }),

    getUserBroadcasts: builder.query<{
      broadcasts: Array<{
        broadcast: Broadcast;
        recipientStatus: string;
        readAt?: string;
        acknowledgedAt?: string;
      }>;
      unreadCount: number;
    }, void>({
      query: () => '/broadcasts/my-broadcasts',
      providesTags: ['Broadcast'],
    }),

    acknowledgeBroadcast: builder.mutation<{ message: string }, { broadcastId: string; note?: string }>({
      query: ({ broadcastId, note }) => ({
        url: `/broadcasts/${broadcastId}/acknowledge`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: (_result, _error, { broadcastId }) => [
        { type: 'Broadcast', id: broadcastId },
        { type: 'BroadcastRecipient' },
      ],
    }),

    markBroadcastAsRead: builder.mutation<{ message: string }, string>({
      query: (broadcastId) => ({
        url: `/broadcasts/${broadcastId}/read`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, broadcastId) => [
        { type: 'Broadcast', id: broadcastId },
        { type: 'BroadcastRecipient' },
      ],
    }),

    getRecipientStats: builder.query<{
      total: number;
      pending: number;
      delivered: number;
      read: number;
      acknowledged: number;
      failed: number;
    }, string>({
      query: (broadcastId) => `/broadcasts/${broadcastId}/recipients/stats`,
      providesTags: (_result, _error, broadcastId) => [{ type: 'Broadcast', id: broadcastId }],
    }),

    getBroadcastRecipients: builder.query<BroadcastRecipient[], string>({
      query: (broadcastId) => `/broadcasts/${broadcastId}/recipients`,
      providesTags: ['BroadcastRecipient'],
    }),

    // Team members endpoint (for broadcast composer)
    getTeamMembers: builder.query<Array<{
      id: string;
      name: string;
      email: string;
      roles: string[];
      avatar?: string;
    }>, string>({
      query: (teamId) => `/teams/${teamId}/members`,
    }),
  }),
});

export const {
  useCreateBroadcastMutation,
  useUpdateBroadcastMutation,
  useSendBroadcastMutation,
  useSendBroadcastNowMutation,
  useCancelBroadcastMutation,
  useDeleteBroadcastMutation,
  useGetBroadcastQuery,
  useGetBroadcastsQuery,
  useGetUserBroadcastsQuery,
  useAcknowledgeBroadcastMutation,
  useMarkBroadcastAsReadMutation,
  useGetRecipientStatsQuery,
  useGetBroadcastRecipientsQuery,
  useGetTeamMembersQuery,
} = communicationApi;