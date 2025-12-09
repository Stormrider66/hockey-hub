import { createApi } from '@reduxjs/toolkit/query/react';
import { useState, useCallback } from 'react';
import { enhancedBaseQueryWithRetry } from '../enhancedBaseQuery';
import type { User } from '@/types/auth';

// Example API using enhanced base query with caching
export const cachedUserApi = createApi({
  reducerPath: 'cachedUserApi',
  baseQuery: enhancedBaseQueryWithRetry,
  tagTypes: ['User', 'Team', 'Permission'],
  endpoints: (builder) => ({
    // Example: Get user profile with caching
    getUserProfile: builder.query<User, string>({
      query: (userId) => ({
        url: `/users/${userId}`,
        // Enable caching for this endpoint
        useCache: true,
        // Cache for 5 minutes by default (can be overridden by server headers)
        cacheTime: 300000,
      }),
      providesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),

    // Example: Get team members with conditional caching
    getTeamMembers: builder.query<User[], { teamId: string; includeInactive?: boolean }>({
      query: ({ teamId, includeInactive }) => ({
        url: `/teams/${teamId}/members`,
        params: { includeInactive },
        // Cache only when not including inactive members
        useCache: !includeInactive,
      }),
      providesTags: (result, error, { teamId }) => [
        { type: 'Team', id: teamId },
        ...(result ? result.map(user => ({ type: 'User' as const, id: user.id })) : []),
      ],
    }),

    // Example: Search users with smart caching
    searchUsers: builder.query<User[], { query: string; limit?: number }>({
      query: ({ query, limit = 10 }) => ({
        url: '/users/search',
        params: { q: query, limit },
        // Cache search results but with shorter TTL
        useCache: true,
        cacheTime: 60000, // 1 minute
      }),
      // Don't provide tags for search results to avoid unnecessary cache invalidation
    }),

    // Example: Force refresh option
    getUserProfileForced: builder.query<User, { userId: string; forceRefresh?: boolean }>({
      query: ({ userId, forceRefresh }) => ({
        url: `/users/${userId}`,
        // Force bypass cache when needed
        forceRefresh,
      }),
      providesTags: (result, error, { userId }) => [{ type: 'User', id: userId }],
    }),

    // Example: Mutation that invalidates cache
    updateUserProfile: builder.mutation<User, { userId: string; data: Partial<User> }>({
      query: ({ userId, data }) => ({
        url: `/users/${userId}`,
        method: 'PATCH',
        body: data,
      }),
      // Invalidate cache on successful update
      invalidatesTags: (result, error, { userId }) => [{ type: 'User', id: userId }],
    }),

    // Example: Get user permissions with Vary header support
    getUserPermissions: builder.query<string[], string>({
      query: (userId) => ({
        url: `/users/${userId}/permissions`,
        // This endpoint varies by Authorization header
        // The enhanced base query will handle this automatically
        useCache: true,
      }),
      providesTags: (result, error, userId) => [{ type: 'Permission', id: userId }],
    }),
  }),
});

// Export hooks
export const {
  useGetUserProfileQuery,
  useGetTeamMembersQuery,
  useSearchUsersQuery,
  useGetUserProfileForcedQuery,
  useUpdateUserProfileMutation,
  useGetUserPermissionsQuery,
} = cachedUserApi;

// Example: Custom hook with cache control
export function useUserProfileWithCacheControl(userId: string) {
  const [forceRefresh, setForceRefresh] = useState(false);
  
  const { data, error, isLoading, isFetching, refetch } = useGetUserProfileForcedQuery(
    { userId, forceRefresh },
    {
      // Skip the query if no userId
      skip: !userId,
    }
  );

  const handleForceRefresh = useCallback(() => {
    setForceRefresh(true);
    refetch();
    // Reset after refetch
    setTimeout(() => setForceRefresh(false), 100);
  }, [refetch]);

  return {
    user: data,
    error,
    isLoading,
    isFetching,
    forceRefresh: handleForceRefresh,
  };
}