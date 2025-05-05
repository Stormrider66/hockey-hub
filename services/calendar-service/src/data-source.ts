import 'dotenv/config'; // Make sure to load .env variables first
import { DataSource, DataSourceOptions } from 'typeorm';

// Define connection options separately for clarity
const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || process.env.POSTGRES_USER, // Fallback if needed
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
    database: process.env.DB_NAME || process.env.POSTGRES_DB, // Ensure correct DB name is loaded
    synchronize: false, // Never use TRUE in production!
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'], // Log queries in dev
    entities: [
        // Path relative to the compiled JS output (dist/src/entities...)
        // Or use __dirname if module context allows, but relative paths are often safer
        'dist/src/entities/**/*.js' 
    ],
    migrations: [
        'dist/src/migrations/**/*.js'
    ],
    // namingStrategy: new SnakeNamingStrategy(), // Re-enable later if needed and tested
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Create and export the DataSource instance
const AppDataSource = new DataSource(dataSourceOptions);

// Optional: Log connection status on initialization (useful for CLI)
AppDataSource.initialize()
    .then(() => {
        console.log('[DB] Calendar Service: Data Source Initialized!');
    })
    .catch((err) => {
        console.error('[DB] Calendar Service: Error during Data Source initialization:', err);
    });

export default AppDataSource; 