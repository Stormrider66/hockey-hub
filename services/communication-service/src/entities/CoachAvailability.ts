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

export enum AvailabilityType {
  OFFICE_HOURS = 'office_hours',
  BY_APPOINTMENT = 'by_appointment',
  EMERGENCY = 'emergency',
  NOT_AVAILABLE = 'not_available',
}

@Entity('coach_availability')
@Index(['coachId', 'teamId'])
@Index(['dayOfWeek', 'startTime', 'endTime'])
export class CoachAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  coachId: string;

  @Column('uuid')
  teamId: string;

  @Column('uuid')
  organizationId: string;

  @Column({
    type: 'enum',
    enum: AvailabilityType,
    default: AvailabilityType.OFFICE_HOURS,
  })
  type: AvailabilityType;

  @Column({ type: 'int', nullable: true })
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)

  @Column({ type: 'time', nullable: true })
  startTime?: string; // HH:MM format

  @Column({ type: 'time', nullable: true })
  endTime?: string; // HH:MM format

  @Column({ type: 'date', nullable: true })
  specificDate?: Date; // For specific date availability

  @Column({ default: true })
  isRecurring: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ default: true })
  allowMeetingRequests: boolean;

  @Column({ type: 'int', default: 30 })
  defaultMeetingDuration: number; // in minutes

  @Column({ type: 'int', default: 15 })
  bufferTime: number; // buffer between meetings in minutes

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    location?: string;
    meetingUrl?: string;
    maxConcurrentMeetings?: number;
    availableForEmergencies?: boolean;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  isActive: boolean;
}