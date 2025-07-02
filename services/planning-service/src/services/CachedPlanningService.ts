import { Logger } from '@hockey-hub/shared-lib/utils/logger';
import { CachedDrillRepository } from '../repositories/CachedDrillRepository';
import { CachedPlanRepository } from '../repositories/CachedPlanRepository';
import { CachedTemplateRepository } from '../repositories/CachedTemplateRepository';
import { DrillType, DrillDifficulty } from '../entities/Drill';
import { PlanStatus } from '../entities/TrainingPlan';
import { TemplateCategory } from '../entities/PlanTemplate';

export class CachedPlanningService {
  private logger: Logger;
  private drillRepo: CachedDrillRepository;
  private planRepo: CachedPlanRepository;
  private templateRepo: CachedTemplateRepository;

  constructor() {
    this.logger = new Logger('CachedPlanningService');
    this.drillRepo = new CachedDrillRepository();
    this.planRepo = new CachedPlanRepository();
    this.templateRepo = new CachedTemplateRepository();
  }

  // Dashboard methods optimized for different user roles
  async getCoachDashboardData(coachId: string, organizationId: string) {
    this.logger.info(`Getting coach dashboard data for coach ${coachId}`);

    const [activePlans, upcomingPractices, popularDrills, dashboardStats] = await Promise.all([
      this.planRepo.findTrainingPlansByCoach(coachId, PlanStatus.ACTIVE),
      this.planRepo.findUpcomingPractices(organizationId, 7),
      this.drillRepo.getPopularDrills(organizationId, 5),
      this.planRepo.getDashboardData(organizationId)
    ]);

    return {
      activePlans: activePlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        teamId: plan.teamId,
        progress: plan.getProgress(),
        currentPhase: plan.getCurrentPhase(this.getCurrentWeek(plan.startDate))
      })),
      upcomingPractices: upcomingPractices.map(practice => ({
        id: practice.id,
        title: practice.title,
        date: practice.date,
        teamId: practice.teamId,
        duration: practice.duration,
        primaryFocus: practice.primaryFocus
      })),
      popularDrills: popularDrills.map(drill => ({
        id: drill.id,
        name: drill.name,
        type: drill.type,
        difficulty: drill.difficulty,
        usageCount: drill.usageCount,
        rating: drill.getAverageRating()
      })),
      stats: dashboardStats
    };
  }

  async getPlayerDashboardData(playerId: string, teamId: string) {
    this.logger.info(`Getting player dashboard data for player ${playerId}`);

    const [upcomingPractices, activePlans] = await Promise.all([
      this.planRepo.findUpcomingPractices(teamId, 14),
      this.planRepo.findActiveTrainingPlans(teamId)
    ]);

    const currentPlan = activePlans[0]; // Assuming one active plan per team

    return {
      upcomingPractices: upcomingPractices.slice(0, 5).map(practice => ({
        id: practice.id,
        title: practice.title,
        date: practice.date,
        duration: practice.duration,
        location: practice.location,
        primaryFocus: practice.primaryFocus
      })),
      currentTrainingPlan: currentPlan ? {
        name: currentPlan.name,
        progress: currentPlan.getProgress(),
        currentGoals: currentPlan.goals.filter(g => !g.completed).slice(0, 3),
        focusAreas: currentPlan.focusAreas
      } : null
    };
  }

  async getAdminDashboardData(organizationId: string) {
    this.logger.info(`Getting admin dashboard data for organization ${organizationId}`);

    const [dashboardStats, templates, drills] = await Promise.all([
      this.planRepo.getDashboardData(organizationId),
      this.templateRepo.findByOrganization(organizationId, false),
      this.drillRepo.findByOrganization(organizationId, false)
    ]);

    return {
      stats: dashboardStats,
      resources: {
        totalTemplates: templates.length,
        totalDrills: drills.length,
        publicTemplates: templates.filter(t => t.isPublic).length,
        publicDrills: drills.filter(d => d.isPublic).length
      }
    };
  }

  // Drill library operations
  async searchDrills(params: {
    organizationId: string;
    type?: DrillType;
    difficulty?: DrillDifficulty;
    ageGroup?: string;
    duration?: number;
    searchText?: string;
  }) {
    return this.drillRepo.searchDrills(params);
  }

  async getDrillDetails(drillId: string) {
    const drill = await this.drillRepo.findById(drillId);
    if (drill) {
      // Increment usage count asynchronously
      this.drillRepo.incrementUsage(drillId).catch(err => 
        this.logger.error('Failed to increment drill usage:', err)
      );
    }
    return drill;
  }

  // Practice planning
  async createPracticePlan(practiceData: any) {
    const practice = await this.planRepo.createPracticePlan(practiceData);
    
    // Update drill usage counts
    if (practice.sections) {
      const drillIds = practice.sections.flatMap(s => s.drillIds);
      Promise.all(drillIds.map(id => this.drillRepo.incrementUsage(id)))
        .catch(err => this.logger.error('Failed to update drill usage:', err));
    }
    
    return practice;
  }

  async getPracticeDetails(practiceId: string) {
    const practice = await this.planRepo.findPracticePlanById(practiceId);
    
    if (practice && practice.sections) {
      // Get drill details for all drills in the practice
      const drillIds = practice.sections.flatMap(s => s.drillIds);
      const drills = await Promise.all(drillIds.map(id => this.drillRepo.findById(id)));
      
      // Attach drill details to the practice object
      const drillMap = new Map(drills.filter(d => d).map(d => [d!.id, d]));
      practice.sections.forEach(section => {
        (section as any).drills = section.drillIds.map(id => drillMap.get(id)).filter(d => d);
      });
    }
    
    return practice;
  }

  // Template operations
  async getTemplatesForOrganization(organizationId: string, category?: TemplateCategory) {
    if (category) {
      return this.templateRepo.findByCategory(category, organizationId);
    }
    return this.templateRepo.findByOrganization(organizationId);
  }

  async getPopularTemplates() {
    return this.templateRepo.getPopularTemplates(20);
  }

  async useTemplate(templateId: string, teamId: string, coachId: string) {
    const template = await this.templateRepo.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Increment template usage
    this.templateRepo.incrementUsage(templateId).catch(err =>
      this.logger.error('Failed to increment template usage:', err)
    );

    // Create a new training plan based on the template
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (template.durationWeeks * 7));

    const trainingPlan = await this.planRepo.createTrainingPlan({
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      description: template.description,
      teamId,
      coachId,
      organizationId: template.organizationId!,
      type: template.planType,
      status: PlanStatus.DRAFT,
      startDate,
      endDate,
      goals: template.goals,
      focusAreas: template.structure.phases.map(phase => ({
        area: phase.focus.join(', '),
        priority: phase.intensity === 'high' ? 'high' : phase.intensity === 'medium' ? 'medium' : 'low',
        weeklyHours: 0 // To be calculated based on practice schedule
      })),
      periodization: {
        phases: template.structure.phases.map((phase, index) => ({
          name: phase.name,
          startWeek: index === 0 ? 1 : template.structure.phases.slice(0, index).reduce((sum, p) => sum + p.weeks, 1),
          endWeek: template.structure.phases.slice(0, index + 1).reduce((sum, p) => sum + p.weeks, 0),
          intensity: phase.intensity,
          focus: phase.focus
        }))
      },
      metadata: {
        templateId: template.id,
        templateName: template.name
      }
    });

    return trainingPlan;
  }

  // Utility methods
  private getCurrentWeek(startDate: Date): number {
    const now = new Date();
    const start = new Date(startDate);
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  }

  // Analytics
  async getPlanningAnalytics(organizationId: string, startDate?: Date, endDate?: Date) {
    const [drills, templates] = await Promise.all([
      this.drillRepo.findByOrganization(organizationId, false),
      this.templateRepo.findByOrganization(organizationId, false)
    ]);

    const topDrills = drills
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    const topTemplates = templates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    const drillsByType = drills.reduce((acc, drill) => {
      acc[drill.type] = (acc[drill.type] || 0) + 1;
      return acc;
    }, {} as Record<DrillType, number>);

    const drillsByDifficulty = drills.reduce((acc, drill) => {
      acc[drill.difficulty] = (acc[drill.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<DrillDifficulty, number>);

    return {
      topDrills: topDrills.map(d => ({
        id: d.id,
        name: d.name,
        usageCount: d.usageCount,
        rating: d.getAverageRating()
      })),
      topTemplates: topTemplates.map(t => ({
        id: t.id,
        name: t.name,
        usageCount: t.usageCount,
        rating: t.getAverageRating()
      })),
      drillDistribution: {
        byType: drillsByType,
        byDifficulty: drillsByDifficulty
      },
      totalResources: {
        drills: drills.length,
        templates: templates.length
      }
    };
  }
}