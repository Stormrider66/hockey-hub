import request from 'supertest';
import express from 'express';
import { DataSource } from 'typeorm';
import dashboardRoutes from '../../routes/dashboardRoutes';
import { CachedCommunicationService } from '../../services/CachedCommunicationService';
import { authenticate } from '@hockey-hub/shared-lib';

// Mock dependencies
jest.mock('@hockey-hub/shared-lib');
jest.mock('../../services/CachedCommunicationService');
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('Communication Dashboard Routes', () => {
  let app: express.Application;
  let mockCommunicationService: jest.Mocked<CachedCommunicationService>;

  const mockCommunicationSummary = {
    conversations: {
      total: 5,
      unreadCount: 2,
      recentConversations: [
        {
          id: 'conv-1',
          name: 'Team Chat',
          lastMessage: {
            content: 'Great practice today!',
            senderId: 'user-456',
            createdAt: new Date('2025-06-29T10:00:00Z'),
          },
          unreadCount: 1,
        },
      ],
    },
    messages: {
      totalUnread: 3,
      mentions: 1,
      recentMessages: [
        {
          id: 'msg-1',
          content: 'Don\'t forget about tomorrow\'s game',
          senderId: 'coach-123',
          conversationId: 'conv-1',
          createdAt: new Date('2025-06-29T09:00:00Z'),
        },
      ],
    },
    notifications: {
      total: 8,
      unread: 4,
      byType: {
        system: 2,
        event_reminder: 3,
        training_update: 2,
        medical_alert: 1,
      },
      recent: [
        {
          id: 'notif-1',
          type: 'event_reminder',
          title: 'Game Tomorrow',
          message: 'Game vs Rivals at 7 PM',
          createdAt: new Date('2025-06-29T08:00:00Z'),
          read: false,
        },
      ],
    },
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock auth middleware
    (authenticate as jest.Mock).mockImplementation((req: any, _res: any, next: any) => {
      req.user = { id: 'user-123', role: 'PLAYER' };
      next();
    });

    // Setup mock service
    mockCommunicationService = {
      getUserCommunicationSummary: jest.fn(),
      getTeamCommunicationSummary: jest.fn(),
      getOrganizationCommunicationSummary: jest.fn(),
    } as any;

    CachedCommunicationService.mockImplementation(() => mockCommunicationService);

    // Mount routes
    app.use('/api/dashboard', dashboardRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard/communication', () => {
    it('should return user communication summary', async () => {
      mockCommunicationService.getUserCommunicationSummary.mockResolvedValue(mockCommunicationSummary);

      const response = await request(app)
        .get('/api/dashboard/communication')
        .expect(200);

      expect(response.body).toEqual(mockCommunicationSummary);
      expect(mockCommunicationService.getUserCommunicationSummary).toHaveBeenCalledWith('user-123');
    });

    it('should return 401 if user is not authenticated', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req: any, _res: any, next: any) => {
        req.user = null;
        next();
      });

      await request(app)
        .get('/api/dashboard/communication')
        .expect(401);
    });

    it('should handle service errors', async () => {
      mockCommunicationService.getUserCommunicationSummary.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/dashboard/communication')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should set appropriate cache headers', async () => {
      mockCommunicationService.getUserCommunicationSummary.mockResolvedValue(mockCommunicationSummary);

      const response = await request(app)
        .get('/api/dashboard/communication')
        .expect(200);

      expect(response.headers['cache-control']).toBe('private, max-age=60');
    });
  });

  describe('GET /api/dashboard/communication/team/:teamId', () => {
    it('should return team communication summary for COACH role', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req: any, _res: any, next: any) => {
        req.user = { id: 'user-123', role: 'COACH' };
        next();
      });

      const teamSummary = {
        ...mockCommunicationSummary,
        teamAnnouncements: [
          {
            id: 'announce-1',
            title: 'Practice Schedule Change',
            content: 'Practice moved to 5 PM',
            createdAt: new Date('2025-06-29T07:00:00Z'),
          },
        ],
      };

      mockCommunicationService.getTeamCommunicationSummary.mockResolvedValue(teamSummary);

      const response = await request(app)
        .get('/api/dashboard/communication/team/team-123')
        .expect(200);

      expect(response.body).toEqual(teamSummary);
      expect(mockCommunicationService.getTeamCommunicationSummary).toHaveBeenCalledWith('team-123');
    });

    it('should return 403 for non-coach users', async () => {
      await request(app)
        .get('/api/dashboard/communication/team/team-123')
        .expect(403);
    });
  });

  describe('GET /api/dashboard/communication/organization/:organizationId', () => {
    it('should return organization summary for ADMIN role', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req: any, _res: any, next: any) => {
        req.user = { id: 'user-123', role: 'ADMIN' };
        next();
      });

      const orgSummary = {
        totalConversations: 50,
        activeUsers: 200,
        messageVolume: {
          today: 500,
          week: 3500,
          month: 15000,
        },
        topChannels: [
          { id: 'chan-1', name: 'General', messageCount: 1000 },
          { id: 'chan-2', name: 'Coaches', messageCount: 800 },
        ],
      };

      mockCommunicationService.getOrganizationCommunicationSummary.mockResolvedValue(orgSummary);

      const response = await request(app)
        .get('/api/dashboard/communication/organization/org-123')
        .expect(200);

      expect(response.body).toEqual(orgSummary);
      expect(mockCommunicationService.getOrganizationCommunicationSummary).toHaveBeenCalledWith('org-123');
    });

    it('should allow CLUB_ADMIN role', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req: any, _res: any, next: any) => {
        req.user = { id: 'user-123', role: 'CLUB_ADMIN' };
        next();
      });

      mockCommunicationService.getOrganizationCommunicationSummary.mockResolvedValue({});

      await request(app)
        .get('/api/dashboard/communication/organization/org-123')
        .expect(200);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .get('/api/dashboard/communication/organization/org-123')
        .expect(403);
    });

    it('should have longer cache duration for org-wide data', async () => {
      (authenticate as jest.Mock).mockImplementationOnce((req: any, _res: any, next: any) => {
        req.user = { id: 'user-123', role: 'ADMIN' };
        next();
      });

      mockCommunicationService.getOrganizationCommunicationSummary.mockResolvedValue({});

      const response = await request(app)
        .get('/api/dashboard/communication/organization/org-123')
        .expect(200);

      expect(response.headers['cache-control']).toBe('private, max-age=300');
    });
  });
});