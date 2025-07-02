import { BaseBotService } from './BaseBotService';
import { BotType, BotPermission } from './BotUser';
import { MessageType } from '../entities';
import * as cron from 'node-cron';

export interface MedicalAppointment {
  appointmentId: string;
  userId: string;
  type: AppointmentType;
  scheduledTime: Date;
  duration: number;
  location: string;
  practitioner: string;
  notes?: string;
  preAppointmentInstructions?: string[];
  postAppointmentInstructions?: string[];
}

export enum AppointmentType {
  PHYSICAL_THERAPY = 'physical_therapy',
  DOCTOR_VISIT = 'doctor_visit',
  INJURY_ASSESSMENT = 'injury_assessment',
  ROUTINE_CHECKUP = 'routine_checkup',
  FOLLOW_UP = 'follow_up',
  IMAGING = 'imaging',
  TREATMENT = 'treatment',
}

export interface MedicationReminder {
  userId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  startDate: Date;
  endDate?: Date;
}

export interface InjuryCheckIn {
  userId: string;
  injuryId: string;
  checkInSchedule: 'daily' | 'every_other_day' | 'weekly';
  questions: string[];
}

export class MedicalAppointmentBot extends BaseBotService {
  private appointmentJobs: Map<string, cron.ScheduledTask | NodeJS.Timeout>;
  private medicationJobs: Map<string, cron.ScheduledTask>;
  private checkInJobs: Map<string, cron.ScheduledTask>;
  
  constructor() {
    super(BotType.MEDICAL_APPOINTMENT);
    this.appointmentJobs = new Map();
    this.medicationJobs = new Map();
    this.checkInJobs = new Map();
  }

  public async initialize(): Promise<void> {
    this.logger.info('Medical Appointment Bot initialized');
    
    // Register interaction handlers
    this.registerInteractionHandler('confirm_appointment', async (interaction) => {
      await this.handleAppointmentConfirmation(interaction);
    });
    
    this.registerInteractionHandler('reschedule_appointment', async (interaction) => {
      await this.handleRescheduleRequest(interaction);
    });
    
    this.registerInteractionHandler('medication_taken', async (interaction) => {
      await this.handleMedicationTaken(interaction);
    });
    
    this.registerInteractionHandler('injury_checkin', async (interaction) => {
      await this.handleInjuryCheckIn(interaction);
    });
    
    this.registerInteractionHandler('view_appointment_details', async (interaction) => {
      await this.handleViewAppointmentDetails(interaction);
    });
  }

  /**
   * Schedule appointment reminders
   */
  public async scheduleAppointmentReminders(appointment: MedicalAppointment): Promise<void> {
    if (!this.hasPermission(BotPermission.CREATE_REMINDERS)) {
      throw new Error('Bot lacks permission to create reminders');
    }

    const { appointmentId, userId, scheduledTime } = appointment;
    const jobId = `appointment_${appointmentId}`;

    // Cancel existing reminders if any
    this.cancelAppointmentReminder(jobId);

    // Schedule reminders at different intervals
    const reminderSchedule = [
      { offset: 48 * 60, type: 'two_days' },      // 48 hours before
      { offset: 24 * 60, type: 'one_day' },       // 24 hours before
      { offset: 2 * 60, type: 'two_hours' },      // 2 hours before
      { offset: 60, type: 'one_hour' },           // 1 hour before
    ];

    reminderSchedule.forEach(({ offset, type }) => {
      const reminderTime = new Date(scheduledTime.getTime() - offset * 60 * 1000);
      
      if (reminderTime > new Date()) {
        // Schedule a one-time reminder
        const timeout = reminderTime.getTime() - Date.now();
        const timeoutId = setTimeout(async () => {
          await this.sendAppointmentReminder(appointment, type);
          // Remove from jobs map after execution
          this.appointmentJobs.delete(`${jobId}_${type}`);
        }, timeout);
        
        this.appointmentJobs.set(`${jobId}_${type}`, timeoutId);
      }
    });

    // Schedule post-appointment follow-up
    const followUpTime = new Date(scheduledTime.getTime() + (appointment.duration + 30) * 60 * 1000);
    const followUpTimeout = followUpTime.getTime() - Date.now();
    if (followUpTimeout > 0) {
      const followUpTimeoutId = setTimeout(async () => {
        await this.sendPostAppointmentFollowUp(appointment);
        this.appointmentJobs.delete(`${jobId}_followup`);
      }, followUpTimeout);
      this.appointmentJobs.set(`${jobId}_followup`, followUpTimeoutId);
    }

    this.logger.info(`Scheduled appointment reminders for ${appointmentId}`);
    this.logActivity('appointment_reminders_scheduled', { userId, appointmentId });
  }

  /**
   * Send appointment reminder based on timing
   */
  private async sendAppointmentReminder(
    appointment: MedicalAppointment,
    reminderType: string
  ): Promise<void> {
    const { userId, type, scheduledTime, location, practitioner, preAppointmentInstructions } = appointment;

    let content = '';
    let priority = 'normal';
    let actions: any[] = [];

    switch (reminderType) {
      case 'two_days':
        content = this.createTwoDayReminder(appointment);
        actions = [
          {
            id: 'confirm_appointment',
            type: 'button',
            label: '✅ Confirm Appointment',
            value: appointment.appointmentId,
            style: 'primary',
          },
          {
            id: 'reschedule_appointment',
            type: 'button',
            label: '📅 Need to Reschedule',
            value: appointment.appointmentId,
            style: 'secondary',
          },
        ];
        break;
        
      case 'one_day':
        content = this.createOneDayReminder(appointment);
        priority = 'important';
        actions = [
          {
            id: 'view_appointment_details',
            type: 'button',
            label: '📋 View Details',
            value: appointment.appointmentId,
            style: 'primary',
          },
        ];
        break;
        
      case 'two_hours':
        content = this.createTwoHourReminder(appointment);
        priority = 'urgent';
        actions = [
          {
            id: 'get_directions',
            type: 'link',
            label: '🗺️ Get Directions',
            value: location,
            url: `https://maps.google.com/?q=${encodeURIComponent(location)}`,
            style: 'primary',
          },
        ];
        break;
        
      case 'one_hour':
        content = this.createOneHourReminder(appointment);
        priority = 'urgent';
        break;
    }

    await this.sendDirectMessage(userId, content, {
      type: MessageType.ANNOUNCEMENT,
      metadata: {
        reminder_type: reminderType,
        appointment_id: appointment.appointmentId,
        appointment_type: type,
        priority,
      },
      actions,
    });

    this.logActivity('appointment_reminder_sent', { 
      userId, 
      appointmentId: appointment.appointmentId, 
      type: reminderType 
    });
  }

  /**
   * Create two-day reminder content
   */
  private createTwoDayReminder(appointment: MedicalAppointment): string {
    const { type, scheduledTime, location, practitioner } = appointment;
    const emoji = this.getAppointmentEmoji(type);

    let content = `${emoji} Medical Appointment Reminder\n\n`;
    content += `You have a **${this.getAppointmentTypeName(type)}** scheduled in 2 days:\n\n`;
    content += `📅 **Date:** ${scheduledTime.toLocaleDateString()}\n`;
    content += `⏰ **Time:** ${scheduledTime.toLocaleTimeString()}\n`;
    content += `📍 **Location:** ${location}\n`;
    content += `👨‍⚕️ **With:** ${practitioner}\n\n`;
    content += `Please confirm your appointment or let us know if you need to reschedule.`;

    return content;
  }

  /**
   * Create one-day reminder content
   */
  private createOneDayReminder(appointment: MedicalAppointment): string {
    const { type, scheduledTime, preAppointmentInstructions } = appointment;
    const emoji = this.getAppointmentEmoji(type);

    let content = `${emoji} Appointment Tomorrow!\n\n`;
    content += `Your **${this.getAppointmentTypeName(type)}** is tomorrow at ${scheduledTime.toLocaleTimeString()}.\n\n`;

    if (preAppointmentInstructions && preAppointmentInstructions.length > 0) {
      content += `**Pre-appointment Instructions:**\n`;
      preAppointmentInstructions.forEach(instruction => {
        content += `• ${instruction}\n`;
      });
      content += '\n';
    }

    content += `**Reminders:**\n`;
    content += `• Bring your insurance card\n`;
    content += `• Arrive 15 minutes early\n`;
    content += `• List of current medications\n`;
    content += `• Any relevant medical records`;

    return content;
  }

  /**
   * Create two-hour reminder content
   */
  private createTwoHourReminder(appointment: MedicalAppointment): string {
    const { type, scheduledTime, location } = appointment;
    const emoji = this.getAppointmentEmoji(type);

    let content = `${emoji} Appointment in 2 Hours!\n\n`;
    content += `Your **${this.getAppointmentTypeName(type)}** starts at ${scheduledTime.toLocaleTimeString()}.\n\n`;
    content += `📍 **Location:** ${location}\n\n`;
    content += `**Don't forget:**\n`;
    content += `• Insurance information\n`;
    content += `• Photo ID\n`;
    content += `• List of questions for your provider\n`;
    content += `• Plan your travel time`;

    return content;
  }

  /**
   * Create one-hour reminder content
   */
  private createOneHourReminder(appointment: MedicalAppointment): string {
    const { type, location, practitioner } = appointment;
    const emoji = this.getAppointmentEmoji(type);

    let content = `${emoji} Final Reminder - 1 Hour!\n\n`;
    content += `Your appointment with ${practitioner} begins in 1 hour.\n\n`;
    content += `📍 ${location}\n\n`;
    content += `Safe travels! 🚗`;

    return content;
  }

  /**
   * Send post-appointment follow-up
   */
  private async sendPostAppointmentFollowUp(appointment: MedicalAppointment): Promise<void> {
    const { userId, type, postAppointmentInstructions } = appointment;

    let content = `💬 Post-Appointment Follow-Up\n\n`;
    content += `How was your ${this.getAppointmentTypeName(type)} appointment today?\n\n`;

    if (postAppointmentInstructions && postAppointmentInstructions.length > 0) {
      content += `**Follow-up Instructions:**\n`;
      postAppointmentInstructions.forEach(instruction => {
        content += `• ${instruction}\n`;
      });
      content += '\n';
    }

    content += `**Remember to:**\n`;
    content += `• Follow any treatment plans prescribed\n`;
    content += `• Take medications as directed\n`;
    content += `• Schedule any follow-up appointments\n`;
    content += `• Contact us if you have any concerns`;

    await this.sendDirectMessage(userId, content, {
      type: MessageType.TEXT,
      metadata: {
        appointment_id: appointment.appointmentId,
        follow_up: true,
      },
      actions: [
        {
          id: 'schedule_followup',
          type: 'button',
          label: '📅 Schedule Follow-up',
          value: '/appointments/new',
          style: 'primary',
        },
        {
          id: 'contact_provider',
          type: 'button',
          label: '💬 Contact Provider',
          value: `/provider/${appointment.practitioner}`,
          style: 'secondary',
        },
      ],
    });

    this.logActivity('post_appointment_followup_sent', { userId, appointmentId: appointment.appointmentId });
  }

  /**
   * Schedule medication reminder
   */
  public async scheduleMedicationReminder(reminder: MedicationReminder): Promise<void> {
    const { userId, medicationName, frequency } = reminder;
    const jobId = `medication_${userId}_${medicationName.replace(/\s/g, '_')}`;

    // Cancel existing reminder if any
    this.cancelMedicationReminder(jobId);

    // Parse frequency and create cron pattern
    const cronPattern = this.frequencyToCron(frequency);
    
    const task = cron.schedule(cronPattern, async () => {
      await this.sendMedicationReminder(reminder);
    });
    
    this.medicationJobs.set(jobId, task);

    this.logger.info(`Scheduled medication reminder for ${medicationName}`);
    this.logActivity('medication_reminder_scheduled', { userId, medicationName, frequency });
  }

  /**
   * Send medication reminder
   */
  private async sendMedicationReminder(reminder: MedicationReminder): Promise<void> {
    const { userId, medicationName, dosage, instructions } = reminder;

    let content = `💊 Medication Reminder\n\n`;
    content += `Time to take your **${medicationName}**\n\n`;
    content += `**Dosage:** ${dosage}\n`;
    
    if (instructions) {
      content += `**Instructions:** ${instructions}\n`;
    }

    content += '\nPlease confirm when you\'ve taken your medication.';

    await this.sendDirectMessage(userId, content, {
      type: MessageType.ANNOUNCEMENT,
      metadata: {
        reminder_type: 'medication',
        medication_name: medicationName,
      },
      actions: [
        {
          id: 'medication_taken',
          type: 'button',
          label: '✅ Taken',
          value: medicationName,
          style: 'primary',
        },
        {
          id: 'medication_taken',
          type: 'button',
          label: '⏰ Snooze 30 min',
          value: `snooze_${medicationName}`,
          style: 'secondary',
        },
      ],
    });

    this.logActivity('medication_reminder_sent', { userId, medicationName });
  }

  /**
   * Schedule injury check-in
   */
  public async scheduleInjuryCheckIn(checkIn: InjuryCheckIn): Promise<void> {
    const { userId, injuryId, checkInSchedule } = checkIn;
    const jobId = `checkin_${userId}_${injuryId}`;

    // Cancel existing check-in if any
    this.cancelInjuryCheckIn(jobId);

    // Create cron pattern based on schedule
    const cronPattern = this.checkInScheduleToCron(checkInSchedule);
    
    const task = cron.schedule(cronPattern, async () => {
      await this.sendInjuryCheckIn(checkIn);
    });
    
    this.checkInJobs.set(jobId, task);

    this.logger.info(`Scheduled injury check-in for injury ${injuryId}`);
    this.logActivity('injury_checkin_scheduled', { userId, injuryId, schedule: checkInSchedule });
  }

  /**
   * Send injury check-in
   */
  private async sendInjuryCheckIn(checkIn: InjuryCheckIn): Promise<void> {
    const { userId, injuryId, questions } = checkIn;

    let content = `🏥 Injury Recovery Check-In\n\n`;
    content += `How is your recovery progressing? Please answer these questions:\n\n`;
    
    questions.forEach((question, index) => {
      content += `${index + 1}. ${question}\n`;
    });

    content += '\nYour responses help us track your recovery progress.';

    await this.sendDirectMessage(userId, content, {
      type: MessageType.TEXT,
      metadata: {
        check_in_type: 'injury',
        injury_id: injuryId,
      },
      actions: [
        {
          id: 'injury_checkin',
          type: 'button',
          label: '📝 Complete Check-in',
          value: injuryId,
          style: 'primary',
        },
        {
          id: 'contact_medical',
          type: 'button',
          label: '🚨 Report Concern',
          value: 'medical_concern',
          style: 'danger',
        },
      ],
    });

    this.logActivity('injury_checkin_sent', { userId, injuryId });
  }

  /**
   * Handle appointment confirmation
   */
  private async handleAppointmentConfirmation(interaction: any): Promise<void> {
    const { userId, value: appointmentId } = interaction;

    await this.sendDirectMessage(
      userId,
      '✅ Your appointment has been confirmed. We\'ll see you there!',
      {
        isEphemeral: true,
      }
    );

    this.logActivity('appointment_confirmed', { userId, appointmentId });
  }

  /**
   * Handle reschedule request
   */
  private async handleRescheduleRequest(interaction: any): Promise<void> {
    const { userId, value: appointmentId } = interaction;

    await this.sendDirectMessage(
      userId,
      '📅 Opening rescheduling options...\n\nYou can reschedule your appointment online or call our office at (555) 123-4567.',
      {
        isEphemeral: true,
        actions: [
          {
            id: 'reschedule_online',
            type: 'link',
            label: 'Reschedule Online',
            value: `/appointments/${appointmentId}/reschedule`,
            url: `/appointments/${appointmentId}/reschedule`,
            style: 'primary',
          },
        ],
      }
    );

    this.logActivity('reschedule_requested', { userId, appointmentId });
  }

  /**
   * Handle medication taken confirmation
   */
  private async handleMedicationTaken(interaction: any): Promise<void> {
    const { userId, value } = interaction;

    if (value.startsWith('snooze_')) {
      const medicationName = value.replace('snooze_', '');
      await this.sendDirectMessage(
        userId,
        '⏰ I\'ll remind you again in 30 minutes.',
        {
          isEphemeral: true,
        }
      );
      
      // Schedule a one-time reminder in 30 minutes
      setTimeout(async () => {
        await this.sendMedicationReminder({
          userId,
          medicationName,
          dosage: 'As prescribed',
          frequency: 'Once',
          startDate: new Date(),
        });
      }, 30 * 60 * 1000);
    } else {
      await this.sendDirectMessage(
        userId,
        '✅ Great! Your medication has been logged. Keep up the good work! 💪',
        {
          isEphemeral: true,
        }
      );
    }

    this.logActivity('medication_status', { userId, medication: value });
  }

  /**
   * Handle injury check-in
   */
  private async handleInjuryCheckIn(interaction: any): Promise<void> {
    const { userId, value: injuryId } = interaction;

    await this.sendDirectMessage(
      userId,
      '📝 Opening check-in form...\n\nPlease complete the recovery assessment in your medical portal.',
      {
        isEphemeral: true,
        metadata: {
          redirect_to: `/medical/injuries/${injuryId}/checkin`,
        },
      }
    );

    this.logActivity('injury_checkin_started', { userId, injuryId });
  }

  /**
   * Handle view appointment details
   */
  private async handleViewAppointmentDetails(interaction: any): Promise<void> {
    const { userId, value: appointmentId } = interaction;

    await this.sendDirectMessage(
      userId,
      '📋 Loading appointment details...',
      {
        isEphemeral: true,
        metadata: {
          redirect_to: `/appointments/${appointmentId}`,
        },
      }
    );

    this.logActivity('appointment_details_viewed', { userId, appointmentId });
  }

  /**
   * Get appointment type emoji
   */
  private getAppointmentEmoji(type: AppointmentType): string {
    const emojis: Record<AppointmentType, string> = {
      [AppointmentType.PHYSICAL_THERAPY]: '🏃',
      [AppointmentType.DOCTOR_VISIT]: '👨‍⚕️',
      [AppointmentType.INJURY_ASSESSMENT]: '🔍',
      [AppointmentType.ROUTINE_CHECKUP]: '✅',
      [AppointmentType.FOLLOW_UP]: '📋',
      [AppointmentType.IMAGING]: '📷',
      [AppointmentType.TREATMENT]: '💊',
    };
    return emojis[type] || '🏥';
  }

  /**
   * Get friendly appointment type name
   */
  private getAppointmentTypeName(type: AppointmentType): string {
    const names: Record<AppointmentType, string> = {
      [AppointmentType.PHYSICAL_THERAPY]: 'Physical Therapy Session',
      [AppointmentType.DOCTOR_VISIT]: 'Doctor Visit',
      [AppointmentType.INJURY_ASSESSMENT]: 'Injury Assessment',
      [AppointmentType.ROUTINE_CHECKUP]: 'Routine Checkup',
      [AppointmentType.FOLLOW_UP]: 'Follow-up Appointment',
      [AppointmentType.IMAGING]: 'Imaging Appointment',
      [AppointmentType.TREATMENT]: 'Treatment Session',
    };
    return names[type] || 'Medical Appointment';
  }


  /**
   * Convert frequency to cron pattern
   */
  private frequencyToCron(frequency: string): string {
    const patterns: Record<string, string> = {
      'daily': '0 9 * * *',           // 9 AM daily
      'twice_daily': '0 9,21 * * *',  // 9 AM and 9 PM
      'three_times': '0 8,14,20 * * *', // 8 AM, 2 PM, 8 PM
      'four_times': '0 8,12,16,20 * * *', // Every 4 hours starting 8 AM
      'weekly': '0 9 * * 1',          // Monday 9 AM
      'as_needed': '0 9 * * *',       // Daily reminder
    };
    
    return patterns[frequency.toLowerCase().replace(' ', '_')] || patterns.daily;
  }

  /**
   * Convert check-in schedule to cron pattern
   */
  private checkInScheduleToCron(schedule: string): string {
    const patterns: Record<string, string> = {
      'daily': '0 10 * * *',          // 10 AM daily
      'every_other_day': '0 10 */2 * *', // 10 AM every other day
      'weekly': '0 10 * * 1',         // Monday 10 AM
    };
    
    return patterns[schedule] || patterns.daily;
  }

  /**
   * Cancel appointment reminder
   */
  public cancelAppointmentReminder(appointmentId: string): void {
    const jobPrefix = `appointment_${appointmentId}`;
    const jobKeys = Array.from(this.appointmentJobs.keys()).filter(key => key.startsWith(jobPrefix));
    
    jobKeys.forEach(key => {
      const job = this.appointmentJobs.get(key);
      if (job) {
        if (typeof job === 'number') {
          clearTimeout(job);
        }
        this.appointmentJobs.delete(key);
      }
    });
  }

  /**
   * Cancel medication reminder
   */
  public cancelMedicationReminder(jobId: string): void {
    const task = this.medicationJobs.get(jobId);
    if (task) {
      task.stop();
      this.medicationJobs.delete(jobId);
    }
  }

  /**
   * Cancel injury check-in
   */
  public cancelInjuryCheckIn(jobId: string): void {
    const task = this.checkInJobs.get(jobId);
    if (task) {
      task.stop();
      this.checkInJobs.delete(jobId);
    }
  }

  /**
   * Shutdown all jobs
   */
  public shutdown(): void {
    // Cancel appointment timeouts
    this.appointmentJobs.forEach((job, key) => {
      if (typeof job === 'number') {
        clearTimeout(job);
      }
    });
    this.appointmentJobs.clear();
    
    // Stop medication tasks
    this.medicationJobs.forEach(task => task.stop());
    this.medicationJobs.clear();
    
    // Stop check-in tasks
    this.checkInJobs.forEach(task => task.stop());
    this.checkInJobs.clear();
    
    this.logger.info('All medical reminder jobs stopped');
  }
}