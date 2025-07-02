import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib';

@Entity('training_statistics')
@Index(['playerId', 'sessionId', 'date'])
@Index(['teamId', 'trainingType', 'date'])
@Index(['organizationId', 'date'])
export class TrainingStatistics extends AuditableEntity {
  id!: string;

  @Column('uuid')
  @Index()
  playerId!: string;

  @Column('uuid')
  @Index()
  teamId!: string;

  @Column('uuid')
  @Index()
  organizationId!: string;

  @Column('uuid', { nullable: true })
  @Index()
  sessionId?: string;

  @Column('date')
  @Index()
  date!: Date;

  @Column('varchar', { length: 50 })
  @Index()
  trainingType!: string; // strength, cardio, skills, recovery, physical_test

  // Session Analytics
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  completionRate: number = 0;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  averageIntensity?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  totalWorkload?: number;

  @Column('int', { nullable: true })
  durationMinutes?: number;

  @Column('int', { nullable: true })
  exercisesCompleted?: number;

  @Column('int', { nullable: true })
  exercisesTotal?: number;

  // Load Distribution
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  strengthLoad?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  cardioLoad?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  skillsLoad?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  recoveryLoad?: number;

  // Performance Metrics
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  averageHeartRate?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  maxHeartRate?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  caloriesBurned?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  rpe?: number; // Rate of Perceived Exertion (1-10)

  // Goal Achievement
  @Column('jsonb', { nullable: true })
  goalsAchieved?: {
    goalId: string;
    targetValue: number;
    actualValue: number;
    achievementRate: number;
    achieved: boolean;
  }[];

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  overallGoalAchievementRate?: number;

  // Improvement Tracking
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  improvementFromLastSession?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  improvementFromBaseline?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  weeklyImprovementRate?: number;

  // Exercise Performance
  @Column('jsonb', { nullable: true })
  exercisePerformance?: {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number;
    weight?: number;
    duration?: number;
    distance?: number;
    personalBest: boolean;
    improvementPercent?: number;
  }[];

  // Program Effectiveness
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  programEffectivenessScore?: number;

  @Column('varchar', { length: 100, nullable: true })
  programName?: string;

  @Column('varchar', { length: 50, nullable: true })
  programPhase?: string;

  // Compliance & Attendance
  @Column('boolean', { default: true })
  attended: boolean = true;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  attendanceRate?: number; // calculated over time period

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  complianceScore?: number;

  // Risk & Recovery
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  injuryRiskScore?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  recoveryScore?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  fatigueLevel?: number;

  // Metadata
  @Column('varchar', { length: 50, default: 'completed' })
  @Index()
  status: string = 'completed';

  @Column('jsonb', { nullable: true })
  metadata?: {
    trainerId?: string;
    facilityId?: string;
    weather?: string;
    equipment?: string[];
    notes?: string;
    tags?: string[];
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}