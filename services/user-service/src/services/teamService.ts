import { getRepository, Repository } from 'typeorm';
import { User } from '../entities/User';
import { Team } from '../entities/Team';
import { TeamMember } from '../entities/TeamMember';
import { Organization } from '../entities/Organization';
import { NotFoundError, ConflictError } from '../errors/serviceErrors';
import logger from '../config/logger';

// DTOs (Consider defining these properly in a dtos folder)
interface CreateTeamDto {
    name: string;
    organizationId: string;
    category?: string;
    season?: string;
    logoUrl?: string;
    primaryColor?: string;
    description?: string;
}

interface UpdateTeamDto {
    name?: string;
    category?: string;
    season?: string;
    logoUrl?: string;
    primaryColor?: string;
    description?: string;
    status?: 'active' | 'inactive' | 'archived';
}

interface AddMemberDto {
    userId: string;
    role: 'player' | 'coach' | 'assistant_coach' | 'manager' | 'staff';
    position?: string;
    jerseyNumber?: string;
    startDate?: Date;
}

export class TeamService {
    private teamRepository: Repository<Team>;
    private memberRepository: Repository<TeamMember>;
    private userRepository: Repository<User>;
    private orgRepository: Repository<Organization>;

    constructor() {
        this.teamRepository = getRepository(Team);
        this.memberRepository = getRepository(TeamMember);
        this.userRepository = getRepository(User);
        this.orgRepository = getRepository(Organization);
    }

    async createTeam(data: CreateTeamDto, createdByUserId: string): Promise<Team> {
        logger.info(`Creating team '${data.name}' in organization ${data.organizationId} by user ${createdByUserId}`);
        
        // Check if organization exists
        const organization = await this.orgRepository.findOne({ where: { id: data.organizationId } });
        if (!organization) {
            throw new NotFoundError(`Organization with ID ${data.organizationId} not found`);
        }

        // Check for duplicate team name within the organization
        const existingTeam = await this.teamRepository.findOne({ 
            where: { name: data.name, organizationId: data.organizationId }
        });
        if (existingTeam) {
            throw new ConflictError(`Team name '${data.name}' already exists in this organization`);
        }

        const newTeam = this.teamRepository.create({
            ...data,
            status: 'active', // Default status
            // createdById: createdByUserId // Add if schema supports tracking creator
        });

        const savedTeam = await this.teamRepository.save(newTeam);
        logger.info(`Team created successfully with ID: ${savedTeam.id}`);
        return savedTeam;
    }

    async getTeamById(teamId: string, relations: string[] = []): Promise<Team> {
        const team = await this.teamRepository.findOne({ where: { id: teamId }, relations });
        if (!team) {
            throw new NotFoundError(`Team with ID ${teamId} not found`);
        }
        return team;
    }

    // Helper function to ensure team exists, throws if not found
    private async ensureTeamExists(teamId: string): Promise<void> {
        const count = await this.teamRepository.count({ where: { id: teamId }});
        if (count === 0) {
             throw new NotFoundError(`Team with ID ${teamId} not found`);
        }
    }

    async getTeamsByOrganization(organizationId: string): Promise<Team[]> {
        return this.teamRepository.find({ where: { organizationId } });
    }

    async updateTeam(teamId: string, data: UpdateTeamDto): Promise<Team> {
        logger.info(`Updating team ${teamId}`);
        const team = await this.getTeamById(teamId); // Ensures team exists and gets current data

        // Prevent changing organizationId if needed
        // delete (data as any).organizationId;

        Object.assign(team, data);
        const updatedTeam = await this.teamRepository.save(team);
        logger.info(`Team ${teamId} updated successfully`);
        return updatedTeam;
    }

    async deleteTeam(teamId: string): Promise<void> {
        logger.warn(`Attempting to soft delete team ${teamId}`);
        // Fetch the entity to pass to softRemove
        const teamEntity = await this.getTeamById(teamId); // Rename variable to avoid shadowing
        await this.teamRepository.softRemove(teamEntity); // Use softRemove with fetched entity
        logger.info(`Team ${teamId} soft deleted successfully`);
    }

    async addMemberToTeam(teamId: string, memberData: AddMemberDto): Promise<TeamMember> {
        logger.info(`Adding user ${memberData.userId} to team ${teamId} with role ${memberData.role}`);
        await this.ensureTeamExists(teamId); // Check if team exists
        const user = await this.userRepository.findOne({ where: { id: memberData.userId } });
        if (!user) {
            throw new NotFoundError(`User with ID ${memberData.userId} not found`);
        }

        // Check if user is already a member with this role
        const existingMembership = await this.memberRepository.findOne({
            where: { teamId, userId: memberData.userId, role: memberData.role }
        });
        if (existingMembership) {
            throw new ConflictError(`User ${memberData.userId} already has role '${memberData.role}' in team ${teamId}`);
        }

        const newMember = this.memberRepository.create({
            teamId,
            userId: memberData.userId,
            role: memberData.role,
            position: memberData.position,
            jerseyNumber: memberData.jerseyNumber,
            startDate: memberData.startDate || new Date(),
        });

        const savedMember = await this.memberRepository.save(newMember);
        logger.info(`User ${memberData.userId} added to team ${teamId} successfully (Membership ID: ${savedMember.id})`);
        return savedMember;
    }

    async removeMemberFromTeam(teamId: string, userId: string, role?: string): Promise<void> {
        logger.warn(`Attempting to remove user ${userId} from team ${teamId} (Role: ${role || 'any'})`);
        await this.ensureTeamExists(teamId); // Check if team exists
        const userExists = await this.userRepository.count({ where: { id: userId } });
        if (userExists === 0) {
            throw new NotFoundError(`User with ID ${userId} not found`);
        }

        const criteria: any = { teamId, userId };
        if (role) {
            criteria.role = role;
        }

        const memberships = await this.memberRepository.find({ where: criteria });

        if (memberships.length === 0) {
            throw new NotFoundError(`User ${userId} not found in team ${teamId} ${role ? 'with role ' + role : ''}`);
        }

        // Usually, we remove the membership record entirely
        await this.memberRepository.remove(memberships);
        // Or, if using soft delete on TeamMember:
        // await this.memberRepository.softRemove(memberships);
        logger.info(`Removed user ${userId} from team ${teamId} successfully`);
    }
    
    async getTeamMembers(teamId: string): Promise<User[]> {
        const teamWithMembers = await this.teamRepository.findOne({ // Rename variable
            where: { id: teamId },
            relations: ['members', 'members.user']
        });

        if (!teamWithMembers) {
            throw new NotFoundError(`Team with ID ${teamId} not found`);
        }
        
        // Ensure members and user are loaded
        if (!teamWithMembers.members) {
            return [];
        }
        return teamWithMembers.members.map(member => member.user).filter(user => !!user); // Filter out potential null users
    }

    // Helper to check if a user is a member of a team (useful for auth checks)
    async isUserMemberOfTeam(userId: string, teamId: string): Promise<boolean> {
        const count = await this.memberRepository.count({ where: { userId, teamId } });
        return count > 0;
    }
    
    // Helper to check if user has a specific role in a team
    async hasTeamRole(userId: string, teamId: string, roles: string[]): Promise<boolean> {
        const membership = await this.memberRepository.findOne({ 
            where: { userId, teamId }
        });
        return !!membership && roles.includes(membership.role);
    }
} 