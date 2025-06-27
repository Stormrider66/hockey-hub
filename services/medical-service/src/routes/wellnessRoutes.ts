import { Router, Request, Response } from 'express';

const router = Router();

// Temporary in-memory storage for wellness data
const wellnessData: any[] = [];

// Submit wellness entry
router.post('/players/:playerId/wellness', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const wellnessEntry = req.body;
    
    // Add timestamp and player ID
    const entry = {
      id: Date.now(),
      playerId: parseInt(playerId),
      timestamp: new Date().toISOString(),
      ...wellnessEntry
    };
    
    // Store in memory (in production, this would go to a database)
    wellnessData.push(entry);
    
    // Log the submission
    console.log(`Wellness submission for player ${playerId}:`, entry);
    
    res.json({
      success: true,
      message: 'Wellness data submitted successfully',
      data: entry
    });
  } catch (error) {
    console.error('Error submitting wellness:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit wellness data'
    });
  }
});

// Get wellness history for a player
router.get('/players/:playerId/wellness', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const playerWellness = wellnessData.filter(
      entry => entry.playerId === parseInt(playerId)
    );
    
    res.json({
      success: true,
      data: playerWellness
    });
  } catch (error) {
    console.error('Error fetching wellness:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wellness data'
    });
  }
});

// Get latest wellness entry for a player
router.get('/players/:playerId/wellness/latest', async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const playerWellness = wellnessData
      .filter(entry => entry.playerId === parseInt(playerId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    res.json({
      success: true,
      data: playerWellness[0] || null
    });
  } catch (error) {
    console.error('Error fetching latest wellness:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest wellness data'
    });
  }
});

export default router;