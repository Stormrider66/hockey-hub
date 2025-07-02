"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestClient = exports.TestServer = void 0;
const express_1 = __importDefault(require("express"));
/**
 * Creates a test Express server
 */
class TestServer {
    constructor(app) {
        this.server = null;
        this.port = 0;
        this.app = app || (0, express_1.default)();
    }
    /**
     * Starts the test server
     */
    async start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(0, () => {
                if (this.server) {
                    const address = this.server.address();
                    this.port = address.port;
                    resolve(this.port);
                }
                else {
                    reject(new Error('Failed to start server'));
                }
            });
        });
    }
    /**
     * Stops the test server
     */
    async stop() {
        return new Promise((resolve, reject) => {
            if (this.server) {
                this.server.close((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        this.server = null;
                        this.port = 0;
                        resolve();
                    }
                });
            }
            else {
                resolve();
            }
        });
    }
    /**
     * Gets the server URL
     */
    getUrl() {
        if (!this.port) {
            throw new Error('Server not started');
        }
        return `http://localhost:${this.port}`;
    }
    /**
     * Gets the Express app instance
     */
    getApp() {
        return this.app;
    }
    /**
     * Gets the HTTP server instance
     */
    getServer() {
        return this.server;
    }
}
exports.TestServer = TestServer;
/**
 * Creates a test client for making HTTP requests
 */
function createTestClient(baseURL) {
    return {
        get: async (path, options) => {
            const response = await fetch(`${baseURL}${path}`, {
                method: 'GET',
                ...options,
            });
            return {
                status: response.status,
                data: await response.json().catch(() => null),
                headers: Object.fromEntries(response.headers.entries()),
            };
        },
        post: async (path, data, options) => {
            const response = await fetch(`${baseURL}${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
                body: JSON.stringify(data),
                ...options,
            });
            return {
                status: response.status,
                data: await response.json().catch(() => null),
                headers: Object.fromEntries(response.headers.entries()),
            };
        },
        put: async (path, data, options) => {
            const response = await fetch(`${baseURL}${path}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
                body: JSON.stringify(data),
                ...options,
            });
            return {
                status: response.status,
                data: await response.json().catch(() => null),
                headers: Object.fromEntries(response.headers.entries()),
            };
        },
        delete: async (path, options) => {
            const response = await fetch(`${baseURL}${path}`, {
                method: 'DELETE',
                ...options,
            });
            return {
                status: response.status,
                data: await response.json().catch(() => null),
                headers: Object.fromEntries(response.headers.entries()),
            };
        },
    };
}
exports.createTestClient = createTestClient;
