import { BaseBotService } from './BaseBotService';
import { BotType, BotPermission } from './BotUser';
import { MessageType } from '../entities';
import * as cron from 'node-cron';

export interface TrainingReminder {
  userId: string;
  sessionId: string;
  sessionType: 'strength' | 'cardio' | 'skills' | 'recovery';
  scheduledTime: Date;
  duration: number;
  location: string;
  equipment?: string[];
  focus?: string;
  notes?: string;
}

export interface WorkoutTip {
  category: string;
  tip: string;
  relatedTo?: string[];
}

export class TrainingReminderBot extends BaseBotService {
  private reminderJobs: Map<string, cron.ScheduledTask>;
  private workoutTips: WorkoutTip[];
  
  constructor() {
    super(BotType.TRAINING_REMINDER);
    this.reminderJobs = new Map();
    this.workoutTips = this.initializeWorkoutTips();
  }

  public async initialize(): Promise<void> {
    this.logger.info('Training Reminder Bot initialized');
    
    // Register interaction handlers
    this.registerInteractionHandler('confirm_session', async (interaction) => {
      await this.handleSessionConfirmation(interaction);
    });
    
    this.registerInteractionHandler('view_workout', async (interaction) => {
      await this.handleViewWorkout(interaction);
    });
    
    this.registerInteractionHandler('need_substitute', async (interaction) => {
      await this.handleSubstituteRequest(interaction);
    });
  }

  /**
   * Schedule a training reminder
   */
  public async scheduleTrainingReminder(reminder: TrainingReminder): Promise<void> {
    if (!this.hasPermission(BotPermission.CREATE_REMINDERS)) {
      throw new Error('Bot lacks permission to create reminders');
    }

    const { userId, sessionId, scheduledTime } = reminder;
    const jobId = `training_${userId}_${sessionId}`;

    // Cancel existing reminder if any
    this.cancelReminder(jobId);

    // Schedule reminders at different intervals
    const reminderTimes = [
      { offset: 24 * 60, type: 'day_before' },    // 24 hours before
      { offset: 2 * 60, type: 'two_hours' },      // 2 hours before
      { offset: 30, type: 'thirty_minutes' },     // 30 minutes before
    ];

    reminderTimes.forEach(({ offset, type }) => {
      const reminderTime = new Date(scheduledTime.getTime() - offset * 60 * 1000);
      
      if (reminderTime > new Date()) {
        // Schedule a one-time reminder
        const timeout = reminderTime.getTime() - Date.now();
        setTimeout(async () => {
          await this.sendTrainingReminder(reminder, type);
          // Remove from jobs map after execution
          this.reminderJobs.delete(`${jobId}_${type}`);
        }, timeout);
        
        // Store the timeout as a pseudo-task for cleanup
        const task = {
          stop: () => clearTimeout(timeout)
        } as cron.ScheduledTask;
        this.reminderJobs.set(`${jobId}_${type}`, task);
      }
    });

    this.logger.info(`Scheduled training reminders for session ${sessionId}`);
    this.logActivity('reminder_scheduled', { userId, sessionId });
  }

  /**
   * Send training reminder based on timing
   */
  private async sendTrainingReminder(
    reminder: TrainingReminder,
    reminderType: string
  ): Promise<void> {
    const { userId, sessionType, scheduledTime, duration, location, equipment, focus } = reminder;

    let content = '';
    let priority = 'normal';

    switch (reminderType) {
      case 'day_before':
        content = await this.createDayBeforeReminder(reminder);
        break;
      case 'two_hours':
        content = await this.createTwoHourReminder(reminder);
        priority = 'important';
        break;
      case 'thirty_minutes':
        content = await this.createThirtyMinuteReminder(reminder);
        priority = 'urgent';
        break;
    }

    // Add a relevant workout tip
    const tip = this.getRelevantTip(sessionType);
    if (tip) {
      content += `\n\n💡 **Tip:** ${tip.tip}`;
    }

    await this.sendDirectMessage(userId, content, {
      type: MessageType.ANNOUNCEMENT,
      metadata: {
        reminder_type: reminderType,
        session_id: reminder.sessionId,
        priority,
      },
      actions: [
        {
          id: 'confirm_session',
          type: 'button',
          label: '✅ Confirm Attendance',
          value: reminder.sessionId,
          style: 'primary',
        },
        {
          id: 'view_workout',
          type: 'button',
          label: '📋 View Workout',
          value: reminder.sessionId,
          style: 'secondary',
        },
      ],
    });

    this.logActivity('reminder_sent', { 
      userId, 
      sessionId: reminder.sessionId, 
      type: reminderType 
    });
  }

  /**
   * Create day-before reminder content
   */
  private async createDayBeforeReminder(reminder: TrainingReminder): Promise<string> {
    const { sessionType, scheduledTime, duration, location, equipment, focus } = reminder;
    const sessionEmoji = this.getSessionTypeEmoji(sessionType);

    let content = `${sessionEmoji} Training Reminder - Tomorrow\n\n`;
    content += `You have a **${sessionType}** session scheduled for tomorrow:\n\n`;
    content += `📅 **Date:** ${scheduledTime.toLocaleDateString()}\n`;
    content += `⏰ **Time:** ${scheduledTime.toLocaleTimeString()}\n`;
    content += `⏱️ **Duration:** ${duration} minutes\n`;
    content += `📍 **Location:** ${location}`;

    if (focus) {
      content += `\n🎯 **Focus:** ${focus}`;
    }

    if (equipment && equipment.length > 0) {
      content += '\n\n**Required Equipment:**';
      equipment.forEach(item => {
        content += `\n• ${item}`;
      });
    }

    content += '\n\nMake sure to get a good night\'s sleep and stay hydrated! 💧';

    return content;
  }

  /**
   * Create two-hour reminder content
   */
  private async createTwoHourReminder(reminder: TrainingReminder): Promise<string> {
    const { sessionType, scheduledTime, location } = reminder;
    const sessionEmoji = this.getSessionTypeEmoji(sessionType);

    let content = `${sessionEmoji} Training Starting Soon!\n\n`;
    content += `Your **${sessionType}** session starts in 2 hours.\n\n`;
    content += `⏰ **Time:** ${scheduledTime.toLocaleTimeString()}\n`;
    content += `📍 **Location:** ${location}\n\n`;
    content += `Start preparing:\n`;
    content += `• Have a light pre-workout meal\n`;
    content += `• Begin hydrating\n`;
    content += `• Gather your equipment\n`;
    content += `• Plan your travel time`;

    return content;
  }

  /**
   * Create thirty-minute reminder content
   */
  private async createThirtyMinuteReminder(reminder: TrainingReminder): Promise<string> {
    const { sessionType, location } = reminder;
    const sessionEmoji = this.getSessionTypeEmoji(sessionType);

    let content = `${sessionEmoji} Training Alert - 30 Minutes!\n\n`;
    content += `Your **${sessionType}** session starts in 30 minutes!\n\n`;
    content += `📍 **Location:** ${location}\n\n`;
    content += `Final checklist:\n`;
    content += `✓ Equipment ready\n`;
    content += `✓ Water bottle filled\n`;
    content += `✓ Appropriate clothing\n`;
    content += `✓ Leave for location now`;

    return content;
  }

  /**
   * Send recovery reminder after intense workout
   */
  public async sendRecoveryReminder(
    userId: string,
    sessionType: string,
    intensity: 'low' | 'moderate' | 'high'
  ): Promise<void> {
    const recoveryTips = this.getRecoveryTips(sessionType, intensity);
    
    let content = `🔄 Post-Workout Recovery Reminder\n\n`;
    content += `Great job completing your ${sessionType} session! Here's your recovery checklist:\n\n`;
    
    recoveryTips.forEach((tip, index) => {
      content += `${index + 1}. ${tip}\n`;
    });

    content += '\nRemember: Recovery is just as important as training! 💪';

    await this.sendDirectMessage(userId, content, {
      type: MessageType.TEXT,
      metadata: {
        reminder_type: 'recovery',
        session_type: sessionType,
      },
      actions: [
        {
          id: 'log_recovery',
          type: 'button',
          label: '📝 Log Recovery',
          value: '/wellness',
          style: 'primary',
        },
      ],
    });

    this.logActivity('recovery_reminder_sent', { userId, sessionType, intensity });
  }

  /**
   * Send equipment preparation reminder
   */
  public async sendEquipmentReminder(
    userId: string,
    equipment: string[],
    sessionTime: Date
  ): Promise<void> {
    let content = `🎒 Equipment Check Reminder\n\n`;
    content += `For your upcoming session at ${sessionTime.toLocaleTimeString()}, please ensure you have:\n\n`;
    
    equipment.forEach(item => {
      content += `☐ ${item}\n`;
    });

    content += '\nNeed to borrow equipment? Contact the equipment manager.';

    await this.sendDirectMessage(userId, content, {
      type: MessageType.TEXT,
      metadata: {
        reminder_type: 'equipment',
      },
      actions: [
        {
          id: 'contact_equipment',
          type: 'button',
          label: '📧 Contact Equipment Manager',
          value: '/equipment-manager',
          style: 'secondary',
        },
      ],
    });

    this.logActivity('equipment_reminder_sent', { userId, equipmentCount: equipment.length });
  }

  /**
   * Send performance milestone notification
   */
  public async sendPerformanceMilestone(
    userId: string,
    milestone: {
      type: string;
      achievement: string;
      improvement: string;
      nextGoal?: string;
    }
  ): Promise<void> {
    const { type, achievement, improvement, nextGoal } = milestone;

    let content = `🏆 Performance Milestone Achieved!\n\n`;
    content += `Congratulations! You've reached a new milestone:\n\n`;
    content += `**${type}:** ${achievement}\n`;
    content += `**Improvement:** ${improvement}\n`;

    if (nextGoal) {
      content += `\n**Next Goal:** ${nextGoal}`;
    }

    content += '\n\nKeep up the excellent work! Your dedication is paying off. 💪';

    await this.sendDirectMessage(userId, content, {
      type: MessageType.ANNOUNCEMENT,
      metadata: {
        milestone_type: type,
      },
      actions: [
        {
          id: 'view_progress',
          type: 'button',
          label: '📊 View Progress',
          value: '/progress',
          style: 'primary',
        },
        {
          id: 'share_achievement',
          type: 'button',
          label: '🎉 Share Achievement',
          value: 'share',
          style: 'secondary',
        },
      ],
    });

    this.logActivity('milestone_sent', { userId, type, achievement });
  }

  /**
   * Handle session confirmation
   */
  private async handleSessionConfirmation(interaction: any): Promise<void> {
    const { userId, value: sessionId } = interaction;

    await this.sendDirectMessage(
      userId,
      '✅ Great! Your attendance has been confirmed. See you at the session! 💪',
      {
        isEphemeral: true,
      }
    );

    this.logActivity('session_confirmed', { userId, sessionId });
  }

  /**
   * Handle view workout request
   */
  private async handleViewWorkout(interaction: any): Promise<void> {
    const { userId, value: sessionId } = interaction;

    // In a real implementation, this would fetch workout details
    await this.sendDirectMessage(
      userId,
      'Opening your workout details...',
      {
        isEphemeral: true,
        metadata: {
          redirect_to: `/workout/${sessionId}`,
        },
      }
    );

    this.logActivity('workout_viewed', { userId, sessionId });
  }

  /**
   * Handle substitute workout request
   */
  private async handleSubstituteRequest(interaction: any): Promise<void> {
    const { userId, value: sessionType } = interaction;

    const substitutes = this.getSubstituteWorkouts(sessionType);
    
    let content = '🔄 Alternative Workout Options:\n\n';
    substitutes.forEach((workout, index) => {
      content += `${index + 1}. **${workout.name}**\n`;
      content += `   Duration: ${workout.duration} min | Equipment: ${workout.equipment}\n\n`;
    });

    await this.sendDirectMessage(userId, content, {
      isEphemeral: true,
    });

    this.logActivity('substitute_requested', { userId, sessionType });
  }

  /**
   * Get session type emoji
   */
  private getSessionTypeEmoji(sessionType: string): string {
    const emojis: Record<string, string> = {
      strength: '🏋️',
      cardio: '🏃',
      skills: '🎯',
      recovery: '🧘',
    };
    return emojis[sessionType] || '💪';
  }

  /**
   * Get relevant workout tip
   */
  private getRelevantTip(sessionType: string): WorkoutTip | undefined {
    const relevantTips = this.workoutTips.filter(
      tip => !tip.relatedTo || tip.relatedTo.includes(sessionType)
    );
    
    if (relevantTips.length === 0) return undefined;
    
    // Return random relevant tip
    return relevantTips[Math.floor(Math.random() * relevantTips.length)];
  }

  /**
   * Get recovery tips based on session type and intensity
   */
  private getRecoveryTips(sessionType: string, intensity: string): string[] {
    const baseTips = [
      '💧 Hydrate: Drink at least 500ml of water',
      '🥗 Nutrition: Consume protein within 30 minutes',
      '🧊 Cool down: 5-10 minutes of light stretching',
    ];

    if (intensity === 'high') {
      baseTips.push(
        '❄️ Ice bath or cold shower for 10-15 minutes',
        '😴 Get 8+ hours of sleep tonight',
        '🙆 Consider foam rolling or massage'
      );
    }

    if (sessionType === 'strength') {
      baseTips.push('🥛 Consume 20-30g of protein');
    } else if (sessionType === 'cardio') {
      baseTips.push('🍌 Replenish electrolytes and carbohydrates');
    }

    return baseTips;
  }

  /**
   * Get substitute workout options
   */
  private getSubstituteWorkouts(sessionType: string): any[] {
    const workouts: Record<string, any[]> = {
      strength: [
        { name: 'Bodyweight Circuit', duration: 30, equipment: 'None' },
        { name: 'Resistance Band Workout', duration: 45, equipment: 'Bands' },
        { name: 'Dumbbell Full Body', duration: 40, equipment: 'Dumbbells' },
      ],
      cardio: [
        { name: 'HIIT Intervals', duration: 20, equipment: 'None' },
        { name: 'Steady State Run', duration: 30, equipment: 'None' },
        { name: 'Bike Intervals', duration: 25, equipment: 'Bike' },
      ],
      skills: [
        { name: 'Stickhandling Drills', duration: 30, equipment: 'Stick & Puck' },
        { name: 'Shooting Practice', duration: 45, equipment: 'Net & Pucks' },
        { name: 'Agility Ladder', duration: 20, equipment: 'Ladder or Cones' },
      ],
    };

    return workouts[sessionType] || workouts.skills;
  }

  /**
   * Initialize workout tips database
   */
  private initializeWorkoutTips(): WorkoutTip[] {
    return [
      // General tips
      {
        category: 'hydration',
        tip: 'Drink 16-20 oz of water 2 hours before exercise',
      },
      {
        category: 'warmup',
        tip: 'Always warm up for 5-10 minutes before intense exercise',
      },
      {
        category: 'form',
        tip: 'Focus on form over weight - quality beats quantity',
      },
      
      // Strength specific
      {
        category: 'strength',
        tip: 'Control the eccentric (lowering) portion of each rep',
        relatedTo: ['strength'],
      },
      {
        category: 'strength',
        tip: 'Rest 2-3 minutes between heavy compound sets',
        relatedTo: ['strength'],
      },
      
      // Cardio specific
      {
        category: 'cardio',
        tip: 'Maintain a conversational pace for endurance work',
        relatedTo: ['cardio'],
      },
      {
        category: 'cardio',
        tip: 'Include both steady-state and interval training',
        relatedTo: ['cardio'],
      },
      
      // Skills specific
      {
        category: 'skills',
        tip: 'Practice skills when fresh, not fatigued',
        relatedTo: ['skills'],
      },
      {
        category: 'skills',
        tip: 'Film yourself to analyze technique',
        relatedTo: ['skills'],
      },
      
      // Recovery specific
      {
        category: 'recovery',
        tip: 'Active recovery is better than complete rest',
        relatedTo: ['recovery'],
      },
      {
        category: 'recovery',
        tip: 'Prioritize sleep - aim for 7-9 hours',
        relatedTo: ['recovery'],
      },
    ];
  }


  /**
   * Cancel a reminder
   */
  public cancelReminder(jobId: string): void {
    const jobKeys = Array.from(this.reminderJobs.keys()).filter(key => key.startsWith(jobId));
    
    jobKeys.forEach(key => {
      const job = this.reminderJobs.get(key);
      if (job) {
        job.stop();
        this.reminderJobs.delete(key);
      }
    });

    this.logger.info(`Cancelled reminders for ${jobId}`);
  }

  /**
   * Shutdown all reminder jobs
   */
  public shutdown(): void {
    this.reminderJobs.forEach((task, key) => {
      if (task && typeof task.stop === 'function') {
        task.stop();
      }
    });
    this.reminderJobs.clear();
    this.logger.info('All reminder jobs stopped');
  }
}