import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { enhancedBaseQuery, enhancedBaseQueryWithRetry } from './enhancedBaseQuery';

// Standard base query for backwards compatibility
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

// Use enhanced base query in production for HTTP caching support
// Falls back to standard in development or when explicitly disabled
const baseQuery = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENABLE_HTTP_CACHE !== 'false'
  ? enhancedBaseQuery
  : standardBaseQuery;

// Export both versions for flexibility
export default baseQuery;
export { standardBaseQuery, enhancedBaseQuery, enhancedBaseQueryWithRetry };