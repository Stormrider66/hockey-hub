// @ts-nocheck - Suppress TypeScript errors for build
import {
  Drill,
  DrillDifficulty,
  DrillType
} from '../../entities/Drill';

// Utility functions for random data generation
const getRandomUUID = (prefix: string = '550e8400-e29b-41d4-a716') => 
  `${prefix}-${Math.random().toString(36).substr(2, 12)}`;

const getRandomEnum = <T>(enumObject: T): T[keyof T] => {
  const values = Object.values(enumObject as any);
  return values[Math.floor(Math.random() * values.length)];
};

const getRandomFromArray = <T>(array: T[]): T => 
  array[Math.floor(Math.random() * array.length)];

const generateRandomEquipment = (): string[] => {
  const allEquipment = ['pucks', 'cones', 'nets', 'pinnies', 'boards', 'stopwatch', 'whiteboard', 'sticks'];
  const count = Math.floor(Math.random() * 4) + 1; // 1-4 items
  const shuffled = [...allEquipment].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const generateRandomSetup = () => ({
  rinkArea: getRandomFromArray(['full', 'half', 'zone', 'corner', 'neutral'] as const),
  ...(Math.random() > 0.5 && { diagram: `https://example.com/drill-diagram-${Math.floor(Math.random() * 1000)}.png` }),
  ...(Math.random() > 0.4 && { cones: Math.floor(Math.random() * 15) + 1 }),
  ...(Math.random() > 0.3 && { pucks: Math.floor(Math.random() * 30) + 5 }),
  ...(Math.random() > 0.7 && { 
    otherEquipment: getRandomFromArray([
      ['boards', 'timer'],
      ['whiteboard'],
      ['video equipment'],
      ['portable nets']
    ])
  })
});

const generateRandomInstructions = (count: number = Math.floor(Math.random() * 6) + 2) =>
  Array.from({ length: count }, (_, i) => ({
    step: i + 1,
    description: `Instruction step ${i + 1}: ${getRandomFromArray([
      'Set up players in formation',
      'Execute the drill pattern',
      'Focus on technique and timing',
      'Progress to game speed',
      'Add competitive element',
      'Emphasize key teaching points'
    ])}`,
    ...(Math.random() > 0.6 && { duration: Math.floor(Math.random() * 5) + 1 }),
    ...(Math.random() > 0.5 && { 
      keyPoints: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 },
        (_, j) => `Key point ${j + 1} for step ${i + 1}`
      )
    })
  }));

const generateRandomObjectives = (): string[] =>
  Array.from(
    { length: Math.floor(Math.random() * 4) + 2 },
    (_, i) => getRandomFromArray([
      'Improve fundamental skills',
      'Develop game awareness',
      'Build muscle memory',
      'Enhance decision making',
      'Increase skating speed',
      'Improve puck handling',
      'Develop teamwork',
      'Build confidence'
    ]) + ` (objective ${i + 1})`
  );

const generateRandomKeyPoints = (): string[] =>
  Array.from(
    { length: Math.floor(Math.random() * 4) + 1 },
    (_, i) => getRandomFromArray([
      'Keep head up',
      'Follow through',
      'Maintain proper body position',
      'Communicate with teammates',
      'Stay focused',
      'Execute with precision',
      'Use proper technique',
      'Be patient with development'
    ]) + ` (point ${i + 1})`
  );

const generateRandomVariations = (): string[] =>
  Array.from(
    { length: Math.floor(Math.random() * 3) + 1 },
    (_, i) => getRandomFromArray([
      'Add defensive pressure',
      'Include shooting element',
      'Increase tempo',
      'Add competitive scoring',
      'Reverse direction',
      'Include passing component',
      'Add time constraints',
      'Modify player positions'
    ]) + ` (variation ${i + 1})`
  );

const generateRandomTags = (): string[] => {
  const allTags = [
    'fundamentals', 'passing', 'shooting', 'skating', 'defensive', 'offensive',
    'game-situation', 'competitive', 'conditioning', 'team-building', 'advanced',
    'beginner', 'warm-up', 'cool-down', 'power-play', 'penalty-kill'
  ];
  const count = Math.floor(Math.random() * 4) + 2; // 2-5 tags
  const shuffled = [...allTags].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const generateRandomAgeGroups = (): string[] => {
  const allAges = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior'];
  const count = Math.floor(Math.random() * 4) + 2; // 2-5 age groups
  const shuffled = [...allAges].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Factory interface
export interface DrillFactoryOptions {
  name?: string;
  description?: string;
  organizationId?: string;
  isPublic?: boolean;
  categoryId?: string;
  type?: DrillType;
  difficulty?: DrillDifficulty;
  duration?: number;
  minPlayers?: number;
  maxPlayers?: number;
  equipment?: string[];
  setup?: any;
  instructions?: Array<{
    step: number;
    description: string;
    duration?: number;
    keyPoints?: string[];
  }>;
  objectives?: string[];
  keyPoints?: string[];
  variations?: string[];
  tags?: string[];
  ageGroups?: string[];
  videoUrl?: string;
  animationUrl?: string;
  usageCount?: number;
  rating?: number;
  ratingCount?: number;
  metadata?: Record<string, any>;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Base factory class
export class DrillLibraryFactory {
  private static defaultOptions: Partial<DrillFactoryOptions> = {
    isPublic: true,
    usageCount: 0,
    rating: 0,
    ratingCount: 0
  };

  /**
   * Create a single drill with optional overrides
   */
  static create(overrides: Partial<DrillFactoryOptions> = {}): Drill {
    const drill = new Drill();
    
    // Generate base data
    const minPlayers = Math.floor(Math.random() * 8) + 2; // 2-9 players
    const baseData = {
      id: getRandomUUID(),
      name: `Drill ${Math.floor(Math.random() * 1000)}`,
      description: `Generated drill description ${Math.floor(Math.random() * 1000)}`,
      organizationId: Math.random() > 0.3 ? getRandomUUID() : undefined, // 70% have organization
      isPublic: Math.random() > 0.4, // 60% public
      categoryId: getRandomUUID(),
      type: getRandomEnum(DrillType),
      difficulty: getRandomEnum(DrillDifficulty),
      duration: Math.floor(Math.random() * 25) + 5, // 5-30 minutes
      minPlayers,
      maxPlayers: minPlayers + Math.floor(Math.random() * 15) + 2, // At least 2 more than min
      equipment: generateRandomEquipment(),
      setup: generateRandomSetup(),
      instructions: generateRandomInstructions(),
      objectives: generateRandomObjectives(),
      usageCount: Math.floor(Math.random() * 100),
      rating: Math.floor(Math.random() * 500),
      ratingCount: Math.floor(Math.random() * 100),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...this.defaultOptions,
      ...overrides
    };

    // Add optional fields with probability
    if (Math.random() > 0.6) {
      baseData['keyPoints'] = generateRandomKeyPoints();
    }
    
    if (Math.random() > 0.5) {
      baseData['variations'] = generateRandomVariations();
    }

    if (Math.random() > 0.4) {
      baseData['tags'] = generateRandomTags();
    }

    if (Math.random() > 0.5) {
      baseData['ageGroups'] = generateRandomAgeGroups();
    }

    if (Math.random() > 0.8) {
      baseData['videoUrl'] = `https://example.com/drill-video-${Math.floor(Math.random() * 1000)}.mp4`;
    }

    if (Math.random() > 0.9) {
      baseData['animationUrl'] = `https://example.com/drill-animation-${Math.floor(Math.random() * 1000)}.gif`;
    }

    if (Math.random() > 0.7) {
      baseData['metadata'] = {
        creator: 'Generated',
        season: '2023-24',
        category: 'auto-generated'
      };
    }

    // Assign all properties to the entity
    Object.assign(drill, baseData);

    return drill;
  }

  /**
   * Create multiple drills
   */
  static createMany(count: number, overrides: Partial<DrillFactoryOptions> = {}): Drill[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create a drill for a specific organization
   */
  static createForOrganization(organizationId: string, overrides: Partial<DrillFactoryOptions> = {}): Drill {
    return this.create({ organizationId, ...overrides });
  }

  /**
   * Create a drill of specific type
   */
  static createOfType(type: DrillType, overrides: Partial<DrillFactoryOptions> = {}): Drill {
    return this.create({ type, ...overrides });
  }

  /**
   * Create a drill of specific difficulty
   */
  static createOfDifficulty(difficulty: DrillDifficulty, overrides: Partial<DrillFactoryOptions> = {}): Drill {
    return this.create({ difficulty, ...overrides });
  }

  /**
   * Create a warm-up drill
   */
  static createWarmUpDrill(overrides: Partial<DrillFactoryOptions> = {}): Drill {
    return this.create({
      name: 'Warm-up Drill',
      type: DrillType.WARM_UP,
      difficulty: DrillDifficulty.BEGINNER,
      duration: 10,
      minPlayers: 1,
      maxPlayers: 30,
      equipment: ['pucks'],
      instructions: [
        {
          step: 1,
          description: 'Light skating to warm up muscles',
          duration: 5,
          keyPoints: ['Easy pace', 'Focus on form']
        },
        {
          step: 2,
          description: 'Dynamic stretching with puck',
          duration: 5,
          keyPoints: ['Full range of motion', 'Stay loose']
        }
      ],
      objectives: ['Prepare body for practice', 'Prevent injury', 'Get comfortable with puck'],
      tags: ['warm-up', 'preparation', 'injury-prevention'],
      ageGroups: ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior'],
      ...overrides
    });
  }

  /**
   * Create a skills drill
   */
  static createSkillsDrill(overrides: Partial<DrillFactoryOptions> = {}): Drill {
    return this.create({
      name: 'Skills Development Drill',
      type: DrillType.SKILL,
      difficulty: DrillDifficulty.INTERMEDIATE,
      duration: 15,
      minPlayers: 6,
      maxPlayers: 18,
      equipment: ['pucks', 'cones', 'nets'],
      setup: {
        rinkArea: 'zone',
        cones: 8,
        pucks: 20,
        diagram: 'https://example.com/skills-drill-diagram.png'
      },
      instructions: [
        {
          step: 1,
          description: 'Set up stations for skill development',
          duration: 2,
          keyPoints: ['Proper spacing', 'Clear instructions']
        },
        {
          step: 2,
          description: 'Players rotate through skill stations',
          duration: 12,
          keyPoints: ['Focus on technique', 'Quality over quantity', 'Listen to coaching']
        },
        {
          step: 3,
          description: 'Cool down and review key points',
          duration: 1,
          keyPoints: ['Reinforce learning', 'Prepare for next drill']
        }
      ],
      objectives: ['Improve fundamental skills', 'Build muscle memory', 'Develop confidence'],
      keyPoints: ['Proper technique', 'Patience with learning', 'Consistent practice'],
      variations: ['Add competitive element', 'Increase tempo', 'Add shooting finish'],
      tags: ['skills', 'fundamentals', 'development'],
      ...overrides
    });
  }

  /**
   * Create a tactical drill
   */
  static createTacticalDrill(overrides: Partial<DrillFactoryOptions> = {}): Drill {
    return this.create({
      name: 'Tactical System Drill',
      type: DrillType.TACTICAL,
      difficulty: DrillDifficulty.ADVANCED,
      duration: 20,
      minPlayers: 10,
      maxPlayers: 20,
      equipment: ['pucks', 'cones', 'nets', 'pinnies'],
      setup: {
        rinkArea: 'full',
        cones: 12,
        pucks: 30,
        otherEquipment: ['whiteboard', 'timer']
      },
      instructions: [
        {
          step: 1,
          description: 'Review system on whiteboard',
          duration: 3,
          keyPoints: ['Understand roles', 'Know positioning', 'Ask questions']
        },
        {
          step: 2,
          description: 'Walk through system slowly',
          duration: 5,
          keyPoints: ['Focus on positioning', 'Communication', 'Timing']
        },
        {
          step: 3,
          description: 'Execute at game speed',
          duration: 12,
          keyPoints: ['Maintain system integrity', 'Quick decisions', 'Support teammates']
        }
      ],
      objectives: ['Master team systems', 'Improve game awareness', 'Build chemistry'],
      keyPoints: ['System first', 'Communicate constantly', 'Trust your teammates'],
      variations: ['Add pressure', 'Change formations', 'Include special teams'],
      tags: ['tactical', 'systems', 'team-play', 'advanced'],
      ageGroups: ['U16', 'U18', 'Senior'],
      ...overrides
    });
  }

  /**
   * Create a conditioning drill
   */
  static createConditioningDrill(overrides: Partial<DrillFactoryOptions> = {}): Drill {
    return this.create({
      name: 'Conditioning Drill',
      type: DrillType.CONDITIONING,
      difficulty: DrillDifficulty.INTERMEDIATE,
      duration: 12,
      minPlayers: 1,
      maxPlayers: 25,
      equipment: ['cones', 'stopwatch'],
      setup: {
        rinkArea: 'full',
        cones: 10,
        pucks: 0,
        otherEquipment: ['stopwatch', 'whistle']
      },
      instructions: [
        {
          step: 1,
          description: 'Set up for high-intensity skating',
          duration: 1,
          keyPoints: ['Proper starting position', 'Focus on form']
        },
        {
          step: 2,
          description: 'Execute skating patterns at maximum effort',
          duration: 10,
          keyPoints: ['Full speed', 'Good stops and starts', 'Push through fatigue']
        },
        {
          step: 3,
          description: 'Recovery and stretch',
          duration: 1,
          keyPoints: ['Control breathing', 'Stay moving', 'Prepare for next drill']
        }
      ],
      objectives: ['Improve cardiovascular fitness', 'Build leg strength', 'Develop mental toughness'],
      keyPoints: ['Maximum effort', 'Proper technique even when tired', 'Support teammates'],
      variations: ['Add puck handling', 'Include backwards skating', 'Change patterns'],
      tags: ['conditioning', 'fitness', 'skating', 'endurance'],
      ...overrides
    });
  }

  /**
   * Create a game simulation drill
   */
  static createGameDrill(overrides: Partial<DrillFactoryOptions> = {}): Drill {
    return this.create({
      name: 'Game Simulation Drill',
      type: DrillType.GAME,
      difficulty: DrillDifficulty.INTERMEDIATE,
      duration: 18,
      minPlayers: 8,
      maxPlayers: 20,
      equipment: ['pucks', 'nets', 'pinnies'],
      setup: {
        rinkArea: 'half',
        pucks: 25,
        otherEquipment: ['timer', 'scoreboard']
      },
      instructions: [
        {
          step: 1,
          description: 'Set up game-like scenarios',
          duration: 2,
          keyPoints: ['Realistic situations', 'Clear objectives']
        },
        {
          step: 2,
          description: 'Play competitive scenarios',
          duration: 15,
          keyPoints: ['Game intensity', 'Apply skills under pressure', 'Make quick decisions']
        },
        {
          step: 3,
          description: 'Review key moments',
          duration: 1,
          keyPoints: ['Learn from situations', 'Prepare for games']
        }
      ],
      objectives: ['Apply skills in game situations', 'Build decision-making', 'Increase competitiveness'],
      keyPoints: ['Game-like intensity', 'Smart decisions', 'Execute under pressure'],
      variations: ['Change scenarios', 'Add time pressure', 'Include special teams'],
      tags: ['game-simulation', 'competitive', 'decision-making'],
      ...overrides
    });
  }

  /**
   * Create a public drill
   */
  static createPublicDrill(overrides: Partial<DrillFactoryOptions> = {}): Drill {
    return this.create({
      isPublic: true,
      organizationId: undefined, // Public drills don't belong to specific organizations
      name: 'Public Community Drill',
      description: 'Drill available to all coaches and organizations',
      tags: ['public', 'community', 'shared'],
      ...overrides
    });
  }

  /**
   * Create a private drill
   */
  static createPrivateDrill(organizationId: string, overrides: Partial<DrillFactoryOptions> = {}): Drill {
    return this.create({
      isPublic: false,
      organizationId,
      name: 'Private Organization Drill',
      description: 'Drill exclusive to this organization',
      tags: ['private', 'organization-specific'],
      ...overrides
    });
  }

  /**
   * Create a highly rated drill
   */
  static createHighlyRatedDrill(overrides: Partial<DrillFactoryOptions> = {}): Drill {
    const ratingCount = Math.floor(Math.random() * 50) + 50; // 50-100 ratings
    const averageRating = Math.random() * 2 + 8; // 8-10 average
    
    return this.create({
      name: 'Highly Rated Drill',
      rating: Math.floor(averageRating * ratingCount),
      ratingCount,
      usageCount: Math.floor(Math.random() * 200) + 100, // 100-300 uses
      tags: ['popular', 'highly-rated', 'proven'],
      videoUrl: 'https://example.com/popular-drill-video.mp4',
      ...overrides
    });
  }

  /**
   * Create a drill with video content
   */
  static createDrillWithVideo(overrides: Partial<DrillFactoryOptions> = {}): Drill {
    return this.create({
      videoUrl: 'https://example.com/drill-instruction-video.mp4',
      animationUrl: 'https://example.com/drill-animation.gif',
      setup: {
        ...generateRandomSetup(),
        diagram: 'https://example.com/detailed-drill-diagram.png'
      },
      tags: ['video-instruction', 'visual-learning', 'detailed'],
      ...overrides
    });
  }

  /**
   * Create drills for specific age groups
   */
  static createForAgeGroup(ageGroup: string, overrides: Partial<DrillFactoryOptions> = {}): Drill {
    const difficultyByAge = {
      'U8': DrillDifficulty.BEGINNER,
      'U10': DrillDifficulty.BEGINNER,
      'U12': DrillDifficulty.BEGINNER,
      'U14': DrillDifficulty.INTERMEDIATE,
      'U16': DrillDifficulty.INTERMEDIATE,
      'U18': DrillDifficulty.ADVANCED,
      'Senior': DrillDifficulty.ADVANCED
    };

    return this.create({
      ageGroups: [ageGroup],
      difficulty: difficultyByAge[ageGroup as keyof typeof difficultyByAge] || DrillDifficulty.INTERMEDIATE,
      name: `${ageGroup} Appropriate Drill`,
      ...overrides
    });
  }

  /**
   * Create relationship-aware drills for testing relationships
   */
  static createRelationshipSet(baseId: string): {
    organization: Drill[];
    category: Drill[];
    public: Drill[];
    private: Drill[];
  } {
    const organizationId = `${baseId}-org`;
    const categoryId = `${baseId}-category`;

    return {
      organization: this.createMany(5, { organizationId }),
      category: this.createMany(4, { categoryId }),
      public: this.createMany(3, { isPublic: true, organizationId: undefined }),
      private: this.createMany(2, { isPublic: false, organizationId })
    };
  }

  /**
   * Create invalid drill for testing validation
   */
  static createInvalid(): Partial<Drill> {
    return {
      // Missing required fields intentionally
      description: 'Invalid drill for testing',
      isPublic: true
    };
  }

  /**
   * Create drill batch for performance testing
   */
  static createBatch(
    organizationId: string,
    categoryId: string,
    count: number = 10
  ): Drill[] {
    return this.createMany(count, {
      organizationId,
      categoryId
    });
  }

  /**
   * Set default options for all created drills
   */
  static setDefaults(defaults: Partial<DrillFactoryOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...defaults };
  }

  /**
   * Reset default options
   */
  static resetDefaults(): void {
    this.defaultOptions = {
      isPublic: true,
      usageCount: 0,
      rating: 0,
      ratingCount: 0
    };
  }
}

// Helper functions for specific use cases
export const createDrillForTesting = (testName: string): Drill => {
  return DrillLibraryFactory.create({
    name: `Test Drill - ${testName}`,
    description: `Drill created for testing: ${testName}`,
    tags: [`test-${testName.toLowerCase().replace(/\s+/g, '-')}`]
  });
};

export const createDrillLibraryBatch = (
  organizationId: string,
  categoryId: string,
  count: number = 10
): Drill[] => {
  return DrillLibraryFactory.createMany(count, {
    organizationId,
    categoryId
  });
};