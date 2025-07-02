import { BaseBotService, BotMessageOptions } from './BaseBotService';
import { BotType, BotPermission } from './BotUser';
import { MessageType } from '../entities';

export interface TeamAnnouncement {
  teamId: string;
  title: string;
  message: string;
  priority?: 'normal' | 'important' | 'urgent';
  eventType?: CoachAnnouncementType;
  metadata?: Record<string, any>;
}

export enum CoachAnnouncementType {
  PRACTICE_REMINDER = 'practice_reminder',
  GAME_DAY = 'game_day',
  SCHEDULE_CHANGE = 'schedule_change',
  PERFORMANCE_MILESTONE = 'performance_milestone',
  TEAM_MEETING = 'team_meeting',
  LINEUP_ANNOUNCEMENT = 'lineup_announcement',
  WEATHER_UPDATE = 'weather_update',
  EQUIPMENT_REMINDER = 'equipment_reminder',
}

export class CoachBot extends BaseBotService {
  constructor() {
    super(BotType.COACH);
  }

  public async initialize(): Promise<void> {
    this.logger.info('Coach Bot initialized');
    
    // Register interaction handlers
    this.registerInteractionHandler('confirm_attendance', async (interaction) => {
      await this.handleAttendanceConfirmation(interaction);
    });
  }

  /**
   * Send practice reminder
   */
  public async sendPracticeReminder(
    teamId: string,
    playerIds: string[],
    practiceDetails: {
      date: Date;
      time: string;
      location: string;
      duration: string;
      focus?: string;
      equipment?: string[];
    }
  ): Promise<void> {
    if (!this.hasPermission(BotPermission.SEND_TEAM_ANNOUNCEMENTS)) {
      throw new Error('Bot lacks permission to send team announcements');
    }

    const { date, time, location, duration, focus, equipment } = practiceDetails;
    
    let content = `🏒 Practice Reminder

**Date:** ${date.toLocaleDateString()}
**Time:** ${time}
**Location:** ${location}
**Duration:** ${duration}`;

    if (focus) {
      content += `\n**Focus:** ${focus}`;
    }

    if (equipment && equipment.length > 0) {
      content += `\n\n**Required Equipment:**\n${equipment.map(e => `• ${e}`).join('\n')}`;
    }

    content += '\n\nPlease confirm your attendance:';

    await this.sendBroadcast(playerIds, content, {
      type: MessageType.ANNOUNCEMENT,
      metadata: {
        announcement_type: CoachAnnouncementType.PRACTICE_REMINDER,
        team_id: teamId,
        practice_date: date.toISOString(),
      },
      actions: [
        {
          id: 'confirm_attendance',
          type: 'button',
          label: '✅ Will Attend',
          value: 'attending',
          style: 'primary',
        },
        {
          id: 'confirm_attendance',
          type: 'button',
          label: '❌ Cannot Attend',
          value: 'not_attending',
          style: 'secondary',
        },
      ],
    });

    this.logActivity('practice_reminder_sent', { teamId, playerCount: playerIds.length });
  }

  /**
   * Send game day notification
   */
  public async sendGameDayNotification(
    teamId: string,
    playerIds: string[],
    gameDetails: {
      opponent: string;
      time: string;
      location: string;
      arrivalTime: string;
      uniform: string;
      specialInstructions?: string;
    }
  ): Promise<void> {
    const { opponent, time, location, arrivalTime, uniform, specialInstructions } = gameDetails;

    let content = `🎯 GAME DAY vs ${opponent}!

**Game Time:** ${time}
**Location:** ${location}
**Arrival Time:** ${arrivalTime}
**Uniform:** ${uniform}`;

    if (specialInstructions) {
      content += `\n\n**Special Instructions:**\n${specialInstructions}`;
    }

    content += `\n\nLet's bring our A-game today! 💪`;

    await this.sendBroadcast(playerIds, content, {
      type: MessageType.ANNOUNCEMENT,
      metadata: {
        announcement_type: CoachAnnouncementType.GAME_DAY,
        team_id: teamId,
        priority: 'urgent',
      },
      actions: [
        {
          id: 'view_lineup',
          type: 'button',
          label: 'View Lineup',
          value: `/team/${teamId}/lineup`,
          style: 'primary',
        },
        {
          id: 'view_directions',
          type: 'link',
          label: 'Get Directions',
          value: location,
          url: `https://maps.google.com/?q=${encodeURIComponent(location)}`,
          style: 'secondary',
        },
      ],
    });

    this.logActivity('game_day_notification_sent', { teamId, opponent });
  }

  /**
   * Send schedule change notification
   */
  public async sendScheduleChangeNotification(
    teamId: string,
    playerIds: string[],
    changeDetails: {
      eventType: string;
      originalDate: Date;
      newDate?: Date;
      reason: string;
      isCancellation: boolean;
    }
  ): Promise<void> {
    const { eventType, originalDate, newDate, reason, isCancellation } = changeDetails;

    const emoji = isCancellation ? '❌' : '📅';
    const action = isCancellation ? 'CANCELLED' : 'RESCHEDULED';

    let content = `${emoji} ${eventType} ${action}

**Original Date:** ${originalDate.toLocaleDateString()} ${originalDate.toLocaleTimeString()}`;

    if (!isCancellation && newDate) {
      content += `\n**New Date:** ${newDate.toLocaleDateString()} ${newDate.toLocaleTimeString()}`;
    }

    content += `\n**Reason:** ${reason}`;

    if (!isCancellation) {
      content += '\n\nPlease update your calendars accordingly.';
    }

    await this.sendBroadcast(playerIds, content, {
      type: MessageType.ANNOUNCEMENT,
      metadata: {
        announcement_type: CoachAnnouncementType.SCHEDULE_CHANGE,
        team_id: teamId,
        priority: 'urgent',
        is_cancellation: isCancellation,
      },
    });

    this.logActivity('schedule_change_sent', { teamId, eventType, action });
  }

  /**
   * Send performance milestone notification
   */
  public async sendPerformanceMilestone(
    playerId: string,
    milestone: {
      type: string;
      achievement: string;
      stats?: Record<string, any>;
      teamId: string;
    }
  ): Promise<void> {
    const { type, achievement, stats, teamId } = milestone;

    let content = `🌟 Congratulations on Your Achievement!

**${type}:** ${achievement}`;

    if (stats) {
      content += '\n\n**Stats:**';
      Object.entries(stats).forEach(([key, value]) => {
        content += `\n• ${key}: ${value}`;
      });
    }

    content += '\n\nKeep up the excellent work! Your dedication and hard work are paying off. 🏆';

    await this.sendDirectMessage(playerId, content, {
      type: MessageType.ANNOUNCEMENT,
      metadata: {
        announcement_type: CoachAnnouncementType.PERFORMANCE_MILESTONE,
        team_id: teamId,
        milestone_type: type,
      },
      actions: [
        {
          id: 'view_stats',
          type: 'button',
          label: 'View Full Stats',
          value: `/player/${playerId}/stats`,
          style: 'primary',
        },
      ],
    });

    this.logActivity('performance_milestone_sent', { playerId, type, achievement });
  }

  /**
   * Send team meeting announcement
   */
  public async sendTeamMeetingAnnouncement(
    teamId: string,
    playerIds: string[],
    meetingDetails: {
      date: Date;
      time: string;
      location: string;
      type: 'in-person' | 'virtual';
      agenda: string[];
      meetingLink?: string;
    }
  ): Promise<void> {
    const { date, time, location, type, agenda, meetingLink } = meetingDetails;

    let content = `📢 Team Meeting Announcement

**Date:** ${date.toLocaleDateString()}
**Time:** ${time}
**Type:** ${type === 'virtual' ? 'Virtual Meeting' : 'In-Person Meeting'}
**Location:** ${location}`;

    if (type === 'virtual' && meetingLink) {
      content += `\n**Meeting Link:** [Join Meeting](${meetingLink})`;
    }

    content += '\n\n**Agenda:**';
    agenda.forEach((item, index) => {
      content += `\n${index + 1}. ${item}`;
    });

    content += '\n\nYour attendance is important. Please be on time.';

    const actions: any[] = [
      {
        id: 'confirm_attendance',
        type: 'button',
        label: 'Confirm Attendance',
        value: 'meeting_attending',
        style: 'primary',
      },
    ];

    if (type === 'virtual' && meetingLink) {
      actions.push({
        id: 'join_meeting',
        type: 'link',
        label: 'Join Meeting',
        value: meetingLink,
        url: meetingLink,
        style: 'primary',
      });
    }

    await this.sendBroadcast(playerIds, content, {
      type: MessageType.ANNOUNCEMENT,
      metadata: {
        announcement_type: CoachAnnouncementType.TEAM_MEETING,
        team_id: teamId,
        meeting_type: type,
      },
      actions,
    });

    this.logActivity('team_meeting_announced', { teamId, type, playerCount: playerIds.length });
  }

  /**
   * Send lineup announcement
   */
  public async sendLineupAnnouncement(
    teamId: string,
    playerIds: string[],
    gameDetails: {
      opponent: string;
      date: Date;
      lineup: Array<{ position: string; playerName: string }>;
      scratches?: string[];
    }
  ): Promise<void> {
    const { opponent, date, lineup, scratches } = gameDetails;

    let content = `📋 Lineup for ${date.toLocaleDateString()} vs ${opponent}

**Starting Lineup:**`;

    lineup.forEach(({ position, playerName }) => {
      content += `\n${position}: ${playerName}`;
    });

    if (scratches && scratches.length > 0) {
      content += '\n\n**Scratches:**';
      scratches.forEach((player) => {
        content += `\n• ${player}`;
      });
    }

    content += '\n\nGive it your all out there! 🏒';

    await this.sendBroadcast(playerIds, content, {
      type: MessageType.ANNOUNCEMENT,
      metadata: {
        announcement_type: CoachAnnouncementType.LINEUP_ANNOUNCEMENT,
        team_id: teamId,
        game_date: date.toISOString(),
      },
    });

    this.logActivity('lineup_announced', { teamId, opponent });
  }

  /**
   * Send equipment reminder
   */
  public async sendEquipmentReminder(
    teamId: string,
    playerIds: string[],
    equipment: string[],
    reason: string
  ): Promise<void> {
    let content = `🏒 Equipment Reminder

Please ensure you have the following equipment for ${reason}:`;

    equipment.forEach((item) => {
      content += `\n• ${item}`;
    });

    content += '\n\nIf you\'re missing any equipment, please contact the equipment manager ASAP.';

    await this.sendBroadcast(playerIds, content, {
      type: MessageType.ANNOUNCEMENT,
      metadata: {
        announcement_type: CoachAnnouncementType.EQUIPMENT_REMINDER,
        team_id: teamId,
      },
      actions: [
        {
          id: 'contact_equipment_manager',
          type: 'button',
          label: 'Contact Equipment Manager',
          value: '/equipment-manager',
          style: 'primary',
        },
      ],
    });

    this.logActivity('equipment_reminder_sent', { teamId, reason });
  }

  /**
   * Handle attendance confirmation
   */
  private async handleAttendanceConfirmation(interaction: any): Promise<void> {
    const { userId, value } = interaction;
    const isAttending = value === 'attending' || value === 'meeting_attending';

    const responseContent = isAttending
      ? '✅ Thanks for confirming your attendance! See you there.'
      : '❌ Sorry to hear you can\'t make it. Please let your coach know the reason.';

    await this.sendDirectMessage(userId, responseContent, {
      isEphemeral: true,
    });

    this.logActivity('attendance_confirmed', { userId, attending: isAttending });
  }
}