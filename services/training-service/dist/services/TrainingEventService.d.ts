import { DataSource } from 'typeorm';
import { WorkoutAssignment } from '../entities/WorkoutAssignment';
export declare class TrainingEventService {
    private eventPublisher;
    private eventFactory;
    private logger;
    private workoutAssignmentRepository;
    private workoutSessionRepository;
    constructor(dataSource: DataSource);
    /**
     * Set user context for events
     */
    setUserContext(userId: string, organizationId: string): void;
    /**
     * Publish workout created event
     */
    publishWorkoutCreated(assignment: WorkoutAssignment, correlationId?: string): Promise<void>;
    /**
     * Publish workout assigned event
     */
    publishWorkoutAssigned(assignment: WorkoutAssignment, correlationId?: string): Promise<void>;
    /**
     * Publish workout completed event
     */
    publishWorkoutCompleted(assignment: WorkoutAssignment, performanceMetrics?: {
        averageHeartRate?: number;
        caloriesBurned?: number;
        playerLoad?: number;
    }, correlationId?: string): Promise<void>;
    /**
     * Publish workout cancelled event
     */
    publishWorkoutCancelled(assignment: WorkoutAssignment, cancelledBy: string, reason?: string, correlationId?: string): Promise<void>;
    /**
     * Publish injury reported event
     */
    publishInjuryReported(injuryData: {
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
    }, correlationId?: string): Promise<void>;
    /**
     * Publish milestone achieved event
     */
    publishMilestoneAchieved(milestoneData: {
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
    }, correlationId?: string): Promise<void>;
    /**
     * Update workout assignment with event metadata
     */
    private updateAssignmentEventMetadata;
    /**
     * Check if an event has been published for an assignment
     */
    hasEventBeenPublished(assignmentId: string, eventType: string): Promise<boolean>;
}
//# sourceMappingURL=TrainingEventService.d.ts.map