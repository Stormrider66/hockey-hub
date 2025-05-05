import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TrainingSessionPhase } from './TrainingSessionPhase';
import { Exercise } from './Exercise';
import { MeasurementUnit as MeasurementUnitEnum } from '@hockey-hub/types';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('training_session_exercises')
@Index(['phaseId', 'order'])
@Index(['exerciseId'])
export class TrainingSessionExercise {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    sessionId!: UUID; // Denormalized for easier lookup?

    @Column({ type: 'uuid' })
    phaseId!: UUID;

    @ManyToOne(() => TrainingSessionPhase, phase => phase.exercises, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'phaseId' })
    trainingSessionPhase!: TrainingSessionPhase;

    @Column({ type: 'uuid' })
    exerciseId!: UUID;

    @ManyToOne(() => Exercise, { onDelete: 'RESTRICT' }) // Prevent deleting Exercise if used
    @JoinColumn({ name: 'exerciseId' })
    exercise!: Exercise;

    @Column({ type: 'integer' })
    order!: number;

    @Column({ type: 'integer', nullable: true })
    sets?: number | null;

    // Store reps as text to allow ranges like "8-12"
    @Column({ type: 'varchar', length: 50, nullable: true })
    reps?: string | null;

    @Column({ type: 'integer', nullable: true })
    duration?: number | null; // Assume seconds or minutes based on unit

    @Column({ type: 'integer', nullable: true })
    restTime?: number | null; // Assume seconds

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    weight?: number | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    distance?: number | null;

    // Store intensity as text for flexibility (% Max, RPE, descriptive)
    @Column({ type: 'varchar', length: 100, nullable: true })
    intensity?: string | null;

    @Column({
        type: 'enum',
        enum: MeasurementUnitEnum,
    })
    unit!: MeasurementUnitEnum;

    @Column({ type: 'text', nullable: true })
    notes?: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 