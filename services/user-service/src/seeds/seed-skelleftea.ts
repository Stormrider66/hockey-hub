import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import AppDataSource from '../data-source';
import { User, UserStatus } from '../entities/User';
import { Organization } from '../entities/Organization';
import { Role } from '../entities/Role';
import { Team } from '../entities/Team';
import { TeamMember, TeamMemberRoleEnum } from '../entities/TeamMember';
import bcrypt from 'bcryptjs';
import logger from '../config/logger';

async function seedSkellefteaAIK() {
  try {
    // Initialize data source
    await AppDataSource.initialize();
    logger.info('Connected to database for seeding');

    const orgRepo = AppDataSource.getRepository(Organization);
    const roleRepo = AppDataSource.getRepository(Role);
    const userRepo = AppDataSource.getRepository(User);
    const teamRepo = AppDataSource.getRepository(Team);

    // 1. Create Organization
    let organization = await orgRepo.findOne({ where: { name: 'Skellefteå AIK' } });
    if (!organization) {
      organization = orgRepo.create({
        name: 'Skellefteå AIK',
        country: 'SE',
        city: 'Skellefteå',
        address: 'Mossgatan 27, 931 31 Skellefteå',
        contactEmail: 'info@skellefteaaik.se',
        contactPhone: '0910-175 00',
        website: 'https://www.skellefteaaik.se',
        primaryColor: '#FDB913',
        secondaryColor: '#000000'
      });
      await orgRepo.save(organization);
      logger.info('Created organization: Skellefteå AIK');
    }

    // 2. Create Roles
    const roleNames = ['player', 'coach', 'equipment_manager', 'medical_staff', 'physical_trainer', 'parent', 'club_admin'];
    const roles: Record<string, Role> = {};
    
    for (const roleName of roleNames) {
      let role = await roleRepo.findOne({ where: { name: roleName } });
      if (!role) {
        role = roleRepo.create({ name: roleName });
        await roleRepo.save(role);
        logger.info(`Created role: ${roleName}`);
      }
      roles[roleName] = role;
    }

    // 3. Create Teams
    let aTeam = await teamRepo.findOne({ where: { name: 'Skellefteå AIK A-lag', organizationId: organization.id } });
    if (!aTeam) {
      aTeam = teamRepo.create({
        name: 'Skellefteå AIK A-lag',
        organizationId: organization.id,
        description: 'Senior Elite Team',
        teamColor: '#FDB913'
      });
      await teamRepo.save(aTeam);
      logger.info('Created team: A-lag');
    }

    // 4. Create Users
    const defaultPassword = await bcrypt.hash('Passw0rd!', 10);

    // Players
    const players = [
      { email: 'linus.karlsson@saik.se', firstName: 'Linus', lastName: 'Karlsson' },
      { email: 'oscar.lindberg@saik.se', firstName: 'Oscar', lastName: 'Lindberg' },
      { email: 'rickard.hugg@saik.se', firstName: 'Rickard', lastName: 'Hugg' },
      { email: 'jonathan.pudas@saik.se', firstName: 'Jonathan', lastName: 'Pudas' },
      { email: 'max.lindholm@saik.se', firstName: 'Max', lastName: 'Lindholm' }
    ];

    for (const playerData of players) {
      const existingUser = await userRepo.findOne({ where: { email: playerData.email } });
      if (!existingUser) {
        const player = userRepo.create({
          ...playerData,
          passwordHash: defaultPassword,
          roles: [roles.player],
          organizationId: organization.id,
          status: 'active' as UserStatus,
          preferredLanguage: 'sv'
        });
        await userRepo.save(player);
        logger.info(`Created player: ${playerData.firstName} ${playerData.lastName}`);
      }
    }

    // Coaches
    const coaches = [
      { email: 'robert.ohlsson@saik.se', firstName: 'Robert', lastName: 'Ohlsson' },
      { email: 'stefan.lassen@saik.se', firstName: 'Stefan', lastName: 'Lassen' }
    ];

    for (const coachData of coaches) {
      const existingUser = await userRepo.findOne({ where: { email: coachData.email } });
      if (!existingUser) {
        const coach = userRepo.create({
          email: coachData.email,
          firstName: coachData.firstName,
          lastName: coachData.lastName,
          passwordHash: defaultPassword,
          roles: [roles.coach],
          organizationId: organization.id,
          status: 'active' as UserStatus,
          preferredLanguage: 'sv'
        });
        await userRepo.save(coach);
        logger.info(`Created coach: ${coachData.firstName} ${coachData.lastName}`);
      }
    }

    // Medical Staff
    const medicalStaff = userRepo.create({
      email: 'medical@saik.se',
      firstName: 'Anna',
      lastName: 'Eriksson',
      passwordHash: defaultPassword,
      roles: [roles.medical_staff],
      organizationId: organization.id,
      status: 'active' as UserStatus,
      preferredLanguage: 'sv'
    });

    const existingMedical = await userRepo.findOne({ where: { email: medicalStaff.email } });
    if (!existingMedical) {
      await userRepo.save(medicalStaff);
      logger.info('Created medical staff: Anna Eriksson');
    }

    // Equipment Manager
    const equipmentManager = userRepo.create({
      email: 'equipment@saik.se',
      firstName: 'Erik',
      lastName: 'Jonsson',
      passwordHash: defaultPassword,
      roles: [roles.equipment_manager],
      organizationId: organization.id,
      status: 'active' as UserStatus,
      preferredLanguage: 'sv'
    });

    const existingEquipment = await userRepo.findOne({ where: { email: equipmentManager.email } });
    if (!existingEquipment) {
      await userRepo.save(equipmentManager);
      logger.info('Created equipment manager: Erik Jonsson');
    }

    // 5. Create Team Memberships
    // Skipping team membership creation for now - entity/migration mismatch
    /*
    const teamMemberRepo = AppDataSource.getRepository(TeamMember);
    
    // Add all created users to the A-lag team
    const allUsers = await userRepo.find({
      where: { organizationId: organization.id },
      relations: ['roles']
    });

    for (const user of allUsers) {
      const userRole = user.roles[0]?.name;
      let memberRole: TeamMemberRoleEnum = 'staff';
      
      if (userRole === 'player') memberRole = 'player';
      else if (userRole === 'coach') memberRole = 'coach';
      else if (userRole === 'medical_staff' || userRole === 'equipment_manager') memberRole = 'staff';

      // Check if membership exists
      const existingMembership = await teamMemberRepo.findOne({
        where: { userId: user.id, teamId: aTeam.id }
      });

      if (!existingMembership) {
        const membership = teamMemberRepo.create({
          userId: user.id,
          teamId: aTeam.id,
          role: memberRole,
          active: true
        });
        await teamMemberRepo.save(membership);
        logger.info(`Added ${user.firstName} ${user.lastName} to A-lag as ${memberRole}`);
      }
    }
    */

    logger.info('✅ Skellefteå AIK seed completed successfully!');
    logger.info('You can now login with any of these users using password: Passw0rd!');
    logger.info('Note: Team memberships were skipped due to entity/migration mismatch');
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    // Also log to console for better visibility
    console.error('Detailed error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

seedSkellefteaAIK(); 