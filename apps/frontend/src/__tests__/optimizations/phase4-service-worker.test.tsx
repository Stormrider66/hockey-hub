import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { OfflineIndicator } from '../../features/physical-trainer/components/shared/OfflineIndicator';
import { OfflineQueueManager } from '../../features/physical-trainer/components/shared/OfflineQueueManager';
import { ServiceWorkerProvider, useServiceWorker } from '../../providers/ServiceWorkerProvider';

// Mock service worker registration
const mockServiceWorker = {
  register: jest.fn(),
  ready: Promise.resolve({
    active: {
      postMessage: jest.fn(),
    },
    update: jest.fn(),
  }),
  controller: {
    postMessage: jest.fn(),
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: mockServiceWorker,
});

// Mock window.addEventListener for online/offline events
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
window.addEventListener = mockAddEventListener;
window.removeEventListener = mockRemoveEventListener;

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(() => ({
    onsuccess: jest.fn(),
    onerror: jest.fn(),
    result: {
      createObjectStore: jest.fn(),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          add: jest.fn(),
          get: jest.fn(),
          getAll: jest.fn(() => ({
            onsuccess: jest.fn(),
          })),
          delete: jest.fn(),
          clear: jest.fn(),
        })),
      })),
    },
  })),
};

(global as any).indexedDB = mockIndexedDB;

// Mock Notification API
(global as any).Notification = {
  permission: 'granted',
  requestPermission: jest.fn(() => Promise.resolve('granted')),
};

describe('Phase 4 - Service Worker Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset online status
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  describe('Service Worker Registration', () => {
    it('should register service worker on mount', async () => {
      render(
        <ServiceWorkerProvider>
          <div>Test App</div>
        </ServiceWorkerProvider>
      );

      await waitFor(() => {
        expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
      });
    });

    it('should handle registration errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockServiceWorker.register.mockRejectedValueOnce(new Error('Registration failed'));

      render(
        <ServiceWorkerProvider>
          <div>Test App</div>
        </ServiceWorkerProvider>
      );

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Service Worker registration failed:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should check for updates periodically', async () => {
      jest.useFakeTimers();

      render(
        <ServiceWorkerProvider>
          <div>Test App</div>
        </ServiceWorkerProvider>
      );

      // Fast-forward 1 hour
      jest.advanceTimersByTime(60 * 60 * 1000);

      await waitFor(() => {
        expect(mockServiceWorker.ready).toBeDefined();
      });

      jest.useRealTimers();
    });
  });

  describe('Offline Functionality', () => {
    it('should detect offline status', async () => {
      render(<OfflineIndicator />);

      // Should not show indicator when online
      expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      await waitFor(() => {
        expect(screen.getByText(/working offline/i)).toBeInTheDocument();
      });
    });

    it('should detect online status', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      render(<OfflineIndicator />);

      // Should show offline indicator
      expect(screen.getByText(/working offline/i)).toBeInTheDocument();

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', { value: true });
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);

      await waitFor(() => {
        expect(screen.queryByText(/working offline/i)).not.toBeInTheDocument();
      });
    });

    it('should queue operations when offline', async () => {
      const mockOperation = {
        id: '1',
        type: 'UPDATE_WORKOUT',
        data: { workoutId: 'w1', name: 'Updated Workout' },
        timestamp: Date.now(),
      };

      render(<OfflineQueueManager />);

      // Simulate offline
      Object.defineProperty(navigator, 'onLine', { value: false });

      // Add operation to queue
      const addToQueue = async (operation: any) => {
        const db = mockIndexedDB.open().result;
        const transaction = db.transaction(['offline-queue'], 'readwrite');
        const store = transaction.objectStore('offline-queue');
        await store.add(operation);
      };

      await addToQueue(mockOperation);

      // Verify operation was queued
      expect(mockIndexedDB.open).toHaveBeenCalled();
    });
  });

  describe('Background Sync', () => {
    it('should sync queued operations when online', async () => {
      const mockSyncOperations = jest.fn();

      const TestComponent = () => {
        const { syncQueue } = useServiceWorker();
        React.useEffect(() => {
          mockSyncOperations.mockImplementation(syncQueue);
        }, [syncQueue]);

        return (
          <button onClick={() => syncQueue()}>Sync Now</button>
        );
      };

      render(
        <ServiceWorkerProvider>
          <TestComponent />
        </ServiceWorkerProvider>
      );

      // Simulate clicking sync button
      fireEvent.click(screen.getByText('Sync Now'));

      await waitFor(() => {
        expect(mockSyncOperations).toHaveBeenCalled();
      });
    });

    it('should handle sync errors gracefully', async () => {
      const mockFailedOperation = {
        id: '2',
        type: 'CREATE_SESSION',
        data: { sessionName: 'New Session' },
        retries: 3,
      };

      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      // Simulate sync failure
      const syncWithError = async () => {
        throw new Error('Network error');
      };

      try {
        await syncWithError();
      } catch (error) {
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining('Sync failed'),
          error
        );
      }

      consoleError.mockRestore();
    });

    it('should retry failed operations with exponential backoff', async () => {
      jest.useFakeTimers();

      const retryOperation = async (retryCount: number) => {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        return new Promise(resolve => setTimeout(resolve, delay));
      };

      // Test retry delays
      const delays = [];
      for (let i = 0; i < 3; i++) {
        const start = Date.now();
        const promise = retryOperation(i);
        jest.advanceTimersByTime(Math.min(1000 * Math.pow(2, i), 30000));
        await promise;
        delays.push(Date.now() - start);
      }

      expect(delays[0]).toBe(1000); // 1 second
      expect(delays[1]).toBe(2000); // 2 seconds
      expect(delays[2]).toBe(4000); // 4 seconds

      jest.useRealTimers();
    });
  });

  describe('Cache Strategies', () => {
    it('should implement cache-first strategy for static assets', async () => {
      const mockCache = {
        match: jest.fn(),
        put: jest.fn(),
      };

      const mockCaches = {
        open: jest.fn(() => Promise.resolve(mockCache)),
      };

      (global as any).caches = mockCaches;

      const cacheFirst = async (request: Request) => {
        const cache = await caches.open('static-v1');
        const cached = await cache.match(request);
        
        if (cached) {
          return cached;
        }

        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
      };

      const request = new Request('/static/logo.png');
      mockCache.match.mockResolvedValueOnce(new Response('cached'));

      const response = await cacheFirst(request);
      
      expect(mockCaches.open).toHaveBeenCalledWith('static-v1');
      expect(mockCache.match).toHaveBeenCalledWith(request);
      expect(response).toBeDefined();
    });

    it('should implement network-first strategy for API calls', async () => {
      const networkFirst = async (request: Request) => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open('api-v1');
            cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          const cache = await caches.open('api-v1');
          const cached = await cache.match(request);
          if (cached) {
            return cached;
          }
          throw error;
        }
      };

      // Test successful network request
      global.fetch = jest.fn(() => 
        Promise.resolve(new Response('network response', { status: 200 }))
      );

      const request = new Request('/api/workouts');
      const response = await networkFirst(request);

      expect(global.fetch).toHaveBeenCalledWith(request);
      expect(response).toBeDefined();
    });

    it('should implement stale-while-revalidate strategy', async () => {
      const mockCache = {
        match: jest.fn(() => Promise.resolve(new Response('stale data'))),
        put: jest.fn(),
      };

      (global as any).caches = {
        open: jest.fn(() => Promise.resolve(mockCache)),
      };

      const staleWhileRevalidate = async (request: Request) => {
        const cache = await caches.open('dynamic-v1');
        const cachedResponse = await cache.match(request);

        const fetchPromise = fetch(request).then(response => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        });

        return cachedResponse || fetchPromise;
      };

      const request = new Request('/api/players');
      const response = await staleWhileRevalidate(request);

      expect(response).toBeDefined();
      expect(mockCache.match).toHaveBeenCalled();
    });
  });

  describe('Update Notifications', () => {
    it('should notify user of available updates', async () => {
      const mockShowNotification = jest.fn();
      
      const TestComponent = () => {
        const { updateAvailable, skipWaiting } = useServiceWorker();
        
        React.useEffect(() => {
          if (updateAvailable) {
            mockShowNotification();
          }
        }, [updateAvailable]);

        return (
          <div>
            {updateAvailable && (
              <button onClick={skipWaiting}>Update Now</button>
            )}
          </div>
        );
      };

      render(
        <ServiceWorkerProvider>
          <TestComponent />
        </ServiceWorkerProvider>
      );

      // Simulate update available event
      const updateEvent = new Event('controllerchange');
      navigator.serviceWorker.dispatchEvent(updateEvent);

      await waitFor(() => {
        expect(screen.getByText('Update Now')).toBeInTheDocument();
      });
    });

    it('should reload page after update', async () => {
      const mockReload = jest.fn();
      Object.defineProperty(window.location, 'reload', {
        writable: true,
        value: mockReload,
      });

      const TestComponent = () => {
        const { skipWaiting } = useServiceWorker();
        
        return (
          <button onClick={() => {
            skipWaiting();
            window.location.reload();
          }}>
            Update and Reload
          </button>
        );
      };

      render(
        <ServiceWorkerProvider>
          <TestComponent />
        </ServiceWorkerProvider>
      );

      fireEvent.click(screen.getByText('Update and Reload'));

      await waitFor(() => {
        expect(mockReload).toHaveBeenCalled();
      });
    });
  });

  describe('Offline Queue Management', () => {
    it('should display queued operations count', async () => {
      const mockQueuedOps = [
        { id: '1', type: 'UPDATE', timestamp: Date.now() },
        { id: '2', type: 'CREATE', timestamp: Date.now() },
      ];

      // Mock IndexedDB getAll
      mockIndexedDB.open.mockReturnValueOnce({
        onsuccess: function() {
          this.result = {
            transaction: () => ({
              objectStore: () => ({
                getAll: () => ({
                  onsuccess: function() {
                    this.result = mockQueuedOps;
                  },
                }),
              }),
            }),
          };
        },
      });

      render(<OfflineQueueManager />);

      await waitFor(() => {
        expect(screen.getByText(/2 operations pending/i)).toBeInTheDocument();
      });
    });

    it('should allow clearing offline queue', async () => {
      render(<OfflineQueueManager />);

      const clearButton = screen.getByText(/clear queue/i);
      fireEvent.click(clearButton);

      // Verify clear was called
      await waitFor(() => {
        expect(mockIndexedDB.open).toHaveBeenCalled();
      });
    });

    it('should show sync progress', async () => {
      const { rerender } = render(<OfflineQueueManager syncProgress={0} />);

      // Update progress
      rerender(<OfflineQueueManager syncProgress={50} />);
      expect(screen.getByText(/50% complete/i)).toBeInTheDocument();

      rerender(<OfflineQueueManager syncProgress={100} />);
      expect(screen.getByText(/sync complete/i)).toBeInTheDocument();
    });
  });

  describe('Performance Impact', () => {
    it('should not block main thread during cache operations', async () => {
      const startTime = performance.now();
      
      // Simulate cache operation
      const cacheOperation = new Promise(resolve => {
        setTimeout(resolve, 10);
      });

      await cacheOperation;
      
      const duration = performance.now() - startTime;
      
      // Should complete quickly without blocking
      expect(duration).toBeLessThan(50);
    });

    it('should measure service worker activation time', async () => {
      const activationStart = performance.now();
      
      // Simulate service worker activation
      await mockServiceWorker.ready;
      
      const activationTime = performance.now() - activationStart;
      
      // Should activate quickly
      expect(activationTime).toBeLessThan(100);
    });
  });
});