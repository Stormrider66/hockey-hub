import { SagaDefinition } from '../Saga';
import { UserServiceClient } from '../..';
export interface PlayerTransferData {
    playerId: string;
    fromTeamId: string;
    toTeamId: string;
    transferDate: Date;
    jerseyNumber?: number;
    position?: string;
    reason?: string;
}
export interface PlayerTransferContext {
    playerData?: any;
    fromTeamMembership?: any;
    medicalClearance?: boolean;
    trainingSessionsTransferred?: number;
}
export declare class PlayerTransferSaga {
    static definition(userServiceClient: UserServiceClient): SagaDefinition<PlayerTransferData>;
}
//# sourceMappingURL=PlayerTransferSaga.d.ts.map