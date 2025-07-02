import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/entities/BaseEntity';
import { PlanType } from './TrainingPlan';
import { PracticeFocus } from './PracticePlan';

export enum TemplateCategory {
  PRE_SEASON = 'pre_season',
  IN_SEASON = 'in_season',
  POST_SEASON = 'post_season',
  TOURNAMENT = 'tournament',
  SKILLS_CAMP = 'skills_camp',
  DEVELOPMENT = 'development'
}

@Entity('plan_templates')
@Index(['organizationId', 'isPublic'])
@Index(['category', 'ageGroup'])
@Index(['name'])
export class PlanTemplate extends AuditableEntity {

  @Column()
  @Index()
  name: string;

  @Column('text')
  description: string;

  @Column('uuid', { nullable: true })
  @Index()
  organizationId?: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({
    type: 'enum',
    enum: TemplateCategory
  })
  category: TemplateCategory;

  @Column({
    type: 'enum',
    enum: PlanType
  })
  planType: PlanType;

  @Column({ nullable: true })
  ageGroup?: string; // U8, U10, U12, etc.

  @Column({ nullable: true })
  skillLevel?: string; // Beginner, Intermediate, Advanced

  @Column()
  durationWeeks: number;

  @Column('jsonb')
  structure: {
    phases: Array<{
      name: string;
      weeks: number;
      focus: string[];
      intensity: 'low' | 'medium' | 'high' | 'peak' | 'recovery';
    }>;
    weeklySchedule: {
      practicesPerWeek: number;
      gamesPerWeek: number;
      offDays: number;
    };
  };

  @Column('jsonb')
  goals: Array<{
    category: 'technical' | 'tactical' | 'physical' | 'mental';
    title: string;
    description: string;
    measurable: string;
  }>;

  @Column('jsonb')
  samplePractices: Array<{
    week: number;
    focus: PracticeFocus;
    title: string;
    duration: number;
    drillSuggestions: string[];
  }>;

  @Column('jsonb', { nullable: true })
  equipment?: string[];

  @Column('jsonb', { nullable: true })
  prerequisites?: string[];

  @Column('jsonb', { nullable: true })
  resources?: Array<{
    type: 'video' | 'document' | 'link';
    title: string;
    url: string;
  }>;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: 0 })
  ratingCount: number;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  // Helper methods
  getTotalHours(): number {
    const practicesPerWeek = this.structure.weeklySchedule.practicesPerWeek;
    const totalWeeks = this.durationWeeks;
    const avgPracticeDuration = 90; // minutes
    return (practicesPerWeek * totalWeeks * avgPracticeDuration) / 60;
  }

  getAverageRating(): number {
    return this.ratingCount > 0 ? this.rating / this.ratingCount : 0;
  }

  isApplicableFor(ageGroup: string, skillLevel: string): boolean {
    const ageMatch = !this.ageGroup || this.ageGroup === ageGroup;
    const skillMatch = !this.skillLevel || this.skillLevel === skillLevel;
    return ageMatch && skillMatch;
  }
}