import { VideoAnalysis, VideoClip, PerformanceData, TeamAnalysis } from '../../entities/VideoAnalysis';

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

function generateRandomFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

// Data pools for random generation
const ANALYSIS_TYPES = ['Game', 'Practice', 'Skills', 'Tactical', 'Individual', 'Team'];

const VIDEO_SOURCES = [
  'Game Recording', 'Practice Session', 'Skills Training', 'Scrimmage',
  'Dryland Training', 'Power Play Practice', 'Penalty Kill Drill'
];

const CLIP_TYPES = [
  'Goal', 'Assist', 'Save', 'Hit', 'Turnover', 'Breakout', 'Forechecking',
  'Power Play', 'Penalty Kill', 'Face-off', 'Defensive Zone Coverage'
];

const PERFORMANCE_METRICS = [
  'Shot Accuracy', 'Passing Completion', 'Skating Speed', 'Body Positioning',
  'Decision Making', 'Puck Handling', 'Defensive Coverage', 'Transition Speed'
];

const STRENGTHS = [
  'Excellent skating technique',
  'Strong puck handling skills',
  'Good defensive positioning',
  'Effective passing under pressure',
  'Quick decision making',
  'Strong physical play',
  'Good anticipation',
  'Consistent shot accuracy'
];

const AREAS_FOR_IMPROVEMENT = [
  'Needs to improve shot selection',
  'Could work on defensive positioning',
  'Should increase skating speed',
  'Needs better puck protection',
  'Could improve passing accuracy',
  'Should work on body positioning',
  'Needs to be more aggressive on forechecking',
  'Could improve reaction time'
];

const RECOMMENDATIONS = [
  'Focus on skating drills during practice',
  'Practice shooting from different angles',
  'Work on defensive positioning drills',
  'Increase cardio training for endurance',
  'Practice puck handling under pressure',
  'Study game footage regularly',
  'Work on power play positioning',
  'Focus on quick decision-making exercises'
];

const TAG_CATEGORIES = [
  'Technical', 'Tactical', 'Physical', 'Mental', 'Team Play', 'Individual',
  'Offensive', 'Defensive', 'Special Teams', 'Transition'
];

export interface VideoAnalysisFactoryOptions {
  playerId?: string;
  coachId?: string;
  analysisType?: string;
  videoSource?: string;
  sessionDate?: Date;
  clipCount?: number;
  teamAnalysisIncluded?: boolean;
  performanceDataIncluded?: boolean;
  tags?: string[];
  overallRating?: number;
  analysisCompleted?: boolean;
  gameId?: string;
  opponentTeam?: string;
}

export class VideoAnalysisFactory {
  static create(options: VideoAnalysisFactoryOptions = {}): VideoAnalysis {
    const sessionDate = options.sessionDate || generateRandomDate(-generateRandomRating(1, 30));
    const analysisType = options.analysisType || getRandomElement(ANALYSIS_TYPES);
    const clipCount = options.clipCount || generateRandomRating(3, 15);
    
    const clips = this.generateVideoClips(clipCount, analysisType);
    const performanceData = options.performanceDataIncluded !== false ? 
      this.generatePerformanceData(clips) : null;
    const teamAnalysis = options.teamAnalysisIncluded === true ? 
      this.generateTeamAnalysis() : null;

    return {
      id: generateRandomId(),
      playerId: options.playerId || generateRandomId(),
      coachId: options.coachId || generateRandomId(),
      analysisType,
      title: `${analysisType} Analysis - ${sessionDate.toLocaleDateString()}`,
      description: `Comprehensive video analysis focusing on ${analysisType.toLowerCase()} performance`,
      videoSource: options.videoSource || getRandomElement(VIDEO_SOURCES),
      sessionDate,
      gameId: options.gameId || (analysisType === 'Game' ? generateRandomId() : null),
      opponentTeam: options.opponentTeam || (analysisType === 'Game' ? `Team ${generateRandomRating(1, 30)}` : null),
      totalDuration: clips.reduce((sum, clip) => sum + clip.duration, 0),
      videoClips: clips,
      performanceData,
      teamAnalysis,
      overallRating: options.overallRating || generateRandomRating(5, 10),
      strengths: generateRandomElements(STRENGTHS, generateRandomRating(2, 4)),
      areasForImprovement: generateRandomElements(AREAS_FOR_IMPROVEMENT, generateRandomRating(2, 5)),
      recommendations: generateRandomElements(RECOMMENDATIONS, generateRandomRating(3, 6)),
      tags: options.tags || generateRandomElements(TAG_CATEGORIES, generateRandomRating(3, 7)),
      analysisCompleted: options.analysisCompleted ?? Math.random() > 0.2,
      analysisDate: generateRandomDate(-generateRandomRating(0, 7)),
      lastUpdated: generateRandomDate(-generateRandomRating(0, 3)),
      sharedWithPlayer: Math.random() > 0.3,
      sharedWithParents: Math.random() > 0.5,
      notes: this.generateAnalysisNotes(analysisType),
      keyTakeaways: this.generateKeyTakeaways()
    };
  }

  static createMany(count: number, options: VideoAnalysisFactoryOptions = {}): VideoAnalysis[] {
    return Array.from({ length: count }, () => this.create(options));
  }

  static createGameAnalysis(overrides: VideoAnalysisFactoryOptions = {}): VideoAnalysis {
    return this.create({
      analysisType: 'Game',
      videoSource: 'Game Recording',
      gameId: generateRandomId(),
      opponentTeam: `Team ${generateRandomRating(1, 30)}`,
      clipCount: generateRandomRating(8, 20),
      teamAnalysisIncluded: true,
      performanceDataIncluded: true,
      ...overrides
    });
  }

  static createPracticeAnalysis(overrides: VideoAnalysisFactoryOptions = {}): VideoAnalysis {
    return this.create({
      analysisType: 'Practice',
      videoSource: 'Practice Session',
      clipCount: generateRandomRating(5, 12),
      tags: ['Technical', 'Skills', 'Individual'],
      ...overrides
    });
  }

  static createSkillsAnalysis(overrides: VideoAnalysisFactoryOptions = {}): VideoAnalysis {
    return this.create({
      analysisType: 'Skills',
      videoSource: 'Skills Training',
      clipCount: generateRandomRating(3, 8),
      tags: ['Technical', 'Individual', 'Offensive'],
      performanceDataIncluded: true,
      ...overrides
    });
  }

  static createTacticalAnalysis(overrides: VideoAnalysisFactoryOptions = {}): VideoAnalysis {
    return this.create({
      analysisType: 'Tactical',
      videoSource: getRandomElement(['Game Recording', 'Practice Session']),
      clipCount: generateRandomRating(6, 15),
      tags: ['Tactical', 'Team Play', 'Positioning'],
      teamAnalysisIncluded: true,
      ...overrides
    });
  }

  static createComprehensiveAnalysis(overrides: VideoAnalysisFactoryOptions = {}): VideoAnalysis {
    return this.create({
      clipCount: generateRandomRating(15, 30),
      teamAnalysisIncluded: true,
      performanceDataIncluded: true,
      tags: generateRandomElements(TAG_CATEGORIES, 8),
      analysisCompleted: true,
      ...overrides
    });
  }

  static createSeriesForPlayer(playerId: string, count: number): VideoAnalysis[] {
    const analyses: VideoAnalysis[] = [];
    const analysisTypes = ['Game', 'Practice', 'Skills'];
    
    for (let i = 0; i < count; i++) {
      const sessionDate = generateRandomDate(-((count - i - 1) * 7)); // Weekly intervals
      analyses.push(this.create({
        playerId,
        analysisType: getRandomElement(analysisTypes),
        sessionDate,
        analysisCompleted: true
      }));
    }
    
    return analyses;
  }

  private static generateVideoClips(count: number, analysisType: string): VideoClip[] {
    const clips: VideoClip[] = [];
    
    for (let i = 0; i < count; i++) {
      const clipType = this.getRelevantClipType(analysisType);
      const startTime = generateRandomRating(0, 3600); // Random time in game/practice
      const duration = generateRandomRating(10, 180); // 10 seconds to 3 minutes
      
      clips.push({
        id: generateRandomId(),
        title: `${clipType} - Clip ${i + 1}`,
        description: `Analysis of ${clipType.toLowerCase()} technique and execution`,
        clipType,
        startTime,
        endTime: startTime + duration,
        duration,
        timestampNotes: this.generateTimestampNotes(),
        quality: getRandomElement(['Excellent', 'Good', 'Average', 'Needs Work']),
        keyPoints: generateRandomElements([
          'Good body positioning',
          'Quick decision making',
          'Effective technique',
          'Room for improvement in timing',
          'Excellent execution under pressure',
          'Could improve follow-through'
        ], generateRandomRating(2, 4)),
        tags: generateRandomElements(TAG_CATEGORIES, generateRandomRating(2, 5))
      });
    }
    
    return clips;
  }

  private static generatePerformanceData(clips: VideoClip[]): PerformanceData {
    const metricCount = generateRandomRating(4, 8);
    const metrics: Record<string, number> = {};
    
    generateRandomElements(PERFORMANCE_METRICS, metricCount).forEach(metric => {
      metrics[metric] = generateRandomFloat(0, 100);
    });

    return {
      id: generateRandomId(),
      sessionMetrics: metrics,
      comparisonToPrevious: {
        improvementPercentage: generateRandomFloat(-20, 25),
        keyChanges: generateRandomElements([
          'Increased shot accuracy',
          'Better positioning',
          'Improved decision making',
          'Faster reaction time',
          'More consistent technique'
        ], generateRandomRating(2, 4))
      },
      benchmarkComparison: {
        percentileRank: generateRandomRating(25, 95),
        comparedToGroup: getRandomElement(['Team', 'Age Group', 'Position', 'League']),
        strengths: generateRandomElements(PERFORMANCE_METRICS, generateRandomRating(2, 3)),
        weaknesses: generateRandomElements(PERFORMANCE_METRICS, generateRandomRating(1, 3))
      },
      detailedStats: this.generateDetailedStats(clips),
      progressTrend: getRandomElement(['Improving', 'Stable', 'Declining', 'Inconsistent'])
    };
  }

  private static generateTeamAnalysis(): TeamAnalysis {
    return {
      id: generateRandomId(),
      formations: generateRandomElements([
        '1-2-2', '1-3-1', '2-1-2', 'Box+1', 'Diamond'
      ], generateRandomRating(2, 4)),
      linemates: Array.from({ length: generateRandomRating(2, 5) }, () => ({
        playerId: generateRandomId(),
        name: `Player ${generateRandomRating(1, 99)}`,
        chemistry: generateRandomFloat(0, 10),
        effectiveShifts: generateRandomRating(5, 25)
      })),
      systemEffectiveness: {
        powerPlay: generateRandomFloat(0, 100),
        penaltyKill: generateRandomFloat(0, 100),
        evenStrength: generateRandomFloat(0, 100),
        faceoffs: generateRandomFloat(0, 100)
      },
      strategicInsights: generateRandomElements([
        'Strong defensive zone coverage',
        'Effective breakout patterns',
        'Good puck movement on power play',
        'Needs improvement on penalty kill',
        'Excellent forechecking pressure',
        'Could improve neutral zone play'
      ], generateRandomRating(3, 6)),
      teamRoleAssessment: getRandomElement([
        'Key Player', 'Role Player', 'Developing Player', 'Specialist', 'Utility Player'
      ])
    };
  }

  private static generateAnalysisNotes(analysisType: string): string[] {
    const typeSpecificNotes: Record<string, string[]> = {
      'Game': [
        'Performed well under game pressure',
        'Made good decisions in critical moments',
        'Showed improvement from previous game',
        'Needs to work on consistency throughout the game'
      ],
      'Practice': [
        'Demonstrated good work ethic in practice',
        'Showed improvement in drill execution',
        'Needs to maintain focus throughout practice',
        'Good attitude and coachability displayed'
      ],
      'Skills': [
        'Technical execution showing improvement',
        'Consistent form in fundamental skills',
        'Needs more repetitions for muscle memory',
        'Good progression from previous sessions'
      ]
    };

    const specificNotes = typeSpecificNotes[analysisType] || typeSpecificNotes['Practice'];
    return generateRandomElements(specificNotes, generateRandomRating(2, 4));
  }

  private static generateKeyTakeaways(): string[] {
    const takeaways = [
      'Continue focusing on fundamental techniques',
      'Maintain current training intensity',
      'Work on specific areas identified in analysis',
      'Build on strengths while addressing weaknesses',
      'Regular video review sessions recommended',
      'Track progress over next few sessions'
    ];

    return generateRandomElements(takeaways, generateRandomRating(3, 5));
  }

  private static generateTimestampNotes(): Array<{ timestamp: number; note: string }> {
    const noteCount = generateRandomRating(2, 6);
    const notes: Array<{ timestamp: number; note: string }> = [];
    
    const noteTemplates = [
      'Good technique displayed here',
      'Opportunity for improvement',
      'Excellent decision making',
      'Could improve timing',
      'Strong execution under pressure',
      'Room for better positioning'
    ];

    for (let i = 0; i < noteCount; i++) {
      notes.push({
        timestamp: generateRandomRating(5, 120),
        note: getRandomElement(noteTemplates)
      });
    }

    return notes.sort((a, b) => a.timestamp - b.timestamp);
  }

  private static generateDetailedStats(clips: VideoClip[]): Record<string, any> {
    return {
      totalClips: clips.length,
      clipsByType: clips.reduce((acc, clip) => {
        acc[clip.clipType] = (acc[clip.clipType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageClipDuration: clips.reduce((sum, clip) => sum + clip.duration, 0) / clips.length,
      qualityDistribution: clips.reduce((acc, clip) => {
        acc[clip.quality] = (acc[clip.quality] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      analysisDepth: getRandomElement(['Basic', 'Intermediate', 'Advanced', 'Expert']),
      focusAreas: generateRandomElements(PERFORMANCE_METRICS, generateRandomRating(3, 6))
    };
  }

  private static getRelevantClipType(analysisType: string): string {
    const typeMapping: Record<string, string[]> = {
      'Game': ['Goal', 'Assist', 'Save', 'Hit', 'Turnover'],
      'Practice': ['Breakout', 'Forechecking', 'Power Play', 'Penalty Kill'],
      'Skills': ['Shot Accuracy', 'Puck Handling', 'Skating', 'Passing'],
      'Tactical': ['Defensive Zone Coverage', 'Power Play', 'Penalty Kill', 'Face-off']
    };

    const relevantTypes = typeMapping[analysisType] || CLIP_TYPES;
    return getRandomElement(relevantTypes);
  }
}