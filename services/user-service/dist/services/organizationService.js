"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationService = void 0;
const typeorm_1 = require("typeorm");
const Organization_1 = require("../entities/Organization");
const Team_1 = require("../entities/Team"); // Needed for counts
const User_1 = require("../entities/User"); // Needed for counts
const serviceErrors_1 = require("../errors/serviceErrors");
const logger_1 = __importDefault(require("../config/logger"));
class OrganizationService {
    constructor() {
        this.orgRepository = (0, typeorm_1.getRepository)(Organization_1.Organization);
        this.teamRepository = (0, typeorm_1.getRepository)(Team_1.Team);
        this.userRepository = (0, typeorm_1.getRepository)(User_1.User);
    }
    createOrganization(data, createdByUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`User ${createdByUserId} creating organization '${data.name}'`);
            // Check for duplicate organization name
            const existingOrg = yield this.orgRepository.findOne({ where: { name: data.name } });
            if (existingOrg) {
                throw new serviceErrors_1.ConflictError(`Organization name '${data.name}' already exists`);
            }
            const organization = this.orgRepository.create({
                name: data.name,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                address: data.address,
                city: data.city,
                country: data.country,
                primaryColor: data.primaryColor,
                secondaryColor: data.secondaryColor
            });
            const savedOrg = yield this.orgRepository.save(organization);
            logger_1.default.info(`Organization created successfully with ID: ${savedOrg.id}`);
            // TODO: Consider assigning the creator as the first Club Admin?
            return savedOrg;
        });
    }
    findById(organizationId, relations = []) {
        return __awaiter(this, void 0, void 0, function* () {
            const organization = yield this.orgRepository.findOne({ where: { id: organizationId }, relations });
            if (!organization) {
                throw new serviceErrors_1.NotFoundError(`Organization with ID ${organizationId} not found`);
            }
            return organization;
        });
    }
    listOrganizations(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 20, search, status, sort = 'name', order = 'asc' } = options;
            const skip = (page - 1) * limit;
            const queryBuilder = this.orgRepository.createQueryBuilder('organization');
            // Filtering
            if (status) {
                queryBuilder.andWhere('organization.status = :status', { status });
            }
            if (search) {
                queryBuilder.andWhere('(organization.name ILIKE :search OR organization.contactEmail ILIKE :search)', { search: `%${search}%` });
            }
            // Sorting
            const sortField = `organization.${sort}`;
            queryBuilder.orderBy(sortField, order.toUpperCase());
            // Pagination
            queryBuilder.skip(skip).take(limit);
            // Execute query
            const [organizations, total] = yield queryBuilder.getManyAndCount();
            // Optionally add counts (might impact performance on large lists)
            // const orgsWithCounts = await Promise.all(organizations.map(async org => {
            //     const teamCount = await this.teamRepository.count({where: {organizationId: org.id}});
            //     // User count needs careful consideration due to relationships
            //     return { ...org, teamCount }; 
            // }));
            return { organizations, total };
        });
    }
    updateOrganization(organizationId, data, updatedByUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`User ${updatedByUserId} updating organization ${organizationId}`);
            const organization = yield this.findById(organizationId);
            // Check for name conflict if name is being changed
            if (data.name && data.name !== organization.name) {
                const existingOrg = yield this.orgRepository.findOne({ where: { name: data.name } });
                if (existingOrg && existingOrg.id !== organizationId) {
                    throw new serviceErrors_1.ConflictError(`Organization name '${data.name}' already exists`);
                }
            }
            // Prevent certain fields from being updated directly if needed (e.g., status by non-admin)
            // if (data.status && !isUserAdmin(updatedByUserId)) {
            //     delete data.status;
            // }
            Object.assign(organization, data);
            const updatedOrg = yield this.orgRepository.save(organization);
            logger_1.default.info(`Organization ${organizationId} updated successfully by ${updatedByUserId}`);
            return updatedOrg;
        });
    }
    // Note: Deleting organizations might be a complex operation requiring cleanup
    // or might be restricted entirely. Using soft delete is safer.
    deleteOrganization(organizationId, deletedByUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.warn(`User ${deletedByUserId} attempting to soft delete organization ${organizationId}`);
            const organization = yield this.findById(organizationId);
            yield this.orgRepository.softRemove(organization);
            // Consider cascading soft deletes or cleanup logic for related entities (teams, users)
            logger_1.default.info(`Organization ${organizationId} soft deleted successfully by ${deletedByUserId}`);
        });
    }
    // --- Helper methods for contextual checks --- 
    getOrganizationDetailsWithCounts(organizationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const organization = yield this.findById(organizationId);
            const teamCount = yield this.teamRepository.count({ where: { organizationId } });
            // User count is complex: depends on how users are linked to organizations
            // Example: Count users whose primary team is in this org
            const userCount = yield this.userRepository.count({
                join: { alias: "user", leftJoin: { teamMemberships: "user.teamMemberships", team: "teamMemberships.team" } },
                where: { teamMemberships: { team: { organizationId: organizationId } } }
                // This query might need refinement based on exact schema/requirements
            });
            return Object.assign(Object.assign({}, organization), { teamCount, userCount });
        });
    }
}
exports.OrganizationService = OrganizationService;
//# sourceMappingURL=organizationService.js.map