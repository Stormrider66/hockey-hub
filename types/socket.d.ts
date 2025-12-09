/**
 * Socket.io type definitions for Hockey Hub real-time features
 */

import { User } from './global';

// Socket event types
interface ServerToClientEvents {
  // Authentication events
  'auth:success': (data: { user: User; token: string }) => void;
  'auth:error': (error: string) => void;
  
  // Notification events
  'notification:new': (notification: Notification) => void;
  'notification:read': (notificationId: string) => void;
  'notification:deleted': (notificationId: string) => void;
  
  // Chat events
  'message:new': (message: ChatMessage) => void;
  'message:edited': (message: ChatMessage) => void;
  'message:deleted': (messageId: string) => void;
  'typing:start': (data: { userId: string; channelId: string }) => void;
  'typing:stop': (data: { userId: string; channelId: string }) => void;
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
  
  // Training events
  'training:session:started': (session: TrainingSession) => void;
  'training:session:completed': (session: TrainingSession) => void;
  'training:session:updated': (session: TrainingSession) => void;
  'training:exercise:completed': (data: { sessionId: string; exerciseId: string }) => void;
  
  // Calendar events
  'event:created': (event: CalendarEvent) => void;
  'event:updated': (event: CalendarEvent) => void;
  'event:deleted': (eventId: string) => void;
  'event:reminder': (event: CalendarEvent) => void;
  
  // Medical events
  'injury:reported': (injury: Injury) => void;
  'injury:updated': (injury: Injury) => void;
  'medical:urgent': (data: { message: string; playerId: string }) => void;
  
  // System events
  'system:maintenance': (data: { message: string; scheduledAt: string }) => void;
  'system:announcement': (announcement: SystemAnnouncement) => void;
  
  // Error events
  'error': (error: string) => void;
  'disconnect': (reason: string) => void;
}

interface ClientToServerEvents {
  // Authentication
  'auth:login': (data: { token: string }) => void;
  'auth:logout': () => void;
  
  // Chat
  'message:send': (data: { channelId: string; content: string; type?: 'text' | 'file' | 'image' }) => void;
  'message:edit': (data: { messageId: string; content: string }) => void;
  'message:delete': (messageId: string) => void;
  'typing:start': (channelId: string) => void;
  'typing:stop': (channelId: string) => void;
  'channel:join': (channelId: string) => void;
  'channel:leave': (channelId: string) => void;
  
  // Training
  'training:session:join': (sessionId: string) => void;
  'training:session:leave': (sessionId: string) => void;
  'training:exercise:start': (data: { sessionId: string; exerciseId: string }) => void;
  'training:exercise:complete': (data: { sessionId: string; exerciseId: string; result: any }) => void;
  
  // Notifications
  'notification:mark_read': (notificationId: string) => void;
  'notification:mark_all_read': () => void;
  
  // Presence
  'presence:update': (status: 'online' | 'away' | 'busy' | 'offline') => void;
}

interface InterServerEvents {
  ping: () => void;
  'user:broadcast': (data: { userId: string; event: string; data: any }) => void;
  'room:broadcast': (data: { room: string; event: string; data: any }) => void;
}

interface SocketData {
  user?: User;
  rooms: string[];
  lastActivity: Date;
}

// Socket room types
type SocketRoom = 
  | `user:${string}`           // User-specific room
  | `team:${string}`           // Team room
  | `organization:${string}`   // Organization room
  | `chat:${string}`          // Chat channel room
  | `training:${string}`      // Training session room
  | `medical:${string}`       // Medical staff room
  | 'global'                  // Global announcements
  | 'admin';                  // Admin-only room

// Chat types
interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  editedAt?: Date;
  createdAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    type: string;
    size: number;
  }>;
}

interface ChatChannel {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'team' | 'organization';
  description?: string;
  isPrivate: boolean;
  organizationId?: string;
  teamId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

// Training types
interface TrainingSession {
  id: string;
  name: string;
  description?: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'sport_specific';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  trainerId: string;
  playerIds: string[];
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  exercises: TrainingExercise[];
}

interface TrainingExercise {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  sets?: number;
  reps?: number;
  weight?: number;
  distance?: number;
  instructions?: string;
  completed?: boolean;
  result?: any;
}

// Calendar types
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'training' | 'game' | 'meeting' | 'medical' | 'other';
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location?: string;
  organizationId?: string;
  teamId?: string;
  createdBy: string;
  participants: string[];
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
}

// Medical types
interface Injury {
  id: string;
  playerId: string;
  type: string;
  severity: 'minor' | 'moderate' | 'severe';
  bodyPart: string;
  description: string;
  status: 'active' | 'healing' | 'recovered';
  reportedAt: Date;
  expectedRecoveryDate?: Date;
  reportedBy: string;
}

// Notification types
interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: Date;
  expiresAt?: Date;
}

// System types
interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'maintenance' | 'feature';
  targetRoles?: UserRole[];
  scheduledAt: Date;
  expiresAt?: Date;
  createdBy: string;
}

// Socket middleware types
interface SocketAuthMiddleware {
  (socket: any, next: (err?: Error) => void): void;
}

interface SocketRoomMiddleware {
  (socket: any, next: (err?: Error) => void): void;
}

// Export types for use in other files
export {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  SocketRoom,
  ChatMessage,
  ChatChannel,
  TrainingSession,
  TrainingExercise,
  CalendarEvent,
  Injury,
  Notification,
  SystemAnnouncement,
  SocketAuthMiddleware,
  SocketRoomMiddleware,
};