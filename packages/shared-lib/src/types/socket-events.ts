// Real-time event type definitions for Socket.io

// Training Session Events
export interface TrainingSessionUpdateEvent {
  sessionId: string;
  updates: {
    status?: 'active' | 'paused' | 'completed';
    currentExercise?: number;
    completedExercises?: number[];
    participantProgress?: {
      playerId: string;
      exerciseId: string;
      sets: number;
      reps: number;
      weight?: number;
      notes?: string;
    }[];
  };
  updatedBy: string;
  timestamp: Date;
}

export interface TrainingSessionJoinEvent {
  sessionId: string;
  userId: string;
  userRole: string;
  userName: string;
}

export interface TrainingSessionLeaveEvent {
  sessionId: string;
  userId: string;
}

// Calendar Events
export interface CalendarEventUpdateEvent {
  eventId: string;
  eventType: 'training' | 'practice' | 'game' | 'meeting' | 'medical' | 'equipment';
  changes: {
    title?: string;
    startTime?: Date;
    endTime?: Date;
    location?: string;
    participants?: string[];
    status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
  };
  affectedUsers: string[];
  updatedBy: string;
}

export interface CalendarEventCreatedEvent {
  event: {
    id: string;
    title: string;
    type: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    participants: string[];
    description?: string;
  };
  createdBy: string;
}

export interface CalendarEventDeletedEvent {
  eventId: string;
  eventType: string;
  affectedUsers: string[];
  deletedBy: string;
  reason?: string;
}

// Dashboard Widget Events
export interface DashboardWidgetUpdateEvent {
  widgetId: string;
  widgetType: 'stats' | 'chart' | 'list' | 'calendar' | 'notification';
  data: any;
  updateType: 'full' | 'partial' | 'append';
}

export interface DashboardMetricUpdateEvent {
  userId: string;
  metrics: {
    type: string;
    value: number | string;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
  }[];
}

// Activity Feed Events
export interface ActivityFeedEvent {
  id: string;
  type: 'user_action' | 'system_event' | 'achievement' | 'announcement';
  actor: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  action: string;
  target?: {
    type: string;
    id: string;
    name: string;
  };
  metadata?: Record<string, any>;
  timestamp: Date;
  visibility: 'public' | 'team' | 'organization' | 'private';
}

// Collaboration Events
export interface CollaborationCursorEvent {
  userId: string;
  userName: string;
  documentId: string;
  position: {
    x: number;
    y: number;
  };
  selection?: {
    start: number;
    end: number;
  };
  color: string;
}

export interface CollaborationEditEvent {
  documentId: string;
  userId: string;
  changes: {
    type: 'insert' | 'delete' | 'format';
    position: number;
    content?: string;
    length?: number;
    attributes?: Record<string, any>;
  }[];
  version: number;
}

// System Events
export interface SystemMaintenanceEvent {
  type: 'scheduled' | 'emergency';
  startTime: Date;
  estimatedDuration: number;
  affectedServices: string[];
  message: string;
}

export interface ServiceStatusEvent {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  errorRate?: number;
  timestamp: Date;
}

// Room Management
export interface RoomJoinEvent {
  roomType: 'training' | 'calendar' | 'dashboard' | 'document' | 'chat';
  roomId: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface RoomLeaveEvent {
  roomType: string;
  roomId: string;
  userId: string;
}

export interface RoomUsersUpdateEvent {
  roomId: string;
  users: {
    id: string;
    name: string;
    avatar?: string;
    status: 'active' | 'idle' | 'away';
  }[];
}

// Event Type Map
export enum SocketEventType {
  // Training
  TRAINING_SESSION_UPDATE = 'training:session:update',
  TRAINING_SESSION_JOIN = 'training:session:join',
  TRAINING_SESSION_LEAVE = 'training:session:leave',
  
  // Calendar
  CALENDAR_EVENT_UPDATE = 'calendar:event:update',
  CALENDAR_EVENT_CREATED = 'calendar:event:created',
  CALENDAR_EVENT_DELETED = 'calendar:event:deleted',
  
  // Dashboard
  DASHBOARD_WIDGET_UPDATE = 'dashboard:widget:update',
  DASHBOARD_METRIC_UPDATE = 'dashboard:metric:update',
  
  // Activity
  ACTIVITY_FEED_NEW = 'activity:feed:new',
  ACTIVITY_FEED_UPDATE = 'activity:feed:update',
  
  // Collaboration
  COLLABORATION_CURSOR = 'collaboration:cursor',
  COLLABORATION_EDIT = 'collaboration:edit',
  COLLABORATION_SAVE = 'collaboration:save',
  
  // System
  SYSTEM_MAINTENANCE = 'system:maintenance',
  SERVICE_STATUS_UPDATE = 'service:status:update',
  
  // Rooms
  ROOM_JOIN = 'room:join',
  ROOM_LEAVE = 'room:leave',
  ROOM_USERS_UPDATE = 'room:users:update',
  
  // Connection
  CONNECTION_SUCCESS = 'connection:success',
  CONNECTION_ERROR = 'connection:error',
  RECONNECT_ATTEMPT = 'reconnect:attempt',
  RECONNECT_SUCCESS = 'reconnect:success',
  RECONNECT_FAILED = 'reconnect:failed'
}

// Server to Client Events
export interface ServerToClientEvents {
  [SocketEventType.TRAINING_SESSION_UPDATE]: (data: TrainingSessionUpdateEvent) => void;
  [SocketEventType.TRAINING_SESSION_JOIN]: (data: TrainingSessionJoinEvent) => void;
  [SocketEventType.TRAINING_SESSION_LEAVE]: (data: TrainingSessionLeaveEvent) => void;
  
  [SocketEventType.CALENDAR_EVENT_UPDATE]: (data: CalendarEventUpdateEvent) => void;
  [SocketEventType.CALENDAR_EVENT_CREATED]: (data: CalendarEventCreatedEvent) => void;
  [SocketEventType.CALENDAR_EVENT_DELETED]: (data: CalendarEventDeletedEvent) => void;
  
  [SocketEventType.DASHBOARD_WIDGET_UPDATE]: (data: DashboardWidgetUpdateEvent) => void;
  [SocketEventType.DASHBOARD_METRIC_UPDATE]: (data: DashboardMetricUpdateEvent) => void;
  
  [SocketEventType.ACTIVITY_FEED_NEW]: (data: ActivityFeedEvent) => void;
  [SocketEventType.ACTIVITY_FEED_UPDATE]: (data: ActivityFeedEvent) => void;
  
  [SocketEventType.COLLABORATION_CURSOR]: (data: CollaborationCursorEvent) => void;
  [SocketEventType.COLLABORATION_EDIT]: (data: CollaborationEditEvent) => void;
  
  [SocketEventType.SYSTEM_MAINTENANCE]: (data: SystemMaintenanceEvent) => void;
  [SocketEventType.SERVICE_STATUS_UPDATE]: (data: ServiceStatusEvent) => void;
  
  [SocketEventType.ROOM_USERS_UPDATE]: (data: RoomUsersUpdateEvent) => void;
  
  [SocketEventType.CONNECTION_SUCCESS]: (data: { userId: string; sessionId: string }) => void;
  [SocketEventType.CONNECTION_ERROR]: (error: { message: string; code: string }) => void;
}

// Client to Server Events
export interface ClientToServerEvents {
  [SocketEventType.TRAINING_SESSION_UPDATE]: (data: Partial<TrainingSessionUpdateEvent>) => void;
  [SocketEventType.TRAINING_SESSION_JOIN]: (sessionId: string) => void;
  [SocketEventType.TRAINING_SESSION_LEAVE]: (sessionId: string) => void;
  
  [SocketEventType.CALENDAR_EVENT_UPDATE]: (data: Partial<CalendarEventUpdateEvent>) => void;
  
  [SocketEventType.COLLABORATION_CURSOR]: (data: Omit<CollaborationCursorEvent, 'userId' | 'userName'>) => void;
  [SocketEventType.COLLABORATION_EDIT]: (data: Omit<CollaborationEditEvent, 'userId'>) => void;
  
  [SocketEventType.ROOM_JOIN]: (data: Omit<RoomJoinEvent, 'userId'>) => void;
  [SocketEventType.ROOM_LEAVE]: (data: Omit<RoomLeaveEvent, 'userId'>) => void;
  
  ping: () => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
}

// Socket Data Types
export interface SocketData {
  userId: string;
  organizationId: string;
  teamIds: string[];
  roles: string[];
  permissions: string[];
  sessionId: string;
}

// Error Types
export interface SocketError {
  code: string;
  message: string;
  details?: any;
}