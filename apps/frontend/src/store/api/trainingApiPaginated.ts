import { trainingApi } from './trainingApi';
import type { 
  WorkoutSession, 
  Exercise, 
  PlayerWorkoutLoad, 
  WorkoutExecution, 
  ExerciseExecution,
  ExerciseTemplate,
  ApiResponse 
} from '@hockey-hub/shared-lib';
import type { PaginationParams, PaginatedResponse, PaginatedApiResponse } from '@/types/pagination.types';
import type { SessionTemplate } from '@/features/physical-trainer/types';
import type { PhysicalTest, TestBatch, TrainingSession } from './trainingApi';

// Extend the existing training API with paginated endpoints
export const trainingApiPaginated = trainingApi.injectEndpoints({
  endpoints: (builder) => ({
    // Paginated Workout Sessions
    getWorkoutSessionsPaginated: builder.query<
      PaginatedApiResponse<WorkoutSession>,
      PaginationParams & { 
        date?: string; 
        teamId?: string; 
        playerId?: string; 
        status?: string;
        type?: string;
        search?: string;
      }
    >({
      query: ({ page = 1, pageSize = 20, ...params }) => ({
        url: '/sessions/paginated',
        params: {
          ...params,
          page,
          pageSize,
        },
      }),
      providesTags: (result) => 
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Session' as const, id })),
              { type: 'Session', id: 'PAGINATED_LIST' },
            ]
          : [{ type: 'Session', id: 'PAGINATED_LIST' }],
    }),

    // Paginated Players List
    getPlayersPaginated: builder.query<
      PaginatedApiResponse<any>,
      PaginationParams & {
        organizationId?: string;
        teamId?: string;
        search?: string;
        wellness?: string;
        position?: string;
        hasRestrictions?: boolean;
      }
    >({
      query: ({ page = 1, pageSize = 20, organizationId, ...params }) => {
        const userDataStr = localStorage.getItem('user_data') || localStorage.getItem('current_user') || '{}';
        const currentUser = JSON.parse(userDataStr);
        const orgId = organizationId || currentUser.organizationId || 'org-123';
        
        return {
          url: `/organizations/${orgId}/users/paginated`,
          params: {
            ...params,
            page,
            pageSize,
            role: 'player',
          },
        };
      },
      providesTags: ['User'],
    }),

    // Paginated Exercise Library
    getExercisesPaginated: builder.query<
      PaginatedApiResponse<ExerciseTemplate>,
      PaginationParams & {
        category?: string;
        search?: string;
        equipment?: string[];
        difficulty?: string;
        muscleGroups?: string[];
        organizationId?: string;
      }
    >({
      query: ({ page = 1, pageSize = 20, ...params }) => ({
        url: '/exercises/paginated',
        params: {
          ...params,
          page,
          pageSize,
          equipment: params.equipment?.join(','),
          muscleGroups: params.muscleGroups?.join(','),
        },
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Exercise' as const, id })),
              { type: 'Exercise', id: 'PAGINATED_LIST' },
            ]
          : [{ type: 'Exercise', id: 'PAGINATED_LIST' }],
    }),

    // Paginated Medical Reports
    getMedicalReportsPaginated: builder.query<
      PaginatedApiResponse<any>,
      PaginationParams & {
        playerId?: string;
        teamId?: string;
        status?: 'active' | 'resolved' | 'pending';
        severity?: string;
        dateFrom?: string;
        dateTo?: string;
      }
    >({
      query: ({ page = 1, pageSize = 20, ...params }) => ({
        url: '/medical/reports/paginated',
        params: {
          ...params,
          page,
          pageSize,
        },
      }),
      providesTags: ['User'],
    }),

    // Paginated Test Results
    getTestsPaginated: builder.query<
      PaginatedApiResponse<PhysicalTest>,
      PaginationParams & {
        playerIds?: string[];
        testBatchId?: string;
        testType?: string;
        dateFrom?: string;
        dateTo?: string;
      }
    >({
      query: ({ page = 1, pageSize = 20, playerIds, ...params }) => ({
        url: '/tests/paginated',
        params: {
          ...params,
          page,
          pageSize,
          playerIds: playerIds?.join(','),
        },
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Test' as const, id })),
              { type: 'Test', id: 'PAGINATED_LIST' },
            ]
          : [{ type: 'Test', id: 'PAGINATED_LIST' }],
    }),

    // Paginated Session Templates with enhanced filtering
    getSessionTemplatesPaginated: builder.query<
      PaginatedApiResponse<SessionTemplate>,
      PaginationParams & {
        category?: string;
        type?: string;
        difficulty?: string;
        visibility?: string;
        search?: string;
        tags?: string[];
        createdBy?: string;
        favorites?: boolean;
        shared?: boolean;
      }
    >({
      query: ({ page = 1, pageSize = 20, tags, ...params }) => ({
        url: '/templates/paginated',
        params: {
          ...params,
          page,
          pageSize,
          tags: tags?.join(','),
        },
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Template' as const, id })),
              { type: 'Template', id: 'PAGINATED_LIST' },
            ]
          : [{ type: 'Template', id: 'PAGINATED_LIST' }],
    }),

    // Cursor-based pagination for activity feeds
    getWorkoutExecutionsCursor: builder.query<
      {
        data: WorkoutExecution[];
        cursor: {
          next?: string;
          previous?: string;
          hasNext: boolean;
          hasPrevious: boolean;
        };
      },
      {
        cursor?: string;
        limit?: number;
        playerId?: string;
        sessionId?: string;
        status?: string;
      }
    >({
      query: ({ cursor, limit = 20, ...params }) => ({
        url: '/executions/cursor',
        params: {
          ...params,
          cursor,
          limit,
        },
      }),
      providesTags: ['Execution'],
      // Merge new data with existing for infinite scroll
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { cursor, ...otherArgs } = queryArgs;
        return `${endpointName}(${JSON.stringify(otherArgs)})`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.cursor) {
          // Append new items for forward pagination
          return {
            data: [...currentCache.data, ...newItems.data],
            cursor: newItems.cursor,
          };
        }
        return newItems;
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return currentArg?.cursor !== previousArg?.cursor;
      },
    }),

    // Paginated Team Rosters
    getTeamRostersPaginated: builder.query<
      PaginatedApiResponse<any>,
      PaginationParams & {
        organizationId?: string;
        includeStats?: boolean;
        includeInjuries?: boolean;
      }
    >({
      query: ({ page = 1, pageSize = 20, organizationId, ...params }) => {
        const userDataStr = localStorage.getItem('user_data') || localStorage.getItem('current_user') || '{}';
        const currentUser = JSON.parse(userDataStr);
        const orgId = organizationId || currentUser.organizationId || 'org-123';
        
        return {
          url: `/organizations/${orgId}/teams/rosters/paginated`,
          params: {
            ...params,
            page,
            pageSize,
          },
        };
      },
      providesTags: ['Team'],
    }),

    // Search with pagination
    searchWorkoutsPaginated: builder.query<
      PaginatedApiResponse<WorkoutSession>,
      PaginationParams & {
        query: string;
        filters?: {
          type?: string[];
          teamId?: string;
          dateFrom?: string;
          dateTo?: string;
          tags?: string[];
        };
      }
    >({
      query: ({ page = 1, pageSize = 20, query, filters }) => ({
        url: '/sessions/search',
        params: {
          q: query,
          page,
          pageSize,
          ...filters,
          type: filters?.type?.join(','),
          tags: filters?.tags?.join(','),
        },
      }),
      providesTags: ['Session'],
    }),

    // Analytics with pagination
    getPlayerPerformanceHistoryPaginated: builder.query<
      PaginatedApiResponse<any>,
      PaginationParams & {
        playerId: string;
        metricType?: string;
        dateFrom?: string;
        dateTo?: string;
      }
    >({
      query: ({ page = 1, pageSize = 20, playerId, ...params }) => ({
        url: `/analytics/player/${playerId}/performance/paginated`,
        params: {
          ...params,
          page,
          pageSize,
        },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWorkoutSessionsPaginatedQuery,
  useGetPlayersPaginatedQuery,
  useGetExercisesPaginatedQuery,
  useGetMedicalReportsPaginatedQuery,
  useGetTestsPaginatedQuery,
  useGetSessionTemplatesPaginatedQuery,
  useGetWorkoutExecutionsCursorQuery,
  useGetTeamRostersPaginatedQuery,
  useSearchWorkoutsPaginatedQuery,
  useGetPlayerPerformanceHistoryPaginatedQuery,
} = trainingApiPaginated;