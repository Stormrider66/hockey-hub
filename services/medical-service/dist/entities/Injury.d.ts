import { MedicalNote } from './MedicalNote';
import { PlayerStatusUpdate } from './PlayerStatusUpdate';
import { InjuryUpdate } from './InjuryUpdate';
import { InjuryType as InjuryTypeEnum, InjuryStatus as InjuryStatusEnum, InjurySeverity as InjurySeverityEnum, UUID, ISODateString } from '@hockey-hub/types';
export declare class Injury {
    id: UUID;
    playerId: UUID;
    teamId?: UUID | null;
    organizationId: UUID;
    injuryType: InjuryTypeEnum;
    bodyPart: string;
    description: string;
    status: InjuryStatusEnum;
    severity: InjurySeverityEnum;
    dateOfInjury: ISODateString;
    expectedRecoveryTime?: string | null;
    actualRecoveryDate?: ISODateString | null;
    reportedById?: UUID | null;
    medicalNotes?: MedicalNote[];
    statusUpdates?: PlayerStatusUpdate[];
    updates?: InjuryUpdate[];
    createdAt: ISODateString;
    updatedAt: ISODateString;
}
//# sourceMappingURL=Injury.d.ts.map