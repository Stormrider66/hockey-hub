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

export enum EventConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  SUSPENDED = 'suspended',
}

export enum EventConversationScope {
  ALL_PARTICIPANTS = 'all_participants', // All event participants
  COACHES_ONLY = 'coaches_only',         // Coaches and staff only
  PLAYERS_ONLY = 'players_only',         // Players only
  PARENTS_ONLY = 'parents_only',         // Parents only
  CUSTOM = 'custom',                     // Custom participant list
}

@Entity('event_conversations')
@Index(['event_id'])
@Index(['conversation_id'])
@Index(['status', 'created_at'])
export class EventConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  event_id: string;

  @Column('uuid')
  conversation_id: string;

  @Column({
    type: 'enum',
    enum: EventConversationStatus,
    default: EventConversationStatus.ACTIVE,
  })
  status: EventConversationStatus;

  @Column({
    type: 'enum',
    enum: EventConversationScope,
    default: EventConversationScope.ALL_PARTICIPANTS,
  })
  scope: EventConversationScope;

  @Column('uuid')
  created_by: string;

  @Column('uuid', { nullable: true })
  updated_by?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  auto_archive_at?: Date;

  @Column({ default: true })
  auto_add_participants: boolean;

  @Column({ default: true })
  send_welcome_message: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings?: {
    // Event-specific chat settings
    allowFileSharing?: boolean;
    allowVoiceMessages?: boolean;
    allowVideoMessages?: boolean;
    moderatedMode?: boolean;
    
    // Notification settings
    notifyOnEventReminders?: boolean;
    notifyOnEventChanges?: boolean;
    notifyOnRSVPChanges?: boolean;
    
    // Auto-actions
    autoArchiveAfterEvent?: boolean;
    archiveDelayHours?: number;
    
    // Integration settings
    showEventDetails?: boolean;
    allowQuickActions?: boolean;
    
    [key: string]: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    // Calendar integration metadata
    calendarServiceUrl?: string;
    eventType?: string;
    eventTitle?: string;
    eventDate?: Date;
    eventLocation?: string;
    
    // Statistics
    totalMessages?: number;
    totalParticipants?: number;
    lastActivityAt?: Date;
    
    // Event lifecycle tracking
    eventStartedAt?: Date;
    eventCompletedAt?: Date;
    eventCancelledAt?: Date;
    
    [key: string]: any;
  };

  // Relations
  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  // Virtual fields for API responses
  eventDetails?: {
    id: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    type: string;
    status: string;
  };

  participantCount?: number;
  messageCount?: number;
  lastActivity?: Date;
}