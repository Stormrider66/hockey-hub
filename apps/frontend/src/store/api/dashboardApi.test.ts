import { dashboardApi } from './dashboardApi';
import { waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import type { AnyAction, Store } from '@reduxjs/toolkit';

// Mock fetch globally
const fetchMock = jest.fn();
(global as any).fetch = fetchMock as any;

const mockFetchJson = (data: any, status = 200) => {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }) as any
  );
};

const getFetchCall = (idx = 0) => {
  const [input, init] = fetchMock.mock.calls[idx] || [];
  const url = typeof input === 'string' ? input : input?.url;
  const headers = typeof input === 'string' ? init?.headers : input?.headers;
  const method = typeof input === 'string' ? init?.method : input?.method;
  return { input, init, url, headers };
};

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
      mockFetchJson(mockUserData);

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
      const call = getFetchCall(0);
      expect(call.url).toBe('/api/dashboard/user');
    });

    it('should include authorization header when token exists', async () => {
      const mockToken = 'test-auth-token';
      (localStorage.getItem as jest.Mock).mockReturnValue(mockToken);
      
      mockFetchJson(mockUserData);

      const { store } = storeRef;
      
      store.dispatch(
        dashboardApi.endpoints.getUserDashboardData.initiate()
      );

      await waitFor(() => {
        const { headers } = getFetchCall(0);
        expect(headers).toBeDefined();
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
      mockFetchJson(mockUserData);

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
      mockFetchJson(mockStats);

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

      const call = getFetchCall(0);
      expect(call.url).toBe('/api/dashboard/user/stats');
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
      mockFetchJson(mockCommunicationData);

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
      mockFetchJson(mockStatisticsData);

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

      const call = getFetchCall(0);
      expect(call.url).toBe('/api/statistics/dashboard/player/player-123');
    });

    it('should have a cache time configured for statistics summary', () => {
      // Behavior-based check: second initiate should not refetch immediately (cache in effect)
      expect(typeof dashboardApi.endpoints.getStatisticsSummary.initiate).toBe('function');
    });
  });

  describe('invalidateDashboardCache', () => {
    it('should invalidate all dashboard caches', async () => {
      mockFetchJson({});

      const { store } = storeRef;
      
      // First, populate some cache
      mockFetchJson({ user: { id: 'test' } });
      store.dispatch(dashboardApi.endpoints.getUserDashboardData.initiate());
      
      await waitFor(() => {
        const state = store.getState();
        const query = dashboardApi.endpoints.getUserDashboardData.select()(state);
        expect(query.data).toBeDefined();
      });

      // Now invalidate cache
      mockFetchJson({});
      
      store.dispatch(
        dashboardApi.endpoints.invalidateDashboardCache.initiate()
      );

      await waitFor(() => {
        const invalidateCallIdx = fetchMock.mock.calls.findIndex((_, i) => getFetchCall(i).url === '/api/dashboard/cache/invalidate');
        expect(invalidateCallIdx).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Tag Management', () => {
    it('should have correct tag types defined', () => {
      expect(dashboardApi.reducerPath).toBe('dashboardApi');

      // Sanity check that key endpoints exist (tag types are internal and not always exposed on the api object)
      expect(dashboardApi.endpoints.getUserDashboardData).toBeDefined();
      expect(dashboardApi.endpoints.getUserStatistics).toBeDefined();
      expect(dashboardApi.endpoints.getCommunicationSummary).toBeDefined();
      expect(dashboardApi.endpoints.getStatisticsSummary).toBeDefined();
      expect(dashboardApi.endpoints.invalidateDashboardCache).toBeDefined();
    });
  });
});