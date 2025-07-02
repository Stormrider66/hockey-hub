import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib';
import { Injury } from './Injury';

@Entity('player_availability')
export class PlayerAvailability extends AuditableEntity {
  @Column({ name: 'player_id', type: 'uuid' })
  playerId: string;

  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate: Date;

  @Column({ 
    name: 'availability_status', 
    type: 'enum', 
    enum: ['available', 'injured', 'illness', 'personal', 'suspended', 'load_management'],
    default: 'available'
  })
  availabilityStatus: 'available' | 'injured' | 'illness' | 'personal' | 'suspended' | 'load_management';

  @Column({ name: 'injury_id', type: 'uuid', nullable: true })
  injuryId?: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ name: 'expected_return_date', type: 'date', nullable: true })
  expectedReturnDate?: Date;

  @Column({ name: 'medical_clearance_required', default: false })
  medicalClearanceRequired: boolean;

  @Column({ name: 'clearance_provided', default: false })
  clearanceProvided: boolean;

  @Column({ name: 'clearance_date', type: 'date', nullable: true })
  clearanceDate?: Date;

  @Column({ name: 'cleared_by', length: 255, nullable: true })
  clearedBy?: string;

  @Column({ name: 'restrictions', type: 'json', nullable: true })
  restrictions?: string[]; // Array of activity restrictions

  @Column({ name: 'is_current', default: true })
  isCurrent: boolean;

  @ManyToOne(() => Injury, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'injury_id' })
  injury?: Injury;
}