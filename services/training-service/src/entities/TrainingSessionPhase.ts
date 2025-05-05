import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { TrainingSession } from './TrainingSession';
import { TrainingSessionExercise } from './TrainingSessionExercise';
import { UUID, ISODateString } from '@hockey-hub/types';

@Entity('training_session_phases')
@Index(['sessionId', 'order'])
export class TrainingSessionPhase {
    @PrimaryGeneratedColumn('uuid')
    id!: UUID;

    @Column({ type: 'uuid' })
    sessionId!: UUID;

    @ManyToOne(() => TrainingSession, session => session.phases, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sessionId' })
    trainingSession!: TrainingSession;

    @Column()
    name!: string;

    @Column({ type: 'integer' })
    order!: number;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    // Relation to exercises within this phase
    @OneToMany(() => TrainingSessionExercise, exercise => exercise.trainingSessionPhase, { cascade: true, eager: false })
    exercises!: TrainingSessionExercise[]; // Should not be optional if phase must have exercises?

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: ISODateString;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: ISODateString;
} 