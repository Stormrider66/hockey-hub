import { BaseQueryFn } from '@reduxjs/toolkit/query';
import { mockBaseQuery as mockAuthBaseQuery } from './mockAuthApi';
import { trainingMockHandlers } from './mockAdapters/trainingMockAdapter';

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

  // Add artificial delay to simulate network
  await new Promise(resolve => setTimeout(resolve, 300));

  console.log(`🔧 Mock API: ${method} ${url}`, { body, params });

  // Route to appropriate mock handler based on URL
  try {
    // Auth endpoints (handled by mockAuthApi)
    if (url.includes('/auth/') || url.includes('/login') || url.includes('/register')) {
      return mockAuthBaseQuery(args, api, extraOptions);
    }

    // Notification endpoints
    if (url.includes('/notifications')) {
      if (url.includes('/unread-count')) {
        return { data: { count: mockNotificationData.unreadCount } };
      }
      if (url.includes('/stats')) {
        return { data: mockNotificationData.stats };
      }
      if (method === 'GET') {
        return { 
          data: {
            notifications: mockNotificationData.notifications,
            total: mockNotificationData.notifications.length,
            unreadCount: mockNotificationData.unreadCount,
          }
        };
      }
      if (method === 'PATCH' && url.includes('/read')) {
        return { data: { success: true } };
      }
      if (method === 'PATCH' && url.includes('/bulk-read')) {
        return { data: { success: true, updated: body?.notificationIds?.length || 0 } };
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
            }
          ],
          total: 3,
        }
      };
    }

    // Organization endpoints
    if (url.includes('/organizations/')) {
      // Handle /organizations/{orgId}/users endpoint
      if (url.includes('/users')) {
        const isPlayerRole = url.includes('role=player');
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

      // Handle /organizations/{orgId}/teams endpoint
      if (url.includes('/teams')) {
        return {
          data: [
            {
              id: 'a-team',
              name: 'A-Team',
              description: 'Senior Elite Team',
              organizationId: 'org-123',
              ageGroup: '18+',
              level: 'Elite',
              category: 'Senior',
              playerCount: 25,
              players: 25,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z'
            },
            {
              id: 'j20',
              name: 'J20',
              description: 'Junior 20 Team',
              organizationId: 'org-123',
              ageGroup: '18-20',
              level: 'Junior',
              category: 'Junior',
              playerCount: 22,
              players: 22,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z'
            },
            {
              id: 'u18',
              name: 'U18',
              description: 'Under 18 Team',
              organizationId: 'org-123',
              ageGroup: '16-18',
              level: 'AAA',
              category: 'Youth',
              playerCount: 20,
              players: 20,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z'
            },
            {
              id: 'u16',
              name: 'U16',
              description: 'Under 16 Team',
              organizationId: 'org-123',
              ageGroup: '14-16',
              level: 'AA',
              category: 'Youth',
              playerCount: 18,
              players: 18,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z'
            },
            {
              id: 'womens',
              name: 'Women\'s Team',
              description: 'Senior Women\'s Team',
              organizationId: 'org-123',
              ageGroup: '18+',
              level: 'Elite',
              category: 'Women',
              playerCount: 23,
              players: 23,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z'
            }
          ]
        };
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
              location: 'Training Center',
              teamId: teamId || undefined,
              status: 'scheduled' as const,
              visibility: 'team' as const,
              createdBy: 'trainer-1',
              organizationId: params.organizationId || 'org-123',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              metadata: {
                workoutId: `workout-${current.getTime()}`,
                intervalProgram: {
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
                },
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
    if (url.includes('/training') || url.includes('/sessions') || url.includes('/tests') || url.includes('/exercises') || url.includes('/templates') || url.includes('/test-batches') || url.includes('/hybrid-workouts') || url.includes('/agility-drills') || url.includes('/conditioning-workouts') || url.includes('/agility-workouts')) {
      // Find matching handler
      let endpoint = url;
      // Remove various possible prefixes
      endpoint = endpoint.replace('/api/training', '');
      endpoint = endpoint.replace('/training', '');
      endpoint = endpoint.replace('/api', '');
      
      // Ensure endpoint starts with /
      if (!endpoint.startsWith('/')) {
        endpoint = '/' + endpoint;
      }
      
      // Remove query string for handler matching
      const cleanEndpoint = endpoint.split('?')[0];
      const queryParams = params || {};
      
      // Handle hybrid workouts
      if (cleanEndpoint.includes('/hybrid-workouts')) {
        if (method === 'GET' && cleanEndpoint === '/hybrid-workouts') {
          return { data: mockHybridWorkouts };
        }
        if (method === 'GET' && cleanEndpoint.match(/\/hybrid-workouts\/([\w-]+)$/)) {
          const workoutId = cleanEndpoint.split('/').pop();
          const workout = mockHybridWorkouts.find(w => w.id === workoutId);
          if (workout) {
            return { data: workout };
          }
          return { error: { status: 404, data: { message: 'Hybrid workout not found' } } };
        }
        if (method === 'POST' && cleanEndpoint === '/hybrid-workouts') {
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
      if (cleanEndpoint.includes('/agility-drills')) {
        if (method === 'GET' && cleanEndpoint === '/agility-drills') {
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
        if (method === 'GET' && cleanEndpoint.match(/\/agility-drills\/([\w-]+)$/)) {
          const drillId = cleanEndpoint.split('/').pop();
          const drill = mockAgilityDrills.find(d => d.id === drillId);
          if (drill) {
            return { data: drill };
          }
          return { error: { status: 404, data: { message: 'Agility drill not found' } } };
        }
        if (method === 'POST' && cleanEndpoint === '/agility-drills') {
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
      if (cleanEndpoint.includes('/conditioning-workouts')) {
        if (method === 'GET' && cleanEndpoint === '/conditioning-workouts') {
          // Return conditioning workouts
          const conditioningWorkouts = mockHybridWorkouts.filter(w => w.type === 'CONDITIONING');
          return { data: conditioningWorkouts };
        }
        if (method === 'GET' && cleanEndpoint.match(/\/conditioning-workouts\/([\w-]+)$/)) {
          const workoutId = cleanEndpoint.split('/').pop();
          const workout = mockHybridWorkouts.find(w => w.id === workoutId && w.type === 'CONDITIONING');
          if (workout) {
            return { data: workout };
          }
          return { error: { status: 404, data: { message: 'Conditioning workout not found' } } };
        }
        if (method === 'POST' && cleanEndpoint === '/conditioning-workouts') {
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
        if (method === 'PUT' && cleanEndpoint.match(/\/conditioning-workouts\/([\w-]+)$/)) {
          const workoutId = cleanEndpoint.split('/').pop();
          const updatedWorkout = {
            id: workoutId,
            ...body,
            updatedAt: new Date().toISOString()
          };
          return { data: updatedWorkout };
        }
      }
      
      // Handle agility workouts (different from agility drills)
      if (cleanEndpoint.includes('/agility-workouts')) {
        if (method === 'GET' && cleanEndpoint === '/agility-workouts') {
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
        if (method === 'GET' && cleanEndpoint.match(/\/agility-workouts\/([\w-]+)$/)) {
          const workoutId = cleanEndpoint.split('/').pop();
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
              location: 'Field House',
              agilityProgram: {
                drills: mockAgilityDrills.slice(0, 3),
                totalDuration: 60,
                warmupDuration: 10,
                cooldownDuration: 10
              }
            } 
          };
        }
        if (method === 'POST' && cleanEndpoint === '/agility-workouts') {
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
        if (method === 'PUT' && cleanEndpoint.match(/\/agility-workouts\/([\w-]+)$/)) {
          const workoutId = cleanEndpoint.split('/').pop();
          const updatedWorkout = {
            id: workoutId,
            ...body,
            updatedAt: new Date().toISOString()
          };
          return { data: updatedWorkout };
        }
      }
      
      // Handle performance data
      if (cleanEndpoint.includes('/performance')) {
        if (cleanEndpoint.includes('/hybrid') && method === 'GET') {
          let performances = [...mockPerformanceData.hybrid];
          
          if (queryParams.playerId) {
            performances = performances.filter(p => p.playerId === queryParams.playerId);
          }
          if (queryParams.workoutId) {
            performances = performances.filter(p => p.workoutId === queryParams.workoutId);
          }
          
          return { data: performances };
        }
        if (cleanEndpoint.includes('/agility') && method === 'GET') {
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
          const type = cleanEndpoint.includes('/hybrid') ? 'hybrid' : 'agility';
          const newPerformance = {
            ...body,
            date: new Date().toISOString()
          };
          mockPerformanceData[type].push(newPerformance);
          return { data: newPerformance };
        }
      }
      
      // Handle equipment configurations
      if (cleanEndpoint.includes('/equipment-config')) {
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
      const handlerKey = `${method} ${cleanEndpoint}`;
      const handler = trainingMockHandlers[handlerKey] || trainingMockHandlers[`${method} ${cleanEndpoint.replace(/\/[^/]+$/, '/:id')}`];
      
      if (handler) {
        try {
          const result = handler(method === 'GET' ? queryParams : body, { id: cleanEndpoint.split('/').pop() });
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
                location: 'Gym',
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
      if (url.includes('/team/stats')) {
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
    const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
    
    if (isMockMode) {
      return mockBaseQuery(args, api, extraOptions);
    }
    
    return originalBaseQuery(args, api, extraOptions);
  };
};