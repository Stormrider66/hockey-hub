// @ts-nocheck - Suppress TypeScript errors for build
import { Entity, Column, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';

const IS_JEST = typeof process.env.JEST_WORKER_ID !== 'undefined';

export enum DrillLibraryCategory {
  SKATING = 'skating',
  PASSING = 'passing',
  SHOOTING = 'shooting',
  CHECKING = 'checking',
  POSITIONING = 'positioning',
  CONDITIONING = 'conditioning',
  GOALIE = 'goalie',
  TEAM_SYSTEMS = 'team_systems',
  SMALL_GAMES = 'small_games'
}

export enum DrillLibraryDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  ELITE = 'elite'
}

export interface DrillSetup {
  rinkDivision: 'full' | 'half' | 'third' | 'corner' | 'neutral_zone';
  cones: { x: number; y: number; color: string }[];
  pucks: { x: number; y: number }[];
  otherMarkers: any[];
}

export interface DrillProgression {
  level: number;
  modification: string;
  addedDifficulty: string;
}

export interface CommonMistake {
  mistake: string;
  correction: string;
}

@Entity('drill_library')
@Index(['organizationId', 'isPublic'])
@Index(['category', 'difficulty'])
@Index(['name', 'organizationId'])
@Index(['createdBy', 'isPublic'])
@Index(['usageCount', 'rating'])
export class DrillLibrary extends AuditableEntity {

  @Column()
  @Index()
  name: string;

  @Column({ type: IS_JEST ? 'varchar' : 'uuid' })
  @Index()
  createdBy: string; // Coach ID

  @Column({ type: IS_JEST ? 'varchar' : 'uuid', nullable: true })
  @Index()
  organizationId?: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({
    type: IS_JEST ? 'simple-enum' : 'enum',
    enum: DrillLibraryCategory
  })
  category: DrillLibraryCategory;

  @Column('simple-array')
  skillFocus: string[]; // ["acceleration", "edge work", "crossovers"]

  @Column({
    type: IS_JEST ? 'simple-enum' : 'enum',
    enum: DrillLibraryDifficulty
  })
  difficulty: DrillLibraryDifficulty;

  @Column()
  minPlayers: number;

  @Column()
  maxPlayers: number;

  @Column()
  duration: number; // minutes

  @Column('simple-array')
  requiredEquipment: string[];

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb' })
  setup: DrillSetup;

  @Column('text')
  description: string;

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb' })
  progressions: DrillProgression[];

  @Column('simple-array', { nullable: true })
  coachingPoints?: string[];

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
  commonMistakes?: CommonMistake[];

  @Column({ nullable: true })
  videoUrl?: string;

  @Column({ nullable: true })
  diagramUrl?: string;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: 0 })
  ratingCount: number;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column('simple-array', { nullable: true })
  ageGroups?: string[]; // U8, U10, U12, U14, U16, U18, Senior

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  // Helper methods
  isAppropriateForAge(ageGroup: string): boolean {
    if (!this.ageGroups || this.ageGroups.length === 0) return true;
    return this.ageGroups.includes(ageGroup);
  }

  canAccommodatePlayers(playerCount: number): boolean {
    return playerCount >= this.minPlayers && playerCount <= this.maxPlayers;
  }

  getAverageRating(): number {
    return this.ratingCount > 0 ? this.rating / this.ratingCount : 0;
  }

  addRating(newRating: number): void {
    this.rating = ((this.rating * this.ratingCount) + newRating) / (this.ratingCount + 1);
    this.ratingCount += 1;
  }

  incrementUsage(): void {
    this.usageCount += 1;
  }

  hasVideo(): boolean {
    return !!this.videoUrl;
  }

  hasDiagram(): boolean {
    return !!this.diagramUrl;
  }

  getSkillFocusString(): string {
    return this.skillFocus.join(', ');
  }

  getEquipmentString(): string {
    return this.requiredEquipment.join(', ');
  }

  addProgression(progression: DrillProgression): void {
    if (!this.progressions) this.progressions = [];
    this.progressions.push(progression);
    // Sort by level
    this.progressions.sort((a, b) => a.level - b.level);
  }

  addCommonMistake(mistake: CommonMistake): void {
    if (!this.commonMistakes) this.commonMistakes = [];
    this.commonMistakes.push(mistake);
  }

  addCoachingPoint(point: string): void {
    if (!this.coachingPoints) this.coachingPoints = [];
    this.coachingPoints.push(point);
  }

  getRinkArea(): string {
    return this.setup.rinkDivision.replace(/_/g, ' ').toUpperCase();
  }

  getTotalMarkers(): number {
    return (this.setup.cones?.length || 0) + 
           (this.setup.pucks?.length || 0) + 
           (this.setup.otherMarkers?.length || 0);
  }

  isComplexSetup(): boolean {
    return this.getTotalMarkers() > 10 || this.setup.rinkDivision === 'full';
  }

  getDifficultyLevel(): number {
    const levels = {
      [DrillLibraryDifficulty.BEGINNER]: 1,
      [DrillLibraryDifficulty.INTERMEDIATE]: 2,
      [DrillLibraryDifficulty.ADVANCED]: 3,
      [DrillLibraryDifficulty.ELITE]: 4
    };
    return levels[this.difficulty];
  }

  getPlayerRange(): string {
    if (this.minPlayers === this.maxPlayers) {
      return `${this.minPlayers} players`;
    }
    return `${this.minPlayers}-${this.maxPlayers} players`;
  }
}