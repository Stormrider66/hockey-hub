/**
 * Type definitions for testing utilities and mocks
 */

// Jest custom matchers
declare namespace jest {
  interface Matchers<R> {
    toBeValidDate(): R;
    toBeWithinRange(min: number, max: number): R;
    toHaveValidationError(field: string): R;
    toBeValidUUID(): R;
    toBeValidEmail(): R;
    toHaveStatus(status: number): R;
    toHaveProperty(property: string, value?: any): R;
    toRespondWithSuccess(): R;
    toRespondWithError(): R;
  }
}

// MSW (Mock Service Worker) types
declare module 'msw' {
  interface RestContext {
    status: (code: number) => RestContext;
    json: (body: any) => RestContext;
    text: (body: string) => RestContext;
    xml: (body: string) => RestContext;
    delay: (ms?: number) => RestContext;
    set: (headers: Record<string, string>) => RestContext;
    cookie: (name: string, value: string, options?: any) => RestContext;
  }
}

// Test database types
interface TestDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize?: boolean;
  logging?: boolean;
  entities?: string[];
  migrations?: string[];
}

interface MockServiceResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

interface TestUser {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  token?: string;
}

interface TestSetupOptions {
  mockAuth?: boolean;
  mockDatabase?: boolean;
  mockRedis?: boolean;
  mockEmailService?: boolean;
  seedData?: boolean;
}

// Global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testDatabase: any;
      testRedis: any;
      testUsers: Record<string, TestUser>;
    }
  }
}

export {};