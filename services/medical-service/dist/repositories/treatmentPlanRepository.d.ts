export interface TreatmentPlanRow {
    id: string;
    injury_id: string;
    phase: string;
    description: string;
    expected_duration: number;
    goals: string;
    precautions: string | null;
    created_by_user_id: string;
    created_at: Date;
    updated_at: Date;
}
export declare const findPlansByInjuryId: (injuryId: string) => Promise<TreatmentPlanRow[]>;
export declare const createTreatmentPlan: (plan: {
    injuryId: string;
    phase: string;
    description: string;
    expectedDuration: number;
    goals: string;
    precautions?: string;
    createdByUserId: string;
}) => Promise<TreatmentPlanRow>;
export declare const updateTreatmentPlan: (id: string, data: Partial<{
    phase: string;
    description: string;
    expectedDuration: number;
    goals: string;
    precautions?: string;
}>) => Promise<TreatmentPlanRow | null>;
export declare const deleteTreatmentPlan: (id: string) => Promise<boolean>;
//# sourceMappingURL=treatmentPlanRepository.d.ts.map