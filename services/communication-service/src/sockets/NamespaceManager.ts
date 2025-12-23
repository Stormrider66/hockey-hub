// @ts-nocheck - Socket.io namespace manager with complex types
import { Server, Namespace } from 'socket.io';
import { socketAuthMiddleware, AuthenticatedSocket } from './authMiddleware';
import { TrainingSessionHandler } from './trainingSessionHandler';
import { TacticalCollaborationHandler } from './tactical/tacticalCollaborationHandler';
import { logger } from '@hockey-hub/shared-lib';

export class NamespaceManager {
  private io: Server;
  private trainingNamespace: Namespace;
  private tacticalNamespace: Namespace;
  private trainingHandler: TrainingSessionHandler;
  private tacticalHandler: TacticalCollaborationHandler;

  constructor(io: Server) {
    this.io = io;
    
    // Create training namespace
    this.trainingNamespace = io.of('/training');
    this.trainingHandler = new TrainingSessionHandler(io);
    
    // Create tactical collaboration namespace
    this.tacticalNamespace = io.of('/tactical');
    this.tacticalHandler = new TacticalCollaborationHandler(this.tacticalNamespace);
    
    this.setupTrainingNamespace();
    this.setupTacticalNamespace();
  }

  private setupTrainingNamespace() {
    // Apply authentication middleware
    this.trainingNamespace.use(socketAuthMiddleware);

    // Handle connections to training namespace
    this.trainingNamespace.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`User ${socket.userId} connected to training namespace`);
      
      // Pass to training handler
      this.trainingHandler.handleConnection(socket);

      socket.on('disconnect', () => {
        logger.info(`User ${socket.userId} disconnected from training namespace`);
      });
    });

    logger.info('Training namespace initialized at /training');
  }

  private setupTacticalNamespace() {
    // Apply authentication middleware
    this.tacticalNamespace.use(socketAuthMiddleware);

    // Handle connections to tactical namespace
    this.tacticalNamespace.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`User ${socket.userId} connected to tactical namespace`);
      
      // Pass to tactical handler
      this.tacticalHandler.handleConnection(socket as any);

      socket.on('disconnect', (reason) => {
        logger.info(`User ${socket.userId} disconnected from tactical namespace: ${reason}`);
      });
    });

    logger.info('Tactical collaboration namespace initialized at /tactical');
  }

  public shutdown() {
    // Cleanup handlers
    this.trainingHandler.shutdown();
    
    // Disconnect all clients
    this.trainingNamespace.disconnectSockets(true);
    this.tacticalNamespace.disconnectSockets(true);
  }

  // Get namespace for external use
  public getTrainingNamespace(): Namespace {
    return this.trainingNamespace;
  }

  public getTacticalNamespace(): Namespace {
    return this.tacticalNamespace;
  }

  // Send notification to specific training session
  public sendToTrainingSession(sessionId: string, event: string, data: any) {
    this.trainingNamespace.to(`training-session-${sessionId}`).emit(event, data);
  }

  // Send notification to specific tactical session
  public sendToTacticalSession(sessionId: string, event: string, data: any) {
    this.tacticalNamespace.to(sessionId).emit(event, data);
  }

  // Send notification to specific user in training namespace
  public sendToTrainingUser(userId: string, event: string, data: any) {
    const sockets = [...this.trainingNamespace.sockets.values()];
    const userSockets = sockets.filter((socket: any) => socket.userId === userId);
    
    userSockets.forEach(socket => {
      socket.emit(event, data);
    });
  }

  // Send notification to specific user in tactical namespace
  public sendToTacticalUser(userId: string, event: string, data: any) {
    const sockets = [...this.tacticalNamespace.sockets.values()];
    const userSockets = sockets.filter((socket: any) => socket.userId === userId);
    
    userSockets.forEach(socket => {
      socket.emit(event, data);
    });
  }

  // Get the training handler for external broadcasting
  public getTrainingHandler(): TrainingSessionHandler {
    return this.trainingHandler;
  }

  // Get the tactical handler for external broadcasting
  public getTacticalHandler(): TacticalCollaborationHandler {
    return this.tacticalHandler;
  }

  // Get collaboration statistics
  public getCollaborationStats() {
    return {
      training: {
        activeConnections: this.trainingNamespace.sockets.size,
        activeSessions: this.trainingHandler ? Object.keys(this.trainingHandler).length : 0
      },
      tactical: {
        activeConnections: this.tacticalNamespace.sockets.size,
        activeSessions: this.tacticalHandler.getSessionCount(),
        activeUsers: this.tacticalHandler.getActiveUserCount()
      }
    };
  }
}