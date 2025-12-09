import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { EquipmentItem } from './EquipmentItem';

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

@Entity('equipment_reservations')
@Index(['equipmentItemId', 'reservedFrom', 'reservedUntil'])
@Index(['sessionId'])
@Index(['playerId'])
@Index(['status'])
@Index(['reservedFrom', 'reservedUntil'])
export class EquipmentReservation extends BaseEntity {

  @Column({ type: 'uuid' })
  equipmentItemId: string;

  @ManyToOne(() => EquipmentItem, equipmentItem => equipmentItem.reservations, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'equipmentItemId' })
  equipmentItem: EquipmentItem;

  @Column({ type: 'uuid' })
  sessionId: string; // Reference to WorkoutSession

  @Column({ type: 'uuid', nullable: true })
  playerId?: string; // Optional - if specific player is assigned

  @Column({ type: 'timestamp' })
  reservedFrom: Date;

  @Column({ type: 'timestamp' })
  reservedUntil: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.ACTIVE
  })
  status: ReservationStatus;

  @Column({ type: 'uuid' })
  reservedBy: string; // User ID who made the reservation

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp', nullable: true })
  checkInTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkOutTime?: Date;

  @Column({ type: 'jsonb', nullable: true })
  sessionData?: {
    actualStartTime?: Date;
    actualEndTime?: Date;
    metricsRecorded?: boolean;
    issuesReported?: string[];
    performanceNotes?: string;
  };

  // Helper methods
  get duration(): number {
    return this.reservedUntil.getTime() - this.reservedFrom.getTime();
  }

  get actualDuration(): number {
    if (this.checkInTime && this.checkOutTime) {
      return this.checkOutTime.getTime() - this.checkInTime.getTime();
    }
    return 0;
  }

  isActive(): boolean {
    return this.status === ReservationStatus.ACTIVE;
  }

  hasConflictWith(startTime: Date, endTime: Date): boolean {
    if (!this.isActive()) return false;
    
    return (startTime >= this.reservedFrom && startTime < this.reservedUntil) ||
           (endTime > this.reservedFrom && endTime <= this.reservedUntil) ||
           (startTime <= this.reservedFrom && endTime >= this.reservedUntil);
  }

  canCheckIn(): boolean {
    const now = new Date();
    const bufferTime = 15 * 60 * 1000; // 15 minutes buffer
    
    return this.status === ReservationStatus.ACTIVE &&
           !this.checkInTime &&
           now >= new Date(this.reservedFrom.getTime() - bufferTime) &&
           now <= this.reservedUntil;
  }

  canCheckOut(): boolean {
    return this.status === ReservationStatus.ACTIVE &&
           !!this.checkInTime &&
           !this.checkOutTime;
  }
}