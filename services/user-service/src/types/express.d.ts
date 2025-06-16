import { AuthenticatedUser } from '../middleware/authenticateToken';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {}; 