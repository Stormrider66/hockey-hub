import { createApi } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from './mockBaseQuery';
import { PaginatedResponse } from '@hockey-hub/shared-lib/pagination';

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

export interface Drill {
  id: string;
  name: string;
  category: 'warmup' | 'skills' | 'tactics' | 'conditioning' | 'scrimmage' | 'cooldown';
  duration: number;
  zone: 'full' | 'half' | 'third' | 'neutral' | 'offensive' | 'defensive';
  equipment: string[];
  description?: string;
  objectives?: string[];
  keyPoints?: string[];
  videoUrl?: string;
  intensity: 'low' | 'medium' | 'high';
  playerCount?: string;
}

export interface PracticePlan {
  id: string;
  name: string;
  date?: Date;
  duration: number;
  teamId?: string;
  objectives: string[];
  drills: Drill[];
  notes?: string;
  equipment: string[];
  createdBy: string;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  primaryFocus?: 'skills' | 'tactics' | 'conditioning' | 'game_prep' | 'recovery' | 'evaluation';
  attendance?: Array<{
    playerId: string;
    present: boolean;
    reason?: string;
  }>;
}

export interface CreatePracticePlanDto {
  name: string;
  date?: Date;
  teamId: string;
  objectives: string[];
  drills: Drill[];
  notes?: string;
  primaryFocus?: string;
}

export interface UpdatePracticePlanDto {
  name?: string;
  date?: Date;
  objectives?: string[];
  drills?: Drill[];
  notes?: string;
  status?: string;
}

export interface PracticePlanQuery {
  teamId?: string;
  status?: string;
  primaryFocus?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface DrillLibrary {
  id: string;
  name: string;
  category: string;
  drills: Drill[];
  totalCount: number;
}

// Tactical Plan interfaces
export type TacticalCategory = 'powerplay' | 'penalty_kill' | 'even_strength' | 'offensive_zone' | 'defensive_zone' | 'neutral_zone' | 'faceoff' | 'breakout' | 'forecheck' | 'backcheck' | 'transition';
export type FormationType = 'powerplay' | 'penalty_kill' | 'even_strength' | '3v3' | '4v4' | '6v5' | '5v6';
export type ZoneType = 'offensive' | 'defensive' | 'neutral';

export interface PlayerPosition {
  position: string;
  x: number;
  y: number;
}

export interface Formation {
  type: FormationType;
  zones: {
    offensive: PlayerPosition[];
    neutral: PlayerPosition[];
    defensive: PlayerPosition[];
  };
}

export interface PlayerAssignment {
  playerId: string;
  position: string;
  role: string;
}

export interface TacticalPlan {
  id: string;
  name: string;
  organizationId: string;
  coachId: string;
  teamId: string;
  category: TacticalCategory;
  formation: Formation;
  playerAssignments: PlayerAssignment[];
  description?: string;
  triggers?: Array<{
    condition: string;
    action: string;
  }>;
  videoReferences?: Array<{
    url: string;
    title: string;
    timestamp?: string;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  successRate?: number;
  usageCount?: number;
  lastUsed?: Date;
}

export interface CreateTacticalPlanDto {
  name: string;
  teamId: string;
  category: TacticalCategory;
  formation: Formation;
  playerAssignments: PlayerAssignment[];
  description?: string;
}

export interface UpdateTacticalPlanDto {
  name?: string;
  category?: TacticalCategory;
  formation?: Formation;
  playerAssignments?: PlayerAssignment[];
  description?: string;
  isActive?: boolean;
}

export interface TacticalPlanQuery {
  teamId?: string;
  category?: TacticalCategory;
  isActive?: boolean;
  formationType?: FormationType;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PlaybookPlay {
  id: string;
  name: string;
  description: string;
  category: string;
  formation: Formation;
  videoUrl?: string;
  successRate?: number;
  usageCount?: number;
}

export const coachApi = createApi({
  reducerPath: 'coachApi',
  baseQuery: mockBaseQuery,
  tagTypes: ['CoachOverview', 'PracticePlans', 'Drills', 'PracticePlanStats', 'TacticalPlans', 'PlaybookPlays', 'AIInsights'],
  endpoints: (builder) => ({
    getCoachOverview: builder.query<CoachOverview, string | void>({
      query: (teamId) => `coach/overview${teamId ? `?teamId=${teamId}` : ''}`,
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
    
    // Practice Plans endpoints
    getPracticePlans: builder.query<PaginatedResponse<PracticePlan>, PracticePlanQuery>({
      query: (params) => ({
        url: 'planning/practice-plans',
        params,
      }),
      providesTags: ['PracticePlans'],
    }),
    
    getPracticePlan: builder.query<PracticePlan, string>({
      query: (id) => `planning/practice-plans/${id}`,
      providesTags: (result, error, id) => [{ type: 'PracticePlans', id }],
    }),
    
    createPracticePlan: builder.mutation<PracticePlan, CreatePracticePlanDto>({
      query: (plan) => ({
        url: 'planning/practice-plans',
        method: 'POST',
        body: plan,
      }),
      invalidatesTags: ['PracticePlans', 'PracticePlanStats'],
    }),
    
    updatePracticePlan: builder.mutation<PracticePlan, { id: string; updates: UpdatePracticePlanDto }>({
      query: ({ id, updates }) => ({
        url: `planning/practice-plans/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'PracticePlans', id },
        'PracticePlans',
      ],
    }),
    
    deletePracticePlan: builder.mutation<void, string>({
      query: (id) => ({
        url: `planning/practice-plans/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PracticePlans', 'PracticePlanStats'],
    }),
    
    duplicatePracticePlan: builder.mutation<PracticePlan, { id: string; newDate?: Date; newTitle?: string }>({
      query: ({ id, newDate, newTitle }) => ({
        url: `planning/practice-plans/${id}/duplicate`,
        method: 'POST',
        body: { newDate, newTitle },
      }),
      invalidatesTags: ['PracticePlans'],
    }),
    
    updateAttendance: builder.mutation<PracticePlan, { id: string; attendance: Array<{ playerId: string; present: boolean; reason?: string }> }>({
      query: ({ id, attendance }) => ({
        url: `planning/practice-plans/${id}/attendance`,
        method: 'PUT',
        body: { attendance },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PracticePlans', id }],
    }),
    
    getPracticePlanStats: builder.query<any, { teamId?: string; startDate?: string; endDate?: string }>({
      query: (params) => ({
        url: 'planning/practice-plans/stats',
        params,
      }),
      providesTags: ['PracticePlanStats'],
    }),
    
    // Drill Library endpoints
    getDrillLibrary: builder.query<DrillLibrary[], { category?: string; search?: string }>({
      query: (params) => ({
        url: 'planning/drills',
        params,
      }),
      providesTags: ['Drills'],
    }),
    
    getDrillsByCategory: builder.query<Drill[], string>({
      query: (category) => `planning/drills/category/${category}`,
      providesTags: (result, error, category) => [{ type: 'Drills', id: category }],
    }),
    
    // Tactical Plans endpoints
    getTacticalPlans: builder.query<PaginatedResponse<TacticalPlan>, TacticalPlanQuery>({
      query: (params) => ({
        url: 'planning/coach/tactical-plans',
        params,
      }),
      providesTags: ['TacticalPlans'],
    }),
    
    getTacticalPlan: builder.query<TacticalPlan, string>({
      query: (id) => `planning/coach/tactical-plans/${id}`,
      providesTags: (result, error, id) => [{ type: 'TacticalPlans', id }],
    }),
    
    createTacticalPlan: builder.mutation<TacticalPlan, CreateTacticalPlanDto>({
      query: (plan) => ({
        url: 'planning/coach/tactical-plans',
        method: 'POST',
        body: plan,
      }),
      invalidatesTags: ['TacticalPlans'],
    }),
    
    updateTacticalPlan: builder.mutation<TacticalPlan, { id: string; updates: UpdateTacticalPlanDto }>({
      query: ({ id, updates }) => ({
        url: `planning/coach/tactical-plans/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'TacticalPlans', id },
        'TacticalPlans',
      ],
    }),
    
    deleteTacticalPlan: builder.mutation<void, string>({
      query: (id) => ({
        url: `planning/coach/tactical-plans/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TacticalPlans'],
    }),
    
    searchTacticalPlans: builder.query<TacticalPlan[], { query: string; category?: TacticalCategory }>({
      query: (params) => ({
        url: 'planning/coach/tactical-plans/search',
        params,
      }),
      providesTags: ['TacticalPlans'],
    }),
    
    // Playbook endpoints
    getPlaybookPlays: builder.query<PlaybookPlay[], string>({
      query: (teamId) => `planning/coach/playbook/${teamId}`,
      providesTags: ['PlaybookPlays'],
    }),
    
    sharePlaybook: builder.mutation<{ shareUrl: string }, { teamId: string; playerIds: string[] }>({
      query: ({ teamId, playerIds }) => ({
        url: `planning/coach/playbook/${teamId}/share`,
        method: 'POST',
        body: { playerIds },
      }),
      invalidatesTags: ['PlaybookPlays'],
    }),
    
    // AI Insights endpoints
    getAIInsights: builder.query<any, { teamId: string; type: 'power_play' | 'defensive' | 'breakout' }>({
      query: ({ teamId, type }) => ({
        url: 'planning/coach/ai-insights',
        params: { teamId, type },
      }),
      providesTags: ['AIInsights'],
    }),
    
    applyAISuggestion: builder.mutation<TacticalPlan, { suggestionId: string; teamId: string }>({
      query: ({ suggestionId, teamId }) => ({
        url: 'planning/coach/ai-insights/apply',
        method: 'POST',
        body: { suggestionId, teamId },
      }),
      invalidatesTags: ['TacticalPlans', 'AIInsights'],
    }),
  }),
});

export const {
  useGetCoachOverviewQuery,
  useGetPracticePlansQuery,
  useGetPracticePlanQuery,
  useCreatePracticePlanMutation,
  useUpdatePracticePlanMutation,
  useDeletePracticePlanMutation,
  useDuplicatePracticePlanMutation,
  useUpdateAttendanceMutation,
  useGetPracticePlanStatsQuery,
  useGetDrillLibraryQuery,
  useGetDrillsByCategoryQuery,
  useGetTacticalPlansQuery,
  useGetTacticalPlanQuery,
  useCreateTacticalPlanMutation,
  useUpdateTacticalPlanMutation,
  useDeleteTacticalPlanMutation,
  useSearchTacticalPlansQuery,
  useGetPlaybookPlaysQuery,
  useSharePlaybookMutation,
  useGetAIInsightsQuery,
  useApplyAISuggestionMutation,
} = coachApi;