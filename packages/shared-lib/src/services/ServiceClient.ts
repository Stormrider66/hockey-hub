import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ServiceHeaders, SuccessResponseDTO, ErrorResponseDTO } from '../dto';

export interface ServiceClientConfig {
  serviceName: string;
  serviceVersion: string;
  baseURL: string;
  timeout?: number;
}

export class ServiceClient {
  private client: AxiosInstance;
  private serviceName: string;
  private serviceVersion: string;

  constructor(config: ServiceClientConfig) {
    this.serviceName = config.serviceName;
    this.serviceVersion = config.serviceVersion;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for service headers
    this.client.interceptors.request.use((request) => {
      const headers: Partial<ServiceHeaders> = {
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
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const errorResponse: ErrorResponseDTO = {
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
      }
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<SuccessResponseDTO<T>>(url, config);
    return response.data.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<SuccessResponseDTO<T>>(url, data, config);
    return response.data.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<SuccessResponseDTO<T>>(url, data, config);
    return response.data.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<SuccessResponseDTO<T>>(url, data, config);
    return response.data.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<SuccessResponseDTO<T>>(url, config);
    return response.data.data;
  }

  // Set user context for requests
  setUserContext(userId: string, organizationId?: string) {
    this.client.defaults.headers['x-user-id'] = userId;
    if (organizationId) {
      this.client.defaults.headers['x-organization-id'] = organizationId;
    }
  }

  // Set correlation ID for request tracing
  setCorrelationId(correlationId: string) {
    this.client.defaults.headers['x-correlation-id'] = correlationId;
  }
}