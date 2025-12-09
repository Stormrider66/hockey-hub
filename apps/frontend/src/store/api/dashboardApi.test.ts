import { dashboardApi } from './dashboardApi';
import { waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import type { AnyAction, Store } from '@reduxjs/toolkit';

// Mock fetch globally
const fetchMock = jest.fn();
(global as any).fetch = fetchMock as any;

// Helper to setup API store for testing
function setupApiStore<A extends any>(api: any): {
  store: Store<any, AnyAction>;
} {
  const store = configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(api.middleware),
  });

  return { store };
}

describe('dashboardApi', () => {
  let storeRef: ReturnType<typeof setupApiStore>;

  beforeEach(() => {
    // Reset fetch mock
    fetchMock.mockReset();
    
    // Setup store with dashboardApi
    storeRef = setupApiStore(dashboardApi);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up after each test
    storeRef.store.dispatch(dashboardApi.util.resetApiState());
  });

  describe('getUserDashboardData', () => {
    const mockUserData = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        role: 'player',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {},
      },
      teams: [
        {
          id: 'team-123',
          name: 'U14 Elite',
          type: 'hockey',
          isActive: true,
        },
      ],
      permissions: ['view_calendar', 'view_training'],
      features: {
        hasCalendar: true,
        hasTraining: true,
        hasMedical: false,
        hasStatistics: true,
        hasCommunication: true,
        hasPayments: false,
        hasEquipment: false,
        hasAdmin: false,
      },
      notifications: {
        email: true,
        push: false,
        sms: false,
      },
    };

    it('should fetch user dashboard data successfully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      });

      const { store } = storeRef;
      
      // Dispatch the query
      store.dispatch(
        dashboardApi.endpoints.getUserDashboardData.initiate()
      );

      await waitFor(() => {
        const state = store.getState();
        const query = dashboardApi.endpoints.getUserDashboardData.select()(state);
        expect(query.data).toEqual(mockUserData);
        expect(query.isSuccess).toBe(true);
      });

      // Verify the fetch was called correctly
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/dashboard/user',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Headers),
        })
      );
    });

    it('should include authorization header when token exists', async () => {
      const mockToken = 'test-auth-token';
      (localStorage.getItem as jest.Mock).mockReturnValue(mockToken);
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      });

      const { store } = storeRef;
      
      store.dispatch(
        dashboardApi.endpoints.getUserDashboardData.initiate()
      );

      await waitFor(() => {
        const headers = fetchMock.mock.calls[0][1]?.headers as Headers;
        expect(headers.get('authorization')).toBe(`Bearer ${mockToken}`);
      });
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const { store } = storeRef;
      
      store.dispatch(
        dashboardApi.endpoints.getUserDashboardData.initiate()
      );

      await waitFor(() => {
        const state = store.getState();
        const query = dashboardApi.endpoints.getUserDashboardData.select()(state);
        expect(query.isError).toBe(true);
        expect(query.error).toBeDefined();
      });
    });

    it('should cache data for 5 minutes', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      });

      const { store } = storeRef;
      
      // First call
      store.dispatch(
        dashboardApi.endpoints.getUserDashboardData.initiate()
      );

      await waitFor(() => {
        const state = store.getState();
        const query = dashboardApi.endpoints.getUserDashboardData.select()(state);
        expect(query.isSuccess).toBe(true);
      });

      // Second call should use cache
      fetchMock.mockClear();
      
      store.dispatch(
        dashboardApi.endpoints.getUserDashboardData.initiate()
      );

      // Should not make another fetch call
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('getUserStatistics', () => {
    const mockStats = {
      trainingSessions: 45,
      gamesPlayed: 20,
      performanceScore: 85,
      upcomingEvents: 3,
    };

    it('should fetch user statistics', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const { store } = storeRef;
      
      store.dispatch(
        dashboardApi.endpoints.getUserStatistics.initiate()
      );

      await waitFor(() => {
        const state = store.getState();
        const query = dashboardApi.endpoints.getUserStatistics.select()(state);
        expect(query.data).toEqual(mockStats);
        expect(query.isSuccess).toBe(true);
      });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/dashboard/user/stats',
        expect.any(Object)
      );
    });
  });

  describe('getCommunicationSummary', () => {
    const mockCommunicationData = {
      conversations: {
        total: 5,
        unreadCount: 2,
        recentConversations: [
          {
            id: 'conv-1',
            name: 'Team Chat',
            unreadCount: 1,
            lastMessage: {
              content: 'See you at practice!',
              senderId: 'user-456',
              createdAt: new Date().toISOString(),
            },
          },
        ],
      },
      messages: {
        totalUnread: 3,
        mentions: 1,
        recentMessages: [],
      },
      notifications: {
        total: 10,
        unread: 4,
        byType: {
          training: 2,
          game: 1,
          general: 1,
        },
        recent: [],
      },
    };

    it('should fetch communication summary', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommunicationData,
      });

      const { store } = storeRef;
      
      store.dispatch(
        dashboardApi.endpoints.getCommunicationSummary.initiate()
      );

      await waitFor(() => {
        const state = store.getState();
        const query = dashboardApi.endpoints.getCommunicationSummary.select()(state);
        expect(query.data).toEqual(mockCommunicationData);
        expect(query.isSuccess).toBe(true);
      });
    });
  });

  describe('getStatisticsSummary', () => {
    const mockStatisticsData = {
      recentPerformance: { score: 85 },
      trends: [{ week: 1, score: 80 }, { week: 2, score: 85 }],
      workload: { current: 'moderate', risk: 'low' },
    };

    it('should fetch statistics summary for player', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatisticsData,
      });

      const { store } = storeRef;
      
      store.dispatch(
        dashboardApi.endpoints.getStatisticsSummary.initiate({
          type: 'player',
          id: 'player-123',
        })
      );

      await waitFor(() => {
        const state = store.getState();
        const query = dashboardApi.endpoints.getStatisticsSummary.select({
          type: 'player',
          id: 'player-123',
        })(state);
        expect(query.data).toEqual(mockStatisticsData);
      });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/statistics/dashboard/player/player-123',
        expect.any(Object)
      );
    });

    it('should have a cache time configured for statistics summary', () => {
      const defn: any = (dashboardApi as any).endpoints?.getStatisticsSummary;
      expect(defn?.definition?.keepUnusedDataFor).toBeGreaterThan(0);
    });
  });

  describe('invalidateDashboardCache', () => {
    it('should invalidate all dashboard caches', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => {},
      });

      const { store } = storeRef;
      
      // First, populate some cache
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'test' } }),
      });
      store.dispatch(dashboardApi.endpoints.getUserDashboardData.initiate());
      
      await waitFor(() => {
        const state = store.getState();
        const query = dashboardApi.endpoints.getUserDashboardData.select()(state);
        expect(query.data).toBeDefined();
      });

      // Now invalidate cache
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      
      store.dispatch(
        dashboardApi.endpoints.invalidateDashboardCache.initiate()
      );

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/dashboard/cache/invalidate',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });
  });

  describe('Tag Management', () => {
    it('should have correct tag types defined', () => {
      expect(dashboardApi.reducerPath).toBe('dashboardApi');
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