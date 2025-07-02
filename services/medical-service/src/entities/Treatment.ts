import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib';
import { Injury } from './Injury';

@Entity('treatments')
export class Treatment extends AuditableEntity {
  @Column({ name: 'injury_id', type: 'uuid' })
  injuryId: string;

  @Column({ name: 'treatment_date', type: 'date' })
  treatmentDate: Date;

  @Column({ name: 'treatment_type', length: 255 })
  treatmentType: string;

  @Column({ length: 255 })
  provider: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ name: 'effectiveness_rating', type: 'int', nullable: true })
  effectivenessRating?: number; // 1-5 scale

  @Column({ name: 'cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @ManyToOne(() => Injury, injury => injury.treatments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'injury_id' })
  injury: Injury;
}