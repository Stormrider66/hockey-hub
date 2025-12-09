export const mockTodaysSessions = [
  {
    id: 3,
    time: '07:30',
    team: 'aTeam', // translation key
    type: 'recoverySession', // translation key
    location: 'gym', // translation key
    players: 22,
    status: 'completed',
    intensity: 'low',
    description: 'activeRecoveryMobility', // translation key
    category: 'recovery'
  },
  {
    id: 2,
    time: '09:00',
    team: 'j20Team', // translation key
    type: 'strengthTraining', // translation key
    location: 'weightRoom', // translation key
    players: 18,
    status: 'active',
    intensity: 'high',
    description: 'olympicLiftsPlyometrics', // translation key
    category: 'strength'
  },
  {
    id: 1,
    time: '11:00',
    team: 'aTeam', // translation key
    type: 'cardioIntervals', // translation key
    location: 'field', // translation key
    players: 20,
    status: 'upcoming',
    intensity: 'high',
    description: 'highIntensityIntervalTraining', // translation key
    category: 'cardio'
  },
  {
    id: 4,
    time: '14:00',
    team: 'u18Team', // translation key
    type: 'agilityTraining', // translation key
    location: 'field', // translation key
    players: 16,
    status: 'upcoming',
    intensity: 'medium',
    description: 'conesDrillsReactiveTraining', // translation key
    category: 'agility'
  },
  {
    id: 5,
    time: '15:30',
    team: 'u16Team', // translation key
    type: 'hybridWorkout', // translation key
    location: 'weightRoom', // translation key
    players: 14,
    status: 'upcoming',
    intensity: 'medium',
    description: 'strengthCardioCombo', // translation key
    category: 'hybrid'
  },
  {
    id: 6,
    time: '17:00',
    team: 'individual', // translation key
    type: 'sprintTraining', // translation key
    location: 'track', // translation key
    players: 3,
    status: 'upcoming',
    intensity: 'high',
    description: 'individualSprintIntervals', // translation key
    category: 'speed'
  }
];

export const mockPlayerReadiness = [
  { id: 1, playerId: '1', name: 'Erik Andersson', status: 'ready' as const, load: 85, fatigue: 'low' as const, trend: 'up' as const, lastUpdated: new Date().toISOString() },
  { id: 2, playerId: '2', name: 'Marcus Lindberg', status: 'caution' as const, load: 95, fatigue: 'medium' as const, trend: 'stable' as const, lastUpdated: new Date().toISOString() },
  { id: 3, playerId: '3', name: 'Nathan MacKinnon', status: 'ready' as const, load: 75, fatigue: 'low' as const, trend: 'stable' as const, lastUpdated: new Date().toISOString() },
  { id: 4, playerId: '4', name: 'Johan Bergström', status: 'ready' as const, load: 78, fatigue: 'low' as const, trend: 'up' as const, lastUpdated: new Date().toISOString() },
  { id: 5, playerId: '5', name: 'Sidney Crosby', status: 'rest' as const, load: 110, fatigue: 'high' as const, trend: 'down' as const, lastUpdated: new Date().toISOString() }
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

export const mockAgilitySession = {
  drills: [
    {
      id: 'drill-1',
      name: 'T-Drill',
      duration: 30,
      pattern: 'T-drill',
      targetTime: 9.5,
      restTime: 60,
      reps: 5,
      description: 'Sprint forward to center cone, shuffle left, shuffle right, shuffle back to center, backpedal to start',
      cues: ['Stay low in shuffles', 'Touch each cone', 'Explosive direction changes']
    },
    {
      id: 'drill-2',
      name: '5-10-5 Shuttle',
      duration: 20,
      pattern: '5-10-5',
      targetTime: 4.5,
      restTime: 90,
      reps: 6,
      description: 'Start in center, sprint 5 yards right, 10 yards left, 5 yards back to center',
      cues: ['Low center of gravity', 'Plant outside foot hard', 'Drive with arms']
    },
    {
      id: 'drill-3',
      name: 'Cone Weaving',
      duration: 45,
      pattern: 'Cone weave',
      targetTime: 12,
      restTime: 60,
      reps: 4,
      description: 'Weave through 8 cones placed 2 yards apart',
      cues: ['Quick feet', 'Keep hips square', 'Minimal ground contact time']
    },
    {
      id: 'drill-4',
      name: 'Reactive Ball Drills',
      duration: 15,
      pattern: 'Reactive',
      restTime: 30,
      reps: 8,
      description: 'React to bouncing ball and catch before second bounce',
      cues: ['Stay on balls of feet', 'Track ball with eyes', 'Quick first step']
    }
  ],
  warmupDuration: 600, // 10 minutes
  cooldownDuration: 300 // 5 minutes
};

export const mockHybridBlocks = [
  {
    id: 'block-1',
    type: 'exercise' as const,
    name: 'Strength Block',
    duration: 600,
    content: [
      { id: '1', name: 'Power Clean', sets: 4, reps: 3, restBetweenSets: 90 },
      { id: '2', name: 'Box Jumps', sets: 4, reps: 5, restBetweenSets: 60 }
    ],
    order: 0
  },
  {
    id: 'block-2',
    type: 'interval' as const,
    name: 'Cardio Intervals',
    duration: 480,
    content: [
      { id: 'int-1', type: 'work' as const, duration: 30, equipment: 'bike_erg' as const, targetMetrics: { heartRate: { type: 'percentage' as const, value: 85 } } },
      { id: 'int-2', type: 'rest' as const, duration: 30, equipment: 'bike_erg' as const, targetMetrics: {} },
      { id: 'int-3', type: 'work' as const, duration: 30, equipment: 'bike_erg' as const, targetMetrics: { heartRate: { type: 'percentage' as const, value: 85 } } },
      { id: 'int-4', type: 'rest' as const, duration: 30, equipment: 'bike_erg' as const, targetMetrics: {} }
    ],
    order: 1
  },
  {
    id: 'block-3',
    type: 'exercise' as const,
    name: 'Core Finisher',
    duration: 300,
    content: [
      { id: '3', name: 'Plank Hold', sets: 3, duration: 60, restBetweenSets: 30 },
      { id: '4', name: 'Russian Twists', sets: 3, reps: 20, restBetweenSets: 30 }
    ],
    order: 2
  }
];