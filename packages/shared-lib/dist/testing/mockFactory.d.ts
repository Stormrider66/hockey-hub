/**
 * Factory functions for creating mock data
 */
interface CreateMockOptions {
    count?: number;
    overrides?: Record<string, any>;
}
export declare class MockFactory {
    private static idCounter;
    static resetIdCounter(): void;
    static generateId(): string;
    static createUser(overrides?: Partial<any>): any;
    static createUsers(options?: CreateMockOptions): any[];
    static createOrganization(overrides?: Partial<any>): any;
    static createTeam(overrides?: Partial<any>): any;
    static createTrainingSession(overrides?: Partial<any>): any;
    static createCalendarEvent(overrides?: Partial<any>): any;
    static createPermission(overrides?: Partial<any>): any;
    static createRole(overrides?: Partial<any>): any;
    static createApiKey(overrides?: Partial<any>): any;
    static createJwtPayload(overrides?: Partial<any>): any;
    static createError(message?: string, code?: string): Error;
}
export {};
//# sourceMappingURL=mockFactory.d.ts.map