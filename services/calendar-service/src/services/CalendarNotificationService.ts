// @ts-nocheck - Notification service with complex entity properties
import { Event, EventParticipant, EventType } from '../entities';
import { Logger } from '@hockey-hub/shared-lib';

export interface NotificationPayload {
  recipientId: string;
  organizationId?: string;
  teamId?: string;
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  channels?: string[];
  scheduledFor?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export class CalendarNotificationService {
  private logger: Logger;
  private communicationServiceUrl: string;

  constructor() {
    this.logger = new Logger('CalendarNotificationService');
    this.communicationServiceUrl = process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:3002';
  }

  /**
   * Send event created notification to participants
   */
  async notifyEventCreated(event: Event, participants: EventParticipant[]): Promise<void> {
    try {
      const notifications: NotificationPayload[] = participants.map(participant => ({
        recipientId: participant.participantId,
        organizationId: event.organizationId,
        teamId: event.teamId,
        type: 'event_created',
        title: `New Event: ${event.title}`,
        message: this.getEventMessage(event, 'created'),
        priority: this.getEventPriority(event),
        actionUrl: `/calendar?eventId=${event.id}`,
        actionText: 'View Event',
        relatedEntityId: event.id,
        relatedEntityType: 'Event',
        channels: ['in_app', 'email'],
        expiresAt: event.endTime ? new Date(event.endTime) : undefined,
        metadata: {
          eventType: event.type,
          location: event.location,
          startTime: event.startTime,
          endTime: event.endTime,
        },
      }));

      await this.sendBulkNotifications(notifications);

      this.logger.info('Event created notifications sent', {
        eventId: event.id,
        participantCount: participants.length
      });
    } catch (error) {
      this.logger.error('Failed to send event created notifications', error);
    }
  }

  /**
   * Send event updated notification to participants
   */
  async notifyEventUpdated(
    event: Event, 
    participants: EventParticipant[], 
    changes: string[]
  ): Promise<void> {
    try {
      const changeMessage = this.formatEventChanges(changes);
      
      const notifications: NotificationPayload[] = participants.map(participant => ({
        recipientId: participant.participantId,
        organizationId: event.organizationId,
        teamId: event.teamId,
        type: 'event_updated',
        title: `Event Updated: ${event.title}`,
        message: `${event.title} has been updated. ${changeMessage}`,
        priority: this.getEventPriority(event),
        actionUrl: `/calendar?eventId=${event.id}`,
        actionText: 'View Changes',
        relatedEntityId: event.id,
        relatedEntityType: 'Event',
        channels: ['in_app', 'email'],
        metadata: {
          eventType: event.type,
          changes,
          location: event.location,
          startTime: event.startTime,
          endTime: event.endTime,
        },
      }));

      await this.sendBulkNotifications(notifications);

      this.logger.info('Event updated notifications sent', {
        eventId: event.id,
        participantCount: participants.length,
        changes
      });
    } catch (error) {
      this.logger.error('Failed to send event updated notifications', error);
    }
  }

  /**
   * Send event cancelled notification to participants
   */
  async notifyEventCancelled(event: Event, participants: EventParticipant[]): Promise<void> {
    try {
      const notifications: NotificationPayload[] = participants.map(participant => ({
        recipientId: participant.participantId,
        organizationId: event.organizationId,
        teamId: event.teamId,
        type: 'event_cancelled',
        title: `Event Cancelled: ${event.title}`,
        message: this.getEventMessage(event, 'cancelled'),
        priority: 'high',
        actionUrl: `/calendar`,
        actionText: 'View Calendar',
        relatedEntityId: event.id,
        relatedEntityType: 'Event',
        channels: ['in_app', 'email', 'push'],
        metadata: {
          eventType: event.type,
          originalStartTime: event.startTime,
          originalEndTime: event.endTime,
          location: event.location,
        },
      }));

      await this.sendBulkNotifications(notifications);

      this.logger.info('Event cancelled notifications sent', {
        eventId: event.id,
        participantCount: participants.length
      });
    } catch (error) {
      this.logger.error('Failed to send event cancelled notifications', error);
    }
  }

  /**
   * Send event reminder notifications
   */
  async sendEventReminder(
    event: Event, 
    participants: EventParticipant[], 
    minutesBefore: number
  ): Promise<void> {
    try {
      const timeText = this.formatReminderTime(minutesBefore);
      
      const notifications: NotificationPayload[] = participants.map(participant => ({
        recipientId: participant.participantId,
        organizationId: event.organizationId,
        teamId: event.teamId,
        type: 'event_reminder',
        title: `Reminder: ${event.title}`,
        message: `${event.title} starts ${timeText}. ${event.location ? `Location: ${event.location}` : ''}`,
        priority: minutesBefore <= 15 ? 'high' : 'normal',
        actionUrl: `/calendar?eventId=${event.id}`,
        actionText: 'View Event',
        relatedEntityId: event.id,
        relatedEntityType: 'Event',
        channels: minutesBefore <= 15 ? ['in_app', 'push'] : ['in_app', 'email'],
        metadata: {
          eventType: event.type,
          minutesBefore,
          location: event.location,
          startTime: event.startTime,
          endTime: event.endTime,
        },
      }));

      await this.sendBulkNotifications(notifications);

      this.logger.info('Event reminder notifications sent', {
        eventId: event.id,
        participantCount: participants.length,
        minutesBefore
      });
    } catch (error) {
      this.logger.error('Failed to send event reminder notifications', error);
    }
  }

  /**
   * Send RSVP request notification
   */
  async sendRSVPRequest(event: Event, participantId: string): Promise<void> {
    try {
      const notification: NotificationPayload = {
        recipientId: participantId,
        organizationId: event.organizationId,
        teamId: event.teamId,
        type: 'rsvp_request',
        title: `RSVP Required: ${event.title}`,
        message: `Please confirm your attendance for ${event.title}.`,
        priority: this.getEventPriority(event),
        actionUrl: `/calendar?eventId=${event.id}&rsvp=true`,
        actionText: 'Respond Now',
        relatedEntityId: event.id,
        relatedEntityType: 'Event',
        channels: ['in_app', 'email'],
        expiresAt: event.startTime ? new Date(event.startTime) : undefined,
        metadata: {
          eventType: event.type,
          requiresRSVP: true,
          location: event.location,
          startTime: event.startTime,
          endTime: event.endTime,
        },
      };

      await this.sendNotification(notification);

      this.logger.info('RSVP request notification sent', {
        eventId: event.id,
        participantId
      });
    } catch (error) {
      this.logger.error('Failed to send RSVP request notification', error);
    }
  }

  /**
   * Send schedule conflict notification
   */
  async notifyScheduleConflict(
    conflictingEvents: Event[], 
    affectedParticipants: string[]
  ): Promise<void> {
    try {
      const notifications: NotificationPayload[] = affectedParticipants.map(participantId => ({
        recipientId: participantId,
        type: 'schedule_conflict',
        title: 'Schedule Conflict Detected',
        message: `You have conflicting events: ${conflictingEvents.map(e => e.title).join(', ')}`,
        priority: 'high',
        actionUrl: `/calendar?showConflicts=true`,
        actionText: 'Resolve Conflicts',
        relatedEntityType: 'Conflict',
        channels: ['in_app', 'push'],
        metadata: {
          conflictingEventIds: conflictingEvents.map(e => e.id),
          conflictingEventTitles: conflictingEvents.map(e => e.title),
          conflictCount: conflictingEvents.length,
        },
      }));

      await this.sendBulkNotifications(notifications);

      this.logger.info('Schedule conflict notifications sent', {
        conflictingEventCount: conflictingEvents.length,
        affectedParticipantCount: affectedParticipants.length
      });
    } catch (error) {
      this.logger.error('Failed to send schedule conflict notifications', error);
    }
  }

  /**
   * Send single notification to communication service
   */
  private async sendNotification(notification: NotificationPayload): Promise<void> {
    try {
      const response = await fetch(`${this.communicationServiceUrl}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.statusText}`);
      }
    } catch (error) {
      this.logger.error('Error sending notification to communication service', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications to communication service
   */
  private async sendBulkNotifications(notifications: NotificationPayload[]): Promise<void> {
    if (notifications.length === 0) return;

    try {
      // Group notifications by recipient to create bulk requests
      const recipientIds = notifications.map(n => n.recipientId);
      const baseNotification = notifications[0];

      const response = await fetch(`${this.communicationServiceUrl}/api/notifications/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientIds,
          organizationId: baseNotification.organizationId,
          teamId: baseNotification.teamId,
          type: baseNotification.type,
          title: baseNotification.title,
          message: baseNotification.message,
          priority: baseNotification.priority,
          actionUrl: baseNotification.actionUrl,
          actionText: baseNotification.actionText,
          relatedEntityId: baseNotification.relatedEntityId,
          relatedEntityType: baseNotification.relatedEntityType,
          channels: baseNotification.channels,
          scheduledFor: baseNotification.scheduledFor,
          expiresAt: baseNotification.expiresAt,
          metadata: baseNotification.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send bulk notifications: ${response.statusText}`);
      }
    } catch (error) {
      this.logger.error('Error sending bulk notifications to communication service', error);
      throw error;
    }
  }

  /**
   * Get event priority based on type and timing
   */
  private getEventPriority(event: Event): 'low' | 'normal' | 'high' | 'urgent' {
    // Urgent: Games or important events starting within 2 hours
    if (event.type === EventType.GAME || (event.metadata as any)?.isImportant) {
      const timeUntilEvent = event.startTime ?
        (new Date(event.startTime).getTime() - Date.now()) / (1000 * 60 * 60) : Infinity;
      
      if (timeUntilEvent <= 2) return 'urgent';
      if (timeUntilEvent <= 24) return 'high';
    }

    // High: Training, practice, or medical appointments
    if ([EventType.TRAINING, EventType.MEDICAL].includes(event.type)) {
      return 'high';
    }

    // Normal: Meetings, general events
    return 'normal';
  }

  /**
   * Format event message based on action
   */
  private getEventMessage(event: Event, action: 'created' | 'cancelled'): string {
    const startTime = event.startTime ?
      new Date(event.startTime).toLocaleString() : 'TBD';
    
    const location = event.location ? ` at ${event.location}` : '';
    
    switch (action) {
      case 'created':
        return `A new ${event.type} has been scheduled for ${startTime}${location}.`;
      case 'cancelled':
        return `The ${event.type} scheduled for ${startTime}${location} has been cancelled.`;
      default:
        return `Event ${action}: ${event.title}`;
    }
  }

  /**
   * Format event changes for update notifications
   */
  private formatEventChanges(changes: string[]): string {
    if (changes.length === 0) return 'Details have been updated.';
    
    const changeMap: Record<string, string> = {
      'start_time': 'start time',
      'end_time': 'end time',
      'location': 'location',
      'description': 'description',
      'title': 'title',
    };

    const formattedChanges = changes
      .map(change => changeMap[change] || change)
      .join(', ');

    return `Changes: ${formattedChanges}.`;
  }

  /**
   * Format reminder time text
   */
  private formatReminderTime(minutesBefore: number): string {
    if (minutesBefore < 60) {
      return `in ${minutesBefore} minute${minutesBefore !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutesBefore / 60);
    const remainingMinutes = minutesBefore % 60;
    
    if (remainingMinutes === 0) {
      return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    return `in ${hours}h ${remainingMinutes}m`;
  }
}