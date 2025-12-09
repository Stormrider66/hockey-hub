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
import { EventParticipant } from './EventParticipant';
import { ResourceBooking } from './ResourceBooking';
import { RecurrenceRule } from './RecurrenceRule';

export enum EventType {
  TRAINING = 'training',
  GAME = 'game',
  MEETING = 'meeting',
  MEDICAL = 'medical',
  EQUIPMENT = 'equipment',
  TEAM_EVENT = 'team_event',
  PERSONAL = 'personal',
  OTHER = 'other',
}

export enum EventStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

export enum EventVisibility {
  PUBLIC = 'public',
  TEAM = 'team',
  PRIVATE = 'private',
  ROLE_BASED = 'role_based',
}

@Entity('events')
@Index(['startTime', 'endTime'])
@Index(['organizationId', 'type'])
@Index(['createdBy'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: EventType,
    default: EventType.OTHER,
  })
  type: EventType;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.SCHEDULED,
  })
  status: EventStatus;

  @Column({
    type: 'enum',
    enum: EventVisibility,
    default: EventVisibility.TEAM,
  })
  visibility: EventVisibility;

  @Column({ type: 'timestamp with time zone' })
  startTime: Date;

  @Column({ type: 'timestamp with time zone' })
  endTime: Date;

  @Column({ default: false })
  allDay: boolean;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  onlineUrl?: string;

  @Column({ nullable: true })
  color?: string;

  @Column('uuid')
  organizationId: string;

  @Column('uuid', { nullable: true })
  teamId?: string;

  @Column('uuid')
  createdBy: string;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  @Column({ nullable: true })
  parentEventId?: string;

  @Column({ nullable: true })
  seriesId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    workoutId?: string;
    gameDetails?: {
      opponent: string;
      homeAway: 'home' | 'away';
      result?: string;
    };
    medicalDetails?: {
      appointmentType: string;
      providerId: string;
    };
    equipmentDetails?: {
      equipmentType: string;
      purpose: string;
    };
    [key: string]: any;
  };

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ nullable: true })
  notes?: string;

  @Column({ default: true })
  allowRsvp: boolean;

  @Column({ nullable: true })
  maxParticipants?: number;

  @Column({ default: true })
  sendReminders: boolean;

  @Column({ type: 'simple-array', nullable: true })
  reminderMinutes?: number[];

  @OneToMany(() => EventParticipant, (participant) => participant.event, {
    cascade: true,
  })
  participants: EventParticipant[];

  @OneToMany(() => ResourceBooking, (booking) => booking.event, {
    cascade: true,
  })
  resourceBookings: ResourceBooking[];

  @ManyToOne(() => RecurrenceRule, { nullable: true })
  @JoinColumn({ name: 'recurrenceRuleId' })
  recurrenceRule?: RecurrenceRule;

  @Column('uuid', { nullable: true })
  recurrenceRuleId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'simple-array', nullable: true })
  visibleToRoles?: string[];

  @Column({ type: 'simple-array', nullable: true })
  visibleToTeams?: string[];

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurrenceExceptionDate?: Date;

  @Column({ default: false })
  requiresApproval: boolean;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;
}