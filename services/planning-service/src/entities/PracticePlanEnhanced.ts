import { Entity, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn, Index } from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/dist/entities/AuditableEntity';
import { TrainingPlan } from './TrainingPlan';
import { Drill } from './Drill';

export enum PracticeStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum PracticeFocus {
  SKILLS = 'skills',
  TACTICS = 'tactics',
  CONDITIONING = 'conditioning',
  GAME_PREP = 'game_prep',
  RECOVERY = 'recovery',
  EVALUATION = 'evaluation'
}

export enum PracticeType {
  ON_ICE = 'on_ice',
  OFF_ICE = 'off_ice',
  VIDEO = 'video',
  CLASSROOM = 'classroom'
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  INJURED = 'injured',
  LATE = 'late'
}

export interface PracticeSegmentDrill {
  drillId: string;
  name: string;
  duration: number;
  groups?: string[][]; // Player IDs in groups
  focus: string[]; // ["passing", "timing"]
  equipment: string[];
  notes?: string;
}

export interface PracticeSegment {
  name: string; // "Warm-up", "Power Play Work"
  duration: number; // minutes
  drills: PracticeSegmentDrill[];
  waterBreak?: boolean;
}

export interface AssistantCoachAssignment {
  coachId: string;
  responsibility: string;
}

export interface PlayerAttendanceRecord {
  playerId: string;
  status: AttendanceStatus;
  notes?: string;
}

@Entity('practice_plans_enhanced')
@Index(['organizationId', 'teamId', 'date'])
@Index(['coachId', 'status'])
@Index(['date', 'status'])
@Index(['type', 'date'])
export class PracticePlanEnhanced extends AuditableEntity {

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column('uuid')
  @Index()
  teamId: string;

  @Column('uuid')
  @Index()
  coachId: string;

  @Column('uuid', { nullable: true })
  trainingPlanId?: string;

  @ManyToOne(() => TrainingPlan, plan => plan.practices, { nullable: true })
  @JoinColumn({ name: 'trainingPlanId' })
  trainingPlan?: TrainingPlan;

  @Column('date')
  @Index()
  date: Date;

  @Column('time')
  startTime: string;

  @Column()
  duration: number; // in minutes

  @Column({ nullable: true })
  facilityId?: string;

  @Column({
    type: 'enum',
    enum: PracticeType
  })
  type: PracticeType;

  @Column({
    type: 'enum',
    enum: PracticeStatus,
    default: PracticeStatus.PLANNED
  })
  status: PracticeStatus;

  @Column({
    type: 'enum',
    enum: PracticeFocus
  })
  primaryFocus: PracticeFocus;

  @Column('simple-array', { nullable: true })
  secondaryFocus?: PracticeFocus[];

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  rinkId?: string;

  @Column('jsonb')
  segments: PracticeSegment[];

  @Column('simple-array')
  equipmentNeeded: string[];

  @Column('jsonb', { nullable: true })
  assistantCoachAssignments?: AssistantCoachAssignment[];

  @Column('text', { nullable: true })
  objectives?: string;

  @Column('text', { nullable: true })
  postPracticeNotes?: string;

  @Column('jsonb', { nullable: true })
  playerAttendance?: PlayerAttendanceRecord[];

  @ManyToMany(() => Drill)
  @JoinTable({
    name: 'practice_drills_enhanced',
    joinColumn: { name: 'practiceId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'drillId', referencedColumnName: 'id' }
  })
  drills: Drill[];

  @Column('jsonb', { nullable: true })
  lineups?: {
    forward1: string[];
    forward2: string[];
    forward3: string[];
    forward4: string[];
    defense1: string[];
    defense2: string[];
    defense3: string[];
    goalies: string[];
    scratched: string[];
  };

  @Column('text', { nullable: true })
  notes?: string;

  @Column('text', { nullable: true })
  coachFeedback?: string;

  @Column('jsonb', { nullable: true })
  playerEvaluations?: Array<{
    playerId: string;
    rating: number;
    notes?: string;
    areasOfImprovement?: string[];
  }>;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  // Helper methods
  getTotalDuration(): number {
    return this.segments.reduce((total, segment) => total + segment.duration, 0);
  }

  getAttendanceRate(): number {
    if (!this.playerAttendance || this.playerAttendance.length === 0) return 0;
    const present = this.playerAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
    return (present / this.playerAttendance.length) * 100;
  }

  getDrillCount(): number {
    return this.segments.reduce((total, segment) => total + segment.drills.length, 0);
  }

  getAbsentPlayers(): PlayerAttendanceRecord[] {
    if (!this.playerAttendance) return [];
    return this.playerAttendance.filter(a => a.status === AttendanceStatus.ABSENT);
  }

  getInjuredPlayers(): PlayerAttendanceRecord[] {
    if (!this.playerAttendance) return [];
    return this.playerAttendance.filter(a => a.status === AttendanceStatus.INJURED);
  }

  getSegmentByName(name: string): PracticeSegment | undefined {
    return this.segments.find(segment => segment.name === name);
  }

  getAllDrillIds(): string[] {
    const drillIds: string[] = [];
    this.segments.forEach(segment => {
      segment.drills.forEach(drill => {
        if (!drillIds.includes(drill.drillId)) {
          drillIds.push(drill.drillId);
        }
      });
    });
    return drillIds;
  }

  hasWaterBreaks(): boolean {
    return this.segments.some(segment => segment.waterBreak === true);
  }

  getEquipmentNeededCount(): number {
    return this.equipmentNeeded.length;
  }

  addPlayerAttendance(playerId: string, status: AttendanceStatus, notes?: string): void {
    if (!this.playerAttendance) this.playerAttendance = [];
    
    const existingIndex = this.playerAttendance.findIndex(a => a.playerId === playerId);
    const attendance: PlayerAttendanceRecord = { playerId, status, notes };
    
    if (existingIndex >= 0) {
      this.playerAttendance[existingIndex] = attendance;
    } else {
      this.playerAttendance.push(attendance);
    }
  }

  addSegment(segment: PracticeSegment): void {
    this.segments.push(segment);
  }

  removeSegment(segmentName: string): boolean {
    const index = this.segments.findIndex(s => s.name === segmentName);
    if (index >= 0) {
      this.segments.splice(index, 1);
      return true;
    }
    return false;
  }

  updateSegment(segmentName: string, updates: Partial<PracticeSegment>): boolean {
    const index = this.segments.findIndex(s => s.name === segmentName);
    if (index >= 0) {
      this.segments[index] = { ...this.segments[index], ...updates };
      return true;
    }
    return false;
  }
}