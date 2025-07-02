import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { BlockedUser, PrivacySettings, MessagePrivacy, OnlineVisibility } from '../entities';
import { Logger } from '@hockey-hub/shared-lib';

export class PrivacyService {
  private blockedUserRepo: Repository<BlockedUser>;
  private privacySettingsRepo: Repository<PrivacySettings>;
  private logger = Logger;

  constructor() {
    this.blockedUserRepo = AppDataSource.getRepository(BlockedUser);
    this.privacySettingsRepo = AppDataSource.getRepository(PrivacySettings);
  }

  async blockUser(blockerId: string, blockedUserId: string, reason?: string): Promise<BlockedUser> {
    try {
      // Check if already blocked
      const existing = await this.blockedUserRepo.findOne({
        where: { blockerId, blockedUserId }
      });

      if (existing) {
        throw new Error('User is already blocked');
      }

      // Prevent self-blocking
      if (blockerId === blockedUserId) {
        throw new Error('Cannot block yourself');
      }

      const blockedUser = this.blockedUserRepo.create({
        blockerId,
        blockedUserId,
        reason
      });

      await this.blockedUserRepo.save(blockedUser);

      this.logger.info('User blocked', { blockerId, blockedUserId });
      return blockedUser;
    } catch (error) {
      this.logger.error('Error blocking user', error);
      throw error;
    }
  }

  async unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
    try {
      const result = await this.blockedUserRepo.delete({
        blockerId,
        blockedUserId
      });

      if (result.affected === 0) {
        throw new Error('User is not blocked');
      }

      this.logger.info('User unblocked', { blockerId, blockedUserId });
    } catch (error) {
      this.logger.error('Error unblocking user', error);
      throw error;
    }
  }

  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    try {
      return await this.blockedUserRepo.find({
        where: { blockerId: userId },
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      this.logger.error('Error fetching blocked users', error);
      throw error;
    }
  }

  async getBlockedByUsers(userId: string): Promise<BlockedUser[]> {
    try {
      return await this.blockedUserRepo.find({
        where: { blockedUserId: userId }
      });
    } catch (error) {
      this.logger.error('Error fetching blocked by users', error);
      throw error;
    }
  }

  async isBlocked(blockerId: string, blockedUserId: string): Promise<boolean> {
    try {
      const count = await this.blockedUserRepo.count({
        where: { blockerId, blockedUserId }
      });
      return count > 0;
    } catch (error) {
      this.logger.error('Error checking if user is blocked', error);
      return false;
    }
  }

  async isBlockedBidirectional(userId1: string, userId2: string): Promise<boolean> {
    try {
      const count = await this.blockedUserRepo.count({
        where: [
          { blockerId: userId1, blockedUserId: userId2 },
          { blockerId: userId2, blockedUserId: userId1 }
        ]
      });
      return count > 0;
    } catch (error) {
      this.logger.error('Error checking bidirectional block', error);
      return false;
    }
  }

  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      let settings = await this.privacySettingsRepo.findOne({
        where: { userId }
      });

      if (!settings) {
        // Create default settings
        settings = this.privacySettingsRepo.create({
          userId,
          whoCanMessage: MessagePrivacy.EVERYONE,
          onlineVisibility: OnlineVisibility.EVERYONE,
          showReadReceipts: true,
          showTypingIndicators: true,
          showLastSeen: true,
          allowProfileViews: true,
          blockScreenshots: false
        });
        await this.privacySettingsRepo.save(settings);
      }

      return settings;
    } catch (error) {
      this.logger.error('Error fetching privacy settings', error);
      throw error;
    }
  }

  async updatePrivacySettings(
    userId: string,
    updates: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    try {
      let settings = await this.getPrivacySettings(userId);

      // Update settings
      Object.assign(settings, updates);
      settings = await this.privacySettingsRepo.save(settings);

      this.logger.info('Privacy settings updated', { userId });
      return settings;
    } catch (error) {
      this.logger.error('Error updating privacy settings', error);
      throw error;
    }
  }

  async canMessage(senderId: string, recipientId: string): Promise<boolean> {
    try {
      // Check if blocked
      if (await this.isBlockedBidirectional(senderId, recipientId)) {
        return false;
      }

      // Check recipient's privacy settings
      const settings = await this.getPrivacySettings(recipientId);

      switch (settings.whoCanMessage) {
        case MessagePrivacy.NO_ONE:
          return false;
        case MessagePrivacy.EVERYONE:
          return true;
        case MessagePrivacy.TEAM_ONLY:
          // TODO: Check if users are on the same team
          return true; // Placeholder
        case MessagePrivacy.CONTACTS_ONLY:
          // TODO: Check if users are contacts
          return true; // Placeholder
        default:
          return true;
      }
    } catch (error) {
      this.logger.error('Error checking message permission', error);
      return false;
    }
  }

  async canSeeOnlineStatus(viewerId: string, userId: string): Promise<boolean> {
    try {
      // Check if blocked
      if (await this.isBlockedBidirectional(viewerId, userId)) {
        return false;
      }

      // Check user's privacy settings
      const settings = await this.getPrivacySettings(userId);

      switch (settings.onlineVisibility) {
        case OnlineVisibility.NO_ONE:
          return false;
        case OnlineVisibility.EVERYONE:
          return true;
        case OnlineVisibility.TEAM_ONLY:
          // TODO: Check if users are on the same team
          return true; // Placeholder
        case OnlineVisibility.CONTACTS_ONLY:
          // TODO: Check if users are contacts
          return true; // Placeholder
        default:
          return true;
      }
    } catch (error) {
      this.logger.error('Error checking online visibility', error);
      return false;
    }
  }

  async cleanupExpiredBlocks(): Promise<void> {
    try {
      const result = await this.blockedUserRepo
        .createQueryBuilder()
        .delete()
        .where('expires_at IS NOT NULL AND expires_at < NOW()')
        .execute();

      if (result.affected && result.affected > 0) {
        this.logger.info(`Cleaned up ${result.affected} expired blocks`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up expired blocks', error);
    }
  }
}