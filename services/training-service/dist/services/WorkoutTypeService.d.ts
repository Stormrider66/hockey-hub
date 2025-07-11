import { Repository } from 'typeorm';
import { WorkoutTypeConfig, WorkoutType } from '../entities/WorkoutType';
import { CreateWorkoutTypeConfigDto, UpdateWorkoutTypeConfigDto, WorkoutTypeConfigResponseDto } from '../dto/workout-type.dto';
import { PaginationDto } from '@hockey-hub/shared-lib';
export declare class WorkoutTypeService {
    private workoutTypeConfigRepository;
    constructor(workoutTypeConfigRepository: Repository<WorkoutTypeConfig>);
    /**
     * Initialize default workout type configurations for an organization
     */
    initializeDefaultConfigs(organizationId: string, createdBy: string): Promise<WorkoutTypeConfigResponseDto[]>;
    /**
     * Create a custom workout type configuration
     */
    create(organizationId: string, createDto: CreateWorkoutTypeConfigDto, userId: string): Promise<WorkoutTypeConfigResponseDto>;
    /**
     * Get all workout type configurations for an organization
     */
    findAll(organizationId: string, pagination?: PaginationDto, filters?: {
        workoutType?: WorkoutType;
        isActive?: boolean;
    }): Promise<{
        items: WorkoutTypeConfigResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * Get a specific workout type configuration
     */
    findOne(organizationId: string, workoutType: WorkoutType): Promise<WorkoutTypeConfigResponseDto>;
    /**
     * Update a workout type configuration
     */
    update(organizationId: string, workoutType: WorkoutType, updateDto: UpdateWorkoutTypeConfigDto, userId: string): Promise<WorkoutTypeConfigResponseDto>;
    /**
     * Delete a workout type configuration (soft delete by deactivating)
     */
    delete(organizationId: string, workoutType: WorkoutType): Promise<void>;
    /**
     * Increment usage count for a workout type
     */
    incrementUsageCount(organizationId: string, workoutType: WorkoutType): Promise<void>;
    /**
     * Get workout type statistics
     */
    getStatistics(organizationId: string): Promise<{
        totalConfigs: number;
        activeConfigs: number;
        mostUsed: Array<{
            workoutType: WorkoutType;
            usageCount: number;
        }>;
        recentlyUpdated: WorkoutTypeConfigResponseDto[];
    }>;
    /**
     * Validate workout metrics against configuration
     */
    validateMetrics(organizationId: string, workoutType: WorkoutType, metrics: Record<string, any>): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    /**
     * Get progression recommendations based on current level
     */
    getProgressionRecommendations(organizationId: string, workoutType: WorkoutType, currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'): Promise<{
        currentLevel: any;
        nextLevel: any;
        recommendations: string[];
    }>;
    /**
     * Convert entity to response DTO
     */
    private toResponseDto;
}
//# sourceMappingURL=WorkoutTypeService.d.ts.map