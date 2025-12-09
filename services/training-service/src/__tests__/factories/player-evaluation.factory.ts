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

// Utility functions for random data generation
const getRandomUUID = (prefix: string = '550e8400-e29b-41d4-a716') => 
  `${prefix}-${Math.random().toString(36).substr(2, 12)}`;

const getRandomEnum = <T>(enumObject: T): T[keyof T] => {
  const values = Object.values(enumObject as any);
  return values[Math.floor(Math.random() * values.length)];
};

const getRandomFromArray = <T>(array: T[]): T => 
  array[Math.floor(Math.random() * array.length)];

const generateRandomRating = (min: number = 1, max: number = 10): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const generateTechnicalSkills = (): TechnicalSkills => ({
  skating: {
    forward: generateRandomRating(4, 10),
    backward: generateRandomRating(3, 9),
    acceleration: generateRandomRating(4, 10),
    agility: generateRandomRating(4, 9),
    speed: generateRandomRating(4, 10),
    balance: generateRandomRating(4, 9),
    edgeWork: generateRandomRating(3, 9)
  },
  puckHandling: {
    carrying: generateRandomRating(4, 9),
    protection: generateRandomRating(4, 9),
    deking: generateRandomRating(3, 9),
    receiving: generateRandomRating(4, 9),
    inTraffic: generateRandomRating(3, 9)
  },
  shooting: {
    wristShot: generateRandomRating(4, 10),
    slapShot: generateRandomRating(3, 9),
    snapshot: generateRandomRating(4, 9),
    backhand: generateRandomRating(2, 8),
    accuracy: generateRandomRating(3, 9),
    release: generateRandomRating(4, 9),
    power: generateRandomRating(3, 9)
  },
  passing: {
    forehand: generateRandomRating(4, 9),
    backhand: generateRandomRating(3, 8),
    saucer: generateRandomRating(3, 8),
    accuracy: generateRandomRating(4, 9),
    timing: generateRandomRating(4, 9),
    vision: generateRandomRating(4, 10)
  }
});

const generateTacticalSkills = (): TacticalSkills => ({
  offensive: {
    positioning: generateRandomRating(4, 9),
    spacing: generateRandomRating(4, 9),
    timing: generateRandomRating(4, 9),
    creativity: generateRandomRating(3, 9),
    finishing: generateRandomRating(4, 9)
  },
  defensive: {
    positioning: generateRandomRating(3, 9),
    gapControl: generateRandomRating(3, 9),
    stickPosition: generateRandomRating(4, 9),
    bodyPosition: generateRandomRating(4, 9),
    anticipation: generateRandomRating(4, 9)
  },
  transition: {
    breakouts: generateRandomRating(4, 9),
    rushes: generateRandomRating(4, 9),
    tracking: generateRandomRating(4, 9),
    backchecking: generateRandomRating(3, 9)
  }
});

const generatePhysicalAttributes = (): PhysicalAttributes => ({
  strength: generateRandomRating(3, 9),
  speed: generateRandomRating(4, 10),
  endurance: generateRandomRating(4, 9),
  flexibility: generateRandomRating(4, 9),
  balance: generateRandomRating(4, 9),
  coordination: generateRandomRating(4, 10)
});

const generateMentalAttributes = (): MentalAttributes => ({
  hockeyIQ: generateRandomRating(4, 10),
  competitiveness: generateRandomRating(5, 10),
  workEthic: generateRandomRating(5, 10),
  coachability: generateRandomRating(5, 10),
  leadership: generateRandomRating(3, 9),
  teamwork: generateRandomRating(5, 10),
  discipline: generateRandomRating(4, 10),
  confidence: generateRandomRating(4, 9),
  focusUnderPressure: generateRandomRating(3, 9)
});

const generateGameSpecificNotes = (): GameSpecificNotes => ({
  gamesObserved: Math.floor(Math.random() * 8) + 1,
  goals: Math.floor(Math.random() * 6),
  assists: Math.floor(Math.random() * 8),
  plusMinus: Math.floor(Math.random() * 11) - 5,
  penaltyMinutes: Math.floor(Math.random() * 8),
  keyMoments: Array.from(
    { length: Math.floor(Math.random() * 4) + 1 },
    (_, i) => `Key moment ${i + 1} during game observation`
  )
});

const generateDevelopmentPriorities = (): DevelopmentPriority[] =>
  Array.from(
    { length: Math.floor(Math.random() * 3) + 2 },
    (_, i) => ({
      priority: i + 1,
      skill: getRandomFromArray([
        'Shooting accuracy', 'Skating speed', 'Defensive positioning',
        'Puck handling', 'Physical strength', 'Decision making',
        'Leadership', 'Confidence', 'Consistency'
      ]),
      targetImprovement: `Improvement target for priority ${i + 1}`,
      timeline: `${Math.floor(Math.random() * 4) + 2} months`
    })
  );

// Factory interface
export interface PlayerEvaluationFactoryOptions {
  playerId?: string;
  coachId?: string;
  teamId?: string;
  evaluationDate?: Date;
  type?: EvaluationType;
  technicalSkills?: TechnicalSkills;
  tacticalSkills?: TacticalSkills;
  physicalAttributes?: PhysicalAttributes;
  mentalAttributes?: MentalAttributes;
  strengths?: string;
  areasForImprovement?: string;
  coachComments?: string;
  gameSpecificNotes?: GameSpecificNotes;
  developmentPriorities?: DevelopmentPriority[];
  overallRating?: number;
  potential?: string;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Base factory class
export class PlayerEvaluationFactory {
  private static defaultOptions: Partial<PlayerEvaluationFactoryOptions> = {};

  /**
   * Create a single player evaluation with optional overrides
   */
  static create(overrides: Partial<PlayerEvaluationFactoryOptions> = {}): PlayerEvaluation {
    const evaluation = new PlayerEvaluation();
    
    // Generate base data
    const technicalSkills = generateTechnicalSkills();
    const tacticalSkills = generateTacticalSkills();
    const physicalAttributes = generatePhysicalAttributes();
    const mentalAttributes = generateMentalAttributes();
    
    // Calculate overall rating based on skills
    const avgTechnical = Object.values(technicalSkills).reduce((acc, category) => {
      const categoryAvg = Object.values(category).reduce((sum, val) => sum + val, 0) / Object.values(category).length;
      return acc + categoryAvg;
    }, 0) / 4;
    
    const avgTactical = Object.values(tacticalSkills).reduce((acc, category) => {
      const categoryAvg = Object.values(category).reduce((sum, val) => sum + val, 0) / Object.values(category).length;
      return acc + categoryAvg;
    }, 0) / 3;
    
    const avgPhysical = Object.values(physicalAttributes).reduce((sum, val) => sum + val, 0) / Object.values(physicalAttributes).length;
    const avgMental = Object.values(mentalAttributes).reduce((sum, val) => sum + val, 0) / Object.values(mentalAttributes).length;
    
    const calculatedRating = Math.round((avgTechnical + avgTactical + avgPhysical + avgMental) / 4 * 10);

    const baseData = {
      id: getRandomUUID(),
      playerId: getRandomUUID(),
      coachId: getRandomUUID(),
      teamId: getRandomUUID(),
      evaluationDate: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000),
      type: getRandomFromArray(['preseason', 'midseason', 'postseason', 'monthly', 'game', 'practice'] as EvaluationType[]),
      technicalSkills,
      tacticalSkills,
      physicalAttributes,
      mentalAttributes,
      strengths: `Player strengths based on evaluation ${Math.floor(Math.random() * 1000)}`,
      areasForImprovement: `Areas for improvement identified in evaluation ${Math.floor(Math.random() * 1000)}`,
      coachComments: `Coach comments for evaluation ${Math.floor(Math.random() * 1000)}`,
      developmentPriorities: generateDevelopmentPriorities(),
      overallRating: calculatedRating,
      potential: getRandomFromArray(['Elite', 'High', 'Average', 'Depth']),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...this.defaultOptions,
      ...overrides
    };

    // Add game-specific notes for game evaluations
    if (baseData.type === 'game') {
      baseData['gameSpecificNotes'] = generateGameSpecificNotes();
    }

    // Assign all properties to the entity
    Object.assign(evaluation, baseData);

    return evaluation;
  }

  /**
   * Create multiple player evaluations
   */
  static createMany(count: number, overrides: Partial<PlayerEvaluationFactoryOptions> = {}): PlayerEvaluation[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create evaluation for specific player
   */
  static createForPlayer(playerId: string, overrides: Partial<PlayerEvaluationFactoryOptions> = {}): PlayerEvaluation {
    return this.create({ playerId, ...overrides });
  }

  /**
   * Create evaluation by specific coach
   */
  static createByCoach(coachId: string, overrides: Partial<PlayerEvaluationFactoryOptions> = {}): PlayerEvaluation {
    return this.create({ coachId, ...overrides });
  }

  /**
   * Create evaluation for specific team
   */
  static createForTeam(teamId: string, overrides: Partial<PlayerEvaluationFactoryOptions> = {}): PlayerEvaluation {
    return this.create({ teamId, ...overrides });
  }

  /**
   * Create evaluation of specific type
   */
  static createOfType(type: EvaluationType, overrides: Partial<PlayerEvaluationFactoryOptions> = {}): PlayerEvaluation {
    const evaluation = this.create({ type, ...overrides });
    
    // Add game-specific notes for game evaluations
    if (type === 'game' && !overrides.gameSpecificNotes) {
      Object.assign(evaluation, { gameSpecificNotes: generateGameSpecificNotes() });
    }
    
    return evaluation;
  }

  /**
   * Create preseason evaluation
   */
  static createPreseasonEvaluation(overrides: Partial<PlayerEvaluationFactoryOptions> = {}): PlayerEvaluation {
    return this.create({
      type: 'preseason',
      evaluationDate: new Date(new Date().getFullYear(), 8, Math.floor(Math.random() * 30) + 1), // September
      coachComments: 'Preseason baseline evaluation to establish development goals',
      ...overrides
    });
  }

  /**
   * Create game evaluation
   */
  static createGameEvaluation(overrides: Partial<PlayerEvaluationFactoryOptions> = {}): PlayerEvaluation {
    return this.create({
      type: 'game',
      gameSpecificNotes: generateGameSpecificNotes(),
      coachComments: 'Game-based evaluation focusing on in-game performance',
      ...overrides
    });
  }

  /**
   * Create practice evaluation
   */
  static createPracticeEvaluation(overrides: Partial<PlayerEvaluationFactoryOptions> = {}): PlayerEvaluation {
    return this.create({
      type: 'practice',
      coachComments: 'Practice evaluation focusing on skill development and effort',
      ...overrides
    });
  }

  /**
   * Create high-potential evaluation
   */
  static createHighPotentialEvaluation(overrides: Partial<PlayerEvaluationFactoryOptions> = {}): PlayerEvaluation {
    const highSkills: TechnicalSkills = {
      skating: {
        forward: generateRandomRating(7, 10),
        backward: generateRandomRating(6, 9),
        acceleration: generateRandomRating(7, 10),
        agility: generateRandomRating(7, 10),
        speed: generateRandomRating(7, 10),
        balance: generateRandomRating(7, 9),
        edgeWork: generateRandomRating(6, 9)
      },
      puckHandling: {
        carrying: generateRandomRating(7, 10),
        protection: generateRandomRating(6, 9),
        deking: generateRandomRating(7, 10),
        receiving: generateRandomRating(7, 9),
        inTraffic: generateRandomRating(6, 9)
      },
      shooting: {
        wristShot: generateRandomRating(7, 10),
        slapShot: generateRandomRating(6, 9),
        snapshot: generateRandomRating(7, 10),
        backhand: generateRandomRating(5, 8),
        accuracy: generateRandomRating(7, 10),
        release: generateRandomRating(7, 10),
        power: generateRandomRating(6, 9)
      },
      passing: {
        forehand: generateRandomRating(7, 10),
        backhand: generateRandomRating(6, 9),
        saucer: generateRandomRating(6, 9),
        accuracy: generateRandomRating(7, 10),
        timing: generateRandomRating(8, 10),
        vision: generateRandomRating(8, 10)
      }
    };

    return this.create({
      technicalSkills: highSkills,
      overallRating: generateRandomRating(80, 95),
      potential: 'Elite',
      strengths: 'Exceptional skating and offensive skills. Outstanding hockey IQ and vision.',
      coachComments: 'Elite potential player with exceptional natural abilities and high hockey IQ.',
      ...overrides
    });
  }

  /**
   * Create development player evaluation
   */
  static createDevelopmentEvaluation(overrides: Partial<PlayerEvaluationFactoryOptions> = {}): PlayerEvaluation {
    const developmentSkills: TechnicalSkills = {
      skating: {
        forward: generateRandomRating(3, 6),
        backward: generateRandomRating(2, 5),
        acceleration: generateRandomRating(3, 6),
        agility: generateRandomRating(3, 6),
        speed: generateRandomRating(3, 6),
        balance: generateRandomRating(3, 6),
        edgeWork: generateRandomRating(2, 5)
      },
      puckHandling: {
        carrying: generateRandomRating(3, 6),
        protection: generateRandomRating(3, 6),
        deking: generateRandomRating(2, 5),
        receiving: generateRandomRating(4, 7),
        inTraffic: generateRandomRating(2, 5)
      },
      shooting: {
        wristShot: generateRandomRating(3, 6),
        slapShot: generateRandomRating(2, 5),
        snapshot: generateRandomRating(3, 6),
        backhand: generateRandomRating(1, 4),
        accuracy: generateRandomRating(2, 5),
        release: generateRandomRating(3, 6),
        power: generateRandomRating(2, 5)
      },
      passing: {
        forehand: generateRandomRating(4, 7),
        backhand: generateRandomRating(2, 5),
        saucer: generateRandomRating(2, 5),
        accuracy: generateRandomRating(3, 6),
        timing: generateRandomRating(4, 7),
        vision: generateRandomRating(4, 7)
      }
    };

    return this.create({
      technicalSkills: developmentSkills,
      overallRating: generateRandomRating(40, 65),
      potential: 'Average',
      strengths: 'Good attitude and work ethic. Coachable player with room for growth.',
      areasForImprovement: 'All technical skills need significant development. Focus on fundamentals.',
      coachComments: 'Developing player with the right attitude to improve. Needs consistent work on fundamentals.',
      developmentPriorities: [
        {
          priority: 1,
          skill: 'Basic skating fundamentals',
          targetImprovement: 'Improve balance and basic skating technique',
          timeline: '6 months'
        },
        {
          priority: 2,
          skill: 'Puck handling basics',
          targetImprovement: 'Develop basic puck control skills',
          timeline: '4 months'
        },
        {
          priority: 3,
          skill: 'Shooting technique',
          targetImprovement: 'Learn proper shooting fundamentals',
          timeline: '5 months'
        }
      ],
      ...overrides
    });
  }

  /**
   * Create monthly progress evaluation
   */
  static createMonthlyEvaluation(overrides: Partial<PlayerEvaluationFactoryOptions> = {}): PlayerEvaluation {
    return this.create({
      type: 'monthly',
      evaluationDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      coachComments: 'Monthly progress evaluation to track development and adjust training focus.',
      ...overrides
    });
  }

  /**
   * Create evaluation series for player progression
   */
  static createProgressionSeries(
    playerId: string, 
    coachId: string, 
    teamId: string, 
    months: number = 6
  ): PlayerEvaluation[] {
    const evaluations: PlayerEvaluation[] = [];
    const baseSkills = generateTechnicalSkills();
    
    for (let i = 0; i < months; i++) {
      // Gradually improve skills over time
      const improvedSkills: TechnicalSkills = {
        skating: {
          forward: Math.min(10, baseSkills.skating.forward + Math.floor(i * 0.3)),
          backward: Math.min(10, baseSkills.skating.backward + Math.floor(i * 0.2)),
          acceleration: Math.min(10, baseSkills.skating.acceleration + Math.floor(i * 0.3)),
          agility: Math.min(10, baseSkills.skating.agility + Math.floor(i * 0.2)),
          speed: Math.min(10, baseSkills.skating.speed + Math.floor(i * 0.2)),
          balance: Math.min(10, baseSkills.skating.balance + Math.floor(i * 0.2)),
          edgeWork: Math.min(10, baseSkills.skating.edgeWork + Math.floor(i * 0.2))
        },
        puckHandling: {
          carrying: Math.min(10, baseSkills.puckHandling.carrying + Math.floor(i * 0.2)),
          protection: Math.min(10, baseSkills.puckHandling.protection + Math.floor(i * 0.2)),
          deking: Math.min(10, baseSkills.puckHandling.deking + Math.floor(i * 0.3)),
          receiving: Math.min(10, baseSkills.puckHandling.receiving + Math.floor(i * 0.2)),
          inTraffic: Math.min(10, baseSkills.puckHandling.inTraffic + Math.floor(i * 0.3))
        },
        shooting: {
          wristShot: Math.min(10, baseSkills.shooting.wristShot + Math.floor(i * 0.4)),
          slapShot: Math.min(10, baseSkills.shooting.slapShot + Math.floor(i * 0.3)),
          snapshot: Math.min(10, baseSkills.shooting.snapshot + Math.floor(i * 0.3)),
          backhand: Math.min(10, baseSkills.shooting.backhand + Math.floor(i * 0.4)),
          accuracy: Math.min(10, baseSkills.shooting.accuracy + Math.floor(i * 0.4)),
          release: Math.min(10, baseSkills.shooting.release + Math.floor(i * 0.3)),
          power: Math.min(10, baseSkills.shooting.power + Math.floor(i * 0.2))
        },
        passing: {
          forehand: Math.min(10, baseSkills.passing.forehand + Math.floor(i * 0.2)),
          backhand: Math.min(10, baseSkills.passing.backhand + Math.floor(i * 0.3)),
          saucer: Math.min(10, baseSkills.passing.saucer + Math.floor(i * 0.3)),
          accuracy: Math.min(10, baseSkills.passing.accuracy + Math.floor(i * 0.3)),
          timing: Math.min(10, baseSkills.passing.timing + Math.floor(i * 0.2)),
          vision: Math.min(10, baseSkills.passing.vision + Math.floor(i * 0.1))
        }
      };

      evaluations.push(this.create({
        playerId,
        coachId,
        teamId,
        technicalSkills: improvedSkills,
        evaluationDate: new Date(Date.now() - (months - i - 1) * 30 * 24 * 60 * 60 * 1000),
        type: 'monthly',
        coachComments: `Month ${i + 1} evaluation showing ${i === 0 ? 'baseline' : 'continued progress'}.`
      }));
    }

    return evaluations;
  }

  /**
   * Create relationship-aware evaluations for testing relationships
   */
  static createRelationshipSet(baseId: string): {
    player: PlayerEvaluation[];
    coach: PlayerEvaluation[];
    team: PlayerEvaluation[];
  } {
    const playerId = `${baseId}-player`;
    const coachId = `${baseId}-coach`;
    const teamId = `${baseId}-team`;

    return {
      player: this.createMany(4, { playerId }),
      coach: this.createMany(6, { coachId }),
      team: this.createMany(5, { teamId })
    };
  }

  /**
   * Create invalid evaluation for testing validation
   */
  static createInvalid(): Partial<PlayerEvaluation> {
    return {
      // Missing required fields intentionally
      strengths: 'Invalid evaluation for testing'
    };
  }

  /**
   * Set default options for all created evaluations
   */
  static setDefaults(defaults: Partial<PlayerEvaluationFactoryOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...defaults };
  }

  /**
   * Reset default options
   */
  static resetDefaults(): void {
    this.defaultOptions = {};
  }
}

// Helper functions for specific use cases
export const createPlayerEvaluationForTesting = (testName: string): PlayerEvaluation => {
  return PlayerEvaluationFactory.create({
    coachComments: `Player evaluation created for testing: ${testName}`
  });
};

export const createPlayerEvaluationBatch = (
  playerId: string,
  coachId: string,
  teamId: string,
  count: number = 5
): PlayerEvaluation[] => {
  return PlayerEvaluationFactory.createMany(count, {
    playerId,
    coachId,
    teamId
  });
};