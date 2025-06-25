import { Treatment } from '../types/medical';
export declare const findTreatmentsByInjuryId: (injuryId: string) => Promise<Treatment[]>;
export declare const createTreatment: (treatment: {
    injuryId: string;
    date: Date;
    treatmentType: string;
    notes?: string;
    durationMinutes?: number;
    performedByUserId: string;
}) => Promise<Treatment>;
export declare const updateTreatment: (id: string, data: Partial<{
    date: Date;
    treatmentType: string;
    notes?: string;
    durationMinutes?: number;
}>) => Promise<Treatment | null>;
export declare const deleteTreatment: (id: string) => Promise<boolean>;
//# sourceMappingURL=treatmentRepository.d.ts.map