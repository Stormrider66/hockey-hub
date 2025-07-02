import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib';
import { CarpoolOffer } from './CarpoolOffer';

export enum CarpoolRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('carpool_requests')
@Index(['carpool_offer_id', 'status'])
@Index(['requester_id', 'created_at'])
export class CarpoolRequest extends AuditableEntity {

  @Column('uuid')
  carpool_offer_id: string;

  @ManyToOne(() => CarpoolOffer)
  @JoinColumn({ name: 'carpool_offer_id' })
  carpool_offer: CarpoolOffer;

  @Column('uuid')
  requester_id: string; // Parent requesting the ride

  @Column('uuid')
  player_id: string; // Child who needs the ride

  @Column({
    type: 'enum',
    enum: CarpoolRequestStatus,
    default: CarpoolRequestStatus.PENDING,
  })
  status: CarpoolRequestStatus;

  @Column({ default: 1 })
  seats_requested: number; // In case multiple children

  @Column({ nullable: true })
  pickup_address?: string;

  @Column({ type: 'jsonb', nullable: true })
  pickup_coordinates?: {
    latitude: number;
    longitude: number;
  };

  @Column({ default: true })
  needs_return_trip: boolean;

  @Column({ type: 'jsonb', nullable: true })
  special_requirements?: {
    has_equipment?: boolean;
    equipment_details?: string;
    needs_child_seat?: boolean;
    allergies?: string[];
    medical_conditions?: string[];
    emergency_contact?: string;
  };

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ nullable: true })
  response_message?: string; // Driver's response message

  @Column({ nullable: true })
  responded_at?: Date;

  @Column({ nullable: true })
  cancelled_reason?: string;

  @Column({ nullable: true })
  cancelled_at?: Date;

  @Column({ nullable: true })
  confirmed_at?: Date; // When parent confirms child was picked up

  @Column({ nullable: true })
  completed_at?: Date; // When ride is completed

  @Column({ type: 'jsonb', nullable: true })
  feedback?: {
    rating?: number;
    comment?: string;
    submitted_at?: Date;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}