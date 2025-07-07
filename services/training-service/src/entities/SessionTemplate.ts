import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { BaseEntity } from '@hockey-hub/shared-lib';
import { WorkoutType } from './WorkoutType';

export enum TemplateCategory {
  PRE_SEASON = 'pre_season',
  IN_SEASON = 'in_season',
  POST_SEASON = 'post_season',
  RECOVERY = 'recovery',
  STRENGTH = 'strength',
  CONDITIONING = 'conditioning',
  SKILL_DEVELOPMENT = 'skill_development',
  INJURY_PREVENTION = 'injury_prevention',
  CUSTOM = 'custom',
}

export enum TemplateVisibility {
  PRIVATE = 'private',
  TEAM = 'team',
  ORGANIZATION = 'organization',
  PUBLIC = 'public',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  PROFESSIONAL = 'professional',
}

@Entity('session_templates')
@Index(['organizationId', 'isActive'])
@Index(['createdBy', 'isActive'])
@Index(['category', 'visibility'])
@Index(['type', 'difficulty'])
export class SessionTemplate extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.CUSTOM,
  })
  category: TemplateCategory;

  @Column({
    type: 'enum',
    enum: WorkoutType,
    default: WorkoutType.MIXED,
  })
  type: WorkoutType;

  @Column({
    type: 'enum',
    enum: DifficultyLevel,
    default: DifficultyLevel.INTERMEDIATE,
  })
  difficulty: DifficultyLevel;

  @Column({
    type: 'enum',
    enum: TemplateVisibility,
    default: TemplateVisibility.PRIVATE,
  })
  visibility: TemplateVisibility;

  @Column({ type: 'varchar', length: 36 })
  @Index()
  organizationId: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  @Index()
  teamId: string;

  @Column({ type: 'varchar', length: 36 })
  createdBy: string;

  @Column({ type: 'integer', default: 60 })
  estimatedDuration: number; // in minutes

  @Column({ type: 'jsonb', nullable: true })
  exercises: {
    exerciseId: string;
    name: string;
    category: string;
    sets: number;
    reps?: number;
    duration?: number;
    distance?: number;
    restBetweenSets: number;
    order: number;
    instructions?: string;
    targetMetrics?: {
      heartRateZone?: string;
      rpe?: number;
      velocity?: number;
      power?: number;
    };
  }[];

  @Column({ type: 'jsonb', nullable: true })
  warmup: {
    duration: number;
    activities: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  cooldown: {
    duration: number;
    activities: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  equipment: string[];

  @Column({ type: 'jsonb', nullable: true })
  targetGroups: {
    positions?: string[];
    ageGroups?: string[];
    skillLevels?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  goals: string[];

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'integer', default: 0 })
  usageCount: number;

  @Column({ type: 'float', nullable: true })
  averageRating: number;

  @Column({ type: 'integer', default: 0 })
  ratingCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isSystemTemplate: boolean;

  @Column({ type: 'jsonb', nullable: true })
  permissions: {
    canEdit: string[]; // List of user IDs who can edit
    canView: string[]; // List of user IDs who can view (in addition to visibility rules)
    canUse: string[]; // List of user IDs who can use for workout creation
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    source?: string; // 'manual', 'imported', 'ai_generated'
    version?: number;
    lastModifiedBy?: string;
    notes?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}