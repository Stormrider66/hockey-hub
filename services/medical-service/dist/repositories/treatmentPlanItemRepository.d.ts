export interface TreatmentPlanItemRow {
    id: string;
    treatment_plan_id: string;
    description: string;
    frequency: string;
    duration: string;
    sets: number | null;
    reps: number | null;
    progression_criteria: string | null;
    exercise_id: string | null;
    sequence: number;
    created_at: Date;
    updated_at: Date;
}
export declare const findItemsByPlanId: (planId: string) => Promise<TreatmentPlanItemRow[]>;
export declare const createTreatmentPlanItem: (item: {
    planId: string;
    description: string;
    frequency: string;
    duration: string;
    sets?: number;
    reps?: number;
    progressionCriteria?: string;
    exerciseId?: string;
    sequence: number;
}) => Promise<TreatmentPlanItemRow>;
export declare const updateTreatmentPlanItem: (id: string, data: Partial<{
    description: string;
    frequency: string;
    duration: string;
    sets?: number;
    reps?: number;
    progressionCriteria?: string;
    exerciseId?: string;
    sequence: number;
}>) => Promise<TreatmentPlanItemRow | null>;
export declare const deleteTreatmentPlanItem: (id: string) => Promise<boolean>;
//# sourceMappingURL=treatmentPlanItemRepository.d.ts.map