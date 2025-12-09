import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createMockEnabledBaseQuery } from './mockBaseQuery';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  roles?: string[];
  organizationId?: string;
  teamId?: string;
  team?: string;
  avatar?: string;
  avatarUrl?: string | null;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Player-specific fields
  jerseyNumber?: string;
  position?: string;
  wellness?: {
    status: 'healthy' | 'limited' | 'injured';
  };
  medicalRestrictions?: string[];
}

export interface GetOrganizationUsersParams {
  organizationId: string;
  role?: string;
  teamId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  isActive: boolean;
  playerCount?: number;
  players?: number;
  ageGroup?: string;
  level?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: createMockEnabledBaseQuery(
    fetchBaseQuery({
      baseUrl: `${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api'}/user`,
      prepareHeaders: (headers) => {
        const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
      },
    })
  ),
  tagTypes: ['User', 'OrganizationUsers', 'Team'],
  endpoints: (builder) => ({
    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    getOrganizationUsers: builder.query<User[], GetOrganizationUsersParams>({
      query: (params) => ({
        url: `/organizations/${params.organizationId}/users`,
        params: {
          role: params.role,
          teamId: params.teamId,
          search: params.search,
          limit: params.limit,
          offset: params.offset,
        },
      }),
      providesTags: (result, error, { organizationId }) => [
        { type: 'OrganizationUsers', id: organizationId },
      ],
    }),

    searchUsers: builder.query<User[], { organizationId: string; query: string }>({
      query: ({ organizationId, query }) => ({
        url: `/organizations/${organizationId}/users/search`,
        params: { q: query },
      }),
      providesTags: ['User'],
    }),

    getPlayers: builder.query<User[], { organizationId?: string; teamId?: string } | void>({
      query: (params) => {
        // Get current user's organization if not provided
        const userDataStr = localStorage.getItem('user_data') || localStorage.getItem('current_user') || '{}';
        const currentUser = JSON.parse(userDataStr);
        const orgId = params?.organizationId || currentUser.organizationId || 'org-123'; // Default to org-123 for mock mode
        
        return {
          url: `/organizations/${orgId}/users`,
          params: {
            role: 'player',
            teamId: params?.teamId,
          },
        };
      },
      transformResponse: (response: User[]) => {
        // Add computed name property for convenience
        return response.map(user => ({
          ...user,
          name: `${user.firstName} ${user.lastName}`.trim() || user.email,
        }));
      },
      providesTags: ['User'],
    }),

    getTeams: builder.query<{ data: Team[] }, { organizationId?: string } | void>({
      query: (params) => {
        // Get current user's organization if not provided
        const userDataStr = localStorage.getItem('user_data') || localStorage.getItem('current_user') || '{}';
        const currentUser = JSON.parse(userDataStr);
        const orgId = params?.organizationId || currentUser.organizationId || 'org-123'; // Default to org-123 for mock mode
        
        return `/organizations/${orgId}/teams`;
      },
      providesTags: ['Team'],
    }),

    getPlayerMedicalData: builder.query<any[], { playerIds: string[] }>({
      query: ({ playerIds }) => ({
        url: `/medical/players`,
        params: { ids: playerIds.join(',') },
      }),
      providesTags: (result, error, { playerIds }) => 
        playerIds.map(id => ({ type: 'User', id })),
    }),
  }),
});

export const {
  useGetUserQuery,
  useGetOrganizationUsersQuery,
  useSearchUsersQuery,
  useGetPlayersQuery,
  useGetTeamsQuery,
  useGetPlayerMedicalDataQuery,
} = userApi;