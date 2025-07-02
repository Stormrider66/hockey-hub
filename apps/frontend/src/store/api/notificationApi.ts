import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Notification types (matching backend enums)
export enum NotificationType {
  // Calendar Events
  EVENT_REMINDER = 'event_reminder',
  EVENT_CREATED = 'event_created',
  EVENT_UPDATED = 'event_updated',
  EVENT_CANCELLED = 'event_cancelled',
  RSVP_REQUEST = 'rsvp_request',
  SCHEDULE_CONFLICT = 'schedule_conflict',
  
  // Training
  TRAINING_ASSIGNED = 'training_assigned',
  TRAINING_COMPLETED = 'training_completed',
  TRAINING_OVERDUE = 'training_overdue',
  
  // Medical
  MEDICAL_APPOINTMENT = 'medical_appointment',
  INJURY_UPDATE = 'injury_update',
  MEDICAL_CLEARANCE = 'medical_clearance',
  
  // Equipment
  EQUIPMENT_DUE = 'equipment_due',
  EQUIPMENT_READY = 'equipment_ready',
  MAINTENANCE_REQUIRED = 'maintenance_required',
  
  // General
  ANNOUNCEMENT = 'announcement',
  SYSTEM_ALERT = 'system_alert',
  PAYMENT_DUE = 'payment_due',
  TEAM_UPDATE = 'team_update',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export interface Notification {
  id: string;
  recipient_id: string;
  organization_id?: string;
  team_id?: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  action_url?: string;
  action_text?: string;
  related_entity_id?: string;
  related_entity_type?: string;
  channels: NotificationChannel[];
  channel_data?: Record<string, any>;
  scheduled_for?: Date;
  sent_at?: Date;
  delivered_at?: Date;
  read_at?: Date;
  expires_at?: Date;
  retry_count: number;
  max_retries: number;
  error_message?: string;
  next_retry_at?: Date;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  organization_id?: string;
  type: NotificationType;
  channel: NotificationChannel;
  is_enabled: boolean;
  reminder_minutes_before?: number;
  send_immediately: boolean;
  send_daily_digest: boolean;
  send_weekly_digest: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone?: string;
  channel_settings?: {
    email?: {
      address?: string;
      format?: 'html' | 'text';
    };
    sms?: {
      phone_number?: string;
    };
    push?: {
      device_tokens?: string[];
      sound?: string;
      vibrate?: boolean;
    };
  };
  created_at: Date;
  updated_at: Date;
}

export interface CreateNotificationDto {
  recipientId: string;
  organizationId?: string;
  teamId?: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionText?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  channels?: NotificationChannel[];
  scheduledFor?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface BulkNotificationDto {
  recipientIds: string[];
  organizationId?: string;
  teamId?: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionText?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  channels?: NotificationChannel[];
  scheduledFor?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

// API configuration
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api';

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_GATEWAY_URL}/communication/notifications`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Notification', 'NotificationPreference', 'NotificationStats'],
  endpoints: (builder) => ({
    // Get notifications list
    getNotifications: builder.query<NotificationListResponse, {
      status?: NotificationStatus;
      type?: NotificationType;
      priority?: NotificationPriority;
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    }>({
      query: ({ status, type, priority, unreadOnly, limit = 50, offset = 0 }) => ({
        url: '',
        params: { status, type, priority, unreadOnly, limit, offset },
      }),
      providesTags: ['Notification'],
    }),

    // Get notification stats
    getNotificationStats: builder.query<NotificationStats, void>({
      query: () => '/stats',
      providesTags: ['NotificationStats'],
    }),

    // Create notification
    createNotification: builder.mutation<Notification, CreateNotificationDto>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Notification', 'NotificationStats'],
    }),

    // Bulk create notifications
    createBulkNotifications: builder.mutation<{ count: number }, BulkNotificationDto>({
      query: (data) => ({
        url: '/bulk',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Notification', 'NotificationStats'],
    }),

    // Mark notification as read
    markAsRead: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification', 'NotificationStats'],
    }),

    // Mark multiple as read
    markMultipleAsRead: builder.mutation<{ count: number }, string[]>({
      query: (notificationIds) => ({
        url: '/read-multiple',
        method: 'PUT',
        body: { notificationIds },
      }),
      invalidatesTags: ['Notification', 'NotificationStats'],
    }),


    // Delete notification
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification', 'NotificationStats'],
    }),

    // Get notification preferences
    getNotificationPreferences: builder.query<NotificationPreference[], void>({
      query: () => '/preferences',
      providesTags: ['NotificationPreference'],
    }),

    // Update notification preferences
    updateNotificationPreferences: builder.mutation<NotificationPreference[], NotificationPreference[]>({
      query: (preferences) => ({
        url: '/preferences',
        method: 'PUT',
        body: { preferences },
      }),
      invalidatesTags: ['NotificationPreference'],
    }),

  }),
});

// Export hooks
export const {
  useGetNotificationsQuery,
  useGetNotificationStatsQuery,
  useCreateNotificationMutation,
  useCreateBulkNotificationsMutation,
  useMarkAsReadMutation,
  useMarkMultipleAsReadMutation,
  useDeleteNotificationMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} = notificationApi;