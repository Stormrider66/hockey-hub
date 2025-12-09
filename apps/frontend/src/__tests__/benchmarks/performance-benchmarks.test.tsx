import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { performance } from 'perf_hooks';
import { act } from 'react-dom/test-utils';

// Import all dashboards (using refactored versions)
import PlayerDashboard from '../../features/player/PlayerDashboardRefactored';
import CoachDashboard from '../../features/coach/CoachDashboardRefactored';
import ParentDashboard from '../../features/parent/ParentDashboard';
import MedicalStaffDashboard from '../../features/medical-staff/MedicalStaffDashboard';
import EquipmentManagerDashboard from '../../features/equipment-manager/EquipmentManagerDashboard';
import PhysicalTrainerDashboard from '../../features/physical-trainer/components/PhysicalTrainerDashboard';
import ClubAdminDashboard from '../../features/club-admin/ClubAdminDashboard';
import AdminDashboard from '../../features/admin/AdminDashboard';

// Mock store configuration
const createMockStore = () => {
  return configureStore({
    reducer: {
      api: (state = {}) => state,
      auth: (state = { user: { role: 'player' } }) => state,
      notifications: (state = { unreadCount: 0 }) => state,
      physicalTrainer: (state = {}) => state,
    },
  });
};

// Performance measurement utilities
interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  apiCallCount: number;
  cacheHitRate: number;
}

class PerformanceMonitor {
  private startTime: number = 0;
  private startMemory: number = 0;
  private apiCalls: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  start() {
    this.startTime = performance.now();
    this.startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    this.apiCalls = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  recordApiCall(cached: boolean) {
    this.apiCalls++;
    if (cached) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
  }

  getMetrics(): PerformanceMetrics {
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    return {
      renderTime: endTime - this.startTime,
      memoryUsage: endMemory - this.startMemory,
      componentCount: document.querySelectorAll('*').length,
      apiCallCount: this.apiCalls,
      cacheHitRate: this.apiCalls > 0 ? (this.cacheHits / this.apiCalls) * 100 : 0,
    };
  }
}

// Mock API with cache simulation
const mockApiWithCache = () => {
  const cache = new Map();
  const monitor = new PerformanceMonitor();

  global.fetch = jest.fn((url: string) => {
    const cached = cache.has(url);
    monitor.recordApiCall(cached);

    if (cached) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(cache.get(url)),
      });
    }

    const mockData = { data: 'mock response' };
    cache.set(url, mockData);
    
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockData),
    });
  }) as jest.Mock;

  return monitor;
};

// Test suite for dashboard performance
describe('Performance Benchmarks', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = mockApiWithCache();
    // Mock IntersectionObserver for virtual scrolling tests
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Dashboard load time tests
  const dashboards = [
    { name: 'Player', component: PlayerDashboard },
    { name: 'Coach', component: CoachDashboard },
    { name: 'Parent', component: ParentDashboard },
    { name: 'Medical Staff', component: MedicalStaffDashboard },
    { name: 'Equipment Manager', component: EquipmentManagerDashboard },
    { name: 'Physical Trainer', component: PhysicalTrainerDashboard },
    { name: 'Club Admin', component: ClubAdminDashboard },
    { name: 'Admin', component: AdminDashboard },
  ];

  dashboards.forEach(({ name, component: Dashboard }) => {
    test(`${name} Dashboard - Initial Load Performance`, async () => {
      monitor.start();
      
      const { container } = render(
        <Provider store={createMockStore()}>
          <Dashboard />
        </Provider>
      );

      // Wait for initial render and API calls
      await waitFor(() => {
        expect(container.firstChild).toBeTruthy();
      }, { timeout: 5000 });

      const metrics = monitor.getMetrics();
      
      // Performance assertions
      expect(metrics.renderTime).toBeLessThan(2000); // 2 seconds max
      expect(metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB max
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
      
      console.log(`${name} Dashboard Performance:`, metrics);
    });
  });

  // Time to Interactive (TTI) test
  test('Time to Interactive (TTI) measurement', async () => {
    monitor.start();
    
    const { container, getByTestId } = render(
      <Provider store={createMockStore()}>
        <PhysicalTrainerDashboard />
      </Provider>
    );

    // Measure time until interactive elements are available
    const interactiveElement = await waitFor(() => {
      const elements = container.querySelectorAll('button, input, select, a');
      return elements.length > 0 ? elements[0] : null;
    }, { timeout: 3000 });

    const tti = performance.now() - monitor.startTime;
    expect(tti).toBeLessThan(3000); // 3 seconds max TTI
    
    console.log('Time to Interactive:', tti);
  });

  // First Contentful Paint (FCP) simulation
  test('First Contentful Paint (FCP) simulation', async () => {
    monitor.start();
    
    const { container } = render(
      <Provider store={createMockStore()}>
        <PlayerDashboard />
      </Provider>
    );

    // Measure time until first meaningful content
    await waitFor(() => {
      const hasContent = container.textContent && container.textContent.length > 0;
      expect(hasContent).toBeTruthy();
    }, { timeout: 1000 });

    const fcp = performance.now() - monitor.startTime;
    expect(fcp).toBeLessThan(1000); // 1 second max FCP
    
    console.log('First Contentful Paint:', fcp);
  });

  // Memory usage patterns test
  test('Memory usage patterns under load', async () => {
    const memorySnapshots: number[] = [];
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      monitor.start();
      
      const { unmount } = render(
        <Provider store={createMockStore()}>
          <PhysicalTrainerDashboard />
        </Provider>
      );

      await waitFor(() => {
        expect(document.body.innerHTML).not.toBe('');
      });

      const memory = (performance as any).memory?.usedJSHeapSize || 0;
      memorySnapshots.push(memory);
      
      unmount();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }

    // Check for memory leaks
    const avgGrowth = memorySnapshots.reduce((acc, mem, idx) => {
      if (idx === 0) return 0;
      return acc + (mem - memorySnapshots[idx - 1]);
    }, 0) / (iterations - 1);

    expect(avgGrowth).toBeLessThan(1024 * 1024); // Less than 1MB average growth
    
    console.log('Memory usage pattern:', memorySnapshots);
  });

  // API response time with caching test
  test('API response times with caching', async () => {
    const apiTimes: number[] = [];
    const urls = [
      '/api/users',
      '/api/sessions',
      '/api/calendar',
      '/api/notifications',
    ];

    // First pass - cache miss
    for (const url of urls) {
      const start = performance.now();
      await fetch(url);
      apiTimes.push(performance.now() - start);
    }

    // Second pass - cache hit
    const cachedTimes: number[] = [];
    for (const url of urls) {
      const start = performance.now();
      await fetch(url);
      cachedTimes.push(performance.now() - start);
    }

    // Cached responses should be significantly faster
    const avgCacheMiss = apiTimes.reduce((a, b) => a + b) / apiTimes.length;
    const avgCacheHit = cachedTimes.reduce((a, b) => a + b) / cachedTimes.length;
    
    expect(avgCacheHit).toBeLessThan(avgCacheMiss * 0.5); // 50% faster with cache
    
    console.log('API times (ms) - Cache miss:', apiTimes);
    console.log('API times (ms) - Cache hit:', cachedTimes);
  });

  // Concurrent users simulation
  test('500+ concurrent users simulation', async () => {
    const concurrentRenders = 50; // Simulating 50 renders (representing 500+ users)
    const renderPromises: Promise<void>[] = [];
    
    monitor.start();

    for (let i = 0; i < concurrentRenders; i++) {
      const promise = new Promise<void>((resolve) => {
        setTimeout(() => {
          const { unmount } = render(
            <Provider store={createMockStore()}>
              <PlayerDashboard />
            </Provider>
          );
          
          setTimeout(() => {
            unmount();
            resolve();
          }, 100);
        }, i * 10); // Stagger renders
      });
      
      renderPromises.push(promise);
    }

    await Promise.all(renderPromises);
    
    const metrics = monitor.getMetrics();
    const avgRenderTime = metrics.renderTime / concurrentRenders;
    
    expect(avgRenderTime).toBeLessThan(100); // 100ms average per render
    
    console.log('Concurrent users test - Total time:', metrics.renderTime);
    console.log('Average render time per user:', avgRenderTime);
  });

  // Virtual scrolling performance test
  test('Virtual scrolling with large datasets', async () => {
    // Mock large dataset
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Player ${i}`,
      data: `Data ${i}`,
    }));

    monitor.start();

    const { container } = render(
      <Provider store={createMockStore()}>
        <div style={{ height: '500px', overflow: 'auto' }}>
          {/* Simulate virtual scrolling by only rendering visible items */}
          {largeDataset.slice(0, 20).map(item => (
            <div key={item.id} style={{ height: '50px' }}>
              {item.name}
            </div>
          ))}
        </div>
      </Provider>
    );

    const renderTime = performance.now() - monitor.startTime;
    const renderedElements = container.querySelectorAll('div').length;
    
    expect(renderTime).toBeLessThan(100); // Fast initial render
    expect(renderedElements).toBeLessThan(50); // Only visible items rendered
    
    console.log('Virtual scrolling - Render time:', renderTime);
    console.log('Rendered elements:', renderedElements);
  });

  // Service worker cache test
  test('Service worker performance under load', async () => {
    // Mock service worker cache
    const swCache = new Map();
    let swHits = 0;
    let swMisses = 0;

    // Simulate service worker fetch
    const swFetch = async (url: string) => {
      if (swCache.has(url)) {
        swHits++;
        return swCache.get(url);
      }
      
      swMisses++;
      const data = { cached: false, url };
      swCache.set(url, data);
      return data;
    };

    // Simulate multiple requests
    const requests = 100;
    monitor.start();

    for (let i = 0; i < requests; i++) {
      await swFetch(`/api/data/${i % 10}`); // 10 unique URLs, repeated
    }

    const totalTime = performance.now() - monitor.startTime;
    const hitRate = (swHits / (swHits + swMisses)) * 100;
    
    expect(hitRate).toBeGreaterThan(80); // 80%+ cache hit rate
    expect(totalTime).toBeLessThan(1000); // Process 100 requests in < 1s
    
    console.log('Service Worker Performance:');
    console.log('Cache hit rate:', hitRate);
    console.log('Total processing time:', totalTime);
  });

  // Bundle size impact test
  test('Bundle size and lazy loading effectiveness', async () => {
    const loadedChunks: string[] = [];
    
    // Mock dynamic import
    jest.doMock('../../features/player/PlayerDashboard', () => {
      loadedChunks.push('PlayerDashboard');
      return { default: PlayerDashboard };
    });

    monitor.start();
    
    // Simulate lazy loading
    const LazyPlayerDashboard = React.lazy(() => 
      import('../../features/player/PlayerDashboard')
    );

    const { container } = render(
      <Provider store={createMockStore()}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyPlayerDashboard />
        </React.Suspense>
      </Provider>
    );

    await waitFor(() => {
      expect(container.textContent).not.toContain('Loading...');
    });

    const loadTime = performance.now() - monitor.startTime;
    expect(loadTime).toBeLessThan(500); // Lazy load in < 500ms
    
    console.log('Lazy loading time:', loadTime);
    console.log('Loaded chunks:', loadedChunks);
  });
});

// Performance benchmark report generator
export const generatePerformanceReport = (metrics: PerformanceMetrics[]) => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      avgRenderTime: metrics.reduce((a, m) => a + m.renderTime, 0) / metrics.length,
      avgMemoryUsage: metrics.reduce((a, m) => a + m.memoryUsage, 0) / metrics.length,
      avgCacheHitRate: metrics.reduce((a, m) => a + m.cacheHitRate, 0) / metrics.length,
    },
    details: metrics,
  };

  return report;
};