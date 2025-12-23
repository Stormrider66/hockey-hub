// @ts-nocheck - Complex service with TypeORM issues
import { Entity, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib';
import { Treatment } from './Treatment';
import { MedicalReport } from './MedicalReport';
import { ReturnToPlayProtocol } from './ReturnToPlayProtocol';

@Entity('injuries')
export class Injury extends AuditableEntity {
  @Column({ name: 'player_id', type: 'uuid' })
  playerId: string;

  @Column({ name: 'injury_type', length: 255 })
  injuryType: string;

  @Column({ name: 'injury_date', type: 'date' })
  injuryDate: Date;

  @Column({ 
    name: 'recovery_status', 
    type: 'enum', 
    enum: ['active', 'recovering', 'recovered'],
    default: 'active'
  })
  recoveryStatus: 'active' | 'recovering' | 'recovered';

  @Column({ name: 'expected_return_date', type: 'date', nullable: true })
  expectedReturnDate?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'severity_level', type: 'int', default: 1 })
  severityLevel: number; // 1-5 scale

  @Column({ name: 'body_part', length: 100 })
  bodyPart: string;

  @Column({ name: 'mechanism_of_injury', length: 255, nullable: true })
  mechanismOfInjury?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Treatment, treatment => treatment.injury, { cascade: true })
  treatments: Treatment[];

  @OneToMany(() => MedicalReport, report => report.injury, { cascade: true })
  medicalReports: MedicalReport[];

  @OneToMany(() => ReturnToPlayProtocol, protocol => protocol.injury, { cascade: true })
  returnToPlayProtocols: ReturnToPlayProtocol[];
}