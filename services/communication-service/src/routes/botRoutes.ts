import { Router, Request, Response } from 'express';
import { authenticateUser, authenticateServiceClient } from '@hockey-hub/shared-lib';
import { botManager } from '../bots/BotManager';
import { BotType, BOT_USERS } from '../bots/BotUser';
import { Logger } from '@hockey-hub/shared-lib';

const router = Router();
const logger = new Logger('BotRoutes');

/**
 * Get all bot configurations
 */
router.get('/bots', authenticateUser, async (req: Request, res: Response) => {
  try {
    const bots = botManager.getAllBotUsers();
    res.json({ bots });
  } catch (error) {
    logger.error('Failed to get bot configurations:', error);
    res.status(500).json({ error: 'Failed to get bot configurations' });
  }
});

/**
 * Update bot configuration (admin only)
 */
router.put('/bots/:botType', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { botType } = req.params;
    const { isActive } = req.body;

    // Check if user is admin
    const userRoles = (req as any).user?.roles || [];
    if (!userRoles.includes('admin') && !userRoles.includes('club_admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Update bot configuration
    const bot = BOT_USERS[botType as BotType];
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    bot.isActive = isActive;
    res.json({ bot });
  } catch (error) {
    logger.error('Failed to update bot configuration:', error);
    res.status(500).json({ error: 'Failed to update bot configuration' });
  }
});

/**
 * Handle bot interaction
 */
router.post('/bots/:botType/interact', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { botType } = req.params;
    const { actionId, value, messageId } = req.body;
    const userId = (req as any).user?.id;

    await botManager.handleBotInteraction(botType as BotType, {
      userId,
      actionId,
      value,
      messageId,
      timestamp: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to handle bot interaction:', error);
    res.status(500).json({ error: 'Failed to handle bot interaction' });
  }
});

/**
 * Send system notification (service client only)
 */
router.post('/bots/system/notify', authenticateServiceClient, async (req: Request, res: Response) => {
  try {
    const { type, userId, data } = req.body;
    const systemBot = botManager.getSystemBot();

    switch (type) {
      case 'welcome':
        await systemBot.sendWelcomeMessage(userId, data.userName);
        break;
      case 'password_reset':
        await systemBot.sendPasswordResetNotification(userId, data.resetToken, data.expiryMinutes);
        break;
      case 'email_verification':
        await systemBot.sendEmailVerificationNotification(userId, data.verificationToken);
        break;
      case 'security_alert':
        await systemBot.sendSecurityAlert(userId, data.alertType, data.details);
        break;
      case 'account_locked':
        await systemBot.sendAccountLockedNotification(userId, data.reason, data.unlockInstructions);
        break;
      default:
        return res.status(400).json({ error: 'Invalid notification type' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to send system notification:', error);
    res.status(500).json({ error: 'Failed to send system notification' });
  }
});

/**
 * Schedule training reminder (service client only)
 */
router.post('/bots/training/reminder', authenticateServiceClient, async (req: Request, res: Response) => {
  try {
    const reminder = req.body;
    const trainingBot = botManager.getTrainingReminderBot();
    
    await trainingBot.scheduleTrainingReminder(reminder);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to schedule training reminder:', error);
    res.status(500).json({ error: 'Failed to schedule training reminder' });
  }
});

/**
 * Schedule medical appointment reminder (service client only)
 */
router.post('/bots/medical/appointment', authenticateServiceClient, async (req: Request, res: Response) => {
  try {
    const appointment = req.body;
    const medicalBot = botManager.getMedicalAppointmentBot();
    
    await medicalBot.scheduleAppointmentReminders(appointment);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to schedule appointment reminder:', error);
    res.status(500).json({ error: 'Failed to schedule appointment reminder' });
  }
});

/**
 * Schedule medication reminder (service client only)
 */
router.post('/bots/medical/medication', authenticateServiceClient, async (req: Request, res: Response) => {
  try {
    const reminder = req.body;
    const medicalBot = botManager.getMedicalAppointmentBot();
    
    await medicalBot.scheduleMedicationReminder(reminder);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to schedule medication reminder:', error);
    res.status(500).json({ error: 'Failed to schedule medication reminder' });
  }
});

/**
 * Send team announcement (service client only)
 */
router.post('/bots/coach/announce', authenticateServiceClient, async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    const coachBot = botManager.getCoachBot();

    switch (type) {
      case 'practice_reminder':
        await coachBot.sendPracticeReminder(data.teamId, data.playerIds, data.practiceDetails);
        break;
      case 'game_day':
        await coachBot.sendGameDayNotification(data.teamId, data.playerIds, data.gameDetails);
        break;
      case 'schedule_change':
        await coachBot.sendScheduleChangeNotification(data.teamId, data.playerIds, data.changeDetails);
        break;
      case 'team_meeting':
        await coachBot.sendTeamMeetingAnnouncement(data.teamId, data.playerIds, data.meetingDetails);
        break;
      default:
        return res.status(400).json({ error: 'Invalid announcement type' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to send team announcement:', error);
    res.status(500).json({ error: 'Failed to send team announcement' });
  }
});

/**
 * Process FAQ question
 */
router.post('/bots/faq/ask', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { question, conversationId } = req.body;
    const userId = (req as any).user?.id;
    const faqBot = botManager.getFAQBot();

    await faqBot.answerQuestion(userId, question, conversationId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to process FAQ question:', error);
    res.status(500).json({ error: 'Failed to process FAQ question' });
  }
});

/**
 * Get bot activity (admin only)
 */
router.get('/bots/activity', authenticateUser, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const userRoles = (req as any).user?.roles || [];
    if (!userRoles.includes('admin') && !userRoles.includes('club_admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // In a real implementation, this would fetch from a database
    const mockActivity = {
      activities: [
        {
          id: '1',
          botName: 'System Bot',
          botType: 'system',
          action: 'welcome_message_sent',
          userId: 'user1',
          userName: 'John Doe',
          timestamp: new Date(),
        },
        {
          id: '2',
          botName: 'FAQ Bot',
          botType: 'faq',
          action: 'question_answered',
          userId: 'user2',
          userName: 'Jane Smith',
          timestamp: new Date(),
        },
      ],
      stats: [
        {
          botName: 'System Bot',
          botType: 'system',
          messagesPerDay: [45, 52, 48, 61, 55, 49, 58],
          totalMessages: 368,
          activeUsers: 142,
          averageResponseTime: 0.8,
          satisfactionRate: 95,
        },
        {
          botName: 'FAQ Bot',
          botType: 'faq',
          messagesPerDay: [125, 138, 142, 156, 148, 139, 151],
          totalMessages: 999,
          activeUsers: 287,
          averageResponseTime: 1.2,
          satisfactionRate: 88,
        },
        {
          botName: 'Training Assistant',
          botType: 'training_reminder',
          messagesPerDay: [88, 92, 95, 101, 98, 91, 96],
          totalMessages: 661,
          activeUsers: 198,
          averageResponseTime: 0.5,
          satisfactionRate: 92,
        },
      ],
    };

    res.json(mockActivity);
  } catch (error) {
    logger.error('Failed to get bot activity:', error);
    res.status(500).json({ error: 'Failed to get bot activity' });
  }
});

export default router;