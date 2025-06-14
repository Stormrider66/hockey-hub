import express from 'express';
import { getMedicalOverview } from '../controllers/overviewController';

const router = express.Router();

// GET /api/v1/medical/teams/:teamId/overview
router.get('/medical/teams/:teamId/overview', getMedicalOverview);

export default router; 