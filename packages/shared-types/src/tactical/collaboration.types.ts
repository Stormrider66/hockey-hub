/**
 * Tactical Collaboration Types
 * Shared types for real-time tactical collaboration system
 */

// User presence and collaboration state
export interface CollaborationUser {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  color: string; // Unique color for user cursors/highlights
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'idle' | 'offline';
  lastSeen: Date;
  cursor?: CursorPosition;
  currentTool?: string;
  isPresenting?: boolean;
}

export interface CursorPosition {
  x: number;
  y: number;
  target?: string; // Element ID or selector
}

// Collaboration sessions
export interface CollaborationSession {
  id: string;
  playId: string;
  hostUserId: string;
  title: string;
  description?: string;
  createdAt: Date;
  isActive: boolean;
  participants: CollaborationUser[];
  permissions: SessionPermissions;
  settings: SessionSettings;
  recordingEnabled: boolean;
}

export interface SessionPermissions {
  canEdit: string[]; // User IDs who can edit
  canView: string[]; // User IDs who can view
  canPresent: string[]; // User IDs who can present
  canRecord: string[]; // User IDs who can record
  isPublic: boolean; // If true, anyone with link can join
}

export interface SessionSettings {
  maxParticipants: number;
  requireApproval: boolean;
  enableChat: boolean;
  enableVoice: boolean;
  enableScreenShare: boolean;
  autoSave: boolean;
  lockFormation: boolean; // Prevent simultaneous editing
}

// Real-time updates and events
export interface TacticalUpdate {
  id: string;
  sessionId: string;
  userId: string;
  timestamp: Date;
  type: TacticalUpdateType;
  data: any;
  optimistic?: boolean; // For optimistic updates
}

export type TacticalUpdateType =
  | 'player_move'
  | 'player_add'
  | 'player_remove'
  | 'formation_change'
  | 'play_step_add'
  | 'play_step_edit'
  | 'play_step_remove'
  | 'highlight_add'
  | 'highlight_remove'
  | 'annotation_add'
  | 'annotation_edit'
  | 'annotation_remove'
  | 'tool_change'
  | 'zoom_change'
  | 'view_change';

// Specific update payloads
export interface PlayerMoveUpdate {
  playerId: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  stepIndex?: number;
}

export interface FormationChangeUpdate {
  formationType: string;
  playerPositions: Record<string, { x: number; y: number }>;
}

export interface HighlightUpdate {
  id: string;
  type: 'circle' | 'arrow' | 'line' | 'area';
  position: { x: number; y: number };
  size?: { width: number; height: number };
  color: string;
  temporary?: boolean; // Auto-remove after timeout
}

export interface AnnotationUpdate {
  id: string;
  text: string;
  position: { x: number; y: number };
  style: {
    fontSize: number;
    color: string;
    background?: string;
  };
}

// Conflict resolution
export interface Conflict {
  id: string;
  type: 'concurrent_edit' | 'version_mismatch' | 'permission_denied';
  updates: TacticalUpdate[];
  timestamp: Date;
  resolvedBy?: string;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: 'merge' | 'overwrite' | 'manual';
  winnerUserId?: string;
  mergedData?: any;
}

// Live coaching and presentation
export interface PresentationState {
  isPresenting: boolean;
  presenterId: string;
  currentStep: number;
  totalSteps: number;
  playbackSpeed: number;
  isPaused: boolean;
  highlightedElements: string[];
  pointerPosition?: { x: number; y: number };
}

export interface CoachingControl {
  type: 'play' | 'pause' | 'step_forward' | 'step_back' | 'highlight' | 'pointer' | 'zoom';
  data?: any;
  timestamp: Date;
}

// Chat and communication
export interface CollaborationMessage {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  type: 'text' | 'voice' | 'system';
  timestamp: Date;
  replyTo?: string;
  mentions?: string[];
}

export interface VoiceSession {
  id: string;
  sessionId: string;
  participants: string[];
  isActive: boolean;
  startedAt: Date;
  quality: 'low' | 'medium' | 'high';
}

// Session recording and playback
export interface SessionRecording {
  id: string;
  sessionId: string;
  startedAt: Date;
  endedAt?: Date;
  duration: number; // seconds
  events: TacticalUpdate[];
  metadata: {
    participants: CollaborationUser[];
    playTitle: string;
    recordedBy: string;
  };
}

export interface PlaybackState {
  recordingId: string;
  currentTime: number;
  duration: number;
  speed: number;
  isPlaying: boolean;
  events: TacticalUpdate[];
}

// WebSocket events
export interface ServerToClientEvents {
  // Session management
  'session:created': (session: CollaborationSession) => void;
  'session:updated': (session: CollaborationSession) => void;
  'session:ended': (sessionId: string) => void;
  'session:user_joined': (user: CollaborationUser, sessionId: string) => void;
  'session:user_left': (userId: string, sessionId: string) => void;
  
  // Real-time updates
  'tactical:update': (update: TacticalUpdate) => void;
  'tactical:batch_update': (updates: TacticalUpdate[]) => void;
  'tactical:conflict': (conflict: Conflict) => void;
  
  // Presence and cursors
  'presence:update': (userId: string, presence: UserPresence) => void;
  'cursor:move': (userId: string, position: CursorPosition) => void;
  
  // Presentation and coaching
  'presentation:start': (state: PresentationState) => void;
  'presentation:update': (state: PresentationState) => void;
  'presentation:end': () => void;
  'coaching:control': (control: CoachingControl) => void;
  
  // Communication
  'chat:message': (message: CollaborationMessage) => void;
  'voice:session_start': (session: VoiceSession) => void;
  'voice:session_end': (sessionId: string) => void;
  
  // Recording
  'recording:start': (recordingId: string) => void;
  'recording:stop': (recording: SessionRecording) => void;
  
  // System events
  'error': (error: { code: string; message: string; data?: any }) => void;
  'warning': (warning: { message: string; type: string }) => void;
}

export interface ClientToServerEvents {
  // Session management
  'session:create': (data: { playId: string; title: string; settings: SessionSettings }) => void;
  'session:join': (sessionId: string) => void;
  'session:leave': (sessionId: string) => void;
  'session:update_settings': (sessionId: string, settings: Partial<SessionSettings>) => void;
  
  // Real-time updates
  'tactical:update': (update: Omit<TacticalUpdate, 'id' | 'timestamp'>) => void;
  'tactical:request_sync': (sessionId: string) => void;
  'tactical:resolve_conflict': (conflictId: string, resolution: ConflictResolution) => void;
  
  // Presence and cursors
  'presence:update': (presence: Partial<UserPresence>) => void;
  'cursor:move': (position: CursorPosition) => void;
  
  // Presentation and coaching
  'presentation:start': (sessionId: string) => void;
  'presentation:update': (state: Partial<PresentationState>) => void;
  'presentation:end': (sessionId: string) => void;
  'coaching:control': (control: Omit<CoachingControl, 'timestamp'>) => void;
  
  // Communication
  'chat:send': (message: Omit<CollaborationMessage, 'id' | 'timestamp'>) => void;
  'voice:join': (sessionId: string) => void;
  'voice:leave': (sessionId: string) => void;
  
  // Recording
  'recording:start': (sessionId: string) => void;
  'recording:stop': (sessionId: string) => void;
  'recording:request': (recordingId: string) => void;
}

export interface InterServerEvents {
  'session:broadcast': (sessionId: string, event: string, data: any) => void;
}

export interface SocketData {
  userId: string;
  sessionId?: string;
  permissions: string[];
}

// Error types
export interface CollaborationError {
  code: 'SESSION_NOT_FOUND' | 'PERMISSION_DENIED' | 'MAX_PARTICIPANTS' | 'INVALID_UPDATE' | 'NETWORK_ERROR' | 'SYNC_FAILED';
  message: string;
  data?: any;
}

// Utility types
export type CollaborationEventHandler<T = any> = (data: T) => void;

export interface CollaborationHookOptions {
  sessionId: string;
  userId: string;
  autoReconnect?: boolean;
  retryAttempts?: number;
  syncInterval?: number;
}