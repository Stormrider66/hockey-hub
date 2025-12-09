import { io, Socket } from 'socket.io-client';
import { logger } from '@hockey-hub/shared-lib';
import {
  TrainingSessionSocketEvent,
  TrainingSessionState,
  PlayerMetrics,
  ExerciseProgress,
  IntervalProgress,
  PlayerSessionStatus,
  JoinSessionPayload,
  SessionUpdatePayload,
  MetricsUpdatePayload,
  ExerciseProgressPayload,
  IntervalProgressPayload,
  PlayerStatusUpdatePayload,
} from '@hockey-hub/shared-types';

export class TrainingSessionSocketService {
  private socket: Socket | null = null;
  private connectionUrl: string;
  private authToken: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    // Communication service URL
    this.connectionUrl = process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:3002';
    // In production, get from auth service or context
    this.authToken = process.env.SERVICE_AUTH_TOKEN || 'training-service-token';
  }

  /**
   * Connect to the training namespace
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(`${this.connectionUrl}/training`, {
          auth: {
            token: this.authToken,
          },
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        });

        this.socket.on('connect', () => {
          logger.info('Connected to training namespace');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          logger.error('Connection error:', error);
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Failed to connect to training namespace'));
          }
        });

        this.socket.on('disconnect', (reason) => {
          logger.warn('Disconnected from training namespace:', reason);
        });

        // Listen for errors
        this.socket.on(TrainingSessionSocketEvent.ERROR, (error) => {
          logger.error('Training session error:', error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the namespace
   */
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Join a training session as the trainer
   */
  public joinSessionAsTrainer(sessionId: string): Promise<TrainingSessionState> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to training namespace'));
        return;
      }

      const payload: JoinSessionPayload = {
        sessionId,
        role: 'trainer',
      };

      this.socket.emit(TrainingSessionSocketEvent.JOIN_SESSION, payload);

      this.socket.once(TrainingSessionSocketEvent.SESSION_JOINED, (response) => {
        resolve(response.session);
      });

      this.socket.once(TrainingSessionSocketEvent.ERROR, (error) => {
        reject(new Error(error.message));
      });
    });
  }

  /**
   * Start a training session
   */
  public startSession(sessionId: string): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }
    this.socket.emit(TrainingSessionSocketEvent.SESSION_START, sessionId);
  }

  /**
   * End a training session
   */
  public endSession(sessionId: string): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }
    this.socket.emit(TrainingSessionSocketEvent.SESSION_END, sessionId);
  }

  /**
   * Pause a training session
   */
  public pauseSession(sessionId: string): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }
    this.socket.emit(TrainingSessionSocketEvent.SESSION_PAUSE, sessionId);
  }

  /**
   * Resume a training session
   */
  public resumeSession(sessionId: string): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }
    this.socket.emit(TrainingSessionSocketEvent.SESSION_RESUME, sessionId);
  }

  /**
   * Send player metrics update
   */
  public updatePlayerMetrics(sessionId: string, metrics: PlayerMetrics): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }

    const payload: MetricsUpdatePayload = {
      sessionId,
      metrics,
    };

    this.socket.emit(TrainingSessionSocketEvent.PLAYER_METRICS_UPDATE, payload);
  }

  /**
   * Send exercise progress update
   */
  public updateExerciseProgress(sessionId: string, progress: ExerciseProgress): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }

    const payload: ExerciseProgressPayload = {
      sessionId,
      progress,
    };

    this.socket.emit(TrainingSessionSocketEvent.PLAYER_EXERCISE_PROGRESS, payload);
  }

  /**
   * Send interval progress update
   */
  public updateIntervalProgress(sessionId: string, progress: IntervalProgress): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }

    const payload: IntervalProgressPayload = {
      sessionId,
      progress,
    };

    this.socket.emit(TrainingSessionSocketEvent.PLAYER_INTERVAL_PROGRESS, payload);
  }

  /**
   * Update player status
   */
  public updatePlayerStatus(
    sessionId: string,
    playerId: string,
    status: PlayerSessionStatus['status'],
    reason?: string
  ): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }

    const payload: PlayerStatusUpdatePayload = {
      sessionId,
      playerId,
      status,
      reason,
    };

    this.socket.emit(TrainingSessionSocketEvent.PLAYER_STATUS_UPDATE, payload);
  }

  /**
   * Force end a session
   */
  public forceEndSession(sessionId: string): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }
    this.socket.emit(TrainingSessionSocketEvent.FORCE_END_SESSION, sessionId);
  }

  /**
   * Kick a player from session
   */
  public kickPlayer(sessionId: string, playerId: string): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }
    this.socket.emit(TrainingSessionSocketEvent.KICK_PLAYER, { sessionId, playerId });
  }

  /**
   * Subscribe to session updates
   */
  public onSessionUpdate(callback: (update: SessionUpdatePayload) => void): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }
    this.socket.on(TrainingSessionSocketEvent.SESSION_UPDATE, callback);
  }

  /**
   * Subscribe to player join events
   */
  public onPlayerJoin(callback: (data: { sessionId: string; player: PlayerSessionStatus }) => void): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }
    this.socket.on(TrainingSessionSocketEvent.PLAYER_JOIN, callback);
  }

  /**
   * Subscribe to player leave events
   */
  public onPlayerLeave(callback: (data: { sessionId: string; playerId: string; reason: string }) => void): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }
    this.socket.on(TrainingSessionSocketEvent.PLAYER_LEAVE, callback);
  }

  /**
   * Subscribe to player metrics updates
   */
  public onPlayerMetrics(callback: (data: MetricsUpdatePayload) => void): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }
    this.socket.on(TrainingSessionSocketEvent.PLAYER_METRICS_UPDATE, callback);
  }

  /**
   * Subscribe to exercise progress updates
   */
  public onExerciseProgress(callback: (data: ExerciseProgressPayload) => void): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }
    this.socket.on(TrainingSessionSocketEvent.PLAYER_EXERCISE_PROGRESS, callback);
  }

  /**
   * Subscribe to interval progress updates
   */
  public onIntervalProgress(callback: (data: IntervalProgressPayload) => void): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }
    this.socket.on(TrainingSessionSocketEvent.PLAYER_INTERVAL_PROGRESS, callback);
  }

  /**
   * Subscribe to player status updates
   */
  public onPlayerStatusUpdate(callback: (data: PlayerStatusUpdatePayload) => void): void {
    if (!this.socket) {
      throw new Error('Not connected to training namespace');
    }
    this.socket.on(TrainingSessionSocketEvent.PLAYER_STATUS_UPDATE, callback);
  }

  /**
   * Remove all listeners for a specific event
   */
  public removeAllListeners(event?: string): void {
    if (!this.socket) return;
    
    if (event) {
      this.socket.removeAllListeners(event);
    } else {
      this.socket.removeAllListeners();
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const trainingSessionSocketService = new TrainingSessionSocketService();