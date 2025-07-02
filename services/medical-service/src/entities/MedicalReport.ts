import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib';
import { Injury } from './Injury';

@Entity('medical_reports')
export class MedicalReport extends AuditableEntity {
  @Column({ name: 'player_id', type: 'uuid' })
  playerId: string;

  @Column({ name: 'injury_id', type: 'uuid', nullable: true })
  injuryId?: string;

  @Column({ name: 'report_date', type: 'date' })
  reportDate: Date;

  @Column({ name: 'report_type', length: 255 })
  reportType: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text', nullable: true })
  recommendations?: string;

  @Column({ name: 'medical_professional', length: 255 })
  medicalProfessional: string;

  @Column({ name: 'clearance_status', length: 50, default: 'pending' })
  clearanceStatus: string; // 'cleared', 'restricted', 'not_cleared', 'pending'

  @Column({ name: 'follow_up_required', default: false })
  followUpRequired: boolean;

  @Column({ name: 'follow_up_date', type: 'date', nullable: true })
  followUpDate?: Date;

  @Column({ name: 'document_url', length: 500, nullable: true })
  documentUrl?: string;

  @ManyToOne(() => Injury, injury => injury.medicalReports, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'injury_id' })
  injury?: Injury;
}