import { apiSlice } from './apiSlice';
import type { Exercise } from '@/types/exercise';
import type { Program } from '@/types/program';

export const trainingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Exercises CRUD
    getExercises: builder.query<Exercise[], void>({
      query: () => '/exercises',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Exercise' as const, id })),
              { type: 'Exercise', id: 'LIST' }
            ]
          : [{ type: 'Exercise', id: 'LIST' }],
    }),
    getExercise: builder.query<Exercise, string>({
      query: (id) => `/exercises/${id}`,
      providesTags: (result, error, id) => [{ type: 'Exercise', id }],
    }),
    createExercise: builder.mutation<Exercise, Partial<Exercise>>({
      query: (exercise) => ({ url: '/exercises', method: 'POST', body: exercise }),
      invalidatesTags: [{ type: 'Exercise', id: 'LIST' }],
    }),
    updateExercise: builder.mutation<Exercise, { id: string; exercise: Partial<Exercise> }>({
      query: ({ id, exercise }) => ({ url: `/exercises/${id}`, method: 'PUT', body: exercise }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Exercise', id },
        { type: 'Exercise', id: 'LIST' }
      ],
    }),
    deleteExercise: builder.mutation<void, string>({
      query: (id) => ({ url: `/exercises/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Exercise', id: 'LIST' }],
    }),

    // Programs CRUD
    getPrograms: builder.query<Program[], void>({
      query: () => '/programs',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Program' as const, id })),
              { type: 'Program', id: 'LIST' }
            ]
          : [{ type: 'Program', id: 'LIST' }],
    }),
    getProgram: builder.query<Program, string>({
      query: (id) => `/programs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Program', id }],
    }),
    createProgram: builder.mutation<Program, Partial<Program>>({
      query: (program) => ({ url: '/programs', method: 'POST', body: program }),
      invalidatesTags: [{ type: 'Program', id: 'LIST' }],
    }),
    updateProgram: builder.mutation<Program, { id: string; program: Partial<Program> }>({
      query: ({ id, program }) => ({ url: `/programs/${id}`, method: 'PUT', body: program }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Program', id },
        { type: 'Program', id: 'LIST' }
      ],
    }),
    deleteProgram: builder.mutation<void, string>({
      query: (id) => ({ url: `/programs/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Program', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetExercisesQuery,
  useGetExerciseQuery,
  useCreateExerciseMutation,
  useUpdateExerciseMutation,
  useDeleteExerciseMutation,
  useGetProgramsQuery,
  useGetProgramQuery,
  useCreateProgramMutation,
  useUpdateProgramMutation,
  useDeleteProgramMutation,
} = trainingApi; 