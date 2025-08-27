import { SagaDefinition } from '../Saga';
import { CreateOrganizationDTO, UserServiceClient } from '../..';
export interface CreateOrganizationData {
    organization: CreateOrganizationDTO;
    adminUser: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    };
    defaultTeams?: Array<{
        name: string;
        type: 'youth' | 'junior' | 'senior' | 'recreational';
    }>;
}
export interface CreateOrganizationContext {
    organizationId?: string;
    adminUserId?: string;
    teamIds?: string[];
}
export declare class CreateOrganizationSaga {
    static definition(userServiceClient: UserServiceClient): SagaDefinition<CreateOrganizationData>;
}
//# sourceMappingURL=CreateOrganizationSaga.d.ts.map