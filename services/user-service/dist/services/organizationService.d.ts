import { Organization } from '../entities/Organization';
import { CreateOrganizationDto, UpdateOrganizationDto } from '../dtos/organization.dto';
interface ListOrganizationsOptions {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive' | 'trial';
    sort?: 'name' | 'createdAt';
    order?: 'asc' | 'desc';
}
export declare class OrganizationService {
    private orgRepository;
    private teamRepository;
    private userRepository;
    constructor();
    createOrganization(data: CreateOrganizationDto, createdByUserId: string): Promise<Organization>;
    findById(organizationId: string, relations?: string[]): Promise<Organization>;
    listOrganizations(options: ListOrganizationsOptions): Promise<{
        organizations: Organization[];
        total: number;
    }>;
    updateOrganization(organizationId: string, data: UpdateOrganizationDto, updatedByUserId: string): Promise<Organization>;
    deleteOrganization(organizationId: string, deletedByUserId: string): Promise<void>;
    getOrganizationDetailsWithCounts(organizationId: string): Promise<any>;
}
export {};
//# sourceMappingURL=organizationService.d.ts.map