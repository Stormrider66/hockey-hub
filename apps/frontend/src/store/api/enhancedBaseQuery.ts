import { fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query';
import type { RootState } from '../store';
import {
  generateCacheKey,
  getCacheEntry,
  setCacheEntry,
  getVaryHeaders,
  startCacheCleanup,
} from './cacheUtils';

// Extended fetch args to support caching options
interface EnhancedFetchArgs extends FetchArgs {
  useCache?: boolean;
  forceRefresh?: boolean;
  cacheTime?: number;
}

// Create base query with standard configuration
const standardBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Enhanced base query with HTTP caching support
export const enhancedBaseQuery: BaseQueryFn<
  string | EnhancedFetchArgs,
  unknown,
  FetchBaseQueryError,
  {},
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  // Normalize args
  const fetchArgs: FetchArgs = typeof args === 'string' ? { url: args } : args;
  const { 
    url = '', 
    method = 'GET', 
    params,
    useCache = method === 'GET',
    forceRefresh = false,
  } = fetchArgs as EnhancedFetchArgs;

  // Only cache GET requests by default
  if (!useCache || method !== 'GET') {
    return standardBaseQuery(fetchArgs, api, extraOptions);
  }

  // Prepare headers for vary calculation
  const headers = new Headers(fetchArgs.headers);
  const preparedHeaders = standardBaseQuery.prepareHeaders?.(headers, api as any) || headers;
  
  // Get vary headers from previous response
  const cacheKey = generateCacheKey(url, method, params);
  const varyHeaders = getVaryHeaders(cacheKey);
  const varyValues: Record<string, string> = {};
  
  if (varyHeaders) {
    Object.keys(varyHeaders).forEach(header => {
      const value = preparedHeaders.get(header);
      if (value) {
        varyValues[header] = value;
      }
    });
  }

  // Generate final cache key with vary headers
  const finalCacheKey = generateCacheKey(url, method, params, varyValues);

  // Check cache unless force refresh is requested
  if (!forceRefresh) {
    const cached = getCacheEntry(finalCacheKey);
    
    if (cached) {
      // Return fresh cached data immediately
      if (cached.isFresh) {
        return {
          data: cached.data,
          meta: {
            request: new Request(url),
            response: new Response(JSON.stringify(cached.data), {
              status: 200,
              headers: { 
                'X-Cache': 'HIT',
                'X-Cache-Age': String(Date.now()),
              },
            }),
          },
        };
      }

      // Handle stale-while-revalidate
      if (cached.isStale && cached.etag) {
        // Return stale data immediately
        const staleResponse = {
          data: cached.data,
          meta: {
            request: new Request(url),
            response: new Response(JSON.stringify(cached.data), {
              status: 200,
              headers: { 
                'X-Cache': 'STALE',
                'X-Cache-Age': String(Date.now()),
              },
            }),
          },
        };

        // Revalidate in background
        if (cached.etag) {
          preparedHeaders.set('If-None-Match', cached.etag);
        }

        // Fire and forget background revalidation
        standardBaseQuery(
          { ...fetchArgs, headers: preparedHeaders },
          api,
          extraOptions
        ).then(result => {
          if ('data' in result) {
            const response = result.meta?.response;
            if (response && response.status !== 304) {
              // Update cache with fresh data
              setCacheEntry(
                finalCacheKey,
                result.data,
                response.headers.get('ETag') || undefined,
                response.headers.get('Cache-Control') || undefined,
                response.headers.get('Vary') || undefined
              );
            }
          }
        });

        return staleResponse;
      }

      // Add conditional headers for revalidation
      if (cached.etag && cached.shouldRevalidate) {
        preparedHeaders.set('If-None-Match', cached.etag);
      }
    }
  }

  // Make the actual request
  const result = await standardBaseQuery(
    { ...fetchArgs, headers: preparedHeaders },
    api,
    extraOptions
  );

  // Handle successful responses
  if ('data' in result && result.meta?.response) {
    const response = result.meta.response;
    
    // Handle 304 Not Modified
    if (response.status === 304) {
      const cached = getCacheEntry(finalCacheKey);
      if (cached) {
        return {
          data: cached.data,
          meta: {
            ...result.meta,
            response: new Response(JSON.stringify(cached.data), {
              status: 200,
              headers: { 
                ...response.headers,
                'X-Cache': 'REVALIDATED',
              },
            }),
          },
        };
      }
    }

    // Cache successful responses
    if (response.status >= 200 && response.status < 300) {
      const etag = response.headers.get('ETag');
      const cacheControl = response.headers.get('Cache-Control');
      const vary = response.headers.get('Vary');

      // Store in cache if we have caching headers
      if (etag || cacheControl) {
        setCacheEntry(
          finalCacheKey,
          result.data,
          etag || undefined,
          cacheControl || undefined,
          vary || undefined
        );
      }
    }
  }

  return result;
};

// Create a version with automatic retry for resilience
export const enhancedBaseQueryWithRetry = retry(enhancedBaseQuery, {
  maxRetries: 3,
  backoff: 'exponential',
});

// Start cache cleanup on module load
if (typeof window !== 'undefined') {
  startCacheCleanup();
}

// Export cache utilities for manual control
export { clearCache, getCacheStats, clearStaleEntries } from './cacheUtils';