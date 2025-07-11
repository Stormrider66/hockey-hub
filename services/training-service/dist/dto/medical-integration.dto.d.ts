export declare enum RestrictionSeverity {
    MILD = "mild",
    MODERATE = "moderate",
    SEVERE = "severe",
    COMPLETE = "complete"
}
export declare enum RestrictionStatus {
    ACTIVE = "active",
    PENDING = "pending",
    EXPIRED = "expired",
    CLEARED = "cleared"
}
export declare enum ComplianceStatus {
    COMPLIANT = "compliant",
    PARTIAL = "partial",
    NON_COMPLIANT = "non_compliant",
    NOT_APPLICABLE = "not_applicable"
}
export declare class MedicalRestrictionDTO {
    id: string;
    playerId: string;
    severity: RestrictionSeverity;
    status: RestrictionStatus;
    affectedBodyParts: string[];
    restrictedMovements: string[];
    restrictedExerciseTypes: string[];
    maxExertionLevel: number;
    requiresSupervision: boolean;
    clearanceRequired: boolean;
    effectiveDate: Date;
    expiryDate?: Date;
    medicalNotes?: string;
    prescribedBy: string;
    prescribedAt: Date;
}
export declare class SyncMedicalRestrictionsDTO {
    organizationId: string;
    teamId?: string;
    playerIds?: string[];
    fromDate?: Date;
    includeExpired?: boolean;
}
export declare class ComplianceCheckDTO {
    sessionId: string;
    playerId?: string;
    detailed?: boolean;
}
export declare class ComplianceResultDTO {
    sessionId: string;
    overallStatus: ComplianceStatus;
    checkedAt: Date;
    playerCompliance: Array<{
        playerId: string;
        status: ComplianceStatus;
        restrictions: MedicalRestrictionDTO[];
        violations: Array<{
            restrictionId: string;
            exerciseId: string;
            violationType: 'movement' | 'intensity' | 'duration' | 'supervision';
            description: string;
            severity: RestrictionSeverity;
        }>;
        recommendations: string[];
    }>;
    requiresApproval: boolean;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: Date;
}
export declare class ReportMedicalConcernDTO {
    playerId: string;
    sessionId?: string;
    exerciseId?: string;
    concernType: 'injury' | 'discomfort' | 'fatigue' | 'technique' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedBodyParts?: string[];
    requiresImmediateAttention?: boolean;
    reportedBy: string;
    occurredAt: Date;
}
export declare class AlternativeExerciseDTO {
    originalExerciseId: string;
    alternativeExerciseId: string;
    reason: string;
    loadMultiplier: number;
    restMultiplier: number;
    modifications: string[];
    requiresSupervision: boolean;
    suitabilityScore: number;
}
export declare class GetAlternativesDTO {
    playerId: string;
    exerciseIds?: string[];
    workoutId?: string;
    includeRationale?: boolean;
}
export declare class AlternativesResultDTO {
    playerId: string;
    restrictions: MedicalRestrictionDTO[];
    alternatives: Array<{
        originalExercise: {
            id: string;
            name: string;
            category: string;
            primaryMuscles: string[];
            equipment: string[];
        };
        suggestedAlternatives: AlternativeExerciseDTO[];
        cannotPerform: boolean;
        requiresApproval: boolean;
    }>;
    generalRecommendations: string[];
    loadAdjustment: number;
    restAdjustment: number;
}
export declare class MedicalSyncEventDTO {
    eventType: 'restriction_added' | 'restriction_updated' | 'restriction_cleared' | 'concern_reported';
    playerId: string;
    restrictionId?: string;
    concernId?: string;
    timestamp: Date;
    details: any;
}
export declare class CreateMedicalOverrideDTO {
    workoutAssignmentId: string;
    playerId: string;
    medicalRecordId: string;
    restriction: MedicalRestrictionDTO;
    alternatives: AlternativeExerciseDTO[];
    autoApprove?: boolean;
    notes?: string;
}
//# sourceMappingURL=medical-integration.dto.d.ts.map