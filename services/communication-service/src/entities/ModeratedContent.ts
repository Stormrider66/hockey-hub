import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Message } from './Message';

export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged'
}

export enum ModerationReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  HATE_SPEECH = 'hate_speech',
  VIOLENCE = 'violence',
  PRIVACY_VIOLATION = 'privacy_violation',
  COPYRIGHT = 'copyright',
  OTHER = 'other'
}

export enum ModerationAction {
  NONE = 'none',
  WARNING = 'warning',
  DELETE_MESSAGE = 'delete_message',
  MUTE_USER = 'mute_user',
  SUSPEND_USER = 'suspend_user',
  BAN_USER = 'ban_user'
}

@Entity('moderated_content')
@Index(['status', 'createdAt'])
@Index(['messageId'])
@Index(['moderatorId'])
@Index(['reporterId'])
export class ModeratedContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  messageId: string;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: Message;

  @Column('uuid')
  @Index()
  reporterId: string;

  @Column('uuid', { nullable: true })
  @Index()
  moderatorId: string | null;

  @Column({
    type: 'enum',
    enum: ModerationStatus,
    default: ModerationStatus.PENDING
  })
  status: ModerationStatus;

  @Column({
    type: 'enum',
    enum: ModerationReason
  })
  reason: ModerationReason;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ModerationAction,
    default: ModerationAction.NONE
  })
  action: ModerationAction;

  @Column({ type: 'text', nullable: true })
  moderatorNotes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'json', nullable: true })
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    automaticFlags?: string[];
    severity?: number;
  } | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}