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

// Utility functions for random data generation
const getRandomUUID = (prefix: string = '550e8400-e29b-41d4-a716') => 
  `${prefix}-${Math.random().toString(36).substr(2, 12)}`;

const getRandomFromArray = <T>(array: T[]): T => 
  array[Math.floor(Math.random() * array.length)];

const generateRandomLineCombo = (name: string): LineCombo => ({
  name,
  forwards: Array.from({ length: 3 }, (_, i) => `${name.toLowerCase().replace(' ', '-')}-forward-${i + 1}`),
  defense: Array.from({ length: 2 }, (_, i) => `${name.toLowerCase().replace(' ', '-')}-defense-${i + 1}`),
  goalie: `${name.toLowerCase().replace(' ', '-')}-goalie`,
  chemistry: Math.floor(Math.random() * 40) + 60, // 60-100
  ...(Math.random() > 0.5 && { minutesPlayed: Math.floor(Math.random() * 20) + 5 }),
  ...(Math.random() > 0.5 && { plusMinus: Math.floor(Math.random() * 11) - 5 }) // -5 to +5
});

const generateRandomLineups = (): Lineups => ({
  even_strength: [
    generateRandomLineCombo('First Line'),
    generateRandomLineCombo('Second Line'),
    generateRandomLineCombo('Third Line'),
    ...(Math.random() > 0.5 ? [generateRandomLineCombo('Fourth Line')] : [])
  ],
  powerplay: [
    generateRandomLineCombo('PP1'),
    ...(Math.random() > 0.6 ? [generateRandomLineCombo('PP2')] : [])
  ],
  penalty_kill: [
    generateRandomLineCombo('PK1'),
    generateRandomLineCombo('PK2')
  ],
  ...(Math.random() > 0.7 && {
    overtime: [generateRandomLineCombo('OT Line')]
  }),
  ...(Math.random() > 0.8 && {
    extra_attacker: [generateRandomLineCombo('6v5 Unit')]
  })
});

const generateRandomMatchups = (count: number = Math.floor(Math.random() * 5) + 2): Matchup[] =>
  Array.from({ length: count }, (_, i) => ({
    ourLine: `Our Line ${i + 1}`,
    opposingLine: `Their Line ${i + 1}`,
    strategy: getRandomFromArray([
      'Match speed, stay physical',
      'Force outside, limit time and space',
      'Pressure their defense, create turnovers',
      'Play defensive, counter-attack',
      'High tempo, wear them down'
    ])
  }));

const generateRandomSpecialInstructions = (count: number = Math.floor(Math.random() * 8) + 3): SpecialInstruction[] =>
  Array.from({ length: count }, (_, i) => ({
    playerId: `special-player-${i + 1}`,
    instructions: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 },
      (_, j) => `Special instruction ${j + 1} for player ${i + 1}`
    )
  }));

const generateRandomKeyPlayers = (count: number = Math.floor(Math.random() * 6) + 3): KeyPlayer[] =>
  Array.from({ length: count }, (_, i) => ({
    playerId: `key-opponent-${i + 1}`,
    name: `Key Player ${i + 1}`,
    tendencies: Array.from(
      { length: Math.floor(Math.random() * 4) + 2 },
      (_, j) => `Tendency ${j + 1} for player ${i + 1}`
    ),
    howToDefend: `Defense strategy for player ${i + 1}`
  }));

const generateRandomGoalieTendencies = (): GoalieTendencies => ({
  gloveHigh: Math.floor(Math.random() * 40) + 40, // 40-80
  gloveLow: Math.floor(Math.random() * 40) + 60, // 60-100
  blockerHigh: Math.floor(Math.random() * 40) + 50, // 50-90
  blockerLow: Math.floor(Math.random() * 30) + 70, // 70-100
  fiveHole: Math.floor(Math.random() * 50) + 30, // 30-80
  wraparound: Math.floor(Math.random() * 50) + 40 // 40-90
});

const generateRandomOpponentScouting = (): OpponentScouting => ({
  strengths: Array.from(
    { length: Math.floor(Math.random() * 5) + 3 },
    (_, i) => `Opponent strength ${i + 1}`
  ),
  weaknesses: Array.from(
    { length: Math.floor(Math.random() * 4) + 2 },
    (_, i) => `Opponent weakness ${i + 1}`
  ),
  keyPlayers: generateRandomKeyPlayers(),
  ...(Math.random() > 0.6 && { goalieTendencies: generateRandomGoalieTendencies() })
});

const generateRandomPeriodAdjustments = (): PeriodAdjustment[] => [
  {
    period: 1 as const,
    adjustments: [`First period adjustment`],
    lineChanges: { 'Line 1': 'Adjustment 1' }
  },
  {
    period: 2 as const,
    adjustments: [`Second period adjustment`],
    lineChanges: { 'Line 2': 'Adjustment 2' }
  },
  ...(Math.random() > 0.5 ? [{
    period: 3 as const,
    adjustments: [`Third period adjustment`],
    lineChanges: { 'Line 3': 'Adjustment 3' }
  }] : [])
];

const generateRandomGoalAnalysis = (count: number, type: 'for' | 'against'): GoalAnalysis[] =>
  Array.from({ length: count }, (_, i) => ({
    time: `${Math.floor(Math.random() * 20)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    period: Math.floor(Math.random() * 3) + 1,
    scoredBy: type === 'for' ? `our-player-${i + 1}` : `opp-player-${i + 1}`,
    assists: Array.from(
      { length: Math.floor(Math.random() * 3) },
      (_, j) => type === 'for' ? `our-assist-${i}-${j}` : `opp-assist-${i}-${j}`
    ),
    situation: getRandomFromArray(['Even Strength', 'Power Play', 'Short Handed', 'Empty Net']),
    description: `${type === 'for' ? 'Goal' : 'Goal against'} description ${i + 1}`,
    preventable: Math.random() > 0.6,
    notes: Math.random() > 0.5 ? `Notes for ${type} goal ${i + 1}` : undefined
  }));

const generateRandomPlayerPerformances = (count: number = 18): PlayerPerformance[] =>
  Array.from({ length: count }, (_, i) => ({
    playerId: `performance-player-${i + 1}`,
    rating: Math.floor(Math.random() * 6) + 5, // 5-10
    notes: `Performance analysis for player ${i + 1}`
  }));

const generateRandomPostGameAnalysis = (): PostGameAnalysis => {
  const goalsFor = Math.floor(Math.random() * 5) + 1; // 1-5 goals
  const goalsAgainst = Math.floor(Math.random() * 4); // 0-3 goals

  return {
    goalsFor: generateRandomGoalAnalysis(goalsFor, 'for'),
    goalsAgainst: generateRandomGoalAnalysis(goalsAgainst, 'against'),
    whatWorked: Array.from(
      { length: Math.floor(Math.random() * 4) + 2 },
      (_, i) => `What worked item ${i + 1}`
    ),
    whatDidntWork: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 },
      (_, i) => `What didn't work item ${i + 1}`
    ),
    playerPerformance: generateRandomPlayerPerformances()
  };
};

// Factory interface
export interface GameStrategyFactoryOptions {
  organizationId?: string;
  coachId?: string;
  teamId?: string;
  gameId?: string;
  opponentTeamId?: string;
  opponentTeamName?: string;
  lineups?: Lineups;
  matchups?: Matchup[];
  specialInstructions?: SpecialInstruction[];
  opponentScouting?: OpponentScouting;
  preGameSpeech?: string;
  periodAdjustments?: PeriodAdjustment[];
  postGameAnalysis?: PostGameAnalysis;
  gameCompleted?: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Base factory class
export class GameStrategyFactory {
  private static defaultOptions: Partial<GameStrategyFactoryOptions> = {
    gameCompleted: false
  };

  /**
   * Create a single game strategy with optional overrides
   */
  static create(overrides: Partial<GameStrategyFactoryOptions> = {}): GameStrategy {
    const strategy = new GameStrategy();
    
    // Generate base data
    const baseData = {
      id: getRandomUUID(),
      organizationId: getRandomUUID(),
      coachId: getRandomUUID(),
      teamId: getRandomUUID(),
      gameId: getRandomUUID(),
      opponentTeamId: getRandomUUID(),
      opponentTeamName: getRandomFromArray([
        'Thunder Bolts', 'Ice Wolves', 'Storm Hawks', 'Fire Dragons',
        'Lightning Strike', 'Frost Giants', 'Steel Eagles', 'Blazing Comets'
      ]),
      lineups: generateRandomLineups(),
      gameCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...this.defaultOptions,
      ...overrides
    };

    // Add optional fields with probability
    if (Math.random() > 0.4) {
      baseData['matchups'] = generateRandomMatchups();
    }
    
    if (Math.random() > 0.5) {
      baseData['specialInstructions'] = generateRandomSpecialInstructions();
    }

    if (Math.random() > 0.3) {
      baseData['opponentScouting'] = generateRandomOpponentScouting();
    }

    if (Math.random() > 0.6) {
      baseData['preGameSpeech'] = 'Pre-game motivational speech and key reminders';
    }

    if (Math.random() > 0.7) {
      baseData['periodAdjustments'] = generateRandomPeriodAdjustments();
    }

    if (Math.random() > 0.5) {
      baseData['tags'] = getRandomFromArray([
        ['division-game', 'home'],
        ['playoff', 'important'],
        ['rivalry', 'weekend'],
        ['season-opener', 'special']
      ]);
    }

    // Add post-game analysis if completed
    if (baseData.gameCompleted) {
      baseData['postGameAnalysis'] = generateRandomPostGameAnalysis();
    }

    // Assign all properties to the entity
    Object.assign(strategy, baseData);

    return strategy;
  }

  /**
   * Create multiple game strategies
   */
  static createMany(count: number, overrides: Partial<GameStrategyFactoryOptions> = {}): GameStrategy[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create a game strategy for a specific team
   */
  static createForTeam(teamId: string, overrides: Partial<GameStrategyFactoryOptions> = {}): GameStrategy {
    return this.create({ teamId, ...overrides });
  }

  /**
   * Create a game strategy for a specific coach
   */
  static createForCoach(coachId: string, overrides: Partial<GameStrategyFactoryOptions> = {}): GameStrategy {
    return this.create({ coachId, ...overrides });
  }

  /**
   * Create a game strategy for a specific game
   */
  static createForGame(gameId: string, overrides: Partial<GameStrategyFactoryOptions> = {}): GameStrategy {
    return this.create({ gameId, ...overrides });
  }

  /**
   * Create a comprehensive pre-game strategy
   */
  static createPreGameStrategy(overrides: Partial<GameStrategyFactoryOptions> = {}): GameStrategy {
    return this.create({
      matchups: generateRandomMatchups(4),
      specialInstructions: generateRandomSpecialInstructions(8),
      opponentScouting: generateRandomOpponentScouting(),
      preGameSpeech: 'Comprehensive pre-game preparation with detailed scouting and strategy',
      tags: ['pre-game', 'detailed', 'prepared'],
      gameCompleted: false,
      ...overrides
    });
  }

  /**
   * Create a completed game strategy with full analysis
   */
  static createCompletedGame(overrides: Partial<GameStrategyFactoryOptions> = {}): GameStrategy {
    return this.create({
      gameCompleted: true,
      periodAdjustments: generateRandomPeriodAdjustments(),
      postGameAnalysis: generateRandomPostGameAnalysis(),
      tags: ['completed', 'analyzed'],
      ...overrides
    });
  }

  /**
   * Create a playoff game strategy
   */
  static createPlayoffGame(overrides: Partial<GameStrategyFactoryOptions> = {}): GameStrategy {
    return this.create({
      matchups: generateRandomMatchups(6),
      specialInstructions: generateRandomSpecialInstructions(12),
      opponentScouting: {
        strengths: [
          'Excellent power play conversion',
          'Strong defensive structure',
          'Experienced playoff roster',
          'Great goaltending under pressure'
        ],
        weaknesses: [
          'Slower on back-to-back games',
          'Third line lacks depth',
          'Struggles with aggressive forechecking'
        ],
        keyPlayers: generateRandomKeyPlayers(6),
        goalieTendencies: generateRandomGoalieTendencies()
      },
      preGameSpeech: 'This is what we\'ve worked for all season. Execute our systems, stay disciplined, and play our game.',
      tags: ['playoff', 'elimination', 'high-stakes'],
      ...overrides
    });
  }

  /**
   * Create a rivalry game strategy
   */
  static createRivalryGame(overrides: Partial<GameStrategyFactoryOptions> = {}): GameStrategy {
    return this.create({
      opponentTeamName: 'Cross-Town Rivals',
      matchups: generateRandomMatchups(5),
      specialInstructions: generateRandomSpecialInstructions(10),
      preGameSpeech: 'Keep your composure. They will try to get under our skin. Play smart, play hard.',
      tags: ['rivalry', 'emotional', 'disciplined-play'],
      ...overrides
    });
  }

  /**
   * Create a defensive-focused strategy
   */
  static createDefensiveStrategy(overrides: Partial<GameStrategyFactoryOptions> = {}): GameStrategy {
    const lineups = generateRandomLineups();
    
    // Add more defensive-minded lines
    lineups.even_strength.push(generateRandomLineCombo('Shutdown Line'));
    lineups.penalty_kill.push(generateRandomLineCombo('PK3'));

    return this.create({
      lineups,
      matchups: [
        { ourLine: 'Shutdown Line', opposingLine: 'Their Top Line', strategy: 'Physical containment, limit time and space' },
        { ourLine: 'Checking Line', opposingLine: 'Their Second Line', strategy: 'Disrupt rhythm, force turnovers' }
      ],
      tags: ['defensive', 'checking', 'structured'],
      ...overrides
    });
  }

  /**
   * Create an offensive-focused strategy
   */
  static createOffensiveStrategy(overrides: Partial<GameStrategyFactoryOptions> = {}): GameStrategy {
    const lineups = generateRandomLineups();
    
    // Add more offensive options
    lineups.powerplay.push(generateRandomLineCombo('PP3'));
    if (!lineups.extra_attacker) {
      lineups.extra_attacker = [generateRandomLineCombo('6v5 Attack')];
    }

    return this.create({
      lineups,
      specialInstructions: [
        { playerId: 'top-scorer', instructions: ['Get shots from slot', 'Look for rebounds', 'Stay aggressive'] },
        { playerId: 'playmaker', instructions: ['Create opportunities', 'Find open teammates', 'Control tempo'] }
      ],
      tags: ['offensive', 'high-tempo', 'aggressive'],
      ...overrides
    });
  }

  /**
   * Create a strategy with detailed scouting
   */
  static createWithDetailedScouting(overrides: Partial<GameStrategyFactoryOptions> = {}): GameStrategy {
    return this.create({
      opponentScouting: {
        strengths: [
          'Elite power play (28% conversion)',
          'Strong goaltending (.925 save %)',
          'Fast transition game',
          'Physical forechecking system',
          'Good penalty kill (85%)',
          'Deep forward lines'
        ],
        weaknesses: [
          'Weak on face-offs (42%)',
          'Young defense makes mistakes',
          'Backup goalie struggles (.890 save %)',
          'Takes too many penalties',
          'Poor on back-to-back games'
        ],
        keyPlayers: [
          {
            playerId: 'star-forward',
            name: 'Johnny Scorer',
            tendencies: ['Shoots high glove', 'Cuts to net', 'Good in traffic', 'Dangerous on PP'],
            howToDefend: 'Force to backhand, take away center lane shooting position'
          },
          {
            playerId: 'playmaking-center',
            name: 'Alex Passer',
            tendencies: ['Great vision', 'Sets up from behind net', 'Finds open teammates'],
            howToDefend: 'Pressure early, limit time behind our net'
          },
          {
            playerId: 'shutdown-d',
            name: 'Big Defenseman',
            tendencies: ['Physical presence', 'Good gap control', 'Blocks shots'],
            howToDefend: 'Attack with speed, make quick decisions'
          }
        ],
        goalieTendencies: {
          gloveHigh: 45,
          gloveLow: 88,
          blockerHigh: 72,
          blockerLow: 85,
          fiveHole: 38,
          wraparound: 55
        }
      },
      matchups: [
        { ourLine: 'Top Line', opposingLine: 'Their Shutdown Pair', strategy: 'Use speed, get to net quickly' },
        { ourLine: 'Checking Line', opposingLine: 'Their Top Line', strategy: 'Physical containment, force them outside' }
      ],
      tags: ['detailed-scouting', 'prepared', 'analytical'],
      ...overrides
    });
  }

  /**
   * Create a game with period adjustments
   */
  static createWithPeriodAdjustments(overrides: Partial<GameStrategyFactoryOptions> = {}): GameStrategy {
    return this.create({
      periodAdjustments: [
        {
          period: 1,
          adjustments: ['Test their speed early', 'Establish forecheck', 'Get pucks deep'],
          lineChanges: { 'Energy Line': 'More ice time to set tone' }
        },
        {
          period: 2,
          adjustments: ['Tighten up defensively', 'Capitalize on power plays', 'Control neutral zone'],
          lineChanges: { 'Checking Line': 'Match against their top line' }
        },
        {
          period: 3,
          adjustments: ['Protect lead', 'Smart decisions with puck', 'Block shots'],
          lineChanges: { 'Shutdown Line': 'Close out the game' }
        }
      ],
      tags: ['adaptive', 'strategic', 'period-specific'],
      ...overrides
    });
  }

  /**
   * Create relationship-aware game strategies for testing relationships
   */
  static createRelationshipSet(baseId: string): {
    organization: GameStrategy[];
    team: GameStrategy[];
    coach: GameStrategy[];
    game: GameStrategy[];
  } {
    const organizationId = `${baseId}-org`;
    const teamId = `${baseId}-team`;
    const coachId = `${baseId}-coach`;
    const gameId = `${baseId}-game`;

    return {
      organization: this.createMany(3, { organizationId }),
      team: this.createMany(4, { teamId }),
      coach: this.createMany(5, { coachId }),
      game: this.createMany(2, { gameId })
    };
  }

  /**
   * Create invalid game strategy for testing validation
   */
  static createInvalid(): Partial<GameStrategy> {
    return {
      // Missing required fields intentionally
      gameCompleted: false
    };
  }

  /**
   * Set default options for all created game strategies
   */
  static setDefaults(defaults: Partial<GameStrategyFactoryOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...defaults };
  }

  /**
   * Reset default options
   */
  static resetDefaults(): void {
    this.defaultOptions = { gameCompleted: false };
  }
}

// Helper functions for specific use cases
export const createGameStrategyForTesting = (testName: string): GameStrategy => {
  return GameStrategyFactory.create({
    opponentTeamName: `Test Opponent - ${testName}`,
    tags: [`test-${testName.toLowerCase().replace(/\s+/g, '-')}`]
  });
};

export const createGameStrategyBatch = (
  organizationId: string,
  teamId: string,
  coachId: string,
  count: number = 5
): GameStrategy[] => {
  return GameStrategyFactory.createMany(count, {
    organizationId,
    teamId,
    coachId
  });
};