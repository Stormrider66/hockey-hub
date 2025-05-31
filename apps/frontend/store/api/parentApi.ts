import { apiSlice } from "./apiSlice";

type Event = { date: string; title: string; location: string; time: string };

interface ParentOverviewResponse {
  upcoming: Event[];
  fullSchedule: Event[];
}

export const parentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChildOverview: builder.query<ParentOverviewResponse, string>({
      query: (childId) => `/children/${childId}/overview`,
      providesTags: (r, _e, id) => [{ type: "Player" as const, id }],
    }),
  }),
});

export const { useGetChildOverviewQuery } = parentApi; 