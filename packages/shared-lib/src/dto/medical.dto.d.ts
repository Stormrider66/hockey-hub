export declare enum RecoveryStatus {
    ACTIVE = "active",
    RECOVERING = "recovering",
    RECOVERED = "recovered"
}
export declare class CreateInjuryDto {
    playerId: number;
    injuryType: string;
    injuryDate: string;
    recoveryStatus?: RecoveryStatus;
    expectedReturnDate?: string;
    notes?: string;
    severityLevel: number;
    bodyPart: string;
    mechanismOfInjury?: string;
    isActive?: boolean;
}
export declare class UpdateInjuryDto {
    injuryType?: string;
    injuryDate?: string;
    recoveryStatus?: RecoveryStatus;
    expectedReturnDate?: string;
    notes?: string;
    severityLevel?: number;
    bodyPart?: string;
    mechanismOfInjury?: string;
    isActive?: boolean;
}
export declare class CreateWellnessEntryDto {
    playerId?: number;
    entryDate: string;
    sleepHours: number;
    sleepQuality: number;
    energyLevel: number;
    stressLevel: number;
    sorenessLevel: number;
    hydrationLevel: number;
    nutritionQuality: number;
    moodRating: number;
    restingHeartRate?: number;
    hrvScore?: number;
    bodyWeight?: number;
    notes?: string;
    painAreas?: string[];
    medications?: string[];
}
export declare class CreatePlayerAvailabilityDto {
    playerId: number;
    startDate: string;
    endDate?: string;
    status: 'available' | 'injured' | 'suspended' | 'sick' | 'personal';
    reason?: string;
    injuryId?: number;
    notes?: string;
}
export declare class UpdatePlayerAvailabilityDto {
    startDate?: string;
    endDate?: string;
    status?: 'available' | 'injured' | 'suspended' | 'sick' | 'personal';
    reason?: string;
    injuryId?: number;
    notes?: string;
}
export declare class CreateTreatmentDto {
    injuryId: number;
    treatmentDate: string;
    treatmentType: string;
    provider: string;
    notes?: string;
    effectiveness?: number;
    followUpInstructions?: string;
}
export declare class CreateMedicalReportDto {
    playerId: number;
    injuryId?: number;
    reportDate: string;
    reportType: string;
    doctor: string;
    content: string;
    recommendations?: string;
    attachments?: string[];
}
export declare class WellnessDateRangeDto {
    startDate: string;
    endDate: string;
}
//# sourceMappingURL=medical.dto.d.ts.map