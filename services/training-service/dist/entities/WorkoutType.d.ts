import { Organization } from './Organization';
export declare enum WorkoutType {
    STRENGTH = "STRENGTH",
    CARDIO = "CARDIO",
    AGILITY = "AGILITY",
    FLEXIBILITY = "FLEXIBILITY",
    POWER = "POWER",
    ENDURANCE = "ENDURANCE",
    RECOVERY = "RECOVERY",
    REHABILITATION = "REHABILITATION",
    SPORT_SPECIFIC = "SPORT_SPECIFIC",
    MENTAL = "MENTAL"
}
export interface MetricsConfig {
    primary: string[];
    secondary: string[];
    calculated: {
        name: string;
        formula: string;
        unit: string;
    }[];
}
export interface EquipmentRequirement {
    required: string[];
    alternatives: {
        [key: string]: string[];
    };
    optional: string[];
}
export interface ProgressionModel {
    beginner: {
        duration: string;
        focus: string[];
        goals: string[];
    };
    intermediate: {
        duration: string;
        focus: string[];
        goals: string[];
    };
    advanced: {
        duration: string;
        focus: string[];
        goals: string[];
    };
    elite: {
        duration: string;
        focus: string[];
        goals: string[];
    };
}
export interface SafetyProtocol {
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
export declare class WorkoutTypeConfig {
    id: string;
    workoutType: WorkoutType;
    organizationId: string;
    organization: Organization;
    name: string;
    description: string;
    metricsConfig: MetricsConfig;
    equipmentRequirements: EquipmentRequirement;
    progressionModels: ProgressionModel;
    safetyProtocols: SafetyProtocol;
    customSettings: Record<string, any>;
    isActive: boolean;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}
export declare const defaultWorkoutTypeConfigs: Record<WorkoutType, Partial<WorkoutTypeConfig>>;
//# sourceMappingURL=WorkoutType.d.ts.map