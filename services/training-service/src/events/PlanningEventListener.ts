// @ts-nocheck - Planning event listener with event bus
import { EventEmitter } from 'events';
import { DataSource } from 'typeorm';
import { PlanningIntegrationService } from '../services/PlanningIntegrationService';
import { getGlobalEventBus } from '@hockey-hub/shared-lib';

export interface PlanningPhaseChangeEvent {
  teamId: string;
  oldPhaseId?: string;
  newPhaseId: string;
  phaseStartDate: Date;
  phaseEndDate: Date;
  autoApplyAdjustments: boolean;
  triggeredBy: string;
}

export interface SeasonPlanUpdateEvent {
  teamId: string;
  seasonPlanId: string;
  updatedPhases: string[];
  updateType: 'phase_added' | 'phase_modified' | 'phase_removed' | 'schedule_adjusted';
  triggeredBy: string;
}

export interface WorkloadThresholdEvent {
  teamId: string;
  playerId: string;
  thresholdType: 'high_load' | 'recovery_needed' | 'injury_risk';
  currentValue: number;
  thresholdValue: number;
  recommendedAdjustment: {
    type: 'reduce_load' | 'increase_recovery' | 'skip_training';
    magnitude: number;
  };
}

export interface PhaseTemplateAppliedEvent {
  teamId: string;
  templateId: string;
  phaseId: string;
  appliedBy: string;
  assignmentsCreated: number;
  adjustmentsApplied: number;
}

export class PlanningEventListener {
  private planningIntegrationService: PlanningIntegrationService;
  private eventBus: EventEmitter;

  constructor(private dataSource: DataSource) {
    this.planningIntegrationService = new PlanningIntegrationService(dataSource);
    this.eventBus = getGlobalEventBus();
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for planning phase changes
    this.eventBus.on('planning.phase.changed', this.handlePhaseChange.bind(this));
    
    // Listen for season plan updates
    this.eventBus.on('planning.season_plan.updated', this.handleSeasonPlanUpdate.bind(this));
    
    // Listen for workload threshold breaches
    this.eventBus.on('planning.workload.threshold_breach', this.handleWorkloadThreshold.bind(this));
    
    // Listen for phase template applications
    this.eventBus.on('planning.template.applied', this.handlePhaseTemplateApplied.bind(this));
    
    // Listen for load management recommendations
    this.eventBus.on('planning.load_management.recommendation', this.handleLoadManagementRecommendation.bind(this));
  }

  /**
   * Handle planning phase changes
   */
  private async handlePhaseChange(event: PlanningPhaseChangeEvent): Promise<void> {
    console.log(`Received phase change event for team ${event.teamId}:`, event);

    try {
      if (event.autoApplyAdjustments) {
        // Automatically apply phase adjustments
        const adjustments = await this.planningIntegrationService.applyPhaseAdjustments(
          event.teamId,
          event.newPhaseId
        );

        console.log(`Applied ${adjustments.length} automatic phase adjustments for team ${event.teamId}`);

        // Emit completion event
        this.eventBus.emit('training.phase_adjustments.applied', {
          teamId: event.teamId,
          phaseId: event.newPhaseId,
          adjustmentsCount: adjustments.length,
          triggeredBy: 'planning_phase_change',
          timestamp: new Date()
        });
      } else {
        // Just sync the phase data without applying adjustments
        await this.planningIntegrationService.syncPhaseUpdates(event.teamId);
        
        console.log(`Synced phase data for team ${event.teamId} without applying adjustments`);
      }
    } catch (error) {
      console.error(`Failed to handle phase change for team ${event.teamId}:`, error);
      
      // Emit error event
      this.eventBus.emit('training.phase_change.error', {
        teamId: event.teamId,
        phaseId: event.newPhaseId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle season plan updates
   */
  private async handleSeasonPlanUpdate(event: SeasonPlanUpdateEvent): Promise<void> {
    console.log(`Received season plan update for team ${event.teamId}:`, event);

    try {
      // Sync phase updates for affected phases
      const syncResult = await this.planningIntegrationService.syncPhaseUpdates(event.teamId);

      if (syncResult.errors.length > 0) {
        console.warn(`Season plan sync completed with errors for team ${event.teamId}:`, syncResult.errors);
      } else {
        console.log(`Successfully synced season plan updates for team ${event.teamId}`);
      }

      // Emit sync completion event
      this.eventBus.emit('training.season_plan.synced', {
        teamId: event.teamId,
        seasonPlanId: event.seasonPlanId,
        updatedAssignments: syncResult.updatedAssignments,
        newAdjustments: syncResult.newAdjustments,
        errors: syncResult.errors,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`Failed to handle season plan update for team ${event.teamId}:`, error);
      
      // Emit error event
      this.eventBus.emit('training.season_plan.sync_error', {
        teamId: event.teamId,
        seasonPlanId: event.seasonPlanId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle workload threshold breaches
   */
  private async handleWorkloadThreshold(event: WorkloadThresholdEvent): Promise<void> {
    console.log(`Received workload threshold breach for player ${event.playerId}:`, event);

    try {
      // Apply recommended adjustments based on threshold type
      await this.applyWorkloadAdjustments(event);

      // Emit adjustment applied event
      this.eventBus.emit('training.workload_adjustment.applied', {
        teamId: event.teamId,
        playerId: event.playerId,
        thresholdType: event.thresholdType,
        adjustmentApplied: event.recommendedAdjustment,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`Failed to handle workload threshold for player ${event.playerId}:`, error);
      
      // Emit error event
      this.eventBus.emit('training.workload_adjustment.error', {
        teamId: event.teamId,
        playerId: event.playerId,
        thresholdType: event.thresholdType,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle phase template applications
   */
  private async handlePhaseTemplateApplied(event: PhaseTemplateAppliedEvent): Promise<void> {
    console.log(`Received phase template applied event for team ${event.teamId}:`, event);

    try {
      // Sync any additional adjustments needed
      await this.planningIntegrationService.syncPhaseUpdates(event.teamId);

      // Emit confirmation event
      this.eventBus.emit('training.phase_template.processed', {
        teamId: event.teamId,
        templateId: event.templateId,
        phaseId: event.phaseId,
        assignmentsCreated: event.assignmentsCreated,
        adjustmentsApplied: event.adjustmentsApplied,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`Failed to process phase template application for team ${event.teamId}:`, error);
    }
  }

  /**
   * Handle load management recommendations
   */
  private async handleLoadManagementRecommendation(event: any): Promise<void> {
    console.log(`Received load management recommendation:`, event);

    try {
      // Process load management recommendations
      // This could involve adjusting upcoming workout assignments
      // based on AI or coach recommendations from the planning service
      
      const { teamId, recommendations } = event;
      
      for (const recommendation of recommendations) {
        await this.applyLoadManagementRecommendation(teamId, recommendation);
      }

      // Emit completion event
      this.eventBus.emit('training.load_management.applied', {
        teamId,
        recommendationsApplied: recommendations.length,
        timestamp: new Date()
      });
    } catch (error) {
      console.error(`Failed to handle load management recommendation:`, error);
    }
  }

  /**
   * Apply workload adjustments based on threshold breach
   */
  private async applyWorkloadAdjustments(event: WorkloadThresholdEvent): Promise<void> {
    const { teamId, playerId, recommendedAdjustment } = event;
    
    // Implementation would modify upcoming workout assignments
    // based on the recommended adjustment type and magnitude
    
    // This is a simplified implementation - actual logic would be more complex
    switch (recommendedAdjustment.type) {
      case 'reduce_load':
        console.log(`Reducing load by ${recommendedAdjustment.magnitude}% for player ${playerId}`);
        // Reduce load multiplier for upcoming assignments
        break;
        
      case 'increase_recovery':
        console.log(`Increasing recovery time by ${recommendedAdjustment.magnitude} hours for player ${playerId}`);
        // Add recovery sessions or adjust scheduling
        break;
        
      case 'skip_training':
        console.log(`Recommending to skip next ${recommendedAdjustment.magnitude} training sessions for player ${playerId}`);
        // Mark specific assignments as optional or cancelled
        break;
    }
  }

  /**
   * Apply load management recommendation
   */
  private async applyLoadManagementRecommendation(teamId: string, recommendation: any): Promise<void> {
    // Implementation would apply specific load management adjustments
    // based on the recommendation type and data
    console.log(`Applying load management recommendation for team ${teamId}:`, recommendation);
  }

  /**
   * Cleanup event listeners
   */
  public destroy(): void {
    this.eventBus.removeAllListeners('planning.phase.changed');
    this.eventBus.removeAllListeners('planning.season_plan.updated');
    this.eventBus.removeAllListeners('planning.workload.threshold_breach');
    this.eventBus.removeAllListeners('planning.template.applied');
    this.eventBus.removeAllListeners('planning.load_management.recommendation');
  }
}