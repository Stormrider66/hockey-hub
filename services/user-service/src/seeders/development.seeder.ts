import { AppDataSource } from '../config/database';
import { Organization } from '../entities/Organization';
import { User, Handedness } from '../entities/User';
import { Team, TeamType } from '../entities/Team';
import { UserOrganization, OrganizationRole } from '../entities/UserOrganization';
import { TeamMember, TeamRole } from '../entities/TeamMember';
import { ParentChildRelationship } from '../entities/ParentChildRelationship';
import * as bcrypt from 'bcrypt';

interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  orgRole: OrganizationRole;
  teamRole?: TeamRole;
  dateOfBirth?: Date;
  jerseyNumber?: number;
  position?: string;
  handedness?: Handedness;
}

export class DevelopmentSeeder {
  private organization: Organization;
  private teams: { [key: string]: Team } = {};
  private users: { [key: string]: User } = {};

  async seed() {
    console.log('🌱 Starting development seed...');

    try {
      await AppDataSource.initialize();

      // Clean existing data
      await this.cleanDatabase();

      // Create organization
      await this.createOrganization();

      // Create teams
      await this.createTeams();

      // Create users
      await this.createUsers();

      // Create parent-child relationships
      await this.createParentChildRelationships();

      console.log('✅ Development seed completed successfully!');
      
      // Print login credentials
      this.printLoginCredentials();

    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    } finally {
      await AppDataSource.destroy();
    }
  }

  private async cleanDatabase() {
    console.log('🧹 Cleaning database...');
    
    // Delete in reverse order of dependencies
    await AppDataSource.getRepository(ParentChildRelationship).delete({});
    await AppDataSource.getRepository(TeamMember).delete({});
    await AppDataSource.getRepository(UserOrganization).delete({});
    await AppDataSource.getRepository(Team).delete({});
    await AppDataSource.getRepository(User).delete({});
    await AppDataSource.getRepository(Organization).delete({});
  }

  private async createOrganization() {
    console.log('🏢 Creating organization...');
    
    const orgRepo = AppDataSource.getRepository(Organization);
    this.organization = await orgRepo.save({
      name: 'Hockey Hub Demo Club',
      subdomain: 'demo',
      primaryColor: '#0066CC',
      secondaryColor: '#FF6600',
      subscriptionTier: 'premium',
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      isActive: true,
    });
  }

  private async createTeams() {
    console.log('🏒 Creating teams...');
    
    const teamRepo = AppDataSource.getRepository(Team);
    
    const teamsData = [
      { name: 'U16 Elite', teamType: TeamType.YOUTH, ageGroup: 'U16', season: '2024' },
      { name: 'U18 AAA', teamType: TeamType.YOUTH, ageGroup: 'U18', season: '2024' },
      { name: 'Junior A', teamType: TeamType.JUNIOR, ageGroup: 'Junior', season: '2024' },
      { name: 'Senior Men', teamType: TeamType.SENIOR, ageGroup: 'Senior', season: '2024' },
      { name: 'Rec League Stars', teamType: TeamType.RECREATIONAL, ageGroup: 'Adult', season: '2024' },
    ];

    for (const teamData of teamsData) {
      const team = await teamRepo.save({
        ...teamData,
        organizationId: this.organization.id,
        isActive: true,
      });
      this.teams[teamData.name] = team;
    }
  }

  private async createUsers() {
    console.log('👥 Creating users...');
    
    const userRepo = AppDataSource.getRepository(User);
    const userOrgRepo = AppDataSource.getRepository(UserOrganization);
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);

    const usersData: SeedUser[] = [
      // Admins
      {
        email: 'admin@hockeyhub.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        orgRole: OrganizationRole.SUPER_ADMIN,
      },
      {
        email: 'clubadmin@demo.com',
        password: 'clubadmin123',
        firstName: 'Club',
        lastName: 'Admin',
        orgRole: OrganizationRole.ADMIN,
      },

      // Coaches
      {
        email: 'headcoach@demo.com',
        password: 'coach123',
        firstName: 'John',
        lastName: 'Smith',
        orgRole: OrganizationRole.COACH,
        teamRole: TeamRole.COACH,
      },
      {
        email: 'assistantcoach@demo.com',
        password: 'coach123',
        firstName: 'Mike',
        lastName: 'Johnson',
        orgRole: OrganizationRole.ASSISTANT_COACH,
        teamRole: TeamRole.ASSISTANT_COACH,
      },

      // Medical Staff
      {
        email: 'trainer@demo.com',
        password: 'trainer123',
        firstName: 'Sarah',
        lastName: 'Williams',
        orgRole: OrganizationRole.MEDICAL_STAFF,
        teamRole: TeamRole.MEDICAL_STAFF,
      },

      // Players
      {
        email: 'player1@demo.com',
        password: 'player123',
        firstName: 'Connor',
        lastName: 'McDavid',
        orgRole: OrganizationRole.PLAYER,
        teamRole: TeamRole.PLAYER,
        dateOfBirth: new Date('2005-01-13'),
        jerseyNumber: 97,
        position: 'Center',
        handedness: Handedness.LEFT,
      },
      {
        email: 'player2@demo.com',
        password: 'player123',
        firstName: 'Auston',
        lastName: 'Matthews',
        orgRole: OrganizationRole.PLAYER,
        teamRole: TeamRole.PLAYER,
        dateOfBirth: new Date('2005-09-17'),
        jerseyNumber: 34,
        position: 'Center',
        handedness: Handedness.LEFT,
      },
      {
        email: 'player3@demo.com',
        password: 'player123',
        firstName: 'Sidney',
        lastName: 'Crosby',
        orgRole: OrganizationRole.PLAYER,
        teamRole: TeamRole.PLAYER,
        dateOfBirth: new Date('2005-08-07'),
        jerseyNumber: 87,
        position: 'Center',
        handedness: Handedness.LEFT,
      },

      // Parents
      {
        email: 'parent1@demo.com',
        password: 'parent123',
        firstName: 'Brian',
        lastName: 'McDavid',
        orgRole: OrganizationRole.PARENT,
      },
      {
        email: 'parent2@demo.com',
        password: 'parent123',
        firstName: 'Ema',
        lastName: 'Matthews',
        orgRole: OrganizationRole.PARENT,
      },
    ];

    for (const userData of usersData) {
      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await userRepo.save({
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        dateOfBirth: userData.dateOfBirth,
        jerseyNumber: userData.jerseyNumber,
        position: userData.position,
        handedness: userData.handedness,
        isActive: true,
        emailVerified: true,
      });

      this.users[userData.email] = user;

      // Add to organization
      await userOrgRepo.save({
        userId: user.id,
        organizationId: this.organization.id,
        role: userData.orgRole,
        isActive: true,
      });

      // Add to team if applicable
      if (userData.teamRole) {
        const team = this.teams['U18 AAA']; // Default team for demo
        await teamMemberRepo.save({
          teamId: team.id,
          userId: user.id,
          role: userData.teamRole,
          jerseyNumber: userData.jerseyNumber,
          position: userData.position,
          isActive: true,
        });
      }
    }
  }

  private async createParentChildRelationships() {
    console.log('👨‍👩‍👧‍👦 Creating parent-child relationships...');
    
    const relationRepo = AppDataSource.getRepository(ParentChildRelationship);

    const relationships = [
      { parent: 'parent1@demo.com', child: 'player1@demo.com' },
      { parent: 'parent2@demo.com', child: 'player2@demo.com' },
    ];

    for (const rel of relationships) {
      await relationRepo.save({
        parentUserId: this.users[rel.parent].id,
        childUserId: this.users[rel.child].id,
        relationshipType: 'parent',
        isPrimaryContact: true,
      });
    }
  }

  private printLoginCredentials() {
    console.log('\n📋 Login Credentials:');
    console.log('===================');
    console.log('Admin:           admin@hockeyhub.com / admin123');
    console.log('Club Admin:      clubadmin@demo.com / clubadmin123');
    console.log('Head Coach:      headcoach@demo.com / coach123');
    console.log('Trainer:         trainer@demo.com / trainer123');
    console.log('Player:          player1@demo.com / player123');
    console.log('Parent:          parent1@demo.com / parent123');
    console.log('\nOrganization subdomain: demo');
    console.log('===================\n');
  }
}

// Run seeder if called directly
if (require.main === module) {
  const seeder = new DevelopmentSeeder();
  seeder.seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}