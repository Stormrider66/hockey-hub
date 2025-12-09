/**
 * Utility to generate large amounts of test data for performance testing
 */

interface GeneratePlayersOptions {
  count: number;
  teamId?: string;
}

export function generateTestPlayers({ count, teamId }: GeneratePlayersOptions) {
  const positions = ['Center', 'Left Wing', 'Right Wing', 'Defense', 'Goalie'];
  const statuses = ['healthy', 'injured', 'limited', 'unavailable'] as const;
  const teams = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'];
  
  return Array.from({ length: count }, (_, i) => {
    const id = `player-${i + 1}`;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      id,
      name: `Player ${i + 1}`,
      jerseyNumber: Math.floor(Math.random() * 99) + 1,
      position: positions[Math.floor(Math.random() * positions.length)],
      team: teamId || teams[Math.floor(Math.random() * teams.length)],
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      wellness: {
        status
      },
      medicalRestrictions: status === 'injured' || status === 'limited' 
        ? [{ type: 'movement', severity: 'moderate' }] 
        : []
    };
  });
}

export function generateTestTeams(count: number) {
  const categories = ['Youth', 'Junior', 'Senior', 'Elite'];
  const ageGroups = ['U12', 'U14', 'U16', 'U18', 'U20', 'Senior'];
  const levels = ['Division 1', 'Division 2', 'Division 3', 'Premier'];
  
  return Array.from({ length: count }, (_, i) => {
    const teamId = `team-${i + 1}`;
    const playerCount = Math.floor(Math.random() * 15) + 20; // 20-35 players per team
    
    return {
      id: teamId,
      name: `Team ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      ageGroup: ageGroups[Math.floor(Math.random() * ageGroups.length)],
      level: levels[Math.floor(Math.random() * levels.length)],
      players: generateTestPlayers({ count: playerCount, teamId })
    };
  });
}

export function generateTestExercises(count: number) {
  const categories = ['warmup', 'main', 'accessory', 'core', 'cooldown'] as const;
  const equipment = ['Barbell', 'Dumbbell', 'Kettlebell', 'Resistance Band', 'Medicine Ball', 'TRX', 'None'];
  const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Full Body'];
  const difficulties = ['beginner', 'intermediate', 'advanced'] as const;
  
  const exerciseNames = [
    'Squat', 'Deadlift', 'Bench Press', 'Row', 'Pull-up', 'Push-up',
    'Lunge', 'Plank', 'Burpee', 'Jump Rope', 'Mountain Climber',
    'Russian Twist', 'Leg Press', 'Calf Raise', 'Bicep Curl',
    'Tricep Extension', 'Shoulder Press', 'Lateral Raise'
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const baseName = exerciseNames[Math.floor(Math.random() * exerciseNames.length)];
    const variation = i > exerciseNames.length ? ` Variation ${Math.floor(i / exerciseNames.length)}` : '';
    
    return {
      id: `exercise-${i + 1}`,
      templateId: `template-${i + 1}`,
      name: `${baseName}${variation}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      equipment: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 }, 
        () => equipment[Math.floor(Math.random() * equipment.length)]
      ),
      muscleGroups: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 }, 
        () => muscleGroups[Math.floor(Math.random() * muscleGroups.length)]
      ),
      defaultSets: Math.floor(Math.random() * 3) + 3,
      defaultReps: Math.floor(Math.random() * 15) + 5,
      defaultDuration: Math.random() > 0.5 ? Math.floor(Math.random() * 60) + 20 : undefined,
      restPeriod: Math.floor(Math.random() * 90) + 30,
      difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
      instructions: `Perform this exercise with proper form. Focus on controlled movements.`,
      coachingCues: ['Keep core engaged', 'Maintain neutral spine', 'Breathe steadily']
    };
  });
}

export function generateTestPlayerReadiness(count: number) {
  const statuses = ['ready', 'caution', 'rest'] as const;
  const fatigueStates = ['Low', 'Moderate', 'High'];
  const trends = ['up', 'down', 'stable'] as const;
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    load: Math.floor(Math.random() * 100),
    fatigue: fatigueStates[Math.floor(Math.random() * fatigueStates.length)],
    trend: trends[Math.floor(Math.random() * trends.length)]
  }));
}