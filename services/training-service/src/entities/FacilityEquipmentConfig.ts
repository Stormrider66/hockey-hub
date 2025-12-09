import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { WorkoutEquipmentType } from './EquipmentItem';

@Entity('facility_equipment_config')
@Unique(['facilityId', 'equipmentType'])
@Index(['facilityId'])
@Index(['equipmentType'])
export class FacilityEquipmentConfig extends BaseEntity {

  @Column({ type: 'uuid' })
  facilityId: string;

  @Column({
    type: 'enum',
    enum: WorkoutEquipmentType,
    nullable: false
  })
  equipmentType: WorkoutEquipmentType;

  @Column({ type: 'int' })
  totalCount: number;

  @Column({ type: 'int', default: 0 })
  availableCount: number;

  @Column({ type: 'varchar', length: 255 })
  defaultLocation: string;

  @Column({ type: 'jsonb', nullable: true })
  configuration?: {
    maxSessionDuration?: number; // minutes
    bufferTime?: number; // minutes between sessions
    maintenanceInterval?: number; // days
    autoAssignment?: boolean;
    bookingRules?: {
      maxAdvanceBooking?: number; // days
      minAdvanceBooking?: number; // hours
      allowWalkIn?: boolean;
      requireApproval?: boolean;
    };
    operatingHours?: {
      monday?: { start: string; end: string };
      tuesday?: { start: string; end: string };
      wednesday?: { start: string; end: string };
      thursday?: { start: string; end: string };
      friday?: { start: string; end: string };
      saturday?: { start: string; end: string };
      sunday?: { start: string; end: string };
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  restrictions?: {
    userTypes?: string[]; // Which user roles can book
    maxUsersPerEquipment?: number;
    trainingRequired?: boolean;
    ageRestrictions?: {
      minimum?: number;
      maximum?: number;
    };
    medicalClearanceRequired?: boolean;
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastInventoryCheck?: Date;

  @Column({ type: 'uuid', nullable: true })
  managedBy?: string; // User ID of equipment manager

  // Helper methods
  getUtilizationRate(): number {
    if (this.totalCount === 0) return 0;
    return ((this.totalCount - this.availableCount) / this.totalCount) * 100;
  }

  hasCapacityFor(requestedCount: number): boolean {
    return this.availableCount >= requestedCount;
  }

  isOperatingAt(date: Date): boolean {
    if (!this.configuration?.operatingHours) return true;

    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hours = this.configuration.operatingHours[dayName as keyof typeof this.configuration.operatingHours];
    
    if (!hours) return false;

    const currentTime = date.toTimeString().slice(0, 5); // HH:MM format
    return currentTime >= hours.start && currentTime <= hours.end;
  }

  canAccommodateSession(startTime: Date, endTime: Date, playerCount: number = 1): boolean {
    if (!this.isActive) return false;
    if (!this.hasCapacityFor(playerCount)) return false;
    if (!this.isOperatingAt(startTime) || !this.isOperatingAt(endTime)) return false;

    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes
    const maxDuration = this.configuration?.maxSessionDuration;
    
    if (maxDuration && duration > maxDuration) return false;

    return true;
  }
}