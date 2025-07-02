"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreConsole = exports.mockConsole = exports.expectAsyncError = exports.createTestUser = exports.flushPromises = exports.createAuthHeaders = exports.createTestToken = exports.createMockNext = exports.createMockResponse = exports.createMockRequest = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
/**
 * Creates a mock Express request object
 */
function createMockRequest(overrides) {
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
        get: jest.fn((header) => req.headers[header.toLowerCase()]),
        header: jest.fn((header) => req.headers[header.toLowerCase()]),
        ...overrides,
    };
    return req;
}
exports.createMockRequest = createMockRequest;
/**
 * Creates a mock Express response object
 */
function createMockResponse() {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
        clearCookie: jest.fn().mockReturnThis(),
        redirect: jest.fn().mockReturnThis(),
        locals: {},
    };
    return res;
}
exports.createMockResponse = createMockResponse;
/**
 * Creates a mock Next function
 */
function createMockNext() {
    return jest.fn();
}
exports.createMockNext = createMockNext;
/**
 * Creates a JWT token for testing
 */
function createTestToken(payload, secret = 'test-secret') {
    return (0, jsonwebtoken_1.sign)(payload, secret, { expiresIn: '1h' });
}
exports.createTestToken = createTestToken;
/**
 * Creates headers with authorization token
 */
function createAuthHeaders(token) {
    return {
        authorization: `Bearer ${token}`,
    };
}
exports.createAuthHeaders = createAuthHeaders;
/**
 * Waits for all promises to resolve
 */
async function flushPromises() {
    await new Promise((resolve) => setImmediate(resolve));
}
exports.flushPromises = flushPromises;
/**
 * Creates a test user object
 */
function createTestUser(overrides) {
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
exports.createTestUser = createTestUser;
/**
 * Asserts that an async function throws an error
 */
async function expectAsyncError(fn, errorMessage) {
    let error = null;
    try {
        await fn();
    }
    catch (e) {
        error = e;
    }
    expect(error).not.toBeNull();
    if (errorMessage) {
        if (typeof errorMessage === 'string') {
            expect(error?.message).toContain(errorMessage);
        }
        else {
            expect(error?.message).toMatch(errorMessage);
        }
    }
}
exports.expectAsyncError = expectAsyncError;
/**
 * Mock console methods for cleaner test output
 */
function mockConsole() {
    global.console = {
        ...console,
        log: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
}
exports.mockConsole = mockConsole;
/**
 * Restore console methods
 */
function restoreConsole() {
    global.console = console;
}
exports.restoreConsole = restoreConsole;
