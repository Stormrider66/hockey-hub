/**
 * Example component demonstrating the standardized API usage
 * Shows consistent patterns across all workout types
 */

import React, { useState, useCallback } from 'react';
import {
  useWorkouts,
  useWorkout,
  useWorkoutActions,
  useWorkoutStats,
  useStrengthWorkouts,
  useConditioningWorkouts,
  usePlayerAssignedWorkouts,
  useWorkoutValidator,
  useWorkoutErrors,
  useWorkoutFilters,
  useWorkoutTypes,
} from '../../store/api/workoutHooks';
import {
  WorkoutType,
  CreateWorkoutRequest,
  UpdateWorkoutRequest,
} from '../../types/api.types';

const StandardizedApiExample: React.FC = () => {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<WorkoutType>('STRENGTH');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('player-001');

  // ============================================
  // Hook Usage Examples
  // ============================================

  // 1. List workouts with filtering and pagination
  const {
    workouts,
    pagination,
    isLoading: isLoadingWorkouts,
    error: workoutsError,
    refetch: refetchWorkouts,
  } = useWorkouts(
    {
      types: [selectedType],
      search: '',
      status: 'published',
    },
    {
      page: 1,
      limit: 10,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    }
  );

  // 2. Get single workout
  const {
    workout: currentWorkout,
    isLoading: isLoadingWorkout,
    error: workoutError,
  } = useWorkout(selectedWorkoutId, {
    include: ['assignments', 'analytics'],
  });

  // 3. Workout actions (create, update, delete)
  const {
    createWorkout,
    updateWorkout,
    deleteWorkout,
    duplicateWorkout,
    isLoading: isActionLoading,
    createResult,
    updateResult,
  } = useWorkoutActions();

  // 4. Workout statistics
  const {
    data: stats,
    isLoading: isLoadingStats,
  } = useWorkoutStats({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    dateTo: new Date().toISOString(),
  });

  // 5. Type-specific hooks
  const { workouts: strengthWorkouts } = useStrengthWorkouts({
    playerIds: [selectedPlayerId],
  });

  const { workouts: conditioningWorkouts } = useConditioningWorkouts({
    teamIds: ['team-001'],
  });

  // 6. Player-specific workouts
  const { workouts: playerWorkouts } = usePlayerAssignedWorkouts(selectedPlayerId);

  // 7. Validation
  const { validateWorkout, isValidating } = useWorkoutValidator();

  // 8. Error handling
  const {
    getErrorMessage,
    isValidationError,
    isMedicalRestriction,
    isSchedulingConflict,
  } = useWorkoutErrors();

  // 9. Filtering utilities
  const {
    buildPlayerFilter,
    buildTypeFilter,
    buildDateRangeFilter,
  } = useWorkoutFilters();

  // 10. Workout type utilities
  const {
    allTypes,
    getTypeLabel,
    getTypeColor,
    getTypeIcon,
  } = useWorkoutTypes();

  // ============================================
  // Action Handlers
  // ============================================

  const handleCreateWorkout = useCallback(async () => {
    try {
      const newWorkout: CreateWorkoutRequest = {
        type: selectedType,
        workout: {
          name: `New ${selectedType} Workout`,
          description: `Example ${selectedType.toLowerCase()} workout created via API`,
          estimatedDuration: 60,
          assignedPlayerIds: [selectedPlayerId],
          assignedTeamIds: ['team-001'],
          location: 'Training Center',
          exercises: selectedType === 'STRENGTH' ? [
            {
              id: 'ex-001',
              name: 'Squat',
              category: 'main',
              sets: 3,
              reps: 10,
              weight: 80,
              restBetweenSets: 90,
            }
          ] : [],
          // Type-specific fields
          ...(selectedType === 'CONDITIONING' && {
            intervalProgram: {
              id: 'interval-001',
              name: 'Basic HIIT',
              equipment: 'rowing-machine',
              intervals: [
                { duration: 30, intensity: 'High', targetBPM: 170 },
                { duration: 30, intensity: 'Rest', targetBPM: 120 },
              ],
              rounds: 10,
              totalDuration: 600,
            }
          }),
          ...(selectedType === 'HYBRID' && {
            hybridProgram: {
              id: 'hybrid-001',
              name: 'Strength + Cardio',
              blocks: [
                {
                  id: 'block-001',
                  type: 'exercise',
                  name: 'Strength Block',
                  exercises: [],
                  duration: 20,
                  order: 1,
                },
                {
                  id: 'block-002',
                  type: 'interval',
                  name: 'Cardio Block',
                  equipment: 'bike',
                  intervals: [],
                  duration: 15,
                  order: 2,
                }
              ],
              totalDuration: 35,
            }
          }),
          ...(selectedType === 'AGILITY' && {
            agilityProgram: {
              id: 'agility-001',
              name: 'Speed Development',
              drills: [
                {
                  id: 'drill-001',
                  name: '5-10-5 Drill',
                  category: 'change-of-direction',
                  duration: 10,
                  sets: 3,
                  restBetweenSets: 60,
                }
              ],
              phases: [
                { type: 'warmup', duration: 5 },
                { type: 'main', duration: 25 },
                { type: 'cooldown', duration: 5 },
              ],
              totalDuration: 35,
            }
          }),
        } as any,
      };

      const result = await createWorkout(newWorkout);
      console.log('Workout created:', result);
      setSelectedWorkoutId(result.id);
    } catch (error) {
      console.error('Failed to create workout:', getErrorMessage(error));
      
      // Handle specific error types
      if (isValidationError(error)) {
        console.log('Validation error occurred');
      } else if (isMedicalRestriction(error)) {
        console.log('Medical restriction prevents workout assignment');
      }
    }
  }, [selectedType, selectedPlayerId, createWorkout, getErrorMessage, isValidationError, isMedicalRestriction]);

  const handleUpdateWorkout = useCallback(async () => {
    if (!selectedWorkoutId) return;

    try {
      const updateData: UpdateWorkoutRequest = {
        id: selectedWorkoutId,
        type: selectedType,
        workout: {
          name: `Updated ${selectedType} Workout`,
          description: 'Updated description',
          estimatedDuration: 75,
        },
      };

      const result = await updateWorkout(updateData);
      console.log('Workout updated:', result);
    } catch (error) {
      console.error('Failed to update workout:', getErrorMessage(error));
    }
  }, [selectedWorkoutId, selectedType, updateWorkout, getErrorMessage]);

  const handleDeleteWorkout = useCallback(async () => {
    if (!selectedWorkoutId) return;

    try {
      await deleteWorkout(selectedWorkoutId);
      console.log('Workout deleted');
      setSelectedWorkoutId('');
    } catch (error) {
      console.error('Failed to delete workout:', getErrorMessage(error));
    }
  }, [selectedWorkoutId, deleteWorkout, getErrorMessage]);

  const handleDuplicateWorkout = useCallback(async () => {
    if (!selectedWorkoutId) return;

    try {
      const result = await duplicateWorkout(selectedWorkoutId, {
        modifications: {
          name: `Copy of ${currentWorkout?.name}`,
        },
        includeAssignments: false,
      });
      console.log('Workout duplicated:', result);
    } catch (error) {
      console.error('Failed to duplicate workout:', getErrorMessage(error));
    }
  }, [selectedWorkoutId, currentWorkout?.name, duplicateWorkout, getErrorMessage]);

  const handleValidateWorkout = useCallback(async () => {
    if (!currentWorkout) return;

    try {
      const validationResult = await validateWorkout({
        workout: currentWorkout,
        type: currentWorkout.type,
        context: {
          playerIds: currentWorkout.assignedPlayerIds,
          teamIds: currentWorkout.assignedTeamIds,
        },
      });

      console.log('Validation result:', validationResult);
    } catch (error) {
      console.error('Validation failed:', getErrorMessage(error));
    }
  }, [currentWorkout, validateWorkout, getErrorMessage]);

  // ============================================
  // Render Examples
  // ============================================

  if (isLoadingWorkouts) {
    return <div className="p-4">Loading workouts...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Standardized API Examples</h1>
      
      {/* Controls */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h2 className="text-lg font-semibold">Controls</h2>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Workout Type</label>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value as WorkoutType)}
              className="w-full border rounded px-3 py-2"
            >
              {allTypes.map(type => (
                <option key={type} value={type}>
                  {getTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Player ID</label>
            <select 
              value={selectedPlayerId} 
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="player-001">Connor McDavid</option>
              <option value="player-002">Auston Matthews</option>
              <option value="player-003">Nathan MacKinnon</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Selected Workout</label>
            <select 
              value={selectedWorkoutId} 
              onChange={(e) => setSelectedWorkoutId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select a workout...</option>
              {workouts.map(workout => (
                <option key={workout.id} value={workout.id}>
                  {workout.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={handleCreateWorkout}
            disabled={isActionLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Create Workout
          </button>
          
          <button 
            onClick={handleUpdateWorkout}
            disabled={isActionLoading || !selectedWorkoutId}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Update Workout
          </button>
          
          <button 
            onClick={handleDuplicateWorkout}
            disabled={isActionLoading || !selectedWorkoutId}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            Duplicate Workout
          </button>
          
          <button 
            onClick={handleValidateWorkout}
            disabled={isValidating || !currentWorkout}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Validate Workout
          </button>
          
          <button 
            onClick={handleDeleteWorkout}
            disabled={isActionLoading || !selectedWorkoutId}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            Delete Workout
          </button>
        </div>
      </div>

      {/* Workouts List */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">
          {getTypeLabel(selectedType)} Workouts ({workouts.length})
        </h2>
        
        <div className="space-y-2">
          {workouts.map(workout => (
            <div 
              key={workout.id} 
              className={`p-3 border rounded cursor-pointer transition-colors ${
                selectedWorkoutId === workout.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedWorkoutId(workout.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{workout.name}</h3>
                  <p className="text-sm text-gray-600">{workout.description}</p>
                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                    <span>Duration: {workout.estimatedDuration}min</span>
                    <span>Players: {workout.assignedPlayerIds?.length || 0}</span>
                    <span>Teams: {workout.assignedTeamIds?.length || 0}</span>
                  </div>
                </div>
                <span 
                  className={`px-2 py-1 text-xs rounded text-white bg-${getTypeColor(workout.type)}-500`}
                >
                  {workout.type}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {pagination && (
          <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
            <span>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} workouts
            </span>
            <div className="flex gap-2">
              <button 
                disabled={!pagination.hasPrevious}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                disabled={!pagination.hasNext}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Current Workout Details */}
      {currentWorkout && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Current Workout Details</h2>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Name:</strong> {currentWorkout.name}
            </div>
            <div>
              <strong>Type:</strong> {getTypeLabel(currentWorkout.type)}
            </div>
            <div>
              <strong>Duration:</strong> {currentWorkout.estimatedDuration} minutes
            </div>
            <div>
              <strong>Location:</strong> {currentWorkout.location || 'Not specified'}
            </div>
            <div>
              <strong>Players:</strong> {currentWorkout.assignedPlayerIds?.length || 0}
            </div>
            <div>
              <strong>Teams:</strong> {currentWorkout.assignedTeamIds?.length || 0}
            </div>
          </div>
          
          {currentWorkout.description && (
            <div className="mt-4">
              <strong>Description:</strong>
              <p className="text-gray-600 mt-1">{currentWorkout.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Workout Statistics</h2>
          
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.data.totalCount}</div>
              <div className="text-sm text-gray-600">Total Workouts</div>
            </div>
            
            {Object.entries(stats.data.byType).map(([type, count]) => (
              <div key={type}>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-600">{getTypeLabel(type as WorkoutType)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player-Specific Workouts */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">
          Workouts for Selected Player ({playerWorkouts.length})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {playerWorkouts.map(workout => (
            <div key={workout.id} className="p-2 border rounded text-sm">
              <div className="font-medium">{workout.name}</div>
              <div className="text-gray-600">{getTypeLabel(workout.type)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* API Status */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">API Status</h2>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Loading States:</strong>
            <ul className="mt-1 space-y-1">
              <li>Workouts: {isLoadingWorkouts ? '✓' : '✗'}</li>
              <li>Current Workout: {isLoadingWorkout ? '✓' : '✗'}</li>
              <li>Actions: {isActionLoading ? '✓' : '✗'}</li>
              <li>Validation: {isValidating ? '✓' : '✗'}</li>
              <li>Statistics: {isLoadingStats ? '✓' : '✗'}</li>
            </ul>
          </div>
          
          <div>
            <strong>Last Results:</strong>
            <ul className="mt-1 space-y-1">
              <li>Create: {createResult.isSuccess ? '✓' : createResult.isError ? '✗' : '-'}</li>
              <li>Update: {updateResult.isSuccess ? '✓' : updateResult.isError ? '✗' : '-'}</li>
            </ul>
          </div>
        </div>
        
        {(workoutsError || workoutError) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <strong>Errors:</strong>
            <ul className="mt-1 space-y-1 text-red-700">
              {workoutsError && <li>Workouts: {getErrorMessage(workoutsError)}</li>}
              {workoutError && <li>Workout: {getErrorMessage(workoutError)}</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandardizedApiExample;