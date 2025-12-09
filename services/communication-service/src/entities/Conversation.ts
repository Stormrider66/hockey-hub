import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { ConversationParticipant } from './ConversationParticipant';
import { Message } from './Message';

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  TEAM = 'team',
  BROADCAST = 'broadcast',
  ANNOUNCEMENT = 'announcement',
  TRAINING_SESSION = 'training_session',
  EXERCISE_THREAD = 'exercise_thread',
  PRIVATE_COACH_CHANNEL = 'private_coach_channel',
  PAYMENT_DISCUSSION = 'payment_discussion',
  SCHEDULE_CLARIFICATION = 'schedule_clarification',
  PERFORMANCE_REVIEW = 'performance_review',
}

@Entity('conversations')
@Index(['type', 'created_at'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT,
  })
  type: ConversationType;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  avatar_url?: string;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_message_at?: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at?: Date;

  @Column('uuid')
  created_by: string;

  @Column({ default: false })
  is_archived: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> & {
    // Announcement channel specific metadata
    teamId?: string;
    organizationId?: string;
    allowPlayerReactions?: boolean;
    moderatorIds?: string[];
    // Private coach channel specific metadata
    playerId?: string;
    parentId?: string;
    coachIds?: string[];
    officeHours?: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
    isAutoCreated?: boolean;
    // Payment discussion specific metadata
    paymentDiscussionId?: string;
    paymentId?: string;
    invoiceId?: string;
    paymentAmount?: number;
    billingStaffIds?: string[];
    // Schedule clarification specific metadata
    scheduleClarificationId?: string;
    eventId?: string;
    eventName?: string;
    eventDate?: Date;
    clarificationType?: string;
    coordinatorIds?: string[]; // Team managers, coaches who can help resolve
  };

  // Relations
  @OneToMany(() => ConversationParticipant, (participant) => participant.conversation)
  participants: ConversationParticipant[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  // Virtual fields for frontend
  last_message?: Message;
  unread_count?: number;
  participant_count?: number;
}