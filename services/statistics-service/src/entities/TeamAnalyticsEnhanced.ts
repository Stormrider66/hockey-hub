// @ts-nocheck - Suppress TypeScript errors for build
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';

export enum AnalyticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SEASONAL = 'seasonal',
  YEARLY = 'yearly'
}

export enum TeamMetricCategory {
  PERFORMANCE = 'performance',
  FITNESS = 'fitness',
  HEALTH = 'health',
  TACTICAL = 'tactical',
  PSYCHOLOGICAL = 'psychological'
}

@Entity('team_analytics_enhanced')
@Index(['teamId', 'period', 'timestamp'])
@Index(['organizationId', 'category', 'timestamp'])
@Index(['seasonId', 'timestamp'])
export class TeamAnalyticsEnhanced extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
    enum: AnalyticsPeriod
  })
  @Index()
  period!: AnalyticsPeriod;

  @Column({
    type: 'enum',
    enum: TeamMetricCategory
  })
  @Index()
  category!: TeamMetricCategory;

  @Column('timestamptz')
  @Index()
  timestamp!: Date;

  @Column('timestamptz', { nullable: true })
  periodStart?: Date;

  @Column('timestamptz', { nullable: true })
  periodEnd?: Date;

  @Column('int')
  playerCount!: number;

  // Aggregated Performance Metrics
  @Column('jsonb')
  performanceMetrics!: {
    // Game Performance
    wins?: number;
    losses?: number;
    ties?: number;
    winPercentage?: number;
    goalsFor?: number;
    goalsAgainst?: number;
    goalDifferential?: number;
    
    // Team Statistics
    averageGoalsPerGame?: number;
    averageAssistsPerGame?: number;
    averageShotsPerGame?: number;
    shootingPercentage?: number;
    powerPlayPercentage?: number;
    penaltyKillPercentage?: number;
    faceoffWinPercentage?: number;
    
    // Advanced Metrics
    corsiFor?: number;
    corsiAgainst?: number;
    corsiPercentage?: number;
    expectedGoalsFor?: number;
    expectedGoalsAgainst?: number;
    pdo?: number; // Shooting % + Save %
  };

  // Fitness Metrics
  @Column('jsonb')
  fitnessMetrics!: {
    // Team Averages
    averageVO2Max?: number;
    averageVerticalJump?: number;
    averageSprintTime?: number;
    averageAgilityScore?: number;
    averageStrengthIndex?: number;
    
    // Distribution
    fitnessDistribution?: {
      excellent: number; // % of players
      good: number;
      average: number;
      belowAverage: number;
      poor: number;
    };
    
    // Trends
    improvementRate?: number;
    fitnessConsistency?: number;
    peakPerformancePercentage?: number;
  };

  // Health & Wellness
  @Column('jsonb')
  healthMetrics!: {
    // Injury Metrics
    totalInjuries?: number;
    injuryRate?: number; // per 1000 player hours
    averageRecoveryTime?: number;
    currentInjuredPlayers?: number;
    injuryTypes?: Record<string, number>;
    
    // Wellness
    averageSleepQuality?: number;
    averageReadinessScore?: number;
    averageHRV?: number;
    averageEnergyLevel?: number;
    
    // Workload
    averageTrainingLoad?: number;
    averageAcuteChronicRatio?: number;
    highRiskPlayers?: number; // AC ratio > 1.5
    lowRiskPlayers?: number; // AC ratio 0.8-1.3
  };

  // Training Analytics
  @Column('jsonb')
  trainingMetrics!: {
    // Volume
    totalTrainingHours?: number;
    averageSessionsPerWeek?: number;
    totalWorkouts?: number;
    
    // Compliance
    attendanceRate?: number;
    completionRate?: number;
    adherenceScore?: number;
    
    // Distribution by Type
    workoutDistribution?: {
      strength: number; // percentage
      conditioning: number;
      agility: number;
      recovery: number;
      skill: number;
    };
    
    // Intensity
    averageIntensity?: number;
    highIntensityHours?: number;
    lowIntensityHours?: number;
  };

  // Player Development
  @Column('jsonb')
  developmentMetrics!: {
    // Improvement Rates
    averageImprovement?: number;
    topImprovers?: Array<{
      playerId: string;
      playerName: string;
      improvementRate: number;
    }>;
    
    // Skill Development
    skillProgressionRate?: number;
    technicalProficiency?: number;
    tacticalUnderstanding?: number;
    
    // Youth Development
    youthPlayerCount?: number;
    youthProgressionRate?: number;
    promotionReadyPlayers?: number;
  };

  // Comparative Analytics
  @Column('jsonb', { nullable: true })
  comparisons?: {
    // League Comparisons
    leagueRanking?: number;
    leaguePercentile?: number;
    
    // Historical Comparisons
    lastPeriodChange?: number; // % change
    lastYearChange?: number;
    bestPeriodComparison?: number;
    
    // Peer Comparisons
    divisionRanking?: number;
    similarTeamsComparison?: number;
  };

  // Predictive Analytics
  @Column('jsonb', { nullable: true })
  predictions?: {
    // Performance Predictions
    nextGameWinProbability?: number;
    seasonEndProjection?: {
      wins?: number;
      losses?: number;
      playoffProbability?: number;
    };
    
    // Risk Predictions
    injuryRiskScore?: number;
    burnoutRiskScore?: number;
    
    // Recommendations
    focusAreas?: string[];
    suggestedInterventions?: string[];
  };

  // Efficiency Metrics
  @Column('jsonb', { nullable: true })
  efficiency?: {
    trainingEfficiency?: number; // Results per training hour
    costPerformanceRatio?: number;
    resourceUtilization?: number;
    staffProductivity?: number;
  };

  // Metadata
  @Column('jsonb', { nullable: true })
  metadata?: {
    dataQuality?: number; // 0-100
    missingDataPoints?: string[];
    calculationNotes?: string[];
    anomalies?: string[];
    tags?: string[];
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}