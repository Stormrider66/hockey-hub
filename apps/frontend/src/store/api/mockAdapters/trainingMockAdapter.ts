import { mockExercises } from '@/features/physical-trainer/constants/mockExercises';
import { 
  comprehensiveMockData,
  comprehensivePlayerData,
  comprehensiveWorkoutExamples,
  activeWorkoutSessions,
  workoutCalendarEvents,
  performanceAnalytics,
  exportExamples
} from './comprehensiveWorkoutMockData';

// Mock test sessions data
const mockTestSessions = [
  {
    id: 'test-session-1',
    name: 'Pre-Season Complete Assessment',
    date: '2025-01-25',
    time: '09:00',
    location: 'trainingCenter',
    testTypes: ['verticalJump', 'broadJump', 'sprint30m', 'vo2Max', 'squat1RM', 'benchPress1RM'],
    assignedPlayers: ['player-001', 'player-002', 'player-003', 'player-004'],
    assignedTeams: ['team-1'],
    status: 'scheduled',
    notes: 'Complete fitness assessment for all players',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-session-2',
    name: 'Speed & Power Testing',
    date: '2025-01-30',
    time: '10:30',
    location: 'track',
    testTypes: ['verticalJump', 'broadJump', 'sprint10m', 'agility5105'],
    assignedPlayers: ['player-005', 'player-006', 'player-007'],
    assignedTeams: [],
    status: 'scheduled',
    notes: 'Focus on explosive power and speed metrics',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-session-3',
    name: 'Return to Play Assessment - Connor McDavid',
    date: '2025-02-05',
    time: '14:00',
    location: 'medicalCenter',
    testTypes: ['flexibility', 'balanceTest', 'reactionTime', 'cooperTest'],
    assignedPlayers: ['player-001'],
    assignedTeams: [],
    status: 'scheduled',
    notes: 'Progressive testing for return from injury',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString(),
  },
];

// Mock test data for players with comprehensive physiological data
const mockTestData = [
  // Sidney Crosby (player-001) - Complete physiological profile
  {
    id: 'test-001',
    playerId: 'player-001',
    testBatchId: 'batch-001',
    testType: 'max_hr',
    value: 195,
    unit: 'bpm',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Cardiovascular',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-002',
    playerId: 'player-001',
    testBatchId: 'batch-001',
    testType: 'vo2max',
    value: 58.5,
    unit: 'ml/kg/min',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Cardiovascular',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-003',
    playerId: 'player-001',
    testBatchId: 'batch-001',
    testType: 'ftp',
    value: 280,
    unit: 'watts',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Power',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-004',
    playerId: 'player-001',
    testBatchId: 'batch-001',
    testType: 'lt1',
    value: 156,
    unit: 'bpm',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Lactate',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString(),
    subValues: { lactateLevel: 2.0, powerAtLT1: 210 }
  },
  {
    id: 'test-005',
    playerId: 'player-001',
    testBatchId: 'batch-001',
    testType: 'lt2',
    value: 175,
    unit: 'bpm',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Lactate',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString(),
    subValues: { lactateLevel: 4.0, powerAtLT2: 265 }
  },
  {
    id: 'test-006',
    playerId: 'player-001',
    testBatchId: 'batch-001',
    testType: 'max_watts',
    value: 450,
    unit: 'watts',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Power',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  
  // Nathan MacKinnon (player-002) - Complete physiological profile
  {
    id: 'test-007',
    playerId: 'player-002',
    testBatchId: 'batch-002',
    testType: 'max_hr',
    value: 198,
    unit: 'bpm',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Cardiovascular',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-008',
    playerId: 'player-002',
    testBatchId: 'batch-002',
    testType: 'vo2max',
    value: 62.1,
    unit: 'ml/kg/min',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Cardiovascular',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-009',
    playerId: 'player-002',
    testBatchId: 'batch-002',
    testType: 'ftp',
    value: 310,
    unit: 'watts',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Power',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-010',
    playerId: 'player-002',
    testBatchId: 'batch-002',
    testType: 'lt1',
    value: 158,
    unit: 'bpm',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Lactate',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString(),
    subValues: { lactateLevel: 2.0, powerAtLT1: 230 }
  },
  {
    id: 'test-011',
    playerId: 'player-002',
    testBatchId: 'batch-002',
    testType: 'lt2',
    value: 178,
    unit: 'bpm',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Lactate',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString(),
    subValues: { lactateLevel: 4.0, powerAtLT2: 290 }
  },
  {
    id: 'test-012',
    playerId: 'player-002',
    testBatchId: 'batch-002',
    testType: 'max_watts',
    value: 475,
    unit: 'watts',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Power',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },

  // More players with varying fitness levels
  {
    id: 'test-013',
    playerId: 'player-003',
    testBatchId: 'batch-003',
    testType: 'max_hr',
    value: 192,
    unit: 'bpm',
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Cardiovascular',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-014',
    playerId: 'player-003',
    testBatchId: 'batch-003',
    testType: 'ftp',
    value: 250,
    unit: 'watts',
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Power',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-015',
    playerId: 'player-004',
    testBatchId: 'batch-004',
    testType: 'max_hr',
    value: 188,
    unit: 'bpm',
    date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Cardiovascular',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-016',
    playerId: 'player-004',
    testBatchId: 'batch-004',
    testType: 'ftp',
    value: 270,
    unit: 'watts',
    date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Power',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },

  // Legacy strength test data
  {
    id: 'test-017',
    playerId: 'player-001',
    testBatchId: 'batch-001',
    testType: 'Squat 1RM',
    value: 120,
    unit: 'kg',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Strength',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-018',
    playerId: 'player-001',
    testBatchId: 'batch-001',
    testType: 'Bench Press 1RM',
    value: 90,
    unit: 'kg',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Strength',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  }
];

// Mock session templates
const mockSessionTemplates = [
  {
    id: 'template-001',
    name: 'Pre-Season Strength Builder',
    description: 'Complete strength training program for pre-season preparation',
    type: 'strength',
    category: 'strength',
    duration: 75,
    exercises: [], // Simplified for performance
    equipment: ['Barbell', 'Dumbbells', 'Squat Rack', 'Bench'],
    targetPlayers: 'all',
    difficulty: 'intermediate',
    tags: ['pre-season', 'strength', 'power'],
    usageCount: 24,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'trainer-001',
    organizationId: 'org-001',
    isPublic: true,
    phases: [
      { type: 'warmup', name: 'Warm Up', exercises: [], duration: 10 },
      { type: 'main', name: 'Main Work', exercises: [], duration: 45 },
      { type: 'accessory', name: 'Accessory', exercises: [], duration: 15 },
      { type: 'cooldown', name: 'Cool Down', exercises: [], duration: 5 }
    ]
  },
  {
    id: 'template-002',
    name: 'Game Day Activation',
    description: 'Light activation session for game day preparation',
    type: 'mixed',
    category: 'activation',
    duration: 30,
    exercises: [], // Simplified for performance
    equipment: ['None', 'Foam Roller'],
    targetPlayers: 'all',
    difficulty: 'beginner',
    tags: ['game-day', 'activation', 'mobility'],
    usageCount: 45,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'trainer-001',
    organizationId: 'org-001',
    isPublic: true,
    phases: [
      { type: 'warmup', name: 'Activation', exercises: [], duration: 15 },
      { type: 'core', name: 'Core Stability', exercises: [], duration: 10 },
      { type: 'cooldown', name: 'Recovery', exercises: [], duration: 5 }
    ]
  },
  {
    id: 'template-003',
    name: 'Hockey Power Development',
    description: 'Explosive power training for hockey performance',
    type: 'strength',
    category: 'power',
    duration: 60,
    exercises: [], // Simplified for performance
    equipment: ['Plyo Box', 'Medicine Ball'],
    targetPlayers: 'all',
    difficulty: 'advanced',
    tags: ['power', 'explosive', 'hockey-specific'],
    usageCount: 18,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'trainer-001',
    organizationId: 'org-001',
    isPublic: true,
    phases: [
      { type: 'warmup', name: 'Dynamic Warm Up', exercises: [], duration: 10 },
      { type: 'main', name: 'Power Development', exercises: [], duration: 35 },
      { type: 'accessory', name: 'Support Work', exercises: [], duration: 10 },
      { type: 'cooldown', name: 'Recovery', exercises: [], duration: 5 }
    ]
  },
  {
    id: 'template-004',
    name: 'Hockey Circuit HIIT',
    description: 'High-intensity circuit combining strength and cardio intervals',
    type: 'hybrid',
    workoutType: 'HYBRID',
    category: 'conditioning',
    duration: 50,
    exercises: [],
    hybridBlocks: [
      {
        type: 'exercise',
        name: 'Power Circuit',
        exercises: ['Medicine Ball Slams', 'Battle Ropes', 'Box Jumps'],
        duration: 12
      },
      {
        type: 'interval',
        name: 'Bike Intervals',
        equipment: 'bike',
        intervals: [
          { duration: 30, intensity: 'Sprint', targetPower: 300 },
          { duration: 60, intensity: 'Recovery', targetPower: 100 }
        ],
        rounds: 4,
        duration: 6
      },
      {
        type: 'exercise',
        name: 'Core Circuit',
        exercises: ['Plank Variations', 'Russian Twists', 'Dead Bugs'],
        duration: 10
      }
    ],
    equipment: ['Bike', 'Medicine Ball', 'Battle Ropes', 'Box'],
    targetPlayers: 'all',
    difficulty: 'intermediate',
    tags: ['circuit', 'HIIT', 'hybrid', 'conditioning'],
    usageCount: 32,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'trainer-001',
    organizationId: 'org-001',
    isPublic: true
  },
  {
    id: 'template-005',
    name: 'Elite Agility Complex',
    description: 'Comprehensive agility training for elite players',
    type: 'agility',
    workoutType: 'AGILITY',
    category: 'speed',
    duration: 45,
    exercises: [],
    agilityDrills: [
      { drillId: 'agility-001', name: '5-10-5 Pro Agility', sets: 4, rest: 60 },
      { drillId: 'agility-002', name: 'Ladder - Ickey Shuffle', sets: 3, rest: 30 },
      { drillId: 'agility-003', name: 'T-Drill', sets: 3, rest: 90 },
      { drillId: 'agility-010', name: 'Reaction Lights', sets: 2, rest: 120 }
    ],
    equipment: ['Cones', 'Agility Ladder', 'Reaction Lights'],
    targetPlayers: 'elite',
    difficulty: 'advanced',
    tags: ['agility', 'speed', 'reaction', 'testing'],
    usageCount: 28,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'trainer-002',
    organizationId: 'org-001',
    isPublic: true
  }
];

// Enhanced mock sessions with comprehensive data
const enhancedMockSessions = [
  // Convert comprehensive workout examples to session format
  {
    id: comprehensiveWorkoutExamples.strength.id,
    ...comprehensiveWorkoutExamples.strength,
    title: comprehensiveWorkoutExamples.strength.name,
    type: 'strength',
    workoutType: 'STRENGTH',
    status: 'published',
    scheduledDate: comprehensiveWorkoutExamples.strength.scheduledDate?.toISOString(),
    teamId: comprehensiveWorkoutExamples.strength.assignedTeamIds?.[0],
    playerIds: comprehensiveWorkoutExamples.strength.assignedPlayerIds,
    exercises: comprehensiveWorkoutExamples.strength.phases?.flatMap(phase => phase.exercises) || [],
    createdAt: comprehensiveWorkoutExamples.strength.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: comprehensiveWorkoutExamples.conditioning.id,
    ...comprehensiveWorkoutExamples.conditioning,
    title: comprehensiveWorkoutExamples.conditioning.name,
    type: 'conditioning',
    workoutType: 'CONDITIONING',
    status: 'published',
    scheduledDate: comprehensiveWorkoutExamples.conditioning.scheduledDate?.toISOString(),
    teamId: comprehensiveWorkoutExamples.conditioning.assignedTeamIds?.[0],
    playerIds: comprehensiveWorkoutExamples.conditioning.assignedPlayerIds,
    createdAt: comprehensiveWorkoutExamples.conditioning.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: comprehensiveWorkoutExamples.hybrid.id,
    ...comprehensiveWorkoutExamples.hybrid,
    title: comprehensiveWorkoutExamples.hybrid.name,
    type: 'hybrid',
    workoutType: 'HYBRID',
    status: 'published',
    scheduledDate: comprehensiveWorkoutExamples.hybrid.scheduledDate?.toISOString(),
    teamId: comprehensiveWorkoutExamples.hybrid.assignedTeamIds?.[0],
    playerIds: comprehensiveWorkoutExamples.hybrid.assignedPlayerIds,
    createdAt: comprehensiveWorkoutExamples.hybrid.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: comprehensiveWorkoutExamples.agility.id,
    ...comprehensiveWorkoutExamples.agility,
    title: comprehensiveWorkoutExamples.agility.name,
    type: 'agility',
    workoutType: 'AGILITY',
    status: 'published',
    scheduledDate: comprehensiveWorkoutExamples.agility.scheduledDate?.toISOString(),
    teamId: comprehensiveWorkoutExamples.agility.assignedTeamIds?.[0],
    playerIds: comprehensiveWorkoutExamples.agility.assignedPlayerIds,
    createdAt: comprehensiveWorkoutExamples.agility.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock sessions array for backward compatibility with unified API
const mockSessions: any[] = [...enhancedMockSessions];

export const trainingMockHandlers = {
  // Get exercises
  'GET /exercises': (params: any) => {
    let exercises = [...mockExercises];
    
    // Filter by category if provided
    if (params.category && params.category !== 'all') {
      exercises = exercises.filter(ex => ex.category === params.category);
    }
    
    // Filter by search term if provided
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      exercises = exercises.filter(ex => 
        ex.name.toLowerCase().includes(searchLower) ||
        ex.muscleGroups.some(mg => mg.toLowerCase().includes(searchLower)) ||
        ex.equipment.some(eq => eq.toLowerCase().includes(searchLower))
      );
    }
    
    return { exercises };
  },

  // Get test data
  'GET /tests': (params: any) => {
    let results = [...mockTestData];
    
    // Filter by player IDs if provided
    if (params.playerIds) {
      const playerIds = params.playerIds.split(',');
      results = results.filter(test => playerIds.includes(test.playerId));
    }
    
    // Filter by test type if provided
    if (params.testType) {
      results = results.filter(test => test.testType === params.testType);
    }
    
    return { results };
  },
  
  // Get test sessions
  'GET /test-sessions': (params: any) => {
    let sessions = [...mockTestSessions];
    
    // Filter by status if provided
    if (params.status) {
      sessions = sessions.filter(session => session.status === params.status);
    }
    
    // Filter by date if provided
    if (params.date) {
      sessions = sessions.filter(session => session.date === params.date);
    }
    
    return sessions;
  },
  
  // Create test session
  'POST /test-sessions': (data: any) => {
    const newSession = {
      id: `test-session-${Date.now()}`,
      ...data,
      createdBy: 'trainer-001',
      createdAt: new Date().toISOString(),
    };
    
    mockTestSessions.push(newSession);
    return newSession;
  },
  
  // Update test session
  'PATCH /test-sessions/:id': (data: any, id: string) => {
    const sessionIndex = mockTestSessions.findIndex(session => session.id === id);
    if (sessionIndex !== -1) {
      mockTestSessions[sessionIndex] = { ...mockTestSessions[sessionIndex], ...data };
      return mockTestSessions[sessionIndex];
    }
    throw new Error('Test session not found');
  },
  
  // Delete test session
  'DELETE /test-sessions/:id': (data: any, id: string) => {
    const sessionIndex = mockTestSessions.findIndex(session => session.id === id);
    if (sessionIndex !== -1) {
      mockTestSessions.splice(sessionIndex, 1);
      return { success: true };
    }
    throw new Error('Test session not found');
  },

  // Get session templates
  'GET /templates': (params: any) => {
    // Optimize for performance - return minimal data
    const limit = params.limit || 20;
    
    // Return simplified templates for performance
    const simplifiedTemplates = mockSessionTemplates.slice(0, limit).map(template => ({
      ...template,
      exercises: [], // Remove exercises array to reduce payload size
      phases: template.phases?.map(phase => ({ ...phase, exercises: [] })) || [] // Remove nested exercises
    }));
    
    let templates = [...simplifiedTemplates];
    
    // Filter by search if provided
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by type if provided
    if (params.type) {
      templates = templates.filter(t => t.type === params.type);
    }
    
    // Filter by difficulty if provided
    if (params.difficulty) {
      templates = templates.filter(t => t.difficulty === params.difficulty);
    }
    
    // Apply pagination
    const page = parseInt(params.page) || 1;
    const paginationLimit = parseInt(params.limit) || limit; // Use already declared limit as fallback
    const startIndex = (page - 1) * paginationLimit;
    const endIndex = startIndex + paginationLimit;
    const paginatedTemplates = templates.slice(startIndex, endIndex);
    
    return {
      success: true,
      data: paginatedTemplates,
      meta: {
        total: templates.length,
        page,
        limit,
        totalPages: Math.ceil(templates.length / limit)
      }
    };
  },

  // Create session template
  'POST /templates': (body: any) => {
    const newTemplate = {
      id: `template-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-trainer',
      usageCount: 0
    };
    
    return {
      success: true,
      data: newTemplate
    };
  },

  // Update session template
  'PUT /templates/:id': (body: any, params: any) => {
    const template = mockSessionTemplates.find(t => t.id === params.id);
    if (!template) {
      throw new Error('Template not found');
    }
    
    const updatedTemplate = {
      ...template,
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    return {
      success: true,
      data: updatedTemplate
    };
  },

  // Get test batches
  'GET /test-batches': () => {
    return [
      {
        id: 'batch-001',
        name: 'Pre-Season Testing',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        completedTests: 25,
        totalTests: 25,
        teamId: 'team-001',
        notes: 'All players tested successfully',
        createdBy: 'trainer-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  },

  // Get workout sessions
  'GET /sessions': (params: any) => {
    const today = new Date().toISOString().split('T')[0];
    const teamSessionData: Record<string, any[]> = {
      'a-team': [
        {
          id: 'session-001',
          title: 'Max Strength Testing',
          name: 'Max Strength Testing',
          type: 'strength',
          status: 'completed',
          scheduledDate: `${today}T06:00:00Z`,
          date: today,
          time: '06:00',
          estimatedDuration: 90,
          duration: 90,
          location: 'weightRoom',
          teamId: 'a-team',
          team: 'A-Team',
          players: 25,
          currentParticipants: 25,
          maxParticipants: 30,
          intensity: 'high',
          equipment: ['Barbell', 'Squat Rack'],
          description: 'Max strength testing - 1RM squats and deadlifts'
        },
        {
          id: 'session-002',
          title: 'VO2 Max Intervals',
          name: 'VO2 Max Intervals',
          type: 'conditioning',
          status: 'active',
          scheduledDate: `${today}T09:00:00Z`,
          date: today,
          time: '09:00',
          estimatedDuration: 60,
          duration: 60,
          location: 'track',
          teamId: 'a-team',
          team: 'A-Team',
          players: 23,
          currentParticipants: 18,
          maxParticipants: 25,
          intensity: 'high',
          equipment: ['Track', 'Heart Rate Monitors'],
          description: 'High intensity intervals - 4x4min at 90% max HR'
        },
        {
          id: 'session-003',
          title: 'Elite Power Circuit',
          name: 'Elite Power Circuit',
          type: 'hybrid',
          workoutType: 'HYBRID',
          status: 'upcoming',
          scheduledDate: `${today}T14:00:00Z`,
          date: today,
          time: '14:00',
          estimatedDuration: 75,
          duration: 75,
          location: 'gym',
          teamId: 'a-team',
          team: 'A-Team',
          players: 20,
          currentParticipants: 0,
          maxParticipants: 25,
          intensity: 'high',
          equipment: ['Plyo Box', 'Medicine Ball', 'Battle Ropes'],
          description: 'Olympic lifts + explosive plyo circuits'
        },
        {
          id: 'session-004',
          title: 'Pro Agility Testing',
          name: 'Pro Agility Testing',
          type: 'agility',
          workoutType: 'AGILITY',
          status: 'upcoming',
          scheduledDate: `${today}T16:30:00Z`,
          date: today,
          time: '16:30',
          estimatedDuration: 45,
          duration: 45,
          location: 'field',
          teamId: 'a-team',
          team: 'A-Team',
          players: 22,
          currentParticipants: 0,
          maxParticipants: 25,
          intensity: 'high',
          equipment: ['Cones', 'Timing Gates'],
          description: '5-10-5 and T-drill time trials'
        }
      ],
      'j20': [
        {
          id: 'session-005',
          title: 'Morning Power Development',
          name: 'Morning Power Development',
          type: 'strength',
          status: 'completed',
          scheduledDate: `${today}T07:00:00Z`,
          date: today,
          time: '07:00',
          estimatedDuration: 75,
          duration: 75,
          location: 'weightRoom',
          teamId: 'j20',
          team: 'J20',
          players: 20,
          currentParticipants: 19,
          maxParticipants: 22,
          intensity: 'medium',
          equipment: ['Dumbbells', 'Cable Machine'],
          description: 'Power clean progressions and jump squats'
        },
        {
          id: 'session-006',
          title: 'Lactate Threshold Training',
          name: 'Lactate Threshold Training',
          type: 'conditioning',
          status: 'active',
          scheduledDate: `${today}T10:00:00Z`,
          date: today,
          time: '10:00',
          estimatedDuration: 50,
          duration: 50,
          location: 'track',
          teamId: 'j20',
          team: 'J20',
          players: 18,
          currentParticipants: 15,
          maxParticipants: 20,
          intensity: 'medium',
          equipment: ['Rowing Machine', 'Bike'],
          description: 'Tempo intervals - 3x8min at threshold pace'
        },
        {
          id: 'session-007',
          title: 'Hockey-Specific Circuit',
          name: 'Hockey-Specific Circuit',
          type: 'hybrid',
          workoutType: 'HYBRID',
          status: 'upcoming',
          scheduledDate: `${today}T13:30:00Z`,
          date: today,
          time: '13:30',
          estimatedDuration: 60,
          duration: 60,
          location: 'gym',
          teamId: 'j20',
          team: 'J20',
          players: 17,
          currentParticipants: 0,
          maxParticipants: 20,
          intensity: 'medium',
          equipment: ['Slide Board', 'Medicine Ball'],
          description: 'Power endurance circuits with hockey movements'
        }
      ],
      'u18': [
        {
          id: 'session-008',
          title: 'Speed Development',
          name: 'Speed Development',
          type: 'agility',
          workoutType: 'AGILITY',
          status: 'completed',
          scheduledDate: `${today}T08:00:00Z`,
          date: today,
          time: '08:00',
          estimatedDuration: 45,
          duration: 45,
          location: 'field',
          teamId: 'u18',
          team: 'U18',
          players: 16,
          currentParticipants: 16,
          maxParticipants: 18,
          intensity: 'medium',
          equipment: ['Agility Ladder', 'Mini Hurdles'],
          description: 'Linear speed mechanics and acceleration work'
        },
        {
          id: 'session-009',
          title: 'Strength Foundations',
          name: 'Strength Foundations',
          type: 'strength',
          status: 'active',
          scheduledDate: `${today}T11:00:00Z`,
          date: today,
          time: '11:00',
          estimatedDuration: 60,
          duration: 60,
          location: 'gym',
          teamId: 'u18',
          team: 'U18',
          players: 15,
          currentParticipants: 12,
          maxParticipants: 16,
          intensity: 'medium',
          equipment: ['Barbell', 'Kettlebells'],
          description: 'Core lifts with emphasis on technique'
        },
        {
          id: 'session-010',
          title: 'Mixed Training',
          name: 'Mixed Training',
          type: 'hybrid',
          workoutType: 'HYBRID',
          status: 'upcoming',
          scheduledDate: `${today}T14:30:00Z`,
          date: today,
          time: '14:30',
          estimatedDuration: 60,
          duration: 60,
          location: 'gym',
          teamId: 'u18',
          team: 'U18',
          players: 14,
          currentParticipants: 0,
          maxParticipants: 16,
          intensity: 'medium',
          equipment: ['TRX', 'Medicine Ball', 'Bike'],
          description: 'Functional strength + energy system development'
        }
      ],
      'u16': [
        {
          id: 'session-011',
          title: 'Movement Skills',
          name: 'Movement Skills',
          type: 'agility',
          workoutType: 'AGILITY',
          status: 'active',
          scheduledDate: `${today}T09:30:00Z`,
          date: today,
          time: '09:30',
          estimatedDuration: 45,
          duration: 45,
          location: 'gym',
          teamId: 'u16',
          team: 'U16',
          players: 20,
          currentParticipants: 18,
          maxParticipants: 22,
          intensity: 'low',
          equipment: ['Cones', 'Agility Dots'],
          description: 'Basic coordination and footwork patterns'
        },
        {
          id: 'session-012',
          title: 'Bodyweight Training',
          name: 'Bodyweight Training',
          type: 'strength',
          status: 'upcoming',
          scheduledDate: `${today}T12:00:00Z`,
          date: today,
          time: '12:00',
          estimatedDuration: 45,
          duration: 45,
          location: 'gym',
          teamId: 'u16',
          team: 'U16',
          players: 15,
          currentParticipants: 0,
          maxParticipants: 20,
          intensity: 'low',
          equipment: ['Pull-up Bar', 'Resistance Bands'],
          description: 'Bodyweight fundamentals - proper form focus'
        }
      ],
      'womens': [
        {
          id: 'session-013',
          title: 'Boot Camp Circuit',
          name: 'Boot Camp Circuit',
          type: 'hybrid',
          workoutType: 'HYBRID',
          status: 'completed',
          scheduledDate: `${today}T06:30:00Z`,
          date: today,
          time: '06:30',
          estimatedDuration: 60,
          duration: 60,
          location: 'gym',
          teamId: 'womens',
          team: "Women's Team",
          players: 21,
          currentParticipants: 21,
          maxParticipants: 25,
          intensity: 'high',
          equipment: ['Kettlebells', 'Box', 'Battle Ropes'],
          description: 'Boot camp - plyometrics + core circuits'
        },
        {
          id: 'session-014',
          title: 'Full Body Strength',
          name: 'Full Body Strength',
          type: 'strength',
          status: 'active',
          scheduledDate: `${today}T09:00:00Z`,
          date: today,
          time: '09:00',
          estimatedDuration: 75,
          duration: 75,
          location: 'weightRoom',
          teamId: 'womens',
          team: "Women's Team",
          players: 19,
          currentParticipants: 17,
          maxParticipants: 20,
          intensity: 'medium',
          equipment: ['Barbell', 'Dumbbells', 'Cable Machine'],
          description: 'Full body strength - compound movements'
        },
        {
          id: 'session-015',
          title: 'Sport-Specific Agility',
          name: 'Sport-Specific Agility',
          type: 'agility',
          workoutType: 'AGILITY',
          status: 'upcoming',
          scheduledDate: `${today}T11:30:00Z`,
          date: today,
          time: '11:30',
          estimatedDuration: 50,
          duration: 50,
          location: 'field',
          teamId: 'womens',
          team: "Women's Team",
          players: 23,
          currentParticipants: 0,
          maxParticipants: 25,
          intensity: 'high',
          equipment: ['Cones', 'Reaction Lights', 'Agility Ladder'],
          description: 'Sport-specific agility patterns'
        }
      ]
    };
    
    // Get all sessions
    let allSessions: any[] = [];
    Object.values(teamSessionData).forEach(teamSessions => {
      allSessions = allSessions.concat(teamSessions);
    });
    
    // Filter by teamId if provided
    if (params.teamId && teamSessionData[params.teamId]) {
      return teamSessionData[params.teamId];
    }
    
    // Filter by type if provided
    if (params.type) {
      return allSessions.filter(s => s.type === params.type || s.workoutType === params.type);
    }
    
    // Return all sessions if no filters
    return allSessions;
  },

  // ============================================
  // UNIFIED TRAINING API ENDPOINTS
  // ============================================

  // GET /training/workouts - List workouts with filtering and pagination
  'GET /workouts': (params: any) => {
    const {
      page = 1,
      limit = 20,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      search,
      dateFrom,
      dateTo,
      types,
      playerIds,
      teamIds,
      status = 'published'
    } = params;

    // Get base sessions and transform to unified format
    let workouts = mockSessions.map(session => ({
      id: session.id,
      type: session.workoutType || 'STRENGTH',
      name: session.title || session.name,
      description: session.description || `${session.type} workout session`,
      scheduledDate: session.scheduledDate ? new Date(session.scheduledDate) : undefined,
      location: session.location,
      estimatedDuration: session.estimatedDuration || session.duration,
      assignedPlayerIds: session.playerIds || [],
      assignedTeamIds: session.teamId ? [session.teamId] : [],
      exercises: session.exercises || [],
      settings: session.settings || {},
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      // Type-specific fields
      ...(session.intervalProgram && { intervalProgram: session.intervalProgram }),
      ...(session.hybridProgram && { hybridProgram: session.hybridProgram }),
      ...(session.agilityProgram && { agilityProgram: session.agilityProgram }),
      ...(session.hybridWorkoutId && { hybridWorkoutId: session.hybridWorkoutId }),
      ...(session.agilityDrills && { agilityDrills: session.agilityDrills }),
    }));

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      workouts = workouts.filter(w => 
        w.name.toLowerCase().includes(searchLower) ||
        w.description?.toLowerCase().includes(searchLower)
      );
    }

    if (types) {
      const typeArray = Array.isArray(types) ? types : types.split(',');
      workouts = workouts.filter(w => typeArray.includes(w.type));
    }

    if (playerIds) {
      const playerArray = Array.isArray(playerIds) ? playerIds : playerIds.split(',');
      workouts = workouts.filter(w => 
        w.assignedPlayerIds?.some(id => playerArray.includes(id))
      );
    }

    if (teamIds) {
      const teamArray = Array.isArray(teamIds) ? teamIds : teamIds.split(',');
      workouts = workouts.filter(w => 
        w.assignedTeamIds?.some(id => teamArray.includes(id))
      );
    }

    if (dateFrom || dateTo) {
      workouts = workouts.filter(w => {
        if (!w.scheduledDate) return false;
        const workoutDate = new Date(w.scheduledDate);
        if (dateFrom && workoutDate < new Date(dateFrom)) return false;
        if (dateTo && workoutDate > new Date(dateTo)) return false;
        return true;
      });
    }

    // Apply sorting
    workouts.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'scheduledDate':
          aVal = a.scheduledDate || new Date(0);
          bVal = b.scheduledDate || new Date(0);
          break;
        case 'type':
          aVal = a.type;
          bVal = b.type;
          break;
        default:
          aVal = a.updatedAt;
          bVal = b.updatedAt;
      }
      
      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedWorkouts = workouts.slice(startIndex, endIndex);

    return {
      data: paginatedWorkouts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: workouts.length,
        totalPages: Math.ceil(workouts.length / limit),
        hasNext: endIndex < workouts.length,
        hasPrevious: page > 1,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 85,
      }
    };
  },

  // GET /training/workouts/:id - Get single workout
  'GET /workouts/:id': (params: any, context: any) => {
    const { id } = context;
    const session = mockSessions.find(s => s.id === id);
    
    if (!session) {
      throw new Error(`Workout with id ${id} not found`);
    }

    const workout = {
      id: session.id,
      type: session.workoutType || 'STRENGTH',
      name: session.title || session.name,
      description: session.description || `${session.type} workout session`,
      scheduledDate: session.scheduledDate ? new Date(session.scheduledDate) : undefined,
      location: session.location,
      estimatedDuration: session.estimatedDuration || session.duration,
      assignedPlayerIds: session.playerIds || [],
      assignedTeamIds: session.teamId ? [session.teamId] : [],
      exercises: session.exercises || [],
      settings: session.settings || {},
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      // Type-specific fields
      ...(session.intervalProgram && { intervalProgram: session.intervalProgram }),
      ...(session.hybridProgram && { hybridProgram: session.hybridProgram }),
      ...(session.agilityProgram && { agilityProgram: session.agilityProgram }),
      ...(session.hybridWorkoutId && { hybridWorkoutId: session.hybridWorkoutId }),
      ...(session.agilityDrills && { agilityDrills: session.agilityDrills }),
    };

    return {
      data: workout,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 45,
      }
    };
  },

  // GET /training/workouts/recent - Get recent workouts
  'GET /workouts/recent': (params: any) => {
    // Get the 5 most recent workouts
    const recentWorkouts = mockSessions
      .slice(0, 5)
      .map((session, index) => ({
        id: session.id,
        name: session.title || session.name,
        type: session.workoutType || 'STRENGTH',
        createdAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - index * 12 * 60 * 60 * 1000).toISOString(),
        playerCount: session.playerIds?.length || 0,
        teamCount: session.teamId ? 1 : 0,
        duration: session.estimatedDuration || session.duration || 60,
        isFavorite: index < 2, // First two are favorites
        usageCount: 5 - index,
        successRate: 85 + index * 3,
        templateId: session.templateId,
        // Enhanced scheduling information
        location: session.location ? {
          facilityName: session.location,
          area: index === 0 ? 'Weight Room' : index === 1 ? 'Track' : undefined
        } : undefined,
        scheduledDate: session.scheduledDate,
        assignedPlayers: session.playerIds,
        assignedTeams: session.teamId ? [session.teamId] : [],
        recurring: index === 1 ? {
          frequency: 'Weekly',
          daysOfWeek: [1, 3, 5] // Monday, Wednesday, Friday
        } : undefined,
        hasReminders: index < 3 // First three have reminders
      }));

    return recentWorkouts;
  },

  // POST /training/workouts - Create new workout
  'POST /workouts': (body: any) => {
    const { type, workout } = body;
    
    const newWorkout = {
      id: `workout-${Date.now()}`,
      type,
      ...workout,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to mock sessions for backward compatibility
    const newSession = {
      id: newWorkout.id,
      title: newWorkout.name,
      name: newWorkout.name,
      description: newWorkout.description,
      type: type.toLowerCase(),
      workoutType: type,
      status: 'published',
      scheduledDate: newWorkout.scheduledDate?.toISOString(),
      location: newWorkout.location,
      estimatedDuration: newWorkout.estimatedDuration,
      duration: newWorkout.estimatedDuration,
      teamId: newWorkout.assignedTeamIds?.[0],
      playerIds: newWorkout.assignedPlayerIds,
      exercises: newWorkout.exercises,
      settings: newWorkout.settings,
      createdAt: newWorkout.createdAt.toISOString(),
      updatedAt: newWorkout.updatedAt.toISOString(),
      // Type-specific fields
      ...(newWorkout.intervalProgram && { intervalProgram: newWorkout.intervalProgram }),
      ...(newWorkout.hybridProgram && { hybridProgram: newWorkout.hybridProgram }),
      ...(newWorkout.agilityProgram && { agilityProgram: newWorkout.agilityProgram }),
    };

    mockSessions.push(newSession);

    return {
      data: newWorkout,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 120,
      }
    };
  },

  // PUT /training/workouts/:id - Update workout
  'PUT /workouts/:id': (body: any, context: any) => {
    const { id } = context;
    const { type, workout } = body;
    
    const sessionIndex = mockSessions.findIndex(s => s.id === id);
    if (sessionIndex === -1) {
      throw new Error(`Workout with id ${id} not found`);
    }

    // Update the session
    const updatedSession = {
      ...mockSessions[sessionIndex],
      ...workout,
      type: type.toLowerCase(),
      workoutType: type,
      title: workout.name || mockSessions[sessionIndex].title,
      name: workout.name || mockSessions[sessionIndex].name,
      scheduledDate: workout.scheduledDate?.toISOString() || mockSessions[sessionIndex].scheduledDate,
      teamId: workout.assignedTeamIds?.[0] || mockSessions[sessionIndex].teamId,
      playerIds: workout.assignedPlayerIds || mockSessions[sessionIndex].playerIds,
      updatedAt: new Date().toISOString(),
    };

    mockSessions[sessionIndex] = updatedSession;

    const updatedWorkout = {
      id,
      type,
      ...workout,
      updatedAt: new Date(),
    };

    return {
      data: updatedWorkout,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 95,
      }
    };
  },

  // DELETE /training/workouts/:id - Delete workout
  'DELETE /workouts/:id': (params: any, context: any) => {
    const { id } = context;
    const sessionIndex = mockSessions.findIndex(s => s.id === id);
    
    if (sessionIndex === -1) {
      throw new Error(`Workout with id ${id} not found`);
    }

    mockSessions.splice(sessionIndex, 1);

    return {
      success: true,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 35,
      }
    };
  },

  // POST /training/workouts/batch - Batch operations
  'POST /workouts/batch': (body: any) => {
    const { operation, workoutIds, workouts, updates } = body;
    const successful: string[] = [];
    const failed: Array<{ id?: string; error: string }> = [];

    switch (operation) {
      case 'create':
        if (workouts) {
          workouts.forEach((workoutData: any, index: number) => {
            try {
              const result = trainingMockHandlers['POST /workouts'](workoutData);
              successful.push(result.data.id);
            } catch (error) {
              failed.push({
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          });
        }
        break;

      case 'update':
        if (workoutIds && updates) {
          workoutIds.forEach((id: string) => {
            try {
              trainingMockHandlers['PUT /workouts/:id'](
                { type: 'STRENGTH', workout: updates },
                { id }
              );
              successful.push(id);
            } catch (error) {
              failed.push({
                id,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          });
        }
        break;

      case 'delete':
        if (workoutIds) {
          workoutIds.forEach((id: string) => {
            try {
              trainingMockHandlers['DELETE /workouts/:id']({}, { id });
              successful.push(id);
            } catch (error) {
              failed.push({
                id,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          });
        }
        break;

      default:
        throw new Error(`Unsupported batch operation: ${operation}`);
    }

    return {
      successful,
      failed,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 150,
      }
    };
  },

  // POST /training/workouts/:id/duplicate - Duplicate workout
  'POST /workouts/:id/duplicate': (body: any, context: any) => {
    const { id } = context;
    const { modifications, includeAssignments } = body;
    
    const originalSession = mockSessions.find(s => s.id === id);
    if (!originalSession) {
      throw new Error(`Workout with id ${id} not found`);
    }

    const duplicatedWorkout = {
      id: `workout-${Date.now()}-copy`,
      type: originalSession.workoutType || 'STRENGTH',
      name: `${originalSession.title || originalSession.name} (Copy)`,
      description: originalSession.description,
      scheduledDate: undefined, // Don't copy scheduled date
      location: originalSession.location,
      estimatedDuration: originalSession.estimatedDuration || originalSession.duration,
      assignedPlayerIds: includeAssignments ? (originalSession.playerIds || []) : [],
      assignedTeamIds: includeAssignments ? (originalSession.teamId ? [originalSession.teamId] : []) : [],
      exercises: originalSession.exercises || [],
      settings: originalSession.settings || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      // Type-specific fields
      ...(originalSession.intervalProgram && { intervalProgram: originalSession.intervalProgram }),
      ...(originalSession.hybridProgram && { hybridProgram: originalSession.hybridProgram }),
      ...(originalSession.agilityProgram && { agilityProgram: originalSession.agilityProgram }),
      // Apply modifications
      ...modifications,
    };

    // Add to mock sessions
    const newSession = {
      ...originalSession,
      id: duplicatedWorkout.id,
      title: duplicatedWorkout.name,
      name: duplicatedWorkout.name,
      scheduledDate: undefined,
      teamId: includeAssignments ? originalSession.teamId : undefined,
      playerIds: includeAssignments ? originalSession.playerIds : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockSessions.push(newSession);

    return {
      data: duplicatedWorkout,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 85,
      }
    };
  },

  // POST /training/workouts/validate - Validate workout
  'POST /workouts/validate': (body: any) => {
    const { workout, type, context } = body;
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];
    const suggestions: Array<{ field: string; suggestion: string; value?: any }> = [];

    // Basic validation
    if (!workout.name || workout.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Workout name is required',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (workout.name && workout.name.length < 3) {
      errors.push({
        field: 'name',
        message: 'Workout name must be at least 3 characters long',
        code: 'INVALID_FIELD_VALUE',
      });
    }

    if (!workout.estimatedDuration || workout.estimatedDuration < 5) {
      errors.push({
        field: 'estimatedDuration',
        message: 'Workout duration must be at least 5 minutes',
        code: 'INVALID_FIELD_VALUE',
      });
    }

    if (workout.estimatedDuration && workout.estimatedDuration > 180) {
      warnings.push({
        field: 'estimatedDuration',
        message: 'Workout duration is unusually long (>3 hours)',
        code: 'DURATION_WARNING',
      });
    }

    // Type-specific validation
    switch (type) {
      case 'STRENGTH':
        if (!workout.exercises || workout.exercises.length === 0) {
          errors.push({
            field: 'exercises',
            message: 'Strength workouts must include at least one exercise',
            code: 'MISSING_REQUIRED_FIELD',
          });
        }
        break;

      case 'CONDITIONING':
        if (!workout.intervalProgram) {
          errors.push({
            field: 'intervalProgram',
            message: 'Conditioning workouts must include an interval program',
            code: 'MISSING_REQUIRED_FIELD',
          });
        }
        break;

      case 'HYBRID':
        if (!workout.hybridProgram || !workout.hybridProgram.blocks || workout.hybridProgram.blocks.length === 0) {
          errors.push({
            field: 'hybridProgram',
            message: 'Hybrid workouts must include at least one block',
            code: 'MISSING_REQUIRED_FIELD',
          });
        }
        break;

      case 'AGILITY':
        if (!workout.agilityProgram || !workout.agilityProgram.drills || workout.agilityProgram.drills.length === 0) {
          errors.push({
            field: 'agilityProgram',
            message: 'Agility workouts must include at least one drill',
            code: 'MISSING_REQUIRED_FIELD',
          });
        }
        break;
    }

    // Assignment validation
    if (context?.playerIds || context?.teamIds || workout.assignedPlayerIds || workout.assignedTeamIds) {
      const assignedPlayers = [
        ...(context?.playerIds || []),
        ...(workout.assignedPlayerIds || [])
      ];
      
      if (assignedPlayers.length === 0 && (!context?.teamIds?.length && !workout.assignedTeamIds?.length)) {
        warnings.push({
          field: 'assignments',
          message: 'No players or teams assigned to this workout',
          code: 'NO_ASSIGNMENTS',
        });
      }

      // Check for medical restrictions (mock check)
      const restrictedPlayers = ['player-005']; // Sidney Crosby
      const hasRestrictedPlayers = assignedPlayers.some(id => restrictedPlayers.includes(id));
      
      if (hasRestrictedPlayers && type === 'STRENGTH') {
        warnings.push({
          field: 'assignments',
          message: 'Some assigned players have medical restrictions that may affect this workout',
          code: 'MEDICAL_RESTRICTION',
        });
      }
    }

    // Suggestions
    if (!workout.description) {
      suggestions.push({
        field: 'description',
        suggestion: 'Adding a description helps players understand the workout goals',
        value: `${type.toLowerCase()} workout for improving performance`,
      });
    }

    if (!workout.location) {
      suggestions.push({
        field: 'location',
        suggestion: 'Specify a location to help with planning and logistics',
        value: 'Training Center',
      });
    }

    return {
      data: {
        valid: errors.length === 0,
        errors,
        warnings,
        suggestions,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 65,
      }
    };
  },

  // GET /training/workouts/:id/validate - Validate existing workout
  'GET /workouts/:id/validate': (params: any, context: any) => {
    const { id } = context;
    const session = mockSessions.find(s => s.id === id);
    
    if (!session) {
      throw new Error(`Workout with id ${id} not found`);
    }

    // Convert session to workout format and validate
    const workout = {
      name: session.title || session.name,
      description: session.description,
      estimatedDuration: session.estimatedDuration || session.duration,
      assignedPlayerIds: session.playerIds || [],
      assignedTeamIds: session.teamId ? [session.teamId] : [],
      exercises: session.exercises || [],
      intervalProgram: session.intervalProgram,
      hybridProgram: session.hybridProgram,
      agilityProgram: session.agilityProgram,
    };

    return trainingMockHandlers['POST /workouts/validate']({
      workout,
      type: session.workoutType || 'STRENGTH',
      context: {}
    });
  },

  // GET /training/workouts/statistics - Get workout statistics
  'GET /workouts/statistics': (params: any) => {
    const { dateFrom, dateTo, groupBy = 'week', playerIds, teamIds } = params;
    
    let filteredSessions = [...mockSessions];
    
    // Apply filters
    if (playerIds) {
      const playerArray = Array.isArray(playerIds) ? playerIds : playerIds.split(',');
      filteredSessions = filteredSessions.filter(s => 
        s.playerIds?.some(id => playerArray.includes(id))
      );
    }
    
    if (teamIds) {
      const teamArray = Array.isArray(teamIds) ? teamIds : teamIds.split(',');
      filteredSessions = filteredSessions.filter(s => 
        teamArray.includes(s.teamId)
      );
    }
    
    if (dateFrom || dateTo) {
      filteredSessions = filteredSessions.filter(s => {
        if (!s.scheduledDate) return false;
        const sessionDate = new Date(s.scheduledDate);
        if (dateFrom && sessionDate < new Date(dateFrom)) return false;
        if (dateTo && sessionDate > new Date(dateTo)) return false;
        return true;
      });
    }

    // Calculate statistics
    const totalCount = filteredSessions.length;
    const byType = filteredSessions.reduce((acc, session) => {
      const type = session.workoutType || 'STRENGTH';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = filteredSessions.reduce((acc, session) => {
      acc[session.status || 'published'] = (acc[session.status || 'published'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate recent activity (mock data)
    const recentActivity = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      recentActivity.unshift({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5) + 1,
      });
    }

    const statistics = {
      totalCount,
      byType,
      byStatus,
      recentActivity,
      popularExercises: [
        { exerciseId: 'ex-001', name: 'Squat', count: 45 },
        { exerciseId: 'ex-002', name: 'Bench Press', count: 38 },
        { exerciseId: 'ex-003', name: 'Deadlift', count: 35 },
        { exerciseId: 'ex-004', name: 'Pull-ups', count: 32 },
        { exerciseId: 'ex-005', name: 'Push-ups', count: 28 },
      ],
    };

    return {
      data: statistics,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 75,
      }
    };
  },

  // ============================================
  // PLAYER TEST RESULTS ENDPOINTS
  // ============================================

  // GET /training/player-tests - Get player test results
  'GET /player-tests': (params: any) => {
    const { playerId, playerIds, testType, category, dateFrom, dateTo } = params;
    let testResults = [...mockTestData];

    // Filter by player ID(s)
    if (playerId) {
      testResults = testResults.filter(test => test.playerId === playerId);
    } else if (playerIds) {
      const playerArray = Array.isArray(playerIds) ? playerIds : playerIds.split(',');
      testResults = testResults.filter(test => playerArray.includes(test.playerId));
    }

    // Filter by test type
    if (testType) {
      testResults = testResults.filter(test => test.testType === testType);
    }

    // Filter by category
    if (category) {
      testResults = testResults.filter(test => test.category === category);
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      testResults = testResults.filter(test => {
        const testDate = new Date(test.date);
        if (dateFrom && testDate < new Date(dateFrom)) return false;
        if (dateTo && testDate > new Date(dateTo)) return false;
        return true;
      });
    }

    // Sort by date (newest first)
    testResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      data: testResults,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 45,
      }
    };
  },

  // GET /training/player-tests/:playerId - Get specific player's test results
  'GET /player-tests/:playerId': (params: any, context: any) => {
    const { playerId } = context;
    const { testType, category, latest } = params;
    
    let testResults = mockTestData.filter(test => test.playerId === playerId);

    // Filter by test type
    if (testType) {
      testResults = testResults.filter(test => test.testType === testType);
    }

    // Filter by category
    if (category) {
      testResults = testResults.filter(test => test.category === category);
    }

    // Sort by date (newest first)
    testResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Return only latest results if requested
    if (latest === 'true') {
      const latestResults: any[] = [];
      const seenTestTypes = new Set();
      
      testResults.forEach(test => {
        if (!seenTestTypes.has(test.testType)) {
          latestResults.push(test);
          seenTestTypes.add(test.testType);
        }
      });
      
      testResults = latestResults;
    }

    return {
      data: testResults,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 35,
      }
    };
  },

  // POST /training/player-tests - Create new test result
  'POST /player-tests': (body: any) => {
    const newTest = {
      id: `test-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString()
    };

    mockTestData.push(newTest);

    return {
      data: newTest,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 65,
      }
    };
  },

  // ============================================
  // COMPREHENSIVE WORKOUT LIFECYCLE ENDPOINTS
  // ============================================

  // GET /training/comprehensive-players - Get comprehensive player data
  'GET /comprehensive-players': (params: any) => {
    let players = [...comprehensivePlayerData];
    
    // Filter by medical status
    if (params.medicalStatus) {
      players = players.filter(p => p.medicalStatus === params.medicalStatus);
    }
    
    // Filter by team
    if (params.team) {
      players = players.filter(p => p.team.toLowerCase().includes(params.team.toLowerCase()));
    }

    return {
      data: players,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 45,
      }
    };
  },

  // GET /training/active-sessions - Get real-time active workout sessions
  'GET /active-sessions': (params: any) => {
    let sessions = [...activeWorkoutSessions];
    
    // Filter by status
    if (params.status) {
      sessions = sessions.filter(s => s.status === params.status);
    }
    
    // Filter by workout type
    if (params.type) {
      sessions = sessions.filter(s => s.type === params.type);
    }

    return {
      data: sessions,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 35,
      }
    };
  },

  // GET /training/active-sessions/:id - Get specific active session with real-time data
  'GET /active-sessions/:id': (params: any, context: any) => {
    const { id } = context;
    const session = activeWorkoutSessions.find(s => s.id === id);
    
    if (!session) {
      throw new Error(`Active session with id ${id} not found`);
    }

    // Simulate real-time data updates
    const updatedSession = {
      ...session,
      participants: session.participants.map(participant => ({
        ...participant,
        liveMetrics: {
          ...participant.liveMetrics,
          // Add small random variations to simulate real-time updates
          heartRate: participant.liveMetrics.heartRate + Math.floor(Math.random() * 6) - 3,
          watts: participant.liveMetrics.watts && (participant.liveMetrics.watts + Math.floor(Math.random() * 10) - 5),
          compliance: Math.min(100, Math.max(80, participant.liveMetrics.compliance + Math.floor(Math.random() * 4) - 2))
        },
        timeInInterval: participant.timeInInterval + 5 // Simulate time progression
      }))
    };

    return {
      data: updatedSession,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 25,
      }
    };
  },

  // GET /training/calendar-events - Get workout calendar events
  'GET /calendar-events': (params: any) => {
    let events = [...workoutCalendarEvents];
    
    // Filter by date range
    if (params.startDate || params.endDate) {
      events = events.filter(event => {
        const eventDate = new Date(event.start);
        if (params.startDate && eventDate < new Date(params.startDate)) return false;
        if (params.endDate && eventDate > new Date(params.endDate)) return false;
        return true;
      });
    }
    
    // Filter by workout type
    if (params.workoutType) {
      events = events.filter(e => e.workoutType === params.workoutType);
    }

    return {
      data: events,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 40,
      }
    };
  },

  // GET /training/analytics/team-overview - Get team analytics overview
  'GET /analytics/team-overview': (params: any) => {
    return {
      data: performanceAnalytics.teamOverview,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 55,
      }
    };
  },

  // GET /training/analytics/individual/:playerId - Get individual player analytics
  'GET /analytics/individual/:playerId': (params: any, context: any) => {
    const { playerId } = context;
    const playerMetrics = performanceAnalytics.individualMetrics[playerId];
    
    if (!playerMetrics) {
      throw new Error(`Analytics for player ${playerId} not found`);
    }

    // Add player basic info
    const player = comprehensivePlayerData.find(p => p.id === playerId);
    const analytics = {
      player: player ? {
        id: player.id,
        name: player.name,
        team: player.team,
        position: player.position
      } : null,
      metrics: playerMetrics
    };

    return {
      data: analytics,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 50,
      }
    };
  },

  // GET /training/analytics/workout-types - Get workout type analytics
  'GET /analytics/workout-types': (params: any) => {
    return {
      data: performanceAnalytics.workoutTypeAnalytics,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 45,
      }
    };
  },

  // GET /training/analytics/predictive - Get predictive insights
  'GET /analytics/predictive': (params: any) => {
    return {
      data: performanceAnalytics.predictiveInsights,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 70,
      }
    };
  },

  // GET /training/reports/weekly-team - Get weekly team report
  'GET /reports/weekly-team': (params: any) => {
    return {
      data: exportExamples.weeklyTeamReport,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 85,
      }
    };
  },

  // GET /training/reports/individual-progress/:playerId - Get individual progress report
  'GET /reports/individual-progress/:playerId': (params: any, context: any) => {
    const { playerId } = context;
    
    // For demo, return the sample report (would normally be generated for specific player)
    const report = {
      ...exportExamples.individualProgressReport,
      playerId: playerId,
      generatedAt: new Date().toISOString()
    };

    return {
      data: report,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 120,
      }
    };
  },

  // GET /training/reports/medical-compliance - Get medical compliance report
  'GET /reports/medical-compliance': (params: any) => {
    return {
      data: exportExamples.medicalComplianceReport,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 95,
      }
    };
  },

  // GET /training/comprehensive-workouts - Get comprehensive workout examples
  'GET /comprehensive-workouts': (params: any) => {
    const workouts = Object.values(comprehensiveWorkoutExamples);
    
    // Filter by type if provided
    let filteredWorkouts = workouts;
    if (params.type) {
      filteredWorkouts = workouts.filter(w => w.type === params.type);
    }

    return {
      data: filteredWorkouts,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 60,
      }
    };
  },

  // GET /training/demo-data - Get all comprehensive demo data
  'GET /demo-data': (params: any) => {
    return {
      data: {
        players: comprehensivePlayerData,
        workouts: comprehensiveWorkoutExamples,
        activeSessions: activeWorkoutSessions,
        calendarEvents: workoutCalendarEvents,
        analytics: performanceAnalytics,
        exports: exportExamples
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: `req_${Date.now()}`,
        duration: 150,
      }
    };
  }
};