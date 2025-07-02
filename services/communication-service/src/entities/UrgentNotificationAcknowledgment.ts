import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { UrgentMedicalNotification } from './UrgentMedicalNotification';

export enum AcknowledgmentMethod {
  IN_APP = 'in_app',
  EMAIL_LINK = 'email_link',
  SMS_REPLY = 'sms_reply',
  PHONE_CONFIRMATION = 'phone_confirmation',
  API = 'api',
}

@Entity('urgent_notification_acknowledgments')
@Index(['notification_id', 'user_id'])
@Index(['user_id', 'created_at'])
@Unique(['notification_id', 'user_id'])
export class UrgentNotificationAcknowledgment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  notification_id: string;

  @Column('uuid')
  user_id: string;

  @Column('varchar', { length: 255 })
  user_name: string;

  @Column('varchar', { length: 100 })
  user_role: string;

  @Column({
    type: 'enum',
    enum: AcknowledgmentMethod,
  })
  method: AcknowledgmentMethod;

  @Column('text', { nullable: true })
  message?: string; // Optional response message

  @Column({ type: 'jsonb', nullable: true })
  device_info?: {
    ip_address?: string;
    user_agent?: string;
    device_type?: string;
    location?: {
      latitude?: number;
      longitude?: number;
      accuracy?: number;
    };
  };

  @Column({ type: 'boolean', default: false })
  is_emergency_contact: boolean;

  @Column({ type: 'int', nullable: true })
  response_time_seconds?: number; // Time from notification to acknowledgment

  @Column({ type: 'jsonb', nullable: true })
  additional_actions?: {
    viewed_attachments?: boolean;
    forwarded_to?: string[];
    added_notes?: boolean;
    initiated_call?: boolean;
  };

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => UrgentMedicalNotification, notification => notification.acknowledgments)
  @JoinColumn({ name: 'notification_id' })
  notification: UrgentMedicalNotification;
}