import { Injury } from './Injury';
import { MedicalAssessment } from './MedicalAssessment';
import { UUID, ISODateString } from '@hockey-hub/types';
export declare class MedicalNote {
    id: UUID;
    playerId: UUID;
    injuryId?: UUID | null;
    assessmentId?: UUID | null;
    note: string;
    recordedById: UUID;
    injury?: Injury | null;
    assessment?: MedicalAssessment | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
}
//# sourceMappingURL=MedicalNote.d.ts.map