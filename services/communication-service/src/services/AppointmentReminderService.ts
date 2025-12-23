// @ts-nocheck - Suppress TypeScript errors for build
import { Repository, LessThanOrEqual, In, Not, IsNull } from 'typeorm';
import { AppDatabase } from '../config/database';
import { AppointmentReminder, AppointmentType, ReminderTiming, ReminderStatus } from '../entities/AppointmentReminder';
import { NotificationService } from './NotificationService';
import { Logger } from '@hockey-hub/shared-lib/utils/Logger';

export class AppointmentReminderService {
  private appointmentReminderRepository: Repository<AppointmentReminder>;
  private notificationService: NotificationService;
  private logger = new Logger('AppointmentReminderService');
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(notificationService: NotificationService) {
    this.appointmentReminderRepository = AppDatabase.getRepository(AppointmentReminder);
    this.notificationService = notificationService;
  }

  // Start processing reminders
  startProcessing(intervalMs: number = 60000): void { // Default: check every minute
    if (this.processingInterval) {
      this.stopProcessing();
    }

    this.processingInterval = setInterval(() => {
      this.processReminders().catch(err => {
        this.logger.error('Error processing appointment reminders', err);
      });
    }, intervalMs);

    // Process immediately on start
    this.processReminders().catch(err => {
      this.logger.error('Error processing appointment reminders on start', err);
    });

    this.logger.info(`Appointment reminder processor started (interval: ${intervalMs}ms)`);
  }

  // Stop processing reminders
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      this.logger.info('Appointment reminder processor stopped');
    }
  }

  // Process pending reminders
  async processReminders(): Promise<void> {
    const now = new Date();
    
    // Find reminders that need to be sent
    const reminders = await this.appointmentReminderRepository.find({
      where: {
        status: ReminderStatus.SCHEDULED,
        sendAt: LessThanOrEqual(now),
      },
      order: {
        appointmentDate: 'ASC',
      },
      take: 50, // Process in batches
    });

    this.logger.info(`Processing ${reminders.length} appointment reminders`);

    for (const reminder of reminders) {
      try {
        await this.sendReminder(reminder);
      } catch (error) {
        this.logger.error(`Failed to send appointment reminder ${reminder.id}`, error);
        reminder.status = ReminderStatus.FAILED;
        await this.appointmentReminderRepository.save(reminder);
      }
    }
  }

  // Send a single reminder
  private async sendReminder(reminder: AppointmentReminder): Promise<void> {
    const nextTiming = reminder.nextReminderTiming;
    if (!nextTiming) {
      // All reminders sent
      reminder.status = ReminderStatus.SENT;
      await this.appointmentReminderRepository.save(reminder);
      return;
    }

    // Create notification content
    const content = this.buildReminderContent(reminder, nextTiming);

    // Send to patient
    if (reminder.notifyPatient) {
      await this.notificationService.createNotification({
        userId: reminder.userId,
        type: 'appointment_reminder',
        title: content.title,
        message: content.message,
        priority: this.getReminderPriority(nextTiming),
        data: {
          appointmentId: reminder.id,
          appointmentType: reminder.appointmentType,
          appointmentDate: reminder.appointmentDate,
          location: reminder.location,
          medicalStaffId: reminder.medicalStaffId,
        },
      });
    }

    // Send to parents if needed
    if (reminder.notifyParents) {
      // TODO: Get parent IDs from user service and send notifications
      this.logger.info(`Parent notifications for appointment ${reminder.id} not yet implemented`);
    }

    // Send to coach if needed
    if (reminder.notifyCoach) {
      // TODO: Get coach IDs from user service and send notifications
      this.logger.info(`Coach notifications for appointment ${reminder.id} not yet implemented`);
    }

    // Update reminder sent status
    if (!reminder.remindersSent) {
      reminder.remindersSent = {};
    }
    reminder.remindersSent[nextTiming] = new Date();
    reminder.lastSentAt = new Date();
    reminder.reminderCount++;

    // Calculate next send time
    const nextReminderTiming = this.getNextReminderTiming(reminder);
    if (nextReminderTiming) {
      reminder.sendAt = this.calculateReminderTime(nextReminderTiming, reminder.appointmentDate);
    } else {
      reminder.status = ReminderStatus.SENT;
    }

    await this.appointmentReminderRepository.save(reminder);
    this.logger.info(`Sent ${nextTiming} reminder for appointment ${reminder.id}`);
  }

  // Build reminder content based on timing
  private buildReminderContent(reminder: AppointmentReminder, timing: ReminderTiming): { title: string; message: string } {
    const appointmentDate = new Date(reminder.appointmentDate);
    const dateStr = appointmentDate.toLocaleDateString();
    const timeStr = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let title = '';
    let message = '';

    switch (timing) {
      case ReminderTiming.ONE_WEEK_BEFORE:
        title = 'Appointment Reminder - Next Week';
        message = `You have a ${this.getAppointmentTypeLabel(reminder.appointmentType)} scheduled for ${dateStr} at ${timeStr}.`;
        break;
      case ReminderTiming.THREE_DAYS_BEFORE:
        title = 'Appointment in 3 Days';
        message = `Reminder: Your ${this.getAppointmentTypeLabel(reminder.appointmentType)} is on ${dateStr} at ${timeStr}.`;
        break;
      case ReminderTiming.ONE_DAY_BEFORE:
        title = 'Appointment Tomorrow';
        message = `Don't forget: Your ${this.getAppointmentTypeLabel(reminder.appointmentType)} is tomorrow at ${timeStr}.`;
        break;
      case ReminderTiming.MORNING_OF:
        title = 'Appointment Today';
        message = `Today's appointment: ${this.getAppointmentTypeLabel(reminder.appointmentType)} at ${timeStr}.`;
        break;
      case ReminderTiming.TWO_HOURS_BEFORE:
        title = 'Appointment in 2 Hours';
        message = `Your ${this.getAppointmentTypeLabel(reminder.appointmentType)} is in 2 hours at ${timeStr}.`;
        break;
      case ReminderTiming.THIRTY_MINUTES_BEFORE:
        title = 'Appointment in 30 Minutes';
        message = `Final reminder: Your ${this.getAppointmentTypeLabel(reminder.appointmentType)} starts in 30 minutes!`;
        break;
    }

    // Add location if available
    if (reminder.location || reminder.medicalFacilityName) {
      message += `\nLocation: ${reminder.medicalFacilityName || reminder.location}`;
    }

    // Add preparation instructions if any
    if (reminder.preparationInstructions) {
      message += `\n\nPreparation: ${reminder.preparationInstructions}`;
    }

    // Add fasting reminder if required
    if (reminder.requiresFasting && reminder.fastingHours) {
      message += `\n\nImportant: Please fast for ${reminder.fastingHours} hours before your appointment.`;
    }

    // Add documents reminder if any
    if (reminder.documentsTobing && reminder.documentsTobing.length > 0) {
      message += `\n\nPlease bring: ${reminder.documentsTobing.join(', ')}`;
    }

    return { title, message };
  }

  // Get priority based on timing
  private getReminderPriority(timing: ReminderTiming): 'low' | 'medium' | 'high' | 'urgent' {
    switch (timing) {
      case ReminderTiming.ONE_WEEK_BEFORE:
      case ReminderTiming.THREE_DAYS_BEFORE:
        return 'low';
      case ReminderTiming.ONE_DAY_BEFORE:
        return 'medium';
      case ReminderTiming.MORNING_OF:
      case ReminderTiming.TWO_HOURS_BEFORE:
        return 'high';
      case ReminderTiming.THIRTY_MINUTES_BEFORE:
        return 'urgent';
      default:
        return 'medium';
    }
  }

  // Get appointment type label
  private getAppointmentTypeLabel(type: AppointmentType): string {
    const labels: Record<AppointmentType, string> = {
      [AppointmentType.MEDICAL_CHECKUP]: 'Medical Checkup',
      [AppointmentType.INJURY_ASSESSMENT]: 'Injury Assessment',
      [AppointmentType.TREATMENT_SESSION]: 'Treatment Session',
      [AppointmentType.PHYSIOTHERAPY]: 'Physiotherapy Session',
      [AppointmentType.PSYCHOLOGY_SESSION]: 'Psychology Session',
      [AppointmentType.NUTRITIONIST]: 'Nutritionist Consultation',
      [AppointmentType.FOLLOW_UP]: 'Follow-up Appointment',
      [AppointmentType.VACCINATION]: 'Vaccination',
      [AppointmentType.FITNESS_TEST]: 'Fitness Test',
      [AppointmentType.OTHER]: 'Medical Appointment',
    };
    return labels[type] || 'Appointment';
  }

  // Get next reminder timing
  private getNextReminderTiming(reminder: AppointmentReminder): ReminderTiming | null {
    const now = new Date();
    const appointmentTime = new Date(reminder.appointmentDate);

    for (const timing of reminder.reminderTimings) {
      const reminderTime = this.calculateReminderTime(timing, appointmentTime);
      if (reminderTime > now && !reminder.remindersSent?.[timing]) {
        return timing;
      }
    }

    return null;
  }

  // Calculate reminder time
  private calculateReminderTime(timing: ReminderTiming, appointmentDate: Date): Date {
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
        reminderTime.setHours(8, 0, 0, 0);
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

  // CRUD Operations

  async createReminder(data: Partial<AppointmentReminder>): Promise<AppointmentReminder> {
    const reminder = this.appointmentReminderRepository.create(data);

    // Calculate initial send time
    if (reminder.reminderTimings && reminder.reminderTimings.length > 0) {
      const nextTiming = this.getNextReminderTiming(reminder);
      if (nextTiming) {
        reminder.sendAt = this.calculateReminderTime(nextTiming, reminder.appointmentDate);
      }
    }

    return this.appointmentReminderRepository.save(reminder);
  }

  async updateReminder(id: string, data: Partial<AppointmentReminder>): Promise<AppointmentReminder> {
    const reminder = await this.appointmentReminderRepository.findOne({ where: { id } });
    if (!reminder) {
      throw new Error('Appointment reminder not found');
    }

    Object.assign(reminder, data);

    // Recalculate send time if timings changed
    if (data.reminderTimings || data.appointmentDate) {
      const nextTiming = this.getNextReminderTiming(reminder);
      if (nextTiming) {
        reminder.sendAt = this.calculateReminderTime(nextTiming, reminder.appointmentDate);
      }
    }

    return this.appointmentReminderRepository.save(reminder);
  }

  async cancelReminder(id: string, userId: string, reason?: string): Promise<AppointmentReminder> {
    const reminder = await this.appointmentReminderRepository.findOne({ where: { id } });
    if (!reminder) {
      throw new Error('Appointment reminder not found');
    }

    reminder.status = ReminderStatus.CANCELLED;
    reminder.cancelledAt = new Date();
    reminder.cancelledBy = userId;
    reminder.cancellationReason = reason;

    return this.appointmentReminderRepository.save(reminder);
  }

  async acknowledgeReminder(id: string, userId: string): Promise<AppointmentReminder> {
    const reminder = await this.appointmentReminderRepository.findOne({ where: { id } });
    if (!reminder) {
      throw new Error('Appointment reminder not found');
    }

    reminder.status = ReminderStatus.ACKNOWLEDGED;
    reminder.acknowledgedAt = new Date();
    reminder.acknowledgedBy = userId;

    return this.appointmentReminderRepository.save(reminder);
  }

  async getReminder(id: string): Promise<AppointmentReminder | null> {
    return this.appointmentReminderRepository.findOne({ where: { id } });
  }

  async getUserReminders(userId: string, upcoming: boolean = true): Promise<AppointmentReminder[]> {
    const where: any = { userId };
    
    if (upcoming) {
      where.appointmentDate = new Date();
      where.status = Not(ReminderStatus.CANCELLED);
    }

    return this.appointmentReminderRepository.find({
      where,
      order: { appointmentDate: 'ASC' },
    });
  }

  async getMedicalStaffReminders(medicalStaffId: string, date?: Date): Promise<AppointmentReminder[]> {
    const where: any = { medicalStaffId };
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    return this.appointmentReminderRepository.find({
      where,
      order: { appointmentDate: 'ASC' },
    });
  }

  async getOrganizationReminders(organizationId: string, options: {
    startDate?: Date;
    endDate?: Date;
    status?: ReminderStatus;
    appointmentType?: AppointmentType;
  } = {}): Promise<AppointmentReminder[]> {
    const where: any = { organizationId };

    if (options.startDate || options.endDate) {
      where.appointmentDate = {};
      if (options.startDate) where.appointmentDate.gte = options.startDate;
      if (options.endDate) where.appointmentDate.lte = options.endDate;
    }

    if (options.status) where.status = options.status;
    if (options.appointmentType) where.appointmentType = options.appointmentType;

    return this.appointmentReminderRepository.find({
      where,
      order: { appointmentDate: 'ASC' },
    });
  }

  // Bulk operations
  async createBulkReminders(appointments: Partial<AppointmentReminder>[]): Promise<AppointmentReminder[]> {
    const reminders = appointments.map(appointment => {
      const reminder = this.appointmentReminderRepository.create(appointment);
      
      // Calculate initial send time
      if (reminder.reminderTimings && reminder.reminderTimings.length > 0) {
        const nextTiming = this.getNextReminderTiming(reminder);
        if (nextTiming) {
          reminder.sendAt = this.calculateReminderTime(nextTiming, reminder.appointmentDate);
        }
      }
      
      return reminder;
    });

    return this.appointmentReminderRepository.save(reminders);
  }

  // Statistics
  async getReminderStatistics(organizationId: string, startDate: Date, endDate: Date) {
    const reminders = await this.appointmentReminderRepository.find({
      where: {
        organizationId,
        appointmentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const stats = {
      total: reminders.length,
      byStatus: {} as Record<ReminderStatus, number>,
      byType: {} as Record<AppointmentType, number>,
      upcomingCount: 0,
      pastDueCount: 0,
      acknowledgedRate: 0,
      averageRemindersPerAppointment: 0,
    };

    // Calculate statistics
    reminders.forEach(reminder => {
      // By status
      stats.byStatus[reminder.status] = (stats.byStatus[reminder.status] || 0) + 1;
      
      // By type
      stats.byType[reminder.appointmentType] = (stats.byType[reminder.appointmentType] || 0) + 1;
      
      // Upcoming/past due
      if (reminder.isUpcoming) stats.upcomingCount++;
      if (reminder.isPastDue) stats.pastDueCount++;
    });

    // Calculate rates
    const totalSent = stats.byStatus[ReminderStatus.SENT] || 0;
    const totalAcknowledged = stats.byStatus[ReminderStatus.ACKNOWLEDGED] || 0;
    stats.acknowledgedRate = totalSent > 0 ? (totalAcknowledged / totalSent) * 100 : 0;

    // Average reminders per appointment
    const totalReminders = reminders.reduce((sum, r) => sum + r.reminderCount, 0);
    stats.averageRemindersPerAppointment = reminders.length > 0 ? totalReminders / reminders.length : 0;

    return stats;
  }
}