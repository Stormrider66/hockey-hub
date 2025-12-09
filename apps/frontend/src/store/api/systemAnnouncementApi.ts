import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface SystemAnnouncement {
  id: string;
  admin_id: string;
  title: string;
  content: string;
  priority: 'info' | 'warning' | 'critical';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled' | 'expired';
  type: 'maintenance' | 'feature_update' | 'policy_change' | 'security_alert' | 'general' | 'system_update';
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
    show_banner?: boolean;
    require_acknowledgment?: boolean;
    banner_color?: string;
    banner_icon?: string;
    notification_channels?: string[];
    [key: string]: any;
  };
  target_organizations?: string[];
  target_roles?: string[];
  excluded_roles?: string[];
  total_recipients: number;
  delivered_count: number;
  read_count: number;
  acknowledged_count: number;
  dismissed_count: number;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
  admin?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SystemAnnouncementRecipient {
  system_announcement_id: string;
  user_id: string;
  status: 'pending' | 'delivered' | 'read' | 'acknowledged' | 'dismissed' | 'failed';
  created_at: string;
  updated_at: string;
  delivered_at?: string;
  read_at?: string;
  acknowledged_at?: string;
  dismissed_at?: string;
  acknowledgment_note?: string;
  dismissal_reason?: string;
}

export interface CreateSystemAnnouncementDto {
  title: string;
  content: string;
  priority?: 'info' | 'warning' | 'critical';
  type?: 'maintenance' | 'feature_update' | 'policy_change' | 'security_alert' | 'general' | 'system_update';
  scheduledAt?: string;
  expiresAt?: string;
  targetOrganizations?: string[];
  targetRoles?: string[];
  excludedRoles?: string[];
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
    mime_type: string;
  }>;
  metadata?: {
    show_banner?: boolean;
    require_acknowledgment?: boolean;
    banner_color?: string;
    banner_icon?: string;
    notification_channels?: string[];
    [key: string]: any;
  };
}

export interface UpdateSystemAnnouncementDto {
  title?: string;
  content?: string;
  priority?: 'info' | 'warning' | 'critical';
  type?: 'maintenance' | 'feature_update' | 'policy_change' | 'security_alert' | 'general' | 'system_update';
  scheduledAt?: string;
  expiresAt?: string;
  targetOrganizations?: string[];
  targetRoles?: string[];
  excludedRoles?: string[];
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
    mime_type: string;
  }>;
  metadata?: Record<string, any>;
}

export interface SystemAnnouncementFilters {
  adminId?: string;
  status?: string | string[];
  priority?: string | string[];
  type?: string | string[];
  startDate?: string;
  endDate?: string;
  includeExpired?: boolean;
}

export interface SystemAnnouncementStats {
  total: number;
  pending: number;
  delivered: number;
  read: number;
  acknowledged: number;
  dismissed: number;
  failed: number;
}

export interface UserSystemAnnouncementsResponse {
  announcements: Array<{
    announcement: SystemAnnouncement;
    recipientStatus: 'pending' | 'delivered' | 'read' | 'acknowledged' | 'dismissed' | 'failed';
    readAt?: string;
    acknowledgedAt?: string;
    dismissedAt?: string;
  }>;
  unreadCount: number;
  unacknowledgedCount: number;
}

export const systemAnnouncementApi = createApi({
  reducerPath: 'systemAnnouncementApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL ? `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/communication/system-announcements` : 'http://localhost:3000/api/communication/system-announcements',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['SystemAnnouncement', 'UserSystemAnnouncements'],
  endpoints: (builder) => ({
    // Admin endpoints
    createSystemAnnouncement: builder.mutation<SystemAnnouncement, CreateSystemAnnouncementDto>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SystemAnnouncement'],
    }),

    getSystemAnnouncements: builder.query<{
      announcements: SystemAnnouncement[];
      total: number;
    }, SystemAnnouncementFilters>({
      query: (filters) => ({
        url: '',
        params: filters,
      }),
      providesTags: ['SystemAnnouncement'],
    }),

    getSystemAnnouncementById: builder.query<SystemAnnouncement, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'SystemAnnouncement', id }],
    }),

    updateSystemAnnouncement: builder.mutation<SystemAnnouncement, {
      id: string;
      data: UpdateSystemAnnouncementDto;
    }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SystemAnnouncement', id },
        'SystemAnnouncement',
      ],
    }),

    sendSystemAnnouncement: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}/send`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'SystemAnnouncement', id },
        'SystemAnnouncement',
      ],
    }),

    cancelSystemAnnouncement: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'SystemAnnouncement', id },
        'SystemAnnouncement',
      ],
    }),

    deleteSystemAnnouncement: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SystemAnnouncement'],
    }),

    getSystemAnnouncementStats: builder.query<SystemAnnouncementStats, string>({
      query: (id) => `/${id}/stats`,
    }),

    // User endpoints
    getUserSystemAnnouncements: builder.query<UserSystemAnnouncementsResponse, void>({
      query: () => '/user/announcements',
      providesTags: ['UserSystemAnnouncements'],
    }),

    markSystemAnnouncementAsRead: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['UserSystemAnnouncements'],
    }),

    acknowledgeSystemAnnouncement: builder.mutation<{ message: string }, {
      id: string;
      note?: string;
    }>({
      query: ({ id, note }) => ({
        url: `/${id}/acknowledge`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ['UserSystemAnnouncements'],
    }),

    dismissSystemAnnouncement: builder.mutation<{ message: string }, {
      id: string;
      reason?: string;
    }>({
      query: ({ id, reason }) => ({
        url: `/${id}/dismiss`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['UserSystemAnnouncements'],
    }),
  }),
});

export const {
  // Admin hooks
  useCreateSystemAnnouncementMutation,
  useGetSystemAnnouncementsQuery,
  useGetSystemAnnouncementByIdQuery,
  useUpdateSystemAnnouncementMutation,
  useSendSystemAnnouncementMutation,
  useCancelSystemAnnouncementMutation,
  useDeleteSystemAnnouncementMutation,
  useGetSystemAnnouncementStatsQuery,
  // User hooks
  useGetUserSystemAnnouncementsQuery,
  useMarkSystemAnnouncementAsReadMutation,
  useAcknowledgeSystemAnnouncementMutation,
  useDismissSystemAnnouncementMutation,
} = systemAnnouncementApi;