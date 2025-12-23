// @ts-nocheck - Suppress TypeScript errors for build
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';

@Entity('workload_analytics')
@Index(['playerId', 'weekStartDate'])
@Index(['teamId', 'weekStartDate'])
@Index(['organizationId', 'periodType', 'weekStartDate'])
export class WorkloadAnalytics extends AuditableEntity {
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

  @Column('date')
  @Index()
  weekStartDate!: Date;

  @Column('varchar', { length: 20, default: 'week' })
  @Index()
  periodType: string = 'week'; // week, month, season

  // Load Metrics
  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  totalWorkload: number = 0;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  acuteWorkload: number = 0; // 7-day rolling average

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  chronicWorkload: number = 0; // 28-day rolling average

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  acuteChronicRatio?: number; // ACWR

  // Load Distribution
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  strengthWorkload: number = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  cardioWorkload: number = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  skillsWorkload: number = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  gameWorkload: number = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  recoveryWorkload: number = 0;

  // Intensity Metrics
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  averageIntensity?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  peakIntensity?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  timeInHighIntensity?: number; // minutes

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  timeInLowIntensity?: number; // minutes

  // Volume Metrics
  @Column('int', { default: 0 })
  totalSessions: number = 0;

  @Column('int', { default: 0 })
  strengthSessions: number = 0;

  @Column('int', { default: 0 })
  cardioSessions: number = 0;

  @Column('int', { default: 0 })
  skillsSessions: number = 0;

  @Column('int', { default: 0 })
  gameSessions: number = 0;

  @Column('int', { default: 0 })
  recoverySessions: number = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  totalTrainingTime: number = 0; // minutes

  // Risk Assessment
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  injuryRiskScore?: number; // 0-100 scale

  @Column('varchar', { length: 20, nullable: true })
  riskLevel?: string; // low, moderate, high, critical

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  fatigueIndex?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  monotonieIndex?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  strainIndex?: number;

  // Recovery Metrics
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  recoveryScore?: number; // 0-100 scale

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  readinessScore?: number;

  @Column('int', { nullable: true })
  restDays?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  sleepQualityAvg?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  hrvAvg?: number;

  // Performance Trends
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  performanceTrend?: number; // -100 to +100

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  fitnessLevel?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  adaptationRate?: number;

  // Recommendations
  @Column('jsonb', { nullable: true })
  recommendations?: {
    type: string; // increase, decrease, maintain, rest
    category: string; // volume, intensity, recovery
    priority: string; // low, medium, high, urgent
    description: string;
    targetChange: number; // percentage
    timeframe: string; // days/weeks
  }[];

  @Column('varchar', { length: 50, nullable: true })
  recommendedAction?: string;

  // Team Comparisons
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  teamPercentileRank?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  positionPercentileRank?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  ageGroupPercentileRank?: number;

  // Compliance
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  planCompliance?: number; // percentage

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  attendanceRate?: number; // percentage

  @Column('int', { default: 0 })
  missedSessions: number = 0;

  // Metadata
  @Column('varchar', { length: 50, default: 'active' })
  @Index()
  status: string = 'active';

  @Column('jsonb', { nullable: true })
  metadata?: {
    calculationMethod?: string;
    dataQuality?: number;
    notes?: string;
    alerts?: string[];
    thresholds?: {
      acwrHigh?: number;
      acwrLow?: number;
      riskHigh?: number;
      fatigueHigh?: number;
    };
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}