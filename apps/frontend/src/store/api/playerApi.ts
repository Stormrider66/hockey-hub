import React from 'react';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { createMockEnabledBaseQuery } from './mockBaseQuery';

// Types for API responses
interface PlayerInfo {
  name: string;
  number: number;
  position: string;
  team: string;
  age?: number;
  height?: string;
  weight?: string;
}

interface ScheduleEvent {
  time: string;
  title: string;
  location: string;
  type: 'meeting' | 'ice-training' | 'physical-training' | 'game' | 'other';
  mandatory?: boolean;
  notes?: string;
}

interface UpcomingEvent {
  date: string;
  title: string;
  time: string;
  location?: string;
  type: 'meeting' | 'ice-training' | 'physical-training' | 'game' | 'other';
  importance: 'High' | 'Medium' | 'Low';
}

interface Training {
  title: string;
  due: string;
  progress: number;
  type: 'strength' | 'cardio' | 'skills' | 'recovery';
  description: string;
  assignedBy: string;
  estimatedTime: string;
}

interface DevelopmentGoal {
  goal: string;
  progress: number;
  target: string;
  category: 'technical' | 'physical' | 'mental' | 'tactical';
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
}

interface ReadinessEntry {
  date: string;
  sleepHours: number;
  sleepQuality: number;
  energyLevel: number;
  mood: number;
  motivation: number;
  stressLevel: number;
  soreness: number;
  hydration: number;
  nutrition: number;
  readinessScore: number;
  hrv: number;
  restingHeartRate: number;
}

interface WellnessStats {
  weeklyAverage: {
    sleepQuality: number;
    energyLevel: number;
    mood: number;
    readinessScore: number;
  };
  trends: Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
  }>;
  recommendations: string[];
  insights?: Array<{
    type: 'positive' | 'warning';
    text: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

interface PlayerOverviewResponse {
  playerInfo: PlayerInfo;
  schedule: ScheduleEvent[];
  upcoming: UpcomingEvent[];
  training: Training[];
  developmentGoals: DevelopmentGoal[];
  readiness: ReadinessEntry[];
  wellnessStats: WellnessStats;
}

interface WellnessEntry {
  sleepHours: number;
  sleepQuality: number;
  energyLevel: number;
  mood: number;
  motivation: number;
  stressLevel: number;
  soreness: number;
  hydration: number;
  nutrition: number;
  bodyWeight: number;
  restingHeartRate: number;
  hrv: number;
  hrvDevice: 'whoop' | 'oura' | 'garmin' | 'polar' | 'manual';
  notes: string;
  symptoms: string[];
  injuries: string[];
}

interface SubmitWellnessRequest {
  playerId: number;
  entry: WellnessEntry;
}

interface CompleteTrainingRequest {
  playerId: number;
  trainingId: string;
  completionNotes: string;
}

// Create the API slice
// Create base query with mock support
const baseQuery = fetchBaseQuery({ 
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  prepareHeaders: (headers) => {
    // Add any auth headers here if needed
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const playerApi = createApi({
  reducerPath: 'playerApi',
  baseQuery: createMockEnabledBaseQuery(baseQuery),
  tagTypes: ['PlayerOverview', 'Wellness', 'Training', 'Players'],
  endpoints: (builder) => ({
    getPlayers: builder.query<{ data: Array<{
      id: string;
      firstName: string;
      lastName: string;
      jerseyNumber?: string;
      position?: string;
      teamId?: string;
      teamName?: string;
      profilePicture?: string;
      lastWorkout?: string;
    }> }, { organizationId: string; includeStats?: boolean }>({
      query: ({ organizationId, includeStats = false }) => ({
        url: `organizations/${organizationId}/players`,
        params: { includeStats },
      }),
      providesTags: ['Players'],
    }),
    getPlayerOverview: builder.query<PlayerOverviewResponse, number>({
      query: (playerId) => `players/${playerId}/overview`,
      providesTags: ['PlayerOverview'],
    }),
    submitWellness: builder.mutation<{ success: boolean; message: string }, SubmitWellnessRequest>({
      query: ({ playerId, entry }) => ({
        url: `players/${playerId}/wellness`,
        method: 'POST',
        body: entry,
      }),
      invalidatesTags: ['PlayerOverview', 'Wellness'],
    }),
    completeTraining: builder.mutation<{ success: boolean; message: string }, CompleteTrainingRequest>({
      query: ({ playerId, trainingId, completionNotes }) => ({
        url: `players/${playerId}/training/${trainingId}/complete`,
        method: 'POST',
        body: { completionNotes },
      }),
      invalidatesTags: ['PlayerOverview', 'Training'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetPlayersQuery,
  useGetPlayerOverviewQuery,
  useSubmitWellnessMutation,
  useCompleteTrainingMutation,
} = playerApi;