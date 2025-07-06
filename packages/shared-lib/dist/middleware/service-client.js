"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceClients = exports.createServiceClient = exports.ServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
const auth_middleware_1 = require("./auth.middleware");
class ServiceClient {
    constructor(config) {
        this.retryCount = new Map();
        this.config = {
            baseURL: config.baseURL,
            serviceName: config.serviceName,
            serviceApiKey: config.serviceApiKey || process.env.SERVICE_API_KEY || '',
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000
        };
        this.client = axios_1.default.create({
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
    setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use((config) => {
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
        }, (error) => {
            console.error(`[${this.config.serviceName}] Request error:`, error);
            return Promise.reject(error);
        });
        // Response interceptor
        this.client.interceptors.response.use((response) => {
            // Log successful response
            console.log(`[${this.config.serviceName}] Response ${response.status} from ${response.config.url}`);
            return response;
        }, async (error) => {
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
        });
    }
    /**
     * Make a GET request
     */
    async get(url, options) {
        return this.client.get(url, this.prepareConfig(options));
    }
    /**
     * Make a POST request
     */
    async post(url, data, options) {
        return this.client.post(url, data, this.prepareConfig(options));
    }
    /**
     * Make a PUT request
     */
    async put(url, data, options) {
        return this.client.put(url, data, this.prepareConfig(options));
    }
    /**
     * Make a PATCH request
     */
    async patch(url, data, options) {
        return this.client.patch(url, data, this.prepareConfig(options));
    }
    /**
     * Make a DELETE request
     */
    async delete(url, options) {
        return this.client.delete(url, this.prepareConfig(options));
    }
    /**
     * Make a request with user context from Express request
     */
    async requestWithContext(req, method, url, data, options) {
        const userHeaders = auth_middleware_1.SharedAuthMiddleware.forwardUserContext(req);
        const config = this.prepareConfig({
            ...options,
            customHeaders: {
                ...userHeaders,
                ...options?.customHeaders
            }
        });
        switch (method) {
            case 'get':
                return this.client.get(url, config);
            case 'post':
                return this.client.post(url, data, config);
            case 'put':
                return this.client.put(url, data, config);
            case 'patch':
                return this.client.patch(url, data, config);
            case 'delete':
                return this.client.delete(url, config);
        }
    }
    /**
     * Prepare request configuration
     */
    prepareConfig(options) {
        const config = { ...options };
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
    shouldRetry(error) {
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
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Generate a unique request ID
     */
    generateRequestId() {
        return `${this.config.serviceName}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
    /**
     * Get the underlying axios instance
     */
    getAxiosInstance() {
        return this.client;
    }
}
exports.ServiceClient = ServiceClient;
// Factory function to create service clients
function createServiceClient(config) {
    return new ServiceClient(config);
}
exports.createServiceClient = createServiceClient;
// Pre-configured service clients
exports.serviceClients = {
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
//# sourceMappingURL=service-client.js.map