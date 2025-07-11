import { DataSource } from 'typeorm';
import { WorkoutPlayerOverride } from '../entities/WorkoutPlayerOverride';
import { SyncMedicalRestrictionsDTO, ComplianceCheckDTO, ComplianceResultDTO, ReportMedicalConcernDTO, GetAlternativesDTO, AlternativesResultDTO, CreateMedicalOverrideDTO } from '../dto/medical-integration.dto';
export declare class MedicalIntegrationService {
    private dataSource;
    private overrideRepository;
    private assignmentRepository;
    private exerciseRepository;
    private medicalServiceClient;
    private cacheService;
    private readonly CACHE_TTL;
    private readonly CACHE_PREFIX;
    constructor(dataSource: DataSource, medicalServiceUrl?: string);
    private setupEventListeners;
    syncMedicalRestrictions(dto: SyncMedicalRestrictionsDTO): Promise<{
        synced: number;
        created: number;
        updated: number;
    }>;
    private fetchMedicalRestrictions;
    private createOrUpdateMedicalOverride;
    private generateModifications;
    private findExercisesToExclude;
    checkSessionCompliance(dto: ComplianceCheckDTO): Promise<ComplianceResultDTO>;
    private checkPlayerCompliance;
    private mapOverrideToRestriction;
    private checkExerciseViolations;
    reportMedicalConcern(dto: ReportMedicalConcernDTO): Promise<{
        concernId: string;
        status: string;
    }>;
    getExerciseAlternatives(dto: GetAlternativesDTO): Promise<AlternativesResultDTO>;
    private getPlayerActiveRestrictions;
    private generateAlternativesForExercise;
    private checkIfExerciseProhibited;
    private findSafeAlternatives;
    private calculateSuitabilityScore;
    private generateAlternativeReason;
    private generateExerciseModifications;
    private generateModificationsList;
    private calculateLoadAdjustment;
    private calculateLoadMultiplier;
    private calculateRestAdjustment;
    private calculateRestMultiplier;
    private generateGeneralRecommendations;
    private mapSeverityToPriority;
    private mapPriorityToSeverity;
    private handleMedicalRestrictionEvent;
    private handleMedicalRestrictionCleared;
    private handleInjuryReported;
    private clearPlayerCache;
    createMedicalOverride(dto: CreateMedicalOverrideDTO): Promise<WorkoutPlayerOverride>;
}
//# sourceMappingURL=MedicalIntegrationService.d.ts.map