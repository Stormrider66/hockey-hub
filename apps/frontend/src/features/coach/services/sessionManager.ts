/**
 * Session Manager Service
 * Handles collaboration session lifecycle, persistence, and management
 */

import {
  CollaborationSession,
  CollaborationUser,
  SessionRecording,
  SessionSettings,
  TacticalUpdate
} from '@hockey-hub/shared-types/src/tactical/collaboration.types';

// Types for session management
export interface SessionHistory {
  id: string;
  sessionId: string;
  title: string;
  playId: string;
  startedAt: Date;
  endedAt: Date;
  duration: number; // seconds
  participants: CollaborationUser[];
  recordingId?: string;
  updateCount: number;
  status: 'completed' | 'aborted' | 'error';
}

export interface SessionAnalytics {
  totalSessions: number;
  totalDuration: number; // seconds
  averageDuration: number;
  totalParticipants: number;
  averageParticipants: number;
  mostActiveUsers: { userId: string; sessionCount: number; totalDuration: number }[];
  popularPlays: { playId: string; sessionCount: number }[];
  peakUsageHours: { hour: number; sessionCount: number }[];
  collaborationMetrics: {
    totalUpdates: number;
    averageUpdatesPerSession: number;
    conflictRate: number;
    resolutionRate: number;
  };
}

export interface SessionPermissions {
  canView: boolean;
  canEdit: boolean;
  canPresent: boolean;
  canRecord: boolean;
  canInvite: boolean;
  canManage: boolean;
  isOwner: boolean;
}

export interface SessionInvite {
  id: string;
  sessionId: string;
  invitedBy: string;
  invitedUser: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  permissions: string[];
  message?: string;
}

export class SessionManager {
  private static instance: SessionManager | null = null;
  private sessions: Map<string, CollaborationSession> = new Map();
  private sessionHistory: SessionHistory[] = [];
  private recordings: Map<string, SessionRecording> = new Map();
  private invites: Map<string, SessionInvite> = new Map();
  
  // Storage keys
  private readonly STORAGE_KEYS = {
    SESSIONS: 'tactical_collaboration_sessions',
    HISTORY: 'tactical_collaboration_history',
    RECORDINGS: 'tactical_collaboration_recordings',
    INVITES: 'tactical_collaboration_invites',
    SETTINGS: 'tactical_collaboration_settings'
  } as const;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Session CRUD Operations
  async createSession(data: {
    playId: string;
    title: string;
    description?: string;
    hostUserId: string;
    settings: SessionSettings;
  }): Promise<CollaborationSession> {
    const session: CollaborationSession = {
      id: this.generateSessionId(),
      playId: data.playId,
      hostUserId: data.hostUserId,
      title: data.title,
      description: data.description,
      createdAt: new Date(),
      isActive: true,
      participants: [],
      permissions: {
        canEdit: [data.hostUserId],
        canView: [],
        canPresent: [data.hostUserId],
        canRecord: [data.hostUserId],
        isPublic: false
      },
      settings: data.settings,
      recordingEnabled: false
    };

    this.sessions.set(session.id, session);
    this.saveToStorage();
    
    return session;
  }

  getSession(sessionId: string): CollaborationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  async updateSession(sessionId: string, updates: Partial<CollaborationSession>): Promise<CollaborationSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const updatedSession = { ...session, ...updates };
    this.sessions.set(sessionId, updatedSession);
    this.saveToStorage();
    
    return updatedSession;
  }

  async endSession(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Only allow host or authorized users to end session
    if (session.hostUserId !== userId && !session.permissions.canEdit.includes(userId)) {
      throw new Error('Insufficient permissions to end session');
    }

    // Create history entry
    const historyEntry: SessionHistory = {
      id: this.generateId(),
      sessionId: session.id,
      title: session.title,
      playId: session.playId,
      startedAt: session.createdAt,
      endedAt: new Date(),
      duration: Math.floor((Date.now() - session.createdAt.getTime()) / 1000),
      participants: [...session.participants],
      updateCount: 0, // This would be tracked separately
      status: 'completed'
    };

    this.sessionHistory.push(historyEntry);
    
    // Mark session as inactive
    session.isActive = false;
    this.sessions.set(sessionId, session);
    
    this.saveToStorage();
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Only allow host to delete session
    if (session.hostUserId !== userId) {
      throw new Error('Only session host can delete session');
    }

    this.sessions.delete(sessionId);
    this.saveToStorage();
  }

  // Participant Management
  async addParticipant(sessionId: string, user: CollaborationUser): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    // Check if user is already in session
    if (session.participants.find(p => p.id === user.id)) {
      return; // Already in session
    }

    // Check max participants limit
    if (session.participants.length >= session.settings.maxParticipants) {
      throw new Error('Session is full');
    }

    session.participants.push(user);
    this.sessions.set(sessionId, session);
    this.saveToStorage();
  }

  async removeParticipant(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.participants = session.participants.filter(p => p.id !== userId);
    
    // Remove from permissions
    session.permissions.canEdit = session.permissions.canEdit.filter(id => id !== userId);
    session.permissions.canView = session.permissions.canView.filter(id => id !== userId);
    session.permissions.canPresent = session.permissions.canPresent.filter(id => id !== userId);
    session.permissions.canRecord = session.permissions.canRecord.filter(id => id !== userId);

    this.sessions.set(sessionId, session);
    this.saveToStorage();
  }

  // Permission Management
  getUserPermissions(sessionId: string, userId: string): SessionPermissions {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        canView: false,
        canEdit: false,
        canPresent: false,
        canRecord: false,
        canInvite: false,
        canManage: false,
        isOwner: false
      };
    }

    const isOwner = session.hostUserId === userId;
    const isParticipant = session.participants.some(p => p.id === userId);

    return {
      canView: isOwner || session.permissions.canView.includes(userId) || session.permissions.isPublic,
      canEdit: isOwner || session.permissions.canEdit.includes(userId),
      canPresent: isOwner || session.permissions.canPresent.includes(userId),
      canRecord: isOwner || session.permissions.canRecord.includes(userId),
      canInvite: isOwner || session.permissions.canEdit.includes(userId),
      canManage: isOwner,
      isOwner
    };
  }

  async updatePermissions(
    sessionId: string, 
    userId: string, 
    targetUserId: string, 
    permissions: Partial<{ canEdit: boolean; canView: boolean; canPresent: boolean; canRecord: boolean }>
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const userPerms = this.getUserPermissions(sessionId, userId);
    if (!userPerms.canManage) {
      throw new Error('Insufficient permissions');
    }

    // Update permissions
    if (permissions.canEdit !== undefined) {
      if (permissions.canEdit && !session.permissions.canEdit.includes(targetUserId)) {
        session.permissions.canEdit.push(targetUserId);
      } else if (!permissions.canEdit) {
        session.permissions.canEdit = session.permissions.canEdit.filter(id => id !== targetUserId);
      }
    }

    if (permissions.canView !== undefined) {
      if (permissions.canView && !session.permissions.canView.includes(targetUserId)) {
        session.permissions.canView.push(targetUserId);
      } else if (!permissions.canView) {
        session.permissions.canView = session.permissions.canView.filter(id => id !== targetUserId);
      }
    }

    if (permissions.canPresent !== undefined) {
      if (permissions.canPresent && !session.permissions.canPresent.includes(targetUserId)) {
        session.permissions.canPresent.push(targetUserId);
      } else if (!permissions.canPresent) {
        session.permissions.canPresent = session.permissions.canPresent.filter(id => id !== targetUserId);
      }
    }

    if (permissions.canRecord !== undefined) {
      if (permissions.canRecord && !session.permissions.canRecord.includes(targetUserId)) {
        session.permissions.canRecord.push(targetUserId);
      } else if (!permissions.canRecord) {
        session.permissions.canRecord = session.permissions.canRecord.filter(id => id !== targetUserId);
      }
    }

    this.sessions.set(sessionId, session);
    this.saveToStorage();
  }

  // Invitations
  async createInvite(
    sessionId: string,
    invitedBy: string,
    invitedUser: string,
    permissions: string[],
    message?: string
  ): Promise<SessionInvite> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const userPerms = this.getUserPermissions(sessionId, invitedBy);
    if (!userPerms.canInvite) {
      throw new Error('Insufficient permissions to invite');
    }

    const invite: SessionInvite = {
      id: this.generateId(),
      sessionId,
      invitedBy,
      invitedUser,
      invitedAt: new Date(),
      status: 'pending',
      permissions,
      message
    };

    this.invites.set(invite.id, invite);
    this.saveToStorage();
    
    return invite;
  }

  async respondToInvite(inviteId: string, response: 'accepted' | 'declined'): Promise<void> {
    const invite = this.invites.get(inviteId);
    if (!invite) throw new Error('Invite not found');

    invite.status = response;
    this.invites.set(inviteId, invite);
    this.saveToStorage();
  }

  // Recording Management
  async startRecording(sessionId: string, userId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const userPerms = this.getUserPermissions(sessionId, userId);
    if (!userPerms.canRecord) {
      throw new Error('Insufficient permissions to record');
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
        recordedBy: userId
      }
    };

    this.recordings.set(recordingId, recording);
    session.recordingEnabled = true;
    
    this.sessions.set(sessionId, session);
    this.saveToStorage();
    
    return recordingId;
  }

  async stopRecording(recordingId: string): Promise<SessionRecording> {
    const recording = this.recordings.get(recordingId);
    if (!recording) throw new Error('Recording not found');

    recording.endedAt = new Date();
    recording.duration = Math.floor((Date.now() - recording.startedAt.getTime()) / 1000);
    
    // Stop recording in session
    const session = this.sessions.get(recording.sessionId);
    if (session) {
      session.recordingEnabled = false;
      this.sessions.set(session.id, session);
    }

    this.recordings.set(recordingId, recording);
    this.saveToStorage();
    
    return recording;
  }

  // Analytics and History
  getSessionHistory(filters?: {
    playId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): SessionHistory[] {
    let history = [...this.sessionHistory];

    if (filters?.playId) {
      history = history.filter(h => h.playId === filters.playId);
    }

    if (filters?.userId) {
      history = history.filter(h => 
        h.participants.some(p => p.id === filters.userId)
      );
    }

    if (filters?.startDate) {
      history = history.filter(h => h.startedAt >= filters.startDate!);
    }

    if (filters?.endDate) {
      history = history.filter(h => h.startedAt <= filters.endDate!);
    }

    return history.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  getAnalytics(): SessionAnalytics {
    const history = this.sessionHistory;
    const totalSessions = history.length;
    const totalDuration = history.reduce((sum, h) => sum + h.duration, 0);
    const totalParticipants = history.reduce((sum, h) => sum + h.participants.length, 0);

    // Calculate most active users
    const userActivity: Record<string, { sessionCount: number; totalDuration: number }> = {};
    history.forEach(session => {
      session.participants.forEach(participant => {
        if (!userActivity[participant.id]) {
          userActivity[participant.id] = { sessionCount: 0, totalDuration: 0 };
        }
        userActivity[participant.id].sessionCount++;
        userActivity[participant.id].totalDuration += session.duration;
      });
    });

    const mostActiveUsers = Object.entries(userActivity)
      .map(([userId, activity]) => ({ userId, ...activity }))
      .sort((a, b) => b.sessionCount - a.sessionCount)
      .slice(0, 10);

    // Calculate popular plays
    const playActivity: Record<string, number> = {};
    history.forEach(session => {
      playActivity[session.playId] = (playActivity[session.playId] || 0) + 1;
    });

    const popularPlays = Object.entries(playActivity)
      .map(([playId, sessionCount]) => ({ playId, sessionCount }))
      .sort((a, b) => b.sessionCount - a.sessionCount)
      .slice(0, 10);

    // Calculate peak usage hours
    const hourActivity: Record<number, number> = {};
    history.forEach(session => {
      const hour = session.startedAt.getHours();
      hourActivity[hour] = (hourActivity[hour] || 0) + 1;
    });

    const peakUsageHours = Object.entries(hourActivity)
      .map(([hour, sessionCount]) => ({ hour: parseInt(hour), sessionCount }))
      .sort((a, b) => b.sessionCount - a.sessionCount);

    return {
      totalSessions,
      totalDuration,
      averageDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
      totalParticipants,
      averageParticipants: totalSessions > 0 ? totalParticipants / totalSessions : 0,
      mostActiveUsers,
      popularPlays,
      peakUsageHours,
      collaborationMetrics: {
        totalUpdates: history.reduce((sum, h) => sum + h.updateCount, 0),
        averageUpdatesPerSession: totalSessions > 0 ? 
          history.reduce((sum, h) => sum + h.updateCount, 0) / totalSessions : 0,
        conflictRate: 0, // Would need to track conflicts
        resolutionRate: 0 // Would need to track conflict resolutions
      }
    };
  }

  // Utility Methods
  getActiveSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values()).filter(s => s.isActive);
  }

  getSessionsByPlay(playId: string): CollaborationSession[] {
    return Array.from(this.sessions.values()).filter(s => s.playId === playId);
  }

  getUserSessions(userId: string): CollaborationSession[] {
    return Array.from(this.sessions.values()).filter(s =>
      s.hostUserId === userId || s.participants.some(p => p.id === userId)
    );
  }

  getRecording(recordingId: string): SessionRecording | null {
    return this.recordings.get(recordingId) || null;
  }

  getAllRecordings(): SessionRecording[] {
    return Array.from(this.recordings.values());
  }

  // Storage Management
  private loadFromStorage(): void {
    try {
      // Load sessions
      const sessionsData = localStorage.getItem(this.STORAGE_KEYS.SESSIONS);
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        Object.entries(sessions).forEach(([id, session]: [string, any]) => {
          this.sessions.set(id, {
            ...session,
            createdAt: new Date(session.createdAt)
          });
        });
      }

      // Load history
      const historyData = localStorage.getItem(this.STORAGE_KEYS.HISTORY);
      if (historyData) {
        this.sessionHistory = JSON.parse(historyData).map((h: any) => ({
          ...h,
          startedAt: new Date(h.startedAt),
          endedAt: new Date(h.endedAt)
        }));
      }

      // Load recordings
      const recordingsData = localStorage.getItem(this.STORAGE_KEYS.RECORDINGS);
      if (recordingsData) {
        const recordings = JSON.parse(recordingsData);
        Object.entries(recordings).forEach(([id, recording]: [string, any]) => {
          this.recordings.set(id, {
            ...recording,
            startedAt: new Date(recording.startedAt),
            endedAt: recording.endedAt ? new Date(recording.endedAt) : undefined
          });
        });
      }

      // Load invites
      const invitesData = localStorage.getItem(this.STORAGE_KEYS.INVITES);
      if (invitesData) {
        const invites = JSON.parse(invitesData);
        Object.entries(invites).forEach(([id, invite]: [string, any]) => {
          this.invites.set(id, {
            ...invite,
            invitedAt: new Date(invite.invitedAt)
          });
        });
      }
    } catch (error) {
      console.error('Error loading collaboration data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      // Save sessions
      const sessionsObj = Object.fromEntries(this.sessions);
      localStorage.setItem(this.STORAGE_KEYS.SESSIONS, JSON.stringify(sessionsObj));

      // Save history
      localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(this.sessionHistory));

      // Save recordings
      const recordingsObj = Object.fromEntries(this.recordings);
      localStorage.setItem(this.STORAGE_KEYS.RECORDINGS, JSON.stringify(recordingsObj));

      // Save invites
      const invitesObj = Object.fromEntries(this.invites);
      localStorage.setItem(this.STORAGE_KEYS.INVITES, JSON.stringify(invitesObj));
    } catch (error) {
      console.error('Error saving collaboration data to storage:', error);
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();