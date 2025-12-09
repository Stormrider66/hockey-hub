import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  saveWorkout,
  deleteWorkout,
  removeFromOfflineQueue,
  addToOfflineQueue
} from '../slices/workoutBuilderSlice';
import { WorkoutType, WorkoutSession, Player, Team } from '@/features/physical-trainer/types';
import { RootState } from '../store';

// Enhanced base query that integrates with workout builder
const baseQueryWithWorkoutBuilder = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});

// Workout Builder API slice
export const workoutBuilderApi = createApi({
  reducerPath: 'workoutBuilderApi',
  baseQuery: baseQueryWithWorkoutBuilder,
  tagTypes: ['Workout', 'Player', 'Team', 'Schedule'],
  endpoints: (builder) => ({
    // Create workout
    createWorkout: builder.mutation<WorkoutSession, Partial<WorkoutSession>>({
      query: (workout) => ({
        url: '/workouts',
        method: 'POST',
        body: workout,
      }),
      invalidatesTags: ['Workout', 'Schedule'],
      async onQueryStarted(workout, { dispatch, queryFulfilled, getState }) {
        try {
          const result = await queryFulfilled;
          
          // Update the workout builder state with the saved workout
          dispatch(saveWorkout(result.data.id));
          
          // Remove from offline queue if it was there
          dispatch(removeFromOfflineQueue(result.data.id));
          
        } catch (error) {
          // If save fails and we're offline, add to queue
          if (!navigator.onLine && workout.id) {
            dispatch(addToOfflineQueue({
              workoutId: workout.id,
              action: 'create',
              data: workout
            }));
          }
          console.error('Failed to create workout:', error);
        }
      },
    }),
    
    // Update workout
    updateWorkout: builder.mutation<WorkoutSession, { id: string; updates: Partial<WorkoutSession> }>({
      query: ({ id, updates }) => ({
        url: `/workouts/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Workout', 'Schedule'],
      async onQueryStarted({ id, updates }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          
          // Mark as saved in workout builder
          dispatch(saveWorkout(id));
          dispatch(removeFromOfflineQueue(id));
          
        } catch (error) {
          // Add to offline queue if update fails
          if (!navigator.onLine) {
            dispatch(addToOfflineQueue({
              workoutId: id,
              action: 'update',
              data: updates
            }));
          }
          console.error('Failed to update workout:', error);
        }
      },
    }),
    
    // Delete workout
    deleteWorkoutMutation: builder.mutation<void, string>({
      query: (id) => ({
        url: `/workouts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Workout', 'Schedule'],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          
          // Remove from workout builder
          dispatch(deleteWorkout(id));
          dispatch(removeFromOfflineQueue(id));
          
        } catch (error) {
          // Add to offline queue if delete fails
          if (!navigator.onLine) {
            dispatch(addToOfflineQueue({
              workoutId: id,
              action: 'delete',
              data: null
            }));
          }
          console.error('Failed to delete workout:', error);
        }
      },
    }),
    
    // Bulk create workouts
    bulkCreateWorkouts: builder.mutation<WorkoutSession[], Partial<WorkoutSession>[]>({
      query: (workouts) => ({
        url: '/workouts/bulk',
        method: 'POST',
        body: { workouts },
      }),
      invalidatesTags: ['Workout', 'Schedule'],
      async onQueryStarted(workouts, { dispatch, queryFulfilled }) {
        try {
          const result = await queryFulfilled;
          
          // Mark all workouts as saved
          result.data.forEach(workout => {
            dispatch(saveWorkout(workout.id));
            dispatch(removeFromOfflineQueue(workout.id));
          });
          
        } catch (error) {
          // Add all to offline queue if bulk create fails
          if (!navigator.onLine) {
            workouts.forEach((workout, index) => {
              if (workout.id) {
                dispatch(addToOfflineQueue({
                  workoutId: workout.id,
                  action: 'create',
                  data: workout
                }));
              }
            });
          }
          console.error('Failed to bulk create workouts:', error);
        }
      },
    }),
    
    // Get workout templates
    getWorkoutTemplates: builder.query<WorkoutSession[], { type?: WorkoutType; category?: string }>({
      query: ({ type, category }) => ({
        url: '/workouts/templates',
        params: { type, category },
      }),
      providesTags: ['Workout'],
    }),
    
    // Save workout as template
    saveAsTemplate: builder.mutation<WorkoutSession, { workoutId: string; templateData: any }>({
      query: ({ workoutId, templateData }) => ({
        url: `/workouts/${workoutId}/template`,
        method: 'POST',
        body: templateData,
      }),
      invalidatesTags: ['Workout'],
    }),
    
    // Validate workout
    validateWorkout: builder.mutation<{ isValid: boolean; errors: any[]; warnings: any[] }, Partial<WorkoutSession>>({
      query: (workout) => ({
        url: '/workouts/validate',
        method: 'POST',
        body: workout,
      }),
    }),
    
    // Check scheduling conflicts
    checkConflicts: builder.mutation<{ conflicts: any[] }, { workoutId: string; date: string; time: string; players: string[]; teams: string[] }>({
      query: (data) => ({
        url: '/workouts/check-conflicts',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Get player availability
    getPlayerAvailability: builder.query<{ available: boolean; reason?: string }[], { playerIds: string[]; date: string; time: string }>({
      query: ({ playerIds, date, time }) => ({
        url: '/players/availability',
        params: { playerIds: playerIds.join(','), date, time },
      }),
      providesTags: ['Player'],
    }),
    
    // Get team roster
    getTeamRoster: builder.query<Player[], string>({
      query: (teamId) => ({
        url: `/teams/${teamId}/roster`,
      }),
      providesTags: ['Team', 'Player'],
    }),
    
    // Assign workout to players/teams
    assignWorkout: builder.mutation<void, { workoutId: string; playerIds: string[]; teamIds: string[] }>({
      query: ({ workoutId, playerIds, teamIds }) => ({
        url: `/workouts/${workoutId}/assign`,
        method: 'POST',
        body: { playerIds, teamIds },
      }),
      invalidatesTags: ['Workout', 'Player', 'Team'],
    }),
    
    // Duplicate workout
    duplicateWorkout: builder.mutation<WorkoutSession, { workoutId: string; updates?: Partial<WorkoutSession> }>({
      query: ({ workoutId, updates }) => ({
        url: `/workouts/${workoutId}/duplicate`,
        method: 'POST',
        body: updates || {},
      }),
      invalidatesTags: ['Workout'],
    }),
    
    // Export workouts
    exportWorkouts: builder.mutation<Blob, { workoutIds: string[]; format: 'json' | 'csv' | 'pdf' }>({
      query: ({ workoutIds, format }) => ({
        url: '/workouts/export',
        method: 'POST',
        body: { workoutIds, format },
        responseHandler: (response) => response.blob(),
      }),
    }),
    
    // Import workouts
    importWorkouts: builder.mutation<{ imported: number; errors: any[] }, { file: File; options: any }>({
      query: ({ file, options }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('options', JSON.stringify(options));
        
        return {
          url: '/workouts/import',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Workout'],
    }),
  }),
});

// Export hooks
export const {
  useCreateWorkoutMutation,
  useUpdateWorkoutMutation,
  useDeleteWorkoutMutationMutation,
  useBulkCreateWorkoutsMutation,
  useGetWorkoutTemplatesQuery,
  useSaveAsTemplateMutation,
  useValidateWorkoutMutation,
  useCheckConflictsMutation,
  useGetPlayerAvailabilityQuery,
  useGetTeamRosterQuery,
  useAssignWorkoutMutation,
  useDuplicateWorkoutMutation,
  useExportWorkoutsMutation,
  useImportWorkoutsMutation,
} = workoutBuilderApi;

// Helper function to sync offline queue with API
export const syncOfflineQueue = async (
  offlineQueue: any[],
  api: {
    createWorkout: any;
    updateWorkout: any;
    deleteWorkoutMutation: any;
  }
) => {
  const results = [];
  
  for (const item of offlineQueue) {
    try {
      let result;
      
      switch (item.action) {
        case 'create':
          result = await api.createWorkout(item.data).unwrap();
          break;
        case 'update':
          result = await api.updateWorkout({ id: item.workoutId, updates: item.data }).unwrap();
          break;
        case 'delete':
          result = await api.deleteWorkoutMutation(item.workoutId).unwrap();
          break;
        default:
          throw new Error(`Unknown action: ${item.action}`);
      }
      
      results.push({ success: true, item, result });
    } catch (error) {
      results.push({ success: false, item, error });
    }
  }
  
  return results;
};

// Enhanced workout builder hooks that integrate with RTK Query
export const useWorkoutBuilderWithAPI = () => {
  const [createWorkout] = useCreateWorkoutMutation();
  const [updateWorkout] = useUpdateWorkoutMutation();
  const [deleteWorkoutMutation] = useDeleteWorkoutMutationMutation();
  const [validateWorkout] = useValidateWorkoutMutation();
  const [checkConflicts] = useCheckConflictsMutation();
  const [assignWorkout] = useAssignWorkoutMutation();
  
  return {
    createWorkout,
    updateWorkout,
    deleteWorkout: deleteWorkoutMutation,
    validateWorkout,
    checkConflicts,
    assignWorkout,
  };
};

// Auto-save integration with RTK Query
export const createAutoSaveEffect = (
  workoutId: string,
  workoutData: Partial<WorkoutSession>,
  updateWorkoutMutation: any
) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (enabled: boolean) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (enabled && workoutData) {
      timeoutId = setTimeout(async () => {
        try {
          await updateWorkoutMutation({ id: workoutId, updates: workoutData }).unwrap();
          console.log('Auto-saved workout:', workoutId);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, 5000); // Auto-save after 5 seconds
    }
  };
};

// Optimistic update helpers
export const createOptimisticUpdate = <T>(
  mutation: any,
  optimisticData: T,
  rollbackData: T
) => {
  return async (dispatch: any) => {
    // Apply optimistic update immediately
    dispatch(optimisticData);
    
    try {
      // Attempt the actual mutation
      await mutation().unwrap();
    } catch (error) {
      // Rollback on failure
      dispatch(rollbackData);
      throw error;
    }
  };
};