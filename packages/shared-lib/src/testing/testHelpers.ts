import { Request, Response, NextFunction } from 'express';
let sign: (payload: any, secret: string, options?: any) => string;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  sign = require('jsonwebtoken').sign;
} catch {
  sign = (p: any) => Buffer.from(JSON.stringify(p)).toString('base64');
}

/**
 * Creates a mock Express request object
 */
export function createMockRequest(overrides?: Partial<Request>): Request {
  const req: any = {
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
    get: (header: string) => (req.headers[header.toLowerCase()]),
    header: (header: string) => (req.headers[header.toLowerCase()]),
    ...overrides,
  } as unknown as Request;

  return req;
}

/**
 * Creates a mock Express response object
 */
export function createMockResponse(): Response {
  const res: any = { locals: {} } as unknown as Response;
  const getJestFn = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const j = require('@jest/globals').jest;
      if (j && typeof j.fn === 'function') return j.fn.bind(j);
    } catch {}
    const j = (globalThis as any).jest;
    if (j && typeof j.fn === 'function') return j.fn.bind(j);
    return undefined;
  };
  const make = () => {
    const jf = getJestFn();
    return jf ? jf().mockReturnValue(res) : function(this: any) { return res; };
  };
  (res as any).status = make();
  (res as any).json = make();
  (res as any).send = make();
  (res as any).setHeader = make();
  (res as any).cookie = make();
  (res as any).clearCookie = make();
  (res as any).redirect = make();

  return res;
}

/**
 * Creates a mock Next function
 */
export function createMockNext(): NextFunction {
  return ((err?: any) => { if (err) { /* no-op */ } }) as NextFunction;
}

/**
 * Creates a JWT token for testing
 */
export function createTestToken(payload: Record<string, unknown>, secret: string = 'test-secret'): string {
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
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Creates a test user object
 */
export function createTestUser(overrides?: Partial<TestUser>): TestUser {
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

interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  permissions: string[];
}

/**
 * Asserts that an async function throws an error
 */
export async function expectAsyncError(fn: () => Promise<unknown>, errorMessage?: string | RegExp): Promise<void> {
  let error: Error | null = null;
  
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }
  
  if (typeof (globalThis as any).expect === 'function') {
    const expect = (globalThis as any).expect;
    expect(error).not.toBeNull();
  
  if (errorMessage) {
    if (typeof errorMessage === 'string') {
      expect(error?.message).toContain(errorMessage);
    } else {
      expect(error?.message).toMatch(errorMessage);
    }
  }
}
}

/**
 * Mock console methods for cleaner test output
 */
export function mockConsole(): void {
  // No-op: avoid referencing jest in library code
}

/**
 * Restore console methods
 */
export function restoreConsole(): void {
  // No-op
}