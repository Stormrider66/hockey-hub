import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { WorkoutSession } from './WorkoutSession';

export type ExerciseCategory = 'strength' | 'cardio' | 'skill' | 'mobility' | 'recovery';
export type ExerciseUnit = 'reps' | 'seconds' | 'meters' | 'watts' | 'kilograms';

@Entity('exercises')
export class Exercise extends BaseEntity {

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 50 })
  category: ExerciseCategory;

  @Column({ type: 'int' })
  orderIndex: number; // Order in the workout

  @Column({ type: 'int', nullable: true })
  sets: number;

  @Column({ type: 'int', nullable: true })
  reps: number;

  @Column({ type: 'int', nullable: true })
  duration: number; // in seconds

  @Column({ type: 'int', nullable: true })
  restDuration: number; // rest between sets in seconds

  @Column({ type: 'varchar', length: 20 })
  unit: ExerciseUnit;

  @Column({ type: 'float', nullable: true })
  targetValue: number; // target weight, watts, distance, etc.

  @Column({ nullable: true })
  equipment: string;

  @Column({ nullable: true })
  instructions: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  intensityZones: {
    zone1: { min: number; max: number; name: string };
    zone2: { min: number; max: number; name: string };
    zone3: { min: number; max: number; name: string };
    zone4: { min: number; max: number; name: string };
    zone5: { min: number; max: number; name: string };
  };

  @ManyToOne(() => WorkoutSession, session => session.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workoutSessionId' })
  workoutSession: WorkoutSession;

  @Column({ type: 'uuid' })
  workoutSessionId: string;
}