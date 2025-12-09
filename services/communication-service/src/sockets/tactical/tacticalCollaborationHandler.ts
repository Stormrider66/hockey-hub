/**
 * Tactical Collaboration WebSocket Handler
 * Handles real-time tactical collaboration events
 */

import { Server, Socket } from 'socket.io';
import { AuthenticatedSocket } from '../authMiddleware';
import {
  CollaborationSession,
  CollaborationUser,
  TacticalUpdate,
  UserPresence,
  CursorPosition,
  PresentationState,
  CollaborationMessage,
  SessionRecording,
  Conflict,
  ConflictResolution,
  CoachingControl,
  VoiceSession,
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  SessionSettings
} from '@hockey-hub/shared-types/src/tactical/collaboration.types';

interface TacticalSocket extends AuthenticatedSocket {
  data: SocketData;
}

export class TacticalCollaborationHandler {
  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  private activeSessions: Map<string, CollaborationSession> = new Map();
  private sessionParticipants: Map<string, Set<string>> = new Map(); // sessionId -> set of socketIds
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> set of socketIds
  private sessionRecordings: Map<string, SessionRecording> = new Map();
  private userPresence: Map<string, UserPresence> = new Map();
  private sessionConflicts: Map<string, Conflict[]> = new Map();
  private presentationStates: Map<string, PresentationState> = new Map();
  private voiceSessions: Map<string, VoiceSession> = new Map();

  // Rate limiting
  private updateThrottles: Map<string, number> = new Map();
  private readonly UPDATE_THROTTLE_MS = 50;
  private readonly MAX_UPDATES_PER_SECOND = 20;
  private updateCounts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
    this.io = io;
    this.setupCleanupTimer();
  }

  handleConnection(socket: TacticalSocket) {
    console.log(`Tactical collaboration connection: ${socket.id} (user: ${socket.userId})`);
    
    // Initialize socket data
    socket.data = {
      userId: socket.userId!,
      permissions: [] // Will be set when joining a session
    };

    // Track user socket
    this.addUserSocket(socket.userId!, socket.id);
    
    // Update user presence
    this.updateUserPresence(socket.userId!, {
      status: 'online',
      lastSeen: new Date()
    });

    // Register event handlers
    this.registerSessionHandlers(socket);
    this.registerTacticalHandlers(socket);
    this.registerPresenceHandlers(socket);
    this.registerPresentationHandlers(socket);
    this.registerCommunicationHandlers(socket);
    this.registerRecordingHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });
  }

  private registerSessionHandlers(socket: TacticalSocket) {
    // Create session
    socket.on('session:create', async (data) => {
      try {
        const session = await this.createSession(data, socket.userId!);
        socket.emit('session:created', session);
        console.log(`Session created: ${session.id} by ${socket.userId}`);
      } catch (error) {
        socket.emit('error', {
          code: 'SESSION_CREATION_FAILED',
          message: 'Failed to create session',
          data: error
        });
      }
    });

    // Join session
    socket.on('session:join', async (sessionId) => {
      try {
        await this.joinSession(sessionId, socket);
        console.log(`User ${socket.userId} joined session ${sessionId}`);
      } catch (error) {
        socket.emit('error', {
          code: 'SESSION_JOIN_FAILED',
          message: 'Failed to join session',
          data: error
        });
      }
    });

    // Leave session
    socket.on('session:leave', (sessionId) => {
      this.leaveSession(sessionId, socket);
      console.log(`User ${socket.userId} left session ${sessionId}`);
    });

    // Update session settings
    socket.on('session:update_settings', (sessionId, settings) => {
      this.updateSessionSettings(sessionId, settings, socket);
    });
  }

  private registerTacticalHandlers(socket: TacticalSocket) {
    // Tactical update
    socket.on('tactical:update', (update) => {
      if (!this.checkRateLimit(socket.userId!)) {
        socket.emit('warning', {
          message: 'Rate limit exceeded for updates',
          type: 'RATE_LIMIT'
        });
        return;
      }

      this.handleTacticalUpdate(socket, update);
    });

    // Request sync
    socket.on('tactical:request_sync', (sessionId) => {
      this.handleSyncRequest(sessionId, socket);
    });

    // Resolve conflict
    socket.on('tactical:resolve_conflict', (conflictId, resolution) => {
      this.resolveConflict(conflictId, resolution, socket);
    });
  }

  private registerPresenceHandlers(socket: TacticalSocket) {
    // Update presence
    socket.on('presence:update', (presence) => {
      this.updateUserPresence(socket.userId!, presence);
      this.broadcastPresenceUpdate(socket.userId!, presence);
    });

    // Move cursor
    socket.on('cursor:move', (position) => {
      if (!socket.data.sessionId) return;
      
      // Throttle cursor updates
      const now = Date.now();
      const lastUpdate = this.updateThrottles.get(`cursor_${socket.userId}`) || 0;
      
      if (now - lastUpdate < this.UPDATE_THROTTLE_MS) {
        return;
      }
      
      this.updateThrottles.set(`cursor_${socket.userId}`, now);
      this.broadcastCursorUpdate(socket.data.sessionId, socket.userId!, position);
    });
  }

  private registerPresentationHandlers(socket: TacticalSocket) {
    // Start presentation
    socket.on('presentation:start', (sessionId) => {
      this.startPresentation(sessionId, socket);
    });

    // Update presentation
    socket.on('presentation:update', (state) => {
      this.updatePresentation(socket, state);
    });

    // End presentation
    socket.on('presentation:end', (sessionId) => {
      this.endPresentation(sessionId, socket);
    });

    // Coaching control
    socket.on('coaching:control', (control) => {
      this.handleCoachingControl(socket, control);
    });
  }

  private registerCommunicationHandlers(socket: TacticalSocket) {
    // Send message
    socket.on('chat:send', (message) => {
      this.handleChatMessage(socket, message);
    });

    // Voice session
    socket.on('voice:join', (sessionId) => {
      this.joinVoiceSession(sessionId, socket);
    });

    socket.on('voice:leave', (sessionId) => {
      this.leaveVoiceSession(sessionId, socket);
    });
  }

  private registerRecordingHandlers(socket: TacticalSocket) {
    // Start recording
    socket.on('recording:start', (sessionId) => {
      this.startRecording(sessionId, socket);
    });

    // Stop recording
    socket.on('recording:stop', (sessionId) => {
      this.stopRecording(sessionId, socket);
    });

    // Request recording
    socket.on('recording:request', (recordingId) => {
      this.sendRecording(recordingId, socket);
    });
  }

  // Session Management
  private async createSession(
    data: { playId: string; title: string; settings: SessionSettings },
    userId: string
  ): Promise<CollaborationSession> {
    const sessionId = this.generateSessionId();
    
    const session: CollaborationSession = {
      id: sessionId,
      playId: data.playId,
      hostUserId: userId,
      title: data.title,
      createdAt: new Date(),
      isActive: true,
      participants: [],
      permissions: {
        canEdit: [userId],
        canView: [],
        canPresent: [userId],
        canRecord: [userId],
        isPublic: false
      },
      settings: data.settings,
      recordingEnabled: false
    };

    this.activeSessions.set(sessionId, session);
    this.sessionParticipants.set(sessionId, new Set());
    this.sessionConflicts.set(sessionId, []);

    return session;
  }

  private async joinSession(sessionId: string, socket: TacticalSocket): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check permissions
    const canJoin = this.checkSessionPermissions(session, socket.userId!, 'view');
    if (!canJoin && !session.settings.requireApproval) {
      throw new Error('Permission denied');
    }

    // Add to session
    const participants = this.sessionParticipants.get(sessionId)!;
    participants.add(socket.id);

    // Join socket room
    socket.join(sessionId);
    socket.data.sessionId = sessionId;

    // Add user as participant if not already
    const user = this.createCollaborationUser(socket.userId!);
    if (!session.participants.find(p => p.id === user.id)) {
      session.participants.push(user);
      this.activeSessions.set(sessionId, session);
    }

    // Notify other participants
    socket.to(sessionId).emit('session:user_joined', user, sessionId);

    // Send session data to joining user
    socket.emit('session:updated', session);

    // Send current presentation state if active
    const presentationState = this.presentationStates.get(sessionId);
    if (presentationState) {
      socket.emit('presentation:start', presentationState);
    }
  }

  private leaveSession(sessionId: string, socket: TacticalSocket): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const participants = this.sessionParticipants.get(sessionId);
    if (participants) {
      participants.delete(socket.id);
    }

    // Remove from session participants
    session.participants = session.participants.filter(p => p.id !== socket.userId);
    this.activeSessions.set(sessionId, session);

    // Leave socket room
    socket.leave(sessionId);
    socket.data.sessionId = undefined;

    // Notify other participants
    socket.to(sessionId).emit('session:user_left', socket.userId!, sessionId);

    // Clean up empty session
    if (participants && participants.size === 0) {
      this.cleanupSession(sessionId);
    }
  }

  private updateSessionSettings(
    sessionId: string, 
    settings: Partial<SessionSettings>, 
    socket: TacticalSocket
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Check permissions
    if (!this.checkSessionPermissions(session, socket.userId!, 'manage')) {
      socket.emit('error', {
        code: 'PERMISSION_DENIED',
        message: 'Insufficient permissions to update session settings'
      });
      return;
    }

    // Update settings
    session.settings = { ...session.settings, ...settings };
    this.activeSessions.set(sessionId, session);

    // Broadcast update
    this.io.to(sessionId).emit('session:updated', session);
  }

  // Tactical Updates
  private handleTacticalUpdate(socket: TacticalSocket, update: Omit<TacticalUpdate, 'id' | 'timestamp'>) {
    if (!socket.data.sessionId) return;

    const session = this.activeSessions.get(socket.data.sessionId);
    if (!session || !this.checkSessionPermissions(session, socket.userId!, 'edit')) {
      socket.emit('error', {
        code: 'PERMISSION_DENIED',
        message: 'Insufficient permissions to make updates'
      });
      return;
    }

    const fullUpdate: TacticalUpdate = {
      ...update,
      id: this.generateId(),
      sessionId: socket.data.sessionId,
      userId: socket.userId!,
      timestamp: new Date()
    };

    // Check for conflicts
    const conflict = this.checkForConflicts(socket.data.sessionId, fullUpdate);
    if (conflict) {
      this.sessionConflicts.get(socket.data.sessionId)!.push(conflict);
      this.io.to(socket.data.sessionId).emit('tactical:conflict', conflict);
      return;
    }

    // Broadcast update to session
    socket.to(socket.data.sessionId).emit('tactical:update', fullUpdate);

    // Record update if recording
    const recording = Array.from(this.sessionRecordings.values())
      .find(r => r.sessionId === socket.data.sessionId && !r.endedAt);
    
    if (recording) {
      recording.events.push(fullUpdate);
    }
  }

  private handleSyncRequest(sessionId: string, socket: TacticalSocket): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Send recent updates (this would typically come from a database)
    const recentUpdates: TacticalUpdate[] = [];
    socket.emit('tactical:batch_update', recentUpdates);
  }

  private checkForConflicts(sessionId: string, update: TacticalUpdate): Conflict | null {
    // Simple conflict detection - multiple users editing same element
    // In a real implementation, this would be more sophisticated
    
    if (update.type === 'player_move' || update.type === 'formation_change') {
      // Check if another user recently updated the same element
      const recentThreshold = Date.now() - 5000; // 5 seconds
      
      // This is simplified - in reality you'd track element-level locks
      const hasRecentUpdate = false; // Would check against recent updates
      
      if (hasRecentUpdate) {
        return {
          id: this.generateId(),
          type: 'concurrent_edit',
          updates: [update],
          timestamp: new Date()
        };
      }
    }

    return null;
  }

  private resolveConflict(conflictId: string, resolution: ConflictResolution, socket: TacticalSocket): void {
    if (!socket.data.sessionId) return;

    const conflicts = this.sessionConflicts.get(socket.data.sessionId);
    if (!conflicts) return;

    const conflictIndex = conflicts.findIndex(c => c.id === conflictId);
    if (conflictIndex === -1) return;

    const conflict = conflicts[conflictIndex];
    conflict.resolvedBy = socket.userId!;
    conflict.resolution = resolution;

    conflicts.splice(conflictIndex, 1);

    // Broadcast resolution
    socket.to(socket.data.sessionId).emit('tactical:update', conflict.updates[0]);
  }

  // Presence Management
  private updateUserPresence(userId: string, presence: Partial<UserPresence>): void {
    const currentPresence = this.userPresence.get(userId) || {
      userId,
      status: 'online',
      lastSeen: new Date()
    };

    const updatedPresence = { ...currentPresence, ...presence };
    this.userPresence.set(userId, updatedPresence);
  }

  private broadcastPresenceUpdate(userId: string, presence: Partial<UserPresence>): void {
    const userSockets = this.userSockets.get(userId);
    if (!userSockets) return;

    // Broadcast to all sessions the user is in
    userSockets.forEach(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && socket.data.sessionId) {
        socket.to(socket.data.sessionId).emit('presence:update', userId, presence);
      }
    });
  }

  private broadcastCursorUpdate(sessionId: string, userId: string, position: CursorPosition): void {
    this.io.to(sessionId).emit('cursor:move', userId, position);
  }

  // Presentation Management
  private startPresentation(sessionId: string, socket: TacticalSocket): void {
    const session = this.activeSessions.get(sessionId);
    if (!session || !this.checkSessionPermissions(session, socket.userId!, 'present')) {
      socket.emit('error', {
        code: 'PERMISSION_DENIED',
        message: 'Insufficient permissions to start presentation'
      });
      return;
    }

    const presentationState: PresentationState = {
      isPresenting: true,
      presenterId: socket.userId!,
      currentStep: 0,
      totalSteps: 10, // Would be determined by the play
      playbackSpeed: 1,
      isPaused: false,
      highlightedElements: []
    };

    this.presentationStates.set(sessionId, presentationState);
    this.io.to(sessionId).emit('presentation:start', presentationState);
  }

  private updatePresentation(socket: TacticalSocket, state: Partial<PresentationState>): void {
    if (!socket.data.sessionId) return;

    const currentState = this.presentationStates.get(socket.data.sessionId);
    if (!currentState || currentState.presenterId !== socket.userId) return;

    const updatedState = { ...currentState, ...state };
    this.presentationStates.set(socket.data.sessionId, updatedState);
    
    socket.to(socket.data.sessionId).emit('presentation:update', updatedState);
  }

  private endPresentation(sessionId: string, socket: TacticalSocket): void {
    const presentationState = this.presentationStates.get(sessionId);
    if (!presentationState || presentationState.presenterId !== socket.userId) return;

    this.presentationStates.delete(sessionId);
    this.io.to(sessionId).emit('presentation:end');
  }

  private handleCoachingControl(socket: TacticalSocket, control: Omit<CoachingControl, 'timestamp'>): void {
    if (!socket.data.sessionId) return;

    const fullControl: CoachingControl = {
      ...control,
      timestamp: new Date()
    };

    socket.to(socket.data.sessionId).emit('coaching:control', fullControl);
  }

  // Communication
  private handleChatMessage(socket: TacticalSocket, message: Omit<CollaborationMessage, 'id' | 'timestamp'>): void {
    if (!socket.data.sessionId) return;

    const fullMessage: CollaborationMessage = {
      ...message,
      id: this.generateId(),
      timestamp: new Date()
    };

    this.io.to(socket.data.sessionId).emit('chat:message', fullMessage);
  }

  private joinVoiceSession(sessionId: string, socket: TacticalSocket): void {
    let voiceSession = this.voiceSessions.get(sessionId);
    
    if (!voiceSession) {
      voiceSession = {
        id: this.generateId(),
        sessionId,
        participants: [],
        isActive: true,
        startedAt: new Date(),
        quality: 'medium'
      };
      this.voiceSessions.set(sessionId, voiceSession);
    }

    if (!voiceSession.participants.includes(socket.userId!)) {
      voiceSession.participants.push(socket.userId!);
      this.io.to(sessionId).emit('voice:session_start', voiceSession);
    }
  }

  private leaveVoiceSession(sessionId: string, socket: TacticalSocket): void {
    const voiceSession = this.voiceSessions.get(sessionId);
    if (!voiceSession) return;

    voiceSession.participants = voiceSession.participants.filter(p => p !== socket.userId);
    
    if (voiceSession.participants.length === 0) {
      voiceSession.isActive = false;
      this.voiceSessions.delete(sessionId);
      this.io.to(sessionId).emit('voice:session_end', sessionId);
    }
  }

  // Recording
  private startRecording(sessionId: string, socket: TacticalSocket): void {
    const session = this.activeSessions.get(sessionId);
    if (!session || !this.checkSessionPermissions(session, socket.userId!, 'record')) {
      socket.emit('error', {
        code: 'PERMISSION_DENIED',
        message: 'Insufficient permissions to start recording'
      });
      return;
    }

    const recordingId = this.generateId();
    const recording: SessionRecording = {
      id: recordingId,
      sessionId,
      startedAt: new Date(),
      duration: 0,
      events: [],
      metadata: {
        participants: [...session.participants],
        playTitle: session.title,
        recordedBy: socket.userId!
      }
    };

    this.sessionRecordings.set(recordingId, recording);
    session.recordingEnabled = true;

    this.io.to(sessionId).emit('recording:start', recordingId);
  }

  private stopRecording(sessionId: string, socket: TacticalSocket): void {
    const recording = Array.from(this.sessionRecordings.values())
      .find(r => r.sessionId === sessionId && !r.endedAt);
    
    if (!recording) return;

    recording.endedAt = new Date();
    recording.duration = Math.floor((recording.endedAt.getTime() - recording.startedAt.getTime()) / 1000);

    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.recordingEnabled = false;
    }

    this.io.to(sessionId).emit('recording:stop', recording);
  }

  private sendRecording(recordingId: string, socket: TacticalSocket): void {
    const recording = this.sessionRecordings.get(recordingId);
    if (!recording) {
      socket.emit('error', {
        code: 'RECORDING_NOT_FOUND',
        message: 'Recording not found'
      });
      return;
    }

    socket.emit('recording:stop', recording);
  }

  // Utility Methods
  private addUserSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private removeUserSocket(userId: string, socketId: string): void {
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(socketId);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  private createCollaborationUser(userId: string): CollaborationUser {
    // In a real implementation, this would fetch user data from the database
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    const colorIndex = parseInt(userId.slice(-1), 16) % colors.length;
    
    return {
      id: userId,
      name: `User ${userId.slice(0, 8)}`, // Would be actual name
      role: 'Coach', // Would be actual role
      color: colors[colorIndex]
    };
  }

  private checkSessionPermissions(
    session: CollaborationSession, 
    userId: string, 
    permission: 'view' | 'edit' | 'present' | 'record' | 'manage'
  ): boolean {
    if (session.hostUserId === userId) return true;

    switch (permission) {
      case 'view':
        return session.permissions.canView.includes(userId) || session.permissions.isPublic;
      case 'edit':
        return session.permissions.canEdit.includes(userId);
      case 'present':
        return session.permissions.canPresent.includes(userId);
      case 'record':
        return session.permissions.canRecord.includes(userId);
      case 'manage':
        return session.hostUserId === userId;
      default:
        return false;
    }
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.updateCounts.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      this.updateCounts.set(userId, { count: 1, resetTime: now + 1000 });
      return true;
    }
    
    if (userLimit.count >= this.MAX_UPDATES_PER_SECOND) {
      return false;
    }
    
    userLimit.count++;
    return true;
  }

  private handleDisconnection(socket: TacticalSocket, reason: string): void {
    console.log(`Tactical collaboration disconnection: ${socket.id} (${reason})`);
    
    // Remove from user sockets
    this.removeUserSocket(socket.userId!, socket.id);
    
    // Update presence to offline if no more sockets
    const userSockets = this.userSockets.get(socket.userId!);
    if (!userSockets || userSockets.size === 0) {
      this.updateUserPresence(socket.userId!, { 
        status: 'offline',
        lastSeen: new Date()
      });
      this.broadcastPresenceUpdate(socket.userId!, { status: 'offline' });
    }
    
    // Leave session if in one
    if (socket.data.sessionId) {
      this.leaveSession(socket.data.sessionId, socket);
    }
  }

  private cleanupSession(sessionId: string): void {
    console.log(`Cleaning up session: ${sessionId}`);
    
    this.activeSessions.delete(sessionId);
    this.sessionParticipants.delete(sessionId);
    this.sessionConflicts.delete(sessionId);
    this.presentationStates.delete(sessionId);
    
    const voiceSession = this.voiceSessions.get(sessionId);
    if (voiceSession) {
      voiceSession.isActive = false;
      this.voiceSessions.delete(sessionId);
    }
  }

  private setupCleanupTimer(): void {
    // Clean up inactive sessions every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const maxInactiveTime = 30 * 60 * 1000; // 30 minutes

      for (const [sessionId, session] of this.activeSessions.entries()) {
        const participants = this.sessionParticipants.get(sessionId);
        const lastActivity = session.createdAt.getTime();
        
        if (!participants || participants.size === 0 || (now - lastActivity) > maxInactiveTime) {
          this.cleanupSession(sessionId);
        }
      }
      
      // Clean up old presence data
      for (const [userId, presence] of this.userPresence.entries()) {
        if ((now - presence.lastSeen.getTime()) > maxInactiveTime) {
          this.userPresence.delete(userId);
        }
      }
      
      // Clean up rate limiting data
      for (const [userId, limit] of this.updateCounts.entries()) {
        if (now > limit.resetTime + 60000) { // Keep for 1 minute after reset
          this.updateCounts.delete(userId);
        }
      }
      
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getter methods for monitoring
  getActiveSessions(): CollaborationSession[] {
    return Array.from(this.activeSessions.values());
  }

  getSessionCount(): number {
    return this.activeSessions.size;
  }

  getActiveUserCount(): number {
    return this.userSockets.size;
  }

  getSessionStats(sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    const participants = this.sessionParticipants.get(sessionId);
    const conflicts = this.sessionConflicts.get(sessionId);
    
    return {
      session,
      participantCount: participants?.size || 0,
      conflictCount: conflicts?.length || 0,
      isRecording: session?.recordingEnabled || false,
      hasPresentation: this.presentationStates.has(sessionId)
    };
  }
}