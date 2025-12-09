import { WorkoutSession } from '../types';

/**
 * Get color for workout type
 */
export function getWorkoutTypeColor(type: string): string {
  const colors = {
    strength: '#1976d2',
    conditioning: '#d32f2f',
    agility: '#f57c00',
    recovery: '#388e3c',
    hybrid: '#7b1fa2',
    assessment: '#795548',
    skill: '#607d8b',
    mixed: '#9e9e9e',
  };
  return colors[type] || '#757575';
}

/**
 * Get icon component for workout type
 */
export function getWorkoutTypeIcon(type: string): React.ReactElement {
  const icons = {
    strength: '💪',
    conditioning: '🏃',
    agility: '⚡',
    recovery: '🧘',
    hybrid: '🔀',
    assessment: '📊',
    skill: '🎯',
    mixed: '🎲',
  };
  
  return <span style={{ fontSize: '1.5em' }}>{icons[type] || '🏋️'}</span>;
}

/**
 * Calculate workout similarity score (0-100)
 */
export function calculateWorkoutSimilarity(workout1: WorkoutSession, workout2: WorkoutSession): number {
  let score = 0;
  
  // Type match (30 points)
  if (workout1.type === workout2.type) score += 30;
  
  // Intensity match (20 points)
  if (workout1.intensity === workout2.intensity) score += 20;
  
  // Duration similarity (20 points)
  const dur1 = workout1.metadata?.duration || 60;
  const dur2 = workout2.metadata?.duration || 60;
  const durDiff = Math.abs(dur1 - dur2);
  score += Math.max(0, 20 - durDiff / 3);
  
  // Exercise overlap (30 points)
  const exercises1 = new Set(workout1.exercises.map(e => e.name));
  const exercises2 = new Set(workout2.exercises.map(e => e.name));
  const intersection = [...exercises1].filter(x => exercises2.has(x));
  const union = new Set([...exercises1, ...exercises2]);
  
  if (union.size > 0) {
    score += (intersection.length / union.size) * 30;
  }
  
  return Math.round(score);
}

/**
 * Group workouts by type
 */
export function groupWorkoutsByType(workouts: WorkoutSession[]): Record<string, WorkoutSession[]> {
  return workouts.reduce((groups, workout) => {
    const type = workout.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(workout);
    return groups;
  }, {} as Record<string, WorkoutSession[]>);
}

/**
 * Calculate total workout volume
 */
export function calculateTotalVolume(workout: WorkoutSession): number {
  return workout.exercises.reduce((total, exercise) => {
    const sets = exercise.sets || 0;
    const reps = exercise.reps || 0;
    const weight = exercise.weight || 0;
    return total + (sets * reps * weight);
  }, 0);
}

/**
 * Calculate workout intensity score
 */
export function calculateIntensityScore(workout: WorkoutSession): number {
  const baseScore = {
    low: 25,
    medium: 50,
    high: 75,
    max: 100,
  };
  
  let score = baseScore[workout.intensity] || 50;
  
  // Adjust based on exercise intensity
  const exerciseIntensities = workout.exercises.map(e => baseScore[e.intensity || 'medium']);
  if (exerciseIntensities.length > 0) {
    const avgExerciseIntensity = exerciseIntensities.reduce((a, b) => a + b, 0) / exerciseIntensities.length;
    score = (score + avgExerciseIntensity) / 2;
  }
  
  return Math.round(score);
}

/**
 * Get workout recommendations based on history
 */
export function getWorkoutRecommendations(
  recentWorkouts: WorkoutSession[],
  availableWorkouts: WorkoutSession[]
): WorkoutSession[] {
  // Count recent workout types
  const recentTypes = recentWorkouts.reduce((counts, workout) => {
    counts[workout.type] = (counts[workout.type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  // Find underrepresented types
  const allTypes = ['strength', 'conditioning', 'agility', 'recovery'];
  const underrepresented = allTypes.filter(type => (recentTypes[type] || 0) < 2);
  
  // Recommend workouts of underrepresented types
  return availableWorkouts
    .filter(workout => underrepresented.includes(workout.type))
    .sort((a, b) => (recentTypes[a.type] || 0) - (recentTypes[b.type] || 0))
    .slice(0, 3);
}

/**
 * Format workout duration
 */
export function formatWorkoutDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}min`;
}

/**
 * Calculate workout load score
 */
export function calculateWorkoutLoad(workout: WorkoutSession): number {
  const intensityMultiplier = {
    low: 0.6,
    medium: 0.8,
    high: 1.0,
    max: 1.2,
  };
  
  const duration = workout.metadata?.duration || 60;
  const multiplier = intensityMultiplier[workout.intensity] || 0.8;
  
  return Math.round(duration * multiplier);
}

/**
 * Get next workout in sequence
 */
export function getNextWorkoutInSequence(
  currentWorkout: WorkoutSession,
  allWorkouts: WorkoutSession[]
): WorkoutSession | null {
  // Simple progression logic
  const sameTypeWorkouts = allWorkouts.filter(w => w.type === currentWorkout.type);
  const currentIntensityLevel = ['low', 'medium', 'high', 'max'].indexOf(currentWorkout.intensity);
  
  // Find workout with next intensity level
  const nextIntensity = ['low', 'medium', 'high', 'max'][Math.min(currentIntensityLevel + 1, 3)];
  const nextWorkout = sameTypeWorkouts.find(w => w.intensity === nextIntensity);
  
  return nextWorkout || null;
}

/**
 * Check if workout is suitable for player
 */
export function isWorkoutSuitableForPlayer(
  workout: WorkoutSession,
  playerLevel: 'beginner' | 'intermediate' | 'advanced',
  playerRestrictions: string[] = []
): { suitable: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let suitable = true;
  
  // Check intensity vs player level
  if (playerLevel === 'beginner' && (workout.intensity === 'high' || workout.intensity === 'max')) {
    suitable = false;
    reasons.push('Intensity too high for beginner level');
  }
  
  if (playerLevel === 'intermediate' && workout.intensity === 'max') {
    suitable = false;
    reasons.push('Maximum intensity reserved for advanced players');
  }
  
  // Check exercise restrictions
  const restrictedExercises = workout.exercises.filter(exercise => {
    return playerRestrictions.some(restriction => 
      exercise.name.toLowerCase().includes(restriction.toLowerCase())
    );
  });
  
  if (restrictedExercises.length > 0) {
    suitable = false;
    reasons.push(`Contains restricted exercises: ${restrictedExercises.map(e => e.name).join(', ')}`);
  }
  
  return { suitable, reasons };
}