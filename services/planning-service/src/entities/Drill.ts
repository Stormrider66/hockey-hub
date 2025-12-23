import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';
import { DrillCategory } from './DrillCategory';

const IS_JEST = typeof process.env.JEST_WORKER_ID !== 'undefined';

export enum DrillDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  ELITE = 'elite'
}

export enum DrillType {
  WARM_UP = 'warm_up',
  SKILL = 'skill',
  TACTICAL = 'tactical',
  CONDITIONING = 'conditioning',
  GAME = 'game',
  COOL_DOWN = 'cool_down'
}

@Entity('drills')
@Index(['organizationId', 'isPublic'])
@Index(['categoryId', 'difficulty'])
@Index(['name', 'organizationId'])
// Remove duplicate index on tags to avoid conflicts on sync
export class Drill extends AuditableEntity {

  @Column()
  @Index()
  name: string;

  @Column('text')
  description: string;

  @Column({ type: IS_JEST ? 'varchar' : 'uuid', nullable: true })
  @Index()
  organizationId?: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ type: IS_JEST ? 'varchar' : 'uuid' })
  categoryId: string;

  @ManyToOne(() => DrillCategory)
  @JoinColumn({ name: 'categoryId' })
  category: DrillCategory;

  @Column({
    type: IS_JEST ? 'simple-enum' : 'enum',
    enum: DrillType
  })
  type: DrillType;

  @Column({
    type: IS_JEST ? 'simple-enum' : 'enum',
    enum: DrillDifficulty
  })
  difficulty: DrillDifficulty;

  @Column()
  duration: number; // in minutes

  @Column()
  minPlayers: number;

  @Column()
  maxPlayers: number;

  @Column('simple-array')
  equipment: string[];

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb' })
  setup: {
    rinkArea: 'full' | 'half' | 'zone' | 'corner' | 'neutral';
    diagram?: string; // URL to diagram image
    cones?: number;
    pucks?: number;
    otherEquipment?: string[];
  };

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb' })
  instructions: Array<{
    step: number;
    description: string;
    duration?: number;
    keyPoints?: string[];
  }>;

  @Column('simple-array', { nullable: true })
  objectives?: string[];

  @Column('simple-array', { nullable: true })
  keyPoints?: string[];

  @Column('simple-array', { nullable: true })
  variations?: string[];

  @Column('simple-array', { nullable: true })
  @Index()
  tags?: string[];

  @Column('simple-array', { nullable: true })
  ageGroups?: string[]; // U8, U10, U12, U14, U16, U18, Senior

  @Column({ nullable: true })
  videoUrl?: string;

  @Column({ nullable: true })
  animationUrl?: string;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ nullable: true })
  shareCode?: string;

  @Column('simple-array', { nullable: true })
  sharedWith?: string[];

  @Column('simple-array', { nullable: true })
  sharePermissions?: string[];

  @Column({ type: IS_JEST ? 'datetime' : 'timestamp', nullable: true })
  lastUsed?: Date;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: 0 })
  ratingCount: number;

  @Column({ type: IS_JEST ? 'simple-json' : 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Helper methods
  isAppropriateForAge(ageGroup: string): boolean {
    if (!this.ageGroups || this.ageGroups.length === 0) return true;
    return this.ageGroups.includes(ageGroup);
  }

  canAccommodatePlayers(playerCount: number): boolean {
    return playerCount >= this.minPlayers && playerCount <= this.maxPlayers;
  }

  getTotalDuration(): number {
    if (this.instructions && this.instructions.length > 0) {
      const instructionTime = this.instructions.reduce(
        (total, inst) => total + (inst.duration || 0), 
        0
      );
      return instructionTime > 0 ? instructionTime : this.duration;
    }
    return this.duration;
  }

  getAverageRating(): number {
    return this.ratingCount > 0 ? this.rating / this.ratingCount : 0;
  }
}