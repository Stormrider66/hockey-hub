import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { TrainingPlan } from './TrainingPlan';
import { TrainingSessionPhase } from './TrainingSessionPhase';
import { IntensityLevel as IntensityLevelEnum } from '@hockey-hub/types';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('training_sessions')
@Index(['organizationId', 'sessionDate'])
@Index(['planId'])
@Index(['eventId'])
export class TrainingSession {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    organizationId!: UUID;

    @Column({ type: 'uuid', nullable: true })
    teamId?: UUID | null;

    // Foreign key to Calendar service (if needed for lookups, otherwise just store ID)
    @Column({ type: 'uuid', nullable: true })
    eventId?: UUID | null;

    @Column({ type: 'uuid', nullable: true })
    planId?: UUID | null;

    @ManyToOne(() => TrainingPlan, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'planId' })
    trainingPlan?: TrainingPlan;

    @Column()
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'timestamptz' })
    sessionDate!: ISODateString;

    @Column({ type: 'integer', nullable: true })
    durationMinutes?: number | null;

    @Column({
        type: 'enum',
        enum: IntensityLevelEnum,
        nullable: true
    })
    intensityLevel?: IntensityLevelEnum | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    focus?: string | null;

    @Column({ default: false })
    isTemplate!: boolean;

    // Relation to phases (assuming phases contain exercises)
    @OneToMany(() => TrainingSessionPhase, phase => phase.trainingSession, { cascade: true, eager: false })
    phases?: TrainingSessionPhase[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 