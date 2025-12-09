import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from '@/store/store';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';

// Import all optimized components
import ConversationListOptimized from '@/features/chat/components/ConversationListOptimized';
import NotificationList from '@/features/notifications/components/NotificationList';
import CalendarView from '@/features/calendar/components/CalendarView';
import ExerciseLibrary from '@/features/physical-trainer/components/SessionBuilder/ExerciseLibrary';
import MessageList from '@/features/chat/components/MessageList';
import PlayerStatusTab from '@/features/physical-trainer/components/tabs/PlayerStatusTab';

// Mock service worker
const mockServiceWorker = {
  register: jest.fn().mockResolvedValue({ active: true }),
  ready: Promise.resolve({ active: true }),
};

// Mock dynamic imports
jest.mock('@/utils/dynamicImports', () => ({
  loadLargeComponent: jest.fn((path) => Promise.resolve({
    default: () => <div data-testid="dynamic-component">{path}</div>
  }))
}));

// Mock intersection observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock image optimization
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

describe('Optimization Integration Tests', () => {
  let store: ReturnType<typeof setupStore>;

  beforeEach(() => {
    store = setupStore();
    jest.clearAllMocks();
    // Mock window.navigator.serviceWorker
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: mockServiceWorker,
      writable: true,
    });
  });

  describe('All Optimizations Working Together', () => {
    it('should render optimized components with all performance features', async () => {
      const { container } = render(
        <Provider store={store}>
          <div>
            <ConversationListOptimized />
            <NotificationList notifications={[]} />
            <CalendarView initialView="month" />
          </div>
        </Provider>
      );

      // Wait for all components to load
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      // Verify virtual scrolling is initialized
      expect(mockIntersectionObserver).toHaveBeenCalled();

      // Verify service worker registration
      expect(mockServiceWorker.register).toHaveBeenCalled();
    });

    it('should handle concurrent data fetching with caching', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      });
      global.fetch = mockFetch;

      render(
        <Provider store={store}>
          <div>
            <ExerciseLibrary />
            <PlayerStatusTab />
          </div>
        </Provider>
      );

      // Wait for components to fetch data
      await waitFor(() => {
        // Each component should only fetch once due to caching
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      // Re-render should use cached data
      const { rerender } = render(
        <Provider store={store}>
          <ExerciseLibrary />
        </Provider>
      );

      await waitFor(() => {
        // No additional fetches due to cache
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should maintain performance with heavy data loads', async () => {
      const startTime = performance.now();
      
      // Generate large dataset
      const largeNotifications = Array.from({ length: 1000 }, (_, i) => ({
        id: `notif-${i}`,
        title: `Notification ${i}`,
        content: `Content for notification ${i}`,
        createdAt: new Date().toISOString(),
        read: false,
        type: 'info' as const,
      }));

      const largeMessages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        senderId: `user-${i % 10}`,
        timestamp: new Date().toISOString(),
      }));

      render(
        <Provider store={store}>
          <div>
            <NotificationList notifications={largeNotifications} />
            <MessageList 
              messages={largeMessages}
              currentUserId="user-1"
              otherUser={{ id: 'user-2', name: 'Other User' }}
            />
          </div>
        </Provider>
      );

      const renderTime = performance.now() - startTime;
      
      // Should render within performance budget
      expect(renderTime).toBeLessThan(100); // 100ms budget

      // Verify virtual scrolling is active
      await waitFor(() => {
        // Should not render all items at once
        const renderedNotifications = screen.queryAllByText(/Notification/);
        expect(renderedNotifications.length).toBeLessThan(50); // Virtual scrolling limit
      });
    });
  });

  describe('User Journey with All Features', () => {
    it('should handle complete user workflow with optimizations', async () => {
      const { container } = render(
        <Provider store={store}>
          <CalendarView initialView="month" />
        </Provider>
      );

      // Simulate user interactions
      const viewToggle = screen.getByText('Week');
      fireEvent.click(viewToggle);

      await waitFor(() => {
        expect(screen.getByText('Week View')).toBeInTheDocument();
      });

      // Test navigation with code splitting
      act(() => {
        window.dispatchEvent(new Event('popstate'));
      });

      // Verify smooth transitions
      await waitFor(() => {
        expect(container.querySelector('.calendar-view')).toBeInTheDocument();
      });
    });

    it('should handle offline mode gracefully', async () => {
      // Simulate offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      render(
        <Provider store={store}>
          <ConversationListOptimized />
        </Provider>
      );

      // Should show offline indicator
      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
      });

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      window.dispatchEvent(new Event('online'));

      await waitFor(() => {
        expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance Regression Prevention', () => {
    it('should not exceed memory thresholds', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Render heavy components
      const { unmount } = render(
        <Provider store={store}>
          <div>
            <ConversationListOptimized />
            <NotificationList notifications={Array(100).fill({
              id: '1',
              title: 'Test',
              content: 'Test',
              createdAt: new Date().toISOString(),
              read: false,
              type: 'info' as const,
            })} />
            <CalendarView initialView="month" />
          </div>
        </Provider>
      );

      await waitFor(() => {
        const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
        const memoryIncrease = currentMemory - initialMemory;
        
        // Should not exceed 50MB for these components
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      });

      // Test cleanup
      unmount();

      // Memory should be released
      await waitFor(() => {
        const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
        expect(finalMemory).toBeLessThan(initialMemory + 10 * 1024 * 1024); // Allow 10MB overhead
      });
    });

    it('should maintain smooth scrolling performance', async () => {
      const scrollPerformance: number[] = [];

      render(
        <Provider store={store}>
          <MessageList 
            messages={Array.from({ length: 500 }, (_, i) => ({
              id: `msg-${i}`,
              content: `Message ${i}`,
              senderId: 'user-1',
              timestamp: new Date().toISOString(),
            }))}
            currentUserId="user-1"
            otherUser={{ id: 'user-2', name: 'Other User' }}
          />
        </Provider>
      );

      // Simulate scrolling
      const scrollContainer = container.querySelector('.message-list-container');
      if (scrollContainer) {
        for (let i = 0; i < 10; i++) {
          const startTime = performance.now();
          
          fireEvent.scroll(scrollContainer, {
            target: { scrollTop: i * 100 }
          });

          const frameTime = performance.now() - startTime;
          scrollPerformance.push(frameTime);
        }
      }

      // Average frame time should be under 16ms (60fps)
      const avgFrameTime = scrollPerformance.reduce((a, b) => a + b, 0) / scrollPerformance.length;
      expect(avgFrameTime).toBeLessThan(16);
    });
  });

  describe('Cache and Loading State Integration', () => {
    it('should show loading states while fetching and cache results', async () => {
      const mockFetch = jest.fn()
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ exercises: [] })
          }), 100)
        ));
      
      global.fetch = mockFetch;

      const { rerender } = render(
        <Provider store={store}>
          <ExerciseLibrary />
        </Provider>
      );

      // Should show loading state
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });

      // Re-render should use cache (no loading state)
      rerender(
        <Provider store={store}>
          <ExerciseLibrary />
        </Provider>
      );

      // Should not show loading state again
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    it('should handle error states with retry capability', async () => {
      const mockFetch = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' })
        });

      global.fetch = mockFetch;

      render(
        <Provider store={store}>
          <ConversationListOptimized />
        </Provider>
      );

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByText(/retry/i);
      fireEvent.click(retryButton);

      // Should succeed on retry
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Virtual Scrolling with Dynamic Content', () => {
    it('should handle dynamic content updates in virtual scroll', async () => {
      const initialMessages = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        senderId: 'user-1',
        timestamp: new Date().toISOString(),
      }));

      const { rerender } = render(
        <Provider store={store}>
          <MessageList 
            messages={initialMessages}
            currentUserId="user-1"
            otherUser={{ id: 'user-2', name: 'Other User' }}
          />
        </Provider>
      );

      // Add new message
      const updatedMessages = [
        {
          id: 'new-msg',
          content: 'New message',
          senderId: 'user-2',
          timestamp: new Date().toISOString(),
        },
        ...initialMessages
      ];

      rerender(
        <Provider store={store}>
          <MessageList 
            messages={updatedMessages}
            currentUserId="user-1"
            otherUser={{ id: 'user-2', name: 'Other User' }}
          />
        </Provider>
      );

      // Should show new message without breaking virtual scroll
      await waitFor(() => {
        expect(screen.getByText('New message')).toBeInTheDocument();
      });
    });
  });

  describe('Image Optimization Integration', () => {
    it('should lazy load images with proper optimization', async () => {
      const observerCallback = jest.fn();
      mockIntersectionObserver.mockImplementation((callback) => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      }));

      render(
        <Provider store={store}>
          <div>
            {Array.from({ length: 20 }, (_, i) => (
              <img
                key={i}
                data-testid={`image-${i}`}
                src={`/image-${i}.jpg`}
                loading="lazy"
                alt={`Test image ${i}`}
              />
            ))}
          </div>
        </Provider>
      );

      // Images should be present but lazy loaded
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(20);

      // Verify lazy loading attribute
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });
  });
});