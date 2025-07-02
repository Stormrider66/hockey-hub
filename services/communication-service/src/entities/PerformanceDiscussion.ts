import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Conversation } from './Conversation';
import { TrainingDiscussion } from './TrainingDiscussion';

export enum PerformanceMetricType {
  SPEED = 'speed',
  POWER = 'power',
  ENDURANCE = 'endurance',
  TECHNIQUE = 'technique',
  CONSISTENCY = 'consistency',
  MENTAL_FOCUS = 'mental_focus',
  TEAM_PLAY = 'team_play',
  LEADERSHIP = 'leadership',
  OVERALL = 'overall',
}

export enum PerformancePeriod {
  SESSION = 'session',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEASONAL = 'seasonal',
}

export enum PerformanceTrend {
  IMPROVING = 'improving',
  CONSISTENT = 'consistent',
  DECLINING = 'declining',
  VARIABLE = 'variable',
}

@Entity('performance_discussions')
@Index(['player_id', 'period', 'created_at'])
@Index(['training_discussion_id'])
@Index(['organization_id', 'team_id'])
@Unique(['player_id', 'period', 'start_date', 'end_date'])
export class PerformanceDiscussion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversation_id: string;

  @ManyToOne(() => Conversation, { eager: true })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column('uuid')
  player_id: string;

  @Column('uuid')
  coach_id: string;

  @Column('uuid', { nullable: true })
  training_discussion_id?: string;

  @ManyToOne(() => TrainingDiscussion, { nullable: true })
  @JoinColumn({ name: 'training_discussion_id' })
  training_discussion?: TrainingDiscussion;

  @Column({
    type: 'enum',
    enum: PerformancePeriod,
    default: PerformancePeriod.SESSION,
  })
  period: PerformancePeriod;

  @Column({ type: 'timestamp' })
  start_date: Date;

  @Column({ type: 'timestamp' })
  end_date: Date;

  @Column('uuid')
  organization_id: string;

  @Column('uuid', { nullable: true })
  team_id?: string;

  @Column({ type: 'jsonb' })
  performance_metrics: {
    metric_type: PerformanceMetricType;
    current_value: number;
    previous_value?: number;
    target_value?: number;
    trend: PerformanceTrend;
    notes?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  goals?: {
    id: string;
    description: string;
    target_date?: string;
    status: 'pending' | 'in_progress' | 'achieved' | 'missed';
    progress?: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  action_items?: {
    id: string;
    description: string;
    assigned_to: string;
    due_date?: string;
    completed: boolean;
    completed_at?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  strengths?: string[];

  @Column({ type: 'jsonb', nullable: true })
  areas_for_improvement?: string[];

  @Column({ type: 'jsonb', nullable: true })
  training_recommendations?: {
    area: string;
    exercises: string[];
    frequency?: string;
    notes?: string;
  }[];

  @Column({ nullable: true })
  overall_assessment?: string;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 1,
    nullable: true,
  })
  overall_rating?: number; // 1-10 scale

  @Column({ default: false })
  is_confidential: boolean;

  @Column({ default: true })
  parent_can_view: boolean;

  @Column({ type: 'jsonb', nullable: true })
  shared_with?: string[]; // Additional user IDs who can view

  @Column({ type: 'timestamp', nullable: true })
  scheduled_review_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Column('uuid', { nullable: true })
  completed_by?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('uuid')
  created_by: string;
}

@Entity('performance_feedback')
@Index(['performance_discussion_id', 'created_at'])
export class PerformanceFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  performance_discussion_id: string;

  @ManyToOne(() => PerformanceDiscussion)
  @JoinColumn({ name: 'performance_discussion_id' })
  performance_discussion: PerformanceDiscussion;

  @Column('uuid')
  provided_by: string;

  @Column({
    type: 'enum',
    enum: ['coach', 'player', 'parent', 'peer'],
  })
  feedback_type: string;

  @Column('text')
  feedback_content: string;

  @Column({ type: 'jsonb', nullable: true })
  specific_metrics?: {
    metric_type: PerformanceMetricType;
    rating: number;
    comments?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  attachments?: {
    type: 'video' | 'image' | 'document';
    url: string;
    title?: string;
    description?: string;
  }[];

  @Column({ default: false })
  is_private: boolean; // Only visible to coaches

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}