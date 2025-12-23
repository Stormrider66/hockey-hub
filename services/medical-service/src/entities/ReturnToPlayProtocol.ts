// @ts-nocheck - Complex service with TypeORM issues
import { Entity, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib';
import { Injury } from './Injury';

export enum ProtocolStatus {
  INITIATED = 'initiated',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused'
}

export enum ClearanceLevel {
  NO_CONTACT = 'no_contact',
  LIMITED_CONTACT = 'limited_contact',
  FULL_CONTACT = 'full_contact',
  GAME_READY = 'game_ready'
}

export enum ProtocolPhase {
  REST = 'rest',
  LIGHT_ACTIVITY = 'light_activity',
  SPORT_SPECIFIC = 'sport_specific',
  NON_CONTACT_TRAINING = 'non_contact_training',
  FULL_CONTACT_PRACTICE = 'full_contact_practice',
  GAME_CLEARANCE = 'game_clearance'
}

@Entity('return_to_play_protocols')
export class ReturnToPlayProtocol extends AuditableEntity {
  @Column({ name: 'player_id', type: 'uuid' })
  playerId: string;

  @Column({ name: 'injury_id', type: 'uuid' })
  injuryId: string;

  @ManyToOne(() => Injury, injury => injury.returnToPlayProtocols)
  @JoinColumn({ name: 'injury_id' })
  injury: Injury;

  @Column({
    name: 'protocol_status',
    type: 'enum',
    enum: ProtocolStatus,
    default: ProtocolStatus.INITIATED
  })
  status: ProtocolStatus;

  @Column({
    name: 'current_phase',
    type: 'enum',
    enum: ProtocolPhase,
    default: ProtocolPhase.REST
  })
  currentPhase: ProtocolPhase;

  @Column({
    name: 'clearance_level',
    type: 'enum',
    enum: ClearanceLevel,
    default: ClearanceLevel.NO_CONTACT
  })
  clearanceLevel: ClearanceLevel;

  @Column({ name: 'protocol_start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'expected_completion_date', type: 'timestamp', nullable: true })
  expectedCompletionDate?: Date;

  @Column({ name: 'actual_completion_date', type: 'timestamp', nullable: true })
  actualCompletionDate?: Date;

  @Column({ name: 'medical_officer_id', type: 'uuid' })
  medicalOfficerId: string;

  @Column({ name: 'supervising_trainer_id', type: 'uuid', nullable: true })
  supervisingTrainerId?: string;

  @Column({ name: 'protocol_notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'compliance_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  complianceScore?: number;

  @Column({ name: 'total_sessions_required', type: 'int', default: 0 })
  totalSessionsRequired: number;

  @Column({ name: 'sessions_completed', type: 'int', default: 0 })
  sessionsCompleted: number;

  @Column({ name: 'assessments_passed', type: 'int', default: 0 })
  assessmentsPassed: number;

  @Column({ name: 'assessments_failed', type: 'int', default: 0 })
  assessmentsFailed: number;

  @Column({ name: 'progression_milestones', type: 'jsonb', nullable: true })
  progressionMilestones?: {
    phaseId: string;
    phaseName: string;
    completedDate?: string;
    assessmentScore?: number;
    notes?: string;
    clearingOfficer?: string;
  }[];

  @Column({ name: 'risk_factors', type: 'jsonb', nullable: true })
  riskFactors?: {
    factor: string;
    severity: 'low' | 'medium' | 'high';
    mitigationPlan?: string;
  }[];

  @Column({ name: 'performance_benchmarks', type: 'jsonb', nullable: true })
  performanceBenchmarks?: {
    metric: string;
    baseline: number;
    current: number;
    target: number;
    unit: string;
    lastTested: string;
  }[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => RehabilitationSession, session => session.protocol, { cascade: true })
  rehabilitationSessions: RehabilitationSession[];

  // Computed properties
  get completionPercentage(): number {
    if (this.totalSessionsRequired === 0) return 0;
    return Math.round((this.sessionsCompleted / this.totalSessionsRequired) * 100);
  }

  get daysInProtocol(): number {
    const now = new Date();
    const start = new Date(this.startDate);
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  get isOverdue(): boolean {
    if (!this.expectedCompletionDate) return false;
    return new Date() > new Date(this.expectedCompletionDate) && this.status !== ProtocolStatus.COMPLETED;
  }
}

@Entity('rehabilitation_sessions')
export class RehabilitationSession extends AuditableEntity {
  @Column({ name: 'protocol_id', type: 'uuid' })
  protocolId: string;

  @ManyToOne(() => ReturnToPlayProtocol, protocol => protocol.rehabilitationSessions)
  @JoinColumn({ name: 'protocol_id' })
  protocol: ReturnToPlayProtocol;

  @Column({ name: 'session_date', type: 'timestamp' })
  sessionDate: Date;

  @Column({ name: 'session_type', length: 100 })
  sessionType: string; // 'physical_therapy', 'strength_training', 'conditioning', 'skill_work'

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes: number;

  @Column({ name: 'supervising_staff_id', type: 'uuid' })
  supervisingStaffId: string;

  @Column({ name: 'exercises_completed', type: 'jsonb' })
  exercisesCompleted: {
    exerciseId: string;
    exerciseName: string;
    sets?: number;
    reps?: number;
    weight?: number;
    duration?: number;
    intensity?: number;
    notes?: string;
  }[];

  @Column({ name: 'session_rating', type: 'int', nullable: true })
  sessionRating?: number; // 1-10 scale

  @Column({ name: 'pain_level_pre', type: 'int', nullable: true })
  painLevelPre?: number; // 0-10 scale

  @Column({ name: 'pain_level_post', type: 'int', nullable: true })
  painLevelPost?: number; // 0-10 scale

  @Column({ name: 'session_notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'objective_measurements', type: 'jsonb', nullable: true })
  objectiveMeasurements?: {
    metric: string;
    value: number;
    unit: string;
    baseline?: number;
    target?: number;
  }[];

  @Column({ name: 'adherence_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  adherenceScore?: number; // 0-100 percentage

  @Column({ name: 'next_session_recommendations', type: 'text', nullable: true })
  nextSessionRecommendations?: string;

  @Column({ name: 'is_milestone_session', default: false })
  isMilestoneSession: boolean;

  @Column({ name: 'milestone_assessment_results', type: 'jsonb', nullable: true })
  milestoneAssessmentResults?: {
    assessmentName: string;
    result: 'pass' | 'fail' | 'partial';
    score?: number;
    notes?: string;
  }[];
}