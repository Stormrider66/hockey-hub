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

// Utility functions for random data generation
const getRandomUUID = (prefix: string = '550e8400-e29b-41d4-a716') => 
  `${prefix}-${Math.random().toString(36).substr(2, 12)}`;

const getRandomEnum = <T>(enumObject: T): T[keyof T] => {
  const values = Object.values(enumObject as any);
  return values[Math.floor(Math.random() * values.length)];
};

const getRandomFromArray = <T>(array: T[]): T => 
  array[Math.floor(Math.random() * array.length)];

const generateRandomPosition = (): PlayerPosition => ({
  position: getRandomEnum(PlayerPositionType),
  x: Math.floor(Math.random() * 100),
  y: Math.floor(Math.random() * 100),
  zone: getRandomEnum(ZoneType),
  ...(Math.random() > 0.5 && { playerId: getRandomUUID() })
});

const generateRandomPlayerAssignment = (): PlayerAssignment => ({
  playerId: getRandomUUID(),
  position: getRandomFromArray(['C', 'LW', 'RW', 'LD', 'RD', 'G']),
  responsibilities: Array.from(
    { length: Math.floor(Math.random() * 4) + 1 },
    (_, i) => `Responsibility ${i + 1}`
  ),
  ...(Math.random() > 0.6 && { alternatePosition: getRandomFromArray(['C', 'LW', 'RW', 'LD', 'RD']) })
});

const generateRandomFormation = (): Formation => ({
  type: getRandomEnum(FormationType),
  zones: {
    offensive: Array.from(
      { length: Math.floor(Math.random() * 5) + 1 },
      () => generateRandomPosition()
    ),
    neutral: Array.from(
      { length: Math.floor(Math.random() * 3) },
      () => generateRandomPosition()
    ),
    defensive: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 },
      () => generateRandomPosition()
    )
  }
});

const generateRandomTriggers = (count: number = Math.floor(Math.random() * 5)): Trigger[] =>
  Array.from({ length: count }, (_, i) => ({
    situation: `Trigger situation ${i + 1}`,
    action: `Corresponding action ${i + 1}`
  }));

const generateRandomVideoReferences = (count: number = Math.floor(Math.random() * 3)): VideoReference[] =>
  Array.from({ length: count }, (_, i) => ({
    url: `https://example.com/video-${i + 1}.mp4`,
    timestamp: Math.floor(Math.random() * 300),
    description: `Video reference ${i + 1} description`
  }));

// Factory interface
export interface TacticalPlanFactoryOptions {
  name?: string;
  organizationId?: string;
  coachId?: string;
  teamId?: string;
  category?: TacticalCategory;
  formation?: Formation;
  playerAssignments?: PlayerAssignment[];
  description?: string;
  triggers?: Trigger[];
  videoReferences?: VideoReference[];
  isActive?: boolean;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Base factory class
export class TacticalPlanFactory {
  private static defaultOptions: Partial<TacticalPlanFactoryOptions> = {
    isActive: true
  };

  /**
   * Create a single tactical plan with optional overrides
   */
  static create(overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    const plan = new TacticalPlan();
    
    // Generate base data
    const baseData = {
      id: getRandomUUID(),
      name: `Tactical Plan ${Math.floor(Math.random() * 1000)}`,
      organizationId: getRandomUUID(),
      coachId: getRandomUUID(),
      teamId: getRandomUUID(),
      category: getRandomEnum(TacticalCategory),
      formation: generateRandomFormation(),
      playerAssignments: Array.from(
        { length: Math.floor(Math.random() * 8) + 2 },
        () => generateRandomPlayerAssignment()
      ),
      description: `Generated tactical plan description ${Math.floor(Math.random() * 1000)}`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...this.defaultOptions,
      ...overrides
    };

    // Add optional fields with probability
    if (Math.random() > 0.6) {
      baseData['triggers'] = generateRandomTriggers();
    }
    
    if (Math.random() > 0.7) {
      baseData['videoReferences'] = generateRandomVideoReferences();
    }

    // Assign all properties to the entity
    Object.assign(plan, baseData);

    return plan;
  }

  /**
   * Create multiple tactical plans
   */
  static createMany(count: number, overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create a tactical plan for a specific category
   */
  static createForCategory(category: TacticalCategory, overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    return this.create({ category, ...overrides });
  }

  /**
   * Create a tactical plan for a specific team
   */
  static createForTeam(teamId: string, overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    return this.create({ teamId, ...overrides });
  }

  /**
   * Create a tactical plan for a specific coach
   */
  static createForCoach(coachId: string, overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    return this.create({ coachId, ...overrides });
  }

  /**
   * Create a tactical plan with specific formation type
   */
  static createWithFormationType(formationType: FormationType, overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    const formation = generateRandomFormation();
    formation.type = formationType;
    return this.create({ formation, ...overrides });
  }

  /**
   * Create an offensive tactical plan
   */
  static createOffensive(overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    return this.createForCategory(TacticalCategory.OFFENSIVE, {
      name: 'Offensive System Plan',
      description: 'Tactical plan focused on offensive strategies',
      ...overrides
    });
  }

  /**
   * Create a defensive tactical plan
   */
  static createDefensive(overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    return this.createForCategory(TacticalCategory.DEFENSIVE, {
      name: 'Defensive System Plan',
      description: 'Tactical plan focused on defensive strategies',
      ...overrides
    });
  }

  /**
   * Create a power play tactical plan
   */
  static createPowerPlay(overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    return this.create({
      category: TacticalCategory.SPECIAL_TEAMS,
      formation: {
        type: FormationType.POWERPLAY,
        zones: {
          offensive: Array.from({ length: 5 }, () => generateRandomPosition()),
          neutral: [],
          defensive: []
        }
      },
      name: 'Power Play System',
      description: 'Special teams power play tactical plan',
      ...overrides
    });
  }

  /**
   * Create a penalty kill tactical plan
   */
  static createPenaltyKill(overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    return this.create({
      category: TacticalCategory.DEFENSIVE,
      formation: {
        type: FormationType.PENALTY_KILL,
        zones: {
          offensive: [],
          neutral: [],
          defensive: Array.from({ length: 4 }, () => generateRandomPosition())
        }
      },
      name: 'Penalty Kill System',
      description: 'Special teams penalty kill tactical plan',
      ...overrides
    });
  }

  /**
   * Create a tactical plan with video references
   */
  static createWithVideo(overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    return this.create({
      videoReferences: generateRandomVideoReferences(Math.floor(Math.random() * 3) + 1),
      ...overrides
    });
  }

  /**
   * Create a tactical plan with triggers
   */
  static createWithTriggers(overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    return this.create({
      triggers: generateRandomTriggers(Math.floor(Math.random() * 4) + 1),
      ...overrides
    });
  }

  /**
   * Create an inactive tactical plan
   */
  static createInactive(overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    return this.create({
      isActive: false,
      name: 'Inactive Tactical Plan',
      ...overrides
    });
  }

  /**
   * Create a comprehensive tactical plan with all optional fields
   */
  static createComprehensive(overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    return this.create({
      triggers: generateRandomTriggers(3),
      videoReferences: generateRandomVideoReferences(2),
      description: 'Comprehensive tactical plan with all features',
      ...overrides
    });
  }

  /**
   * Create relationship-aware tactical plans for testing relationships
   */
  static createRelationshipSet(baseId: string): {
    organization: TacticalPlan[];
    coach: TacticalPlan[];
    team: TacticalPlan[];
  } {
    const organizationId = `${baseId}-org`;
    const coachId = `${baseId}-coach`;
    const teamId = `${baseId}-team`;

    return {
      organization: this.createMany(3, { organizationId }),
      coach: this.createMany(4, { coachId }),
      team: this.createMany(5, { teamId })
    };
  }

  /**
   * Create invalid tactical plan for testing validation
   */
  static createInvalid(): Partial<TacticalPlan> {
    return {
      // Missing required fields intentionally
      description: 'Invalid tactical plan for testing'
    };
  }

  /**
   * Create tactical plan with custom player assignments
   */
  static createWithPlayerAssignments(playerIds: string[], overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    const playerAssignments = playerIds.map(playerId => ({
      playerId,
      position: getRandomFromArray(['C', 'LW', 'RW', 'LD', 'RD', 'G']),
      responsibilities: [`Custom responsibility for ${playerId}`]
    }));

    return this.create({
      playerAssignments,
      ...overrides
    });
  }

  /**
   * Create tactical plan with specific formation positions
   */
  static createWithPositions(positions: PlayerPosition[], overrides: Partial<TacticalPlanFactoryOptions> = {}): TacticalPlan {
    const formation: Formation = {
      type: FormationType.EVEN_STRENGTH,
      zones: {
        offensive: positions.filter(p => p.zone === ZoneType.OFFENSIVE),
        neutral: positions.filter(p => p.zone === ZoneType.NEUTRAL),
        defensive: positions.filter(p => p.zone === ZoneType.DEFENSIVE)
      }
    };

    return this.create({
      formation,
      ...overrides
    });
  }

  /**
   * Set default options for all created tactical plans
   */
  static setDefaults(defaults: Partial<TacticalPlanFactoryOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...defaults };
  }

  /**
   * Reset default options
   */
  static resetDefaults(): void {
    this.defaultOptions = { isActive: true };
  }
}

// Helper functions for specific use cases
export const createTacticalPlanForTesting = (testName: string): TacticalPlan => {
  return TacticalPlanFactory.create({
    name: `Test Plan - ${testName}`,
    description: `Tactical plan created for testing: ${testName}`
  });
};

export const createTacticalPlanBatch = (
  organizationId: string,
  coachId: string,
  teamId: string,
  count: number = 5
): TacticalPlan[] => {
  return TacticalPlanFactory.createMany(count, {
    organizationId,
    coachId,
    teamId
  });
};