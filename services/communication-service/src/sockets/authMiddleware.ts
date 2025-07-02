import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ExtendedError } from 'socket.io/dist/namespace';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
    organizationId: string;
    roles: string[];
  };
}

export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Verify token
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET || 'secret') as any;

    // Attach user info to socket
    socket.userId = decoded.sub;
    socket.user = {
      id: decoded.sub,
      email: decoded.email,
      organizationId: decoded.organizationId,
      roles: decoded.roles || [],
    };

    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};