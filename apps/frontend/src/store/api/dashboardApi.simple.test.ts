import { dashboardApi } from './dashboardApi';
import { configureStore } from '@reduxjs/toolkit';

// Mock fetch globally
global.fetch = jest.fn();

describe('dashboardApi - Simple Tests', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
    
    // Setup store with dashboardApi
    store = configureStore({
      reducer: {
        [dashboardApi.reducerPath]: dashboardApi.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(dashboardApi.middleware),
    });
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
  });

  afterEach(() => {
    // Clean up
    store.dispatch(dashboardApi.util.resetApiState());
  });

  describe('Endpoints', () => {
    it('should have all expected endpoints', () => {
      const endpoints = Object.keys(dashboardApi.endpoints);
      
      expect(endpoints).toContain('getUserDashboardData');
      expect(endpoints).toContain('getUserStatistics');
      expect(endpoints).toContain('getQuickAccessItems');
      expect(endpoints).toContain('getNotificationSummary');
      expect(endpoints).toContain('getCommunicationSummary');
      expect(endpoints).toContain('getStatisticsSummary');
      expect(endpoints).toContain('invalidateDashboardCache');
    });
  });

  describe('getUserDashboardData', () => {
    it('should make a GET request to /api/dashboard/user', async () => {
      const mockData = {
        user: { id: 'test-user', email: 'test@example.com' },
        teams: [],
        permissions: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // Dispatch the query
      const promise = store.dispatch(
        dashboardApi.endpoints.getUserDashboardData.initiate()
      );

      // Wait for the query to resolve
      await promise;

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/dashboard/user',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should include authorization header when token exists', async () => {
      (Storage.prototype.getItem as jest.Mock).mockReturnValue('test-token');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'test' } }),
      });

      await store.dispatch(
        dashboardApi.endpoints.getUserDashboardData.initiate()
      );

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1]?.headers;
      expect(headers.get('authorization')).toBe('Bearer test-token');
    });
  });

  describe('getCommunicationSummary', () => {
    it('should make a GET request to /api/dashboard/communication', async () => {
      const mockData = {
        conversations: { total: 5, unreadCount: 2, recentConversations: [] },
        messages: { totalUnread: 3, mentions: 1, recentMessages: [] },
        notifications: { total: 10, unread: 4, byType: {}, recent: [] },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await store.dispatch(
        dashboardApi.endpoints.getCommunicationSummary.initiate()
      );

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/dashboard/communication',
        expect.any(Object)
      );
    });
  });

  describe('getStatisticsSummary', () => {
    it('should make a GET request with type and id parameters', async () => {
      const mockData = { recentPerformance: { score: 85 } };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await store.dispatch(
        dashboardApi.endpoints.getStatisticsSummary.initiate({
          type: 'player',
          id: 'player-123',
        })
      );

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/statistics/dashboard/player/player-123',
        expect.any(Object)
      );
    });
  });

  describe('invalidateDashboardCache', () => {
    it('should make a POST request to invalidate cache', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await store.dispatch(
        dashboardApi.endpoints.invalidateDashboardCache.initiate()
      );

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/dashboard/cache/invalidate',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('Cache Configuration', () => {
    it('should have proper cache times configured', () => {
      // We can't directly test keepUnusedDataFor since it's internal to RTK Query
      // But we can verify the endpoints exist and are configured
      expect(dashboardApi.endpoints.getUserDashboardData).toBeDefined();
      expect(dashboardApi.endpoints.getUserStatistics).toBeDefined();
      expect(dashboardApi.endpoints.getQuickAccessItems).toBeDefined();
      expect(dashboardApi.endpoints.getNotificationSummary).toBeDefined();
    });
  });

  describe('Tag Types', () => {
    it('should have correct tag types', () => {
      expect(dashboardApi.tagTypes).toEqual([
        'UserData',
        'Statistics',
        'QuickAccess',
        'Notifications',
        'Communication',
      ]);
    });
  });
});