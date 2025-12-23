// @ts-nocheck - Test fixtures for video analysis
import {
  VideoAnalysis,
  VideoAnalysisType,
  ClipCategory,
  ImportanceLevel,
  VideoClip,
  AnalysisPoint,
  PlayerPerformance,
  TeamAnalysis
} from '../../entities/VideoAnalysis';

// Valid video analysis data
export const validVideoAnalysisData = {
  gameAnalysis: {
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    gameId: '550e8400-e29b-41d4-a716-446655440030',
    videoUrl: 'https://example.com/game-video-123.mp4',
    title: 'Game vs Lightning Bolts - Player Analysis',
    type: 'game' as VideoAnalysisType,
    clips: [
      {
        startTime: 245,
        endTime: 270,
        title: 'Excellent Defensive Play',
        category: 'positive' as ClipCategory,
        players: ['550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011'],
        description: 'Great stick positioning to break up 2-on-1 rush',
        coachingPoints: [
          'Perfect gap control approaching the rush',
          'Good communication with defensive partner',
          'Stayed patient and forced play to outside'
        ],
        drawingData: {
          shapes: ['arrow', 'circle'],
          annotations: ['Good positioning', 'Force here']
        }
      },
      {
        startTime: 890,
        endTime: 905,
        title: 'Missed Scoring Opportunity',
        category: 'negative' as ClipCategory,
        players: ['550e8400-e29b-41d4-a716-446655440010'],
        description: 'Player had open net but shot wide',
        coachingPoints: [
          'Need to stay calm in scoring position',
          'Follow through towards target',
          'Take extra second to aim'
        ]
      },
      {
        startTime: 1420,
        endTime: 1445,
        title: 'Power Play Goal Setup',
        category: 'positive' as ClipCategory,
        players: ['550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440012'],
        description: 'Beautiful pass led to power play goal',
        coachingPoints: [
          'Excellent vision to find open teammate',
          'Perfect timing on the pass',
          'Great patience to wait for play to develop'
        ],
        drawingData: {
          shapes: ['line', 'arrow'],
          annotations: ['Vision', 'Perfect pass']
        }
      },
      {
        startTime: 1780,
        endTime: 1800,
        title: 'Neutral Zone Teaching Point',
        category: 'teaching' as ClipCategory,
        players: ['550e8400-e29b-41d4-a716-446655440010'],
        description: 'Good example of proper neutral zone positioning',
        coachingPoints: [
          'This is how we want to support in neutral zone',
          'Good angle to receive pass',
          'Ready to transition quickly'
        ]
      }
    ] as VideoClip[],
    playerPerformance: {
      positives: [
        {
          timestamp: 245,
          description: 'Excellent defensive read and positioning',
          category: 'defense',
          importance: 'high' as ImportanceLevel
        },
        {
          timestamp: 1420,
          description: 'Great playmaking vision and execution',
          category: 'offense',
          importance: 'high' as ImportanceLevel
        },
        {
          timestamp: 1780,
          description: 'Proper neutral zone support positioning',
          category: 'systems',
          importance: 'medium' as ImportanceLevel
        }
      ],
      improvements: [
        {
          timestamp: 890,
          description: 'Need better composure in scoring situations',
          category: 'mental',
          importance: 'high' as ImportanceLevel
        },
        {
          timestamp: 1200,
          description: 'Could have been more physical on forecheck',
          category: 'compete',
          importance: 'medium' as ImportanceLevel
        }
      ],
      keyMoments: [
        {
          timestamp: 245,
          description: 'Game-saving defensive play',
          category: 'impact',
          importance: 'high' as ImportanceLevel
        },
        {
          timestamp: 1420,
          description: 'Primary assist on game-winning goal',
          category: 'impact',
          importance: 'high' as ImportanceLevel
        }
      ]
    } as PlayerPerformance,
    summary: 'Strong overall performance with excellent defensive play and playmaking. Need to work on composure in scoring situations.',
    tags: ['game-analysis', 'defense', 'playmaking', 'composure'],
    sharedWithPlayer: true,
    sharedWithTeam: false
  },

  practiceAnalysis: {
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    playerId: '550e8400-e29b-41d4-a716-446655440011',
    videoUrl: 'https://example.com/practice-video-456.mp4',
    title: 'Shooting Practice - Technique Analysis',
    type: 'practice' as VideoAnalysisType,
    clips: [
      {
        startTime: 120,
        endTime: 140,
        title: 'Proper Shooting Technique',
        category: 'positive' as ClipCategory,
        players: ['550e8400-e29b-41d4-a716-446655440011'],
        description: 'Great example of proper wrist shot technique',
        coachingPoints: [
          'Perfect weight transfer',
          'Good follow-through',
          'Eyes on target throughout'
        ]
      },
      {
        startTime: 280,
        endTime: 295,
        title: 'Technique Breakdown',
        category: 'negative' as ClipCategory,
        players: ['550e8400-e29b-41d4-a716-446655440011'],
        description: 'Poor weight transfer affecting shot accuracy',
        coachingPoints: [
          'Need to shift weight forward',
          'Keep blade closed through release',
          'Follow through towards target'
        ],
        drawingData: {
          shapes: ['arrow', 'line'],
          annotations: ['Weight shift needed', 'Follow through direction']
        }
      },
      {
        startTime: 420,
        endTime: 435,
        title: 'Improvement Shown',
        category: 'positive' as ClipCategory,
        players: ['550e8400-e29b-41d4-a716-446655440011'],
        description: 'Player corrected technique after coaching',
        coachingPoints: [
          'Much better weight transfer',
          'Good adjustment after feedback',
          'This is the consistency we want'
        ]
      }
    ] as VideoClip[],
    playerPerformance: {
      positives: [
        {
          timestamp: 120,
          description: 'Demonstrated proper shooting fundamentals',
          category: 'technique',
          importance: 'medium' as ImportanceLevel
        },
        {
          timestamp: 420,
          description: 'Quick adjustment after coaching feedback',
          category: 'coachability',
          importance: 'high' as ImportanceLevel
        }
      ],
      improvements: [
        {
          timestamp: 280,
          description: 'Inconsistent weight transfer on shots',
          category: 'technique',
          importance: 'high' as ImportanceLevel
        }
      ],
      keyMoments: [
        {
          timestamp: 420,
          description: 'Breakthrough moment in technique correction',
          category: 'development',
          importance: 'high' as ImportanceLevel
        }
      ]
    } as PlayerPerformance,
    summary: 'Good practice session showing ability to make adjustments. Continue working on consistent weight transfer.',
    tags: ['practice', 'shooting', 'technique', 'development'],
    sharedWithPlayer: true,
    sharedWithTeam: false
  },

  skillsAnalysis: {
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    playerId: '550e8400-e29b-41d4-a716-446655440012',
    videoUrl: 'https://example.com/skills-video-789.mp4',
    title: 'Puck Handling Skills Assessment',
    type: 'skills' as VideoAnalysisType,
    clips: [
      {
        startTime: 60,
        endTime: 85,
        title: 'Advanced Puck Protection',
        category: 'positive' as ClipCategory,
        players: ['550e8400-e29b-41d4-a716-446655440012'],
        description: 'Excellent puck protection using body positioning',
        coachingPoints: [
          'Great use of body to shield puck',
          'Good head up awareness',
          'Smooth transitions between moves'
        ]
      },
      {
        startTime: 200,
        endTime: 215,
        title: 'Teaching Moment - Skating',
        category: 'teaching' as ClipCategory,
        players: ['550e8400-e29b-41d4-a716-446655440012'],
        description: 'Demonstration of proper skating with puck',
        coachingPoints: [
          'This is how we maintain speed with puck',
          'Notice how head stays up',
          'Puck stays in control throughout'
        ]
      },
      {
        startTime: 340,
        endTime: 360,
        title: 'Area for Improvement',
        category: 'neutral' as ClipCategory,
        players: ['550e8400-e29b-41d4-a716-446655440012'],
        description: 'Shows tendency to look down at puck',
        coachingPoints: [
          'Try to feel puck rather than watch it',
          'Keep eyes up to see ice',
          'Trust your hands to control puck'
        ]
      }
    ] as VideoClip[],
    playerPerformance: {
      positives: [
        {
          timestamp: 60,
          description: 'Elite-level puck protection skills',
          category: 'skills',
          importance: 'high' as ImportanceLevel
        }
      ],
      improvements: [
        {
          timestamp: 340,
          description: 'Head down too much while handling puck',
          category: 'awareness',
          importance: 'medium' as ImportanceLevel
        }
      ],
      keyMoments: [
        {
          timestamp: 200,
          description: 'Perfect execution of skill being taught',
          category: 'demonstration',
          importance: 'medium' as ImportanceLevel
        }
      ]
    } as PlayerPerformance,
    summary: 'Exceptional puck handling skills. Main focus should be keeping head up while maintaining puck control.',
    tags: ['skills', 'puck-handling', 'awareness'],
    sharedWithPlayer: true,
    sharedWithTeam: false
  },

  tacticalAnalysis: {
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    playerId: '550e8400-e29b-41d4-a716-446655440013',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    gameId: '550e8400-e29b-41d4-a716-446655440031',
    videoUrl: 'https://example.com/tactical-video-101.mp4',
    title: 'Defensive Zone Coverage Analysis',
    type: 'tactical' as VideoAnalysisType,
    clips: [
      {
        startTime: 180,
        endTime: 210,
        title: 'Perfect System Execution',
        category: 'positive' as ClipCategory,
        players: [
          '550e8400-e29b-41d4-a716-446655440013',
          '550e8400-e29b-41d4-a716-446655440014',
          '550e8400-e29b-41d4-a716-446655440015'
        ],
        description: 'Textbook defensive zone coverage',
        coachingPoints: [
          'All five players in perfect position',
          'Great communication between partners',
          'Quick transition to breakout'
        ],
        drawingData: {
          shapes: ['circle', 'arrow', 'line'],
          annotations: ['Coverage zones', 'Communication', 'Breakout route']
        }
      },
      {
        startTime: 450,
        endTime: 470,
        title: 'System Breakdown',
        category: 'negative' as ClipCategory,
        players: [
          '550e8400-e29b-41d4-a716-446655440013',
          '550e8400-e29b-41d4-a716-446655440014'
        ],
        description: 'Coverage breakdown led to scoring chance against',
        coachingPoints: [
          'Need better communication here',
          'Player left his zone too early',
          'Must trust system and stay disciplined'
        ],
        drawingData: {
          shapes: ['X', 'arrow'],
          annotations: ['Breakdown point', 'Should have stayed here']
        }
      }
    ] as VideoClip[],
    playerPerformance: {
      positives: [
        {
          timestamp: 180,
          description: 'Perfect execution of defensive system',
          category: 'systems',
          importance: 'high' as ImportanceLevel
        }
      ],
      improvements: [
        {
          timestamp: 450,
          description: 'Left coverage zone too early',
          category: 'discipline',
          importance: 'high' as ImportanceLevel
        }
      ],
      keyMoments: [
        {
          timestamp: 180,
          description: 'Prevented high-danger scoring chance',
          category: 'impact',
          importance: 'high' as ImportanceLevel
        }
      ]
    } as PlayerPerformance,
    teamAnalysis: {
      systemExecution: [
        {
          timestamp: 180,
          description: 'Perfect 5-man unit execution of defensive coverage',
          category: 'defense',
          importance: 'high' as ImportanceLevel
        }
      ],
      breakdowns: [
        {
          timestamp: 450,
          description: 'Communication breakdown in defensive zone',
          category: 'communication',
          importance: 'high' as ImportanceLevel
        }
      ],
      opportunities: [
        {
          timestamp: 210,
          description: 'Good breakout opportunity created by strong defense',
          category: 'transition',
          importance: 'medium' as ImportanceLevel
        }
      ]
    } as TeamAnalysis,
    summary: 'Strong understanding of defensive system with occasional lapses in discipline. Team shows good system knowledge.',
    tags: ['tactical', 'defensive-systems', 'communication'],
    sharedWithPlayer: true,
    sharedWithTeam: true
  }
};

// Invalid video analysis data
export const invalidVideoAnalysisData = {
  missingRequired: {
    // Missing coachId, playerId, videoUrl, title, type, clips
    sharedWithPlayer: false,
    sharedWithTeam: false
  },

  invalidType: {
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    videoUrl: 'https://example.com/video.mp4',
    title: 'Invalid Type Analysis',
    type: 'invalid_type' as any,
    clips: [],
    sharedWithPlayer: false,
    sharedWithTeam: false
  },

  invalidUUIDs: {
    coachId: 'not-a-uuid',
    playerId: 'also-not-a-uuid',
    teamId: 'definitely-not-a-uuid',
    gameId: 'invalid-game-id',
    videoUrl: 'https://example.com/video.mp4',
    title: 'Invalid UUIDs Analysis',
    type: 'game' as VideoAnalysisType,
    clips: [],
    sharedWithPlayer: false,
    sharedWithTeam: false
  },

  malformedClips: {
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    videoUrl: 'https://example.com/video.mp4',
    title: 'Malformed Clips Analysis',
    type: 'game' as VideoAnalysisType,
    clips: [
      {
        // Missing required fields: startTime, endTime, title, category, players, description, coachingPoints
        startTime: 100
      }
    ] as any,
    sharedWithPlayer: false,
    sharedWithTeam: false
  },

  invalidTimestamps: {
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    videoUrl: 'https://example.com/video.mp4',
    title: 'Invalid Timestamps Analysis',
    type: 'game' as VideoAnalysisType,
    clips: [
      {
        startTime: 200, // Start after end
        endTime: 150,
        title: 'Invalid Time Clip',
        category: 'positive' as ClipCategory,
        players: ['550e8400-e29b-41d4-a716-446655440010'],
        description: 'Invalid timestamp clip',
        coachingPoints: ['Invalid timing']
      }
    ] as VideoClip[],
    sharedWithPlayer: false,
    sharedWithTeam: false
  },

  invalidClipCategory: {
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    videoUrl: 'https://example.com/video.mp4',
    title: 'Invalid Category Analysis',
    type: 'game' as VideoAnalysisType,
    clips: [
      {
        startTime: 100,
        endTime: 120,
        title: 'Invalid Category Clip',
        category: 'invalid_category' as any,
        players: ['550e8400-e29b-41d4-a716-446655440010'],
        description: 'Invalid category clip',
        coachingPoints: ['Invalid category']
      }
    ],
    sharedWithPlayer: false,
    sharedWithTeam: false
  }
};

// Edge case data
export const edgeCaseVideoAnalysisData = {
  manyClips: {
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    playerId: '550e8400-e29b-41d4-a716-446655440020',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    gameId: '550e8400-e29b-41d4-a716-446655440040',
    videoUrl: 'https://example.com/comprehensive-analysis-video.mp4',
    title: 'Comprehensive Full Game Analysis',
    type: 'game' as VideoAnalysisType,
    clips: Array.from({ length: 25 }, (_, i) => ({
      startTime: i * 120 + 60, // 2 minute intervals
      endTime: i * 120 + 90,
      title: `Analysis Point ${i + 1}`,
      category: (['positive', 'negative', 'neutral', 'teaching'] as ClipCategory[])[i % 4],
      players: [`550e8400-e29b-41d4-a716-446655440${(20 + i % 5).toString()}`],
      description: `Detailed analysis point ${i + 1} showing various aspects of play`,
      coachingPoints: Array.from(
        { length: Math.floor(Math.random() * 3) + 2 },
        (_, j) => `Coaching point ${j + 1} for clip ${i + 1}`
      ),
      ...(i % 5 === 0 && {
        drawingData: {
          shapes: ['arrow', 'circle', 'line'],
          annotations: [`Drawing ${i + 1}`, `Annotation ${i + 1}`]
        }
      })
    })) as VideoClip[],
    playerPerformance: {
      positives: Array.from({ length: 12 }, (_, i) => ({
        timestamp: i * 200 + 100,
        description: `Positive performance point ${i + 1}`,
        category: `category-${i % 4}`,
        importance: (['high', 'medium', 'low'] as ImportanceLevel[])[i % 3]
      })),
      improvements: Array.from({ length: 8 }, (_, i) => ({
        timestamp: i * 250 + 150,
        description: `Improvement needed point ${i + 1}`,
        category: `improvement-${i % 3}`,
        importance: (['high', 'medium', 'low'] as ImportanceLevel[])[i % 3]
      })),
      keyMoments: Array.from({ length: 6 }, (_, i) => ({
        timestamp: i * 400 + 200,
        description: `Key moment ${i + 1}`,
        category: `key-${i % 2}`,
        importance: 'high' as ImportanceLevel
      }))
    } as PlayerPerformance,
    teamAnalysis: {
      systemExecution: Array.from({ length: 5 }, (_, i) => ({
        timestamp: i * 600 + 300,
        description: `System execution point ${i + 1}`,
        category: 'systems',
        importance: 'high' as ImportanceLevel
      })),
      breakdowns: Array.from({ length: 4 }, (_, i) => ({
        timestamp: i * 700 + 400,
        description: `System breakdown ${i + 1}`,
        category: 'breakdown',
        importance: 'high' as ImportanceLevel
      })),
      opportunities: Array.from({ length: 3 }, (_, i) => ({
        timestamp: i * 800 + 500,
        description: `Missed opportunity ${i + 1}`,
        category: 'opportunity',
        importance: 'medium' as ImportanceLevel
      }))
    } as TeamAnalysis,
    summary: 'Comprehensive analysis of entire game performance with detailed breakdown of all aspects of play.',
    tags: [
      'comprehensive', 'full-game', 'detailed-analysis', 'multi-clip',
      'performance-review', 'team-analysis', 'individual-focus'
    ],
    sharedWithPlayer: true,
    sharedWithTeam: true
  },

  noAnalysisData: {
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    playerId: '550e8400-e29b-41d4-a716-446655440021',
    videoUrl: 'https://example.com/basic-video.mp4',
    title: 'Basic Video with Clips Only',
    type: 'practice' as VideoAnalysisType,
    clips: [
      {
        startTime: 60,
        endTime: 90,
        title: 'Single Practice Clip',
        category: 'neutral' as ClipCategory,
        players: ['550e8400-e29b-41d4-a716-446655440021'],
        description: 'Basic practice clip without detailed analysis',
        coachingPoints: ['Simple coaching point']
      }
    ] as VideoClip[],
    // No playerPerformance or teamAnalysis
    summary: 'Basic video analysis with minimal detail',
    tags: ['basic', 'simple'],
    sharedWithPlayer: false,
    sharedWithTeam: false
  },

  sharedWithAll: {
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    playerId: '550e8400-e29b-41d4-a716-446655440022',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    gameId: '550e8400-e29b-41d4-a716-446655440042',
    videoUrl: 'https://example.com/team-shared-video.mp4',
    title: 'Team Learning Video - Shared Analysis',
    type: 'tactical' as VideoAnalysisType,
    clips: [
      {
        startTime: 120,
        endTime: 180,
        title: 'Team Teaching Moment',
        category: 'teaching' as ClipCategory,
        players: [
          '550e8400-e29b-41d4-a716-446655440022',
          '550e8400-e29b-41d4-a716-446655440023',
          '550e8400-e29b-41d4-a716-446655440024'
        ],
        description: 'Excellent example of team play that everyone can learn from',
        coachingPoints: [
          'This is how we want all lines to support each other',
          'Notice the communication and positioning',
          'Perfect execution of our system'
        ],
        drawingData: {
          shapes: ['arrow', 'circle', 'line'],
          annotations: ['Team movement', 'Support angles', 'Communication']
        }
      },
      {
        startTime: 300,
        endTime: 350,
        title: 'Learning Opportunity',
        category: 'teaching' as ClipCategory,
        players: [
          '550e8400-e29b-41d4-a716-446655440022',
          '550e8400-e29b-41d4-a716-446655440025'
        ],
        description: 'Common mistake that we can all learn from',
        coachingPoints: [
          'See what happens when we break from system',
          'This is why discipline is so important',
          'Everyone needs to trust their teammates'
        ]
      }
    ] as VideoClip[],
    teamAnalysis: {
      systemExecution: [
        {
          timestamp: 120,
          description: 'Perfect example of team system execution',
          category: 'systems',
          importance: 'high' as ImportanceLevel
        }
      ],
      breakdowns: [
        {
          timestamp: 300,
          description: 'System breakdown caused by individual decision',
          category: 'discipline',
          importance: 'high' as ImportanceLevel
        }
      ],
      opportunities: [
        {
          timestamp: 180,
          description: 'Great teaching opportunity for entire team',
          category: 'learning',
          importance: 'high' as ImportanceLevel
        }
      ]
    } as TeamAnalysis,
    summary: 'Excellent teaching video showing both positive execution and learning opportunities for the entire team.',
    tags: ['team-learning', 'teaching', 'systems', 'shared'],
    sharedWithPlayer: true,
    sharedWithTeam: true
  }
};

// Bulk data for performance testing
export const bulkVideoAnalysisData = Array.from({ length: 30 }, (_, index) => ({
  coachId: `550e8400-e29b-41d4-a716-446655440${(index % 5).toString().padStart(3, '0')}`,
  playerId: `550e8400-e29b-41d4-a716-446655441${index.toString().padStart(3, '0')}`,
  ...(index % 3 === 0 && { teamId: `550e8400-e29b-41d4-a716-446655442${(index % 3).toString().padStart(3, '0')}` }),
  ...(index % 4 === 0 && { gameId: `550e8400-e29b-41d4-a716-446655443${index.toString().padStart(3, '0')}` }),
  videoUrl: `https://example.com/bulk-video-${index + 1}.mp4`,
  title: `Bulk Analysis ${index + 1}`,
  type: (['game', 'practice', 'skills', 'tactical'] as VideoAnalysisType[])[index % 4],
  clips: Array.from({ length: Math.floor(Math.random() * 5) + 2 }, (_, i) => ({
    startTime: i * 120 + Math.floor(Math.random() * 60),
    endTime: i * 120 + 90 + Math.floor(Math.random() * 30),
    title: `Bulk Clip ${i + 1}`,
    category: (['positive', 'negative', 'neutral', 'teaching'] as ClipCategory[])[i % 4],
    players: [`bulk-player-${index}-${i + 1}`],
    description: `Bulk clip description ${i + 1} for analysis ${index + 1}`,
    coachingPoints: [`Bulk coaching point ${i + 1}`],
    ...(i % 3 === 0 && {
      drawingData: {
        shapes: ['arrow'],
        annotations: [`Bulk annotation ${i + 1}`]
      }
    })
  })) as VideoClip[],
  ...(index % 2 === 0 && {
    playerPerformance: {
      positives: [
        {
          timestamp: 100,
          description: `Bulk positive ${index + 1}`,
          category: 'performance',
          importance: 'medium' as ImportanceLevel
        }
      ],
      improvements: [
        {
          timestamp: 200,
          description: `Bulk improvement ${index + 1}`,
          category: 'development',
          importance: 'medium' as ImportanceLevel
        }
      ],
      keyMoments: [
        {
          timestamp: 300,
          description: `Bulk key moment ${index + 1}`,
          category: 'impact',
          importance: 'high' as ImportanceLevel
        }
      ]
    } as PlayerPerformance
  }),
  summary: `Bulk analysis summary ${index + 1}`,
  tags: [`bulk-${index + 1}`, 'performance-testing'],
  sharedWithPlayer: index % 2 === 0,
  sharedWithTeam: index % 3 === 0
}));

// Export all fixtures
export const videoAnalysisFixtures = {
  valid: validVideoAnalysisData,
  invalid: invalidVideoAnalysisData,
  edgeCase: edgeCaseVideoAnalysisData,
  bulk: bulkVideoAnalysisData
};