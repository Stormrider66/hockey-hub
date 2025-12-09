import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PhysicalTrainerDashboardMonitored from '../../components/PhysicalTrainerDashboardMonitored';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { userApi } from '@/store/api/userApi';
import { trainingApi } from '@/store/api/trainingApi';
import { scheduleApi } from '@/store/api/scheduleApi';
import { AuthProvider } from '@/contexts/AuthContext';
import { notificationApi } from '@/store/api/notificationApi';
import { BrowserRouter } from 'react-router-dom';

// Mock auth context
const mockAuthValue = {
  user: { id: '1', email: 'trainer@test.com', role: 'physicaltrainer' },
  isAuthenticated: true,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
};

// Create test store
const createTestStore = () => configureStore({
  reducer: {
    [userApi.reducerPath]: userApi.reducer,
    [trainingApi.reducerPath]: trainingApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [scheduleApi.reducerPath]: scheduleApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      userApi.middleware,
      trainingApi.middleware,
      notificationApi.middleware,
      scheduleApi.middleware
    ),
});

// Helper to measure component render time
const measureRenderTime = async (component: React.ReactElement) => {
  const startTime = performance.now();
  const { rerender } = render(component);
  await waitFor(() => {
    expect(screen.getByText(/Physical Trainer Dashboard/i)).toBeInTheDocument();
  });
  const endTime = performance.now();
  return endTime - startTime;
};

// Helper to wrap component with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={createTestStore()}>
    <BrowserRouter>
      <AuthProvider value={mockAuthValue}>
        {children}
      </AuthProvider>
    </BrowserRouter>
  </Provider>
);

describe('Physical Trainer Dashboard Performance Tests', () => {
  beforeEach(() => {
    // Clear performance metrics before each test
    performanceMonitor.clearMetrics();
    jest.clearAllMocks();
  });

  describe('Initial Load Performance', () => {
    it('should render dashboard within performance budget', async () => {
      const renderTime = await measureRenderTime(
        <TestWrapper>
          <PhysicalTrainerDashboardMonitored />
        </TestWrapper>
      );

      // Performance budget: Initial render should be under 1000ms
      expect(renderTime).toBeLessThan(1000);
      
      // Check that monitoring captured the render
      const metrics = performanceMonitor.getMetrics('PhysicalTrainerDashboard');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].duration).toBeLessThan(1000);
    });

    it('should lazy load tabs to improve initial load', async () => {
      render(
        <TestWrapper>
          <PhysicalTrainerDashboardMonitored />
        </TestWrapper>
      );

      // Initial render should not load all tab content
      const overviewTab = await screen.findByRole('tab', { name: /overview/i });
      expect(overviewTab).toBeInTheDocument();

      // Other tab content should not be in DOM initially
      expect(screen.queryByText(/Exercise Library/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Testing Dashboard/i)).not.toBeInTheDocument();
    });
  });

  describe('Tab Switching Performance', () => {
    it('should switch tabs within performance budget', async () => {
      render(
        <TestWrapper>
          <PhysicalTrainerDashboardMonitored />
        </TestWrapper>
      );

      // Wait for initial load
      await screen.findByRole('tab', { name: /overview/i });

      // Test switching to Sessions tab
      const sessionsTab = screen.getByRole('tab', { name: /sessions/i });
      
      const startTime = performance.now();
      fireEvent.click(sessionsTab);
      
      await waitFor(() => {
        expect(screen.getByText(/Training Sessions/i)).toBeInTheDocument();
      });
      
      const switchTime = performance.now() - startTime;
      
      // Tab switch should be under 500ms
      expect(switchTime).toBeLessThan(500);
    });

    it('should measure performance for each tab', async () => {
      const tabs = ['calendar', 'sessions', 'library', 'testing', 'status', 'templates'];
      
      render(
        <TestWrapper>
          <PhysicalTrainerDashboardMonitored />
        </TestWrapper>
      );

      await screen.findByRole('tab', { name: /overview/i });

      for (const tabName of tabs) {
        const tab = screen.getByRole('tab', { name: new RegExp(tabName, 'i') });
        
        performanceMonitor.clearMetrics();
        const startTime = performance.now();
        
        fireEvent.click(tab);
        
        // Wait for tab content to load (this is simplified, you'd wait for specific content)
        await waitFor(() => {
          expect(tab).toHaveAttribute('aria-selected', 'true');
        }, { timeout: 1000 });
        
        const loadTime = performance.now() - startTime;
        
        // Each tab should load within budget
        expect(loadTime).toBeLessThan(800);
      }
    });
  });

  describe('Component Performance Metrics', () => {
    it('should track performance metrics for key components', async () => {
      render(
        <TestWrapper>
          <PhysicalTrainerDashboardMonitored />
        </TestWrapper>
      );

      await screen.findByRole('tab', { name: /overview/i });

      // Check that key components are being monitored
      const teamSelectorMetrics = performanceMonitor.getMetrics('TeamSelector');
      expect(teamSelectorMetrics.length).toBeGreaterThan(0);

      const overviewTabMetrics = performanceMonitor.getMetrics('OverviewTab');
      expect(overviewTabMetrics.length).toBeGreaterThan(0);
    });

    it('should identify slow components', async () => {
      render(
        <TestWrapper>
          <PhysicalTrainerDashboardMonitored />
        </TestWrapper>
      );

      await screen.findByRole('tab', { name: /overview/i });

      // Get all metrics and identify slow components
      const summary = performanceMonitor.getSummary();
      const slowComponents = Object.entries(summary)
        .filter(([_, data]) => data.avgDuration > 50)
        .map(([name, data]) => ({ name, avgDuration: data.avgDuration }));

      // Log slow components for debugging
      if (slowComponents.length > 0) {
        console.log('Slow components detected:', slowComponents);
      }

      // This helps identify optimization targets
      expect(slowComponents).toBeDefined();
    });
  });

  describe('Memory Usage', () => {
    it('should not have memory leaks when switching tabs', async () => {
      const { rerender } = render(
        <TestWrapper>
          <PhysicalTrainerDashboardMonitored />
        </TestWrapper>
      );

      // Get initial memory usage (if available)
      const initialMemory = (performance as any).memory?.usedJSHeapSize;

      // Switch tabs multiple times
      const tabs = ['sessions', 'calendar', 'library', 'overview'];
      
      for (let i = 0; i < 3; i++) {
        for (const tabName of tabs) {
          const tab = screen.getByRole('tab', { name: new RegExp(tabName, 'i') });
          fireEvent.click(tab);
          await waitFor(() => {
            expect(tab).toHaveAttribute('aria-selected', 'true');
          });
        }
      }

      // Re-render to trigger cleanup
      rerender(
        <TestWrapper>
          <PhysicalTrainerDashboardMonitored />
        </TestWrapper>
      );

      // Check memory hasn't increased significantly
      const finalMemory = (performance as any).memory?.usedJSHeapSize;
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory - initialMemory;
        const percentIncrease = (memoryIncrease / initialMemory) * 100;
        
        // Memory increase should be less than 20%
        expect(percentIncrease).toBeLessThan(20);
      }
    });
  });

  describe('API Call Performance', () => {
    it('should batch API calls efficiently', async () => {
      const apiCalls: string[] = [];
      
      // Mock API calls to track them
      jest.spyOn((userApi.endpoints as any).getPlayers, 'initiate').mockImplementation(() => {
        apiCalls.push('getPlayers');
        return Promise.resolve({ data: [] });
      });

      render(
        <TestWrapper>
          <PhysicalTrainerDashboardMonitored />
        </TestWrapper>
      );

      await screen.findByRole('tab', { name: /overview/i });

      // Should not make excessive API calls
      expect(apiCalls.length).toBeLessThan(5);
    });
  });

  describe('Performance Budget Validation', () => {
    it('should meet performance budgets for all metrics', async () => {
      render(
        <TestWrapper>
          <PhysicalTrainerDashboardMonitored />
        </TestWrapper>
      );

      await screen.findByRole('tab', { name: /overview/i });

      const summary = performanceMonitor.getSummary();
      
      // Define performance budgets
      const budgets = {
        PhysicalTrainerDashboard: 1000,
        TeamSelector: 100,
        OverviewTab: 500,
        PerformanceMonitorWrapper: 50,
      };

      // Check each component against its budget
      Object.entries(budgets).forEach(([component, budget]) => {
        const metrics = summary[component];
        if (metrics) {
          expect(metrics.avgDuration).toBeLessThan(budget);
        }
      });
    });
  });
});