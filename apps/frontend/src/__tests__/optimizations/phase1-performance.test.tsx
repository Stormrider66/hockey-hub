import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { PerformanceMonitor } from '../../components/performance/PerformanceMonitor';
import { PerformanceDashboard } from '../../components/performance/PerformanceDashboard';
import { useWebVitals } from '../../hooks/performance/useWebVitals';
import { performanceService } from '../../services/performance/performanceService';
import '@testing-library/jest-dom';

// Mock performance observer
class MockPerformanceObserver {
  callback: PerformanceObserverCallback;
  
  constructor(callback: PerformanceObserverCallback) {
    this.callback = callback;
  }
  
  observe() {
    // Simulate performance entries
    setTimeout(() => {
      this.callback(
        {
          getEntries: () => [
            {
              name: 'first-contentful-paint',
              entryType: 'paint',
              startTime: 0,
              duration: 1500,
            },
            {
              name: 'largest-contentful-paint',
              entryType: 'largest-contentful-paint',
              startTime: 0,
              duration: 2500,
            },
          ],
        } as any,
        this as any
      );
    }, 100);
  }
  
  disconnect() {}
}

(global as any).PerformanceObserver = MockPerformanceObserver;

// Mock navigation timing
Object.defineProperty(window.performance, 'timing', {
  writable: true,
  value: {
    navigationStart: 1000,
    loadEventEnd: 3000,
    domContentLoadedEventEnd: 2000,
  },
});

// Mock performance.measure
window.performance.measure = jest.fn().mockReturnValue({
  name: 'test-measure',
  entryType: 'measure',
  startTime: 0,
  duration: 100,
});

describe('Performance Monitoring - Phase 1 Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceService.clear();
  });

  describe('Web Vitals Tracking', () => {
    it('should track Core Web Vitals metrics', async () => {
      const onMetric = jest.fn();
      
      const TestComponent = () => {
        useWebVitals(onMetric);
        return <div>Test Component</div>;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(onMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'FCP',
            value: expect.any(Number),
            rating: expect.stringMatching(/good|needs-improvement|poor/),
          })
        );
      });

      expect(onMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'LCP',
          value: expect.any(Number),
          rating: expect.stringMatching(/good|needs-improvement|poor/),
        })
      );
    });

    it('should categorize performance ratings correctly', async () => {
      const metrics: any[] = [];
      
      const TestComponent = () => {
        useWebVitals((metric) => metrics.push(metric));
        return <div>Test</div>;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(metrics.length).toBeGreaterThan(0);
      });

      // Check FCP rating thresholds
      const fcpMetric = metrics.find(m => m.name === 'FCP');
      if (fcpMetric) {
        if (fcpMetric.value <= 1800) {
          expect(fcpMetric.rating).toBe('good');
        } else if (fcpMetric.value <= 3000) {
          expect(fcpMetric.rating).toBe('needs-improvement');
        } else {
          expect(fcpMetric.rating).toBe('poor');
        }
      }
    });

    it('should track Cumulative Layout Shift (CLS)', async () => {
      const onMetric = jest.fn();
      
      const TestComponent = () => {
        useWebVitals(onMetric);
        return <div>Test Component</div>;
      };

      render(<TestComponent />);

      // Simulate layout shift
      act(() => {
        const observer = new MockPerformanceObserver((list) => {});
        observer.callback(
          {
            getEntries: () => [{
              name: 'layout-shift',
              entryType: 'layout-shift',
              value: 0.05,
              hadRecentInput: false,
            }],
          } as any,
          observer as any
        );
      });

      await waitFor(() => {
        expect(onMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'CLS',
            value: expect.any(Number),
          })
        );
      });
    });

    it('should track First Input Delay (FID)', async () => {
      const onMetric = jest.fn();
      
      const TestComponent = () => {
        useWebVitals(onMetric);
        return <div>Test Component</div>;
      };

      render(<TestComponent />);

      // Simulate first input
      act(() => {
        const event = new Event('click');
        Object.defineProperty(event, 'timeStamp', { value: 2000 });
        document.dispatchEvent(event);
      });

      await waitFor(() => {
        expect(onMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'FID',
            value: expect.any(Number),
          })
        );
      }, { timeout: 2000 });
    });
  });

  describe('Performance Metrics Collection', () => {
    it('should collect and store performance metrics', () => {
      performanceService.recordMetric('custom-metric', 150, 'ms');
      performanceService.recordMetric('api-latency', 250, 'ms');
      
      const metrics = performanceService.getMetrics();
      
      expect(metrics).toHaveLength(2);
      expect(metrics[0]).toMatchObject({
        name: 'custom-metric',
        value: 150,
        unit: 'ms',
        timestamp: expect.any(Number),
      });
    });

    it('should calculate metric statistics', () => {
      // Record multiple values for the same metric
      for (let i = 0; i < 10; i++) {
        performanceService.recordMetric('response-time', 100 + i * 10, 'ms');
      }

      const stats = performanceService.getMetricStats('response-time');
      
      expect(stats).toMatchObject({
        count: 10,
        mean: 145,
        median: 145,
        min: 100,
        max: 190,
        p95: expect.any(Number),
        p99: expect.any(Number),
      });
    });

    it('should handle performance marks and measures', () => {
      performanceService.mark('operation-start');
      
      // Simulate some work
      const startTime = Date.now();
      while (Date.now() - startTime < 50) {
        // Busy wait
      }
      
      performanceService.mark('operation-end');
      const duration = performanceService.measure('operation', 'operation-start', 'operation-end');
      
      expect(duration).toBeGreaterThanOrEqual(50);
      expect(window.performance.measure).toHaveBeenCalledWith(
        'operation',
        'operation-start',
        'operation-end'
      );
    });
  });

  describe('Performance Dashboard', () => {
    it('should display real-time performance metrics', async () => {
      render(<PerformanceDashboard />);

      // Should show loading initially
      expect(screen.getByText(/Loading metrics/i)).toBeInTheDocument();

      // Simulate metrics update
      act(() => {
        performanceService.recordMetric('FCP', 1500, 'ms');
        performanceService.recordMetric('LCP', 2500, 'ms');
        performanceService.recordMetric('FID', 50, 'ms');
        performanceService.recordMetric('CLS', 0.05, 'score');
      });

      await waitFor(() => {
        expect(screen.getByText(/First Contentful Paint/i)).toBeInTheDocument();
        expect(screen.getByText(/1500/)).toBeInTheDocument();
        expect(screen.getByText(/Largest Contentful Paint/i)).toBeInTheDocument();
        expect(screen.getByText(/2500/)).toBeInTheDocument();
      });
    });

    it('should show performance trends over time', async () => {
      render(<PerformanceDashboard showTrends />);

      // Record metrics over time
      const intervals = [0, 100, 200, 300, 400];
      
      for (const delay of intervals) {
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, delay));
          performanceService.recordMetric('page-load', 2000 + Math.random() * 500, 'ms');
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('performance-trend-chart')).toBeInTheDocument();
      });
    });

    it('should categorize metrics by type', () => {
      render(<PerformanceDashboard />);

      act(() => {
        performanceService.recordMetric('FCP', 1500, 'ms', { category: 'webvitals' });
        performanceService.recordMetric('api-response', 200, 'ms', { category: 'api' });
        performanceService.recordMetric('db-query', 50, 'ms', { category: 'database' });
      });

      expect(screen.getByTestId('metrics-category-webvitals')).toBeInTheDocument();
      expect(screen.getByTestId('metrics-category-api')).toBeInTheDocument();
      expect(screen.getByTestId('metrics-category-database')).toBeInTheDocument();
    });
  });

  describe('Performance Alert Thresholds', () => {
    it('should trigger alerts when metrics exceed thresholds', async () => {
      const onAlert = jest.fn();
      
      const TestComponent = () => {
        const metrics = useWebVitals();
        
        React.useEffect(() => {
          if (metrics.LCP && metrics.LCP.value > 4000) {
            onAlert({
              metric: 'LCP',
              value: metrics.LCP.value,
              threshold: 4000,
              severity: 'high',
            });
          }
        }, [metrics]);
        
        return <div>Monitoring...</div>;
      };

      render(<TestComponent />);

      // Simulate poor LCP
      act(() => {
        const observer = new MockPerformanceObserver((list) => {});
        observer.callback(
          {
            getEntries: () => [{
              name: 'largest-contentful-paint',
              entryType: 'largest-contentful-paint',
              startTime: 0,
              duration: 5000,
            }],
          } as any,
          observer as any
        );
      });

      await waitFor(() => {
        expect(onAlert).toHaveBeenCalledWith({
          metric: 'LCP',
          value: expect.any(Number),
          threshold: 4000,
          severity: 'high',
        });
      });
    });

    it('should configure custom alert thresholds', () => {
      const monitor = render(
        <PerformanceMonitor
          thresholds={{
            FCP: { good: 1000, poor: 2000 },
            LCP: { good: 2000, poor: 3000 },
            FID: { good: 50, poor: 100 },
            CLS: { good: 0.05, poor: 0.1 },
          }}
        />
      );

      expect(monitor.container).toBeInTheDocument();
    });

    it('should batch alerts to prevent spam', async () => {
      const onAlert = jest.fn();
      let alertCount = 0;
      
      const TestComponent = () => {
        const { batchAlerts } = performanceService;
        
        React.useEffect(() => {
          const unsubscribe = batchAlerts((alerts) => {
            alertCount += alerts.length;
            onAlert(alerts);
          }, { interval: 1000 });
          
          // Trigger multiple alerts rapidly
          for (let i = 0; i < 10; i++) {
            performanceService.checkThreshold('test-metric', 5000, 1000);
          }
          
          return unsubscribe;
        }, []);
        
        return <div>Alert Test</div>;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(onAlert).toHaveBeenCalledTimes(1);
        expect(alertCount).toBe(10);
      }, { timeout: 1500 });
    });
  });

  describe('Performance Data Export', () => {
    it('should export performance metrics as CSV', () => {
      // Record some metrics
      performanceService.recordMetric('FCP', 1500, 'ms');
      performanceService.recordMetric('LCP', 2500, 'ms');
      performanceService.recordMetric('FID', 50, 'ms');
      
      const csv = performanceService.exportMetricsAsCSV();
      
      expect(csv).toContain('name,value,unit,timestamp');
      expect(csv).toContain('FCP,1500,ms,');
      expect(csv).toContain('LCP,2500,ms,');
      expect(csv).toContain('FID,50,ms,');
    });

    it('should export performance report as JSON', () => {
      performanceService.recordMetric('FCP', 1500, 'ms');
      performanceService.recordMetric('LCP', 2500, 'ms');
      
      const report = performanceService.generateReport();
      
      expect(report).toMatchObject({
        timestamp: expect.any(Number),
        duration: expect.any(Number),
        metrics: expect.arrayContaining([
          expect.objectContaining({ name: 'FCP', value: 1500 }),
          expect.objectContaining({ name: 'LCP', value: 2500 }),
        ]),
        summary: expect.objectContaining({
          totalMetrics: 2,
          categories: expect.any(Object),
        }),
      });
    });
  });

  describe('Memory Usage Monitoring', () => {
    it('should track memory usage if available', async () => {
      // Mock memory API
      Object.defineProperty(window.performance, 'memory', {
        writable: true,
        value: {
          usedJSHeapSize: 50 * 1024 * 1024, // 50MB
          totalJSHeapSize: 100 * 1024 * 1024, // 100MB
          jsHeapSizeLimit: 2048 * 1024 * 1024, // 2GB
        },
      });

      const onMemoryUpdate = jest.fn();
      
      const TestComponent = () => {
        const { memory } = useWebVitals();
        
        React.useEffect(() => {
          if (memory) {
            onMemoryUpdate(memory);
          }
        }, [memory]);
        
        return <div>Memory Monitor</div>;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(onMemoryUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            usedJSHeapSize: 50 * 1024 * 1024,
            totalJSHeapSize: 100 * 1024 * 1024,
            jsHeapSizeLimit: 2048 * 1024 * 1024,
          })
        );
      });
    });

    it('should detect memory leaks', async () => {
      const onMemoryLeak = jest.fn();
      
      // Simulate increasing memory usage
      let memoryUsage = 50 * 1024 * 1024;
      
      Object.defineProperty(window.performance, 'memory', {
        get() {
          memoryUsage += 10 * 1024 * 1024; // Increase by 10MB each access
          return {
            usedJSHeapSize: memoryUsage,
            totalJSHeapSize: 200 * 1024 * 1024,
            jsHeapSizeLimit: 2048 * 1024 * 1024,
          };
        },
      });

      const TestComponent = () => {
        performanceService.detectMemoryLeaks({
          threshold: 0.2, // 20% increase
          interval: 100,
          onLeak: onMemoryLeak,
        });
        
        return <div>Leak Detector</div>;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(onMemoryLeak).toHaveBeenCalledWith({
          previousUsage: expect.any(Number),
          currentUsage: expect.any(Number),
          increase: expect.any(Number),
          percentage: expect.any(Number),
        });
      }, { timeout: 500 });
    });
  });

  describe('Performance Budget Enforcement', () => {
    it('should enforce performance budgets', () => {
      const budgets = {
        FCP: 2000,
        LCP: 3000,
        bundleSize: 500 * 1024, // 500KB
      };

      const violations = performanceService.checkBudgets(budgets, {
        FCP: 2500,
        LCP: 2800,
        bundleSize: 600 * 1024,
      });

      expect(violations).toHaveLength(2);
      expect(violations).toContainEqual({
        metric: 'FCP',
        budget: 2000,
        actual: 2500,
        overBy: 500,
      });
      expect(violations).toContainEqual({
        metric: 'bundleSize',
        budget: 500 * 1024,
        actual: 600 * 1024,
        overBy: 100 * 1024,
      });
    });
  });
});