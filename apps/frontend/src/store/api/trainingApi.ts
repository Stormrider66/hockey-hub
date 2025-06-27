import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Types
export interface TrainingSession {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'speed' | 'recovery' | 'mixed';
  date: string;
  time: string;
  duration: number; // minutes
  location: string;
  team: string;
  teamId?: string;
  description?: string;
  maxParticipants: number;
  currentParticipants: number;
  intensity: 'low' | 'medium' | 'high' | 'max';
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  exercises: Exercise[];
  equipment: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'agility' | 'power';
  sets?: number;
  reps?: number | string;
  duration?: number; // seconds
  rest?: number; // seconds
  weight?: string;
  notes?: string;
  orderIndex: number;
}

export interface PhysicalTest {
  id: string;
  playerId: string;
  testBatchId: string;
  testType: string;
  value: number;
  unit: string;
  date: string;
  notes?: string;
  percentile?: number;
  previousValue?: number;
  change?: number;
  createdBy: string;
  createdAt: string;
}

export interface TestBatch {
  id: string;
  name: string;
  date: string;
  status: 'active' | 'completed' | 'scheduled';
  completedTests: number;
  totalTests: number;
  teamId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  category: string;
  exercises: Exercise[];
  duration: number;
  equipment: string[];
  description?: string;
  lastUsed?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateSessionRequest {
  name: string;
  type: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  team: string;
  teamId?: string;
  description?: string;
  maxParticipants: number;
  intensity: string;
  exercises: Omit<Exercise, 'id'>[];
  equipment: string[];
}

export interface UpdateSessionRequest {
  id: string;
  data: Partial<CreateSessionRequest>;
}

export interface CreateTestRequest {
  playerId: string;
  testBatchId: string;
  testType: string;
  value: number;
  unit: string;
  notes?: string;
}

export interface CreateTestBatchRequest {
  name: string;
  date: string;
  teamId?: string;
  notes?: string;
}

// API configuration
const TRAINING_SERVICE_URL = process.env.NEXT_PUBLIC_TRAINING_SERVICE_URL || 'http://localhost:3004';

// Create the API slice
export const trainingApi = createApi({
  reducerPath: 'trainingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${TRAINING_SERVICE_URL}/api`,
    prepareHeaders: (headers, { getState }) => {
      // Get token from auth state if available
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Session', 'Test', 'TestBatch', 'Exercise', 'Template'],
  endpoints: (builder) => ({
    // Training Sessions
    getSessions: builder.query<TrainingSession[], { date?: string; teamId?: string; status?: string }>({
      query: (params) => ({
        url: '/sessions',
        params,
      }),
      providesTags: ['Session'],
    }),

    getSessionById: builder.query<TrainingSession, string>({
      query: (id) => `/sessions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Session', id }],
    }),

    createSession: builder.mutation<TrainingSession, CreateSessionRequest>({
      query: (session) => ({
        url: '/sessions',
        method: 'POST',
        body: session,
      }),
      invalidatesTags: ['Session'],
    }),

    updateSession: builder.mutation<TrainingSession, UpdateSessionRequest>({
      query: ({ id, data }) => ({
        url: `/sessions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Session', id }, 'Session'],
    }),

    deleteSession: builder.mutation<void, string>({
      query: (id) => ({
        url: `/sessions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Session'],
    }),

    startSession: builder.mutation<TrainingSession, string>({
      query: (id) => ({
        url: `/sessions/${id}/start`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Session', id }],
    }),

    endSession: builder.mutation<TrainingSession, string>({
      query: (id) => ({
        url: `/sessions/${id}/end`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Session', id }],
    }),

    // Physical Tests
    getTests: builder.query<PhysicalTest[], { playerId?: string; testBatchId?: string; testType?: string }>({
      query: (params) => ({
        url: '/tests',
        params,
      }),
      providesTags: ['Test'],
    }),

    createTest: builder.mutation<PhysicalTest, CreateTestRequest>({
      query: (test) => ({
        url: '/tests',
        method: 'POST',
        body: test,
      }),
      invalidatesTags: ['Test', 'TestBatch'],
    }),

    createBulkTests: builder.mutation<PhysicalTest[], CreateTestRequest[]>({
      query: (tests) => ({
        url: '/tests/bulk',
        method: 'POST',
        body: { tests },
      }),
      invalidatesTags: ['Test', 'TestBatch'],
    }),

    updateTest: builder.mutation<PhysicalTest, { id: string; data: Partial<CreateTestRequest> }>({
      query: ({ id, data }) => ({
        url: `/tests/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Test'],
    }),

    deleteTest: builder.mutation<void, string>({
      query: (id) => ({
        url: `/tests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Test', 'TestBatch'],
    }),

    // Test Batches
    getTestBatches: builder.query<TestBatch[], { teamId?: string; status?: string }>({
      query: (params) => ({
        url: '/test-batches',
        params,
      }),
      providesTags: ['TestBatch'],
    }),

    getTestBatchById: builder.query<TestBatch, string>({
      query: (id) => `/test-batches/${id}`,
      providesTags: (result, error, id) => [{ type: 'TestBatch', id }],
    }),

    createTestBatch: builder.mutation<TestBatch, CreateTestBatchRequest>({
      query: (batch) => ({
        url: '/test-batches',
        method: 'POST',
        body: batch,
      }),
      invalidatesTags: ['TestBatch'],
    }),

    updateTestBatch: builder.mutation<TestBatch, { id: string; data: Partial<CreateTestBatchRequest> }>({
      query: ({ id, data }) => ({
        url: `/test-batches/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'TestBatch', id }],
    }),

    // Exercise Library
    getExercises: builder.query<Exercise[], { category?: string; search?: string }>({
      query: (params) => ({
        url: '/exercises',
        params,
      }),
      providesTags: ['Exercise'],
    }),

    createExercise: builder.mutation<Exercise, Omit<Exercise, 'id'>>({
      query: (exercise) => ({
        url: '/exercises',
        method: 'POST',
        body: exercise,
      }),
      invalidatesTags: ['Exercise'],
    }),

    updateExercise: builder.mutation<Exercise, { id: string; data: Partial<Exercise> }>({
      query: ({ id, data }) => ({
        url: `/exercises/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Exercise'],
    }),

    deleteExercise: builder.mutation<void, string>({
      query: (id) => ({
        url: `/exercises/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Exercise'],
    }),

    // Templates
    getTemplates: builder.query<ExerciseTemplate[], { category?: string }>({
      query: (params) => ({
        url: '/templates',
        params,
      }),
      providesTags: ['Template'],
    }),

    createTemplate: builder.mutation<ExerciseTemplate, Omit<ExerciseTemplate, 'id' | 'createdAt' | 'createdBy'>>({
      query: (template) => ({
        url: '/templates',
        method: 'POST',
        body: template,
      }),
      invalidatesTags: ['Template'],
    }),

    updateTemplate: builder.mutation<ExerciseTemplate, { id: string; data: Partial<ExerciseTemplate> }>({
      query: ({ id, data }) => ({
        url: `/templates/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Template', id }],
    }),

    deleteTemplate: builder.mutation<void, string>({
      query: (id) => ({
        url: `/templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Template'],
    }),

    // Analytics
    getPlayerTestHistory: builder.query<{
      player: { id: string; name: string };
      testHistory: PhysicalTest[];
      improvements: { testType: string; change: number; trend: string }[];
    }, string>({
      query: (playerId) => `/analytics/player/${playerId}/test-history`,
    }),

    getTeamTestStats: builder.query<{
      teamId: string;
      averages: { testType: string; average: number; unit: string }[];
      topPerformers: { playerId: string; playerName: string; score: number }[];
    }, string>({
      query: (teamId) => `/analytics/team/${teamId}/test-stats`,
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  // Sessions
  useGetSessionsQuery,
  useGetSessionByIdQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
  useStartSessionMutation,
  useEndSessionMutation,
  
  // Tests
  useGetTestsQuery,
  useCreateTestMutation,
  useCreateBulkTestsMutation,
  useUpdateTestMutation,
  useDeleteTestMutation,
  
  // Test Batches
  useGetTestBatchesQuery,
  useGetTestBatchByIdQuery,
  useCreateTestBatchMutation,
  useUpdateTestBatchMutation,
  
  // Exercises
  useGetExercisesQuery,
  useCreateExerciseMutation,
  useUpdateExerciseMutation,
  useDeleteExerciseMutation,
  
  // Templates
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  
  // Analytics
  useGetPlayerTestHistoryQuery,
  useGetTeamTestStatsQuery,
} = trainingApi;