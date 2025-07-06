/// <reference types="node" />
import { Express } from 'express';
import http from 'http';
/**
 * Creates a test Express server
 */
export declare class TestServer {
    private app;
    private server;
    private port;
    constructor(app?: Express);
    /**
     * Starts the test server
     */
    start(): Promise<number>;
    /**
     * Stops the test server
     */
    stop(): Promise<void>;
    /**
     * Gets the server URL
     */
    getUrl(): string;
    /**
     * Gets the Express app instance
     */
    getApp(): Express;
    /**
     * Gets the HTTP server instance
     */
    getServer(): http.Server | null;
}
/**
 * Creates a test client for making HTTP requests
 */
export declare function createTestClient(baseURL: string): {
    get: (path: string, options?: any) => Promise<{
        status: number;
        data: unknown;
        headers: {
            [k: string]: string;
        };
    }>;
    post: (path: string, data?: any, options?: any) => Promise<{
        status: number;
        data: unknown;
        headers: {
            [k: string]: string;
        };
    }>;
    put: (path: string, data?: any, options?: any) => Promise<{
        status: number;
        data: unknown;
        headers: {
            [k: string]: string;
        };
    }>;
    delete: (path: string, options?: any) => Promise<{
        status: number;
        data: unknown;
        headers: {
            [k: string]: string;
        };
    }>;
};
//# sourceMappingURL=testServer.d.ts.map