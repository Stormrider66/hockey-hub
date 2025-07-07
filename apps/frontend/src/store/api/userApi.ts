import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  roles?: string[];
  organizationId?: string;
  teamId?: string;
  avatar?: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
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

    getPlayers: builder.query<User[], { organizationId?: string; teamId?: string }>({
      query: ({ organizationId, teamId }) => {
        // Get current user's organization if not provided
        const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
        const orgId = organizationId || currentUser.organizationId || '';
        
        return {
          url: `/organizations/${orgId}/users`,
          params: {
            role: 'player',
            teamId,
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

    getTeams: builder.query<{ data: Team[] }, { organizationId: string }>({
      query: ({ organizationId }) => `/organizations/${organizationId}/teams`,
      providesTags: ['Team'],
    }),
  }),
});

export const {
  useGetUserQuery,
  useGetOrganizationUsersQuery,
  useSearchUsersQuery,
  useGetPlayersQuery,
  useGetTeamsQuery,
} = userApi;