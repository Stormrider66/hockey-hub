import { Express } from 'express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { TestDatabaseFactory, TestServer } from '@hockey-hub/shared-lib/testing';
import { createApp } from '../../app'; // Assuming you have an app factory
import { User } from '../../entities/User';
import { Role } from '../../entities/Role';
import { Permission } from '../../entities/Permission';
import { RefreshToken } from '../../entities/RefreshToken';
import * as bcrypt from 'bcrypt';

describe('Auth Integration Tests', () => {
  let app: Express;
  let server: TestServer;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Create test database
    dataSource = await TestDatabaseFactory.create('user-service', [
      User,
      Role,
      Permission,
      RefreshToken,
    ]);

    // Create app and server
    app = createApp(dataSource); // You'll need to create this function
    server = new TestServer(app);
    await server.start();
  });

  beforeEach(async () => {
    // Reset database before each test
    await TestDatabaseFactory.reset(dataSource);
    
    // Seed with test data
    await seedTestData(dataSource);
  });

  afterAll(async () => {
    await server.stop();
    await TestDatabaseFactory.close('user-service');
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePassword123!',
          firstName: 'New',
          lastName: 'User',
          role: 'player',
          organizationId: 'org-123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: 'newuser@example.com',
            firstName: 'New',
            lastName: 'User',
            role: 'player',
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      // Verify user was created in database
      const userRepo = dataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { email: 'newuser@example.com' } });
      expect(user).toBeDefined();
      expect(user?.isActive).toBe(true);
    });

    it('should reject registration with existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com', // Already exists from seed data
          password: 'SecurePassword123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'player',
          organizationId: 'org-123',
        });

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: expect.stringContaining('already exists'),
        },
      });
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'weak', // Too weak
          firstName: 'New',
          lastName: 'User',
          role: 'player',
          organizationId: 'org-123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('password'),
        },
      });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'player',
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      // Verify refresh token was created
      const tokenRepo = dataSource.getRepository(RefreshToken);
      const token = await tokenRepo.findOne({
        where: { userId: response.body.data.user.id },
      });
      expect(token).toBeDefined();
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    });

    it('should reject login for inactive user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Account is disabled',
        },
      });
    });

    it('should apply rate limiting after too many attempts', async () => {
      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'WrongPassword',
          });
      }

      // Next attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(429);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: expect.stringContaining('Too many'),
        },
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    let validRefreshToken: string;
    let validAccessToken: string;

    beforeEach(async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      validRefreshToken = loginResponse.body.data.refreshToken;
      validAccessToken = loginResponse.body.data.accessToken;
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      // New tokens should be different
      expect(response.body.data.accessToken).not.toBe(validAccessToken);
      expect(response.body.data.refreshToken).not.toBe(validRefreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid refresh token',
        },
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    let validAccessToken: string;
    let validRefreshToken: string;

    beforeEach(async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      validAccessToken = loginResponse.body.data.accessToken;
      validRefreshToken = loginResponse.body.data.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({
          refreshToken: validRefreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });

      // Verify refresh token was deleted
      const tokenRepo = dataSource.getRepository(RefreshToken);
      const token = await tokenRepo.findOne({
        where: { token: validRefreshToken },
      });
      expect(token).toBeNull();
    });
  });
});

// Helper function to seed test data
async function seedTestData(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);

  // Create roles
  const playerRole = await roleRepo.save({
    name: 'player',
    description: 'Player role',
  });

  // Create test users
  await userRepo.save([
    {
      email: 'test@example.com',
      password: await bcrypt.hash('TestPassword123!', 10),
      firstName: 'Test',
      lastName: 'User',
      role: playerRole,
      organizationId: 'org-123',
      isActive: true,
    },
    {
      email: 'inactive@example.com',
      password: await bcrypt.hash('TestPassword123!', 10),
      firstName: 'Inactive',
      lastName: 'User',
      role: playerRole,
      organizationId: 'org-123',
      isActive: false,
    },
  ]);
}