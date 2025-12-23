import { Entity, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';
import { TrainingPlan } from './TrainingPlan';
import { Drill } from './Drill';

const IS_JEST = typeof process.env.JEST_WORKER_ID !== 'undefined';

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

  @Column({ type: IS_JEST ? 'varchar' : 'uuid' })
  @Index()
  organizationId: string;

  @Column({ type: IS_JEST ? 'varchar' : 'uuid' })
  @Index()
  teamId: string;

  @Column({ type: IS_JEST ? 'varchar' : 'uuid' })
  @Index()
  coachId: string;

  @Column({ type: IS_JEST ? 'varchar' : 'uuid', nullable: true })
  trainingPlanId?: string;

  @ManyToOne(() => TrainingPlan, plan => plan.practices, { nullable: true })
  @JoinColumn({ name: 'trainingPlanId' })
  trainingPlan?: TrainingPlan;

  @Column(IS_JEST ? 'datetime' : 'timestamp')
  @Index()
  date: Date;

  @Column()
  duration: number; // in minutes

  @Column({
    type: IS_JEST ? 'simple-enum' : 'enum',
    enum: PracticeStatus,
    default: PracticeStatus.PLANNED
  })
  status: PracticeStatus;

  @Column({
    type: IS_JEST ? 'simple-enum' : 'enum',
    enum: PracticeFocus
  })
  primaryFocus: PracticeFocus;

  @Column('simple-array', { nullable: true })
  secondaryFocus?: PracticeFocus[];

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  rinkId?: string;

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb' })
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

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
  objectives?: string[];

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
  equipment?: string[];

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
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

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
  attendance?: Array<{
    playerId: string;
    present: boolean;
    reason?: string;
  }>;

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
  playerEvaluations?: Array<{
    playerId: string;
    rating: number;
    notes?: string;
    areasOfImprovement?: string[];
  }>;

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
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