import { apiSlice } from './apiSlice';
import { LoginRequest, AuthResponse, User } from '@/types/auth';
import { clearCredentials } from '../features/authSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    refreshToken: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: 'auth/refresh-token',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Clear credentials from store on successful logout
          dispatch(clearCredentials());
        } catch (error) {
          // Even if logout fails on server, clear local credentials
          dispatch(clearCredentials());
        }
      },
    }),
    currentUser: builder.query<User, void>({
      query: () => 'users/me',
      providesTags: ['User'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useCurrentUserQuery,
} = authApi; 