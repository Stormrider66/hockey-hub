import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum UserModerationStatus {
  ACTIVE = 'active',
  WARNING = 'warning',
  MUTED = 'muted',
  SUSPENDED = 'suspended',
  BANNED = 'banned'
}

export enum UserModerationReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  INAPPROPRIATE_BEHAVIOR = 'inappropriate_behavior',
  REPEATED_VIOLATIONS = 'repeated_violations',
  HATE_SPEECH = 'hate_speech',
  PRIVACY_VIOLATION = 'privacy_violation',
  OTHER = 'other'
}

@Entity('user_moderation')
@Index(['userId', 'status'])
@Index(['moderatorId'])
@Index(['status'])
@Index(['expiresAt'])
export class UserModeration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column('uuid')
  @Index()
  moderatorId: string;

  @Column({
    type: 'enum',
    enum: UserModerationStatus,
    default: UserModerationStatus.ACTIVE
  })
  status: UserModerationStatus;

  @Column({
    type: 'enum',
    enum: UserModerationReason
  })
  reason: UserModerationReason;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  moderatorNotes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  restrictions: {
    canSendMessages?: boolean;
    canJoinConversations?: boolean;
    canCreateConversations?: boolean;
    canUploadFiles?: boolean;
    canReact?: boolean;
  } | null;

  @Column({ type: 'json', nullable: true })
  metadata: {
    appealable?: boolean;
    appealDeadline?: string;
    relatedContentId?: string;
    warningCount?: number;
    escalationLevel?: number;
  } | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}