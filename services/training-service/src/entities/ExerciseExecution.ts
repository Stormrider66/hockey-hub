import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@hockey-hub/shared-lib';
import { WorkoutExecution } from './WorkoutExecution';

@Entity('exercise_executions')
export class ExerciseExecution extends BaseEntity {

  @Column({ type: 'uuid' })
  exerciseId: string; // Reference to the exercise template

  @Column()
  exerciseName: string; // Cached for historical reference

  @Column({ type: 'int' })
  setNumber: number;

  @Column({ type: 'int', nullable: true })
  actualReps: number;

  @Column({ type: 'float', nullable: true })
  actualWeight: number;

  @Column({ type: 'int', nullable: true })
  actualDuration: number; // in seconds

  @Column({ type: 'float', nullable: true })
  actualDistance: number;

  @Column({ type: 'float', nullable: true })
  actualPower: number; // watts

  @Column({ type: 'int', nullable: true })
  restTaken: number; // actual rest duration in seconds

  @Column({ type: 'jsonb', nullable: true })
  performanceMetrics: {
    heartRate?: number;
    maxHeartRate?: number;
    averagePower?: number;
    maxPower?: number;
    speed?: number;
    cadence?: number;
    rpe?: number; // Rate of Perceived Exertion (1-10)
  };

  @Column({ nullable: true })
  notes: string; // Player or trainer notes

  @Column({ type: 'boolean', default: false })
  skipped: boolean;

  @ManyToOne(() => WorkoutExecution, execution => execution.exerciseExecutions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workoutExecutionId' })
  workoutExecution: WorkoutExecution;

  @Column({ type: 'uuid' })
  workoutExecutionId: string;

  @Column({ type: 'timestamp' })
  completedAt: Date;
}