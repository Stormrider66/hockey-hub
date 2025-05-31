import { getRepository, Repository } from 'typeorm';
import { Organization } from '../entities/Organization';
import { Team } from '../entities/Team'; // Needed for counts
import { User } from '../entities/User'; // Needed for counts
import { NotFoundError, ConflictError } from '../errors/serviceErrors';
import logger from '../config/logger';
import { CreateOrganizationDto, UpdateOrganizationDto } from '../dtos/organization.dto';

// DTO for listing options
interface ListOrganizationsOptions {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive' | 'trial';
    sort?: 'name' | 'createdAt';
    order?: 'asc' | 'desc';
}

export class OrganizationService {
    private orgRepository: Repository<Organization>;
    private teamRepository: Repository<Team>;
    private userRepository: Repository<User>;

    constructor() {
        this.orgRepository = getRepository(Organization);
        this.teamRepository = getRepository(Team);
        this.userRepository = getRepository(User);
    }

    async createOrganization(data: CreateOrganizationDto, createdByUserId: string): Promise<Organization> {
        logger.info(`User ${createdByUserId} creating organization '${data.name}'`);

        // Check for duplicate organization name
        const existingOrg = await this.orgRepository.findOne({ where: { name: data.name } });
        if (existingOrg) {
            throw new ConflictError(`Organization name '${data.name}' already exists`);
        }

        const newOrg = this.orgRepository.create({
            ...data,
            status: 'trial', // Start as trial by default
            // createdById: createdByUserId // If schema supports
        });

        const savedOrg = await this.orgRepository.save(newOrg);
        logger.info(`Organization created successfully with ID: ${savedOrg.id}`);
        // TODO: Consider assigning the creator as the first Club Admin?
        return savedOrg;
    }

    async findById(organizationId: string, relations: string[] = []): Promise<Organization> {
        const organization = await this.orgRepository.findOne({ where: { id: organizationId }, relations });
        if (!organization) {
            throw new NotFoundError(`Organization with ID ${organizationId} not found`);
        }
        return organization;
    }

    async listOrganizations(options: ListOrganizationsOptions): Promise<{ organizations: Organization[], total: number }> {
         const { 
            page = 1, 
            limit = 20, 
            search, 
            status, 
            sort = 'name', 
            order = 'asc'
        } = options;
        
        const skip = (page - 1) * limit;
        const queryBuilder = this.orgRepository.createQueryBuilder('organization');

        // Filtering
        if (status) {
            queryBuilder.andWhere('organization.status = :status', { status });
        }
        if (search) {
            queryBuilder.andWhere(
                '(organization.name ILIKE :search OR organization.contactEmail ILIKE :search)',
                { search: `%${search}%` }
            );
        }
        
        // Sorting
        const sortField = `organization.${sort}`;
        queryBuilder.orderBy(sortField, order.toUpperCase() as 'ASC' | 'DESC');

        // Pagination
        queryBuilder.skip(skip).take(limit);
        
        // Execute query
        const [organizations, total] = await queryBuilder.getManyAndCount();
        
        // Optionally add counts (might impact performance on large lists)
        // const orgsWithCounts = await Promise.all(organizations.map(async org => {
        //     const teamCount = await this.teamRepository.count({where: {organizationId: org.id}});
        //     // User count needs careful consideration due to relationships
        //     return { ...org, teamCount }; 
        // }));

        return { organizations, total };
    }

    async updateOrganization(organizationId: string, data: UpdateOrganizationDto, updatedByUserId: string): Promise<Organization> {
        logger.info(`User ${updatedByUserId} updating organization ${organizationId}`);
        const organization = await this.findById(organizationId);

        // Check for name conflict if name is being changed
        if (data.name && data.name !== organization.name) {
            const existingOrg = await this.orgRepository.findOne({ where: { name: data.name } });
            if (existingOrg && existingOrg.id !== organizationId) {
                throw new ConflictError(`Organization name '${data.name}' already exists`);
            }
        }

        // Prevent certain fields from being updated directly if needed (e.g., status by non-admin)
        // if (data.status && !isUserAdmin(updatedByUserId)) {
        //     delete data.status;
        // }

        Object.assign(organization, data);
        const updatedOrg = await this.orgRepository.save(organization);
        logger.info(`Organization ${organizationId} updated successfully by ${updatedByUserId}`);
        return updatedOrg;
    }

    // Note: Deleting organizations might be a complex operation requiring cleanup
    // or might be restricted entirely. Using soft delete is safer.
    async deleteOrganization(organizationId: string, deletedByUserId: string): Promise<void> {
        logger.warn(`User ${deletedByUserId} attempting to soft delete organization ${organizationId}`);
        const organization = await this.findById(organizationId);
        await this.orgRepository.softRemove(organization);
        // Consider cascading soft deletes or cleanup logic for related entities (teams, users)
        logger.info(`Organization ${organizationId} soft deleted successfully by ${deletedByUserId}`);
    }
    
    // --- Helper methods for contextual checks --- 
    async getOrganizationDetailsWithCounts(organizationId: string): Promise<any> {
         const organization = await this.findById(organizationId);
         const teamCount = await this.teamRepository.count({ where: { organizationId } });
         // User count is complex: depends on how users are linked to organizations
         // Example: Count users whose primary team is in this org
         const userCount = await this.userRepository.count({
             join: { alias: "user", leftJoin: { teamMemberships: "user.teamMemberships", team: "teamMemberships.team" } },
             where: { teamMemberships: { team: { organizationId: organizationId } } }
             // This query might need refinement based on exact schema/requirements
         });

         return { ...organization, teamCount, userCount };
    }
}
