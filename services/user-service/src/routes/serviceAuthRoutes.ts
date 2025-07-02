import { Router, Request, Response } from 'express';
import { serviceApiKeyService } from '../services/serviceApiKeyService';
import { extractUser, requireAuth, requirePermission } from '../middleware/authMiddleware';
import { parsePaginationParams, paginateArray } from '@hockey-hub/shared-lib';

const router = Router();

// Validate service API key
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    const validation = await serviceApiKeyService.validateApiKey(apiKey, ipAddress);

    if (!validation.valid) {
      return res.status(401).json({ error: validation.error });
    }

    res.json({
      valid: true,
      service: {
        name: validation.service!.serviceName,
        permissions: validation.service!.permissions
      }
    });
  } catch (error) {
    console.error('Service validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoints for managing service API keys
router.use(extractUser);
router.use(requireAuth);
router.use(requirePermission('admin.system'));

// List all API keys with pagination
router.get('/keys', async (req: Request, res: Response) => {
  try {
    // Parse pagination parameters
    const paginationParams = parsePaginationParams(req.query, {
      page: 1,
      limit: 20,
      maxLimit: 100
    });
    
    const includeInactive = req.query.includeInactive === 'true';
    const keys = await serviceApiKeyService.listApiKeys(includeInactive);

    // Don't expose the actual API keys in the list
    const sanitizedKeys = keys.map(key => ({
      id: key.id,
      serviceName: key.serviceName,
      description: key.description,
      permissions: key.permissions,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      usageCount: key.usageCount,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      revokedAt: key.revokedAt
    }));
    
    // Apply pagination to the results
    const result = paginateArray(sanitizedKeys, paginationParams);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new API key
router.post('/keys', async (req: Request, res: Response) => {
  try {
    const { serviceName, description, permissions, allowedIps, expiresAt } = req.body;

    if (!serviceName || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ 
        error: 'serviceName and permissions array are required' 
      });
    }

    const apiKey = await serviceApiKeyService.createApiKey({
      serviceName,
      description,
      permissions,
      allowedIps,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: req.user!.userId
    });

    res.status(201).json({
      id: apiKey.id,
      serviceName: apiKey.serviceName,
      apiKey: apiKey.apiKey, // Only return on creation
      permissions: apiKey.permissions,
      expiresAt: apiKey.expiresAt
    });
  } catch (error: any) {
    console.error('Create API key error:', error);
    if (error.message.includes('already has an active API key')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rotate API key
router.post('/keys/:serviceName/rotate', async (req: Request, res: Response) => {
  try {
    const { serviceName } = req.params;

    const newKey = await serviceApiKeyService.rotateApiKey(
      serviceName,
      req.user!.userId
    );

    res.json({
      id: newKey.id,
      serviceName: newKey.serviceName,
      apiKey: newKey.apiKey, // Only return on rotation
      permissions: newKey.permissions,
      expiresAt: newKey.expiresAt
    });
  } catch (error: any) {
    console.error('Rotate API key error:', error);
    if (error.message.includes('No active API key found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revoke API key
router.delete('/keys/:apiKeyId', async (req: Request, res: Response) => {
  try {
    const { apiKeyId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Revocation reason required' });
    }

    // Get the key first to find the actual apiKey value
    const keys = await serviceApiKeyService.listApiKeys(true);
    const key = keys.find(k => k.id === apiKeyId);

    if (!key) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await serviceApiKeyService.revokeApiKey(
      key.apiKey,
      req.user!.userId,
      reason
    );

    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get API key statistics
router.get('/keys/:serviceName/stats', async (req: Request, res: Response) => {
  try {
    const { serviceName } = req.params;
    const stats = await serviceApiKeyService.getApiKeyStats(serviceName);
    res.json(stats);
  } catch (error: any) {
    console.error('Get API key stats error:', error);
    if (error.message.includes('No active API key found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;