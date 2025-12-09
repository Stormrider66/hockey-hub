export type NotificationType = 
  | 'event_reminder'
  | 'event_created'
  | 'event_updated'
  | 'event_cancelled'
  | 'rsvp_request'
  | 'schedule_conflict'
  | 'training_assigned'
  | 'training_completed'
  | 'training_overdue'
  | 'medical_appointment'
  | 'injury_update'
  | 'medical_clearance'
  | 'equipment_due'
  | 'equipment_ready'
  | 'maintenance_required'
  | 'announcement'
  | 'system_alert'
  | 'payment_due'
  | 'team_update';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

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
  channel_data?: any;
  scheduled_for?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  expires_at?: string;
  retry_count: number;
  max_retries: number;
  error_message?: string;
  next_retry_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationRequest {
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
  scheduledFor?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  recipientId?: string;
  organizationId?: string;
  teamId?: string;
  type?: NotificationType | NotificationType[];
  status?: NotificationStatus | NotificationStatus[];
  priority?: NotificationPriority | NotificationPriority[];
  channels?: NotificationChannel[];
  unreadOnly?: boolean;
  scheduledAfter?: string;
  scheduledBefore?: string;
  limit?: number;
  offset?: number;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
}