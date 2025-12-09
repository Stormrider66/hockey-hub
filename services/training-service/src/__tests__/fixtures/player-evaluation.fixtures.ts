import { 
  PlayerEvaluation,
  EvaluationType,
  TechnicalSkills,
  TacticalSkills,
  PhysicalAttributes,
  MentalAttributes,
  GameSpecificNotes,
  DevelopmentPriority
} from '../../entities/PlayerEvaluation';

// Valid player evaluation data
export const validPlayerEvaluationData = {
  preseasonEvaluation: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    evaluationDate: new Date('2024-09-15'),
    type: 'preseason' as EvaluationType,
    technicalSkills: {
      skating: {
        forward: 8,
        backward: 7,
        acceleration: 9,
        agility: 8,
        speed: 9,
        balance: 8,
        edgeWork: 7
      },
      puckHandling: {
        carrying: 8,
        protection: 7,
        deking: 6,
        receiving: 8,
        inTraffic: 7
      },
      shooting: {
        wristShot: 9,
        slapShot: 6,
        snapshot: 8,
        backhand: 5,
        accuracy: 8,
        release: 9,
        power: 7
      },
      passing: {
        forehand: 8,
        backhand: 6,
        saucer: 7,
        accuracy: 8,
        timing: 9,
        vision: 9
      }
    } as TechnicalSkills,
    tacticalSkills: {
      offensive: {
        positioning: 8,
        spacing: 7,
        timing: 8,
        creativity: 9,
        finishing: 8
      },
      defensive: {
        positioning: 7,
        gapControl: 6,
        stickPosition: 8,
        bodyPosition: 7,
        anticipation: 8
      },
      transition: {
        breakouts: 8,
        rushes: 9,
        tracking: 7,
        backchecking: 7
      }
    } as TacticalSkills,
    physicalAttributes: {
      strength: 7,
      speed: 9,
      endurance: 8,
      flexibility: 8,
      balance: 8,
      coordination: 9
    } as PhysicalAttributes,
    mentalAttributes: {
      hockeyIQ: 9,
      competitiveness: 8,
      workEthic: 9,
      coachability: 9,
      leadership: 7,
      teamwork: 8,
      discipline: 8,
      confidence: 8,
      focusUnderPressure: 7
    } as MentalAttributes,
    strengths: 'Exceptional speed and acceleration. Great vision and passing ability. Strong work ethic and coachability.',
    areasForImprovement: 'Needs to improve defensive positioning and gap control. Backhand shots require work.',
    coachComments: 'Player has elite potential with excellent skating and offensive instincts. Focus on defensive aspects.',
    developmentPriorities: [
      {
        priority: 1,
        skill: 'Defensive positioning',
        targetImprovement: 'Improve gap control and defensive awareness',
        timeline: '3 months'
      },
      {
        priority: 2,
        skill: 'Backhand shooting',
        targetImprovement: 'Develop accurate backhand shot',
        timeline: '2 months'
      },
      {
        priority: 3,
        skill: 'Physical strength',
        targetImprovement: 'Build core and leg strength',
        timeline: '6 months'
      }
    ] as DevelopmentPriority[],
    overallRating: 82,
    potential: 'Elite'
  },

  gameEvaluation: {
    playerId: '550e8400-e29b-41d4-a716-446655440011',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    evaluationDate: new Date('2024-11-10'),
    type: 'game' as EvaluationType,
    technicalSkills: {
      skating: {
        forward: 6,
        backward: 5,
        acceleration: 7,
        agility: 6,
        speed: 7,
        balance: 6,
        edgeWork: 5
      },
      puckHandling: {
        carrying: 7,
        protection: 8,
        deking: 6,
        receiving: 7,
        inTraffic: 8
      },
      shooting: {
        wristShot: 7,
        slapShot: 8,
        snapshot: 6,
        backhand: 6,
        accuracy: 7,
        release: 6,
        power: 8
      },
      passing: {
        forehand: 7,
        backhand: 6,
        saucer: 5,
        accuracy: 7,
        timing: 8,
        vision: 7
      }
    } as TechnicalSkills,
    tacticalSkills: {
      offensive: {
        positioning: 7,
        spacing: 6,
        timing: 7,
        creativity: 6,
        finishing: 8
      },
      defensive: {
        positioning: 8,
        gapControl: 9,
        stickPosition: 8,
        bodyPosition: 8,
        anticipation: 8
      },
      transition: {
        breakouts: 6,
        rushes: 5,
        tracking: 8,
        backchecking: 9
      }
    } as TacticalSkills,
    physicalAttributes: {
      strength: 8,
      speed: 7,
      endurance: 9,
      flexibility: 7,
      balance: 7,
      coordination: 7
    } as PhysicalAttributes,
    mentalAttributes: {
      hockeyIQ: 8,
      competitiveness: 9,
      workEthic: 8,
      coachability: 8,
      leadership: 8,
      teamwork: 9,
      discipline: 9,
      confidence: 7,
      focusUnderPressure: 8
    } as MentalAttributes,
    gameSpecificNotes: {
      gamesObserved: 3,
      goals: 2,
      assists: 1,
      plusMinus: 1,
      penaltyMinutes: 2,
      keyMoments: [
        'Great defensive play to break up 2-on-1',
        'Solid screen on power play goal',
        'Excellent backcheck prevented scoring chance'
      ]
    } as GameSpecificNotes,
    strengths: 'Excellent defensive awareness and positioning. Strong physical presence. Great team player.',
    areasForImprovement: 'Needs to improve skating speed and offensive creativity. Work on breakout passes.',
    coachComments: 'Solid defensive player with good hockey sense. Focus on improving speed and offensive contribution.',
    developmentPriorities: [
      {
        priority: 1,
        skill: 'Skating speed',
        targetImprovement: 'Improve first three steps and overall speed',
        timeline: '4 months'
      },
      {
        priority: 2,
        skill: 'Offensive creativity',
        targetImprovement: 'Develop ability to create scoring chances',
        timeline: '3 months'
      }
    ] as DevelopmentPriority[],
    overallRating: 74,
    potential: 'High'
  },

  practiceEvaluation: {
    playerId: '550e8400-e29b-41d4-a716-446655440012',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    evaluationDate: new Date('2024-10-25'),
    type: 'practice' as EvaluationType,
    technicalSkills: {
      skating: {
        forward: 9,
        backward: 8,
        acceleration: 8,
        agility: 9,
        speed: 8,
        balance: 9,
        edgeWork: 9
      },
      puckHandling: {
        carrying: 9,
        protection: 8,
        deking: 9,
        receiving: 9,
        inTraffic: 8
      },
      shooting: {
        wristShot: 8,
        slapShot: 7,
        snapshot: 9,
        backhand: 8,
        accuracy: 9,
        release: 9,
        power: 6
      },
      passing: {
        forehand: 9,
        backhand: 8,
        saucer: 8,
        accuracy: 9,
        timing: 9,
        vision: 10
      }
    } as TechnicalSkills,
    tacticalSkills: {
      offensive: {
        positioning: 9,
        spacing: 9,
        timing: 10,
        creativity: 10,
        finishing: 8
      },
      defensive: {
        positioning: 6,
        gapControl: 5,
        stickPosition: 6,
        bodyPosition: 6,
        anticipation: 7
      },
      transition: {
        breakouts: 9,
        rushes: 10,
        tracking: 6,
        backchecking: 5
      }
    } as TacticalSkills,
    physicalAttributes: {
      strength: 5,
      speed: 8,
      endurance: 7,
      flexibility: 9,
      balance: 9,
      coordination: 10
    } as PhysicalAttributes,
    mentalAttributes: {
      hockeyIQ: 10,
      competitiveness: 7,
      workEthic: 8,
      coachability: 9,
      leadership: 6,
      teamwork: 7,
      discipline: 6,
      confidence: 9,
      focusUnderPressure: 6
    } as MentalAttributes,
    strengths: 'Exceptional offensive skills and creativity. Outstanding puck handling and passing vision.',
    areasForImprovement: 'Needs significant work on defensive play. Must improve physical strength and compete level.',
    coachComments: 'Highly skilled offensive player but needs to commit to defensive responsibilities.',
    developmentPriorities: [
      {
        priority: 1,
        skill: 'Defensive commitment',
        targetImprovement: 'Improve effort and execution in defensive zone',
        timeline: '2 months'
      },
      {
        priority: 2,
        skill: 'Physical strength',
        targetImprovement: 'Build overall body strength',
        timeline: '6 months'
      },
      {
        priority: 3,
        skill: 'Competitiveness',
        targetImprovement: 'Increase battle level in all situations',
        timeline: '3 months'
      }
    ] as DevelopmentPriority[],
    overallRating: 78,
    potential: 'Elite'
  }
};

// Invalid player evaluation data
export const invalidPlayerEvaluationData = {
  missingRequired: {
    // Missing playerId, coachId, teamId, evaluationDate, type, technicalSkills, tacticalSkills, physicalAttributes, mentalAttributes, developmentPriorities
    overallRating: 75
  },

  invalidType: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    evaluationDate: new Date(),
    type: 'invalid_type' as any,
    technicalSkills: validPlayerEvaluationData.preseasonEvaluation.technicalSkills,
    tacticalSkills: validPlayerEvaluationData.preseasonEvaluation.tacticalSkills,
    physicalAttributes: validPlayerEvaluationData.preseasonEvaluation.physicalAttributes,
    mentalAttributes: validPlayerEvaluationData.preseasonEvaluation.mentalAttributes,
    developmentPriorities: []
  },

  invalidRatings: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    evaluationDate: new Date(),
    type: 'preseason' as EvaluationType,
    technicalSkills: {
      skating: {
        forward: 15, // Invalid rating > 10
        backward: -2, // Invalid negative rating
        acceleration: 8,
        agility: 8,
        speed: 8,
        balance: 8,
        edgeWork: 8
      },
      puckHandling: {
        carrying: 8,
        protection: 8,
        deking: 8,
        receiving: 8,
        inTraffic: 8
      },
      shooting: {
        wristShot: 8,
        slapShot: 8,
        snapshot: 8,
        backhand: 8,
        accuracy: 8,
        release: 8,
        power: 8
      },
      passing: {
        forehand: 8,
        backhand: 8,
        saucer: 8,
        accuracy: 8,
        timing: 8,
        vision: 8
      }
    } as any,
    tacticalSkills: validPlayerEvaluationData.preseasonEvaluation.tacticalSkills,
    physicalAttributes: validPlayerEvaluationData.preseasonEvaluation.physicalAttributes,
    mentalAttributes: validPlayerEvaluationData.preseasonEvaluation.mentalAttributes,
    developmentPriorities: []
  },

  invalidUUIDs: {
    playerId: 'not-a-uuid',
    coachId: 'also-not-a-uuid',
    teamId: 'definitely-not-a-uuid',
    evaluationDate: new Date(),
    type: 'preseason' as EvaluationType,
    technicalSkills: validPlayerEvaluationData.preseasonEvaluation.technicalSkills,
    tacticalSkills: validPlayerEvaluationData.preseasonEvaluation.tacticalSkills,
    physicalAttributes: validPlayerEvaluationData.preseasonEvaluation.physicalAttributes,
    mentalAttributes: validPlayerEvaluationData.preseasonEvaluation.mentalAttributes,
    developmentPriorities: []
  },

  malformedSkills: {
    playerId: '550e8400-e29b-41d4-a716-446655440010',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    evaluationDate: new Date(),
    type: 'preseason' as EvaluationType,
    technicalSkills: {
      skating: {
        // Missing required skating skills
        forward: 8
      }
    } as any,
    tacticalSkills: {
      // Missing required tactical categories
    } as any,
    physicalAttributes: {
      // Missing required physical attributes
      strength: 8
    } as any,
    mentalAttributes: {
      // Missing required mental attributes  
      hockeyIQ: 8
    } as any,
    developmentPriorities: []
  }
};

// Edge case data
export const edgeCasePlayerEvaluationData = {
  perfectPlayer: {
    playerId: '550e8400-e29b-41d4-a716-446655440020',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    evaluationDate: new Date('2024-12-01'),
    type: 'midseason' as EvaluationType,
    technicalSkills: {
      skating: {
        forward: 10,
        backward: 10,
        acceleration: 10,
        agility: 10,
        speed: 10,
        balance: 10,
        edgeWork: 10
      },
      puckHandling: {
        carrying: 10,
        protection: 10,
        deking: 10,
        receiving: 10,
        inTraffic: 10
      },
      shooting: {
        wristShot: 10,
        slapShot: 10,
        snapshot: 10,
        backhand: 10,
        accuracy: 10,
        release: 10,
        power: 10
      },
      passing: {
        forehand: 10,
        backhand: 10,
        saucer: 10,
        accuracy: 10,
        timing: 10,
        vision: 10
      }
    } as TechnicalSkills,
    tacticalSkills: {
      offensive: {
        positioning: 10,
        spacing: 10,
        timing: 10,
        creativity: 10,
        finishing: 10
      },
      defensive: {
        positioning: 10,
        gapControl: 10,
        stickPosition: 10,
        bodyPosition: 10,
        anticipation: 10
      },
      transition: {
        breakouts: 10,
        rushes: 10,
        tracking: 10,
        backchecking: 10
      }
    } as TacticalSkills,
    physicalAttributes: {
      strength: 10,
      speed: 10,
      endurance: 10,
      flexibility: 10,
      balance: 10,
      coordination: 10
    } as PhysicalAttributes,
    mentalAttributes: {
      hockeyIQ: 10,
      competitiveness: 10,
      workEthic: 10,
      coachability: 10,
      leadership: 10,
      teamwork: 10,
      discipline: 10,
      confidence: 10,
      focusUnderPressure: 10
    } as MentalAttributes,
    strengths: 'Exceptional in all areas. Elite-level skills across all categories.',
    areasForImprovement: 'Continue to maintain and refine all skills. Focus on leadership development.',
    coachComments: 'Outstanding player with professional potential. Natural leader and exceptional talent.',
    developmentPriorities: [
      {
        priority: 1,
        skill: 'Leadership development',
        targetImprovement: 'Mentor younger players and lead by example',
        timeline: '3 months'
      },
      {
        priority: 2,
        skill: 'Mental preparation',
        targetImprovement: 'Develop pre-game and pressure situation routines',
        timeline: '2 months'
      }
    ] as DevelopmentPriority[],
    overallRating: 100,
    potential: 'Elite'
  },

  needsWorkPlayer: {
    playerId: '550e8400-e29b-41d4-a716-446655440021',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    evaluationDate: new Date('2024-10-01'),
    type: 'monthly' as EvaluationType,
    technicalSkills: {
      skating: {
        forward: 3,
        backward: 2,
        acceleration: 4,
        agility: 3,
        speed: 4,
        balance: 3,
        edgeWork: 2
      },
      puckHandling: {
        carrying: 4,
        protection: 3,
        deking: 2,
        receiving: 4,
        inTraffic: 3
      },
      shooting: {
        wristShot: 4,
        slapShot: 3,
        snapshot: 3,
        backhand: 2,
        accuracy: 3,
        release: 4,
        power: 3
      },
      passing: {
        forehand: 4,
        backhand: 3,
        saucer: 2,
        accuracy: 3,
        timing: 4,
        vision: 5
      }
    } as TechnicalSkills,
    tacticalSkills: {
      offensive: {
        positioning: 4,
        spacing: 3,
        timing: 4,
        creativity: 3,
        finishing: 3
      },
      defensive: {
        positioning: 5,
        gapControl: 4,
        stickPosition: 5,
        bodyPosition: 4,
        anticipation: 5
      },
      transition: {
        breakouts: 3,
        rushes: 3,
        tracking: 6,
        backchecking: 7
      }
    } as TacticalSkills,
    physicalAttributes: {
      strength: 4,
      speed: 4,
      endurance: 6,
      flexibility: 5,
      balance: 4,
      coordination: 4
    } as PhysicalAttributes,
    mentalAttributes: {
      hockeyIQ: 6,
      competitiveness: 8,
      workEthic: 9,
      coachability: 9,
      leadership: 4,
      teamwork: 8,
      discipline: 7,
      confidence: 5,
      focusUnderPressure: 4
    } as MentalAttributes,
    strengths: 'Excellent work ethic and coachability. Strong competitive drive and team-first attitude.',
    areasForImprovement: 'Significant work needed on all technical skills, especially skating and puck handling.',
    coachComments: 'Player has the right attitude and work ethic to improve. Focus on fundamental skill development.',
    developmentPriorities: [
      {
        priority: 1,
        skill: 'Basic skating',
        targetImprovement: 'Improve forward skating technique and balance',
        timeline: '6 months'
      },
      {
        priority: 2,
        skill: 'Puck handling fundamentals',
        targetImprovement: 'Develop basic puck control and protection',
        timeline: '4 months'
      },
      {
        priority: 3,
        skill: 'Passing accuracy',
        targetImprovement: 'Improve basic forehand passing accuracy',
        timeline: '3 months'
      },
      {
        priority: 4,
        skill: 'Confidence building',
        targetImprovement: 'Build confidence through skill improvement',
        timeline: '8 months'
      }
    ] as DevelopmentPriority[],
    overallRating: 42,
    potential: 'Average'
  },

  comprehensiveGameEval: {
    playerId: '550e8400-e29b-41d4-a716-446655440022',
    coachId: '550e8400-e29b-41d4-a716-446655440001',
    teamId: '550e8400-e29b-41d4-a716-446655440002',
    evaluationDate: new Date('2024-11-20'),
    type: 'game' as EvaluationType,
    technicalSkills: {
      skating: {
        forward: 7,
        backward: 6,
        acceleration: 8,
        agility: 7,
        speed: 8,
        balance: 7,
        edgeWork: 6
      },
      puckHandling: {
        carrying: 8,
        protection: 7,
        deking: 7,
        receiving: 8,
        inTraffic: 6
      },
      shooting: {
        wristShot: 6,
        slapShot: 5,
        snapshot: 7,
        backhand: 4,
        accuracy: 6,
        release: 7,
        power: 5
      },
      passing: {
        forehand: 8,
        backhand: 5,
        saucer: 6,
        accuracy: 7,
        timing: 8,
        vision: 9
      }
    } as TechnicalSkills,
    tacticalSkills: {
      offensive: {
        positioning: 8,
        spacing: 7,
        timing: 8,
        creativity: 7,
        finishing: 6
      },
      defensive: {
        positioning: 7,
        gapControl: 6,
        stickPosition: 7,
        bodyPosition: 6,
        anticipation: 8
      },
      transition: {
        breakouts: 8,
        rushes: 7,
        tracking: 7,
        backchecking: 6
      }
    } as TacticalSkills,
    physicalAttributes: {
      strength: 6,
      speed: 8,
      endurance: 7,
      flexibility: 7,
      balance: 7,
      coordination: 8
    } as PhysicalAttributes,
    mentalAttributes: {
      hockeyIQ: 9,
      competitiveness: 7,
      workEthic: 8,
      coachability: 9,
      leadership: 6,
      teamwork: 8,
      discipline: 7,
      confidence: 7,
      focusUnderPressure: 6
    } as MentalAttributes,
    gameSpecificNotes: {
      gamesObserved: 8,
      goals: 3,
      assists: 7,
      plusMinus: 4,
      penaltyMinutes: 4,
      keyMoments: [
        'Excellent setup pass for game-winning goal',
        'Great defensive read to break up odd-man rush',
        'Took undisciplined penalty in third period',
        'Strong puck protection led to scoring chance',
        'Poor decision with puck in defensive zone led to turnover',
        'Showed good leadership talking to younger players',
        'Excellent vision on power play to find open teammate',
        'Need to improve shot selection - passing up good opportunities'
      ]
    } as GameSpecificNotes,
    strengths: 'Exceptional vision and passing ability. Strong hockey IQ and decision-making in most situations.',
    areasForImprovement: 'Needs to shoot more and improve shot accuracy. Must work on discipline and penalty avoidance.',
    coachComments: 'Very intelligent player who sees the ice well. Needs to be more selfish with scoring opportunities.',
    developmentPriorities: [
      {
        priority: 1,
        skill: 'Shooting confidence',
        targetImprovement: 'Take more shots and improve shooting accuracy',
        timeline: '3 months'
      },
      {
        priority: 2,
        skill: 'Discipline',
        targetImprovement: 'Reduce penalty minutes and poor decisions under pressure',
        timeline: '2 months'
      },
      {
        priority: 3,
        skill: 'Physical strength',
        targetImprovement: 'Build core strength for better puck battles',
        timeline: '5 months'
      }
    ] as DevelopmentPriority[],
    overallRating: 71,
    potential: 'High'
  }
};

// Bulk data for performance testing
export const bulkPlayerEvaluationData = Array.from({ length: 75 }, (_, index) => ({
  playerId: `550e8400-e29b-41d4-a716-446655441${index.toString().padStart(3, '0')}`,
  coachId: `550e8400-e29b-41d4-a716-446655440${(index % 10).toString().padStart(3, '0')}`,
  teamId: `550e8400-e29b-41d4-a716-446655442${(index % 5).toString().padStart(3, '0')}`,
  evaluationDate: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000),
  type: (['preseason', 'midseason', 'postseason', 'monthly', 'game', 'practice'] as EvaluationType[])[index % 6],
  technicalSkills: {
    skating: {
      forward: Math.floor(Math.random() * 6) + 5,
      backward: Math.floor(Math.random() * 6) + 4,
      acceleration: Math.floor(Math.random() * 6) + 5,
      agility: Math.floor(Math.random() * 6) + 5,
      speed: Math.floor(Math.random() * 6) + 5,
      balance: Math.floor(Math.random() * 6) + 5,
      edgeWork: Math.floor(Math.random() * 6) + 4
    },
    puckHandling: {
      carrying: Math.floor(Math.random() * 6) + 5,
      protection: Math.floor(Math.random() * 6) + 5,
      deking: Math.floor(Math.random() * 6) + 4,
      receiving: Math.floor(Math.random() * 6) + 5,
      inTraffic: Math.floor(Math.random() * 6) + 4
    },
    shooting: {
      wristShot: Math.floor(Math.random() * 6) + 5,
      slapShot: Math.floor(Math.random() * 6) + 4,
      snapshot: Math.floor(Math.random() * 6) + 5,
      backhand: Math.floor(Math.random() * 6) + 3,
      accuracy: Math.floor(Math.random() * 6) + 4,
      release: Math.floor(Math.random() * 6) + 5,
      power: Math.floor(Math.random() * 6) + 4
    },
    passing: {
      forehand: Math.floor(Math.random() * 6) + 5,
      backhand: Math.floor(Math.random() * 6) + 4,
      saucer: Math.floor(Math.random() * 6) + 4,
      accuracy: Math.floor(Math.random() * 6) + 5,
      timing: Math.floor(Math.random() * 6) + 5,
      vision: Math.floor(Math.random() * 6) + 5
    }
  } as TechnicalSkills,
  tacticalSkills: {
    offensive: {
      positioning: Math.floor(Math.random() * 6) + 5,
      spacing: Math.floor(Math.random() * 6) + 4,
      timing: Math.floor(Math.random() * 6) + 5,
      creativity: Math.floor(Math.random() * 6) + 4,
      finishing: Math.floor(Math.random() * 6) + 5
    },
    defensive: {
      positioning: Math.floor(Math.random() * 6) + 4,
      gapControl: Math.floor(Math.random() * 6) + 4,
      stickPosition: Math.floor(Math.random() * 6) + 5,
      bodyPosition: Math.floor(Math.random() * 6) + 4,
      anticipation: Math.floor(Math.random() * 6) + 5
    },
    transition: {
      breakouts: Math.floor(Math.random() * 6) + 5,
      rushes: Math.floor(Math.random() * 6) + 5,
      tracking: Math.floor(Math.random() * 6) + 4,
      backchecking: Math.floor(Math.random() * 6) + 4
    }
  } as TacticalSkills,
  physicalAttributes: {
    strength: Math.floor(Math.random() * 6) + 4,
    speed: Math.floor(Math.random() * 6) + 5,
    endurance: Math.floor(Math.random() * 6) + 5,
    flexibility: Math.floor(Math.random() * 6) + 5,
    balance: Math.floor(Math.random() * 6) + 5,
    coordination: Math.floor(Math.random() * 6) + 5
  } as PhysicalAttributes,
  mentalAttributes: {
    hockeyIQ: Math.floor(Math.random() * 6) + 5,
    competitiveness: Math.floor(Math.random() * 6) + 6,
    workEthic: Math.floor(Math.random() * 5) + 6,
    coachability: Math.floor(Math.random() * 5) + 6,
    leadership: Math.floor(Math.random() * 8) + 3,
    teamwork: Math.floor(Math.random() * 6) + 5,
    discipline: Math.floor(Math.random() * 6) + 5,
    confidence: Math.floor(Math.random() * 6) + 4,
    focusUnderPressure: Math.floor(Math.random() * 6) + 4
  } as MentalAttributes,
  strengths: `Bulk evaluation strengths for player ${index + 1}`,
  areasForImprovement: `Areas for improvement for player ${index + 1}`,
  coachComments: `Coach comments for bulk evaluation ${index + 1}`,
  developmentPriorities: [
    {
      priority: 1,
      skill: `Priority skill ${index % 3 + 1}`,
      targetImprovement: `Improvement target ${index + 1}`,
      timeline: `${Math.floor(Math.random() * 6) + 2} months`
    }
  ] as DevelopmentPriority[],
  overallRating: Math.floor(Math.random() * 40) + 50, // 50-90
  potential: (['Elite', 'High', 'Average', 'Depth'][index % 4]) as any
}));

// Export all fixtures
export const playerEvaluationFixtures = {
  valid: validPlayerEvaluationData,
  invalid: invalidPlayerEvaluationData,
  edgeCase: edgeCasePlayerEvaluationData,
  bulk: bulkPlayerEvaluationData
};