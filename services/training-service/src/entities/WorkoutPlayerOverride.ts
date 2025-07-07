import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '@hockey-hub/shared-lib';
import { WorkoutAssignment } from './WorkoutAssignment';

export enum OverrideType {
  MEDICAL = 'medical',
  PERFORMANCE = 'performance',
  SCHEDULING = 'scheduling',
  CUSTOM = 'custom'
}

export enum OverrideStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

@Entity('workout_player_overrides')
@Unique(['workoutAssignmentId', 'playerId', 'effectiveDate'])
@Index('idx_override_player_date', ['playerId', 'effectiveDate'])
@Index('idx_override_type_status', ['overrideType', 'status'])
@Index('idx_override_medical_ref', ['medicalRecordId'])
export class WorkoutPlayerOverride extends BaseEntity {
  
  @Column({ type: 'uuid' })
  @Index('idx_override_assignment')
  workoutAssignmentId: string;

  @ManyToOne(() => WorkoutAssignment, assignment => assignment.playerOverrides, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workoutAssignmentId' })
  workoutAssignment: WorkoutAssignment;

  @Column({ type: 'uuid' })
  @Index('idx_override_player')
  playerId: string;

  @Column({ type: 'enum', enum: OverrideType })
  overrideType: OverrideType;

  @Column({ type: 'enum', enum: OverrideStatus, default: OverrideStatus.PENDING })
  status: OverrideStatus;

  @Column({ type: 'date' })
  effectiveDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'jsonb' })
  modifications: {
    // Load modifications
    loadMultiplier?: number;
    maxHeartRate?: number;
    excludeExercises?: string[];
    substituteExercises?: Array<{
      originalExerciseId: string;
      substituteExerciseId: string;
      reason: string;
    }>;
    
    // Timing modifications
    restMultiplier?: number;
    workDurationMultiplier?: number;
    
    // Intensity modifications
    intensityZone?: {
      min: number;
      max: number;
    };
    
    // Complete exemption
    exempt?: boolean;
    exemptionReason?: string;
    
    // Alternative workout
    alternativeWorkoutId?: string;
    
    // Custom modifications
    customModifications?: Record<string, any>;
  };

  @Column({ type: 'uuid', nullable: true })
  medicalRecordId: string;

  @Column({ type: 'jsonb', nullable: true })
  medicalRestrictions: {
    restrictionType: 'injury' | 'illness' | 'condition' | 'recovery';
    affectedBodyParts?: string[];
    restrictedMovements?: string[];
    maxExertionLevel?: number;
    requiresSupervision?: boolean;
    clearanceRequired?: boolean;
    medicalNotes?: string;
  };

  @Column({ type: 'uuid' })
  requestedBy: string;

  @Column({ type: 'timestamp' })
  requestedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  approvalNotes: string;

  @Column({ type: 'jsonb', nullable: true })
  performanceData: {
    recentTestResults?: Array<{
      testId: string;
      testDate: Date;
      score: number;
      percentile?: number;
    }>;
    currentFitnessLevel?: number;
    fatigueIndex?: number;
    recoveryScore?: number;
    customMetrics?: Record<string, any>;
  };

  @Column({ type: 'jsonb', nullable: true })
  progressionOverride: {
    useCustomProgression: boolean;
    progressionRate?: number;
    targetDate?: Date;
    milestones?: Array<{
      date: Date;
      targetLoad: number;
      targetMetrics: Record<string, any>;
    }>;
  };

  @Column({ type: 'boolean', default: false })
  requiresReview: boolean;

  @Column({ type: 'date', nullable: true })
  nextReviewDate: Date;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  communicationLog: Array<{
    timestamp: Date;
    type: 'notification' | 'reminder' | 'update';
    recipient: string;
    message: string;
    acknowledged?: boolean;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    source: 'medical_staff' | 'coach' | 'auto_generated' | 'player_request';
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    relatedIncidentId?: string;
    notes?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  eventBusMetadata: {
    lastPublishedAt?: Date;
    lastEventId?: string;
    syncedWithMedical?: boolean;
    syncedWithCalendar?: boolean;
  };

  @Column({ type: 'int', default: 0 })
  version: number;
}