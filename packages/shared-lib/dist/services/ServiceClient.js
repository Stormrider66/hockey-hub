"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
class ServiceClient {
    constructor(config) {
        this.serviceName = config.serviceName;
        this.serviceVersion = config.serviceVersion;
        this.client = axios_1.default.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Add request interceptor for service headers
        this.client.interceptors.request.use((request) => {
            const headers = {
                'x-service-name': this.serviceName,
                'x-service-version': this.serviceVersion,
                'x-request-id': this.generateRequestId(),
            };
            // Use set method for axios headers
            Object.entries(headers).forEach(([key, value]) => {
                if (value) {
                    request.headers.set(key, value);
                }
            });
            return request;
        });
        // Add response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response) {
                const errorResponse = {
                    success: false,
                    error: {
                        code: error.response.data?.error?.code || 'UNKNOWN_ERROR',
                        message: error.response.data?.error?.message || error.message,
                        details: error.response.data?.error?.details,
                    },
                    timestamp: new Date().toISOString(),
                };
                throw errorResponse;
            }
            throw error;
        });
    }
    generateRequestId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    async get(url, config) {
        const response = await this.client.get(url, config);
        return response.data.data;
    }
    async post(url, data, config) {
        const response = await this.client.post(url, data, config);
        return response.data.data;
    }
    async put(url, data, config) {
        const response = await this.client.put(url, data, config);
        return response.data.data;
    }
    async patch(url, data, config) {
        const response = await this.client.patch(url, data, config);
        return response.data.data;
    }
    async delete(url, config) {
        const response = await this.client.delete(url, config);
        return response.data.data;
    }
    // Set user context for requests
    setUserContext(userId, organizationId) {
        this.client.defaults.headers['x-user-id'] = userId;
        if (organizationId) {
            this.client.defaults.headers['x-organization-id'] = organizationId;
        }
    }
    // Set correlation ID for request tracing
    setCorrelationId(correlationId) {
        this.client.defaults.headers['x-correlation-id'] = correlationId;
    }
}
exports.ServiceClient = ServiceClient;
