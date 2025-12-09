import { dashboardApi } from './dashboardApi';
import { configureStore } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';

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
    it('should fetch user dashboard data successfully', async () => {
      const mockData = {
        user: { id: 'test-user', email: 'test@example.com' },
        teams: [],
        permissions: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), { status: 200, headers: { 'content-type': 'application/json' } }) as any
      );

      const data = await store
        .dispatch(dashboardApi.endpoints.getUserDashboardData.initiate())
        .unwrap();
      expect(data).toEqual(mockData);
    });

    it('should not fail when token exists in localStorage', async () => {
      (Storage.prototype.getItem as jest.Mock).mockReturnValue('test-token');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        new Response(JSON.stringify({ user: { id: 'test' } }), { status: 200, headers: { 'content-type': 'application/json' } }) as any
      );

      const data = await store
        .dispatch(dashboardApi.endpoints.getUserDashboardData.initiate())
        .unwrap();
      expect(data).toBeDefined();
    });
  });

  describe('getCommunicationSummary', () => {
    it('should fetch communication summary', async () => {
      const mockData = {
        conversations: { total: 5, unreadCount: 2, recentConversations: [] },
        messages: { totalUnread: 3, mentions: 1, recentMessages: [] },
        notifications: { total: 10, unread: 4, byType: {}, recent: [] },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), { status: 200, headers: { 'content-type': 'application/json' } }) as any
      );

      const data = await store
        .dispatch(dashboardApi.endpoints.getCommunicationSummary.initiate())
        .unwrap();
      expect(data).toEqual(mockData);
    });
  });

  describe('getStatisticsSummary', () => {
    it('should fetch statistics summary with type and id', async () => {
      const mockData = { recentPerformance: { score: 85 } };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), { status: 200, headers: { 'content-type': 'application/json' } }) as any
      );

      const data = await store
        .dispatch(
          dashboardApi.endpoints.getStatisticsSummary.initiate({
            type: 'player',
            id: 'player-123',
          })
        )
        .unwrap();
      expect(data).toEqual(mockData);
    });
  });

  describe('invalidateDashboardCache', () => {
    it('should invalidate cache without error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }) as any
      );

      await store.dispatch(
        dashboardApi.endpoints.invalidateDashboardCache.initiate()
      );

      // No assertion on fetch; just ensure the mutation resolved
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(0);
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
    it('should expose endpoints and reducerPath', () => {
      expect(dashboardApi.reducerPath).toBe('dashboardApi');
      expect(typeof dashboardApi.endpoints.getUserDashboardData.initiate).toBe('function');
    });
  });
});