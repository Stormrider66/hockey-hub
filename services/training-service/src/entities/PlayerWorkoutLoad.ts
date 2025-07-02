import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@hockey-hub/shared-lib';
import { WorkoutSession } from './WorkoutSession';

@Entity('player_workout_loads')
export class PlayerWorkoutLoad extends BaseEntity {

  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'float', default: 1.0 })
  loadModifier: number; // 0.5 = 50% load, 1.5 = 150% load

  @Column({ type: 'jsonb', nullable: true })
  exerciseModifications: {
    [exerciseId: string]: {
      sets?: number;
      reps?: number;
      duration?: number;
      targetValue?: number;
      restDuration?: number;
      notes?: string;
    };
  };

  @Column({ nullable: true })
  notes: string; // Trainer notes for this player's modifications

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Can disable player from session

  @ManyToOne(() => WorkoutSession, session => session.playerLoads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workoutSessionId' })
  workoutSession: WorkoutSession;

  @Column({ type: 'uuid' })
  workoutSessionId: string;

}