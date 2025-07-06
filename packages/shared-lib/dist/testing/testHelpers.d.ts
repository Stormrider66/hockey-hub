import { Request, Response, NextFunction } from 'express';
/**
 * Creates a mock Express request object
 */
export declare function createMockRequest(overrides?: Partial<Request>): Request;
/**
 * Creates a mock Express response object
 */
export declare function createMockResponse(): Response;
/**
 * Creates a mock Next function
 */
export declare function createMockNext(): NextFunction;
/**
 * Creates a JWT token for testing
 */
export declare function createTestToken(payload: Record<string, unknown>, secret?: string): string;
/**
 * Creates headers with authorization token
 */
export declare function createAuthHeaders(token: string): Record<string, string>;
/**
 * Waits for all promises to resolve
 */
export declare function flushPromises(): Promise<void>;
/**
 * Creates a test user object
 */
export declare function createTestUser(overrides?: Partial<TestUser>): TestUser;
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
export declare function expectAsyncError(fn: () => Promise<unknown>, errorMessage?: string | RegExp): Promise<void>;
/**
 * Mock console methods for cleaner test output
 */
export declare function mockConsole(): void;
/**
 * Restore console methods
 */
export declare function restoreConsole(): void;
export {};
//# sourceMappingURL=testHelpers.d.ts.map