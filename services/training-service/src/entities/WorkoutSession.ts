import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '@hockey-hub/shared-lib';
import { Exercise } from './Exercise';
import { PlayerWorkoutLoad } from './PlayerWorkoutLoad';
import { WorkoutExecution } from './WorkoutExecution';
import { WorkoutType } from './WorkoutType';

export type WorkoutStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

@Entity('workout_sessions')
export class WorkoutSession extends BaseEntity {

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  createdBy: string; // trainer/coach user ID

  @Column({ type: 'enum', enum: WorkoutType })
  type: WorkoutType;

  @Column({ type: 'varchar', length: 50, default: 'scheduled' })
  status: WorkoutStatus;

  @Column({ type: 'timestamp' })
  scheduledDate: Date;

  @Column()
  location: string;

  @Column({ type: 'uuid' })
  teamId: string;

  @Column('simple-array')
  playerIds: string[]; // Array of player IDs assigned to this workout

  @Column({ type: 'int', default: 60 })
  estimatedDuration: number; // in minutes

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    allowIndividualLoads: boolean;
    displayMode: 'grid' | 'focus' | 'tv';
    showMetrics: boolean;
    autoRotation: boolean;
    rotationInterval: number; // seconds
  };

  @OneToMany(() => Exercise, exercise => exercise.workoutSession, { cascade: true })
  exercises: Exercise[];

  @OneToMany(() => PlayerWorkoutLoad, load => load.workoutSession, { cascade: true })
  playerLoads: PlayerWorkoutLoad[];

  @OneToMany(() => WorkoutExecution, execution => execution.workoutSession)
  executions: WorkoutExecution[];

}