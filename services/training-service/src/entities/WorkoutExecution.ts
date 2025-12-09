import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { WorkoutSession } from './WorkoutSession';
import { ExerciseExecution } from './ExerciseExecution';

export type ExecutionStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'abandoned';

@Entity('workout_executions')
export class WorkoutExecution extends BaseEntity {

  @Column({ type: 'uuid' })
  playerId: string;

  @ManyToOne(() => WorkoutSession, session => session.executions)
  @JoinColumn({ name: 'workoutSessionId' })
  workoutSession: WorkoutSession;

  @Column({ type: 'uuid' })
  workoutSessionId: string;

  @Column({ type: 'varchar', length: 50, default: 'not_started' })
  status: ExecutionStatus;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'int', default: 0 })
  currentExerciseIndex: number;

  @Column({ type: 'int', default: 0 })
  currentSetNumber: number;

  @Column({ type: 'float', nullable: true })
  completionPercentage: number;

  @Column({ type: 'jsonb', nullable: true })
  metrics: {
    heartRate?: number[];
    power?: number[];
    speed?: number[];
    calories?: number;
    averageHeartRate?: number;
    maxHeartRate?: number;
    averagePower?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  deviceData: {
    deviceId?: string;
    deviceType?: string;
    lastSync?: Date;
  };

  @OneToMany(() => ExerciseExecution, execution => execution.workoutExecution, { cascade: true })
  exerciseExecutions: ExerciseExecution[];

}