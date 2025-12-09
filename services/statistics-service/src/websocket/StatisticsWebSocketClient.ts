import { io, Socket } from 'socket.io-client';
import { logger } from '@hockey-hub/shared-lib';
import {
  TrainingSessionSocketEvent,
  MetricsUpdatePayload,
  ExerciseProgressPayload,
  IntervalProgressPayload,
  SessionUpdatePayload,
} from '@hockey-hub/shared-types';
import { MetricsCollectionService } from '../services/MetricsCollectionService';
import { WorkoutSummaryService } from '../services/WorkoutSummaryService';

export class StatisticsWebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnected = false;
  private metricsCollectionService: MetricsCollectionService;
  private workoutSummaryService: WorkoutSummaryService;

  constructor(
    metricsCollectionService: MetricsCollectionService,
    workoutSummaryService: WorkoutSummaryService
  ) {
    this.metricsCollectionService = metricsCollectionService;
    this.workoutSummaryService = workoutSummaryService;
  }

  async connect(): Promise<void> {
    const communicationServiceUrl = process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:3002';
    
    try {
      this.socket = io(`${communicationServiceUrl}/training`, {
        auth: {
          serviceId: 'statistics-service',
          serviceToken: process.env.INTER_SERVICE_TOKEN || 'dev-token'
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
      });

      this.setupEventHandlers();
      
      return new Promise((resolve, reject) => {
        this.socket!.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          logger.info('📊 Statistics Service: Connected to Communication Service WebSocket');
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          logger.error('📊 Statistics Service: WebSocket connection error:', error);
          reject(error);
        });

        // Set timeout for initial connection
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 15000);
      });
    } catch (error) {
      logger.error('📊 Statistics Service: Failed to initialize WebSocket connection:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection management
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('📊 Statistics Service: WebSocket connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      logger.warn(`📊 Statistics Service: WebSocket disconnected: ${reason}`);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.isConnected = true;
      logger.info(`📊 Statistics Service: WebSocket reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_error', (error) => {
      logger.error('📊 Statistics Service: WebSocket reconnection failed:', error);
    });

    // Training session events for analytics collection
    this.socket.on(TrainingSessionSocketEvent.PLAYER_METRICS_UPDATE, this.handleMetricsUpdate.bind(this));
    this.socket.on(TrainingSessionSocketEvent.PLAYER_EXERCISE_PROGRESS, this.handleExerciseProgress.bind(this));
    this.socket.on(TrainingSessionSocketEvent.PLAYER_INTERVAL_PROGRESS, this.handleIntervalProgress.bind(this));
    this.socket.on(TrainingSessionSocketEvent.SESSION_UPDATE, this.handleSessionUpdate.bind(this));
    this.socket.on(TrainingSessionSocketEvent.SESSION_END, this.handleSessionEnd.bind(this));

    logger.info('📊 Statistics Service: WebSocket event handlers registered');
  }

  private async handleMetricsUpdate(payload: MetricsUpdatePayload): Promise<void> {
    try {
      await this.metricsCollectionService.collectPlayerMetrics(payload);
      logger.debug(`📊 Collected metrics for player ${payload.metrics.playerId} in session ${payload.sessionId}`);
    } catch (error) {
      logger.error('📊 Failed to collect player metrics:', error);
    }
  }

  private async handleExerciseProgress(payload: ExerciseProgressPayload): Promise<void> {
    try {
      await this.metricsCollectionService.collectExerciseProgress(payload);
      logger.debug(`📊 Collected exercise progress for player ${payload.progress.playerId}`);
    } catch (error) {
      logger.error('📊 Failed to collect exercise progress:', error);
    }
  }

  private async handleIntervalProgress(payload: IntervalProgressPayload): Promise<void> {
    try {
      await this.metricsCollectionService.collectIntervalProgress(payload);
      logger.debug(`📊 Collected interval progress for player ${payload.progress.playerId}`);
    } catch (error) {
      logger.error('📊 Failed to collect interval progress:', error);
    }
  }

  private async handleSessionUpdate(payload: SessionUpdatePayload): Promise<void> {
    try {
      await this.metricsCollectionService.updateSessionState(payload);
      logger.debug(`📊 Updated session state for ${payload.sessionId}`);
    } catch (error) {
      logger.error('📊 Failed to update session state:', error);
    }
  }

  private async handleSessionEnd(payload: { sessionId: string }): Promise<void> {
    try {
      // Generate comprehensive workout summary when session ends
      await this.workoutSummaryService.generateSessionSummary(payload.sessionId);
      logger.info(`📊 Generated workout summary for session ${payload.sessionId}`);
    } catch (error) {
      logger.error('📊 Failed to generate workout summary:', error);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('📊 Statistics Service: Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    logger.info(`📊 Statistics Service: Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (!this.isConnected && this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  public async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      logger.info('📊 Statistics Service: WebSocket disconnected');
    }
  }

  // Health check method
  public getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }
}