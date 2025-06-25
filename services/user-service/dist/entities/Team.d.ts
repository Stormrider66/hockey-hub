import { Organization } from './Organization';
import { TeamMember } from './TeamMember';
export declare class Team {
    id: string;
    organizationId: string;
    organization: Promise<Organization>;
    name: string;
    description?: string;
    logoUrl?: string;
    teamColor?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    members: TeamMember[];
}
//# sourceMappingURL=Team.d.ts.map