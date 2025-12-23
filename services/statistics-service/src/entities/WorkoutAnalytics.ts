// @ts-nocheck - Suppress TypeScript errors for build
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';

export enum WorkoutType {
  STRENGTH = 'strength',
  CONDITIONING = 'conditioning',
  AGILITY = 'agility',
  HYBRID = 'hybrid',
  RECOVERY = 'recovery',
  SKILL = 'skill'
}

export enum AggregationLevel {
  SESSION = 'session',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SEASONAL = 'seasonal'
}

@Entity('workout_analytics')
@Index(['workoutId', 'playerId'])
@Index(['teamId', 'workoutType', 'timestamp'])
@Index(['organizationId', 'aggregationLevel', 'timestamp'])
@Index(['trainerId', 'timestamp'])
export class WorkoutAnalytics extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { nullable: true })
  @Index()
  workoutId?: string; // Null for aggregated data

  @Column('uuid', { nullable: true })
  @Index()
  playerId?: string; // Null for team-level data

  @Column('uuid')
  @Index()
  teamId!: string;

  @Column('uuid')
  @Index()
  organizationId!: string;

  @Column('uuid', { nullable: true })
  @Index()
  trainerId?: string;

  @Column({
    type: 'enum',
    enum: WorkoutType
  })
  @Index()
  workoutType!: WorkoutType;

  @Column({
    type: 'enum',
    enum: AggregationLevel,
    default: AggregationLevel.SESSION
  })
  @Index()
  aggregationLevel!: AggregationLevel;

  @Column('timestamptz')
  @Index()
  timestamp!: Date;

  @Column('int', { default: 1 })
  sessionCount!: number;

  // Volume Metrics
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalVolume?: number; // Total weight lifted, distance covered, etc.

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalDuration?: number; // Minutes

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  activeTime?: number; // Minutes excluding rest

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  restTime?: number; // Minutes

  // Intensity Metrics
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  averageIntensity?: number; // 0-100 scale

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  peakIntensity?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  averageHeartRate?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  maxHeartRate?: number;

  @Column('jsonb', { nullable: true })
  heartRateZones?: {
    zone1: number; // % time in zone
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };

  // Load Metrics
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  trainingLoad?: number; // TRIMP or similar

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  acuteLoad?: number; // 7-day rolling

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  chronicLoad?: number; // 28-day rolling

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  acuteChronicRatio?: number;

  // Performance Metrics
  @Column('jsonb')
  performanceMetrics!: {
    // Strength specific
    totalReps?: number;
    totalSets?: number;
    totalWeight?: number;
    averageWeight?: number;
    maxWeight?: number;
    oneRepMaxEstimates?: Record<string, number>;
    
    // Conditioning specific
    totalDistance?: number;
    averagePace?: number;
    maxSpeed?: number;
    caloriesBurned?: number;
    powerOutput?: number;
    
    // Agility specific
    drillCompletions?: number;
    averageTime?: number;
    bestTime?: number;
    errorCount?: number;
    successRate?: number;
    
    // Exercise breakdown
    exerciseStats?: Array<{
      exerciseId: string;
      exerciseName: string;
      sets?: number;
      reps?: number;
      weight?: number;
      distance?: number;
      time?: number;
      intensity?: number;
    }>;
  };

  // Compliance & Quality
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  completionRate?: number; // % of planned workout completed

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  adherenceScore?: number; // How well they followed the plan

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  techniqueScore?: number; // If tracked

  @Column('int', { default: 0 })
  skippedExercises!: number;

  @Column('int', { default: 0 })
  modifiedExercises!: number;

  // Fatigue & Recovery
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  perceivedExertion?: number; // RPE 1-10

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  fatigueIndex?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  recoveryScore?: number;

  // Trends & Predictions
  @Column('jsonb', { nullable: true })
  trends?: {
    volumeTrend?: number; // % change from previous period
    intensityTrend?: number;
    loadTrend?: number;
    performanceTrend?: number;
    complianceTrend?: number;
  };

  @Column('jsonb', { nullable: true })
  insights?: {
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
    warnings?: string[];
    achievements?: string[];
  };

  // Metadata
  @Column('jsonb', { nullable: true })
  metadata?: {
    weather?: {
      temperature?: number;
      humidity?: number;
      conditions?: string;
    };
    facility?: {
      id?: string;
      name?: string;
      type?: string;
    };
    equipment?: string[];
    injuries?: string[];
    notes?: string;
    tags?: string[];
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}