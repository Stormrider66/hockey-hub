import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { EquipmentReservation } from './EquipmentReservation';

export enum WorkoutEquipmentType {
  ROWER = 'ROWER',
  BIKE_ERG = 'BIKE_ERG',
  SKI_ERG = 'SKI_ERG',
  ASSAULT_BIKE = 'ASSAULT_BIKE',
  TREADMILL = 'TREADMILL',
  SPIN_BIKE = 'SPIN_BIKE',
  ELLIPTICAL = 'ELLIPTICAL',
  STAIR_CLIMBER = 'STAIR_CLIMBER'
}

export enum EquipmentStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
  RESERVED = 'RESERVED'
}

@Entity('equipment_items')
@Index(['facilityId', 'type'])
@Index(['status'])
@Index(['type'])
export class EquipmentItem extends BaseEntity {

  @Column({
    type: 'enum',
    enum: WorkoutEquipmentType,
    nullable: false
  })
  type: WorkoutEquipmentType;

  @Column({ type: 'varchar', length: 255 })
  name: string; // "Rower #1", "Bike Erg #3"

  @Column({ type: 'varchar', length: 255, nullable: true })
  serialNumber?: string;

  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    default: EquipmentStatus.AVAILABLE
  })
  status: EquipmentStatus;

  @Column({ type: 'uuid' })
  facilityId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string; // "Room A", "Main Gym", "Cardio Area"

  @Column({ type: 'text', nullable: true })
  notes?: string; // Maintenance notes, special instructions

  @Column({ type: 'timestamp', nullable: true })
  lastMaintenanceDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextMaintenanceDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  specifications?: {
    brand?: string;
    model?: string;
    year?: number;
    maxWeight?: number;
    maxSpeed?: number;
    features?: string[];
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => EquipmentReservation, reservation => reservation.equipmentItem)
  reservations: EquipmentReservation[];

  // Helper method to check if equipment is available at a specific time
  isAvailableAt(startTime: Date, endTime: Date): boolean {
    if (this.status !== EquipmentStatus.AVAILABLE) {
      return false;
    }
    
    // Check against active reservations
    const hasConflict = this.reservations?.some(reservation => 
      reservation.status === 'ACTIVE' &&
      ((startTime >= reservation.reservedFrom && startTime < reservation.reservedUntil) ||
       (endTime > reservation.reservedFrom && endTime <= reservation.reservedUntil) ||
       (startTime <= reservation.reservedFrom && endTime >= reservation.reservedUntil))
    );

    return !hasConflict;
  }
}