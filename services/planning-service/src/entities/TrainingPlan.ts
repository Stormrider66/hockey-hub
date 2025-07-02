import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/entities/BaseEntity';
import { PracticePlan } from './PracticePlan';

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

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column('uuid')
  @Index()
  teamId: string;

  @Column('uuid')
  @Index()
  coachId: string;

  @Column({
    type: 'enum',
    enum: PlanType
  })
  type: PlanType;

  @Column({
    type: 'enum',
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

  @Column('jsonb')
  goals: Array<{
    id: string;
    title: string;
    description: string;
    category: 'technical' | 'tactical' | 'physical' | 'mental';
    targetDate?: Date;
    measurable: string;
    completed: boolean;
  }>;

  @Column('jsonb')
  focusAreas: Array<{
    area: string;
    priority: 'high' | 'medium' | 'low';
    weeklyHours: number;
  }>;

  @Column('jsonb', { nullable: true })
  periodization?: {
    phases: Array<{
      name: string;
      startWeek: number;
      endWeek: number;
      intensity: 'low' | 'medium' | 'high' | 'peak' | 'recovery';
      focus: string[];
    }>;
  };

  @Column('jsonb', { nullable: true })
  weeklyStructure?: {
    monday?: string[];
    tuesday?: string[];
    wednesday?: string[];
    thursday?: string[];
    friday?: string[];
    saturday?: string[];
    sunday?: string[];
  };

  @Column('jsonb', { nullable: true })
  metrics?: {
    totalWeeks: number;
    totalHours: number;
    practicesPerWeek: number;
    gamesPerWeek: number;
  };

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

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

  getCurrentPhase(currentWeek: number): any {
    if (!this.periodization?.phases) return null;
    return this.periodization.phases.find(phase => 
      currentWeek >= phase.startWeek && currentWeek <= phase.endWeek
    );
  }
}