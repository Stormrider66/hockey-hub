import { Entity, Column, OneToMany, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { BroadcastRecipient } from './BroadcastRecipient';
import { Message } from './Message';

export enum BroadcastPriority {
  NORMAL = 'normal',
  IMPORTANT = 'important',
  URGENT = 'urgent',
}

export enum BroadcastStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum BroadcastTargetType {
  TEAM = 'team',
  ROLE = 'role',
  CUSTOM = 'custom',
}

@Entity('broadcasts')
@Index(['coach_id', 'created_at'])
@Index(['team_id', 'status'])
@Index(['scheduled_at'])
@Index(['status'])
export class Broadcast extends BaseEntity {

  @Column('uuid')
  coach_id: string;

  @Column('uuid')
  team_id: string;

  @Column('uuid')
  organization_id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: BroadcastPriority,
    default: BroadcastPriority.NORMAL,
  })
  priority: BroadcastPriority;

  @Column({
    type: 'enum',
    enum: BroadcastStatus,
    default: BroadcastStatus.DRAFT,
  })
  status: BroadcastStatus;

  @Column({
    type: 'enum',
    enum: BroadcastTargetType,
    default: BroadcastTargetType.TEAM,
  })
  target_type: BroadcastTargetType;

  // For custom targeting
  @Column('uuid', { array: true, nullable: true })
  target_user_ids?: string[];

  @Column('varchar', { array: true, nullable: true })
  target_roles?: string[];

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
    require_acknowledgment?: boolean;
    allow_replies?: boolean;
    pin_duration_hours?: number;
    notification_channels?: string[];
    [key: string]: any;
  };

  // Statistics
  @Column({ type: 'integer', default: 0 })
  total_recipients: number;

  @Column({ type: 'integer', default: 0 })
  delivered_count: number;

  @Column({ type: 'integer', default: 0 })
  read_count: number;

  @Column({ type: 'integer', default: 0 })
  acknowledged_count: number;

  // Error tracking
  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @Column({ type: 'integer', default: 0 })
  retry_count: number;

  // Relations
  @OneToMany(() => BroadcastRecipient, (recipient) => recipient.broadcast)
  recipients: BroadcastRecipient[];

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'message_id' })
  message?: Message;

  @Column('uuid', { nullable: true })
  message_id?: string;

  // Virtual fields
  coach?: any; // Will be populated from user service
  team?: any; // Will be populated from user service
}