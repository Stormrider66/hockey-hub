import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { SharedAuthMiddleware } from './auth.middleware';
import { Request } from 'express';

export interface ServiceClientConfig {
  baseURL: string;
  serviceName: string;
  serviceApiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface RequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean;
  includeUserContext?: boolean;
  customHeaders?: Record<string, string>;
}

export class ServiceClient {
  private client: AxiosInstance;
  private config: Required<ServiceClientConfig>;
  private retryCount: Map<string, number> = new Map();

  constructor(config: ServiceClientConfig) {
    this.config = {
      baseURL: config.baseURL,
      serviceName: config.serviceName,
      serviceApiKey: config.serviceApiKey || process.env.SERVICE_API_KEY || '',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add service authentication headers
        if (!config.headers['X-Service-API-Key']) {
          config.headers['X-Service-API-Key'] = this.config.serviceApiKey;
          config.headers['X-Service-Name'] = this.config.serviceName;
        }

        // Add request ID if not present
        if (!config.headers['X-Request-Id']) {
          config.headers['X-Request-Id'] = this.generateRequestId();
        }

        // Log outgoing request
        console.log(`[${this.config.serviceName}] ${config.method?.toUpperCase()} ${config.url}`);

        return config;
      },
      (error) => {
        console.error(`[${this.config.serviceName}] Request error:`, error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log successful response
        console.log(`[${this.config.serviceName}] Response ${response.status} from ${response.config.url}`);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        const requestKey = `${originalRequest.method}:${originalRequest.url}`;
        
        // Get retry count for this request
        const retryCount = this.retryCount.get(requestKey) || 0;

        // Check if we should retry
        if (this.shouldRetry(error) && retryCount < this.config.retryAttempts) {
          this.retryCount.set(requestKey, retryCount + 1);
          
          // Wait before retrying
          await this.delay(this.config.retryDelay * (retryCount + 1));
          
          console.log(`[${this.config.serviceName}] Retrying request (attempt ${retryCount + 1}/${this.config.retryAttempts})`);
          
          return this.client(originalRequest);
        }

        // Clear retry count on final failure
        this.retryCount.delete(requestKey);

        // Log error
        console.error(`[${this.config.serviceName}] Response error:`, {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });

        return Promise.reject(error);
      }
    );
  }

  /**
   * Make a GET request
   */
  async get<T = any>(url: string, options?: RequestOptions): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, this.prepareConfig(options));
  }

  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, this.prepareConfig(options));
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, this.prepareConfig(options));
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, this.prepareConfig(options));
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, options?: RequestOptions): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, this.prepareConfig(options));
  }

  /**
   * Make a request with user context from Express request
   */
  async requestWithContext<T = any>(
    req: Request,
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<AxiosResponse<T>> {
    const userHeaders = SharedAuthMiddleware.forwardUserContext(req);
    const config = this.prepareConfig({
      ...options,
      customHeaders: {
        ...userHeaders,
        ...options?.customHeaders
      }
    });

    switch (method) {
      case 'get':
        return this.client.get<T>(url, config);
      case 'post':
        return this.client.post<T>(url, data, config);
      case 'put':
        return this.client.put<T>(url, data, config);
      case 'patch':
        return this.client.patch<T>(url, data, config);
      case 'delete':
        return this.client.delete<T>(url, config);
    }
  }

  /**
   * Prepare request configuration
   */
  private prepareConfig(options?: RequestOptions): AxiosRequestConfig {
    const config: AxiosRequestConfig = { ...options };

    // Add custom headers
    if (options?.customHeaders) {
      config.headers = {
        ...config.headers,
        ...options.customHeaders
      };
    }

    // Skip auth if requested
    if (options?.skipAuth) {
      delete config.headers?.['X-Service-API-Key'];
      delete config.headers?.['X-Service-Name'];
    }

    return config;
  }

  /**
   * Check if error should trigger a retry
   */
  private shouldRetry(error: any): boolean {
    // Don't retry if no response (network error)
    if (!error.response) {
      return true;
    }

    // Retry on 5xx errors
    if (error.response.status >= 500) {
      return true;
    }

    // Retry on specific 4xx errors
    if (error.response.status === 429 || error.response.status === 408) {
      return true;
    }

    return false;
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `${this.config.serviceName}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get the underlying axios instance
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Factory function to create service clients
export function createServiceClient(config: ServiceClientConfig): ServiceClient {
  return new ServiceClient(config);
}

// Pre-configured service clients
export const serviceClients = {
  user: () => createServiceClient({
    baseURL: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    serviceName: 'api-gateway'
  }),
  
  calendar: () => createServiceClient({
    baseURL: process.env.CALENDAR_SERVICE_URL || 'http://localhost:3003',
    serviceName: 'api-gateway'
  }),
  
  training: () => createServiceClient({
    baseURL: process.env.TRAINING_SERVICE_URL || 'http://localhost:3004',
    serviceName: 'api-gateway'
  }),
  
  medical: () => createServiceClient({
    baseURL: process.env.MEDICAL_SERVICE_URL || 'http://localhost:3005',
    serviceName: 'api-gateway'
  }),
  
  communication: () => createServiceClient({
    baseURL: process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:3002',
    serviceName: 'api-gateway'
  }),
  
  planning: () => createServiceClient({
    baseURL: process.env.PLANNING_SERVICE_URL || 'http://localhost:3006',
    serviceName: 'api-gateway'
  }),
  
  statistics: () => createServiceClient({
    baseURL: process.env.STATISTICS_SERVICE_URL || 'http://localhost:3007',
    serviceName: 'api-gateway'
  }),
  
  payment: () => createServiceClient({
    baseURL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3008',
    serviceName: 'api-gateway'
  }),
  
  admin: () => createServiceClient({
    baseURL: process.env.ADMIN_SERVICE_URL || 'http://localhost:3009',
    serviceName: 'api-gateway'
  })
};