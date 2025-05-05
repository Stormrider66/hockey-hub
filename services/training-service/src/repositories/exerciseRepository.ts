import { AppDataSource } from '../data-source';
import { Exercise } from '../entities/Exercise';

// Standard repository for Exercise entity
export const exerciseRepository = AppDataSource.getRepository(Exercise);