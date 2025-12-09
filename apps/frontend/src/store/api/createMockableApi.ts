import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, EndpointBuilder } from '@reduxjs/toolkit/query';
import { mockBaseQuery } from './mockBaseQuery';
import { enhancedBaseQuery, standardBaseQuery } from './baseQuery';

// Determine which base query to use based on environment
const shouldUseMock = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
const shouldUseCache = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENABLE_HTTP_CACHE !== 'false';

// Create a wrapper that combines mock and enhanced base query
export function createMockableApi<
  Definitions extends EndpointDefinitions,
  ReducerPath extends string = 'api',
  TagTypes extends string = never
>(config: {
  reducerPath: ReducerPath;
  tagTypes?: readonly TagTypes[];
  endpoints: (builder: EndpointBuilder<BaseQueryFn, TagTypes, ReducerPath>) => Definitions;
}) {
  // Select the appropriate base query
  let baseQuery: BaseQueryFn;
  
  if (shouldUseMock) {
    // Use mock base query in development/testing
    baseQuery = mockBaseQuery;
  } else if (shouldUseCache) {
    // Use enhanced base query with caching in production
    baseQuery = enhancedBaseQuery;
  } else {
    // Use standard base query as fallback
    baseQuery = standardBaseQuery;
  }

  return createApi({
    ...config,
    baseQuery,
  });
}

// Type helpers
type EndpointDefinitions = Record<string, any>;