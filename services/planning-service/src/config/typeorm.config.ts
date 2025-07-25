import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5438'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hockey_hub_planning',
  synchronize: false,
  logging: false,
  entities: [__dirname + '/../entities/*.{js,ts}'],
  migrations: [__dirname + '/../migrations/*.{js,ts}'],
  subscribers: [],
});