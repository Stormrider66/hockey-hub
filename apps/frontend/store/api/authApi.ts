import { apiSlice } from './apiSlice';
import { LoginRequest, AuthResponse, User } from '../../types/auth';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: 'auth/login',
        method: 'POST',
        body,
      }),
    }),
    refreshToken: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: 'auth/refresh-token',
        method: 'POST',
      }),
    }),
    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
    }),
    currentUser: builder.query<User, void>({
      query: () => 'users/me',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useCurrentUserQuery,
} = authApi; 