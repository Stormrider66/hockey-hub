import { MedicalNote } from './MedicalNote';
import { UUID, ISODateString } from '@hockey-hub/types';
export declare class MedicalAssessment {
    id: UUID;
    playerId: UUID;
    teamId?: UUID | null;
    organizationId: UUID;
    assessmentType: string;
    assessmentDate: ISODateString;
    summary: string;
    conductedById: UUID;
    medicalNotes?: MedicalNote[];
    createdAt: ISODateString;
    updatedAt: ISODateString;
}
//# sourceMappingURL=MedicalAssessment.d.ts.map