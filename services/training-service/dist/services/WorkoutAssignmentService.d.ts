import { WorkoutAssignment } from '../entities/WorkoutAssignment';
import { WorkoutPlayerOverride } from '../entities/WorkoutPlayerOverride';
import { BaseService } from '@hockey-hub/shared-lib';
import { BulkAssignWorkoutDto, CascadeAssignmentDto, ConflictCheckDto, ResolveConflictDto, CreatePlayerOverrideDto, WorkoutAssignmentFilterDto } from '../dto';
interface ConflictInfo {
    id: string;
    playerId: string;
    playerName?: string;
    conflictType: 'scheduling' | 'medical' | 'load_limit' | 'duplicate';
    existingAssignment?: WorkoutAssignment;
    proposedAssignment: Partial<WorkoutAssignment>;
    details: {
        message: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        resolutionOptions: string[];
    };
}
interface AssignmentResult {
    created: number;
    failed: number;
    conflicts: ConflictInfo[];
    assignments: WorkoutAssignment[];
}
export declare class WorkoutAssignmentService extends BaseService<WorkoutAssignment> {
    private workoutAssignmentRepo;
    private workoutPlayerOverrideRepo;
    private workoutSessionRepo;
    private cacheService;
    private logger;
    constructor();
    /**
     * Bulk assign workouts to organization, team, or group
     */
    bulkAssign(dto: BulkAssignWorkoutDto, userId: string, organizationId: string): Promise<AssignmentResult>;
    /**
     * Cascade assignments through organizational hierarchy
     */
    cascadeAssignment(dto: CascadeAssignmentDto, userId: string, organizationId: string): Promise<AssignmentResult>;
    /**
     * Check for scheduling conflicts
     */
    checkConflicts(dto: ConflictCheckDto): Promise<ConflictInfo[]>;
    /**
     * Resolve detected conflicts
     */
    resolveConflict(dto: ResolveConflictDto, userId: string): Promise<void>;
    /**
     * Get player's assignments
     */
    getPlayerAssignments(playerId: string, filter?: WorkoutAssignmentFilterDto): Promise<WorkoutAssignment[]>;
    /**
     * Create player override
     */
    createPlayerOverride(dto: CreatePlayerOverrideDto, userId: string, assignmentId: string): Promise<WorkoutPlayerOverride>;
    private getTargetPlayerIds;
    private checkConflictsForPlayers;
    private checkSchedulingConflicts;
    private checkMedicalRestrictions;
    private checkLoadLimits;
    private createAssignment;
    private cancelAssignment;
    private rescheduleAssignment;
    private mergeAssignments;
    private findExistingAssignment;
    private getCascadeTargets;
    private clearPlayerAssignmentCache;
    private publishAssignmentCreatedEvent;
    private publishOverrideCreatedEvent;
}
export {};
//# sourceMappingURL=WorkoutAssignmentService.d.ts.map