import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib';

@Entity('team_analytics')
@Index(['teamId', 'seasonId', 'date'])
@Index(['organizationId', 'date'])
@Index(['gameType', 'date'])
export class TeamAnalytics extends AuditableEntity {
  id!: string;

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

  @Column('varchar', { length: 50, default: 'regular' })
  @Index()
  gameType: string = 'regular'; // regular, playoff, practice, scrimmage

  // Team Performance Stats
  @Column('int', { default: 0 })
  wins: number = 0;

  @Column('int', { default: 0 })
  losses: number = 0;

  @Column('int', { default: 0 })
  ties: number = 0;

  @Column('int', { default: 0 })
  goalsFor: number = 0;

  @Column('int', { default: 0 })
  goalsAgainst: number = 0;

  @Column('int', { default: 0 })
  shotsFor: number = 0;

  @Column('int', { default: 0 })
  shotsAgainst: number = 0;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  shotPercentage?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  savePercentage?: number;

  // Special Teams
  @Column('int', { default: 0 })
  powerPlayGoals: number = 0;

  @Column('int', { default: 0 })
  powerPlayOpportunities: number = 0;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  powerPlayPercentage?: number;

  @Column('int', { default: 0 })
  shortHandedGoals: number = 0;

  @Column('int', { default: 0 })
  penaltyKillOpportunities: number = 0;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  penaltyKillPercentage?: number;

  // Advanced Analytics
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  corsiFor?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  corsiAgainst?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  corsiPercentage?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  fenwickFor?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  fenwickAgainst?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  fenwickPercentage?: number;

  // Line Performance
  @Column('jsonb', { nullable: true })
  linePerformance?: {
    lineId: string;
    lineNumber: number;
    playersIds: string[];
    iceTime: number;
    goalsFor: number;
    goalsAgainst: number;
    corsi: number;
    rating: number;
  }[];

  // Game Situation Analytics
  @Column('jsonb', { nullable: true })
  situationStats?: {
    evenStrength: {
      goalsFor: number;
      goalsAgainst: number;
      iceTime: number;
    };
    powerPlay: {
      goals: number;
      opportunities: number;
      iceTime: number;
    };
    shortHanded: {
      goals: number;
      iceTime: number;
    };
  };

  // Performance Trends
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  performanceTrend?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  momentumScore?: number;

  @Column('int', { nullable: true })
  leagueRanking?: number;

  // Metadata
  @Column('varchar', { length: 50, default: 'active' })
  @Index()
  status: string = 'active';

  @Column('jsonb', { nullable: true })
  metadata?: {
    gameId?: string;
    opponentTeamId?: string;
    venue?: string;
    notes?: string;
    tags?: string[];
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}