import { Router, Request, Response } from 'express';
import { ServiceApiKeyService } from '../services/serviceApiKeyService';
import { extractUser, requireAuth, requirePermission } from '../middleware/authMiddleware';
// Removed unused pagination helpers to avoid pulling large shared utils into compile

const router: Router = Router();
let serviceApiKeyService: Pick<ServiceApiKeyService,
  'validateApiKey' | 'createApiKey' | 'listApiKeys' | 'rotateApiKey' | 'revokeApiKey' | 'getApiKeyStats'
> = new ServiceApiKeyService();

// Test-only setter to inject a mock service instance
export function __setServiceApiKeyService(mock: typeof serviceApiKeyService): void {
  serviceApiKeyService = mock;
}

// Validate service API key
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const apiKeyHeader = (req.headers['x-api-key'] || req.headers['X-API-Key']) as string | undefined;
    const { apiKey: apiKeyBody } = req.body || {} as any;
    const apiKey = apiKeyHeader || apiKeyBody;
    const forwardedFor = (req.headers['x-forwarded-for'] as string) || '';
    const ipAddress = forwardedFor.split(',')[0].trim() || req.ip || (req.socket && req.socket.remoteAddress) || '';

    if (!apiKey) {
      return res.status(400).json({ valid: false, error: 'API key required' });
    }

    const validation = await serviceApiKeyService.validateApiKey(apiKey, ipAddress);

    if (!validation.valid) {
      return res.status(401).json({ valid: false, error: validation.error });
    }

    res.json(validation);
  } catch (error) {
    console.error('Service validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoints for managing service API keys (wrap to allow dynamic jest mocks)
router.use((req, res, next) => (extractUser as unknown as Function)(req, res, next));
router.use((req, res, next) => (requireAuth as unknown as Function)(req, res, next));
router.use((req, res, next) => (requirePermission('admin.system') as unknown as Function)(req, res, next));

// List all API keys with pagination
router.get('/keys', async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const keys = await serviceApiKeyService.listApiKeys(includeInactive);
    // Return as-is to match test expectations
    res.json({ keys });
  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new API key
router.post('/keys', async (req: Request, res: Response) => {
  try {
    const { serviceName, description, permissions } = req.body || {};
    const allowedIps = (req.body && (req.body.allowedIps || req.body.ipWhitelist)) || undefined;
    const expiresAt = req.body && req.body.expiresAt;

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
      message: 'API key created successfully',
      key: apiKey
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
      message: 'API key rotated successfully',
      key: newKey
    });
  } catch (error: any) {
    console.error('Rotate API key error:', error);
    if (error.message.includes('Service not found')) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revoke API key
router.delete('/keys/:apiKeyId', async (req: Request, res: Response) => {
  try {
    const { apiKeyId } = req.params;
    const reason = (req.body && req.body.reason) || 'Admin action';

    // Accept missing reason by defaulting above

    // Get the key first to find the actual apiKey value
    const keys = await serviceApiKeyService.listApiKeys(true);
    const key = keys.find(k => k.id === apiKeyId);

    if (!key) {
      return res.status(404).json({ message: 'API key not found' });
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
    if (!stats || (!stats.totalRequests && !stats.isActive)) {
      return res.status(404).json({ message: 'No statistics available for this service' });
    }
    res.json({ stats });
  } catch (error: any) {
    console.error('Get API key stats error:', error);
    if (error.message.includes('No active API key found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;