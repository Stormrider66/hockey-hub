import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const parentApi = createApi({
  reducerPath: 'parentApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/parent' }),
  endpoints: (builder) => ({
    getChildOverview: builder.query<any, string>({
      query: (childId) => `/children/${childId}/overview`,
    }),
  }),
});

export const { useGetChildOverviewQuery } = parentApi;




