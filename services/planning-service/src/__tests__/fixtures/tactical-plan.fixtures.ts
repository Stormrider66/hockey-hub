import { 
  TacticalPlan, 
  TacticalCategory, 
  FormationType, 
  PlayerPositionType, 
  ZoneType,
  PlayerPosition,
  PlayerAssignment,
  Formation,
  Trigger,
  VideoReference
} from '../../entities/TacticalPlan';

// Valid tactical plan data
export const validTacticalPlanData = {
  basic: {
    name: 'Basic Forecheck',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    category: TacticalCategory.OFFENSIVE,
    formation: {
      type: FormationType.EVEN_STRENGTH,
      zones: {
        offensive: [
          {
            position: PlayerPositionType.LW,
            x: 10,
            y: 20,
            zone: ZoneType.OFFENSIVE
          },
          {
            position: PlayerPositionType.RW,
            x: 90,
            y: 20,
            zone: ZoneType.OFFENSIVE
          },
          {
            position: PlayerPositionType.C,
            x: 50,
            y: 30,
            zone: ZoneType.OFFENSIVE
          }
        ],
        neutral: [
          {
            position: PlayerPositionType.LD,
            x: 25,
            y: 70,
            zone: ZoneType.NEUTRAL
          },
          {
            position: PlayerPositionType.RD,
            x: 75,
            y: 70,
            zone: ZoneType.NEUTRAL
          }
        ],
        defensive: [
          {
            position: PlayerPositionType.G,
            x: 50,
            y: 95,
            zone: ZoneType.DEFENSIVE
          }
        ]
      }
    } as Formation,
    playerAssignments: [
      {
        playerId: '550e8400-e29b-41d4-a716-446655440010',
        position: 'LW',
        responsibilities: ['High pressure', 'Force play wide'],
        alternatePosition: 'C'
      },
      {
        playerId: '550e8400-e29b-41d4-a716-446655440011',
        position: 'RW',
        responsibilities: ['Support forecheck', 'Cover point'],
        alternatePosition: 'C'
      }
    ] as PlayerAssignment[],
    description: 'Aggressive forecheck to pressure opponent in defensive zone',
    isActive: true
  },

  powerplay: {
    name: 'Umbrella Power Play',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    category: TacticalCategory.SPECIAL_TEAMS,
    formation: {
      type: FormationType.POWERPLAY,
      zones: {
        offensive: [
          {
            position: PlayerPositionType.LD,
            x: 50,
            y: 40,
            zone: ZoneType.OFFENSIVE,
            playerId: '550e8400-e29b-41d4-a716-446655440013'
          },
          {
            position: PlayerPositionType.LW,
            x: 15,
            y: 15,
            zone: ZoneType.OFFENSIVE,
            playerId: '550e8400-e29b-41d4-a716-446655440010'
          },
          {
            position: PlayerPositionType.C,
            x: 50,
            y: 10,
            zone: ZoneType.OFFENSIVE,
            playerId: '550e8400-e29b-41d4-a716-446655440012'
          },
          {
            position: PlayerPositionType.RW,
            x: 85,
            y: 15,
            zone: ZoneType.OFFENSIVE,
            playerId: '550e8400-e29b-41d4-a716-446655440011'
          },
          {
            position: PlayerPositionType.RD,
            x: 85,
            y: 5,
            zone: ZoneType.OFFENSIVE,
            playerId: '550e8400-e29b-41d4-a716-446655440014'
          }
        ],
        neutral: [],
        defensive: []
      }
    } as Formation,
    playerAssignments: [
      {
        playerId: '550e8400-e29b-41d4-a716-446655440013',
        position: 'LD',
        responsibilities: ['Quarterback', 'Move puck', 'Shot from point'],
        alternatePosition: 'RD'
      },
      {
        playerId: '550e8400-e29b-41d4-a716-446655440010',
        position: 'LW',
        responsibilities: ['Screen goalie', 'Tip shots', 'Battle in corner'],
        alternatePosition: 'RW'
      },
      {
        playerId: '550e8400-e29b-41d4-a716-446655440012',
        position: 'C',
        responsibilities: ['Move around', 'Find open space', 'Win draws'],
        alternatePosition: 'LW'
      }
    ] as PlayerAssignment[],
    triggers: [
      {
        situation: 'Puck to point',
        action: 'Forwards set screen and look for tips'
      },
      {
        situation: 'Defender pressures point',
        action: 'Move puck to opposite side'
      }
    ] as Trigger[],
    videoReferences: [
      {
        url: 'https://example.com/powerplay-video',
        timestamp: 45,
        description: 'Perfect umbrella execution'
      }
    ] as VideoReference[],
    isActive: true
  },

  penaltyKill: {
    name: 'Aggressive Box PK',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    category: TacticalCategory.DEFENSIVE,
    formation: {
      type: FormationType.PENALTY_KILL,
      zones: {
        offensive: [],
        neutral: [],
        defensive: [
          {
            position: PlayerPositionType.LW,
            x: 30,
            y: 75,
            zone: ZoneType.DEFENSIVE,
            playerId: '550e8400-e29b-41d4-a716-446655440010'
          },
          {
            position: PlayerPositionType.RW,
            x: 70,
            y: 75,
            zone: ZoneType.DEFENSIVE,
            playerId: '550e8400-e29b-41d4-a716-446655440011'
          },
          {
            position: PlayerPositionType.LD,
            x: 30,
            y: 85,
            zone: ZoneType.DEFENSIVE,
            playerId: '550e8400-e29b-41d4-a716-446655440013'
          },
          {
            position: PlayerPositionType.G,
            x: 50,
            y: 95,
            zone: ZoneType.DEFENSIVE,
            playerId: '550e8400-e29b-41d4-a716-446655440015'
          }
        ]
      }
    } as Formation,
    playerAssignments: [
      {
        playerId: '550e8400-e29b-41d4-a716-446655440010',
        position: 'LW',
        responsibilities: ['Pressure point', 'Block passing lanes', 'Clear puck'],
        alternatePosition: 'C'
      },
      {
        playerId: '550e8400-e29b-41d4-a716-446655440011',
        position: 'RW',
        responsibilities: ['Pressure point', 'Support defense', 'Block shots'],
        alternatePosition: 'C'
      },
      {
        playerId: '550e8400-e29b-41d4-a716-446655440013',
        position: 'LD',
        responsibilities: ['Protect slot', 'Block shots', 'Clear rebounds'],
        alternatePosition: 'RD'
      }
    ] as PlayerAssignment[],
    description: 'Aggressive 4-man box penalty kill with active stick pressure',
    isActive: true
  }
};

// Invalid tactical plan data for validation testing
export const invalidTacticalPlanData = {
  missingRequired: {
    // Missing name, organizationId, coachId, teamId, category, formation, playerAssignments
    description: 'Invalid plan missing required fields'
  },

  invalidCategory: {
    name: 'Invalid Category Plan',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    category: 'INVALID_CATEGORY' as any,
    formation: validTacticalPlanData.basic.formation,
    playerAssignments: validTacticalPlanData.basic.playerAssignments
  },

  invalidUUIDs: {
    name: 'Invalid UUIDs Plan',
    organizationId: 'not-a-uuid',
    coachId: 'also-not-a-uuid',
    teamId: 'definitely-not-a-uuid',
    category: TacticalCategory.OFFENSIVE,
    formation: validTacticalPlanData.basic.formation,
    playerAssignments: validTacticalPlanData.basic.playerAssignments
  },

  emptyFormation: {
    name: 'Empty Formation Plan',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    category: TacticalCategory.OFFENSIVE,
    formation: {
      type: FormationType.EVEN_STRENGTH,
      zones: {
        offensive: [],
        neutral: [],
        defensive: []
      }
    },
    playerAssignments: []
  },

  invalidPlayerPositions: {
    name: 'Invalid Positions Plan',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    category: TacticalCategory.OFFENSIVE,
    formation: {
      type: FormationType.EVEN_STRENGTH,
      zones: {
        offensive: [
          {
            position: 'INVALID_POSITION' as any,
            x: -10, // Invalid coordinate
            y: 150, // Invalid coordinate
            zone: ZoneType.OFFENSIVE
          }
        ],
        neutral: [],
        defensive: []
      }
    },
    playerAssignments: [
      {
        playerId: 'not-a-uuid',
        position: 'INVALID_POSITION',
        responsibilities: [],
        alternatePosition: 'ALSO_INVALID'
      }
    ]
  }
};

// Edge case data
export const edgeCaseTacticalPlanData = {
  maxPlayers: {
    name: 'Maximum Players Plan',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    category: TacticalCategory.TRANSITION,
    formation: {
      type: FormationType.EVEN_STRENGTH,
      zones: {
        offensive: Array.from({ length: 6 }, (_, i) => ({
          position: i < 3 ? PlayerPositionType.C : PlayerPositionType.LW,
          x: 10 + i * 15,
          y: 20,
          zone: ZoneType.OFFENSIVE,
          playerId: `550e8400-e29b-41d4-a716-44665544${(100 + i).toString().padStart(4, '0')}`
        })),
        neutral: [],
        defensive: []
      }
    } as Formation,
    playerAssignments: Array.from({ length: 20 }, (_, i) => ({
      playerId: `550e8400-e29b-41d4-a716-44665544${(100 + i).toString().padStart(4, '0')}`,
      position: i % 2 === 0 ? 'C' : 'LW',
      responsibilities: [`Responsibility ${i + 1}`, `Task ${i + 1}`],
      alternatePosition: i % 3 === 0 ? 'RW' : undefined
    })) as PlayerAssignment[]
  },

  complexTriggers: {
    name: 'Complex Triggers Plan',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    category: TacticalCategory.SPECIAL_TEAMS,
    formation: validTacticalPlanData.basic.formation,
    playerAssignments: validTacticalPlanData.basic.playerAssignments,
    triggers: [
      {
        situation: 'Opponent gains zone entry',
        action: 'F1 pressure, F2 support, D1 gap up'
      },
      {
        situation: 'Puck dumped behind net',
        action: 'D1 retrieves, F3 support, F1 and F2 break out'
      },
      {
        situation: 'Opponent cycle low',
        action: 'Collapse box, pressure puck carrier, block passing lanes'
      },
      {
        situation: 'Power play expires in 10 seconds',
        action: 'Pull extra attacker, full pressure'
      }
    ] as Trigger[]
  },

  multipleVideoReferences: {
    name: 'Video Heavy Plan',
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    category: TacticalCategory.OFFENSIVE,
    formation: validTacticalPlanData.basic.formation,
    playerAssignments: validTacticalPlanData.basic.playerAssignments,
    videoReferences: [
      {
        url: 'https://example.com/video1',
        timestamp: 30,
        description: 'Entry setup'
      },
      {
        url: 'https://example.com/video2',
        timestamp: 75,
        description: 'Cycle execution'
      },
      {
        url: 'https://example.com/video3',
        timestamp: 120,
        description: 'Scoring chance'
      },
      {
        url: 'https://example.com/video4',
        timestamp: 180,
        description: 'Recovery play'
      }
    ] as VideoReference[]
  }
};

// Bulk data for performance testing
export const bulkTacticalPlanData = Array.from({ length: 100 }, (_, index) => ({
  name: `Tactical Plan ${index + 1}`,
  organizationId: `550e8400-e29b-41d4-a716-4466554400${index.toString().padStart(2, '0')}`,
  coachId: `550e8400-e29b-41d4-a716-4466554401${index.toString().padStart(2, '0')}`,
  teamId: `550e8400-e29b-41d4-a716-4466554402${index.toString().padStart(2, '0')}`,
  category: Object.values(TacticalCategory)[index % Object.values(TacticalCategory).length],
  formation: {
    type: Object.values(FormationType)[index % Object.values(FormationType).length],
    zones: {
      offensive: [
        {
          position: PlayerPositionType.C,
          x: 50,
          y: 20 + (index % 10),
          zone: ZoneType.OFFENSIVE
        }
      ],
      neutral: [],
      defensive: [
        {
          position: PlayerPositionType.G,
          x: 50,
          y: 95,
          zone: ZoneType.DEFENSIVE
        }
      ]
    }
  } as Formation,
  playerAssignments: [
    {
      playerId: `550e8400-e29b-41d4-a716-4466554410${index.toString().padStart(2, '0')}`,
      position: 'C',
      responsibilities: [`Responsibility for plan ${index + 1}`]
    }
  ] as PlayerAssignment[],
  description: `Generated tactical plan ${index + 1} for performance testing`,
  isActive: index % 5 !== 0 // 80% active, 20% inactive
}));

// Export all fixtures
export const tacticalPlanFixtures = {
  valid: validTacticalPlanData,
  invalid: invalidTacticalPlanData,
  edgeCase: edgeCaseTacticalPlanData,
  bulk: bulkTacticalPlanData
};