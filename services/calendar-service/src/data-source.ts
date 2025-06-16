import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

let dataSourceOptions: DataSourceOptions;

if (process.env.NODE_ENV === 'test') {
  // Use in-memory SQL.js for fast, isolated tests (no native deps)
  dataSourceOptions = {
    type: 'sqljs',
    autoSave: false,
    location: 'test-db',
    synchronize: true,
    entities: ['src/entities/**/*.ts'],
    logging: false,
  };
} else {
  dataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || process.env.POSTGRES_USER,
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
    database: process.env.DB_NAME || process.env.POSTGRES_DB,
    synchronize: false,
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    entities: process.env.NODE_ENV === 'development'
      ? ['src/entities/**/*.ts']
      : ['dist/src/entities/**/*.js'],
    migrations: process.env.NODE_ENV === 'development'
      ? ['src/migrations/**/*.ts']
      : ['dist/src/migrations/**/*.js'],
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
}

// Create and export the DataSource instance
const AppDataSource = new DataSource(dataSourceOptions);

if (process.env.NODE_ENV !== 'test') {
  AppDataSource.initialize()
    .then(() => {
      console.log('[DB] Calendar Service: Data Source Initialized!');
    })
    .catch((err) => {
      console.error('[DB] Calendar Service: Error during Data Source initialization:', err);
    });
}

export default AppDataSource; 