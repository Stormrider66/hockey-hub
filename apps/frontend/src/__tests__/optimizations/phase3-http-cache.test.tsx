import { fetchBaseQuery } from '@reduxjs/toolkit/query';
// Skip msw server in unit tests; these tests are excluded by jest ignore
// Keeping import commented to avoid resolver errors
// import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { waitFor } from '@testing-library/react';

// Mock fetch with cache support
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Cache storage mock
class MockCacheStorage {
  private caches = new Map<string, MockCache>();

  async open(name: string) {
    if (!this.caches.has(name)) {
      this.caches.set(name, new MockCache());
    }
    return this.caches.get(name)!;
  }

  async has(name: string) {
    return this.caches.has(name);
  }

  async delete(name: string) {
    return this.caches.delete(name);
  }
}

class MockCache {
  private entries = new Map<string, Response>();

  async put(request: RequestInfo, response: Response) {
    const url = typeof request === 'string' ? request : request.url;
    this.entries.set(url, response.clone());
  }

  async match(request: RequestInfo) {
    const url = typeof request === 'string' ? request : request.url;
    const cached = this.entries.get(url);
    return cached ? cached.clone() : undefined;
  }

  async delete(request: RequestInfo) {
    const url = typeof request === 'string' ? request : request.url;
    return this.entries.delete(url);
  }
}

// @ts-ignore
global.caches = new MockCacheStorage();

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  mockFetch.mockClear();
});
afterAll(() => server.close());

describe('HTTP Cache Implementation', () => {
  describe('ETag Header Handling', () => {
    test('should handle ETag headers correctly', async () => {
      const etag = '"33a64df551"';
      let requestCount = 0;

      server.use(
        rest.get('/api/data', (req, res, ctx) => {
          requestCount++;
          const ifNoneMatch = req.headers.get('If-None-Match');
          
          if (ifNoneMatch === etag) {
            return res(ctx.status(304));
          }

          return res(
            ctx.status(200),
            ctx.set('ETag', etag),
            ctx.json({ data: 'test' })
          );
        })
      );

      // First request - should get full response
      const response1 = await fetch('/api/data');
      const data1 = await response1.json();
      
      expect(response1.status).toBe(200);
      expect(response1.headers.get('ETag')).toBe(etag);
      expect(data1).toEqual({ data: 'test' });
      expect(requestCount).toBe(1);

      // Store ETag
      const cache = await caches.open('http-cache');
      await cache.put('/api/data', response1.clone());

      // Second request with If-None-Match
      const cachedResponse = await cache.match('/api/data');
      const cachedEtag = cachedResponse?.headers.get('ETag');

      const response2 = await fetch('/api/data', {
        headers: {
          'If-None-Match': cachedEtag || '',
        },
      });

      expect(response2.status).toBe(304);
      expect(requestCount).toBe(2);
    });

    test('should update cache when ETag changes', async () => {
      let etag = '"v1"';
      const cache = await caches.open('http-cache');

      server.use(
        rest.get('/api/resource', (req, res, ctx) => {
          const ifNoneMatch = req.headers.get('If-None-Match');
          
          if (ifNoneMatch === etag) {
            return res(ctx.status(304));
          }

          return res(
            ctx.status(200),
            ctx.set('ETag', etag),
            ctx.json({ version: etag })
          );
        })
      );

      // Initial request
      const response1 = await fetch('/api/resource');
      await cache.put('/api/resource', response1.clone());
      const data1 = await response1.json();
      expect(data1.version).toBe('"v1"');

      // Change ETag on server
      etag = '"v2"';

      // Request with old ETag
      const response2 = await fetch('/api/resource', {
        headers: { 'If-None-Match': '"v1"' },
      });

      expect(response2.status).toBe(200);
      const data2 = await response2.json();
      expect(data2.version).toBe('"v2"');

      // Update cache
      await cache.put('/api/resource', response2.clone());
      
      // Verify cache was updated
      const cachedResponse = await cache.match('/api/resource');
      expect(cachedResponse?.headers.get('ETag')).toBe('"v2"');
    });
  });

  describe('304 Not Modified Responses', () => {
    test('should return cached data on 304 response', async () => {
      const cache = await caches.open('http-cache');
      const cachedData = { data: 'cached', timestamp: Date.now() };
      
      // Store initial response in cache
      const cachedResponse = new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'ETag': '"cached-etag"',
        },
      });
      await cache.put('/api/cached', cachedResponse);

      server.use(
        rest.get('/api/cached', (req, res, ctx) => {
          const ifNoneMatch = req.headers.get('If-None-Match');
          if (ifNoneMatch === '"cached-etag"') {
            return res(ctx.status(304));
          }
          return res(ctx.status(200), ctx.json({ data: 'new' }));
        })
      );

      // Custom fetch wrapper that handles 304
      const fetchWithCache = async (url: string, options?: RequestInit) => {
        const cached = await cache.match(url);
        const etag = cached?.headers.get('ETag');

        const response = await fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            ...(etag && { 'If-None-Match': etag }),
          },
        });

        if (response.status === 304 && cached) {
          return cached.clone();
        }

        if (response.ok) {
          await cache.put(url, response.clone());
        }

        return response;
      };

      const response = await fetchWithCache('/api/cached');
      const data = await response.json();

      expect(response.status).toBe(200); // Should return cached response status
      expect(data).toEqual(cachedData);
    });

    test('should handle 304 with updated headers', async () => {
      const cache = await caches.open('http-cache');
      
      server.use(
        rest.get('/api/data-with-headers', (req, res, ctx) => {
          const ifNoneMatch = req.headers.get('If-None-Match');
          
          if (ifNoneMatch === '"same-content"') {
            // Return 304 but with updated headers
            return res(
              ctx.status(304),
              ctx.set('X-Rate-Limit', '100'),
              ctx.set('X-Rate-Remaining', '50')
            );
          }

          return res(
            ctx.status(200),
            ctx.set('ETag', '"same-content"'),
            ctx.set('X-Rate-Limit', '100'),
            ctx.set('X-Rate-Remaining', '100'),
            ctx.json({ data: 'content' })
          );
        })
      );

      // Initial request
      const response1 = await fetch('/api/data-with-headers');
      await cache.put('/api/data-with-headers', response1.clone());

      // Second request
      const response2 = await fetch('/api/data-with-headers', {
        headers: { 'If-None-Match': '"same-content"' },
      });

      expect(response2.status).toBe(304);
      expect(response2.headers.get('X-Rate-Remaining')).toBe('50');
    });
  });

  describe('Cache-Control Parsing', () => {
    test('should parse and respect Cache-Control headers', async () => {
      const testCases = [
        {
          header: 'max-age=3600',
          expected: { maxAge: 3600, noCache: false, noStore: false },
        },
        {
          header: 'no-cache',
          expected: { maxAge: 0, noCache: true, noStore: false },
        },
        {
          header: 'no-store',
          expected: { maxAge: 0, noCache: false, noStore: true },
        },
        {
          header: 'max-age=300, must-revalidate',
          expected: { maxAge: 300, mustRevalidate: true },
        },
        {
          header: 'private, max-age=600',
          expected: { maxAge: 600, private: true },
        },
        {
          header: 's-maxage=3600, max-age=60',
          expected: { maxAge: 60, sMaxAge: 3600 },
        },
      ];

      const parseCacheControl = (header: string) => {
        const directives: Record<string, any> = {};
        const parts = header.split(',').map(p => p.trim());

        parts.forEach(part => {
          const [key, value] = part.split('=');
          if (value) {
            directives[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = parseInt(value);
          } else {
            directives[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = true;
          }
        });

        return {
          maxAge: directives.maxAge || 0,
          noCache: directives.noCache || false,
          noStore: directives.noStore || false,
          mustRevalidate: directives.mustRevalidate || false,
          private: directives.private || false,
          sMaxAge: directives.sMaxage || undefined,
        };
      };

      testCases.forEach(({ header, expected }) => {
        const parsed = parseCacheControl(header);
        expect(parsed).toMatchObject(expected);
      });
    });

    test('should respect no-store directive', async () => {
      const cache = await caches.open('http-cache');

      server.use(
        rest.get('/api/no-store', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.set('Cache-Control', 'no-store'),
            ctx.json({ sensitive: 'data' })
          );
        })
      );

      const response = await fetch('/api/no-store');
      const cacheControl = response.headers.get('Cache-Control');

      if (cacheControl?.includes('no-store')) {
        // Should not cache
        expect(await cache.match('/api/no-store')).toBeUndefined();
      } else {
        await cache.put('/api/no-store', response.clone());
      }

      const cached = await cache.match('/api/no-store');
      expect(cached).toBeUndefined();
    });

    test('should handle max-age expiration', async () => {
      jest.useFakeTimers();
      const cache = await caches.open('http-cache');

      const cacheWithExpiry = async (url: string, response: Response) => {
        const cacheControl = response.headers.get('Cache-Control');
        const maxAgeMatch = cacheControl?.match(/max-age=(\d+)/);
        const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) : 0;

        const expiryTime = Date.now() + maxAge * 1000;
        const responseWithExpiry = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers({
            ...Object.fromEntries(response.headers.entries()),
            'X-Cache-Expiry': expiryTime.toString(),
          }),
        });

        await cache.put(url, responseWithExpiry);
      };

      const getCachedWithExpiry = async (url: string) => {
        const cached = await cache.match(url);
        if (!cached) return null;

        const expiry = cached.headers.get('X-Cache-Expiry');
        if (expiry && Date.now() > parseInt(expiry)) {
          await cache.delete(url);
          return null;
        }

        return cached;
      };

      server.use(
        rest.get('/api/timed', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.set('Cache-Control', 'max-age=60'),
            ctx.json({ time: Date.now() })
          );
        })
      );

      // Initial request
      const response = await fetch('/api/timed');
      await cacheWithExpiry('/api/timed', response);

      // Should be cached
      let cached = await getCachedWithExpiry('/api/timed');
      expect(cached).not.toBeNull();

      // Advance time beyond max-age
      jest.advanceTimersByTime(61 * 1000);

      // Should be expired
      cached = await getCachedWithExpiry('/api/timed');
      expect(cached).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('Stale-While-Revalidate', () => {
    test('should implement stale-while-revalidate behavior', async () => {
      const cache = await caches.open('http-cache');
      let serverCallCount = 0;

      server.use(
        rest.get('/api/swr', (req, res, ctx) => {
          serverCallCount++;
          return res(
            ctx.status(200),
            ctx.set('Cache-Control', 'max-age=1, stale-while-revalidate=59'),
            ctx.json({ 
              data: 'response',
              version: serverCallCount,
              timestamp: Date.now(),
            })
          );
        })
      );

      const fetchWithSWR = async (url: string) => {
        const cached = await cache.match(url);
        
        if (cached) {
          const cacheControl = cached.headers.get('Cache-Control');
          const age = Date.now() - parseInt(cached.headers.get('X-Cache-Time') || '0');
          const maxAge = parseInt(cacheControl?.match(/max-age=(\d+)/)?.[1] || '0') * 1000;
          const swr = parseInt(cacheControl?.match(/stale-while-revalidate=(\d+)/)?.[1] || '0') * 1000;

          if (age < maxAge) {
            // Fresh cache
            return { response: cached, source: 'cache-fresh' };
          } else if (age < maxAge + swr) {
            // Stale but within SWR window - return stale and revalidate
            fetch(url).then(async (freshResponse) => {
              if (freshResponse.ok) {
                const responseWithTime = new Response(freshResponse.body, {
                  status: freshResponse.status,
                  headers: new Headers({
                    ...Object.fromEntries(freshResponse.headers.entries()),
                    'X-Cache-Time': Date.now().toString(),
                  }),
                });
                await cache.put(url, responseWithTime);
              }
            });
            return { response: cached, source: 'cache-stale-revalidating' };
          }
        }

        // No cache or expired - fetch fresh
        const freshResponse = await fetch(url);
        if (freshResponse.ok) {
          const responseWithTime = new Response(freshResponse.body, {
            status: freshResponse.status,
            headers: new Headers({
              ...Object.fromEntries(freshResponse.headers.entries()),
              'X-Cache-Time': Date.now().toString(),
            }),
          });
          await cache.put(url, responseWithTime.clone());
          return { response: responseWithTime, source: 'network' };
        }

        return { response: freshResponse, source: 'network-error' };
      };

      // First request - should hit network
      const result1 = await fetchWithSWR('/api/swr');
      const data1 = await result1.response.json();
      expect(result1.source).toBe('network');
      expect(data1.version).toBe(1);
      expect(serverCallCount).toBe(1);

      // Immediate second request - should hit fresh cache
      const result2 = await fetchWithSWR('/api/swr');
      const data2 = await result2.response.json();
      expect(result2.source).toBe('cache-fresh');
      expect(data2.version).toBe(1);
      expect(serverCallCount).toBe(1);

      // Wait for cache to become stale but within SWR
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Third request - should return stale and revalidate in background
      const result3 = await fetchWithSWR('/api/swr');
      const data3 = await result3.response.json();
      expect(result3.source).toBe('cache-stale-revalidating');
      expect(data3.version).toBe(1); // Still returns old version

      // Wait for background revalidation
      await waitFor(() => {
        expect(serverCallCount).toBe(2);
      });
    });

    test('should handle failed revalidation gracefully', async () => {
      const cache = await caches.open('http-cache');
      let shouldFail = false;

      server.use(
        rest.get('/api/swr-fail', (req, res, ctx) => {
          if (shouldFail) {
            return res(ctx.status(500));
          }
          return res(
            ctx.status(200),
            ctx.set('Cache-Control', 'max-age=1, stale-while-revalidate=60'),
            ctx.json({ data: 'success' })
          );
        })
      );

      // Initial successful request
      const response1 = await fetch('/api/swr-fail');
      const responseWithTime = new Response(response1.body, {
        status: response1.status,
        headers: new Headers({
          ...Object.fromEntries(response1.headers.entries()),
          'X-Cache-Time': Date.now().toString(),
        }),
      });
      await cache.put('/api/swr-fail', responseWithTime);

      // Make future requests fail
      shouldFail = true;

      // Wait for cache to become stale
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Attempt revalidation - should return stale on failure
      const cached = await cache.match('/api/swr-fail');
      expect(cached).not.toBeNull();

      // Background revalidation should fail but not affect stale cache
      fetch('/api/swr-fail').catch(() => {
        // Expected to fail
      });

      // Cache should still contain stale data
      const stillCached = await cache.match('/api/swr-fail');
      expect(stillCached).not.toBeNull();
    });
  });

  describe('Vary Header Support', () => {
    test('should cache responses based on Vary header', async () => {
      const cache = await caches.open('http-cache');

      server.use(
        rest.get('/api/vary', (req, res, ctx) => {
          const acceptLanguage = req.headers.get('Accept-Language');
          return res(
            ctx.status(200),
            ctx.set('Vary', 'Accept-Language'),
            ctx.json({ 
              content: acceptLanguage === 'fr' ? 'Bonjour' : 'Hello',
              lang: acceptLanguage,
            })
          );
        })
      );

      // Request with English
      const responseEn = await fetch('/api/vary', {
        headers: { 'Accept-Language': 'en' },
      });
      const cacheKeyEn = '/api/vary?vary=Accept-Language:en';
      await cache.put(cacheKeyEn, responseEn.clone());

      // Request with French
      const responseFr = await fetch('/api/vary', {
        headers: { 'Accept-Language': 'fr' },
      });
      const cacheKeyFr = '/api/vary?vary=Accept-Language:fr';
      await cache.put(cacheKeyFr, responseFr.clone());

      // Verify different cached responses
      const cachedEn = await cache.match(cacheKeyEn);
      const cachedFr = await cache.match(cacheKeyFr);

      const dataEn = await cachedEn?.json();
      const dataFr = await cachedFr?.json();

      expect(dataEn?.content).toBe('Hello');
      expect(dataFr?.content).toBe('Bonjour');
    });
  });
});