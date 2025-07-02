import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
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
export declare class ServiceClient {
    private client;
    private config;
    private retryCount;
    constructor(config: ServiceClientConfig);
    /**
     * Set up request and response interceptors
     */
    private setupInterceptors;
    /**
     * Make a GET request
     */
    get<T = any>(url: string, options?: RequestOptions): Promise<AxiosResponse<T>>;
    /**
     * Make a POST request
     */
    post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<AxiosResponse<T>>;
    /**
     * Make a PUT request
     */
    put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<AxiosResponse<T>>;
    /**
     * Make a PATCH request
     */
    patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<AxiosResponse<T>>;
    /**
     * Make a DELETE request
     */
    delete<T = any>(url: string, options?: RequestOptions): Promise<AxiosResponse<T>>;
    /**
     * Make a request with user context from Express request
     */
    requestWithContext<T = any>(req: Request, method: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string, data?: any, options?: RequestOptions): Promise<AxiosResponse<T>>;
    /**
     * Prepare request configuration
     */
    private prepareConfig;
    /**
     * Check if error should trigger a retry
     */
    private shouldRetry;
    /**
     * Delay helper for retries
     */
    private delay;
    /**
     * Generate a unique request ID
     */
    private generateRequestId;
    /**
     * Get the underlying axios instance
     */
    getAxiosInstance(): AxiosInstance;
}
export declare function createServiceClient(config: ServiceClientConfig): ServiceClient;
export declare const serviceClients: {
    user: () => ServiceClient;
    calendar: () => ServiceClient;
    training: () => ServiceClient;
    medical: () => ServiceClient;
    communication: () => ServiceClient;
    planning: () => ServiceClient;
    statistics: () => ServiceClient;
    payment: () => ServiceClient;
    admin: () => ServiceClient;
};
//# sourceMappingURL=service-client.d.ts.map