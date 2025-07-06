import { createApi } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from './mockBaseQuery';

export interface CoachOverview {
  teamName: string;
  playersCount: number;
  upcomingPractices: number;
  todaySchedule: Array<{
    id: string;
    time: string;
    title: string;
    location: string;
  }>;
  recentPerformance: {
    wins: number;
    losses: number;
    draws: number;
  };
}

export const coachApi = createApi({
  reducerPath: 'coachApi',
  baseQuery: mockBaseQuery,
  tagTypes: ['CoachOverview'],
  endpoints: (builder) => ({
    getCoachOverview: builder.query<CoachOverview, void>({
      query: () => 'coach/overview',
      providesTags: ['CoachOverview'],
      transformResponse: () => ({
        teamName: 'Hockey Stars U16',
        playersCount: 22,
        upcomingPractices: 5,
        todaySchedule: [
          {
            id: '1',
            time: '16:00',
            title: 'Team Practice',
            location: 'Main Rink'
          },
          {
            id: '2',
            time: '18:00',
            title: 'Skills Training',
            location: 'Practice Rink'
          }
        ],
        recentPerformance: {
          wins: 12,
          losses: 4,
          draws: 2
        }
      })
    }),
  }),
});

export const { useGetCoachOverviewQuery } = coachApi;