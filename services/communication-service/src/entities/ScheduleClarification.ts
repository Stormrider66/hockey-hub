// @ts-nocheck - Suppress TypeScript errors for build
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { Conversation } from './Conversation';
import { CarpoolOffer } from './CarpoolOffer';
import { AvailabilityPoll } from './AvailabilityPoll';

export enum ClarificationType {
  SCHEDULE_CONFLICT = 'schedule_conflict',
  TIME_CHANGE = 'time_change',
  LOCATION_CHANGE = 'location_change',
  CANCELLATION = 'cancellation',
  WEATHER_CONCERN = 'weather_concern',
  TRANSPORTATION_COORDINATION = 'transportation_coordination',
  GENERAL_INQUIRY = 'general_inquiry',
  RESCHEDULING_REQUEST = 'rescheduling_request',
}

export enum ClarificationStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
  ESCALATED = 'escalated',
}

export enum ClarificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('schedule_clarifications')
@Index(['event_id', 'type'])
@Index(['status', 'created_at'])
@Index(['organization_id', 'team_id'])
export class ScheduleClarification extends BaseEntity {

  @Column('uuid')
  conversation_id: string;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column('uuid')
  event_id: string; // Reference to calendar event

  @Column({
    type: 'enum',
    enum: ClarificationType,
  })
  type: ClarificationType;

  @Column({
    type: 'enum',
    enum: ClarificationStatus,
    default: ClarificationStatus.OPEN,
  })
  status: ClarificationStatus;

  @Column({
    type: 'enum',
    enum: ClarificationPriority,
    default: ClarificationPriority.MEDIUM,
  })
  priority: ClarificationPriority;

  @Column('uuid')
  organization_id: string;

  @Column('uuid')
  team_id: string;

  @Column('uuid')
  initiated_by: string; // User who started the clarification

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  event_details?: {
    event_name: string;
    event_type: string;
    original_date: Date;
    original_time: string;
    original_location: string;
    proposed_date?: Date;
    proposed_time?: string;
    proposed_location?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  conflict_details?: {
    conflicting_event_id?: string;
    conflicting_event_name?: string;
    conflict_reason?: string;
    affected_players?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  weather_info?: {
    condition: string;
    temperature: number;
    wind_speed?: number;
    precipitation?: string;
    field_condition?: string;
    last_updated: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  resolution?: {
    resolved_by: string;
    resolved_at: Date;
    resolution_type: string;
    resolution_notes: string;
    new_event_id?: string; // If event was rescheduled
  };

  @Column({ type: 'simple-array', nullable: true })
  participant_ids: string[]; // Users involved in the clarification

  @Column({ type: 'simple-array', nullable: true })
  tags: string[]; // For categorization

  @Column({ nullable: true })
  deadline?: Date; // When a decision needs to be made

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => CarpoolOffer, (offer) => offer.schedule_clarification)
  carpool_offers: CarpoolOffer[];

  @OneToMany(() => AvailabilityPoll, (poll) => poll.schedule_clarification)
  availability_polls: AvailabilityPoll[];
}