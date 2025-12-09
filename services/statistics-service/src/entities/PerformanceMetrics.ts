import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';

export enum MetricType {
  STRENGTH = 'strength',
  CONDITIONING = 'conditioning',
  AGILITY = 'agility',
  WELLNESS = 'wellness',
  GAME = 'game',
  INJURY = 'injury',
  RECOVERY = 'recovery'
}

export enum MetricPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SEASONAL = 'seasonal',
  YEARLY = 'yearly'
}

@Entity('performance_metrics')
@Index(['playerId', 'metricType', 'timestamp'])
@Index(['teamId', 'metricType', 'period'])
@Index(['organizationId', 'timestamp'])
@Index(['period', 'timestamp'])
export class PerformanceMetrics extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
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
  seasonId?: string;

  @Column({
    type: 'enum',
    enum: MetricType
  })
  @Index()
  metricType!: MetricType;

  @Column({
    type: 'enum',
    enum: MetricPeriod,
    default: MetricPeriod.DAILY
  })
  @Index()
  period!: MetricPeriod;

  @Column('timestamptz')
  @Index()
  timestamp!: Date;

  @Column('timestamptz', { nullable: true })
  periodStart?: Date;

  @Column('timestamptz', { nullable: true })
  periodEnd?: Date;

  // Core Metrics
  @Column('jsonb')
  metrics!: {
    // Strength Metrics
    maxSquat?: number;
    maxBench?: number;
    maxDeadlift?: number;
    powerClean?: number;
    verticalJump?: number;
    broadJump?: number;
    
    // Conditioning Metrics
    vo2Max?: number;
    anaerobicPower?: number;
    lactateThreshold?: number;
    restingHeartRate?: number;
    maxHeartRate?: number;
    recoveryHeartRate?: number;
    
    // Agility Metrics
    proAgilityTime?: number;
    tDrillTime?: number;
    lateralSpeed?: number;
    reactionTime?: number;
    changeOfDirectionScore?: number;
    
    // Wellness Metrics
    sleepHours?: number;
    sleepQuality?: number;
    hrv?: number;
    readinessScore?: number;
    energyLevel?: number;
    musclesoreness?: number;
    
    // Game Performance
    goals?: number;
    assists?: number;
    points?: number;
    plusMinus?: number;
    iceTime?: number;
    shots?: number;
    faceoffWinPercentage?: number;
    
    // Recovery Metrics
    activeRecoveryTime?: number;
    passiveRecoveryTime?: number;
    physiotherapySessions?: number;
    massageSessions?: number;
    
    // Custom metrics
    [key: string]: any;
  };

  // Calculated Values
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  performanceIndex?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  trendValue?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  percentileRank?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  improvementRate?: number;

  // Comparisons
  @Column('jsonb', { nullable: true })
  comparisons?: {
    teamAverage?: number;
    positionAverage?: number;
    leagueAverage?: number;
    personalBest?: number;
    seasonAverage?: number;
  };

  // Predictions
  @Column('jsonb', { nullable: true })
  predictions?: {
    nextPeriodEstimate?: number;
    confidenceLevel?: number;
    riskFactors?: string[];
    recommendations?: string[];
  };

  // Data Quality
  @Column('int', { default: 100 })
  dataCompleteness!: number; // Percentage of expected data points

  @Column('varchar', { length: 50, default: 'auto' })
  source!: string; // 'auto', 'manual', 'import', 'device'

  @Column('jsonb', { nullable: true })
  metadata?: {
    workoutIds?: string[];
    gameIds?: string[];
    testSessionIds?: string[];
    deviceIds?: string[];
    notes?: string;
    tags?: string[];
    dataQuality?: {
      missingFields?: string[];
      anomalies?: string[];
      lastValidated?: Date;
    };
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}