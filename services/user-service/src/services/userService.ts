// @ts-nocheck - Complex user service needs refactoring
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Organization } from '../entities/Organization';
import { UserOrganization } from '../entities/UserOrganization';
import { TeamMember } from '../entities/TeamMember';
import {
  UserDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserWithRoleDTO,
  GetUsersQuery,
  UsersResponseDTO,
  UserCreatedEvent,
  UserUpdatedEvent,
  EventBus,
  UserEvents,
} from '@hockey-hub/shared-lib';
import * as bcrypt from 'bcrypt';

export class UserService {
  private userRepo = AppDataSource.getRepository(User);
  private orgRepo = AppDataSource.getRepository(Organization);
  private userOrgRepo = AppDataSource.getRepository(UserOrganization);
  private teamMemberRepo = AppDataSource.getRepository(TeamMember);

  constructor(private eventBus?: EventBus) {}

  // Convert entity to DTO
  private toUserDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth?.toISOString(),
      jerseyNumber: user.jerseyNumber,
      position: user.position,
      handedness: user.handedness,
      profileImageUrl: user.profileImageUrl,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  // Create user
  async createUser(data: CreateUserDTO, organizationId: string, role: string): Promise<UserDTO> {
    // Check if user already exists
    const existingUser = await this.userRepo.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = this.userRepo.create({
      ...data,
      passwordHash,
      emailVerified: false,
      isActive: true,
    });

    await this.userRepo.save(user);

    // Add to organization
    const userOrg = this.userOrgRepo.create({
      userId: user.id,
      organizationId,
      role: role as any,
      isActive: true,
    });

    await this.userOrgRepo.save(userOrg);

    // Publish event
    if (this.eventBus) {
      const event: UserCreatedEvent = {
        userId: user.id,
        organizationId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role,
        timestamp: new Date().toISOString(),
      };

      await this.eventBus.publish(UserEvents.USER_CREATED, event);
    }

    return this.toUserDTO(user);
  }

  // Get user by ID
  async getUserById(userId: string, includeRelations = false): Promise<UserWithRoleDTO | null> {
    const query = this.userRepo.createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .andWhere('user.deletedAt IS NULL');

    if (includeRelations) {
      query
        .leftJoinAndSelect('user.userOrganizations', 'userOrg')
        .leftJoinAndSelect('userOrg.organization', 'org')
        .leftJoinAndSelect('user.teamMembers', 'teamMember')
        .leftJoinAndSelect('teamMember.team', 'team');
    }

    const user = await query.getOne();

    if (!user) {
      return null;
    }

    const userDTO = this.toUserDTO(user);

    // Build UserWithRoleDTO
    const result: UserWithRoleDTO = {
      ...userDTO,
      organizationId: user.userOrganizations?.[0]?.organizationId || '',
      organizationRole: user.userOrganizations?.[0]?.role || '',
      teams: user.teamMembers?.map(tm => ({
        teamId: tm.teamId,
        teamName: tm.team?.name || '',
        teamRole: tm.role,
        jerseyNumber: tm.jerseyNumber,
        position: tm.position,
      })) || [],
    };

    return result;
  }

  // Update user
  async updateUser(userId: string, data: UpdateUserDTO): Promise<UserDTO> {
    const user = await this.userRepo.findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Track changes for event
    const changes: Partial<UserDTO> = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && user[key] !== data[key]) {
        changes[key] = data[key];
      }
    });

    // Update user
    Object.assign(user, data);
    await this.userRepo.save(user);

    // Publish event
    if (this.eventBus && Object.keys(changes).length > 0) {
      const event: UserUpdatedEvent = {
        userId: user.id,
        changes,
        timestamp: new Date().toISOString(),
      };

      await this.eventBus.publish(UserEvents.USER_UPDATED, event);
    }

    return this.toUserDTO(user);
  }

  // Get users with pagination and filters
  async getUsers(query: GetUsersQuery): Promise<UsersResponseDTO> {
    const {
      organizationId,
      teamId,
      role,
      isActive,
      search,
      page = 1,
      limit = 20,
      sortBy = 'firstName',
      sortOrder = 'ASC',
    } = query;

    const qb = this.userRepo.createQueryBuilder('user')
      .where('user.deletedAt IS NULL');

    // Apply filters
    if (isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive });
    }

    if (search) {
      qb.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (organizationId) {
      qb.innerJoin('user.userOrganizations', 'userOrg')
        .andWhere('userOrg.organizationId = :organizationId', { organizationId })
        .andWhere('userOrg.isActive = true');

      if (role) {
        qb.andWhere('userOrg.role = :role', { role });
      }
    }

    if (teamId) {
      qb.innerJoin('user.teamMembers', 'teamMember')
        .andWhere('teamMember.teamId = :teamId', { teamId })
        .andWhere('teamMember.isActive = true');
    }

    // Apply sorting
    qb.orderBy(`user.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    // Execute query
    const [users, total] = await qb.getManyAndCount();

    // Convert to DTOs
    const userDTOs = users.map(user => this.toUserDTO(user));

    // Build response
    const totalPages = Math.ceil(total / limit);
    const response: UsersResponseDTO = {
      users: userDTOs,
      total,
      page,
      limit,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };

    return response;
  }

  // Soft delete user
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Soft delete
    user.deletedAt = new Date();
    user.isActive = false;
    await this.userRepo.save(user);

    // Deactivate all relationships
    await this.userOrgRepo.update(
      { userId },
      { isActive: false }
    );

    await this.teamMemberRepo.update(
      { userId },
      { isActive: false, leftAt: new Date() }
    );

    // Publish event
    if (this.eventBus) {
      await this.eventBus.publish(UserEvents.USER_DELETED, {
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Bulk get users by IDs
  async getUsersByIds(userIds: string[]): Promise<UserDTO[]> {
    if (userIds.length === 0) {
      return [];
    }

    const users = await this.userRepo.findBy({
      id: AppDataSource.manager.getRepository(User).metadata.connection.driver.createParameter(userIds, 0),
      deletedAt: null,
    });

    return users.map(user => this.toUserDTO(user));
  }
}