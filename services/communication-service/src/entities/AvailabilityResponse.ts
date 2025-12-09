import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { AvailabilityPoll } from './AvailabilityPoll';

export enum ResponseStatus {
  AVAILABLE = 'available',
  NOT_AVAILABLE = 'not_available',
  MAYBE = 'maybe',
  NO_RESPONSE = 'no_response',
}

@Entity('availability_responses')
@Index(['availability_poll_id', 'user_id'])
@Unique(['availability_poll_id', 'user_id']) // One response per user per poll
export class AvailabilityResponse extends BaseEntity {

  @Column('uuid')
  availability_poll_id: string;

  @ManyToOne(() => AvailabilityPoll)
  @JoinColumn({ name: 'availability_poll_id' })
  availability_poll: AvailabilityPoll;

  @Column('uuid')
  user_id: string; // Parent or guardian responding

  @Column('uuid', { nullable: true })
  player_id?: string; // On behalf of which player (if applicable)

  @Column({ type: 'simple-array' })
  selected_option_ids: string[]; // Selected poll options

  @Column({
    type: 'enum',
    enum: ResponseStatus,
    default: ResponseStatus.NO_RESPONSE,
  })
  overall_status: ResponseStatus;

  @Column({ type: 'jsonb', nullable: true })
  option_preferences?: {
    [optionId: string]: {
      preference_level: number; // 1-5, 5 being most preferred
      notes?: string;
    };
  };

  @Column({ type: 'text', nullable: true })
  comments?: string;

  @Column({ type: 'jsonb', nullable: true })
  constraints?: {
    earliest_time?: string;
    latest_time?: string;
    excluded_dates?: Date[];
    preferred_locations?: string[];
    transportation_needed?: boolean;
  };

  @Column({ default: false })
  is_tentative: boolean; // Response might change

  @Column({ nullable: true })
  responded_at?: Date;

  @Column({ nullable: true })
  updated_response_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  notification_preferences?: {
    notify_on_decision: boolean;
    notify_on_new_responses: boolean;
    notify_on_changes: boolean;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}