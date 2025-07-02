import { Request, Response, NextFunction } from 'express';
import { sign } from 'jsonwebtoken';

/**
 * Creates a mock Express request object
 */
export function createMockRequest(overrides?: Partial<Request>): Request {
  const req = {
    body: {},
    query: {},
    params: {},
    headers: {},
    cookies: {},
    method: 'GET',
    url: '/',
    path: '/',
    baseUrl: '',
    originalUrl: '/',
    get: jest.fn((header: string) => req.headers[header.toLowerCase()]),
    header: jest.fn((header: string) => req.headers[header.toLowerCase()]),
    ...overrides,
  } as unknown as Request;

  return req;
}

/**
 * Creates a mock Express response object
 */
export function createMockResponse(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    locals: {},
  } as unknown as Response;

  return res;
}

/**
 * Creates a mock Next function
 */
export function createMockNext(): NextFunction {
  return jest.fn() as NextFunction;
}

/**
 * Creates a JWT token for testing
 */
export function createTestToken(payload: any, secret: string = 'test-secret'): string {
  return sign(payload, secret, { expiresIn: '1h' });
}

/**
 * Creates headers with authorization token
 */
export function createAuthHeaders(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
  };
}

/**
 * Waits for all promises to resolve
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

/**
 * Creates a test user object
 */
export function createTestUser(overrides?: Partial<any>): any {
  return {
    id: '123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'player',
    organizationId: 'org-123',
    permissions: [],
    ...overrides,
  };
}

/**
 * Asserts that an async function throws an error
 */
export async function expectAsyncError(fn: () => Promise<any>, errorMessage?: string | RegExp): Promise<void> {
  let error: Error | null = null;
  
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }
  
  expect(error).not.toBeNull();
  
  if (errorMessage) {
    if (typeof errorMessage === 'string') {
      expect(error?.message).toContain(errorMessage);
    } else {
      expect(error?.message).toMatch(errorMessage);
    }
  }
}

/**
 * Mock console methods for cleaner test output
 */
export function mockConsole(): void {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

/**
 * Restore console methods
 */
export function restoreConsole(): void {
  global.console = console;
}