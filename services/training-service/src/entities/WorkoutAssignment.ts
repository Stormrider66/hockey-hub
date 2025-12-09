import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { WorkoutSession } from './WorkoutSession';
import { WorkoutPlayerOverride } from './WorkoutPlayerOverride';
import { WorkoutType } from './WorkoutType';

export enum AssignmentType {
  INDIVIDUAL = 'individual',
  TEAM = 'team',
  LINE = 'line',
  POSITION = 'position',
  AGE_GROUP = 'age_group',
  CUSTOM_GROUP = 'custom_group'
}

export enum AssignmentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}

export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

@Entity('workout_assignments')
@Unique(['workoutSessionId', 'organizationId', 'effectiveDate'])
@Index('idx_assignment_organization_date', ['organizationId', 'effectiveDate'])
@Index('idx_assignment_type_status', ['assignmentType', 'status'])
@Index('idx_assignment_parent', ['parentAssignmentId'])
@Index('idx_assignment_created_by', ['createdBy'])
export class WorkoutAssignment extends BaseEntity {
  
  @Column({ type: 'uuid' })
  @Index('idx_assignment_workout')
  workoutSessionId: string;

  @Column({ type: 'uuid', nullable: true })
  sessionTemplateId: string;

  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'uuid' })
  teamId: string;

  @ManyToOne(() => WorkoutSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workoutSessionId' })
  workoutSession: WorkoutSession;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'enum', enum: AssignmentType })
  assignmentType: AssignmentType;

  @Column({ type: 'enum', enum: AssignmentStatus, default: AssignmentStatus.DRAFT })
  status: AssignmentStatus;

  @Column({ type: 'enum', enum: WorkoutType, nullable: true })
  workoutType: WorkoutType;

  @Column({ type: 'jsonb' })
  assignmentTarget: {
    teamId?: string;
    lineId?: string;
    positionCode?: string;
    ageGroupId?: string;
    customGroupId?: string;
    playerIds?: string[];
  };

  @Column({ type: 'date' })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'timestamp' })
  scheduledDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'int', nullable: true })
  exercisesCompleted: number;

  @Column({ type: 'int', nullable: true })
  exercisesTotal: number;

  @Column({ type: 'enum', enum: RecurrenceType, default: RecurrenceType.NONE })
  recurrenceType: RecurrenceType;

  @Column({ type: 'jsonb', nullable: true })
  recurrencePattern: {
    interval?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    endDate?: Date;
    occurrences?: number;
    exceptions?: Date[];
  };

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'jsonb', nullable: true })
  loadProgression: {
    baseLoad: number;
    progressionType: 'linear' | 'stepped' | 'wave' | 'custom';
    progressionRate: number;
    progressionInterval: 'daily' | 'weekly' | 'monthly';
    maxLoad?: number;
    minLoad?: number;
    customProgression?: Array<{
      week: number;
      loadMultiplier: number;
    }>;
  };

  @Column({ type: 'jsonb', nullable: true })
  performanceThresholds: {
    minCompletionRate?: number;
    targetHeartRateZone?: {
      min: number;
      max: number;
    };
    targetPowerOutput?: number;
    targetVelocity?: number;
    customMetrics?: Record<string, any>;
  };

  @Column({ type: 'boolean', default: true })
  allowPlayerOverrides: boolean;

  @Column({ type: 'boolean', default: false })
  requireMedicalClearance: boolean;

  @Column({ type: 'jsonb', nullable: true })
  notifications: {
    enabled: boolean;
    reminderMinutesBefore: number[];
    notifyOnCompletion: boolean;
    notifyOnMissed: boolean;
    customRecipients?: string[];
  };

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_assignment_parent_hierarchy')
  parentAssignmentId: string;

  @ManyToOne(() => WorkoutAssignment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentAssignmentId' })
  parentAssignment: WorkoutAssignment;

  @OneToMany(() => WorkoutAssignment, assignment => assignment.parentAssignment)
  childAssignments: WorkoutAssignment[];

  @OneToMany(() => WorkoutPlayerOverride, override => override.workoutAssignment, { cascade: true })
  playerOverrides: WorkoutPlayerOverride[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    source?: 'manual' | 'template' | 'ai_generated' | 'imported';
    templateId?: string;
    importSource?: string;
    tags?: string[];
    notes?: string;
    // Planning integration metadata
    planningPhaseId?: string;
    seasonPlanId?: string;
    lastPhaseAdjustment?: Date;
    phaseAdjustments?: Array<{
      adjustmentType: 'load' | 'frequency' | 'intensity' | 'exercise_selection';
      originalValue: any;
      adjustedValue: any;
      reason: string;
      appliedAt: Date;
      appliedBy: string;
    }>;
    originalPlanningData?: {
      baseLoad?: number;
      originalFrequency?: number;
      originalIntensity?: any;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  eventMetadata: {
    publishedEvents: Array<{
      type: string;
      publishedAt: string;
      eventId: string;
    }>;
  };

  // For backward compatibility, keep the old field but mark as deprecated
  @Column({ type: 'jsonb', nullable: true })
  eventBusMetadata: {
    lastPublishedAt?: Date;
    lastEventId?: string;
    publishedEvents?: string[];
    subscribedEvents?: string[];
  };

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date;

  @Column({ type: 'int', default: 0 })
  version: number;
}