import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { isMockMode } from '@/utils/mockAuth';
import { mockBaseQuery } from './mockAuthApi';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      permissions: Array<{
        id: string;
        name: string;
        resource: string;
        action: string;
      }>;
    };
    organizationId?: string;
    teams?: Array<{
      id: string;
      name: string;
      role: string;
    }>;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string; // For backward compatibility
  firstName?: string;
  lastName?: string;
  role: string;
  teamCode?: string;
}

// RefreshToken now uses cookies, no request body needed

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  user?: LoginResponse['user'];
  expires_in?: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
  user?: LoginResponse['user'];
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export interface Session {
  id: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    browser: string;
    os: string;
    device: string;
  };
  ipAddress: string;
  location?: {
    city?: string;
    country?: string;
  };
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface GetSessionsResponse {
  sessions: Session[];
}

export interface RevokeSessionRequest {
  sessionId: string;
}

export interface RevokeSessionResponse {
  message: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: isMockMode() 
    ? mockBaseQuery 
    : fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api/auth',
        credentials: 'include', // Always include cookies
        prepareHeaders: (headers, { getState }) => {
          const token = localStorage.getItem('access_token');
          if (token) {
            headers.set('authorization', `Bearer ${token}`);
          }
          return headers;
        },
      }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<LoginResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/register',
        method: 'POST',
        body: userData,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
    }),
    refreshToken: builder.mutation<RefreshTokenResponse, void>({
      query: () => ({
        url: '/refresh',
        method: 'POST',
        credentials: 'include', // Include cookies
      }),
    }),
    forgotPassword: builder.mutation<ForgotPasswordResponse, ForgotPasswordRequest>({
      query: (data) => ({
        url: '/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation<ResetPasswordResponse, ResetPasswordRequest>({
      query: (data) => ({
        url: '/reset-password',
        method: 'POST',
        body: data,
      }),
    }),
    getMe: builder.query<LoginResponse['user'], void>({
      query: () => '/me',
    }),
    getCurrentUser: builder.query<LoginResponse['user'], void>({
      query: () => '/me',
    }),
    verifyEmail: builder.mutation<VerifyEmailResponse, VerifyEmailRequest>({
      query: (data) => ({
        url: '/verify-email',
        method: 'POST',
        body: data,
      }),
    }),
    resendVerificationEmail: builder.mutation<ResendVerificationResponse, ResendVerificationRequest>({
      query: (data) => ({
        url: '/resend-verification',
        method: 'POST',
        body: data,
      }),
    }),
    getSessions: builder.query<GetSessionsResponse, void>({
      query: () => '/sessions',
    }),
    revokeSession: builder.mutation<RevokeSessionResponse, RevokeSessionRequest>({
      query: (data) => ({
        url: `/sessions/${data.sessionId}`,
        method: 'DELETE',
      }),
    }),
    revokeAllSessions: builder.mutation<RevokeSessionResponse, void>({
      query: () => ({
        url: '/sessions',
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useGetCurrentUserQuery,
  useVerifyEmailMutation,
  useResendVerificationEmailMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useRevokeAllSessionsMutation,
} = authApi;