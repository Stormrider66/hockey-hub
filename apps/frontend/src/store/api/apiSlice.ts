import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
// RootState import is intentionally omitted here to avoid incorrect relative path errors.

// Define the base API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: async (args, api, extraOptions) => {
    const rawBaseQuery = fetchBaseQuery({
      // TEMPORARY FIX: Force API Gateway URL for development testing
      // Frontend is on port 3005, API Gateway is on port 3000
      baseUrl: (() => {
        const isBrowser = typeof window !== "undefined";
        const isDev = process.env.NODE_ENV === "development";

        // TEMPORARY: Always use API Gateway in development
        if (isBrowser && isDev) {
          return "http://localhost:3000/api/v1/";
        }

        const raw = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, "");
        return raw || "/api/v1/";
      })(),
      credentials: 'include', // Important for cookie-based auth
      prepareHeaders: (headers, { getState }) => {
        // Add any additional headers if needed
        headers.set('Content-Type', 'application/json');
        
        // Get token from auth state
        const state = getState() as any;
        const token = state.auth?.accessToken;
        if (token) {
          console.log('🔑 Adding JWT token to request:', token.substring(0, 20) + '...');
          headers.set('Authorization', `Bearer ${token}`);
        } else {
          console.log('❌ No JWT token found in auth state');
        }
        
        // Get preferred language from UI state if implemented
        // const language = (getState() as RootState).ui.language;
        // if (language) {
        //   headers.set('Accept-Language', language);
        // }
        
        return headers;
      },
    });

    let result = await rawBaseQuery(args, api, extraOptions);

    // Handle authentication errors globally
    if (result.error && result.error.status === 401) {
      // Could dispatch logout action here
      console.warn('Authentication error - user may need to login again');
    }

    return result;
  },
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