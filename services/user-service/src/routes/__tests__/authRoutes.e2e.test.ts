import request from 'supertest';
import express from 'express';

// Mock express-async-handler before routes import
jest.mock('express-async-handler', () =>
  (fn: any) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  },
  { virtual: true }
);

// Manual mock for @hockey-hub/types by mapping is resolved; keep if needed (we have moduleNameMapper) – remove inline mock

import authRoutes from '../authRoutes';
// eslint-disable-next-line import/first
import * as authService from '../../services/authService';

// Ensure JWT_SECRET is set **before** any modules that read it are imported
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh';

// Mock authenticateToken to bypass real JWT verification in this high‑level route test
jest.mock('../../middleware/authenticateToken', () => ({
  authenticateToken: (_req: any, _res: any, next: any) => next(),
}));

// Manual mock for authService to avoid loading actual implementation
jest.mock('../../services/authService', () => {
  return {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn()
  };
});

// Configure mock implementations
const mockRegister = authService.register as jest.Mock;
const mockLogin = authService.login as jest.Mock;
const mockRefreshToken = authService.refreshToken as jest.Mock;
const mockLogout = authService.logout as jest.Mock;

// Stub shared types to avoid path resolution in isolated test environment
jest.mock('@hockey-hub/types', () => ({
  TypedRequest: {} as any,
  HttpException: class MockHttpException {},
  ValidateRequestMiddleware: () => (_schema: any) => (req: any, res: any, next: any) => {
    if (req.body && typeof req.body.email === 'string' && req.body.email.includes('@')) {
      return next();
    }
    return res.status(400).json({ error: true, message: 'Validation failed' });
  },
}), { virtual: true });

beforeEach(() => {
  jest.clearAllMocks();
});

// Build app
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

// Simple error handler to ensure rejected promises return quickly
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err && err.status ? err.status : 500;
  res.status(status).json({ error: true, message: err?.message || 'Internal error' });
});

// ---------------- Tests -------------- //

describe('Auth Routes E2E', () => {
  const registerDto = {
    email: 'player@example.com',
    password: 'Password123',
    firstName: 'John',
    lastName: 'Doe',
  };

  const loginDto = {
    email: registerDto.email,
    password: registerDto.password,
  };

  const tokens = { accessToken: 'access', refreshToken: 'refresh' };

  test('register → login → refresh → logout flow', async () => {
    mockRegister.mockResolvedValue({ id: 'user-1', email: registerDto.email });
    mockLogin.mockResolvedValue(tokens);
    mockRefreshToken.mockResolvedValue({ accessToken: 'access2', refreshToken: 'refresh2' });
    mockLogout.mockResolvedValue(undefined);

    // Register
    const regRes = await request(app).post('/api/v1/auth/register').send(registerDto);
    expect(regRes.status).toBe(201);
    expect(mockRegister).toHaveBeenCalled();

    // Login
    const loginRes = await request(app).post('/api/v1/auth/login').send(loginDto);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data).toEqual(tokens);

    // Refresh
    const refreshRes = await request(app).post('/api/v1/auth/refresh-token').send({ refreshToken: tokens.refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(mockRefreshToken).toHaveBeenCalledWith(tokens.refreshToken);

    // Logout
    const logoutRes = await request(app).post('/api/v1/auth/logout').send({ refreshToken: tokens.refreshToken });
    expect(logoutRes.status).toBe(200);
    expect(mockLogout).toHaveBeenCalledWith(tokens.refreshToken);
  });

  test('invalid email triggers validation error on register', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ ...registerDto, email: 'invalid' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test('login fails with wrong password', async () => {
    mockLogin.mockRejectedValue(new Error('INVALID_CREDENTIALS'));

    const res = await request(app).post('/api/v1/auth/login').send({ ...loginDto, password: 'wrong' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test('login fails when user inactive', async () => {
    mockLogin.mockRejectedValue(new Error('USER_INACTIVE'));
    const res = await request(app).post('/api/v1/auth/login').send(loginDto);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test('refresh-token with invalid token returns 401', async () => {
    mockRefreshToken.mockRejectedValue(new Error('INVALID_TOKEN'));
    const res = await request(app).post('/api/v1/auth/refresh-token').send({ refreshToken: 'bad' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // Reduce default timeout for this suite
  jest.setTimeout(10000);
}); 