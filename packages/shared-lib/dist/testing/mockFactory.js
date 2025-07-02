"use strict";
/**
 * Factory functions for creating mock data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockFactory = void 0;
class MockFactory {
    static resetIdCounter() {
        this.idCounter = 1;
    }
    static generateId() {
        return `mock-id-${this.idCounter++}`;
    }
    static createUser(overrides) {
        return {
            id: this.generateId(),
            email: `user${this.idCounter}@example.com`,
            firstName: `First${this.idCounter}`,
            lastName: `Last${this.idCounter}`,
            role: 'player',
            organizationId: 'org-1',
            teamId: 'team-1',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        };
    }
    static createUsers(options = {}) {
        const { count = 5, overrides = {} } = options;
        return Array.from({ length: count }, () => this.createUser(overrides));
    }
    static createOrganization(overrides) {
        return {
            id: this.generateId(),
            name: `Organization ${this.idCounter}`,
            description: 'Mock organization',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        };
    }
    static createTeam(overrides) {
        return {
            id: this.generateId(),
            name: `Team ${this.idCounter}`,
            organizationId: 'org-1',
            ageGroup: 'U16',
            level: 'AAA',
            season: '2024-2025',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        };
    }
    static createTrainingSession(overrides) {
        return {
            id: this.generateId(),
            name: `Training Session ${this.idCounter}`,
            type: 'strength',
            duration: 60,
            trainerId: 'trainer-1',
            status: 'scheduled',
            scheduledAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        };
    }
    static createCalendarEvent(overrides) {
        return {
            id: this.generateId(),
            title: `Event ${this.idCounter}`,
            type: 'training',
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000), // 1 hour later
            location: 'Arena 1',
            description: 'Mock event',
            createdBy: 'user-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        };
    }
    static createPermission(overrides) {
        return {
            id: this.generateId(),
            name: `permission.${this.idCounter}`,
            description: 'Mock permission',
            resource: 'resource',
            action: 'read',
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        };
    }
    static createRole(overrides) {
        return {
            id: this.generateId(),
            name: `role-${this.idCounter}`,
            description: 'Mock role',
            permissions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        };
    }
    static createApiKey(overrides) {
        return {
            id: this.generateId(),
            key: `api-key-${this.idCounter}`,
            name: `API Key ${this.idCounter}`,
            serviceName: 'test-service',
            permissions: ['read', 'write'],
            isActive: true,
            expiresAt: new Date(Date.now() + 86400000), // 24 hours
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides,
        };
    }
    static createJwtPayload(overrides) {
        return {
            sub: 'user-123',
            email: 'test@example.com',
            role: 'player',
            organizationId: 'org-123',
            permissions: [],
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            ...overrides,
        };
    }
    static createError(message = 'Mock error', code = 'MOCK_ERROR') {
        const error = new Error(message);
        error.code = code;
        return error;
    }
}
exports.MockFactory = MockFactory;
MockFactory.idCounter = 1;
