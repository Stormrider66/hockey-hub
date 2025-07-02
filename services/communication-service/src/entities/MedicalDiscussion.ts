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

export enum MedicalDiscussionType {
  INJURY_TREATMENT = 'injury_treatment',
  RECOVERY_PLANNING = 'recovery_planning',
  TEAM_HEALTH_UPDATE = 'team_health_update',
  PLAYER_ASSESSMENT = 'player_assessment',
  RETURN_TO_PLAY = 'return_to_play',
  PREVENTIVE_CARE = 'preventive_care',
}

export enum MedicalDiscussionStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  FOLLOW_UP_REQUIRED = 'follow_up_required',
  ARCHIVED = 'archived',
}

export enum MedicalDiscussionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum MedicalConfidentialityLevel {
  GENERAL = 'general', // Can be seen by coaching staff
  MEDICAL_ONLY = 'medical_only', // Only medical staff
  RESTRICTED = 'restricted', // Only specified participants
}

@Entity('medical_discussions')
@Index(['injury_id'])
@Index(['player_id'])
@Index(['status', 'priority'])
@Index(['team_id', 'status'])
export class MedicalDiscussion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversation_id: string;

  @ManyToOne(() => Conversation, { eager: true })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({
    type: 'enum',
    enum: MedicalDiscussionType,
  })
  discussion_type: MedicalDiscussionType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('uuid', { nullable: true })
  injury_id?: string;

  @Column('uuid', { nullable: true })
  player_id?: string;

  @Column({ nullable: true })
  player_name?: string;

  @Column('uuid')
  organization_id: string;

  @Column('uuid', { nullable: true })
  team_id?: string;

  @Column({
    type: 'enum',
    enum: MedicalDiscussionStatus,
    default: MedicalDiscussionStatus.ACTIVE,
  })
  status: MedicalDiscussionStatus;

  @Column({
    type: 'enum',
    enum: MedicalDiscussionPriority,
    default: MedicalDiscussionPriority.MEDIUM,
  })
  priority: MedicalDiscussionPriority;

  @Column({
    type: 'enum',
    enum: MedicalConfidentialityLevel,
    default: MedicalConfidentialityLevel.MEDICAL_ONLY,
  })
  confidentiality_level: MedicalConfidentialityLevel;

  @Column({ type: 'jsonb', nullable: true })
  medical_metadata?: {
    injury_details?: {
      body_part?: string;
      severity?: string;
      mechanism?: string;
      diagnosis?: string;
    };
    treatment_plan?: {
      current_phase?: number;
      total_phases?: number;
      phase_description?: string;
      next_evaluation?: Date;
    };
    recovery_timeline?: {
      estimated_return?: Date;
      milestones?: Array<{
        date: Date;
        description: string;
        completed: boolean;
      }>;
    };
    restrictions?: string[];
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      start_date: Date;
      end_date?: Date;
    }>;
    involved_staff?: Array<{
      staff_id: string;
      role: string;
      name: string;
    }>;
  };

  @Column({ type: 'timestamp', nullable: true })
  resolved_at?: Date;

  @Column('uuid', { nullable: true })
  resolved_by?: string;

  @Column({ type: 'text', nullable: true })
  resolution_notes?: string;

  @Column({ type: 'timestamp', nullable: true })
  follow_up_date?: Date;

  @Column({ type: 'timestamp', nullable: true })
  archived_at?: Date;

  @Column('uuid', { nullable: true })
  archived_by?: string;

  @Column({ type: 'simple-array', nullable: true })
  authorized_viewers?: string[]; // User IDs who can view despite restrictions

  @Column({ default: false })
  requires_acknowledgment: boolean;

  @Column({ type: 'simple-array', nullable: true })
  acknowledged_by?: string[]; // User IDs who have acknowledged

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('uuid')
  created_by: string;

  @Column({ nullable: true })
  created_by_name?: string;

  @Column({ nullable: true })
  created_by_role?: string;

  @OneToMany(() => MedicalActionItem, (item) => item.medical_discussion)
  action_items: MedicalActionItem[];
}

@Entity('medical_action_items')
@Index(['medical_discussion_id', 'status'])
@Index(['assigned_to', 'due_date'])
export class MedicalActionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  medical_discussion_id: string;

  @ManyToOne(() => MedicalDiscussion)
  @JoinColumn({ name: 'medical_discussion_id' })
  medical_discussion: MedicalDiscussion;

  @Column()
  description: string;

  @Column('uuid', { nullable: true })
  assigned_to?: string;

  @Column({ nullable: true })
  assigned_to_name?: string;

  @Column({ nullable: true })
  assigned_to_role?: string;

  @Column({ type: 'timestamp', nullable: true })
  due_date?: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Column('uuid', { nullable: true })
  completed_by?: string;

  @Column({ type: 'text', nullable: true })
  completion_notes?: string;

  @Column({
    type: 'enum',
    enum: MedicalDiscussionPriority,
    default: MedicalDiscussionPriority.MEDIUM,
  })
  priority: MedicalDiscussionPriority;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column('uuid')
  created_by: string;
}