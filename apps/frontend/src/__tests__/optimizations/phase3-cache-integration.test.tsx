import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
// import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test API setup
interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
}

const testApi = createApi({
  reducerPath: 'testApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      // Add cache headers
      const cacheControl = localStorage.getItem('cache-control-preference');
      if (cacheControl) {
        headers.set('Cache-Control', cacheControl);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Post'],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => 'users',
      providesTags: ['User'],
      keepUnusedDataFor: 60, // 1 minute
    }),
    getUser: builder.query<User, number>({
      query: (id) => `users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    getPosts: builder.query<Post[], void>({
      query: () => 'posts',
      providesTags: ['Post'],
      keepUnusedDataFor: 300, // 5 minutes
    }),
    getPost: builder.query<Post, number>({
      query: (id) => `posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    createPost: builder.mutation<Post, Partial<Post>>({
      query: (post) => ({
        url: 'posts',
        method: 'POST',
        body: post,
      }),
      invalidatesTags: ['Post'],
    }),
  }),
});

// Server setup
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  localStorageMock.clear();
});
afterAll(() => server.close());

describe('Cache Integration Tests', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        [testApi.reducerPath]: testApi.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(testApi.middleware),
    });
  });

  describe('Redux-Persist + HTTP Cache Integration', () => {
    test('should coordinate between Redux cache and HTTP cache', async () => {
      const users = [
        { id: 1, name: 'User 1', email: 'user1@test.com' },
        { id: 2, name: 'User 2', email: 'user2@test.com' },
      ];

      let requestCount = 0;

      server.use(
        rest.get('/api/users', (req, res, ctx) => {
          requestCount++;
          return res(
            ctx.status(200),
            ctx.set('ETag', '"users-v1"'),
            ctx.set('Cache-Control', 'max-age=60'),
            ctx.json(users)
          );
        })
      );

      const TestComponent = () => {
        const { data, isLoading, isFetching, refetch } = testApi.useGetUsersQuery();

        return (
          <div>
            {isLoading && <div>Loading...</div>}
            {isFetching && <div>Fetching...</div>}
            {data?.map((user) => (
              <div key={user.id}>{user.name}</div>
            ))}
            <button onClick={() => refetch()}>Refetch</button>
          </div>
        );
      };

      const { rerender } = render(
        <Provider store={store}>
          <TestComponent />
        </Provider>
      );

      // Initial load
      await waitFor(() => {
        expect(screen.getByText('User 1')).toBeInTheDocument();
      });
      expect(requestCount).toBe(1);

      // Immediate refetch - should use Redux cache
      fireEvent.click(screen.getByText('Refetch'));
      expect(requestCount).toBe(1); // No new request

      // Unmount and remount - should still use cache
      rerender(
        <Provider store={store}>
          <div>Other content</div>
        </Provider>
      );

      rerender(
        <Provider store={store}>
          <TestComponent />
        </Provider>
      );

      // Data should be immediately available from cache
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(requestCount).toBe(1);
    });

    test('should handle cache invalidation across layers', async () => {
      const posts: Post[] = [
        { id: 1, title: 'Post 1', content: 'Content 1', authorId: 1 },
      ];

      server.use(
        rest.get('/api/posts', (req, res, ctx) => {
          return res(ctx.json(posts));
        }),
        rest.post('/api/posts', (req, res, ctx) => {
          const newPost = { id: 2, title: 'New Post', content: 'New', authorId: 1 };
          posts.push(newPost);
          return res(ctx.json(newPost));
        })
      );

      const TestComponent = () => {
        const { data: postsData } = testApi.useGetPostsQuery();
        const [createPost] = testApi.useCreatePostMutation();

        return (
          <div>
            {postsData?.map((post) => (
              <div key={post.id}>{post.title}</div>
            ))}
            <button
              onClick={() =>
                createPost({ title: 'New Post', content: 'New', authorId: 1 })
              }
            >
              Create Post
            </button>
          </div>
        );
      };

      render(
        <Provider store={store}>
          <TestComponent />
        </Provider>
      );

      // Initial load
      await waitFor(() => {
        expect(screen.getByText('Post 1')).toBeInTheDocument();
      });

      // Create new post
      fireEvent.click(screen.getByText('Create Post'));

      // Should invalidate cache and refetch
      await waitFor(() => {
        expect(screen.getByText('New Post')).toBeInTheDocument();
      });
    });
  });

  describe('Offline Support', () => {
    test('should serve from cache when offline', async () => {
      const mockUsers = [
        { id: 1, name: 'Cached User', email: 'cached@test.com' },
      ];

      let isOnline = true;

      server.use(
        rest.get('/api/users', (req, res, ctx) => {
          if (!isOnline) {
            return res.networkError('Network error');
          }
          return res(ctx.json(mockUsers));
        })
      );

      const TestComponent = () => {
        const { data, error, isError } = testApi.useGetUsersQuery();

        return (
          <div>
            {isError && <div>Error: {error?.toString()}</div>}
            {data?.map((user) => (
              <div key={user.id}>{user.name}</div>
            ))}
          </div>
        );
      };

      render(
        <Provider store={store}>
          <TestComponent />
        </Provider>
      );

      // Initial load while online
      await waitFor(() => {
        expect(screen.getByText('Cached User')).toBeInTheDocument();
      });

      // Go offline
      isOnline = false;

      // Force a refetch by invalidating tags
      store.dispatch(testApi.util.invalidateTags(['User']));

      // Should still show cached data despite network error
      await waitFor(() => {
        expect(screen.getByText('Cached User')).toBeInTheDocument();
      });
    });

    test('should queue mutations when offline', async () => {
      const offlineQueue: any[] = [];

      const queueMutation = (action: any) => {
        offlineQueue.push({
          ...action,
          timestamp: Date.now(),
        });
        localStorage.setItem('offline-queue', JSON.stringify(offlineQueue));
      };

      const processQueue = async () => {
        const queue = JSON.parse(localStorage.getItem('offline-queue') || '[]');
        for (const item of queue) {
          try {
            await fetch(item.url, {
              method: item.method,
              body: JSON.stringify(item.body),
              headers: { 'Content-Type': 'application/json' },
            });
          } catch (error) {
            console.error('Failed to process queued item:', error);
          }
        }
        localStorage.removeItem('offline-queue');
      };

      let isOnline = true;

      server.use(
        rest.post('/api/posts', (req, res, ctx) => {
          if (!isOnline) {
            queueMutation({
              url: '/api/posts',
              method: 'POST',
              body: req.body,
            });
            return res.networkError('Network error');
          }
          return res(ctx.json({ id: 3, ...req.body }));
        })
      );

      const TestComponent = () => {
        const [createPost] = testApi.useCreatePostMutation();
        const [queueSize, setQueueSize] = React.useState(0);

        React.useEffect(() => {
          const updateQueueSize = () => {
            const queue = JSON.parse(localStorage.getItem('offline-queue') || '[]');
            setQueueSize(queue.length);
          };

          updateQueueSize();
          window.addEventListener('storage', updateQueueSize);
          return () => window.removeEventListener('storage', updateQueueSize);
        }, []);

        return (
          <div>
            <button
              onClick={() =>
                createPost({ title: 'Offline Post', content: 'Test' })
              }
            >
              Create Post
            </button>
            <div>Queue size: {queueSize}</div>
            <button onClick={processQueue}>Process Queue</button>
          </div>
        );
      };

      render(
        <Provider store={store}>
          <TestComponent />
        </Provider>
      );

      // Go offline
      isOnline = false;

      // Try to create post while offline
      fireEvent.click(screen.getByText('Create Post'));

      await waitFor(() => {
        expect(screen.getByText('Queue size: 1')).toBeInTheDocument();
      });

      // Go back online
      isOnline = true;

      // Process queued mutations
      fireEvent.click(screen.getByText('Process Queue'));

      await waitFor(() => {
        expect(screen.getByText('Queue size: 0')).toBeInTheDocument();
      });
    });
  });

  describe('Cache Warming', () => {
    test('should pre-populate cache on app initialization', async () => {
      const criticalEndpoints = ['/api/users', '/api/posts'];
      let warmedEndpoints: string[] = [];

      server.use(
        rest.get('/api/users', (req, res, ctx) => {
          warmedEndpoints.push('/api/users');
          return res(ctx.json([{ id: 1, name: 'User 1' }]));
        }),
        rest.get('/api/posts', (req, res, ctx) => {
          warmedEndpoints.push('/api/posts');
          return res(ctx.json([{ id: 1, title: 'Post 1' }]));
        })
      );

      const CacheWarmer = ({ children }: { children: React.ReactNode }) => {
        const [isWarming, setIsWarming] = React.useState(true);

        React.useEffect(() => {
          const warmCache = async () => {
            await Promise.all([
              store.dispatch(testApi.endpoints.getUsers.initiate()),
              store.dispatch(testApi.endpoints.getPosts.initiate()),
            ]);
            setIsWarming(false);
          };

          warmCache();
        }, []);

        if (isWarming) {
          return <div>Warming cache...</div>;
        }

        return <>{children}</>;
      };

      const TestComponent = () => {
        const { data: users } = testApi.useGetUsersQuery();
        const { data: posts } = testApi.useGetPostsQuery();

        return (
          <div>
            <div>Users: {users?.length || 0}</div>
            <div>Posts: {posts?.length || 0}</div>
          </div>
        );
      };

      render(
        <Provider store={store}>
          <CacheWarmer>
            <TestComponent />
          </CacheWarmer>
        </Provider>
      );

      // Should show warming message initially
      expect(screen.getByText('Warming cache...')).toBeInTheDocument();

      // Wait for cache warming to complete
      await waitFor(() => {
        expect(screen.getByText('Users: 1')).toBeInTheDocument();
        expect(screen.getByText('Posts: 1')).toBeInTheDocument();
      });

      // Verify all endpoints were warmed
      expect(warmedEndpoints).toEqual(criticalEndpoints);
    });
  });

  describe('Performance Monitoring', () => {
    test('should track cache performance metrics', async () => {
      const performanceMetrics: any[] = [];

      const trackPerformance = (metric: any) => {
        performanceMetrics.push({
          ...metric,
          timestamp: Date.now(),
        });
      };

      // Enhanced API with performance tracking
      const enhancedBaseQuery = async (args: any, api: any, extraOptions: any) => {
        const start = performance.now();
        const cacheKey = `${args.url || args}`;
        
        // Check cache first
        const cached = localStorage.getItem(`cache-${cacheKey}`);
        if (cached) {
          const { data, expires } = JSON.parse(cached);
          if (Date.now() < expires) {
            trackPerformance({
              type: 'cache-hit',
              endpoint: cacheKey,
              duration: performance.now() - start,
            });
            return { data };
          }
        }

        // Fetch from network
        const result = await fetchBaseQuery({ baseUrl: '/api' })(args, api, extraOptions);
        const duration = performance.now() - start;

        trackPerformance({
          type: 'cache-miss',
          endpoint: cacheKey,
          duration,
        });

        // Cache the result
        if (result.data) {
          localStorage.setItem(
            `cache-${cacheKey}`,
            JSON.stringify({
              data: result.data,
              expires: Date.now() + 60000, // 1 minute
            })
          );
        }

        return result;
      };

      const performanceApi = createApi({
        reducerPath: 'performanceApi',
        baseQuery: enhancedBaseQuery,
        endpoints: (builder) => ({
          getData: builder.query<any, string>({
            query: (endpoint) => endpoint,
          }),
        }),
      });

      const perfStore = configureStore({
        reducer: {
          [performanceApi.reducerPath]: performanceApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(performanceApi.middleware),
      });

      server.use(
        rest.get('/api/test-data', (req, res, ctx) => {
          return res(ctx.json({ value: 'test' }));
        })
      );

      const TestComponent = () => {
        const { data, refetch } = performanceApi.useGetDataQuery('test-data');

        return (
          <div>
            <div>{data?.value}</div>
            <button onClick={() => refetch()}>Refetch</button>
            <div>Metrics: {performanceMetrics.length}</div>
          </div>
        );
      };

      render(
        <Provider store={perfStore}>
          <TestComponent />
        </Provider>
      );

      // Initial fetch - cache miss
      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument();
      });

      expect(performanceMetrics[0].type).toBe('cache-miss');

      // Refetch - should be cache hit
      fireEvent.click(screen.getByText('Refetch'));

      await waitFor(() => {
        expect(screen.getByText('Metrics: 2')).toBeInTheDocument();
      });

      expect(performanceMetrics[1].type).toBe('cache-hit');
      expect(performanceMetrics[1].duration).toBeLessThan(performanceMetrics[0].duration);
    });
  });
});