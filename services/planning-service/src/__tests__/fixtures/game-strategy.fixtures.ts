// @ts-nocheck - Suppress TypeScript errors for build
import {
  GameStrategy,
  LineCombo,
  Matchup,
  SpecialInstruction,
  KeyPlayer,
  GoalieTendencies,
  OpponentScouting,
  Lineups,
  PeriodAdjustment,
  GoalAnalysis,
  PlayerPerformance,
  PostGameAnalysis
} from '../../entities/GameStrategy';

// Valid game strategy data
export const validGameStrategyData = {
  basic: {
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    gameId: '550e8400-e29b-41d4-a716-446655440030',
    opponentTeamId: '550e8400-e29b-41d4-a716-446655440031',
    opponentTeamName: 'Lightning Bolts',
    lineups: {
      even_strength: [
        {
          name: 'First Line',
          forwards: ['player-001', 'player-002', 'player-003'],
          defense: ['player-013', 'player-014'],
          goalie: 'player-019',
          chemistry: 85,
          minutesPlayed: 18,
          plusMinus: 3
        },
        {
          name: 'Second Line',
          forwards: ['player-004', 'player-005', 'player-006'],
          defense: ['player-015', 'player-016'],
          goalie: 'player-019',
          chemistry: 78,
          minutesPlayed: 16,
          plusMinus: 1
        },
        {
          name: 'Third Line',
          forwards: ['player-007', 'player-008', 'player-009'],
          defense: ['player-017', 'player-018'],
          goalie: 'player-019',
          chemistry: 72,
          minutesPlayed: 12,
          plusMinus: -1
        }
      ],
      powerplay: [
        {
          name: 'PP1',
          forwards: ['player-001', 'player-002', 'player-003'],
          defense: ['player-013'],
          goalie: 'player-019',
          chemistry: 88
        },
        {
          name: 'PP2',
          forwards: ['player-004', 'player-005', 'player-006'],
          defense: ['player-015'],
          goalie: 'player-019',
          chemistry: 75
        }
      ],
      penalty_kill: [
        {
          name: 'PK1',
          forwards: ['player-008', 'player-009'],
          defense: ['player-013', 'player-014'],
          goalie: 'player-019',
          chemistry: 82
        },
        {
          name: 'PK2',
          forwards: ['player-010', 'player-011'],
          defense: ['player-015', 'player-016'],
          goalie: 'player-019',
          chemistry: 79
        }
      ]
    } as Lineups,
    gameCompleted: false
  },

  comprehensive: {
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    gameId: '550e8400-e29b-41d4-a716-446655440032',
    opponentTeamId: '550e8400-e29b-41d4-a716-446655440033',
    opponentTeamName: 'Storm Hawks',
    lineups: {
      even_strength: [
        {
          name: 'Top Line',
          forwards: ['player-001', 'player-002', 'player-003'],
          defense: ['player-013', 'player-014'],
          goalie: 'player-019',
          chemistry: 90,
          minutesPlayed: 20,
          plusMinus: 5
        },
        {
          name: 'Checking Line',
          forwards: ['player-007', 'player-008', 'player-009'],
          defense: ['player-017', 'player-018'],
          goalie: 'player-019',
          chemistry: 83,
          minutesPlayed: 14,
          plusMinus: 2
        }
      ],
      powerplay: [
        {
          name: 'PP1 Umbrella',
          forwards: ['player-001', 'player-002', 'player-003'],
          defense: ['player-013'],
          goalie: 'player-019',
          chemistry: 92
        }
      ],
      penalty_kill: [
        {
          name: 'Aggressive PK',
          forwards: ['player-008', 'player-009'],
          defense: ['player-013', 'player-014'],
          goalie: 'player-019',
          chemistry: 87
        }
      ],
      overtime: [
        {
          name: '3v3 Speed',
          forwards: ['player-001', 'player-002'],
          defense: ['player-013'],
          goalie: 'player-019',
          chemistry: 95
        }
      ],
      extra_attacker: [
        {
          name: '6v5 Attack',
          forwards: ['player-001', 'player-002', 'player-003', 'player-004'],
          defense: ['player-013', 'player-014'],
          chemistry: 85
        }
      ]
    } as Lineups,
    matchups: [
      {
        ourLine: 'Top Line',
        opposingLine: 'Their First Line',
        strategy: 'Match speed, force outside'
      },
      {
        ourLine: 'Checking Line',
        opposingLine: 'Their Second Line',
        strategy: 'Physical play, disrupt timing'
      }
    ] as Matchup[],
    specialInstructions: [
      {
        playerId: 'player-001',
        instructions: ['Take face-offs on PP', 'Lead breakouts', 'Stay disciplined']
      },
      {
        playerId: 'player-013',
        instructions: ['QB power play', 'Join rush when appropriate', 'Communicate defensive coverage']
      }
    ] as SpecialInstruction[],
    opponentScouting: {
      strengths: ['Fast transition game', 'Strong power play', 'Good goaltending'],
      weaknesses: ['Weak on face-offs', 'Young defense', 'Prone to penalties'],
      keyPlayers: [
        {
          playerId: 'opp-001',
          name: 'Jake Miller',
          tendencies: ['Shoots high glove', 'Cuts to middle', 'Good in traffic'],
          howToDefend: 'Force him wide, take away center lane'
        },
        {
          playerId: 'opp-002',
          name: 'Sam Rodriguez',
          tendencies: ['Great passer', 'Sees ice well', 'Not physical'],
          howToDefend: 'Pressure early, finish checks'
        }
      ] as KeyPlayer[],
      goalieTendencies: {
        gloveHigh: 65,
        gloveLow: 85,
        blockerHigh: 70,
        blockerLow: 80,
        fiveHole: 45,
        wraparound: 60
      } as GoalieTendencies
    } as OpponentScouting,
    preGameSpeech: 'Tonight we play our system. Fast, physical, and smart. Execute our game plan and we will be successful.',
    periodAdjustments: [
      {
        period: 1,
        adjustments: ['Use speed to our advantage', 'Get pucks deep'],
        lineChanges: { 'Second Line': 'More ice time' }
      },
      {
        period: 2,
        adjustments: ['Tighten up defensively', 'Be patient with puck'],
        lineChanges: { 'Checking Line': 'Match against their top line' }
      }
    ] as PeriodAdjustment[],
    gameCompleted: false,
    tags: ['division-game', 'home-game', 'weekend'],
    metadata: {
      venue: 'Home Arena',
      gameType: 'regular-season',
      importance: 'high'
    }
  },

  completed: {
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    gameId: '550e8400-e29b-41d4-a716-446655440034',
    opponentTeamId: '550e8400-e29b-41d4-a716-446655440035',
    opponentTeamName: 'Ice Wolves',
    lineups: {
      even_strength: [
        {
          name: 'First Line',
          forwards: ['player-001', 'player-002', 'player-003'],
          defense: ['player-013', 'player-014'],
          goalie: 'player-019',
          chemistry: 88,
          minutesPlayed: 22,
          plusMinus: 4
        }
      ],
      powerplay: [
        {
          name: 'PP1',
          forwards: ['player-001', 'player-002', 'player-003'],
          defense: ['player-013'],
          goalie: 'player-019',
          chemistry: 85
        }
      ],
      penalty_kill: [
        {
          name: 'PK1',
          forwards: ['player-008', 'player-009'],
          defense: ['player-013', 'player-014'],
          goalie: 'player-019',
          chemistry: 90
        }
      ]
    } as Lineups,
    gameCompleted: true,
    postGameAnalysis: {
      goalsFor: [
        {
          time: '5:23',
          period: 1,
          scoredBy: 'player-002',
          assists: ['player-001', 'player-013'],
          situation: 'Even Strength',
          description: 'Great passing play, perfect screen',
          preventable: false,
          notes: 'Textbook execution'
        },
        {
          time: '12:45',
          period: 2,
          scoredBy: 'player-001',
          assists: ['player-003'],
          situation: 'Power Play',
          description: 'One-timer from slot',
          preventable: false,
          notes: 'Perfect setup'
        }
      ] as GoalAnalysis[],
      goalsAgainst: [
        {
          time: '18:02',
          period: 1,
          scoredBy: 'opp-005',
          assists: ['opp-003', 'opp-007'],
          situation: 'Even Strength',
          description: 'Deflection in front',
          preventable: true,
          notes: 'Need better net front coverage'
        }
      ] as GoalAnalysis[],
      whatWorked: [
        'Power play execution was excellent',
        'Defensive zone coverage improved',
        'Goaltending was solid'
      ],
      whatDidntWork: [
        'Face-off percentage was poor',
        'Too many penalties in third period',
        'Breakout struggles early'
      ],
      playerPerformance: [
        {
          playerId: 'player-001',
          rating: 9,
          notes: 'Outstanding game. Great leadership and execution.'
        },
        {
          playerId: 'player-002',
          rating: 8,
          notes: 'Solid game. Good goal and assist.'
        },
        {
          playerId: 'player-003',
          rating: 7,
          notes: 'Good passing, need more shots.'
        },
        {
          playerId: 'player-013',
          rating: 8,
          notes: 'Strong defensive game, good outlet passes.'
        },
        {
          playerId: 'player-019',
          rating: 9,
          notes: 'Excellent goaltending. Made key saves.'
        }
      ] as PlayerPerformance[]
    } as PostGameAnalysis
  }
};

// Invalid game strategy data
export const invalidGameStrategyData = {
  missingRequired: {
    // Missing organizationId, coachId, teamId, gameId, opponentTeamId, opponentTeamName, lineups
    gameCompleted: false
  },

  invalidUUIDs: {
    organizationId: 'not-a-uuid',
    coachId: 'also-not-a-uuid',
    teamId: 'definitely-not-a-uuid',
    gameId: 'invalid-game-id',
    opponentTeamId: 'bad-opponent-id',
    opponentTeamName: 'Test Opponent',
    lineups: {
      even_strength: [],
      powerplay: [],
      penalty_kill: []
    }
  },

  invalidLineups: {
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    gameId: '550e8400-e29b-41d4-a716-446655440030',
    opponentTeamId: '550e8400-e29b-41d4-a716-446655440031',
    opponentTeamName: 'Test Team',
    lineups: {
      even_strength: [
        {
          // Missing required fields: name, forwards, defense
          chemistry: 50
        }
      ] as any,
      powerplay: [],
      penalty_kill: []
    }
  },

  invalidChemistry: {
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    gameId: '550e8400-e29b-41d4-a716-446655440030',
    opponentTeamId: '550e8400-e29b-41d4-a716-446655440031',
    opponentTeamName: 'Test Team',
    lineups: {
      even_strength: [
        {
          name: 'Invalid Chemistry Line',
          forwards: ['player-001', 'player-002', 'player-003'],
          defense: ['player-013', 'player-014'],
          chemistry: -10 // Invalid negative chemistry
        }
      ],
      powerplay: [],
      penalty_kill: []
    } as Lineups
  },

  invalidGoalieTendencies: {
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    gameId: '550e8400-e29b-41d4-a716-446655440030',
    opponentTeamId: '550e8400-e29b-41d4-a716-446655440031',
    opponentTeamName: 'Test Team',
    lineups: {
      even_strength: [],
      powerplay: [],
      penalty_kill: []
    },
    opponentScouting: {
      strengths: [],
      weaknesses: [],
      keyPlayers: [],
      goalieTendencies: {
        gloveHigh: 150, // Invalid percentage > 100
        gloveLow: -20,  // Invalid negative percentage
        blockerHigh: 80,
        blockerLow: 70,
        fiveHole: 60,
        wraparound: 50
      }
    }
  }
};

// Edge case data
export const edgeCaseGameStrategyData = {
  manyLines: {
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    gameId: '550e8400-e29b-41d4-a716-446655440036',
    opponentTeamId: '550e8400-e29b-41d4-a716-446655440037',
    opponentTeamName: 'Deep Roster Team',
    lineups: {
      even_strength: Array.from({ length: 8 }, (_, i) => ({
        name: `Line ${i + 1}`,
        forwards: [`f-${i}-1`, `f-${i}-2`, `f-${i}-3`],
        defense: [`d-${i}-1`, `d-${i}-2`],
        goalie: 'goalie-1',
        chemistry: 50 + Math.floor(Math.random() * 50),
        minutesPlayed: 8 + Math.floor(Math.random() * 12),
        plusMinus: Math.floor(Math.random() * 11) - 5
      })),
      powerplay: Array.from({ length: 4 }, (_, i) => ({
        name: `PP${i + 1}`,
        forwards: [`pp-f-${i}-1`, `pp-f-${i}-2`, `pp-f-${i}-3`],
        defense: [`pp-d-${i}-1`],
        goalie: 'goalie-1',
        chemistry: 60 + Math.floor(Math.random() * 40)
      })),
      penalty_kill: Array.from({ length: 4 }, (_, i) => ({
        name: `PK${i + 1}`,
        forwards: [`pk-f-${i}-1`, `pk-f-${i}-2`],
        defense: [`pk-d-${i}-1`, `pk-d-${i}-2`],
        goalie: 'goalie-1',
        chemistry: 55 + Math.floor(Math.random() * 45)
      })),
      overtime: Array.from({ length: 2 }, (_, i) => ({
        name: `OT${i + 1}`,
        forwards: [`ot-f-${i}-1`, `ot-f-${i}-2`],
        defense: [`ot-d-${i}-1`],
        goalie: 'goalie-1',
        chemistry: 70 + Math.floor(Math.random() * 30)
      }))
    } as Lineups,
    gameCompleted: false
  },

  complexMatchups: {
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    gameId: '550e8400-e29b-41d4-a716-446655440038',
    opponentTeamId: '550e8400-e29b-41d4-a716-446655440039',
    opponentTeamName: 'Strategic Opponents',
    lineups: validGameStrategyData.basic.lineups,
    matchups: Array.from({ length: 15 }, (_, i) => ({
      ourLine: `Our Line ${i + 1}`,
      opposingLine: `Their Line ${i + 1}`,
      strategy: `Strategy ${i + 1}: ${['Counter-attack', 'Physical play', 'Speed game', 'Defensive shell', 'High pressure'][i % 5]}`
    })) as Matchup[],
    specialInstructions: Array.from({ length: 20 }, (_, i) => ({
      playerId: `complex-player-${i + 1}`,
      instructions: Array.from({ length: 3 + (i % 3) }, (_, j) => `Instruction ${j + 1} for player ${i + 1}`)
    })) as SpecialInstruction[],
    gameCompleted: false
  },

  detailedScouting: {
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    gameId: '550e8400-e29b-41d4-a716-446655440040',
    opponentTeamId: '550e8400-e29b-41d4-a716-446655440041',
    opponentTeamName: 'Well Scouted Team',
    lineups: validGameStrategyData.basic.lineups,
    opponentScouting: {
      strengths: [
        'Excellent power play conversion',
        'Strong defensive structure',
        'Great goaltending',
        'Fast transition game',
        'Physical forechecking',
        'Good penalty kill',
        'Deep forward lines',
        'Mobile defense',
        'Strong face-off percentage',
        'Good special teams coaching'
      ],
      weaknesses: [
        'Weak on back-to-back games',
        'Young defense prone to mistakes',
        'Backup goalie struggles',
        'Poor in overtime',
        'Undisciplined at times',
        'Weak on the road',
        'Fourth line not productive',
        'Power play struggles vs aggressive PK',
        'Slow starts to games',
        'Poor in playoff situations'
      ],
      keyPlayers: Array.from({ length: 8 }, (_, i) => ({
        playerId: `scouted-player-${i + 1}`,
        name: `Key Player ${i + 1}`,
        tendencies: Array.from({ length: 3 + (i % 2) }, (_, j) => `Tendency ${j + 1} for player ${i + 1}`),
        howToDefend: `Defensive strategy ${i + 1}: Focus on limiting time and space`
      })) as KeyPlayer[],
      goalieTendencies: {
        gloveHigh: 45 + Math.floor(Math.random() * 30),
        gloveLow: 60 + Math.floor(Math.random() * 30),
        blockerHigh: 55 + Math.floor(Math.random() * 30),
        blockerLow: 70 + Math.floor(Math.random() * 20),
        fiveHole: 30 + Math.floor(Math.random() * 40),
        wraparound: 40 + Math.floor(Math.random() * 40)
      } as GoalieTendencies
    } as OpponentScouting,
    gameCompleted: false
  },

  completedWithFullAnalysis: {
    organizationId: '550e8400-e29b-41d4-a716-446655440000',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    gameId: '550e8400-e29b-41d4-a716-446655440042',
    opponentTeamId: '550e8400-e29b-41d4-a716-446655440043',
    opponentTeamName: 'Analyzed Opponents',
    lineups: validGameStrategyData.basic.lineups,
    gameCompleted: true,
    postGameAnalysis: {
      goalsFor: Array.from({ length: 4 }, (_, i) => ({
        time: `${Math.floor(Math.random() * 20)}:${(Math.floor(Math.random() * 60)).toString().padStart(2, '0')}`,
        period: Math.floor(Math.random() * 3) + 1,
        scoredBy: `scorer-${i + 1}`,
        assists: Array.from({ length: Math.floor(Math.random() * 3) }, (_, j) => `assist-${i}-${j + 1}`),
        situation: ['Even Strength', 'Power Play', 'Short Handed', 'Empty Net'][Math.floor(Math.random() * 4)],
        description: `Goal description ${i + 1}`,
        preventable: Math.random() > 0.7,
        notes: Math.random() > 0.5 ? `Notes for goal ${i + 1}` : undefined
      })) as GoalAnalysis[],
      goalsAgainst: Array.from({ length: 2 }, (_, i) => ({
        time: `${Math.floor(Math.random() * 20)}:${(Math.floor(Math.random() * 60)).toString().padStart(2, '0')}`,
        period: Math.floor(Math.random() * 3) + 1,
        scoredBy: `opp-scorer-${i + 1}`,
        assists: [`opp-assist-${i}-1`, `opp-assist-${i}-2`],
        situation: 'Even Strength',
        description: `Goal against description ${i + 1}`,
        preventable: true,
        notes: `Analysis of goal against ${i + 1}`
      })) as GoalAnalysis[],
      whatWorked: [
        'Power play was effective',
        'Defensive structure held up well',
        'Goaltending was excellent',
        'Special teams performed',
        'Forecheck created turnovers',
        'Face-off percentage improved'
      ],
      whatDidntWork: [
        'Too many penalties',
        'Slow start to periods',
        'Breakout struggles',
        'Net front coverage needs work',
        'Third period energy dropped',
        'Communication issues'
      ],
      playerPerformance: Array.from({ length: 18 }, (_, i) => ({
        playerId: `analyzed-player-${i + 1}`,
        rating: Math.floor(Math.random() * 5) + 5, // Rating 5-10
        notes: `Performance analysis for player ${i + 1}`
      })) as PlayerPerformance[]
    } as PostGameAnalysis
  }
};

// Bulk data for performance testing
export const bulkGameStrategyData = Array.from({ length: 30 }, (_, index) => ({
  organizationId: `550e8400-e29b-41d4-a716-4466554400${index.toString().padStart(2, '0')}`,
  coachId: `550e8400-e29b-41d4-a716-4466554401${index.toString().padStart(2, '0')}`,
  teamId: `550e8400-e29b-41d4-a716-4466554402${index.toString().padStart(2, '0')}`,
  gameId: `550e8400-e29b-41d4-a716-446655443${index.toString().padStart(3, '0')}`,
  opponentTeamId: `550e8400-e29b-41d4-a716-446655444${index.toString().padStart(3, '0')}`,
  opponentTeamName: `Bulk Opponent ${index + 1}`,
  lineups: {
    even_strength: [
      {
        name: 'First Line',
        forwards: [`bulk-f-${index}-1`, `bulk-f-${index}-2`, `bulk-f-${index}-3`],
        defense: [`bulk-d-${index}-1`, `bulk-d-${index}-2`],
        goalie: `bulk-g-${index}`,
        chemistry: 50 + Math.floor(Math.random() * 50)
      }
    ],
    powerplay: [
      {
        name: 'PP1',
        forwards: [`bulk-pp-f-${index}-1`, `bulk-pp-f-${index}-2`, `bulk-pp-f-${index}-3`],
        defense: [`bulk-pp-d-${index}`],
        goalie: `bulk-g-${index}`,
        chemistry: 60 + Math.floor(Math.random() * 40)
      }
    ],
    penalty_kill: [
      {
        name: 'PK1',
        forwards: [`bulk-pk-f-${index}-1`, `bulk-pk-f-${index}-2`],
        defense: [`bulk-pk-d-${index}-1`, `bulk-pk-d-${index}-2`],
        goalie: `bulk-g-${index}`,
        chemistry: 55 + Math.floor(Math.random() * 45)
      }
    ]
  } as Lineups,
  gameCompleted: index % 4 === 0, // 25% completed
  tags: [`bulk-game-${index + 1}`],
  metadata: {
    bulkGenerated: true,
    index: index + 1
  }
}));

// Export all fixtures
export const gameStrategyFixtures = {
  valid: validGameStrategyData,
  invalid: invalidGameStrategyData,
  edgeCase: edgeCaseGameStrategyData,
  bulk: bulkGameStrategyData
};