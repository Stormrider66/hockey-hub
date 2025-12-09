import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context';
import { WorkoutCreationContext, sessionTypeToWorkoutBuilder, WorkoutType } from '../types';

/**
 * Navigate to the appropriate workout builder with pre-filled context
 * @param router - Next.js app router instance
 * @param context - Workout creation context with session and player details
 */
export function navigateToWorkoutBuilder(router: AppRouterInstance, context: WorkoutCreationContext) {
  // Get the workout type from session type
  const workoutTypeEnum = sessionTypeToWorkoutBuilder[context.sessionType] || WorkoutType.STRENGTH;
  
  // Convert enum to lowercase for URL (STRENGTH -> strength)
  const workoutType = workoutTypeEnum.toLowerCase();
  
  // Encode the context as URL parameters
  const queryParams = new URLSearchParams({
    playerId: context.playerId,
    playerName: context.playerName,
    teamId: context.teamId,
    teamName: context.teamName,
    sessionId: context.sessionId.toString(),
    sessionType: context.sessionType,
    sessionDate: context.sessionDate.toISOString(),
    sessionTime: context.sessionTime,
    sessionLocation: context.sessionLocation,
    returnPath: context.returnPath || '/physicaltrainer',
    prefilled: 'true' // Flag to indicate this is a pre-filled session
  });
  
  // Navigate to the sessions tab with the workout type and context
  const url = `/physicaltrainer?tab=sessions&workoutType=${workoutType}&context=${encodeURIComponent(queryParams.toString())}`;
  router.push(url);
}

/**
 * Parse workout creation context from URL parameters
 * @param query - URL query parameters
 * @returns Parsed context or null if not present
 */
export function parseWorkoutContext(query: string | string[] | undefined): WorkoutCreationContext | null {
  if (!query || typeof query !== 'string') return null;
  
  try {
    const params = new URLSearchParams(query);
    
    // Check if this is a pre-filled context
    if (params.get('prefilled') !== 'true') return null;
    
    return {
      sessionId: params.get('sessionId') || '',
      sessionType: params.get('sessionType') || '',
      sessionDate: new Date(params.get('sessionDate') || ''),
      sessionTime: params.get('sessionTime') || '',
      sessionLocation: params.get('sessionLocation') || '',
      teamId: params.get('teamId') || '',
      teamName: params.get('teamName') || '',
      playerId: params.get('playerId') || '',
      playerName: params.get('playerName') || '',
      returnPath: params.get('returnPath') || undefined
    };
  } catch (error) {
    console.error('Error parsing workout context:', error);
    return null;
  }
}

/**
 * Check if a player has a workout assigned for a session
 * @param playerId - Player ID
 * @param assignedPlayerIds - Array of player IDs with workouts
 * @returns Boolean indicating if the player has a workout
 */
export function playerHasWorkout(playerId: string, assignedPlayerIds: string[]): boolean {
  return assignedPlayerIds.includes(playerId);
}

/**
 * Get descriptive text for creating a workout
 * @param context - Workout creation context
 * @returns Descriptive text for UI display
 */
export function getWorkoutCreationDescription(context: WorkoutCreationContext): string {
  const date = new Date(context.sessionDate);
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  
  return `Creating ${context.sessionType} workout for ${context.playerName} - ${context.teamName} (${dateStr} at ${context.sessionTime})`;
}