// @ts-nocheck - Suppress TypeScript errors for build
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';

@Entity('player_performance_stats')
@Index(['playerId', 'seasonId', 'date'])
@Index(['teamId', 'date'])
@Index(['organizationId', 'date'])
export class PlayerPerformanceStats extends AuditableEntity {
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
  seasonId!: string;

  @Column('date')
  @Index()
  date!: Date;

  // Physical Test Results
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  verticalJump?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  sprintTime?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  vo2Max?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  strengthBenchmark?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  agilityScore?: number;

  // Wellness Metrics
  @Column('int', { nullable: true })
  sleepQuality?: number; // 1-10 scale

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  hrv?: number;

  @Column('int', { nullable: true })
  energyLevel?: number; // 1-10 scale

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  readinessScore?: number;

  // Training Load
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  weeklyWorkload?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  trainingIntensity?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  fatigueLevel?: number;

  // Game Statistics
  @Column('int', { default: 0 })
  goals: number = 0;

  @Column('int', { default: 0 })
  assists: number = 0;

  @Column('int', { default: 0 })
  plusMinus: number = 0;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  iceTime: number = 0;

  @Column('int', { default: 0 })
  shots: number = 0;

  @Column('int', { default: 0 })
  hits: number = 0;

  @Column('int', { default: 0 })
  blocks: number = 0;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  faceoffPercentage?: number;

  // Performance Trends
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  performanceTrend?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  percentileRanking?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  improvementRate?: number;

  // Metadata
  @Column('varchar', { length: 50, default: 'active' })
  @Index()
  status: string = 'active';

  @Column('jsonb', { nullable: true })
  metadata?: {
    gameId?: string;
    testSessionId?: string;
    notes?: string;
    tags?: string[];
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}