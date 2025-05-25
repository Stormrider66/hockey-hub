import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
// RootState import is intentionally omitted here to avoid incorrect relative path errors.

// Define the base API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    // In the browser during development we use a relative URL so MSW (running under the same
    // origin) can intercept the calls. In production (and on the server during SSR) we still
    // honor NEXT_PUBLIC_API_GATEWAY_URL so the app points at the real API Gateway.
    baseUrl: (() => {
      const isBrowser = typeof window !== "undefined";
      const isDev = process.env.NODE_ENV === "development";

      // When developing in the browser we *always* prefer a same-origin relative path so that
      // the service-worker can intercept requests. This avoids cross-origin requests to
      // e.g. http://localhost:3005 which the service-worker cannot capture.
      if (isBrowser && isDev) {
        return "/api/v1/";
      }

      const raw = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "") || "";

      if (!raw) {
        return "/api/v1/";
      }

      // If env already ends with "/api/v1" (with optional trailing slash), return it with a single trailing slash.
      if (/\/api\/v1$/.test(raw)) {
        return `${raw}/`;
      }

      // Otherwise, append the segment.
      return `${raw}/api/v1/`;
    })(),
    prepareHeaders: (headers, { getState }) => {
      // Get token from auth state if implemented
      // const token = (getState() as RootState).auth.token;
      // if (token) {
      //   headers.set('Authorization', `Bearer ${token}`);
      // }
      
      // Get preferred language from UI state if implemented
      // const language = (getState() as RootState).ui.language;
      // if (language) {
      //   headers.set('Accept-Language', language);
      // }
      
      return headers;
    },
    // credentials: 'include', // Uncomment if using cookies for auth
  }),
  // Define tag types for caching and invalidation
  tagTypes: [
    'User', 
    'Team', 
    'Player', 
    'Event', 
    'Training', 
    'Injury',
    'Notification',
    'TestResult',
    'Chat',
    'Resource', // Added Resource tag
    'Location', // Added Location tag
    'Exercise',
    'Program',
    'Club'
  ],
  endpoints: () => ({}), // Endpoints will be injected from other files
});

// Export hooks for use in components (will be empty initially)
export const {
  middleware: apiMiddleware,
  reducer: apiReducer,
  reducerPath: apiReducerPath,
} = apiSlice; 