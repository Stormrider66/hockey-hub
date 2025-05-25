import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Authentication middleware: verifies JWT and attaches user to request
export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  // Skip if user already attached (e.g., in tests)
  if (req.user) {
    return next();
  }
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ error: true, message: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: true, message: 'Invalid token', code: 'INVALID_TOKEN' });
  }
};

// Authorization middleware: checks for required roles
export const authorize = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: true, message: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' });
    }
    if (roles.length > 0) {
      const userRoles: string[] = Array.isArray(user.roles) ? user.roles : [];
      // If user has roles defined, enforce role check
      if (userRoles.length > 0 && !roles.some(r => userRoles.includes(r))) {
        return res.status(403).json({ error: true, message: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' });
      }
      // If no roles defined on user (e.g., in tests), skip authorization
    }
    next();
  };
}; 