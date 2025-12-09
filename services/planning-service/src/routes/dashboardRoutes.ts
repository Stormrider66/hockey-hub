import { Router, Request, Response, NextFunction } from 'express';
import { CachedPlanningService } from '../services/CachedPlanningService';
import { createAuthMiddleware } from '@hockey-hub/shared-lib/middleware';
import { Logger } from '@hockey-hub/shared-lib/dist/utils/Logger';
import { validateBody, validateQuery } from '@hockey-hub/shared-lib/middleware';
import { IsArray, IsDateString, IsInt, IsOptional, IsString, Min, ValidateNested, ArrayMinSize, IsISO8601, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { TemplateCategory } from '../entities/PlanTemplate';
import rateLimit from 'express-rate-limit';
import { conditionalSend, computeEtag, getLastModified, shouldReturnNotModified } from '../utils/httpCache';
import { createPaginationResponse } from '@hockey-hub/shared-lib/dist/types/pagination';
import type { Router as ExpressRouter } from 'express';

const router: ExpressRouter = Router();
const planningService = new CachedPlanningService();
// DTOs for validation
class PracticeSectionDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  duration!: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  drillIds!: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];
}

class CreatePracticeDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  teamId!: string;

  @IsDateString()
  date!: string;

  @IsInt()
  @Min(1)
  duration!: number;

  @IsString()
  primaryFocus!: string;

  @ValidateNested({ each: true })
  @Type(() => PracticeSectionDto)
  @ArrayMinSize(1)
  sections!: PracticeSectionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];
}

class UpdatePracticeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  primaryFocus?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PracticeSectionDto)
  sections?: PracticeSectionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];
}

class DrillsSearchQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  ageGroup?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['rating', 'usageCount', 'name', 'duration'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}

class TemplatesQueryDto {
  @IsOptional()
  @IsIn(Object.values(TemplateCategory))
  category?: TemplateCategory;

  @IsOptional()
  @IsIn(['usageCount', 'rating', 'durationWeeks', 'name'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}

class AnalyticsQueryDto {
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;
}

class UpcomingPracticesQueryDto {
  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}

class PopularQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

class UseTemplateDto {
  @IsString()
  teamId!: string;
}
const logger = new Logger('PlanningDashboardRoutes');

// Auth setup: extract user from forwarded headers and require authentication
const auth = createAuthMiddleware();
router.use(auth.extractUser());
router.use(auth.requireAuth());

// Basic rate limiting for heavy endpoints
const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});


// shouldReturnNotModified is now imported from '../utils/httpCache'

// Coach dashboard planning data
router.get('/dashboard/coach', async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const coachId = req.user!.userId;
    const organizationId = req.user!.organizationId as string;
    const data = await planningService.getCoachDashboardData(coachId, organizationId);
    return conditionalSend(req as any, res, data, data, 'private, max-age=30, stale-while-revalidate=60');
  } catch (error) {
    logger.error('Error getting coach dashboard data:', error);
    return next(error);
  }
});

// Player dashboard planning data
router.get('/dashboard/player', async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const playerId = req.user!.userId;
    const teamId = (Array.isArray(req.user!.teamIds) ? req.user!.teamIds[0] : undefined) || (req.query.teamId as string);
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID required' });
    }
    
    const data = await planningService.getPlayerDashboardData(playerId, teamId);
    return conditionalSend(req as any, res, data, data, 'private, max-age=30, stale-while-revalidate=60');
  } catch (error) {
    logger.error('Error getting player dashboard data:', error);
    return next(error);
  }
});

// Admin dashboard planning data
router.get('/dashboard/admin', async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user!.organizationId as string;
    const data = await planningService.getAdminDashboardData(organizationId);
    return conditionalSend(req as any, res, data, data, 'private, max-age=30, stale-while-revalidate=60');
  } catch (error) {
    logger.error('Error getting admin dashboard data:', error);
    return next(error);
  }
});

// Search drills
router.get('/drills/search', heavyLimiter, validateQuery(DrillsSearchQueryDto, { whitelist: true, forbidNonWhitelisted: true }), async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const { type, difficulty, ageGroup, duration, search, sortBy, order, page, pageSize } = req.query as any;
    const organizationId = req.user!.organizationId as string;
    
    let drills = await planningService.searchDrills({
      organizationId,
      type: type as any,
      difficulty: difficulty as any,
      ageGroup: ageGroup as string,
      duration: duration ? parseInt(duration as string) : undefined,
      searchText: search as string
    });
    // Cache hints for proxies/clients
    res.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=60');
    // Optional sorting/pagination at route layer
    if (sortBy) {
      const dir = (String(order || 'desc').toLowerCase() === 'asc') ? 1 : -1;
      drills = drills.sort((a: any, b: any) => {
        const av = a[sortBy as string];
        const bv = b[sortBy as string];
        if (av === bv) return 0;
        return av > bv ? dir : -dir;
      });
    }
    const p = Number(page || 1);
    const ps = Number(pageSize || 20);
    const total = drills.length;
    if (p > 0 && ps > 0) {
      const start = (p - 1) * ps;
      drills = drills.slice(start, start + ps);
    }
    const body = createPaginationResponse(drills, p, ps, total);
    return conditionalSend(req as any, res, body, drills, 'private, max-age=60, stale-while-revalidate=60');
  } catch (error) {
    logger.error('Error searching drills:', error);
    return next(error);
  }
});

// Get popular drills
router.get('/drills/popular', heavyLimiter, validateQuery(PopularQueryDto, { whitelist: true, forbidNonWhitelisted: true }), async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user!.organizationId as string;
    const drills = await planningService.searchDrills({ organizationId });
    
    // Sort by usage and return top 10
    const lim = Math.max(1, Math.min(100, Number((req.query as any)?.limit || 10)));
    const popular = drills
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, lim);
    
    const body = createPaginationResponse(popular, 1, popular.length, popular.length);
    return conditionalSend(req as any, res, body, popular, 'public, max-age=300, stale-while-revalidate=300');
  } catch (error) {
    logger.error('Error getting popular drills:', error);
    return next(error);
  }
});

// Get drill details
router.get('/drills/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const drill = await planningService.getDrillDetails(id);
    
    if (!drill) {
      return res.status(404).json({ error: 'Drill not found' });
    }
    const etag = computeEtag(drill);
    const lastMod = getLastModified(drill);
    res.set('ETag', etag);
    res.set('Last-Modified', lastMod.toUTCString());
    if (shouldReturnNotModified(req as any, etag, lastMod)) {
      return res.status(304).end();
    }
    return res.json(drill);
  } catch (error) {
    logger.error('Error getting drill details:', error);
    return next(error);
  }
});

// Get templates
router.get('/templates', heavyLimiter, validateQuery(TemplatesQueryDto, { whitelist: true, forbidNonWhitelisted: true }), async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const { category, sortBy, order, page, pageSize } = req.query as any;
    const organizationId = req.user!.organizationId as string;
    
    let templates = await planningService.getTemplatesForOrganization(
      organizationId, 
      category as any
    );
    res.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=120');
    if (sortBy) {
      const dir = (String(order || 'desc').toLowerCase() === 'asc') ? 1 : -1;
      templates = templates.sort((a: any, b: any) => {
        const av = a[sortBy as string];
        const bv = b[sortBy as string];
        if (av === bv) return 0;
        return av > bv ? dir : -dir;
      });
    }
    const p = Number(page || 1);
    const ps = Number(pageSize || 20);
    const total = templates.length;
    if (p > 0 && ps > 0) {
      const start = (p - 1) * ps;
      templates = templates.slice(start, start + ps);
    }
    const body = createPaginationResponse(templates, p, ps, total);
    return conditionalSend(req as any, res, body, templates, 'private, max-age=120, stale-while-revalidate=120');
  } catch (error) {
    logger.error('Error getting templates:', error);
    return next(error);
  }
});

// Get popular templates
router.get('/templates/popular', heavyLimiter, validateQuery(PopularQueryDto, { whitelist: true, forbidNonWhitelisted: true }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lim = Math.max(1, Math.min(100, Number((req.query as any)?.limit || 10)));
    const templates = (await planningService.getPopularTemplates()).slice(0, lim);
    const body = createPaginationResponse(templates, 1, templates.length, templates.length);
    return conditionalSend(req as any, res, body, templates, 'public, max-age=300, stale-while-revalidate=300');
  } catch (error) {
    logger.error('Error getting popular templates:', error);
    return next(error);
  }
});

// Get template details (from repository)
router.get('/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as any;
    const { CachedTemplateRepository } = await import('../repositories/CachedTemplateRepository');
    const template = await new CachedTemplateRepository().findById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    const etag = computeEtag(template);
    const lastMod = getLastModified(template);
    res.set('ETag', etag);
    res.set('Last-Modified', lastMod.toUTCString());
    if (shouldReturnNotModified(req as any, etag, lastMod)) {
      return res.status(304).end();
    }
    return res.json(template);
  } catch (error) {
    logger.error('Error getting template details:', error);
    return next(error);
  }
});

// Use template to create plan
router.post('/templates/:id/use', validateBody(UseTemplateDto, { whitelist: true, forbidNonWhitelisted: true }), async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { teamId } = req.body as UseTemplateDto;
    const coachId = req.user!.userId;
    
    const plan = await planningService.useTemplate(id, teamId, coachId);
    return res.json(plan);
  } catch (error) {
    logger.error('Error using template:', error);
    return next(error);
  }
});

// Get practice details
router.get('/practices/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const practice = await planningService.getPracticeDetails(id);
    
    if (!practice) {
      return res.status(404).json({ error: 'Practice not found' });
    }
    
    return res.json(practice);
  } catch (error) {
    logger.error('Error getting practice details:', error);
    return next(error);
  }
});

// Create practice plan
router.post('/practices', validateBody(CreatePracticeDto, { whitelist: true, forbidNonWhitelisted: true }), async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user!.organizationId as string;
    const coachId = req.user!.userId as string;
    const { title, description, teamId, date, duration, primaryFocus, sections, equipment } = req.body as CreatePracticeDto;

    const practice = await planningService.createPracticePlan({
      title,
      description,
      organizationId,
      teamId,
      coachId,
      date: new Date(date),
      duration,
      primaryFocus,
      sections,
      equipment
    });

    return res.json(practice);
  } catch (error) {
    logger.error('Error creating practice plan:', error);
    return next(error);
  }
});

// Update practice plan
router.put('/practices/:id', validateBody(UpdatePracticeDto, { whitelist: true, forbidNonWhitelisted: true, skipMissingProperties: true }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const updated = await planningService.updatePracticePlan(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Practice not found' });
    }
    return res.json(updated);
  } catch (error) {
    logger.error('Error updating practice plan:', error);
    return next(error);
  }
});

// Get planning analytics
router.get('/analytics', heavyLimiter, validateQuery(AnalyticsQueryDto, { whitelist: true, forbidNonWhitelisted: true }), async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user!.organizationId as string;
    const { startDate, endDate } = req.query;
    
    const analytics = await planningService.getPlanningAnalytics(
      organizationId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=60');
    
    return res.json(analytics);
  } catch (error) {
    logger.error('Error getting planning analytics:', error);
    return next(error);
  }
});

// Upcoming practices for a team
router.get('/practices', heavyLimiter, validateQuery(UpcomingPracticesQueryDto, { whitelist: true, forbidNonWhitelisted: true }), async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const { teamId: qTeamId, days: qDays, order, page, pageSize } = req.query as any;
    const teamId = (Array.isArray(req.user!.teamIds) ? req.user!.teamIds[0] : undefined) || qTeamId;
    const days = (qDays ? Number(qDays) : 7) as number;
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID required' });
    }
    let practices = await planningService.getUpcomingPractices(teamId, days);
    // Sort by date
    const ord = String(order || 'asc').toLowerCase();
    practices = practices.sort((a: any, b: any) => {
      const at = new Date(a.date).getTime();
      const bt = new Date(b.date).getTime();
      return ord === 'desc' ? bt - at : at - bt;
    });
    const p = Number(page || 1);
    const ps = Number(pageSize || 20);
    const total = practices.length;
    if (p > 0 && ps > 0) {
      const start = (p - 1) * ps;
      practices = practices.slice(start, start + ps);
    }
    const body = createPaginationResponse(practices, p, ps, total);
    return conditionalSend(req as any, res, body, practices, 'private, max-age=30, stale-while-revalidate=30');
  } catch (error) {
    logger.error('Error getting upcoming practices:', error);
    return next(error);
  }
});

export default router;