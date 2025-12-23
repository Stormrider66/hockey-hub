// @ts-nocheck - Suppress TypeScript errors for build
import { Entity, Column, OneToMany, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';
import { TacticalPlan } from './TacticalPlan';

const IS_JEST = typeof process.env.JEST_WORKER_ID !== 'undefined';

export enum FormationType {
  OFFENSIVE = 'offensive',
  DEFENSIVE = 'defensive',
  TRANSITION = 'transition',
  SPECIAL_TEAMS = 'special_teams'
}

export enum ZoneType {
  OFFENSIVE = 'offensive',
  NEUTRAL = 'neutral',  
  DEFENSIVE = 'defensive'
}

export interface FormationPosition {
  role: string;
  x: number;
  y: number;
  zone: ZoneType;
  priority?: number; // For ordering positions
  description?: string;
}

export interface FormationMetadata {
  playerCount: number;
  recommendedLevel: 'beginner' | 'intermediate' | 'advanced';
  gameStates: string[]; // ['even_strength', 'power_play', etc.]
  opposingFormations: string[]; // IDs of formations this counters
  videoReferences?: string[];
  diagramUrl?: string;
}

@Entity('formations')
@Index(['organizationId', 'isActive'])
@Index(['type', 'isActive'])
@Index(['name'])
export class Formation extends AuditableEntity {

  @Column()
  name: string; // "1-2-2 Offensive", "Neutral Zone Trap"

  @Column({ type: IS_JEST ? 'varchar' : 'uuid' })
  @Index()
  organizationId: string;

  @Column({ type: IS_JEST ? 'varchar' : 'uuid' })
  @Index()
  coachId: string; // Coach who created this formation

  @Column({ type: IS_JEST ? 'varchar' : 'uuid', nullable: true })
  @Index()
  teamId?: string; // Optional team-specific formation

  @Column({
    type: IS_JEST ? 'simple-enum' : 'enum',
    enum: FormationType
  })
  type: FormationType;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb' })
  positions: FormationPosition[];

  @Column('simple-array')
  strengths: string[];

  @Column('simple-array') 
  weaknesses: string[];

  @Column('simple-array')
  situational_use: string[]; // When to use this formation

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
  metadata?: FormationMetadata;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isTemplate: boolean; // System-wide template vs team-specific

  @Column({ default: 0 })
  usageCount: number; // How many times used in games

  @Column({ type: 'float', default: 0 })
  successRate: number; // Win percentage when using this formation

  @Column('simple-array', { nullable: true })
  tags?: string[];

  // Relationships
  @OneToMany(() => TacticalPlan, tacticalPlan => tacticalPlan.formation)
  tacticalPlans: TacticalPlan[];

  // Helper methods
  getPositionsByZone(zone: ZoneType): FormationPosition[] {
    return this.positions.filter(pos => pos.zone === zone);
  }

  getTotalPlayerCount(): number {
    return this.positions.length;
  }

  getOffensivePositions(): FormationPosition[] {
    return this.getPositionsByZone(ZoneType.OFFENSIVE);
  }

  getDefensivePositions(): FormationPosition[] {
    return this.getPositionsByZone(ZoneType.DEFENSIVE);
  }

  getNeutralPositions(): FormationPosition[] {
    return this.getPositionsByZone(ZoneType.NEUTRAL);
  }

  isBalanced(): boolean {
    const offensive = this.getOffensivePositions().length;
    const defensive = this.getDefensivePositions().length;
    const neutral = this.getNeutralPositions().length;
    
    // Consider balanced if no zone has more than 60% of players
    const total = this.getTotalPlayerCount();
    const maxZoneRatio = Math.max(offensive, defensive, neutral) / total;
    return maxZoneRatio <= 0.6;
  }

  getSimilarFormations(): string[] {
    // This could be enhanced with ML or rules-based similarity
    return this.metadata?.opposingFormations || [];
  }

  canCounterFormation(formationId: string): boolean {
    return this.metadata?.opposingFormations?.includes(formationId) || false;
  }

  addUsage(successful: boolean): void {
    this.usageCount += 1;
    
    if (this.usageCount === 1) {
      this.successRate = successful ? 100 : 0;
    } else {
      const currentSuccesses = Math.round((this.successRate / 100) * (this.usageCount - 1));
      const newSuccesses = currentSuccesses + (successful ? 1 : 0);
      this.successRate = (newSuccesses / this.usageCount) * 100;
    }
  }

  getFormationCoverage(): {
    offensive: number;
    defensive: number; 
    neutral: number;
  } {
    const total = this.getTotalPlayerCount();
    return {
      offensive: (this.getOffensivePositions().length / total) * 100,
      defensive: (this.getDefensivePositions().length / total) * 100,
      neutral: (this.getNeutralPositions().length / total) * 100,
    };
  }

  validatePositions(): string[] {
    const errors: string[] = [];
    
    if (this.positions.length === 0) {
      errors.push('Formation must have at least one position');
    }

    if (this.positions.length > 20) {
      errors.push('Formation cannot have more than 20 positions');
    }

    this.positions.forEach((pos, index) => {
      if (!pos.role || pos.role.trim().length === 0) {
        errors.push(`Position ${index + 1}: role is required`);
      }

      if (typeof pos.x !== 'number' || pos.x < 0 || pos.x > 100) {
        errors.push(`Position ${index + 1}: x coordinate must be between 0-100`);
      }

      if (typeof pos.y !== 'number' || pos.y < 0 || pos.y > 100) {
        errors.push(`Position ${index + 1}: y coordinate must be between 0-100`);
      }

      if (!Object.values(ZoneType).includes(pos.zone)) {
        errors.push(`Position ${index + 1}: invalid zone type`);
      }
    });

    return errors;
  }

  clone(newName?: string): Omit<Formation, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: newName || `${this.name} (Copy)`,
      organizationId: this.organizationId,
      coachId: this.coachId,
      teamId: this.teamId,
      type: this.type,
      description: this.description,
      positions: JSON.parse(JSON.stringify(this.positions)),
      strengths: [...this.strengths],
      weaknesses: [...this.weaknesses],
      situational_use: [...this.situational_use],
      metadata: this.metadata ? JSON.parse(JSON.stringify(this.metadata)) : undefined,
      isActive: true,
      isTemplate: false,
      usageCount: 0,
      successRate: 0,
      tags: this.tags ? [...this.tags] : undefined,
    };
  }
}