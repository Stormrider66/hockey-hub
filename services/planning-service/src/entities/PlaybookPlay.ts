import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';
import { TacticalPlan } from './TacticalPlan';

export enum PlayType {
  BREAKOUT = 'breakout',
  FORECHECK = 'forecheck',
  CYCLE = 'cycle',
  RUSH = 'rush',
  FACEOFF = 'faceoff',
  POWERPLAY = 'powerplay',
  PENALTY_KILL = 'penalty_kill'
}

export enum PlayAction {
  PASS = 'pass',
  CARRY = 'carry',
  SHOOT = 'shoot',
  SCREEN = 'screen',
  RETRIEVE = 'retrieve',
  SUPPORT = 'support'
}

export interface PlaySequenceStep {
  stepNumber: number;
  playerId?: string;
  position?: string;
  action: PlayAction;
  from: { x: number; y: number };
  to: { x: number; y: number };
  timing?: number; // seconds
  description: string;
}

export interface Contingency {
  condition: string;
  alternativeAction: string;
}

export interface PracticeNote {
  date: Date;
  success_rate: number;
  notes: string;
}

@Entity('playbook_plays')
@Index(['tacticalPlanId', 'type'])
@Index(['type', 'usageCount'])
@Index(['name'])
export class PlaybookPlay extends AuditableEntity {

  @Column()
  @Index()
  name: string; // "Breakout Option 1", "Cycle Play A"

  @Column('uuid')
  tacticalPlanId: string;

  @ManyToOne(() => TacticalPlan, plan => plan.plays)
  @JoinColumn({ name: 'tacticalPlanId' })
  tacticalPlan: TacticalPlan;

  @Column({
    type: 'enum',
    enum: PlayType
  })
  type: PlayType;

  @Column('jsonb')
  sequence: PlaySequenceStep[];

  @Column('jsonb', { nullable: true })
  contingencies?: Contingency[];

  @Column('text', { nullable: true })
  coachingPoints?: string;

  @Column('jsonb', { nullable: true })
  practiceNotes?: PracticeNote[];

  @Column({ default: 0 })
  usageCount: number; // Track in games

  @Column({ type: 'float', default: 0 })
  successRate: number; // Percentage

  @Column({ default: true })
  isActive: boolean;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  // Helper methods
  getTotalSteps(): number {
    return this.sequence.length;
  }

  getEstimatedDuration(): number {
    return this.sequence.reduce((total, step) => total + (step.timing || 5), 0);
  }

  getPlayersInvolved(): string[] {
    const playerIds = this.sequence
      .map(step => step.playerId)
      .filter((id, index, array) => id && array.indexOf(id) === index);
    return playerIds as string[];
  }

  getLastPracticeNote(): PracticeNote | undefined {
    if (!this.practiceNotes || this.practiceNotes.length === 0) return undefined;
    return this.practiceNotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }

  calculateAverageSuccessRate(): number {
    if (!this.practiceNotes || this.practiceNotes.length === 0) return 0;
    const total = this.practiceNotes.reduce((sum, note) => sum + note.success_rate, 0);
    return total / this.practiceNotes.length;
  }

  addPracticeNote(note: Omit<PracticeNote, 'date'> & { date?: Date }): void {
    if (!this.practiceNotes) this.practiceNotes = [];
    this.practiceNotes.push({
      ...note,
      date: note.date || new Date()
    });
    this.successRate = this.calculateAverageSuccessRate();
  }

  incrementUsage(): void {
    this.usageCount += 1;
  }
}