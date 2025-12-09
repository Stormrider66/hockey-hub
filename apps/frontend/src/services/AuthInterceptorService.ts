import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { store } from '@/store/store';
import { authApi } from '@/store/api/authApi';

interface FailedRequest {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  config: AxiosRequestConfig;
}

class AuthInterceptorService {
  private isRefreshing = false;
  private failedRequestsQueue: FailedRequest[] = [];
  private axiosInstance: AxiosInstance;

  constructor() {
    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      withCredentials: true, // Include cookies
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token to requests
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Get token from cookie or localStorage
        const token = this.getAccessToken();
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle 401 errors and token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle offline error
        if (!navigator.onLine || error.code === 'ERR_NETWORK') {
          const offlineError = new Error('You are offline. Please check your internet connection.');
          (offlineError as any).code = 'OFFLINE';
          return Promise.reject(offlineError);
        }

        // If error is not 401 or request already retried, reject
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        // Mark request as retried
        originalRequest._retry = true;

        // If already refreshing, queue the request
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedRequestsQueue.push({ resolve, reject, config: originalRequest });
          });
        }

        this.isRefreshing = true;

        try {
          // Attempt to refresh token
          const result = await this.refreshToken();

          if (result) {
            // Process queued requests with new token
            this.processQueue(null);

            // Retry original request
            return this.axiosInstance(originalRequest);
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (refreshError) {
          // Refresh failed, process queue with error
          this.processQueue(refreshError);

          // Redirect to login
          this.handleAuthError();

          return Promise.reject(refreshError);
        } finally {
          this.isRefreshing = false;
        }
      }
    );
  }

  private getAccessToken(): string | null {
    // Try to get token from cookie first
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
    
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }

    // Fallback to localStorage
    const tokenData = localStorage.getItem('access_token');
    return tokenData || null;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      // Use RTK Query to refresh token
      const result = await store.dispatch(
        authApi.endpoints.refreshToken.initiate()
      ).unwrap();

      if (result.access_token) {
        // Token refreshed successfully
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  private processQueue(error: any) {
    this.failedRequestsQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else {
        // Retry the request with new token
        this.axiosInstance(config).then(resolve).catch(reject);
      }
    });

    this.failedRequestsQueue = [];
  }

  private handleAuthError() {
    // Clear auth data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('current_user_id');

    // Clear cookies
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // Redirect to login if not already there
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Public method to get configured axios instance
  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  // Convenience methods for common HTTP operations
  public async get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.axiosInstance.get<T>(url, config);
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axiosInstance.post<T>(url, data, config);
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axiosInstance.put<T>(url, data, config);
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axiosInstance.patch<T>(url, data, config);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.axiosInstance.delete<T>(url, config);
  }
}

// Create singleton instance
const authInterceptor = new AuthInterceptorService();

// Export the configured axios instance
export const api = authInterceptor.getAxiosInstance();

// Export the service instance for direct access if needed
export default authInterceptor;