import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Organization } from '../entities/organization.entity';
import { Team } from '../entities/team.entity';
import { TeamMembership } from '../entities/team-membership.entity';
import { PlayerParentLink } from '../entities/player-parent-link.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import 'dotenv/config'; // Make sure to install dotenv

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.USER_DB_HOST || 'localhost',
    port: parseInt(process.env.USER_DB_PORT || '5432', 10),
    username: process.env.USER_DB_USERNAME || 'postgres', // Replace with your actual username
    password: process.env.USER_DB_PASSWORD || 'password', // Replace with your actual password
    database: process.env.USER_DB_NAME || 'hockeyhub_user_service', // Replace with your actual db name
    // schema: 'user_service', // Uncomment if using separate schemas per service
    entities: [
        User,
        Role,
        Organization,
        Team,
        TeamMembership,
        PlayerParentLink,
        RefreshToken
        // Add other entities here
    ],
    // migrationsTableName: 'typeorm_migrations', // Optional: Customize migration table name
    // migrations: [__dirname + '/../migrations/*{.ts,.js}'], // Point to your migrations directory
    // cli: { // Optional: CLI configuration
    //    migrationsDir: 'src/migrations'
    // },
    synchronize: process.env.NODE_ENV === 'development', // Be careful with synchronize in production! Use migrations instead.
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'], // Log queries in dev
};

export const AppDataSource = new DataSource(dataSourceOptions);

// Function to initialize connection (call this in your app entry point)
export const initializeDataSource = async () => {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("Data Source has been initialized!");
        }
    } catch (err) {
        console.error("Error during Data Source initialization:", err);
        process.exit(1); // Exit if DB connection fails
    }
}; 