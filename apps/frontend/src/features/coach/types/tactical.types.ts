/**
 * Tactical Analysis Types
 * 
 * TypeScript definitions for hockey tactical analysis system
 */

// Basic geometric and positional types
export interface Position {
  x: number; // 0-100 (percentage of ice width)
  y: number; // 0-100 (percentage of ice length)
}

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  position: Position;
  jerseyNumber?: number;
}

export type PlayerRole = 'C' | 'LW' | 'RW' | 'LD' | 'RD' | 'G';

// Formation and tactical structure
export interface Formation {
  id: string;
  name: string;
  type: FormationType;
  players: Player[];
  description?: string;
}

export type FormationType = 
  | '1-2-2-balanced'
  | '2-1-2-aggressive' 
  | '1-3-1-trap'
  | '2-2-1-diamond'
  | '1-2-2-umbrella' // Power play
  | '2-1-2-overload' // Power play
  | 'box-pk'        // Penalty kill
  | 'diamond-pk'    // Penalty kill
  | 'custom';

// Movement and timing
export interface Movement {
  id: string;
  playerId: string;
  type: MovementType;
  startTime: number; // seconds
  endTime: number;   // seconds
  startPosition: Position;
  endPosition: Position;
  phase: PlayPhase;
  description?: string;
}

export type MovementType = 
  | 'skate'
  | 'pass'
  | 'shoot'
  | 'check'
  | 'screen'
  | 'cycle'
  | 'support'
  | 'transition';

export type PlayPhase = 'setup' | 'execution' | 'finish' | 'recovery';

// Tactical play structure
export interface TacticalPlay {
  id: string;
  name: string;
  formation: Formation;
  movements?: Movement[];
  objectives?: string[];
  duration?: number; // seconds
  complexity: ComplexityLevel;
  category: PlayCategory;
  gamePhase: GamePhase;
  zone: IceZone;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'advanced';
export type PlayCategory = 'offensive' | 'defensive' | 'transition' | 'special-teams';
export type GamePhase = 'even-strength' | 'power-play' | 'penalty-kill' | 'empty-net' | '4v4' | '3v3';
export type IceZone = 'offensive-zone' | 'neutral-zone' | 'defensive-zone' | 'full-ice';

// Situational context
export interface GameSituation {
  period: number;
  timeRemaining: number; // seconds
  scoreState: ScoreState;
  manpowerState: ManpowerState;
  momentum: 'home' | 'away' | 'neutral';
  fatigue: FatigueLevel;
}

export type ScoreState = 'leading' | 'tied' | 'trailing';
export type ManpowerState = '5v5' | '5v4' | '4v5' | '5v3' | '3v5' | '4v4' | '3v3' | '6v5' | '5v6';
export type FatigueLevel = 'fresh' | 'moderate' | 'tired' | 'exhausted';

// Analysis and evaluation
export interface TacticalAnalysis {
  playId: string;
  timestamp: Date;
  analysisType: AnalysisType;
  scores: AnalysisScores;
  strengths: string[];
  weaknesses: string[];
  recommendations: TacticalRecommendation[];
  risks: TacticalRisk[];
  confidence: number; // 0-100
  aiProvider?: 'openai' | 'claude' | 'local' | 'hybrid';
}

export type AnalysisType = 'quick' | 'detailed' | 'comparative' | 'opponent-perspective' | 'learning';

export interface AnalysisScores {
  overall: number;        // 0-100
  spacing: number;        // 0-100
  timing: number;         // 0-100
  formation: number;      // 0-100
  effectiveness: number;  // 0-100
  creativity: number;     // 0-100
  predictability: number; // 0-100 (lower is better)
  difficulty: number;     // 0-100
}

export interface TacticalRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: RecommendationCategory;
  title: string;
  description: string;
  implementation: string;
  expectedImprovement: number; // 0-100
  difficulty: 'easy' | 'medium' | 'hard';
  affectedPlayers: string[];
}

export type RecommendationCategory = 
  | 'positioning'
  | 'timing'
  | 'formation'
  | 'execution'
  | 'strategy'
  | 'communication'
  | 'conditioning';

export interface TacticalRisk {
  id: string;
  type: RiskType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-100
  description: string;
  mitigation: string;
  affectedAreas: string[];
  timeframe: 'immediate' | 'short-term' | 'long-term';
}

export type RiskType = 
  | 'turnover'
  | 'counter-attack'
  | 'positional'
  | 'fatigue'
  | 'injury'
  | 'strategic'
  | 'communication';

// Template and library
export interface PlayTemplate {
  id: string;
  name: string;
  description: string;
  category: PlayCategory;
  formation: FormationType;
  difficulty: ComplexityLevel;
  effectiveness: number; // Historical success rate
  usageCount: number;
  tags: string[];
  play: TacticalPlay;
  variations?: PlayVariation[];
}

export interface PlayVariation {
  id: string;
  name: string;
  description: string;
  changes: string[]; // Description of changes from base play
  effectiveness: number;
  situations: GameSituation[];
}

// Coaching and team management
export interface CoachingNote {
  id: string;
  playId: string;
  coachId: string;
  content: string;
  type: 'instruction' | 'observation' | 'improvement' | 'warning';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamConfiguration {
  id: string;
  name: string;
  players: Player[];
  preferredFormations: FormationType[];
  strengths: string[];
  weaknesses: string[];
  playStyle: PlayStyle;
}

export type PlayStyle = 
  | 'aggressive-forechecking'
  | 'defensive-trap'
  | 'speed-transition'
  | 'physical-grind'
  | 'skill-finesse'
  | 'balanced-system';

// Opponent analysis
export interface OpponentProfile {
  id: string;
  teamName: string;
  strengths: string[];
  weaknesses: string[];
  commonFormations: FormationType[];
  playStyle: PlayStyle;
  keyPlayers: {
    playerId: string;
    strengths: string[];
    tendencies: string[];
  }[];
  statisticalTendencies: {
    powerPlaySuccess: number;
    penaltyKillSuccess: number;
    faceoffWinPercentage: number;
    shotsPerGame: number;
    goalsPerGame: number;
  };
}

// Practice and drill integration
export interface DrillIntegration {
  id: string;
  playId: string;
  drillName: string;
  drillType: DrillType;
  focus: string[];
  duration: number; // minutes
  intensity: 'low' | 'medium' | 'high';
  requiredEquipment: string[];
  instructions: string;
}

export type DrillType = 
  | 'positioning'
  | 'timing'
  | 'passing'
  | 'shooting'
  | 'checking'
  | 'conditioning'
  | 'decision-making'
  | 'full-system';

// Video and media
export interface VideoAnalysis {
  id: string;
  playId: string;
  videoUrl: string;
  timestamp: number; // seconds into video
  description: string;
  highlights: VideoHighlight[];
  annotations: VideoAnnotation[];
}

export interface VideoHighlight {
  id: string;
  startTime: number;
  endTime: number;
  type: 'success' | 'mistake' | 'learning-point' | 'key-moment';
  description: string;
}

export interface VideoAnnotation {
  id: string;
  timestamp: number;
  position: { x: number; y: number }; // Video coordinates
  type: 'arrow' | 'circle' | 'highlight' | 'text';
  content: string;
  color?: string;
}

// Statistics and performance
export interface PlayPerformance {
  playId: string;
  gameId: string;
  executionDate: Date;
  success: boolean;
  successRate: number; // 0-100
  duration: number; // actual execution time
  players: {
    playerId: string;
    performance: number; // 0-100
    mistakes: string[];
    highlights: string[];
  }[];
  outcome: PlayOutcome;
  notes: string;
}

export type PlayOutcome = 
  | 'goal-scored'
  | 'assist'
  | 'shot-on-goal'
  | 'possession-maintained'
  | 'turnover'
  | 'penalty-drawn'
  | 'penalty-taken'
  | 'neutral';

// Advanced analytics
export interface TacticalMetrics {
  playId: string;
  executionCount: number;
  successRate: number;
  avgDuration: number;
  bestSituations: GameSituation[];
  worstSituations: GameSituation[];
  playerEffectiveness: {
    [playerId: string]: {
      executionScore: number;
      consistencyScore: number;
      improvementRate: number;
    };
  };
  trends: {
    month: string;
    successRate: number;
    usageCount: number;
  }[];
}

// Export all types for easy importing
export type {
  // Re-export for convenience
  Position as TacticalPosition,
  Player as TacticalPlayer,
  Formation as TacticalFormation,
  Movement as TacticalMovement,
  TacticalPlay as Play
};

// Utility type helpers
export type PlayersByRole<T extends PlayerRole = PlayerRole> = {
  [K in T]: Player[];
};

export type FormationPlayers = PlayersByRole<'C' | 'LW' | 'RW' | 'LD' | 'RD'>;

export type AnalysisResult<T = any> = {
  success: boolean;
  data: T;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    processingTime: number;
    confidence: number;
    source: string;
  };
};

// Constants for validation and UI
export const PLAYER_ROLES: PlayerRole[] = ['C', 'LW', 'RW', 'LD', 'RD', 'G'];
export const FORMATION_TYPES: FormationType[] = [
  '1-2-2-balanced',
  '2-1-2-aggressive',
  '1-3-1-trap',
  '2-2-1-diamond',
  '1-2-2-umbrella',
  '2-1-2-overload',
  'box-pk',
  'diamond-pk',
  'custom'
];
export const MOVEMENT_TYPES: MovementType[] = [
  'skate',
  'pass',
  'shoot',
  'check',
  'screen',
  'cycle',
  'support',
  'transition'
];

export default {
  PLAYER_ROLES,
  FORMATION_TYPES,
  MOVEMENT_TYPES
};