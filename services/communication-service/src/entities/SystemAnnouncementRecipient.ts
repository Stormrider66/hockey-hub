import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SystemAnnouncement } from './SystemAnnouncement';

export enum SystemRecipientStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  READ = 'read',
  ACKNOWLEDGED = 'acknowledged',
  DISMISSED = 'dismissed',
  FAILED = 'failed',
}

@Entity('system_announcement_recipients')
@Index(['system_announcement_id', 'user_id'], { unique: true })
@Index(['user_id', 'status'])
@Index(['status'])
export class SystemAnnouncementRecipient {
  @PrimaryColumn('uuid')
  system_announcement_id: string;

  @PrimaryColumn('uuid')
  user_id: string;

  @Column({
    type: 'enum',
    enum: SystemRecipientStatus,
    default: SystemRecipientStatus.PENDING,
  })
  status: SystemRecipientStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  read_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  acknowledged_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  dismissed_at?: Date;

  @Column({ type: 'text', nullable: true })
  acknowledgment_note?: string;

  @Column({ type: 'text', nullable: true })
  dismissal_reason?: string;

  @Column('varchar', { array: true, nullable: true })
  notification_channels?: string[];

  @Column({ type: 'text', nullable: true })
  failure_reason?: string;

  @Column({ type: 'integer', default: 0 })
  retry_count: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    user_agent?: string;
    ip_address?: string;
    device_type?: string;
    [key: string]: any;
  };

  // Relations
  @ManyToOne(() => SystemAnnouncement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'system_announcement_id' })
  systemAnnouncement: SystemAnnouncement;

  // Virtual fields
  user?: any; // Will be populated from user service
}