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
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const data_source_1 = __importDefault(require("../data-source"));
const User_1 = require("../entities/User");
const Organization_1 = require("../entities/Organization");
const Role_1 = require("../entities/Role");
const Team_1 = require("../entities/Team");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = __importDefault(require("../config/logger"));
function seedSkellefteaAIK() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initialize data source
            yield data_source_1.default.initialize();
            logger_1.default.info('Connected to database for seeding');
            const orgRepo = data_source_1.default.getRepository(Organization_1.Organization);
            const roleRepo = data_source_1.default.getRepository(Role_1.Role);
            const userRepo = data_source_1.default.getRepository(User_1.User);
            const teamRepo = data_source_1.default.getRepository(Team_1.Team);
            // 1. Create Organization
            let organization = yield orgRepo.findOne({ where: { name: 'Skellefteå AIK' } });
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
                yield orgRepo.save(organization);
                logger_1.default.info('Created organization: Skellefteå AIK');
            }
            // 2. Create Roles
            const roleNames = ['player', 'coach', 'equipment_manager', 'medical_staff', 'physical_trainer', 'parent', 'club_admin'];
            const roles = {};
            for (const roleName of roleNames) {
                let role = yield roleRepo.findOne({ where: { name: roleName } });
                if (!role) {
                    role = roleRepo.create({ name: roleName });
                    yield roleRepo.save(role);
                    logger_1.default.info(`Created role: ${roleName}`);
                }
                roles[roleName] = role;
            }
            // 3. Create Teams
            let aTeam = yield teamRepo.findOne({ where: { name: 'Skellefteå AIK A-lag', organizationId: organization.id } });
            if (!aTeam) {
                aTeam = teamRepo.create({
                    name: 'Skellefteå AIK A-lag',
                    organizationId: organization.id,
                    description: 'Senior Elite Team',
                    teamColor: '#FDB913'
                });
                yield teamRepo.save(aTeam);
                logger_1.default.info('Created team: A-lag');
            }
            // 4. Create Users
            const defaultPassword = yield bcryptjs_1.default.hash('Passw0rd!', 10);
            // Players
            const players = [
                { email: 'linus.karlsson@saik.se', firstName: 'Linus', lastName: 'Karlsson' },
                { email: 'oscar.lindberg@saik.se', firstName: 'Oscar', lastName: 'Lindberg' },
                { email: 'rickard.hugg@saik.se', firstName: 'Rickard', lastName: 'Hugg' },
                { email: 'jonathan.pudas@saik.se', firstName: 'Jonathan', lastName: 'Pudas' },
                { email: 'max.lindholm@saik.se', firstName: 'Max', lastName: 'Lindholm' }
            ];
            for (const playerData of players) {
                const existingUser = yield userRepo.findOne({ where: { email: playerData.email } });
                if (!existingUser) {
                    const player = userRepo.create(Object.assign(Object.assign({}, playerData), { passwordHash: defaultPassword, roles: [roles.player], organizationId: organization.id, status: 'active', preferredLanguage: 'sv' }));
                    yield userRepo.save(player);
                    logger_1.default.info(`Created player: ${playerData.firstName} ${playerData.lastName}`);
                }
            }
            // Coaches
            const coaches = [
                { email: 'robert.ohlsson@saik.se', firstName: 'Robert', lastName: 'Ohlsson' },
                { email: 'stefan.lassen@saik.se', firstName: 'Stefan', lastName: 'Lassen' }
            ];
            for (const coachData of coaches) {
                const existingUser = yield userRepo.findOne({ where: { email: coachData.email } });
                if (!existingUser) {
                    const coach = userRepo.create({
                        email: coachData.email,
                        firstName: coachData.firstName,
                        lastName: coachData.lastName,
                        passwordHash: defaultPassword,
                        roles: [roles.coach],
                        organizationId: organization.id,
                        status: 'active',
                        preferredLanguage: 'sv'
                    });
                    yield userRepo.save(coach);
                    logger_1.default.info(`Created coach: ${coachData.firstName} ${coachData.lastName}`);
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
                status: 'active',
                preferredLanguage: 'sv'
            });
            const existingMedical = yield userRepo.findOne({ where: { email: medicalStaff.email } });
            if (!existingMedical) {
                yield userRepo.save(medicalStaff);
                logger_1.default.info('Created medical staff: Anna Eriksson');
            }
            // Equipment Manager
            const equipmentManager = userRepo.create({
                email: 'equipment@saik.se',
                firstName: 'Erik',
                lastName: 'Jonsson',
                passwordHash: defaultPassword,
                roles: [roles.equipment_manager],
                organizationId: organization.id,
                status: 'active',
                preferredLanguage: 'sv'
            });
            const existingEquipment = yield userRepo.findOne({ where: { email: equipmentManager.email } });
            if (!existingEquipment) {
                yield userRepo.save(equipmentManager);
                logger_1.default.info('Created equipment manager: Erik Jonsson');
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
            logger_1.default.info('✅ Skellefteå AIK seed completed successfully!');
            logger_1.default.info('You can now login with any of these users using password: Passw0rd!');
            logger_1.default.info('Note: Team memberships were skipped due to entity/migration mismatch');
            yield data_source_1.default.destroy();
            process.exit(0);
        }
        catch (error) {
            logger_1.default.error('Seed failed:', error);
            // Also log to console for better visibility
            console.error('Detailed error:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Stack trace:', error.stack);
            }
            process.exit(1);
        }
    });
}
seedSkellefteaAIK();
//# sourceMappingURL=seed-skelleftea.js.map