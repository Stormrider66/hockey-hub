import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticate, requireRole, requireAnyRole } from './middleware/authMiddleware';
import { generalLimiter, authLimiter, passwordResetLimiter } from './middleware/rateLimiter';
import { requestLogger, errorLogger } from './middleware/requestLogger';
import { securityMiddleware } from './middleware/securityMiddleware';
import { sanitize } from '@hockey-hub/shared-lib/dist/middleware/sanitizationMiddleware';
import { errorHandler, notFoundHandler, createLoggingMiddleware, errorLoggingMiddleware, logger } from '@hockey-hub/shared-lib';
import { SocketManager } from './socket/socketManager';
import { AuthenticatedSocket } from './types/socket';
import healthRoutes from './routes/healthRoutes';
import swaggerRoutes from './routes/swaggerRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.io server setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:3002', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST']
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Socket.io authentication middleware

io.use(async (socket: AuthenticatedSocket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return next(new Error('Server configuration error'));
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Attach user info to socket
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    socket.roles = decoded.roles || [];
    socket.permissions = decoded.permissions || [];
    socket.organizationId = decoded.organizationId;
    socket.teamIds = decoded.teamIds || [];

    logger.info('Socket authenticated', {
      socketId: socket.id,
      userId: socket.userId,
      email: socket.userEmail,
      roles: socket.roles
    });

    next();
  } catch (error) {
    logger.error('Socket authentication failed', {
      socketId: socket.id,
      error: error.message
    });
    next(new Error('Invalid authentication token'));
  }
});

// Initialize Socket Manager
const socketManager = new SocketManager(io);

// Security middleware - must come first
app.use(securityMiddleware);

// Body parsing and sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitize({
  stripHtml: true,
  trimStrings: true,
  removeNullBytes: true,
  maxStringLength: 10000
}));

// Logging middleware
app.use(createLoggingMiddleware({
  serviceName: 'api-gateway',
  logBody: process.env.NODE_ENV !== 'production',
  logHeaders: process.env.NODE_ENV !== 'production'
}));

// Request logging (legacy - can be removed later)
app.use(requestLogger);

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Health and monitoring routes
app.use('/', healthRoutes);

// API Documentation routes (public access)
app.use('/api-docs', swaggerRoutes);

// Public routes that don't require authentication
const publicRoutes = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/health',
  '/health/detailed',
  '/ready',
  '/live',
  '/metrics',
  '/.well-known/jwks.json',
  '/api-docs'
];

// Routes that require specific roles
const roleProtectedRoutes: Record<string, string[]> = {
  '/api/v1/admin': ['admin', 'club_admin'],
  '/api/v1/medical': ['medical_staff', 'admin', 'club_admin'],
  '/api/v1/planning': ['coach', 'admin', 'club_admin'],
  '/api/v1/payments': ['parent', 'admin', 'club_admin'],
  '/api/v1/stats': ['coach', 'player', 'parent', 'admin', 'club_admin'],
};

// Service routing configuration
const isDocker = process.env.DOCKER_ENV === 'true';
const services = {
  '/api/v1/users': process.env.USER_SERVICE_URL || (isDocker ? 'http://user-service:3001' : 'http://localhost:3001'),
  '/api/v1/auth': process.env.USER_SERVICE_URL || (isDocker ? 'http://user-service:3001' : 'http://localhost:3001'),
  '/api/v1/players': process.env.USER_SERVICE_URL || (isDocker ? 'http://user-service:3001' : 'http://localhost:3001'),  // Player endpoints go to user service
  '/api/v1/messages': process.env.COMMUNICATION_SERVICE_URL || (isDocker ? 'http://communication-service:3002' : 'http://localhost:3002'),
  '/api/v1/notifications': process.env.COMMUNICATION_SERVICE_URL || (isDocker ? 'http://communication-service:3002' : 'http://localhost:3002'),
  '/api/v1/announcements': process.env.COMMUNICATION_SERVICE_URL || (isDocker ? 'http://communication-service:3002' : 'http://localhost:3002'),
  '/api/v1/events': process.env.CALENDAR_SERVICE_URL || (isDocker ? 'http://calendar-service:3003' : 'http://localhost:3003'),
  '/api/v1/calendar': process.env.CALENDAR_SERVICE_URL || (isDocker ? 'http://calendar-service:3003' : 'http://localhost:3003'),
  '/api/v1/training': process.env.TRAINING_SERVICE_URL || (isDocker ? 'http://training-service:3004' : 'http://localhost:3004'),
  '/api/v1/medical': process.env.MEDICAL_SERVICE_URL || (isDocker ? 'http://medical-service:3005' : 'http://localhost:3005'),
  '/api/v1/planning': process.env.PLANNING_SERVICE_URL || (isDocker ? 'http://planning-service:3006' : 'http://localhost:3006'),
  '/api/v1/stats': process.env.STATISTICS_SERVICE_URL || (isDocker ? 'http://statistics-service:3007' : 'http://localhost:3007'),
  '/api/v1/payments': process.env.PAYMENT_SERVICE_URL || (isDocker ? 'http://payment-service:3008' : 'http://localhost:3008'),
  '/api/v1/admin': process.env.ADMIN_SERVICE_URL || (isDocker ? 'http://admin-service:3009' : 'http://localhost:3009'),
};

// Set up proxy routes with authentication
Object.entries(services).forEach(([path, target]) => {
  // Create proxy middleware
  const proxyMiddleware = createProxyMiddleware({
    target,
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    onError: (err, req, res) => {
      console.error(`Proxy error for ${path}:`, err.message);
      res.status(502).json({ 
        error: 'Service temporarily unavailable',
        service: path,
        details: err.message
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Log the proxied request for debugging
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${target}`);
      
      // Forward user information to downstream services
      if ((req as any).user) {
        proxyReq.setHeader('X-User-Id', (req as any).user.userId);
        proxyReq.setHeader('X-User-Email', (req as any).user.email);
        proxyReq.setHeader('X-User-Roles', JSON.stringify((req as any).user.roles));
        proxyReq.setHeader('X-User-Permissions', JSON.stringify((req as any).user.permissions));
        if ((req as any).user.organizationId) {
          proxyReq.setHeader('X-Organization-Id', (req as any).user.organizationId);
        }
        if ((req as any).user.teamIds && (req as any).user.teamIds.length > 0) {
          proxyReq.setHeader('X-Team-Ids', JSON.stringify((req as any).user.teamIds));
        }
      }
    }
  });

  // Apply authentication middleware based on route
  app.use(path, (req, res, next) => {
    // Apply specific rate limiters for auth endpoints
    if (req.originalUrl.startsWith('/api/v1/auth/login') || 
        req.originalUrl.startsWith('/api/v1/auth/register')) {
      return authLimiter(req, res, () => next());
    }
    
    if (req.originalUrl.startsWith('/api/v1/auth/forgot-password') || 
        req.originalUrl.startsWith('/api/v1/auth/reset-password')) {
      return passwordResetLimiter(req, res, () => next());
    }

    // Check if this is a public route
    const isPublicRoute = publicRoutes.some(publicRoute => 
      req.originalUrl.startsWith(publicRoute)
    );

    if (isPublicRoute) {
      // Skip authentication for public routes
      return proxyMiddleware(req, res, next);
    }

    // Check if route requires specific roles
    const requiredRoles = Object.entries(roleProtectedRoutes).find(([protectedPath]) => 
      req.originalUrl.startsWith(protectedPath)
    )?.[1];

    if (requiredRoles) {
      // Apply authentication and role check
      authenticate(req, res, (err?: any) => {
        if (err) return next(err);
        requireAnyRole(requiredRoles)(req, res, (err?: any) => {
          if (err) return next(err);
          proxyMiddleware(req, res, next);
        });
      });
    } else {
      // Apply authentication only
      authenticate(req, res, (err?: any) => {
        if (err) return next(err);
        proxyMiddleware(req, res, next);
      });
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware - must be last
app.use(errorLoggingMiddleware('api-gateway'));
app.use(errorLogger);
app.use(errorHandler);

// Legacy event handlers for backward compatibility
io.on('connection', (socket: AuthenticatedSocket) => {
  // Handle notification events (legacy)
  socket.on('notification:read', (notificationId: string) => {
    logger.info('Notification marked as read', {
      socketId: socket.id,
      userId: socket.userId,
      notificationId
    });
    
    // Broadcast to user's other devices
    socket.broadcast.to(`user:${socket.userId}`).emit('notification:read', {
      notificationId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle typing events (legacy)
  socket.on('typing:start', (data: { conversationId: string }) => {
    socket.broadcast.to(`conversation:${data.conversationId}`).emit('user:typing', {
      userId: socket.userId,
      userEmail: socket.userEmail,
      conversationId: data.conversationId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('typing:stop', (data: { conversationId: string }) => {
    socket.broadcast.to(`conversation:${data.conversationId}`).emit('user:typing:stop', {
      userId: socket.userId,
      conversationId: data.conversationId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle presence updates (legacy)
  socket.on('presence:update', (status: 'online' | 'away' | 'busy' | 'offline') => {
    if (socket.organizationId) {
      socket.broadcast.to(`org:${socket.organizationId}`).emit('user:presence', {
        userId: socket.userId,
        status,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle room joining for conversations (legacy)
  socket.on('conversation:join', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
    logger.info('User joined conversation', {
      socketId: socket.id,
      userId: socket.userId,
      conversationId
    });
  });

  socket.on('conversation:leave', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
    logger.info('User left conversation', {
      socketId: socket.id,
      userId: socket.userId,
      conversationId
    });
  });
});

// Utility functions for broadcasting to specific groups
export const broadcastToOrganization = (organizationId: string, event: string, data: any) => {
  socketManager.broadcastToOrganization(organizationId, event, data);
};

export const broadcastToTeam = (teamId: string, event: string, data: any) => {
  socketManager.broadcastToTeam(teamId, event, data);
};

export const broadcastToUser = (userId: string, event: string, data: any) => {
  socketManager.broadcastToUser(userId, event, data);
};

export const broadcastToRole = (organizationId: string, role: string, event: string, data: any) => {
  socketManager.broadcastToRole(organizationId, role, event, data);
};

// Health check endpoint with Socket.io status
app.get('/health', (req, res) => {
  const socketStats = socketManager.getSocketStats();

  res.json({ 
    status: 'ok', 
    service: 'api-gateway', 
    port: PORT,
    websocket: {
      connected: socketStats.connectedClients,
      rooms: socketStats.activeRooms,
      users: socketStats.activeUsers,
      features: ['training', 'calendar', 'dashboard', 'collaboration', 'activity']
    }
  });
});

// Start server with Socket.io support
httpServer.listen(PORT, () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`);
  logger.info(`🔌 Enhanced WebSocket server ready`);
  logger.info('📡 Proxying to services:');
  Object.entries(services).forEach(([path, target]) => {
    logger.info(`   ${path} -> ${target}`);
  });
  
  logger.info('🏠 Socket.io rooms configured:');
  logger.info('   - User rooms: user:{userId}');
  logger.info('   - Organization rooms: org:{organizationId}');
  logger.info('   - Team rooms: team:{teamId}');
  logger.info('   - Role rooms: org:{organizationId}:role:{role}');
  logger.info('   - Training rooms: training:{sessionId}');
  logger.info('   - Calendar rooms: calendar:*');
  logger.info('   - Dashboard rooms: dashboard:{userId}:{type}');
  logger.info('   - Document rooms: doc:{documentId}');
  logger.info('   - Activity rooms: activity:*');
  
  logger.info('✨ Real-time features enabled:');
  logger.info('   - Live training session updates');
  logger.info('   - Real-time calendar synchronization');
  logger.info('   - Dashboard widget auto-refresh');
  logger.info('   - Collaborative document editing');
  logger.info('   - Activity feed streaming');
});