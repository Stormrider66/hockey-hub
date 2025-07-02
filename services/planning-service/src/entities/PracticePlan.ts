import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/entities/BaseEntity';
import { TrainingPlan } from './TrainingPlan';
import { Drill } from './Drill';

export enum PracticeStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum PracticeFocus {
  SKILLS = 'skills',
  TACTICS = 'tactics',
  CONDITIONING = 'conditioning',
  GAME_PREP = 'game_prep',
  RECOVERY = 'recovery',
  EVALUATION = 'evaluation'
}

@Entity('practice_plans')
@Index(['organizationId', 'teamId', 'date'])
@Index(['coachId', 'status'])
@Index(['date', 'status'])
export class PracticePlan extends AuditableEntity {

  @Column()
  title: string;

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

  @Column('uuid', { nullable: true })
  trainingPlanId?: string;

  @ManyToOne(() => TrainingPlan, plan => plan.practices, { nullable: true })
  @JoinColumn({ name: 'trainingPlanId' })
  trainingPlan?: TrainingPlan;

  @Column('timestamp')
  @Index()
  date: Date;

  @Column()
  duration: number; // in minutes

  @Column({
    type: 'enum',
    enum: PracticeStatus,
    default: PracticeStatus.PLANNED
  })
  status: PracticeStatus;

  @Column({
    type: 'enum',
    enum: PracticeFocus
  })
  primaryFocus: PracticeFocus;

  @Column('simple-array', { nullable: true })
  secondaryFocus?: PracticeFocus[];

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  rinkId?: string;

  @Column('jsonb')
  sections: Array<{
    id: string;
    name: string;
    duration: number;
    drillIds: string[];
    notes?: string;
    equipment?: string[];
  }>;

  @ManyToMany(() => Drill)
  @JoinTable({
    name: 'practice_drills',
    joinColumn: { name: 'practiceId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'drillId', referencedColumnName: 'id' }
  })
  drills: Drill[];

  @Column('jsonb', { nullable: true })
  objectives?: string[];

  @Column('jsonb', { nullable: true })
  equipment?: string[];

  @Column('jsonb', { nullable: true })
  lineups?: {
    forward1: string[];
    forward2: string[];
    forward3: string[];
    forward4: string[];
    defense1: string[];
    defense2: string[];
    defense3: string[];
    goalies: string[];
    scratched: string[];
  };

  @Column('text', { nullable: true })
  notes?: string;

  @Column('text', { nullable: true })
  coachFeedback?: string;

  @Column('jsonb', { nullable: true })
  attendance?: Array<{
    playerId: string;
    present: boolean;
    reason?: string;
  }>;

  @Column('jsonb', { nullable: true })
  playerEvaluations?: Array<{
    playerId: string;
    rating: number;
    notes?: string;
    areasOfImprovement?: string[];
  }>;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  // Helper methods
  getTotalDuration(): number {
    return this.sections.reduce((total, section) => total + section.duration, 0);
  }

  getAttendanceRate(): number {
    if (!this.attendance || this.attendance.length === 0) return 0;
    const present = this.attendance.filter(a => a.present).length;
    return (present / this.attendance.length) * 100;
  }

  getDrillCount(): number {
    return this.sections.reduce((total, section) => total + section.drillIds.length, 0);
  }
}