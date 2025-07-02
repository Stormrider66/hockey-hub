import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib';

export enum CommunicationType {
  IN_PERSON_MEETING = 'in_person_meeting',
  PHONE_CALL = 'phone_call',
  VIDEO_CALL = 'video_call',
  EMAIL = 'email',
  CHAT_MESSAGE = 'chat_message',
  TEXT_MESSAGE = 'text_message',
  OTHER = 'other'
}

export enum CommunicationCategory {
  ACADEMIC = 'academic',
  BEHAVIORAL = 'behavioral',
  MEDICAL = 'medical',
  PERFORMANCE = 'performance',
  ADMINISTRATIVE = 'administrative',
  SOCIAL = 'social',
  OTHER = 'other'
}

export enum CommunicationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

@Entity('parent_communications')
@Index(['organizationId', 'coachId'])
@Index(['organizationId', 'playerId'])
@Index(['organizationId', 'parentId'])
@Index(['organizationId', 'communicationDate'])
@Index(['organizationId', 'category'])
@Index(['organizationId', 'type'])
export class ParentCommunication extends AuditableEntity {
  @Column('uuid')
  @Index()
  organizationId: string;

  @Column('uuid')
  @Index()
  teamId: string;

  @Column('uuid')
  @Index()
  coachId: string;

  @Column('uuid')
  @Index()
  playerId: string;

  @Column('uuid')
  @Index()
  parentId: string;

  @Column({
    type: 'enum',
    enum: CommunicationType,
    default: CommunicationType.IN_PERSON_MEETING
  })
  type: CommunicationType;

  @Column({
    type: 'enum',
    enum: CommunicationCategory,
    default: CommunicationCategory.OTHER
  })
  category: CommunicationCategory;

  @Column({
    type: 'enum',
    enum: CommunicationPriority,
    default: CommunicationPriority.MEDIUM
  })
  priority: CommunicationPriority;

  @Column('timestamp')
  @Index()
  communicationDate: Date;

  @Column({ type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text', nullable: true })
  detailedNotes?: string;

  @Column({ type: 'json', nullable: true })
  additionalParticipants?: {
    id: string;
    name: string;
    role: string;
  }[];

  @Column({ type: 'json', nullable: true })
  actionItems?: {
    id: string;
    description: string;
    assignedTo: string;
    dueDate?: Date;
    completed: boolean;
  }[];

  @Column({ type: 'timestamp', nullable: true })
  followUpDate?: Date;

  @Column({ type: 'text', nullable: true })
  followUpNotes?: string;

  @Column({ type: 'boolean', default: false })
  isConfidential: boolean;

  @Column({ type: 'boolean', default: false })
  requiresFollowUp: boolean;

  @Column({ type: 'boolean', default: false })
  isFollowUpComplete: boolean;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  location?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phoneNumber?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailThreadId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  meetingLink?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => ParentCommunicationAttachment, attachment => attachment.communication)
  attachments: ParentCommunicationAttachment[];

  @OneToMany(() => ParentCommunicationReminder, reminder => reminder.communication)
  reminders: ParentCommunicationReminder[];
}

@Entity('parent_communication_attachments')
@Index(['communicationId'])
export class ParentCommunicationAttachment extends AuditableEntity {
  @Column('uuid')
  communicationId: string;

  @ManyToOne(() => ParentCommunication, communication => communication.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'communicationId' })
  communication: ParentCommunication;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 255 })
  fileUrl: string;

  @Column({ type: 'varchar', length: 50 })
  fileType: string;

  @Column({ type: 'int' })
  fileSize: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;
}

@Entity('parent_communication_reminders')
@Index(['communicationId'])
@Index(['reminderDate'])
@Index(['isCompleted'])
export class ParentCommunicationReminder extends AuditableEntity {
  @Column('uuid')
  communicationId: string;

  @ManyToOne(() => ParentCommunication, communication => communication.reminders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'communicationId' })
  communication: ParentCommunication;

  @Column('timestamp')
  reminderDate: Date;

  @Column({ type: 'varchar', length: 255 })
  reminderType: string;

  @Column({ type: 'text' })
  reminderMessage: string;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  completedBy?: string;

  @Column({ type: 'text', nullable: true })
  completionNotes?: string;
}