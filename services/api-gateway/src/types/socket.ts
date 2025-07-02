import { Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  roles?: string[];
  permissions?: string[];
  organizationId?: string;
  teamIds?: string[];
  sessionId?: string;
}