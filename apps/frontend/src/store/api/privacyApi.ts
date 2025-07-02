import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export enum MessagePrivacy {
  EVERYONE = 'everyone',
  TEAM_ONLY = 'team_only',
  CONTACTS_ONLY = 'contacts_only',
  NO_ONE = 'no_one'
}

export enum OnlineVisibility {
  EVERYONE = 'everyone',
  TEAM_ONLY = 'team_only',
  CONTACTS_ONLY = 'contacts_only',
  NO_ONE = 'no_one'
}

export interface PrivacySettings {
  userId: string;
  whoCanMessage: MessagePrivacy;
  onlineVisibility: OnlineVisibility;
  showReadReceipts: boolean;
  showTypingIndicators: boolean;
  showLastSeen: boolean;
  allowProfileViews: boolean;
  blockScreenshots: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedUser {
  id: string;
  blockerId: string;
  blockedUserId: string;
  reason?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface BlockUserRequest {
  userId: string;
  reason?: string;
}

export interface UpdatePrivacySettingsRequest {
  whoCanMessage?: MessagePrivacy;
  onlineVisibility?: OnlineVisibility;
  showReadReceipts?: boolean;
  showTypingIndicators?: boolean;
  showLastSeen?: boolean;
  allowProfileViews?: boolean;
  blockScreenshots?: boolean;
}

export const privacyApi = createApi({
  reducerPath: 'privacyApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api/communication',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['PrivacySettings', 'BlockedUsers'],
  endpoints: (builder) => ({
    // Privacy settings
    getPrivacySettings: builder.query<PrivacySettings, void>({
      query: () => '/api/privacy/settings',
      providesTags: ['PrivacySettings'],
    }),
    updatePrivacySettings: builder.mutation<PrivacySettings, UpdatePrivacySettingsRequest>({
      query: (settings) => ({
        url: '/api/privacy/settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['PrivacySettings'],
    }),

    // Block/unblock users
    getBlockedUsers: builder.query<BlockedUser[], void>({
      query: () => '/api/privacy/blocked',
      providesTags: ['BlockedUsers'],
    }),
    blockUser: builder.mutation<BlockedUser, BlockUserRequest>({
      query: (request) => ({
        url: '/api/privacy/block',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['BlockedUsers'],
    }),
    unblockUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/api/privacy/block/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BlockedUsers'],
    }),
    isUserBlocked: builder.query<{ isBlocked: boolean }, string>({
      query: (userId) => `/api/privacy/blocked/${userId}`,
    }),

    // Permissions
    canMessage: builder.query<{ canMessage: boolean }, string>({
      query: (userId) => `/api/privacy/can-message/${userId}`,
    }),
    canSeeOnline: builder.query<{ canSeeOnline: boolean }, string>({
      query: (userId) => `/api/privacy/can-see-online/${userId}`,
    }),
  }),
});

export const {
  useGetPrivacySettingsQuery,
  useUpdatePrivacySettingsMutation,
  useGetBlockedUsersQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useIsUserBlockedQuery,
  useCanMessageQuery,
  useCanSeeOnlineQuery,
} = privacyApi;