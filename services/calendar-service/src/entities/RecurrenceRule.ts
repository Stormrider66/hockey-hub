import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Event } from './Event';

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

export enum WeekDay {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export enum MonthlyRecurrenceType {
  DAY_OF_MONTH = 'day_of_month',
  DAY_OF_WEEK = 'day_of_week',
}

@Entity('recurrence_rules')
@Index(['createdBy'])
export class RecurrenceRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RecurrenceFrequency,
  })
  frequency: RecurrenceFrequency;

  @Column({ default: 1 })
  interval: number;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ nullable: true })
  count?: number;

  @Column({ type: 'simple-array', nullable: true })
  byWeekDay?: number[];

  @Column({ type: 'simple-array', nullable: true })
  byMonthDay?: number[];

  @Column({ type: 'simple-array', nullable: true })
  byMonth?: number[];

  @Column({ nullable: true })
  bySetPos?: number;

  @Column({
    type: 'enum',
    enum: MonthlyRecurrenceType,
    nullable: true,
  })
  monthlyType?: MonthlyRecurrenceType;

  @Column({ type: 'time', nullable: true })
  timeOfDay?: string;

  @Column({ nullable: true })
  timezone?: string;

  @Column({ type: 'simple-array', nullable: true })
  exceptionDates?: string[];

  @Column({ type: 'jsonb', nullable: true })
  customPattern?: {
    pattern?: string;
    description?: string;
    [key: string]: any;
  };

  @Column({ nullable: true })
  rruleString?: string;

  @Column({ nullable: true })
  humanReadable?: string;

  @Column({ type: 'jsonb', nullable: true })
  weeklyPattern?: {
    monday?: boolean;
    tuesday?: boolean;
    wednesday?: boolean;
    thursday?: boolean;
    friday?: boolean;
    saturday?: boolean;
    sunday?: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  monthlyPattern?: {
    dayOfMonth?: number;
    weekOfMonth?: number;
    dayOfWeek?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  yearlyPattern?: {
    month?: number;
    dayOfMonth?: number;
    weekOfMonth?: number;
    dayOfWeek?: number;
  };

  @Column({ default: true })
  includeWeekends: boolean;

  @Column({ default: false })
  skipHolidays: boolean;

  @Column({ type: 'simple-array', nullable: true })
  holidayCalendars?: string[];

  @Column({ nullable: true })
  duration?: number;

  @Column({ default: true })
  adjustForDST: boolean;

  @Column({ nullable: true })
  seriesId?: string;

  @Column({ nullable: true })
  masterEventId?: string;

  @Column('uuid')
  createdBy: string;

  @Column({ nullable: true })
  notes?: string;

  @OneToMany(() => Event, (event) => event.recurrenceRule)
  events: Event[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastGeneratedAt?: Date;

  @Column({ default: 0 })
  generatedCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}