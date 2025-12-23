// @ts-nocheck - Suppress TypeScript errors for build
import {
  PracticePlan,
  PracticeStatus,
  PracticeFocus
} from '../../entities/PracticePlan';

// Valid practice plan data
export const validPracticePlanData = {
  basic: {
    title: 'Basic Skills Practice',
    description: 'Fundamental skills development session',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    date: new Date('2024-03-15T18:00:00Z'),
    duration: 90,
    status: PracticeStatus.PLANNED,
    primaryFocus: PracticeFocus.SKILLS,
    location: 'Main Ice Arena',
    rinkId: 'rink-001',
    sections: [
      {
        id: 'section-1',
        name: 'Warm-up',
        duration: 10,
        drillIds: ['drill-001', 'drill-002'],
        notes: 'Light skating to start',
        equipment: ['pucks', 'cones']
      },
      {
        id: 'section-2',
        name: 'Skills Work',
        duration: 45,
        drillIds: ['drill-003', 'drill-004', 'drill-005'],
        notes: 'Focus on stick handling and passing',
        equipment: ['pucks', 'nets', 'cones']
      },
      {
        id: 'section-3',
        name: 'Scrimmage',
        duration: 30,
        drillIds: ['drill-006'],
        notes: 'Apply skills in game situation',
        equipment: ['pucks', 'nets', 'pinnies']
      },
      {
        id: 'section-4',
        name: 'Cool-down',
        duration: 5,
        drillIds: ['drill-007'],
        notes: 'Easy skating and stretching'
      }
    ],
    objectives: [
      'Improve puck handling skills',
      'Develop passing accuracy',
      'Build game awareness'
    ],
    equipment: ['pucks', 'cones', 'nets', 'pinnies'],
    notes: 'Focus on fundamentals today'
  },

  gamePrep: {
    title: 'Game Preparation Practice',
    description: 'Final practice before big game',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    trainingPlanId: '550e8400-e29b-41d4-a716-446655440020',
    date: new Date('2024-03-17T19:00:00Z'),
    duration: 75,
    status: PracticeStatus.PLANNED,
    primaryFocus: PracticeFocus.GAME_PREP,
    secondaryFocus: [PracticeFocus.TACTICS, PracticeFocus.CONDITIONING],
    location: 'Practice Rink B',
    rinkId: 'rink-002',
    sections: [
      {
        id: 'prep-1',
        name: 'Warm-up & System Review',
        duration: 15,
        drillIds: ['warm-001', 'system-001'],
        notes: 'Review power play systems',
        equipment: ['pucks', 'cones', 'whiteboard']
      },
      {
        id: 'prep-2',
        name: 'Special Teams',
        duration: 25,
        drillIds: ['pp-001', 'pk-001', 'pp-002'],
        notes: 'Focus on entries and breakouts',
        equipment: ['pucks', 'nets', 'cones']
      },
      {
        id: 'prep-3',
        name: 'Line Rushes',
        duration: 20,
        drillIds: ['rush-001', 'rush-002'],
        notes: 'Work on timing and spacing',
        equipment: ['pucks', 'nets']
      },
      {
        id: 'prep-4',
        name: 'Situational Play',
        duration: 15,
        drillIds: ['sit-001', 'sit-002'],
        notes: 'Game-like situations',
        equipment: ['pucks', 'nets', 'timer']
      }
    ],
    objectives: [
      'Fine-tune power play execution',
      'Perfect penalty kill structure',
      'Build confidence for game'
    ],
    equipment: ['pucks', 'nets', 'cones', 'whiteboard', 'timer'],
    lineups: {
      forward1: ['player-001', 'player-002', 'player-003'],
      forward2: ['player-004', 'player-005', 'player-006'],
      forward3: ['player-007', 'player-008', 'player-009'],
      forward4: ['player-010', 'player-011', 'player-012'],
      defense1: ['player-013', 'player-014'],
      defense2: ['player-015', 'player-016'],
      defense3: ['player-017', 'player-018'],
      goalies: ['player-019', 'player-020'],
      scratched: []
    },
    notes: 'Keep intensity high but avoid injuries'
  },

  completed: {
    title: 'Completed Skills Session',
    description: 'Skills development completed',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    date: new Date('2024-03-10T18:00:00Z'),
    duration: 90,
    status: PracticeStatus.COMPLETED,
    primaryFocus: PracticeFocus.SKILLS,
    location: 'Main Ice Arena',
    sections: [
      {
        id: 'comp-1',
        name: 'Warm-up',
        duration: 10,
        drillIds: ['drill-001'],
        notes: 'Good energy to start'
      },
      {
        id: 'comp-2',
        name: 'Skills',
        duration: 60,
        drillIds: ['drill-002', 'drill-003'],
        notes: 'Players responded well'
      },
      {
        id: 'comp-3',
        name: 'Scrimmage',
        duration: 20,
        drillIds: ['drill-004'],
        notes: 'Great compete level'
      }
    ],
    objectives: ['Improve individual skills'],
    attendance: [
      { playerId: 'player-001', present: true },
      { playerId: 'player-002', present: true },
      { playerId: 'player-003', present: false, reason: 'injury' },
      { playerId: 'player-004', present: true },
      { playerId: 'player-005', present: false, reason: 'illness' }
    ],
    playerEvaluations: [
      {
        playerId: 'player-001',
        rating: 8,
        notes: 'Excellent work ethic',
        areasOfImprovement: ['backhand shots']
      },
      {
        playerId: 'player-002',
        rating: 7,
        notes: 'Good skating, needs work on passing',
        areasOfImprovement: ['passing accuracy', 'defensive positioning']
      },
      {
        playerId: 'player-004',
        rating: 9,
        notes: 'Outstanding practice',
        areasOfImprovement: []
      }
    ],
    coachFeedback: 'Great practice overall. Players were engaged and worked hard.',
    notes: 'Need to work more on defensive systems next time'
  }
};

// Invalid practice plan data
export const invalidPracticePlanData = {
  missingRequired: {
    // Missing title, organizationId, teamId, coachId, date, duration, status, primaryFocus, sections
    description: 'Missing required fields'
  },

  invalidStatus: {
    title: 'Invalid Status Practice',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    date: new Date(),
    duration: 90,
    status: 'INVALID_STATUS' as any,
    primaryFocus: PracticeFocus.SKILLS,
    sections: []
  },

  invalidFocus: {
    title: 'Invalid Focus Practice',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    date: new Date(),
    duration: 90,
    status: PracticeStatus.PLANNED,
    primaryFocus: 'INVALID_FOCUS' as any,
    sections: []
  },

  invalidDuration: {
    title: 'Invalid Duration Practice',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    date: new Date(),
    duration: -30, // Negative duration
    status: PracticeStatus.PLANNED,
    primaryFocus: PracticeFocus.SKILLS,
    sections: []
  },

  invalidUUIDs: {
    title: 'Invalid UUIDs Practice',
    organizationId: 'not-a-uuid',
    teamId: 'also-not-a-uuid',
    coachId: 'definitely-not-a-uuid',
    date: new Date(),
    duration: 90,
    status: PracticeStatus.PLANNED,
    primaryFocus: PracticeFocus.SKILLS,
    sections: []
  },

  invalidSections: {
    title: 'Invalid Sections Practice',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    date: new Date(),
    duration: 90,
    status: PracticeStatus.PLANNED,
    primaryFocus: PracticeFocus.SKILLS,
    sections: [
      {
        // Missing required fields: id, name, duration, drillIds
        notes: 'Invalid section'
      }
    ] as any
  }
};

// Edge case data
export const edgeCasePracticePlanData = {
  veryLongPractice: {
    title: 'Extended Training Session',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    date: new Date('2024-08-01T08:00:00Z'),
    duration: 240, // 4 hours
    status: PracticeStatus.PLANNED,
    primaryFocus: PracticeFocus.CONDITIONING,
    secondaryFocus: [PracticeFocus.SKILLS, PracticeFocus.TACTICS],
    sections: Array.from({ length: 12 }, (_, i) => ({
      id: `extended-${i + 1}`,
      name: `Section ${i + 1}`,
      duration: 20,
      drillIds: [`drill-${i + 1}-1`, `drill-${i + 1}-2`],
      notes: `Extended session section ${i + 1}`,
      equipment: i % 2 === 0 ? ['pucks', 'cones'] : ['nets', 'sticks']
    })),
    objectives: [
      'Build endurance',
      'Develop mental toughness',
      'Master complex systems'
    ],
    equipment: ['pucks', 'nets', 'cones', 'sticks', 'pinnies', 'boards']
  },

  manySections: {
    title: 'Multi-Section Practice',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    date: new Date('2024-04-01T18:00:00Z'),
    duration: 120,
    status: PracticeStatus.PLANNED,
    primaryFocus: PracticeFocus.SKILLS,
    sections: Array.from({ length: 20 }, (_, i) => ({
      id: `micro-${i + 1}`,
      name: `Micro Drill ${i + 1}`,
      duration: 6, // Many short sections
      drillIds: [`micro-drill-${i + 1}`],
      notes: `Quick drill ${i + 1}`,
      equipment: ['pucks']
    })),
    objectives: ['Maintain high intensity', 'Quick transitions'],
    equipment: ['pucks', 'cones']
  },

  complexLineups: {
    title: 'Complex Lineup Management',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    date: new Date('2024-04-05T19:00:00Z'),
    duration: 90,
    status: PracticeStatus.PLANNED,
    primaryFocus: PracticeFocus.TACTICS,
    sections: [
      {
        id: 'lineup-1',
        name: 'Line Combinations',
        duration: 90,
        drillIds: ['line-drill-1'],
        notes: 'Test different combinations'
      }
    ],
    lineups: {
      forward1: Array.from({ length: 3 }, (_, i) => `forward-1-${i + 1}`),
      forward2: Array.from({ length: 3 }, (_, i) => `forward-2-${i + 1}`),
      forward3: Array.from({ length: 3 }, (_, i) => `forward-3-${i + 1}`),
      forward4: Array.from({ length: 3 }, (_, i) => `forward-4-${i + 1}`),
      defense1: Array.from({ length: 2 }, (_, i) => `defense-1-${i + 1}`),
      defense2: Array.from({ length: 2 }, (_, i) => `defense-2-${i + 1}`),
      defense3: Array.from({ length: 2 }, (_, i) => `defense-3-${i + 1}`),
      goalies: Array.from({ length: 3 }, (_, i) => `goalie-${i + 1}`),
      scratched: Array.from({ length: 5 }, (_, i) => `scratched-${i + 1}`)
    },
    objectives: ['Find optimal line combinations']
  },

  detailedEvaluations: {
    title: 'Evaluation Heavy Practice',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    date: new Date('2024-02-01T18:00:00Z'),
    duration: 90,
    status: PracticeStatus.COMPLETED,
    primaryFocus: PracticeFocus.EVALUATION,
    sections: [
      {
        id: 'eval-1',
        name: 'Skills Assessment',
        duration: 90,
        drillIds: ['eval-drill-1', 'eval-drill-2'],
        notes: 'Comprehensive evaluation'
      }
    ],
    attendance: Array.from({ length: 25 }, (_, i) => ({
      playerId: `eval-player-${i + 1}`,
      present: Math.random() > 0.1, // 90% attendance rate
      reason: Math.random() > 0.7 ? (['injury', 'illness', 'personal'][Math.floor(Math.random() * 3)]) : undefined
    })),
    playerEvaluations: Array.from({ length: 22 }, (_, i) => ({
      playerId: `eval-player-${i + 1}`,
      rating: Math.floor(Math.random() * 4) + 6, // Rating between 6-10
      notes: `Player ${i + 1} evaluation notes`,
      areasOfImprovement: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 }, 
        (_, j) => `Improvement area ${j + 1} for player ${i + 1}`
      )
    })),
    objectives: ['Assess all players thoroughly']
  }
};

// Bulk data for performance testing
export const bulkPracticePlanData = Array.from({ length: 50 }, (_, index) => ({
  title: `Practice Plan ${index + 1}`,
  description: `Generated practice plan ${index + 1}`,
  organizationId: `550e8400-e29b-41d4-a716-4466554400${index.toString().padStart(2, '0')}`,
  teamId: `550e8400-e29b-41d4-a716-4466554402${index.toString().padStart(2, '0')}`,
  coachId: `550e8400-e29b-41d4-a716-4466554401${index.toString().padStart(2, '0')}`,
  date: new Date(Date.now() + index * 24 * 60 * 60 * 1000), // Spread over 50 days
  duration: 60 + (index % 4) * 30, // Duration between 60-150 minutes
  status: Object.values(PracticeStatus)[index % Object.values(PracticeStatus).length],
  primaryFocus: Object.values(PracticeFocus)[index % Object.values(PracticeFocus).length],
  secondaryFocus: index % 3 === 0 ? [
    Object.values(PracticeFocus)[(index + 1) % Object.values(PracticeFocus).length]
  ] : undefined,
  location: `Arena ${(index % 5) + 1}`,
  rinkId: `rink-${(index % 3) + 1}`,
  sections: [
    {
      id: `bulk-section-${index}-1`,
      name: 'Warm-up',
      duration: 10,
      drillIds: [`bulk-drill-${index}-1`],
      notes: `Warm-up for practice ${index + 1}`
    },
    {
      id: `bulk-section-${index}-2`,
      name: 'Main Work',
      duration: 40 + (index % 4) * 20,
      drillIds: [`bulk-drill-${index}-2`, `bulk-drill-${index}-3`],
      notes: `Main section for practice ${index + 1}`,
      equipment: ['pucks', 'cones']
    },
    {
      id: `bulk-section-${index}-3`,
      name: 'Cool-down',
      duration: 10,
      drillIds: [`bulk-drill-${index}-4`],
      notes: `Cool-down for practice ${index + 1}`
    }
  ],
  objectives: [`Objective ${index + 1}`, `Secondary objective ${index + 1}`],
  equipment: ['pucks', 'cones', 'nets'],
  notes: `Bulk practice plan ${index + 1} for performance testing`
}));

// Export all fixtures
export const practicePlanFixtures = {
  valid: validPracticePlanData,
  invalid: invalidPracticePlanData,
  edgeCase: edgeCasePracticePlanData,
  bulk: bulkPracticePlanData
};