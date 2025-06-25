import { Injury } from '../types/medical';
interface FindInjuriesFilters {
    organizationId: string;
    playerId?: string;
    teamId?: string;
    status?: string;
    bodyPart?: string;
    injuryType?: string;
    dateFrom?: string;
    dateTo?: string;
}
export declare const findAll: () => Promise<Injury[]>;
export declare const findInjuries: (filters: FindInjuriesFilters, limit: number, offset: number) => Promise<Injury[]>;
export declare const countInjuries: (filters: FindInjuriesFilters) => Promise<number>;
export declare const findInjuryById: (id: string, organizationId: string) => Promise<Injury | null>;
export declare const createInjury: (data: Omit<Injury, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
    status?: Injury['status'];
}) => Promise<Injury>;
export declare const updateInjury: (id: string, organizationId: string, data: Partial<Omit<Injury, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'playerId' | 'reportedByUserId'>>) => Promise<Injury | null>;
export declare const deleteInjury: (id: string, organizationId: string) => Promise<boolean>;
export declare const findInjuryUpdatesByInjuryId: (injuryId: string) => Promise<any[]>;
export declare const createInjuryUpdate: (data: {
    injuryId: string;
    date: Date;
    note: string;
    subjectiveAssessment?: string;
    objectiveAssessment?: string;
    createdByUserId: string;
}) => Promise<any>;
export {};
//# sourceMappingURL=injuryRepository.d.ts.map