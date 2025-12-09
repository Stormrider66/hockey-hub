import { 
  PracticePlan, 
  PracticeStatus, 
  PracticeFocus 
} from '../../entities/PracticePlan';

// Utility functions for random data generation
const getRandomUUID = (prefix: string = '550e8400-e29b-41d4-a716') => 
  `${prefix}-${Math.random().toString(36).substr(2, 12)}`;

const getRandomEnum = <T>(enumObject: T): T[keyof T] => {
  const values = Object.values(enumObject as any);
  return values[Math.floor(Math.random() * values.length)];
};

const getRandomFromArray = <T>(array: T[]): T => 
  array[Math.floor(Math.random() * array.length)];

const generateRandomSection = (index: number) => ({
  id: `section-${index + 1}`,
  name: getRandomFromArray([
    'Warm-up', 'Skills Work', 'Tactical Drills', 'Scrimmage', 'Conditioning', 
    'Power Play', 'Penalty Kill', 'Shooting', 'Passing', 'Cool-down'
  ]),
  duration: Math.floor(Math.random() * 30) + 5, // 5-35 minutes
  drillIds: Array.from(
    { length: Math.floor(Math.random() * 4) + 1 },
    (_, i) => `drill-${index}-${i + 1}`
  ),
  notes: Math.random() > 0.5 ? `Notes for section ${index + 1}` : undefined,
  equipment: Math.random() > 0.6 ? getRandomFromArray([
    ['pucks', 'cones'],
    ['nets', 'pucks'],
    ['pinnies', 'cones', 'pucks'],
    ['cones']
  ]) : undefined
});

const generateRandomLineups = () => ({
  forward1: Array.from({ length: 3 }, (_, i) => `f1-player-${i + 1}`),
  forward2: Array.from({ length: 3 }, (_, i) => `f2-player-${i + 1}`),
  forward3: Array.from({ length: 3 }, (_, i) => `f3-player-${i + 1}`),
  forward4: Array.from({ length: 3 }, (_, i) => `f4-player-${i + 1}`),
  defense1: Array.from({ length: 2 }, (_, i) => `d1-player-${i + 1}`),
  defense2: Array.from({ length: 2 }, (_, i) => `d2-player-${i + 1}`),
  defense3: Array.from({ length: 2 }, (_, i) => `d3-player-${i + 1}`),
  goalies: Array.from({ length: 2 }, (_, i) => `goalie-${i + 1}`),
  scratched: Math.random() > 0.7 ? [`scratched-1`] : []
});

const generateRandomAttendance = (playerCount: number = 20) => 
  Array.from({ length: playerCount }, (_, i) => ({
    playerId: `attendance-player-${i + 1}`,
    present: Math.random() > 0.15, // 85% attendance rate
    reason: Math.random() > 0.8 ? getRandomFromArray(['injury', 'illness', 'personal', 'school']) : undefined
  }));

const generateRandomPlayerEvaluations = (playerCount: number = 15) =>
  Array.from({ length: playerCount }, (_, i) => ({
    playerId: `eval-player-${i + 1}`,
    rating: Math.floor(Math.random() * 5) + 6, // Rating 6-10
    notes: `Evaluation notes for player ${i + 1}`,
    areasOfImprovement: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 },
      (_, j) => `Improvement area ${j + 1}`
    )
  }));

// Factory interface
export interface PracticePlanFactoryOptions {
  title?: string;
  description?: string;
  organizationId?: string;
  teamId?: string;
  coachId?: string;
  trainingPlanId?: string;
  date?: Date;
  duration?: number;
  status?: PracticeStatus;
  primaryFocus?: PracticeFocus;
  secondaryFocus?: PracticeFocus[];
  location?: string;
  rinkId?: string;
  sections?: Array<{
    id: string;
    name: string;
    duration: number;
    drillIds: string[];
    notes?: string;
    equipment?: string[];
  }>;
  objectives?: string[];
  equipment?: string[];
  lineups?: any;
  notes?: string;
  coachFeedback?: string;
  attendance?: Array<{
    playerId: string;
    present: boolean;
    reason?: string;
  }>;
  playerEvaluations?: Array<{
    playerId: string;
    rating: number;
    notes?: string;
    areasOfImprovement?: string[];
  }>;
  metadata?: Record<string, any>;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Base factory class
export class PracticePlanFactory {
  private static defaultOptions: Partial<PracticePlanFactoryOptions> = {
    status: PracticeStatus.PLANNED,
    primaryFocus: PracticeFocus.SKILLS
  };

  /**
   * Create a single practice plan with optional overrides
   */
  static create(overrides: Partial<PracticePlanFactoryOptions> = {}): PracticePlan {
    const plan = new PracticePlan();
    
    // Generate base data
    const sectionCount = Math.floor(Math.random() * 4) + 2; // 2-5 sections
    const baseData = {
      id: getRandomUUID(),
      title: `Practice Plan ${Math.floor(Math.random() * 1000)}`,
      description: Math.random() > 0.5 ? `Practice description ${Math.floor(Math.random() * 1000)}` : undefined,
      organizationId: getRandomUUID(),
      teamId: getRandomUUID(),
      coachId: getRandomUUID(),
      date: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Next 30 days
      duration: Math.floor(Math.random() * 60) + 60, // 60-120 minutes
      status: getRandomEnum(PracticeStatus),
      primaryFocus: getRandomEnum(PracticeFocus),
      location: getRandomFromArray(['Main Arena', 'Practice Rink A', 'Practice Rink B', 'Outdoor Rink']),
      rinkId: `rink-${Math.floor(Math.random() * 5) + 1}`,
      sections: Array.from({ length: sectionCount }, (_, i) => generateRandomSection(i)),
      objectives: Array.from(
        { length: Math.floor(Math.random() * 3) + 2 },
        (_, i) => `Practice objective ${i + 1}`
      ),
      equipment: getRandomFromArray([
        ['pucks', 'cones'],
        ['pucks', 'nets', 'cones'],
        ['pucks', 'nets', 'cones', 'pinnies'],
        ['pucks', 'cones', 'boards', 'timer']
      ]),
      notes: Math.random() > 0.6 ? 'Practice notes and reminders' : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...this.defaultOptions,
      ...overrides
    };

    // Add optional fields with probability
    if (Math.random() > 0.7) {
      baseData['trainingPlanId'] = getRandomUUID();
    }
    
    if (Math.random() > 0.6) {
      baseData['secondaryFocus'] = [getRandomEnum(PracticeFocus)];
    }

    if (Math.random() > 0.4) {
      baseData['lineups'] = generateRandomLineups();
    }

    // Add completed practice data
    if (baseData.status === PracticeStatus.COMPLETED) {
      baseData['attendance'] = generateRandomAttendance();
      baseData['playerEvaluations'] = generateRandomPlayerEvaluations();
      baseData['coachFeedback'] = 'Post-practice feedback and observations';
    }

    // Assign all properties to the entity
    Object.assign(plan, baseData);

    return plan;
  }

  /**
   * Create multiple practice plans
   */
  static createMany(count: number, overrides: Partial<PracticePlanFactoryOptions> = {}): PracticePlan[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create a practice plan for a specific team
   */
  static createForTeam(teamId: string, overrides: Partial<PracticePlanFactoryOptions> = {}): PracticePlan {
    return this.create({ teamId, ...overrides });
  }

  /**
   * Create a practice plan for a specific coach
   */
  static createForCoach(coachId: string, overrides: Partial<PracticePlanFactoryOptions> = {}): PracticePlan {
    return this.create({ coachId, ...overrides });
  }

  /**
   * Create a practice plan with specific status
   */
  static createWithStatus(status: PracticeStatus, overrides: Partial<PracticePlanFactoryOptions> = {}): PracticePlan {
    return this.create({ status, ...overrides });
  }

  /**
   * Create a skills-focused practice plan
   */
  static createSkillsPractice(overrides: Partial<PracticePlanFactoryOptions> = {}): PracticePlan {
    return this.create({
      title: 'Skills Development Practice',
      primaryFocus: PracticeFocus.SKILLS,
      sections: [
        {
          id: 'warm-up',
          name: 'Warm-up Skating',
          duration: 10,
          drillIds: ['warm-up-1'],
          notes: 'Light skating to prepare'
        },
        {
          id: 'passing',
          name: 'Passing Drills',
          duration: 20,
          drillIds: ['passing-1', 'passing-2'],
          notes: 'Focus on accuracy and timing',
          equipment: ['pucks', 'cones']
        },
        {
          id: 'shooting',
          name: 'Shooting Practice',
          duration: 25,
          drillIds: ['shooting-1', 'shooting-2', 'shooting-3'],
          notes: 'Work on release and accuracy',
          equipment: ['pucks', 'nets']
        },
        {
          id: 'scrimmage',
          name: 'Skills Scrimmage',
          duration: 25,
          drillIds: ['scrimmage-1'],
          notes: 'Apply skills in game situations'
        }
      ],
      objectives: ['Improve fundamental skills', 'Build muscle memory', 'Enhance technical proficiency'],
      ...overrides
    });
  }

  /**
   * Create a tactical practice plan
   */
  static createTacticalPractice(overrides: Partial<PracticePlanFactoryOptions> = {}): PracticePlan {
    return this.create({
      title: 'Tactical Systems Practice',
      primaryFocus: PracticeFocus.TACTICS,
      sections: [
        {
          id: 'systems-review',
          name: 'Systems Review',
          duration: 15,
          drillIds: ['systems-1'],
          notes: 'Review defensive zone coverage',
          equipment: ['whiteboard', 'pucks']
        },
        {
          id: 'breakout',
          name: 'Breakout Drills',
          duration: 20,
          drillIds: ['breakout-1', 'breakout-2'],
          notes: 'Practice clean exits from defensive zone',
          equipment: ['pucks', 'cones']
        },
        {
          id: 'neutral-zone',
          name: 'Neutral Zone Play',
          duration: 25,
          drillIds: ['neutral-1', 'neutral-2'],
          notes: 'Control neutral zone, create entries',
          equipment: ['pucks', 'cones']
        },
        {
          id: 'system-scrimmage',
          name: 'System Scrimmage',
          duration: 20,
          drillIds: ['scrimmage-systems'],
          notes: 'Execute systems under pressure'
        }
      ],
      objectives: ['Master system execution', 'Improve decision making', 'Build team chemistry'],
      ...overrides
    });
  }

  /**
   * Create a game preparation practice
   */
  static createGamePrepPractice(overrides: Partial<PracticePlanFactoryOptions> = {}): PracticePlan {
    return this.create({
      title: 'Game Preparation Practice',
      primaryFocus: PracticeFocus.GAME_PREP,
      secondaryFocus: [PracticeFocus.TACTICS],
      sections: [
        {
          id: 'activation',
          name: 'Game Activation',
          duration: 10,
          drillIds: ['activation-1'],
          notes: 'Get bodies ready for game intensity'
        },
        {
          id: 'special-teams',
          name: 'Special Teams Review',
          duration: 25,
          drillIds: ['pp-1', 'pk-1'],
          notes: 'Final special teams preparation',
          equipment: ['pucks', 'nets', 'cones']
        },
        {
          id: 'line-rushes',
          name: 'Line Rushes',
          duration: 20,
          drillIds: ['rush-1'],
          notes: 'Build timing and confidence',
          equipment: ['pucks', 'nets']
        },
        {
          id: 'situations',
          name: 'Game Situations',
          duration: 15,
          drillIds: ['situation-1'],
          notes: 'Practice key game scenarios'
        }
      ],
      objectives: ['Build confidence', 'Fine-tune execution', 'Prepare mentally'],
      lineups: generateRandomLineups(),
      ...overrides
    });
  }

  /**
   * Create a completed practice with evaluations
   */
  static createCompletedPractice(overrides: Partial<PracticePlanFactoryOptions> = {}): PracticePlan {
    return this.create({
      status: PracticeStatus.COMPLETED,
      attendance: generateRandomAttendance(18),
      playerEvaluations: generateRandomPlayerEvaluations(16),
      coachFeedback: 'Great practice today. Players were focused and executed well. Need to continue working on defensive zone coverage.',
      notes: 'Players responded well to adjustments. Good energy throughout practice.',
      date: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000), // Past week
      ...overrides
    });
  }

  /**
   * Create a conditioning practice
   */
  static createConditioningPractice(overrides: Partial<PracticePlanFactoryOptions> = {}): PracticePlan {
    return this.create({
      title: 'Conditioning Practice',
      primaryFocus: PracticeFocus.CONDITIONING,
      duration: 75,
      sections: [
        {
          id: 'warm-up',
          name: 'Dynamic Warm-up',
          duration: 15,
          drillIds: ['dynamic-warmup'],
          notes: 'Prepare for high intensity'
        },
        {
          id: 'skating',
          name: 'Skating Drills',
          duration: 30,
          drillIds: ['suicides', 'line-drills', 'stops-starts'],
          notes: 'High intensity skating work',
          equipment: ['cones', 'stopwatch']
        },
        {
          id: 'battle',
          name: 'Battle Drills',
          duration: 20,
          drillIds: ['battle-1', 'battle-2'],
          notes: 'Physical and mental conditioning',
          equipment: ['pucks', 'cones']
        },
        {
          id: 'recovery',
          name: 'Recovery Skating',
          duration: 10,
          drillIds: ['recovery-skate'],
          notes: 'Cool down and stretch'
        }
      ],
      objectives: ['Build endurance', 'Improve skating strength', 'Develop mental toughness'],
      ...overrides
    });
  }

  /**
   * Create a practice plan with detailed lineups
   */
  static createWithLineups(overrides: Partial<PracticePlanFactoryOptions> = {}): PracticePlan {
    return this.create({
      lineups: generateRandomLineups(),
      primaryFocus: PracticeFocus.TACTICS,
      title: 'Line Combination Practice',
      objectives: ['Test line combinations', 'Build chemistry', 'Evaluate player fit'],
      ...overrides
    });
  }

  /**
   * Create a cancelled practice
   */
  static createCancelled(overrides: Partial<PracticePlanFactoryOptions> = {}): PracticePlan {
    return this.create({
      status: PracticeStatus.CANCELLED,
      title: 'Cancelled Practice',
      notes: 'Practice cancelled due to ice conditions',
      ...overrides
    });
  }

  /**
   * Create practice plans for a full week
   */
  static createWeekSchedule(teamId: string, coachId: string, startDate: Date = new Date()): PracticePlan[] {
    const practices: PracticePlan[] = [];
    const focusRotation = [
      PracticeFocus.SKILLS,
      PracticeFocus.TACTICS,
      PracticeFocus.CONDITIONING,
      PracticeFocus.GAME_PREP
    ];

    for (let i = 0; i < 7; i++) {
      const practiceDate = new Date(startDate);
      practiceDate.setDate(practiceDate.getDate() + i);
      
      // Skip Sunday (day 0)
      if (practiceDate.getDay() === 0) continue;

      practices.push(this.create({
        teamId,
        coachId,
        date: practiceDate,
        primaryFocus: focusRotation[i % focusRotation.length],
        title: `${focusRotation[i % focusRotation.length]} Practice - Day ${i + 1}`
      }));
    }

    return practices;
  }

  /**
   * Create relationship-aware practice plans for testing relationships
   */
  static createRelationshipSet(baseId: string): {
    organization: PracticePlan[];
    team: PracticePlan[];
    coach: PracticePlan[];
  } {
    const organizationId = `${baseId}-org`;
    const teamId = `${baseId}-team`;
    const coachId = `${baseId}-coach`;

    return {
      organization: this.createMany(3, { organizationId }),
      team: this.createMany(4, { teamId }),
      coach: this.createMany(5, { coachId })
    };
  }

  /**
   * Create invalid practice plan for testing validation
   */
  static createInvalid(): Partial<PracticePlan> {
    return {
      // Missing required fields intentionally
      description: 'Invalid practice plan for testing'
    };
  }

  /**
   * Set default options for all created practice plans
   */
  static setDefaults(defaults: Partial<PracticePlanFactoryOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...defaults };
  }

  /**
   * Reset default options
   */
  static resetDefaults(): void {
    this.defaultOptions = {
      status: PracticeStatus.PLANNED,
      primaryFocus: PracticeFocus.SKILLS
    };
  }
}

// Helper functions for specific use cases
export const createPracticePlanForTesting = (testName: string): PracticePlan => {
  return PracticePlanFactory.create({
    title: `Test Practice - ${testName}`,
    description: `Practice plan created for testing: ${testName}`
  });
};

export const createPracticePlanBatch = (
  organizationId: string,
  teamId: string,
  coachId: string,
  count: number = 5
): PracticePlan[] => {
  return PracticePlanFactory.createMany(count, {
    organizationId,
    teamId,
    coachId
  });
};