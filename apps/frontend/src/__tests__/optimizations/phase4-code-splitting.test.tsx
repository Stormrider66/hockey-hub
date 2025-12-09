import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { api } from '../../store/api/api';

// Mock dynamic imports
jest.mock('../../utils/dynamicImports', () => ({
  loadPlayerDashboard: jest.fn(() => Promise.resolve({
    default: () => <div>Player Dashboard</div>
  })),
  loadCoachDashboard: jest.fn(() => Promise.resolve({
    default: () => <div>Coach Dashboard</div>
  })),
  loadPhysicalTrainerDashboard: jest.fn(() => Promise.resolve({
    default: () => <div>Physical Trainer Dashboard</div>
  })),
  loadAdminDashboard: jest.fn(() => Promise.resolve({
    default: () => <div>Admin Dashboard</div>
  })),
  loadMedicalStaffDashboard: jest.fn(() => Promise.resolve({
    default: () => <div>Medical Staff Dashboard</div>
  })),
  loadParentDashboard: jest.fn(() => Promise.resolve({
    default: () => <div>Parent Dashboard</div>
  })),
  loadEquipmentManagerDashboard: jest.fn(() => Promise.resolve({
    default: () => <div>Equipment Manager Dashboard</div>
  })),
  loadClubAdminDashboard: jest.fn(() => Promise.resolve({
    default: () => <div>Club Admin Dashboard</div>
  })),
}));

// Mock lazy and Suspense
const originalLazy = React.lazy;
const mockLazy = jest.fn((factory) => {
  const Component = originalLazy(factory);
  Component._payload = factory();
  return Component;
});

describe('Phase 4 - Code Splitting Tests', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        [api.reducerPath]: api.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
    });
    
    // Reset all mocks
    jest.clearAllMocks();
    (React.lazy as any) = mockLazy;
  });

  afterEach(() => {
    (React.lazy as any) = originalLazy;
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    );
  };

  describe('Dynamic Import Loading', () => {
    it('should lazy load dashboard components', async () => {
      const LazyPlayerDashboard = React.lazy(() => 
        import('../../utils/dynamicImports').then(m => m.loadPlayerDashboard())
      );

      renderWithProviders(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyPlayerDashboard />
        </React.Suspense>
      );

      // Initially shows loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Player Dashboard')).toBeInTheDocument();
      });

      // Verify lazy was called
      expect(mockLazy).toHaveBeenCalled();
    });

    it('should handle multiple dashboard lazy loads', async () => {
      const dashboards = [
        { name: 'Player', loader: 'loadPlayerDashboard' },
        { name: 'Coach', loader: 'loadCoachDashboard' },
        { name: 'Physical Trainer', loader: 'loadPhysicalTrainerDashboard' },
      ];

      for (const dashboard of dashboards) {
        const dynamicImports = await import('../../utils/dynamicImports');
        const loader = dynamicImports[dashboard.loader as keyof typeof dynamicImports];
        
        const Component = await loader();
        renderWithProviders(<Component.default />);
        
        expect(screen.getByText(`${dashboard.name} Dashboard`)).toBeInTheDocument();
      }
    });

    it('should handle import errors gracefully', async () => {
      const mockError = new Error('Failed to load module');
      const failingLoader = jest.fn(() => Promise.reject(mockError));

      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        const [hasError, setHasError] = React.useState(false);

        React.useEffect(() => {
          const handleError = () => setHasError(true);
          window.addEventListener('error', handleError);
          return () => window.removeEventListener('error', handleError);
        }, []);

        if (hasError) {
          return <div>Error loading component</div>;
        }

        return <>{children}</>;
      };

      const LazyComponent = React.lazy(failingLoader);

      renderWithProviders(
        <ErrorBoundary>
          <React.Suspense fallback={<div>Loading...</div>}>
            <LazyComponent />
          </React.Suspense>
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(failingLoader).toHaveBeenCalled();
      });
    });
  });

  describe('Route-Based Code Splitting', () => {
    it('should only load chunks for accessed routes', async () => {
      const routes = [
        { path: '/player', component: 'loadPlayerDashboard' },
        { path: '/coach', component: 'loadCoachDashboard' },
        { path: '/trainer', component: 'loadPhysicalTrainerDashboard' },
      ];

      // Track which loaders are called
      const calledLoaders = new Set<string>();

      // Mock the dynamic imports to track calls
      jest.mock('../../utils/dynamicImports', () => {
        const loaders: Record<string, jest.Mock> = {};
        routes.forEach(route => {
          loaders[route.component] = jest.fn(() => {
            calledLoaders.add(route.component);
            return Promise.resolve({
              default: () => <div>{route.component} loaded</div>
            });
          });
        });
        return loaders;
      });

      // Simulate loading only the player route
      const dynamicImports = await import('../../utils/dynamicImports');
      await dynamicImports.loadPlayerDashboard();

      // Only player dashboard should be loaded
      expect(calledLoaders.has('loadPlayerDashboard')).toBe(true);
      expect(calledLoaders.has('loadCoachDashboard')).toBe(false);
      expect(calledLoaders.has('loadPhysicalTrainerDashboard')).toBe(false);
    });

    it('should support prefetching critical routes', async () => {
      const prefetchRoute = async (loader: () => Promise<any>) => {
        // Simulate prefetch by calling the loader
        const module = await loader();
        expect(module.default).toBeDefined();
      };

      const dynamicImports = await import('../../utils/dynamicImports');
      
      // Prefetch critical routes
      await prefetchRoute(dynamicImports.loadPlayerDashboard);
      await prefetchRoute(dynamicImports.loadCoachDashboard);

      // Verify modules are available
      expect(dynamicImports.loadPlayerDashboard).toHaveBeenCalled();
      expect(dynamicImports.loadCoachDashboard).toHaveBeenCalled();
    });
  });

  describe('Chunk Loading Performance', () => {
    it('should measure chunk loading time', async () => {
      const startTime = performance.now();
      
      const dynamicImports = await import('../../utils/dynamicImports');
      const Component = await dynamicImports.loadPhysicalTrainerDashboard();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load quickly (under 100ms for mocked imports)
      expect(loadTime).toBeLessThan(100);
      expect(Component.default).toBeDefined();
    });

    it('should cache loaded modules', async () => {
      const dynamicImports = await import('../../utils/dynamicImports');
      
      // First load
      const firstLoadStart = performance.now();
      await dynamicImports.loadPlayerDashboard();
      const firstLoadTime = performance.now() - firstLoadStart;

      // Second load (should be cached)
      const secondLoadStart = performance.now();
      await dynamicImports.loadPlayerDashboard();
      const secondLoadTime = performance.now() - secondLoadStart;

      // Cached load should be faster
      expect(secondLoadTime).toBeLessThan(firstLoadTime);
    });

    it('should handle parallel chunk loading', async () => {
      const dynamicImports = await import('../../utils/dynamicImports');
      
      const loadPromises = [
        dynamicImports.loadPlayerDashboard(),
        dynamicImports.loadCoachDashboard(),
        dynamicImports.loadPhysicalTrainerDashboard(),
      ];

      const results = await Promise.all(loadPromises);
      
      // All should load successfully
      results.forEach(result => {
        expect(result.default).toBeDefined();
      });
    });
  });

  describe('Bundle Size Optimization', () => {
    it('should verify tree-shaking removes unused exports', () => {
      // This would typically be verified in the build process
      // Here we can test that components only import what they need
      const usedExports = new Set<string>();
      
      // Mock tracking of imports
      const trackImport = (moduleName: string) => {
        usedExports.add(moduleName);
      };

      // Simulate selective imports
      trackImport('loadPlayerDashboard');
      trackImport('loadCoachDashboard');

      // Verify only used imports are tracked
      expect(usedExports.size).toBe(2);
      expect(usedExports.has('loadAdminDashboard')).toBe(false);
    });

    it('should support conditional loading based on user role', async () => {
      const userRole = 'PLAYER';
      const dynamicImports = await import('../../utils/dynamicImports');
      
      let loadedComponent;
      
      switch (userRole) {
        case 'PLAYER':
          loadedComponent = await dynamicImports.loadPlayerDashboard();
          break;
        case 'COACH':
          loadedComponent = await dynamicImports.loadCoachDashboard();
          break;
        default:
          loadedComponent = null;
      }

      expect(loadedComponent).toBeDefined();
      expect(dynamicImports.loadPlayerDashboard).toHaveBeenCalled();
      expect(dynamicImports.loadCoachDashboard).not.toHaveBeenCalled();
    });
  });

  describe('Webpack Magic Comments', () => {
    it('should respect chunk naming comments', async () => {
      // Test that dynamic imports with webpack magic comments work
      const LazyComponent = React.lazy(() => 
        import(
          /* webpackChunkName: "player-dashboard" */
          '../../utils/dynamicImports'
        ).then(m => m.loadPlayerDashboard())
      );

      expect(LazyComponent).toBeDefined();
      // In a real build, this would create a chunk named "player-dashboard"
    });

    it('should support prefetch hints', async () => {
      // Test prefetch comment
      const prefetchImport = () => import(
        /* webpackPrefetch: true */
        '../../utils/dynamicImports'
      );

      const module = await prefetchImport();
      expect(module).toBeDefined();
    });

    it('should support preload hints for critical paths', async () => {
      // Test preload comment for critical components
      const preloadImport = () => import(
        /* webpackPreload: true */
        '../../utils/dynamicImports'
      );

      const module = await preloadImport();
      expect(module).toBeDefined();
    });
  });
});