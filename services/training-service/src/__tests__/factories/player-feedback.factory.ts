import { PlayerFeedback, ActionItem, FeedbackCategory } from '../../entities/PlayerFeedback';

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
const FEEDBACK_TYPES = [
  'Game Performance', 'Practice Evaluation', 'Skill Development', 'Behavior Assessment',
  'Leadership Review', 'Team Contribution', 'Individual Progress', 'Season Summary'
];

const FEEDBACK_TONES = ['Positive', 'Constructive', 'Motivational', 'Corrective', 'Encouraging'];

const CATEGORIES: FeedbackCategory[] = [
  'Technical Skills', 'Tactical Understanding', 'Physical Performance', 
  'Mental Approach', 'Team Dynamics', 'Leadership', 'Character Development', 'Work Ethic'
];

const POSITIVE_FEEDBACK_TEMPLATES = [
  'Excellent work ethic and dedication shown in recent sessions',
  'Significant improvement in technical skills over the past month',
  'Outstanding leadership qualities displayed during team activities',
  'Consistently demonstrates positive attitude and coachability',
  'Shows great potential and natural hockey instincts',
  'Excellent team player who supports teammates effectively',
  'Strong fundamentals and continues to build on solid foundation',
  'Impressive game awareness and decision-making abilities'
];

const CONSTRUCTIVE_FEEDBACK_TEMPLATES = [
  'Focus needed on developing consistency in fundamental skills',
  'Could benefit from increased intensity during practice sessions',
  'Opportunities exist to improve communication on the ice',
  'Would benefit from working on mental preparation before games',
  'Consider focusing more on defensive positioning and awareness',
  'Could improve by being more vocal and taking leadership roles',
  'Physical conditioning could be enhanced for better performance',
  'Time management and preparation could use some attention'
];

const MOTIVATIONAL_FEEDBACK_TEMPLATES = [
  'You have the potential to be a key contributor to this team',
  'Your hard work is starting to pay off - keep pushing forward',
  'Believe in yourself and continue to take on new challenges',
  'Your dedication to improvement is noticed and appreciated',
  'You are capable of achieving great things with continued effort',
  'Your positive attitude is contagious and helps the entire team',
  'Keep working on your goals - you are making solid progress',
  'Your commitment to the team is evident in everything you do'
];

const ACTION_ITEM_TEMPLATES = [
  'Practice shooting accuracy drills 3 times per week',
  'Work on skating stride and power during off-ice training',
  'Study game video to improve tactical understanding',
  'Focus on communication during power play situations',
  'Attend additional skills sessions to refine technique',
  'Work with fitness trainer to improve endurance',
  'Practice leadership by helping younger players',
  'Set weekly goals and track progress consistently'
];

const STRENGTHS_POOL = [
  'Excellent skating ability and agility',
  'Strong shot accuracy and power',
  'Good hockey IQ and game sense',
  'Positive attitude and coachability',
  'Consistent work ethic in practice',
  'Natural leadership qualities',
  'Physical strength and conditioning',
  'Team-first mentality and support',
  'Quick learning and adaptation',
  'Mental toughness in pressure situations'
];

const AREAS_FOR_IMPROVEMENT_POOL = [
  'Defensive positioning and awareness',
  'Consistency in fundamental skills',
  'Physical strength and conditioning',
  'Communication and vocal leadership',
  'Shot selection and timing',
  'Puck protection in traffic',
  'Face-off technique and success rate',
  'Power play positioning',
  'Mental preparation and focus',
  'Time management and organization'
];

const SEASONAL_GOALS_POOL = [
  'Improve shooting accuracy by 15%',
  'Increase ice time through consistent performance',
  'Develop leadership role within the team',
  'Master defensive zone coverage system',
  'Improve physical conditioning and endurance',
  'Enhance power play effectiveness',
  'Build confidence in game situations',
  'Strengthen fundamental skating skills'
];

export interface PlayerFeedbackFactoryOptions {
  playerId?: string;
  coachId?: string;
  feedbackType?: string;
  tone?: string;
  categories?: FeedbackCategory[];
  actionItemCount?: number;
  overallRating?: number;
  visibleToParents?: boolean;
  visibleToPlayer?: boolean;
  gameId?: string;
  practiceId?: string;
  followUpRequired?: boolean;
  priority?: 'High' | 'Medium' | 'Low';
  isPositive?: boolean;
}

export class PlayerFeedbackFactory {
  static create(options: PlayerFeedbackFactoryOptions = {}): PlayerFeedback {
    const feedbackType = options.feedbackType || getRandomElement(FEEDBACK_TYPES);
    const tone = options.tone || getRandomElement(FEEDBACK_TONES);
    const categories = options.categories || generateRandomElements(CATEGORIES, generateRandomRating(2, 5));
    const isPositive = options.isPositive ?? Math.random() > 0.3; // 70% positive by default
    
    const actionItemCount = options.actionItemCount || generateRandomRating(2, 6);
    const actionItems = this.generateActionItems(actionItemCount, categories);

    return {
      id: generateRandomId(),
      playerId: options.playerId || generateRandomId(),
      coachId: options.coachId || generateRandomId(),
      feedbackType,
      title: `${feedbackType} - ${generateRandomDate(-generateRandomRating(0, 7)).toLocaleDateString()}`,
      content: this.generateFeedbackContent(tone, isPositive, categories),
      tone,
      categories,
      overallRating: options.overallRating || generateRandomRating(6, 10),
      strengths: generateRandomElements(STRENGTHS_POOL, generateRandomRating(2, 5)),
      areasForImprovement: generateRandomElements(AREAS_FOR_IMPROVEMENT_POOL, generateRandomRating(2, 4)),
      seasonalGoals: generateRandomElements(SEASONAL_GOALS_POOL, generateRandomRating(3, 6)),
      actionItems,
      gameId: options.gameId || (feedbackType === 'Game Performance' ? generateRandomId() : null),
      practiceId: options.practiceId || (feedbackType === 'Practice Evaluation' ? generateRandomId() : null),
      date: generateRandomDate(-generateRandomRating(0, 14)),
      visibleToPlayer: options.visibleToPlayer ?? Math.random() > 0.1, // 90% visible to player
      visibleToParents: options.visibleToParents ?? Math.random() > 0.4, // 60% visible to parents
      followUpRequired: options.followUpRequired ?? Math.random() > 0.7, // 30% require follow-up
      followUpDate: options.followUpRequired !== false && Math.random() > 0.7 ? 
        generateRandomDate(generateRandomRating(7, 21)) : null,
      priority: options.priority || getRandomElement(['High', 'Medium', 'Medium', 'Low']), // Weighted toward Medium
      tags: this.generateTags(feedbackType, categories),
      confidential: Math.random() > 0.9, // 10% confidential
      lastUpdated: generateRandomDate(-generateRandomRating(0, 5)),
      acknowledgedByPlayer: Math.random() > 0.2,
      acknowledgedByParent: Math.random() > 0.4,
      acknowledgmentDate: Math.random() > 0.2 ? generateRandomDate(-generateRandomRating(0, 7)) : null
    };
  }

  static createMany(count: number, options: PlayerFeedbackFactoryOptions = {}): PlayerFeedback[] {
    return Array.from({ length: count }, () => this.create(options));
  }

  static createPositiveFeedback(overrides: PlayerFeedbackFactoryOptions = {}): PlayerFeedback {
    return this.create({
      tone: 'Positive',
      isPositive: true,
      overallRating: generateRandomRating(8, 10),
      visibleToParents: true,
      priority: getRandomElement(['Medium', 'Low']),
      ...overrides
    });
  }

  static createConstructiveFeedback(overrides: PlayerFeedbackFactoryOptions = {}): PlayerFeedback {
    return this.create({
      tone: 'Constructive',
      isPositive: false,
      overallRating: generateRandomRating(5, 7),
      followUpRequired: true,
      priority: getRandomElement(['High', 'Medium']),
      actionItemCount: generateRandomRating(4, 8),
      ...overrides
    });
  }

  static createGamePerformanceFeedback(overrides: PlayerFeedbackFactoryOptions = {}): PlayerFeedback {
    return this.create({
      feedbackType: 'Game Performance',
      gameId: generateRandomId(),
      categories: ['Technical Skills', 'Tactical Understanding', 'Mental Approach'],
      overallRating: generateRandomRating(6, 9),
      visibleToParents: true,
      ...overrides
    });
  }

  static createPracticeEvaluation(overrides: PlayerFeedbackFactoryOptions = {}): PlayerFeedback {
    return this.create({
      feedbackType: 'Practice Evaluation',
      practiceId: generateRandomId(),
      categories: ['Work Ethic', 'Technical Skills', 'Team Dynamics'],
      tone: getRandomElement(['Positive', 'Constructive', 'Encouraging']),
      ...overrides
    });
  }

  static createSeasonSummary(overrides: PlayerFeedbackFactoryOptions = {}): PlayerFeedback {
    return this.create({
      feedbackType: 'Season Summary',
      categories: generateRandomElements(CATEGORIES, 6), // More comprehensive
      actionItemCount: generateRandomRating(6, 12),
      visibleToParents: true,
      priority: 'High',
      followUpRequired: true,
      ...overrides
    });
  }

  static createLeadershipReview(overrides: PlayerFeedbackFactoryOptions = {}): PlayerFeedback {
    return this.create({
      feedbackType: 'Leadership Review',
      categories: ['Leadership', 'Team Dynamics', 'Character Development'],
      tone: getRandomElement(['Positive', 'Motivational']),
      overallRating: generateRandomRating(7, 10),
      ...overrides
    });
  }

  static createHighPriorityFeedback(overrides: PlayerFeedbackFactoryOptions = {}): PlayerFeedback {
    return this.create({
      priority: 'High',
      followUpRequired: true,
      tone: 'Constructive',
      actionItemCount: generateRandomRating(5, 10),
      followUpDate: generateRandomDate(generateRandomRating(3, 10)),
      ...overrides
    });
  }

  static createFeedbackSeries(playerId: string, count: number): PlayerFeedback[] {
    const feedbacks: PlayerFeedback[] = [];
    const feedbackTypes = ['Game Performance', 'Practice Evaluation', 'Skill Development'];
    
    for (let i = 0; i < count; i++) {
      const daysAgo = (count - i - 1) * 7; // Weekly feedback
      feedbacks.push(this.create({
        playerId,
        feedbackType: getRandomElement(feedbackTypes),
        date: generateRandomDate(-daysAgo),
        isPositive: Math.random() > 0.25 // 75% positive in series
      }));
    }
    
    return feedbacks;
  }

  static createProgressionFeedback(playerId: string, sessionCount: number): PlayerFeedback[] {
    const feedbacks: PlayerFeedback[] = [];
    let currentRating = generateRandomRating(5, 7); // Starting rating
    
    for (let i = 0; i < sessionCount; i++) {
      // Gradual improvement over time
      const improvement = Math.random() > 0.3 ? generateRandomRating(0, 1) : 0;
      currentRating = Math.min(10, currentRating + improvement);
      
      feedbacks.push(this.create({
        playerId,
        overallRating: currentRating,
        date: generateRandomDate(-((sessionCount - i - 1) * 10)), // Every 10 days
        isPositive: currentRating >= 7,
        tone: currentRating >= 8 ? 'Positive' : currentRating >= 6 ? 'Encouraging' : 'Constructive'
      }));
    }
    
    return feedbacks;
  }

  private static generateFeedbackContent(tone: string, isPositive: boolean, categories: FeedbackCategory[]): string {
    let content = '';
    const categoryFocus = getRandomElement(categories);
    
    // Opening based on tone and positivity
    if (isPositive) {
      content += getRandomElement(POSITIVE_FEEDBACK_TEMPLATES);
    } else {
      content += getRandomElement(CONSTRUCTIVE_FEEDBACK_TEMPLATES);
    }
    
    content += `\n\nSpecific focus on ${categoryFocus.toLowerCase()} has shown `;
    content += isPositive ? 'excellent progress' : 'areas that need attention';
    content += '. ';
    
    // Add tone-specific content
    if (tone === 'Motivational') {
      content += getRandomElement(MOTIVATIONAL_FEEDBACK_TEMPLATES);
    } else if (tone === 'Constructive') {
      content += 'With continued effort and focus on the identified areas, ';
      content += 'significant improvement can be achieved in the coming weeks.';
    } else if (tone === 'Positive') {
      content += 'Keep up the excellent work and maintain this level of performance.';
    }
    
    return content;
  }

  private static generateActionItems(count: number, categories: FeedbackCategory[]): ActionItem[] {
    const actionItems: ActionItem[] = [];
    
    for (let i = 0; i < count; i++) {
      const category = getRandomElement(categories);
      const dueDate = generateRandomDate(generateRandomRating(7, 30));
      
      actionItems.push({
        id: generateRandomId(),
        description: getRandomElement(ACTION_ITEM_TEMPLATES),
        category,
        priority: getRandomElement(['High', 'Medium', 'Low']),
        dueDate,
        completed: Math.random() > 0.6, // 40% completed
        completedDate: Math.random() > 0.6 ? generateRandomDate(-generateRandomRating(0, 14)) : null,
        assignedTo: getRandomElement(['Player', 'Coach', 'Parent', 'Skills Instructor']),
        notes: Math.random() > 0.5 ? 'Additional support and guidance provided as needed' : null,
        reminderSent: Math.random() > 0.7,
        lastReminderDate: Math.random() > 0.7 ? generateRandomDate(-generateRandomRating(1, 7)) : null
      });
    }
    
    return actionItems;
  }

  private static generateTags(feedbackType: string, categories: FeedbackCategory[]): string[] {
    const baseTags = [feedbackType.replace(' ', '-').toLowerCase()];
    
    // Add category-based tags
    categories.forEach(category => {
      baseTags.push(category.replace(' ', '-').toLowerCase());
    });
    
    // Add contextual tags
    const contextualTags = [
      'development', 'progress', 'improvement', 'goals', 'performance',
      'skills', 'attitude', 'teamwork', 'individual', 'coaching-notes'
    ];
    
    baseTags.push(...generateRandomElements(contextualTags, generateRandomRating(2, 4)));
    
    return Array.from(new Set(baseTags)); // Remove duplicates
  }
}