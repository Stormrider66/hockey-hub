import { Injury } from './Injury';
import { UUID, ISODateString } from '@hockey-hub/types';
export declare class InjuryUpdate {
    id: UUID;
    injuryId: UUID;
    injury: Injury;
    date: ISODateString;
    note: string;
    subjectiveAssessment?: string | null;
    objectiveAssessment?: string | null;
    createdByUserId: UUID;
    createdAt: ISODateString;
}
//# sourceMappingURL=InjuryUpdate.d.ts.map