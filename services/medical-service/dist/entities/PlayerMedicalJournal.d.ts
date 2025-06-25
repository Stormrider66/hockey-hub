import { UUID, ISODateString, PhoneString } from '@hockey-hub/types';
export declare class PlayerMedicalJournal {
    playerId: UUID;
    organizationId: UUID;
    allergies?: string | null;
    chronicConditions?: string | null;
    pastInjuriesSummary?: string | null;
    medications?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: PhoneString | null;
    insuranceDetails?: string | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
}
//# sourceMappingURL=PlayerMedicalJournal.d.ts.map