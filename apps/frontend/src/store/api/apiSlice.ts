import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../index'; // Assuming index.ts will export RootState

// Define the base API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    // TODO: Update baseUrl to use environment variable for the API Gateway
    baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api/v1', 
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
    'Location'  // Added Location tag
  ],
  endpoints: () => ({}), // Endpoints will be injected from other files
});

// Export hooks for use in components (will be empty initially)
export const {
  middleware: apiMiddleware,
  reducer: apiReducer,
  reducerPath: apiReducerPath,
} = apiSlice; 