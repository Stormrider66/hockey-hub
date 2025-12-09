import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock components
const CacheAnalyticsDashboard = ({ analytics }: { analytics: CacheAnalytics }) => {
  return (
    <div>
      <h1>Cache Analytics Dashboard</h1>
      <div data-testid="hit-rate">{analytics.hitRate}%</div>
      <div data-testid="total-hits">{analytics.totalHits}</div>
      <div data-testid="total-misses">{analytics.totalMisses}</div>
      <div data-testid="cache-size">{analytics.cacheSize}</div>
      <div data-testid="eviction-count">{analytics.evictionCount}</div>
    </div>
  );
};

const CacheMetricsCollector = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Types
interface CacheAnalytics {
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  cacheSize: number;
  evictionCount: number;
  endpointMetrics: Record<string, EndpointMetrics>;
  performanceMetrics: PerformanceMetrics;
}

interface EndpointMetrics {
  hits: number;
  misses: number;
  avgResponseTime: number;
  lastAccessed: number;
  size: number;
}

interface PerformanceMetrics {
  avgCacheResponseTime: number;
  avgNetworkResponseTime: number;
  bandwidthSaved: number;
  requestsSaved: number;
}

// Cache Analytics Implementation
class CacheAnalyticsService {
  private metrics: CacheAnalytics = {
    hitRate: 0,
    totalHits: 0,
    totalMisses: 0,
    cacheSize: 0,
    evictionCount: 0,
    endpointMetrics: {},
    performanceMetrics: {
      avgCacheResponseTime: 0,
      avgNetworkResponseTime: 0,
      bandwidthSaved: 0,
      requestsSaved: 0,
    },
  };

  private responseTimes: { cache: number[]; network: number[] } = {
    cache: [],
    network: [],
  };

  recordCacheHit(endpoint: string, responseTime: number, size: number) {
    this.metrics.totalHits++;
    this.updateEndpointMetrics(endpoint, 'hit', responseTime, size);
    this.responseTimes.cache.push(responseTime);
    this.updateHitRate();
    this.updatePerformanceMetrics();
  }

  recordCacheMiss(endpoint: string, responseTime: number, size: number) {
    this.metrics.totalMisses++;
    this.updateEndpointMetrics(endpoint, 'miss', responseTime, size);
    this.responseTimes.network.push(responseTime);
    this.updateHitRate();
    this.updatePerformanceMetrics();
  }

  recordEviction(count: number = 1) {
    this.metrics.evictionCount += count;
  }

  updateCacheSize(size: number) {
    this.metrics.cacheSize = size;
  }

  private updateEndpointMetrics(
    endpoint: string,
    type: 'hit' | 'miss',
    responseTime: number,
    size: number
  ) {
    if (!this.metrics.endpointMetrics[endpoint]) {
      this.metrics.endpointMetrics[endpoint] = {
        hits: 0,
        misses: 0,
        avgResponseTime: 0,
        lastAccessed: Date.now(),
        size: 0,
      };
    }

    const metrics = this.metrics.endpointMetrics[endpoint];
    if (type === 'hit') {
      metrics.hits++;
    } else {
      metrics.misses++;
    }

    // Update average response time
    const totalRequests = metrics.hits + metrics.misses;
    metrics.avgResponseTime =
      (metrics.avgResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
    
    metrics.lastAccessed = Date.now();
    metrics.size = size;
  }

  private updateHitRate() {
    const total = this.metrics.totalHits + this.metrics.totalMisses;
    this.metrics.hitRate = total > 0
      ? Math.round((this.metrics.totalHits / total) * 100)
      : 0;
  }

  private updatePerformanceMetrics() {
    const perf = this.metrics.performanceMetrics;

    // Calculate average response times
    if (this.responseTimes.cache.length > 0) {
      perf.avgCacheResponseTime =
        this.responseTimes.cache.reduce((a, b) => a + b, 0) /
        this.responseTimes.cache.length;
    }

    if (this.responseTimes.network.length > 0) {
      perf.avgNetworkResponseTime =
        this.responseTimes.network.reduce((a, b) => a + b, 0) /
        this.responseTimes.network.length;
    }

    // Calculate bandwidth saved (approximate)
    perf.bandwidthSaved = Object.values(this.metrics.endpointMetrics).reduce(
      (total, metric) => total + metric.hits * metric.size,
      0
    );

    perf.requestsSaved = this.metrics.totalHits;
  }

  getMetrics(): CacheAnalytics {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      hitRate: 0,
      totalHits: 0,
      totalMisses: 0,
      cacheSize: 0,
      evictionCount: 0,
      endpointMetrics: {},
      performanceMetrics: {
        avgCacheResponseTime: 0,
        avgNetworkResponseTime: 0,
        bandwidthSaved: 0,
        requestsSaved: 0,
      },
    };
    this.responseTimes = { cache: [], network: [] };
  }
}

// Test server
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Cache Analytics', () => {
  let analyticsService: CacheAnalyticsService;

  beforeEach(() => {
    analyticsService = new CacheAnalyticsService();
  });

  describe('Hit/Miss Tracking', () => {
    test('should track cache hits correctly', () => {
      analyticsService.recordCacheHit('/api/users', 10, 1024);
      analyticsService.recordCacheHit('/api/users', 12, 1024);
      analyticsService.recordCacheHit('/api/posts', 8, 2048);

      const metrics = analyticsService.getMetrics();
      expect(metrics.totalHits).toBe(3);
      expect(metrics.hitRate).toBe(100);
      expect(metrics.endpointMetrics['/api/users'].hits).toBe(2);
      expect(metrics.endpointMetrics['/api/posts'].hits).toBe(1);
    });

    test('should track cache misses correctly', () => {
      analyticsService.recordCacheMiss('/api/users', 100, 1024);
      analyticsService.recordCacheMiss('/api/posts', 150, 2048);

      const metrics = analyticsService.getMetrics();
      expect(metrics.totalMisses).toBe(2);
      expect(metrics.hitRate).toBe(0);
      expect(metrics.endpointMetrics['/api/users'].misses).toBe(1);
    });

    test('should calculate hit rate accurately', () => {
      // 3 hits, 2 misses = 60% hit rate
      analyticsService.recordCacheHit('/api/users', 10, 1024);
      analyticsService.recordCacheHit('/api/users', 12, 1024);
      analyticsService.recordCacheHit('/api/posts', 8, 2048);
      analyticsService.recordCacheMiss('/api/users', 100, 1024);
      analyticsService.recordCacheMiss('/api/posts', 150, 2048);

      const metrics = analyticsService.getMetrics();
      expect(metrics.hitRate).toBe(60);
    });

    test('should track endpoint-specific metrics', () => {
      // Multiple requests to same endpoint
      analyticsService.recordCacheHit('/api/users', 10, 1024);
      analyticsService.recordCacheMiss('/api/users', 100, 1024);
      analyticsService.recordCacheHit('/api/users', 15, 1024);

      const metrics = analyticsService.getMetrics();
      const userMetrics = metrics.endpointMetrics['/api/users'];

      expect(userMetrics.hits).toBe(2);
      expect(userMetrics.misses).toBe(1);
      expect(userMetrics.avgResponseTime).toBeCloseTo(41.67, 1); // (10 + 100 + 15) / 3
      expect(userMetrics.size).toBe(1024);
    });
  });

  describe('Performance Metrics', () => {
    test('should calculate average response times', () => {
      // Cache hits (fast)
      analyticsService.recordCacheHit('/api/users', 5, 1024);
      analyticsService.recordCacheHit('/api/posts', 7, 2048);
      analyticsService.recordCacheHit('/api/comments', 6, 512);

      // Cache misses (slow)
      analyticsService.recordCacheMiss('/api/users', 100, 1024);
      analyticsService.recordCacheMiss('/api/posts', 120, 2048);

      const metrics = analyticsService.getMetrics();
      expect(metrics.performanceMetrics.avgCacheResponseTime).toBe(6); // (5 + 7 + 6) / 3
      expect(metrics.performanceMetrics.avgNetworkResponseTime).toBe(110); // (100 + 120) / 2
    });

    test('should calculate bandwidth saved', () => {
      // Each hit saves bandwidth equal to response size
      analyticsService.recordCacheHit('/api/users', 5, 1024); // Saves 1024 bytes
      analyticsService.recordCacheHit('/api/users', 6, 1024); // Saves 1024 bytes
      analyticsService.recordCacheHit('/api/posts', 7, 2048); // Saves 2048 bytes

      const metrics = analyticsService.getMetrics();
      expect(metrics.performanceMetrics.bandwidthSaved).toBe(4096); // 1024 * 2 + 2048
      expect(metrics.performanceMetrics.requestsSaved).toBe(3);
    });

    test('should track cache size and evictions', () => {
      analyticsService.updateCacheSize(1024 * 1024); // 1MB
      analyticsService.recordEviction(5);

      const metrics = analyticsService.getMetrics();
      expect(metrics.cacheSize).toBe(1024 * 1024);
      expect(metrics.evictionCount).toBe(5);
    });
  });

  describe('Cache Warming', () => {
    test('should identify candidates for cache warming', () => {
      // Simulate traffic patterns
      const endpoints = [
        { path: '/api/users', hits: 100, misses: 5 },
        { path: '/api/posts', hits: 80, misses: 20 },
        { path: '/api/comments', hits: 10, misses: 90 },
        { path: '/api/profile', hits: 95, misses: 5 },
      ];

      endpoints.forEach(({ path, hits, misses }) => {
        for (let i = 0; i < hits; i++) {
          analyticsService.recordCacheHit(path, 10, 1024);
        }
        for (let i = 0; i < misses; i++) {
          analyticsService.recordCacheMiss(path, 100, 1024);
        }
      });

      const metrics = analyticsService.getMetrics();
      
      // Identify high-value cache warming candidates
      const warmingCandidates = Object.entries(metrics.endpointMetrics)
        .filter(([_, metric]) => {
          const hitRate = metric.hits / (metric.hits + metric.misses);
          return hitRate > 0.8; // High hit rate endpoints
        })
        .map(([endpoint]) => endpoint);

      expect(warmingCandidates).toContain('/api/users');
      expect(warmingCandidates).toContain('/api/profile');
      expect(warmingCandidates).not.toContain('/api/comments');
    });

    test('should implement cache warming functionality', async () => {
      const cache = new Map<string, any>();
      
      const warmCache = async (endpoints: string[]) => {
        const warmingPromises = endpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint);
            const data = await response.json();
            cache.set(endpoint, {
              data,
              timestamp: Date.now(),
              size: JSON.stringify(data).length,
            });
            return { endpoint, success: true };
          } catch (error) {
            return { endpoint, success: false, error };
          }
        });

        return Promise.all(warmingPromises);
      };

      server.use(
        rest.get('/api/users', (req, res, ctx) => 
          res(ctx.json({ users: ['user1', 'user2'] }))
        ),
        rest.get('/api/posts', (req, res, ctx) => 
          res(ctx.json({ posts: ['post1', 'post2'] }))
        ),
        rest.get('/api/error', (req, res, ctx) => 
          res(ctx.status(500))
        )
      );

      const results = await warmCache(['/api/users', '/api/posts', '/api/error']);

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(false);

      expect(cache.has('/api/users')).toBe(true);
      expect(cache.has('/api/posts')).toBe(true);
      expect(cache.has('/api/error')).toBe(false);
    });
  });

  describe('Dashboard Component', () => {
    test('should display cache analytics correctly', () => {
      const mockAnalytics: CacheAnalytics = {
        hitRate: 75,
        totalHits: 300,
        totalMisses: 100,
        cacheSize: 1024 * 1024 * 5, // 5MB
        evictionCount: 25,
        endpointMetrics: {},
        performanceMetrics: {
          avgCacheResponseTime: 15,
          avgNetworkResponseTime: 150,
          bandwidthSaved: 1024 * 1024 * 10, // 10MB
          requestsSaved: 300,
        },
      };

      render(<CacheAnalyticsDashboard analytics={mockAnalytics} />);

      expect(screen.getByTestId('hit-rate')).toHaveTextContent('75%');
      expect(screen.getByTestId('total-hits')).toHaveTextContent('300');
      expect(screen.getByTestId('total-misses')).toHaveTextContent('100');
      expect(screen.getByTestId('cache-size')).toHaveTextContent('5242880');
      expect(screen.getByTestId('eviction-count')).toHaveTextContent('25');
    });
  });

  describe('Real-time Updates', () => {
    test('should update metrics in real-time', async () => {
      const MetricsProvider = ({ children }: { children: React.ReactNode }) => {
        const [metrics, setMetrics] = React.useState(analyticsService.getMetrics());

        React.useEffect(() => {
          const interval = setInterval(() => {
            setMetrics(analyticsService.getMetrics());
          }, 100);

          return () => clearInterval(interval);
        }, []);

        return (
          <div>
            {children}
            <div data-testid="live-hit-rate">{metrics.hitRate}%</div>
          </div>
        );
      };

      const { rerender } = render(
        <MetricsProvider>
          <div>Real-time metrics</div>
        </MetricsProvider>
      );

      // Initial state
      expect(screen.getByTestId('live-hit-rate')).toHaveTextContent('0%');

      // Simulate cache activity
      analyticsService.recordCacheHit('/api/test', 10, 100);
      analyticsService.recordCacheHit('/api/test', 12, 100);

      // Wait for update
      await waitFor(() => {
        expect(screen.getByTestId('live-hit-rate')).toHaveTextContent('100%');
      });

      // Add misses
      analyticsService.recordCacheMiss('/api/test', 100, 100);
      analyticsService.recordCacheMiss('/api/test', 120, 100);

      // Wait for update
      await waitFor(() => {
        expect(screen.getByTestId('live-hit-rate')).toHaveTextContent('50%');
      });
    });
  });

  describe('Cache Strategy Recommendations', () => {
    test('should recommend cache strategies based on patterns', () => {
      interface CacheRecommendation {
        endpoint: string;
        strategy: 'aggressive' | 'moderate' | 'minimal' | 'no-cache';
        reason: string;
        ttl?: number;
      }

      const generateRecommendations = (
        metrics: CacheAnalytics
      ): CacheRecommendation[] => {
        return Object.entries(metrics.endpointMetrics).map(([endpoint, metric]) => {
          const hitRate = metric.hits / (metric.hits + metric.misses);
          const totalRequests = metric.hits + metric.misses;

          if (hitRate > 0.9 && totalRequests > 50) {
            return {
              endpoint,
              strategy: 'aggressive',
              reason: 'High hit rate with significant traffic',
              ttl: 3600, // 1 hour
            };
          } else if (hitRate > 0.7) {
            return {
              endpoint,
              strategy: 'moderate',
              reason: 'Good hit rate, moderate caching beneficial',
              ttl: 900, // 15 minutes
            };
          } else if (hitRate > 0.3) {
            return {
              endpoint,
              strategy: 'minimal',
              reason: 'Low hit rate, limited caching benefit',
              ttl: 300, // 5 minutes
            };
          } else {
            return {
              endpoint,
              strategy: 'no-cache',
              reason: 'Very low hit rate, caching not recommended',
            };
          }
        });
      };

      // Simulate different patterns
      analyticsService.recordCacheHit('/api/static', 10, 1024);
      for (let i = 0; i < 99; i++) {
        analyticsService.recordCacheHit('/api/static', 10, 1024);
      }

      for (let i = 0; i < 30; i++) {
        analyticsService.recordCacheHit('/api/dynamic', 10, 1024);
      }
      for (let i = 0; i < 20; i++) {
        analyticsService.recordCacheMiss('/api/dynamic', 100, 1024);
      }

      const recommendations = generateRecommendations(analyticsService.getMetrics());

      const staticRec = recommendations.find(r => r.endpoint === '/api/static');
      const dynamicRec = recommendations.find(r => r.endpoint === '/api/dynamic');

      expect(staticRec?.strategy).toBe('aggressive');
      expect(staticRec?.ttl).toBe(3600);
      expect(dynamicRec?.strategy).toBe('moderate');
      expect(dynamicRec?.ttl).toBe(900);
    });
  });
});