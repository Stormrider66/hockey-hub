// @ts-nocheck - Unsubscribe service with complex notification preferences
import { Logger } from '@hockey-hub/shared-lib';
import { getRepository } from 'typeorm';
import { NotificationPreference } from '../entities';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface UnsubscribeToken {
  userId: string;
  type: string;
  timestamp: number;
}

export interface PreferenceUpdate {
  userId: string;
  email?: {
    enabled: boolean;
    types?: string[];
    frequency?: 'immediate' | 'daily' | 'weekly' | 'never';
  };
  sms?: {
    enabled: boolean;
    types?: string[];
  };
  push?: {
    enabled: boolean;
    types?: string[];
  };
  inApp?: {
    enabled: boolean;
    types?: string[];
  };
}

export class UnsubscribeService {
  private logger: Logger;
  private secretKey: string;

  constructor() {
    this.logger = new Logger('UnsubscribeService');
    this.secretKey = process.env.UNSUBSCRIBE_SECRET || 'default-secret-key';
  }

  /**
   * Generate unsubscribe token
   */
  generateUnsubscribeToken(userId: string, type: string = 'all'): string {
    try {
      const tokenData: UnsubscribeToken = {
        userId,
        type,
        timestamp: Date.now()
      };

      return jwt.sign(tokenData, this.secretKey, {
        expiresIn: '30d' // Token valid for 30 days
      });
    } catch (error) {
      this.logger.error('Failed to generate unsubscribe token', error);
      throw error;
    }
  }

  /**
   * Verify unsubscribe token
   */
  verifyUnsubscribeToken(token: string): UnsubscribeToken | null {
    try {
      const decoded = jwt.verify(token, this.secretKey) as UnsubscribeToken;
      return decoded;
    } catch (error) {
      this.logger.error('Failed to verify unsubscribe token', error);
      return null;
    }
  }

  /**
   * Process unsubscribe request
   */
  async processUnsubscribe(token: string): Promise<boolean> {
    try {
      const tokenData = this.verifyUnsubscribeToken(token);
      
      if (!tokenData) {
        throw new Error('Invalid or expired token');
      }

      const { userId, type } = tokenData;
      const preferenceRepository = getRepository(NotificationPreference);

      // Find user preferences
      let preferences = await preferenceRepository.findOne({
        where: { user_id: userId }
      });

      if (!preferences) {
        // Create new preferences with everything disabled
        preferences = preferenceRepository.create({
          user_id: userId,
          email_enabled: false,
          sms_enabled: false,
          push_enabled: false,
          in_app_enabled: true, // Keep in-app enabled
          preferences: {
            email: { enabled: false },
            sms: { enabled: false },
            push: { enabled: false },
            in_app: { enabled: true }
          }
        });
      } else {
        // Update based on unsubscribe type
        if (type === 'all') {
          preferences.email_enabled = false;
          preferences.sms_enabled = false;
          preferences.push_enabled = false;
        } else if (type === 'email') {
          preferences.email_enabled = false;
        } else if (type === 'sms') {
          preferences.sms_enabled = false;
        } else if (type === 'push') {
          preferences.push_enabled = false;
        } else if (type === 'weekly-summary') {
          // Disable weekly summary emails
          if (!preferences.preferences) {
            preferences.preferences = {};
          }
          preferences.preferences.email = {
            ...preferences.preferences.email,
            weekly_summary: false
          };
        }
      }

      await preferenceRepository.save(preferences);

      this.logger.info('User unsubscribed', { userId, type });
      return true;
    } catch (error) {
      this.logger.error('Failed to process unsubscribe', error);
      return false;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreference | null> {
    try {
      const preferenceRepository = getRepository(NotificationPreference);
      
      let preferences = await preferenceRepository.findOne({
        where: { user_id: userId }
      });

      if (!preferences) {
        // Create default preferences
        preferences = preferenceRepository.create({
          user_id: userId,
          email_enabled: true,
          sms_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          preferences: {
            email: {
              enabled: true,
              types: ['all'],
              frequency: 'immediate',
              weekly_summary: true
            },
            sms: {
              enabled: true,
              types: ['urgent', 'medical', 'payment']
            },
            push: {
              enabled: true,
              types: ['all']
            },
            in_app: {
              enabled: true,
              types: ['all']
            }
          }
        });

        await preferenceRepository.save(preferences);
      }

      return preferences;
    } catch (error) {
      this.logger.error('Failed to get user preferences', error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(update: PreferenceUpdate): Promise<NotificationPreference | null> {
    try {
      const preferenceRepository = getRepository(NotificationPreference);
      
      let preferences = await this.getUserPreferences(update.userId);
      
      if (!preferences) {
        return null;
      }

      // Update channel preferences
      if (update.email !== undefined) {
        preferences.email_enabled = update.email.enabled;
        if (!preferences.preferences) preferences.preferences = {};
        preferences.preferences.email = {
          ...preferences.preferences.email,
          ...update.email
        };
      }

      if (update.sms !== undefined) {
        preferences.sms_enabled = update.sms.enabled;
        if (!preferences.preferences) preferences.preferences = {};
        preferences.preferences.sms = {
          ...preferences.preferences.sms,
          ...update.sms
        };
      }

      if (update.push !== undefined) {
        preferences.push_enabled = update.push.enabled;
        if (!preferences.preferences) preferences.preferences = {};
        preferences.preferences.push = {
          ...preferences.preferences.push,
          ...update.push
        };
      }

      if (update.inApp !== undefined) {
        preferences.in_app_enabled = update.inApp.enabled;
        if (!preferences.preferences) preferences.preferences = {};
        preferences.preferences.in_app = {
          ...preferences.preferences.in_app,
          ...update.inApp
        };
      }

      await preferenceRepository.save(preferences);

      this.logger.info('User preferences updated', { userId: update.userId });
      return preferences;
    } catch (error) {
      this.logger.error('Failed to update user preferences', error);
      return null;
    }
  }

  /**
   * Check if user should receive notification
   */
  async shouldSendNotification(
    userId: string,
    channel: 'email' | 'sms' | 'push' | 'in_app',
    type: string
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences) {
        return true; // Default to sending if no preferences
      }

      // Check if channel is enabled
      const channelEnabled = {
        email: preferences.email_enabled,
        sms: preferences.sms_enabled,
        push: preferences.push_enabled,
        in_app: preferences.in_app_enabled
      }[channel];

      if (!channelEnabled) {
        return false;
      }

      // Check type preferences
      const channelPrefs = preferences.preferences?.[channel];
      if (channelPrefs?.types) {
        if (channelPrefs.types.includes('all')) {
          return true;
        }
        return channelPrefs.types.includes(type);
      }

      return true; // Default to sending if no type restrictions
    } catch (error) {
      this.logger.error('Failed to check notification preferences', error);
      return true; // Default to sending on error
    }
  }

  /**
   * Get notification frequency preference
   */
  async getNotificationFrequency(
    userId: string,
    channel: 'email' | 'sms'
  ): Promise<'immediate' | 'daily' | 'weekly' | 'never'> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences) {
        return 'immediate';
      }

      const frequency = preferences.preferences?.[channel]?.frequency;
      return frequency || 'immediate';
    } catch (error) {
      this.logger.error('Failed to get notification frequency', error);
      return 'immediate';
    }
  }

  /**
   * Create preference summary for UI
   */
  async getPreferenceSummary(userId: string): Promise<{
    channels: {
      email: boolean;
      sms: boolean;
      push: boolean;
      inApp: boolean;
    };
    emailFrequency: string;
    emailTypes: string[];
    smsTypes: string[];
    pushTypes: string[];
    weeklyDigest: boolean;
    unsubscribeTokens: {
      all: string;
      email: string;
      sms: string;
      push: string;
      weeklyDigest: string;
    };
  }> {
    const preferences = await this.getUserPreferences(userId);
    
    return {
      channels: {
        email: preferences?.email_enabled || false,
        sms: preferences?.sms_enabled || false,
        push: preferences?.push_enabled || false,
        inApp: preferences?.in_app_enabled || true
      },
      emailFrequency: preferences?.preferences?.email?.frequency || 'immediate',
      emailTypes: preferences?.preferences?.email?.types || ['all'],
      smsTypes: preferences?.preferences?.sms?.types || ['urgent'],
      pushTypes: preferences?.preferences?.push?.types || ['all'],
      weeklyDigest: preferences?.preferences?.email?.weekly_summary || true,
      unsubscribeTokens: {
        all: this.generateUnsubscribeToken(userId, 'all'),
        email: this.generateUnsubscribeToken(userId, 'email'),
        sms: this.generateUnsubscribeToken(userId, 'sms'),
        push: this.generateUnsubscribeToken(userId, 'push'),
        weeklyDigest: this.generateUnsubscribeToken(userId, 'weekly-summary')
      }
    };
  }
}