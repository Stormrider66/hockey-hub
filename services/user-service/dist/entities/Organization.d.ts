import { Team } from './Team';
import { User } from './User';
export declare class Organization {
    id: string;
    name: string;
    organizationNumber?: string;
    contactEmail?: string;
    contactPhone?: string;
    logoUrl?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    website?: string;
    primaryColor?: string;
    secondaryColor?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    teams: Team[];
    users: User[];
}
//# sourceMappingURL=Organization.d.ts.map