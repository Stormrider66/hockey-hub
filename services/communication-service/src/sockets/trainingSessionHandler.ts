import { Server, Socket } from 'socket.io';
import { AuthenticatedSocket } from './authMiddleware';
import { logger } from '@hockey-hub/shared-lib';
import {
  TrainingSessionSocketEvent,
  TrainingSessionState,
  PlayerSessionStatus,
  PlayerMetrics,
  ExerciseProgress,
  IntervalProgress,
  JoinSessionPayload,
  SessionJoinedPayload,
  SessionUpdatePayload,
  PlayerJoinPayload,
  PlayerLeavePayload,
  MetricsUpdatePayload,
  ExerciseProgressPayload,
  IntervalProgressPayload,
  PlayerStatusUpdatePayload,
  TrainingErrorPayload,
  DEFAULT_RATE_LIMIT_CONFIG,
  MedicalStatusChangedPayload,
  SessionProgressPayload,
  CalendarEventChangedPayload,
  PlayerAvailabilityChangedPayload,
  WorkoutTemplateUpdatedPayload,
  TeamAssignmentChangedPayload,
} from '@hockey-hub/shared-types';

interface RateLimitData {
  lastUpdate: number;
  updateCount: number;
  minuteStart: number;
}

export class TrainingSessionHandler {
  private io: Server;
  private activeSessions: Map<string, TrainingSessionState> = new Map();
  private playerRateLimits: Map<string, RateLimitData> = new Map();
  private sessionCleanupInterval: NodeJS.Timeout | null = null;

  constructor(io: Server) {
    this.io = io;
    this.startSessionCleanup();
  }

  handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    logger.info(`Training session handler connected for user: ${userId}`);

    // Register event handlers
    this.registerSessionHandlers(socket);
    this.registerPlayerHandlers(socket);
    this.registerMetricsHandlers(socket);
    this.registerAdminHandlers(socket);
    this.registerDashboardHandlers(socket);
    
    // PHASE 3.3: Register type-specific and bulk operation handlers
    this.registerStrengthHandlers(socket);
    this.registerConditioningHandlers(socket);
    this.registerHybridHandlers(socket);
    this.registerAgilityHandlers(socket);
    this.registerBulkOperationHandlers(socket);
    
    // PHASE 5.2: Register new workout type handlers
    this.registerStabilityCoreHandlers(socket);
    this.registerPlyometricsHandlers(socket);
    this.registerWrestlingHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private registerSessionHandlers(socket: AuthenticatedSocket) {
    const userId = socket.userId!;

    // Join training session
    socket.on(TrainingSessionSocketEvent.JOIN_SESSION, async (payload: JoinSessionPayload) => {
      try {
        const { sessionId, role, playerId } = payload;
        const roomName = `training-session-${sessionId}`;

        // Verify permissions based on role
        if (role === 'player' && !playerId) {
          throw new Error('Player ID required for player role');
        }

        // Join the room
        socket.join(roomName);
        socket.data.sessionId = sessionId;
        socket.data.role = role;
        socket.data.playerId = playerId;

        // Get or create session state
        let session = this.activeSessions.get(sessionId);
        if (!session) {
          // In production, fetch from database
          session = await this.createSessionState(sessionId, userId);
          this.activeSessions.set(sessionId, session);
        }

        // Add player to session if joining as player
        if (role === 'player' && playerId) {
          const playerStatus: PlayerSessionStatus = {
            playerId,
            playerName: `Player ${playerId}`, // In production, fetch from user service
            status: 'waiting',
            joinedAt: new Date(),
            lastActivity: new Date(),
          };
          
          const existingPlayerIndex = session.players.findIndex(p => p.playerId === playerId);
          if (existingPlayerIndex >= 0) {
            session.players[existingPlayerIndex] = playerStatus;
          } else {
            session.players.push(playerStatus);
            session.totalPlayers++;
          }

          // Notify all participants
          this.io.to(roomName).emit(TrainingSessionSocketEvent.PLAYER_JOIN, {
            sessionId,
            player: playerStatus,
          } as PlayerJoinPayload);
        }

        // Send session state to joined user
        const response: SessionJoinedPayload = {
          session,
          role,
        };
        socket.emit(TrainingSessionSocketEvent.SESSION_JOINED, response);

        logger.info(`User ${userId} joined training session ${sessionId} as ${role}`);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.JOIN_SESSION, error.message);
      }
    });

    // Leave training session
    socket.on(TrainingSessionSocketEvent.LEAVE_SESSION, (sessionId: string) => {
      const roomName = `training-session-${sessionId}`;
      socket.leave(roomName);
      
      // Handle player leaving
      if (socket.data.role === 'player' && socket.data.playerId) {
        this.handlePlayerLeave(sessionId, socket.data.playerId, 'completed');
      }

      socket.emit(TrainingSessionSocketEvent.SESSION_LEFT, { sessionId });
      logger.info(`User ${userId} left training session ${sessionId}`);
    });

    // Start session (trainer only)
    socket.on(TrainingSessionSocketEvent.SESSION_START, async (sessionId: string) => {
      try {
        if (socket.data.role !== 'trainer') {
          throw new Error('Only trainers can start sessions');
        }

        const session = this.activeSessions.get(sessionId);
        if (!session) {
          throw new Error('Session not found');
        }

        session.status = 'active';
        session.startTime = new Date();

        const update: SessionUpdatePayload = {
          sessionId,
          updates: {
            status: 'active',
            startTime: session.startTime,
          },
        };

        this.io.to(`training-session-${sessionId}`).emit(
          TrainingSessionSocketEvent.SESSION_UPDATE,
          update
        );

        logger.info(`Training session ${sessionId} started by ${userId}`);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.SESSION_START, error.message, sessionId);
      }
    });

    // End session (trainer only)
    socket.on(TrainingSessionSocketEvent.SESSION_END, async (sessionId: string) => {
      try {
        if (socket.data.role !== 'trainer') {
          throw new Error('Only trainers can end sessions');
        }

        const session = this.activeSessions.get(sessionId);
        if (!session) {
          throw new Error('Session not found');
        }

        session.status = 'completed';
        session.endTime = new Date();
        if (session.startTime) {
          session.duration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000);
        }

        const update: SessionUpdatePayload = {
          sessionId,
          updates: {
            status: 'completed',
            endTime: session.endTime,
            duration: session.duration,
          },
        };

        this.io.to(`training-session-${sessionId}`).emit(
          TrainingSessionSocketEvent.SESSION_UPDATE,
          update
        );

        // Clean up session after a delay
        setTimeout(() => {
          this.activeSessions.delete(sessionId);
        }, 300000); // 5 minutes

        logger.info(`Training session ${sessionId} ended by ${userId}`);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.SESSION_END, error.message, sessionId);
      }
    });

    // Pause/Resume session (trainer only)
    socket.on(TrainingSessionSocketEvent.SESSION_PAUSE, async (sessionId: string) => {
      this.updateSessionStatus(socket, sessionId, 'paused', TrainingSessionSocketEvent.SESSION_PAUSE);
    });

    socket.on(TrainingSessionSocketEvent.SESSION_RESUME, async (sessionId: string) => {
      this.updateSessionStatus(socket, sessionId, 'active', TrainingSessionSocketEvent.SESSION_RESUME);
    });
  }

  private registerPlayerHandlers(socket: AuthenticatedSocket) {
    // Player status updates
    socket.on(TrainingSessionSocketEvent.PLAYER_STATUS_UPDATE, async (payload: PlayerStatusUpdatePayload) => {
      try {
        const { sessionId, playerId, status, reason } = payload;
        const session = this.activeSessions.get(sessionId);
        
        if (!session) {
          throw new Error('Session not found');
        }

        const player = session.players.find(p => p.playerId === playerId);
        if (!player) {
          throw new Error('Player not found in session');
        }

        player.status = status;
        player.lastActivity = new Date();

        // Update session counters
        this.updateSessionPlayerCounts(session);

        this.io.to(`training-session-${sessionId}`).emit(
          TrainingSessionSocketEvent.PLAYER_STATUS_UPDATE,
          payload
        );

        logger.info(`Player ${playerId} status updated to ${status} in session ${sessionId}`);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.PLAYER_STATUS_UPDATE, error.message);
      }
    });
  }

  private registerMetricsHandlers(socket: AuthenticatedSocket) {
    // Player metrics update with rate limiting
    socket.on(TrainingSessionSocketEvent.PLAYER_METRICS_UPDATE, async (payload: MetricsUpdatePayload) => {
      try {
        const { sessionId, metrics } = payload;
        const rateLimitKey = `${metrics.playerId}-metrics`;

        // Check rate limit
        if (!this.checkRateLimit(rateLimitKey)) {
          logger.warn(`Rate limit exceeded for player ${metrics.playerId} metrics`);
          return;
        }

        const session = this.activeSessions.get(sessionId);
        if (!session) {
          throw new Error('Session not found');
        }

        const player = session.players.find(p => p.playerId === metrics.playerId);
        if (!player) {
          throw new Error('Player not found in session');
        }

        player.lastActivity = new Date();
        player.metrics = metrics;

        // Broadcast to all participants
        this.io.to(`training-session-${sessionId}`).emit(
          TrainingSessionSocketEvent.PLAYER_METRICS_UPDATE,
          payload
        );
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.PLAYER_METRICS_UPDATE, error.message);
      }
    });

    // Exercise progress update
    socket.on(TrainingSessionSocketEvent.PLAYER_EXERCISE_PROGRESS, async (payload: ExerciseProgressPayload) => {
      try {
        const { sessionId, progress } = payload;
        const session = this.activeSessions.get(sessionId);
        
        if (!session) {
          throw new Error('Session not found');
        }

        const player = session.players.find(p => p.playerId === progress.playerId);
        if (!player) {
          throw new Error('Player not found in session');
        }

        player.lastActivity = new Date();
        player.currentExercise = progress.exerciseName;

        // Broadcast to all participants
        this.io.to(`training-session-${sessionId}`).emit(
          TrainingSessionSocketEvent.PLAYER_EXERCISE_PROGRESS,
          payload
        );

        logger.info(`Exercise progress updated for player ${progress.playerId} in session ${sessionId}`);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.PLAYER_EXERCISE_PROGRESS, error.message);
      }
    });

    // Interval progress update
    socket.on(TrainingSessionSocketEvent.PLAYER_INTERVAL_PROGRESS, async (payload: IntervalProgressPayload) => {
      try {
        const { sessionId, progress } = payload;
        const rateLimitKey = `${progress.playerId}-interval`;

        // Check rate limit (more lenient for intervals)
        if (!this.checkRateLimit(rateLimitKey, 1000)) { // 1 second minimum
          return;
        }

        const session = this.activeSessions.get(sessionId);
        if (!session) {
          throw new Error('Session not found');
        }

        const player = session.players.find(p => p.playerId === progress.playerId);
        if (!player) {
          throw new Error('Player not found in session');
        }

        player.lastActivity = new Date();
        player.currentInterval = progress.intervalName;

        // Broadcast to all participants
        this.io.to(`training-session-${sessionId}`).emit(
          TrainingSessionSocketEvent.PLAYER_INTERVAL_PROGRESS,
          payload
        );
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.PLAYER_INTERVAL_PROGRESS, error.message);
      }
    });
  }

  private registerAdminHandlers(socket: AuthenticatedSocket) {
    // Force end session (admin only)
    socket.on(TrainingSessionSocketEvent.FORCE_END_SESSION, async (sessionId: string) => {
      try {
        if (socket.data.role !== 'trainer') {
          throw new Error('Only trainers can force end sessions');
        }

        const session = this.activeSessions.get(sessionId);
        if (!session) {
          throw new Error('Session not found');
        }

        session.status = 'cancelled';
        session.endTime = new Date();

        this.io.to(`training-session-${sessionId}`).emit(
          TrainingSessionSocketEvent.SESSION_UPDATE,
          {
            sessionId,
            updates: {
              status: 'cancelled',
              endTime: session.endTime,
            },
          } as SessionUpdatePayload
        );

        this.activeSessions.delete(sessionId);
        logger.info(`Training session ${sessionId} forcefully ended`);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.FORCE_END_SESSION, error.message, sessionId);
      }
    });

    // Kick player (trainer only)
    socket.on(TrainingSessionSocketEvent.KICK_PLAYER, async (data: { sessionId: string; playerId: string }) => {
      try {
        if (socket.data.role !== 'trainer') {
          throw new Error('Only trainers can kick players');
        }

        this.handlePlayerLeave(data.sessionId, data.playerId, 'kicked');
        logger.info(`Player ${data.playerId} kicked from session ${data.sessionId}`);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.KICK_PLAYER, error.message);
      }
    });
  }

  private handleDisconnect(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    const { sessionId, role, playerId } = socket.data;

    if (sessionId && role === 'player' && playerId) {
      this.handlePlayerLeave(sessionId, playerId, 'disconnected');
    }

    logger.info(`User ${userId} disconnected from training sessions`);
  }

  private handlePlayerLeave(sessionId: string, playerId: string, reason: 'completed' | 'dropped' | 'kicked' | 'disconnected') {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const playerIndex = session.players.findIndex(p => p.playerId === playerId);
    if (playerIndex >= 0) {
      const player = session.players[playerIndex];
      
      if (reason === 'disconnected') {
        // Mark as dropped instead of removing immediately
        player.status = 'dropped';
      } else {
        // Remove player from session
        session.players.splice(playerIndex, 1);
        session.totalPlayers--;
      }

      this.updateSessionPlayerCounts(session);

      const payload: PlayerLeavePayload = {
        sessionId,
        playerId,
        reason,
      };

      this.io.to(`training-session-${sessionId}`).emit(
        TrainingSessionSocketEvent.PLAYER_LEAVE,
        payload
      );
    }
  }

  private updateSessionStatus(socket: AuthenticatedSocket, sessionId: string, status: TrainingSessionState['status'], event: TrainingSessionSocketEvent) {
    try {
      if (socket.data.role !== 'trainer') {
        throw new Error('Only trainers can update session status');
      }

      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const previousStatus = session.status;
      session.status = status;

      if (status === 'paused') {
        session.pausedAt = new Date();
      } else if (status === 'active' && previousStatus === 'paused') {
        session.pausedAt = undefined;
      }

      const update: SessionUpdatePayload = {
        sessionId,
        updates: {
          status,
          pausedAt: session.pausedAt,
        },
      };

      this.io.to(`training-session-${sessionId}`).emit(
        TrainingSessionSocketEvent.SESSION_UPDATE,
        update
      );

      logger.info(`Training session ${sessionId} status updated to ${status}`);
    } catch (error: any) {
      this.emitError(socket, event, error.message, sessionId);
    }
  }

  private updateSessionPlayerCounts(session: TrainingSessionState) {
    session.activePlayers = session.players.filter(p => p.status === 'active').length;
    session.completedPlayers = session.players.filter(p => p.status === 'completed').length;
  }

  private checkRateLimit(key: string, minInterval: number = DEFAULT_RATE_LIMIT_CONFIG.metricsUpdateInterval): boolean {
    const now = Date.now();
    const limit = this.playerRateLimits.get(key);

    if (!limit) {
      this.playerRateLimits.set(key, {
        lastUpdate: now,
        updateCount: 1,
        minuteStart: now,
      });
      return true;
    }

    // Check minimum interval
    if (now - limit.lastUpdate < minInterval) {
      return false;
    }

    // Reset counter if minute has passed
    if (now - limit.minuteStart > 60000) {
      limit.minuteStart = now;
      limit.updateCount = 0;
    }

    // Check rate limit
    if (limit.updateCount >= DEFAULT_RATE_LIMIT_CONFIG.maxUpdatesPerMinute) {
      return false;
    }

    limit.lastUpdate = now;
    limit.updateCount++;
    return true;
  }

  private async createSessionState(sessionId: string, trainerId: string): Promise<TrainingSessionState> {
    // In production, fetch from database
    // For now, create a mock session
    return {
      sessionId,
      workoutId: `workout-${sessionId}`,
      workoutName: 'Training Session',
      workoutType: 'strength',
      status: 'scheduled',
      duration: 0,
      trainerId,
      trainerName: `Trainer ${trainerId}`,
      players: [],
      totalPlayers: 0,
      activePlayers: 0,
      completedPlayers: 0,
    };
  }

  private emitError(socket: Socket, event: string, message: string, sessionId?: string, playerId?: string) {
    const error: TrainingErrorPayload = {
      event,
      message,
      sessionId,
      playerId,
    };
    socket.emit(TrainingSessionSocketEvent.ERROR, error);
    logger.error(`Training session error: ${event} - ${message}`);
  }

  private startSessionCleanup() {
    // Clean up stale sessions every 5 minutes
    this.sessionCleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleTimeout = 3600000; // 1 hour

      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.status === 'completed' || session.status === 'cancelled') {
          const endTime = session.endTime?.getTime() || 0;
          if (now - endTime > staleTimeout) {
            this.activeSessions.delete(sessionId);
            logger.info(`Cleaned up stale session: ${sessionId}`);
          }
        }
      }

      // Clean up old rate limit data
      for (const [key, data] of this.playerRateLimits.entries()) {
        if (now - data.lastUpdate > staleTimeout) {
          this.playerRateLimits.delete(key);
        }
      }
    }, 300000); // Every 5 minutes
  }

  private registerDashboardHandlers(socket: AuthenticatedSocket) {
    // These handlers don't emit but listen for broadcast events from other services
    // The actual emission happens through the public broadcast methods below
  }

  // Public methods for broadcasting dashboard events

  public broadcastMedicalStatusChange(payload: MedicalStatusChangedPayload) {
    // Broadcast to all connected trainers
    this.io.of('/training').emit(TrainingSessionSocketEvent.MEDICAL_STATUS_CHANGED, payload);
    logger.info(`Broadcasted medical status change for player ${payload.playerId}`);
  }

  public broadcastSessionProgress(payload: SessionProgressPayload) {
    // Broadcast to specific session room
    this.io.of('/training').to(`training-session-${payload.sessionId}`).emit(
      TrainingSessionSocketEvent.SESSION_PROGRESS,
      payload
    );
  }

  public broadcastCalendarEventChange(payload: CalendarEventChangedPayload) {
    // Broadcast to all connected trainers
    this.io.of('/training').emit(TrainingSessionSocketEvent.CALENDAR_EVENT_CHANGED, payload);
    logger.info(`Broadcasted calendar event change: ${payload.eventType} for event ${payload.eventId}`);
  }

  public broadcastPlayerAvailabilityChange(payload: PlayerAvailabilityChangedPayload) {
    // Broadcast to all connected trainers
    this.io.of('/training').emit(TrainingSessionSocketEvent.PLAYER_AVAILABILITY_CHANGED, payload);
    logger.info(`Broadcasted availability change for player ${payload.playerId}`);
  }

  public broadcastWorkoutTemplateUpdate(payload: WorkoutTemplateUpdatedPayload) {
    // Broadcast to specific users if shared, otherwise to all trainers
    if (payload.sharedWith && payload.sharedWith.length > 0) {
      // Send to specific users
      payload.sharedWith.forEach(userId => {
        const sockets = [...this.io.of('/training').sockets.values()];
        const userSockets = sockets.filter((s: any) => s.userId === userId);
        userSockets.forEach(s => {
          s.emit(TrainingSessionSocketEvent.WORKOUT_TEMPLATE_UPDATED, payload);
        });
      });
    } else {
      // Broadcast to all trainers
      this.io.of('/training').emit(TrainingSessionSocketEvent.WORKOUT_TEMPLATE_UPDATED, payload);
    }
    logger.info(`Broadcasted template update: ${payload.updateType} for template ${payload.templateId}`);
  }

  public broadcastTeamAssignmentChange(payload: TeamAssignmentChangedPayload) {
    // Broadcast to all connected trainers
    this.io.of('/training').emit(TrainingSessionSocketEvent.TEAM_ASSIGNMENT_CHANGED, payload);
    logger.info(`Broadcasted team assignment change for player ${payload.playerId}`);
  }

  public shutdown() {
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
    }
    this.activeSessions.clear();
    this.playerRateLimits.clear();
  }
  
  // PHASE 3.3: Type-Specific Event Handlers
  
  private registerStrengthHandlers(socket: AuthenticatedSocket) {
    // Strength set completion with detailed metrics
    socket.on(TrainingSessionSocketEvent.STRENGTH_SET_COMPLETION, async (payload: any) => {
      try {
        const { sessionId, exerciseId, setData } = payload;
        const session = this.activeSessions.get(sessionId);
        
        if (!session) {
          throw new Error('Session not found');
        }

        const player = session.players.find(p => p.playerId === payload.playerId);
        if (!player) {
          throw new Error('Player not found in session');
        }

        player.lastActivity = new Date();
        
        // Calculate next set recommendations
        const nextSetPreview = this.calculateNextSetRecommendations(setData);
        
        const enrichedPayload = {
          ...payload,
          nextSetPreview,
          timestamp: new Date()
        };

        // Broadcast to all session participants
        this.io.to(`training-session-${sessionId}`).emit(
          TrainingSessionSocketEvent.STRENGTH_SET_COMPLETION,
          enrichedPayload
        );

        logger.info(`Strength set completion broadcasted for ${payload.playerId} in session ${sessionId}`);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.STRENGTH_SET_COMPLETION, error.message);
      }
    });

    // Weight updates and form feedback
    socket.on(TrainingSessionSocketEvent.STRENGTH_WEIGHT_UPDATE, async (payload: any) => {
      try {
        this.broadcastWithRateLimit(
          socket, 
          `${payload.playerId}-weight`,
          TrainingSessionSocketEvent.STRENGTH_WEIGHT_UPDATE,
          payload,
          5000 // 5 second rate limit
        );
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.STRENGTH_WEIGHT_UPDATE, error.message);
      }
    });
    
    // Rest timer events
    socket.on(TrainingSessionSocketEvent.STRENGTH_REST_TIMER, async (payload: any) => {
      try {
        this.broadcastWithRateLimit(
          socket,
          `${payload.playerId}-rest`,
          TrainingSessionSocketEvent.STRENGTH_REST_TIMER,
          payload,
          1000 // 1 second rate limit for timer updates
        );
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.STRENGTH_REST_TIMER, error.message);
      }
    });
  }
  
  private registerConditioningHandlers(socket: AuthenticatedSocket) {
    // Interval transitions with performance analysis
    socket.on(TrainingSessionSocketEvent.CONDITIONING_INTERVAL_TRANSITION, async (payload: any) => {
      try {
        const { sessionId } = payload;
        const session = this.activeSessions.get(sessionId);
        
        if (!session) {
          throw new Error('Session not found');
        }

        // Analyze interval performance and provide adaptive recommendations
        const adaptiveRecommendations = this.analyzeIntervalPerformance(payload);
        
        const enrichedPayload = {
          ...payload,
          adaptiveRecommendations,
          timestamp: new Date()
        };

        this.io.to(`training-session-${sessionId}`).emit(
          TrainingSessionSocketEvent.CONDITIONING_INTERVAL_TRANSITION,
          enrichedPayload
        );

        logger.info(`Conditioning interval transition for ${payload.playerId} in session ${sessionId}`);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.CONDITIONING_INTERVAL_TRANSITION, error.message);
      }
    });
    
    // Zone compliance monitoring
    socket.on(TrainingSessionSocketEvent.CONDITIONING_ZONE_COMPLIANCE, async (payload: any) => {
      try {
        // High-frequency updates for zone compliance
        this.broadcastWithRateLimit(
          socket,
          `${payload.playerId}-zone`,
          TrainingSessionSocketEvent.CONDITIONING_ZONE_COMPLIANCE,
          payload,
          1000 // 1 second rate limit
        );
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.CONDITIONING_ZONE_COMPLIANCE, error.message);
      }
    });
    
    // Power and heart rate updates
    socket.on(TrainingSessionSocketEvent.CONDITIONING_POWER_UPDATE, async (payload: any) => {
      try {
        this.broadcastWithRateLimit(
          socket,
          `${payload.playerId}-power`,
          TrainingSessionSocketEvent.CONDITIONING_POWER_UPDATE,
          payload,
          2000 // 2 second rate limit
        );
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.CONDITIONING_POWER_UPDATE, error.message);
      }
    });
  }
  
  private registerHybridHandlers(socket: AuthenticatedSocket) {
    // Block transitions with context switching
    socket.on(TrainingSessionSocketEvent.HYBRID_BLOCK_TRANSITION, async (payload: any) => {
      try {
        const { sessionId } = payload;
        const session = this.activeSessions.get(sessionId);
        
        if (!session) {
          throw new Error('Session not found');
        }

        // Calculate adaptive adjustments based on performance
        const adaptiveAdjustments = this.calculateHybridAdaptations(payload);
        
        const enrichedPayload = {
          ...payload,
          adaptiveAdjustments,
          timestamp: new Date()
        };

        this.io.to(`training-session-${sessionId}`).emit(
          TrainingSessionSocketEvent.HYBRID_BLOCK_TRANSITION,
          enrichedPayload
        );

        logger.info(`Hybrid block transition for ${payload.playerId} in session ${sessionId}`);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.HYBRID_BLOCK_TRANSITION, error.message);
      }
    });
    
    // Mixed metrics from different workout types
    socket.on(TrainingSessionSocketEvent.HYBRID_MIXED_METRICS, async (payload: any) => {
      try {
        this.broadcastWithRateLimit(
          socket,
          `${payload.playerId}-hybrid`,
          TrainingSessionSocketEvent.HYBRID_MIXED_METRICS,
          payload,
          2000 // 2 second rate limit
        );
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.HYBRID_MIXED_METRICS, error.message);
      }
    });
  }
  
  private registerAgilityHandlers(socket: AuthenticatedSocket) {
    // Drill completions with performance analysis
    socket.on(TrainingSessionSocketEvent.AGILITY_DRILL_COMPLETION, async (payload: any) => {
      try {
        const { sessionId } = payload;
        const session = this.activeSessions.get(sessionId);
        
        if (!session) {
          throw new Error('Session not found');
        }

        // Calculate performance improvements and trends
        const performanceAnalysis = this.analyzeAgilityPerformance(payload);
        
        const enrichedPayload = {
          ...payload,
          performanceAnalysis,
          timestamp: new Date()
        };

        this.io.to(`training-session-${sessionId}`).emit(
          TrainingSessionSocketEvent.AGILITY_DRILL_COMPLETION,
          enrichedPayload
        );

        logger.info(`Agility drill completion for ${payload.playerId} in session ${sessionId}`);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.AGILITY_DRILL_COMPLETION, error.message);
      }
    });
    
    // Pattern progress with visual guidance
    socket.on(TrainingSessionSocketEvent.AGILITY_PATTERN_PROGRESS, async (payload: any) => {
      try {
        this.broadcastWithRateLimit(
          socket,
          `${payload.playerId}-pattern`,
          TrainingSessionSocketEvent.AGILITY_PATTERN_PROGRESS,
          payload,
          500 // 0.5 second rate limit for pattern updates
        );
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.AGILITY_PATTERN_PROGRESS, error.message);
      }
    });
    
    // Error tracking for technique improvement
    socket.on(TrainingSessionSocketEvent.AGILITY_ERROR_TRACKING, async (payload: any) => {
      try {
        const enrichedPayload = {
          ...payload,
          correctionSuggestions: this.generateAgilityCorrections(payload),
          timestamp: new Date()
        };

        this.io.to(`training-session-${payload.sessionId}`).emit(
          TrainingSessionSocketEvent.AGILITY_ERROR_TRACKING,
          enrichedPayload
        );
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.AGILITY_ERROR_TRACKING, error.message);
      }
    });
  }
  
  private registerBulkOperationHandlers(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    
    // Bulk session creation
    socket.on(TrainingSessionSocketEvent.BULK_SESSION_CREATED, async (payload: any) => {
      try {
        if (socket.data.role !== 'trainer') {
          throw new Error('Only trainers can create bulk sessions');
        }

        // Store bulk session state
        const bulkSession = {
          ...payload,
          createdBy: userId,
          timestamp: new Date()
        };

        // Broadcast to all trainers
        this.io.emit(TrainingSessionSocketEvent.BULK_SESSION_CREATED, bulkSession);

        logger.info(`Bulk session created: ${payload.bundleId} by ${userId}`);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.BULK_SESSION_CREATED, error.message);
      }
    });
    
    // Bulk operations (start all, pause all, etc.)
    socket.on(TrainingSessionSocketEvent.BULK_OPERATION_STATUS, async (payload: any) => {
      try {
        if (socket.data.role !== 'trainer') {
          throw new Error('Only trainers can execute bulk operations');
        }

        const { bundleId, operation, affectedSessions } = payload;
        
        // Execute operation on all affected sessions
        const results = await this.executeBulkOperation(operation, affectedSessions, userId);
        
        const statusPayload = {
          ...payload,
          status: results.allSuccessful ? 'completed' : 'partially_completed',
          progress: results.progress,
          executedBy: userId,
          timestamp: new Date()
        };

        // Broadcast to all participants of affected sessions
        affectedSessions.forEach(sessionId => {
          this.io.to(`training-session-${sessionId}`).emit(
            TrainingSessionSocketEvent.BULK_OPERATION_STATUS,
            statusPayload
          );
        });

        logger.info(`Bulk operation ${operation} executed on bundle ${bundleId}`);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.BULK_OPERATION_STATUS, error.message);
      }
    });
    
    // Cross-session participant moves
    socket.on(TrainingSessionSocketEvent.CROSS_SESSION_PARTICIPANT_MOVE, async (payload: any) => {
      try {
        if (socket.data.role !== 'trainer') {
          throw new Error('Only trainers can move participants between sessions');
        }

        const { bundleId, playerId, fromSessionId, toSessionId } = payload;
        
        // Execute the move
        const moveResult = await this.moveParticipantBetweenSessions(
          playerId, 
          fromSessionId, 
          toSessionId, 
          payload.preserveProgress
        );
        
        const enrichedPayload = {
          ...payload,
          moveResult,
          approvedBy: userId,
          timestamp: new Date()
        };

        // Notify both sessions
        this.io.to(`training-session-${fromSessionId}`).emit(
          TrainingSessionSocketEvent.CROSS_SESSION_PARTICIPANT_MOVE,
          enrichedPayload
        );
        this.io.to(`training-session-${toSessionId}`).emit(
          TrainingSessionSocketEvent.CROSS_SESSION_PARTICIPANT_MOVE,
          enrichedPayload
        );

        logger.info(`Participant ${playerId} moved from ${fromSessionId} to ${toSessionId}`);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.CROSS_SESSION_PARTICIPANT_MOVE, error.message);
      }
    });
    
    // Aggregate metrics broadcasting
    socket.on(TrainingSessionSocketEvent.AGGREGATE_METRICS_BROADCAST, async (payload: any) => {
      try {
        // Calculate and broadcast aggregate metrics for bulk sessions
        const aggregateMetrics = this.calculateAggregateMetrics(payload.bundleId);
        
        const metricsPayload = {
          ...payload,
          aggregatedMetrics: aggregateMetrics,
          timestamp: new Date()
        };

        // Broadcast to all trainers monitoring the bundle
        this.io.emit(TrainingSessionSocketEvent.AGGREGATE_METRICS_BROADCAST, metricsPayload);
      } catch (error: any) {
        this.emitError(socket, TrainingSessionSocketEvent.AGGREGATE_METRICS_BROADCAST, error.message);
      }
    });
  }
  
  // Helper methods for enhanced functionality
  
  private broadcastWithRateLimit(
    socket: AuthenticatedSocket,
    rateLimitKey: string,
    eventType: TrainingSessionSocketEvent,
    payload: any,
    minInterval: number
  ) {
    if (!this.checkRateLimit(rateLimitKey, minInterval)) {
      return;
    }
    
    const enrichedPayload = {
      ...payload,
      timestamp: new Date()
    };
    
    this.io.to(`training-session-${payload.sessionId}`).emit(eventType, enrichedPayload);
  }
  
  private calculateNextSetRecommendations(setData: any) {
    // AI-powered recommendations based on current performance
    const { weight, reps, rpe, setNumber } = setData;
    
    // Simple recommendation logic (would be more sophisticated in production)
    let nextWeight = weight;
    let nextReps = reps;
    
    if (rpe && rpe < 7 && setNumber < setData.totalSets) {
      nextWeight *= 1.025; // Increase weight by 2.5%
    } else if (rpe && rpe > 8) {
      nextWeight *= 0.975; // Decrease weight by 2.5%
    }
    
    return {
      weight: Math.round(nextWeight * 4) / 4, // Round to nearest 0.25
      targetReps: nextReps,
      estimatedRest: this.calculateRestTime(rpe, weight)
    };
  }
  
  private calculateRestTime(rpe: number, weight: number): number {
    // Base rest time calculation
    if (rpe >= 9) return 180; // 3 minutes for high intensity
    if (rpe >= 7) return 120; // 2 minutes for moderate-high intensity
    return 90; // 1.5 minutes for lower intensity
  }
  
  private analyzeIntervalPerformance(payload: any) {
    // Analyze heart rate compliance, power output, etc.
    const { lastIntervalMetrics } = payload;
    
    if (!lastIntervalMetrics) return null;
    
    return {
      intensityAdjustment: lastIntervalMetrics.zoneCompliance < 70 ? -0.1 : 0,
      recoveryNeeded: lastIntervalMetrics.avgHeartRate > 180 ? 30 : 0, // Extra seconds
      performanceTrend: 'stable' // Would calculate based on historical data
    };
  }
  
  private calculateHybridAdaptations(payload: any) {
    // Calculate adaptive adjustments for hybrid workouts
    return {
      intensityModifier: 1.0, // No change
      durationModifier: 1.0,
      reason: 'Performance within expected range'
    };
  }
  
  private analyzeAgilityPerformance(payload: any) {
    const { completionTime, bestTime, errors } = payload;
    
    return {
      improvement: bestTime ? completionTime - bestTime : 0,
      trend: errors.length < 2 ? 'improving' : 'needs_focus',
      suggestions: errors.length > 2 ? ['Focus on cone awareness', 'Reduce speed, increase accuracy'] : []
    };
  }
  
  private generateAgilityCorreections(payload: any) {
    // Generate correction suggestions based on error types
    const corrections = [];
    
    if (payload.errorTypes?.includes('cone_contact')) {
      corrections.push('Maintain wider turning radius around cones');
    }
    if (payload.errorTypes?.includes('false_start')) {
      corrections.push('Wait for audio cue before starting');
    }
    
    return corrections;
  }
  
  private async executeBulkOperation(operation: string, sessionIds: string[], userId: string) {
    const results = {
      allSuccessful: true,
      progress: { completed: 0, total: sessionIds.length, failed: [] as string[] }
    };
    
    for (const sessionId of sessionIds) {
      try {
        const session = this.activeSessions.get(sessionId);
        if (!session) continue;
        
        switch (operation) {
          case 'start_all':
            session.status = 'active';
            session.startTime = new Date();
            break;
          case 'pause_all':
            session.status = 'paused';
            session.pausedAt = new Date();
            break;
          case 'resume_all':
            session.status = 'active';
            session.pausedAt = undefined;
            break;
          case 'emergency_stop_all':
            session.status = 'cancelled';
            session.endTime = new Date();
            break;
        }
        
        results.progress.completed++;
      } catch (error) {
        results.allSuccessful = false;
        results.progress.failed.push(sessionId);
      }
    }
    
    return results;
  }
  
  private async moveParticipantBetweenSessions(playerId: string, fromSessionId: string, toSessionId: string, preserveProgress: boolean) {
    const fromSession = this.activeSessions.get(fromSessionId);
    const toSession = this.activeSessions.get(toSessionId);
    
    if (!fromSession || !toSession) {
      throw new Error('One or both sessions not found');
    }
    
    // Remove from source session
    const playerIndex = fromSession.players.findIndex(p => p.playerId === playerId);
    if (playerIndex >= 0) {
      const player = fromSession.players.splice(playerIndex, 1)[0];
      fromSession.totalPlayers--;
      
      // Add to target session
      if (preserveProgress) {
        player.joinedAt = new Date();
        player.status = 'active';
      } else {
        // Reset progress
        player.currentExercise = undefined;
        player.currentInterval = undefined;
        player.metrics = undefined;
        player.status = 'waiting';
      }
      
      toSession.players.push(player);
      toSession.totalPlayers++;
      
      this.updateSessionPlayerCounts(fromSession);
      this.updateSessionPlayerCounts(toSession);
      
      return {
        success: true,
        progressPreserved: preserveProgress,
        newStatus: player.status
      };
    }
    
    throw new Error('Player not found in source session');
  }
  
  private calculateAggregateMetrics(bundleId: string) {
    // Calculate aggregate metrics across all sessions in a bundle
    // This would query all sessions associated with the bundle
    return {
      totalParticipants: 0,
      activeParticipants: 0,
      completedParticipants: 0,
      averageProgress: 0,
      performanceAlerts: [],
      resourceUtilization: {
        facilities: [],
        equipment: []
      }
    };
  }
  
  private generateAgilityCorrections(payload: any) {
    return this.generateAgilityCorreections(payload);
  }

  // PHASE 5.2: New Workout Type Handlers

  private registerStabilityCoreHandlers(socket: AuthenticatedSocket) {
    // Stability & Core balance updates
    socket.on('STABILITY_CORE_BALANCE_UPDATE', async (payload: any) => {
      try {
        const { sessionId } = payload;
        const session = this.activeSessions.get(sessionId);
        
        if (!session) {
          throw new Error('Session not found');
        }

        const player = session.players.find(p => p.playerId === payload.playerId);
        if (!player) {
          throw new Error('Player not found in session');
        }

        player.lastActivity = new Date();
        
        // Analyze balance performance and provide recommendations
        const balanceAnalysis = this.analyzeBalancePerformance(payload);
        
        const enrichedPayload = {
          ...payload,
          balanceAnalysis,
          timestamp: new Date()
        };

        // Broadcast with high frequency for real-time feedback
        this.broadcastWithRateLimit(
          socket,
          `${payload.playerId}-balance`,
          'STABILITY_CORE_BALANCE_UPDATE' as any,
          enrichedPayload,
          1000 // 1 second rate limit for balance updates
        );

        logger.info(`Stability core balance update for ${payload.playerId} in session ${sessionId}`);
      } catch (error: any) {
        this.emitError(socket, 'STABILITY_CORE_BALANCE_UPDATE', error.message);
      }
    });

    // Hold completion events
    socket.on('STABILITY_CORE_HOLD_COMPLETION', async (payload: any) => {
      try {
        const { sessionId } = payload;
        const session = this.activeSessions.get(sessionId);
        
        if (!session) {
          throw new Error('Session not found');
        }

        // Calculate progression recommendations
        const progressionRecommendations = this.calculateStabilityCoreProgression(payload);
        
        const enrichedPayload = {
          ...payload,
          progressionRecommendations,
          timestamp: new Date()
        };

        this.io.to(`training-session-${sessionId}`).emit(
          'STABILITY_CORE_HOLD_COMPLETION',
          enrichedPayload
        );

        logger.info(`Stability core hold completion for ${payload.playerId} in session ${sessionId}`);
      } catch (error: any) {
        this.emitError(socket, 'STABILITY_CORE_HOLD_COMPLETION', error.message);
      }
    });

    // Progression events
    socket.on('STABILITY_CORE_PROGRESSION', async (payload: any) => {
      try {
        const enrichedPayload = {
          ...payload,
          adaptiveRecommendations: this.generateStabilityCoreAdaptations(payload),
          timestamp: new Date()
        };

        this.io.to(`training-session-${payload.sessionId}`).emit(
          'STABILITY_CORE_PROGRESSION',
          enrichedPayload
        );
      } catch (error: any) {
        this.emitError(socket, 'STABILITY_CORE_PROGRESSION', error.message);
      }
    });
  }

  private registerPlyometricsHandlers(socket: AuthenticatedSocket) {
    // Jump measurement events
    socket.on('PLYOMETRICS_JUMP_MEASUREMENT', async (payload: any) => {
      try {
        const { sessionId } = payload;
        const session = this.activeSessions.get(sessionId);
        
        if (!session) {
          throw new Error('Session not found');
        }

        const player = session.players.find(p => p.playerId === payload.playerId);
        if (!player) {
          throw new Error('Player not found in session');
        }

        player.lastActivity = new Date();
        
        // Analyze jump performance and calculate improvements
        const jumpAnalysis = this.analyzeJumpPerformance(payload);
        
        const enrichedPayload = {
          ...payload,
          jumpAnalysis,
          timestamp: new Date()
        };

        this.io.to(`training-session-${sessionId}`).emit(
          'PLYOMETRICS_JUMP_MEASUREMENT',
          enrichedPayload
        );

        logger.info(`Plyometrics jump measurement for ${payload.playerId} in session ${sessionId}`);
      } catch (error: any) {
        this.emitError(socket, 'PLYOMETRICS_JUMP_MEASUREMENT', error.message);
      }
    });

    // Landing quality assessment
    socket.on('PLYOMETRICS_LANDING_QUALITY', async (payload: any) => {
      try {
        const { sessionId } = payload;
        
        // Generate injury prevention recommendations
        const injuryPreventionTips = this.generateInjuryPreventionTips(payload);
        
        const enrichedPayload = {
          ...payload,
          injuryPreventionTips,
          timestamp: new Date()
        };

        this.io.to(`training-session-${sessionId}`).emit(
          'PLYOMETRICS_LANDING_QUALITY',
          enrichedPayload
        );

        // Send immediate alerts for high injury risk
        if (payload.injuryRiskIndicators?.riskLevel === 'high') {
          this.io.to(`training-session-${sessionId}`).emit(
            'INJURY_RISK_ALERT',
            {
              playerId: payload.playerId,
              riskLevel: 'high',
              recommendedAction: payload.injuryRiskIndicators.recommendedAction,
              timestamp: new Date()
            }
          );
        }

        logger.info(`Plyometrics landing quality assessment for ${payload.playerId} in session ${sessionId}`);
      } catch (error: any) {
        this.emitError(socket, 'PLYOMETRICS_LANDING_QUALITY', error.message);
      }
    });

    // Set completion events
    socket.on('PLYOMETRICS_SET_COMPLETION', async (payload: any) => {
      try {
        const enrichedPayload = {
          ...payload,
          recoveryOptimization: this.optimizePlyometricsRecovery(payload),
          timestamp: new Date()
        };

        this.io.to(`training-session-${payload.sessionId}`).emit(
          'PLYOMETRICS_SET_COMPLETION',
          enrichedPayload
        );
      } catch (error: any) {
        this.emitError(socket, 'PLYOMETRICS_SET_COMPLETION', error.message);
      }
    });
  }

  private registerWrestlingHandlers(socket: AuthenticatedSocket) {
    // Round transition events
    socket.on('WRESTLING_ROUND_TRANSITION', async (payload: any) => {
      try {
        const { sessionId } = payload;
        const session = this.activeSessions.get(sessionId);
        
        if (!session) {
          throw new Error('Session not found');
        }

        const player = session.players.find(p => p.playerId === payload.playerId);
        if (!player) {
          throw new Error('Player not found in session');
        }

        player.lastActivity = new Date();
        
        // Analyze round performance and generate feedback
        const roundAnalysis = this.analyzeWrestlingRound(payload);
        
        const enrichedPayload = {
          ...payload,
          roundAnalysis,
          timestamp: new Date()
        };

        this.io.to(`training-session-${sessionId}`).emit(
          'WRESTLING_ROUND_TRANSITION',
          enrichedPayload
        );

        logger.info(`Wrestling round transition for ${payload.playerId} in session ${sessionId}`);
      } catch (error: any) {
        this.emitError(socket, 'WRESTLING_ROUND_TRANSITION', error.message);
      }
    });

    // Technique scoring events
    socket.on('WRESTLING_TECHNIQUE_SCORE', async (payload: any) => {
      try {
        const { sessionId } = payload;
        
        // Generate technique improvement suggestions
        const techniqueImprovement = this.generateTechniqueImprovement(payload);
        
        const enrichedPayload = {
          ...payload,
          techniqueImprovement,
          timestamp: new Date()
        };

        this.io.to(`training-session-${sessionId}`).emit(
          'WRESTLING_TECHNIQUE_SCORE',
          enrichedPayload
        );

        logger.info(`Wrestling technique score for ${payload.playerId} in session ${sessionId}`);
      } catch (error: any) {
        this.emitError(socket, 'WRESTLING_TECHNIQUE_SCORE', error.message);
      }
    });

    // Position control events
    socket.on('WRESTLING_POSITION_CONTROL', async (payload: any) => {
      try {
        // High-frequency updates for position control
        this.broadcastWithRateLimit(
          socket,
          `${payload.playerId}-position`,
          'WRESTLING_POSITION_CONTROL' as any,
          {
            ...payload,
            tacticalRecommendations: this.generateTacticalRecommendations(payload),
            timestamp: new Date()
          },
          2000 // 2 second rate limit
        );
      } catch (error: any) {
        this.emitError(socket, 'WRESTLING_POSITION_CONTROL', error.message);
      }
    });

    // Conditioning metrics events
    socket.on('WRESTLING_CONDITIONING_METRICS', async (payload: any) => {
      try {
        const enrichedPayload = {
          ...payload,
          fatigueAnalysis: this.analyzeWrestlingFatigue(payload),
          recoveryRecommendations: this.generateWrestlingRecoveryPlan(payload),
          timestamp: new Date()
        };

        this.io.to(`training-session-${payload.sessionId}`).emit(
          'WRESTLING_CONDITIONING_METRICS',
          enrichedPayload
        );

        // Monitor for fatigue warnings
        if (payload.performanceDecline?.speedDecline > 20 || payload.performanceDecline?.powerDecline > 25) {
          this.io.to(`training-session-${payload.sessionId}`).emit(
            'FATIGUE_WARNING',
            {
              playerId: payload.playerId,
              severity: 'high',
              recommendations: ['Consider extended rest', 'Reduce intensity'],
              metrics: {
                speedDecline: payload.performanceDecline?.speedDecline,
                powerDecline: payload.performanceDecline?.powerDecline
              },
              timestamp: new Date()
            }
          );
        }
      } catch (error: any) {
        this.emitError(socket, 'WRESTLING_CONDITIONING_METRICS', error.message);
      }
    });
  }

  // Helper methods for new workout types

  private analyzeBalancePerformance(payload: any) {
    const { balanceMetrics, holdProgress } = payload;
    
    return {
      stabilityTrend: balanceMetrics.stabilityScore > 80 ? 'excellent' : balanceMetrics.stabilityScore > 60 ? 'good' : 'needs_improvement',
      swayAnalysis: balanceMetrics.swayVelocity < 20 ? 'controlled' : 'excessive',
      progressRecommendation: holdProgress.isHolding ? 'maintain_current' : 'restart_hold',
      confidenceLevel: balanceMetrics.balanceConfidence > 70 ? 'high' : 'low'
    };
  }

  private calculateStabilityCoreProgression(payload: any) {
    const { performanceMetrics, completionStatus } = payload;
    
    if (completionStatus === 'completed' && performanceMetrics.qualityScore >= 4) {
      return {
        readyForProgression: true,
        nextLevel: {
          surfaceProgression: 'advance_one_level',
          timeIncrease: 5, // seconds
          difficultyIncrease: 'add_perturbation'
        }
      };
    }
    
    return {
      readyForProgression: false,
      recommendation: 'maintain_current_level',
      focusAreas: ['stability_improvement', 'hold_duration']
    };
  }

  private generateStabilityCoreAdaptations(payload: any) {
    return {
      intensityModifier: payload.performanceJustification?.stabilityTrend === 'improving' ? 1.1 : 1.0,
      durationModifier: payload.progressionReason === 'mastery_achieved' ? 1.2 : 1.0,
      surfaceRecommendation: payload.toLevel?.surface || payload.fromLevel?.surface
    };
  }

  private analyzeJumpPerformance(payload: any) {
    const { measurements, techniqueAnalysis } = payload;
    
    return {
      powerEfficiency: measurements.reactiveStrengthIndex > 2.0 ? 'excellent' : measurements.reactiveStrengthIndex > 1.5 ? 'good' : 'needs_improvement',
      asymmetryWarning: measurements.asymmetryIndex > 15,
      techniqueConsistency: techniqueAnalysis.overallTechnique >= 4 ? 'consistent' : 'variable',
      recommendedFocus: measurements.contactTime > 250 ? ['reduce_contact_time'] : measurements.flightTime < 300 ? ['increase_explosiveness'] : ['maintain_current']
    };
  }

  private generateInjuryPreventionTips(payload: any) {
    const tips = [];
    const { landingAssessment, injuryRiskIndicators } = payload;
    
    if (!landingAssessment.bilateralLanding) {
      tips.push('Focus on landing with both feet simultaneously');
    }
    if (landingAssessment.kneeValgusAngle > 15) {
      tips.push('Strengthen glutes and hip abductors to reduce knee valgus');
    }
    if (landingAssessment.controlRating < 3) {
      tips.push('Practice controlled landings at reduced intensity');
    }
    if (injuryRiskIndicators.riskLevel === 'high') {
      tips.push('Consider immediate technique review with trainer');
    }
    
    return tips;
  }

  private optimizePlyometricsRecovery(payload: any) {
    const { qualityMetrics, setPerformanceSummary } = payload;
    
    return {
      restDuration: qualityMetrics.injuryRiskEvents > 1 ? 300 : 180, // Longer rest if high risk
      activeRecovery: setPerformanceSummary.fatigueIndex > 20,
      readinessCheck: qualityMetrics.averageLandingScore < 3,
      nextSetModifications: {
        jumpsReduction: setPerformanceSummary.fatigueIndex > 25 ? 2 : 0,
        intensityReduction: qualityMetrics.injuryRiskEvents > 0 ? 0.9 : 1.0
      }
    };
  }

  private analyzeWrestlingRound(payload: any) {
    const { roundDuration, plannedDuration, intensityRating, partnerInfo } = payload;
    
    return {
      durationAnalysis: roundDuration / plannedDuration,
      intensityTrend: intensityRating > 8 ? 'high_intensity' : intensityRating > 6 ? 'moderate' : 'low',
      partnerMatchup: partnerInfo?.skillLevelDifference || 'unknown',
      recommendedRecovery: intensityRating > 8 ? 180 : 120 // seconds
    };
  }

  private generateTechniqueImprovement(payload: any) {
    const { executionRating, techniqueFeedback, successOutcome } = payload;
    const improvements = [];
    
    if (executionRating.setup < 4) improvements.push('Focus on technique setup and positioning');
    if (executionRating.execution < 4) improvements.push('Work on technique execution speed and power');
    if (executionRating.finishing < 4) improvements.push('Improve technique finishing and follow-through');
    if (executionRating.timing < 4) improvements.push('Practice technique timing and rhythm');
    
    return {
      priorityAreas: improvements,
      strengths: techniqueFeedback.strengthAreas,
      nextFocus: successOutcome === 'defended' ? 'setup_variation' : 'consistency',
      drillRecommendations: this.recommendWrestlingDrills(executionRating)
    };
  }

  private recommendWrestlingDrills(executionRating: any) {
    const drills = [];
    
    if (executionRating.setup < 4) drills.push('Position setup drills');
    if (executionRating.execution < 4) drills.push('Explosive execution practice');
    if (executionRating.timing < 4) drills.push('Rhythm and timing drills');
    
    return drills;
  }

  private generateTacticalRecommendations(payload: any) {
    const { controlStatus, controlQuality, tacticalElements } = payload;
    const recommendations = [];
    
    if (controlStatus === 'being_controlled' && controlQuality.defensiveIntegrity < 3) {
      recommendations.push('Focus on defensive positioning and frame strength');
    }
    if (controlStatus === 'controlling' && controlQuality.advancement < 3) {
      recommendations.push('Work on advancing position and applying pressure');
    }
    if (tacticalElements.aggression < 3) {
      recommendations.push('Increase aggression and forward pressure');
    }
    if (tacticalElements.adaptation < 3) {
      recommendations.push('Adapt tactics based on opponent responses');
    }
    
    return recommendations;
  }

  private analyzeWrestlingFatigue(payload: any) {
    const { performanceDecline, physiologicalMarkers } = payload;
    
    return {
      fatigueLevel: performanceDecline.speedDecline > 15 || performanceDecline.powerDecline > 20 ? 'high' : 'moderate',
      primaryIndicators: [
        ...(performanceDecline.speedDecline > 15 ? ['speed_decline'] : []),
        ...(performanceDecline.powerDecline > 20 ? ['power_decline'] : []),
        ...(performanceDecline.techniqueDecline > 2 ? ['technique_decline'] : [])
      ],
      physiologicalStress: physiologicalMarkers.heartRate > 185 ? 'high' : 'moderate'
    };
  }

  private generateWrestlingRecoveryPlan(payload: any) {
    const { recoveryIndicators, performanceDecline } = payload;
    
    return {
      immediateRecovery: recoveryIndicators.breathingRecoveryTime > 60 ? 'extended_rest' : 'normal_rest',
      betweenRounds: recoveryIndicators.postRoundHR > 150 ? 180 : 120, // seconds
      readinessCheck: performanceDecline.decisionMaking < 3,
      modifications: {
        intensityReduction: performanceDecline.speedDecline > 20 ? 0.8 : 1.0,
        durationReduction: recoveryIndicators.physicalRecovery < 3 ? 0.9 : 1.0
      }
    };
  }
}