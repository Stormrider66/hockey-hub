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
exports.UserService = void 0;
const typeorm_1 = require("typeorm");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../entities/User");
const Role_1 = require("../entities/Role");
const serviceErrors_1 = require("../errors/serviceErrors");
const logger_1 = __importDefault(require("../config/logger"));
class UserService {
    constructor() {
        this.userRepository = (0, typeorm_1.getRepository)(User_1.User);
        this.roleRepository = (0, typeorm_1.getRepository)(Role_1.Role);
    }
    findById(userId, relations = []) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findOne({ where: { id: userId }, relations });
            if (!user) {
                throw new serviceErrors_1.NotFoundError(`User with ID ${userId} not found`);
            }
            // Exclude password hash from the returned user object
            delete user.passwordHash;
            delete user.passwordResetToken;
            delete user.passwordResetExpires;
            return user;
        });
    }
    listUsers(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page = 1, limit = 20, search, role, teamId, status, sort = 'lastName', order = 'asc', organizationId } = options;
            const skip = (page - 1) * limit;
            const queryBuilder = this.userRepository.createQueryBuilder('user')
                .leftJoinAndSelect('user.roles', 'roles')
                .leftJoin('user.teamMemberships', 'tm')
                .leftJoin('tm.team', 'team');
            // Filtering
            if (status) {
                queryBuilder.andWhere('user.status = :status', { status });
            }
            if (role) {
                queryBuilder.andWhere('roles.name = :role', { role });
            }
            if (teamId) {
                queryBuilder.andWhere('tm.teamId = :teamId', { teamId });
            }
            if (organizationId) {
                // Filter users belonging to teams within the specified organization
                queryBuilder.andWhere('team.organizationId = :organizationId', { organizationId });
            }
            if (search) {
                queryBuilder.andWhere('(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)', { search: `%${search}%` });
            }
            // Sorting
            const sortField = `user.${sort}`;
            queryBuilder.orderBy(sortField, order.toUpperCase());
            // Pagination
            queryBuilder.skip(skip).take(limit);
            // Explicitly select fields to exclude password hash etc.
            queryBuilder.select([
                'user.id', 'user.email', 'user.firstName', 'user.lastName', 'user.phone',
                'user.preferredLanguage', 'user.status', 'user.lastLogin', 'user.avatarUrl',
                'user.createdAt', 'user.updatedAt', 'roles.id', 'roles.name' // Include role names
                // Do not include passwordHash, passwordResetToken, passwordResetExpires
            ]);
            // Execute query
            const [users, total] = yield queryBuilder.getManyAndCount();
            return { users, total };
        });
    }
    updateUser(userId, data, updatedByUserId, userRoles = []) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`User ${updatedByUserId} updating profile for user ${userId}`);
            const user = yield this.userRepository.findOne({ where: { id: userId } }); // Fetch user without relations first
            if (!user) {
                throw new serviceErrors_1.NotFoundError(`User with ID ${userId} not found`);
            }
            // Security check: Prevent non-admins from updating status
            if (data.status && updatedByUserId !== userId) {
                // Check if the updater has admin privileges
                const isAdmin = userRoles.includes('admin') || userRoles.includes('club_admin');
                if (!isAdmin) {
                    logger_1.default.warn(`Forbidden attempt: User ${updatedByUserId} (Roles: ${userRoles.join(',')}) tried to change status for user ${userId}`);
                    throw new serviceErrors_1.AuthorizationError('Only administrators can change user status.');
                }
                logger_1.default.info(`Admin ${updatedByUserId} changing status for user ${userId} to ${data.status}`);
            }
            // Prevent updating email or roles here (should have dedicated endpoints/services)
            delete data.email;
            delete data.roles;
            delete data.passwordHash;
            Object.assign(user, data);
            const updatedUser = yield this.userRepository.save(user);
            logger_1.default.info(`User ${userId} updated successfully by ${updatedByUserId}`);
            // Exclude password hash
            delete updatedUser.passwordHash;
            return updatedUser;
        });
    }
    deleteUser(userId, deletedByUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.warn(`User ${deletedByUserId} attempting to soft delete user ${userId}`);
            const user = yield this.userRepository.findOne({ where: { id: userId } }); // Fetch to ensure it exists
            if (!user) {
                throw new serviceErrors_1.NotFoundError(`User with ID ${userId} not found`);
            }
            yield this.userRepository.softRemove(user); // Use softRemove
            logger_1.default.info(`User ${userId} soft deleted successfully by ${deletedByUserId}`);
        });
    }
    assignRoleToUser(userId, roleName, assignedByUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`User ${assignedByUserId} assigning role '${roleName}' to user ${userId}`);
            const user = yield this.userRepository.findOne({ where: { id: userId }, relations: ['roles'] }); // Load existing roles
            if (!user) {
                throw new serviceErrors_1.NotFoundError(`User with ID ${userId} not found`);
            }
            const role = yield this.roleRepository.findOne({ where: { name: roleName } });
            if (!role) {
                throw new serviceErrors_1.NotFoundError(`Role '${roleName}' not found`);
            }
            // Check if user already has the role
            if (user.roles && user.roles.some(r => r.id === role.id)) {
                throw new serviceErrors_1.ConflictError(`User ${userId} already has role '${roleName}'`);
            }
            user.roles = [...(user.roles || []), role];
            const updatedUser = yield this.userRepository.save(user);
            logger_1.default.info(`Role '${roleName}' assigned to user ${userId} successfully by ${assignedByUserId}`);
            delete updatedUser.passwordHash;
            return updatedUser;
        });
    }
    removeRoleFromUser(userId, roleName, removedByUserId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.warn(`User ${removedByUserId} removing role '${roleName}' from user ${userId}`);
            const user = yield this.userRepository.findOne({ where: { id: userId }, relations: ['roles'] });
            if (!user) {
                throw new serviceErrors_1.NotFoundError(`User with ID ${userId} not found`);
            }
            const roleToRemove = (_a = user.roles) === null || _a === void 0 ? void 0 : _a.find(r => r.name === roleName);
            if (!roleToRemove) {
                throw new serviceErrors_1.NotFoundError(`User ${userId} does not have role '${roleName}'`);
            }
            user.roles = user.roles.filter(r => r.id !== roleToRemove.id);
            const updatedUser = yield this.userRepository.save(user);
            logger_1.default.info(`Role '${roleName}' removed from user ${userId} successfully by ${removedByUserId}`);
            delete updatedUser.passwordHash;
            return updatedUser;
        });
    }
    // --- Password Update - Separate from general profile update ---
    updateUserPassword(userId, newPasswordHash) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info(`Updating password for user ${userId}`);
            const result = yield this.userRepository.update(userId, { passwordHash: newPasswordHash });
            if (result.affected === 0) {
                throw new serviceErrors_1.NotFoundError(`User with ID ${userId} not found for password update`);
            }
            logger_1.default.info(`Password for user ${userId} updated successfully.`);
        });
    }
    // Helper for password comparison (used internally by authService potentially)
    comparePassword(userId, plainTextPass) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findOne({
                where: { id: userId },
                select: ['id', 'passwordHash'] // Only select necessary fields
            });
            if (!user || !user.passwordHash)
                return false;
            return bcryptjs_1.default.compare(plainTextPass, user.passwordHash);
        });
    }
    /**
     * Fetches a User entity by ID without removing sensitive fields.
     * Primarily for internal service/controller use for authorization checks.
     * @param userId The ID of the user to fetch.
     * @returns The User entity or null if not found.
     */
    findUserEntityById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findOne({
                where: { id: userId },
                relations: ['organization'], // Load organization for checks
            });
            return user;
        });
    }
    findByEmail(email, relations = []) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.debug(`Finding user by email: ${email}`);
            const user = yield this.userRepository.findOne({
                where: { email: email.toLowerCase() }, // Ensure case-insensitivity
                relations
            });
            return user; // Return user or null if not found
        });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map