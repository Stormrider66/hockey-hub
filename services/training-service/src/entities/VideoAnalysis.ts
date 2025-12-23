import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './BaseEntity';

// IMPORTANT:
// Some unit tests import `VideoAnalysisType` as a runtime enum (e.g. `VideoAnalysisType.GAME_REVIEW`).
// Use a string enum so it exists at runtime, while keeping persisted values compatible with the existing schema.
export enum VideoAnalysisType {
  GAME_REVIEW = 'game',
  PRACTICE_REVIEW = 'practice',
  SKILL_BREAKDOWN = 'skills',
  OPPONENT_SCOUT = 'tactical',
}
export type ClipCategory = 'positive' | 'negative' | 'neutral' | 'teaching';
export type ImportanceLevel = 'high' | 'medium' | 'low';

export interface VideoClip {
  startTime: number; // seconds
  endTime: number;
  title: string;
  category: ClipCategory;
  players: string[]; // Player IDs involved
  description: string;
  coachingPoints: string[];
  drawingData?: any; // Telestrator/drawing overlay data
}

export interface AnalysisPoint {
  timestamp: number;
  description: string;
  category: string;
  importance: ImportanceLevel;
}

export interface PlayerPerformance {
  positives: AnalysisPoint[];
  improvements: AnalysisPoint[];
  keyMoments: AnalysisPoint[];
}

export interface TeamAnalysis {
  systemExecution: AnalysisPoint[];
  breakdowns: AnalysisPoint[];
  opportunities: AnalysisPoint[];
}

@Entity('video_analyses')
@Index('idx_video_analysis_player_type', ['playerId', 'type'])
@Index('idx_video_analysis_coach', ['coachId'])
@Index('idx_video_analysis_team', ['teamId'])
@Index('idx_video_analysis_game', ['gameId'])
@Index('idx_video_analysis_shared', ['sharedWithPlayer', 'sharedWithTeam'])
export class VideoAnalysis extends BaseEntity {
  @Column({ type: 'uuid' })
  coachId: string;

  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'uuid', nullable: true })
  teamId?: string;

  @Column({ type: 'uuid', nullable: true })
  gameId?: string;

  @Column()
  videoUrl: string;

  @Column()
  title: string;

  @Column({ 
    type: 'enum', 
    enum: ['game', 'practice', 'skills', 'tactical']
  })
  type: VideoAnalysisType;

  @Column({ type: 'jsonb' })
  clips: VideoClip[];

  @Column({ type: 'jsonb', nullable: true })
  playerPerformance?: PlayerPerformance;

  @Column({ type: 'jsonb', nullable: true })
  teamAnalysis?: TeamAnalysis;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'boolean', default: false })
  sharedWithPlayer: boolean;

  @Column({ type: 'boolean', default: false })
  sharedWithTeam: boolean;
}