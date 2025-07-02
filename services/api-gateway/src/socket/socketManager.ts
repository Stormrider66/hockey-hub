import { Server, Socket } from 'socket.io';
import { AuthenticatedSocket } from '../types/socket';
import { registerTrainingHandlers } from './handlers/trainingHandler';
import { registerCalendarHandlers } from './handlers/calendarHandler';
import { registerDashboardHandlers } from './handlers/dashboardHandler';
import { registerCollaborationHandlers } from './handlers/collaborationHandler';
import { registerActivityHandlers } from './handlers/activityHandler';
import { SocketEventType, SocketData } from '@hockey-hub/shared-lib';
import { logger } from '@hockey-hub/shared-lib';

// Enhanced room management
export class SocketManager {
  private io: Server;
  private socketRooms = new Map<string, Set<string>>(); // roomId -> Set of socketIds
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private socketData = new Map<string, SocketData>(); // socketId -> SocketData

  constructor(io: Server) {
    this.io = io;
    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      // Store socket data
      if (socket.userId) {
        const data: SocketData = {
          userId: socket.userId,
          organizationId: socket.organizationId || '',
          teamIds: socket.teamIds || [],
          roles: socket.roles || [],
          permissions: socket.permissions || [],
          sessionId: socket.id
        };
        this.socketData.set(socket.id, data);
      }

      // Join user to rooms
      this.joinUserToRooms(socket);

      // Send connection success
      socket.emit(SocketEventType.CONNECTION_SUCCESS, {
        userId: socket.userId,
        sessionId: socket.id
      });

      // Register all handlers
      registerTrainingHandlers(socket);
      registerCalendarHandlers(socket, this.io);
      registerDashboardHandlers(socket, this.io);
      registerCollaborationHandlers(socket, this.io);
      registerActivityHandlers(socket, this.io);

      // Handle system events
      this.registerSystemHandlers(socket);

      // Handle room management
      this.registerRoomHandlers(socket);

      // Set user as online
      if (socket.userId && socket.organizationId) {
        this.broadcastUserPresence(socket.userId, socket.organizationId, 'online');
      }

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        this.handleDisconnect(socket, reason);
      });

      logger.info('Socket connected with enhanced features', {
        socketId: socket.id,
        userId: socket.userId,
        features: ['training', 'calendar', 'dashboard', 'collaboration', 'activity']
      });
    });
  }

  private joinUserToRooms(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    // Join user-specific room
    const userRoom = `user:${socket.userId}`;
    socket.join(userRoom);

    // Join organization room
    if (socket.organizationId) {
      const orgRoom = `org:${socket.organizationId}`;
      socket.join(orgRoom);
      this.trackRoomMembership(orgRoom, socket.id);
    }

    // Join team rooms
    if (socket.teamIds && socket.teamIds.length > 0) {
      socket.teamIds.forEach(teamId => {
        const teamRoom = `team:${teamId}`;
        socket.join(teamRoom);
        this.trackRoomMembership(teamRoom, socket.id);
      });
    }

    // Join role-based rooms
    if (socket.roles && socket.roles.length > 0 && socket.organizationId) {
      socket.roles.forEach(role => {
        const roleRoom = `org:${socket.organizationId}:role:${role}`;
        socket.join(roleRoom);
        this.trackRoomMembership(roleRoom, socket.id);
      });
    }

    // Track user sockets
    if (!this.userSockets.has(socket.userId)) {
      this.userSockets.set(socket.userId, new Set());
    }
    this.userSockets.get(socket.userId)!.add(socket.id);
  }

  private registerSystemHandlers(socket: AuthenticatedSocket) {
    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Subscribe to channels
    socket.on('subscribe', (channel: string) => {
      if (this.canJoinChannel(socket, channel)) {
        socket.join(channel);
        logger.info('Socket subscribed to channel', {
          socketId: socket.id,
          userId: socket.userId,
          channel
        });
      } else {
        socket.emit(SocketEventType.CONNECTION_ERROR, {
          message: 'Cannot join channel',
          code: 'CHANNEL_ACCESS_DENIED'
        });
      }
    });

    // Unsubscribe from channels
    socket.on('unsubscribe', (channel: string) => {
      socket.leave(channel);
      logger.info('Socket unsubscribed from channel', {
        socketId: socket.id,
        userId: socket.userId,
        channel
      });
    });
  }

  private registerRoomHandlers(socket: AuthenticatedSocket) {
    // Generic room join
    socket.on(SocketEventType.ROOM_JOIN, (data: { roomType: string; roomId: string; metadata?: any }) => {
      const room = `${data.roomType}:${data.roomId}`;
      
      if (this.canJoinRoom(socket, data.roomType, data.roomId)) {
        socket.join(room);
        this.trackRoomMembership(room, socket.id);

        // Notify others in room
        socket.to(room).emit(SocketEventType.ROOM_USERS_UPDATE, {
          roomId: room,
          users: this.getRoomUsers(room)
        });

        logger.info('Socket joined room', {
          socketId: socket.id,
          userId: socket.userId,
          room,
          metadata: data.metadata
        });
      } else {
        socket.emit(SocketEventType.CONNECTION_ERROR, {
          message: 'Cannot join room',
          code: 'ROOM_ACCESS_DENIED'
        });
      }
    });

    // Generic room leave
    socket.on(SocketEventType.ROOM_LEAVE, (data: { roomType: string; roomId: string }) => {
      const room = `${data.roomType}:${data.roomId}`;
      socket.leave(room);
      this.untrackRoomMembership(room, socket.id);

      // Notify others in room
      socket.to(room).emit(SocketEventType.ROOM_USERS_UPDATE, {
        roomId: room,
        users: this.getRoomUsers(room)
      });

      logger.info('Socket left room', {
        socketId: socket.id,
        userId: socket.userId,
        room
      });
    });
  }

  private handleDisconnect(socket: AuthenticatedSocket, reason: string) {
    logger.info('Socket disconnected', {
      socketId: socket.id,
      userId: socket.userId,
      reason
    });

    // Clean up socket data
    this.socketData.delete(socket.id);

    // Remove from room tracking
    this.socketRooms.forEach((sockets, roomId) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        this.socketRooms.delete(roomId);
      }
    });

    // Handle user offline status
    if (socket.userId && this.userSockets.has(socket.userId)) {
      const userSocketSet = this.userSockets.get(socket.userId)!;
      userSocketSet.delete(socket.id);
      
      if (userSocketSet.size === 0) {
        // User has no more active connections
        this.userSockets.delete(socket.userId);
        if (socket.organizationId) {
          this.broadcastUserPresence(socket.userId, socket.organizationId, 'offline');
        }
      }
    }
  }

  private trackRoomMembership(roomId: string, socketId: string) {
    if (!this.socketRooms.has(roomId)) {
      this.socketRooms.set(roomId, new Set());
    }
    this.socketRooms.get(roomId)!.add(socketId);
  }

  private untrackRoomMembership(roomId: string, socketId: string) {
    if (this.socketRooms.has(roomId)) {
      this.socketRooms.get(roomId)!.delete(socketId);
      if (this.socketRooms.get(roomId)!.size === 0) {
        this.socketRooms.delete(roomId);
      }
    }
  }

  private canJoinChannel(socket: AuthenticatedSocket, channel: string): boolean {
    // Implement channel access control logic
    if (!socket.userId) return false;
    
    // Allow user's own channels
    if (channel.startsWith(`user:${socket.userId}`)) return true;
    
    // Allow organization channels
    if (socket.organizationId && channel.startsWith(`org:${socket.organizationId}`)) return true;
    
    // Allow team channels
    if (socket.teamIds && socket.teamIds.some(teamId => channel.startsWith(`team:${teamId}`))) return true;
    
    return false;
  }

  private canJoinRoom(socket: AuthenticatedSocket, roomType: string, roomId: string): boolean {
    // Implement room access control logic
    if (!socket.userId) return false;
    
    switch (roomType) {
      case 'training':
      case 'calendar':
      case 'dashboard':
        return true; // Additional checks would be done in handlers
        
      case 'document':
        // Check document permissions
        return socket.roles?.some(role => 
          ['coach', 'admin', 'club_admin', 'medical_staff', 'physical_trainer'].includes(role)
        ) || false;
        
      case 'conversation':
        return true; // Conversation access would be verified against database
        
      default:
        return false;
    }
  }

  private getRoomUsers(roomId: string): any[] {
    const roomSockets = this.socketRooms.get(roomId);
    if (!roomSockets) return [];

    const users: any[] = [];
    roomSockets.forEach(socketId => {
      const socketData = this.socketData.get(socketId);
      if (socketData) {
        const socket = this.io.sockets.sockets.get(socketId) as AuthenticatedSocket;
        if (socket) {
          users.push({
            id: socketData.userId,
            name: socket.userEmail || 'Unknown',
            avatar: null, // Would come from database
            status: 'active'
          });
        }
      }
    });

    return users;
  }

  private broadcastUserPresence(userId: string, organizationId: string, status: string) {
    this.io.to(`org:${organizationId}`).emit('user:presence', {
      userId,
      status,
      timestamp: new Date()
    });
  }

  // Public methods for external use
  public broadcastToOrganization(organizationId: string, event: string, data: any) {
    this.io.to(`org:${organizationId}`).emit(event, data);
  }

  public broadcastToTeam(teamId: string, event: string, data: any) {
    this.io.to(`team:${teamId}`).emit(event, data);
  }

  public broadcastToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public broadcastToRole(organizationId: string, role: string, event: string, data: any) {
    this.io.to(`org:${organizationId}:role:${role}`).emit(event, data);
  }

  public getSocketStats() {
    return {
      connectedClients: this.io.engine.clientsCount,
      activeRooms: this.socketRooms.size,
      activeUsers: this.userSockets.size,
      roomDetails: Array.from(this.socketRooms.entries()).map(([room, sockets]) => ({
        room,
        userCount: sockets.size
      }))
    };
  }
}