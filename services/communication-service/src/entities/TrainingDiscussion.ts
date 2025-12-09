import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Conversation } from './Conversation';

export enum TrainingSessionType {
  ICE_PRACTICE = 'ice_practice',
  PHYSICAL_TRAINING = 'physical_training',
  VIDEO_REVIEW = 'video_review',
  COMBINED = 'combined',
}

export enum DiscussionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('training_discussions')
@Index(['session_id', 'session_type'])
@Index(['status', 'session_date'])
@Unique(['session_id', 'session_type'])
export class TrainingDiscussion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversation_id: string;

  @ManyToOne(() => Conversation, { eager: true })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column('uuid')
  session_id: string;

  @Column({
    type: 'enum',
    enum: TrainingSessionType,
  })
  session_type: TrainingSessionType;

  @Column()
  session_title: string;

  @Column({ type: 'timestamp' })
  session_date: Date;

  @Column({ nullable: true })
  session_location?: string;

  @Column('uuid')
  organization_id: string;

  @Column('uuid', { nullable: true })
  team_id?: string;

  @Column({
    type: 'enum',
    enum: DiscussionStatus,
    default: DiscussionStatus.SCHEDULED,
  })
  status: DiscussionStatus;

  @Column({ type: 'jsonb', nullable: true })
  session_metadata?: {
    duration_minutes?: number;
    coach_ids?: string[];
    trainer_ids?: string[];
    player_ids?: string[];
    exercise_ids?: string[];
    focus_areas?: string[];
    equipment_needed?: string[];
  };

  @Column({ type: 'timestamp', nullable: true })
  archived_at?: Date;

  @Column('uuid', { nullable: true })
  archived_by?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('uuid')
  created_by: string;

  @OneToMany(() => ExerciseDiscussion, (exercise) => exercise.training_discussion)
  exercise_discussions: ExerciseDiscussion[];
}

@Entity('exercise_discussions')
@Index(['training_discussion_id', 'exercise_id'])
export class ExerciseDiscussion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  training_discussion_id: string;

  @ManyToOne(() => TrainingDiscussion)
  @JoinColumn({ name: 'training_discussion_id' })
  training_discussion: TrainingDiscussion;

  @Column('uuid')
  exercise_id: string;

  @Column()
  exercise_name: string;

  @Column({ nullable: true })
  exercise_description?: string;

  @Column('uuid')
  thread_conversation_id: string;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'thread_conversation_id' })
  thread_conversation: Conversation;

  @Column({ type: 'jsonb', nullable: true })
  exercise_metadata?: {
    duration_minutes?: number;
    sets?: number;
    reps?: number;
    intensity?: string;
    notes?: string;
  };

  @Column({ default: 0 })
  feedback_count: number;

  @Column({ default: 0 })
  attachment_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}