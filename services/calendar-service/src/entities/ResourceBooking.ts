import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { Event } from './Event';
import { Resource } from './Resource';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
  IN_PROGRESS = 'in_progress',
}

export enum BookingPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('resource_bookings')
@Index(['resourceId', 'startTime', 'endTime'])
@Index(['eventId'])
@Index(['status'])
@Index(['bookedBy'])
@Check('"endTime" > "startTime"')
export class ResourceBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Resource, (resource) => resource.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'resourceId' })
  resource: Resource;

  @Column('uuid')
  resourceId: string;

  @ManyToOne(() => Event, (event) => event.resourceBookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column('uuid')
  eventId: string;

  @Column({ type: 'timestamp with time zone' })
  startTime: Date;

  @Column({ type: 'timestamp with time zone' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({
    type: 'enum',
    enum: BookingPriority,
    default: BookingPriority.MEDIUM,
  })
  priority: BookingPriority;

  @Column('uuid')
  bookedBy: string;

  @Column({ nullable: true })
  purpose?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ nullable: true })
  paymentReference?: string;

  @Column({ nullable: true })
  setupTime?: number;

  @Column({ nullable: true })
  cleanupTime?: number;

  @Column({ type: 'jsonb', nullable: true })
  setupRequirements?: {
    layout?: string;
    equipment?: string[];
    catering?: boolean;
    specialInstructions?: string;
    [key: string]: any;
  };

  @Column({ nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ nullable: true })
  approvalNotes?: string;

  @Column({ nullable: true })
  cancelledBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ nullable: true })
  cancellationReason?: string;

  @Column({ default: false })
  hasConflict: boolean;

  @Column({ type: 'simple-array', nullable: true })
  conflictingBookings?: string[];

  @Column({ type: 'jsonb', nullable: true })
  usageMetrics?: {
    actualStartTime?: string;
    actualEndTime?: string;
    attendeeCount?: number;
    feedbackScore?: number;
    issues?: string[];
    [key: string]: any;
  };

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'simple-array', nullable: true })
  notifiedUsers?: string[];

  @Column({ type: 'timestamp', nullable: true })
  lastNotificationSentAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkedInAt?: Date;

  @Column({ nullable: true })
  checkedInBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  checkedOutAt?: Date;

  @Column({ nullable: true })
  checkedOutBy?: string;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ nullable: true })
  recurringGroupId?: string;

  @Column({ type: 'jsonb', nullable: true })
  customFields?: Record<string, any>;
}