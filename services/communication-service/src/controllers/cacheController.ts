import { Request, Response } from 'express';
import { messageCacheService } from '../services/MessageCacheService';
import { Logger } from '@hockey-hub/shared-lib';

const logger = new Logger('cache-controller');

export class CacheController {
  /**
   * Get cache metrics
   */
  async getCacheMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await messageCacheService.getCacheMetrics();
      
      res.json({
        success: true,
        data: {
          metrics,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error getting cache metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get cache metrics',
      });
    }
  }

  /**
   * Clear all caches (admin only)
   */
  async clearCaches(req: Request, res: Response): Promise<void> {
    try {
      // This should be restricted to admin users only
      const user = (req as any).user;
      if (!user || user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
        return;
      }

      await messageCacheService.clearAllCaches();
      
      res.json({
        success: true,
        message: 'All caches cleared successfully',
      });
    } catch (error) {
      logger.error('Error clearing caches:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear caches',
      });
    }
  }

  /**
   * Warm cache for a conversation
   */
  async warmConversationCache(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const user = (req as any).user;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'Conversation ID is required',
        });
        return;
      }

      // Verify user has access to the conversation
      // This should be implemented with proper authorization check
      
      await messageCacheService.warmConversationCache(conversationId);
      
      res.json({
        success: true,
        message: `Cache warmed for conversation ${conversationId}`,
      });
    } catch (error) {
      logger.error('Error warming conversation cache:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to warm conversation cache',
      });
    }
  }

  /**
   * Warm cache for user conversations
   */
  async warmUserCache(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      await messageCacheService.warmUserConversationsCache(user.id);
      
      res.json({
        success: true,
        message: `Cache warmed for user ${user.id}`,
      });
    } catch (error) {
      logger.error('Error warming user cache:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to warm user cache',
      });
    }
  }
}

export const cacheController = new CacheController();