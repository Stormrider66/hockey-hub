import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Injury } from './Injury';
import { MedicalAssessment } from './MedicalAssessment';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('medical_notes')
@Index(['playerId'])
@Index(['injuryId'])
@Index(['assessmentId'])
@Index(['recordedById'])
export class MedicalNote {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    playerId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    injuryId?: UUID | null;

    @Column({ type: 'uuid', nullable: true })
    assessmentId?: UUID | null;

    @Column({ type: 'text' })
    note!: string;

    @Column({ type: 'uuid' })
    recordedById!: UUID;

    // Relations
    @ManyToOne(() => Injury, injury => injury.medicalNotes, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'injuryId' })
    injury?: Injury | null;

    @ManyToOne(() => MedicalAssessment, assessment => assessment.medicalNotes, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assessmentId' })
    assessment?: MedicalAssessment | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 