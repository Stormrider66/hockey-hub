import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum MeetingRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  RESCHEDULED = 'rescheduled',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum MeetingType {
  IN_PERSON = 'in_person',
  VIDEO_CALL = 'video_call',
  PHONE_CALL = 'phone_call',
}

export enum MeetingPurpose {
  GENERAL_DISCUSSION = 'general_discussion',
  PERFORMANCE_REVIEW = 'performance_review',
  INJURY_DISCUSSION = 'injury_discussion',
  ACADEMIC_CONCERN = 'academic_concern',
  BEHAVIORAL_CONCERN = 'behavioral_concern',
  PROGRESS_UPDATE = 'progress_update',
  EMERGENCY = 'emergency',
  OTHER = 'other',
}

@Entity('meeting_requests')
@Index(['conversationId'])
@Index(['requesterId', 'status'])
@Index(['coachId', 'status'])
@Index(['scheduledDate', 'status'])
export class MeetingRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversationId: string;

  @Column('uuid')
  requesterId: string; // Parent ID

  @Column('uuid')
  coachId: string;

  @Column('uuid')
  playerId: string;

  @Column('uuid')
  teamId: string;

  @Column('uuid')
  organizationId: string;

  @Column({
    type: 'enum',
    enum: MeetingRequestStatus,
    default: MeetingRequestStatus.PENDING,
  })
  status: MeetingRequestStatus;

  @Column({
    type: 'enum',
    enum: MeetingType,
    default: MeetingType.IN_PERSON,
  })
  type: MeetingType;

  @Column({
    type: 'enum',
    enum: MeetingPurpose,
    default: MeetingPurpose.GENERAL_DISCUSSION,
  })
  purpose: MeetingPurpose;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'timestamp' })
  proposedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  alternateDate1?: Date;

  @Column({ type: 'timestamp', nullable: true })
  alternateDate2?: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledDate?: Date;

  @Column({ type: 'int', default: 30 })
  duration: number; // in minutes

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  meetingUrl?: string;

  @Column({ type: 'text', nullable: true })
  coachNotes?: string;

  @Column({ type: 'text', nullable: true })
  declineReason?: string;

  @Column({ type: 'text', nullable: true })
  rescheduleReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
    reminderSent?: boolean;
    followUpRequired?: boolean;
    attachments?: string[];
    relatedCommunicationIds?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}