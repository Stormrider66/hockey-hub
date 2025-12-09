import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';

export type DevelopmentPlanStatus = 'active' | 'paused' | 'completed' | 'archived';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed';
export type GoalCategory = 'technical' | 'tactical' | 'physical' | 'mental';
export type MilestoneStatus = 'pending' | 'achieved' | 'missed';
export type CommunicationMethod = 'meeting' | 'email' | 'phone';
export type ExternalResourceType = 'video' | 'article' | 'course' | 'camp';

export interface CurrentLevel {
  overallRating: number;
  strengths: string[];
  weaknesses: string[];
  recentEvaluation: string; // Evaluation ID
}

export interface DevelopmentGoal {
  id: string;
  category: GoalCategory;
  skill: string;
  currentLevel: number;
  targetLevel: number;
  deadline: Date;
  specificActions: string[];
  measurementMethod: string;
  progress: number; // percentage
  status: GoalStatus;
}

export interface WeeklyPlan {
  week: number;
  focus: string[];
  drills: string[]; // Drill IDs
  targetMetrics: any;
  actualMetrics?: any;
}

export interface Milestone {
  date: Date;
  description: string;
  metric: string;
  target: number;
  achieved?: number;
  status: MilestoneStatus;
}

export interface ParentCommunication {
  date: Date;
  method: CommunicationMethod;
  summary: string;
  nextFollowUp?: Date;
}

export interface ExternalResource {
  type: ExternalResourceType;
  name: string;
  url?: string;
  assignedDate: Date;
  completedDate?: Date;
}

@Entity('player_development_plans')
@Index('idx_dev_plans_player_season', ['playerId', 'seasonId'])
@Index('idx_dev_plans_coach_status', ['coachId', 'status'])
@Index('idx_dev_plans_date_range', ['startDate', 'endDate'])
@Index('idx_dev_plans_status', ['status'])
export class PlayerDevelopmentPlan extends BaseEntity {
  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'uuid' })
  coachId: string;

  @Column({ type: 'uuid' })
  seasonId: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'jsonb' })
  currentLevel: CurrentLevel;

  @Column({ type: 'jsonb' })
  goals: DevelopmentGoal[];

  @Column({ type: 'jsonb' })
  weeklyPlan: WeeklyPlan[];

  @Column({ type: 'jsonb' })
  milestones: Milestone[];

  @Column({ type: 'jsonb', nullable: true })
  parentCommunication?: ParentCommunication[];

  @Column({ type: 'jsonb', nullable: true })
  externalResources?: ExternalResource[];

  @Column({ 
    type: 'enum', 
    enum: ['active', 'paused', 'completed', 'archived'],
    default: 'active'
  })
  status: DevelopmentPlanStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}