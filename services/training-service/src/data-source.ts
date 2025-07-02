import { DataSource } from 'typeorm';
import config from './config/typeorm.config';

export const AppDataSource = new DataSource(config);