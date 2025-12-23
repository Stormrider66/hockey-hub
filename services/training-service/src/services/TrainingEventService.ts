// @ts-nocheck - Training event service with event bus integration
import { Repository, DataSource } from 'typeorm';
import { getGlobalEventBus, EventFactory, Logger } from '@hockey-hub/shared-lib';
import { TrainingEventPublisher } from '../events/TrainingEventPublisher';
import { WorkoutAssignment } from '../entities/WorkoutAssignment';
import { WorkoutSession } from '../entities/WorkoutSession';
import { Exercise } from '../entities/Exercise';
import { v4 as uuidv4 } from 'uuid';

export class TrainingEventService {
  private eventPublisher: TrainingEventPublisher;
  private eventFactory: EventFactory;
  private logger: Logger;
  private workoutAssignmentRepository: Repository<WorkoutAssignment>;
  private workoutSessionRepository: Repository<WorkoutSession>;

  constructor(dataSource: DataSource) {
    this.logger = new Logger('TrainingEventService');
    
    // Initialize repositories
    this.workoutAssignmentRepository = dataSource.getRepository(WorkoutAssignment);
    this.workoutSessionRepository = dataSource.getRepository(WorkoutSession);
    
    // Initialize event system
    const eventBus = getGlobalEventBus({
      enableLogging: true,
      asyncMode: true,
      maxListeners: 100
    });
    
    this.eventFactory = new EventFactory({
      source: 'training-service',
      version: '1.0.0'
    });
    
    this.eventPublisher = new TrainingEventPublisher(eventBus, this.eventFactory);
  }

  /**
   * Set user context for events
   */
  setUserContext(userId: string, organizationId: string): void {
    this.eventFactory.setUserContext(userId, organizationId);
  }

  /**
   * Publish workout created event
   */
  async publishWorkoutCreated(
    assignment: WorkoutAssignment,
    correlationId?: string
  ): Promise<void> {
    try {
      // Load the related session template with exercises
      const session = await this.workoutSessionRepository.findOne({
        where: { id: assignment.sessionTemplateId },
        relations: ['exercises']
      });

      if (!session) {
        this.logger.warn('Session template not found for workout creation event', {
          sessionTemplateId: assignment.sessionTemplateId
        });
        return;
      }

      await this.eventPublisher.publishWorkoutCreated({
        workoutId: assignment.id,
        sessionTemplateId: assignment.sessionTemplateId,
        playerId: assignment.playerId,
        teamId: assignment.teamId,
        organizationId: assignment.organizationId,
        type: session.type as any,
        scheduledDate: assignment.scheduledDate,
        duration: session.estimatedDuration,
        exercises: session.exercises.map(ex => ({
          exerciseTemplateId: ex.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          duration: ex.duration
        }))
      }, correlationId);

      // Update assignment with event metadata
      await this.updateAssignmentEventMetadata(assignment.id, 'workout_created');
    } catch (error) {
      this.logger.error('Failed to publish workout created event', error as Error, {
        workoutId: assignment.id
      });
      throw error;
    }
  }

  /**
   * Publish workout assigned event
   */
  async publishWorkoutAssigned(
    assignment: WorkoutAssignment,
    correlationId?: string
  ): Promise<void> {
    try {
      await this.eventPublisher.publishWorkoutAssigned({
        assignmentId: assignment.id,
        workoutId: assignment.workoutSessionId,
        sessionTemplateId: assignment.sessionTemplateId,
        playerId: assignment.playerId,
        teamId: assignment.teamId,
        organizationId: assignment.organizationId,
        assignmentType: assignment.assignmentType,
        scheduledDate: assignment.scheduledDate,
        effectiveDate: assignment.effectiveDate,
        expiryDate: assignment.expiryDate,
        priority: assignment.priority,
        parentAssignmentId: assignment.parentAssignmentId
      }, correlationId);

      // Update assignment with event metadata
      await this.updateAssignmentEventMetadata(assignment.id, 'workout_assigned');
    } catch (error) {
      this.logger.error('Failed to publish workout assigned event', error as Error, {
        assignmentId: assignment.id
      });
      throw error;
    }
  }

  /**
   * Publish workout completed event
   */
  async publishWorkoutCompleted(
    assignment: WorkoutAssignment,
    performanceMetrics?: {
      averageHeartRate?: number;
      caloriesBurned?: number;
      playerLoad?: number;
    },
    correlationId?: string
  ): Promise<void> {
    try {
      const completedAt = assignment.completedAt || new Date();
      const totalDuration = Math.floor((completedAt.getTime() - assignment.startedAt!.getTime()) / 1000);

      await this.eventPublisher.publishWorkoutCompleted({
        workoutId: assignment.id,
        playerId: assignment.playerId,
        teamId: assignment.teamId,
        organizationId: assignment.organizationId,
        completedAt,
        totalDuration,
        exercisesCompleted: assignment.exercisesCompleted || 0,
        exercisesTotal: assignment.exercisesTotal || 0,
        performanceMetrics
      }, correlationId);

      // Update assignment with event metadata
      await this.updateAssignmentEventMetadata(assignment.id, 'workout_completed');
    } catch (error) {
      this.logger.error('Failed to publish workout completed event', error as Error, {
        workoutId: assignment.id
      });
      throw error;
    }
  }

  /**
   * Publish workout cancelled event
   */
  async publishWorkoutCancelled(
    assignment: WorkoutAssignment,
    cancelledBy: string,
    reason?: string,
    correlationId?: string
  ): Promise<void> {
    try {
      await this.eventPublisher.publishWorkoutCancelled({
        workoutId: assignment.id,
        playerId: assignment.playerId,
        teamId: assignment.teamId,
        organizationId: assignment.organizationId,
        reason,
        cancelledBy
      }, correlationId);

      // Update assignment with event metadata
      await this.updateAssignmentEventMetadata(assignment.id, 'workout_cancelled');
    } catch (error) {
      this.logger.error('Failed to publish workout cancelled event', error as Error, {
        workoutId: assignment.id
      });
      throw error;
    }
  }

  /**
   * Publish injury reported event
   */
  async publishInjuryReported(
    injuryData: {
      playerId: string;
      teamId: string;
      organizationId: string;
      bodyPart: string;
      severity: 'MINOR' | 'MODERATE' | 'SEVERE';
      type: string;
      occurredDuring?: string;
      workoutId?: string;
      reportedBy: string;
      estimatedRecoveryDays?: number;
    },
    correlationId?: string
  ): Promise<void> {
    try {
      const injuryId = uuidv4();
      
      await this.eventPublisher.publishInjuryReported({
        injuryId,
        ...injuryData
      }, correlationId);

      if (injuryData.workoutId) {
        await this.updateAssignmentEventMetadata(injuryData.workoutId, 'injury_reported');
      }
    } catch (error) {
      this.logger.error('Failed to publish injury reported event', error as Error);
      throw error;
    }
  }

  /**
   * Publish milestone achieved event
   */
  async publishMilestoneAchieved(
    milestoneData: {
      playerId: string;
      teamId: string;
      organizationId: string;
      type: 'PERSONAL_BEST' | 'GOAL_REACHED' | 'STREAK' | 'CONSISTENCY' | 'IMPROVEMENT';
      name: string;
      description: string;
      value?: number;
      unit?: string;
      previousValue?: number;
      relatedWorkoutId?: string;
    },
    correlationId?: string
  ): Promise<void> {
    try {
      const milestoneId = uuidv4();
      
      await this.eventPublisher.publishMilestoneAchieved({
        milestoneId,
        achievedAt: new Date(),
        ...milestoneData
      }, correlationId);

      if (milestoneData.relatedWorkoutId) {
        await this.updateAssignmentEventMetadata(milestoneData.relatedWorkoutId, 'milestone_achieved');
      }
    } catch (error) {
      this.logger.error('Failed to publish milestone achieved event', error as Error);
      throw error;
    }
  }

  /**
   * Update workout assignment with event metadata
   */
  private async updateAssignmentEventMetadata(
    assignmentId: string,
    eventType: string
  ): Promise<void> {
    try {
      const assignment = await this.workoutAssignmentRepository.findOne({
        where: { id: assignmentId }
      });

      if (!assignment) {
        this.logger.warn('Assignment not found for event metadata update', {
          assignmentId,
          eventType
        });
        return;
      }

      // Initialize event metadata if not exists
      if (!assignment.eventMetadata) {
        assignment.eventMetadata = {
          publishedEvents: []
        };
      }

      // Add event to published events
      assignment.eventMetadata.publishedEvents.push({
        type: eventType,
        publishedAt: new Date().toISOString(),
        eventId: uuidv4()
      });

      await this.workoutAssignmentRepository.save(assignment);
    } catch (error) {
      this.logger.error('Failed to update assignment event metadata', error as Error, {
        assignmentId,
        eventType
      });
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Check if an event has been published for an assignment
   */
  async hasEventBeenPublished(
    assignmentId: string,
    eventType: string
  ): Promise<boolean> {
    try {
      const assignment = await this.workoutAssignmentRepository.findOne({
        where: { id: assignmentId }
      });

      if (!assignment || !assignment.eventMetadata) {
        return false;
      }

      return assignment.eventMetadata.publishedEvents.some(
        event => event.type === eventType
      );
    } catch (error) {
      this.logger.error('Failed to check event publication status', error as Error, {
        assignmentId,
        eventType
      });
      return false;
    }
  }
}