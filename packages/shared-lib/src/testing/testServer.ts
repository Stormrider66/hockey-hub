import express, { Express } from 'express';
import http from 'http';
import { AddressInfo } from 'net';

/**
 * Creates a test Express server
 */
export class TestServer {
  private app: Express;
  private server: http.Server | null = null;
  private port: number = 0;

  constructor(app?: Express) {
    this.app = app || express();
  }

  /**
   * Starts the test server
   */
  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(0, () => {
        if (this.server) {
          const address = this.server.address() as AddressInfo;
          this.port = address.port;
          resolve(this.port);
        } else {
          reject(new Error('Failed to start server'));
        }
      });
    });
  }

  /**
   * Stops the test server
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.server = null;
            this.port = 0;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Gets the server URL
   */
  getUrl(): string {
    if (!this.port) {
      throw new Error('Server not started');
    }
    return `http://localhost:${this.port}`;
  }

  /**
   * Gets the Express app instance
   */
  getApp(): Express {
    return this.app;
  }

  /**
   * Gets the HTTP server instance
   */
  getServer(): http.Server | null {
    return this.server;
  }
}

/**
 * Creates a test client for making HTTP requests
 */
export function createTestClient(baseURL: string) {
  return {
    get: async (path: string, options?: any) => {
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
    post: async (path: string, data?: any, options?: any) => {
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
    put: async (path: string, data?: any, options?: any) => {
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
    delete: async (path: string, options?: any) => {
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