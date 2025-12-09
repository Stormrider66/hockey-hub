import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { SkillProgressionTracking } from '../../entities/SkillProgressionTracking';
import {
  CreateSkillProgressionDto,
  UpdateSkillProgressionDto,
  SkillProgressionResponseDto,
  AddMeasurementDto,
  UpdateMeasurementDto,
  AddDrillPerformanceDto,
  SetTargetLevelDto,
  UpdateBenchmarksDto,
  SkillProgressionFilterDto,
  ProgressAnalysisDto,
  BulkMeasurementDto,
  SingleMeasurementDto
} from '../../dto/coach';
import { validationResult } from 'express-validator';
import { validateUUID } from '@hockey-hub/shared-lib';

export class SkillProgressionController {
  private repository: Repository<SkillProgressionTracking>;

  constructor() {
    this.repository = AppDataSource.getRepository(SkillProgressionTracking);
  }

  /**
   * Create a new skill progression tracking
   * POST /api/training/skill-progression
   */
  public createSkillProgression = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const progressionData: CreateSkillProgressionDto = req.body;
      const coachId = req.user?.id || req.body.coachId;

      if (!coachId) {
        res.status(401).json({
          success: false,
          error: 'Coach ID is required'
        });
        return;
      }

      const progression = this.repository.create({
        ...progressionData,
        coachId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedProgression = await this.repository.save(progression);

      const response: SkillProgressionResponseDto = {
        id: savedProgression.id,
        playerId: savedProgression.playerId,
        coachId: savedProgression.coachId,
        teamId: savedProgression.teamId,
        skillCategory: savedProgression.skillCategory,
        skillName: savedProgression.skillName,
        currentLevel: savedProgression.currentLevel,
        targetLevel: savedProgression.targetLevel,
        assessmentCriteria: savedProgression.assessmentCriteria,
        measurements: savedProgression.measurements,
        benchmarks: savedProgression.benchmarks,
        drillHistory: savedProgression.drillHistory,
        progressNotes: savedProgression.progressNotes,
        lastAssessmentDate: savedProgression.lastAssessmentDate,
        nextAssessmentDate: savedProgression.nextAssessmentDate,
        createdAt: savedProgression.createdAt,
        updatedAt: savedProgression.updatedAt
      };

      res.status(201).json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error creating skill progression:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get skill progressions for a specific player
   * GET /api/training/skill-progression/player/:playerId
   */
  public getPlayerSkillProgressions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { playerId } = req.params;
      const { skillCategory, skillName, limit = 10, offset = 0 } = req.query;

      if (!validateUUID(playerId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid player ID format'
        });
        return;
      }

      let queryBuilder = this.repository.createQueryBuilder('progression')
        .where('progression.playerId = :playerId', { playerId })
        .orderBy('progression.lastAssessmentDate', 'DESC')
        .skip(parseInt(offset as string))
        .take(parseInt(limit as string));

      if (skillCategory) {
        queryBuilder = queryBuilder.andWhere('progression.skillCategory = :skillCategory', { skillCategory });
      }

      if (skillName) {
        queryBuilder = queryBuilder.andWhere('progression.skillName ILIKE :skillName', { skillName: `%${skillName}%` });
      }

      const [progressions, total] = await queryBuilder.getManyAndCount();

      const response = progressions.map(progression => ({
        id: progression.id,
        playerId: progression.playerId,
        coachId: progression.coachId,
        teamId: progression.teamId,
        skillCategory: progression.skillCategory,
        skillName: progression.skillName,
        currentLevel: progression.currentLevel,
        targetLevel: progression.targetLevel,
        assessmentCriteria: progression.assessmentCriteria,
        measurements: progression.measurements,
        benchmarks: progression.benchmarks,
        drillHistory: progression.drillHistory,
        progressNotes: progression.progressNotes,
        lastAssessmentDate: progression.lastAssessmentDate,
        nextAssessmentDate: progression.nextAssessmentDate,
        createdAt: progression.createdAt,
        updatedAt: progression.updatedAt
      }));

      res.json({
        success: true,
        data: response,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: total > parseInt(offset as string) + parseInt(limit as string)
        }
      });
    } catch (error) {
      console.error('Error fetching player skill progressions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get team skill progressions overview
   * GET /api/training/skill-progression/team/:teamId/overview
   */
  public getTeamSkillProgressionsOverview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { teamId } = req.params;
      const { skillCategory } = req.query;

      if (!validateUUID(teamId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid team ID format'
        });
        return;
      }

      let queryBuilder = this.repository.createQueryBuilder('progression')
        .where('progression.teamId = :teamId', { teamId })
        .orderBy('progression.skillCategory')
        .addOrderBy('progression.skillName');

      if (skillCategory) {
        queryBuilder = queryBuilder.andWhere('progression.skillCategory = :skillCategory', { skillCategory });
      }

      const progressions = await queryBuilder.getMany();

      // Group by skill category and name for overview
      const overview = progressions.reduce((acc, progression) => {
        const key = `${progression.skillCategory}-${progression.skillName}`;
        if (!acc[key]) {
          acc[key] = {
            skillCategory: progression.skillCategory,
            skillName: progression.skillName,
            players: [],
            averageLevel: 0,
            playersAtTarget: 0,
            totalPlayers: 0
          };
        }

        acc[key].players.push({
          playerId: progression.playerId,
          currentLevel: progression.currentLevel,
          targetLevel: progression.targetLevel,
          isAtTarget: progression.currentLevel >= progression.targetLevel,
          lastAssessment: progression.lastAssessmentDate
        });

        acc[key].totalPlayers++;
        if (progression.currentLevel >= progression.targetLevel) {
          acc[key].playersAtTarget++;
        }

        return acc;
      }, {} as Record<string, any>);

      // Calculate averages
      Object.values(overview).forEach((skill: any) => {
        skill.averageLevel = skill.players.reduce((sum: number, p: any) => sum + p.currentLevel, 0) / skill.totalPlayers;
        skill.targetAchievementRate = Math.round((skill.playersAtTarget / skill.totalPlayers) * 100);
      });

      res.json({
        success: true,
        data: Object.values(overview)
      });
    } catch (error) {
      console.error('Error fetching team skill progressions overview:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Update a skill progression
   * PUT /api/training/skill-progression/:id
   */
  public updateSkillProgression = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateSkillProgressionDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid skill progression ID format'
        });
        return;
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const progression = await this.repository.findOne({ where: { id } });

      if (!progression) {
        res.status(404).json({
          success: false,
          error: 'Skill progression not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && progression.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to update this skill progression'
        });
        return;
      }

      // Update the progression
      Object.assign(progression, {
        ...updateData,
        updatedAt: new Date()
      });

      const savedProgression = await this.repository.save(progression);

      const response: SkillProgressionResponseDto = {
        id: savedProgression.id,
        playerId: savedProgression.playerId,
        coachId: savedProgression.coachId,
        teamId: savedProgression.teamId,
        skillCategory: savedProgression.skillCategory,
        skillName: savedProgression.skillName,
        currentLevel: savedProgression.currentLevel,
        targetLevel: savedProgression.targetLevel,
        assessmentCriteria: savedProgression.assessmentCriteria,
        measurements: savedProgression.measurements,
        benchmarks: savedProgression.benchmarks,
        drillHistory: savedProgression.drillHistory,
        progressNotes: savedProgression.progressNotes,
        lastAssessmentDate: savedProgression.lastAssessmentDate,
        nextAssessmentDate: savedProgression.nextAssessmentDate,
        createdAt: savedProgression.createdAt,
        updatedAt: savedProgression.updatedAt
      };

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error updating skill progression:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Add measurement to skill progression
   * POST /api/training/skill-progression/:id/measurements
   */
  public addMeasurement = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const measurementData: AddMeasurementDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid skill progression ID format'
        });
        return;
      }

      const progression = await this.repository.findOne({ where: { id } });

      if (!progression) {
        res.status(404).json({
          success: false,
          error: 'Skill progression not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && progression.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to modify this skill progression'
        });
        return;
      }

      // Add the new measurement
      const newMeasurement = {
        id: Date.now().toString(), // Simple ID generation
        date: measurementData.date || new Date(),
        value: measurementData.value,
        unit: measurementData.unit,
        context: measurementData.context,
        notes: measurementData.notes,
        assessorId: coachId,
        createdAt: new Date()
      };

      progression.measurements.push(newMeasurement);
      
      // Update current level if this is the latest measurement
      const latestMeasurement = progression.measurements.reduce((latest, current) => 
        new Date(current.date) > new Date(latest.date) ? current : latest
      );

      if (latestMeasurement.id === newMeasurement.id) {
        progression.currentLevel = measurementData.value;
        progression.lastAssessmentDate = measurementData.date || new Date();
      }

      progression.updatedAt = new Date();

      const savedProgression = await this.repository.save(progression);

      res.json({
        success: true,
        data: {
          measurement: newMeasurement,
          totalMeasurements: savedProgression.measurements.length,
          currentLevel: savedProgression.currentLevel
        }
      });
    } catch (error) {
      console.error('Error adding measurement:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Add drill performance to skill progression
   * POST /api/training/skill-progression/:id/drill-performance
   */
  public addDrillPerformance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const drillData: AddDrillPerformanceDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid skill progression ID format'
        });
        return;
      }

      const progression = await this.repository.findOne({ where: { id } });

      if (!progression) {
        res.status(404).json({
          success: false,
          error: 'Skill progression not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && progression.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to modify this skill progression'
        });
        return;
      }

      // Add the drill performance
      const newDrillPerformance = {
        id: Date.now().toString(), // Simple ID generation
        date: drillData.date || new Date(),
        drillName: drillData.drillName,
        performance: drillData.performance,
        notes: drillData.notes,
        duration: drillData.duration,
        repetitions: drillData.repetitions,
        quality: drillData.quality,
        createdAt: new Date()
      };

      progression.drillHistory.push(newDrillPerformance);
      progression.updatedAt = new Date();

      const savedProgression = await this.repository.save(progression);

      res.json({
        success: true,
        data: {
          drillPerformance: newDrillPerformance,
          totalDrillSessions: savedProgression.drillHistory.length
        }
      });
    } catch (error) {
      console.error('Error adding drill performance:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Set target level for skill progression
   * PUT /api/training/skill-progression/:id/target-level
   */
  public setTargetLevel = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const targetData: SetTargetLevelDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid skill progression ID format'
        });
        return;
      }

      const progression = await this.repository.findOne({ where: { id } });

      if (!progression) {
        res.status(404).json({
          success: false,
          error: 'Skill progression not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && progression.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to modify this skill progression'
        });
        return;
      }

      // Update target level and related dates
      progression.targetLevel = targetData.targetLevel;
      progression.nextAssessmentDate = targetData.nextAssessmentDate;
      
      if (targetData.notes) {
        progression.progressNotes = progression.progressNotes + '\n' + `Target updated: ${targetData.notes}`;
      }

      progression.updatedAt = new Date();

      const savedProgression = await this.repository.save(progression);

      res.json({
        success: true,
        data: {
          targetLevel: savedProgression.targetLevel,
          nextAssessmentDate: savedProgression.nextAssessmentDate,
          progressGap: savedProgression.targetLevel - savedProgression.currentLevel
        }
      });
    } catch (error) {
      console.error('Error setting target level:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Update benchmarks for skill progression
   * PUT /api/training/skill-progression/:id/benchmarks
   */
  public updateBenchmarks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const benchmarkData: UpdateBenchmarksDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid skill progression ID format'
        });
        return;
      }

      const progression = await this.repository.findOne({ where: { id } });

      if (!progression) {
        res.status(404).json({
          success: false,
          error: 'Skill progression not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && progression.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to modify this skill progression'
        });
        return;
      }

      // Update benchmarks
      progression.benchmarks = {
        ...progression.benchmarks,
        ...benchmarkData.benchmarks,
        lastUpdated: new Date()
      };

      progression.updatedAt = new Date();

      const savedProgression = await this.repository.save(progression);

      res.json({
        success: true,
        data: {
          benchmarks: savedProgression.benchmarks,
          lastUpdated: savedProgression.updatedAt
        }
      });
    } catch (error) {
      console.error('Error updating benchmarks:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Bulk add measurements
   * POST /api/training/skill-progression/bulk-measurements
   */
  public bulkAddMeasurements = async (req: Request, res: Response): Promise<void> => {
    try {
      const bulkData: BulkMeasurementDto = req.body;
      const coachId = req.user?.id;

      if (!coachId) {
        res.status(401).json({
          success: false,
          error: 'Coach ID is required'
        });
        return;
      }

      if (!bulkData.measurements || bulkData.measurements.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Measurements array is required and cannot be empty'
        });
        return;
      }

      // Process each measurement
      const results = [];
      
      for (const measurement of bulkData.measurements) {
        try {
          if (!validateUUID(measurement.progressionId)) {
            results.push({
              progressionId: measurement.progressionId,
              success: false,
              error: 'Invalid progression ID format'
            });
            continue;
          }

          const progression = await this.repository.findOne({ 
            where: { id: measurement.progressionId } 
          });

          if (!progression) {
            results.push({
              progressionId: measurement.progressionId,
              success: false,
              error: 'Skill progression not found'
            });
            continue;
          }

          // Check authorization
          if (progression.coachId !== coachId) {
            results.push({
              progressionId: measurement.progressionId,
              success: false,
              error: 'Not authorized to modify this progression'
            });
            continue;
          }

          // Add measurement
          const newMeasurement = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Unique ID
            date: measurement.date || new Date(),
            value: measurement.value,
            unit: measurement.unit,
            context: measurement.context,
            notes: measurement.notes,
            assessorId: coachId,
            createdAt: new Date()
          };

          progression.measurements.push(newMeasurement);

          // Update current level if this is the latest measurement
          const latestMeasurement = progression.measurements.reduce((latest, current) => 
            new Date(current.date) > new Date(latest.date) ? current : latest
          );

          if (latestMeasurement.id === newMeasurement.id) {
            progression.currentLevel = measurement.value;
            progression.lastAssessmentDate = measurement.date || new Date();
          }

          progression.updatedAt = new Date();
          await this.repository.save(progression);

          results.push({
            progressionId: measurement.progressionId,
            success: true,
            measurementId: newMeasurement.id
          });
        } catch (error) {
          results.push({
            progressionId: measurement.progressionId,
            success: false,
            error: 'Error processing measurement'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      res.json({
        success: true,
        data: {
          totalProcessed: bulkData.measurements.length,
          successful: successCount,
          failed: bulkData.measurements.length - successCount,
          results
        }
      });
    } catch (error) {
      console.error('Error bulk adding measurements:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get progress analysis for a skill
   * GET /api/training/skill-progression/:id/analysis
   */
  public getProgressAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { period = '3months' } = req.query;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid skill progression ID format'
        });
        return;
      }

      const progression = await this.repository.findOne({ where: { id } });

      if (!progression) {
        res.status(404).json({
          success: false,
          error: 'Skill progression not found'
        });
        return;
      }

      // Calculate analysis period
      const now = new Date();
      let fromDate: Date;
      
      switch (period) {
        case '1month':
          fromDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case '6months':
          fromDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case '1year':
          fromDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default: // 3months
          fromDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      }

      // Filter measurements for the period
      const periodMeasurements = progression.measurements
        .filter(m => new Date(m.date) >= fromDate)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate trend and improvement
      let trend = 'stable';
      let improvementRate = 0;

      if (periodMeasurements.length >= 2) {
        const firstValue = periodMeasurements[0].value;
        const lastValue = periodMeasurements[periodMeasurements.length - 1].value;
        
        improvementRate = ((lastValue - firstValue) / firstValue) * 100;
        
        if (improvementRate > 5) {
          trend = 'improving';
        } else if (improvementRate < -5) {
          trend = 'declining';
        }
      }

      // Calculate consistency (standard deviation)
      const values = periodMeasurements.map(m => m.value);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const consistency = Math.sqrt(variance);

      // Progress to target
      const progressToTarget = progression.targetLevel > 0 
        ? Math.min((progression.currentLevel / progression.targetLevel) * 100, 100) 
        : 0;

      const analysis: ProgressAnalysisDto = {
        period: period as string,
        measurementCount: periodMeasurements.length,
        trend,
        improvementRate: Math.round(improvementRate * 100) / 100,
        consistency: Math.round(consistency * 100) / 100,
        progressToTarget: Math.round(progressToTarget * 100) / 100,
        currentLevel: progression.currentLevel,
        targetLevel: progression.targetLevel,
        recentMeasurements: periodMeasurements.slice(-5), // Last 5 measurements
        recommendations: this.generateRecommendations(trend, improvementRate, consistency, progressToTarget)
      };

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Error getting progress analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Delete a skill progression
   * DELETE /api/training/skill-progression/:id
   */
  public deleteSkillProgression = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid skill progression ID format'
        });
        return;
      }

      const progression = await this.repository.findOne({ where: { id } });

      if (!progression) {
        res.status(404).json({
          success: false,
          error: 'Skill progression not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && progression.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to delete this skill progression'
        });
        return;
      }

      await this.repository.remove(progression);

      res.json({
        success: true,
        message: 'Skill progression deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting skill progression:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    trend: string, 
    improvementRate: number, 
    consistency: number, 
    progressToTarget: number
  ): string[] {
    const recommendations: string[] = [];

    if (trend === 'declining') {
      recommendations.push('Consider reviewing training approach - performance is declining');
      recommendations.push('Increase practice frequency or modify drill difficulty');
    }

    if (trend === 'stable' && progressToTarget < 50) {
      recommendations.push('Current approach may need adjustment to reach target');
      recommendations.push('Consider more challenging drills or increased training intensity');
    }

    if (consistency > 2) {
      recommendations.push('Focus on consistency - measurements show high variation');
      recommendations.push('Consider breaking down skill into smaller components');
    }

    if (improvementRate > 20) {
      recommendations.push('Excellent progress! Consider raising target level');
      recommendations.push('Player ready for more advanced skill challenges');
    }

    if (progressToTarget > 90) {
      recommendations.push('Target nearly achieved - prepare next level goals');
      recommendations.push('Consider transitioning to more complex skill variations');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current training approach - showing steady progress');
    }

    return recommendations;
  }
}