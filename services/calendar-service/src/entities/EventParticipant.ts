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
import { Event } from './Event';

export enum ParticipantRole {
  ORGANIZER = 'organizer',
  REQUIRED = 'required',
  OPTIONAL = 'optional',
  RESOURCE = 'resource',
  OBSERVER = 'observer',
}

export enum ParticipantStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  TENTATIVE = 'tentative',
  NO_RESPONSE = 'no_response',
}

export enum ParticipantType {
  USER = 'user',
  TEAM = 'team',
  GROUP = 'group',
  RESOURCE = 'resource',
  EXTERNAL = 'external',
}

@Entity('event_participants')
@Index(['eventId', 'participantId'])
@Index(['participantId', 'status'])
@Unique(['eventId', 'participantId', 'participantType'])
export class EventParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, (event) => event.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column('uuid')
  eventId: string;

  @Column('uuid')
  participantId: string;

  @Column({
    type: 'enum',
    enum: ParticipantType,
    default: ParticipantType.USER,
  })
  participantType: ParticipantType;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.REQUIRED,
  })
  role: ParticipantRole;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.PENDING,
  })
  status: ParticipantStatus;

  @Column({ nullable: true })
  responseMessage?: string;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt?: Date;

  @Column({ default: false })
  isOrganizer: boolean;

  @Column({ default: true })
  canEdit: boolean;

  @Column({ default: true })
  canInviteOthers: boolean;

  @Column({ default: true })
  canSeeGuestList: boolean;

  @Column({ nullable: true })
  invitedBy?: string;

  @Column({ nullable: true })
  delegatedTo?: string;

  @Column({ type: 'timestamp', nullable: true })
  checkedInAt?: Date;

  @Column({ nullable: true })
  checkedInBy?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    position?: string;
    jerseyNumber?: string;
    transportationNeeded?: boolean;
    dietaryRestrictions?: string;
    emergencyContact?: string;
    [key: string]: any;
  };

  @Column({ type: 'simple-array', nullable: true })
  notificationPreferences?: string[];

  @Column({ default: true })
  receiveReminders: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastReminderSentAt?: Date;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  externalEmail?: string;

  @Column({ nullable: true })
  externalName?: string;

  @Column({ default: 0 })
  reminderCount: number;

  @Column({ type: 'timestamp', nullable: true })
  viewedAt?: Date;
}