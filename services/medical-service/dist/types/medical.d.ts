export interface Injury {
    id: string;
    playerId: string;
    teamId?: string;
    organizationId: string;
    dateOccurred: Date;
    dateReported: Date;
    bodyPart: string;
    injuryType: string;
    mechanism?: string;
    severity?: 'mild' | 'moderate' | 'severe' | 'unknown';
    description?: string;
    diagnosis?: string;
    estimatedReturnDate?: Date;
    status: 'active' | 'recovering' | 'recovered' | 'archived';
    reportedByUserId?: string;
    createdAt: Date;
    updatedAt: Date;
    currentAvailabilityStatus?: PlayerAvailabilityStatus['status'];
}
export interface InjuryUpdate {
    id: string;
    injuryId: string;
    date: Date;
    note: string;
    subjectiveAssessment?: string;
    objectiveAssessment?: string;
    createdByUserId: string;
    createdAt: Date;
}
export interface Treatment {
    id: string;
    injuryId: string;
    treatmentPlanId?: string;
    date: Date;
    treatmentType: string;
    notes?: string;
    durationMinutes?: number;
    performedByUserId: string;
    createdAt: Date;
}
export interface TreatmentPlanPhase {
    id: string;
    name: string;
    order: number;
    description?: string;
    goals?: string[];
    estimatedDurationDays?: number;
    criteriaForProgression?: string[];
}
export interface TreatmentPlanItem {
    id: string;
    description: string;
    frequency?: string;
    duration?: string;
    notes?: string;
}
export interface TreatmentPlan {
    id: string;
    injuryId: string;
    title: string;
    description?: string;
    phases: TreatmentPlanPhase[];
    items: TreatmentPlanItem[];
    status: 'draft' | 'active' | 'completed' | 'canceled';
    createdByUserId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PlayerAvailabilityStatus {
    id: string;
    playerId: string;
    status: 'full' | 'limited' | 'individual' | 'rehab' | 'unavailable';
    notes?: string;
    restrictions?: string[];
    effectiveFrom: Date;
    updatedByUserId: string;
    updatedAt: Date;
    primaryInjuryId?: string;
}
export interface PlayerMedicalInfo {
    id: string;
    playerId: string;
    allergies?: string;
    medicalConditions?: string;
    surgicalHistory?: string;
    medications?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    lastPhysicalExamDate?: Date;
    notes?: string;
    updatedAt: Date;
}
//# sourceMappingURL=medical.d.ts.map