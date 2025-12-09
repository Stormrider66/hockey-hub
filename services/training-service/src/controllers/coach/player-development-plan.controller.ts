import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { PlayerDevelopmentPlan, DevelopmentPlanStatus, GoalStatus } from '../../entities/PlayerDevelopmentPlan';
import {
  CreateDevelopmentPlanDto,
  UpdateDevelopmentPlanDto,
  DevelopmentPlanResponseDto,
  AddGoalDto,
  UpdateGoalProgressDto,
  AddMilestoneDto,
  CompleteMilestoneDto
} from '../../dto/coach';
import { validationResult } from 'express-validator';
import { validateUUID } from '@hockey-hub/shared-lib';

export class PlayerDevelopmentPlanController {
  private repository: Repository<PlayerDevelopmentPlan>;

  constructor() {
    this.repository = AppDataSource.getRepository(PlayerDevelopmentPlan);
  }

  /**
   * Create a new development plan
   * POST /api/training/development-plans
   */
  public createDevelopmentPlan = async (req: Request, res: Response): Promise<void> => {
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

      const planData: CreateDevelopmentPlanDto = req.body;
      const coachId = req.user?.id || req.body.coachId;

      if (!coachId) {
        res.status(401).json({
          success: false,
          error: 'Coach ID is required'
        });
        return;
      }

      const plan = this.repository.create({
        ...planData,
        coachId,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedPlan = await this.repository.save(plan);

      const response: DevelopmentPlanResponseDto = {
        id: savedPlan.id,
        playerId: savedPlan.playerId,
        coachId: savedPlan.coachId,
        teamId: savedPlan.teamId,
        planTitle: savedPlan.planTitle,
        seasonYear: savedPlan.seasonYear,
        status: savedPlan.status,
        currentLevel: savedPlan.currentLevel,
        targetLevel: savedPlan.targetLevel,
        developmentGoals: savedPlan.developmentGoals,
        weeklyPlans: savedPlan.weeklyPlans,
        milestones: savedPlan.milestones,
        parentCommunication: savedPlan.parentCommunication,
        externalResources: savedPlan.externalResources,
        notes: savedPlan.notes,
        lastReviewDate: savedPlan.lastReviewDate,
        nextReviewDate: savedPlan.nextReviewDate,
        createdAt: savedPlan.createdAt,
        updatedAt: savedPlan.updatedAt
      };

      res.status(201).json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error creating development plan:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get development plans for a specific player
   * GET /api/training/development-plans/player/:playerId
   */
  public getPlayerDevelopmentPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const { playerId } = req.params;
      const { status, seasonYear, limit = 10, offset = 0 } = req.query;

      if (!validateUUID(playerId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid player ID format'
        });
        return;
      }

      let queryBuilder = this.repository.createQueryBuilder('plan')
        .where('plan.playerId = :playerId', { playerId })
        .orderBy('plan.createdAt', 'DESC')
        .skip(parseInt(offset as string))
        .take(parseInt(limit as string));

      if (status && ['active', 'completed', 'on_hold', 'cancelled'].includes(status as string)) {
        queryBuilder = queryBuilder.andWhere('plan.status = :status', { status });
      }

      if (seasonYear) {
        queryBuilder = queryBuilder.andWhere('plan.seasonYear = :seasonYear', { seasonYear });
      }

      const [plans, total] = await queryBuilder.getManyAndCount();

      const response = plans.map(plan => ({
        id: plan.id,
        playerId: plan.playerId,
        coachId: plan.coachId,
        teamId: plan.teamId,
        planTitle: plan.planTitle,
        seasonYear: plan.seasonYear,
        status: plan.status,
        currentLevel: plan.currentLevel,
        targetLevel: plan.targetLevel,
        developmentGoals: plan.developmentGoals,
        weeklyPlans: plan.weeklyPlans,
        milestones: plan.milestones,
        parentCommunication: plan.parentCommunication,
        externalResources: plan.externalResources,
        notes: plan.notes,
        lastReviewDate: plan.lastReviewDate,
        nextReviewDate: plan.nextReviewDate,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
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
      console.error('Error fetching player development plans:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get active development plans for a team
   * GET /api/training/development-plans/team/:teamId/active
   */
  public getTeamActiveDevelopmentPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const { teamId } = req.params;

      if (!validateUUID(teamId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid team ID format'
        });
        return;
      }

      const plans = await this.repository.find({
        where: {
          teamId,
          status: 'active'
        },
        order: {
          createdAt: 'DESC'
        }
      });

      const response = plans.map(plan => ({
        id: plan.id,
        playerId: plan.playerId,
        coachId: plan.coachId,
        teamId: plan.teamId,
        planTitle: plan.planTitle,
        seasonYear: plan.seasonYear,
        status: plan.status,
        currentLevel: plan.currentLevel,
        targetLevel: plan.targetLevel,
        developmentGoals: plan.developmentGoals.map(goal => ({
          ...goal,
          progress: goal.progress || 0
        })),
        nextReviewDate: plan.nextReviewDate,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      }));

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error fetching team active development plans:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Update a development plan
   * PUT /api/training/development-plans/:id
   */
  public updateDevelopmentPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateDevelopmentPlanDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid development plan ID format'
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

      const plan = await this.repository.findOne({ where: { id } });

      if (!plan) {
        res.status(404).json({
          success: false,
          error: 'Development plan not found'
        });
        return;
      }

      // Check if the coach owns this plan (authorization)
      const coachId = req.user?.id;
      if (coachId && plan.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to update this development plan'
        });
        return;
      }

      // Update the plan
      Object.assign(plan, {
        ...updateData,
        updatedAt: new Date()
      });

      const savedPlan = await this.repository.save(plan);

      const response: DevelopmentPlanResponseDto = {
        id: savedPlan.id,
        playerId: savedPlan.playerId,
        coachId: savedPlan.coachId,
        teamId: savedPlan.teamId,
        planTitle: savedPlan.planTitle,
        seasonYear: savedPlan.seasonYear,
        status: savedPlan.status,
        currentLevel: savedPlan.currentLevel,
        targetLevel: savedPlan.targetLevel,
        developmentGoals: savedPlan.developmentGoals,
        weeklyPlans: savedPlan.weeklyPlans,
        milestones: savedPlan.milestones,
        parentCommunication: savedPlan.parentCommunication,
        externalResources: savedPlan.externalResources,
        notes: savedPlan.notes,
        lastReviewDate: savedPlan.lastReviewDate,
        nextReviewDate: savedPlan.nextReviewDate,
        createdAt: savedPlan.createdAt,
        updatedAt: savedPlan.updatedAt
      };

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      console.error('Error updating development plan:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Add a goal to a development plan
   * POST /api/training/development-plans/:id/goals
   */
  public addGoalToPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const goalData: AddGoalDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid development plan ID format'
        });
        return;
      }

      const plan = await this.repository.findOne({ where: { id } });

      if (!plan) {
        res.status(404).json({
          success: false,
          error: 'Development plan not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && plan.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to modify this development plan'
        });
        return;
      }

      // Add the new goal
      const newGoal = {
        id: Date.now().toString(), // Simple ID generation
        category: goalData.category,
        description: goalData.description,
        targetValue: goalData.targetValue,
        currentValue: goalData.currentValue || 0,
        unit: goalData.unit,
        targetDate: goalData.targetDate,
        priority: goalData.priority,
        status: 'in_progress' as GoalStatus,
        progress: 0,
        notes: goalData.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      plan.developmentGoals.push(newGoal);
      plan.updatedAt = new Date();

      const savedPlan = await this.repository.save(plan);

      res.json({
        success: true,
        data: {
          goal: newGoal,
          totalGoals: savedPlan.developmentGoals.length
        }
      });
    } catch (error) {
      console.error('Error adding goal to development plan:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Update goal progress
   * PUT /api/training/development-plans/:id/goals/:goalId/progress
   */
  public updateGoalProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, goalId } = req.params;
      const progressData: UpdateGoalProgressDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid development plan ID format'
        });
        return;
      }

      const plan = await this.repository.findOne({ where: { id } });

      if (!plan) {
        res.status(404).json({
          success: false,
          error: 'Development plan not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && plan.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to modify this development plan'
        });
        return;
      }

      // Find and update the goal
      const goalIndex = plan.developmentGoals.findIndex(goal => goal.id === goalId);

      if (goalIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Goal not found'
        });
        return;
      }

      // Update goal progress
      plan.developmentGoals[goalIndex] = {
        ...plan.developmentGoals[goalIndex],
        currentValue: progressData.currentValue,
        progress: progressData.progress,
        status: progressData.status || plan.developmentGoals[goalIndex].status,
        notes: progressData.notes || plan.developmentGoals[goalIndex].notes,
        updatedAt: new Date()
      };

      plan.updatedAt = new Date();
      const savedPlan = await this.repository.save(plan);

      res.json({
        success: true,
        data: {
          goal: plan.developmentGoals[goalIndex],
          planLastUpdated: savedPlan.updatedAt
        }
      });
    } catch (error) {
      console.error('Error updating goal progress:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Add milestone to a development plan
   * POST /api/training/development-plans/:id/milestones
   */
  public addMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const milestoneData: AddMilestoneDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid development plan ID format'
        });
        return;
      }

      const plan = await this.repository.findOne({ where: { id } });

      if (!plan) {
        res.status(404).json({
          success: false,
          error: 'Development plan not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && plan.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to modify this development plan'
        });
        return;
      }

      // Add the new milestone
      const newMilestone = {
        id: Date.now().toString(), // Simple ID generation
        title: milestoneData.title,
        description: milestoneData.description,
        targetDate: milestoneData.targetDate,
        status: 'pending' as any,
        completedDate: null,
        notes: milestoneData.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      plan.milestones.push(newMilestone);
      plan.updatedAt = new Date();

      const savedPlan = await this.repository.save(plan);

      res.json({
        success: true,
        data: {
          milestone: newMilestone,
          totalMilestones: savedPlan.milestones.length
        }
      });
    } catch (error) {
      console.error('Error adding milestone:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Complete a milestone
   * PUT /api/training/development-plans/:id/milestones/:milestoneId/complete
   */
  public completeMilestone = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, milestoneId } = req.params;
      const completionData: CompleteMilestoneDto = req.body;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid development plan ID format'
        });
        return;
      }

      const plan = await this.repository.findOne({ where: { id } });

      if (!plan) {
        res.status(404).json({
          success: false,
          error: 'Development plan not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && plan.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to modify this development plan'
        });
        return;
      }

      // Find and complete the milestone
      const milestoneIndex = plan.milestones.findIndex(milestone => milestone.id === milestoneId);

      if (milestoneIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Milestone not found'
        });
        return;
      }

      // Complete milestone
      plan.milestones[milestoneIndex] = {
        ...plan.milestones[milestoneIndex],
        status: 'completed',
        completedDate: completionData.completedDate || new Date(),
        notes: completionData.notes || plan.milestones[milestoneIndex].notes,
        updatedAt: new Date()
      };

      plan.updatedAt = new Date();
      const savedPlan = await this.repository.save(plan);

      res.json({
        success: true,
        data: {
          milestone: plan.milestones[milestoneIndex],
          planLastUpdated: savedPlan.updatedAt
        }
      });
    } catch (error) {
      console.error('Error completing milestone:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Delete a development plan
   * DELETE /api/training/development-plans/:id
   */
  public deleteDevelopmentPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!validateUUID(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid development plan ID format'
        });
        return;
      }

      const plan = await this.repository.findOne({ where: { id } });

      if (!plan) {
        res.status(404).json({
          success: false,
          error: 'Development plan not found'
        });
        return;
      }

      // Check authorization
      const coachId = req.user?.id;
      if (coachId && plan.coachId !== coachId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to delete this development plan'
        });
        return;
      }

      await this.repository.remove(plan);

      res.json({
        success: true,
        message: 'Development plan deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting development plan:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  /**
   * Get development plan statistics
   * GET /api/training/development-plans/stats
   */
  public getDevelopmentPlanStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { teamId, coachId, seasonYear } = req.query;

      let queryBuilder = this.repository.createQueryBuilder('plan');

      if (teamId && validateUUID(teamId as string)) {
        queryBuilder = queryBuilder.where('plan.teamId = :teamId', { teamId });
      }

      if (coachId && validateUUID(coachId as string)) {
        queryBuilder = queryBuilder.andWhere('plan.coachId = :coachId', { coachId });
      }

      if (seasonYear) {
        queryBuilder = queryBuilder.andWhere('plan.seasonYear = :seasonYear', { seasonYear });
      }

      const plans = await queryBuilder.getMany();

      // Calculate statistics
      const totalPlans = plans.length;
      const plansByStatus = plans.reduce((acc, plan) => {
        acc[plan.status] = (acc[plan.status] || 0) + 1;
        return acc;
      }, {} as Record<DevelopmentPlanStatus, number>);

      // Goal completion statistics
      let totalGoals = 0;
      let completedGoals = 0;
      let inProgressGoals = 0;

      plans.forEach(plan => {
        plan.developmentGoals.forEach(goal => {
          totalGoals++;
          if (goal.status === 'completed') {
            completedGoals++;
          } else if (goal.status === 'in_progress') {
            inProgressGoals++;
          }
        });
      });

      // Milestone statistics
      let totalMilestones = 0;
      let completedMilestones = 0;

      plans.forEach(plan => {
        plan.milestones.forEach(milestone => {
          totalMilestones++;
          if (milestone.status === 'completed') {
            completedMilestones++;
          }
        });
      });

      res.json({
        success: true,
        data: {
          totalPlans,
          plansByStatus,
          goalStats: {
            total: totalGoals,
            completed: completedGoals,
            inProgress: inProgressGoals,
            completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
          },
          milestoneStats: {
            total: totalMilestones,
            completed: completedMilestones,
            completionRate: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0
          }
        }
      });
    } catch (error) {
      console.error('Error getting development plan stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
}