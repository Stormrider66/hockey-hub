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
import { AuditableEntity } from '@hockey-hub/shared-lib';
import { ScheduleClarification } from './ScheduleClarification';
import { CarpoolRequest } from './CarpoolRequest';

export enum CarpoolOfferStatus {
  AVAILABLE = 'available',
  PARTIALLY_FILLED = 'partially_filled',
  FULL = 'full',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum VehicleType {
  CAR = 'car',
  SUV = 'suv',
  VAN = 'van',
  MINIBUS = 'minibus',
  OTHER = 'other',
}

@Entity('carpool_offers')
@Index(['schedule_clarification_id', 'status'])
@Index(['driver_id', 'event_date'])
@Index(['pickup_location', 'event_date'])
export class CarpoolOffer extends AuditableEntity {

  @Column('uuid')
  schedule_clarification_id: string;

  @ManyToOne(() => ScheduleClarification)
  @JoinColumn({ name: 'schedule_clarification_id' })
  schedule_clarification: ScheduleClarification;

  @Column('uuid')
  driver_id: string; // Parent/guardian offering the ride

  @Column('uuid')
  event_id: string; // Calendar event this is for

  @Column({
    type: 'enum',
    enum: CarpoolOfferStatus,
    default: CarpoolOfferStatus.AVAILABLE,
  })
  status: CarpoolOfferStatus;

  @Column({
    type: 'enum',
    enum: VehicleType,
    default: VehicleType.CAR,
  })
  vehicle_type: VehicleType;

  @Column()
  available_seats: number;

  @Column({ default: 0 })
  occupied_seats: number;

  @Column()
  pickup_location: string;

  @Column({ type: 'jsonb', nullable: true })
  pickup_coordinates?: {
    latitude: number;
    longitude: number;
  };

  @Column({ type: 'time' })
  departure_time: string;

  @Column({ type: 'time', nullable: true })
  return_time?: string; // For round trips

  @Column({ default: true })
  is_round_trip: boolean;

  @Column({ type: 'date' })
  event_date: Date;

  @Column({ type: 'simple-array', nullable: true })
  pickup_stops?: string[]; // Multiple pickup locations if applicable

  @Column({ type: 'jsonb', nullable: true })
  driver_preferences?: {
    max_detour_minutes?: number;
    preferred_areas?: string[];
    equipment_space?: boolean;
    child_seat_available?: boolean;
    pet_friendly?: boolean;
    non_smoking?: boolean;
  };

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  contact_info?: {
    phone?: string;
    preferred_contact_method?: string;
    emergency_contact?: string;
  };

  @Column({ nullable: true })
  cancelled_reason?: string;

  @Column({ nullable: true })
  cancelled_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => CarpoolRequest, (request) => request.carpool_offer)
  requests: CarpoolRequest[];
}