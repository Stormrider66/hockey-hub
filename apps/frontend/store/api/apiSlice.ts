import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
// RootState import removed (not used in this slice) to prevent incorrect path errors.

// Define the base API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    // Dynamically determine the baseUrl while preventing duplicate `api/v1` segments.
    baseUrl: (() => {
      const raw = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, '') || '';

      // 1) No env => default to relative API prefix
      if (!raw) {
        return '/api/v1/';
      }

      // 2) Env already ends with /api/v1
      if (/\/api\/v1$/.test(raw)) {
        return `${raw}/`;
      }

      // 3) Append when missing
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