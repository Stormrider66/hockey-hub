import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { AuditableEntity } from '@hockey-hub/shared-lib/entities/AuditableEntity';

export enum AppointmentType {
  MEDICAL_CHECKUP = 'medical_checkup',
  INJURY_ASSESSMENT = 'injury_assessment',
  TREATMENT_SESSION = 'treatment_session',
  PHYSIOTHERAPY = 'physiotherapy',
  PSYCHOLOGY_SESSION = 'psychology_session',
  NUTRITIONIST = 'nutritionist',
  FOLLOW_UP = 'follow_up',
  VACCINATION = 'vaccination',
  FITNESS_TEST = 'fitness_test',
  OTHER = 'other',
}

export enum ReminderTiming {
  ONE_WEEK_BEFORE = '1_week_before',
  THREE_DAYS_BEFORE = '3_days_before',
  ONE_DAY_BEFORE = '1_day_before',
  MORNING_OF = 'morning_of',
  TWO_HOURS_BEFORE = '2_hours_before',
  THIRTY_MINUTES_BEFORE = '30_minutes_before',
}

export enum ReminderStatus {
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ACKNOWLEDGED = 'acknowledged',
}

@Entity('appointment_reminders')
@Index(['userId', 'appointmentDate'])
@Index(['status', 'sendAt'])
@Index(['medicalStaffId', 'appointmentDate'])
export class AppointmentReminder extends AuditableEntity {

  @Column()
  @Index()
  userId: string; // Patient

  @Column()
  medicalStaffId: string; // Medical staff member

  @Column()
  organizationId: string;

  @Column({ nullable: true })
  teamId?: string;

  @Column({
    type: 'enum',
    enum: AppointmentType,
    default: AppointmentType.MEDICAL_CHECKUP,
  })
  appointmentType: AppointmentType;

  @Column('timestamp')
  @Index()
  appointmentDate: Date;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  medicalFacilityName?: string;

  @Column({ nullable: true })
  medicalFacilityAddress?: string;

  @Column({ nullable: true })
  medicalFacilityPhone?: string;

  @Column('text', { nullable: true })
  appointmentNotes?: string;

  @Column('text', { nullable: true })
  preparationInstructions?: string;

  @Column('simple-array', { nullable: true })
  documentsTobing?: string[]; // List of documents to bring

  @Column({ type: 'boolean', default: false })
  requiresFasting: boolean;

  @Column({ nullable: true })
  fastingHours?: number;

  @Column({ type: 'boolean', default: false })
  requiresTransportation: boolean;

  @Column('simple-array')
  reminderTimings: ReminderTiming[];

  @Column('simple-json', { nullable: true })
  remindersSent?: { [key in ReminderTiming]?: Date };

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.SCHEDULED,
  })
  @Index()
  status: ReminderStatus;

  @Column('timestamp', { nullable: true })
  @Index()
  sendAt?: Date; // Next reminder to send

  @Column('timestamp', { nullable: true })
  lastSentAt?: Date;

  @Column('timestamp', { nullable: true })
  acknowledgedAt?: Date;

  @Column({ nullable: true })
  acknowledgedBy?: string;

  @Column({ nullable: true })
  calendarEventId?: string; // Link to calendar service

  @Column({ nullable: true })
  medicalRecordId?: string; // Link to medical service

  @Column({ nullable: true })
  injuryId?: string; // If related to specific injury

  @Column({ type: 'boolean', default: true })
  notifyPatient: boolean;

  @Column({ type: 'boolean', default: false })
  notifyParents: boolean;

  @Column({ type: 'boolean', default: false })
  notifyCoach: boolean;

  @Column({ type: 'boolean', default: false })
  includeInTeamCalendar: boolean;

  @Column({ type: 'int', default: 0 })
  reminderCount: number;

  @Column({ nullable: true })
  cancellationReason?: string;

  @Column('timestamp', { nullable: true })
  cancelledAt?: Date;

  @Column({ nullable: true })
  cancelledBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isUpcoming(): boolean {
    return this.appointmentDate > new Date() && this.status === ReminderStatus.SCHEDULED;
  }

  get isPastDue(): boolean {
    return this.appointmentDate < new Date() && this.status !== ReminderStatus.CANCELLED;
  }

  get nextReminderTiming(): ReminderTiming | null {
    if (this.status !== ReminderStatus.SCHEDULED) return null;

    const now = new Date();
    const appointmentTime = new Date(this.appointmentDate);

    for (const timing of this.reminderTimings) {
      const reminderTime = this.getReminderTime(timing, appointmentTime);
      if (reminderTime > now && !this.remindersSent?.[timing]) {
        return timing;
      }
    }

    return null;
  }

  private getReminderTime(timing: ReminderTiming, appointmentDate: Date): Date {
    const reminderTime = new Date(appointmentDate);

    switch (timing) {
      case ReminderTiming.ONE_WEEK_BEFORE:
        reminderTime.setDate(reminderTime.getDate() - 7);
        break;
      case ReminderTiming.THREE_DAYS_BEFORE:
        reminderTime.setDate(reminderTime.getDate() - 3);
        break;
      case ReminderTiming.ONE_DAY_BEFORE:
        reminderTime.setDate(reminderTime.getDate() - 1);
        break;
      case ReminderTiming.MORNING_OF:
        reminderTime.setHours(8, 0, 0, 0); // 8 AM on the day
        break;
      case ReminderTiming.TWO_HOURS_BEFORE:
        reminderTime.setHours(reminderTime.getHours() - 2);
        break;
      case ReminderTiming.THIRTY_MINUTES_BEFORE:
        reminderTime.setMinutes(reminderTime.getMinutes() - 30);
        break;
    }

    return reminderTime;
  }
}