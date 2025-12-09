import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UrgentMedicalNotification } from './UrgentMedicalNotification';

export enum EscalationReason {
  NO_ACKNOWLEDGMENT = 'no_acknowledgment',
  INSUFFICIENT_ACKNOWLEDGMENTS = 'insufficient_acknowledgments',
  TIMEOUT = 'timeout',
  MANUAL = 'manual',
  SYSTEM_ERROR = 'system_error',
}

export enum EscalationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('urgent_notification_escalations')
@Index(['notification_id', 'escalation_level'])
@Index(['status', 'created_at'])
export class UrgentNotificationEscalation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  notification_id: string;

  @Column('int')
  escalation_level: number;

  @Column({
    type: 'enum',
    enum: EscalationReason,
  })
  reason: EscalationReason;

  @Column({
    type: 'enum',
    enum: EscalationStatus,
    default: EscalationStatus.PENDING,
  })
  status: EscalationStatus;

  @Column({ type: 'uuid', array: true })
  target_user_ids: string[];

  @Column({ type: 'varchar', array: true, nullable: true })
  target_roles?: string[];

  @Column({ type: 'jsonb', nullable: true })
  emergency_contacts?: Array<{
    name: string;
    phone: string;
    email?: string;
    relationship: string;
    contacted: boolean;
    contacted_at?: Date;
    response?: string;
  }>;

  @Column({ type: 'jsonb' })
  delivery_channels: string[];

  @Column({ type: 'jsonb', nullable: true })
  delivery_results?: {
    [channel: string]: {
      success: boolean;
      delivered_to: number;
      failed_count: number;
      errors?: string[];
    };
  };

  @Column('text', { nullable: true })
  escalation_message?: string;

  @Column({ type: 'int', default: 0 })
  acknowledgments_received: number;

  @Column({ type: 'timestamp', nullable: true })
  triggered_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Column('uuid', { nullable: true })
  triggered_by?: string; // System or manual trigger

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    original_timeout_minutes?: number;
    elapsed_minutes?: number;
    previous_acknowledgment_count?: number;
    system_notes?: string;
  };

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => UrgentMedicalNotification, notification => notification.escalations)
  @JoinColumn({ name: 'notification_id' })
  notification: UrgentMedicalNotification;
}