import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { ExerciseCategory, ExerciseUnit } from './Exercise';

@Entity('exercise_templates')
export class ExerciseTemplate extends BaseEntity {

  @Column({ unique: true })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  category: ExerciseCategory;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  primaryUnit: ExerciseUnit;

  @Column('simple-array', { nullable: true })
  equipment: string[];

  @Column('simple-array', { nullable: true })
  muscleGroups: string[];

  @Column({ nullable: true })
  instructions: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  defaultParameters: {
    sets?: number;
    reps?: number;
    duration?: number;
    restDuration?: number;
    intensityLevel?: 'low' | 'medium' | 'high' | 'max';
  };

  @Column({ type: 'jsonb', nullable: true })
  progressionGuidelines: {
    beginnerRange?: { min: number; max: number };
    intermediateRange?: { min: number; max: number };
    advancedRange?: { min: number; max: number };
    unit: string;
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string; // trainer who created the template

  @Column({ type: 'uuid', nullable: true })
  organizationId?: string; // for multi-tenancy

}