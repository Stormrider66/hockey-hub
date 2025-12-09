import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Injury, WellnessEntry, PlayerAvailability } from '../entities';
import { ValidationError, UnauthorizedError } from '@hockey-hub/shared-lib';

// Interface definitions for response types
interface TeamMedicalOverview {
  teamId: string;
  period: string;
  totalPlayers: number;
  healthyPlayers: number;
  limitedPlayers: number;
  injuredPlayers: number;
  averageRiskScore: number;
  monthlyTrend: string;
  criticalAlertsCount: number;
  recentInjuries: Array<{
    playerId: string;
    playerName: string;
    injuryType: string;
    date: string;
    severity: string;
    expectedReturn: string;
  }>;
  riskDistribution: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
}

interface MedicalAlert {
  id: string;
  playerId: string;
  playerName: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  createdAt: string;
  recommendations: string[];
  isActive: boolean;
  requiresAction: boolean;
}

interface RecoveryPlan {
  playerId: string;
  playerName: string;
  injuryType: string;
  phase: string;
  progress: number;
  expectedReturn: string;
  daysRemaining: number;
  status: 'on_track' | 'ahead' | 'behind' | 'completed';
  nextMilestone: string;
}

export class MedicalAnalyticsController {
  constructor() {
    // Controller initialization - repositories will be accessed directly in methods
  }

  /**
   * GET /team/{teamId}/overview
   * Get comprehensive medical statistics for a team
   */
  async getTeamMedicalOverview(req: Request, res: Response): Promise<void> {
    try {
      const { teamId } = req.params;
      const { dateRange = '30d' } = req.query;

      if (!teamId) {
        throw new ValidationError('Team ID is required');
      }

      // Verify physical trainer role
      if (!req.user?.roles.includes('physical_trainer') && !req.user?.roles.includes('admin')) {
        throw new UnauthorizedError('Access denied. Physical trainer role required.');
      }

      const injuryRepo = AppDataSource.getRepository(Injury);
      const availabilityRepo = AppDataSource.getRepository(PlayerAvailability);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      startDate.setDate(endDate.getDate() - (daysMap[dateRange as string] || 30));

      // Get team injuries in date range
      const injuries = await injuryRepo
        .createQueryBuilder('injury')
        .where('injury.injuryDate BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere('injury.isActive = :isActive', { isActive: true })
        .getMany();

      // Get current player availability status
      const availabilities = await availabilityRepo
        .createQueryBuilder('availability')
        .where('availability.isCurrent = :isCurrent', { isCurrent: true })
        .getMany();

      // Mock player names for demonstration (in production, would join with User service)
      const playerNames: Record<string, string> = {
        'player-5': 'Sidney Crosby',
        'player-3': 'Nathan MacKinnon',
        'player-7': 'Connor McDavid',
        'player-10': 'Erik Karlsson'
      };

      // Calculate team statistics
      const totalPlayers = 25; // Mock total - would come from team roster
      const injuredPlayers = availabilities.filter(a => a.availabilityStatus === 'injured').length;
      const limitedPlayers = availabilities.filter(a => 
        ['load_management', 'illness'].includes(a.availabilityStatus)
      ).length;
      const healthyPlayers = totalPlayers - injuredPlayers - limitedPlayers;

      // Calculate risk scores (simplified algorithm)
      const riskScores = availabilities.map(a => {
        let score = 20; // Base score
        if (a.availabilityStatus === 'injured') score += 40;
        if (a.availabilityStatus === 'load_management') score += 20;
        if (a.medicalClearanceRequired && !a.clearanceProvided) score += 15;
        return Math.min(100, score);
      });

      const averageRiskScore = riskScores.length > 0 
        ? Math.round(riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length)
        : 25;

      // Risk distribution
      const riskDistribution = {
        low: riskScores.filter(s => s < 40).length,
        moderate: riskScores.filter(s => s >= 40 && s < 60).length,
        high: riskScores.filter(s => s >= 60 && s < 80).length,
        critical: riskScores.filter(s => s >= 80).length
      };

      // Recent injuries
      const recentInjuries = injuries.slice(0, 5).map(injury => ({
        playerId: injury.playerId,
        playerName: playerNames[injury.playerId] || `Player ${injury.playerId.slice(-3)}`,
        injuryType: injury.injuryType,
        date: injury.injuryDate.toISOString().split('T')[0],
        severity: injury.severityLevel >= 4 ? 'high' : injury.severityLevel >= 3 ? 'moderate' : 'low',
        expectedReturn: injury.expectedReturnDate?.toISOString().split('T')[0] || 'TBD'
      }));

      // Calculate trend (simplified)
      const monthlyTrend = injuries.length > 3 ? '+8.5%' : injuries.length > 1 ? '+2.3%' : '-5.1%';
      const criticalAlertsCount = riskDistribution.critical + Math.floor(riskDistribution.high / 2);

      const overview: TeamMedicalOverview = {
        teamId,
        period: dateRange as string,
        totalPlayers,
        healthyPlayers,
        limitedPlayers,
        injuredPlayers,
        averageRiskScore,
        monthlyTrend,
        criticalAlertsCount,
        recentInjuries,
        riskDistribution
      };

      res.json(overview);
    } catch (error: any) {
      console.error('Error in getTeamMedicalOverview:', error);
      res.status(error instanceof ValidationError || error instanceof UnauthorizedError ? 400 : 500)
         .json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /alerts
   * Get active medical alerts and warnings
   */
  async getMedicalAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { severity, limit = 20 } = req.query;

      // Verify physical trainer role
      if (!req.user?.roles.includes('physical_trainer') && !req.user?.roles.includes('admin')) {
        throw new UnauthorizedError('Access denied. Physical trainer role required.');
      }

      const injuryRepo = AppDataSource.getRepository(Injury);
      const availabilityRepo = AppDataSource.getRepository(PlayerAvailability);

      // Get current injuries and availability issues
      const activeInjuries = await injuryRepo.find({
        where: { isActive: true },
        take: parseInt(limit as string)
      });

      const availabilityIssues = await availabilityRepo.find({
        where: { 
          isCurrent: true,
          availabilityStatus: 'injured'
        },
        take: parseInt(limit as string)
      });

      // Mock player names
      const playerNames: Record<string, string> = {
        'player-5': 'Sidney Crosby',
        'player-3': 'Nathan MacKinnon', 
        'player-7': 'Connor McDavid',
        'player-10': 'Erik Karlsson'
      };

      const alerts: MedicalAlert[] = [];

      // Generate alerts from active injuries
      activeInjuries.forEach((injury) => {
        const severityLevel = injury.severityLevel >= 4 ? 'high' : 
                            injury.severityLevel >= 3 ? 'medium' : 'low';
        
        if (!severity || severity === severityLevel) {
          alerts.push({
            id: `alert-injury-${Math.random().toString(36).substr(2, 9)}`,
            playerId: injury.playerId,
            playerName: playerNames[injury.playerId] || `Player ${injury.playerId.slice(-3)}`,
            type: 'active_injury',
            severity: severityLevel as 'low' | 'medium' | 'high' | 'critical',
            title: `Active ${injury.injuryType}`,
            description: `Player has active ${injury.injuryType.toLowerCase()} affecting ${injury.bodyPart}`,
            createdAt: new Date().toISOString(),
            recommendations: [
              'Monitor daily wellness scores',
              'Ensure compliance with treatment protocol',
              'Avoid aggravating activities'
            ],
            isActive: true,
            requiresAction: injury.severityLevel >= 3
          });
        }
      });

      // Generate alerts for overdue returns
      const overdueReturns = availabilityIssues.filter(a => 
        a.expectedReturnDate && new Date(a.expectedReturnDate) < new Date()
      );

      overdueReturns.forEach(availability => {
        if (!severity || severity === 'medium') {
          alerts.push({
            id: `alert-overdue-${Math.random().toString(36).substr(2, 9)}`,
            playerId: availability.playerId,
            playerName: playerNames[availability.playerId] || `Player ${availability.playerId.slice(-3)}`,
            type: 'overdue_return',
            severity: 'medium',
            title: 'Overdue Return Date',
            description: `Expected return date has passed, reassessment needed`,
            createdAt: new Date().toISOString(),
            recommendations: [
              'Schedule medical reassessment',
              'Update return timeline',
              'Review recovery protocol'
            ],
            isActive: true,
            requiresAction: true
          });
        }
      });

      // Mock high load warnings
      const highLoadAlert: MedicalAlert = {
        id: 'alert-001',
        playerId: 'player-7', 
        playerName: 'Connor McDavid',
        type: 'high_load_warning',
        severity: 'medium',
        title: 'High Training Load Detected',
        description: 'Player has exceeded recommended training load for 3 consecutive days',
        createdAt: new Date().toISOString(),
        recommendations: [
          'Reduce training intensity by 20%',
          'Schedule recovery session'
        ],
        isActive: true,
        requiresAction: true
      };

      if (!severity || severity === 'medium') {
        alerts.push(highLoadAlert);
      }

      // Summary counts
      const summary = {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length
      };

      res.json({
        alerts: alerts.slice(0, parseInt(limit as string)),
        summary
      });
    } catch (error: any) {
      console.error('Error in getMedicalAlerts:', error);
      res.status(error instanceof UnauthorizedError ? 401 : 500)
         .json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /recovery
   * Track recovery progress and outcomes
   */
  async getRecoveryAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { status, playerId } = req.query;

      // Verify physical trainer role
      if (!req.user?.roles.includes('physical_trainer') && !req.user?.roles.includes('admin')) {
        throw new UnauthorizedError('Access denied. Physical trainer role required.');
      }

      const injuryRepo = AppDataSource.getRepository(Injury);

      // Get injuries for recovery analysis
      const whereClause: any = { isActive: true };
      
      if (playerId) {
        whereClause.playerId = playerId;
      }

      if (status === 'completed') {
        whereClause.recoveryStatus = 'recovered';
      } else {
        whereClause.recoveryStatus = ['active', 'recovering'];
      }

      const recoveryInjuries = await injuryRepo.find({
        where: whereClause
      });

      // Mock player names
      const playerNames: Record<string, string> = {
        'player-5': 'Sidney Crosby',
        'player-3': 'Nathan MacKinnon',
        'player-7': 'Connor McDavid',
        'player-10': 'Erik Karlsson'
      };

      // Process recovery plans
      const recoveryPlans: RecoveryPlan[] = recoveryInjuries.map(injury => {
        const daysInRecovery = Math.floor(
          (new Date().getTime() - new Date(injury.injuryDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const expectedDays = injury.expectedReturnDate 
          ? Math.floor(
              (new Date(injury.expectedReturnDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            )
          : 14;

        const progress = Math.min(100, Math.max(0, (daysInRecovery / (daysInRecovery + Math.max(0, expectedDays))) * 100));
        
        let recoveryStatus: 'on_track' | 'ahead' | 'behind' | 'completed' = 'on_track';
        if (injury.recoveryStatus === 'recovered') {
          recoveryStatus = 'completed';
        } else if (expectedDays < 0) {
          recoveryStatus = 'behind';
        } else if (progress > 75 && expectedDays > 7) {
          recoveryStatus = 'ahead';
        }

        const phases = ['Rest and Protection', 'Strengthening', 'Sport-Specific Training', 'Return to Play'];
        const currentPhaseIndex = Math.floor(progress / 25);
        const currentPhase = phases[Math.min(currentPhaseIndex, phases.length - 1)];

        return {
          playerId: injury.playerId,
          playerName: playerNames[injury.playerId] || `Player ${injury.playerId.slice(-3)}`,
          injuryType: injury.injuryType,
          phase: currentPhase,
          progress: Math.round(progress),
          expectedReturn: injury.expectedReturnDate?.toISOString().split('T')[0] || 'TBD',
          daysRemaining: Math.max(0, expectedDays),
          status: recoveryStatus,
          nextMilestone: this.getNextMilestone(currentPhase, progress)
        };
      });

      // Calculate statistics
      const activeRecoveries = recoveryPlans.filter(p => p.status !== 'completed').length;
      const completedRecoveries = await injuryRepo.count({
        where: { recoveryStatus: 'recovered' }
      });
      const overdueRecoveries = recoveryPlans.filter(p => p.status === 'behind').length;
      
      // Calculate average recovery time (mock calculation)
      const averageRecoveryTime = 28.5;

      const recoveryStats = {
        onTrack: recoveryPlans.filter(p => p.status === 'on_track').length,
        ahead: recoveryPlans.filter(p => p.status === 'ahead').length,
        behind: recoveryPlans.filter(p => p.status === 'behind').length,
        completed: completedRecoveries
      };

      res.json({
        activeRecoveries,
        completedRecoveries,
        overdueRecoveries,
        averageRecoveryTime,
        recoveryPlans,
        recoveryStats
      });
    } catch (error: any) {
      console.error('Error in getRecoveryAnalytics:', error);
      res.status(error instanceof UnauthorizedError ? 401 : 500)
         .json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /injury-trends
   * Analyze injury patterns and trends
   */
  async getInjuryTrends(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'season', groupBy = 'bodyPart' } = req.query;

      // Verify physical trainer role
      if (!req.user?.roles.includes('physical_trainer') && !req.user?.roles.includes('admin')) {
        throw new UnauthorizedError('Access denied. Physical trainer role required.');
      }

      const injuryRepo = AppDataSource.getRepository(Injury);

      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '6months': {
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        }
        case '1year': {
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        }
        case 'season':
        default: {
          // Assume hockey season starts September 1st
          const currentYear = endDate.getMonth() >= 8 ? endDate.getFullYear() : endDate.getFullYear() - 1;
          startDate.setFullYear(currentYear, 8, 1); // September 1st
          break;
        }
      }

      // Get injuries in the specified period
      const injuries = await injuryRepo
        .createQueryBuilder('injury')
        .where('injury.injuryDate BETWEEN :startDate AND :endDate', { startDate, endDate })
        .orderBy('injury.injuryDate', 'DESC')
        .getMany();

      // Group injuries based on groupBy parameter
      const groupedData = new Map();
      
      injuries.forEach(injury => {
        let key: string;
        switch (groupBy) {
          case 'injuryType':
            key = injury.injuryType;
            break;
          case 'month':
            key = injury.injuryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            break;
          case 'bodyPart':
          default:
            key = injury.bodyPart;
            break;
        }

        if (!groupedData.has(key)) {
          groupedData.set(key, {
            injuries: [],
            totalRecoveryDays: 0,
            severitySum: 0
          });
        }

        const group = groupedData.get(key);
        group.injuries.push(injury);
        group.severitySum += injury.severityLevel;

        // Calculate recovery days if injury is recovered
        if (injury.recoveryStatus === 'recovered' && injury.expectedReturnDate) {
          const recoveryDays = Math.floor(
            (new Date(injury.expectedReturnDate).getTime() - new Date(injury.injuryDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          group.totalRecoveryDays += recoveryDays;
        }
      });

      // Process trends data
      const trendsData = Array.from(groupedData.entries()).map(([category, data]) => {
        const count = data.injuries.length;
        const percentage = Math.round((count / injuries.length) * 100 * 10) / 10;
        const averageSeverity = data.severitySum / count;
        const severity = averageSeverity >= 4 ? 'high' : averageSeverity >= 3 ? 'moderate' : 'low';
        const averageRecoveryDays = count > 0 ? Math.round(data.totalRecoveryDays / count) : 0;

        // Mock trend calculation (in production, would compare with previous period)
        const trend = count > 3 ? '+12%' : count > 1 ? '-5%' : '+3%';

        return {
          category,
          count,
          percentage,
          trend,
          severity,
          averageRecoveryDays: averageRecoveryDays || 21 // Default if no data
        };
      }).sort((a, b) => b.count - a.count); // Sort by frequency

      // Generate monthly distribution
      const monthlyDistribution = Array.from(
        injuries.reduce((acc, injury) => {
          const month = injury.injuryDate.toISOString().slice(0, 7); // YYYY-MM format
          if (!acc.has(month)) {
            acc.set(month, { injuries: [], severitySum: 0 });
          }
          const monthData = acc.get(month);
          monthData.injuries.push(injury);
          monthData.severitySum += injury.severityLevel;
          return acc;
        }, new Map())
      ).map(([month, data]) => ({
        month,
        count: data.injuries.length,
        severity: data.severitySum / data.injuries.length >= 3 ? 'high' : 'moderate'
      })).sort((a, b) => a.month.localeCompare(b.month));

      // Generate prevention recommendations based on trends
      const preventionRecommendations = trendsData.slice(0, 3).map(trend => {
        const category = trend.category.toLowerCase();
        if (category.includes('groin') || category.includes('hip')) {
          return 'Increase groin strengthening exercises';
        } else if (category.includes('knee')) {
          return 'Implement knee injury prevention protocol';
        } else if (category.includes('shoulder')) {
          return 'Focus on shoulder stability exercises';
        } else if (category.includes('concussion')) {
          return 'Enhance head impact awareness training';
        } else {
          return `Develop targeted prevention program for ${trend.category.toLowerCase()} injuries`;
        }
      });

      res.json({
        period,
        totalInjuries: injuries.length,
        trendsData,
        monthlyDistribution,
        preventionRecommendations
      });
    } catch (error: any) {
      console.error('Error in getInjuryTrends:', error);
      res.status(error instanceof UnauthorizedError ? 401 : 500)
         .json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /prediction/{playerId}
   * AI-powered injury risk prediction for individual players
   */
  async getPlayerRiskPrediction(req: Request, res: Response): Promise<void> {
    try {
      const { playerId } = req.params;

      if (!playerId) {
        throw new ValidationError('Player ID is required');
      }

      // Verify physical trainer role
      if (!req.user?.roles.includes('physical_trainer') && !req.user?.roles.includes('admin')) {
        throw new UnauthorizedError('Access denied. Physical trainer role required.');
      }

      const injuryRepo = AppDataSource.getRepository(Injury);
      const wellnessRepo = AppDataSource.getRepository(WellnessEntry);

      // Get player's injury history
      const playerInjuries = await injuryRepo.find({
        where: { playerId },
        order: { injuryDate: 'DESC' },
        take: 10
      });

      // Get recent wellness data
      const recentWellness = await wellnessRepo.find({
        where: { playerId },
        order: { entryDate: 'DESC' },
        take: 30
      });

      // Mock player names
      const playerNames: Record<string, string> = {
        'player-5': 'Sidney Crosby',
        'player-3': 'Nathan MacKinnon',
        'player-7': 'Connor McDavid',
        'player-10': 'Erik Karlsson'
      };

      const playerName = playerNames[playerId] || `Player ${playerId.slice(-3)}`;

      // Calculate risk factors (simplified algorithm)
      const riskFactors = [];
      let riskScore = 20; // Base risk score

      // Injury history factor
      const recentInjuries = playerInjuries.filter(injury => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return new Date(injury.injuryDate) > sixMonthsAgo;
      });

      if (recentInjuries.length > 0) {
        riskFactors.push({
          factor: 'Recent injury history',
          impact: 0.28,
          trend: 'stable'
        });
        riskScore += recentInjuries.length * 15;
      }

      // Wellness factors
      if (recentWellness.length > 0) {
        const avgSoreness = recentWellness.reduce((sum, w) => sum + w.sorenessLevel, 0) / recentWellness.length;
        const avgFatigue = 10 - (recentWellness.reduce((sum, w) => sum + w.energyLevel, 0) / recentWellness.length);
        const avgStress = recentWellness.reduce((sum, w) => sum + w.stressLevel, 0) / recentWellness.length;

        if (avgSoreness > 6) {
          riskFactors.push({
            factor: 'Elevated soreness levels',
            impact: 0.22,
            trend: 'increasing'
          });
          riskScore += 20;
        }

        if (avgFatigue > 6) {
          riskFactors.push({
            factor: 'High fatigue levels',
            impact: 0.18,
            trend: 'stable'
          });
          riskScore += 15;
        }

        if (avgStress > 7) {
          riskFactors.push({
            factor: 'High stress levels',
            impact: 0.15,
            trend: 'increasing'
          });
          riskScore += 12;
        }
      }

      // Mock training load factor (would come from training service)
      if (Math.random() > 0.5) {
        riskFactors.push({
          factor: 'High training load',
          impact: 0.35,
          trend: 'increasing'
        });
        riskScore += 25;
      }

      // Determine risk level
      riskScore = Math.min(100, riskScore);
      let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
      
      if (riskScore >= 80) riskLevel = 'critical';
      else if (riskScore >= 60) riskLevel = 'high';
      else if (riskScore >= 40) riskLevel = 'moderate';
      else riskLevel = 'low';

      // Generate predictions (mock ML model results)
      const predictions = {
        injuryProbability: Math.min(0.9, riskScore / 100 * 0.6),
        fatigueRisk: Math.min(0.9, (riskScore + 10) / 100 * 0.8),
        performanceDecline: Math.min(0.9, riskScore / 100 * 0.4)
      };

      // Generate recommendations
      const recommendations = [];
      
      if (riskLevel === 'high' || riskLevel === 'critical') {
        recommendations.push('Medical evaluation recommended');
        recommendations.push('Consider reducing training load');
      }
      
      if (riskFactors.some(rf => rf.factor.includes('fatigue'))) {
        recommendations.push('Focus on recovery and sleep quality');
      }
      
      if (riskFactors.some(rf => rf.factor.includes('load'))) {
        recommendations.push('Implement load management protocol');
      }
      
      recommendations.push('Monitor wellness metrics daily');

      // Mock model confidence
      const modelConfidence = 0.84;

      res.json({
        playerId,
        playerName,
        riskScore,
        riskLevel,
        predictions,
        riskFactors,
        recommendations,
        modelConfidence
      });
    } catch (error: any) {
      console.error('Error in getPlayerRiskPrediction:', error);
      res.status(error instanceof ValidationError || error instanceof UnauthorizedError ? 400 : 500)
         .json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * POST /alerts/{alertId}/resolve
   * Mark medical alert as resolved
   */
  async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const { resolution, actionTaken, resolvedBy } = req.body;

      if (!alertId || !resolution || !actionTaken) {
        throw new ValidationError('Alert ID, resolution, and action taken are required');
      }

      // Verify physical trainer role
      if (!req.user?.roles.includes('physical_trainer') && !req.user?.roles.includes('admin')) {
        throw new UnauthorizedError('Access denied. Physical trainer role required.');
      }

      // In a real implementation, you would update the alert in the database
      // For now, return a mock response
      const resolvedAt = new Date().toISOString();

      res.json({
        alertId,
        status: 'resolved',
        resolvedAt,
        resolution,
        actionTaken,
        resolvedBy: resolvedBy || req.user?.userId
      });
    } catch (error: any) {
      console.error('Error in resolveAlert:', error);
      res.status(error instanceof ValidationError || error instanceof UnauthorizedError ? 400 : 500)
         .json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * Helper method to determine next milestone
   */
  private getNextMilestone(currentPhase: string, progress: number): string {
    const milestones = {
      'Rest and Protection': 'Begin light activity',
      'Strengthening': 'Return to skating',
      'Sport-Specific Training': 'Non-contact practice',
      'Return to Play': 'Full contact clearance'
    };

    return milestones[currentPhase as keyof typeof milestones] || 'Medical clearance';
  }
}

// Create controller instance
const medicalAnalyticsController = new MedicalAnalyticsController();

// Export controller methods
export const getTeamMedicalOverview = medicalAnalyticsController.getTeamMedicalOverview.bind(medicalAnalyticsController);
export const getMedicalAlerts = medicalAnalyticsController.getMedicalAlerts.bind(medicalAnalyticsController);
export const getRecoveryAnalytics = medicalAnalyticsController.getRecoveryAnalytics.bind(medicalAnalyticsController);
export const getInjuryTrends = medicalAnalyticsController.getInjuryTrends.bind(medicalAnalyticsController);
export const getPlayerRiskPrediction = medicalAnalyticsController.getPlayerRiskPrediction.bind(medicalAnalyticsController);
export const resolveAlert = medicalAnalyticsController.resolveAlert.bind(medicalAnalyticsController);