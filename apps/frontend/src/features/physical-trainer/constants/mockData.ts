export const mockTodaysSessions = [
  {
    id: 3,
    time: '07:30',
    team: 'A-Team',
    type: 'Recovery Session',
    location: 'Gym',
    players: 22,
    status: 'completed',
    intensity: 'low',
    description: 'Active recovery & mobility'
  },
  {
    id: 2,
    time: '09:00',
    team: 'J20 Team',
    type: 'Strength Training',
    location: 'Weight Room',
    players: 18,
    status: 'active',
    intensity: 'high',
    description: 'Olympic lifts & plyometrics'
  },
  {
    id: 1,
    time: '11:00',
    team: 'A-Team',
    type: 'Cardio Intervals',
    location: 'Field',
    players: 20,
    status: 'upcoming',
    intensity: 'high',
    description: 'High-intensity interval training'
  },
  {
    id: 4,
    time: '14:00',
    team: 'U18 Team',
    type: 'Speed & Agility',
    location: 'Field',
    players: 16,
    status: 'upcoming',
    intensity: 'medium',
    description: 'Sprint drills & ladder work'
  },
  {
    id: 5,
    time: '15:30',
    team: 'U16 Team',
    type: 'Power Development',
    location: 'Weight Room',
    players: 14,
    status: 'upcoming',
    intensity: 'medium',
    description: 'Explosive power training'
  },
  {
    id: 6,
    time: '17:00',
    team: 'Individual',
    type: 'Sprint Training',
    location: 'Track',
    players: 3,
    status: 'upcoming',
    intensity: 'high',
    description: 'Individual sprint intervals'
  }
];

export const mockPlayerReadiness = [
  { id: 1, name: 'Erik Andersson', status: 'ready', load: 85, fatigue: 'low', trend: 'up' },
  { id: 2, name: 'Marcus Lindberg', status: 'caution', load: 95, fatigue: 'medium', trend: 'stable' },
  { id: 3, name: 'Viktor Nilsson', status: 'rest', load: 110, fatigue: 'high', trend: 'down' },
  { id: 4, name: 'Johan Bergström', status: 'ready', load: 78, fatigue: 'low', trend: 'up' },
  { id: 5, name: 'Anders Johansson', status: 'caution', load: 92, fatigue: 'medium', trend: 'stable' }
];

export const mockExerciseLibraryStats = {
  total: 247,
  byCategory: {
    strength: 85,
    conditioning: 62,
    agility: 45,
    mobility: 35,
    recovery: 20
  },
  recentlyAdded: 12,
  withVideos: 198
};

export const mockSessionTemplates = [
  { id: 1, name: 'Pre-Season Strength', category: 'Strength', duration: 60, exercises: 8, lastUsed: '2 days ago' },
  { id: 2, name: 'In-Season Maintenance', category: 'Mixed', duration: 45, exercises: 6, lastUsed: '1 week ago' },
  { id: 3, name: 'Recovery Protocol', category: 'Recovery', duration: 30, exercises: 5, lastUsed: 'Yesterday' },
  { id: 4, name: 'Speed Development', category: 'Speed', duration: 50, exercises: 7, lastUsed: '3 days ago' }
];

export const getCardioIntervals = () => {
  const intervals = [];
  for (let i = 0; i < 8; i++) {
    intervals.push({ phase: 'work' as const, duration: 240 }); // 4 minutes
    if (i < 7) {
      intervals.push({ phase: 'rest' as const, duration: 120 }); // 2 minutes
    }
  }
  return intervals;
};