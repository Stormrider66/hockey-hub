import { Injury } from './Injury';
import { PlayerAvailabilityStatus as PlayerAvailabilityStatusEnum, UUID, ISODateString } from '@hockey-hub/types';
export declare class PlayerStatusUpdate {
    id: UUID;
    playerId: UUID;
    teamId?: UUID | null;
    organizationId: UUID;
    status: PlayerAvailabilityStatusEnum;
    reason?: string | null;
    relatedInjuryId?: UUID | null;
    relatedInjury?: Injury | null;
    effectiveDate: ISODateString;
    updatedById: UUID;
    createdAt: ISODateString;
    updatedAt: ISODateString;
}
//# sourceMappingURL=PlayerStatusUpdate.d.ts.map