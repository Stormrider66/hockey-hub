import { Entity, Column, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';

export interface LineCombo {
  name: string; // "First Line", "PP1"
  forwards: string[]; // Player IDs
  defense: string[]; // Player IDs
  goalie?: string;
  chemistry: number; // 0-100
  minutesPlayed?: number;
  plusMinus?: number;
}

export interface Matchup {
  ourLine: string; // Line name/number
  opposingLine: string;
  strategy: string;
}

export interface SpecialInstruction {
  playerId: string;
  instructions: string[];
}

export interface KeyPlayer {
  playerId: string;
  name: string;
  tendencies: string[];
  howToDefend: string;
}

export interface GoalieTendencies {
  gloveHigh: number; // percentage
  gloveLow: number;
  blockerHigh: number;
  blockerLow: number;
  fiveHole: number;
  wraparound: number;
}

export interface OpponentScouting {
  strengths: string[];
  weaknesses: string[];
  keyPlayers: KeyPlayer[];
  goalieTendencies?: GoalieTendencies;
}

export interface Lineups {
  even_strength: LineCombo[];
  powerplay: LineCombo[];
  penalty_kill: LineCombo[];
  overtime?: LineCombo[];
  extra_attacker?: LineCombo[];
}

export interface PeriodAdjustment {
  period: 1 | 2 | 3 | 'OT';
  adjustments: string[];
  lineChanges?: any;
}

export interface GoalAnalysis {
  time: string;
  period: number;
  scoredBy: string;
  assists: string[];
  situation: string;
  description: string;
  preventable: boolean;
  notes?: string;
}

export interface PlayerPerformance {
  playerId: string;
  rating: number;
  notes: string;
}

export interface PostGameAnalysis {
  goalsFor: GoalAnalysis[];
  goalsAgainst: GoalAnalysis[];
  whatWorked: string[];
  whatDidntWork: string[];
  playerPerformance: PlayerPerformance[];
}

@Entity('game_strategies')
@Index(['organizationId', 'teamId'])
@Index(['coachId', 'gameId'])
@Index(['gameId'])
@Index(['opponentTeamId'])
export class GameStrategy extends AuditableEntity {

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column('uuid')
  @Index()
  coachId: string;

  @Column('uuid')
  @Index()
  teamId: string;

  @Column('uuid')
  @Index()
  gameId: string; // Reference to calendar event

  @Column('uuid')
  opponentTeamId: string;

  @Column()
  opponentTeamName: string;

  @Column('jsonb')
  lineups: Lineups;

  @Column('jsonb', { nullable: true })
  matchups?: Matchup[];

  @Column('jsonb', { nullable: true })
  specialInstructions?: SpecialInstruction[];

  @Column('jsonb', { nullable: true })
  opponentScouting?: OpponentScouting;

  @Column('text', { nullable: true })
  preGameSpeech?: string;

  @Column('jsonb', { nullable: true })
  periodAdjustments?: PeriodAdjustment[];

  @Column('jsonb', { nullable: true })
  postGameAnalysis?: PostGameAnalysis;

  @Column({ default: false })
  gameCompleted: boolean;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  // Helper methods
  getTotalLineups(): number {
    let count = 0;
    count += this.lineups.even_strength?.length || 0;
    count += this.lineups.powerplay?.length || 0;
    count += this.lineups.penalty_kill?.length || 0;
    count += this.lineups.overtime?.length || 0;
    count += this.lineups.extra_attacker?.length || 0;
    return count;
  }

  getPlayersInLineup(): string[] {
    const playerIds = new Set<string>();
    
    Object.values(this.lineups).forEach(lines => {
      if (Array.isArray(lines)) {
        lines.forEach(line => {
          line.forwards?.forEach(id => playerIds.add(id));
          line.defense?.forEach(id => playerIds.add(id));
          if (line.goalie) playerIds.add(line.goalie);
        });
      }
    });

    return Array.from(playerIds);
  }

  getLineComboByName(lineupType: keyof Lineups, name: string): LineCombo | undefined {
    const lines = this.lineups[lineupType];
    if (!Array.isArray(lines)) return undefined;
    return lines.find(line => line.name === name);
  }

  getAverageChemistry(): number {
    const allLines: LineCombo[] = [];
    Object.values(this.lineups).forEach(lines => {
      if (Array.isArray(lines)) allLines.push(...lines);
    });
    
    if (allLines.length === 0) return 0;
    const total = allLines.reduce((sum, line) => sum + line.chemistry, 0);
    return total / allLines.length;
  }

  addPeriodAdjustment(adjustment: PeriodAdjustment): void {
    if (!this.periodAdjustments) this.periodAdjustments = [];
    
    // Update existing period or add new one
    const existingIndex = this.periodAdjustments.findIndex(adj => adj.period === adjustment.period);
    if (existingIndex >= 0) {
      this.periodAdjustments[existingIndex] = adjustment;
    } else {
      this.periodAdjustments.push(adjustment);
    }
  }

  addPlayerPerformance(performance: PlayerPerformance): void {
    if (!this.postGameAnalysis) {
      this.postGameAnalysis = {
        goalsFor: [],
        goalsAgainst: [],
        whatWorked: [],
        whatDidntWork: [],
        playerPerformance: []
      };
    }

    const existingIndex = this.postGameAnalysis.playerPerformance.findIndex(
      p => p.playerId === performance.playerId
    );
    
    if (existingIndex >= 0) {
      this.postGameAnalysis.playerPerformance[existingIndex] = performance;
    } else {
      this.postGameAnalysis.playerPerformance.push(performance);
    }
  }

  hasPostGameAnalysis(): boolean {
    return !!this.postGameAnalysis && (
      this.postGameAnalysis.goalsFor.length > 0 ||
      this.postGameAnalysis.goalsAgainst.length > 0 ||
      this.postGameAnalysis.whatWorked.length > 0 ||
      this.postGameAnalysis.whatDidntWork.length > 0 ||
      this.postGameAnalysis.playerPerformance.length > 0
    );
  }

  getTeamAverageRating(): number {
    if (!this.postGameAnalysis?.playerPerformance || this.postGameAnalysis.playerPerformance.length === 0) {
      return 0;
    }
    
    const total = this.postGameAnalysis.playerPerformance.reduce((sum, p) => sum + p.rating, 0);
    return total / this.postGameAnalysis.playerPerformance.length;
  }
}