// @ts-nocheck - Encryption service for E2E messaging
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { UserEncryptionKey } from '../entities/UserEncryptionKey';
import { Logger } from '@hockey-hub/shared-lib';

export class EncryptionService {
  private userEncryptionKeyRepository: Repository<UserEncryptionKey>;
  private logger: Logger;

  constructor() {
    this.userEncryptionKeyRepository = AppDataSource.getRepository(UserEncryptionKey);
    this.logger = new Logger('EncryptionService');
  }

  /**
   * Store a user's public key
   */
  public async storePublicKey(
    userId: string,
    publicKey: string,
    algorithm: string = 'RSA-OAEP',
    keySize: number = 2048
  ): Promise<UserEncryptionKey> {
    try {
      // Check if user already has a key
      let existingKey = await this.userEncryptionKeyRepository.findOne({
        where: { userId }
      });

      if (existingKey) {
        // Update existing key
        existingKey.publicKey = publicKey;
        existingKey.algorithm = algorithm;
        existingKey.keySize = keySize;
        existingKey.keyVersion += 1;
        existingKey.isActive = true;
        existingKey.expiresAt = this.calculateExpirationDate();
        
        await this.userEncryptionKeyRepository.save(existingKey);
        this.logger.info(`Updated encryption key for user ${userId}, version ${existingKey.keyVersion}`);
        return existingKey;
      } else {
        // Create new key
        const newKey = this.userEncryptionKeyRepository.create({
          userId,
          publicKey,
          algorithm,
          keySize,
          keyVersion: 1,
          isActive: true,
          expiresAt: this.calculateExpirationDate()
        });

        await this.userEncryptionKeyRepository.save(newKey);
        this.logger.info(`Stored new encryption key for user ${userId}`);
        return newKey;
      }
    } catch (error) {
      this.logger.error('Failed to store public key:', error);
      throw error;
    }
  }

  /**
   * Get a user's public key
   */
  public async getPublicKey(userId: string): Promise<string | null> {
    try {
      const keyRecord = await this.userEncryptionKeyRepository.findOne({
        where: { 
          userId,
          isActive: true 
        }
      });

      if (!keyRecord) {
        this.logger.warn(`No active encryption key found for user ${userId}`);
        return null;
      }

      // Check if key is expired
      if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
        this.logger.warn(`Encryption key expired for user ${userId}`);
        // Mark as inactive
        await this.userEncryptionKeyRepository.update(keyRecord.id, { isActive: false });
        return null;
      }

      // Update last used timestamp
      await this.userEncryptionKeyRepository.update(keyRecord.id, {
        lastUsedAt: new Date()
      });

      return keyRecord.publicKey;
    } catch (error) {
      this.logger.error('Failed to get public key:', error);
      throw error;
    }
  }

  /**
   * Get public keys for multiple users
   */
  public async getPublicKeys(userIds: string[]): Promise<{ [userId: string]: string }> {
    try {
      const keyRecords = await this.userEncryptionKeyRepository.find({
        where: { 
          userId: { $in: userIds } as any,
          isActive: true 
        }
      });

      const result: { [userId: string]: string } = {};
      
      for (const keyRecord of keyRecords) {
        // Check if key is expired
        if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
          continue;
        }
        
        result[keyRecord.userId] = keyRecord.publicKey;
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to get public keys:', error);
      throw error;
    }
  }

  /**
   * Deactivate a user's encryption key
   */
  public async deactivateKey(userId: string): Promise<void> {
    try {
      await this.userEncryptionKeyRepository.update(
        { userId },
        { isActive: false }
      );
      
      this.logger.info(`Deactivated encryption key for user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to deactivate encryption key:', error);
      throw error;
    }
  }

  /**
   * Check if a conversation should use encryption
   */
  public async shouldEncryptConversation(conversationId: string): Promise<boolean> {
    try {
      // For now, only encrypt direct messages (1-on-1 conversations)
      // In the future, this could be configurable per conversation
      const conversationRepository = AppDataSource.getRepository('Conversation');
      const conversation = await conversationRepository.findOne({
        where: { id: conversationId },
        relations: ['participants']
      });

      if (!conversation) {
        return false;
      }

      // Only encrypt direct messages (exactly 2 participants)
      return conversation.type === 'direct' && conversation.participants?.length === 2;
    } catch (error) {
      this.logger.error('Failed to check if conversation should be encrypted:', error);
      return false;
    }
  }

  /**
   * Get encryption status for a conversation
   */
  public async getConversationEncryptionStatus(conversationId: string): Promise<{
    isEncrypted: boolean;
    participantsWithKeys: string[];
    participantsWithoutKeys: string[];
  }> {
    try {
      const conversationRepository = AppDataSource.getRepository('Conversation');
      const conversation = await conversationRepository.findOne({
        where: { id: conversationId },
        relations: ['participants']
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const participantIds = conversation.participants?.map(p => p.userId) || [];
      const publicKeys = await this.getPublicKeys(participantIds);

      const participantsWithKeys = Object.keys(publicKeys);
      const participantsWithoutKeys = participantIds.filter(id => !publicKeys[id]);

      const isEncrypted = this.shouldEncryptConversation(conversationId) && 
                         participantsWithoutKeys.length === 0;

      return {
        isEncrypted,
        participantsWithKeys,
        participantsWithoutKeys
      };
    } catch (error) {
      this.logger.error('Failed to get conversation encryption status:', error);
      throw error;
    }
  }

  /**
   * Clean up expired keys
   */
  public async cleanupExpiredKeys(): Promise<number> {
    try {
      const result = await this.userEncryptionKeyRepository.update(
        {
          expiresAt: { $lt: new Date() } as any,
          isActive: true
        },
        { isActive: false }
      );

      const deactivatedCount = result.affected || 0;
      this.logger.info(`Deactivated ${deactivatedCount} expired encryption keys`);
      return deactivatedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup expired keys:', error);
      throw error;
    }
  }

  /**
   * Get encryption statistics
   */
  public async getEncryptionStats(): Promise<{
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    keysByAlgorithm: { [algorithm: string]: number };
  }> {
    try {
      const allKeys = await this.userEncryptionKeyRepository.find();
      
      const stats = {
        totalKeys: allKeys.length,
        activeKeys: allKeys.filter(k => k.isActive).length,
        expiredKeys: allKeys.filter(k => k.expiresAt && k.expiresAt < new Date()).length,
        keysByAlgorithm: {} as { [algorithm: string]: number }
      };

      // Count by algorithm
      allKeys.forEach(key => {
        if (key.isActive) {
          stats.keysByAlgorithm[key.algorithm] = (stats.keysByAlgorithm[key.algorithm] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      this.logger.error('Failed to get encryption stats:', error);
      throw error;
    }
  }

  /**
   * Validate public key format
   */
  public validatePublicKey(publicKey: string, algorithm: string = 'RSA-OAEP'): boolean {
    try {
      // Basic validation - check if it's base64 encoded and has reasonable length
      if (!publicKey || typeof publicKey !== 'string') {
        return false;
      }

      // Check base64 format
      const base64Regex = /^[A-Za-z0-9+/]+=*$/;
      if (!base64Regex.test(publicKey)) {
        return false;
      }

      // Check length (RSA-2048 public keys are typically around 550-600 characters when base64 encoded)
      if (algorithm === 'RSA-OAEP' && (publicKey.length < 300 || publicKey.length > 1000)) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Failed to validate public key:', error);
      return false;
    }
  }

  /**
   * Calculate expiration date for keys (1 year from now)
   */
  private calculateExpirationDate(): Date {
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    return expirationDate;
  }
}

export default EncryptionService;