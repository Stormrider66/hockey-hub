import { PerformanceMonitor } from '@/services/performance/PerformanceMonitor';

export interface ApiTimingOptions {
  includePayloadSize?: boolean;
  slowThreshold?: number;
  logSlowRequests?: boolean;
}

// Store original fetch to prevent recursion (guard for undefined in tests)
let originalFetch: typeof fetch;
if (typeof window !== 'undefined' && typeof (window as any).fetch === 'function') {
  originalFetch = (window as any).fetch.bind(window);
} else if (typeof (globalThis as any).fetch === 'function') {
  originalFetch = (globalThis as any).fetch.bind(globalThis);
} else {
  // Fallback to a no-op fetch in extremely minimal environments
  originalFetch = ((..._args: any[]) => Promise.reject(new Error('fetch not available'))) as any;
}

/**
 * Middleware to track API request timing
 * Can be used with fetch, axios, or any HTTP client
 */
export function trackApiTiming(options: ApiTimingOptions = {}) {
  const {
    includePayloadSize = true,
    slowThreshold = 1000,
    logSlowRequests = true
  } = options;

  return async function (request: Request | string, init?: RequestInit): Promise<Response> {
    const url = typeof request === 'string' ? request : request.url;
    const method = init?.method || (typeof request === 'object' ? request.method : 'GET');
    const startTime = performance.now();

    try {
      const response = await originalFetch(request, init);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Get response size if available
      let size: number | undefined;
      if (includePayloadSize) {
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          size = parseInt(contentLength, 10);
        }
      }

      // Record timing
      PerformanceMonitor.recordApiTiming(
        method,
        url,
        duration,
        response.status,
        size
      );

      // Log slow requests
      if (logSlowRequests && duration > slowThreshold) {
        console.warn(`[API Performance] Slow request: ${method} ${url} took ${duration.toFixed(0)}ms`);
      }

      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Record failed request timing
      PerformanceMonitor.recordApiTiming(
        method,
        url,
        duration,
        0 // Status 0 for network errors
      );

      throw error;
    }
  };
}

/**
 * Create a fetch wrapper with automatic timing
 */
export function createTimedFetch(options: ApiTimingOptions = {}): typeof fetch {
  const timedFetch = trackApiTiming(options);
  
  // Mark this as a timed fetch to prevent double wrapping
  const wrappedFetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (typeof input === 'string' || input instanceof URL) {
      return timedFetch(input.toString(), init);
    }
    return timedFetch(input, init);
  };
  
  // Add marker to identify wrapped fetch
  (wrappedFetch as any).__isTimedFetch = true;
  
  return wrappedFetch;
}

/**
 * Axios interceptor for timing (if using axios)
 */
export function createAxiosTimingInterceptor(options: ApiTimingOptions = {}) {
  const { slowThreshold = 1000, logSlowRequests = true } = options;

  return {
    request: (config: any) => {
      config.metadata = { startTime: performance.now() };
      return config;
    },
    response: (response: any) => {
      if (response.config.metadata) {
        const duration = performance.now() - response.config.metadata.startTime;
        
        PerformanceMonitor.recordApiTiming(
          response.config.method?.toUpperCase() || 'GET',
          response.config.url || '',
          duration,
          response.status,
          JSON.stringify(response.data).length
        );

        if (logSlowRequests && duration > slowThreshold) {
          console.warn(
            `[API Performance] Slow request: ${response.config.method?.toUpperCase()} ${response.config.url} took ${duration.toFixed(0)}ms`
          );
        }
      }
      return response;
    },
    error: (error: any) => {
      if (error.config?.metadata) {
        const duration = performance.now() - error.config.metadata.startTime;
        
        PerformanceMonitor.recordApiTiming(
          error.config.method?.toUpperCase() || 'GET',
          error.config.url || '',
          duration,
          error.response?.status || 0
        );
      }
      return Promise.reject(error);
    }
  };
}

/**
 * RTK Query middleware for timing
 */
export function createRTKQueryTimingMiddleware() {
  return (api: any) => (next: any) => (action: any) => {
    // Check if this is an RTK Query action
    if (action.type?.endsWith('/pending')) {
      // Store start time
      const key = action.meta?.arg?.endpointName || action.type;
      (global as any).__rtkQueryTimings = (global as any).__rtkQueryTimings || {};
      (global as any).__rtkQueryTimings[key] = performance.now();
    } else if (
      action.type?.endsWith('/fulfilled') || 
      action.type?.endsWith('/rejected')
    ) {
      // Calculate duration
      const key = action.meta?.arg?.endpointName || action.type.replace(/\/(fulfilled|rejected)$/, '');
      const startTime = (global as any).__rtkQueryTimings?.[key];
      
      if (startTime) {
        const duration = performance.now() - startTime;
        const status = action.type.endsWith('/fulfilled') ? 200 : 500;
        
        PerformanceMonitor.recordApiTiming(
          action.meta?.arg?.type || 'query',
          key,
          duration,
          status
        );

        // Clean up
        delete (global as any).__rtkQueryTimings[key];
      }
    }

    return next(action);
  };
}