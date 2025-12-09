import { createApi } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from './mockBaseQuery';

export interface OrganizationSettings {
  id: string;
  name: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  timezone: string;
  language: string;
  features: {
    chat: boolean;
    medical: boolean;
    training: boolean;
    payment: boolean;
    statistics: boolean;
  };
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: mockBaseQuery,
  tagTypes: ['Settings', 'Users', 'Teams', 'Roles'],
  endpoints: (builder) => ({
    getOrganizationSettings: builder.query<OrganizationSettings, void>({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),
    updateOrganizationSettings: builder.mutation<OrganizationSettings, Partial<OrganizationSettings>>({
      query: (settings) => ({
        url: '/settings',
        method: 'PATCH',
        body: settings,
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});