import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

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

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

@Entity('notifications')
@Index(['recipient_id', 'created_at'])
@Index(['type', 'status'])
@Index(['scheduled_for'])
@Index(['organization_id'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  recipient_id: string;

  @Column('uuid', { nullable: true })
  organization_id?: string;

  @Column('uuid', { nullable: true })
  team_id?: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column('varchar', { length: 255 })
  title: string;

  @Column('text')
  message: string;

  @Column('text', { nullable: true })
  action_url?: string;

  @Column('varchar', { length: 100, nullable: true })
  action_text?: string;

  // Related entity information
  @Column('uuid', { nullable: true })
  related_entity_id?: string;

  @Column('varchar', { length: 100, nullable: true })
  related_entity_type?: string;

  // Channel-specific data
  @Column({ type: 'jsonb', nullable: true })
  channels: NotificationChannel[];

  @Column({ type: 'jsonb', nullable: true })
  channel_data?: {
    email?: {
      template_id?: string;
      template_data?: Record<string, any>;
      from_email?: string;
      reply_to?: string;
    };
    sms?: {
      template_id?: string;
      template_data?: Record<string, any>;
    };
    push?: {
      icon?: string;
      badge?: string;
      image?: string;
      actions?: Array<{
        action: string;
        title: string;
        icon?: string;
      }>;
    };
  };

  // Scheduling
  @Column({ type: 'timestamp', nullable: true })
  scheduled_for?: Date;

  @Column({ type: 'timestamp', nullable: true })
  sent_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  read_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date;

  // Retry and error handling
  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @Column({ type: 'int', default: 3 })
  max_retries: number;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ type: 'timestamp', nullable: true })
  next_retry_at?: Date;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Virtual fields for recipient information
  recipient?: any;
  organization?: any;
  team?: any;
}