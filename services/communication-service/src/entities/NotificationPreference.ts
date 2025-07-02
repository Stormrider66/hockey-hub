import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { NotificationType, NotificationChannel } from './Notification';

@Entity('notification_preferences')
@Index(['user_id'])
@Index(['organization_id'])
@Unique(['user_id', 'type', 'channel'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid', { nullable: true })
  organization_id?: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column({ default: true })
  is_enabled: boolean;

  // Reminder settings
  @Column({ type: 'int', nullable: true })
  reminder_minutes_before?: number;

  @Column({ default: false })
  send_immediately: boolean;

  @Column({ default: false })
  send_daily_digest: boolean;

  @Column({ default: false })
  send_weekly_digest: boolean;

  // Time preferences
  @Column({ type: 'time', nullable: true })
  quiet_hours_start?: string;

  @Column({ type: 'time', nullable: true })
  quiet_hours_end?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone?: string;

  // Channel-specific settings
  @Column({ type: 'jsonb', nullable: true })
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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}