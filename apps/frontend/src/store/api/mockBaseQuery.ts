import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { mockBaseQuery as mockAuthBaseQuery } from './mockAuthApi';
import { trainingMockHandlers } from './mockAdapters/trainingMockAdapter';
import { calendarMockHandlers } from './mockAdapters/calendarMockAdapter';
import type { 
  SessionBundle, 
  BundleSession, 
  SessionParticipant,
  ParticipantMetrics 
} from '@/features/physical-trainer/components/bulk-sessions/bulk-sessions.types';

// Mock data for various APIs
const mockNotificationData = {
  unreadCount: 3,
  notifications: [
    {
      id: '1',
      user_id: 'mock-user-1',
      type: 'announcement',
      title: 'Welcome to Hockey Hub!',
      content: 'Get started by exploring your dashboard.',
      priority: 'normal',
      status: 'unread',
      channel: 'in_app',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: 'mock-user-1',
      type: 'training_assigned',
      title: 'New Training Session',
      content: 'Your coach has assigned a new training session.',
      priority: 'high',
      status: 'unread',
      channel: 'in_app',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  stats: {
    totalNotifications: 10,
    unreadCount: 3,
    readCount: 7,
  },
};

// Mock recent workouts data
const mockRecentWorkouts = [
  {
    id: 'workout-1',
    name: 'Pre-Season Strength Training',
    type: 'STRENGTH',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    lastUsed: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    playerCount: 15,
    teamCount: 1,
    duration: 60,
    isFavorite: true,
    usageCount: 12,
    successRate: 95,
  },
  {
    id: 'workout-2',
    name: 'HIIT Bike Intervals',
    type: 'CONDITIONING',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    lastUsed: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    playerCount: 8,
    teamCount: 0,
    duration: 30,
    isFavorite: false,
    usageCount: 5,
    successRate: 88,
  },
  {
    id: 'workout-3',
    name: 'Game Day Activation',
    type: 'HYBRID',
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    playerCount: 20,
    teamCount: 1,
    duration: 45,
    isFavorite: true,
    usageCount: 8,
    successRate: 92,
  },
  {
    id: 'workout-4',
    name: 'Speed & Agility Circuit',
    type: 'AGILITY',
    createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    playerCount: 12,
    teamCount: 0,
    duration: 40,
    isFavorite: false,
    usageCount: 3,
    successRate: 90,
  },
  {
    id: 'workout-5',
    name: 'Core Stability Foundation',
    type: 'STABILITY_CORE',
    createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    lastUsed: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    playerCount: 18,
    teamCount: 1,
    duration: 35,
    isFavorite: true,
    usageCount: 7,
    successRate: 94,
  },
  {
    id: 'workout-6',
    name: 'Explosive Power Jumps',
    type: 'PLYOMETRICS',
    createdAt: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
    lastUsed: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    playerCount: 10,
    teamCount: 0,
    duration: 45,
    isFavorite: false,
    usageCount: 4,
    successRate: 87,
  },
  {
    id: 'workout-7',
    name: 'Wrestling Technique Session',
    type: 'WRESTLING',
    createdAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    lastUsed: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    playerCount: 14,
    teamCount: 1,
    duration: 60,
    isFavorite: true,
    usageCount: 6,
    successRate: 91,
  },
];

const mockDashboardData = {
  player: {
    todaySchedule: [
      { id: '1', title: 'Morning Practice', time: '09:00', location: 'Main Rink' },
      { id: '2', title: 'Team Meeting', time: '14:00', location: 'Conference Room' },
    ],
    upcomingTraining: [
      { id: '1', title: 'Strength Training', date: 'Tomorrow', trainer: 'Coach Johnson' },
      { id: '2', title: 'Skills Development', date: 'Friday', trainer: 'Coach Smith' },
    ],
    wellnessStatus: {
      lastSubmission: new Date().toISOString(),
      overallScore: 8.5,
      trend: 'improving',
    },
  },
  coach: {
    teamOverview: {
      totalPlayers: 24,
      activeToday: 22,
      injuredPlayers: 2,
    },
    todaySchedule: [
      { id: '1', title: 'Morning Practice', time: '09:00', players: 22 },
      { id: '2', title: 'Individual Training', time: '15:00', players: 5 },
    ],
  },
};

// Mock session bundles storage
const mockSessionBundles = new Map<string, SessionBundle>();

// Helper function to generate session participants
const generateSessionParticipants = (playerIds: string[], workoutType?: string): SessionParticipant[] => {
  const playerNames = ['Connor McDavid', 'Nathan MacKinnon', 'Sidney Crosby', 'Auston Matthews', 'Leon Draisaitl'];
  const teamNames = ['Edmonton Oilers', 'Colorado Avalanche', 'Pittsburgh Penguins', 'Toronto Maple Leafs'];
  
  return playerIds.map((playerId, index) => ({
    id: `participant-${playerId}-${Date.now()}`,
    playerId,
    playerName: playerNames[index % playerNames.length],
    playerNumber: 87 + index,
    teamId: `team-${Math.floor(index / 2) + 1}`,
    teamName: teamNames[Math.floor(index / 2) % teamNames.length],
    status: Math.random() > 0.8 ? 'disconnected' : 'connected',
    progress: Math.floor(Math.random() * 100),
    currentActivity: ['Warmup', 'Main Set', 'Cool Down', 'Rest'][Math.floor(Math.random() * 4)],
    metrics: generateParticipantMetrics(workoutType)
  }));
};

// Helper function to generate realistic participant metrics
const generateParticipantMetrics = (workoutType?: string): ParticipantMetrics => {
  const heartRate = 120 + Math.floor(Math.random() * 60); // 120-180 bpm
  const getHeartRateZone = (hr: number) => {
    if (hr < 130) return 'zone1';
    if (hr < 140) return 'zone2';
    if (hr < 155) return 'zone3';
    if (hr < 170) return 'zone4';
    return 'zone5';
  };

  // Base metrics
  const baseMetrics = {
    heartRate,
    heartRateZone: getHeartRateZone(heartRate),
    power: Math.floor(200 + Math.random() * 150), // 200-350 watts
    pace: `${3 + Math.random() * 2}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`, // 3:00-5:00 pace
    distance: Math.round((2 + Math.random() * 8) * 100) / 100, // 2-10 km
    calories: Math.floor(150 + Math.random() * 300), // 150-450 calories
    reps: Math.floor(8 + Math.random() * 12), // 8-20 reps
    weight: Math.floor(60 + Math.random() * 100) // 60-160 lbs
  };

  // Add workout-type specific metrics
  switch (workoutType) {
    case 'stability_core':
      return {
        ...baseMetrics,
        balanceTime: Math.floor(30 + Math.random() * 90), // 30-120 seconds
        stabilityScore: Math.floor(70 + Math.random() * 30), // 70-100 score
        coreEngagement: Math.floor(60 + Math.random() * 40), // 60-100%
        trembleIndex: Math.floor(1 + Math.random() * 5), // 1-5 tremor level
        holdDuration: Math.floor(20 + Math.random() * 80), // 20-100 seconds
      };
    case 'plyometrics':
      return {
        ...baseMetrics,
        jumpHeight: Math.floor(25 + Math.random() * 35), // 25-60 cm
        contactTime: Math.floor(150 + Math.random() * 100), // 150-250 ms
        flightTime: Math.floor(300 + Math.random() * 200), // 300-500 ms
        reactivePower: Math.floor(800 + Math.random() * 400), // 800-1200 watts
        landingForce: Math.floor(2 + Math.random() * 3), // 2-5x body weight
      };
    case 'wrestling':
      return {
        ...baseMetrics,
        techniqueScore: Math.floor(65 + Math.random() * 35), // 65-100%
        grappleIntensity: Math.floor(70 + Math.random() * 30), // 70-100%
        takedownAttempts: Math.floor(2 + Math.random() * 8), // 2-10 attempts
        controlTime: Math.floor(30 + Math.random() * 180), // 30-210 seconds
        escapeAttempts: Math.floor(1 + Math.random() * 5), // 1-6 attempts
      };
    default:
      return baseMetrics;
  }
};

// Workout type-specific data generators for enhanced bulk sessions
const generateStrengthWorkoutData = (duration: number, intensity: string, playerCount: number) => {
  const exercises = [
    { id: 'squat', name: 'Barbell Squat', sets: 3, reps: 8, weight: 80, restTime: 120 },
    { id: 'bench', name: 'Bench Press', sets: 3, reps: 10, weight: 70, restTime: 90 },
    { id: 'deadlift', name: 'Deadlift', sets: 3, reps: 6, weight: 100, restTime: 180 },
    { id: 'row', name: 'Bent Over Row', sets: 3, reps: 10, weight: 60, restTime: 90 },
    { id: 'press', name: 'Overhead Press', sets: 3, reps: 8, weight: 50, restTime: 120 }
  ];
  
  const selectedExercises = exercises.slice(0, Math.ceil(duration / 15)).map(ex => ({
    ...ex,
    sets: intensity === 'high' ? ex.sets + 1 : ex.sets,
    weight: intensity === 'high' ? Math.round(ex.weight * 1.1) : intensity === 'low' ? Math.round(ex.weight * 0.8) : ex.weight
  }));
  
  return {
    exercises: selectedExercises,
    totalVolume: selectedExercises.reduce((vol, ex) => vol + (ex.sets * ex.reps * ex.weight), 0),
    equipment: ['barbell', 'plates', 'bench', 'rack'],
    focusAreas: ['strength', 'power', 'muscle_building']
  };
};

const generateConditioningWorkoutData = (duration: number, intensity: string, equipment: string[] = ['bike']) => {
  const equipmentType = equipment[0] || 'bike';
  const intervals = [];
  
  // Warmup
  intervals.push({ duration: 300, intensity: 'warmup', targetBPM: 120, recovery: 0 });
  
  // Main intervals based on intensity
  const mainDuration = Math.max(duration - 600, 300); // minus warmup/cooldown, min 5 min main
  const intervalCount = intensity === 'high' ? 8 : intensity === 'medium' ? 6 : 4;
  const intervalDuration = intensity === 'high' ? 30 : intensity === 'medium' ? 60 : 120;
  const recoveryDuration = Math.round(intervalDuration * (intensity === 'high' ? 2 : 1.5));
  
  for (let i = 0; i < intervalCount; i++) {
    intervals.push({ 
      duration: intervalDuration, 
      intensity: intensity === 'high' ? 'maximum' : intensity === 'medium' ? 'hard' : 'moderate',
      targetBPM: intensity === 'high' ? 180 : intensity === 'medium' ? 160 : 140,
      recovery: recoveryDuration
    });
  }
  
  // Cooldown
  intervals.push({ duration: 300, intensity: 'easy', targetBPM: 110, recovery: 0 });
  
  return {
    intervals,
    equipment: equipmentType,
    totalDistance: Math.floor(Math.random() * 20000) + 5000,
    avgPower: Math.floor(Math.random() * 200) + 150,
    targetZones: intensity === 'high' ? [4, 5] : intensity === 'medium' ? [3, 4] : [2, 3]
  };
};

const generateHybridWorkoutData = (duration: number, intensity: string) => {
  const blocks = [];
  
  // Warmup block
  blocks.push({ type: 'exercise', name: 'Dynamic Warmup', duration: 10, equipment: 'bodyweight' });
  
  // Main blocks - alternate between exercise and cardio
  const mainDuration = Math.max(duration - 20, 10); // minus warmup/cooldown
  const blockCount = Math.floor(mainDuration / 12);
  
  for (let i = 0; i < blockCount; i++) {
    if (i % 2 === 0) {
      blocks.push({
        type: 'exercise',
        name: i === 0 ? 'Upper Body Circuit' : i === 2 ? 'Lower Body Circuit' : 'Core Circuit',
        duration: intensity === 'high' ? 15 : 12,
        equipment: 'dumbbells'
      });
    } else {
      blocks.push({
        type: 'interval',
        name: 'Cardio Burst',
        duration: intensity === 'high' ? 10 : 8,
        equipment: 'bike'
      });
    }
    
    if (i < blockCount - 1) {
      blocks.push({ type: 'transition', name: 'Active Recovery', duration: 2, equipment: 'none' });
    }
  }
  
  // Cooldown
  blocks.push({ type: 'exercise', name: 'Cool Down Stretch', duration: 10, equipment: 'mat' });
  
  return {
    blocks,
    totalBlocks: blocks.length,
    exerciseTime: blocks.filter(b => b.type === 'exercise').reduce((sum, b) => sum + b.duration, 0),
    cardioTime: blocks.filter(b => b.type === 'interval').reduce((sum, b) => sum + b.duration, 0)
  };
};

const generateAgilityWorkoutData = (duration: number, intensity: string) => {
  const drillLibrary = [
    { id: 'ladder-1', name: 'Two Feet In', category: 'ladder', duration: 30, sets: 3, pattern: 'linear' },
    { id: 'cone-1', name: 'T-Drill', category: 'cone', duration: 45, sets: 4, pattern: 't-shape' },
    { id: 'ladder-2', name: 'Ickey Shuffle', category: 'ladder', duration: 30, sets: 3, pattern: 'lateral' },
    { id: 'cone-2', name: '5-10-5 Pro Agility', category: 'cone', duration: 60, sets: 3, pattern: 'shuttle' },
    { id: 'hurdle-1', name: 'Single Leg Hops', category: 'hurdle', duration: 40, sets: 3, pattern: 'vertical' },
    { id: 'reaction-1', name: 'Mirror Drill', category: 'reaction', duration: 45, sets: 3, pattern: 'reactive' }
  ];
  
  const drillCount = Math.max(Math.floor(duration / 12), 2);
  const selectedDrills = drillLibrary.slice(0, drillCount).map(drill => ({
    ...drill,
    sets: intensity === 'high' ? drill.sets + 1 : drill.sets,
    duration: intensity === 'high' ? drill.duration + 15 : drill.duration
  }));
  
  return {
    drills: selectedDrills,
    equipmentRequired: ['agility_ladder', 'cones', 'hurdles'],
    focusAreas: ['speed', 'agility', 'coordination', 'reaction_time'],
    totalDrillTime: selectedDrills.reduce((sum, drill) => sum + (drill.duration * drill.sets), 0)
  };
};

// New workout type generators for Phase 5.2
const generateStabilityCoreWorkoutData = (duration: number, intensity: string) => {
  const exerciseLibrary = [
    { id: 'plank', name: 'Plank Hold', holdTime: 45, sets: 3, difficulty: 'basic', equipment: 'mat' },
    { id: 'side-plank', name: 'Side Plank', holdTime: 30, sets: 3, difficulty: 'intermediate', equipment: 'mat' },
    { id: 'ball-plank', name: 'Stability Ball Plank', holdTime: 30, sets: 3, difficulty: 'advanced', equipment: 'stability_ball' },
    { id: 'dead-bug', name: 'Dead Bug', holdTime: 20, sets: 4, difficulty: 'basic', equipment: 'mat' },
    { id: 'bird-dog', name: 'Bird Dog', holdTime: 30, sets: 3, difficulty: 'intermediate', equipment: 'mat' },
    { id: 'bosu-balance', name: 'BOSU Single Leg Balance', holdTime: 45, sets: 3, difficulty: 'advanced', equipment: 'bosu_ball' },
    { id: 'pallof-press', name: 'Pallof Press', holdTime: 15, sets: 4, difficulty: 'intermediate', equipment: 'resistance_band' },
    { id: 'turkish-getup', name: 'Turkish Get-up', holdTime: 60, sets: 2, difficulty: 'advanced', equipment: 'kettlebell' }
  ];
  
  const exerciseCount = Math.max(Math.floor(duration / 8), 3);
  const difficultyLevel = intensity === 'high' ? 'advanced' : intensity === 'medium' ? 'intermediate' : 'basic';
  
  // Filter by difficulty and select exercises
  const availableExercises = exerciseLibrary.filter(ex => 
    ex.difficulty === difficultyLevel || (intensity === 'high' && ex.difficulty !== 'basic')
  );
  
  const selectedExercises = availableExercises.slice(0, exerciseCount).map(exercise => ({
    ...exercise,
    holdTime: intensity === 'high' ? exercise.holdTime + 15 : exercise.holdTime,
    sets: intensity === 'low' ? Math.max(exercise.sets - 1, 1) : exercise.sets
  }));
  
  return {
    exercises: selectedExercises,
    totalDuration: selectedExercises.reduce((total, ex) => total + (ex.holdTime * ex.sets), 0),
    instabilityLevel: intensity === 'high' ? 'high' : intensity === 'medium' ? 'moderate' : 'stable',
    equipment: [...new Set(selectedExercises.map(ex => ex.equipment))],
    focusAreas: ['core_stability', 'balance', 'proprioception', 'postural_control']
  };
};

const generatePlyometricsWorkoutData = (duration: number, intensity: string) => {
  const exerciseLibrary = [
    { id: 'squat-jump', name: 'Squat Jump', reps: 8, sets: 3, height: 30, intensity: 'medium' },
    { id: 'box-jump', name: 'Box Jump', reps: 6, sets: 4, height: 60, intensity: 'high' },
    { id: 'depth-jump', name: 'Depth Jump', reps: 5, sets: 3, height: 40, intensity: 'high' },
    { id: 'lateral-bound', name: 'Lateral Bound', reps: 10, sets: 3, distance: 150, intensity: 'medium' },
    { id: 'single-leg-hop', name: 'Single Leg Hop', reps: 8, sets: 3, distance: 100, intensity: 'medium' },
    { id: 'medicine-ball-slam', name: 'Medicine Ball Slam', reps: 12, sets: 3, intensity: 'low' },
    { id: 'jump-lunge', name: 'Jump Lunge', reps: 12, sets: 3, intensity: 'medium' },
    { id: 'reactive-jump', name: 'Reactive Jump', reps: 6, sets: 4, height: 45, intensity: 'maximal' },
    { id: 'broad-jump', name: 'Broad Jump', reps: 5, sets: 3, distance: 200, intensity: 'high' },
    { id: 'tuck-jump', name: 'Tuck Jump', reps: 8, sets: 3, height: 35, intensity: 'high' }
  ];
  
  const exerciseCount = Math.max(Math.floor(duration / 10), 3);
  const targetIntensity = intensity === 'high' ? ['high', 'maximal'] : 
                         intensity === 'medium' ? ['medium', 'high'] : 
                         ['low', 'medium'];
  
  // Filter exercises by intensity level
  const availableExercises = exerciseLibrary.filter(ex => 
    targetIntensity.includes(ex.intensity)
  );
  
  const selectedExercises = availableExercises.slice(0, exerciseCount).map(exercise => ({
    ...exercise,
    reps: intensity === 'high' ? Math.min(exercise.reps + 2, 15) : 
          intensity === 'low' ? Math.max(exercise.reps - 2, 4) : exercise.reps,
    sets: intensity === 'high' ? exercise.sets + 1 : exercise.sets,
    height: exercise.height ? (intensity === 'high' ? exercise.height + 10 : exercise.height) : undefined,
    distance: exercise.distance ? (intensity === 'high' ? exercise.distance + 25 : exercise.distance) : undefined
  }));
  
  const totalJumps = selectedExercises.reduce((total, ex) => total + (ex.reps * ex.sets), 0);
  
  return {
    exercises: selectedExercises,
    totalJumps,
    restBetweenSets: intensity === 'high' ? 120 : intensity === 'medium' ? 90 : 60,
    equipmentRequired: ['plyo_boxes', 'medicine_ball', 'cones', 'landing_mats'],
    focusAreas: ['explosive_power', 'reactive_strength', 'jump_performance', 'landing_mechanics'],
    safetyNotes: ['Proper landing form essential', 'Adequate rest between sets', 'Progressive volume increase']
  };
};

const generateWrestlingWorkoutData = (duration: number, intensity: string) => {
  const techniqueLibrary = [
    { id: 'double-leg', name: 'Double Leg Takedown', category: 'takedown', duration: 3, repetitions: 8, intensity: 'drill' },
    { id: 'single-leg', name: 'Single Leg Takedown', category: 'takedown', duration: 3, repetitions: 6, intensity: 'drill' },
    { id: 'hip-toss', name: 'Hip Toss', category: 'takedown', duration: 2, repetitions: 10, intensity: 'drill' },
    { id: 'sprawl', name: 'Sprawl Defense', category: 'escape', duration: 2, repetitions: 12, intensity: 'drill' },
    { id: 'granby-roll', name: 'Granby Roll', category: 'escape', duration: 2, repetitions: 8, intensity: 'drill' },
    { id: 'stand-up', name: 'Stand Up Escape', category: 'escape', duration: 3, repetitions: 6, intensity: 'drill' },
    { id: 'cross-face', name: 'Cross Face Control', category: 'control', duration: 4, repetitions: 5, intensity: 'live' },
    { id: 'half-nelson', name: 'Half Nelson', category: 'control', duration: 3, repetitions: 6, intensity: 'drill' },
    { id: 'cradle', name: 'Cradle', category: 'control', duration: 4, repetitions: 4, intensity: 'live' },
    { id: 'arm-drag', name: 'Arm Drag', category: 'takedown', duration: 2, repetitions: 10, intensity: 'drill' }
  ];
  
  const techniqueCount = Math.max(Math.floor(duration / 8), 4);
  const sessionIntensity = intensity === 'high' ? 'competition' : 
                          intensity === 'medium' ? 'live' : 'drill';
  
  // Select techniques based on intensity
  const selectedTechniques = techniqueLibrary.slice(0, techniqueCount).map(technique => ({
    ...technique,
    intensity: sessionIntensity === 'competition' ? (Math.random() > 0.5 ? 'live' : 'competition') : sessionIntensity,
    repetitions: intensity === 'high' ? technique.repetitions + 2 : 
                 intensity === 'low' ? Math.max(technique.repetitions - 2, 3) : technique.repetitions,
    duration: intensity === 'high' ? technique.duration + 1 : technique.duration
  }));
  
  // Add sparring rounds for higher intensity
  const sparringConfig = intensity === 'high' ? {
    sparringRounds: 4,
    roundDuration: 180, // 3 minutes
    restBetweenRounds: 60 // 1 minute
  } : intensity === 'medium' ? {
    sparringRounds: 2,
    roundDuration: 120, // 2 minutes  
    restBetweenRounds: 90 // 1.5 minutes
  } : {};
  
  return {
    techniques: selectedTechniques,
    ...sparringConfig,
    equipment: ['wrestling_mats', 'training_dummy', 'towel'],
    focusAreas: ['technique_refinement', 'conditioning', 'tactical_awareness', 'mental_toughness'],
    totalTechniqueTime: selectedTechniques.reduce((total, tech) => 
      total + (tech.duration * tech.repetitions), 0),
    estimatedCalories: Math.floor(duration * 8.5), // Wrestling burns ~8.5 calories per minute
    safetyNotes: ['Controlled intensity', 'Proper mat coverage', 'Injury awareness']
  };
};

// Helper function to generate bundle status with real-time metrics
const generateBundleStatus = (bundle: SessionBundle) => ({
  bundleId: bundle.id,
  status: bundle.status,
  metrics: {
    totalSessions: bundle.sessions.length,
    activeSessions: bundle.sessions.filter(s => s.status === 'active').length,
    totalParticipants: bundle.totalParticipants,
    activeParticipants: bundle.sessions.reduce((total, session) => 
      total + session.participants.filter(p => p.status === 'connected').length, 0),
    averageProgress: bundle.sessions.reduce((total, session) => total + session.progress, 0) / bundle.sessions.length,
    averageHeartRate: 145 + Math.floor(Math.random() * 20), // 145-165 avg
    totalCaloriesBurned: Math.floor(bundle.totalParticipants * (200 + Math.random() * 300)),
    averageIntensity: 75 + Math.floor(Math.random() * 20) // 75-95%
  },
  sessions: bundle.sessions.map(session => ({
    id: session.id,
    status: session.status,
    progress: session.progress,
    participantCount: session.participants.length,
    activeParticipants: session.participants.filter(p => p.status === 'connected').length,
    currentPhase: session.currentPhase,
    elapsedTime: session.elapsedTime,
    estimatedRemaining: Math.max(0, session.estimatedDuration - session.elapsedTime)
  })),
  lastUpdated: new Date().toISOString()
});

// Helper function to generate bundle analytics
const generateBundleAnalytics = (bundle: SessionBundle) => ({
  bundleId: bundle.id,
  completionRate: 85 + Math.floor(Math.random() * 15), // 85-100%
  averageIntensity: 78 + Math.floor(Math.random() * 15), // 78-93%
  totalWorkoutTime: bundle.sessions.reduce((total, session) => total + session.estimatedDuration, 0),
  participantStats: bundle.sessions.slice(0, 5).map((session, index) => ({
    playerId: `player-${index + 1}`,
    playerName: ['Connor McDavid', 'Nathan MacKinnon', 'Sidney Crosby', 'Auston Matthews', 'Leon Draisaitl'][index],
    completedSessions: Math.floor(Math.random() * bundle.sessions.length) + 1,
    totalSessions: bundle.sessions.length,
    averagePerformance: 82 + Math.floor(Math.random() * 15) // 82-97%
  })),
  sessionStats: bundle.sessions.map(session => ({
    sessionId: session.id,
    sessionName: session.name,
    completionRate: 80 + Math.floor(Math.random() * 20), // 80-100%
    averageDuration: session.estimatedDuration * (0.9 + Math.random() * 0.2), // 90-110% of estimated
    participantFeedback: 4.2 + Math.random() * 0.8 // 4.2-5.0 rating
  }))
});

// Initialize some sample bundles for testing
const initializeSampleBundles = () => {
  // Multi-type training bundle with all workout types
  const mixedTrainingBundle: SessionBundle = {
    id: 'bundle-sample-1',
    name: 'Complete Training Week Bundle',
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    createdBy: 'trainer-1',
    status: 'active',
    totalParticipants: 16,
    sessions: [
      {
        id: 'session-sample-1-1',
        name: 'Monday Strength Foundation',
        workoutType: 'strength',
        equipment: 'Free Weights',
        participants: generateSessionParticipants(['player-1', 'player-2', 'player-3', 'player-4']),
        status: 'completed',
        progress: 100,
        elapsedTime: 3600,
        estimatedDuration: 3600, // 60 minutes
        currentPhase: 'Completed',
        location: 'Weight Room A'
      },
      {
        id: 'session-sample-1-2',
        name: 'Tuesday HIIT Conditioning',
        workoutType: 'conditioning',
        equipment: 'Bike & Rowing',
        participants: generateSessionParticipants(['player-5', 'player-6', 'player-7', 'player-8']),
        status: 'active',
        progress: 65,
        startTime: new Date(Date.now() - 1800000), // 30 mins ago
        elapsedTime: 1800,
        estimatedDuration: 2700, // 45 minutes
        currentPhase: 'High Intensity Intervals',
        location: 'Cardio Zone'
      },
      {
        id: 'session-sample-1-3',
        name: 'Wednesday Hybrid Circuit',
        workoutType: 'hybrid',
        equipment: 'Mixed Equipment',
        participants: generateSessionParticipants(['player-9', 'player-10', 'player-11', 'player-12']),
        status: 'preparing',
        progress: 0,
        elapsedTime: 0,
        estimatedDuration: 3000, // 50 minutes
        currentPhase: 'Pre-Session',
        location: 'Functional Training Area'
      },
      {
        id: 'session-sample-1-4',
        name: 'Thursday Agility & Speed',
        workoutType: 'agility',
        equipment: 'Agility Equipment',
        participants: generateSessionParticipants(['player-13', 'player-14', 'player-15', 'player-16']),
        status: 'preparing',
        progress: 0,
        elapsedTime: 0,
        estimatedDuration: 2400, // 40 minutes
        currentPhase: 'Setup',
        location: 'Indoor Track'
      }
    ]
  };
  
  // Conditioning-focused bundle
  const conditioningBundle: SessionBundle = {
    id: 'bundle-sample-2',
    name: 'Cardio Power Week',
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    createdBy: 'trainer-2',
    status: 'preparing',
    totalParticipants: 12,
    sessions: [
      {
        id: 'session-sample-2-1',
        name: 'Bike Interval Power',
        workoutType: 'conditioning',
        equipment: 'Stationary Bikes',
        participants: generateSessionParticipants(['player-17', 'player-18', 'player-19', 'player-20']),
        status: 'preparing',
        progress: 0,
        elapsedTime: 0,
        estimatedDuration: 2700, // 45 minutes
        currentPhase: 'Pre-Session',
        location: 'Spin Studio'
      },
      {
        id: 'session-sample-2-2',
        name: 'Rowing Endurance Build',
        workoutType: 'conditioning',
        equipment: 'Rowing Machines',
        participants: generateSessionParticipants(['player-21', 'player-22', 'player-23', 'player-24']),
        status: 'preparing',
        progress: 0,
        elapsedTime: 0,
        estimatedDuration: 3600, // 60 minutes
        currentPhase: 'Pre-Session',
        location: 'Rowing Bay'
      },
      {
        id: 'session-sample-2-3',
        name: 'Mixed Cardio Challenge',
        workoutType: 'conditioning',
        equipment: 'Various Cardio',
        participants: generateSessionParticipants(['player-25', 'player-26', 'player-27', 'player-28']),
        status: 'preparing',
        progress: 0,
        elapsedTime: 0,
        estimatedDuration: 3000, // 50 minutes
        currentPhase: 'Pre-Session',
        location: 'Main Gym'
      }
    ]
  };

  // Strength and agility focused bundle
  const powerTrainingBundle: SessionBundle = {
    id: 'bundle-sample-3',
    name: 'Power & Speed Development',
    createdAt: new Date(Date.now() - 259200000), // 3 days ago
    createdBy: 'trainer-3',
    status: 'completed',
    totalParticipants: 10,
    sessions: [
      {
        id: 'session-sample-3-1',
        name: 'Olympic Lift Training',
        workoutType: 'strength',
        equipment: 'Olympic Platforms',
        participants: generateSessionParticipants(['player-29', 'player-30', 'player-31', 'player-32', 'player-33']),
        status: 'completed',
        progress: 100,
        elapsedTime: 4200, // 70 minutes
        estimatedDuration: 4200,
        currentPhase: 'Completed',
        location: 'Olympic Lifting Room'
      },
      {
        id: 'session-sample-3-2',
        name: 'Sprint & Agility Combo',
        workoutType: 'agility',
        equipment: 'Track & Agility Tools',
        participants: generateSessionParticipants(['player-34', 'player-35', 'player-36', 'player-37', 'player-38']),
        status: 'completed',
        progress: 100,
        elapsedTime: 2700, // 45 minutes
        estimatedDuration: 2700,
        currentPhase: 'Completed',
        location: 'Indoor Track'
      }
    ]
  };
  
  // New workout types bundle - STABILITY_CORE, PLYOMETRICS, WRESTLING
  const newWorkoutTypesBundle: SessionBundle = {
    id: 'bundle-sample-4',
    name: 'Advanced Training Methods Bundle',
    createdAt: new Date(Date.now() - 345600000), // 4 days ago
    createdBy: 'trainer-4',
    status: 'preparing',
    totalParticipants: 15,
    sessions: [
      {
        id: 'session-sample-4-1',
        name: 'Core Stability & Balance',
        workoutType: 'stability_core',
        equipment: 'Stability Balls & Mats',
        participants: generateSessionParticipants(['player-39', 'player-40', 'player-41', 'player-42', 'player-43'], 'stability_core'),
        status: 'preparing',
        progress: 0,
        elapsedTime: 0,
        estimatedDuration: 2100, // 35 minutes
        currentPhase: 'Pre-Session',
        location: 'Functional Training Area'
      },
      {
        id: 'session-sample-4-2',
        name: 'Explosive Power Development',
        workoutType: 'plyometrics',
        equipment: 'Plyo Boxes & Landing Mats',
        participants: generateSessionParticipants(['player-44', 'player-45', 'player-46', 'player-47', 'player-48'], 'plyometrics'),
        status: 'preparing',
        progress: 0,
        elapsedTime: 0,
        estimatedDuration: 2700, // 45 minutes
        currentPhase: 'Pre-Session',
        location: 'Athletic Performance Center'
      },
      {
        id: 'session-sample-4-3',
        name: 'Wrestling Technique & Conditioning',
        workoutType: 'wrestling',
        equipment: 'Wrestling Mats & Training Dummy',
        participants: generateSessionParticipants(['player-49', 'player-50', 'player-51', 'player-52', 'player-53'], 'wrestling'),
        status: 'preparing',
        progress: 0,
        elapsedTime: 0,
        estimatedDuration: 3600, // 60 minutes
        currentPhase: 'Pre-Session',
        location: 'Wrestling Room'
      }
    ]
  };

  mockSessionBundles.set('bundle-sample-1', mixedTrainingBundle);
  mockSessionBundles.set('bundle-sample-2', conditioningBundle);
  mockSessionBundles.set('bundle-sample-3', powerTrainingBundle);
  mockSessionBundles.set('bundle-sample-4', newWorkoutTypesBundle);
};

// Initialize sample data
initializeSampleBundles();

// Mock medical data for enhanced medical integration features
const mockMedicalData = {
  // Sidney Crosby - player-005 (mapped to player_id: 5)
  'player-005': {
    player_id: 5,
    player_name: 'Sidney Crosby',
    current_injuries: [
      {
        id: 1,
        player_id: 5,
        injury_type: 'Shoulder strain',
        injury_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
        recovery_status: 'recovering' as const,
        expected_return_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
        notes: 'Upper body injury - Right shoulder strain from body check. Significant improvement noted in range of motion. Currently undergoing physiotherapy and strength rehabilitation. No contact allowed until cleared by medical staff.',
      },
    ],
    injury_history: [
      {
        id: 101,
        player_id: 5,
        injury_type: 'Concussion',
        injury_date: new Date('2024-03-15').toISOString(),
        recovery_status: 'recovered' as const,
        expected_return_date: new Date('2024-04-20').toISOString(),
        notes: 'Grade 2 concussion from high hit. Full recovery after following concussion protocol.',
      },
      {
        id: 102,
        player_id: 5,
        injury_type: 'Wrist sprain',
        injury_date: new Date('2023-11-10').toISOString(),
        recovery_status: 'recovered' as const,
        expected_return_date: new Date('2023-12-01').toISOString(),
        notes: 'Minor wrist sprain from fall. Quick recovery with physiotherapy.',
      },
    ],
    recent_treatments: [
      {
        id: 1,
        injury_id: 1,
        treatment_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        treatment_type: 'Physiotherapy',
        provider: 'Dr. Sarah Johnson, PT',
        notes: 'Focused on rotator cuff strengthening exercises. Patient showing good progress with improved range of motion to 80% normal.',
      },
      {
        id: 2,
        injury_id: 1,
        treatment_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        treatment_type: 'MRI Scan',
        provider: 'Dr. Michael Chen, MD',
        notes: 'MRI results show healing progressing as expected. No structural damage to rotator cuff. Mild inflammation present.',
      },
      {
        id: 3,
        injury_id: 1,
        treatment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        treatment_type: 'Initial Assessment',
        provider: 'Dr. Michael Chen, MD',
        notes: 'Initial diagnosis of grade 2 shoulder strain. Prescribed anti-inflammatory medication and rest.',
      },
    ],
    medical_clearance: false,
    last_assessment_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  // Nathan MacKinnon - player-003 (mapped to player_id: 3)
  'player-003': {
    player_id: 3,
    player_name: 'Nathan MacKinnon',
    current_injuries: [
      {
        id: 2,
        player_id: 3,
        injury_type: 'Lower back strain',
        injury_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        recovery_status: 'recovering' as const,
        expected_return_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        notes: 'Mild lower back strain from overexertion during training. Responding well to treatment. Cleared for limited activity with restrictions on heavy lifting and explosive movements.',
      },
    ],
    injury_history: [
      {
        id: 201,
        player_id: 3,
        injury_type: 'Hamstring pull',
        injury_date: new Date('2024-01-20').toISOString(),
        recovery_status: 'recovered' as const,
        expected_return_date: new Date('2024-02-10').toISOString(),
        notes: 'Grade 1 hamstring strain. Full recovery with gradual return to play protocol.',
      },
    ],
    recent_treatments: [
      {
        id: 4,
        injury_id: 2,
        treatment_date: new Date().toISOString(), // Today
        treatment_type: 'Physiotherapy',
        provider: 'Dr. Sarah Johnson, PT',
        notes: 'Core strengthening and flexibility exercises. Patient cleared for skating and light training. Avoid heavy squats and deadlifts.',
      },
      {
        id: 5,
        injury_id: 2,
        treatment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        treatment_type: 'Massage Therapy',
        provider: 'James Wilson, RMT',
        notes: 'Deep tissue massage focusing on lower back and hip flexors. Significant reduction in muscle tension.',
      },
    ],
    medical_clearance: true,
    last_assessment_date: new Date().toISOString(),
  },
};

// Team medical statistics
const mockTeamMedicalStats = {
  total_active_injuries: 2,
  players_on_injury_list: 2,
  average_recovery_time: 21, // days
  injury_types_breakdown: [
    { type: 'Upper Body', count: 1 },
    { type: 'Lower Body', count: 1 },
    { type: 'Concussion', count: 0 },
    { type: 'Illness', count: 0 },
  ],
};

// Mock hybrid workouts - combining exercises and intervals
const mockHybridWorkouts = [
  {
    id: 'hybrid-001',
    name: 'Hockey Circuit Training',
    type: 'HYBRID',
    description: 'Complete circuit combining strength exercises with cardio intervals',
    duration: 60,
    blocks: [
      {
        id: 'block-001',
        type: 'exercise',
        name: 'Upper Body Power',
        exercises: [
          { exerciseId: 'ex-101', name: 'Medicine Ball Slams', sets: 3, reps: 10, intensity: 'explosive' },
          { exerciseId: 'ex-102', name: 'Battle Ropes', sets: 3, reps: 30, unit: 'seconds', intensity: 'high' },
          { exerciseId: 'ex-103', name: 'Push-up to T', sets: 3, reps: 12, intensity: 'moderate' }
        ],
        duration: 15,
        order: 1
      },
      {
        id: 'block-002',
        type: 'interval',
        name: 'Bike Sprint Intervals',
        equipment: 'bike',
        intervals: [
          { duration: 30, intensity: 'Sprint', targetPower: 350, targetBPM: 170 },
          { duration: 90, intensity: 'Recovery', targetPower: 150, targetBPM: 130 },
          { duration: 30, intensity: 'Sprint', targetPower: 350, targetBPM: 170 },
          { duration: 90, intensity: 'Recovery', targetPower: 150, targetBPM: 130 }
        ],
        totalDuration: 240,
        order: 2
      },
      {
        id: 'block-003',
        type: 'exercise',
        name: 'Lower Body Strength',
        exercises: [
          { exerciseId: 'ex-104', name: 'Bulgarian Split Squats', sets: 3, reps: 12, perSide: true },
          { exerciseId: 'ex-105', name: 'Box Jumps', sets: 3, reps: 8, intensity: 'explosive' },
          { exerciseId: 'ex-106', name: 'Single Leg RDL', sets: 3, reps: 10, perSide: true }
        ],
        duration: 15,
        order: 3
      },
      {
        id: 'block-004',
        type: 'interval',
        name: 'Rowing Finisher',
        equipment: 'rowing',
        intervals: [
          { duration: 60, intensity: 'Moderate', targetPace: '2:00/500m', targetBPM: 150 },
          { duration: 20, intensity: 'Sprint', targetPace: '1:40/500m', targetBPM: 180 },
          { duration: 40, intensity: 'Recovery', targetPace: '2:20/500m', targetBPM: 130 }
        ],
        totalDuration: 360,
        order: 4
      },
      {
        id: 'block-005',
        type: 'transition',
        name: 'Active Recovery',
        duration: 5,
        activities: ['Light stretching', 'Hydration', 'Prepare for next block'],
        order: 5
      }
    ],
    equipment: ['Bike', 'Rowing Machine', 'Medicine Ball', 'Battle Ropes', 'Box', 'Dumbbells'],
    targetPlayers: 'all',
    intensity: 'high',
    tags: ['circuit', 'power', 'endurance', 'hockey-specific'],
    createdBy: 'trainer-001',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'hybrid-002',
    name: 'CrossFit Hockey',
    type: 'HYBRID',
    description: 'CrossFit-style workout adapted for hockey performance',
    duration: 45,
    blocks: [
      {
        id: 'block-006',
        type: 'interval',
        name: 'Warm-up Row',
        equipment: 'rowing',
        intervals: [
          { duration: 300, intensity: 'Easy', targetPace: '2:30/500m', targetBPM: 120 }
        ],
        totalDuration: 300,
        order: 1
      },
      {
        id: 'block-007',
        type: 'exercise',
        name: 'AMRAP 12 minutes',
        exercises: [
          { exerciseId: 'ex-107', name: 'Thrusters', sets: 1, reps: 15, load: '45kg' },
          { exerciseId: 'ex-108', name: 'Pull-ups', sets: 1, reps: 10 },
          { exerciseId: 'ex-109', name: 'Burpees', sets: 1, reps: 8 }
        ],
        duration: 12,
        instructions: 'Complete as many rounds as possible in 12 minutes',
        order: 2
      },
      {
        id: 'block-008',
        type: 'transition',
        name: 'Rest',
        duration: 3,
        activities: ['Complete rest', 'Hydration'],
        order: 3
      },
      {
        id: 'block-009',
        type: 'interval',
        name: 'Assault Bike Tabata',
        equipment: 'assault-bike',
        intervals: [
          { duration: 20, intensity: 'Max Sprint', targetRPM: 80, targetBPM: 185 },
          { duration: 10, intensity: 'Rest', targetRPM: 0, targetBPM: 150 },
          { duration: 20, intensity: 'Max Sprint', targetRPM: 80, targetBPM: 185 },
          { duration: 10, intensity: 'Rest', targetRPM: 0, targetBPM: 150 },
          { duration: 20, intensity: 'Max Sprint', targetRPM: 80, targetBPM: 185 },
          { duration: 10, intensity: 'Rest', targetRPM: 0, targetBPM: 150 },
          { duration: 20, intensity: 'Max Sprint', targetRPM: 80, targetBPM: 185 },
          { duration: 10, intensity: 'Rest', targetRPM: 0, targetBPM: 150 }
        ],
        totalDuration: 240,
        order: 4
      },
      {
        id: 'block-010',
        type: 'exercise',
        name: 'Core Finisher',
        exercises: [
          { exerciseId: 'ex-110', name: 'Plank Hold', sets: 3, reps: 45, unit: 'seconds' },
          { exerciseId: 'ex-111', name: 'Russian Twists', sets: 3, reps: 30, load: '10kg' }
        ],
        duration: 8,
        order: 5
      }
    ],
    equipment: ['Rowing Machine', 'Barbell', 'Pull-up Bar', 'Assault Bike', 'Medicine Ball'],
    targetPlayers: 'advanced',
    intensity: 'very-high',
    tags: ['crossfit', 'HIIT', 'competitive', 'metabolic'],
    createdBy: 'trainer-001',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'hybrid-003',
    name: 'Bootcamp Style Training',
    type: 'HYBRID',
    description: 'Military-inspired bootcamp workout for team building',
    duration: 50,
    blocks: [
      {
        id: 'block-011',
        type: 'exercise',
        name: 'Dynamic Warm-up',
        exercises: [
          { exerciseId: 'ex-112', name: 'Jumping Jacks', sets: 1, reps: 50 },
          { exerciseId: 'ex-113', name: 'Mountain Climbers', sets: 1, reps: 40 },
          { exerciseId: 'ex-114', name: 'High Knees', sets: 1, reps: 30, unit: 'seconds' }
        ],
        duration: 5,
        order: 1
      },
      {
        id: 'block-012',
        type: 'interval',
        name: 'Treadmill Hills',
        equipment: 'treadmill',
        intervals: [
          { duration: 120, intensity: 'Base', targetSpeed: 10, incline: 2, targetBPM: 140 },
          { duration: 60, intensity: 'Hill', targetSpeed: 8, incline: 8, targetBPM: 165 },
          { duration: 60, intensity: 'Recovery', targetSpeed: 6, incline: 1, targetBPM: 130 },
          { duration: 60, intensity: 'Hill', targetSpeed: 8, incline: 10, targetBPM: 170 },
          { duration: 60, intensity: 'Recovery', targetSpeed: 6, incline: 1, targetBPM: 130 }
        ],
        totalDuration: 360,
        order: 2
      },
      {
        id: 'block-013',
        type: 'exercise',
        name: 'Strength Circuit',
        exercises: [
          { exerciseId: 'ex-115', name: 'Push-ups', sets: 4, reps: 20 },
          { exerciseId: 'ex-116', name: 'Squat Jumps', sets: 4, reps: 15 },
          { exerciseId: 'ex-117', name: 'Plank to Push-up', sets: 4, reps: 10 },
          { exerciseId: 'ex-118', name: 'Lunges', sets: 4, reps: 20, alternating: true }
        ],
        duration: 20,
        restBetweenSets: 30,
        order: 3
      },
      {
        id: 'block-014',
        type: 'interval',
        name: 'Team Relay Sprints',
        equipment: 'track',
        intervals: [
          { duration: 15, intensity: 'Sprint', targetSpeed: 'Max', targetBPM: 185 },
          { duration: 45, intensity: 'Walk', targetSpeed: 'Easy', targetBPM: 120 }
        ],
        rounds: 6,
        totalDuration: 360,
        order: 4
      },
      {
        id: 'block-015',
        type: 'exercise',
        name: 'Cool-down Stretching',
        exercises: [
          { exerciseId: 'ex-119', name: 'Hamstring Stretch', sets: 1, reps: 60, unit: 'seconds', perSide: true },
          { exerciseId: 'ex-120', name: 'Quad Stretch', sets: 1, reps: 60, unit: 'seconds', perSide: true },
          { exerciseId: 'ex-121', name: 'Shoulder Stretch', sets: 1, reps: 45, unit: 'seconds', perSide: true }
        ],
        duration: 8,
        order: 5
      }
    ],
    equipment: ['Treadmill', 'Body Weight', 'Track/Field'],
    targetPlayers: 'all',
    intensity: 'moderate-high',
    tags: ['bootcamp', 'team-building', 'cardio', 'strength'],
    createdBy: 'trainer-002',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock agility workouts and drill patterns
const mockAgilityDrills = [
  {
    id: 'agility-001',
    name: '5-10-5 Pro Agility Drill',
    type: 'AGILITY',
    category: 'change-of-direction',
    description: 'Classic NFL combine drill for lateral quickness and change of direction',
    duration: 30,
    setup: {
      equipment: ['3 cones'],
      spacing: '5 yards apart in a straight line',
      diagram: 'https://example.com/5-10-5-diagram.png'
    },
    instructions: [
      'Start in 3-point stance at middle cone',
      'Sprint 5 yards to right cone, touch line',
      'Sprint 10 yards to left cone, touch line',
      'Sprint 5 yards back to middle cone'
    ],
    metrics: {
      targetTime: { elite: 4.2, good: 4.5, average: 4.8 },
      restBetweenReps: 60,
      recommendedReps: 5
    },
    coachingCues: [
      'Stay low in turns',
      'Drive off outside foot',
      'Keep chest up',
      'Explode out of cuts'
    ],
    variations: ['Add puck handling', 'Backwards start', 'Reaction start'],
    tags: ['speed', 'agility', 'testing', 'combine'],
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'agility-002',
    name: 'Ladder Drill - Ickey Shuffle',
    type: 'AGILITY',
    category: 'footwork',
    description: 'Advanced ladder footwork pattern for foot speed and coordination',
    duration: 20,
    setup: {
      equipment: ['Agility ladder'],
      spacing: 'Standard 18-inch squares',
      diagram: 'https://example.com/ickey-shuffle-diagram.png'
    },
    instructions: [
      'Start at bottom of ladder',
      'Step in with left foot',
      'Step in with right foot',
      'Step out to left with left foot',
      'Continue pattern up ladder'
    ],
    metrics: {
      targetSpeed: { elite: '< 3 seconds', good: '3-4 seconds', average: '4-5 seconds' },
      restBetweenReps: 30,
      recommendedReps: 8
    },
    coachingCues: [
      'Stay on balls of feet',
      'Keep knees slightly bent',
      'Arms pump naturally',
      'Look ahead, not down'
    ],
    progressions: ['Add stick handling', 'Increase speed', 'Backwards variation'],
    tags: ['footwork', 'coordination', 'speed', 'ladder'],
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'agility-003',
    name: 'T-Drill',
    type: 'AGILITY',
    category: 'multi-directional',
    description: 'Four-cone drill testing forward, lateral, and backward movement',
    duration: 45,
    setup: {
      equipment: ['4 cones'],
      spacing: '10 yards square with stem',
      diagram: 'https://example.com/t-drill-diagram.png'
    },
    instructions: [
      'Sprint forward 10 yards to middle cone',
      'Shuffle left 5 yards to left cone',
      'Shuffle right 10 yards to right cone',
      'Shuffle left 5 yards back to middle',
      'Backpedal to start'
    ],
    metrics: {
      targetTime: { elite: 8.5, good: 9.2, average: 10.0 },
      restBetweenReps: 90,
      recommendedReps: 4
    },
    coachingCues: [
      'Never cross feet in shuffle',
      'Touch each cone',
      'Stay low and athletic',
      'Quick transitions'
    ],
    sportSpecific: 'Mimics defensive zone coverage patterns',
    tags: ['agility', 'testing', 'defensive', 'multi-directional'],
    createdBy: 'trainer-002',
    createdAt: new Date().toISOString()
  },
  {
    id: 'agility-004',
    name: 'Reactive Ball Drops',
    type: 'AGILITY',
    category: 'reaction',
    description: 'Partner-based reaction drill for first-step quickness',
    duration: 15,
    setup: {
      equipment: ['Tennis balls', 'Partner'],
      spacing: '5-10 feet apart',
      diagram: 'https://example.com/ball-drops-diagram.png'
    },
    instructions: [
      'Athlete in ready position',
      'Partner holds ball at shoulder height',
      'Partner drops ball randomly',
      'Athlete sprints to catch before second bounce'
    ],
    metrics: {
      successRate: { elite: '90%', good: '75%', average: '60%' },
      distance: 'Start 5 feet, progress to 10 feet',
      recommendedReps: 10
    },
    coachingCues: [
      'Stay in athletic stance',
      'React to ball, not partner',
      'Explosive first step',
      'Low center of gravity'
    ],
    variations: ['Two balls', 'Directional calls', 'From skating position'],
    tags: ['reaction', 'quickness', 'game-like', 'partner'],
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'agility-005',
    name: 'Box Drill - Star Pattern',
    type: 'AGILITY',
    category: 'change-of-direction',
    description: 'Multi-directional drill with 8 different movement patterns',
    duration: 40,
    setup: {
      equipment: ['5 cones'],
      spacing: '5x5 yard box with center cone',
      diagram: 'https://example.com/star-pattern-diagram.png'
    },
    instructions: [
      'Start at center cone',
      'Sprint to corner cone',
      'Backpedal to center',
      'Repeat for all 4 corners',
      'Then diagonal patterns'
    ],
    patterns: [
      'Forward/Back',
      'Lateral Shuffles',
      'Carioca',
      'Diagonal Sprints',
      '45-degree Cuts',
      'Crossover Runs'
    ],
    metrics: {
      targetTime: 'Complete all patterns < 60 seconds',
      restBetweenSets: 120,
      recommendedSets: 3
    },
    tags: ['agility', 'conditioning', 'multi-directional', 'hockey-specific'],
    createdBy: 'trainer-003',
    createdAt: new Date().toISOString()
  },
  {
    id: 'agility-006',
    name: 'Mirror Drill',
    type: 'AGILITY',
    category: 'reaction',
    description: 'Partner shadowing drill for reactive agility',
    duration: 25,
    setup: {
      equipment: ['4 cones for boundaries'],
      spacing: '10x10 yard square',
      diagram: 'https://example.com/mirror-drill-diagram.png'
    },
    instructions: [
      'Leader moves randomly within square',
      'Follower mirrors all movements',
      'Maintain 2-3 yard distance',
      'Switch roles every 30 seconds'
    ],
    movements: ['Forward', 'Backward', 'Lateral', 'Diagonal', 'Pivots', 'Jumps'],
    workTime: 30,
    restTime: 30,
    rounds: 6,
    coachingCues: [
      'Stay square to partner',
      'Quick feet, short steps',
      'Anticipate direction changes',
      'Maintain athletic position'
    ],
    tags: ['reaction', 'game-like', 'defensive', 'partner'],
    createdBy: 'trainer-002',
    createdAt: new Date().toISOString()
  },
  {
    id: 'agility-007',
    name: 'Cone Weave Sprint',
    type: 'AGILITY',
    category: 'speed-agility',
    description: 'Slalom-style weaving through cones at high speed',
    duration: 20,
    setup: {
      equipment: ['8-10 cones'],
      spacing: '2 yards apart in straight line',
      diagram: 'https://example.com/cone-weave-diagram.png'
    },
    instructions: [
      'Sprint weaving through cones',
      'Cut as close to cones as possible',
      'Maintain speed through turns',
      'Finish with 10-yard sprint'
    ],
    metrics: {
      targetTime: { elite: 6.5, good: 7.2, average: 8.0 },
      restBetweenReps: 60,
      recommendedReps: 6
    },
    variations: [
      'Add puck/ball handling',
      'Backwards weave',
      'Lateral shuffle weave',
      'Mixed movement patterns'
    ],
    tags: ['speed', 'agility', 'puck-handling', 'conditioning'],
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'agility-008',
    name: 'Hexagon Drill',
    type: 'AGILITY',
    category: 'plyometric-agility',
    description: 'Jump in and out of hexagon pattern for explosive agility',
    duration: 15,
    setup: {
      equipment: ['Tape or 6 cones'],
      spacing: '24-inch hexagon',
      diagram: 'https://example.com/hexagon-drill-diagram.png'
    },
    instructions: [
      'Start in center of hexagon',
      'Jump forward over line',
      'Jump back to center',
      'Continue clockwise around hexagon',
      'Complete 3 full rotations'
    ],
    metrics: {
      targetTime: { elite: 11.0, good: 12.5, average: 14.0 },
      restBetweenReps: 60,
      recommendedReps: 4,
      directions: ['Clockwise', 'Counter-clockwise']
    },
    coachingCues: [
      'Land on balls of feet',
      'Quick ground contact',
      'Stay facing forward',
      'Maintain rhythm'
    ],
    tags: ['plyometric', 'agility', 'testing', 'footwork'],
    createdBy: 'trainer-003',
    createdAt: new Date().toISOString()
  },
  {
    id: 'agility-009',
    name: 'Ladder Complex - Hockey Series',
    type: 'AGILITY',
    category: 'footwork',
    description: 'Hockey-specific ladder patterns for edge work simulation',
    duration: 30,
    setup: {
      equipment: ['2 Agility ladders'],
      spacing: 'Side by side or L-shape',
      diagram: 'https://example.com/hockey-ladder-diagram.png'
    },
    patterns: [
      {
        name: 'Crossover Steps',
        description: 'Simulate skating crossovers',
        reps: 3
      },
      {
        name: 'In-In-Out-Out', 
        description: 'Quick feet for tight turns',
        reps: 3
      },
      {
        name: 'Lateral High Knees',
        description: 'Edge work simulation',
        reps: 3
      },
      {
        name: 'Ali Shuffle',
        description: 'Quick pivots and turns',
        reps: 3
      }
    ],
    restBetweenPatterns: 20,
    coachingCues: [
      'Simulate skating posture',
      'Quick, light touches',
      'Arms in hockey position',
      'Head up throughout'
    ],
    tags: ['footwork', 'hockey-specific', 'coordination', 'edge-work'],
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'agility-010',
    name: 'Reaction Lights System',
    type: 'AGILITY',
    category: 'reaction',
    description: 'Technology-based reaction training with light sensors',
    duration: 25,
    setup: {
      equipment: ['Reaction light system (BlazePod/FitLight)'],
      spacing: 'Various patterns',
      diagram: 'https://example.com/reaction-lights-diagram.png'
    },
    programs: [
      {
        name: 'Random Reaction',
        lights: 8,
        pattern: 'Random activation',
        duration: 60,
        rest: 60
      },
      {
        name: 'Peripheral Vision',
        lights: 6,
        pattern: '180-degree arc',
        duration: 45,
        rest: 45
      },
      {
        name: 'Decision Making',
        lights: 4,
        pattern: 'Color-coded responses',
        duration: 90,
        rest: 90
      }
    ],
    metrics: {
      avgReactionTime: { elite: '< 0.4s', good: '0.4-0.6s', average: '0.6-0.8s' },
      accuracy: { elite: '> 95%', good: '85-95%', average: '75-85%' }
    },
    tags: ['technology', 'reaction', 'vision', 'cognitive'],
    createdBy: 'trainer-002',
    createdAt: new Date().toISOString()
  }
];

// Mock equipment configurations for different workout types
const mockEquipmentConfigs = {
  conditioning: {
    bike: {
      brand: 'Wattbike',
      model: 'Atom',
      features: ['Power meter', 'ERG mode', 'Gradient simulation'],
      metrics: ['Power (watts)', 'Cadence (rpm)', 'Heart rate', 'Distance']
    },
    rowing: {
      brand: 'Concept2',
      model: 'Model D',
      features: ['PM5 monitor', 'Bluetooth connectivity', 'Force curve display'],
      metrics: ['Split time', 'Stroke rate', 'Distance', 'Calories']
    },
    treadmill: {
      brand: 'Woodway',
      model: 'Curve',
      features: ['Self-powered', 'Curved deck', 'No max speed'],
      metrics: ['Speed', 'Distance', 'Calories', 'Incline']
    },
    'assault-bike': {
      brand: 'Assault Fitness',
      model: 'AirBike Elite',
      features: ['Fan resistance', 'Upper body engagement', 'Unlimited resistance'],
      metrics: ['Calories/hour', 'Distance', 'RPM', 'Watts']
    },
    skierg: {
      brand: 'Concept2',
      model: 'SkiErg',
      features: ['PM5 monitor', 'Double pole technique', 'Classic technique'],
      metrics: ['Split time', 'Distance', 'Stroke rate', 'Calories']
    },
    versaclimber: {
      brand: 'VersaClimber',
      model: 'SM Sport',
      features: ['Vertical climbing', 'Adjustable resistance', 'Total body'],
      metrics: ['Feet/minute', 'Total feet', 'Time', 'Calories']
    },
    elliptical: {
      brand: 'Precor',
      model: 'EFX 885',
      features: ['Converging CrossRamp', 'Moving handlebars', 'Multiple programs'],
      metrics: ['Strides/minute', 'Resistance level', 'Incline', 'Calories']
    },
    stairmaster: {
      brand: 'StairMaster',
      model: 'Gauntlet',
      features: ['Revolving stairs', 'Variable speed', 'Side rails'],
      metrics: ['Steps/minute', 'Floors climbed', 'Time', 'Calories']
    }
  },
  agility: {
    cones: {
      types: ['Disc cones', 'Tall cones', 'Mini cones'],
      colors: ['Orange', 'Yellow', 'Blue', 'Green'],
      quantities: { standard: 20, full: 50 }
    },
    ladders: {
      types: ['Flat rung', 'Raised rung', 'Adjustable'],
      lengths: ['15 feet', '30 feet', '45 feet'],
      features: ['Tangle-free', 'Weighted ends', 'Carry bag']
    },
    hurdles: {
      types: ['Speed hurdles', 'Agility hurdles', 'Adjustable hurdles'],
      heights: ['6 inch', '9 inch', '12 inch', '15 inch'],
      materials: ['PVC', 'Foam', 'Plastic']
    },
    reactionEquipment: {
      blazepod: {
        pods: 6,
        features: ['App controlled', 'RGB LED', 'Touch sensitive'],
        programs: ['Reaction', 'Memory', 'Competition']
      },
      fitlight: {
        lights: 8,
        features: ['Wireless', 'Programmable', 'Data tracking'],
        range: '100 feet'
      }
    }
  }
};

// Mock player performance data for hybrid and agility workouts
const mockPerformanceData = {
  hybrid: [
    {
      playerId: 'player-001',
      playerName: 'Connor McDavid',
      workoutId: 'hybrid-001',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      performance: {
        completedBlocks: 5,
        totalBlocks: 5,
        avgHeartRate: 152,
        maxHeartRate: 178,
        caloriesBurned: 420,
        totalTime: 58,
        blockPerformance: [
          { blockId: 'block-001', completed: true, avgIntensity: 85 },
          { blockId: 'block-002', completed: true, avgPower: 285, avgBPM: 165 },
          { blockId: 'block-003', completed: true, avgIntensity: 82 },
          { blockId: 'block-004', completed: true, avgPace: '1:55/500m', avgBPM: 158 },
          { blockId: 'block-005', completed: true }
        ],
        notes: 'Excellent effort throughout. Power output on bike intervals improving.'
      }
    },
    {
      playerId: 'player-002',
      playerName: 'Auston Matthews',
      workoutId: 'hybrid-002',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      performance: {
        completedBlocks: 5,
        totalBlocks: 5,
        avgHeartRate: 161,
        maxHeartRate: 186,
        caloriesBurned: 380,
        totalTime: 44,
        amrapRounds: 7.5,
        blockPerformance: [
          { blockId: 'block-006', completed: true, avgPace: '2:28/500m' },
          { blockId: 'block-007', completed: true, rounds: 7.5 },
          { blockId: 'block-008', completed: true },
          { blockId: 'block-009', completed: true, avgRPM: 75, peakRPM: 82 },
          { blockId: 'block-010', completed: true }
        ],
        notes: 'Strong performance in AMRAP. Maintained consistency in Tabata intervals.'
      }
    }
  ],
  agility: [
    {
      playerId: 'player-001',
      playerName: 'Connor McDavid',
      drillId: 'agility-001',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      results: {
        times: [4.31, 4.28, 4.25, 4.29, 4.26],
        avgTime: 4.28,
        bestTime: 4.25,
        consistency: 94,
        fatigueFactor: 1.02,
        notes: 'Excellent consistency. Elite-level times.'
      }
    },
    {
      playerId: 'player-003',
      playerName: 'Nathan MacKinnon',
      drillId: 'agility-003',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      results: {
        times: [9.1, 8.9, 8.8, 9.0],
        avgTime: 8.95,
        bestTime: 8.8,
        consistency: 88,
        fatigueFactor: 1.05,
        notes: 'Good times. Slight fatigue on final rep. Focus on lateral shuffle efficiency.'
      }
    },
    {
      playerId: 'player-004',
      playerName: 'Cale Makar',
      drillId: 'agility-008',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      results: {
        clockwiseTimes: [11.8, 11.5, 11.6, 11.7],
        counterClockwiseTimes: [12.1, 11.9, 12.0, 12.2],
        avgTime: 11.85,
        bestTime: 11.5,
        consistency: 91,
        notes: 'Slightly faster clockwise. Work on counter-clockwise efficiency.'
      }
    },
    {
      playerId: 'player-002',
      playerName: 'Auston Matthews',
      drillId: 'agility-010',
      date: new Date().toISOString(),
      results: {
        program: 'Random Reaction',
        avgReactionTime: 0.42,
        accuracy: 92,
        totalTouches: 48,
        missedTouches: 4,
        improvements: ['Peripheral awareness', 'Decision speed'],
        notes: 'Excellent hand-eye coordination. Reaction times improving weekly.'
      }
    }
  ]
};

// All injuries list
const mockAllInjuries = [
  ...mockMedicalData['player-005'].current_injuries,
  ...mockMedicalData['player-005'].injury_history,
  ...mockMedicalData['player-003'].current_injuries,
  ...mockMedicalData['player-003'].injury_history,
];

// Active injuries only
const mockActiveInjuries = [
  ...mockMedicalData['player-005'].current_injuries,
  ...mockMedicalData['player-003'].current_injuries,
];

// Comprehensive mock base query that handles all API endpoints
export const mockBaseQuery: BaseQueryFn<
  string | { url: string; method?: string; body?: any; params?: any },
  unknown,
  unknown
> = async (args, api, extraOptions) => {
  // Check if mock mode is enabled
  const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
  if (!isMockMode) {
    throw new Error('Mock mode is not enabled');
  }

  // Parse the request
  const { url, method = 'GET', body, params } = 
    typeof args === 'string' ? { url: args } : args;

  // Add artificial delay to simulate network (reduced for development)
  await new Promise(resolve => setTimeout(resolve, 50));

  console.log(`🔧 Mock API: ${method} ${url}`, { body, params });

  // Define cleanEndpoint at the top level for use across all handlers
  const cleanEndpoint = url.split('?')[0];

  // Route to appropriate mock handler based on URL
  try {
    // Handle /me endpoint for current user
    if (cleanEndpoint === '/me' && method === 'GET') {
      // Return current user from mock auth
      const user = {
        id: 'trainer-123',
        name: 'John Trainer',
        email: 'trainer@hockeyhub.com',
        organizationId: 'org-123',
        role: 'physical_trainer',
        roleId: 'physical_trainer',
        permissions: [
          'training:view',
          'training:create',
          'training:update',
          'training:delete',
          'players:view',
          'teams:view'
        ],
        avatar: '/avatars/trainer.png',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };
      
      return { data: user };
    }
    
    // Auth endpoints (handled by mockAuthApi)
    if (url.includes('/auth/') || url.includes('/login') || url.includes('/register') || url.includes('/me') || url.includes('getCurrentUser')) {
      return mockAuthBaseQuery(typeof args === 'string' ? { url: args } : args, api, extraOptions);
    }

    // Calendar endpoints
    if (url.includes('/events') || url.includes('/calendar')) {
      // Handle different calendar endpoints
      if (url.includes('/events/date-range')) {
        return calendarMockHandlers['/events/date-range'](params);
      }
      if (url.includes('/events/upcoming')) {
        return calendarMockHandlers['/events/upcoming'](params);
      }
      if (url.includes('/events/calendar')) {
        return calendarMockHandlers['/events/calendar'](params);
      }
      if (url.includes('/events/check-conflicts')) {
        return calendarMockHandlers['/events/check-conflicts'](body);
      }
      
      // Handle event with ID
      const eventIdMatch = url.match(/\/events\/([\w-]+)$/);
      if (eventIdMatch) {
        const eventId = eventIdMatch[1];
        if (method === 'GET') {
          return calendarMockHandlers['/events/:id'](params, eventId);
        }
        if (method === 'PUT') {
          return calendarMockHandlers['PUT /events/:id'](body, eventId);
        }
        if (method === 'DELETE') {
          return calendarMockHandlers['DELETE /events/:id']();
        }
      }
      
      // Handle participant status update
      const participantMatch = url.match(/\/events\/([\w-]+)\/participants\/([\w-]+)\/status$/);
      if (participantMatch && method === 'PATCH') {
        return calendarMockHandlers['PATCH /events/:eventId/participants/:participantId/status'](body);
      }
      
      // Default events endpoint
      if (url === '/events' || url.endsWith('/events')) {
        if (method === 'GET') {
          return calendarMockHandlers['/events'](params);
        }
        if (method === 'POST') {
          return calendarMockHandlers['POST /events'](body);
        }
      }
    }

    // User/Organization endpoints for teams and players
    if (url.includes('/organizations/') && url.includes('/users')) {
      // Extract organization ID and query params
      const queryParams = typeof args === 'object' && args.params ? args.params : {};
      const { role, teamId } = queryParams;
      
      // Generate Skellefteå AIK players based on team
      const generateSkellefteaPlayers = (team: string) => {
        const teamPlayers: Record<string, any[]> = {
          'a-team': [
            { id: '1', firstName: 'Jonathan', lastName: 'Pudas', email: 'pudas@team.com', jerseyNumber: '44', position: 'Defense', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '2', firstName: 'Oscar', lastName: 'Möller', email: 'moller@team.com', jerseyNumber: '89', position: 'Forward', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '3', firstName: 'Linus', lastName: 'Söderström', email: 'soderstrom@team.com', jerseyNumber: '32', position: 'Goalie', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '4', firstName: 'Rickard', lastName: 'Hugg', email: 'hugg@team.com', jerseyNumber: '18', position: 'Forward', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '5', firstName: 'Max', lastName: 'Lindholm', email: 'lindholm@team.com', jerseyNumber: '7', position: 'Defense', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '6', firstName: 'Pär', lastName: 'Lindholm', email: 'plindholm@team.com', jerseyNumber: '26', position: 'Forward', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '7', firstName: 'Andreas', lastName: 'Johnson', email: 'ajohnson@team.com', jerseyNumber: '11', position: 'Forward', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '8', firstName: 'Jonathan', lastName: 'Johnson', email: 'jjohnson@team.com', jerseyNumber: '72', position: 'Defense', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '9', firstName: 'Linus', lastName: 'Lindström', email: 'lindstrom@team.com', jerseyNumber: '95', position: 'Forward', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '10', firstName: 'Anton', lastName: 'Heikkinen', email: 'heikkinen@team.com', jerseyNumber: '21', position: 'Forward', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '11', firstName: 'Dylan', lastName: 'Sikura', email: 'sikura@team.com', jerseyNumber: '15', position: 'Forward', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '12', firstName: 'Filip', lastName: 'Sandberg', email: 'sandberg@team.com', jerseyNumber: '48', position: 'Defense', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '13', firstName: 'Simon', lastName: 'Robertsson', email: 'robertsson@team.com', jerseyNumber: '20', position: 'Forward', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '14', firstName: 'Arvid', lastName: 'Lundberg', email: 'lundberg@team.com', jerseyNumber: '53', position: 'Defense', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '15', firstName: 'Oskar', lastName: 'Nilsson', email: 'nilsson@team.com', jerseyNumber: '13', position: 'Forward', teamId: 'a-team', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
          'j20': [
            { id: '16', firstName: 'Viktor', lastName: 'Nordin', email: 'nordin@team.com', jerseyNumber: '28', position: 'Forward', teamId: 'j20', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '17', firstName: 'Axel', lastName: 'Sandin-Pellikka', email: 'sandin@team.com', jerseyNumber: '45', position: 'Defense', teamId: 'j20', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '18', firstName: 'Oliver', lastName: 'Tärnström', email: 'tarnstrom@team.com', jerseyNumber: '35', position: 'Goalie', teamId: 'j20', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '19', firstName: 'Leo', lastName: 'Sahlin Wallenius', email: 'sahlin@team.com', jerseyNumber: '29', position: 'Defense', teamId: 'j20', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '20', firstName: 'Elias', lastName: 'Salomonsson', email: 'salomonsson@team.com', jerseyNumber: '24', position: 'Defense', teamId: 'j20', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '21', firstName: 'Filip', lastName: 'Eriksson', email: 'eriksson@team.com', jerseyNumber: '19', position: 'Forward', teamId: 'j20', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '22', firstName: 'Albin', lastName: 'Sundsvik', email: 'sundsvik@team.com', jerseyNumber: '14', position: 'Forward', teamId: 'j20', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '23', firstName: 'Max', lastName: 'Grönlund', email: 'gronlund@team.com', jerseyNumber: '22', position: 'Forward', teamId: 'j20', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '24', firstName: 'Jacob', lastName: 'Olofsson', email: 'olofsson@team.com', jerseyNumber: '77', position: 'Forward', teamId: 'j20', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '25', firstName: 'Anton', lastName: 'Gradin', email: 'gradin@team.com', jerseyNumber: '17', position: 'Forward', teamId: 'j20', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '26', firstName: 'William', lastName: 'Strömgren', email: 'stromgren@team.com', jerseyNumber: '10', position: 'Forward', teamId: 'j20', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '27', firstName: 'Felix', lastName: 'Rosdahl', email: 'rosdahl@team.com', jerseyNumber: '91', position: 'Defense', teamId: 'j20', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
          'u18': [
            { id: '28', firstName: 'Adam', lastName: 'Engström', email: 'engstrom@team.com', jerseyNumber: '8', position: 'Defense', teamId: 'u18', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '29', firstName: 'Noah', lastName: 'Dower Nilsson', email: 'dower@team.com', jerseyNumber: '27', position: 'Forward', teamId: 'u18', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '30', firstName: 'Calle', lastName: 'Sjöström', email: 'sjostrom@team.com', jerseyNumber: '30', position: 'Goalie', teamId: 'u18', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '31', firstName: 'Viggo', lastName: 'Gustafsson', email: 'gustafsson@team.com', jerseyNumber: '23', position: 'Defense', teamId: 'u18', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '32', firstName: 'Isak', lastName: 'Garfvé', email: 'garfve@team.com', jerseyNumber: '12', position: 'Forward', teamId: 'u18', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '33', firstName: 'Hugo', lastName: 'Fransson', email: 'fransson@team.com', jerseyNumber: '16', position: 'Forward', teamId: 'u18', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '34', firstName: 'Elliot', lastName: 'Nyström', email: 'nystrom@team.com', jerseyNumber: '25', position: 'Defense', teamId: 'u18', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '35', firstName: 'Vincent', lastName: 'Borgesi', email: 'borgesi@team.com', jerseyNumber: '88', position: 'Forward', teamId: 'u18', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '36', firstName: 'Adrian', lastName: 'Bergström', email: 'bergstrom@team.com', jerseyNumber: '5', position: 'Defense', teamId: 'u18', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '37', firstName: 'Lucas', lastName: 'Andersson', email: 'andersson@team.com', jerseyNumber: '9', position: 'Forward', teamId: 'u18', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
          'u16': [
            { id: '38', firstName: 'Theo', lastName: 'Lindberg', email: 'lindberg@team.com', jerseyNumber: '4', position: 'Defense', teamId: 'u16', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '39', firstName: 'Arvid', lastName: 'Henriksson', email: 'henriksson@team.com', jerseyNumber: '36', position: 'Forward', teamId: 'u16', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '40', firstName: 'Hugo', lastName: 'Alnefelt', email: 'alnefelt@team.com', jerseyNumber: '1', position: 'Goalie', teamId: 'u16', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '41', firstName: 'Erik', lastName: 'Wållberg', email: 'wallberg@team.com', jerseyNumber: '62', position: 'Forward', teamId: 'u16', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '42', firstName: 'William', lastName: 'Wallinder', email: 'wallinder@team.com', jerseyNumber: '3', position: 'Defense', teamId: 'u16', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '43', firstName: 'Felix', lastName: 'Nilsson', email: 'fnilsson@team.com', jerseyNumber: '63', position: 'Forward', teamId: 'u16', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '44', firstName: 'Oliver', lastName: 'Johansson', email: 'ojohansson@team.com', jerseyNumber: '56', position: 'Defense', teamId: 'u16', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '45', firstName: 'Nils', lastName: 'Höglander', email: 'hoglander@team.com', jerseyNumber: '33', position: 'Forward', teamId: 'u16', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
          'womens': [
            { id: '46', firstName: 'Michelle', lastName: 'Löwenhielm', email: 'lowenhielm@team.com', jerseyNumber: '9', position: 'Forward', teamId: 'womens', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '47', firstName: 'Anna', lastName: 'Kjellbin', email: 'kjellbin@team.com', jerseyNumber: '24', position: 'Defense', teamId: 'womens', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '48', firstName: 'Sandra', lastName: 'Borg', email: 'borg@team.com', jerseyNumber: '31', position: 'Goalie', teamId: 'womens', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '49', firstName: 'Emma', lastName: 'Forsgren', email: 'forsgren@team.com', jerseyNumber: '17', position: 'Forward', teamId: 'womens', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '50', firstName: 'Sara', lastName: 'Säkkinen', email: 'sakkinen@team.com', jerseyNumber: '19', position: 'Forward', teamId: 'womens', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '51', firstName: 'Wilma', lastName: 'Carlsson', email: 'carlsson@team.com', jerseyNumber: '6', position: 'Defense', teamId: 'womens', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '52', firstName: 'Johanna', lastName: 'Fällman', email: 'fallman@team.com', jerseyNumber: '43', position: 'Defense', teamId: 'womens', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '53', firstName: 'Maja', lastName: 'Nylén Persson', email: 'nylen@team.com', jerseyNumber: '21', position: 'Forward', teamId: 'womens', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '54', firstName: 'Ida', lastName: 'Karlsson', email: 'karlsson@team.com', jerseyNumber: '71', position: 'Forward', teamId: 'womens', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
            { id: '55', firstName: 'Mikaela', lastName: 'Beattie', email: 'beattie@team.com', jerseyNumber: '35', position: 'Goalie', teamId: 'womens', organizationId: 'org-123', isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          ],
        };
        
        return teamPlayers[team] || [];
      };
      
      // Only return players if role is 'player'
      if (role === 'player') {
        let players = [];
        
        if (teamId && teamId !== 'all') {
          // Return players for specific team
          players = generateSkellefteaPlayers(teamId);
        } else {
          // Return all players
          players = [
            ...generateSkellefteaPlayers('a-team'),
            ...generateSkellefteaPlayers('j20'),
            ...generateSkellefteaPlayers('u18'),
            ...generateSkellefteaPlayers('u16'),
            ...generateSkellefteaPlayers('womens'),
          ];
        }
        
        return { data: players };
      }
      
      // Return empty array for other roles
      return { data: [] };
    }
    
    // Teams endpoint - return { data: Team[] } to match the API type
    if (url.includes('/organizations/') && url.includes('/teams')) {
      const teamsResponse = {
        data: [
          { id: 'a-team', name: 'A-Team (SHL)', description: 'Senior professional team', organizationId: 'org-123', isActive: true, playerCount: 15, ageGroup: 'Senior', level: 'Professional', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          { id: 'j20', name: 'J20 SuperElit', description: 'Junior elite team', organizationId: 'org-123', isActive: true, playerCount: 12, ageGroup: 'Junior', level: 'Elite', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          { id: 'u18', name: 'U18 Elit', description: 'Under 18 elite team', organizationId: 'org-123', isActive: true, playerCount: 10, ageGroup: 'Youth', level: 'Elite', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          { id: 'u16', name: 'U16', description: 'Under 16 team', organizationId: 'org-123', isActive: true, playerCount: 8, ageGroup: 'Youth', level: 'Development', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          { id: 'womens', name: "Women's Team", description: 'Women\'s professional team', organizationId: 'org-123', isActive: true, playerCount: 10, ageGroup: 'Senior', level: 'Professional', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ]
      };
      return { data: teamsResponse };
    }

    // Schedule endpoints - Unified schedule data
    if (url.includes('/schedule')) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Mock schedule events with comprehensive variety
      const mockScheduleEvents = [
        // Today's events
        {
          id: 'event-today-1',
          title: 'A-Team Morning Strength Training',
          type: 'training',
          subType: 'strength',
          startTime: `${todayStr}T07:00:00Z`,
          endTime: `${todayStr}T08:30:00Z`,
          status: 'completed',
          location: 'Weight Room A',
          instructor: 'John Trainer',
          participants: ['player-1', 'player-2', 'player-3'],
          maxParticipants: 15,
          description: 'Upper body focus with Olympic lifts',
          equipment: ['barbells', 'dumbbells', 'benches'],
          difficulty: 'intermediate',
          tags: ['strength', 'upper-body', 'olympic-lifts'],
          teamId: 'a-team'
        },
        {
          id: 'event-today-2',
          title: 'J20 Team Conditioning',
          type: 'training',
          subType: 'conditioning',
          startTime: `${todayStr}T10:00:00Z`,
          endTime: `${todayStr}T11:00:00Z`,
          status: 'active',
          location: 'Gymnasium',
          instructor: 'Sarah Cardio',
          participants: ['player-4', 'player-5', 'player-6', 'player-7'],
          maxParticipants: 20,
          description: 'HIIT intervals with battle ropes and agility ladders',
          equipment: ['battle-ropes', 'agility-ladders', 'cones'],
          difficulty: 'advanced',
          tags: ['conditioning', 'hiit', 'agility'],
          liveMetrics: {
            activeParticipants: 4,
            averageHeartRate: 165,
            currentInterval: 3,
            totalIntervals: 8
          },
          teamId: 'j20'
        },
        {
          id: 'event-today-3',
          title: 'A-Team Ice Practice - Power Play',
          type: 'ice_practice',
          subType: 'tactical',
          startTime: `${todayStr}T14:00:00Z`,
          endTime: `${todayStr}T15:30:00Z`,
          status: 'upcoming',
          location: 'Rink 1',
          instructor: 'Coach Mike',
          participants: ['player-1', 'player-2', 'player-3', 'player-8', 'player-9'],
          maxParticipants: 22,
          description: 'Focus on power play formations and execution',
          equipment: ['pucks', 'cones', 'nets'],
          focus: 'special-teams',
          tags: ['ice-practice', 'power-play', 'tactical'],
          teamId: 'a-team'
        },
        {
          id: 'event-today-4',
          title: 'Medical Assessment - Sidney Crosby',
          type: 'medical',
          subType: 'assessment',
          startTime: `${todayStr}T16:00:00Z`,
          endTime: `${todayStr}T16:30:00Z`,
          status: 'upcoming',
          location: 'Medical Suite',
          instructor: 'Dr. Smith',
          participants: ['player-crosby'],
          maxParticipants: 1,
          description: 'Post-injury assessment for return to play clearance',
          appointmentType: 'assessment',
          tags: ['medical', 'return-to-play', 'assessment'],
          private: true
        },
        {
          id: 'event-today-5',
          title: 'J20 Team Meeting - Strategy Review',
          type: 'meeting',
          subType: 'strategy',
          startTime: `${todayStr}T18:00:00Z`,
          endTime: `${todayStr}T19:00:00Z`,
          status: 'upcoming',
          location: 'Conference Room A',
          instructor: 'Head Coach',
          participants: ['player-1', 'player-2', 'player-3', 'player-4', 'player-5'],
          maxParticipants: 25,
          description: 'Review game footage and discuss upcoming opponent',
          agenda: ['Game recap', 'Opponent analysis', 'Line combinations'],
          tags: ['meeting', 'strategy', 'video-review'],
          teamId: 'j20'
        },

        // Tomorrow's events
        {
          id: 'event-tomorrow-1',
          title: 'A-Team Pre-Game Skate',
          type: 'ice_practice',
          subType: 'warmup',
          startTime: `${tomorrowStr}T10:00:00Z`,
          endTime: `${tomorrowStr}T10:45:00Z`,
          status: 'upcoming',
          location: 'Rink 1',
          instructor: 'Coach Mike',
          participants: ['player-1', 'player-2', 'player-3'],
          maxParticipants: 22,
          description: 'Light skate before tonight\'s game',
          equipment: ['pucks'],
          focus: 'warmup',
          tags: ['ice-practice', 'pre-game', 'warmup'],
          teamId: 'a-team'
        },
        {
          id: 'event-tomorrow-2',
          title: 'A-Team Home Game vs Rangers',
          type: 'game',
          subType: 'home',
          startTime: `${tomorrowStr}T19:00:00Z`,
          endTime: `${tomorrowStr}T21:30:00Z`,
          status: 'upcoming',
          location: 'Home Arena',
          opponent: 'New York Rangers',
          participants: ['player-1', 'player-2', 'player-3', 'player-8', 'player-9'],
          maxParticipants: 22,
          description: 'Regular season game',
          gameType: 'regular',
          homeTeam: true,
          tags: ['game', 'home', 'regular-season'],
          teamId: 'a-team'
        },

        // Week events (next 7 days)
        {
          id: 'event-week-1',
          title: 'Personal Recovery Session',
          type: 'training',
          subType: 'hybrid',
          startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00:00Z'),
          endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00:00Z'),
          status: 'upcoming',
          location: 'Recovery Center',
          instructor: 'Recovery Specialist',
          participants: ['player-4', 'player-5'],
          maxParticipants: 10,
          description: 'Light mobility work and soft tissue therapy',
          equipment: ['foam-rollers', 'massage-tools'],
          difficulty: 'beginner',
          tags: ['recovery', 'mobility', 'soft-tissue']
        },
        {
          id: 'event-week-2',
          title: 'U18 Agility Training',
          type: 'training',
          subType: 'agility',
          startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00:00Z'),
          endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 75 * 60 * 1000).toISOString().replace(/:\d{2}\.\d{3}Z$/, ':15:00Z'),
          status: 'upcoming',
          location: 'Agility Court',
          instructor: 'Speed Coach',
          participants: ['player-6', 'player-7', 'player-8'],
          maxParticipants: 12,
          description: 'Ladder drills, cone work, and plyometrics',
          equipment: ['agility-ladders', 'cones', 'hurdles'],
          difficulty: 'intermediate',
          tags: ['agility', 'speed', 'plyometrics'],
          teamId: 'u18'
        },
        {
          id: 'event-today-6',
          title: 'U16 Skills Development',
          type: 'training',
          subType: 'skills',
          startTime: `${todayStr}T15:30:00Z`,
          endTime: `${todayStr}T17:00:00Z`,
          status: 'upcoming',
          location: 'Training Center',
          instructor: 'Skills Coach',
          participants: ['player-38', 'player-39', 'player-40', 'player-41'],
          maxParticipants: 15,
          description: 'Fundamental skills and techniques',
          equipment: ['sticks', 'pucks', 'cones'],
          difficulty: 'beginner',
          tags: ['skills', 'development', 'fundamentals'],
          teamId: 'u16'
        },
        {
          id: 'event-today-7',
          title: "Women's Team Strength Training",
          type: 'training',
          subType: 'strength',
          startTime: `${todayStr}T08:00:00Z`,
          endTime: `${todayStr}T09:30:00Z`,
          status: 'completed',
          location: 'Weight Room B',
          instructor: 'Sarah Trainer',
          participants: ['player-46', 'player-47', 'player-48', 'player-49', 'player-50'],
          maxParticipants: 12,
          description: 'Lower body and core strengthening',
          equipment: ['barbells', 'resistance-bands', 'medicine-balls'],
          difficulty: 'intermediate',
          tags: ['strength', 'lower-body', 'core'],
          teamId: 'womens'
        },
        {
          id: 'event-today-8',
          title: 'U18 Team Meeting',
          type: 'meeting',
          subType: 'team',
          startTime: `${todayStr}T17:30:00Z`,
          endTime: `${todayStr}T18:30:00Z`,
          status: 'upcoming',
          location: 'Meeting Room B',
          instructor: 'U18 Coach',
          participants: ['player-28', 'player-29', 'player-30', 'player-31'],
          maxParticipants: 20,
          description: 'Team building and season planning',
          tags: ['meeting', 'team-building', 'planning'],
          teamId: 'u18'
        },
        {
          id: 'event-week-3',
          title: 'Away Game vs Bruins',
          type: 'game',
          subType: 'away',
          startTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00:00Z'),
          endTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 150 * 60 * 1000).toISOString().replace(/:\d{2}\.\d{3}Z$/, ':30:00Z'),
          status: 'upcoming',
          location: 'TD Garden, Boston',
          opponent: 'Boston Bruins',
          participants: ['player-1', 'player-2', 'player-3'],
          maxParticipants: 22,
          description: 'Away game in Boston',
          gameType: 'regular',
          homeTeam: false,
          travel: {
            departure: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(),
            return: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString()
          },
          tags: ['game', 'away', 'travel']
        },
        {
          id: 'event-week-4',
          title: 'Personal Development Session',
          type: 'personal',
          subType: 'development',
          startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00:00Z'),
          endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString().replace(/:\d{2}\.\d{3}Z$/, ':30:00Z'),
          status: 'upcoming',
          location: 'Skills Center',
          instructor: 'Skills Coach',
          participants: ['player-mcdavid'],
          maxParticipants: 1,
          description: 'Individual skills development - puck handling',
          focus: 'technical-skills',
          tags: ['personal', 'skills', 'individual'],
          private: true
        },
        {
          id: 'event-week-5',
          title: 'Team Dinner',
          type: 'meeting',
          subType: 'social',
          startTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00:00Z'),
          endTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00:00Z'),
          status: 'upcoming',
          location: 'Team Restaurant',
          participants: ['player-1', 'player-2', 'player-3', 'player-4', 'player-5'],
          maxParticipants: 30,
          description: 'Team bonding dinner',
          tags: ['social', 'team-bonding', 'dinner']
        }
      ];

      // /schedule/today endpoint
      if (cleanEndpoint === '/schedule/today') {
        // Get query parameters
        const queryParams = typeof args === 'object' && args.params ? args.params : {};
        const { teamId, playerId, role } = queryParams;
        
        let todaysEvents = mockScheduleEvents.filter(event => 
          event.startTime.startsWith(todayStr)
        );
        
        // Filter by team if provided
        if (teamId && teamId !== 'all') {
          todaysEvents = todaysEvents.filter(event => {
            // For team filter, show events for that specific team
            if (teamId === 'personal') {
              // Personal view: show individual/small group sessions
              return event.participants && event.participants.length <= 3;
            }
            // Filter by teamId field
            return event.teamId === teamId;
          });
        }
        
        // Filter by player if provided (for Personal View when user ID is passed)
        if (playerId) {
          todaysEvents = todaysEvents.filter(event => {
            // Check if the player/trainer is the instructor or in participants
            return event.instructor === playerId || 
                   (event.participants && event.participants.includes(playerId));
          });
        }
        
        return {
          data: todaysEvents
        };
      }

      // /schedule/event/:id endpoint
      const eventIdMatch = url.match(/\/schedule\/event\/([\w-]+)$/);
      if (eventIdMatch) {
        const eventId = eventIdMatch[1];
        const event = mockScheduleEvents.find(e => e.id === eventId);
        
        if (!event) {
          return { error: { status: 404, data: { message: 'Event not found' } } };
        }

        // Enhanced event details
        const eventDetails = {
          ...event,
          attendanceHistory: [
            { date: '2025-01-01', attendance: 18, maxCapacity: 20 },
            { date: '2025-01-02', attendance: 22, maxCapacity: 22 },
            { date: '2025-01-03', attendance: 15, maxCapacity: 20 }
          ],
          participantDetails: event.participants.map(id => ({
            id,
            name: `Player ${id.split('-')[1] || 'Unknown'}`,
            status: Math.random() > 0.2 ? 'confirmed' : 'pending',
            medicalStatus: Math.random() > 0.8 ? 'restricted' : 'cleared',
            notes: Math.random() > 0.7 ? 'Individual workout plan applied' : null
          })),
          prerequisites: event.type === 'training_session' ? [
            'Medical clearance required',
            'Proper athletic attire',
            'Water bottle recommended'
          ] : [],
          relatedEvents: mockScheduleEvents
            .filter(e => e.id !== eventId && e.type === event.type)
            .slice(0, 3)
            .map(e => ({ id: e.id, title: e.title, startTime: e.startTime }))
        };

        return { data: eventDetails };
      }

      // /schedule/week endpoint
      if (cleanEndpoint === '/schedule/week') {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - now.getDay()); // Start of week
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // End of week

        const weekEvents = mockScheduleEvents.filter(event => {
          const eventDate = new Date(event.startTime);
          return eventDate >= weekStart && eventDate <= weekEnd;
        });

        // Group events by day
        const eventsByDay = weekEvents.reduce((acc, event) => {
          const day = event.startTime.split('T')[0];
          if (!acc[day]) acc[day] = [];
          acc[day].push(event);
          return acc;
        }, {} as Record<string, typeof mockScheduleEvents>);

        return {
          data: {
            weekStart: weekStart.toISOString().split('T')[0],
            weekEnd: weekEnd.toISOString().split('T')[0],
            events: weekEvents,
            eventsByDay,
            summary: {
              total: weekEvents.length,
              byDay: Object.keys(eventsByDay).map(day => ({
                date: day,
                count: eventsByDay[day].length,
                types: [...new Set(eventsByDay[day].map(e => e.type))]
              })),
              byType: weekEvents.reduce((acc, event) => {
                acc[event.type] = (acc[event.type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>),
              workload: {
                training: weekEvents.filter(e => e.type === 'training_session').length,
                games: weekEvents.filter(e => e.type === 'game').length,
                recovery: weekEvents.filter(e => e.subType === 'recovery').length
              }
            }
          }
        };
      }

      // /schedule/upcoming endpoint
      if (cleanEndpoint === '/schedule/upcoming') {
        const upcomingEvents = mockScheduleEvents
          .filter(event => {
            const eventDate = new Date(event.startTime);
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return eventDate > now && eventDate <= nextWeek && event.status === 'upcoming';
          })
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        return {
          data: {
            events: upcomingEvents,
            timeRange: {
              from: now.toISOString(),
              to: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            summary: {
              total: upcomingEvents.length,
              thisWeek: upcomingEvents.filter(event => {
                const eventDate = new Date(event.startTime);
                return eventDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              }).length,
              priorities: {
                high: upcomingEvents.filter(e => e.type === 'game').length,
                medium: upcomingEvents.filter(e => e.type === 'training_session').length,
                low: upcomingEvents.filter(e => e.type === 'team_meeting').length
              },
              conflicts: [], // Would contain scheduling conflicts in real implementation
              notifications: upcomingEvents
                .filter(event => {
                  const eventDate = new Date(event.startTime);
                  const hoursUntil = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                  return hoursUntil <= 24;
                })
                .map(event => ({
                  eventId: event.id,
                  title: event.title,
                  message: `Reminder: ${event.title} starts in ${Math.round((new Date(event.startTime).getTime() - now.getTime()) / (1000 * 60 * 60))} hours`,
                  priority: event.type === 'game' ? 'high' : 'medium'
                }))
            }
          }
        };
      }
    }


    // Dashboard endpoints
    if (url.includes('/dashboard')) {
      const role = localStorage.getItem('mock_user_role') || 'player';
      return { data: mockDashboardData[role as keyof typeof mockDashboardData] || {} };
    }

    // Player endpoints - check exact URL match first
    if (url === 'players' || url === '/players') {
      // Get all players
      return {
        data: {
          players: [
            {
              id: 'player-001',
              name: 'Connor McDavid',
              firstName: 'Connor',
              lastName: 'McDavid',
              jerseyNumber: '97',
              position: 'Center',
              team: 'Senior Team',
              teamId: 'team-001',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-002',
              name: 'Auston Matthews',
              firstName: 'Auston',
              lastName: 'Matthews',
              jerseyNumber: '34',
              position: 'Center',
              team: 'Senior Team',
              teamId: 'team-001',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-003',
              name: 'Nathan MacKinnon',
              firstName: 'Nathan',
              lastName: 'MacKinnon',
              jerseyNumber: '29',
              position: 'Center',
              team: 'Senior Team',
              teamId: 'team-001',
              avatarUrl: null,
              wellness: { status: 'limited' },
              medicalRestrictions: ['No heavy squats']
            },
            {
              id: 'player-004',
              name: 'Cale Makar',
              firstName: 'Cale',
              lastName: 'Makar',
              jerseyNumber: '8',
              position: 'Defense',
              team: 'Senior Team',
              teamId: 'team-001',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-005',
              name: 'Sidney Crosby',
              firstName: 'Sidney',
              lastName: 'Crosby',
              jerseyNumber: '87',
              position: 'Center',
              team: 'Junior Team',
              teamId: 'team-002',
              avatarUrl: null,
              wellness: { status: 'injured' },
              medicalRestrictions: ['Upper body - no contact']
            },
            // Skellefteå AIK players (24 players)
            {
              id: 'player-006',
              name: 'Linus Söderström',
              firstName: 'Linus',
              lastName: 'Söderström',
              jerseyNumber: '1',
              position: 'Goalie',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-007',
              name: 'Strauss Mann',
              firstName: 'Strauss',
              lastName: 'Mann',
              jerseyNumber: '35',
              position: 'Goalie',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-008',
              name: 'Jonathan Pudas',
              firstName: 'Jonathan',
              lastName: 'Pudas',
              jerseyNumber: '3',
              position: 'Defense',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-009',
              name: 'Max Lindholm',
              firstName: 'Max',
              lastName: 'Lindholm',
              jerseyNumber: '5',
              position: 'Defense',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'limited' },
              medicalRestrictions: ['Light training only']
            },
            {
              id: 'player-010',
              name: 'Andreas Wingerli',
              firstName: 'Andreas',
              lastName: 'Wingerli',
              jerseyNumber: '7',
              position: 'Defense',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-011',
              name: 'Petter Granberg',
              firstName: 'Petter',
              lastName: 'Granberg',
              jerseyNumber: '18',
              position: 'Defense',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-012',
              name: 'Anton Olsson',
              firstName: 'Anton',
              lastName: 'Olsson',
              jerseyNumber: '22',
              position: 'Defense',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-013',
              name: 'Theodor Lennström',
              firstName: 'Theodor',
              lastName: 'Lennström',
              jerseyNumber: '26',
              position: 'Defense',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-014',
              name: 'Dylan Sikura',
              firstName: 'Dylan',
              lastName: 'Sikura',
              jerseyNumber: '9',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-015',
              name: 'Rickard Hugg',
              firstName: 'Rickard',
              lastName: 'Hugg',
              jerseyNumber: '10',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-016',
              name: 'Oscar Möller',
              firstName: 'Oscar',
              lastName: 'Möller',
              jerseyNumber: '11',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-017',
              name: 'Joakim Lindström',
              firstName: 'Joakim',
              lastName: 'Lindström',
              jerseyNumber: '12',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'injured' },
              medicalRestrictions: ['No contact - knee injury']
            },
            {
              id: 'player-018',
              name: 'Jonathan Johnson',
              firstName: 'Jonathan',
              lastName: 'Johnson',
              jerseyNumber: '14',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-019',
              name: 'Anton Heikkinen',
              firstName: 'Anton',
              lastName: 'Heikkinen',
              jerseyNumber: '16',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-020',
              name: 'Axel Holmström',
              firstName: 'Axel',
              lastName: 'Holmström',
              jerseyNumber: '17',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-021',
              name: 'Måns Forsfjäll',
              firstName: 'Måns',
              lastName: 'Forsfjäll',
              jerseyNumber: '19',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-022',
              name: 'Andreas Johnson',
              firstName: 'Andreas',
              lastName: 'Johnson',
              jerseyNumber: '20',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-023',
              name: 'Filip Sandberg',
              firstName: 'Filip',
              lastName: 'Sandberg',
              jerseyNumber: '21',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'limited' },
              medicalRestrictions: ['No heavy lifts']
            },
            {
              id: 'player-024',
              name: 'Oskar Nilsson',
              firstName: 'Oskar',
              lastName: 'Nilsson',
              jerseyNumber: '23',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-025',
              name: 'Victor Berglund',
              firstName: 'Victor',
              lastName: 'Berglund',
              jerseyNumber: '24',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-026',
              name: 'Leo Sahlin Wallenius',
              firstName: 'Leo',
              lastName: 'Sahlin Wallenius',
              jerseyNumber: '25',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-027',
              name: 'Simon Robertsson',
              firstName: 'Simon',
              lastName: 'Robertsson',
              jerseyNumber: '27',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-028',
              name: 'Oscar Lindberg',
              firstName: 'Oscar',
              lastName: 'Lindberg',
              jerseyNumber: '28',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            },
            {
              id: 'player-029',
              name: 'Linus Högberg',
              firstName: 'Linus',
              lastName: 'Högberg',
              jerseyNumber: '29',
              position: 'Forward',
              team: 'Skellefteå AIK',
              teamId: 'team-004',
              avatarUrl: null,
              wellness: { status: 'healthy' },
              medicalRestrictions: []
            }
          ]
        }
      };
    }
    
    // Teams endpoints - check exact URL match
    if (url === 'teams' || url === '/teams') {
      return {
        data: {
          teams: [
            {
              id: 'team-001',
              name: 'Senior Team',
              category: 'Senior',
              ageGroup: 'U20',
              level: 'Elite',
              players: [
                { id: 'player-001', name: 'Connor McDavid' },
                { id: 'player-002', name: 'Auston Matthews' },
                { id: 'player-003', name: 'Nathan MacKinnon' },
                { id: 'player-004', name: 'Cale Makar' }
              ]
            },
            {
              id: 'team-002',
              name: 'Junior Team',
              category: 'Junior',
              ageGroup: 'U18',
              level: 'AAA',
              players: [
                { id: 'player-005', name: 'Sidney Crosby' }
              ]
            },
            {
              id: 'team-003',
              name: 'Development Squad',
              category: 'Development',
              ageGroup: 'U16',
              level: 'AA',
              players: []
            },
            {
              id: 'team-004',
              name: 'Skellefteå AIK',
              category: 'Professional',
              ageGroup: 'Senior',
              level: 'SHL',
              players: [
                { id: 'player-006', name: 'Linus Söderström' },
                { id: 'player-007', name: 'Strauss Mann' },
                { id: 'player-008', name: 'Jonathan Pudas' },
                { id: 'player-009', name: 'Max Lindholm' },
                { id: 'player-010', name: 'Andreas Wingerli' },
                { id: 'player-011', name: 'Petter Granberg' },
                { id: 'player-012', name: 'Anton Olsson' },
                { id: 'player-013', name: 'Theodor Lennström' },
                { id: 'player-014', name: 'Dylan Sikura' },
                { id: 'player-015', name: 'Rickard Hugg' },
                { id: 'player-016', name: 'Oscar Möller' },
                { id: 'player-017', name: 'Joakim Lindström' },
                { id: 'player-018', name: 'Jonathan Johnson' },
                { id: 'player-019', name: 'Anton Heikkinen' },
                { id: 'player-020', name: 'Axel Holmström' },
                { id: 'player-021', name: 'Måns Forsfjäll' },
                { id: 'player-022', name: 'Andreas Johnson' },
                { id: 'player-023', name: 'Filip Sandberg' },
                { id: 'player-024', name: 'Oskar Nilsson' },
                { id: 'player-025', name: 'Victor Berglund' },
                { id: 'player-026', name: 'Leo Sahlin Wallenius' },
                { id: 'player-027', name: 'Simon Robertsson' },
                { id: 'player-028', name: 'Oscar Lindberg' },
                { id: 'player-029', name: 'Linus Högberg' }
              ]
            }
          ],
          total: 4,
        }
      };
    }

    // Organization endpoints
    if (url.includes('/organizations/')) {
      // Handle /organizations/{orgId}/users endpoint
      if (url.includes('/users')) {
        // Check role from params object instead of URL string
        const role = params?.role;
        const isPlayerRole = role === 'player';
        const isPhysicalTrainerRole = role === 'physical_trainer';
        const isIceCoachRole = role === 'ice_coach';
        
        // Return coaches if requested
        if (isPhysicalTrainerRole || isIceCoachRole) {
          console.log('🔧 Mock API: Returning coaches for role:', role);
          const coaches = [
            {
              id: 'coach-001',
              email: 'john.smith@hockeyhub.com',
              firstName: 'John',
              lastName: 'Smith',
              name: 'John Smith',
              roles: ['physical_trainer'],
              organizationId: 'org-123',
              avatarUrl: '/avatars/john-smith.jpg',
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z'
            },
            {
              id: 'coach-002',
              email: 'sarah.johnson@hockeyhub.com',
              firstName: 'Sarah',
              lastName: 'Johnson',
              name: 'Sarah Johnson',
              roles: ['physical_trainer'],
              organizationId: 'org-123',
              avatarUrl: '/avatars/sarah-johnson.jpg',
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z'
            },
            {
              id: 'coach-003',
              email: 'mike.anderson@hockeyhub.com',
              firstName: 'Mike',
              lastName: 'Anderson',
              name: 'Mike Anderson',
              roles: ['ice_coach'],
              organizationId: 'org-123',
              avatarUrl: '/avatars/mike-anderson.jpg',
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z'
            },
            {
              id: 'coach-004',
              email: 'lisa.wong@hockeyhub.com',
              firstName: 'Lisa',
              lastName: 'Wong',
              name: 'Lisa Wong',
              roles: ['ice_coach'],
              organizationId: 'org-123',
              avatarUrl: '/avatars/lisa-wong.jpg',
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z'
            },
            {
              id: 'coach-005',
              email: 'david.martinez@hockeyhub.com',
              firstName: 'David',
              lastName: 'Martinez',
              name: 'David Martinez',
              roles: ['physical_trainer', 'ice_coach'],
              organizationId: 'org-123',
              avatarUrl: '/avatars/david-martinez.jpg',
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z'
            }
          ];
          
          if (isPhysicalTrainerRole) {
            return { data: coaches.filter(c => c.roles.includes('physical_trainer')) };
          }
          if (isIceCoachRole) {
            return { data: coaches.filter(c => c.roles.includes('ice_coach')) };
          }
        }
        
        if (isPlayerRole) {
          return {
            data: [
              {
                id: 'player-001',
                email: 'connor@hockeyhub.com',
                firstName: 'Connor',
                lastName: 'McDavid',
                name: 'Connor McDavid',
                jerseyNumber: '97',
                position: 'Center',
                team: 'Senior Team',
                teamId: 'team-001',
                avatarUrl: null,
                wellness: { status: 'healthy' },
                medicalRestrictions: []
              },
              {
                id: 'player-002',
                email: 'leon@hockeyhub.com',
                firstName: 'Leon',
                lastName: 'Draisaitl',
                name: 'Leon Draisaitl',
                jerseyNumber: '29',
                position: 'Center',
                team: 'Senior Team',
                teamId: 'team-001',
                avatarUrl: null,
                wellness: { status: 'healthy' },
                medicalRestrictions: []
              },
              {
                id: 'player-003',
                email: 'nathan@hockeyhub.com',
                firstName: 'Nathan',
                lastName: 'MacKinnon',
                name: 'Nathan MacKinnon',
                jerseyNumber: '29',
                position: 'Center',
                team: 'Junior Team',
                teamId: 'team-002',
                avatarUrl: null,
                wellness: { status: 'limited' },
                medicalRestrictions: ['No heavy squats', 'Limited lower body impact']
              },
              {
                id: 'player-004',
                email: 'mitch@hockeyhub.com',
                firstName: 'Mitchell',
                lastName: 'Marner',
                name: 'Mitchell Marner',
                jerseyNumber: '16',
                position: 'Right Wing',
                team: 'Senior Team',
                teamId: 'team-001',
                avatarUrl: null,
                wellness: { status: 'healthy' },
                medicalRestrictions: []
              },
              {
                id: 'player-005',
                email: 'sidney@hockeyhub.com',
                firstName: 'Sidney',
                lastName: 'Crosby',
                name: 'Sidney Crosby',
                jerseyNumber: '87',
                position: 'Center',
                team: 'Senior Team',
                teamId: 'team-001',
                avatarUrl: null,
                wellness: { status: 'injured' },
                medicalRestrictions: ['No contact allowed until cleared by medical staff', 'Upper body - no overhead movements', 'No heavy pushing exercises']
              }
            ]
          };
        }
        // Return empty array for other roles
        return { data: [] };
      }
    }

    // Helper function to get team name
    const getTeamName = (teamId: string): string => {
      const teamNames: Record<string, string> = {
        'u16': 'U16',
        'u18': 'U18', 
        'u20': 'U20',
        'senior': 'Senior Team',
        'women': 'Women\'s Team'
      };
      return teamNames[teamId] || 'Team';
    };

    // Calendar endpoints
    if (url.includes('/calendar/events') || url.includes('/events')) {
      // Handle date range queries
      if ((url.includes('/date-range') || params?.startDate && params?.endDate)) {
        const teamId = params?.teamId;
        const startDate = new Date(params.startDate);
        const endDate = new Date(params.endDate);
        
        // Generate events for the date range
        const events = [];
        const current = new Date(startDate);
        
        while (current <= endDate) {
          // Add some events for each week
          if (current.getDay() === 1) { // Monday
            events.push({
              id: `training-${current.getTime()}`,
              title: teamId ? `${getTeamName(teamId)} Training` : 'Team Training',
              type: 'training' as const,
              startTime: new Date(new Date(current).setHours(9, 0, 0, 0)).toISOString(),
              endTime: new Date(new Date(current).setHours(11, 0, 0, 0)).toISOString(),
              location: 'trainingCenter',
              teamId: teamId || undefined,
              status: 'scheduled' as const,
              visibility: 'team' as const,
              createdBy: 'trainer-1',
              organizationId: params.organizationId || 'org-123',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              metadata: {
                workoutId: `workout-${current.getTime()}`,
                workoutType: current.getDay() === 1 ? 'AGILITY' : 'CONDITIONING',
                agilityProgram: current.getDay() === 1 ? {
                  id: `agility-${current.getTime()}`,
                  name: 'Sprint & Agility Training',
                  description: 'Improve your speed and change of direction',
                  warmupDuration: 300,
                  cooldownDuration: 180,
                  drills: [
                    {
                      id: 'drill-1',
                      name: 'T-Drill',
                      category: 'cone_drills' as const,
                      description: 'Sprint forward, shuffle laterally, backpedal',
                      duration: 30,
                      reps: 3,
                      restBetweenReps: 30,
                      pattern: 't_drill',
                      targetTime: { elite: 8.5, good: 9.5, average: 10.5 },
                      setup: {
                        equipment: ['4 cones'],
                        spacing: '10 yards forward, 5 yards each side'
                      },
                      instructions: [
                        'Sprint forward to the center cone',
                        'Shuffle right to the right cone',
                        'Shuffle left across to the left cone',
                        'Shuffle back to center',
                        'Backpedal to start'
                      ],
                      coachingCues: [
                        'Keep hips low during shuffles',
                        'Touch each cone',
                        'Explosive direction changes'
                      ]
                    },
                    {
                      id: 'rest-1',
                      name: 'Active Rest',
                      category: 'rest' as const,
                      description: 'Light movement and hydration',
                      duration: 120,
                      reps: 1,
                      restBetweenReps: 0
                    },
                    {
                      id: 'drill-2',
                      name: '5-10-5 Shuttle',
                      category: 'change_of_direction' as const,
                      description: 'Quick lateral movements with direction changes',
                      duration: 30,
                      reps: 4,
                      restBetweenReps: 45,
                      pattern: 'shuttle_5_10_5',
                      targetTime: { elite: 4.0, good: 4.5, average: 5.0 },
                      setup: {
                        equipment: ['3 cones'],
                        spacing: '5 yards apart'
                      },
                      instructions: [
                        'Start in middle cone',
                        'Sprint 5 yards to the right',
                        'Change direction and sprint 10 yards to the left',
                        'Change direction and sprint 5 yards back to center'
                      ],
                      coachingCues: [
                        'Plant outside foot when changing direction',
                        'Stay low through turns',
                        'Accelerate out of cuts'
                      ]
                    }
                  ],
                  totalDuration: 900
                } : undefined,
                intervalProgram: current.getDay() !== 1 ? {
                  id: `interval-${current.getTime()}`,
                  name: 'High Intensity Circuit',
                  totalDuration: 3600, // 60 minutes
                  intervals: [
                    { duration: 300, intensity: 'Warm-up', targetBPM: 120 },
                    { duration: 30, intensity: 'Sprint', targetBPM: 180 },
                    { duration: 90, intensity: 'Recovery', targetBPM: 140 },
                    { duration: 30, intensity: 'Sprint', targetBPM: 180 },
                    { duration: 90, intensity: 'Recovery', targetBPM: 140 }
                  ]
                } : undefined,
                trainingType: 'physical' as const
              }
            });
          }
          if (current.getDay() === 3) { // Wednesday
            events.push({
              id: `game-${current.getTime()}`,
              title: teamId ? `${getTeamName(teamId)} vs Rivals` : 'Team vs Rivals',
              type: 'game' as const,
              startTime: new Date(new Date(current).setHours(19, 0, 0, 0)).toISOString(),
              endTime: new Date(new Date(current).setHours(22, 0, 0, 0)).toISOString(),
              location: 'Home Arena',
              teamId: teamId || undefined,
              status: 'scheduled' as const,
              visibility: 'public' as const,
              createdBy: 'admin-1',
              organizationId: params.organizationId || 'org-123',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
          if (current.getDay() === 4) { // Thursday
            events.push({
              id: `agility-training-${current.getTime()}`,
              title: teamId ? `${getTeamName(teamId)} Agility Session` : 'Agility Training',
              type: 'training' as const,
              startTime: new Date(new Date(current).setHours(15, 0, 0, 0)).toISOString(),
              endTime: new Date(new Date(current).setHours(16, 30, 0, 0)).toISOString(),
              location: 'fieldHouse',
              teamId: teamId || undefined,
              status: 'scheduled' as const,
              visibility: 'team' as const,
              createdBy: 'trainer-1',
              organizationId: params.organizationId || 'org-123',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              metadata: {
                workoutId: `agility-workout-${current.getTime()}`,
                workoutType: 'AGILITY' as const,
                agilityProgram: {
                  id: `agility-${current.getTime()}`,
                  name: 'Ladder & Cone Drills',
                  description: 'Focus on footwork and quick direction changes',
                  warmupDuration: 240,
                  cooldownDuration: 240,
                  drills: [
                    {
                      id: 'drill-ladder-1',
                      name: 'Ladder - Two Feet In',
                      category: 'footwork' as const,
                      description: 'Quick feet through ladder rungs',
                      duration: 30,
                      reps: 3,
                      restBetweenReps: 20,
                      pattern: 'ladder_drill',
                      setup: {
                        equipment: ['Agility ladder'],
                        spacing: 'Standard ladder spacing'
                      },
                      instructions: [
                        'Start at one end of the ladder',
                        'Step both feet in each rung',
                        'Maintain quick, light steps',
                        'Keep eyes forward'
                      ],
                      coachingCues: [
                        'Stay on balls of feet',
                        'Quick ground contact',
                        'Arms at 90 degrees'
                      ]
                    },
                    {
                      id: 'drill-3',
                      name: 'Box Drill',
                      category: 'change_of_direction' as const,
                      description: '4-corner sprint with direction changes',
                      duration: 30,
                      reps: 4,
                      restBetweenReps: 40,
                      pattern: 'box_drill',
                      targetTime: { elite: 6.0, good: 7.0, average: 8.0 },
                      setup: {
                        equipment: ['4 cones'],
                        spacing: '5x5 yard square'
                      },
                      instructions: [
                        'Sprint to first cone',
                        'Shuffle right to second cone',
                        'Backpedal to third cone',
                        'Shuffle left back to start'
                      ],
                      coachingCues: [
                        'Sharp cuts at each cone',
                        'Maintain athletic stance',
                        'Keep hips square in shuffles'
                      ]
                    },
                    {
                      id: 'rest-2',
                      name: 'Complete Rest',
                      category: 'rest' as const,
                      description: 'Full recovery period',
                      duration: 180,
                      reps: 1,
                      restBetweenReps: 0
                    },
                    {
                      id: 'drill-4',
                      name: 'Zig-Zag Sprint',
                      category: 'cone_drills' as const,
                      description: 'Weave through cones at speed',
                      duration: 30,
                      reps: 5,
                      restBetweenReps: 30,
                      pattern: 'zig_zag',
                      setup: {
                        equipment: ['5 cones'],
                        spacing: '5 yards apart in line'
                      },
                      instructions: [
                        'Sprint diagonally to first cone',
                        'Plant outside foot and cut',
                        'Continue weaving through all cones',
                        'Sprint through finish'
                      ],
                      coachingCues: [
                        'Lean into cuts',
                        'Drive off outside foot',
                        'Maintain speed through pattern'
                      ]
                    }
                  ],
                  totalDuration: 1200
                },
                trainingType: 'physical' as const
              }
            });
          }
          if (current.getDay() === 5) { // Friday
            events.push({
              id: `meeting-${current.getTime()}`,
              title: teamId ? `${getTeamName(teamId)} Strategy Meeting` : 'Team Meeting',
              type: 'meeting' as const,
              startTime: new Date(new Date(current).setHours(14, 0, 0, 0)).toISOString(),
              endTime: new Date(new Date(current).setHours(15, 30, 0, 0)).toISOString(),
              location: 'Conference Room',
              teamId: teamId || undefined,
              status: 'scheduled' as const,
              visibility: 'team' as const,
              createdBy: 'coach-1',
              organizationId: params.organizationId || 'org-123',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
          
          current.setDate(current.getDate() + 1);
        }
        
        return { data: events };
      }
      
      // Original upcoming events handler
      if (url.includes('/events/upcoming')) {
      const teamId = params?.teamId;
      const today = new Date();
      
      // Generate team-specific calendar events
      const generateTeamEvents = (teamId?: string) => {
        const baseEvents = [
          // Games
          {
            id: '1',
            title: teamId ? `${getTeamName(teamId)} vs Rivals HC` : 'A-Team vs Rivals HC',
            type: 'game' as const,
            startTime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
            location: 'Home Arena',
            teamId: teamId || 'a-team',
            status: 'scheduled' as const,
            visibility: 'public' as const,
            createdBy: 'coach-1',
            organizationId: 'org-123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          // Ice Practice
          {
            id: '2',
            title: `${teamId ? getTeamName(teamId) : 'Team'} Ice Practice`,
            type: 'training' as const,
            startTime: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
            location: 'Main Rink',
            teamId: teamId || 'a-team',
            status: 'scheduled' as const,
            visibility: 'team' as const,
            createdBy: 'coach-1',
            organizationId: 'org-123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
              trainingType: 'ice' as const
            }
          },
          // Team Meeting
          {
            id: '3',
            title: `${teamId ? getTeamName(teamId) : 'Team'} Strategy Meeting`,
            type: 'meeting' as const,
            startTime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
            location: 'Conference Room',
            teamId: teamId || 'a-team',
            status: 'scheduled' as const,
            visibility: 'team' as const,
            createdBy: 'coach-1',
            organizationId: 'org-123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          // Physical Training (already on calendar from training sessions)
          {
            id: '4',
            title: `${teamId ? getTeamName(teamId) : 'Team'} Strength Training`,
            type: 'training' as const,
            startTime: new Date(today.getTime() + 0.5 * 24 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(today.getTime() + 0.5 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000).toISOString(),
            location: 'Weight Room',
            teamId: teamId || 'a-team',
            status: 'scheduled' as const,
            visibility: 'team' as const,
            createdBy: 'trainer-1',
            organizationId: 'org-123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
              workoutId: 'workout-strength-001',
              intervalProgram: {
                id: 'interval-strength-001',
                name: 'Strength & Power Circuit',
                totalDuration: 5400, // 90 minutes
                intervals: [
                  { duration: 600, intensity: 'Warm-up', targetBPM: 110 },
                  { duration: 45, intensity: 'Power Set', targetBPM: 160 },
                  { duration: 180, intensity: 'Recovery', targetBPM: 120 },
                  { duration: 45, intensity: 'Power Set', targetBPM: 160 },
                  { duration: 180, intensity: 'Recovery', targetBPM: 120 },
                  { duration: 45, intensity: 'Power Set', targetBPM: 160 },
                  { duration: 180, intensity: 'Recovery', targetBPM: 120 },
                  { duration: 300, intensity: 'Cool-down', targetBPM: 100 }
                ]
              },
              trainingType: 'physical' as const
            }
          },
          // Hybrid Workout
          {
            id: '5',
            title: `${teamId ? getTeamName(teamId) : 'Team'} Circuit Training`,
            type: 'training' as const,
            startTime: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
            location: 'Training Center',
            teamId: teamId || 'a-team',
            status: 'scheduled' as const,
            visibility: 'team' as const,
            createdBy: 'trainer-1',
            organizationId: 'org-123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
              workoutId: 'hybrid-001',
              workoutType: 'HYBRID',
              hybridWorkout: {
                id: 'hybrid-001',
                name: 'Hockey Circuit Training',
                blocks: [
                  { type: 'exercise', name: 'Upper Body Power', duration: 15 },
                  { type: 'interval', name: 'Bike Sprints', duration: 4 },
                  { type: 'exercise', name: 'Lower Body Strength', duration: 15 },
                  { type: 'interval', name: 'Rowing Finisher', duration: 6 }
                ]
              },
              trainingType: 'hybrid' as const
            }
          },
          // Agility Session
          {
            id: '6',
            title: `${teamId ? getTeamName(teamId) : 'Team'} Agility Training`,
            type: 'training' as const,
            startTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
            location: 'Field House',
            teamId: teamId || 'a-team',
            status: 'scheduled' as const,
            visibility: 'team' as const,
            createdBy: 'trainer-1',
            organizationId: 'org-123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
              workoutType: 'AGILITY',
              agilitySession: {
                drills: [
                  { id: 'agility-001', name: '5-10-5 Pro Agility', duration: 30 },
                  { id: 'agility-003', name: 'T-Drill', duration: 45 },
                  { id: 'agility-009', name: 'Ladder Complex', duration: 30 }
                ],
                totalDuration: 60,
                focus: 'change-of-direction'
              },
              trainingType: 'agility' as const
            }
          }
        ];
        
        return baseEvents;
      };
      
      const getTeamName = (teamId: string): string => {
        const names: Record<string, string> = {
          'a-team': 'A-Team',
          'j20': 'J20',
          'u18': 'U18',
          'u16': 'U16',
          'womens': "Women's Team"
        };
        return names[teamId] || 'Team';
      };
      
      let events;
      if (!teamId || teamId === 'all') {
        // Show events from all teams
        events = [
          ...generateTeamEvents('a-team'),
          ...generateTeamEvents('j20').map(e => ({ ...e, id: `j20-${e.id}` })),
          ...generateTeamEvents('u18').map(e => ({ ...e, id: `u18-${e.id}` }))
        ];
      } else if (teamId === 'personal') {
        // Show personal training sessions
        events = [
          {
            id: 'personal-1',
            title: 'Sidney Crosby - Recovery Session',
            type: 'training' as const,
            startTime: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
            location: 'Therapy Room',
            status: 'scheduled' as const,
            visibility: 'private' as const,
            createdBy: 'trainer-1',
            organizationId: 'org-123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
              workoutId: 'workout-recovery-001',
              intervalProgram: {
                id: 'interval-recovery-001',
                name: 'Injury Recovery Protocol',
                totalDuration: 3600, // 60 minutes
                intervals: [
                  { duration: 600, intensity: 'Light Warm-up', targetBPM: 100 },
                  { duration: 300, intensity: 'Mobility Work', targetBPM: 90 },
                  { duration: 20, intensity: 'Light Activity', targetBPM: 120 },
                  { duration: 100, intensity: 'Rest', targetBPM: 90 },
                  { duration: 20, intensity: 'Light Activity', targetBPM: 120 },
                  { duration: 100, intensity: 'Rest', targetBPM: 90 },
                  { duration: 300, intensity: 'Stretching', targetBPM: 85 }
                ]
              },
              trainingType: 'recovery' as const,
              playerRestrictions: ['Upper body - no contact', 'No overhead movements']
            }
          }
        ];
      } else {
        // Show events for specific team
        events = generateTeamEvents(teamId);
      }
      
      return { data: { data: events } };
      }
    }

    // Notification endpoints
    if (url.includes('/communication/notifications') || url.includes('/notifications')) {
      // Get notifications list
      if (method === 'GET' && (url.endsWith('/notifications') || url.includes('/communication/notifications'))) {
        return {
          data: {
            notifications: mockNotificationData.notifications,
            total: mockNotificationData.notifications.length,
            unreadCount: mockNotificationData.unreadCount
          }
        };
      }
      
      // Get notification stats
      if (url.includes('/stats')) {
        return {
          data: mockNotificationData.stats
        };
      }
      
      // Get unread count
      if (url.includes('/unread-count')) {
        return {
          data: {
            count: mockNotificationData.unreadCount
          }
        };
      }
      
      // Mark as read
      if (method === 'PUT' && url.includes('/read')) {
        return { data: { success: true } };
      }
      
      // Delete notification
      if (method === 'DELETE') {
        return { data: { success: true } };
      }
    }

    // Other player endpoints (with paths)
    if (url.includes('players')) {
      if (url.includes('/overview')) {
        return { 
          data: {
            player: {
              id: '1',
              name: 'Test Player',
              team: 'Hockey Hub Team',
              position: 'Forward',
              jerseyNumber: 99,
            },
            stats: {
              goals: 15,
              assists: 22,
              points: 37,
              plusMinus: 12,
            },
            wellness: {
              hrv: 65,
              sleepQuality: 8,
              fatigue: 3,
              mood: 9,
            },
          }
        };
      }
      if (url.includes('/wellness') && method === 'POST') {
        return { data: { success: true, message: 'Wellness data submitted' } };
      }
      if (url.includes('/training/complete') && method === 'POST') {
        return { data: { success: true, message: 'Training marked as complete' } };
      }
    }

    // Training endpoints - handle both with and without /training prefix
    if (url.includes('/training') || url.includes('/sessions') || url.includes('/tests') || url.includes('/test-sessions') || url.includes('/exercises') || url.includes('/templates') || url.includes('/test-batches') || url.includes('/hybrid-workouts') || url.includes('/agility-drills') || url.includes('/conditioning-workouts') || url.includes('/agility-workouts') || url.includes('/workouts')) {
      // Handle recent workouts endpoint
      if (url.includes('/workouts/recent')) {
        return { data: mockRecentWorkouts };
      }
      
      // Find matching handler
      let trainingEndpoint = url;
      // Remove various possible prefixes
      trainingEndpoint = trainingEndpoint.replace('/api/training', '');
      trainingEndpoint = trainingEndpoint.replace('/training', '');
      trainingEndpoint = trainingEndpoint.replace('/api', '');
      
      // Ensure endpoint starts with /
      if (!trainingEndpoint.startsWith('/')) {
        trainingEndpoint = '/' + trainingEndpoint;
      }
      
      // Remove query string for handler matching
      const localCleanEndpoint = trainingEndpoint.split('?')[0];
      const queryParams = params || {};
      
      // Handle exercises endpoint
      if (localCleanEndpoint.includes('/exercises')) {
        if (method === 'GET' && localCleanEndpoint === '/exercises') {
          const mockExercises = [
            {
              id: 'ex-001',
              name: 'Back Squat',
              category: 'strength',
              phase: 'main',
              sets: 4,
              reps: 8,
              restBetweenSets: 90,
              equipment: ['barbell', 'squat-rack'],
              notes: 'Keep chest up, drive through heels',
              videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8',
              orderIndex: 1,
              intensity: 'high',
              difficulty: 'intermediate'
            },
            {
              id: 'ex-002',
              name: 'Bench Press',
              category: 'strength',
              phase: 'main',
              sets: 4,
              reps: 10,
              restBetweenSets: 90,
              equipment: ['barbell', 'bench'],
              notes: 'Lower with control, press explosively',
              videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
              orderIndex: 2,
              intensity: 'high',
              difficulty: 'intermediate'
            },
            {
              id: 'ex-003',
              name: 'Romanian Deadlift',
              category: 'strength',
              phase: 'main',
              sets: 3,
              reps: 12,
              restBetweenSets: 60,
              equipment: ['barbell'],
              notes: 'Focus on hip hinge, slight knee bend',
              videoUrl: null,
              orderIndex: 3,
              intensity: 'medium',
              difficulty: 'intermediate'
            },
            {
              id: 'ex-004',
              name: 'Pull-ups',
              category: 'strength',
              phase: 'main',
              sets: 3,
              reps: 8,
              restBetweenSets: 90,
              equipment: ['pull-up-bar'],
              notes: 'Full range of motion, control the negative',
              videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
              orderIndex: 4,
              difficulty: 'advanced',
              intensity: 'medium'
            },
            {
              id: 'ex-005',
              name: 'Box Jumps',
              category: 'agility',
              phase: 'main',
              sets: 4,
              reps: 6,
              restBetweenSets: 60,
              equipment: ['jump-box'],
              notes: 'Land softly, step down between reps',
              videoUrl: null,
              orderIndex: 5,
              intensity: 'high',
              difficulty: 'intermediate'
            },
            {
              id: 'ex-006',
              name: 'Medicine Ball Slams',
              category: 'conditioning',
              phase: 'main',
              sets: 3,
              duration: 30,
              restBetweenSets: 30,
              equipment: ['medicine-ball'],
              notes: 'Full body explosive movement',
              videoUrl: 'https://www.youtube.com/watch?v=Rx9er0kcnAk',
              orderIndex: 6,
              intensity: 'high',
              difficulty: 'intermediate'
            },
            {
              id: 'ex-007',
              name: 'Foam Rolling',
              category: 'recovery',
              phase: 'cooldown',
              duration: 600,
              equipment: ['foam-roller'],
              notes: 'Focus on tight areas, breathe deeply',
              videoUrl: null,
              orderIndex: 7,
              intensity: 'low',
              difficulty: 'beginner'
            },
            {
              id: 'ex-008',
              name: 'Dynamic Stretching',
              category: 'mobility',
              phase: 'warmup',
              duration: 300,
              equipment: ['mat'],
              notes: 'Full body dynamic warm-up routine',
              videoUrl: 'https://www.youtube.com/watch?v=RoHBDim_fzk',
              orderIndex: 8,
              intensity: 'low',
              difficulty: 'beginner'
            },
            // Warmup exercises
            {
              id: 'ex-009',
              name: 'Arm Circles',
              category: 'mobility',
              phase: 'warmup',
              duration: 60,
              equipment: [],
              notes: 'Forward and backward, gradually increasing speed',
              videoUrl: null,
              orderIndex: 9,
              intensity: 'low',
              difficulty: 'beginner'
            },
            {
              id: 'ex-010',
              name: 'Leg Swings',
              category: 'mobility',
              phase: 'warmup',
              sets: 2,
              reps: 15,
              equipment: [],
              notes: 'Forward/back and side to side, hold wall for balance',
              videoUrl: null,
              orderIndex: 10,
              intensity: 'low',
              difficulty: 'beginner'
            },
            {
              id: 'ex-011',
              name: 'Light Jogging',
              category: 'conditioning',
              phase: 'warmup',
              duration: 300,
              equipment: [],
              notes: 'Easy pace to raise heart rate',
              videoUrl: null,
              orderIndex: 11,
              intensity: 'low',
              difficulty: 'beginner'
            },
            {
              id: 'ex-012',
              name: 'High Knees',
              category: 'agility',
              phase: 'warmup',
              duration: 45,
              equipment: [],
              notes: 'Drive knees up, maintain good posture',
              videoUrl: null,
              orderIndex: 12,
              intensity: 'medium',
              difficulty: 'beginner'
            },
            // More main exercises
            {
              id: 'ex-013',
              name: 'Dumbbell Rows',
              category: 'strength',
              phase: 'main',
              sets: 3,
              reps: 12,
              restBetweenSets: 60,
              equipment: ['dumbbells'],
              notes: 'Keep core tight, pull to hip',
              videoUrl: null,
              orderIndex: 13,
              intensity: 'medium',
              difficulty: 'intermediate'
            },
            {
              id: 'ex-014',
              name: 'Lunges',
              category: 'strength',
              phase: 'main',
              sets: 3,
              reps: 10,
              restBetweenSets: 60,
              equipment: ['dumbbells'],
              notes: 'Alternate legs, keep torso upright',
              videoUrl: null,
              orderIndex: 14,
              intensity: 'medium',
              difficulty: 'beginner'
            },
            // Cooldown exercises
            {
              id: 'ex-015',
              name: 'Static Hamstring Stretch',
              category: 'mobility',
              phase: 'cooldown',
              duration: 90,
              equipment: ['mat'],
              notes: 'Hold each leg for 45 seconds',
              videoUrl: null,
              orderIndex: 15,
              intensity: 'low',
              difficulty: 'beginner'
            },
            {
              id: 'ex-016',
              name: 'Child\'s Pose',
              category: 'recovery',
              phase: 'cooldown',
              duration: 120,
              equipment: ['mat'],
              notes: 'Breathe deeply, relax shoulders',
              videoUrl: null,
              orderIndex: 16,
              intensity: 'low',
              difficulty: 'beginner'
            },
            {
              id: 'ex-017',
              name: 'Walking',
              category: 'recovery',
              phase: 'cooldown',
              duration: 300,
              equipment: [],
              notes: 'Easy pace to bring heart rate down',
              videoUrl: null,
              orderIndex: 17,
              intensity: 'low',
              difficulty: 'beginner'
            },
            {
              id: 'ex-018',
              name: 'Quad Stretch',
              category: 'mobility',
              phase: 'cooldown',
              duration: 90,
              equipment: [],
              notes: 'Standing, hold each leg for 45 seconds',
              videoUrl: null,
              orderIndex: 18,
              intensity: 'low',
              difficulty: 'beginner'
            }
          ];

          // Filter by category if provided
          const category = queryParams.category;
          const search = queryParams.search;
          
          let filteredExercises = mockExercises;
          
          if (category) {
            filteredExercises = filteredExercises.filter(ex => ex.category === category);
          }
          
          if (search) {
            const searchLower = search.toLowerCase();
            filteredExercises = filteredExercises.filter(ex => 
              ex.name.toLowerCase().includes(searchLower) ||
              ex.category.toLowerCase().includes(searchLower) ||
              ex.notes?.toLowerCase().includes(searchLower)
            );
          }

          return { 
            data: { 
              exercises: filteredExercises 
            } 
          };
        }
      }
      
      // Handle hybrid workouts
      if (localCleanEndpoint.includes('/hybrid-workouts')) {
        if (method === 'GET' && localCleanEndpoint === '/hybrid-workouts') {
          return { data: mockHybridWorkouts };
        }
        if (method === 'GET' && localCleanEndpoint.match(/\/hybrid-workouts\/([\w-]+)$/)) {
          const workoutId = localCleanEndpoint.split('/').pop();
          const workout = mockHybridWorkouts.find(w => w.id === workoutId);
          if (workout) {
            return { data: workout };
          }
          return { error: { status: 404, data: { message: 'Hybrid workout not found' } } };
        }
        if (method === 'POST' && localCleanEndpoint === '/hybrid-workouts') {
          const newWorkout = {
            id: `hybrid-${Date.now()}`,
            ...body,
            createdAt: new Date().toISOString()
          };
          mockHybridWorkouts.push(newWorkout);
          return { data: newWorkout };
        }
      }
      
      // Handle agility drills
      if (localCleanEndpoint.includes('/agility-drills')) {
        if (method === 'GET' && localCleanEndpoint === '/agility-drills') {
          let drills = [...mockAgilityDrills];
          
          // Filter by category if provided
          if (queryParams.category) {
            drills = drills.filter(d => d.category === queryParams.category);
          }
          
          // Filter by search if provided
          if (queryParams.search) {
            const searchLower = queryParams.search.toLowerCase();
            drills = drills.filter(d => 
              d.name.toLowerCase().includes(searchLower) ||
              d.description.toLowerCase().includes(searchLower) ||
              d.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
          }
          
          return { data: drills };
        }
        if (method === 'GET' && localCleanEndpoint.match(/\/agility-drills\/([\w-]+)$/)) {
          const drillId = localCleanEndpoint.split('/').pop();
          const drill = mockAgilityDrills.find(d => d.id === drillId);
          if (drill) {
            return { data: drill };
          }
          return { error: { status: 404, data: { message: 'Agility drill not found' } } };
        }
        if (method === 'POST' && localCleanEndpoint === '/agility-drills') {
          const newDrill = {
            id: `agility-${Date.now()}`,
            ...body,
            createdAt: new Date().toISOString()
          };
          mockAgilityDrills.push(newDrill);
          return { data: newDrill };
        }
      }
      
      // Handle conditioning workouts
      if (localCleanEndpoint.includes('/conditioning-workouts')) {
        if (method === 'GET' && localCleanEndpoint === '/conditioning-workouts') {
          // Return conditioning workouts
          const conditioningWorkouts = mockHybridWorkouts.filter(w => w.type === 'CONDITIONING');
          return { data: conditioningWorkouts };
        }
        if (method === 'GET' && localCleanEndpoint.match(/\/conditioning-workouts\/([\w-]+)$/)) {
          const workoutId = localCleanEndpoint.split('/').pop();
          const workout = mockHybridWorkouts.find(w => w.id === workoutId && w.type === 'CONDITIONING');
          if (workout) {
            return { data: workout };
          }
          return { error: { status: 404, data: { message: 'Conditioning workout not found' } } };
        }
        if (method === 'POST' && localCleanEndpoint === '/conditioning-workouts') {
          const newWorkout = {
            id: `conditioning-${Date.now()}`,
            type: 'conditioning',
            status: 'scheduled',
            estimatedDuration: body.intervalProgram?.totalDuration || 60,
            ...body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return { data: newWorkout };
        }
        if (method === 'PUT' && localCleanEndpoint.match(/\/conditioning-workouts\/([\w-]+)$/)) {
          const workoutId = localCleanEndpoint.split('/').pop();
          const updatedWorkout = {
            id: workoutId,
            ...body,
            updatedAt: new Date().toISOString()
          };
          return { data: updatedWorkout };
        }
      }
      
      // Handle agility workouts (different from agility drills)
      if (localCleanEndpoint.includes('/agility-workouts')) {
        if (method === 'GET' && localCleanEndpoint === '/agility-workouts') {
          const agilityWorkouts = mockAgilityDrills.map(drill => ({
            id: `agility-workout-${drill.id}`,
            title: drill.name,
            type: 'agility',
            workoutType: 'AGILITY',
            status: 'scheduled',
            scheduledDate: new Date().toISOString(),
            estimatedDuration: drill.duration || 45,
            location: 'Field House',
            agilityProgram: {
              drills: [drill],
              totalDuration: drill.duration || 45,
              warmupDuration: 10,
              cooldownDuration: 10
            }
          }));
          return { data: agilityWorkouts };
        }
        if (method === 'GET' && localCleanEndpoint.match(/\/agility-workouts\/([\w-]+)$/)) {
          const workoutId = localCleanEndpoint.split('/').pop();
          // Mock finding an agility workout
          return { 
            data: {
              id: workoutId,
              title: 'Agility Training Session',
              type: 'agility',
              workoutType: 'AGILITY',
              status: 'scheduled',
              scheduledDate: new Date().toISOString(),
              estimatedDuration: 60,
              location: 'fieldHouse',
              agilityProgram: {
                drills: mockAgilityDrills.slice(0, 3),
                totalDuration: 60,
                warmupDuration: 10,
                cooldownDuration: 10
              }
            } 
          };
        }
        if (method === 'POST' && localCleanEndpoint === '/agility-workouts') {
          const newWorkout = {
            id: `agility-workout-${Date.now()}`,
            type: 'agility',
            workoutType: 'AGILITY',
            status: 'scheduled',
            estimatedDuration: body.agilityProgram?.totalDuration || 60,
            ...body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return { data: newWorkout };
        }
        if (method === 'PUT' && localCleanEndpoint.match(/\/agility-workouts\/([\w-]+)$/)) {
          const workoutId = localCleanEndpoint.split('/').pop();
          const updatedWorkout = {
            id: workoutId,
            ...body,
            updatedAt: new Date().toISOString()
          };
          return { data: updatedWorkout };
        }
      }
      
      // Handle performance data
      if (localCleanEndpoint.includes('/performance')) {
        if (localCleanEndpoint.includes('/hybrid') && method === 'GET') {
          let performances = [...mockPerformanceData.hybrid];
          
          if (queryParams.playerId) {
            performances = performances.filter(p => p.playerId === queryParams.playerId);
          }
          if (queryParams.workoutId) {
            performances = performances.filter(p => p.workoutId === queryParams.workoutId);
          }
          
          return { data: performances };
        }
        if (localCleanEndpoint.includes('/agility') && method === 'GET') {
          let performances = [...mockPerformanceData.agility];
          
          if (queryParams.playerId) {
            performances = performances.filter(p => p.playerId === queryParams.playerId);
          }
          if (queryParams.drillId) {
            performances = performances.filter(p => p.drillId === queryParams.drillId);
          }
          
          return { data: performances };
        }
        if (method === 'POST') {
          const type = localCleanEndpoint.includes('/hybrid') ? 'hybrid' : 'agility';
          const newPerformance = {
            ...body,
            date: new Date().toISOString()
          };
          mockPerformanceData[type].push(newPerformance);
          return { data: newPerformance };
        }
      }
      
      // Handle equipment configurations
      if (localCleanEndpoint.includes('/equipment-config')) {
        if (method === 'GET') {
          const type = queryParams.type || 'all';
          if (type === 'all') {
            return { data: mockEquipmentConfigs };
          }
          if (mockEquipmentConfigs[type]) {
            return { data: mockEquipmentConfigs[type] };
          }
          return { error: { status: 404, data: { message: 'Equipment configuration not found' } } };
        }
      }
      
      // Check for specific training endpoints
      const handlerKey = `${method} ${localCleanEndpoint}`;
      const handler = trainingMockHandlers[handlerKey] || trainingMockHandlers[`${method} ${localCleanEndpoint.replace(/\/[^/]+$/, '/:id')}`];
      
      // Log for debugging test-sessions
      if (localCleanEndpoint.includes('test-sessions')) {
        console.log('Looking for handler:', handlerKey);
        console.log('Available handlers:', Object.keys(trainingMockHandlers).filter(k => k.includes('test-sessions')));
      }
      
      if (handler) {
        try {
          const result = handler(method === 'GET' ? queryParams : body, { id: localCleanEndpoint.split('/').pop() });
          return { data: result };
        } catch (error) {
          return { error: { status: 400, data: { message: error.message } } };
        }
      }
    }

    // Events endpoints
    if (url.includes('/events')) {
      if (url.includes('/upcoming')) {
        return {
          data: {
            events: [
              {
                id: '1',
                title: 'Team Practice',
                date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                time: '10:00 AM',
                type: 'practice',
                location: 'Main Rink',
                team: 'Senior Team'
              },
              {
                id: '2',
                title: 'Strength Training',
                date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
                time: '2:00 PM',
                type: 'training',
                location: 'gym',
                team: 'Senior Team'
              },
              {
                id: '3',
                title: 'Game vs Rivals',
                date: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
                time: '7:00 PM',
                type: 'game',
                location: 'Home Arena',
                team: 'Senior Team'
              }
            ],
            total: 3
          }
        };
      }
    }

    // Calendar endpoints
    if (url.includes('/calendar')) {
      return {
        data: {
          events: [
            {
              id: '1',
              title: 'Team Practice',
              start: new Date().toISOString(),
              end: new Date(Date.now() + 7200000).toISOString(),
              type: 'practice',
              location: 'Main Rink',
            },
          ],
          total: 1,
        }
      };
    }

    // Medical endpoints
    if (url.includes('/medical')) {
      // Team medical statistics
      if (url.includes('/team/stats') || cleanEndpoint === '/team/stats') {
        return { data: mockTeamMedicalStats };
      }

      // Player medical overview
      if (url.match(/\/players\/(\d+|player-\d+)\/overview/)) {
        const playerId = url.match(/\/players\/([\w-]+)\/overview/)?.[1];
        const playerKey = playerId?.startsWith('player-') ? playerId : `player-00${playerId}`;
        
        const medicalData = mockMedicalData[playerKey];
        if (medicalData) {
          return { data: medicalData };
        }
        
        // Return empty medical data for other players
        return {
          data: {
            player_id: parseInt(playerId) || 1,
            player_name: 'Unknown Player',
            current_injuries: [],
            injury_history: [],
            recent_treatments: [],
            medical_clearance: true,
            last_assessment_date: new Date().toISOString(),
          }
        };
      }

      // Get all injuries
      if (url === '/medical/injuries' || url.endsWith('/injuries')) {
        return { data: mockAllInjuries };
      }

      // Get active injuries
      if (url.includes('/injuries/active')) {
        return { data: mockActiveInjuries };
      }

      // Create injury
      if (url.includes('/injuries') && method === 'POST') {
        const newInjury = {
          id: Date.now(),
          ...body,
        };
        mockActiveInjuries.push(newInjury);
        return { data: newInjury };
      }

      // Update injury
      if (url.match(/\/injuries\/\d+/) && method === 'PUT') {
        const injuryId = parseInt(url.match(/\/injuries\/(\d+)/)?.[1] || '0');
        const injuryIndex = mockActiveInjuries.findIndex(i => i.id === injuryId);
        if (injuryIndex !== -1) {
          mockActiveInjuries[injuryIndex] = body;
          return { data: body };
        }
        return { error: { status: 404, data: { message: 'Injury not found' } } };
      }

      // Get treatments for an injury
      if (url.match(/\/injuries\/\d+\/treatments/)) {
        const injuryId = parseInt(url.match(/\/injuries\/(\d+)\/treatments/)?.[1] || '0');
        const allTreatments = [
          ...mockMedicalData['player-005'].recent_treatments,
          ...mockMedicalData['player-003'].recent_treatments,
        ];
        const treatments = allTreatments.filter(t => t.injury_id === injuryId);
        return { data: treatments };
      }

      // Create treatment
      if (url.includes('/treatments') && method === 'POST') {
        const newTreatment = {
          id: Date.now(),
          ...body,
        };
        return { data: newTreatment };
      }

      // Medical reports
      if (url.match(/\/players\/(\d+|player-\d+)\/reports/)) {
        return {
          data: [
            {
              id: 1,
              player_id: parseInt(url.match(/\/players\/(\d+)/)?.[1] || '1'),
              report_date: new Date().toISOString(),
              report_type: 'Physical Assessment',
              summary: 'Player is in good physical condition with minor restrictions.',
              recommendations: 'Continue current treatment plan. Re-evaluate in 1 week.',
            },
          ]
        };
      }

      // Create medical report
      if (url.includes('/reports') && method === 'POST') {
        const newReport = {
          id: Date.now(),
          ...body,
        };
        return { data: newReport };
      }

      // Medical documents
      if (url.includes('/documents')) {
        return {
          data: [
            {
              id: '1',
              name: 'Medical Clearance Form',
              type: 'clearance',
              uploadDate: new Date().toISOString(),
            },
          ]
        };
      }

      // Document signed URL
      if (url.match(/\/documents\/[\w-]+\/signed-url/)) {
        return {
          data: {
            url: 'https://example.com/mock-signed-url',
          }
        };
      }
    }

    // Facility endpoints
    if (cleanEndpoint.includes('/facilities')) {
      // Mock facilities data
      const mockFacilities = [
        {
          id: 'facility-001',
          name: 'Main Training Center',
          type: 'gym',
          organizationId: 'org-001',
          location: 'Building A, Floor 2',
          capacity: 50,
          equipment: ['dumbbells', 'barbells', 'squat-racks', 'benches', 'cardio-machines'],
          availability: 'available',
          amenities: ['showers', 'lockers', 'water-fountain', 'parking'],
          schedule: [
            { dayOfWeek: 1, openTime: '06:00', closeTime: '22:00' },
            { dayOfWeek: 2, openTime: '06:00', closeTime: '22:00' },
            { dayOfWeek: 3, openTime: '06:00', closeTime: '22:00' },
            { dayOfWeek: 4, openTime: '06:00', closeTime: '22:00' },
            { dayOfWeek: 5, openTime: '06:00', closeTime: '20:00' },
            { dayOfWeek: 6, openTime: '08:00', closeTime: '18:00' },
            { dayOfWeek: 0, openTime: '08:00', closeTime: '16:00' }
          ],
          bookingRules: {
            minDuration: 30,
            maxDuration: 180,
            advanceBookingDays: 30,
            allowOverlapping: false
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'facility-002',
          name: 'Ice Rink 1',
          type: 'ice_rink',
          organizationId: 'org-001',
          location: 'Arena Complex, Rink 1',
          capacity: 100,
          equipment: ['goals', 'boards', 'zamboni'],
          availability: 'partially_booked',
          amenities: ['team-benches', 'penalty-boxes', 'scoreboard', 'locker-rooms'],
          schedule: [
            { dayOfWeek: 1, openTime: '05:00', closeTime: '23:00' },
            { dayOfWeek: 2, openTime: '05:00', closeTime: '23:00' },
            { dayOfWeek: 3, openTime: '05:00', closeTime: '23:00' },
            { dayOfWeek: 4, openTime: '05:00', closeTime: '23:00' },
            { dayOfWeek: 5, openTime: '05:00', closeTime: '23:00' },
            { dayOfWeek: 6, openTime: '06:00', closeTime: '22:00' },
            { dayOfWeek: 0, openTime: '06:00', closeTime: '22:00' }
          ],
          bookingRules: {
            minDuration: 60,
            maxDuration: 120,
            advanceBookingDays: 60,
            allowOverlapping: false
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'facility-003',
          name: 'Field House',
          type: 'field',
          organizationId: 'org-001',
          location: 'Outdoor Complex',
          capacity: 200,
          equipment: ['cones', 'agility-ladders', 'hurdles', 'sleds'],
          availability: 'available',
          amenities: ['track', 'turf-field', 'equipment-storage'],
          schedule: [
            { dayOfWeek: 1, openTime: '07:00', closeTime: '21:00' },
            { dayOfWeek: 2, openTime: '07:00', closeTime: '21:00' },
            { dayOfWeek: 3, openTime: '07:00', closeTime: '21:00' },
            { dayOfWeek: 4, openTime: '07:00', closeTime: '21:00' },
            { dayOfWeek: 5, openTime: '07:00', closeTime: '21:00' },
            { dayOfWeek: 6, openTime: '08:00', closeTime: '20:00' },
            { dayOfWeek: 0, openTime: '08:00', closeTime: '20:00' }
          ],
          bookingRules: {
            minDuration: 60,
            maxDuration: 240,
            advanceBookingDays: 45,
            allowOverlapping: true
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      // Get facilities
      if (method === 'GET' && cleanEndpoint === '/facilities') {
        const organizationId = (params as any)?.organizationId || 'org-001';
        const type = (params as any)?.type;
        
        let facilities = mockFacilities.filter(f => f.organizationId === organizationId);
        
        if (type) {
          facilities = facilities.filter(f => f.type === type);
        }
        
        return {
          data: {
            data: facilities,
            total: facilities.length,
            page: 1,
            limit: 10
          }
        };
      }

      // Get single facility
      if (method === 'GET' && cleanEndpoint.match(/\/facilities\/([\w-]+)$/)) {
        const facilityId = cleanEndpoint.split('/').pop();
        const facility = mockFacilities.find(f => f.id === facilityId);
        
        if (facility) {
          return { data: facility };
        }
        
        return {
          error: {
            status: 404,
            data: { message: 'Facility not found' }
          }
        };
      }

      // Check facility availability
      if (cleanEndpoint === '/facilities/check-availability') {
        const { facilityId, startTime, endTime } = (params as any) || {};
        
        // Mock availability check
        const conflicts = Math.random() > 0.7 ? [
          {
            id: 'booking-001',
            facilityId,
            eventId: 'event-001',
            startTime: startTime,
            endTime: endTime,
            purpose: 'Team Practice',
            bookedBy: 'user-001',
            teamId: 'team-001',
            status: 'confirmed'
          }
        ] : [];
        
        return {
          data: {
            isAvailable: conflicts.length === 0,
            conflicts,
            suggestedTimes: conflicts.length > 0 ? [
              {
                startTime: new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(new Date(endTime).getTime() + 2 * 60 * 60 * 1000).toISOString()
              },
              {
                startTime: new Date(new Date(startTime).getTime() - 2 * 60 * 60 * 1000).toISOString(),
                endTime: new Date(new Date(endTime).getTime() - 2 * 60 * 60 * 1000).toISOString()
              }
            ] : []
          }
        };
      }

      // Create facility
      if (method === 'POST' && cleanEndpoint === '/facilities') {
        const newFacility = {
          id: `facility-${Date.now()}`,
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        return { data: newFacility };
      }

      // Create booking
      if (method === 'POST' && cleanEndpoint === '/bookings') {
        const newBooking = {
          id: `booking-${Date.now()}`,
          ...body,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        return { data: newBooking };
      }
    }

    // Template sharing endpoints
    if (cleanEndpoint.includes('/templates/') && cleanEndpoint.includes('/share')) {
      const templateId = cleanEndpoint.split('/templates/')[1].split('/')[0];
      
      if (method === 'POST') {
        // Share template
        const { recipients, permission, message, expiresAt, allowPublicLink, notifyRecipients } = body;
        
        const shareInfo = {
          id: `share_${Date.now()}`,
          templateId,
          sharedBy: 'current_user',
          sharedWith: recipients.map((r: any) => ({
            id: r.id,
            type: r.type,
            name: r.name,
            permission
          })),
          permission,
          sharedAt: new Date(),
          expiresAt,
          publicLink: allowPublicLink ? `https://hockeyhub.com/shared/template/${templateId}` : undefined,
          message,
          stats: {
            views: 0,
            uses: 0,
            lastAccessed: null
          }
        };
        
        return { data: { success: true, shareInfo } };
      }
    }

    // Get shared templates
    if (cleanEndpoint === '/templates/shared-with-me') {
      const sharedTemplates = [
        {
          id: 'shared1',
          name: 'Elite Power Development',
          description: 'High-intensity power workout for elite players',
          category: 'strength',
          tags: ['power', 'elite', 'explosive'],
          exercises: [],
          createdBy: 'coach_wilson',
          sharedBy: 'Coach Wilson',
          permission: 'viewer',
          createdAt: new Date('2024-12-15'),
          updatedAt: new Date('2024-12-20'),
          isPublic: false,
          usageCount: 45,
          rating: 4.8,
          type: 'strength',
          categoryIds: [],
          duration: 75,
          difficulty: 'advanced',
          equipment: ['barbell', 'dumbbells', 'bench'],
          version: 1,
          workoutData: {}
        },
        {
          id: 'shared2',
          name: 'Pre-Season Conditioning',
          description: 'Complete conditioning program for pre-season preparation',
          category: 'conditioning',
          tags: ['cardio', 'endurance', 'pre-season'],
          exercises: [],
          createdBy: 'trainer_garcia',
          sharedBy: 'Trainer Garcia',
          permission: 'collaborator',
          createdAt: new Date('2024-11-10'),
          updatedAt: new Date('2024-12-18'),
          isPublic: false,
          usageCount: 67,
          rating: 4.9,
          type: 'conditioning',
          categoryIds: [],
          duration: 45,
          difficulty: 'intermediate',
          equipment: ['rowing-machine', 'bike', 'cones'],
          version: 1,
          workoutData: {}
        },
        {
          id: 'shared3',
          name: 'Speed & Agility Drills',
          description: 'Comprehensive agility training with proven hockey drills',
          category: 'agility',
          tags: ['speed', 'agility', 'hockey-specific'],
          exercises: [],
          createdBy: 'coach_martinez',
          sharedBy: 'Coach Martinez',
          permission: 'viewer',
          createdAt: new Date('2024-12-01'),
          updatedAt: new Date('2024-12-15'),
          isPublic: false,
          usageCount: 23,
          rating: 4.6,
          type: 'agility',
          categoryIds: [],
          duration: 30,
          difficulty: 'intermediate',
          equipment: ['cones', 'ladder', 'hurdles'],
          version: 1,
          workoutData: {}
        }
      ];
      
      return { data: { success: true, templates: sharedTemplates } };
    }

    // Search recipients for sharing
    if (cleanEndpoint === '/templates/search-recipients') {
      const { query } = queryParams;
      
      const allRecipients = [
        {
          id: 'user1',
          type: 'user',
          name: 'Coach Johnson',
          email: 'johnson@team.com',
          avatarUrl: '/avatars/johnson.jpg'
        },
        {
          id: 'user2',
          type: 'user',
          name: 'Coach Smith',
          email: 'smith@team.com',
          avatarUrl: '/avatars/smith.jpg'
        },
        {
          id: 'user3',
          type: 'user',
          name: 'Trainer Garcia',
          email: 'garcia@team.com',
          avatarUrl: '/avatars/garcia.jpg'
        },
        {
          id: 'team1',
          type: 'team',
          name: 'U18 Coaching Staff',
          avatarUrl: '/teams/u18.jpg'
        },
        {
          id: 'team2',
          type: 'team',
          name: 'Senior Team Trainers',
          avatarUrl: '/teams/senior.jpg'
        },
        {
          id: 'org1',
          type: 'organization',
          name: 'Hockey Club Training Department'
        }
      ];
      
      const filteredRecipients = query 
        ? allRecipients.filter(recipient => 
            recipient.name.toLowerCase().includes(query.toLowerCase()) ||
            (recipient.email && recipient.email.toLowerCase().includes(query.toLowerCase()))
          )
        : allRecipients;
      
      return { data: filteredRecipients };
    }

    // Generate public link
    if (cleanEndpoint.includes('/templates/') && cleanEndpoint.includes('/public-link')) {
      const templateId = cleanEndpoint.split('/templates/')[1].split('/')[0];
      
      if (method === 'POST') {
        const { expiresIn } = body;
        
        const link = `https://hockeyhub.com/public/template/${templateId}?token=${Date.now()}`;
        const expiresAt = expiresIn 
          ? new Date(Date.now() + expiresIn * 60 * 60 * 1000)
          : undefined;
        
        return { 
          data: { 
            success: true, 
            link,
            expiresAt
          }
        };
      }
    }

    // Get share statistics
    if (cleanEndpoint.includes('/templates/') && cleanEndpoint.includes('/stats')) {
      const templateId = cleanEndpoint.split('/templates/')[1].split('/')[0];
      
      const stats = {
        totalShares: 12,
        activeShares: 8,
        totalUses: 156,
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        topUsers: [
          { userId: 'user1', userName: 'Coach Johnson', useCount: 45 },
          { userId: 'user2', userName: 'Coach Smith', useCount: 32 },
          { userId: 'user3', userName: 'Coach Davis', useCount: 28 }
        ]
      };
      
      return { data: { success: true, stats } };
    }

    // Track template usage
    if (cleanEndpoint.includes('/templates/') && cleanEndpoint.includes('/track-usage')) {
      const templateId = cleanEndpoint.split('/templates/')[1].split('/')[0];
      
      if (method === 'POST') {
        const { action } = body;
        
        // Mock tracking - in real implementation this would log to database
        return { data: { success: true, action, templateId } };
      }
    }

    // ========================================================================
    // Validation API Mock Handlers
    // ========================================================================
    
    // Full workout validation
    if (cleanEndpoint === '/validation/workout' && method === 'POST') {
      const { workoutType, data: workoutData, context } = body;
      
      const mockValidationResponse = {
        isValid: true,
        requestId: `val_${Date.now()}`,
        errors: [],
        warnings: [
          {
            code: 'RECOMMENDED_REST',
            message: 'Consider adding more rest between high-intensity intervals',
            field: 'intervalProgram.intervals',
            category: 'PERFORMANCE_LIMIT',
            recommendation: 'Increase rest periods by 30 seconds',
            impact: 'medium',
            dismissible: true
          }
        ],
        suggestions: [
          {
            type: 'optimization',
            title: 'Optimize Rest Periods',
            description: 'Adding 30 seconds rest between intervals can improve performance',
            action: {
              type: 'modify',
              target: 'intervalProgram.intervals',
              value: 'increase_rest_30s'
            },
            priority: 'medium',
            benefit: 'Better recovery and performance'
          }
        ],
        metadata: {
          rulesApplied: ['basic_validation', 'medical_compliance', 'performance_optimization'],
          performance: {
            totalTime: 245,
            breakdown: {
              content_validation: 89,
              medical_check: 78,
              schedule_check: 45,
              performance_analysis: 33
            },
            cacheHitRatio: 0.8
          },
          score: 85,
          confidence: 'high',
          externalServices: ['medical_service', 'calendar_service'],
          engineVersion: '2.1.0'
        },
        timestamp: new Date().toISOString(),
        processingTime: 245
      };
      
      return { data: mockValidationResponse };
    }

    // Content validation
    if (cleanEndpoint === '/validation/content' && method === 'POST') {
      const { workoutType, content } = body;
      
      const mockContentValidation = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: [
          {
            type: 'best_practice',
            title: 'Add Warm-up Phase',
            description: 'Including a proper warm-up reduces injury risk',
            action: {
              type: 'add',
              target: 'exercises',
              value: 'warmup_routine'
            },
            priority: 'high',
            benefit: 'Injury prevention'
          }
        ],
        contentScore: 88
      };
      
      return { data: mockContentValidation };
    }

    // Player assignment validation
    if (cleanEndpoint === '/validation/assignments' && method === 'POST') {
      const { playerIds, teamId } = body;
      
      const mockAssignmentValidation = {
        isValid: true,
        errors: [],
        warnings: [
          {
            code: 'PLAYER_MEDICAL_RESTRICTION',
            message: 'Sidney Crosby has shoulder restrictions',
            field: 'playerIds',
            category: 'MEDICAL_COMPLIANCE',
            recommendation: 'Modify upper body exercises',
            impact: 'high',
            dismissible: false
          }
        ],
        playerSummary: {
          total: playerIds?.length || 0,
          eligible: playerIds?.length - 1 || 0,
          restricted: 1,
          unavailable: 0
        },
        restrictions: [
          {
            playerId: 'player-005',
            playerName: 'Sidney Crosby',
            restrictionType: 'medical',
            severity: 'limiting',
            description: 'Shoulder strain - no overhead movements',
            alternatives: ['Lower body focus', 'Cardio alternatives'],
            expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        suggestions: [
          {
            type: 'medical_safety',
            title: 'Modify Exercises for Restricted Player',
            description: 'Replace upper body exercises with alternatives for Sidney Crosby',
            priority: 'high',
            benefit: 'Safe participation while maintaining fitness'
          }
        ]
      };
      
      return { data: mockAssignmentValidation };
    }

    // Medical compliance validation
    if (cleanEndpoint === '/validation/medical' && method === 'POST') {
      const { playerIds, workoutType, exercises } = body;
      
      const mockMedicalValidation = {
        isCompliant: false,
        overallRisk: 'medium',
        playerRisks: [
          {
            playerId: 'player-005',
            playerName: 'Sidney Crosby',
            riskLevel: 'high',
            conditions: ['Shoulder strain'],
            restrictions: ['No overhead movements', 'Limited upper body load'],
            recommendations: ['Focus on lower body', 'Cardio alternatives'],
            requiresClearance: false
          },
          {
            playerId: 'player-008',
            playerName: 'Nathan MacKinnon',
            riskLevel: 'low',
            conditions: ['Minor ankle sprain (recovering)'],
            restrictions: ['Reduced jumping movements'],
            recommendations: ['Monitor for discomfort'],
            requiresClearance: false
          }
        ],
        exerciseRestrictions: [
          {
            exerciseId: 'exercise-bench-press',
            exerciseName: 'Bench Press',
            restrictionLevel: 'prohibited',
            affectedPlayers: ['player-005'],
            alternatives: ['Leg Press', 'Core Strengthening'],
            modifications: []
          }
        ],
        modifications: [
          {
            playerId: 'player-005',
            exerciseId: 'exercise-bench-press',
            modificationType: 'alternative_exercise',
            description: 'Replace with leg-focused exercises',
            parameters: { intensity: 0.8 }
          }
        ],
        clearances: []
      };
      
      return { data: mockMedicalValidation };
    }

    // Schedule validation
    if (cleanEndpoint === '/validation/schedule' && method === 'POST') {
      const { startDateTime, duration, playerIds } = body;
      
      const mockScheduleValidation = {
        isAvailable: true,
        conflicts: [],
        facilityStatus: {
          available: true,
          capacity: 30,
          currentBookings: 15,
          availableEquipment: ['weights', 'cardio_machines', 'mats'],
          unavailableEquipment: ['boxing_equipment'],
          restrictions: ['No loud music after 8 PM']
        },
        recommendations: [
          {
            type: 'time',
            suggestion: 'Consider starting 30 minutes earlier',
            benefit: 'Better facility availability',
            confidence: 85
          }
        ],
        alternativeSlots: [
          {
            startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
            duration: 90,
            score: 95,
            reasoning: 'Optimal time with full equipment availability'
          }
        ]
      };
      
      return { data: mockScheduleValidation };
    }

    // Field validation
    if (cleanEndpoint === '/validation/field' && method === 'POST') {
      const { field, value, workoutType } = body;
      
      const mockFieldValidation = {
        isValid: true,
        errors: [],
        warnings: []
      };
      
      // Add some field-specific validation logic
      if (field === 'title' && (!value || value.length < 3)) {
        mockFieldValidation.isValid = false;
        mockFieldValidation.errors.push({
          code: 'TITLE_TOO_SHORT',
          message: 'Title must be at least 3 characters long'
        });
      }
      
      if (field === 'duration' && value > 180) {
        mockFieldValidation.warnings.push({
          code: 'LONG_DURATION',
          message: 'Sessions over 3 hours may cause fatigue'
        });
      }
      
      return { data: mockFieldValidation };
    }

    // Progressive validation
    if (cleanEndpoint === '/validation/progressive' && method === 'POST') {
      const { workoutType, currentStep, data: stepData } = body;
      
      const mockProgressiveValidation = {
        currentStep,
        isValid: true,
        canProceed: true,
        errors: [],
        warnings: [],
        nextStepRequirements: ['Complete player assignments', 'Set workout date']
      };
      
      return { data: mockProgressiveValidation };
    }

    // Validation with suggestions
    if (cleanEndpoint === '/validation/with-suggestions' && method === 'POST') {
      const validationResponse = {
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          suggestions: [],
          metadata: {
            rulesApplied: ['basic_validation'],
            performance: { totalTime: 150, breakdown: {} },
            score: 90,
            confidence: 'high',
            engineVersion: '2.1.0'
          },
          timestamp: new Date().toISOString(),
          processingTime: 150
        },
        autoFixes: [
          {
            field: 'estimatedDuration',
            currentValue: 120,
            suggestedValue: 90,
            reason: 'Based on exercise complexity',
            confidence: 85
          }
        ],
        templateSuggestions: [
          {
            templateId: 'template-strength-basic',
            templateName: 'Basic Strength Training',
            matchScore: 88,
            reason: 'Similar exercise selection and intensity'
          }
        ]
      };
      
      return { data: validationResponse };
    }

    // Validation rules
    if (cleanEndpoint === '/validation/rules' && method === 'GET') {
      const mockRules = {
        rules: [
          {
            id: 'rule-001',
            name: 'Required Title',
            description: 'Workout title must be provided',
            category: 'REQUIRED_FIELD',
            workoutTypes: ['STRENGTH', 'CONDITIONING', 'HYBRID', 'AGILITY'],
            priority: 100,
            condition: {
              field: 'title',
              operator: 'is_not_empty'
            },
            action: {
              type: 'error',
              message: 'Workout title is required',
              code: 'TITLE_REQUIRED'
            },
            enabled: true
          },
          {
            id: 'rule-002',
            name: 'Player Assignment Required',
            description: 'At least one player must be assigned',
            category: 'BUSINESS_RULE',
            workoutTypes: ['STRENGTH', 'CONDITIONING', 'HYBRID', 'AGILITY'],
            priority: 90,
            condition: {
              field: 'playerIds',
              operator: 'is_not_empty'
            },
            action: {
              type: 'error',
              message: 'At least one player must be assigned',
              code: 'PLAYERS_REQUIRED'
            },
            enabled: true
          }
        ]
      };
      
      return { data: mockRules };
    }

    // Validation config
    if (cleanEndpoint === '/validation/config') {
      if (method === 'GET') {
        const mockConfig = {
          enabled: true,
          debounceMs: 300,
          fields: ['title', 'duration', 'playerIds', 'exercises'],
          triggers: ['field_change', 'player_assignment'],
          cache: {
            enabled: true,
            ttlMs: 300000,
            maxEntries: 100
          }
        };
        
        return { data: mockConfig };
      }
      
      if (method === 'PUT') {
        return { data: { success: true } };
      }
    }

    // Exercises endpoint
    if (cleanEndpoint === '/exercises' && method === 'GET') {
      const mockExercises = {
        exercises: [
        {
          id: 'squat',
          name: 'Back Squat',
          category: 'strength',
          muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
          equipment: ['barbell', 'squat-rack'],
          difficulty: 'intermediate',
          description: 'Fundamental lower body strength exercise',
          instructions: 'Position bar on upper back, descend with control, drive through heels to stand',
          videoUrl: '/videos/squat.mp4'
        },
        {
          id: 'bench-press',
          name: 'Bench Press',
          category: 'strength',
          muscleGroups: ['chest', 'triceps', 'shoulders'],
          equipment: ['barbell', 'bench'],
          difficulty: 'intermediate',
          description: 'Primary upper body pushing exercise',
          instructions: 'Lower bar to chest with control, press to full extension',
          videoUrl: '/videos/bench-press.mp4'
        },
        {
          id: 'deadlift',
          name: 'Conventional Deadlift',
          category: 'strength',
          muscleGroups: ['hamstrings', 'glutes', 'lower-back', 'traps'],
          equipment: ['barbell'],
          difficulty: 'advanced',
          description: 'Full body compound movement',
          instructions: 'Hinge at hips, grip bar, drive through floor to stand tall',
          videoUrl: '/videos/deadlift.mp4'
        },
        {
          id: 'lunge',
          name: 'Walking Lunges',
          category: 'strength',
          muscleGroups: ['quadriceps', 'glutes', 'calves'],
          equipment: ['dumbbells'],
          difficulty: 'beginner',
          description: 'Unilateral leg exercise for balance and strength',
          instructions: 'Step forward, lower back knee, drive through front heel',
          videoUrl: '/videos/lunge.mp4'
        },
        {
          id: 'pullup',
          name: 'Pull-ups',
          category: 'strength',
          muscleGroups: ['lats', 'biceps', 'upper-back'],
          equipment: ['pull-up-bar'],
          difficulty: 'intermediate',
          description: 'Upper body pulling exercise',
          instructions: 'Hang from bar, pull chin over bar, lower with control',
          videoUrl: '/videos/pullup.mp4'
        },
        // Conditioning exercises
        {
          id: 'rowing-steady',
          name: 'Steady State Rowing',
          category: 'conditioning',
          muscleGroups: ['full-body'],
          equipment: ['rowing-machine'],
          difficulty: 'beginner',
          description: 'Low intensity aerobic rowing',
          instructions: 'Maintain steady pace at 18-22 strokes per minute',
          videoUrl: '/videos/rowing.mp4',
          type: 'cardio',
          duration: 1200,
          defaultSets: 1,
          defaultReps: 1
        },
        {
          id: 'bike-intervals',
          name: 'Bike Sprint Intervals',
          category: 'conditioning',
          muscleGroups: ['legs', 'cardiovascular'],
          equipment: ['stationary-bike'],
          difficulty: 'intermediate',
          description: 'High intensity bike sprints',
          instructions: 'Sprint for 30s, recover for 90s',
          videoUrl: '/videos/bike-intervals.mp4',
          type: 'cardio',
          duration: 30,
          defaultSets: 8,
          defaultReps: 1
        },
        {
          id: 'burpees',
          name: 'Burpees',
          category: 'conditioning',
          muscleGroups: ['full-body'],
          equipment: [],
          difficulty: 'intermediate',
          description: 'Full body conditioning exercise',
          instructions: 'Squat, jump back to plank, push-up, jump forward, jump up',
          videoUrl: '/videos/burpees.mp4',
          type: 'cardio',
          defaultSets: 3,
          defaultReps: 15
        },
        // Mobility exercises
        {
          id: 'dynamic-warmup',
          name: 'Dynamic Warm-up Routine',
          category: 'mobility',
          muscleGroups: ['full-body'],
          equipment: [],
          difficulty: 'beginner',
          description: 'Full body dynamic stretching routine',
          instructions: 'Perform each movement for 30 seconds',
          videoUrl: '/videos/dynamic-warmup.mp4',
          type: 'flexibility',
          duration: 600,
          defaultSets: 1,
          defaultReps: 1
        },
        {
          id: 'hip-mobility',
          name: 'Hip Mobility Routine',
          category: 'mobility',
          muscleGroups: ['hips', 'glutes'],
          equipment: ['mat'],
          difficulty: 'beginner',
          description: 'Hip opening and mobility exercises',
          instructions: '90/90 hip stretch, hip circles, leg swings',
          videoUrl: '/videos/hip-mobility.mp4',
          type: 'flexibility',
          duration: 480,
          defaultSets: 1,
          defaultReps: 1
        },
        {
          id: 'foam-rolling',
          name: 'Foam Rolling Recovery',
          category: 'mobility',
          muscleGroups: ['full-body'],
          equipment: ['foam-roller'],
          difficulty: 'beginner',
          description: 'Self-myofascial release routine',
          instructions: 'Roll each muscle group for 60-90 seconds',
          videoUrl: '/videos/foam-rolling.mp4',
          type: 'recovery',
          duration: 900,
          defaultSets: 1,
          defaultReps: 1
        }
        ]
      };
      
      // Filter by category if provided
      const category = params.get('category');
      if (category) {
        return { data: { exercises: mockExercises.exercises.filter(e => e.category === category) } };
      }
      
      return { data: mockExercises };
    }

    // Templates endpoint
    if (cleanEndpoint === '/templates' && method === 'GET') {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Hockey Strength Foundation',
          description: 'Basic strength training program for hockey players',
          category: 'strength',
          exercises: [
            { exerciseId: 'squat', sets: 4, reps: 8, intensity: 75 },
            { exerciseId: 'bench-press', sets: 3, reps: 10, intensity: 70 },
            { exerciseId: 'deadlift', sets: 3, reps: 6, intensity: 80 }
          ],
          workoutType: 'STRENGTH',
          duration: 60,
          difficulty: 'intermediate',
          tags: ['strength', 'hockey', 'foundation'],
          isPublic: true,
          createdBy: 'trainer-1',
          createdAt: '2024-01-01T00:00:00Z',
          usageCount: 45,
          lastUsed: '2024-01-20T00:00:00Z'
        },
        {
          id: 'template-2',
          name: 'Pre-Season Conditioning',
          description: 'High-intensity interval training for pre-season preparation',
          category: 'conditioning',
          workoutType: 'CONDITIONING',
          intervalProgram: {
            phases: [
              { type: 'warmup', duration: 300, intensity: 50 },
              { type: 'interval', duration: 60, intensity: 90, rest: 30, repetitions: 8 },
              { type: 'cooldown', duration: 300, intensity: 40 }
            ],
            equipment: 'bike',
            targetHeartRate: { min: 140, max: 170 }
          },
          duration: 45,
          difficulty: 'advanced',
          tags: ['conditioning', 'HIIT', 'pre-season'],
          isPublic: true,
          createdBy: 'trainer-2',
          createdAt: '2024-01-05T00:00:00Z',
          usageCount: 32,
          lastUsed: '2024-01-18T00:00:00Z'
        },
        {
          id: 'template-3',
          name: 'Agility Ladder Drills',
          description: 'Comprehensive agility training using ladder drills',
          category: 'agility',
          workoutType: 'AGILITY',
          agilityProgram: {
            drills: [
              { name: 'Two Feet In', duration: 30, sets: 3, pattern: 'ladder' },
              { name: 'Lateral Shuffle', duration: 30, sets: 3, pattern: 'ladder' },
              { name: 'Ickey Shuffle', duration: 30, sets: 3, pattern: 'ladder' }
            ],
            equipment: ['agility-ladder', 'cones'],
            focusAreas: ['footwork', 'coordination', 'speed']
          },
          duration: 30,
          difficulty: 'beginner',
          tags: ['agility', 'footwork', 'speed'],
          isPublic: true,
          createdBy: 'trainer-3',
          createdAt: '2024-01-10T00:00:00Z',
          usageCount: 28,
          lastUsed: '2024-01-19T00:00:00Z'
        }
      ];
      
      // Filter by category if provided
      const category = params.get('category');
      if (category) {
        return { data: mockTemplates.filter(t => t.category === category) };
      }
      
      return { data: mockTemplates };
    }

    // Medical data endpoint
    if (url.includes('/user/medical/players') && method === 'GET') {
      const idsParam = params.get('ids');
      const playerIds = idsParam ? idsParam.split(',') : [];
      
      const mockMedicalData = playerIds.map(id => {
        // Mock data for specific players
        if (id === 'player-1' || id === '1') {
          return {
            id: id,
            name: 'Sidney Crosby',
            medicalStatus: {
              status: 'injured',
              injuries: [{
                type: 'exercise',
                severity: 'moderate',
                description: 'Lower back strain',
                bodyPart: 'lower_back',
                alternatives: ['swimming', 'stationary bike'],
                loadReduction: 30
              }],
              lastUpdated: new Date().toISOString()
            }
          };
        } else if (id === 'player-2' || id === '2') {
          return {
            id: id,
            name: 'Nathan MacKinnon',
            medicalStatus: {
              status: 'limited',
              injuries: [{
                type: 'load',
                severity: 'mild',
                description: 'Knee soreness',
                bodyPart: 'knee',
                alternatives: ['low-impact exercises'],
                loadReduction: 15
              }],
              lastUpdated: new Date().toISOString()
            }
          };
        }
        
        // Default healthy player
        return {
          id: id,
          name: `Player ${id}`,
          medicalStatus: {
            status: 'healthy',
            injuries: [],
            lastUpdated: new Date().toISOString()
          }
        };
      });
      
      return { data: mockMedicalData };
    }

    // Mock medical players endpoint
    if (cleanEndpoint === '/medical/players') {
      // Get query params from URL
      const urlParams = new URLSearchParams(args.url.split('?')[1] || '');
      const playerIdsParam = urlParams.get('playerIds');
      const requestedIds = playerIdsParam ? playerIdsParam.split(',') : [];
      
      // Generate medical data for all players with some having injuries/limitations
      const allMedicalPlayers = [
        {
          id: '1',
          playerId: '1',
          playerName: 'Erik Andersson',
          status: 'injured',
          currentStatus: 'injured',
          restrictions: [
            {
              type: 'movement',
              bodyPart: 'lower_back',
              severity: 'moderate',
              restrictedExercises: ['deadlifts', 'squats', 'back_extension'],
              notes: 'Lower back strain - avoid heavy lifting',
              alternatives: ['leg_press', 'lunges', 'goblet_squats'],
              maxLoad: 60,
            },
          ],
          clearanceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastAssessment: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          playerId: '2',
          playerName: 'Marcus Lindberg',
          status: 'limited',
          currentStatus: 'limited',
          restrictions: [
            {
              type: 'load',
              bodyPart: 'knee',
              severity: 'mild',
              restrictedExercises: ['jump_squats', 'box_jumps'],
              notes: 'Knee tendinitis - reduce impact activities',
              maxLoad: 80,
            },
          ],
          clearanceDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          lastAssessment: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          playerId: '3',
          playerName: 'Viktor Nilsson',
          status: 'healthy',
          currentStatus: 'healthy',
          restrictions: [],
          clearanceDate: null,
          lastAssessment: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          playerId: '4',
          playerName: 'Johan Bergström',
          status: 'healthy',
          currentStatus: 'healthy',
          restrictions: [],
          clearanceDate: null,
          lastAssessment: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '5',
          playerId: '5',
          playerName: 'Anders Johansson',
          status: 'healthy',
          currentStatus: 'healthy',
          restrictions: [],
          clearanceDate: null,
          lastAssessment: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        },
        // Add more players as needed
        ...Array.from({ length: 10 }, (_, i) => ({
          id: String(i + 6),
          playerId: String(i + 6),
          playerName: `Player ${i + 6}`,
          status: 'healthy',
          currentStatus: 'healthy',
          restrictions: [],
          clearanceDate: null,
          lastAssessment: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
        }))
      ];
      
      // If specific player IDs were requested, filter the results
      if (requestedIds.length > 0) {
        const filtered = allMedicalPlayers.filter(player => 
          requestedIds.includes(player.playerId) || 
          requestedIds.includes(player.id)
        );
        return { data: filtered };
      }
      
      return { data: allMedicalPlayers };
    }

    // Mock user broadcasts endpoint
    if (cleanEndpoint === '/broadcasts/my-broadcasts') {
      const mockBroadcasts = {
        broadcasts: [
          {
            broadcast: {
              id: 'broadcast-1',
              title: 'Team Practice Update',
              content: 'Tomorrow\'s practice moved to 10 AM',
              priority: 'high',
              createdBy: 'coach-1',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              expiresAt: new Date(Date.now() + 86400000).toISOString(),
            },
            recipientStatus: 'pending',
            readAt: null,
            acknowledgedAt: null,
          },
          {
            broadcast: {
              id: 'broadcast-2',
              title: 'Equipment Check Reminder',
              content: 'Please ensure all equipment is returned by Friday',
              priority: 'normal',
              createdBy: 'equipment-manager-1',
              createdAt: new Date(Date.now() - 172800000).toISOString(),
              expiresAt: new Date(Date.now() + 432000000).toISOString(),
            },
            recipientStatus: 'read',
            readAt: new Date(Date.now() - 86400000).toISOString(),
            acknowledgedAt: null,
          },
        ],
        unreadCount: 1,
      };
      return { data: mockBroadcasts };
    }

    // Equipment inventory endpoints - COMMENTED OUT to use facility-specific endpoint below
    /*
    if ((url.includes('/equipment/availability/facility/') || url.includes('/availability/facility/')) && url.includes('/realtime') && method === 'GET') {
      const facilityId = url.split('/facility/')[1].split('/realtime')[0];
      
      const mockAvailability = {
        'rowing': {
          equipmentType: 'rowing',
          facilityId,
          totalCount: 6,
          availableCount: 4,
          inUseCount: 1,
          reservedCount: 1,
          maintenanceCount: 0,
          outOfOrderCount: 0,
          items: [
            { id: 'row-1', name: 'Concept2 Model D #1', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'row-2', name: 'Concept2 Model D #2', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'row-3', name: 'Concept2 Model D #3', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'row-4', name: 'Concept2 Model D #4', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'row-5', name: 'Concept2 Model D #5', status: 'in_use', currentReservation: { id: 'res-1', startTime: new Date().toISOString(), endTime: new Date(Date.now() + 3600000).toISOString(), reservedBy: 'John Doe' }, nextReservation: null },
            { id: 'row-6', name: 'Concept2 Model D #6', status: 'reserved', currentReservation: null, nextReservation: { id: 'res-2', startTime: new Date(Date.now() + 1800000).toISOString(), endTime: new Date(Date.now() + 5400000).toISOString(), reservedBy: 'Jane Smith' } }
          ],
          upcomingReservations: [
            { startTime: new Date(Date.now() + 1800000).toISOString(), endTime: new Date(Date.now() + 5400000).toISOString(), count: 2 }
          ]
        },
        'bike_erg': {
          equipmentType: 'bike_erg',
          facilityId,
          totalCount: 4,
          availableCount: 3,
          inUseCount: 1,
          reservedCount: 0,
          maintenanceCount: 0,
          outOfOrderCount: 0,
          items: [
            { id: 'bike-1', name: 'BikeErg #1', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'bike-2', name: 'BikeErg #2', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'bike-3', name: 'BikeErg #3', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'bike-4', name: 'BikeErg #4', status: 'in_use', currentReservation: { id: 'res-3', startTime: new Date().toISOString(), endTime: new Date(Date.now() + 2700000).toISOString(), reservedBy: 'Mike Johnson' }, nextReservation: null }
          ],
          upcomingReservations: []
        },
        'wattbike': {
          equipmentType: 'wattbike',
          facilityId,
          totalCount: 3,
          availableCount: 1,
          inUseCount: 2,
          reservedCount: 0,
          maintenanceCount: 0,
          outOfOrderCount: 0,
          items: [
            { id: 'watt-1', name: 'Wattbike Pro #1', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'watt-2', name: 'Wattbike Pro #2', status: 'in_use', currentReservation: { id: 'res-4', startTime: new Date().toISOString(), endTime: new Date(Date.now() + 1800000).toISOString(), reservedBy: 'Sarah Wilson' }, nextReservation: null },
            { id: 'watt-3', name: 'Wattbike Pro #3', status: 'in_use', currentReservation: { id: 'res-5', startTime: new Date().toISOString(), endTime: new Date(Date.now() + 2400000).toISOString(), reservedBy: 'Tom Brown' }, nextReservation: null }
          ],
          upcomingReservations: []
        },
        'treadmill': {
          equipmentType: 'treadmill',
          facilityId,
          totalCount: 5,
          availableCount: 5,
          inUseCount: 0,
          reservedCount: 0,
          maintenanceCount: 0,
          outOfOrderCount: 0,
          items: [
            { id: 'tread-1', name: 'Treadmill #1', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'tread-2', name: 'Treadmill #2', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'tread-3', name: 'Treadmill #3', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'tread-4', name: 'Treadmill #4', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'tread-5', name: 'Treadmill #5', status: 'available', currentReservation: null, nextReservation: null }
          ],
          upcomingReservations: []
        },
        'running': {
          equipmentType: 'running',
          facilityId,
          totalCount: 0,
          availableCount: 0,
          inUseCount: 0,
          reservedCount: 0,
          maintenanceCount: 0,
          outOfOrderCount: 0,
          items: [],
          upcomingReservations: []
        },
        'skierg': {
          equipmentType: 'skierg',
          facilityId,
          totalCount: 3,
          availableCount: 2,
          inUseCount: 1,
          reservedCount: 0,
          maintenanceCount: 0,
          outOfOrderCount: 0,
          items: [
            { id: 'ski-1', name: 'Concept2 SkiErg #1', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'ski-2', name: 'Concept2 SkiErg #2', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'ski-3', name: 'Concept2 SkiErg #3', status: 'in_use', currentReservation: { id: 'res-5', startTime: new Date().toISOString(), endTime: new Date(Date.now() + 1800000).toISOString(), reservedBy: 'Sarah Wilson' }, nextReservation: null }
          ],
          upcomingReservations: []
        },
        'airbike': {
          equipmentType: 'airbike',
          facilityId,
          totalCount: 4,
          availableCount: 3,
          inUseCount: 0,
          reservedCount: 1,
          maintenanceCount: 0,
          outOfOrderCount: 0,
          items: [
            { id: 'air-1', name: 'Assault AirBike #1', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'air-2', name: 'Assault AirBike #2', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'air-3', name: 'Assault AirBike #3', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'air-4', name: 'Assault AirBike #4', status: 'reserved', currentReservation: null, nextReservation: { id: 'res-6', startTime: new Date(Date.now() + 3600000).toISOString(), endTime: new Date(Date.now() + 5400000).toISOString(), reservedBy: 'Tom Davis' } }
          ],
          upcomingReservations: [
            { startTime: new Date(Date.now() + 3600000).toISOString(), endTime: new Date(Date.now() + 5400000).toISOString(), count: 1 }
          ]
        },
        'rope_jump': {
          equipmentType: 'rope_jump',
          facilityId,
          totalCount: 10,
          availableCount: 10,
          inUseCount: 0,
          reservedCount: 0,
          maintenanceCount: 0,
          outOfOrderCount: 0,
          items: [
            { id: 'rope-1', name: 'Jump Rope #1', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'rope-2', name: 'Jump Rope #2', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'rope-3', name: 'Jump Rope #3', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'rope-4', name: 'Jump Rope #4', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'rope-5', name: 'Jump Rope #5', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'rope-6', name: 'Jump Rope #6', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'rope-7', name: 'Jump Rope #7', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'rope-8', name: 'Jump Rope #8', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'rope-9', name: 'Jump Rope #9', status: 'available', currentReservation: null, nextReservation: null },
            { id: 'rope-10', name: 'Jump Rope #10', status: 'available', currentReservation: null, nextReservation: null }
          ],
          upcomingReservations: []
        }
      };
      // Return the data directly for RTK Query
      return { data: mockAvailability };
    }
    */

    // Equipment conflicts endpoint
    if (url.includes('/equipment/conflicts') && method === 'GET') {
      const { equipmentType, requiredCount = 1, startTime, endTime } = params || {};
      
      // Simulate conflicts based on equipment type and count
      const conflicts = [];
      
      if (equipmentType === 'wattbike' && requiredCount > 1) {
        conflicts.push({
          type: 'insufficient_equipment',
          equipmentType,
          requested: requiredCount,
          available: 1,
          timeSlot: { start: new Date(startTime), end: new Date(endTime) },
          suggestions: [
            {
              type: 'alternative_equipment',
              alternativeEquipment: 'bike_erg',
              description: 'Use BikeErg instead (3 available)',
              reason: 'BikeErg provides similar training benefits'
            },
            {
              type: 'reduce_participants',
              maxParticipants: 1,
              description: 'Reduce to 1 participant per session',
              reason: 'Only 1 Wattbike available at this time'
            }
          ]
        });
      }
      
      return { data: { success: true, data: conflicts } };
    }

    // Equipment availability endpoints (handles both URL patterns)
    if ((url.includes('/availability/facility/') || url.includes('/training/equipment/availability/facility/')) && url.includes('/realtime')) {
      // Extract facility ID from URL
      const facilityMatch = url.match(/facility\/([^\/]+)\/realtime/);
      const facilityId = facilityMatch ? facilityMatch[1] : 'default-facility';
      
      // Mock facility equipment inventories
      const facilityInventories = {
        'default-facility': {
          running: { total: 0, available: 0 }, // Outdoor running, no equipment
          rowing: { total: 6, available: 6 },
          skierg: { total: 4, available: 4 },
          bike_erg: { total: 6, available: 6 },
          wattbike: { total: 4, available: 4 },
          airbike: { total: 8, available: 8 },
          rope_jump: { total: 20, available: 20 },
          treadmill: { total: 10, available: 10 }
        },
        'training-center-main': {
          running: { total: 0, available: 0 },
          rowing: { total: 8, available: 8 },
          skierg: { total: 6, available: 6 },
          bike_erg: { total: 8, available: 8 },
          wattbike: { total: 6, available: 6 },
          airbike: { total: 10, available: 10 },
          rope_jump: { total: 30, available: 30 },
          treadmill: { total: 12, available: 12 }
        },
        'training-center-west': {
          running: { total: 0, available: 0 },
          rowing: { total: 4, available: 4 },
          skierg: { total: 2, available: 2 },
          bike_erg: { total: 4, available: 4 },
          wattbike: { total: 2, available: 2 },
          airbike: { total: 4, available: 4 },
          rope_jump: { total: 15, available: 15 },
          treadmill: { total: 6, available: 6 }
        },
        'youth-facility': {
          running: { total: 0, available: 0 },
          rowing: { total: 3, available: 3 },
          skierg: { total: 2, available: 2 },
          bike_erg: { total: 3, available: 3 },
          wattbike: { total: 0, available: 0 }, // Youth facility doesn't have wattbikes
          airbike: { total: 3, available: 3 },
          rope_jump: { total: 10, available: 10 },
          treadmill: { total: 4, available: 4 }
        }
      };
      
      const inventory = facilityInventories[facilityId] || facilityInventories['default-facility'];
      
      // Build availability response
      const availability = {};
      Object.entries(inventory).forEach(([equipmentType, counts]) => {
        availability[equipmentType] = {
          equipmentType,
          facilityId,
          totalCount: counts.total,
          availableCount: counts.available,
          inUseCount: 0,
          reservedCount: 0,
          maintenanceCount: 0,
          outOfOrderCount: 0,
          items: Array.from({ length: counts.total }, (_, i) => ({
            id: `${equipmentType}-${i + 1}`,
            name: `${equipmentType.replace(/_/g, ' ').toUpperCase()} ${i + 1}`,
            status: 'available'
          })),
          upcomingReservations: []
        };
      });
      
      return { data: { success: true, data: availability } };
    }
    
    // Equipment reservation endpoint
    if (url.includes('/equipment/reserve') && method === 'POST') {
      const mockReservation = {
        id: `reservation-${Date.now()}`,
        equipmentItemId: 'mock-equipment-1',
        workoutSessionId: body.workoutSessionId,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        status: 'confirmed',
        reservedBy: 'current-user',
        reservedFor: body.playerIds?.[0],
        purpose: body.notes || 'Conditioning workout',
        notes: body.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return { data: { success: true, data: mockReservation } };
    }

    // Bulk Session Bundle endpoints
    if (url.includes('/session-bundles') && method === 'POST' && !url.includes('/control') && !url.includes('/equipment-conflicts')) {
      const bundleId = `bundle-${Date.now()}`;
      const bundle = {
        id: bundleId,
        name: body.name,
        createdAt: new Date(),
        createdBy: 'current-trainer',
        status: 'preparing' as const,
        sessions: body.sessions.map((session: any, index: number) => {
          // Generate type-specific workout data
          let workoutData = {};
          let equipment = session.equipmentIds?.[0] || 'Treadmill';
          
          switch (session.workoutType) {
            case 'strength':
              workoutData = generateStrengthWorkoutData(
                session.estimatedDuration / 60, // convert seconds to minutes
                session.intensity || 'medium',
                session.playerIds.length
              );
              equipment = 'Free Weights';
              break;
            case 'conditioning':
              workoutData = generateConditioningWorkoutData(
                session.estimatedDuration / 60,
                session.intensity || 'medium',
                session.equipmentIds || ['bike']
              );
              equipment = session.equipmentIds?.[0] || 'Bike';
              break;
            case 'hybrid':
              workoutData = generateHybridWorkoutData(
                session.estimatedDuration / 60,
                session.intensity || 'medium'
              );
              equipment = 'Mixed Equipment';
              break;
            case 'agility':
              workoutData = generateAgilityWorkoutData(
                session.estimatedDuration / 60,
                session.intensity || 'medium'
              );
              equipment = 'Agility Equipment';
              break;
            case 'stability_core':
              workoutData = generateStabilityCoreWorkoutData(
                session.estimatedDuration / 60,
                session.intensity || 'medium'
              );
              equipment = 'Stability Equipment';
              break;
            case 'plyometrics':
              workoutData = generatePlyometricsWorkoutData(
                session.estimatedDuration / 60,
                session.intensity || 'medium'
              );
              equipment = 'Plyometric Equipment';
              break;
            case 'wrestling':
              workoutData = generateWrestlingWorkoutData(
                session.estimatedDuration / 60,
                session.intensity || 'medium'
              );
              equipment = 'Wrestling Mats';
              break;
          }

          return {
            id: `session-${bundleId}-${index}`,
            name: session.name,
            workoutType: session.workoutType,
            equipment,
            participants: generateSessionParticipants(session.playerIds, session.workoutType),
            status: 'preparing' as const,
            progress: 0,
            elapsedTime: 0,
            estimatedDuration: session.estimatedDuration,
            currentPhase: 'Warmup',
            location: session.location || 'Gym A',
            workoutData, // Add the generated workout data
            customizations: session.customizations || {}
          };
        }),
        totalParticipants: body.sessions.reduce((total: number, session: any) => total + session.playerIds.length, 0),
        equipmentReservations: body.equipmentReservations || [],
        calendarEvents: body.calendarEventIds?.map((eventId: string, index: number) => ({
          eventId,
          sessionId: `session-${bundleId}-${index}`,
          startTime: new Date(Date.now() + index * 3600000).toISOString(),
          endTime: new Date(Date.now() + index * 3600000 + 3600000).toISOString()
        })) || []
      };
      mockSessionBundles.set(bundleId, bundle);
      return { data: bundle };
    }

    // Get session bundle
    if (url.includes('/session-bundles/') && method === 'GET' && !url.includes('/status') && !url.includes('/analytics')) {
      const bundleId = url.split('/session-bundles/')[1];
      const bundle = mockSessionBundles.get(bundleId);
      if (!bundle) {
        return { error: { status: 404, data: { message: 'Bundle not found' } } };
      }
      return { data: bundle };
    }

    // Update session bundle
    if (url.includes('/session-bundles/') && method === 'PATCH') {
      const bundleId = url.split('/session-bundles/')[1];
      const bundle = mockSessionBundles.get(bundleId);
      if (!bundle) {
        return { error: { status: 404, data: { message: 'Bundle not found' } } };
      }
      const updatedBundle = { ...bundle, ...body, updatedAt: new Date() };
      mockSessionBundles.set(bundleId, updatedBundle);
      return { data: updatedBundle };
    }

    // Get bundle status with real-time metrics
    if (url.includes('/session-bundles/') && url.includes('/status') && method === 'GET') {
      const bundleId = url.split('/session-bundles/')[1].split('/status')[0];
      const bundle = mockSessionBundles.get(bundleId);
      if (!bundle) {
        return { error: { status: 404, data: { message: 'Bundle not found' } } };
      }
      
      const status = generateBundleStatus(bundle);
      return { data: status };
    }

    // Bulk control operations
    if (url.includes('/session-bundles/') && url.includes('/control') && method === 'POST') {
      const bundleId = url.split('/session-bundles/')[1].split('/control')[0];
      const bundle = mockSessionBundles.get(bundleId);
      if (!bundle) {
        return { error: { status: 404, data: { message: 'Bundle not found' } } };
      }

      const { action, sessionIds, parameters } = body;
      const affectedSessions = sessionIds || bundle.sessions.map(s => s.id);
      
      // Simulate action execution
      const results = affectedSessions.map((sessionId: string) => ({
        sessionId,
        success: Math.random() > 0.1, // 90% success rate
        error: Math.random() > 0.9 ? 'Equipment unavailable' : undefined
      }));

      const response = {
        success: results.every(r => r.success),
        affectedSessions,
        results,
        exportUrl: action === 'export_data' ? `/api/exports/bundle-${bundleId}-${Date.now()}.${parameters?.exportFormat || 'csv'}` : undefined
      };

      return { data: response };
    }

    // Equipment conflicts check
    if (url.includes('/equipment-conflicts') && method === 'POST') {
      const conflicts = body.conflicts || [];
      const response = {
        conflicts: conflicts.slice(0, Math.floor(Math.random() * 3)).map((conflict: any) => ({
          equipmentId: conflict.equipmentId,
          equipmentName: `Equipment ${conflict.equipmentId}`,
          conflictingSessions: conflict.timeSlots.slice(0, 2).map((slot: any) => ({
            sessionId: slot.sessionId,
            sessionName: `Session ${slot.sessionId}`,
            startTime: slot.startTime,
            endTime: slot.endTime
          })),
          suggestions: [
            {
              alternativeEquipmentId: `alt-${conflict.equipmentId}`,
              alternativeEquipmentName: `Alternative Equipment`,
              available: true
            }
          ]
        })),
        totalConflicts: Math.floor(Math.random() * 3)
      };
      return { data: response };
    }

    // Get all session bundles
    if (url.includes('/session-bundles') && method === 'GET' && !url.includes('/session-bundles/')) {
      const bundles = Array.from(mockSessionBundles.values());
      return { 
        data: { 
          bundles: bundles.slice(0, args.params?.limit || 10),
          total: bundles.length 
        } 
      };
    }

    // Delete session bundle
    if (url.includes('/session-bundles/') && method === 'DELETE') {
      const bundleId = url.split('/session-bundles/')[1];
      const deleted = mockSessionBundles.delete(bundleId);
      return { data: { success: deleted } };
    }

    // Duplicate session bundle
    if (url.includes('/session-bundles/') && url.includes('/duplicate') && method === 'POST') {
      const bundleId = url.split('/session-bundles/')[1].split('/duplicate')[0];
      const originalBundle = mockSessionBundles.get(bundleId);
      if (!originalBundle) {
        return { error: { status: 404, data: { message: 'Bundle not found' } } };
      }

      const newBundleId = `bundle-${Date.now()}`;
      const duplicatedBundle = {
        ...originalBundle,
        id: newBundleId,
        name: body.name,
        createdAt: new Date(),
        sessions: originalBundle.sessions.map((session, index) => ({
          ...session,
          id: `session-${newBundleId}-${index}`
        }))
      };
      mockSessionBundles.set(newBundleId, duplicatedBundle);
      return { data: duplicatedBundle };
    }

    // Get bundle analytics
    if (url.includes('/session-bundles/') && url.includes('/analytics') && method === 'GET') {
      const bundleId = url.split('/session-bundles/')[1].split('/analytics')[0];
      const bundle = mockSessionBundles.get(bundleId);
      if (!bundle) {
        return { error: { status: 404, data: { message: 'Bundle not found' } } };
      }

      const analytics = generateBundleAnalytics(bundle);
      return { data: analytics };
    }

    // Validate workout configurations for all types
    if (url.includes('/session-bundles/validate-workouts') && method === 'POST') {
      const { workoutType, sessionConfigs, playerIds, teamIds } = body;
      const errors = [];
      const warnings = [];
      const recommendations = [];

      // Type-specific validation
      for (const config of sessionConfigs) {
        // Duration validation
        if (config.estimatedDuration < 900) { // less than 15 minutes
          warnings.push({
            sessionId: config.workoutId,
            workoutType: config.workoutType,
            message: 'Session duration is quite short',
            suggestion: 'Consider extending to at least 15-20 minutes for effective training'
          });
        }

        // Equipment validation
        if (config.workoutType === 'conditioning' && !config.equipmentIds?.length) {
          errors.push({
            sessionId: config.workoutId,
            workoutType: config.workoutType,
            field: 'equipment',
            message: 'Conditioning workouts require equipment selection',
            severity: 'error' as const
          });
        }

        if (config.workoutType === 'agility' && config.estimatedDuration > 3600) { // more than 1 hour
          warnings.push({
            sessionId: config.workoutId,
            workoutType: config.workoutType,
            message: 'Agility sessions longer than 1 hour may cause fatigue',
            suggestion: 'Consider breaking into multiple shorter sessions'
          });
        }

        // Player capacity recommendations
        if (config.playerIds.length > 12) {
          recommendations.push({
            sessionId: config.workoutId,
            workoutType: config.workoutType,
            type: 'player_capacity' as const,
            message: 'Large group size detected',
            action: 'Consider splitting into smaller groups for better supervision'
          });
        }
      }

      return {
        data: {
          isValid: errors.length === 0,
          errors,
          warnings,
          recommendations
        }
      };
    }

    // Check player capabilities for different workout types
    if (url.includes('/session-bundles/player-capabilities') && method === 'POST') {
      const { players } = body;
      const results = players.map((player: any) => {
        const capabilities = [
          {
            workoutType: 'strength' as const,
            canParticipate: !player.medicalRestrictions?.includes('no_heavy_lifting'),
            restrictions: player.medicalRestrictions?.filter((r: string) => r.includes('lifting')) || [],
            modifications: ['reduce_weight', 'increase_rest'],
            riskLevel: player.medicalRestrictions?.length > 0 ? 'medium' as const : 'low' as const
          },
          {
            workoutType: 'conditioning' as const,
            canParticipate: !player.medicalRestrictions?.includes('no_cardio'),
            restrictions: player.medicalRestrictions?.filter((r: string) => r.includes('cardio')) || [],
            modifications: ['reduce_intensity', 'frequent_breaks'],
            riskLevel: player.fitnessLevel === 'beginner' ? 'medium' as const : 'low' as const
          },
          {
            workoutType: 'hybrid' as const,
            canParticipate: true,
            restrictions: [],
            modifications: ['adapt_to_restrictions'],
            riskLevel: 'low' as const
          },
          {
            workoutType: 'agility' as const,
            canParticipate: !player.medicalRestrictions?.includes('ankle_injury'),
            restrictions: player.medicalRestrictions?.filter((r: string) => r.includes('ankle') || r.includes('knee')) || [],
            modifications: ['reduce_lateral_movement', 'focus_on_linear_drills'],
            riskLevel: player.medicalRestrictions?.some((r: string) => r.includes('joint')) ? 'high' as const : 'low' as const
          },
          {
            workoutType: 'stability_core' as const,
            canParticipate: !player.medicalRestrictions?.includes('back_injury') && !player.medicalRestrictions?.includes('core_restriction'),
            restrictions: player.medicalRestrictions?.filter((r: string) => r.includes('back') || r.includes('core') || r.includes('balance')) || [],
            modifications: ['shorter_holds', 'stable_surface_only', 'assisted_balance'],
            riskLevel: player.medicalRestrictions?.some((r: string) => r.includes('back') || r.includes('balance')) ? 'high' as const : 'low' as const
          },
          {
            workoutType: 'plyometrics' as const,
            canParticipate: !player.medicalRestrictions?.includes('knee_injury') && !player.medicalRestrictions?.includes('ankle_injury') && !player.medicalRestrictions?.includes('no_jumping'),
            restrictions: player.medicalRestrictions?.filter((r: string) => r.includes('knee') || r.includes('ankle') || r.includes('jump')) || [],
            modifications: ['reduced_height', 'increased_rest', 'landing_progression'],
            riskLevel: player.medicalRestrictions?.some((r: string) => r.includes('knee') || r.includes('ankle')) ? 'high' as const : 'medium' as const
          },
          {
            workoutType: 'wrestling' as const,
            canParticipate: !player.medicalRestrictions?.includes('contact_restriction') && !player.medicalRestrictions?.includes('neck_injury') && !player.medicalRestrictions?.includes('shoulder_injury'),
            restrictions: player.medicalRestrictions?.filter((r: string) => r.includes('contact') || r.includes('neck') || r.includes('shoulder')) || [],
            modifications: ['technique_only', 'no_live_wrestling', 'controlled_intensity'],
            riskLevel: player.medicalRestrictions?.some((r: string) => r.includes('neck') || r.includes('contact')) ? 'high' as const : 'medium' as const
          }
        ];

        return {
          playerId: player.playerId,
          playerName: player.playerName,
          capabilities
        };
      });

      return { data: { results } };
    }

    // Generate workout data for specific type
    if (url.includes('/session-bundles/generate-workout') && method === 'POST') {
      const { workoutType, duration, intensity, playerCount, equipment, customizations } = body;
      const workoutId = `generated-${workoutType}-${Date.now()}`;
      let workoutData = {};

      switch (workoutType) {
        case 'strength':
          workoutData = generateStrengthWorkoutData(duration, intensity, playerCount);
          break;
        case 'conditioning':
          workoutData = generateConditioningWorkoutData(duration, intensity, equipment);
          break;
        case 'hybrid':
          workoutData = generateHybridWorkoutData(duration, intensity);
          break;
        case 'agility':
          workoutData = generateAgilityWorkoutData(duration, intensity);
          break;
        case 'stability_core':
          workoutData = generateStabilityCoreWorkoutData(duration, intensity);
          break;
        case 'plyometrics':
          workoutData = generatePlyometricsWorkoutData(duration, intensity);
          break;
        case 'wrestling':
          workoutData = generateWrestlingWorkoutData(duration, intensity);
          break;
        default:
          return { error: { status: 400, data: { message: 'Invalid workout type' } } };
      }

      return {
        data: {
          workoutId,
          workoutData: {
            ...workoutData,
            customizations,
            generatedAt: new Date().toISOString(),
            estimatedParticipants: playerCount
          }
        }
      };
    }

    // Default success response for unhandled endpoints
    console.warn(`Mock API: No specific handler for ${method} ${url}, returning generic success`);
    return { data: { success: true, message: 'Mock response' } };

  } catch (error) {
    console.error('Mock API Error:', error);
    return {
      error: {
        status: 500,
        data: { message: 'Mock API error', error: error.message },
      },
    };
  }
};

// Helper to create a mock-enabled base query
export const createMockEnabledBaseQuery = (originalBaseQuery: any) => {
  return async (args: any, api: any, extraOptions: any) => {
    const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true' && process.env.JEST_TEST_ENV !== 'true';
    
    if (isMockMode) {
      return mockBaseQuery(args, api, extraOptions);
    }
    
    return originalBaseQuery(args, api, extraOptions);
  };
};