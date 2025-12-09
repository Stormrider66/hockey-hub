import { Entity, Column, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';
import { PlaybookPlay } from './PlaybookPlay';
import { Formation } from './Formation';

export enum TacticalCategory {
  OFFENSIVE = 'offensive',
  DEFENSIVE = 'defensive',
  TRANSITION = 'transition',
  SPECIAL_TEAMS = 'special_teams'
}

export enum FormationType {
  EVEN_STRENGTH = 'even_strength',
  POWERPLAY = 'powerplay',
  PENALTY_KILL = 'penalty_kill',
  SIX_ON_FIVE = '6_on_5',
  FIVE_ON_THREE = '5_on_3'
}

export enum PlayerPositionType {
  C = 'C',
  LW = 'LW',
  RW = 'RW',
  LD = 'LD',
  RD = 'RD',
  G = 'G'
}

export enum ZoneType {
  OFFENSIVE = 'offensive',
  NEUTRAL = 'neutral',
  DEFENSIVE = 'defensive'
}

export interface PlayerPosition {
  playerId?: string;
  position: PlayerPositionType;
  x: number; // Ice position coordinates
  y: number;
  zone: ZoneType;
}

export interface PlayerAssignment {
  playerId: string;
  position: string;
  responsibilities: string[];
  alternatePosition?: string;
}

export interface Trigger {
  situation: string; // "After opponent dumps puck"
  action: string;    // "D1 retrieves, passes to W1"
}

export interface VideoReference {
  url: string;
  timestamp: number;
  description: string;
}

export interface TacticalFormation {
  type: FormationType;
  zones: {
    offensive: PlayerPosition[];
    neutral: PlayerPosition[];
    defensive: PlayerPosition[];
  };
}

@Entity('tactical_plans')
@Index(['organizationId', 'teamId'])
@Index(['coachId', 'isActive'])
@Index(['category', 'isActive'])
export class TacticalPlan extends AuditableEntity {

  @Column()
  @Index()
  name: string; // "Aggressive Forecheck", "Neutral Zone Trap"

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column('uuid')
  @Index()
  coachId: string;

  @Column('uuid')
  @Index()
  teamId: string;

  @Column({
    type: 'enum',
    enum: TacticalCategory
  })
  category: TacticalCategory;

  @Column('uuid', { nullable: true })
  @Index()
  formationId?: string;

  @ManyToOne(() => Formation, formation => formation.tacticalPlans, { nullable: true })
  @JoinColumn({ name: 'formationId' })
  formation?: Formation;

  // Legacy JSONB formation data for backwards compatibility
  @Column('jsonb', { nullable: true })
  legacyFormation?: TacticalFormation;

  @Column('jsonb')
  playerAssignments: PlayerAssignment[];

  @Column('text', { nullable: true })
  description?: string;

  @Column('jsonb', { nullable: true })
  triggers?: Trigger[];

  @Column('jsonb', { nullable: true })
  videoReferences?: VideoReference[];

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => PlaybookPlay, play => play.tacticalPlan)
  plays: PlaybookPlay[];

  // Helper methods
  getActivePlayerCount(): number {
    return this.playerAssignments.length;
  }

  getPlaysByType(type: string): PlaybookPlay[] {
    return this.plays ? this.plays.filter(play => play.type === type) : [];
  }

  hasVideoReferences(): boolean {
    return this.videoReferences && this.videoReferences.length > 0;
  }

  getPlayersByZone(zone: ZoneType): PlayerPosition[] {
    if (this.formation) {
      return this.formation.getPositionsByZone(zone).map(pos => ({
        playerId: undefined,
        position: pos.role as any,
        x: pos.x,
        y: pos.y,
        zone: pos.zone
      }));
    }
    
    // Fallback to legacy formation
    if (this.legacyFormation) {
      const zonePositions = this.legacyFormation.zones[zone] || [];
      return zonePositions.filter(pos => pos.playerId);
    }
    
    return [];
  }

  getFormationInfo(): { id?: string; name?: string; type?: string } {
    if (this.formation) {
      return {
        id: this.formation.id,
        name: this.formation.name,
        type: this.formation.type
      };
    }
    
    if (this.legacyFormation) {
      return {
        type: this.legacyFormation.type
      };
    }
    
    return {};
  }
}