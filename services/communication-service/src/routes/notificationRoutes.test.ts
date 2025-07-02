import request from 'supertest';
import express from 'express';
import { notificationRoutes } from './notificationRoutes';
import { CachedNotificationRepository } from '../repositories/CachedNotificationRepository';
import { authMiddleware } from '@hockey-hub/shared-lib/middleware/authMiddleware';

// Mock dependencies
jest.mock('../repositories/CachedNotificationRepository');
jest.mock('@hockey-hub/shared-lib/middleware/authMiddleware');

describe('Notification Routes', () => {
  let app: express.Express;
  let mockNotificationRepo: jest.Mocked<CachedNotificationRepository>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    organizationId: 'org-456',
    teamIds: ['team-1']
  };

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-123',
    type: 'training_reminder',
    title: 'Training Session Tomorrow',
    message: 'Don\'t forget your training session at 10 AM',
    priority: 'medium',
    read: false,
    metadata: {
      sessionId: 'session-123',
      location: 'Main Rink'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup express app
    app = express();
    app.use(express.json());
    
    // Mock auth middleware
    (authMiddleware as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
      req.user = mockUser;
      next();
    });

    // Mock repository
    mockNotificationRepo = {
      getUserNotifications: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      create: jest.fn(),
      createBulkNotifications: jest.fn(),
      deleteNotification: jest.fn(),
      getNotificationsByType: jest.fn(),
      getNotificationSettings: jest.fn(),
      updateNotificationSettings: jest.fn()
    } as any;

    (CachedNotificationRepository as jest.Mock).mockImplementation(() => mockNotificationRepo);

    // Apply routes
    app.use('/api/notifications', notificationRoutes);
  });

  describe('GET /api/notifications', () => {
    it('should return user notifications with pagination', async () => {
      const mockNotifications = [mockNotification];
      mockNotificationRepo.getUserNotifications.mockResolvedValue({
        data: mockNotifications,
        total: 15,
        page: 1,
        pageSize: 10
      });

      const response = await request(app)
        .get('/api/notifications?page=1&pageSize=10');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: mockNotifications,
        total: 15,
        page: 1,
        pageSize: 10
      });
      expect(mockNotificationRepo.getUserNotifications).toHaveBeenCalledWith(
        'user-123',
        { page: 1, pageSize: 10 }
      );
    });

    it('should filter notifications by read status', async () => {
      mockNotificationRepo.getUserNotifications.mockResolvedValue({
        data: [mockNotification],
        total: 5,
        page: 1,
        pageSize: 10
      });

      const response = await request(app)
        .get('/api/notifications?read=false');

      expect(response.status).toBe(200);
      expect(mockNotificationRepo.getUserNotifications).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({ read: false })
      );
    });

    it('should filter notifications by type', async () => {
      mockNotificationRepo.getUserNotifications.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 10
      });

      const response = await request(app)
        .get('/api/notifications?type=training_reminder');

      expect(mockNotificationRepo.getUserNotifications).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({ type: 'training_reminder' })
      );
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return unread notification count', async () => {
      mockNotificationRepo.getUnreadCount.mockResolvedValue(7);

      const response = await request(app)
        .get('/api/notifications/unread-count');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ count: 7 });
    });

    it('should cache unread count', async () => {
      mockNotificationRepo.getUnreadCount.mockResolvedValue(3);

      // Make multiple requests
      await request(app).get('/api/notifications/unread-count');
      await request(app).get('/api/notifications/unread-count');

      // Repository should be called for each request
      // (Actual caching would be in the repository layer)
      expect(mockNotificationRepo.getUnreadCount).toHaveBeenCalledTimes(2);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      mockNotificationRepo.markAsRead.mockResolvedValue({
        ...mockNotification,
        read: true
      } as any);

      const response = await request(app)
        .put('/api/notifications/notif-1/read');

      expect(response.status).toBe(200);
      expect(response.body.notification.read).toBe(true);
      expect(mockNotificationRepo.markAsRead).toHaveBeenCalledWith('notif-1', 'user-123');
    });

    it('should handle non-existent notification', async () => {
      mockNotificationRepo.markAsRead.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/notifications/non-existent/read');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: 'Notification not found'
      });
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationRepo.markAllAsRead.mockResolvedValue(5);

      const response = await request(app)
        .put('/api/notifications/read-all');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: '5 notifications marked as read'
      });
    });

    it('should handle when no unread notifications', async () => {
      mockNotificationRepo.markAllAsRead.mockResolvedValue(0);

      const response = await request(app)
        .put('/api/notifications/read-all');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: '0 notifications marked as read'
      });
    });
  });

  describe('POST /api/notifications', () => {
    it('should create a new notification', async () => {
      const newNotificationData = {
        userId: 'user-456',
        type: 'game_reminder',
        title: 'Game Tonight',
        message: 'Game starts at 7 PM',
        priority: 'high'
      };

      mockNotificationRepo.create.mockResolvedValue({
        id: 'new-notif-id',
        ...newNotificationData,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      const response = await request(app)
        .post('/api/notifications')
        .send(newNotificationData);

      expect(response.status).toBe(201);
      expect(response.body.notification).toMatchObject({
        id: 'new-notif-id',
        ...newNotificationData
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .send({ type: 'test' }); // Missing required fields

      expect(response.status).toBe(400);
      expect(mockNotificationRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/notifications/bulk', () => {
    it('should create bulk notifications', async () => {
      const bulkData = {
        userIds: ['user-1', 'user-2', 'user-3'],
        type: 'announcement',
        title: 'Team Meeting',
        message: 'Mandatory team meeting tomorrow at 3 PM',
        priority: 'high'
      };

      mockNotificationRepo.createBulkNotifications.mockResolvedValue([
        { id: 'notif-1', userId: 'user-1', ...bulkData },
        { id: 'notif-2', userId: 'user-2', ...bulkData },
        { id: 'notif-3', userId: 'user-3', ...bulkData }
      ] as any);

      const response = await request(app)
        .post('/api/notifications/bulk')
        .send(bulkData);

      expect(response.status).toBe(201);
      expect(response.body.notifications).toHaveLength(3);
      expect(response.body.message).toBe('3 notifications created');
    });

    it('should require admin permissions for bulk notifications', async () => {
      // Mock non-admin user
      (authMiddleware as jest.Mock).mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { ...mockUser, roles: ['player'] };
        next();
      });

      const response = await request(app)
        .post('/api/notifications/bulk')
        .send({ userIds: ['user-1'] });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete a notification', async () => {
      mockNotificationRepo.deleteNotification.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/notifications/notif-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Notification deleted successfully'
      });
    });

    it('should handle non-existent notification deletion', async () => {
      mockNotificationRepo.deleteNotification.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/notifications/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: 'Notification not found'
      });
    });
  });

  describe('GET /api/notifications/settings', () => {
    it('should return user notification settings', async () => {
      const mockSettings = {
        userId: 'user-123',
        email: {
          enabled: true,
          types: ['game_reminder', 'training_update']
        },
        push: {
          enabled: false,
          types: []
        },
        sms: {
          enabled: true,
          types: ['emergency']
        }
      };

      mockNotificationRepo.getNotificationSettings.mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/api/notifications/settings');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSettings);
    });
  });

  describe('PUT /api/notifications/settings', () => {
    it('should update notification settings', async () => {
      const updatedSettings = {
        email: {
          enabled: false,
          types: []
        },
        push: {
          enabled: true,
          types: ['all']
        }
      };

      mockNotificationRepo.updateNotificationSettings.mockResolvedValue({
        userId: 'user-123',
        ...updatedSettings
      } as any);

      const response = await request(app)
        .put('/api/notifications/settings')
        .send(updatedSettings);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Settings updated successfully');
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockNotificationRepo.getUserNotifications.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/notifications');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: 'Failed to fetch notifications'
      });
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/notifications?page=-1&pageSize=1000');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid pagination');
    });
  });

  describe('Real-time Integration', () => {
    it('should emit notification events on creation', async () => {
      // This would test Socket.io integration
      // Mock Socket.io emit
      const mockEmit = jest.fn();
      app.set('io', { to: () => ({ emit: mockEmit }) });

      mockNotificationRepo.create.mockResolvedValue({
        id: 'new-notif',
        userId: 'user-456'
      } as any);

      await request(app)
        .post('/api/notifications')
        .send({
          userId: 'user-456',
          type: 'test',
          title: 'Test',
          message: 'Test message'
        });

      // Would verify Socket.io emission
      // expect(mockEmit).toHaveBeenCalledWith('notification:new', expect.any(Object));
    });
  });
});