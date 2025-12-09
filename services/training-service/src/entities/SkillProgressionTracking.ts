import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';

export interface SkillMeasurement {
  date: Date;
  value: number;
  unit: string; // "km/h", "accuracy %", "reps"
  testConditions?: string;
  evaluatorId: string;
  notes?: string;
  videoReference?: string;
}

export interface Benchmarks {
  ageGroup: string;
  elite: number;
  above_average: number;
  average: number;
  below_average: number;
}

export interface DrillHistory {
  date: Date;
  drillId: string;
  drillName: string;
  performance: number;
  notes?: string;
}

@Entity('skill_progression_tracking')
@Index('idx_skill_progression_player_skill', ['playerId', 'skill'])
@Index('idx_skill_progression_coach', ['coachId'])
@Index('idx_skill_progression_category', ['category'])
@Index('idx_skill_progression_levels', ['currentLevel', 'targetLevel'])
export class SkillProgressionTracking extends BaseEntity {
  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'uuid' })
  coachId: string;

  @Column()
  skill: string; // "Wrist Shot", "Backward Crossovers"

  @Column()
  category: string; // "Shooting", "Skating"

  @Column({ type: 'jsonb' })
  measurements: SkillMeasurement[];

  @Column({ type: 'jsonb', nullable: true })
  benchmarks?: Benchmarks;

  @Column({ type: 'jsonb', nullable: true })
  drillHistory?: DrillHistory[];

  @Column({ type: 'float', nullable: true })
  currentLevel?: number;

  @Column({ type: 'float', nullable: true })
  targetLevel?: number;

  @Column({ type: 'float', nullable: true })
  improvementRate?: number; // percentage per month

  @Column({ type: 'date' })
  startDate: Date;
}