import { Router } from 'express';
import { authenticate, authorize } from '@hockey-hub/shared-lib';
import { CachedMedicalService } from '../services/CachedMedicalService';
const router = Router();
const medicalService = new CachedMedicalService();

// Apply authentication to all routes
router.use(authenticate);

// Get player medical overview
router.get('/players/:playerId/overview', authorize(['player', 'parent', 'medical_staff', 'admin', 'coach']), async (req, res) => {
  try {
    const { playerId } = req.params;
    const overview = await medicalService.getPlayerMedicalOverview(parseInt(playerId));
    
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error fetching player medical overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player medical overview'
    });
  }
});

// Get team medical statistics
router.get('/team/stats', authorize(['medical_staff', 'admin', 'coach']), async (req, res) => {
  try {
    const stats = await medicalService.getTeamMedicalStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching team medical stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team medical statistics'
    });
  }
});

export default router;