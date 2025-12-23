import { Entity, Column, OneToMany, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';
import { PracticePlan } from './PracticePlan';

const IS_JEST = typeof process.env.JEST_WORKER_ID !== 'undefined';

export enum PlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum PlanType {
  SEASON = 'season',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  TOURNAMENT = 'tournament',
  DEVELOPMENT = 'development'
}

@Entity('training_plans')
@Index(['organizationId', 'teamId', 'status'])
@Index(['startDate', 'endDate'])
@Index(['coachId', 'status'])
export class TrainingPlan extends AuditableEntity {

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: IS_JEST ? 'varchar' : 'uuid' })
  @Index()
  organizationId: string;

  @Column({ type: IS_JEST ? 'varchar' : 'uuid' })
  @Index()
  teamId: string;

  @Column({ type: IS_JEST ? 'varchar' : 'uuid' })
  @Index()
  coachId: string;

  @Column({
    type: IS_JEST ? 'simple-enum' : 'enum',
    enum: PlanType,
    default: PlanType.SEASON
  })
  type: PlanType;

  @Column({
    type: IS_JEST ? 'simple-enum' : 'enum',
    enum: PlanStatus,
    default: PlanStatus.DRAFT
  })
  status: PlanStatus;

  @Column('date')
  @Index()
  startDate: Date;

  @Column('date')
  @Index()
  endDate: Date;

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
  goals?: Array<{
    id: string;
    title: string;
    description: string;
    category: 'technical' | 'tactical' | 'physical' | 'mental';
    targetDate?: Date;
    measurable: string;
    completed: boolean;
  }>;

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
  focusAreas?: Array<{
    area: string;
    priority: 'high' | 'medium' | 'low';
    weeklyHours: number;
  }>;

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
  periodization?: {
    phases: Array<{
      name: string;
      startWeek: number;
      endWeek: number;
      intensity: 'low' | 'medium' | 'high' | 'peak' | 'recovery';
      focus: string[];
    }>;
  };

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
  weeklyStructure?: {
    monday?: string[];
    tuesday?: string[];
    wednesday?: string[];
    thursday?: string[];
    friday?: string[];
    saturday?: string[];
    sunday?: string[];
  };

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
  metrics?: {
    totalWeeks: number;
    totalHours: number;
    practicesPerWeek: number;
    gamesPerWeek: number;
  };

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @OneToMany(() => PracticePlan, practice => practice.trainingPlan)
  practices: PracticePlan[];

  // Helper methods
  isActive(): boolean {
    const now = new Date();
    return this.status === PlanStatus.ACTIVE && 
           now >= new Date(this.startDate) && 
           now <= new Date(this.endDate);
  }

  getProgress(): number {
    if (!this.goals || this.goals.length === 0) return 0;
    const completed = this.goals.filter(g => g.completed).length;
    return (completed / this.goals.length) * 100;
  }

  getCurrentPhase(currentWeek: number): PeriodizationPhase | null {
    if (!this.periodization?.phases) return null;
    return this.periodization.phases.find(phase => 
      currentWeek >= phase.startWeek && currentWeek <= phase.endWeek
    ) || null;
  }
}

// Type definitions for better type safety
interface PeriodizationPhase {
  name: string;
  startWeek: number;
  endWeek: number;
  intensity: 'low' | 'medium' | 'high' | 'peak' | 'recovery';
  focus: string[];
}