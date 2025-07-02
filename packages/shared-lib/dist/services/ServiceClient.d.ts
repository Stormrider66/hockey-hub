import { AxiosRequestConfig } from 'axios';
export interface ServiceClientConfig {
    serviceName: string;
    serviceVersion: string;
    baseURL: string;
    timeout?: number;
}
export declare class ServiceClient {
    private client;
    private serviceName;
    private serviceVersion;
    constructor(config: ServiceClientConfig);
    private generateRequestId;
    get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    setUserContext(userId: string, organizationId?: string): void;
    setCorrelationId(correlationId: string): void;
}
//# sourceMappingURL=ServiceClient.d.ts.map