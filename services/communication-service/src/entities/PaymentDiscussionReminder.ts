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
import { PaymentDiscussion } from './PaymentDiscussion';

export enum PaymentReminderType {
  PAYMENT_DUE = 'payment_due',
  RESPONSE_NEEDED = 'response_needed',
  DOCUMENT_REQUIRED = 'document_required',
  PAYMENT_PLAN_INSTALLMENT = 'payment_plan_installment',
  FOLLOW_UP = 'follow_up',
  ESCALATION_WARNING = 'escalation_warning',
}

export enum PaymentReminderStatus {
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  ACKNOWLEDGED = 'acknowledged',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

@Entity('payment_discussion_reminders')
@Index(['paymentDiscussionId', 'status'])
@Index(['scheduledFor', 'status'])
export class PaymentDiscussionReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  paymentDiscussionId: string;

  @ManyToOne(() => PaymentDiscussion)
  @JoinColumn({ name: 'paymentDiscussionId' })
  paymentDiscussion: PaymentDiscussion;

  @Column({
    type: 'enum',
    enum: PaymentReminderType,
  })
  type: PaymentReminderType;

  @Column({
    type: 'enum',
    enum: PaymentReminderStatus,
    default: PaymentReminderStatus.SCHEDULED,
  })
  status: PaymentReminderStatus;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'timestamp' })
  scheduledFor: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt?: Date;

  @Column('uuid', { array: true })
  recipientIds: string[];

  @Column({ type: 'jsonb', nullable: true })
  notificationChannels?: {
    email?: boolean;
    sms?: boolean;
    inApp?: boolean;
    push?: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    paymentAmount?: number;
    dueDate?: Date;
    installmentNumber?: number;
    totalInstallments?: number;
    urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
    customFields?: Record<string, any>;
  };

  @Column({ default: 0 })
  retryCount: number;

  @Column({ type: 'jsonb', nullable: true })
  failureDetails?: {
    lastAttemptAt?: Date;
    errorMessage?: string;
    errorCode?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid')
  createdBy: string;

  @Column('uuid', { nullable: true })
  cancelledBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;
}