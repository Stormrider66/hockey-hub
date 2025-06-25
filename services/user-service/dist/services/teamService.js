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
exports.TeamService = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("../entities/User");
const Team_1 = require("../entities/Team");
const TeamMember_1 = require("../entities/TeamMember");
const Organization_1 = require("../entities/Organization");
const serviceErrors_1 = require("../errors/serviceErrors");
const logger_1 = __importDefault(require("../config/logger"));
class TeamService {
    constructor() {
        this.teamRepository = (0, typeorm_1.getRepository)(Team_1.Team);
        this.memberRepository = (0, typeorm_1.getRepository)(TeamMember_1.TeamMember);
        this.userRepository = (0, typeorm_1.getRepository)(User_1.User);
        this.orgRepository = (0, typeorm_1.getRepository)(Organization_1.Organization);
    }
    createTeam(data, createdByUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`Creating team '${data.name}' in organization ${data.organizationId} by user ${createdByUserId}`);
            // Check if organization exists
            const organization = yield this.orgRepository.findOne({ where: { id: data.organizationId } });
            if (!organization) {
                throw new serviceErrors_1.NotFoundError(`Organization with ID ${data.organizationId} not found`);
            }
            // Check for duplicate team name within the organization
            const existingTeam = yield this.teamRepository.findOne({
                where: { name: data.name, organizationId: data.organizationId }
            });
            if (existingTeam) {
                throw new serviceErrors_1.ConflictError(`Team name '${data.name}' already exists in this organization`);
            }
            const newTeam = this.teamRepository.create(Object.assign({}, data));
            const savedTeam = yield this.teamRepository.save(newTeam);
            logger_1.default.info(`Team created successfully with ID: ${savedTeam.id}`);
            return savedTeam;
        });
    }
    getTeamById(teamId, relations = []) {
        return __awaiter(this, void 0, void 0, function* () {
            const team = yield this.teamRepository.findOne({ where: { id: teamId }, relations });
            if (!team) {
                throw new serviceErrors_1.NotFoundError(`Team with ID ${teamId} not found`);
            }
            return team;
        });
    }
    // Helper function to ensure team exists, throws if not found
    ensureTeamExists(teamId) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield this.teamRepository.count({ where: { id: teamId } });
            if (count === 0) {
                throw new serviceErrors_1.NotFoundError(`Team with ID ${teamId} not found`);
            }
        });
    }
    getTeamsByOrganization(organizationId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.teamRepository.find({ where: { organizationId } });
        });
    }
    updateTeam(teamId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`Updating team ${teamId}`);
            const team = yield this.getTeamById(teamId); // Ensures team exists and gets current data
            // Prevent changing organizationId if needed
            // delete (data as any).organizationId;
            Object.assign(team, data);
            const updatedTeam = yield this.teamRepository.save(team);
            logger_1.default.info(`Team ${teamId} updated successfully`);
            return updatedTeam;
        });
    }
    deleteTeam(teamId) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.warn(`Attempting to soft delete team ${teamId}`);
            // Fetch the entity to pass to softRemove
            const teamEntity = yield this.getTeamById(teamId); // Rename variable to avoid shadowing
            yield this.teamRepository.softRemove(teamEntity); // Use softRemove with fetched entity
            logger_1.default.info(`Team ${teamId} soft deleted successfully`);
        });
    }
    addMemberToTeam(teamId, memberData) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`Adding user ${memberData.userId} to team ${teamId} with role ${memberData.role}`);
            yield this.ensureTeamExists(teamId); // Check if team exists
            const user = yield this.userRepository.findOne({ where: { id: memberData.userId } });
            if (!user) {
                throw new serviceErrors_1.NotFoundError(`User with ID ${memberData.userId} not found`);
            }
            // Check if user is already a member with this role
            const existingMembership = yield this.memberRepository.findOne({
                where: { teamId, userId: memberData.userId, role: memberData.role }
            });
            if (existingMembership) {
                throw new serviceErrors_1.ConflictError(`User ${memberData.userId} already has role '${memberData.role}' in team ${teamId}`);
            }
            const newMember = this.memberRepository.create({
                teamId,
                userId: memberData.userId,
                role: memberData.role,
                position: memberData.position,
                jerseyNumber: memberData.jerseyNumber,
                startDate: memberData.startDate || new Date(),
            });
            const savedMember = yield this.memberRepository.save(newMember);
            logger_1.default.info(`User ${memberData.userId} added to team ${teamId} successfully (Membership ID: ${savedMember.id})`);
            return savedMember;
        });
    }
    removeMemberFromTeam(teamId, userId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.warn(`Attempting to remove user ${userId} from team ${teamId} (Role: ${role || 'any'})`);
            yield this.ensureTeamExists(teamId); // Check if team exists
            const userExists = yield this.userRepository.count({ where: { id: userId } });
            if (userExists === 0) {
                throw new serviceErrors_1.NotFoundError(`User with ID ${userId} not found`);
            }
            const criteria = { teamId, userId };
            if (role) {
                criteria.role = role;
            }
            const memberships = yield this.memberRepository.find({ where: criteria });
            if (memberships.length === 0) {
                throw new serviceErrors_1.NotFoundError(`User ${userId} not found in team ${teamId} ${role ? 'with role ' + role : ''}`);
            }
            // Usually, we remove the membership record entirely
            yield this.memberRepository.remove(memberships);
            // Or, if using soft delete on TeamMember:
            // await this.memberRepository.softRemove(memberships);
            logger_1.default.info(`Removed user ${userId} from team ${teamId} successfully`);
        });
    }
    getTeamMembers(teamId) {
        return __awaiter(this, void 0, void 0, function* () {
            const teamWithMembers = yield this.teamRepository.findOne({
                where: { id: teamId },
                relations: ['members', 'members.user']
            });
            if (!teamWithMembers) {
                throw new serviceErrors_1.NotFoundError(`Team with ID ${teamId} not found`);
            }
            // Ensure members are loaded
            if (!teamWithMembers.members) {
                return [];
            }
            // Await the promises for each user
            const users = yield Promise.all(teamWithMembers.members.map(member => member.user));
            return users.filter(user => !!user); // Filter out potential null users
        });
    }
    // Helper to check if a user is a member of a team (useful for auth checks)
    isUserMemberOfTeam(userId, teamId) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield this.memberRepository.count({ where: { userId, teamId } });
            return count > 0;
        });
    }
    // Helper to check if user has a specific role in a team
    hasTeamRole(userId, teamId, roles) {
        return __awaiter(this, void 0, void 0, function* () {
            const membership = yield this.memberRepository.findOne({
                where: { userId, teamId }
            });
            return !!membership && roles.includes(membership.role);
        });
    }
    // Method to list teams with filters and pagination
    listTeams(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 20, search, organizationId, // Filter by specific organization
            sort = 'name', order = 'asc' } = options;
            const skip = (page - 1) * limit;
            const queryBuilder = this.teamRepository.createQueryBuilder('team')
                .leftJoinAndSelect('team.organization', 'organization'); // Join organization for potential filtering/display
            // Filtering
            if (organizationId) {
                // IMPORTANT: Ensure calling code provides correct organizationId based on user role
                queryBuilder.andWhere('team.organizationId = :organizationId', { organizationId });
            }
            if (search) {
                queryBuilder.andWhere('(team.name ILIKE :search OR organization.name ILIKE :search)', { search: `%${search}%` });
            }
            // Sorting
            const sortField = `team.${sort}`; // Corrected: Sort only by defined Team fields
            queryBuilder.orderBy(sortField, order.toUpperCase());
            // Pagination
            queryBuilder.skip(skip).take(limit);
            // Select specific fields if needed, e.g., to add member count
            // queryBuilder.loadRelationCountAndMap('team.memberCount', 'team.members');
            // Execute query
            const [teams, total] = yield queryBuilder.getManyAndCount();
            // Optionally map response to exclude sensitive data or format
            return { teams, total };
        });
    }
}
exports.TeamService = TeamService;
//# sourceMappingURL=teamService.js.map