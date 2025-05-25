import { physicalTrainerHandlers } from './physicalTrainerHandlers';
import { adminHandlers } from './adminHandlers';

export const handlers = [
  ...physicalTrainerHandlers,
  ...adminHandlers,
]; 