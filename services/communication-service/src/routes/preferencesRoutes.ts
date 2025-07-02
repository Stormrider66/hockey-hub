import { Router, Request, Response } from 'express';
import { Logger } from '@hockey-hub/shared-lib';
import { validationMiddleware } from '@hockey-hub/shared-lib';
import { UnsubscribeService } from '../services/UnsubscribeService';
import { IsBoolean, IsOptional, IsArray, IsString, IsEnum } from 'class-validator';

const router = Router();
const logger = new Logger('PreferencesRoutes');

// DTOs for validation
class UpdatePreferencesDto {
  @IsOptional()
  email?: {
    @IsBoolean()
    enabled: boolean;
    
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    types?: string[];
    
    @IsEnum(['immediate', 'daily', 'weekly', 'never'])
    @IsOptional()
    frequency?: 'immediate' | 'daily' | 'weekly' | 'never';
  };

  @IsOptional()
  sms?: {
    @IsBoolean()
    enabled: boolean;
    
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    types?: string[];
  };

  @IsOptional()
  push?: {
    @IsBoolean()
    enabled: boolean;
    
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    types?: string[];
  };

  @IsOptional()
  inApp?: {
    @IsBoolean()
    enabled: boolean;
    
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    types?: string[];
  };
}

/**
 * Get user notification preferences
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const unsubscribeService = new UnsubscribeService();
    const preferences = await unsubscribeService.getUserPreferences(userId);

    if (!preferences) {
      return res.status(404).json({
        success: false,
        error: 'Preferences not found'
      });
    }

    res.json({
      success: true,
      preferences: {
        email: {
          enabled: preferences.email_enabled,
          types: preferences.preferences?.email?.types || ['all'],
          frequency: preferences.preferences?.email?.frequency || 'immediate',
          weeklyDigest: preferences.preferences?.email?.weekly_summary !== false
        },
        sms: {
          enabled: preferences.sms_enabled,
          types: preferences.preferences?.sms?.types || ['urgent']
        },
        push: {
          enabled: preferences.push_enabled,
          types: preferences.preferences?.push?.types || ['all']
        },
        inApp: {
          enabled: preferences.in_app_enabled,
          types: preferences.preferences?.in_app?.types || ['all']
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get preferences', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get preferences'
    });
  }
});

/**
 * Update user notification preferences
 */
router.put('/me',
  validationMiddleware(UpdatePreferencesDto),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const unsubscribeService = new UnsubscribeService();
      const updatedPreferences = await unsubscribeService.updateUserPreferences({
        userId,
        ...req.body
      });

      if (!updatedPreferences) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update preferences'
        });
      }

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: {
          email: {
            enabled: updatedPreferences.email_enabled,
            types: updatedPreferences.preferences?.email?.types || ['all'],
            frequency: updatedPreferences.preferences?.email?.frequency || 'immediate',
            weeklyDigest: updatedPreferences.preferences?.email?.weekly_summary !== false
          },
          sms: {
            enabled: updatedPreferences.sms_enabled,
            types: updatedPreferences.preferences?.sms?.types || ['urgent']
          },
          push: {
            enabled: updatedPreferences.push_enabled,
            types: updatedPreferences.preferences?.push?.types || ['all']
          },
          inApp: {
            enabled: updatedPreferences.in_app_enabled,
            types: updatedPreferences.preferences?.in_app?.types || ['all']
          }
        }
      });
    } catch (error) {
      logger.error('Failed to update preferences', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update preferences'
      });
    }
  }
);

/**
 * Get preference summary with unsubscribe tokens
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const unsubscribeService = new UnsubscribeService();
    const summary = await unsubscribeService.getPreferenceSummary(userId);

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    logger.error('Failed to get preference summary', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get preference summary'
    });
  }
});

/**
 * Quick disable all notifications
 */
router.post('/disable-all', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const unsubscribeService = new UnsubscribeService();
    const token = unsubscribeService.generateUnsubscribeToken(userId, 'all');
    const success = await unsubscribeService.processUnsubscribe(token);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to disable notifications'
      });
    }

    res.json({
      success: true,
      message: 'All notifications disabled successfully'
    });
  } catch (error) {
    logger.error('Failed to disable all notifications', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable notifications'
    });
  }
});

/**
 * Quick enable all notifications
 */
router.post('/enable-all', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const unsubscribeService = new UnsubscribeService();
    const updatedPreferences = await unsubscribeService.updateUserPreferences({
      userId,
      email: { enabled: true },
      sms: { enabled: true },
      push: { enabled: true },
      inApp: { enabled: true }
    });

    if (!updatedPreferences) {
      return res.status(500).json({
        success: false,
        error: 'Failed to enable notifications'
      });
    }

    res.json({
      success: true,
      message: 'All notifications enabled successfully'
    });
  } catch (error) {
    logger.error('Failed to enable all notifications', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable notifications'
    });
  }
});

/**
 * Get notification types
 */
router.get('/types', async (req: Request, res: Response) => {
  try {
    const notificationTypes = {
      email: [
        { value: 'all', label: 'All Notifications', description: 'Receive all email notifications' },
        { value: 'urgent', label: 'Urgent Only', description: 'Only critical and time-sensitive notifications' },
        { value: 'event_reminder', label: 'Event Reminders', description: 'Upcoming games, practices, and events' },
        { value: 'training', label: 'Training Updates', description: 'Training assignments and progress' },
        { value: 'medical', label: 'Medical Alerts', description: 'Medical appointments and health updates' },
        { value: 'payment', label: 'Payment Notifications', description: 'Payment due dates and confirmations' },
        { value: 'team_update', label: 'Team Updates', description: 'Team news and announcements' },
        { value: 'system', label: 'System Notifications', description: 'Account and security notifications' }
      ],
      sms: [
        { value: 'urgent', label: 'Urgent Only', description: 'Emergency and critical alerts' },
        { value: 'event_reminder', label: 'Event Reminders', description: 'Game and practice reminders' },
        { value: 'medical', label: 'Medical Alerts', description: 'Medical appointments only' },
        { value: 'payment', label: 'Payment Due', description: 'Payment reminder alerts' }
      ],
      push: [
        { value: 'all', label: 'All Notifications', description: 'All push notifications' },
        { value: 'urgent', label: 'Urgent Only', description: 'Critical alerts only' },
        { value: 'event_reminder', label: 'Event Updates', description: 'Schedule changes and reminders' },
        { value: 'messages', label: 'New Messages', description: 'Chat and message notifications' },
        { value: 'mentions', label: 'Mentions', description: 'When someone mentions you' }
      ],
      frequencies: [
        { value: 'immediate', label: 'Immediately', description: 'Get notified as soon as something happens' },
        { value: 'daily', label: 'Daily Digest', description: 'Receive a daily summary' },
        { value: 'weekly', label: 'Weekly Summary', description: 'Receive a weekly roundup' },
        { value: 'never', label: 'Never', description: 'Disable this type of notification' }
      ]
    };

    res.json({
      success: true,
      types: notificationTypes
    });
  } catch (error) {
    logger.error('Failed to get notification types', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification types'
    });
  }
});

export default router;