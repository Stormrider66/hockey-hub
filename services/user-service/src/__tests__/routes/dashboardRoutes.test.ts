import request from 'supertest';
import express from 'express';
import { DataSource } from 'typeorm';
import dashboardRoutes from '../../routes/dashboardRoutes';
import { CachedUserRepository } from '../../repositories/CachedUserRepository';
import { extractUser } from '../../middleware/authMiddleware';
jest.mock('../../middleware/authMiddleware', () => ({
  extractUser: jest.fn((req: any, _res: any, next: any) => { req.user = { id: 'user-123', role: 'PLAYER' }; next(); })
}));
import { User } from '../../entities/User';
import { Organization } from '../../entities/Organization';
import { Team } from '../../entities/Team';
import { Role } from '../../entities/Role';

// Mock dependencies
jest.mock('@hockey-hub/shared-lib');
jest.mock('../../repositories/CachedUserRepository');
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('Dashboard Routes', () => {
  let app: express.Application;
  let mockCachedUserRepository: jest.Mocked<CachedUserRepository>;
  
  const mockUser = {
    id: 'user-123',
    email: 'test@hockeyhub.com',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://example.com/avatar.jpg',
    phoneNumber: '+1234567890',
    preferences: { emailNotifications: true },
    lastLogin: new Date('2025-06-29'),
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-29'),
    role: {
      id: 'role-123',
      name: 'PLAYER',
      permissions: [
        { id: 'perm-1', name: 'view_dashboard' },
        { id: 'perm-2', name: 'submit_wellness' },
      ],
    } as Role,
    organization: {
      id: 'org-123',
      name: 'Hockey Hub Elite',
      subdomain: 'elite',
      primaryColor: '#FF0000',
      secondaryColor: '#0000FF',
      logo: 'https://example.com/logo.png',
      settings: {},
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active',
      subscriptionValidUntil: new Date('2026-01-01'),
    } as Organization,
    teams: [
      {
        id: 'team-123',
        name: 'Elite Team A',
        type: 'competitive',
        ageGroup: 'U18',
        season: '2025',
        logo: 'https://example.com/team-logo.png',
        isActive: true,
      } as Team,
    ],
  } as User;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock auth middleware to add user to request
    (extractUser as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
      req.user = { id: 'user-123', role: 'PLAYER' };
      next();
    });
    
    // Setup mock repository
    mockCachedUserRepository = {
      findById: jest.fn(),
      getUserStatistics: jest.fn(),
    } as any;
    
    CachedUserRepository.mockImplementation(() => mockCachedUserRepository);
    
    // Mount routes
    app.use('/api/dashboard', dashboardRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard/user', () => {
    it('should return user dashboard data successfully', async () => {
      mockCachedUserRepository.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/dashboard/user')
        .expect(200);

      expect(response.body).toMatchObject({
        user: {
          id: 'user-123',
          email: 'test@hockeyhub.com',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          role: 'PLAYER',
        },
        organization: {
          id: 'org-123',
          name: 'Hockey Hub Elite',
          subscription: {
            plan: 'premium',
            status: 'active',
          },
        },
        teams: [
          {
            id: 'team-123',
            name: 'Elite Team A',
            type: 'competitive',
          },
        ],
        permissions: ['view_dashboard', 'submit_wellness'],
        features: {
          hasCalendar: true,
          hasTraining: true,
          hasMedical: true,
          hasStatistics: true,
          hasCommunication: true,
          hasPayments: false,
          hasEquipment: false,
          hasAdmin: false,
        },
      });

      expect(mockCachedUserRepository.findById).toHaveBeenCalledWith('user-123');
    });

    it('should return 401 if user is not authenticated', async () => {
      (extractUser as jest.Mock).mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = null;
        next();
      });

      await request(app)
        .get('/api/dashboard/user')
        .expect(401);
    });

    it('should return 404 if user is not found', async () => {
      mockCachedUserRepository.findById.mockResolvedValue(null);

      await request(app)
        .get('/api/dashboard/user')
        .expect(404);
    });

    it('should set cache headers', async () => {
      mockCachedUserRepository.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/dashboard/user')
        .expect(200);

      expect(response.headers['cache-control']).toMatch(/^private, max-age=300/);
    });
  });

  describe('GET /api/dashboard/user/stats', () => {
    it('should return user statistics for PLAYER role', async () => {
      mockCachedUserRepository.getUserStatistics.mockResolvedValue({
        totalUsers: 100,
        totalTeams: 5,
        totalOrganizations: 1,
      });

      const response = await request(app)
        .get('/api/dashboard/user/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        totalUsers: 100,
        totalTeams: 5,
        totalOrganizations: 1,
        trainingSessions: 0,
        gamesPlayed: 0,
        injuryDays: 0,
        performanceScore: 0,
      });

      expect(mockCachedUserRepository.getUserStatistics).toHaveBeenCalledWith('user-123');
    });

    it('should return role-specific stats for COACH', async () => {
      (extractUser as jest.Mock).mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = { id: 'user-123', role: 'COACH' };
        next();
      });

      mockCachedUserRepository.getUserStatistics.mockResolvedValue({
        totalUsers: 25,
        totalTeams: 2,
      });

      const response = await request(app)
        .get('/api/dashboard/user/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        totalUsers: 25,
        totalTeams: 2,
        teamWinRate: 0,
        playersCoached: 25,
        upcomingGames: 0,
        trainingSessions: 0,
      });
    });

    it('should set appropriate cache headers', async () => {
      mockCachedUserRepository.getUserStatistics.mockResolvedValue({});

      const response = await request(app)
        .get('/api/dashboard/user/stats')
        .expect(200);

      expect(response.headers['cache-control']).toBe('private, max-age=60');
    });
  });

  describe('GET /api/dashboard/user/quick-access', () => {
    it('should return quick access items for PLAYER role', async () => {
      const response = await request(app)
        .get('/api/dashboard/user/quick-access')
        .expect(200);

      expect(response.body.items).toHaveLength(4);
      expect(response.body.items[0]).toMatchObject({
        id: 'wellness',
        label: 'Submit Wellness',
        icon: 'Heart',
        path: '/wellness',
      });
    });

    it('should return different items for COACH role', async () => {
      (extractUser as jest.Mock).mockImplementationOnce((req: any, res: any, next: any) => { req.user = { id: 'user-123', role: 'COACH' }; next(); });

      const response = await request(app)
        .get('/api/dashboard/user/quick-access')
        .expect(200);

      expect(response.body.items).toHaveLength(4);
      expect(response.body.items[0]).toMatchObject({
        id: 'roster',
        label: 'Team Roster',
        icon: 'Users',
        path: '/roster',
      });
    });

    it('should have long cache duration for static data', async () => {
      const response = await request(app)
        .get('/api/dashboard/user/quick-access')
        .expect(200);

      expect(response.headers['cache-control']).toBe('private, max-age=3600');
    });
  });

  describe('GET /api/dashboard/user/notifications-summary', () => {
    it('should return notification summary', async () => {
      const response = await request(app)
        .get('/api/dashboard/user/notifications-summary')
        .expect(200);

      expect(response.body).toMatchObject({
        unreadMessages: 0,
        unreadNotifications: 0,
        pendingTasks: 0,
        upcomingEvents: 0,
        total: 0,
      });
    });

    it('should have short cache duration for real-time data', async () => {
      const response = await request(app)
        .get('/api/dashboard/user/notifications-summary')
        .expect(200);

      expect(response.headers['cache-control']).toBe('private, max-age=30');
    });
  });

  describe('Error handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockCachedUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/dashboard/user')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});