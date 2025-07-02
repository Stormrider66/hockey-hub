import { Entity, Column } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib';

@Entity('wellness_entries')
export class WellnessEntry extends AuditableEntity {
  @Column({ name: 'player_id', type: 'uuid' })
  playerId: string;

  @Column({ name: 'entry_date', type: 'date' })
  entryDate: Date;

  @Column({ name: 'sleep_hours', type: 'decimal', precision: 4, scale: 2 })
  sleepHours: number;

  @Column({ name: 'sleep_quality', type: 'int' })
  sleepQuality: number; // 1-10 scale

  @Column({ name: 'energy_level', type: 'int' })
  energyLevel: number; // 1-10 scale

  @Column({ name: 'stress_level', type: 'int' })
  stressLevel: number; // 1-10 scale

  @Column({ name: 'soreness_level', type: 'int' })
  sorenessLevel: number; // 1-10 scale

  @Column({ name: 'hydration_level', type: 'int' })
  hydrationLevel: number; // 1-10 scale

  @Column({ name: 'nutrition_quality', type: 'int' })
  nutritionQuality: number; // 1-10 scale

  @Column({ name: 'mood_rating', type: 'int' })
  moodRating: number; // 1-10 scale

  @Column({ name: 'resting_heart_rate', type: 'int', nullable: true })
  restingHeartRate?: number;

  @Column({ name: 'hrv_score', type: 'decimal', precision: 6, scale: 2, nullable: true })
  hrvScore?: number;

  @Column({ name: 'body_weight', type: 'decimal', precision: 5, scale: 2, nullable: true })
  bodyWeight?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'pain_areas', type: 'json', nullable: true })
  painAreas?: string[]; // Array of body parts with pain

  @Column({ name: 'medications', type: 'json', nullable: true })
  medications?: string[]; // Array of current medications
}