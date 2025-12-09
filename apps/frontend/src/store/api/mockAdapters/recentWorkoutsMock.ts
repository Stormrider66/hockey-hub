// Mock data for recent workouts with unique IDs
import { nanoid } from 'nanoid';

export const generateMockRecentWorkouts = () => {
  const workoutTypes = ['STRENGTH', 'CONDITIONING', 'HYBRID', 'AGILITY'] as const;
  const workoutNames = [
    'Upper Body Power Session',
    'HIIT Cardio Blast',
    'Full Body Circuit',
    'Speed & Agility Drills',
    'Core Strength Focus',
    'Endurance Builder',
    'Plyometric Training',
    'Recovery Session'
  ];
  
  // Generate unique workouts with guaranteed unique IDs
  return workoutNames.slice(0, 5).map((name, index) => ({
    id: `workout-${nanoid()}`, // Using nanoid for guaranteed unique IDs
    name,
    type: workoutTypes[index % workoutTypes.length],
    createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
    lastUsed: index < 3 ? new Date(Date.now() - index * 12 * 60 * 60 * 1000).toISOString() : undefined,
    playerCount: Math.floor(Math.random() * 10) + 1,
    teamCount: Math.floor(Math.random() * 3),
    duration: 30 + Math.floor(Math.random() * 60),
    isFavorite: index < 2,
    usageCount: Math.floor(Math.random() * 20) + 1,
    successRate: 80 + Math.floor(Math.random() * 20),
  }));
};

// Helper to ensure no duplicate IDs in mock data
export const ensureUniqueIds = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.map(item => {
    if (seen.has(item.id)) {
      console.warn(`Duplicate ID found: ${item.id}, generating new ID`);
      return { ...item, id: `${item.id}-${nanoid(6)}` };
    }
    seen.add(item.id);
    return item;
  });
};