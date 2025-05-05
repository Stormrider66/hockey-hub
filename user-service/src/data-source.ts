// Re-export the AppDataSource from services/user-service
import { DataSource } from 'typeorm';

// Create a minimal DataSource if the real one cannot be imported
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'user_service',
  synchronize: false,
  logging: false,
  entities: [],
  migrations: [],
  subscribers: []
});

export default AppDataSource; 