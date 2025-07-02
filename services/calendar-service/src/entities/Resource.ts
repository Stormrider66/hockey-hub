import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ResourceBooking } from './ResourceBooking';

export enum ResourceType {
  FACILITY = 'facility',
  EQUIPMENT = 'equipment',
  STAFF = 'staff',
  VEHICLE = 'vehicle',
  ROOM = 'room',
  ICE_RINK = 'ice_rink',
  GYM = 'gym',
  FIELD = 'field',
  OTHER = 'other',
}

export enum ResourceStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
  RETIRED = 'retired',
}

@Entity('resources')
@Index(['organizationId', 'type'])
@Index(['status'])
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ResourceType,
    default: ResourceType.OTHER,
  })
  type: ResourceType;

  @Column({
    type: 'enum',
    enum: ResourceStatus,
    default: ResourceStatus.AVAILABLE,
  })
  status: ResourceStatus;

  @Column('uuid')
  organizationId: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  building?: string;

  @Column({ nullable: true })
  floor?: string;

  @Column({ nullable: true })
  roomNumber?: string;

  @Column({ nullable: true })
  capacity?: number;

  @Column({ type: 'jsonb', nullable: true })
  features?: {
    hasProjector?: boolean;
    hasWhiteboard?: boolean;
    hasAudioSystem?: boolean;
    hasVideoConference?: boolean;
    hasLockerRooms?: boolean;
    hasBenches?: boolean;
    surfaceType?: string;
    dimensions?: {
      length: number;
      width: number;
      height?: number;
      unit: 'meters' | 'feet';
    };
    amenities?: string[];
    [key: string]: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  availability?: {
    monday?: { start: string; end: string }[];
    tuesday?: { start: string; end: string }[];
    wednesday?: { start: string; end: string }[];
    thursday?: { start: string; end: string }[];
    friday?: { start: string; end: string }[];
    saturday?: { start: string; end: string }[];
    sunday?: { start: string; end: string }[];
    holidays?: boolean;
    exceptions?: {
      date: string;
      available: boolean;
      reason?: string;
    }[];
  };

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dailyRate?: number;

  @Column({ nullable: true })
  currency?: string;

  @Column({ default: true })
  requiresApproval: boolean;

  @Column({ type: 'simple-array', nullable: true })
  approvers?: string[];

  @Column({ nullable: true })
  minBookingDuration?: number;

  @Column({ nullable: true })
  maxBookingDuration?: number;

  @Column({ nullable: true })
  bufferTime?: number;

  @Column({ default: 1 })
  maxConcurrentBookings: number;

  @Column({ nullable: true })
  advanceBookingDays?: number;

  @Column({ type: 'simple-array', nullable: true })
  allowedRoles?: string[];

  @Column({ type: 'simple-array', nullable: true })
  restrictedTeams?: string[];

  @Column({ type: 'jsonb', nullable: true })
  maintenanceSchedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    lastMaintenance?: string;
    nextMaintenance?: string;
    maintenanceWindow?: {
      dayOfWeek?: number;
      time?: string;
      duration?: number;
    };
  };

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  contactPerson?: string;

  @Column({ nullable: true })
  contactEmail?: string;

  @Column({ nullable: true })
  contactPhone?: string;

  @OneToMany(() => ResourceBooking, (booking) => booking.resource)
  bookings: ResourceBooking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  customFields?: Record<string, any>;
}