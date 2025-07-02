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
import { Broadcast } from './Broadcast';

export enum RecipientStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  READ = 'read',
  ACKNOWLEDGED = 'acknowledged',
  FAILED = 'failed',
}

@Entity('broadcast_recipients')
@Unique(['broadcast_id', 'user_id'])
@Index(['broadcast_id', 'status'])
@Index(['user_id', 'created_at'])
@Index(['status', 'created_at'])
export class BroadcastRecipient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  broadcast_id: string;

  @Column('uuid')
  user_id: string;

  @Column({
    type: 'enum',
    enum: RecipientStatus,
    default: RecipientStatus.PENDING,
  })
  status: RecipientStatus;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  read_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  acknowledged_at?: Date;

  @Column({ type: 'text', nullable: true })
  acknowledgment_note?: string;

  @Column({ type: 'text', nullable: true })
  failure_reason?: string;

  @Column({ type: 'integer', default: 0 })
  retry_count: number;

  // Device information for delivery tracking
  @Column({ type: 'varchar', length: 255, nullable: true })
  device_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  device_type?: string;

  // Notification channels used
  @Column('varchar', { array: true, default: '{}' })
  notification_channels: string[];

  // Relations
  @ManyToOne(() => Broadcast, (broadcast) => broadcast.recipients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'broadcast_id' })
  broadcast: Broadcast;

  // Virtual fields
  user?: any; // Will be populated from user service
}