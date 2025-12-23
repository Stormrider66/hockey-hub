// @ts-nocheck
import { Router, type Router as ExpressRouter } from 'express';
import crypto from 'crypto';
import { authenticate, authorize } from '@hockey-hub/shared-lib';
import { CachedMedicalService } from '../services/CachedMedicalService';
const router: ExpressRouter = Router();
const medicalService = new CachedMedicalService();

// Apply authentication to all routes
router.use(authenticate);

// Get player medical overview
router.get('/players/:playerId/overview', authorize(['player', 'parent', 'medical_staff', 'admin', 'coach', 'physical_trainer']), async (req, res) => {
  try {
    const { playerId } = req.params;
    const overview = await medicalService.getPlayerMedicalOverview(parseInt(playerId));
    // Conditional GET headers
    const etag = 'W/"' + crypto.createHash('sha1').update(JSON.stringify(overview)).digest('hex') + '"';
    const lastModified = new Date();
    res.set('ETag', etag);
    res.set('Last-Modified', lastModified.toUTCString());
    const inm = req.headers['if-none-match'];
    const ims = req.headers['if-modified-since'];
    if ((typeof inm === 'string' && inm.split(',').map(s=>s.trim()).includes(etag)) ||
        (typeof ims === 'string' && new Date(ims).getTime() >= lastModified.getTime())) {
      return res.status(304).end();
    }
    res.json({ success: true, data: overview });
  } catch (error) {
    console.error('Error fetching player medical overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player medical overview'
    });
  }
});

// Get team medical statistics
router.get('/team/stats', authorize(['medical_staff', 'admin', 'coach', 'physical_trainer']), async (req, res) => {
  try {
    const stats = await medicalService.getTeamMedicalStats();
    const etag = 'W/"' + crypto.createHash('sha1').update(JSON.stringify(stats)).digest('hex') + '"';
    const lastModified = new Date();
    res.set('ETag', etag);
    res.set('Last-Modified', lastModified.toUTCString());
    const inm = req.headers['if-none-match'];
    const ims = req.headers['if-modified-since'];
    if ((typeof inm === 'string' && inm.split(',').map(s=>s.trim()).includes(etag)) ||
        (typeof ims === 'string' && new Date(ims).getTime() >= lastModified.getTime())) {
      return res.status(304).end();
    }
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching team medical stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team medical statistics'
    });
  }
});

export default router;