import { Request, Response, NextFunction } from 'express';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { getRepository } from 'typeorm';
import { PracticePlan, PracticeStatus, PracticeFocus } from '../../entities/PracticePlan';
import { Drill } from '../../entities/Drill';
import { createPaginationResponse } from '@hockey-hub/shared-lib/dist/types/pagination';
import { IsEnum, IsString, IsUUID, IsOptional, IsArray, ValidateNested, IsDateString, IsInt, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

const logger = new Logger('PracticePlanController');

// DTOs for validation
class PracticeSectionDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  duration: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  drillIds: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];
}

export class CreatePracticePlanDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  teamId: string;

  @IsDateString()
  date: string;

  @IsInt()
  @Min(1)
  duration: number;

  @IsEnum(PracticeFocus)
  primaryFocus: PracticeFocus;

  @IsOptional()
  @IsArray()
  @IsEnum(PracticeFocus, { each: true })
  secondaryFocus?: PracticeFocus[];

  @ValidateNested({ each: true })
  @Type(() => PracticeSectionDto)
  @ArrayMinSize(1)
  sections: PracticeSectionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  rinkId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePracticePlanDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsEnum(PracticeStatus)
  status?: PracticeStatus;

  @IsOptional()
  @IsEnum(PracticeFocus)
  primaryFocus?: PracticeFocus;

  @IsOptional()
  @IsArray()
  @IsEnum(PracticeFocus, { each: true })
  secondaryFocus?: PracticeFocus[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PracticeSectionDto)
  sections?: PracticeSectionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  rinkId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  coachFeedback?: string;

  @IsOptional()
  @IsArray()
  attendance?: Array<{
    playerId: string;
    present: boolean;
    reason?: string;
  }>;

  @IsOptional()
  @IsArray()
  playerEvaluations?: Array<{
    playerId: string;
    rating: number;
    notes?: string;
    areasOfImprovement?: string[];
  }>;
}

export class PracticePlanQueryDto {
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsEnum(PracticeStatus)
  status?: PracticeStatus;

  @IsOptional()
  @IsEnum(PracticeFocus)
  primaryFocus?: PracticeFocus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}

export class PracticePlanController {
  
  /**
   * Create a new practice plan
   * POST /api/planning/practice-plans
   */
  static async create(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const practiceData = req.body as CreatePracticePlanDto;
      const coachId = req.user!.userId;
      const organizationId = req.user!.organizationId;

      logger.info(`Creating practice plan ${practiceData.title} for team ${practiceData.teamId} by coach ${coachId}`);

      const repository = getRepository(PracticePlan);
      
      // Create the practice plan
      const practicePlan = repository.create({
        ...practiceData,
        organizationId,
        coachId,
        date: new Date(practiceData.date),
        status: PracticeStatus.PLANNED
      });

      const savedPlan = await repository.save(practicePlan);

      // Load drills for the sections
      const allDrillIds = practiceData.sections.flatMap(section => section.drillIds);
      if (allDrillIds.length > 0) {
        const drillRepo = getRepository(Drill);
        const drills = await drillRepo.findByIds(allDrillIds);
        savedPlan.drills = drills;
        await repository.save(savedPlan);
      }
      
      logger.info(`Practice plan created with id: ${savedPlan.id}`);
      res.status(201).json(savedPlan);
    } catch (error) {
      logger.error('Error creating practice plan:', error);
      next(error);
    }
  }

  /**
   * Get practice plans with filtering and pagination
   * GET /api/planning/practice-plans?teamId=xxx&status=xxx&primaryFocus=xxx&startDate=xxx&endDate=xxx&search=xxx&page=1&pageSize=20
   */
  static async list(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { teamId, status, primaryFocus, startDate, endDate, search, page = 1, pageSize = 20 } = req.query as any;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting practice plans for organization ${organizationId}`);

      const repository = getRepository(PracticePlan);
      const queryBuilder = repository.createQueryBuilder('plan')
        .leftJoinAndSelect('plan.drills', 'drill')
        .where('plan.organizationId = :organizationId', { organizationId });

      // Apply filters
      if (teamId) {
        queryBuilder.andWhere('plan.teamId = :teamId', { teamId });
      }

      if (status) {
        queryBuilder.andWhere('plan.status = :status', { status });
      }

      if (primaryFocus) {
        queryBuilder.andWhere('plan.primaryFocus = :primaryFocus', { primaryFocus });
      }

      if (startDate) {
        queryBuilder.andWhere('plan.date >= :startDate', { startDate: new Date(startDate) });
      }

      if (endDate) {
        queryBuilder.andWhere('plan.date <= :endDate', { endDate: new Date(endDate) });
      }

      if (search) {
        queryBuilder.andWhere('(plan.title ILIKE :search OR plan.description ILIKE :search OR plan.notes ILIKE :search)', { 
          search: `%${search}%` 
        });
      }

      // Add ordering
      queryBuilder.orderBy('plan.date', 'DESC');

      // Apply pagination
      const p = Number(page);
      const ps = Number(pageSize);
      const skip = (p - 1) * ps;
      
      const [plans, total] = await queryBuilder
        .skip(skip)
        .take(ps)
        .getManyAndCount();

      const response = createPaginationResponse(plans, p, ps, total);
      res.json(response);
    } catch (error) {
      logger.error('Error getting practice plans:', error);
      next(error);
    }
  }

  /**
   * Get a single practice plan by ID
   * GET /api/planning/practice-plans/:id
   */
  static async getById(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting practice plan ${id}`);

      const repository = getRepository(PracticePlan);
      const plan = await repository.findOne({
        where: { 
          id, 
          organizationId
        },
        relations: ['drills', 'trainingPlan']
      });

      if (!plan) {
        return res.status(404).json({ error: 'Practice plan not found' });
      }

      res.json(plan);
    } catch (error) {
      logger.error('Error getting practice plan by ID:', error);
      next(error);
    }
  }

  /**
   * Update a practice plan
   * PUT /api/planning/practice-plans/:id
   */
  static async update(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body as UpdatePracticePlanDto;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Updating practice plan ${id} by coach ${coachId}`);

      const repository = getRepository(PracticePlan);
      const plan = await repository.findOne({
        where: { 
          id, 
          organizationId,
          coachId // Only coach who created can update
        },
        relations: ['drills']
      });

      if (!plan) {
        return res.status(404).json({ error: 'Practice plan not found or no permission to update' });
      }

      // Apply updates
      Object.assign(plan, updates);
      
      // Handle date conversion if provided
      if (updates.date) {
        plan.date = new Date(updates.date);
      }

      // Update drills if sections changed
      if (updates.sections) {
        const allDrillIds = updates.sections.flatMap(section => section.drillIds);
        if (allDrillIds.length > 0) {
          const drillRepo = getRepository(Drill);
          const drills = await drillRepo.findByIds(allDrillIds);
          plan.drills = drills;
        }
      }

      const updatedPlan = await repository.save(plan);

      logger.info(`Practice plan ${id} updated successfully`);
      res.json(updatedPlan);
    } catch (error) {
      logger.error('Error updating practice plan:', error);
      next(error);
    }
  }

  /**
   * Delete a practice plan
   * DELETE /api/planning/practice-plans/:id
   */
  static async delete(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Deleting practice plan ${id} by coach ${coachId}`);

      const repository = getRepository(PracticePlan);
      const result = await repository.delete({
        id,
        organizationId,
        coachId // Only coach who created can delete
      });

      if (result.affected === 0) {
        return res.status(404).json({ error: 'Practice plan not found or no permission to delete' });
      }

      logger.info(`Practice plan ${id} deleted successfully`);
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting practice plan:', error);
      next(error);
    }
  }

  /**
   * Duplicate a practice plan
   * POST /api/planning/practice-plans/:id/duplicate
   */
  static async duplicate(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newDate, newTitle } = req.body;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Duplicating practice plan ${id} by coach ${coachId}`);

      const repository = getRepository(PracticePlan);
      const originalPlan = await repository.findOne({
        where: { 
          id, 
          organizationId
        },
        relations: ['drills']
      });

      if (!originalPlan) {
        return res.status(404).json({ error: 'Practice plan not found' });
      }

      // Create duplicate
      const { id: _, createdAt, updatedAt, ...planData } = originalPlan as any;
      const duplicatedPlan = repository.create({
        ...planData,
        title: newTitle || `${originalPlan.title} (Copy)`,
        date: newDate ? new Date(newDate) : originalPlan.date,
        coachId,
        status: PracticeStatus.PLANNED
      });

      const savedPlan = await repository.save(duplicatedPlan);

      // Copy drill associations
      if (originalPlan.drills && originalPlan.drills.length > 0) {
        savedPlan.drills = originalPlan.drills;
        await repository.save(savedPlan);
      }

      logger.info(`Practice plan duplicated with id: ${savedPlan.id}`);
      res.status(201).json(savedPlan);
    } catch (error) {
      logger.error('Error duplicating practice plan:', error);
      next(error);
    }
  }

  /**
   * Update practice attendance
   * PUT /api/planning/practice-plans/:id/attendance
   */
  static async updateAttendance(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { attendance } = req.body;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Updating attendance for practice plan ${id} by coach ${coachId}`);

      const repository = getRepository(PracticePlan);
      const plan = await repository.findOne({
        where: { 
          id, 
          organizationId,
          coachId
        }
      });

      if (!plan) {
        return res.status(404).json({ error: 'Practice plan not found or no permission to update' });
      }

      plan.attendance = attendance;
      const updatedPlan = await repository.save(plan);

      logger.info(`Attendance updated for practice plan ${id}`);
      res.json(updatedPlan);
    } catch (error) {
      logger.error('Error updating practice attendance:', error);
      next(error);
    }
  }

  /**
   * Update player evaluations
   * PUT /api/planning/practice-plans/:id/evaluations
   */
  static async updateEvaluations(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { playerEvaluations } = req.body;
      const organizationId = req.user!.organizationId;
      const coachId = req.user!.userId;

      logger.info(`Updating evaluations for practice plan ${id} by coach ${coachId}`);

      const repository = getRepository(PracticePlan);
      const plan = await repository.findOne({
        where: { 
          id, 
          organizationId,
          coachId
        }
      });

      if (!plan) {
        return res.status(404).json({ error: 'Practice plan not found or no permission to update' });
      }

      plan.playerEvaluations = playerEvaluations;
      const updatedPlan = await repository.save(plan);

      logger.info(`Evaluations updated for practice plan ${id}`);
      res.json(updatedPlan);
    } catch (error) {
      logger.error('Error updating player evaluations:', error);
      next(error);
    }
  }

  /**
   * Get practice plan statistics
   * GET /api/planning/practice-plans/stats?teamId=xxx&startDate=xxx&endDate=xxx
   */
  static async getStats(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const { teamId, startDate, endDate } = req.query as any;
      const organizationId = req.user!.organizationId;

      logger.info(`Getting practice plan statistics for organization ${organizationId}`);

      const repository = getRepository(PracticePlan);
      const queryBuilder = repository.createQueryBuilder('plan')
        .where('plan.organizationId = :organizationId', { organizationId });

      if (teamId) {
        queryBuilder.andWhere('plan.teamId = :teamId', { teamId });
      }

      if (startDate) {
        queryBuilder.andWhere('plan.date >= :startDate', { startDate: new Date(startDate) });
      }

      if (endDate) {
        queryBuilder.andWhere('plan.date <= :endDate', { endDate: new Date(endDate) });
      }

      const plans = await queryBuilder.getMany();

      // Calculate statistics
      const stats = {
        totalPractices: plans.length,
        byStatus: {} as Record<string, number>,
        byFocus: {} as Record<string, number>,
        totalDuration: 0,
        averageDuration: 0,
        averageAttendance: 0
      };

      let totalAttendanceSum = 0;
      let practicesWithAttendance = 0;

      plans.forEach(plan => {
        // Count by status
        stats.byStatus[plan.status] = (stats.byStatus[plan.status] || 0) + 1;
        
        // Count by focus
        stats.byFocus[plan.primaryFocus] = (stats.byFocus[plan.primaryFocus] || 0) + 1;
        
        // Sum duration
        stats.totalDuration += plan.duration;
        
        // Calculate attendance
        if (plan.attendance && plan.attendance.length > 0) {
          const attendanceRate = plan.getAttendanceRate();
          totalAttendanceSum += attendanceRate;
          practicesWithAttendance++;
        }
      });

      stats.averageDuration = plans.length > 0 ? stats.totalDuration / plans.length : 0;
      stats.averageAttendance = practicesWithAttendance > 0 ? totalAttendanceSum / practicesWithAttendance : 0;

      res.json(stats);
    } catch (error) {
      logger.error('Error getting practice plan statistics:', error);
      next(error);
    }
  }
}