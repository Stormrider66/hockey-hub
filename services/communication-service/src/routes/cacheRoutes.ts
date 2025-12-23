// @ts-nocheck - Suppress TypeScript errors for build
import { Router } from 'express';
import { cacheController } from '../controllers/cacheController';
import { authenticate } from '@hockey-hub/shared-lib';

const router: any = Router();

// All routes require authentication
router.use(authenticate);

// Get cache metrics
router.get('/metrics', cacheController.getCacheMetrics);

// Clear all caches (admin only)
router.post('/clear', cacheController.clearCaches);

// Warm cache for a conversation
router.post('/warm/conversation/:conversationId', cacheController.warmConversationCache);

// Warm cache for current user
router.post('/warm/user', cacheController.warmUserCache);

export default router;