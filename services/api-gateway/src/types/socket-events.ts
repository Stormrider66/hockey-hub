// Local copy of essential socket event types to avoid cross-package type bleed
export enum SocketEventType {
  TRAINING_SESSION_UPDATE = 'training:session:update',
  TRAINING_SESSION_JOIN = 'training:session:join',
  TRAINING_SESSION_LEAVE = 'training:session:leave',
  CALENDAR_EVENT_UPDATE = 'calendar:event:update',
  CALENDAR_EVENT_CREATED = 'calendar:event:created',
  CALENDAR_EVENT_DELETED = 'calendar:event:deleted',
  DASHBOARD_WIDGET_UPDATE = 'dashboard:widget:update',
  DASHBOARD_METRIC_UPDATE = 'dashboard:metric:update',
  ACTIVITY_FEED_NEW = 'activity:feed:new',
  ACTIVITY_FEED_UPDATE = 'activity:feed:update',
  COLLABORATION_CURSOR = 'collaboration:cursor',
  COLLABORATION_EDIT = 'collaboration:edit',
  COLLABORATION_SAVE = 'collaboration:save',
  ROOM_JOIN = 'room:join',
  ROOM_LEAVE = 'room:leave',
  ROOM_USERS_UPDATE = 'room:users:update',
  CONNECTION_SUCCESS = 'connection:success',
  CONNECTION_ERROR = 'connection:error',
}

export interface TrainingSessionUpdateEvent {
  sessionId: string;
  updates: Record<string, any>;
  updatedBy: string;
  timestamp: Date;
}
export interface TrainingSessionJoinEvent { sessionId: string; userId: string; userRole: string; userName: string; }
export interface TrainingSessionLeaveEvent { sessionId: string; userId: string; }

export interface CalendarEventUpdateEvent {
  eventId: string;
  eventType: string;
  changes: Record<string, any>;
  affectedUsers: string[];
  updatedBy: string;
}
export interface CalendarEventCreatedEvent { event: any; createdBy: string; }
export interface CalendarEventDeletedEvent { eventId: string; eventType: string; affectedUsers: string[]; deletedBy: string; reason?: string; }

export interface DashboardWidgetUpdateEvent { widgetId: string; widgetType: string; data: any; updateType: 'full' | 'partial' | 'append'; }
export interface DashboardMetricUpdateEvent { userId: string; metrics: any[]; }

export interface ActivityFeedEvent { id: string; type: string; actor: { id: string; name: string }; action: string; metadata?: any; target?: any; timestamp: Date; visibility: string; }

export interface CollaborationCursorEvent { userId: string; userName: string; documentId: string; position: { x: number; y: number }; selection?: { start: number; end: number }; color: string; }
export interface CollaborationEditEvent { documentId: string; userId: string; changes: any[]; version: number; }

export interface SocketData {
  userId: string;
  organizationId: string;
  teamIds: string[];
  roles: string[];
  permissions: string[];
  sessionId: string;
}


