import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { 
  WorkoutSession, 
  Exercise, 
  PlayerWorkoutLoad, 
  WorkoutExecution, 
  ExerciseExecution,
  ExerciseTemplate,
  ApiResponse 
} from '@hockey-hub/shared-lib';
import type { SessionTemplate } from '@/features/physical-trainer/types';
import type { IntervalProgram, ConditioningSession } from '@/features/physical-trainer/types/conditioning.types';
import type { HybridProgram, HybridWorkoutSession } from '@/features/physical-trainer/types/hybrid.types';
import type { AgilityProgram, AgilityDrill } from '@/features/physical-trainer/types/agility.types';
import { createMockEnabledBaseQuery } from './mockBaseQuery';

// Re-export types for convenience
export type { 
  WorkoutSession, 
  Exercise, 
  PlayerWorkoutLoad, 
  WorkoutExecution, 
  ExerciseExecution,
  ExerciseTemplate 
};

// Legacy types for compatibility
export interface TrainingSession extends WorkoutSession {
  name: string; // Maps to title
  date: string; // Maps to scheduledDate
  time: string; // Extracted from scheduledDate
  duration: number; // Maps to estimatedDuration
  team: string; // Team name
  maxParticipants: number;
  currentParticipants: number;
  intensity: 'low' | 'medium' | 'high' | 'max';
  equipment: string[];
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

export interface CreateWorkoutRequest {
  title: string;
  description?: string;
  type: 'strength' | 'cardio' | 'skill' | 'recovery' | 'mixed' | 'conditioning' | 'hybrid' | 'agility';
  scheduledDate: string;
  location: string;
  teamId: string;
  playerIds: string[];
  estimatedDuration: number;
  exercises?: Omit<Exercise, 'id' | 'workoutSessionId'>[];
  playerLoads?: Omit<PlayerWorkoutLoad, 'id' | 'workoutSessionId' | 'createdAt'>[];
  intervalProgram?: IntervalProgram;
  hybridProgram?: HybridProgram;
  agilityProgram?: AgilityProgram;
  settings?: {
    allowIndividualLoads: boolean;
    displayMode: 'grid' | 'focus' | 'tv';
    showMetrics: boolean;
    autoRotation: boolean;
    rotationInterval: number;
  };
}

export interface CreateConditioningWorkoutRequest {
  title: string;
  description?: string;
  type: 'conditioning';
  scheduledDate: string;
  location: string;
  teamId: string;
  playerIds: string[];
  intervalProgram: IntervalProgram;
  personalizeForPlayers?: boolean;
}

export interface CreateHybridWorkoutRequest {
  title: string;
  description?: string;
  type: 'hybrid';
  scheduledDate: string;
  location: string;
  teamId: string;
  playerIds: string[];
  hybridProgram: HybridProgram;
}

export interface CreateAgilityWorkoutRequest {
  title: string;
  description?: string;
  type: 'agility';
  scheduledDate: string;
  location: string;
  teamId: string;
  playerIds: string[];
  agilityProgram: AgilityProgram;
}

export interface UpdateWorkoutRequest {
  id: string;
  data: Partial<CreateWorkoutRequest>;
}

export interface StartExecutionRequest {
  workoutSessionId: string;
  playerId: string;
}

export interface UpdateExecutionProgressRequest {
  executionId: string;
  currentExerciseIndex?: number;
  currentSetNumber?: number;
  completionPercentage?: number;
  metrics?: {
    heartRate?: number;
    power?: number;
    speed?: number;
  };
}

export interface CompleteExerciseSetRequest {
  executionId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  actualReps?: number;
  actualWeight?: number;
  actualDuration?: number;
  actualDistance?: number;
  actualPower?: number;
  performanceMetrics?: {
    heartRate?: number;
    maxHeartRate?: number;
    averagePower?: number;
    maxPower?: number;
    speed?: number;
    cadence?: number;
    rpe?: number;
  };
  notes?: string;
}

// Legacy compatibility
export interface CreateSessionRequest extends CreateWorkoutRequest {
  name: string;
  team: string;
  maxParticipants: number;
  intensity: string;
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
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000/api';

// Create the API slice
export const trainingApi = createApi({
  reducerPath: 'trainingApi',
  baseQuery: createMockEnabledBaseQuery(
    fetchBaseQuery({
      baseUrl: `${API_GATEWAY_URL}/training`,
      prepareHeaders: (headers, { getState }) => {
        // Get token from auth state if available
        const token = localStorage.getItem('authToken');
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
      },
    })
  ),
  tagTypes: ['Session', 'Test', 'TestBatch', 'Exercise', 'Template', 'Execution'],
  endpoints: (builder) => ({
    // Workout Sessions (new endpoints)
    getWorkoutSessions: builder.query<ApiResponse<WorkoutSession[]>, { date?: string; teamId?: string; playerId?: string; status?: string }>({
      query: (params) => ({
        url: '/sessions',
        params,
      }),
      providesTags: ['Session'],
      transformResponse: (response: ApiResponse<WorkoutSession[]>) => response,
    }),

    getWorkoutSessionById: builder.query<ApiResponse<WorkoutSession>, string>({
      query: (id) => `/sessions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Session', id }],
    }),

    createWorkoutSession: builder.mutation<ApiResponse<WorkoutSession>, CreateWorkoutRequest>({
      query: (workout) => ({
        url: '/sessions',
        method: 'POST',
        body: workout,
      }),
      invalidatesTags: ['Session'],
    }),

    updateWorkoutSession: builder.mutation<ApiResponse<WorkoutSession>, UpdateWorkoutRequest>({
      query: ({ id, data }) => ({
        url: `/sessions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Session', id }, 'Session'],
    }),

    deleteWorkoutSession: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/sessions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Session'],
    }),

    updatePlayerWorkoutLoad: builder.mutation<ApiResponse<PlayerWorkoutLoad>, { sessionId: string; playerId: string; data: Partial<PlayerWorkoutLoad> }>({
      query: ({ sessionId, playerId, data }) => ({
        url: `/sessions/${sessionId}/players/${playerId}/load`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { sessionId }) => [{ type: 'Session', id: sessionId }],
    }),

    // Workout Execution
    startWorkoutExecution: builder.mutation<ApiResponse<WorkoutExecution>, StartExecutionRequest>({
      query: (data) => ({
        url: '/executions/start',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Session', 'Execution'],
    }),

    updateExecutionProgress: builder.mutation<ApiResponse<WorkoutExecution>, UpdateExecutionProgressRequest>({
      query: ({ executionId, ...data }) => ({
        url: `/training/executions/${executionId}/progress`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Execution'],
    }),

    completeExerciseSet: builder.mutation<ApiResponse<ExerciseExecution>, CompleteExerciseSetRequest>({
      query: ({ executionId, ...data }) => ({
        url: `/training/executions/${executionId}/exercises`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Execution'],
    }),

    completeWorkoutExecution: builder.mutation<ApiResponse<WorkoutExecution>, string>({
      query: (executionId) => ({
        url: `/training/executions/${executionId}/complete`,
        method: 'PUT',
      }),
      invalidatesTags: ['Session', 'Execution'],
    }),

    getExecutionById: builder.query<ApiResponse<WorkoutExecution>, string>({
      query: (id) => `/training/executions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Execution', id }],
    }),

    getSessionExecutions: builder.query<ApiResponse<WorkoutExecution[]>, string>({
      query: (sessionId) => `/training/sessions/${sessionId}/executions`,
      providesTags: ['Execution'],
    }),

    // Legacy Training Sessions (keeping for compatibility)
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
    getTests: builder.query<{ results: PhysicalTest[] }, { playerIds?: string[]; testBatchId?: string; testType?: string }>({
      query: (params) => ({
        url: '/tests',
        params: {
          ...params,
          playerIds: params.playerIds?.join(',')
        },
      }),
      providesTags: ['Test'],
      transformResponse: (response: PhysicalTest[] | { results: PhysicalTest[] }) => {
        // Handle both array and object response formats
        if (Array.isArray(response)) {
          return { results: response };
        }
        return response;
      },
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
    getExercises: builder.query<{ exercises: ExerciseTemplate[] }, { category?: string; search?: string; organizationId?: string }>({
      query: (params) => ({
        url: '/exercises',
        params,
      }),
      providesTags: ['Exercise'],
      transformResponse: (response: ExerciseTemplate[] | { exercises: ExerciseTemplate[] }) => {
        // Handle both array and object response formats
        if (Array.isArray(response)) {
          return { exercises: response };
        }
        return response;
      },
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

    // Session Templates (more comprehensive than basic exercise templates)
    getSessionTemplates: builder.query<ApiResponse<SessionTemplate[]>, {
      page?: number;
      limit?: number;
      category?: string;
      type?: string;
      difficulty?: string;
      visibility?: string;
      search?: string;
      tags?: string[];
      createdBy?: string;
    }>({
      query: (params) => ({
        url: '/templates',
        params,
      }),
      providesTags: ['Template'],
      transformResponse: (response: any) => {
        // Handle both paginated and non-paginated responses
        if (response.data) {
          return response;
        }
        return { success: true, data: response };
      },
    }),

    getSessionTemplateById: builder.query<SessionTemplate, string>({
      query: (id) => `/templates/${id}`,
      providesTags: (result, error, id) => [{ type: 'Template', id }],
    }),

    getPopularSessionTemplates: builder.query<SessionTemplate[], { limit?: number }>({
      query: (params) => ({
        url: '/templates/popular',
        params,
      }),
      providesTags: ['Template'],
    }),

    createSessionTemplate: builder.mutation<SessionTemplate, Partial<SessionTemplate>>({
      query: (template) => ({
        url: '/templates',
        method: 'POST',
        body: template,
      }),
      invalidatesTags: ['Template'],
    }),

    updateSessionTemplate: builder.mutation<SessionTemplate, { id: string; data: Partial<SessionTemplate> }>({
      query: ({ id, data }) => ({
        url: `/templates/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Template', id }],
    }),

    deleteSessionTemplate: builder.mutation<void, string>({
      query: (id) => ({
        url: `/templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Template'],
    }),

    duplicateSessionTemplate: builder.mutation<SessionTemplate, { id: string; name: string }>({
      query: ({ id, name }) => ({
        url: `/templates/${id}/duplicate`,
        method: 'POST',
        body: { name },
      }),
      invalidatesTags: ['Template'],
    }),

    // Bulk assign template to workouts
    bulkAssignTemplate: builder.mutation<
      { created: number; errors: any[] },
      { templateId: string; data: { playerIds: string[]; teamId: string; scheduledDates: string[] } }
    >({
      query: ({ templateId, data }) => ({
        url: `/templates/${templateId}/bulk-assign`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Session', 'Template'],
    }),

    // Bulk Assignment
    createBulkWorkoutAssignment: builder.mutation<
      ApiResponse<{
        created: number;
        errors: Array<{ playerId: string; error: string }>;
        assignments: WorkoutSession[];
      }>,
      {
        templateId?: string;
        workout: CreateWorkoutRequest;
        playerIds: string[];
        scheduleDates: string[];
        conflictResolution?: 'skip' | 'override' | 'merge';
      }
    >({
      query: (data) => ({
        url: '/training/sessions/bulk-assign',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Session'],
    }),

    checkWorkoutConflicts: builder.mutation<
      ApiResponse<{
        conflicts: Array<{
          playerId: string;
          date: string;
          existingWorkout?: WorkoutSession;
          type: 'scheduling' | 'medical' | 'capacity';
        }>;
      }>,
      {
        playerIds: string[];
        scheduleDates: string[];
      }
    >({
      query: (data) => ({
        url: '/training/sessions/check-conflicts',
        method: 'POST',
        body: data,
      }),
    }),

    getPlayerMedicalRestrictions: builder.query<
      ApiResponse<Array<{
        playerId: string;
        restrictions: string[];
        injuries: Array<{
          type: string;
          severity: string;
          affectedExercises: string[];
        }>;
      }>>,
      { playerIds: string[] }
    >({
      query: ({ playerIds }) => ({
        url: '/training/medical-restrictions',
        params: { playerIds: playerIds.join(',') },
      }),
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

    // Test Analytics
    getTestAnalytics: builder.query<{
      summary: {
        totalTests: number;
        totalBatches: number;
        averageImprovement: number;
        topPerformers: Array<{
          playerId: string;
          playerName: string;
          improvement: number;
        }>;
      };
      testTypeDistribution: Record<string, number>;
      recentTests: PhysicalTest[];
      upcomingBatches: TestBatch[];
    }, { teamId?: string; dateFrom?: string; dateTo?: string }>({
      query: (params) => ({
        url: '/tests/analytics',
        params,
      }),
      providesTags: ['Test'],
    }),

    // Test History
    getTestHistory: builder.query<{
      tests: PhysicalTest[];
      batches: TestBatch[];
      trends: Array<{
        testType: string;
        values: Array<{ date: string; value: number }>;
      }>;
    }, { playerId?: string; teamId?: string; limit?: number }>({
      query: (params) => ({
        url: '/tests/history',
        params,
      }),
      providesTags: ['Test'],
    }),

    // Training Discussions
    createTrainingDiscussion: builder.mutation<any, {
      sessionId: string;
      sessionType: 'ice_practice' | 'physical_training' | 'video_review' | 'combined';
      sessionTitle: string;
      sessionDate: string;
      sessionLocation?: string;
      teamId?: string;
      coachIds?: string[];
      trainerIds?: string[];
      playerIds?: string[];
      exerciseIds?: string[];
      metadata?: Record<string, any>;
    }>({
      query: (body) => ({
        url: `${API_GATEWAY_URL}/communication/training-discussions`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Session'],
    }),

    getTrainingDiscussion: builder.query<any, {
      sessionId: string;
      sessionType: 'ice_practice' | 'physical_training' | 'video_review' | 'combined';
    }>({
      query: ({ sessionId, sessionType }) => `${API_GATEWAY_URL}/communication/training-discussions/session/${sessionId}?type=${sessionType}`,
    }),

    getTrainingDiscussionById: builder.query<any, string>({
      query: (id) => `${API_GATEWAY_URL}/communication/training-discussions/${id}`,
    }),

    getExerciseDiscussions: builder.query<any[], string>({
      query: (trainingDiscussionId) => `${API_GATEWAY_URL}/communication/training-discussions/${trainingDiscussionId}/exercises`,
    }),

    createExerciseThread: builder.mutation<any, {
      trainingDiscussionId: string;
      exerciseId: string;
      exerciseName: string;
      exerciseDescription?: string;
      metadata?: Record<string, any>;
      initialFeedback?: string;
    }>({
      query: ({ trainingDiscussionId, initialFeedback, ...body }) => ({
        url: `${API_GATEWAY_URL}/communication/training-discussions/${trainingDiscussionId}/exercises`,
        method: 'POST',
        body,
      }),
    }),

    getActiveDiscussions: builder.query<any[], void>({
      query: () => `${API_GATEWAY_URL}/communication/training-discussions/user/active`,
    }),

    getUpcomingDiscussions: builder.query<any[], void>({
      query: () => `${API_GATEWAY_URL}/communication/training-discussions/organization/upcoming`,
    }),

    updateDiscussionStatus: builder.mutation<any, {
      id: string;
      status: 'scheduled' | 'active' | 'completed' | 'archived';
    }>({
      query: ({ id, status }) => ({
        url: `${API_GATEWAY_URL}/communication/training-discussions/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
    }),

    activateDiscussion: builder.mutation<any, string>({
      query: (id) => ({
        url: `${API_GATEWAY_URL}/communication/training-discussions/${id}/activate`,
        method: 'POST',
      }),
    }),

    completeDiscussion: builder.mutation<any, string>({
      query: (id) => ({
        url: `${API_GATEWAY_URL}/communication/training-discussions/${id}/complete`,
        method: 'POST',
      }),
    }),

    // Conditioning Workout Endpoints
    createConditioningWorkout: builder.mutation<ApiResponse<WorkoutSession>, CreateConditioningWorkoutRequest>({
      query: (workout) => ({
        url: '/conditioning-workouts',
        method: 'POST',
        body: workout,
      }),
      invalidatesTags: ['Session'],
    }),

    getConditioningWorkouts: builder.query<ApiResponse<ConditioningSession[]>, { teamId?: string; date?: string }>({
      query: (params) => ({
        url: '/conditioning-workouts',
        params,
      }),
      providesTags: ['Session'],
    }),

    getConditioningWorkoutById: builder.query<ApiResponse<ConditioningSession>, string>({
      query: (id) => `/conditioning-workouts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Session', id }],
    }),

    updateConditioningWorkout: builder.mutation<ApiResponse<ConditioningSession>, { id: string; data: Partial<CreateConditioningWorkoutRequest> }>({
      query: ({ id, data }) => ({
        url: `/conditioning-workouts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Session', id }],
    }),

    // Hybrid Workout Endpoints
    createHybridWorkout: builder.mutation<ApiResponse<HybridWorkoutSession>, CreateHybridWorkoutRequest>({
      query: (workout) => ({
        url: '/hybrid-workouts',
        method: 'POST',
        body: workout,
      }),
      invalidatesTags: ['Session'],
    }),

    getHybridWorkouts: builder.query<ApiResponse<HybridWorkoutSession[]>, { teamId?: string; date?: string }>({
      query: (params) => ({
        url: '/hybrid-workouts',
        params,
      }),
      providesTags: ['Session'],
    }),

    getHybridWorkoutById: builder.query<ApiResponse<HybridWorkoutSession>, string>({
      query: (id) => `/hybrid-workouts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Session', id }],
    }),

    updateHybridWorkout: builder.mutation<ApiResponse<HybridWorkoutSession>, { id: string; data: Partial<CreateHybridWorkoutRequest> }>({
      query: ({ id, data }) => ({
        url: `/hybrid-workouts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Session', id }],
    }),

    // Agility Workout Endpoints
    createAgilityWorkout: builder.mutation<ApiResponse<WorkoutSession>, CreateAgilityWorkoutRequest>({
      query: (workout) => ({
        url: '/agility-workouts',
        method: 'POST',
        body: workout,
      }),
      invalidatesTags: ['Session'],
    }),

    getAgilityWorkouts: builder.query<ApiResponse<WorkoutSession[]>, { teamId?: string; date?: string }>({
      query: (params) => ({
        url: '/agility-workouts',
        params,
      }),
      providesTags: ['Session'],
    }),

    getAgilityWorkoutById: builder.query<ApiResponse<WorkoutSession>, string>({
      query: (id) => `/agility-workouts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Session', id }],
    }),

    updateAgilityWorkout: builder.mutation<ApiResponse<WorkoutSession>, { id: string; data: Partial<CreateAgilityWorkoutRequest> }>({
      query: ({ id, data }) => ({
        url: `/agility-workouts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Session', id }],
    }),

    // Agility Drill Management
    getAgilityDrills: builder.query<ApiResponse<AgilityDrill[]>, { category?: string; search?: string }>({
      query: (params) => ({
        url: '/agility-drills',
        params,
      }),
      providesTags: ['Exercise'],
    }),

    createAgilityDrill: builder.mutation<ApiResponse<AgilityDrill>, Omit<AgilityDrill, 'id'>>({
      query: (drill) => ({
        url: '/agility-drills',
        method: 'POST',
        body: drill,
      }),
      invalidatesTags: ['Exercise'],
    }),

    updateAgilityDrill: builder.mutation<ApiResponse<AgilityDrill>, { id: string; data: Partial<AgilityDrill> }>({
      query: ({ id, data }) => ({
        url: `/agility-drills/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Exercise'],
    }),

    deleteAgilityDrill: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/agility-drills/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Exercise'],
    }),

    // Equipment Configurations
    getEquipmentConfigs: builder.query<ApiResponse<any>, { type?: string }>({
      query: (params) => ({
        url: '/equipment-config',
        params,
      }),
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  // New Workout Sessions
  useGetWorkoutSessionsQuery,
  useGetWorkoutSessionByIdQuery,
  useCreateWorkoutSessionMutation,
  useUpdateWorkoutSessionMutation,
  useDeleteWorkoutSessionMutation,
  useUpdatePlayerWorkoutLoadMutation,
  
  // Workout Execution
  useStartWorkoutExecutionMutation,
  useUpdateExecutionProgressMutation,
  useCompleteExerciseSetMutation,
  useCompleteWorkoutExecutionMutation,
  useGetExecutionByIdQuery,
  useGetSessionExecutionsQuery,
  
  // Legacy Sessions (for compatibility)
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
  useBulkAssignTemplateMutation,
  
  // Session Templates
  useGetSessionTemplatesQuery,
  useGetSessionTemplateByIdQuery,
  useGetPopularSessionTemplatesQuery,
  useCreateSessionTemplateMutation,
  useUpdateSessionTemplateMutation,
  useDeleteSessionTemplateMutation,
  useDuplicateSessionTemplateMutation,
  
  // Bulk Assignment
  useCreateBulkWorkoutAssignmentMutation,
  useCheckWorkoutConflictsMutation,
  useGetPlayerMedicalRestrictionsQuery,
  
  // Analytics
  useGetPlayerTestHistoryQuery,
  useGetTeamTestStatsQuery,
  useGetTestAnalyticsQuery,
  useGetTestHistoryQuery,
  
  // Training Discussions
  useCreateTrainingDiscussionMutation,
  useGetTrainingDiscussionQuery,
  useGetTrainingDiscussionByIdQuery,
  useGetExerciseDiscussionsQuery,
  useCreateExerciseThreadMutation,
  useGetActiveDiscussionsQuery,
  useGetUpcomingDiscussionsQuery,
  useUpdateDiscussionStatusMutation,
  useActivateDiscussionMutation,
  useCompleteDiscussionMutation,
  
  // Conditioning Workouts
  useCreateConditioningWorkoutMutation,
  useGetConditioningWorkoutsQuery,
  useGetConditioningWorkoutByIdQuery,
  useUpdateConditioningWorkoutMutation,
  
  // Hybrid Workouts
  useCreateHybridWorkoutMutation,
  useGetHybridWorkoutsQuery,
  useGetHybridWorkoutByIdQuery,
  useUpdateHybridWorkoutMutation,
  
  // Agility Workouts
  useCreateAgilityWorkoutMutation,
  useGetAgilityWorkoutsQuery,
  useGetAgilityWorkoutByIdQuery,
  useUpdateAgilityWorkoutMutation,
  
  // Agility Drills
  useGetAgilityDrillsQuery,
  useCreateAgilityDrillMutation,
  useUpdateAgilityDrillMutation,
  useDeleteAgilityDrillMutation,
  
  // Equipment
  useGetEquipmentConfigsQuery,
} = trainingApi;