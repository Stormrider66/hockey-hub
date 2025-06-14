import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { MedicalNote } from './MedicalNote';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('medical_assessments')
@Index(['playerId', 'assessmentDate'])
@Index(['organizationId'])
@Index(['conductedById'])
export class MedicalAssessment {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    playerId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    teamId?: UUID | null;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column()
    assessmentType!: string;

    @Column({ type: 'timestamptz' })
    assessmentDate!: ISODateString;

    @Column({ type: 'text' })
    summary!: string;

    @Column({ type: 'uuid' })
    conductedById!: UUID;

    // Relations
    @OneToMany(() => MedicalNote, note => note.assessment)
    medicalNotes?: MedicalNote[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 