import { AppDispatch } from '../store';
import { userApi } from '../api/userApi';
import { authApi } from '../api/authApi';
import { trainingApi } from '../api/trainingApi';
import { calendarApi } from '../api/calendarApi';
import { medicalApi } from '../api/medicalApi';
import { communicationApi } from '../api/communicationApi';
import { statisticsApi } from '../api/statisticsApi';
import { adminApi } from '../api/adminApi';
import { paymentApi } from '../api/paymentApi';
import { cacheAnalytics } from './cacheAnalytics';
import { safeLocalStorage } from '@/utils/safeStorage';

export interface WarmingEndpoint {
  name: string;
  api: any;
  endpoint: string;
  args?: any;
  priority: 'high' | 'medium' | 'low';
  condition?: () => boolean;
}

export interface WarmingStatus {
  isRunning: boolean;
  total: number;
  completed: number;
  failed: number;
  startTime: number | null;
  endTime: number | null;
  endpoints: WarmingEndpointStatus[];
}

export interface WarmingEndpointStatus {
  name: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  error?: string;
  duration?: number;
  lastWarmed?: number;
}

class CacheWarmingManager {
  private static instance: CacheWarmingManager;
  private warmingStatus: WarmingStatus;
  private warmingEndpoints: WarmingEndpoint[] = [];
  private abortController: AbortController | null = null;

  private constructor() {
    this.warmingStatus = {
      isRunning: false,
      total: 0,
      completed: 0,
      failed: 0,
      startTime: null,
      endTime: null,
      endpoints: []
    };

    this.initializeEndpoints();
  }

  static getInstance(): CacheWarmingManager {
    if (!CacheWarmingManager.instance) {
      CacheWarmingManager.instance = new CacheWarmingManager();
    }
    return CacheWarmingManager.instance;
  }

  private validateEndpoint(endpoint: WarmingEndpoint): { isValid: boolean; error?: string } {
    if (!endpoint.api) {
      return { isValid: false, error: 'API not defined' };
    }

    // Check if the API is properly initialized
    if (typeof endpoint.api.endpoints === 'undefined') {
      return { isValid: false, error: `API ${endpoint.api.reducerPath || 'unknown'} not properly initialized` };
    }

    if (!endpoint.api.endpoints) {
      return { isValid: false, error: 'API endpoints not defined' };
    }

    if (!endpoint.api.endpoints[endpoint.endpoint]) {
      return { 
        isValid: false, 
        error: `Endpoint "${endpoint.endpoint}" not found in ${endpoint.api.reducerPath || 'API'}. Available endpoints: ${Object.keys(endpoint.api.endpoints).join(', ')}` 
      };
    }

    if (typeof endpoint.api.endpoints[endpoint.endpoint].initiate !== 'function') {
      return { 
        isValid: false, 
        error: `Endpoint "${endpoint.endpoint}" does not have an initiate method` 
      };
    }

    return { isValid: true };
  }

  private initializeEndpoints(): void {
    // Define critical endpoints to warm
    this.warmingEndpoints = [
      // High Priority - User and Auth
      {
        name: 'Current User Profile',
        api: authApi,
        endpoint: 'getCurrentUser',
        priority: 'high',
        condition: () => {
          // Only warm if user is logged in
          const token = safeLocalStorage.getItem('access_token');
          console.log('[CacheWarming] Current User Profile condition:', { hasToken: !!token, token });
          return !!token;
        }
      },
      {
        name: 'User Teams',
        api: userApi,
        endpoint: 'getTeams',
        args: {},
        priority: 'high'
      },

      // Medium Priority - Core Features
      {
        name: 'Organization Players',
        api: userApi,
        endpoint: 'getPlayers',
        priority: 'medium'
      },
      {
        name: 'Calendar Events (This Week)',
        api: calendarApi,
        endpoint: 'getEvents',
        args: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        priority: 'medium'
      },
      {
        name: 'Workout Sessions',
        api: trainingApi,
        endpoint: 'getWorkoutSessions',
        args: { date: new Date().toISOString().split('T')[0] },
        priority: 'medium'
      },
      {
        name: 'User Broadcasts',
        api: communicationApi,
        endpoint: 'getUserBroadcasts',
        priority: 'medium'
      },

      // Low Priority - Secondary Features
      {
        name: 'Team Medical Stats',
        api: medicalApi,
        endpoint: 'getTeamMedicalStats',
        priority: 'low',
        condition: () => {
          // Only for medical staff and coaches
          const userRole = safeLocalStorage.getItem('userRole');
          return ['medicalStaff', 'coach', 'physicalTrainer'].includes(userRole || '');
        }
      },
      {
        name: 'All Injuries',
        api: medicalApi,
        endpoint: 'getAllInjuries',
        priority: 'low',
        condition: () => {
          // Only for medical staff and coaches
          const userRole = safeLocalStorage.getItem('userRole');
          return ['medicalStaff', 'coach', 'physicalTrainer'].includes(userRole || '');
        }
      },
      {
        name: 'Payment Discussions',
        api: paymentApi,
        endpoint: 'getPaymentDiscussions',
        args: {},
        priority: 'low',
        condition: () => {
          // Only for parents and admins
          const userRole = safeLocalStorage.getItem('userRole');
          return ['parent', 'admin', 'clubAdmin'].includes(userRole || '');
        }
      }
    ];

    // Validate all endpoints at initialization and warn about issues
    this.validateAllEndpoints();
  }

  private validateAllEndpoints(): void {
    // Skip validation if APIs are not yet initialized (e.g., during SSR)
    if (typeof window === 'undefined') {
      console.debug('Cache warming: Skipping endpoint validation during SSR');
      return;
    }

    const invalidEndpoints: string[] = [];
    
    this.warmingEndpoints.forEach(endpoint => {
      const validation = this.validateEndpoint(endpoint);
      if (!validation.isValid) {
        invalidEndpoints.push(`${endpoint.name}: ${validation.error}`);
      }
    });

    if (invalidEndpoints.length > 0) {
      console.warn('Cache warming: Found invalid endpoints:', invalidEndpoints);
    } else {
      console.debug(`Cache warming: All ${this.warmingEndpoints.length} endpoints validated successfully`);
    }
  }

  async startWarming(dispatch: AppDispatch): Promise<void> {
    if (this.warmingStatus.isRunning) {
      console.warn('Cache warming is already in progress');
      return;
    }

    this.abortController = new AbortController();
    
    // Filter endpoints based on conditions and validate API availability
    const endpointsToWarm = this.warmingEndpoints.filter(endpoint => {
      // Check condition
      if (endpoint.condition && !endpoint.condition()) {
        return false;
      }
      
      // Validate API structure
      const validation = this.validateEndpoint(endpoint);
      if (!validation.isValid) {
        console.warn(`Skipping ${endpoint.name}: ${validation.error}`);
        return false;
      }
      
      return true;
    });

    // Sort by priority
    const sortedEndpoints = endpointsToWarm.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    this.warmingStatus = {
      isRunning: true,
      total: sortedEndpoints.length,
      completed: 0,
      failed: 0,
      startTime: Date.now(),
      endTime: null,
      endpoints: sortedEndpoints.map(ep => ({
        name: ep.name,
        priority: ep.priority,
        completed: false
      }))
    };

    console.log(`Starting cache warming for ${sortedEndpoints.length} endpoints`);

    // Process endpoints in batches to avoid overwhelming the server
    const batchSize = 3;
    for (let i = 0; i < sortedEndpoints.length; i += batchSize) {
      if (this.abortController.signal.aborted) {
        break;
      }

      const batch = sortedEndpoints.slice(i, i + batchSize);
      await Promise.all(
        batch.map(endpoint => this.warmEndpoint(endpoint, dispatch, i + batch.indexOf(endpoint)))
      );
    }

    this.warmingStatus.isRunning = false;
    this.warmingStatus.endTime = Date.now();

    const duration = this.warmingStatus.endTime - this.warmingStatus.startTime!;
    console.log(
      `Cache warming completed in ${(duration / 1000).toFixed(2)}s. ` +
      `Success: ${this.warmingStatus.completed}, Failed: ${this.warmingStatus.failed}`
    );
  }

  private async warmEndpoint(
    endpoint: WarmingEndpoint,
    dispatch: AppDispatch,
    index: number
  ): Promise<void> {
    const startTime = Date.now();
    
    console.log(`[CacheWarming] Warming ${endpoint.name}:`, {
      api: endpoint.api?.reducerPath,
      endpoint: endpoint.endpoint,
      hasInitiate: !!endpoint.api?.endpoints?.[endpoint.endpoint]?.initiate
    });
    
    try {
      // Validate endpoint before attempting to warm
      const validation = this.validateEndpoint(endpoint);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Additional safety check for endpoint initialization
      if (!endpoint.api || !endpoint.api.endpoints || !endpoint.api.endpoints[endpoint.endpoint]) {
        throw new Error(`Endpoint ${endpoint.endpoint} not properly initialized in ${endpoint.api?.reducerPath || 'unknown API'}`);
      }

      // Initiate the query with error handling
      let promise;
      try {
        promise = dispatch(
          endpoint.api.endpoints[endpoint.endpoint].initiate(endpoint.args || {})
        );
      } catch (dispatchError) {
        throw new Error(`Failed to dispatch query: ${dispatchError instanceof Error ? dispatchError.message : 'Unknown dispatch error'}`);
      }

      // Wait for the result with abort signal
      const result = await Promise.race([
        promise.unwrap(),
        new Promise((_, reject) => {
          this.abortController?.signal.addEventListener('abort', () =>
            reject(new Error('Cache warming aborted'))
          );
        })
      ]);

      const duration = Date.now() - startTime;
      
      // Log the result for debugging getCurrentUser
      if (endpoint.endpoint === 'getCurrentUser') {
        console.log(`[CacheWarming] ${endpoint.name} result:`, result);
      }
      
      // Check if result is empty object for getCurrentUser
      if (endpoint.endpoint === 'getCurrentUser' && (!result || Object.keys(result).length === 0)) {
        console.error(`✗ Failed to warm ${endpoint.name}:`, result || {});
        throw new Error('Received empty user data');
      }
      
      // Update status
      this.warmingStatus.completed++;
      this.warmingStatus.endpoints[index] = {
        ...this.warmingStatus.endpoints[index],
        completed: true,
        duration,
        lastWarmed: Date.now()
      };

      // Record in analytics - safely handle result size calculation
      let resultSize = 0;
      try {
        resultSize = JSON.stringify(result).length;
      } catch (e) {
        // If result can't be stringified, use a default size
        resultSize = 1000;
      }

      cacheAnalytics.recordCacheMiss(
        endpoint.endpoint,
        endpoint.api.reducerPath || 'unknown',
        duration,
        resultSize
      );

      console.debug(`✓ Warmed ${endpoint.name} in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.warmingStatus.failed++;
      this.warmingStatus.endpoints[index] = {
        ...this.warmingStatus.endpoints[index],
        completed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };

      console.error(`✗ Failed to warm ${endpoint.name}:`, error);
    }
  }

  stopWarming(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.warmingStatus.isRunning = false;
      this.warmingStatus.endTime = Date.now();
      console.log('Cache warming stopped');
    }
  }

  getStatus(): WarmingStatus {
    return { ...this.warmingStatus };
  }

  // Smart warming based on user patterns
  async smartWarm(dispatch: AppDispatch): Promise<void> {
    const analytics = cacheAnalytics.getAnalytics();
    
    // Get frequently accessed endpoints
    const frequentEndpoints = Object.entries(analytics.byEndpoint)
      .filter(([_, metrics]) => metrics.hits + metrics.misses > 10)
      .sort((a, b) => {
        const totalA = a[1].hits + a[1].misses;
        const totalB = b[1].hits + b[1].misses;
        return totalB - totalA;
      })
      .slice(0, 10);

    // Create warming endpoints from frequent accesses
    const smartEndpoints: WarmingEndpoint[] = frequentEndpoints.map(([key, metrics]) => {
      const [slice, endpoint] = key.split(':');
      
      // Map slice to API
      const apiMap: Record<string, any> = {
        userApi,
        authApi,
        trainingApi,
        calendarApi,
        medicalApi,
        communicationApi,
        statisticsApi,
        adminApi,
        paymentApi
      };

      return {
        name: `Smart: ${endpoint}`,
        api: apiMap[slice],
        endpoint,
        priority: metrics.hitRate > 80 ? 'high' : metrics.hitRate > 50 ? 'medium' : 'low'
      };
    }).filter(ep => {
      // Filter out unknown APIs and invalid endpoints
      const validation = this.validateEndpoint(ep);
      if (!validation.isValid) {
        console.debug(`Skipping smart endpoint ${ep.name}: ${validation.error}`);
        return false;
      }
      return true;
    });

    // Add smart endpoints to warming queue
    this.warmingEndpoints = [...this.warmingEndpoints, ...smartEndpoints];
    
    await this.startWarming(dispatch);
  }

  // Background refresh for important cached data
  startBackgroundRefresh(dispatch: AppDispatch, intervalMs: number = 300000): () => void {
    const refreshInterval = setInterval(async () => {
      const highPriorityEndpoints = this.warmingEndpoints.filter(
        ep => ep.priority === 'high' && (!ep.condition || ep.condition())
      );

      for (const endpoint of highPriorityEndpoints) {
        try {
          // Validate endpoint
          const validation = this.validateEndpoint(endpoint);
          if (!validation.isValid) {
            console.warn(`Skipping background refresh for ${endpoint.name}: ${validation.error}`);
            continue;
          }

          await dispatch(
            endpoint.api.endpoints[endpoint.endpoint].initiate(
              endpoint.args || {},
              { forceRefetch: true }
            )
          ).unwrap();

          cacheAnalytics.recordCacheUpdate(endpoint.endpoint, endpoint.api.reducerPath);
        } catch (error) {
          console.error(`Background refresh failed for ${endpoint.name}:`, error);
        }
      }
    }, intervalMs);

    // Return cleanup function
    return () => clearInterval(refreshInterval);
  }

  // Prefetch based on navigation patterns
  async prefetchForRoute(route: string, dispatch: AppDispatch): Promise<void> {
    const routePrefetchMap: Record<string, WarmingEndpoint[]> = {
      '/calendar': [
        {
          name: 'Calendar Events',
          api: calendarApi,
          endpoint: 'getEvents',
          args: {
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          priority: 'high'
        }
      ],
      '/training': [
        {
          name: 'Workout Sessions',
          api: trainingApi,
          endpoint: 'getWorkoutSessions',
          priority: 'high'
        }
      ],
      '/medical': [
        {
          name: 'Team Medical Stats',
          api: medicalApi,
          endpoint: 'getTeamMedicalStats',
          priority: 'high'
        },
        {
          name: 'All Injuries',
          api: medicalApi,
          endpoint: 'getAllInjuries',
          priority: 'medium'
        }
      ],
      '/messages': [
        {
          name: 'User Broadcasts',
          api: communicationApi,
          endpoint: 'getUserBroadcasts',
          priority: 'high'
        }
      ]
    };

    const endpointsToWarm = routePrefetchMap[route] || [];
    
    if (endpointsToWarm.length > 0) {
      console.log(`Prefetching ${endpointsToWarm.length} endpoints for route: ${route}`);
      
      // Filter out endpoints that don't have valid APIs
      const validEndpoints = endpointsToWarm.filter(endpoint => {
        const validation = this.validateEndpoint(endpoint);
        if (!validation.isValid) {
          console.warn(`Skipping prefetch for ${endpoint.name}: ${validation.error}`);
          return false;
        }
        return true;
      });

      if (validEndpoints.length > 0) {
        await Promise.all(
          validEndpoints.map(endpoint => this.warmEndpoint(endpoint, dispatch, 0))
        );
      }
    }
  }
}

// Export singleton instance methods
const warmingManager = CacheWarmingManager.getInstance();

export const startCacheWarming = (dispatch: AppDispatch) => 
  warmingManager.startWarming(dispatch);

export const stopCacheWarming = () => 
  warmingManager.stopWarming();

export const getCacheWarmingStatus = () => 
  warmingManager.getStatus();

export const startSmartWarming = (dispatch: AppDispatch) => 
  warmingManager.smartWarm(dispatch);

export const startBackgroundRefresh = (dispatch: AppDispatch, intervalMs?: number) => 
  warmingManager.startBackgroundRefresh(dispatch, intervalMs);

export const prefetchForRoute = (route: string, dispatch: AppDispatch) => 
  warmingManager.prefetchForRoute(route, dispatch);

// Auto-warm on app initialization
export const initializeCacheWarming = (dispatch: AppDispatch) => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.warn('Cache warming not available in this environment');
    return () => {}; // Return empty cleanup function
  }

  // Start warming after a short delay to not block initial render and ensure APIs are initialized
  const warmingTimeout = setTimeout(() => {
    try {
      // Double-check that we have a valid dispatch function
      if (typeof dispatch !== 'function') {
        console.error('Cache warming: Invalid dispatch function provided');
        return;
      }

      // Validate that critical APIs are initialized before warming
      const criticalApis = [authApi, userApi, calendarApi];
      const uninitializedApis = criticalApis.filter(api => !api || !api.endpoints);
      
      if (uninitializedApis.length > 0) {
        console.warn('Cache warming: Some APIs are not yet initialized, delaying warming...');
        // Try again after another delay
        setTimeout(() => {
          try {
            startCacheWarming(dispatch);
          } catch (retryError) {
            console.error('Cache warming: Failed after retry:', retryError);
          }
        }, 3000);
        return;
      }

      startCacheWarming(dispatch);
    } catch (error) {
      console.error('Failed to start cache warming:', error);
    }
  }, 2000);

  // Start background refresh for high-priority endpoints
  let cleanupBackground: (() => void) | null = null;
  const backgroundTimeout = setTimeout(() => {
    try {
      cleanupBackground = startBackgroundRefresh(dispatch);
    } catch (error) {
      console.error('Failed to start background refresh:', error);
    }
  }, 5000); // Start background refresh after cache warming

  // Return cleanup function that clears both timeouts and stops background refresh
  return () => {
    clearTimeout(warmingTimeout);
    clearTimeout(backgroundTimeout);
    if (cleanupBackground) {
      cleanupBackground();
    }
  };
};