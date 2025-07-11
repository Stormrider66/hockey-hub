import { mockExercises } from '@/features/physical-trainer/constants/mockExercises';

// Mock test data for players
const mockTestData = [
  {
    id: 'test-001',
    playerId: 'player-001',
    testBatchId: 'batch-001',
    testType: 'Squat 1RM',
    value: 120,
    unit: 'kg',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    category: 'Strength',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-002',
    playerId: 'player-001',
    testBatchId: 'batch-001',
    testType: 'Bench Press 1RM',
    value: 90,
    unit: 'kg',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Strength',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-003',
    playerId: 'player-001',
    testBatchId: 'batch-001',
    testType: 'Deadlift 1RM',
    value: 140,
    unit: 'kg',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Strength',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-004',
    playerId: 'player-002',
    testBatchId: 'batch-001',
    testType: 'Squat 1RM',
    value: 100,
    unit: 'kg',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Strength',
    createdBy: 'trainer-001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'test-005',
    playerId: 'player-002',
    testBatchId: 'batch-001',
    testType: 'Bench Press 1RM',
    value: 80,
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
    exercises: mockExercises.filter(ex => ex.category === 'main' || ex.category === 'accessory').slice(0, 6),
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
    exercises: mockExercises.filter(ex => ex.category === 'warmup' || ex.category === 'core').slice(0, 4),
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
    exercises: mockExercises.filter(ex => 
      ex.name.includes('Jump') || ex.name.includes('Bound') || ex.name.includes('Throw')
    ),
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

  // Get session templates
  'GET /templates': (params: any) => {
    let templates = [...mockSessionTemplates];
    
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
    const limit = parseInt(params.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
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
    const sessions = [
      {
        id: 'session-001',
        title: 'Morning Strength Training',
        name: 'Morning Strength Training', // Add name for legacy compatibility
        type: 'strength',
        status: 'upcoming',
        scheduledDate: `${today}T09:00:00Z`,
        date: today, // Add date for legacy compatibility
        time: '09:00', // Add time for legacy compatibility
        estimatedDuration: 60,
        duration: 60, // Add duration for legacy compatibility
        location: 'Main Gym',
        teamId: 'team-001',
        team: 'Senior Team',
        players: 15,
        currentParticipants: 0,
        maxParticipants: 20,
        intensity: 'high',
        equipment: ['Barbell', 'Dumbbells']
      },
      {
        id: 'session-002',
        title: 'Afternoon Recovery',
        name: 'Afternoon Recovery', // Add name for legacy compatibility
        type: 'recovery',
        status: 'active',
        scheduledDate: `${today}T14:00:00Z`,
        date: today, // Add date for legacy compatibility
        time: '14:00', // Add time for legacy compatibility
        estimatedDuration: 45,
        duration: 45, // Add duration for legacy compatibility
        location: 'Recovery Center',
        teamId: 'team-002',
        team: 'Junior Team',
        players: 12,
        currentParticipants: 8,
        maxParticipants: 15,
        intensity: 'low',
        equipment: ['Foam Roller', 'Yoga Mat']
      },
      {
        id: 'session-003',
        title: 'Hockey Circuit Training',
        name: 'Hockey Circuit Training',
        type: 'hybrid',
        workoutType: 'HYBRID',
        status: 'upcoming',
        scheduledDate: `${today}T16:00:00Z`,
        date: today,
        time: '16:00',
        estimatedDuration: 60,
        duration: 60,
        location: 'Training Center',
        teamId: 'team-001',
        team: 'Senior Team',
        players: 20,
        currentParticipants: 0,
        maxParticipants: 25,
        intensity: 'high',
        equipment: ['Bike', 'Rowing Machine', 'Medicine Ball', 'Battle Ropes'],
        hybridWorkoutId: 'hybrid-001'
      },
      {
        id: 'session-004',
        title: 'Agility & Speed Development',
        name: 'Agility & Speed Development',
        type: 'agility',
        workoutType: 'AGILITY',
        status: 'upcoming',
        scheduledDate: `${today}T10:00:00Z`,
        date: today,
        time: '10:00',
        estimatedDuration: 45,
        duration: 45,
        location: 'Field House',
        teamId: 'team-001',
        team: 'Senior Team',
        players: 18,
        currentParticipants: 0,
        maxParticipants: 20,
        intensity: 'moderate',
        equipment: ['Cones', 'Agility Ladder', 'Reaction Lights'],
        agilityDrills: ['agility-001', 'agility-002', 'agility-010']
      }
    ];
    
    // Filter by type if provided
    if (params.type) {
      return sessions.filter(s => s.type === params.type || s.workoutType === params.type);
    }
    
    // Return array directly for legacy getSessions endpoint
    return sessions;
  }
};