import { getRepository, Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { NotFoundError, ConflictError, AuthorizationError } from '../errors/serviceErrors';
import logger from '../config/logger';

// DTOs (Define properly later)
interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    preferredLanguage?: 'sv' | 'en';
    status?: 'active' | 'inactive' | 'pending'; // Status changes might be admin-only
    avatarUrl?: string | null;
}

interface ListUsersOptions {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    teamId?: string;
    status?: 'active' | 'inactive' | 'pending';
    sort?: 'firstName' | 'lastName' | 'email' | 'createdAt';
    order?: 'asc' | 'desc';
    organizationId?: string; // Important for filtering by organization
}

export class UserService {
    private userRepository: Repository<User>;
    private roleRepository: Repository<Role>;

    constructor() {
        this.userRepository = getRepository(User);
        this.roleRepository = getRepository(Role);
    }

    async findById(userId: string, relations: string[] = []): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations });
        if (!user) {
            throw new NotFoundError(`User with ID ${userId} not found`);
        }
        // Exclude password hash from the returned user object
        delete (user as any).passwordHash;
        delete (user as any).passwordResetToken;
        delete (user as any).passwordResetExpires;
        return user;
    }
    
    async listUsers(options: ListUsersOptions): Promise<{ users: User[], total: number }> {
        const { 
            page = 1, 
            limit = 20, 
            search, 
            role, 
            teamId, 
            status, 
            sort = 'lastName', 
            order = 'asc',
            organizationId 
        } = options;
        
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
            queryBuilder.andWhere(
                '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Sorting
        const sortField = `user.${sort}`;
        queryBuilder.orderBy(sortField, order.toUpperCase() as 'ASC' | 'DESC');

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
        const [users, total] = await queryBuilder.getManyAndCount();
        
        return { users, total };
    }

    async updateUser(userId: string, data: UpdateUserDto, updatedByUserId: string, userRoles: string[] = []): Promise<User> {
        logger.info(`User ${updatedByUserId} updating profile for user ${userId}`);
        const user = await this.userRepository.findOne({ where: { id: userId } }); // Fetch user without relations first
         if (!user) {
            throw new NotFoundError(`User with ID ${userId} not found`);
        }

        // Security check: Prevent non-admins from updating status
        if (data.status && updatedByUserId !== userId) { 
             // Check if the updater has admin privileges
             const isAdmin = userRoles.includes('admin') || userRoles.includes('club_admin');
             if (!isAdmin) {
                 logger.warn(`Forbidden attempt: User ${updatedByUserId} (Roles: ${userRoles.join(',')}) tried to change status for user ${userId}`);
                 throw new AuthorizationError('Only administrators can change user status.');
             }
             logger.info(`Admin ${updatedByUserId} changing status for user ${userId} to ${data.status}`);
        }

        // Prevent updating email or roles here (should have dedicated endpoints/services)
        delete (data as any).email;
        delete (data as any).roles;
        delete (data as any).passwordHash;

        Object.assign(user, data);
        const updatedUser = await this.userRepository.save(user);
        logger.info(`User ${userId} updated successfully by ${updatedByUserId}`);
        // Exclude password hash
        delete (updatedUser as any).passwordHash;
        return updatedUser;
    }

    async deleteUser(userId: string, deletedByUserId: string): Promise<void> {
        logger.warn(`User ${deletedByUserId} attempting to soft delete user ${userId}`);
        const user = await this.userRepository.findOne({ where: { id: userId }}); // Fetch to ensure it exists
         if (!user) {
            throw new NotFoundError(`User with ID ${userId} not found`);
        }
        await this.userRepository.softRemove(user); // Use softRemove
        logger.info(`User ${userId} soft deleted successfully by ${deletedByUserId}`);
    }

    async assignRoleToUser(userId: string, roleName: string, assignedByUserId: string): Promise<User> {
        logger.info(`User ${assignedByUserId} assigning role '${roleName}' to user ${userId}`);
        const user = await this.userRepository.findOne({ where: {id: userId}, relations: ['roles']}); // Load existing roles
         if (!user) {
            throw new NotFoundError(`User with ID ${userId} not found`);
        }
        const role = await this.roleRepository.findOne({ where: { name: roleName } });

        if (!role) {
            throw new NotFoundError(`Role '${roleName}' not found`);
        }

        // Check if user already has the role
        if (user.roles && user.roles.some(r => r.id === role.id)) {
            throw new ConflictError(`User ${userId} already has role '${roleName}'`);
        }

        user.roles = [...(user.roles || []), role];
        const updatedUser = await this.userRepository.save(user);
        logger.info(`Role '${roleName}' assigned to user ${userId} successfully by ${assignedByUserId}`);
        delete (updatedUser as any).passwordHash;
        return updatedUser;
    }

    async removeRoleFromUser(userId: string, roleName: string, removedByUserId: string): Promise<User> {
        logger.warn(`User ${removedByUserId} removing role '${roleName}' from user ${userId}`);
        const user = await this.userRepository.findOne({ where: {id: userId}, relations: ['roles']});
         if (!user) {
            throw new NotFoundError(`User with ID ${userId} not found`);
        }
        const roleToRemove = user.roles?.find(r => r.name === roleName);

        if (!roleToRemove) {
            throw new NotFoundError(`User ${userId} does not have role '${roleName}'`);
        }

        user.roles = user.roles.filter(r => r.id !== roleToRemove.id);
        const updatedUser = await this.userRepository.save(user);
        logger.info(`Role '${roleName}' removed from user ${userId} successfully by ${removedByUserId}`);
        delete (updatedUser as any).passwordHash;
        return updatedUser;
    }
    
    // --- Password Update - Separate from general profile update ---
    async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
         logger.info(`Updating password for user ${userId}`);
         const result = await this.userRepository.update(userId, { passwordHash: newPasswordHash });
         if (result.affected === 0) {
             throw new NotFoundError(`User with ID ${userId} not found for password update`);
         }
         logger.info(`Password for user ${userId} updated successfully.`);
    }
    
     // Helper for password comparison (used internally by authService potentially)
    async comparePassword(userId: string, plainTextPass: string): Promise<boolean> {
        const user = await this.userRepository.findOne({ 
            where: { id: userId },
            select: ['id', 'passwordHash'] // Only select necessary fields
        });
        if (!user || !user.passwordHash) return false;
        return bcrypt.compare(plainTextPass, user.passwordHash);
    }

    /**
     * Fetches a User entity by ID without removing sensitive fields.
     * Primarily for internal service/controller use for authorization checks.
     * @param userId The ID of the user to fetch.
     * @returns The User entity or null if not found.
     */
    async findUserEntityById(userId: string): Promise<User | null> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['organization'], // Load organization for checks
        });
        return user;
    }

    async findByEmail(email: string, relations: string[] = []): Promise<User | null> {
        logger.debug(`Finding user by email: ${email}`);
        const user = await this.userRepository.findOne({ 
            where: { email: email.toLowerCase() }, // Ensure case-insensitivity
            relations 
        });
        return user; // Return user or null if not found
    }
} 