import { WorkoutType, MetricsConfig, EquipmentRequirement, ProgressionModel, SafetyProtocol } from '../entities/WorkoutType';
export declare class MetricsConfigDto implements MetricsConfig {
    primary: string[];
    secondary: string[];
    calculated: CalculatedMetricDto[];
}
export declare class CalculatedMetricDto {
    name: string;
    formula: string;
    unit: string;
}
export declare class EquipmentRequirementDto implements EquipmentRequirement {
    required: string[];
    alternatives: {
        [key: string]: string[];
    };
    optional: string[];
}
export declare class ProgressionLevelDto {
    duration: string;
    focus: string[];
    goals: string[];
}
export declare class ProgressionModelDto implements ProgressionModel {
    beginner: ProgressionLevelDto;
    intermediate: ProgressionLevelDto;
    advanced: ProgressionLevelDto;
    elite: ProgressionLevelDto;
}
export declare class SafetyProtocolDto implements SafetyProtocol {
    warmupRequired: boolean;
    warmupDuration: number;
    cooldownRequired: boolean;
    cooldownDuration: number;
    contraindications: string[];
    injuryPrevention: string[];
    monitoringRequired: string[];
    maxIntensity: number;
    recoveryTime: number;
}
export declare class CreateWorkoutTypeConfigDto {
    workoutType: WorkoutType;
    name: string;
    description?: string;
    metricsConfig: MetricsConfigDto;
    equipmentRequirements: EquipmentRequirementDto;
    progressionModels: ProgressionModelDto;
    safetyProtocols: SafetyProtocolDto;
    customSettings?: Record<string, any>;
}
export declare class UpdateWorkoutTypeConfigDto {
    name?: string;
    description?: string;
    metricsConfig?: MetricsConfigDto;
    equipmentRequirements?: EquipmentRequirementDto;
    progressionModels?: ProgressionModelDto;
    safetyProtocols?: SafetyProtocolDto;
    customSettings?: Record<string, any>;
    isActive?: boolean;
}
export declare class WorkoutTypeConfigResponseDto {
    id: string;
    workoutType: WorkoutType;
    organizationId: string;
    name: string;
    description?: string;
    metricsConfig: MetricsConfig;
    equipmentRequirements: EquipmentRequirement;
    progressionModels: ProgressionModel;
    safetyProtocols: SafetyProtocol;
    customSettings?: Record<string, any>;
    isActive: boolean;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
}
export declare class WorkoutTypeStatisticsDto {
    totalConfigs: number;
    activeConfigs: number;
    mostUsed: Array<{
        workoutType: WorkoutType;
        usageCount: number;
    }>;
    recentlyUpdated: WorkoutTypeConfigResponseDto[];
}
export declare class ValidateMetricsDto {
    metrics: Record<string, any>;
}
export declare class MetricsValidationResponseDto {
    valid: boolean;
    errors: string[];
}
export declare class ProgressionRecommendationDto {
    currentLevel: any;
    nextLevel: any;
    recommendations: string[];
}
//# sourceMappingURL=workout-type.dto.d.ts.map