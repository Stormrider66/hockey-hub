// @ts-nocheck - Test factory with complex type generation
import { PlayerDevelopmentPlan, DevelopmentGoal, DevelopmentMilestone, ParentCommunication } from '../../entities/PlayerDevelopmentPlan';

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

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

// Data pools for random generation
const DEVELOPMENT_AREAS = [
  'Skating', 'Shooting', 'Passing', 'Stickhandling', 'Defensive Play',
  'Power Play', 'Penalty Kill', 'Face-offs', 'Physical Play', 'Game Awareness',
  'Leadership', 'Communication', 'Mental Toughness', 'Conditioning'
];

const GOAL_DESCRIPTIONS = [
  'Improve skating speed and agility',
  'Develop better shot accuracy',
  'Enhance passing under pressure',
  'Master advanced stickhandling moves',
  'Strengthen defensive positioning',
  'Increase physical strength and endurance',
  'Develop leadership qualities on ice',
  'Improve decision-making in offensive zone',
  'Master face-off techniques',
  'Enhance game reading abilities'
];

const MILESTONE_DESCRIPTIONS = [
  'Complete 20 hours of individual skill training',
  'Achieve 80% accuracy in shooting drills',
  'Demonstrate consistent defensive positioning in games',
  'Successfully execute power play strategies',
  'Show improved endurance in third period',
  'Lead team warm-up sessions',
  'Maintain positive attitude during adversity',
  'Execute advanced passing plays under pressure'
];

const SUCCESS_METRICS = [
  'Drill completion rate',
  'Game performance rating',
  'Skill assessment score',
  'Peer evaluation rating',
  'Coach observation notes',
  'Video analysis results',
  'Physical test improvements',
  'Leadership demonstration instances'
];

const COMMUNICATION_TOPICS = [
  'Weekly progress update',
  'Skill development focus areas',
  'Game performance review',
  'Training schedule adjustments',
  'Home practice recommendations',
  'Character development discussion',
  'Goal setting session',
  'Season preparation planning'
];

export interface PlayerDevelopmentPlanFactoryOptions {
  playerId?: string;
  coachId?: string;
  status?: 'Active' | 'Completed' | 'Paused' | 'Cancelled';
  priority?: 'High' | 'Medium' | 'Low';
  planType?: 'Individual' | 'Position-Specific' | 'Team-Based';
  duration?: number; // weeks
  goalCount?: number;
  milestoneCount?: number;
  communicationCount?: number;
  startDate?: Date;
  targetCompletionDate?: Date;
  focusAreas?: string[];
  parentInvolvement?: boolean;
}

export class PlayerDevelopmentPlanFactory {
  static create(options: PlayerDevelopmentPlanFactoryOptions = {}): PlayerDevelopmentPlan {
    const startDate = options.startDate || generateRandomDate(-30);
    const duration = options.duration || generateRandomRating(8, 24); // 8-24 weeks
    const targetDate = options.targetCompletionDate || new Date(startDate.getTime() + (duration * 7 * 24 * 60 * 60 * 1000));
    
    const focusAreas = options.focusAreas || generateRandomElements(DEVELOPMENT_AREAS, generateRandomRating(2, 5));
    const goals = this.generateGoals(options.goalCount || generateRandomRating(3, 8), focusAreas);
    const milestones = this.generateMilestones(options.milestoneCount || generateRandomRating(5, 15), goals);
    const communications = options.parentInvolvement !== false ? 
      this.generateCommunications(options.communicationCount || generateRandomRating(2, 8)) : [];

    return {
      id: generateRandomId(),
      playerId: options.playerId || generateRandomId(),
      coachId: options.coachId || generateRandomId(),
      status: options.status || getRandomElement(['Active', 'Active', 'Active', 'Completed', 'Paused']), // Weighted toward Active
      priority: options.priority || getRandomElement(['High', 'Medium', 'Medium', 'Low']), // Weighted toward Medium
      planType: options.planType || getRandomElement(['Individual', 'Position-Specific', 'Team-Based']),
      title: `${focusAreas.slice(0, 2).join(' & ')} Development Plan`,
      description: `Comprehensive development plan focusing on ${focusAreas.join(', ')} over ${duration} weeks`,
      focusAreas,
      goals,
      milestones,
      startDate,
      targetCompletionDate: targetDate,
      actualCompletionDate: options.status === 'Completed' ? generateRandomDate(-7) : null,
      parentCommunications: communications,
      progressNotes: this.generateProgressNotes(),
      lastUpdated: generateRandomDate(-generateRandomRating(0, 7)),
      createdAt: startDate,
      version: generateRandomRating(1, 5)
    };
  }

  static createMany(count: number, options: PlayerDevelopmentPlanFactoryOptions = {}): PlayerDevelopmentPlan[] {
    return Array.from({ length: count }, () => this.create(options));
  }

  static createActivePlan(overrides: PlayerDevelopmentPlanFactoryOptions = {}): PlayerDevelopmentPlan {
    return this.create({
      status: 'Active',
      startDate: generateRandomDate(-14), // Started 2 weeks ago
      priority: getRandomElement(['High', 'Medium']),
      ...overrides
    });
  }

  static createCompletedPlan(overrides: PlayerDevelopmentPlanFactoryOptions = {}): PlayerDevelopmentPlan {
    const startDate = generateRandomDate(-90); // Started 3 months ago
    const completionDate = generateRandomDate(-14); // Completed 2 weeks ago
    
    return this.create({
      status: 'Completed',
      startDate,
      targetCompletionDate: completionDate,
      ...overrides
    });
  }

  static createHighPriorityPlan(overrides: PlayerDevelopmentPlanFactoryOptions = {}): PlayerDevelopmentPlan {
    return this.create({
      priority: 'High',
      status: 'Active',
      focusAreas: ['Shooting', 'Skating', 'Game Awareness'],
      goalCount: generateRandomRating(5, 8),
      milestoneCount: generateRandomRating(10, 20),
      ...overrides
    });
  }

  static createPositionSpecificPlan(position: string, overrides: PlayerDevelopmentPlanFactoryOptions = {}): PlayerDevelopmentPlan {
    const positionFocusAreas = this.getPositionFocusAreas(position);
    
    return this.create({
      planType: 'Position-Specific',
      focusAreas: positionFocusAreas,
      goalCount: generateRandomRating(4, 7),
      ...overrides
    });
  }

  static createSeasonPreparationPlan(overrides: PlayerDevelopmentPlanFactoryOptions = {}): PlayerDevelopmentPlan {
    return this.create({
      duration: 16, // 4 months
      focusAreas: ['Conditioning', 'Skating', 'Shooting', 'Mental Toughness'],
      priority: 'High',
      startDate: generateRandomDate(-112), // Started 16 weeks ago
      goalCount: generateRandomRating(6, 10),
      milestoneCount: generateRandomRating(15, 25),
      parentInvolvement: true,
      ...overrides
    });
  }

  static createProgressiveSeries(playerId: string, count: number): PlayerDevelopmentPlan[] {
    const plans: PlayerDevelopmentPlan[] = [];
    let currentDate = generateRandomDate(-365); // Start a year ago
    
    for (let i = 0; i < count; i++) {
      const duration = generateRandomRating(8, 16);
      const plan = this.create({
        playerId,
        startDate: new Date(currentDate),
        duration,
        status: i < count - 1 ? 'Completed' : 'Active',
        version: i + 1
      });
      
      plans.push(plan);
      currentDate = new Date(currentDate.getTime() + ((duration + 2) * 7 * 24 * 60 * 60 * 1000)); // Add 2 weeks gap
    }
    
    return plans;
  }

  private static generateGoals(count: number, focusAreas: string[]): DevelopmentGoal[] {
    const goals: DevelopmentGoal[] = [];
    
    for (let i = 0; i < count; i++) {
      const focusArea = getRandomElement(focusAreas);
      goals.push({
        id: generateRandomId(),
        title: `${focusArea} Improvement Goal ${i + 1}`,
        description: getRandomElement(GOAL_DESCRIPTIONS),
        category: focusArea,
        priority: getRandomElement(['High', 'Medium', 'Low']),
        targetDate: generateRandomDate(generateRandomRating(7, 90)),
        currentProgress: generateRandomRating(0, 100),
        successMetrics: generateRandomElements(SUCCESS_METRICS, generateRandomRating(2, 4)),
        status: getRandomElement(['Not Started', 'In Progress', 'In Progress', 'Completed', 'On Hold']),
        notes: `Focus on consistent practice and gradual improvement in ${focusArea.toLowerCase()}`
      });
    }
    
    return goals;
  }

  private static generateMilestones(count: number, goals: DevelopmentGoal[]): DevelopmentMilestone[] {
    const milestones: DevelopmentMilestone[] = [];
    
    for (let i = 0; i < count; i++) {
      const relatedGoal = getRandomElement(goals);
      milestones.push({
        id: generateRandomId(),
        goalId: relatedGoal.id,
        title: `Milestone ${i + 1}`,
        description: getRandomElement(MILESTONE_DESCRIPTIONS),
        targetDate: generateRandomDate(generateRandomRating(3, 60)),
        completedDate: Math.random() > 0.6 ? generateRandomDate(-generateRandomRating(1, 30)) : null,
        status: getRandomElement(['Pending', 'In Progress', 'Completed', 'Overdue']),
        successCriteria: generateRandomElements(SUCCESS_METRICS, generateRandomRating(1, 3)),
        achievementNotes: Math.random() > 0.5 ? 'Excellent progress shown during practice sessions' : null
      });
    }
    
    return milestones;
  }

  private static generateCommunications(count: number): ParentCommunication[] {
    const communications: ParentCommunication[] = [];
    
    for (let i = 0; i < count; i++) {
      communications.push({
        id: generateRandomId(),
        date: generateRandomDate(-generateRandomRating(1, 60)),
        type: getRandomElement(['Email', 'Phone Call', 'In-Person Meeting', 'Text Message']),
        topic: getRandomElement(COMMUNICATION_TOPICS),
        summary: `Discussed ${getRandomElement(COMMUNICATION_TOPICS).toLowerCase()} and outlined next steps for development`,
        actionItems: generateRandomElements([
          'Schedule additional practice sessions',
          'Focus on specific drills at home',
          'Monitor nutrition and hydration',
          'Maintain practice journal',
          'Set weekly goals together',
          'Review game footage together'
        ], generateRandomRating(1, 3)),
        nextScheduledContact: generateRandomDate(generateRandomRating(7, 21)),
        parentFeedback: Math.random() > 0.5 ? 'Very satisfied with progress and communication' : null
      });
    }
    
    return communications;
  }

  private static generateProgressNotes(): string[] {
    const noteTemplates = [
      'Showing consistent improvement in fundamental skills',
      'Demonstrates good work ethic during training sessions',
      'Needs to focus more on defensive positioning',
      'Excellent leadership qualities emerging',
      'Physical development progressing well',
      'Mental game showing significant improvement',
      'Tactical understanding developing nicely',
      'Requires more confidence in game situations'
    ];
    
    return generateRandomElements(noteTemplates, generateRandomRating(2, 5));
  }

  private static getPositionFocusAreas(position: string): string[] {
    const positionMap: Record<string, string[]> = {
      'Forward': ['Shooting', 'Stickhandling', 'Power Play', 'Face-offs'],
      'Defense': ['Defensive Play', 'Passing', 'Physical Play', 'Penalty Kill'],
      'Goalie': ['Positioning', 'Reflexes', 'Mental Toughness', 'Communication']
    };
    
    return positionMap[position] || ['Skating', 'Game Awareness', 'Physical Play'];
  }
}