/**
 * Example of how to consume training events in other services
 * This file demonstrates best practices for event consumption
 */

import { getGlobalEventBus } from './EventBus';
import { createTrainingEventListeners } from './training-event-listeners';
import { Logger } from '../utils/Logger';

export class ExampleTrainingEventConsumer {
  private listeners: ReturnType<typeof createTrainingEventListeners>;
  private logger: Logger;

  constructor() {
    const eventBus = getGlobalEventBus();
    this.listeners = createTrainingEventListeners(eventBus);
    this.logger = new Logger('ExampleTrainingEventConsumer');
  }

  /**
   * Initialize event listeners
   */
  initialize(): void {
    // Listen to workout completed events
    this.listeners.onWorkoutCompleted(async (event) => {
      this.logger.info('Workout completed event received', {
        workoutId: event.data.workoutId,
        playerId: event.data.playerId,
        completionRate: event.data.exercisesCompleted / event.data.exercisesTotal
      });

      // Example: Update player statistics
      try {
        // await this.updatePlayerStats(event.data.playerId, event.data);
        this.logger.info('Player statistics updated', { playerId: event.data.playerId });
      } catch (error) {
        this.logger.error('Failed to update player statistics', error as Error);
      }
    });

    // Listen to injury reported events
    this.listeners.onInjuryReported(async (event) => {
      this.logger.warn('Injury reported', {
        injuryId: event.data.injuryId,
        playerId: event.data.playerId,
        severity: event.data.severity,
        bodyPart: event.data.bodyPart
      });

      // Example: Send notification to medical staff
      try {
        // await this.notifyMedicalStaff(event.data);
        this.logger.info('Medical staff notified', { injuryId: event.data.injuryId });
      } catch (error) {
        this.logger.error('Failed to notify medical staff', error as Error);
      }
    });

    // Listen to milestone achieved events
    this.listeners.onMilestoneAchieved(async (event) => {
      this.logger.info('Milestone achieved!', {
        milestoneId: event.data.milestoneId,
        playerId: event.data.playerId,
        type: event.data.type,
        name: event.data.name
      });

      // Example: Create achievement notification
      try {
        // await this.createAchievementNotification(event.data);
        this.logger.info('Achievement notification created', { 
          playerId: event.data.playerId,
          milestone: event.data.name 
        });
      } catch (error) {
        this.logger.error('Failed to create achievement notification', error as Error);
      }
    });

    // Listen to plan completed events
    this.listeners.onPlanCompleted(async (event) => {
      this.logger.info('Training plan completed', {
        planId: event.data.planId,
        completionRate: event.data.sessionsCompleted / event.data.sessionsTotal,
        goalsAchieved: event.data.goalsAchieved.length
      });

      // Example: Generate completion report
      try {
        // await this.generateCompletionReport(event.data);
        this.logger.info('Completion report generated', { planId: event.data.planId });
      } catch (error) {
        this.logger.error('Failed to generate completion report', error as Error);
      }
    });

    // Listen to all training events for audit logging
    this.listeners.onAnyTrainingEvent(async (event) => {
      this.logger.audit('Training event', 'training', {
        type: event.type,
        eventId: event.metadata.eventId,
        correlationId: event.metadata.correlationId,
        userId: event.metadata.userId,
        organizationId: event.metadata.organizationId,
        timestamp: event.metadata.timestamp
      });
    });

    this.logger.info('Training event consumer initialized');
  }

  /**
   * Clean up event listeners
   */
  shutdown(): void {
    this.listeners.unsubscribeAll();
    this.logger.info('Training event consumer shut down');
  }
}

// Example usage in a service:
/*
// In calendar-service/src/index.ts
import { ExampleTrainingEventConsumer } from '@hockey-hub/shared-lib';

const trainingEventConsumer = new ExampleTrainingEventConsumer();

// Initialize during service startup
trainingEventConsumer.initialize();

// Clean up during service shutdown
process.on('SIGTERM', () => {
  trainingEventConsumer.shutdown();
});
*/