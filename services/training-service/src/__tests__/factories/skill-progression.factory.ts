// @ts-nocheck - Test factory with complex type generation
import { SkillProgression, SkillMeasurement, BenchmarkComparison, DrillHistory } from '../../entities/SkillProgression';

// Utility functions for random data generation
function generateRandomId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function generateRandomDate(daysOffset = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}

function generateRandomRating(min = 1, max = 10): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

// Data pools for random generation
const SKILL_CATEGORIES = [
  'Skating', 'Shooting', 'Passing', 'Stickhandling', 'Defensive Play',
  'Power Play', 'Penalty Kill', 'Face-offs', 'Physical Play', 'Game Awareness'
];

const SPECIFIC_SKILLS = {
  'Skating': [
    'Forward Stride', 'Backward Skating', 'Crossovers', 'Tight Turns', 
    'Acceleration', 'Deceleration', 'Edge Work', 'Balance'
  ],
  'Shooting': [
    'Wrist Shot', 'Slap Shot', 'Backhand', 'One-Timer', 'Snap Shot', 
    'Accuracy', 'Quick Release', 'Shot Selection'
  ],
  'Passing': [
    'Forehand Pass', 'Backhand Pass', 'Saucer Pass', 'One Touch Pass',
    'Pass Accuracy', 'Pass Timing', 'Vision', 'Pass Reception'
  ],
  'Stickhandling': [
    'Basic Control', 'Tight Spaces', 'Speed Handling', 'Deking',
    'Puck Protection', 'Lateral Movement', 'Head Up', 'Quick Hands'
  ]
};

const MEASUREMENT_UNITS = {
  'Speed': 'mph',
  'Accuracy': '%',
  'Time': 'seconds',
  'Distance': 'feet',
  'Repetitions': 'count',
  'Rating': 'score'
};

const DRILL_NAMES = [
  'Cone Weaving Drill', 'Shot Accuracy Challenge', 'Passing Precision Test',
  'Puck Control Circuit', 'Sprint Intervals', 'Figure-8 Skating',
  'Power Shot Practice', 'Quick Hands Drill', 'Defensive Positioning',
  'Breakout Passing', 'One-Timer Practice', 'Stickhandling Gauntlet'
];

const BENCHMARK_GROUPS = [
  'Team Average', 'Age Group', 'Position Group', 'League Average',
  'Elite Level', 'Development Level', 'Previous Season'
];

const IMPROVEMENT_STRATEGIES = [
  'Increase practice frequency',
  'Focus on fundamental techniques',
  'Work with skills coach',
  'Use video analysis',
  'Practice in game-like situations',
  'Strength and conditioning focus',
  'Mental training exercises',
  'Peer learning sessions'
];

export interface SkillProgressionFactoryOptions {
  playerId?: string;
  coachId?: string;
  skillCategory?: string;
  specificSkill?: string;
  currentLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  measurementCount?: number;
  drillHistoryCount?: number;
  benchmarkCount?: number;
  progressTrend?: 'Improving' | 'Stable' | 'Declining';
  seasonStartDate?: Date;
  includeTargets?: boolean;
}

export class SkillProgressionFactory {
  static create(options: SkillProgressionFactoryOptions = {}): SkillProgression {
    const skillCategory = options.skillCategory || getRandomElement(SKILL_CATEGORIES);
    const specificSkills = SPECIFIC_SKILLS[skillCategory as keyof typeof SPECIFIC_SKILLS] || ['General Skill'];
    const specificSkill = options.specificSkill || getRandomElement(specificSkills);
    const currentLevel = options.currentLevel || getRandomElement(['Beginner', 'Intermediate', 'Advanced', 'Expert']);
    
    const measurementCount = options.measurementCount || generateRandomRating(5, 20);
    const measurements = this.generateMeasurements(measurementCount, specificSkill);
    
    const drillHistoryCount = options.drillHistoryCount || generateRandomRating(8, 30);
    const drillHistory = this.generateDrillHistory(drillHistoryCount, specificSkill);
    
    const benchmarkCount = options.benchmarkCount || generateRandomRating(3, 7);
    const benchmarks = this.generateBenchmarkComparisons(benchmarkCount, measurements);

    return {
      id: generateRandomId(),
      playerId: options.playerId || generateRandomId(),
      coachId: options.coachId || generateRandomId(),
      skillCategory,
      specificSkill,
      currentLevel,
      baselineDate: options.seasonStartDate || generateRandomDate(-120), // 4 months ago
      measurements,
      drillHistory,
      benchmarkComparisons: benchmarks,
      progressTrend: options.progressTrend || this.calculateProgressTrend(measurements),
      improvementRate: this.calculateImprovementRate(measurements),
      currentRating: this.getCurrentRating(measurements),
      targetRating: options.includeTargets !== false ? this.getCurrentRating(measurements) + generateRandomFloat(0.5, 2.5) : null,
      targetDate: options.includeTargets !== false ? generateRandomDate(generateRandomRating(30, 120)) : null,
      strengths: this.generateStrengths(specificSkill),
      areasForImprovement: this.generateAreasForImprovement(specificSkill),
      recommendedStrategies: generateRandomElements(IMPROVEMENT_STRATEGIES, generateRandomRating(3, 6)),
      lastUpdated: generateRandomDate(-generateRandomRating(0, 7)),
      nextAssessmentDate: generateRandomDate(generateRandomRating(7, 30)),
      milestones: this.generateMilestones(currentLevel),
      notes: this.generateProgressNotes(specificSkill, currentLevel)
    };
  }

  static createMany(count: number, options: SkillProgressionFactoryOptions = {}): SkillProgression[] {
    return Array.from({ length: count }, () => this.create(options));
  }

  static createShootingProgression(overrides: SkillProgressionFactoryOptions = {}): SkillProgression {
    return this.create({
      skillCategory: 'Shooting',
      specificSkill: getRandomElement(SPECIFIC_SKILLS.Shooting),
      measurementCount: generateRandomRating(10, 25),
      drillHistoryCount: generateRandomRating(15, 40),
      ...overrides
    });
  }

  static createSkatingProgression(overrides: SkillProgressionFactoryOptions = {}): SkillProgression {
    return this.create({
      skillCategory: 'Skating',
      specificSkill: getRandomElement(SPECIFIC_SKILLS.Skating),
      measurementCount: generateRandomRating(8, 20),
      drillHistoryCount: generateRandomRating(12, 35),
      ...overrides
    });
  }

  static createStickhandlingProgression(overrides: SkillProgressionFactoryOptions = {}): SkillProgression {
    return this.create({
      skillCategory: 'Stickhandling',
      specificSkill: getRandomElement(SPECIFIC_SKILLS.Stickhandling),
      measurementCount: generateRandomRating(6, 18),
      drillHistoryCount: generateRandomRating(10, 30),
      ...overrides
    });
  }

  static createBeginnerProgression(overrides: SkillProgressionFactoryOptions = {}): SkillProgression {
    return this.create({
      currentLevel: 'Beginner',
      progressTrend: 'Improving',
      measurementCount: generateRandomRating(8, 15),
      includeTargets: true,
      ...overrides
    });
  }

  static createAdvancedProgression(overrides: SkillProgressionFactoryOptions = {}): SkillProgression {
    return this.create({
      currentLevel: 'Advanced',
      progressTrend: getRandomElement(['Improving', 'Stable']),
      measurementCount: generateRandomRating(15, 30),
      drillHistoryCount: generateRandomRating(25, 50),
      ...overrides
    });
  }

  static createSeasonProgression(playerId: string, skillCategory: string): SkillProgression[] {
    const progressions: SkillProgression[] = [];
    const specificSkills = SPECIFIC_SKILLS[skillCategory as keyof typeof SPECIFIC_SKILLS] || ['General'];
    const seasonStart = generateRandomDate(-150); // 5 months ago
    
    specificSkills.slice(0, generateRandomRating(3, 6)).forEach(skill => {
      progressions.push(this.create({
        playerId,
        skillCategory,
        specificSkill: skill,
        seasonStartDate: seasonStart,
        measurementCount: generateRandomRating(10, 25),
        drillHistoryCount: generateRandomRating(15, 40)
      }));
    });
    
    return progressions;
  }

  static createProgressionTimeline(playerId: string, skillCategory: string, specificSkill: string): SkillProgression[] {
    const timeline: SkillProgression[] = [];
    const levels = ['Beginner', 'Intermediate', 'Advanced'] as const;
    let currentDate = generateRandomDate(-365); // Start a year ago
    
    levels.forEach((level, index) => {
      const progression = this.create({
        playerId,
        skillCategory,
        specificSkill,
        currentLevel: level,
        seasonStartDate: new Date(currentDate),
        measurementCount: generateRandomRating(8 + index * 4, 15 + index * 8),
        progressTrend: index < levels.length - 1 ? 'Improving' : getRandomElement(['Improving', 'Stable'])
      });
      
      timeline.push(progression);
      currentDate = new Date(currentDate.getTime() + (120 * 24 * 60 * 60 * 1000)); // Add 4 months
    });
    
    return timeline;
  }

  private static generateMeasurements(count: number, specificSkill: string): SkillMeasurement[] {
    const measurements: SkillMeasurement[] = [];
    const metricType = this.getMetricForSkill(specificSkill);
    const unit = this.getUnitForMetric(metricType);
    const baseValue = this.getBaseValueForSkill(specificSkill, metricType);
    
    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor((count - i - 1) * (120 / count)); // Spread over 4 months
      const progressMultiplier = 1 + (i * 0.05); // Gradual improvement
      const randomVariation = generateRandomFloat(0.9, 1.1);
      
      measurements.push({
        id: generateRandomId(),
        date: generateRandomDate(-daysAgo),
        metricType,
        value: parseFloat((baseValue * progressMultiplier * randomVariation).toFixed(2)),
        unit,
        testConditions: getRandomElement([
          'Standard Practice', 'Game Simulation', 'Skills Session', 
          'Under Pressure', 'Fresh Legs', 'End of Practice'
        ]),
        notes: Math.random() > 0.6 ? this.generateMeasurementNote() : null,
        measuredBy: getRandomElement(['Coach', 'Skills Instructor', 'Video Analysis', 'Self-Assessment']),
        accuracy: getRandomElement(['High', 'Medium', 'Low'])
      });
    }
    
    return measurements.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private static generateDrillHistory(count: number, specificSkill: string): DrillHistory[] {
    const drillHistory: DrillHistory[] = [];
    const relevantDrills = this.getDrillsForSkill(specificSkill);
    
    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor((count - i - 1) * (120 / count));
      const drill = getRandomElement(relevantDrills);
      
      drillHistory.push({
        id: generateRandomId(),
        date: generateRandomDate(-daysAgo),
        drillName: drill,
        duration: generateRandomRating(5, 30), // 5-30 minutes
        repetitions: generateRandomRating(10, 100),
        successRate: generateRandomFloat(40, 95),
        intensity: getRandomElement(['Low', 'Medium', 'High']),
        feedback: Math.random() > 0.5 ? this.generateDrillFeedback() : null,
        improvements: Math.random() > 0.7 ? generateRandomElements([
          'Better form', 'Increased speed', 'More consistent',
          'Better accuracy', 'Improved timing', 'More confident'
        ], generateRandomRating(1, 3)) : []
      });
    }
    
    return drillHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private static generateBenchmarkComparisons(count: number, measurements: SkillMeasurement[]): BenchmarkComparison[] {
    const benchmarks: BenchmarkComparison[] = [];
    const latestValue = measurements[measurements.length - 1]?.value || 50;
    
    for (let i = 0; i < count; i++) {
      const benchmarkGroup = getRandomElement(BENCHMARK_GROUPS);
      const benchmarkValue = this.getBenchmarkValue(latestValue, benchmarkGroup);
      
      benchmarks.push({
        id: generateRandomId(),
        benchmarkGroup,
        benchmarkValue,
        playerValue: latestValue,
        percentile: Math.min(95, Math.max(5, Math.round((latestValue / benchmarkValue) * 50))),
        comparison: latestValue > benchmarkValue ? 'Above' : latestValue === benchmarkValue ? 'At' : 'Below',
        lastUpdated: generateRandomDate(-generateRandomRating(0, 30)),
        notes: `Player performance ${latestValue > benchmarkValue ? 'exceeds' : 'is below'} ${benchmarkGroup.toLowerCase()} by ${Math.abs(latestValue - benchmarkValue).toFixed(1)} points`
      });
    }
    
    return benchmarks;
  }

  private static generateMilestones(currentLevel: string): Array<{ description: string; achieved: boolean; achievedDate?: Date }> {
    const levelMilestones: Record<string, string[]> = {
      'Beginner': [
        'Complete basic skill assessment',
        'Master fundamental technique',
        'Achieve 70% consistency in drills',
        'Demonstrate skill in practice'
      ],
      'Intermediate': [
        'Execute skill under pressure',
        'Achieve 85% accuracy in assessments',
        'Teach skill to other players',
        'Use skill effectively in games'
      ],
      'Advanced': [
        'Perform skill at game speed',
        'Achieve 95% consistency',
        'Adapt skill to different situations',
        'Mentor other players'
      ],
      'Expert': [
        'Innovate new variations',
        'Perfect technique in all conditions',
        'Lead skill development sessions',
        'Achieve elite-level benchmarks'
      ]
    };

    const milestones = levelMilestones[currentLevel] || levelMilestones['Intermediate'];
    
    return milestones.map(description => ({
      description,
      achieved: Math.random() > 0.4,
      achievedDate: Math.random() > 0.4 ? generateRandomDate(-generateRandomRating(1, 90)) : undefined
    }));
  }

  private static calculateProgressTrend(measurements: SkillMeasurement[]): 'Improving' | 'Stable' | 'Declining' {
    if (measurements.length < 3) return 'Stable';
    
    const recent = measurements.slice(-3);
    const values = recent.map(m => m.value);
    
    const isImproving = values[2] > values[0] && values[1] >= values[0];
    const isDeclining = values[2] < values[0] && values[1] <= values[2];
    
    if (isImproving) return 'Improving';
    if (isDeclining) return 'Declining';
    return 'Stable';
  }

  private static calculateImprovementRate(measurements: SkillMeasurement[]): number {
    if (measurements.length < 2) return 0;
    
    const first = measurements[0].value;
    const last = measurements[measurements.length - 1].value;
    const timeSpan = measurements.length;
    
    return parseFloat(((last - first) / timeSpan).toFixed(2));
  }

  private static getCurrentRating(measurements: SkillMeasurement[]): number {
    if (measurements.length === 0) return generateRandomFloat(4, 8);
    return measurements[measurements.length - 1].value;
  }

  private static getMetricForSkill(skill: string): string {
    const skillMetrics: Record<string, string> = {
      'Wrist Shot': 'Shot Accuracy',
      'Forward Stride': 'Skating Speed',
      'Forehand Pass': 'Pass Accuracy',
      'Basic Control': 'Puck Control Time',
      'Crossovers': 'Agility Score',
      'One-Timer': 'Shot Velocity'
    };
    
    return skillMetrics[skill] || 'Skill Rating';
  }

  private static getUnitForMetric(metric: string): string {
    if (metric.includes('Accuracy') || metric.includes('Rate')) return '%';
    if (metric.includes('Speed') || metric.includes('Velocity')) return 'mph';
    if (metric.includes('Time')) return 'seconds';
    if (metric.includes('Distance')) return 'feet';
    return 'score';
  }

  private static getBaseValueForSkill(skill: string, metricType: string): number {
    if (metricType.includes('Accuracy') || metricType.includes('Rate')) {
      return generateRandomFloat(60, 85);
    }
    if (metricType.includes('Speed')) {
      return generateRandomFloat(15, 25);
    }
    if (metricType.includes('Time')) {
      return generateRandomFloat(8, 15);
    }
    return generateRandomFloat(5, 8); // Rating scale
  }

  private static getBenchmarkValue(playerValue: number, benchmarkGroup: string): number {
    const modifiers: Record<string, number> = {
      'Elite Level': 1.3,
      'League Average': 1.0,
      'Team Average': 0.95,
      'Age Group': 1.05,
      'Position Group': 1.1,
      'Development Level': 0.8,
      'Previous Season': 0.9
    };
    
    const modifier = modifiers[benchmarkGroup] || 1.0;
    return parseFloat((playerValue * modifier * generateRandomFloat(0.9, 1.1)).toFixed(2));
  }

  private static getDrillsForSkill(skill: string): string[] {
    const skillDrills: Record<string, string[]> = {
      'Wrist Shot': ['Shot Accuracy Challenge', 'Power Shot Practice', 'Quick Release Drill'],
      'Forward Stride': ['Sprint Intervals', 'Acceleration Drill', 'Power Skating'],
      'Basic Control': ['Puck Control Circuit', 'Stickhandling Gauntlet', 'Quick Hands Drill']
    };
    
    return skillDrills[skill] || DRILL_NAMES;
  }

  private static generateStrengths(skill: string): string[] {
    const strengthTemplates = [
      `Strong fundamental ${skill.toLowerCase()} technique`,
      `Consistent execution of ${skill.toLowerCase()}`,
      `Good understanding of ${skill.toLowerCase()} principles`,
      `Shows confidence when performing ${skill.toLowerCase()}`,
      `Natural ability in ${skill.toLowerCase()}`
    ];
    
    return generateRandomElements(strengthTemplates, generateRandomRating(2, 4));
  }

  private static generateAreasForImprovement(skill: string): string[] {
    const improvementTemplates = [
      `Could improve ${skill.toLowerCase()} under pressure`,
      `Needs more consistency in ${skill.toLowerCase()} execution`,
      `Should work on ${skill.toLowerCase()} technique refinement`,
      `Could increase ${skill.toLowerCase()} speed and efficiency`,
      `Needs more practice with ${skill.toLowerCase()} variations`
    ];
    
    return generateRandomElements(improvementTemplates, generateRandomRating(2, 4));
  }

  private static generateProgressNotes(skill: string, level: string): string[] {
    const noteTemplates = [
      `${skill} development is progressing well for a ${level.toLowerCase()} player`,
      `Consistent improvement shown in ${skill.toLowerCase()} over recent assessments`,
      `Player demonstrates good work ethic in ${skill.toLowerCase()} development`,
      `${level} level technique showing in ${skill.toLowerCase()} execution`,
      `Recommend continued focus on ${skill.toLowerCase()} fundamentals`
    ];
    
    return generateRandomElements(noteTemplates, generateRandomRating(2, 4));
  }

  private static generateMeasurementNote(): string {
    const notes = [
      'Excellent form displayed',
      'Showed improvement from last session',
      'Consistent with recent measurements',
      'Room for improvement noted',
      'Strong performance under test conditions',
      'Technique refinement needed'
    ];
    
    return getRandomElement(notes);
  }

  private static generateDrillFeedback(): string {
    const feedback = [
      'Great effort and focus throughout the drill',
      'Showed good improvement from start to finish',
      'Technique looked solid, keep it up',
      'Could use more intensity in execution',
      'Excellent attention to detail',
      'Good progress, continue working on consistency'
    ];
    
    return getRandomElement(feedback);
  }
}