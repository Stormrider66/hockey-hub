import { In, LessThan, MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Message } from '../entities/Message';
import { MessageAttachment } from '../entities/MessageAttachment';
import { Conversation } from '../entities/Conversation';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';
import { format } from 'date-fns';
import { Logger } from '@hockey-hub/shared-lib';
import * as crypto from 'crypto';

export interface RetentionPolicy {
  messageRetentionDays: number;
  fileRetentionDays: number;
  auditLogRetentionDays: number;
  autoDelete: boolean;
  encryptionEnabled: boolean;
}

export interface DataExportRequest {
  userId: string;
  includeMessages: boolean;
  includeFiles: boolean;
  includeMetadata: boolean;
  format: 'json' | 'csv';
  encryptExport: boolean;
}

export class DataRetentionService {
  private logger = new Logger('DataRetentionService');

  async applyRetentionPolicy(policy: RetentionPolicy): Promise<void> {
    if (!policy.autoDelete) {
      this.logger.info('Auto-delete is disabled, skipping retention policy');
      return;
    }

    try {
      // Delete old messages
      if (policy.messageRetentionDays > 0) {
        const messageDeleteDate = new Date();
        messageDeleteDate.setDate(messageDeleteDate.getDate() - policy.messageRetentionDays);
        
        const deletedMessages = await AppDataSource.getRepository(Message)
          .createQueryBuilder()
          .delete()
          .from(Message)
          .where('createdAt < :date', { date: messageDeleteDate })
          .andWhere('isPinned = :isPinned', { isPinned: false })
          .execute();
        
        this.logger.info(`Deleted ${deletedMessages.affected} messages older than ${policy.messageRetentionDays} days`);
      }

      // Delete old files
      if (policy.fileRetentionDays > 0) {
        const fileDeleteDate = new Date();
        fileDeleteDate.setDate(fileDeleteDate.getDate() - policy.fileRetentionDays);
        
        const attachments = await AppDataSource.getRepository(MessageAttachment)
          .find({
            where: {
              createdAt: LessThan(fileDeleteDate)
            }
          });

        // Delete files from storage first
        for (const attachment of attachments) {
          await this.deleteFileFromStorage(attachment.fileUrl);
        }

        // Delete database records
        const deletedFiles = await AppDataSource.getRepository(MessageAttachment)
          .delete({
            createdAt: LessThan(fileDeleteDate)
          });
        
        this.logger.info(`Deleted ${deletedFiles.affected} files older than ${policy.fileRetentionDays} days`);
      }

      // Clean up empty conversations
      await this.cleanupEmptyConversations();

    } catch (error) {
      this.logger.error('Failed to apply retention policy', error);
      throw error;
    }
  }

  async exportUserData(request: DataExportRequest): Promise<string> {
    const exportId = crypto.randomBytes(16).toString('hex');
    const exportPath = `/tmp/exports/${exportId}`;
    
    try {
      // Create export directory
      await this.createExportDirectory(exportPath);

      // Fetch user data
      const userData = await this.collectUserData(request.userId, request);

      // Format data based on request
      if (request.format === 'json') {
        await this.exportAsJson(exportPath, userData);
      } else {
        await this.exportAsCsv(exportPath, userData);
      }

      // Create archive
      const archivePath = `${exportPath}.zip`;
      await this.createArchive(exportPath, archivePath, request.encryptExport);

      // Schedule cleanup
      setTimeout(() => this.cleanupExport(exportPath, archivePath), 24 * 60 * 60 * 1000);

      return archivePath;
    } catch (error) {
      this.logger.error('Failed to export user data', error);
      throw error;
    }
  }

  async deleteAllUserData(userId: string): Promise<void> {
    try {
      // Start transaction
      await AppDataSource.transaction(async manager => {
        // Delete messages
        await manager.getRepository(Message)
          .createQueryBuilder()
          .delete()
          .from(Message)
          .where('senderId = :userId', { userId })
          .execute();

        // Delete conversation participants
        await manager.query(
          'DELETE FROM conversation_participants WHERE user_id = $1',
          [userId]
        );

        // Mark user as deleted (soft delete)
        await manager.query(
          'UPDATE users SET deleted_at = NOW() WHERE id = $1',
          [userId]
        );

        this.logger.info(`Deleted all data for user ${userId}`);
      });

      // Schedule hard delete after 30 days
      this.scheduleHardDelete(userId, 30);

    } catch (error) {
      this.logger.error('Failed to delete user data', error);
      throw error;
    }
  }

  async getDataRetentionStats(organizationId: string): Promise<{
    totalMessages: number;
    totalFiles: number;
    totalSize: string;
    oldestMessage: Date | null;
    messagesOlderThan30Days: number;
    messagesOlderThan90Days: number;
    messagesOlderThan365Days: number;
  }> {
    try {
      const messageRepo = AppDataSource.getRepository(Message);
      const attachmentRepo = AppDataSource.getRepository(MessageAttachment);

      // Get total counts
      const totalMessages = await messageRepo.count();
      const totalFiles = await attachmentRepo.count();

      // Get total file size
      const sizeResult = await attachmentRepo
        .createQueryBuilder('attachment')
        .select('SUM(attachment.fileSize)', 'totalSize')
        .getRawOne();
      
      const totalSize = this.formatBytes(sizeResult?.totalSize || 0);

      // Get oldest message
      const oldestMessage = await messageRepo
        .createQueryBuilder('message')
        .orderBy('message.createdAt', 'ASC')
        .getOne();

      // Get age distribution
      const now = new Date();
      const days30 = new Date(now);
      days30.setDate(days30.getDate() - 30);
      const days90 = new Date(now);
      days90.setDate(days90.getDate() - 90);
      const days365 = new Date(now);
      days365.setDate(days365.getDate() - 365);

      const messagesOlderThan30Days = await messageRepo.count({
        where: { createdAt: LessThan(days30) }
      });

      const messagesOlderThan90Days = await messageRepo.count({
        where: { createdAt: LessThan(days90) }
      });

      const messagesOlderThan365Days = await messageRepo.count({
        where: { createdAt: LessThan(days365) }
      });

      return {
        totalMessages,
        totalFiles,
        totalSize,
        oldestMessage: oldestMessage?.createdAt || null,
        messagesOlderThan30Days,
        messagesOlderThan90Days,
        messagesOlderThan365Days
      };
    } catch (error) {
      this.logger.error('Failed to get retention stats', error);
      throw error;
    }
  }

  private async collectUserData(userId: string, request: DataExportRequest): Promise<any> {
    const data: any = {
      exportDate: new Date().toISOString(),
      userId,
      data: {}
    };

    if (request.includeMessages) {
      const messages = await AppDataSource.getRepository(Message)
        .find({
          where: { senderId: userId },
          relations: ['attachments', 'reactions'],
          order: { createdAt: 'DESC' }
        });
      
      data.data.messages = messages;
    }

    if (request.includeFiles) {
      const attachments = await AppDataSource.getRepository(MessageAttachment)
        .createQueryBuilder('attachment')
        .innerJoin('attachment.message', 'message')
        .where('message.senderId = :userId', { userId })
        .getMany();
      
      data.data.files = attachments;
    }

    if (request.includeMetadata) {
      // Include user profile, settings, etc.
      data.data.metadata = {
        conversations: await this.getUserConversations(userId),
        settings: await this.getUserSettings(userId)
      };
    }

    return data;
  }

  private async exportAsJson(exportPath: string, data: any): Promise<void> {
    const filePath = `${exportPath}/data.json`;
    await pipeline(
      JSON.stringify(data, null, 2),
      createWriteStream(filePath)
    );
  }

  private async exportAsCsv(exportPath: string, data: any): Promise<void> {
    // Convert messages to CSV
    if (data.data.messages) {
      const csv = this.convertToCsv(data.data.messages);
      await pipeline(
        csv,
        createWriteStream(`${exportPath}/messages.csv`)
      );
    }

    // Convert other data to CSV as needed
  }

  private async createArchive(sourcePath: string, archivePath: string, encrypt: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(archivePath);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(sourcePath, false);
      archive.finalize();
    });
  }

  private async deleteFileFromStorage(fileUrl: string): Promise<void> {
    // Implement file deletion from S3 or local storage
    this.logger.info(`Deleting file: ${fileUrl}`);
  }

  private async cleanupEmptyConversations(): Promise<void> {
    // Remove conversations with no messages
    await AppDataSource.query(`
      DELETE FROM conversations
      WHERE id NOT IN (
        SELECT DISTINCT conversation_id FROM messages
      )
    `);
  }

  private async createExportDirectory(path: string): Promise<void> {
    // Create directory for export
  }

  private async cleanupExport(exportPath: string, archivePath: string): Promise<void> {
    // Clean up temporary files
  }

  private scheduleHardDelete(userId: string, days: number): void {
    // Schedule permanent deletion
    setTimeout(async () => {
      await AppDataSource.query(
        'DELETE FROM users WHERE id = $1 AND deleted_at IS NOT NULL',
        [userId]
      );
    }, days * 24 * 60 * 60 * 1000);
  }

  private async getUserConversations(userId: string): Promise<any[]> {
    return AppDataSource.query(`
      SELECT c.* FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = $1
    `, [userId]);
  }

  private async getUserSettings(userId: string): Promise<any> {
    // Fetch user settings
    return {};
  }

  private convertToCsv(data: any[]): string {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}