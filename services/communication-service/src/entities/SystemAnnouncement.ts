import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib';

export enum SystemAnnouncementPriority {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum SystemAnnouncementStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum SystemAnnouncementType {
  MAINTENANCE = 'maintenance',
  FEATURE_UPDATE = 'feature_update',
  POLICY_CHANGE = 'policy_change',
  SECURITY_ALERT = 'security_alert',
  GENERAL = 'general',
  SYSTEM_UPDATE = 'system_update',
}

@Entity('system_announcements')
@Index(['admin_id', 'created_at'])
@Index(['status', 'priority'])
@Index(['scheduled_at'])
@Index(['expires_at'])
@Index(['type'])
export class SystemAnnouncement extends AuditableEntity {

  @Column('uuid')
  admin_id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: SystemAnnouncementPriority,
    default: SystemAnnouncementPriority.INFO,
  })
  priority: SystemAnnouncementPriority;

  @Column({
    type: 'enum',
    enum: SystemAnnouncementStatus,
    default: SystemAnnouncementStatus.DRAFT,
  })
  status: SystemAnnouncementStatus;

  @Column({
    type: 'enum',
    enum: SystemAnnouncementType,
    default: SystemAnnouncementType.GENERAL,
  })
  type: SystemAnnouncementType;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  sent_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date;

  // Rich content support
  @Column({ type: 'jsonb', nullable: true })
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
    mime_type: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    show_banner?: boolean;
    require_acknowledgment?: boolean;
    target_roles?: string[];
    banner_color?: string;
    banner_icon?: string;
    notification_channels?: string[];
    [key: string]: any;
  };

  // Targeting options
  @Column('varchar', { array: true, nullable: true })
  target_organizations?: string[];

  @Column('varchar', { array: true, nullable: true })
  target_roles?: string[];

  @Column('varchar', { array: true, nullable: true })
  excluded_roles?: string[];

  // Statistics
  @Column({ type: 'integer', default: 0 })
  total_recipients: number;

  @Column({ type: 'integer', default: 0 })
  delivered_count: number;

  @Column({ type: 'integer', default: 0 })
  read_count: number;

  @Column({ type: 'integer', default: 0 })
  acknowledged_count: number;

  @Column({ type: 'integer', default: 0 })
  dismissed_count: number;

  // Error tracking
  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ type: 'integer', default: 0 })
  retry_count: number;

  // Virtual fields
  admin?: any; // Will be populated from user service
}