import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createMockEnabledBaseQuery } from './mockBaseQuery';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api/v1';

interface RecentWorkout {
  id: string;
  name: string;
  type: 'STRENGTH' | 'CONDITIONING' | 'HYBRID' | 'AGILITY';
  createdAt: string;
  lastUsed?: string;
  playerCount: number;
  teamCount: number;
  duration: number;
  isFavorite?: boolean;
  usageCount: number;
  successRate?: number;
  templateId?: string;
  // Enhanced scheduling information
  location?: {
    facilityName: string;
    area?: string;
  };
  scheduledDate?: string;
  assignedPlayers?: string[];
  assignedTeams?: string[];
  recurring?: {
    frequency: string;
    daysOfWeek?: number[];
  };
  hasReminders?: boolean;
}

export const recentWorkoutsApi = createApi({
  reducerPath: 'recentWorkoutsApi',
  baseQuery: createMockEnabledBaseQuery(
    fetchBaseQuery({
      baseUrl: `${API_GATEWAY_URL}/training`,
      prepareHeaders: (headers) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
      },
    })
  ),
  tagTypes: ['RecentWorkout'],
  endpoints: (builder) => ({
    getRecentWorkouts: builder.query<RecentWorkout[], void>({
      query: () => '/training/workouts/recent',
      providesTags: ['RecentWorkout'],
    }),
    
    updateWorkoutFavorite: builder.mutation<void, { workoutId: string; isFavorite: boolean }>({
      query: ({ workoutId, isFavorite }) => ({
        url: `/training/workouts/${workoutId}/favorite`,
        method: 'PATCH',
        body: { isFavorite },
      }),
      invalidatesTags: ['RecentWorkout'],
    }),
    
    incrementWorkoutUsage: builder.mutation<void, string>({
      query: (workoutId) => ({
        url: `/training/workouts/${workoutId}/usage`,
        method: 'POST',
      }),
      invalidatesTags: ['RecentWorkout'],
    }),
  }),
});

export const {
  useGetRecentWorkoutsQuery,
  useUpdateWorkoutFavoriteMutation,
  useIncrementWorkoutUsageMutation,
} = recentWorkoutsApi;