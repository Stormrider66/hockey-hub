import { AppDataSource } from '../config/database';
import { Event, EventParticipant } from '../entities';
import { CalendarNotificationService } from './CalendarNotificationService';
import { LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { Logger, serviceClients } from '@hockey-hub/shared-lib';

export class ReminderScheduler {
  private notificationService: CalendarNotificationService;
  private logger: Logger;
  private isRunning: boolean = false;
  private schedulerInterval?: NodeJS.Timeout;
  private communicationClient: ReturnType<typeof serviceClients.communication>;

  constructor() {
    this.notificationService = new CalendarNotificationService();
    this.logger = new Logger('ReminderScheduler');
    this.communicationClient = serviceClients.communication();
  }

  /**
   * Start the reminder scheduler
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn('Reminder scheduler already running');
      return;
    }

    this.isRunning = true;
    
    // Check for reminders every minute
    this.schedulerInterval = setInterval(
      () => this.processReminders(),
      60000 // 1 minute
    );

    this.logger.info('Reminder scheduler started');
  }

  /**
   * Stop the reminder scheduler
   */
  stop(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = undefined;
    }
    this.isRunning = false;
    this.logger.info('Reminder scheduler stopped');
  }

  /**
   * Process due reminders
   */
  private async processReminders(): Promise<void> {
    try {
      const now = new Date();
      
      // Check for events that need reminders
      const reminderTimes = [1, 5, 15, 30, 60, 120, 1440]; // minutes before event
      
      for (const minutesBefore of reminderTimes) {
        await this.processReminderForTime(now, minutesBefore);
      }
    } catch (error) {
      this.logger.error('Error processing reminders', error);
    }
  }

  /**
   * Process reminders for a specific time
   */
  private async processReminderForTime(now: Date, minutesBefore: number): Promise<void> {
    try {
      // Calculate the target time (when events start that need reminders)
      const targetTime = new Date(now.getTime() + (minutesBefore * 60 * 1000));
      
      // Find events starting within the next minute of the target time
      const startRange = new Date(targetTime.getTime() - 30000); // 30 seconds before
      const endRange = new Date(targetTime.getTime() + 30000);   // 30 seconds after

      const eventRepository = AppDataSource.getRepository(Event);
      const participantRepository = AppDataSource.getRepository(EventParticipant);

      const events = await eventRepository.find({
        where: {
          startTime: MoreThanOrEqual(startRange) && LessThanOrEqual(endRange),
          deletedAt: IsNull(),
          status: 'scheduled',
          sendReminders: true,
        },
        relations: ['participants'],
      });

      for (const event of events) {
        // Check if we should send this reminder
        if (await this.shouldSendReminder(event, minutesBefore)) {
          // Get participants who haven't been sent this specific reminder
          const eligibleParticipants = await this.getEligibleParticipants(event, minutesBefore);
          
          if (eligibleParticipants.length > 0) {
            // Send regular notification reminders
            await this.notificationService.sendEventReminder(event, eligibleParticipants, minutesBefore);
            
            // Send chat reminders if event has conversations
            await this.sendChatReminder(event, minutesBefore);
            
            // Mark participants as having received this reminder
            await this.markReminderSent(event, eligibleParticipants, minutesBefore);
            
            this.logger.info('Reminder sent', {
              eventId: event.id,
              minutesBefore,
              participantCount: eligibleParticipants.length
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error processing ${minutesBefore}-minute reminders`, error);
    }
  }

  /**
   * Check if we should send a reminder for this event and time
   */
  private async shouldSendReminder(event: Event, minutesBefore: number): Promise<boolean> {
    // Check if the event has custom reminder settings
    if (event.reminderMinutes && Array.isArray(event.reminderMinutes)) {
      return event.reminderMinutes.includes(minutesBefore);
    }

    // Default reminder times based on event type
    const defaultReminders = this.getDefaultReminderTimes(event.type);
    return defaultReminders.includes(minutesBefore);
  }

  /**
   * Get default reminder times for event types
   */
  private getDefaultReminderTimes(eventType: string): number[] {
    switch (eventType) {
      case 'game':
        return [120, 60, 15]; // 2 hours, 1 hour, 15 minutes
      case 'practice':
        return [60, 15]; // 1 hour, 15 minutes
      case 'training':
        return [60, 15]; // 1 hour, 15 minutes
      case 'meeting':
        return [60, 5]; // 1 hour, 5 minutes
      case 'medical':
        return [1440, 60]; // 1 day, 1 hour
      case 'equipment':
        return [60]; // 1 hour
      default:
        return [60]; // 1 hour for all other events
    }
  }

  /**
   * Get participants who are eligible for a specific reminder
   */
  private async getEligibleParticipants(event: Event, minutesBefore: number): Promise<EventParticipant[]> {
    // For now, return all active participants
    // In a more advanced implementation, we could track which reminders 
    // have been sent to which participants
    return event.participants?.filter(p => 
      p.status !== 'declined' && 
      !p.deletedAt
    ) || [];
  }

  /**
   * Mark that a reminder has been sent to participants
   */
  private async markReminderSent(
    event: Event, 
    participants: EventParticipant[], 
    minutesBefore: number
  ): Promise<void> {
    // In a more advanced implementation, we could track sent reminders
    // in a separate table or in participant metadata
    // For now, we'll just log it
    this.logger.debug('Reminder marked as sent', {
      eventId: event.id,
      participantIds: participants.map(p => p.participantId),
      minutesBefore
    });
  }

  /**
   * Send reminder through chat conversations
   */
  private async sendChatReminder(
    event: Event,
    minutesBefore: number
  ): Promise<void> {
    try {
      // Get all event conversations for this event
      const response = await this.communicationClient.get(
        `/api/event-conversations/event/${event.id}`
      );
      
      if (!response.data?.data || !Array.isArray(response.data.data)) {
        return;
      }

      const eventConversations = response.data.data;
      
      // Format the reminder message
      const reminderMessage = this.formatReminderMessage(event, minutesBefore);
      
      // Send reminder to each conversation that has notifications enabled
      for (const eventConversation of eventConversations) {
        // Check if this conversation has reminder notifications enabled
        if (eventConversation.settings?.notifyOnEventReminders !== false) {
          try {
            await this.communicationClient.post(
              `/api/event-conversations/${eventConversation.id}/reminder`,
              { message: reminderMessage },
              {
                customHeaders: {
                  'X-System-User-Id': 'calendar-service'
                }
              }
            );
            
            this.logger.info('Chat reminder sent', {
              eventId: event.id,
              conversationId: eventConversation.conversation_id,
              minutesBefore
            });
          } catch (error) {
            this.logger.error('Failed to send chat reminder', {
              eventId: event.id,
              conversationId: eventConversation.conversation_id,
              error: error.message
            });
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to get event conversations', {
        eventId: event.id,
        error: error.message
      });
    }
  }

  /**
   * Format reminder message based on event and time
   */
  private formatReminderMessage(event: Event, minutesBefore: number): string {
    const timeText = this.formatTimeText(minutesBefore);
    
    let message = `📅 **Event Reminder**\n\n`;
    message += `**${event.title}** ${timeText}\n`;
    
    if (event.location) {
      message += `📍 Location: ${event.location}\n`;
    }
    
    if (event.description) {
      message += `\n${event.description}\n`;
    }
    
    // Add specific instructions based on event type
    if (event.type === 'game') {
      message += `\n🏒 Please arrive early for warm-up and equipment check.`;
    } else if (event.type === 'practice') {
      message += `\n⛸️ Don't forget your practice gear!`;
    } else if (event.type === 'medical') {
      message += `\n🏥 Please bring any required documents or medical history.`;
    }
    
    return message;
  }

  /**
   * Format time text for reminder message
   */
  private formatTimeText(minutesBefore: number): string {
    if (minutesBefore < 60) {
      return `starts in ${minutesBefore} minute${minutesBefore > 1 ? 's' : ''}`;
    } else if (minutesBefore === 60) {
      return 'starts in 1 hour';
    } else if (minutesBefore < 1440) {
      const hours = Math.floor(minutesBefore / 60);
      return `starts in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutesBefore / 1440);
      return `is ${days} day${days > 1 ? 's' : ''} away`;
    }
  }

  /**
   * Process conflict detection and notification
   */
  async checkScheduleConflicts(): Promise<void> {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Next 24 hours

      const eventRepository = AppDataSource.getRepository(Event);
      
      // Get events in the next 24 hours
      const upcomingEvents = await eventRepository.find({
        where: {
          startTime: MoreThanOrEqual(now) && LessThanOrEqual(futureTime),
          deletedAt: IsNull(),
          status: 'scheduled',
        },
        relations: ['participants'],
      });

      // Group events by participant to detect conflicts
      const participantEvents = new Map<string, Event[]>();
      
      for (const event of upcomingEvents) {
        if (event.participants) {
          for (const participant of event.participants) {
            if (!participantEvents.has(participant.participantId)) {
              participantEvents.set(participant.participantId, []);
            }
            participantEvents.get(participant.participantId)!.push(event);
          }
        }
      }

      // Check for conflicts
      for (const [participantId, events] of participantEvents) {
        const conflicts = this.findTimeConflicts(events);
        
        if (conflicts.length > 0) {
          await this.notificationService.notifyScheduleConflict(conflicts, [participantId]);
        }
      }
    } catch (error) {
      this.logger.error('Error checking schedule conflicts', error);
    }
  }

  /**
   * Find time conflicts in a list of events
   */
  private findTimeConflicts(events: Event[]): Event[] {
    const conflicts: Event[] = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        
        if (this.eventsOverlap(event1, event2)) {
          if (!conflicts.includes(event1)) conflicts.push(event1);
          if (!conflicts.includes(event2)) conflicts.push(event2);
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Check if two events overlap in time
   */
  private eventsOverlap(event1: Event, event2: Event): boolean {
    if (!event1.startTime || !event1.endTime || !event2.startTime || !event2.endTime) {
      return false;
    }

    const start1 = new Date(event1.startTime);
    const end1 = new Date(event1.endTime);
    const start2 = new Date(event2.startTime);
    const end2 = new Date(event2.endTime);

    return start1 < end2 && start2 < end1;
  }

  /**
   * Schedule RSVP reminders for events requiring responses
   */
  async scheduleRSVPReminders(): Promise<void> {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // Next 7 days

      const eventRepository = AppDataSource.getRepository(Event);
      
      const eventsRequiringRSVP = await eventRepository.find({
        where: {
          startTime: MoreThanOrEqual(now) && LessThanOrEqual(futureTime),
          deletedAt: IsNull(),
          status: 'scheduled',
          requiresRSVP: true,
        },
        relations: ['participants'],
      });

      for (const event of eventsRequiringRSVP) {
        if (event.participants) {
          const pendingParticipants = event.participants.filter(p => 
            p.status === 'pending' && !p.deletedAt
          );

          for (const participant of pendingParticipants) {
            await this.notificationService.sendRSVPRequest(event, participant.participantId);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error scheduling RSVP reminders', error);
    }
  }
}