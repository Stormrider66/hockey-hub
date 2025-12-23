import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';

// IMPORTANT:
// Some unit tests import `EvaluationType` as a runtime enum (e.g. `EvaluationType.REGULAR_SEASON`).
// Use a string enum so it exists at runtime, while keeping persisted values compatible with existing schema.
export enum EvaluationType {
  PRESEASON = 'preseason',
  MIDSEASON = 'midseason',
  POSTSEASON = 'postseason',
  MONTHLY = 'monthly',
  GAME = 'game',
  PRACTICE = 'practice',
  // Aliases expected by unit tests
  REGULAR_SEASON = 'game',
  MID_SEASON = 'midseason',
  PLAYOFF = 'postseason',
}

export interface TechnicalSkills {
  skating: {
    forward: number; // 1-10
    backward: number;
    acceleration: number;
    agility: number;
    speed: number;
    balance: number;
    edgeWork: number;
  };
  puckHandling: {
    carrying: number;
    protection: number;
    deking: number;
    receiving: number;
    inTraffic: number;
  };
  shooting: {
    wristShot: number;
    slapShot: number;
    snapshot: number;
    backhand: number;
    accuracy: number;
    release: number;
    power: number;
  };
  passing: {
    forehand: number;
    backhand: number;
    saucer: number;
    accuracy: number;
    timing: number;
    vision: number;
  };
}

export interface TacticalSkills {
  offensive: {
    positioning: number;
    spacing: number;
    timing: number;
    creativity: number;
    finishing: number;
  };
  defensive: {
    positioning: number;
    gapControl: number;
    stickPosition: number;
    bodyPosition: number;
    anticipation: number;
  };
  transition: {
    breakouts: number;
    rushes: number;
    tracking: number;
    backchecking: number;
  };
}

export interface PhysicalAttributes {
  strength: number;
  speed: number;
  endurance: number;
  flexibility: number;
  balance: number;
  coordination: number;
}

export interface MentalAttributes {
  hockeyIQ: number;
  competitiveness: number;
  workEthic: number;
  coachability: number;
  leadership: number;
  teamwork: number;
  discipline: number;
  confidence: number;
  focusUnderPressure: number;
}

export interface GameSpecificNotes {
  gamesObserved: number;
  goals: number;
  assists: number;
  plusMinus: number;
  penaltyMinutes: number;
  keyMoments: string[];
}

export interface DevelopmentPriority {
  priority: number;
  skill: string;
  targetImprovement: string;
  timeline: string;
}

@Entity('player_evaluations')
@Index('idx_evaluations_player_date', ['playerId', 'evaluationDate'])
@Index('idx_evaluations_team_type', ['teamId', 'type'])
@Index('idx_evaluations_coach', ['coachId'])
@Index('idx_evaluations_overall_rating', ['overallRating'])
export class PlayerEvaluation extends BaseEntity {
  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'uuid' })
  coachId: string;

  @Column({ type: 'uuid' })
  teamId: string;

  @Column({ type: 'date' })
  evaluationDate: Date;

  @Column({ 
    type: 'enum', 
    enum: ['preseason', 'midseason', 'postseason', 'monthly', 'game', 'practice']
  })
  type: EvaluationType;

  @Column({ type: 'jsonb' })
  technicalSkills: TechnicalSkills;

  @Column({ type: 'jsonb' })
  tacticalSkills: TacticalSkills;

  @Column({ type: 'jsonb' })
  physicalAttributes: PhysicalAttributes;

  @Column({ type: 'jsonb' })
  mentalAttributes: MentalAttributes;

  @Column({ type: 'text', nullable: true })
  strengths?: string;

  @Column({ type: 'text', nullable: true })
  areasForImprovement?: string;

  @Column({ type: 'text', nullable: true })
  coachComments?: string;

  @Column({ type: 'jsonb', nullable: true })
  gameSpecificNotes?: GameSpecificNotes;

  @Column({ type: 'jsonb' })
  developmentPriorities: DevelopmentPriority[];

  @Column({ type: 'int', nullable: true })
  overallRating?: number; // 1-100

  @Column({ type: 'varchar', length: 50, nullable: true })
  potential?: string; // "Elite", "High", "Average", "Depth"
}