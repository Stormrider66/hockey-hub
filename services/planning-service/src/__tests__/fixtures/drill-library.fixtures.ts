// @ts-nocheck - Suppress TypeScript errors for build
import {
  Drill,
  DrillDifficulty,
  DrillType
} from '../../entities/Drill';

// Valid drill library data
export const validDrillLibraryData = {
  basicSkillDrill: {
    name: 'Basic Passing Drill',
    description: 'Fundamental passing drill to improve accuracy and timing',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: true,
    categoryId: '550e8400-e29b-41d4-a716-446655440050',
    type: DrillType.SKILL,
    difficulty: DrillDifficulty.BEGINNER,
    duration: 10,
    minPlayers: 4,
    maxPlayers: 12,
    equipment: ['pucks', 'cones'],
    setup: {
      rinkArea: 'zone',
      diagram: 'https://example.com/passing-diagram.png',
      cones: 6,
      pucks: 20,
      otherEquipment: ['boards']
    },
    instructions: [
      {
        step: 1,
        description: 'Set up cones in triangle formation',
        duration: 2,
        keyPoints: ['Equal spacing', 'Clear sight lines']
      },
      {
        step: 2,
        description: 'Players pass in sequence around triangle',
        duration: 8,
        keyPoints: ['Firm passes', 'Lead the target', 'Call for puck']
      }
    ],
    objectives: ['Improve passing accuracy', 'Develop timing', 'Build communication'],
    keyPoints: ['Keep head up', 'Follow through', 'Receive on forehand'],
    variations: ['Add movement', 'Include shooting', 'Reverse direction'],
    tags: ['passing', 'fundamentals', 'beginner'],
    ageGroups: ['U8', 'U10', 'U12'],
    usageCount: 25,
    rating: 450, // Total rating points
    ratingCount: 95, // Number of ratings (average = 4.74)
    metadata: {
      createdBy: 'Coach Smith',
      season: '2023-24',
      category: 'skills'
    }
  },

  advancedTacticalDrill: {
    name: 'Power Play Breakout',
    description: 'Advanced drill for practicing power play breakouts under pressure',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: false,
    categoryId: '550e8400-e29b-41d4-a716-446655440051',
    type: DrillType.TACTICAL,
    difficulty: DrillDifficulty.ADVANCED,
    duration: 15,
    minPlayers: 8,
    maxPlayers: 16,
    equipment: ['pucks', 'cones', 'nets', 'pinnies'],
    setup: {
      rinkArea: 'full',
      diagram: 'https://example.com/powerplay-diagram.png',
      cones: 12,
      pucks: 30,
      otherEquipment: ['whiteboard', 'timer']
    },
    instructions: [
      {
        step: 1,
        description: 'Set up power play formation in defensive zone',
        duration: 2,
        keyPoints: ['Proper spacing', 'Support angles', 'Communication']
      },
      {
        step: 2,
        description: 'Defense initiates breakout pass',
        duration: 3,
        keyPoints: ['Quick decision', 'Strong pass', 'Read pressure']
      },
      {
        step: 3,
        description: 'Forwards execute planned breakout pattern',
        duration: 5,
        keyPoints: ['Timing', 'Speed through neutral zone', 'Maintain possession']
      },
      {
        step: 4,
        description: 'Enter offensive zone and set up',
        duration: 5,
        keyPoints: ['Control entry', 'Establish position', 'Look for opportunities']
      }
    ],
    objectives: [
      'Master power play breakout patterns',
      'Improve decision making under pressure',
      'Build special teams chemistry'
    ],
    keyPoints: [
      'Quick puck movement',
      'Support your teammates',
      'Communicate constantly',
      'Read the penalty killers'
    ],
    variations: [
      'Add forechecking pressure',
      'Change breakout patterns',
      'Include goalie in breakout',
      'Practice short-handed situations'
    ],
    tags: ['powerplay', 'breakout', 'tactics', 'advanced'],
    ageGroups: ['U16', 'U18', 'Senior'],
    videoUrl: 'https://example.com/powerplay-video.mp4',
    animationUrl: 'https://example.com/powerplay-animation.gif',
    usageCount: 8,
    rating: 72, // Total rating points
    ratingCount: 9, // Number of ratings (average = 8.0)
  },

  conditioningDrill: {
    name: 'Suicide Sprints',
    description: 'High intensity conditioning drill to build speed and endurance',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: true,
    categoryId: '550e8400-e29b-41d4-a716-446655440052',
    type: DrillType.CONDITIONING,
    difficulty: DrillDifficulty.INTERMEDIATE,
    duration: 8,
    minPlayers: 1,
    maxPlayers: 20,
    equipment: ['cones'],
    setup: {
      rinkArea: 'neutral',
      cones: 5,
      pucks: 0,
      otherEquipment: ['stopwatch']
    },
    instructions: [
      {
        step: 1,
        description: 'Line up players on goal line',
        duration: 1,
        keyPoints: ['Ready position', 'Focus on form']
      },
      {
        step: 2,
        description: 'Sprint to blue line and back',
        duration: 1,
        keyPoints: ['Full speed', 'Proper stopping', 'Quick turns']
      },
      {
        step: 3,
        description: 'Sprint to center line and back',
        duration: 1.5,
        keyPoints: ['Maintain speed', 'Good edges', 'Push through fatigue']
      },
      {
        step: 4,
        description: 'Sprint to far blue line and back',
        duration: 2,
        keyPoints: ['Long strides', 'Powerful crossovers', 'Stay low']
      },
      {
        step: 5,
        description: 'Sprint full ice and back',
        duration: 2.5,
        keyPoints: ['Maximum effort', 'Finish strong', 'Control breathing']
      }
    ],
    objectives: [
      'Improve skating speed',
      'Build leg strength',
      'Develop mental toughness',
      'Practice race pace'
    ],
    keyPoints: [
      'Full speed every sprint',
      'Proper stopping technique',
      'Quick direction changes',
      'Push through fatigue'
    ],
    variations: [
      'Add puck handling',
      'Backward sprints',
      'Change starting positions',
      'Include shooting at end'
    ],
    tags: ['conditioning', 'skating', 'speed', 'endurance'],
    ageGroups: ['U12', 'U14', 'U16', 'U18', 'Senior'],
    usageCount: 150,
    rating: 600, // Total rating points  
    ratingCount: 125, // Number of ratings (average = 4.8)
  },

  gameSimulationDrill: {
    name: '3v2 Rush Development',
    description: 'Game-like drill focusing on odd-man rush situations',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: true,
    categoryId: '550e8400-e29b-41d4-a716-446655440053',
    type: DrillType.GAME,
    difficulty: DrillDifficulty.INTERMEDIATE,
    duration: 12,
    minPlayers: 10,
    maxPlayers: 18,
    equipment: ['pucks', 'cones', 'nets'],
    setup: {
      rinkArea: 'half',
      diagram: 'https://example.com/3v2-diagram.png',
      cones: 4,
      pucks: 15,
      otherEquipment: []
    },
    instructions: [
      {
        step: 1,
        description: 'Set up 3 forwards and 2 defensemen',
        duration: 1,
        keyPoints: ['Proper positioning', 'Read the play', 'Communication']
      },
      {
        step: 2,
        description: 'Forwards attack with speed',
        duration: 3,
        keyPoints: ['Support each other', 'Create options', 'Make defense commit']
      },
      {
        step: 3,
        description: 'Defense work together to stop rush',
        duration: 3,
        keyPoints: ['Gap control', 'Force outside', 'Support partner']
      },
      {
        step: 4,
        description: 'Play out the scoring chance',
        duration: 5,
        keyPoints: ['High percentage shot', 'Screen goalie', 'Follow rebound']
      }
    ],
    objectives: [
      'Develop odd-man rush skills',
      'Improve defensive positioning',
      'Practice game situations',
      'Build decision making'
    ],
    keyPoints: [
      'Use your speed advantage',
      'Create 2-on-1 situations',
      'Support the puck carrier',
      'Communicate with teammates'
    ],
    variations: [
      '2v1 situations',
      '4v3 with trailer',
      'Add backcheckers',
      'Start from different areas'
    ],
    tags: ['rush', 'game-situation', '3v2', 'offense', 'defense'],
    ageGroups: ['U14', 'U16', 'U18', 'Senior'],
    videoUrl: 'https://example.com/3v2-rush-video.mp4',
    usageCount: 45,
    rating: 320,
    ratingCount: 68
  }
};

// Invalid drill library data
export const invalidDrillLibraryData = {
  missingRequired: {
    // Missing name, description, categoryId, type, difficulty, duration, minPlayers, maxPlayers, equipment, setup, instructions
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: true
  },

  invalidDifficulty: {
    name: 'Invalid Difficulty Drill',
    description: 'Drill with invalid difficulty level',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: true,
    categoryId: '550e8400-e29b-41d4-a716-446655440050',
    type: DrillType.SKILL,
    difficulty: 'SUPER_HARD' as any,
    duration: 10,
    minPlayers: 4,
    maxPlayers: 12,
    equipment: ['pucks'],
    setup: { rinkArea: 'zone' },
    instructions: []
  },

  invalidType: {
    name: 'Invalid Type Drill',
    description: 'Drill with invalid type',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: true,
    categoryId: '550e8400-e29b-41d4-a716-446655440050',
    type: 'INVALID_TYPE' as any,
    difficulty: DrillDifficulty.BEGINNER,
    duration: 10,
    minPlayers: 4,
    maxPlayers: 12,
    equipment: ['pucks'],
    setup: { rinkArea: 'zone' },
    instructions: []
  },

  invalidPlayerCounts: {
    name: 'Invalid Player Count Drill',
    description: 'Drill with invalid player counts',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: true,
    categoryId: '550e8400-e29b-41d4-a716-446655440050',
    type: DrillType.SKILL,
    difficulty: DrillDifficulty.BEGINNER,
    duration: 10,
    minPlayers: 15, // minPlayers > maxPlayers
    maxPlayers: 10,
    equipment: ['pucks'],
    setup: { rinkArea: 'zone' },
    instructions: []
  },

  invalidDuration: {
    name: 'Invalid Duration Drill',
    description: 'Drill with invalid duration',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: true,
    categoryId: '550e8400-e29b-41d4-a716-446655440050',
    type: DrillType.SKILL,
    difficulty: DrillDifficulty.BEGINNER,
    duration: -5, // Negative duration
    minPlayers: 4,
    maxPlayers: 12,
    equipment: ['pucks'],
    setup: { rinkArea: 'zone' },
    instructions: []
  },

  invalidRinkArea: {
    name: 'Invalid Rink Area Drill',
    description: 'Drill with invalid rink area',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: true,
    categoryId: '550e8400-e29b-41d4-a716-446655440050',
    type: DrillType.SKILL,
    difficulty: DrillDifficulty.BEGINNER,
    duration: 10,
    minPlayers: 4,
    maxPlayers: 12,
    equipment: ['pucks'],
    setup: { rinkArea: 'invalid_area' as any },
    instructions: []
  },

  malformedInstructions: {
    name: 'Malformed Instructions Drill',
    description: 'Drill with malformed instructions',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: true,
    categoryId: '550e8400-e29b-41d4-a716-446655440050',
    type: DrillType.SKILL,
    difficulty: DrillDifficulty.BEGINNER,
    duration: 10,
    minPlayers: 4,
    maxPlayers: 12,
    equipment: ['pucks'],
    setup: { rinkArea: 'zone' },
    instructions: [
      {
        // Missing step and description
        duration: 5
      }
    ] as any
  }
};

// Edge case drill library data
export const edgeCaseDrillLibraryData = {
  maximumComplexity: {
    name: 'Maximum Complexity System Drill',
    description: 'Extremely detailed drill with maximum possible complexity and all optional fields filled',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: false,
    categoryId: '550e8400-e29b-41d4-a716-446655440054',
    type: DrillType.TACTICAL,
    difficulty: DrillDifficulty.ELITE,
    duration: 30,
    minPlayers: 20,
    maxPlayers: 22,
    equipment: ['pucks', 'cones', 'nets', 'pinnies', 'boards', 'stopwatch', 'whiteboard', 'video-camera'],
    setup: {
      rinkArea: 'full',
      diagram: 'https://example.com/complex-drill-diagram.png',
      cones: 20,
      pucks: 50,
      otherEquipment: ['video equipment', 'timing gates', 'heart rate monitors', 'portable goals']
    },
    instructions: Array.from({ length: 10 }, (_, i) => ({
      step: i + 1,
      description: `Complex instruction step ${i + 1} with detailed explanation of positioning, movement patterns, and decision-making requirements`,
      duration: 3,
      keyPoints: Array.from({ length: 4 }, (_, j) => `Key point ${j + 1} for step ${i + 1}`)
    })),
    objectives: [
      'Master complex system play',
      'Develop elite-level decision making',
      'Build advanced tactical understanding',
      'Improve multi-faceted skills simultaneously',
      'Practice game-speed execution'
    ],
    keyPoints: [
      'Maintain system integrity at all times',
      'Communicate constantly with teammates',
      'Read and react to multiple variables',
      'Execute with precision under pressure',
      'Adapt to changing situations'
    ],
    variations: [
      'Add defensive pressure variations',
      'Modify formation structures',
      'Include special teams elements',
      'Practice with different player combinations',
      'Add time and score constraints',
      'Include video review components'
    ],
    tags: [
      'elite', 'system-play', 'tactical', 'advanced', 'professional',
      'complex', 'multi-phase', 'video-analysis', 'performance'
    ],
    ageGroups: ['U18', 'Senior', 'Professional'],
    videoUrl: 'https://example.com/complex-drill-instruction.mp4',
    animationUrl: 'https://example.com/complex-drill-animation.gif',
    usageCount: 3,
    rating: 27, // Total rating points
    ratingCount: 3, // Number of ratings (average = 9.0)
    metadata: {
      createdBy: 'Elite Coaching Staff',
      season: '2023-24',
      complexity: 'maximum',
      requiredExperience: 'elite',
      videoAnalysisRequired: true,
      performanceTracking: true
    }
  },

  minimalDrill: {
    name: 'Minimal Drill',
    description: 'Drill with only required fields',
    categoryId: '550e8400-e29b-41d4-a716-446655440055',
    type: DrillType.WARM_UP,
    difficulty: DrillDifficulty.BEGINNER,
    duration: 5,
    minPlayers: 1,
    maxPlayers: 30,
    equipment: [],
    setup: { rinkArea: 'full' },
    instructions: [
      {
        step: 1,
        description: 'Simple skating'
      }
    ],
    usageCount: 0,
    rating: 0,
    ratingCount: 0,
    isPublic: false
  },

  manyInstructions: {
    name: 'Twenty Step Drill',
    description: 'Drill with many detailed instructions',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: true,
    categoryId: '550e8400-e29b-41d4-a716-446655440056',
    type: DrillType.SKILL,
    difficulty: DrillDifficulty.INTERMEDIATE,
    duration: 25,
    minPlayers: 6,
    maxPlayers: 18,
    equipment: ['pucks', 'cones'],
    setup: {
      rinkArea: 'half',
      cones: 15,
      pucks: 25
    },
    instructions: Array.from({ length: 20 }, (_, i) => ({
      step: i + 1,
      description: `Detailed instruction step ${i + 1}`,
      duration: 1.25,
      keyPoints: [`Key point A for step ${i + 1}`, `Key point B for step ${i + 1}`]
    })),
    objectives: ['Practice detailed progressions'],
    usageCount: 0,
    rating: 0,
    ratingCount: 0
  },

  highlyRatedDrill: {
    name: 'Perfect Rating Drill',
    description: 'Drill with perfect rating and high usage',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: true,
    categoryId: '550e8400-e29b-41d4-a716-446655440057',
    type: DrillType.SKILL,
    difficulty: DrillDifficulty.INTERMEDIATE,
    duration: 12,
    minPlayers: 8,
    maxPlayers: 16,
    equipment: ['pucks', 'cones', 'nets'],
    setup: {
      rinkArea: 'zone',
      cones: 8,
      pucks: 20
    },
    instructions: [
      {
        step: 1,
        description: 'Perfect drill execution',
        duration: 12,
        keyPoints: ['Excellence in every detail']
      }
    ],
    objectives: ['Achieve perfection'],
    usageCount: 500,
    rating: 5000, // 500 ratings at 10 each = perfect 10.0 average
    ratingCount: 500,
    tags: ['perfect', 'popular', 'highly-rated']
  },

  allAgeGroupsDrill: {
    name: 'Universal Age Drill',
    description: 'Drill suitable for all age groups',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    isPublic: true,
    categoryId: '550e8400-e29b-41d4-a716-446655440058',
    type: DrillType.SKILL,
    difficulty: DrillDifficulty.BEGINNER,
    duration: 10,
    minPlayers: 4,
    maxPlayers: 20,
    equipment: ['pucks'],
    setup: { rinkArea: 'zone' },
    instructions: [
      {
        step: 1,
        description: 'Universal skill building',
        duration: 10
      }
    ],
    objectives: ['Build fundamental skills'],
    ageGroups: ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior'],
    tags: ['universal', 'all-ages', 'fundamental'],
    usageCount: 200,
    rating: 1600,
    ratingCount: 200 // Average = 8.0
  }
};

// Bulk data for performance testing
export const bulkDrillLibraryData = Array.from({ length: 200 }, (_, index) => ({
  name: `Bulk Drill ${index + 1}`,
  description: `Generated drill ${index + 1} for performance testing`,
  organizationId: index % 10 === 0 ? undefined : `550e8400-e29b-41d4-a716-4466554400${(index % 100).toString().padStart(2, '0')}`,
  isPublic: index % 3 === 0, // 33% public
  categoryId: `550e8400-e29b-41d4-a716-44665544005${(index % 10)}`,
  type: Object.values(DrillType)[index % Object.values(DrillType).length],
  difficulty: Object.values(DrillDifficulty)[index % Object.values(DrillDifficulty).length],
  duration: 5 + (index % 20), // 5-24 minutes
  minPlayers: 2 + (index % 8), // 2-9 players
  maxPlayers: 10 + (index % 15), // 10-24 players
  equipment: [
    'pucks',
    ...(index % 2 === 0 ? ['cones'] : []),
    ...(index % 3 === 0 ? ['nets'] : []),
    ...(index % 4 === 0 ? ['pinnies'] : [])
  ],
  setup: {
    rinkArea: (['full', 'half', 'zone', 'corner', 'neutral'] as const)[index % 5],
    cones: Math.floor(Math.random() * 15),
    pucks: Math.floor(Math.random() * 30) + 5,
    ...(index % 5 === 0 && { diagram: `https://example.com/bulk-drill-${index + 1}.png` })
  },
  instructions: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
    step: i + 1,
    description: `Bulk instruction ${i + 1} for drill ${index + 1}`,
    duration: Math.floor(Math.random() * 5) + 1,
    ...(Math.random() > 0.5 && { 
      keyPoints: [`Key point ${i + 1}-A`, `Key point ${i + 1}-B`]
    })
  })),
  objectives: [`Bulk objective ${index + 1}`],
  ...(index % 4 === 0 && { 
    keyPoints: [`Key point for drill ${index + 1}`, `Another key point for drill ${index + 1}`]
  }),
  ...(index % 5 === 0 && { 
    variations: [`Variation A for drill ${index + 1}`, `Variation B for drill ${index + 1}`]
  }),
  tags: [`bulk-${index + 1}`, `category-${index % 5}`, ...(index % 3 === 0 ? ['popular'] : [])],
  ...(index % 4 === 0 && { 
    ageGroups: [
      ['U8', 'U10'][index % 2],
      ['U12', 'U14'][index % 2],
      ['U16', 'U18'][index % 2]
    ].slice(0, Math.floor(Math.random() * 3) + 1)
  }),
  ...(index % 7 === 0 && { videoUrl: `https://example.com/bulk-video-${index + 1}.mp4` }),
  ...(index % 9 === 0 && { animationUrl: `https://example.com/bulk-animation-${index + 1}.gif` }),
  usageCount: Math.floor(Math.random() * 100),
  rating: Math.floor(Math.random() * 500),
  ratingCount: Math.floor(Math.random() * 100),
  ...(index % 6 === 0 && {
    metadata: {
      bulkGenerated: true,
      index: index + 1,
      category: `bulk-category-${index % 5}`
    }
  })
}));

// Export all fixtures
export const drillLibraryFixtures = {
  valid: validDrillLibraryData,
  invalid: invalidDrillLibraryData,
  edgeCase: edgeCaseDrillLibraryData,
  bulk: bulkDrillLibraryData
};