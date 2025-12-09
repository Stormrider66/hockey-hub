import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { ScheduleClarification } from './ScheduleClarification';
import { AvailabilityResponse } from './AvailabilityResponse';

export enum PollType {
  DATE_TIME = 'date_time',
  TIME_ONLY = 'time_only',
  LOCATION = 'location',
  GENERAL = 'general',
}

export enum PollStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  DECIDED = 'decided',
}

@Entity('availability_polls')
@Index(['schedule_clarification_id', 'status'])
@Index(['created_by', 'created_at'])
export class AvailabilityPoll extends BaseEntity {

  @Column('uuid')
  schedule_clarification_id: string;

  @ManyToOne(() => ScheduleClarification)
  @JoinColumn({ name: 'schedule_clarification_id' })
  schedule_clarification: ScheduleClarification;

  @Column('uuid')
  created_by: string; // Usually coach or team manager

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PollType,
  })
  type: PollType;

  @Column({
    type: 'enum',
    enum: PollStatus,
    default: PollStatus.ACTIVE,
  })
  status: PollStatus;

  @Column({ type: 'jsonb' })
  options: {
    id: string;
    date?: Date;
    time?: string;
    location?: string;
    description?: string;
    additional_info?: any;
  }[];

  @Column({ type: 'simple-array', nullable: true })
  target_user_ids?: string[]; // Specific users to poll, null = all participants

  @Column({ nullable: true })
  deadline?: Date;

  @Column({ default: false })
  allow_multiple_choices: boolean;

  @Column({ default: true })
  anonymous_responses: boolean;

  @Column({ default: true })
  show_results_immediately: boolean;

  @Column({ type: 'jsonb', nullable: true })
  final_decision?: {
    selected_option_id: string;
    decided_by: string;
    decided_at: Date;
    decision_notes?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  reminder_settings?: {
    enabled: boolean;
    reminder_times: Date[];
    last_reminder_sent?: Date;
  };

  @CreateDateColumn()
  override created_at: Date;

  @UpdateDateColumn()
  override updated_at: Date;

  @Column({ nullable: true })
  closed_at?: Date;

  // Relations
  @OneToMany(() => AvailabilityResponse, (response) => response.availability_poll)
  responses: AvailabilityResponse[];

  // Virtual fields
  response_count?: number;
  response_rate?: number;
}