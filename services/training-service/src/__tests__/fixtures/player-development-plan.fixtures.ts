// @ts-nocheck - Test fixtures for player development plan
import {
  PlayerDevelopmentPlan,
  DevelopmentPlanStatus,
  GoalStatus,
  GoalCategory,
  MilestoneStatus,
  CommunicationMethod,
  ExternalResourceType,
  CurrentLevel,
  DevelopmentGoal,
  WeeklyPlan,
  Milestone,
  ParentCommunication,
  ExternalResource
} from '../../entities/PlayerDevelopmentPlan';

// Valid player development plan data
export const validPlayerDevelopmentPlanData = {
  activePlan: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    seasonId: '550e8400-e29b-41d4-a716-446655440100',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-04-30'),
    currentLevel: {
      overallRating: 78,
      strengths: [
        'Excellent skating ability',
        'Strong work ethic',
        'Good hockey IQ',
        'Natural leadership qualities'
      ],
      weaknesses: [
        'Needs to improve shot accuracy',
        'Defensive positioning requires work',
        'Must build physical strength'
      ],
      recentEvaluation: '550e8400-e29b-41d4-a716-446655440200'
    } as CurrentLevel,
    goals: [
      {
        id: 'goal-001',
        category: 'technical' as GoalCategory,
        skill: 'Shot accuracy',
        currentLevel: 6,
        targetLevel: 8,
        deadline: new Date('2025-01-31'),
        specificActions: [
          'Practice shooting drills 3x per week',
          'Work with shooting coach twice per month',
          'Film and analyze shooting technique'
        ],
        measurementMethod: 'Shooting accuracy percentage in practice and games',
        progress: 35,
        status: 'in_progress' as GoalStatus
      },
      {
        id: 'goal-002',
        category: 'tactical' as GoalCategory,
        skill: 'Defensive positioning',
        currentLevel: 5,
        targetLevel: 7,
        deadline: new Date('2025-02-28'),
        specificActions: [
          'Study video of defensive positioning',
          'Extra defensive drills after practice',
          'Shadow experienced defensemen'
        ],
        measurementMethod: 'Coach evaluation and game performance metrics',
        progress: 20,
        status: 'in_progress' as GoalStatus
      },
      {
        id: 'goal-003',
        category: 'physical' as GoalCategory,
        skill: 'Core strength',
        currentLevel: 6,
        targetLevel: 8,
        deadline: new Date('2025-03-31'),
        specificActions: [
          'Off-ice training 4x per week',
          'Work with strength coach',
          'Focus on functional movement patterns'
        ],
        measurementMethod: 'Fitness testing and strength assessments',
        progress: 50,
        status: 'in_progress' as GoalStatus
      }
    ] as DevelopmentGoal[],
    weeklyPlan: [
      {
        week: 1,
        focus: ['Shooting technique', 'Basic positioning'],
        drills: ['shooting-accuracy-1', 'positioning-basics-1'],
        targetMetrics: {
          shootingAttempts: 50,
          positioningDrills: 20
        }
      },
      {
        week: 2,
        focus: ['Shot selection', 'Gap control'],
        drills: ['shot-selection-1', 'gap-control-1'],
        targetMetrics: {
          shootingAttempts: 60,
          positioningDrills: 25
        },
        actualMetrics: {
          shootingAttempts: 58,
          positioningDrills: 23
        }
      },
      {
        week: 3,
        focus: ['Quick release', 'Stick positioning'],
        drills: ['quick-release-1', 'stick-position-1'],
        targetMetrics: {
          shootingAttempts: 55,
          positioningDrills: 22
        }
      },
      {
        week: 4,
        focus: ['Game situations', 'Team defense'],
        drills: ['game-shooting-1', 'team-defense-1'],
        targetMetrics: {
          gameScenarios: 15,
          teamDrills: 10
        }
      }
    ] as WeeklyPlan[],
    milestones: [
      {
        date: new Date('2024-11-30'),
        description: 'First quarter shooting accuracy assessment',
        metric: 'Shooting accuracy percentage',
        target: 65,
        achieved: 62,
        status: 'achieved' as MilestoneStatus
      },
      {
        date: new Date('2024-12-31'),
        description: 'Mid-season defensive evaluation',
        metric: 'Defensive positioning rating',
        target: 6,
        status: 'pending' as MilestoneStatus
      },
      {
        date: new Date('2025-02-28'),
        description: 'Physical strength benchmark',
        metric: 'Core strength assessment score',
        target: 85,
        status: 'pending' as MilestoneStatus
      }
    ] as Milestone[],
    parentCommunication: [
      {
        date: new Date('2024-10-15'),
        method: 'meeting' as CommunicationMethod,
        summary: 'Discussed player progress and upcoming goals. Parents supportive of training plan.',
        nextFollowUp: new Date('2024-11-15')
      },
      {
        date: new Date('2024-11-20'),
        method: 'email' as CommunicationMethod,
        summary: 'Sent progress update with shooting accuracy improvements. Highlighted need for continued work.'
      }
    ] as ParentCommunication[],
    externalResources: [
      {
        type: 'video' as ExternalResourceType,
        name: 'Elite Shooting Techniques',
        url: 'https://example.com/shooting-video',
        assignedDate: new Date('2024-10-01'),
        completedDate: new Date('2024-10-15')
      },
      {
        type: 'article' as ExternalResourceType,
        name: 'Defensive Zone Coverage Principles',
        url: 'https://example.com/defense-article',
        assignedDate: new Date('2024-10-10')
      }
    ] as ExternalResource[],
    status: 'active' as DevelopmentPlanStatus,
    notes: 'Player showing good progress on technical goals. Need to increase focus on tactical development.'
  },

  completedPlan: {
    playerId: '550e8400-e29b-41d4-a716-446655440011',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    seasonId: '550e8400-e29b-41d4-a716-446655440101',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2024-04-30'),
    currentLevel: {
      overallRating: 82,
      strengths: [
        'Excellent game awareness',
        'Improved shot accuracy significantly',
        'Strong leadership on ice'
      ],
      weaknesses: [
        'Could improve face-off percentage',
        'Needs more consistency in effort'
      ],
      recentEvaluation: '550e8400-e29b-41d4-a716-446655440201'
    } as CurrentLevel,
    goals: [
      {
        id: 'goal-comp-001',
        category: 'technical' as GoalCategory,
        skill: 'Face-off percentage',
        currentLevel: 5,
        targetLevel: 7,
        deadline: new Date('2024-03-31'),
        specificActions: [
          'Daily face-off practice',
          'Study opponent tendencies',
          'Work on technique with specialist'
        ],
        measurementMethod: 'Game face-off win percentage',
        progress: 100,
        status: 'completed' as GoalStatus
      },
      {
        id: 'goal-comp-002',
        category: 'mental' as GoalCategory,
        skill: 'Consistency',
        currentLevel: 6,
        targetLevel: 8,
        deadline: new Date('2024-04-15'),
        specificActions: [
          'Develop pre-game routines',
          'Mental preparation techniques',
          'Track effort levels each game'
        ],
        measurementMethod: 'Coach assessment and self-evaluation',
        progress: 85,
        status: 'completed' as GoalStatus
      }
    ] as DevelopmentGoal[],
    weeklyPlan: [
      {
        week: 28,
        focus: ['Season review', 'Final assessments'],
        drills: ['season-review-1', 'final-assessment-1'],
        targetMetrics: {
          reviewSessions: 3,
          assessments: 2
        },
        actualMetrics: {
          reviewSessions: 3,
          assessments: 2
        }
      }
    ] as WeeklyPlan[],
    milestones: [
      {
        date: new Date('2024-03-31'),
        description: 'Face-off percentage goal achieved',
        metric: 'Face-off win percentage',
        target: 60,
        achieved: 63,
        status: 'achieved' as MilestoneStatus
      },
      {
        date: new Date('2024-04-15'),
        description: 'Consistency improvement completed',
        metric: 'Effort consistency rating',
        target: 8,
        achieved: 8,
        status: 'achieved' as MilestoneStatus
      }
    ] as Milestone[],
    status: 'completed' as DevelopmentPlanStatus,
    notes: 'Successful completion of development plan. Player exceeded expectations in most areas.'
  },

  pausedPlan: {
    playerId: '550e8400-e29b-41d4-a716-446655440012',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    seasonId: '550e8400-e29b-41d4-a716-446655440102',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-04-30'),
    currentLevel: {
      overallRating: 65,
      strengths: [
        'Good attitude and coachability',
        'Solid defensive awareness'
      ],
      weaknesses: [
        'Recovering from injury',
        'Lost conditioning during time off',
        'Confidence needs rebuilding'
      ],
      recentEvaluation: '550e8400-e29b-41d4-a716-446655440202'
    } as CurrentLevel,
    goals: [
      {
        id: 'goal-pause-001',
        category: 'physical' as GoalCategory,
        skill: 'Injury rehabilitation',
        currentLevel: 3,
        targetLevel: 8,
        deadline: new Date('2025-01-31'),
        specificActions: [
          'Follow physio program strictly',
          'Gradual return to skating',
          'Strength rebuilding exercises'
        ],
        measurementMethod: 'Medical clearance and fitness testing',
        progress: 40,
        status: 'in_progress' as GoalStatus
      }
    ] as DevelopmentGoal[],
    weeklyPlan: [
      {
        week: 8,
        focus: ['Rehabilitation exercises', 'Light skating'],
        drills: ['rehab-exercise-1', 'light-skating-1'],
        targetMetrics: {
          rehabSessions: 5,
          skatingMinutes: 30
        }
      }
    ] as WeeklyPlan[],
    milestones: [
      {
        date: new Date('2024-12-15'),
        description: 'Return to full practice clearance',
        metric: 'Medical assessment',
        target: 1, // Binary: cleared or not
        status: 'pending' as MilestoneStatus
      }
    ] as Milestone[],
    status: 'paused' as DevelopmentPlanStatus,
    notes: 'Plan paused due to injury. Focus on rehabilitation and gradual return to play.'
  }
};

// Invalid player development plan data
export const invalidPlayerDevelopmentPlanData = {
  missingRequired: {
    // Missing playerId, coachId, seasonId, startDate, endDate, currentLevel, goals, weeklyPlan, milestones, status
    notes: 'Invalid development plan missing required fields'
  },

  invalidStatus: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    seasonId: '550e8400-e29b-41d4-a716-446655440100',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-04-30'),
    currentLevel: {
      overallRating: 75,
      strengths: ['Good player'],
      weaknesses: ['Needs work'],
      recentEvaluation: 'eval-id'
    },
    goals: [],
    weeklyPlan: [],
    milestones: [],
    status: 'invalid_status' as any
  },

  invalidDates: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    seasonId: '550e8400-e29b-41d4-a716-446655440100',
    startDate: new Date('2025-04-30'), // Start after end
    endDate: new Date('2024-09-01'),
    currentLevel: {
      overallRating: 75,
      strengths: ['Good player'],
      weaknesses: ['Needs work'],
      recentEvaluation: 'eval-id'
    },
    goals: [],
    weeklyPlan: [],
    milestones: [],
    status: 'active' as DevelopmentPlanStatus
  },

  invalidUUIDs: {
    playerId: 'not-a-uuid',
    coachId: 'also-not-a-uuid',
    seasonId: 'definitely-not-a-uuid',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-04-30'),
    currentLevel: {
      overallRating: 75,
      strengths: ['Good player'],
      weaknesses: ['Needs work'],
      recentEvaluation: 'eval-id'
    },
    goals: [],
    weeklyPlan: [],
    milestones: [],
    status: 'active' as DevelopmentPlanStatus
  },

  malformedGoals: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    seasonId: '550e8400-e29b-41d4-a716-446655440100',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-04-30'),
    currentLevel: {
      overallRating: 75,
      strengths: ['Good player'],
      weaknesses: ['Needs work'],
      recentEvaluation: 'eval-id'
    },
    goals: [
      {
        // Missing required fields: id, category, skill, currentLevel, targetLevel, deadline, specificActions, measurementMethod, progress, status
        skill: 'Incomplete goal'
      }
    ] as any,
    weeklyPlan: [],
    milestones: [],
    status: 'active' as DevelopmentPlanStatus
  },

  invalidCurrentLevel: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    seasonId: '550e8400-e29b-41d4-a716-446655440100',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-04-30'),
    currentLevel: {
      overallRating: 150, // Invalid rating > 100
      strengths: [], // Empty strengths
      weaknesses: [], // Empty weaknesses
      recentEvaluation: ''
    },
    goals: [],
    weeklyPlan: [],
    milestones: [],
    status: 'active' as DevelopmentPlanStatus
  }
};

// Edge case data
export const edgeCasePlayerDevelopmentPlanData = {
  maximumGoals: {
    playerId: '550e8400-e29b-41d4-a716-446655440020',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    seasonId: '550e8400-e29b-41d4-a716-446655440120',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-04-30'),
    currentLevel: {
      overallRating: 65,
      strengths: ['Highly motivated', 'Excellent attitude'],
      weaknesses: ['Needs work in all areas'],
      recentEvaluation: '550e8400-e29b-41d4-a716-446655440220'
    } as CurrentLevel,
    goals: Array.from({ length: 15 }, (_, i) => ({
      id: `max-goal-${i + 1}`,
      category: (['technical', 'tactical', 'physical', 'mental'] as GoalCategory[])[i % 4],
      skill: `Skill ${i + 1}`,
      currentLevel: Math.floor(Math.random() * 5) + 3, // 3-7
      targetLevel: Math.floor(Math.random() * 3) + 8, // 8-10
      deadline: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000), // Staggered deadlines
      specificActions: Array.from({ length: 3 + (i % 3) }, (_, j) => `Action ${j + 1} for skill ${i + 1}`),
      measurementMethod: `Measurement method for skill ${i + 1}`,
      progress: Math.floor(Math.random() * 100),
      status: (['not_started', 'in_progress', 'completed', 'delayed'] as GoalStatus[])[i % 4]
    })) as DevelopmentGoal[],
    weeklyPlan: Array.from({ length: 32 }, (_, i) => ({
      week: i + 1,
      focus: [`Focus area ${(i % 4) + 1}`, `Secondary focus ${(i % 3) + 1}`],
      drills: [`drill-${i + 1}-1`, `drill-${i + 1}-2`],
      targetMetrics: {
        primaryDrills: 10 + (i % 5),
        secondaryWork: 5 + (i % 3)
      },
      ...(i < 20 && {
        actualMetrics: {
          primaryDrills: 8 + (i % 7),
          secondaryWork: 4 + (i % 4)
        }
      })
    })) as WeeklyPlan[],
    milestones: Array.from({ length: 8 }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 60 * 24 * 60 * 60 * 1000), // Every 2 months
      description: `Major milestone ${i + 1}`,
      metric: `Metric ${i + 1}`,
      target: 75 + (i * 3),
      ...(i < 4 && { achieved: 70 + (i * 4) }),
      status: (i < 4 ? 'achieved' : 'pending') as MilestoneStatus
    })) as Milestone[],
    status: 'active' as DevelopmentPlanStatus,
    notes: 'Comprehensive development plan with maximum goals and detailed tracking.'
  },

  extensiveCommunication: {
    playerId: '550e8400-e29b-41d4-a716-446655440021',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    seasonId: '550e8400-e29b-41d4-a716-446655440121',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-04-30'),
    currentLevel: {
      overallRating: 72,
      strengths: ['Good technical skills', 'Improving tactical understanding'],
      weaknesses: ['Needs more confidence', 'Physical development required'],
      recentEvaluation: '550e8400-e29b-41d4-a716-446655440221'
    } as CurrentLevel,
    goals: [
      {
        id: 'comm-goal-001',
        category: 'mental' as GoalCategory,
        skill: 'Confidence building',
        currentLevel: 5,
        targetLevel: 8,
        deadline: new Date('2025-02-28'),
        specificActions: ['Positive reinforcement', 'Success tracking', 'Mental skills training'],
        measurementMethod: 'Self-assessment and coach observation',
        progress: 60,
        status: 'in_progress' as GoalStatus
      }
    ] as DevelopmentGoal[],
    weeklyPlan: [
      {
        week: 15,
        focus: ['Confidence building exercises'],
        drills: ['confidence-drill-1'],
        targetMetrics: { confidenceExercises: 5 },
        actualMetrics: { confidenceExercises: 5 }
      }
    ] as WeeklyPlan[],
    milestones: [
      {
        date: new Date('2025-01-31'),
        description: 'Confidence assessment',
        metric: 'Self-confidence rating',
        target: 7,
        status: 'pending' as MilestoneStatus
      }
    ] as Milestone[],
    parentCommunication: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(Date.now() - (12 - i) * 14 * 24 * 60 * 60 * 1000), // Bi-weekly
      method: (['meeting', 'email', 'phone'] as CommunicationMethod[])[i % 3],
      summary: `Communication ${i + 1}: Discussed player progress and addressed parent concerns.`,
      ...(i < 10 && { nextFollowUp: new Date(Date.now() - (11 - i) * 14 * 24 * 60 * 60 * 1000) })
    })) as ParentCommunication[],
    externalResources: [
      {
        type: 'course' as ExternalResourceType,
        name: 'Mental Skills Training Course',
        url: 'https://example.com/mental-skills-course',
        assignedDate: new Date('2024-10-01'),
        completedDate: new Date('2024-11-15')
      },
      {
        type: 'camp' as ExternalResourceType,
        name: 'Confidence Building Hockey Camp',
        assignedDate: new Date('2024-12-20')
      },
      {
        type: 'video' as ExternalResourceType,
        name: 'Building Hockey Confidence',
        url: 'https://example.com/confidence-video',
        assignedDate: new Date('2024-11-01'),
        completedDate: new Date('2024-11-10')
      },
      {
        type: 'article' as ExternalResourceType,
        name: 'Sports Psychology for Young Athletes',
        url: 'https://example.com/sports-psych-article',
        assignedDate: new Date('2024-10-15'),
        completedDate: new Date('2024-10-22')
      }
    ] as ExternalResource[],
    status: 'active' as DevelopmentPlanStatus,
    notes: 'Plan with extensive parent communication and external resource utilization. Focus on mental development.'
  },

  archivedPlan: {
    playerId: '550e8400-e29b-41d4-a716-446655440022',
    coachId: '550e8400-e29b-41d4-a716-446655440002', // Different coach
    seasonId: '550e8400-e29b-41d4-a716-446655440099', // Old season
    startDate: new Date('2022-09-01'),
    endDate: new Date('2023-04-30'),
    currentLevel: {
      overallRating: 68,
      strengths: ['Historical data preserved', 'Good reference point'],
      weaknesses: ['Outdated information', 'Player has since improved'],
      recentEvaluation: '550e8400-e29b-41d4-a716-446655440199'
    } as CurrentLevel,
    goals: [
      {
        id: 'archive-goal-001',
        category: 'technical' as GoalCategory,
        skill: 'Basic skating',
        currentLevel: 4,
        targetLevel: 6,
        deadline: new Date('2023-03-31'),
        specificActions: ['Daily skating drills', 'Work with skating coach'],
        measurementMethod: 'Coach evaluation',
        progress: 100,
        status: 'completed' as GoalStatus
      }
    ] as DevelopmentGoal[],
    weeklyPlan: [
      {
        week: 30,
        focus: ['Archive preparation', 'Final review'],
        drills: ['archive-drill-1'],
        targetMetrics: { finalReview: 1 },
        actualMetrics: { finalReview: 1 }
      }
    ] as WeeklyPlan[],
    milestones: [
      {
        date: new Date('2023-04-30'),
        description: 'Plan completion and archival',
        metric: 'Plan completion percentage',
        target: 100,
        achieved: 95,
        status: 'achieved' as MilestoneStatus
      }
    ] as Milestone[],
    status: 'archived' as DevelopmentPlanStatus,
    notes: 'Archived development plan from previous seasons. Maintained for historical reference and progress tracking.'
  }
};

// Bulk data for performance testing
export const bulkPlayerDevelopmentPlanData = Array.from({ length: 40 }, (_, index) => ({
  playerId: `550e8400-e29b-41d4-a716-446655441${index.toString().padStart(3, '0')}`,
  coachId: `550e8400-e29b-41d4-a716-446655440${(index % 5).toString().padStart(3, '0')}`,
  seasonId: `550e8400-e29b-41d4-a716-446655441${(100 + index % 3).toString()}`,
  startDate: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000),
  endDate: new Date(Date.now() + Math.floor(Math.random() * 200) * 24 * 60 * 60 * 1000),
  currentLevel: {
    overallRating: Math.floor(Math.random() * 40) + 50, // 50-90
    strengths: Array.from(
      { length: Math.floor(Math.random() * 3) + 2 },
      (_, i) => `Bulk strength ${i + 1} for player ${index + 1}`
    ),
    weaknesses: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 },
      (_, i) => `Bulk weakness ${i + 1} for player ${index + 1}`
    ),
    recentEvaluation: `550e8400-e29b-41d4-a716-446655442${index.toString().padStart(3, '0')}`
  } as CurrentLevel,
  goals: Array.from({ length: Math.floor(Math.random() * 5) + 2 }, (_, i) => ({
    id: `bulk-goal-${index}-${i + 1}`,
    category: (['technical', 'tactical', 'physical', 'mental'] as GoalCategory[])[i % 4],
    skill: `Bulk skill ${i + 1}`,
    currentLevel: Math.floor(Math.random() * 5) + 3, // 3-7
    targetLevel: Math.floor(Math.random() * 3) + 8, // 8-10
    deadline: new Date(Date.now() + (i + 1) * 60 * 24 * 60 * 60 * 1000),
    specificActions: Array.from(
      { length: Math.floor(Math.random() * 3) + 2 },
      (_, j) => `Bulk action ${j + 1} for goal ${i + 1}`
    ),
    measurementMethod: `Bulk measurement ${i + 1}`,
    progress: Math.floor(Math.random() * 100),
    status: (['not_started', 'in_progress', 'completed', 'delayed'] as GoalStatus[])[i % 4]
  })) as DevelopmentGoal[],
  weeklyPlan: Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
    week: i + 1,
    focus: [`Bulk focus ${i + 1}`],
    drills: [`bulk-drill-${index}-${i + 1}`],
    targetMetrics: { bulkTarget: 10 + i },
    ...(i < 3 && { actualMetrics: { bulkTarget: 8 + i } })
  })) as WeeklyPlan[],
  milestones: Array.from({ length: Math.floor(Math.random() * 4) + 2 }, (_, i) => ({
    date: new Date(Date.now() + (i + 1) * 90 * 24 * 60 * 60 * 1000),
    description: `Bulk milestone ${i + 1}`,
    metric: `Bulk metric ${i + 1}`,
    target: 70 + (i * 5),
    ...(i === 0 && { achieved: 68 + i * 5 }),
    status: (i === 0 ? 'achieved' : 'pending') as MilestoneStatus
  })) as Milestone[],
  status: (['active', 'paused', 'completed', 'archived'] as DevelopmentPlanStatus[])[index % 4],
  notes: `Bulk development plan ${index + 1} for performance testing`
}));

// Export all fixtures
export const playerDevelopmentPlanFixtures = {
  valid: validPlayerDevelopmentPlanData,
  invalid: invalidPlayerDevelopmentPlanData,
  edgeCase: edgeCasePlayerDevelopmentPlanData,
  bulk: bulkPlayerDevelopmentPlanData
};