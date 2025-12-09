import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Cluster } from '@socket.io/cluster-adapter';
import Redis from 'ioredis';
import { AuthenticatedSocket } from './authMiddleware';
import { Logger } from '@hockey-hub/shared-lib';

const logger = new Logger('OptimizedSocketManager');

export interface SocketPoolConfig {
  maxConnectionsPerUser?: number;
  connectionTimeout?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  reconnectionDelay?: number;
  maxReconnectionAttempts?: number;
  enableCompression?: boolean;
  perMessageDeflate?: boolean;
}

export class OptimizedSocketManager {
  private io: Server;
  private config: Required<SocketPoolConfig>;
  
  // Connection tracking
  private userConnections: Map<string, Map<string, AuthenticatedSocket>> = new Map();
  private connectionMetrics: Map<string, ConnectionMetrics> = new Map();
  
  // Redis pub/sub for scaling
  private pubClient: Redis;
  private subClient: Redis;

  constructor(io: Server, config?: SocketPoolConfig) {
    this.io = io;
    this.config = {
      maxConnectionsPerUser: config?.maxConnectionsPerUser || 5,
      connectionTimeout: config?.connectionTimeout || 30000, // 30 seconds
      heartbeatInterval: config?.heartbeatInterval || 25000, // 25 seconds
      heartbeatTimeout: config?.heartbeatTimeout || 60000, // 60 seconds
      reconnectionDelay: config?.reconnectionDelay || 1000,
      maxReconnectionAttempts: config?.maxReconnectionAttempts || 5,
      enableCompression: config?.enableCompression ?? true,
      perMessageDeflate: config?.perMessageDeflate ?? true,
    };

    // Configure Socket.io server options
    this.configureSocketServer();
    
    // Setup Redis adapter for horizontal scaling
    this.setupRedisAdapter();
    
    // Start metrics collection
    this.startMetricsCollection();
  }

  private configureSocketServer() {
    // Update server configuration
    this.io.engine.opts.pingInterval = this.config.heartbeatInterval;
    this.io.engine.opts.pingTimeout = this.config.heartbeatTimeout;
    
    // Enable compression
    if (this.config.enableCompression) {
      this.io.engine.opts.perMessageDeflate = this.config.perMessageDeflate;
    }
  }

  private setupRedisAdapter() {
    // Create Redis clients for pub/sub
    this.pubClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '3'),
    });

    this.subClient = this.pubClient.duplicate();

    // Set up Redis adapter for Socket.io
    this.io.adapter(createAdapter(this.pubClient, this.subClient));

    logger.info('Redis adapter configured for Socket.io scaling');
  }

  public handleConnection(socket: AuthenticatedSocket): boolean {
    const userId = socket.userId!;
    const socketId = socket.id;

    // Check connection limit
    if (!this.canAcceptConnection(userId)) {
      logger.warn(`User ${userId} exceeded max connections limit`);
      socket.emit('error', {
        code: 'MAX_CONNECTIONS_EXCEEDED',
        message: 'Maximum concurrent connections exceeded',
      });
      socket.disconnect(true);
      return false;
    }

    // Add to connection pool
    this.addConnection(userId, socketId, socket);

    // Configure socket settings
    this.configureSocket(socket);

    // Set up connection monitoring
    this.monitorConnection(socket);

    // Update metrics
    this.updateConnectionMetrics(userId, 'connect');

    logger.info(`User ${userId} connected with socket ${socketId}`);
    return true;
  }

  private canAcceptConnection(userId: string): boolean {
    const userSockets = this.userConnections.get(userId);
    if (!userSockets) return true;
    
    // Check if user has reached max connections
    if (userSockets.size >= this.config.maxConnectionsPerUser) {
      // Try to remove stale connections
      this.cleanupStaleConnections(userId);
      return userSockets.size < this.config.maxConnectionsPerUser;
    }
    
    return true;
  }

  private addConnection(userId: string, socketId: string, socket: AuthenticatedSocket) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Map());
    }
    this.userConnections.get(userId)!.set(socketId, socket);
  }

  private configureSocket(socket: AuthenticatedSocket) {
    // Set socket-specific options
    socket.conn.on('packet', (packet: any) => {
      // Track packet metrics
      const metrics = this.getConnectionMetrics(socket.userId!);
      metrics.packetsReceived++;
      metrics.bytesReceived += JSON.stringify(packet).length;
    });

    // Configure timeouts
    socket.timeout(this.config.connectionTimeout);
  }

  private monitorConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    const socketId = socket.id;

    // Monitor connection health
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      } else {
        clearInterval(pingInterval);
      }
    }, this.config.heartbeatInterval);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      clearInterval(pingInterval);
      this.handleDisconnect(userId, socketId, reason);
    });

    // Handle pong response
    socket.on('pong', () => {
      const metrics = this.getConnectionMetrics(userId);
      metrics.lastPing = Date.now();
    });
  }

  private handleDisconnect(userId: string, socketId: string, reason: string) {
    logger.info(`User ${userId} disconnected (${reason})`);
    
    // Remove from connection pool
    const userSockets = this.userConnections.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.userConnections.delete(userId);
      }
    }

    // Update metrics
    this.updateConnectionMetrics(userId, 'disconnect');
  }

  private cleanupStaleConnections(userId: string) {
    const userSockets = this.userConnections.get(userId);
    if (!userSockets) return;

    const now = Date.now();
    const staleThreshold = this.config.heartbeatTimeout * 2;

    userSockets.forEach((socket, socketId) => {
      const metrics = this.getConnectionMetrics(userId);
      if (now - metrics.lastPing > staleThreshold) {
        logger.warn(`Removing stale connection for user ${userId}, socket ${socketId}`);
        socket.disconnect(true);
        userSockets.delete(socketId);
      }
    });
  }

  // Get all active sockets for a user
  public getUserSockets(userId: string): AuthenticatedSocket[] {
    const userSockets = this.userConnections.get(userId);
    return userSockets ? Array.from(userSockets.values()) : [];
  }

  // Broadcast to all user's connections
  public broadcastToUser(userId: string, event: string, data: any) {
    const sockets = this.getUserSockets(userId);
    sockets.forEach(socket => {
      if (socket.connected) {
        socket.emit(event, data);
      }
    });
  }

  // Room management with optimization
  public joinRoom(socket: AuthenticatedSocket, room: string) {
    // Check if already in room
    if (socket.rooms.has(room)) {
      return;
    }

    socket.join(room);
    
    // Update room metrics
    const metrics = this.getConnectionMetrics(socket.userId!);
    metrics.roomsJoined.add(room);
  }

  public leaveRoom(socket: AuthenticatedSocket, room: string) {
    socket.leave(room);
    
    // Update room metrics
    const metrics = this.getConnectionMetrics(socket.userId!);
    metrics.roomsJoined.delete(room);
  }

  // Optimized room broadcasting
  public broadcastToRoom(room: string, event: string, data: any, excludeUserId?: string) {
    if (excludeUserId) {
      // Get all sockets in room except excluded user
      this.io.to(room).except(this.getUserSocketIds(excludeUserId)).emit(event, data);
    } else {
      this.io.to(room).emit(event, data);
    }
  }

  private getUserSocketIds(userId: string): string[] {
    const sockets = this.getUserSockets(userId);
    return sockets.map(s => s.id);
  }

  // Connection metrics
  private getConnectionMetrics(userId: string): ConnectionMetrics {
    if (!this.connectionMetrics.has(userId)) {
      this.connectionMetrics.set(userId, {
        connectTime: Date.now(),
        lastPing: Date.now(),
        packetsReceived: 0,
        packetsSent: 0,
        bytesReceived: 0,
        bytesSent: 0,
        roomsJoined: new Set(),
        reconnections: 0,
      });
    }
    return this.connectionMetrics.get(userId)!;
  }

  private updateConnectionMetrics(userId: string, event: 'connect' | 'disconnect') {
    const metrics = this.getConnectionMetrics(userId);
    
    if (event === 'connect') {
      metrics.reconnections++;
      metrics.connectTime = Date.now();
    } else {
      // Clean up metrics if no more connections
      if (!this.userConnections.has(userId)) {
        this.connectionMetrics.delete(userId);
      }
    }
  }

  // Periodic metrics collection
  private startMetricsCollection() {
    setInterval(() => {
      const stats = {
        totalConnections: this.io.engine.clientsCount,
        uniqueUsers: this.userConnections.size,
        avgConnectionsPerUser: this.userConnections.size > 0 
          ? Array.from(this.userConnections.values()).reduce((sum, sockets) => sum + sockets.size, 0) / this.userConnections.size
          : 0,
        totalRooms: this.io.sockets.adapter.rooms.size,
      };

      logger.debug('Socket.io metrics:', stats);
    }, 60000); // Every minute
  }

  // Get connection stats
  public getConnectionStats() {
    const stats = {
      totalConnections: this.io.engine.clientsCount,
      uniqueUsers: this.userConnections.size,
      connectionsByUser: new Map<string, number>(),
      roomOccupancy: new Map<string, number>(),
    };

    // Count connections per user
    this.userConnections.forEach((sockets, userId) => {
      stats.connectionsByUser.set(userId, sockets.size);
    });

    // Count room occupancy
    this.io.sockets.adapter.rooms.forEach((sockets, room) => {
      // Skip default rooms (socket IDs)
      if (!this.io.sockets.sockets.has(room)) {
        stats.roomOccupancy.set(room, sockets.size);
      }
    });

    return stats;
  }

  // Graceful shutdown
  public async shutdown() {
    logger.info('Shutting down socket manager...');
    
    // Disconnect all sockets
    this.userConnections.forEach((sockets) => {
      sockets.forEach((socket) => {
        socket.disconnect(true);
      });
    });

    // Close Redis connections
    await this.pubClient.quit();
    await this.subClient.quit();

    logger.info('Socket manager shutdown complete');
  }
}

interface ConnectionMetrics {
  connectTime: number;
  lastPing: number;
  packetsReceived: number;
  packetsSent: number;
  bytesReceived: number;
  bytesSent: number;
  roomsJoined: Set<string>;
  reconnections: number;
}