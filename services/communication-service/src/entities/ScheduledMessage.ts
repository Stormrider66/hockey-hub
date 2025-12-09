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
import { Conversation } from './Conversation';

export enum ScheduledMessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('scheduled_messages')
@Index(['scheduledFor', 'status'])
@Index(['senderId'])
@Index(['conversationId'])
export class ScheduledMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id' })
  conversationId: string;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ name: 'sender_id' })
  senderId: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: ['text', 'image', 'file', 'voice', 'video'],
    default: 'text',
  })
  type: string;

  @Column({ name: 'reply_to_id', nullable: true })
  replyToId?: string;

  @Column('jsonb', { nullable: true })
  attachments?: any[];

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'scheduled_for', type: 'timestamp with time zone' })
  scheduledFor: Date;

  @Column({
    type: 'enum',
    enum: ScheduledMessageStatus,
    default: ScheduledMessageStatus.PENDING,
  })
  status: ScheduledMessageStatus;

  @Column({ name: 'sent_at', type: 'timestamp with time zone', nullable: true })
  sentAt?: Date;

  @Column({ name: 'sent_message_id', nullable: true })
  sentMessageId?: string;

  @Column({ name: 'failure_reason', nullable: true })
  failureReason?: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', default: 3 })
  maxRetries: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({ name: 'timezone', default: 'UTC' })
  timezone: string;

  @Column({ name: 'recurrence_rule', nullable: true })
  recurrenceRule?: string; // For future recurring messages

  @Column({ name: 'notification_sent', default: false })
  notificationSent: boolean;
}