import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { NotificationChannel, NotificationPriority } from './Notification';

export enum QueueStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('notification_queue')
@Index(['status', 'scheduled_for'])
@Index(['channel', 'priority'])
@Index(['notification_id'])
export class NotificationQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  notification_id: string;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: QueueStatus,
    default: QueueStatus.PENDING,
  })
  status: QueueStatus;

  @Column({ type: 'timestamp' })
  scheduled_for: Date;

  @Column({ type: 'timestamp', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Column({ type: 'int', default: 0 })
  attempt_count: number;

  @Column({ type: 'int', default: 3 })
  max_attempts: number;

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ type: 'timestamp', nullable: true })
  next_attempt_at?: Date;

  // Channel-specific data for processing
  @Column({ type: 'jsonb', nullable: true })
  processing_data?: {
    email?: {
      recipient_email: string;
      sender_email: string;
      subject: string;
      body: string;
      html_body?: string;
      attachments?: Array<{
        filename: string;
        content: string;
        contentType: string;
      }>;
    };
    sms?: {
      recipient_phone: string;
      message: string;
      sender_id?: string;
    };
    push?: {
      device_tokens: string[];
      title: string;
      body: string;
      data?: Record<string, any>;
      icon?: string;
      badge?: number;
      sound?: string;
    };
    in_app?: {
      recipient_id: string;
      data: Record<string, any>;
    };
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}