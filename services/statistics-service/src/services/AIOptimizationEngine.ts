import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PlayerPerformanceStats } from '../entities/PlayerPerformanceStats';
import { TeamAnalytics } from '../entities/TeamAnalytics';
import { WorkoutAnalytics } from '../entities/WorkoutAnalytics';

export interface OptimizationRecommendation {
  id: string;
  type: 'workout' | 'exercise' | 'schedule' | 'load' | 'recovery';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  confidence: number; // 0-100
  expectedImprovement: number; // percentage
  timeToEffect: string; // e.g., "2-3 weeks"
  implementationDifficulty: 'easy' | 'moderate' | 'complex';
  targetPlayers?: string[];
  targetTeams?: string[];
  currentValue?: number;
  targetValue?: number;
  metrics: string[];
  evidence: OptimizationEvidence[];
  actionItems: OptimizationAction[];
  relatedRecommendations?: string[];
  categories: string[];
  estimatedROI: number;
  riskLevel: 'low' | 'medium' | 'high';
  prerequisites?: string[];
  contraindications?: string[];
}

export interface OptimizationEvidence {
  type: 'performance_trend' | 'injury_risk' | 'fatigue_pattern' | 'peer_comparison' | 'research_data';
  description: string;
  strength: number; // 0-100
  data: Record<string, any>;
}

export interface OptimizationAction {
  id: string;
  description: string;
  category: 'immediate' | 'short_term' | 'long_term';
  estimatedTime: string;
  difficulty: 'easy' | 'moderate' | 'complex';
  dependencies?: string[];
}

export interface PerformanceContext {
  playerId?: string;
  teamId?: string;
  position?: string;
  age?: number;
  experience?: string;
  injuryHistory?: string[];
  currentGoals?: string[];
  seasonPhase?: 'preseason' | 'regular' | 'playoffs' | 'offseason';
  trainingHistory?: TrainingHistoryData[];
  performanceMetrics?: PerformanceMetricsData;
  workloadData?: WorkloadData;
  recoveryMetrics?: RecoveryData;
}

export interface TrainingHistoryData {
  date: Date;
  workoutType: string;
  duration: number;
  intensity: number;
  volume: number;
  exercises: ExerciseData[];
  rpe: number;
  mood: number;
  fatigue: number;
}

export interface ExerciseData {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  distance?: number;
  intensity?: number;
}

export interface PerformanceMetricsData {
  strength: Record<string, number>;
  endurance: Record<string, number>;
  speed: Record<string, number>;
  agility: Record<string, number>;
  power: Record<string, number>;
  trends: Record<string, number[]>;
}

export interface WorkloadData {
  weeklyVolume: number;
  intensity: number;
  frequency: number;
  monotony: number;
  strain: number;
  acuteLoad: number;
  chronicLoad: number;
  acuteChronicRatio: number;
}

export interface RecoveryData {
  sleepQuality: number;
  restHeartRate: number;
  hrv: number;
  perceivedRecovery: number;
  soreness: number;
  stress: number;
  nutrition: number;
  hydration: number;
}

@Injectable()
export class AIOptimizationEngine {
  constructor(
    @InjectRepository(PlayerPerformanceStats)
    private readonly playerPerformanceRepository: Repository<PlayerPerformanceStats>,
    @InjectRepository(TeamAnalytics)
    private readonly teamAnalyticsRepository: Repository<TeamAnalytics>,
    @InjectRepository(WorkoutAnalytics)
    private readonly workoutAnalyticsRepository: Repository<WorkoutAnalytics>
  ) {}

  async generateOptimizationRecommendations(
    context: PerformanceContext
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze different aspects and generate recommendations
    const workoutOptimizations = await this.analyzeWorkoutOptimization(context);
    const loadOptimizations = await this.analyzeLoadOptimization(context);
    const recoveryOptimizations = await this.analyzeRecoveryOptimization(context);
    const exerciseOptimizations = await this.analyzeExerciseOptimization(context);
    const scheduleOptimizations = await this.analyzeScheduleOptimization(context);

    recommendations.push(
      ...workoutOptimizations,
      ...loadOptimizations,
      ...recoveryOptimizations,
      ...exerciseOptimizations,
      ...scheduleOptimizations
    );

    // Sort by priority and confidence
    return recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.confidence - a.confidence;
    }).slice(0, 20); // Return top 20 recommendations
  }

  private async analyzeWorkoutOptimization(
    context: PerformanceContext
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    if (!context.trainingHistory || context.trainingHistory.length === 0) {
      return recommendations;
    }

    // Analyze workout variety
    const workoutTypes = new Set(context.trainingHistory.map(w => w.workoutType));
    if (workoutTypes.size < 3) {
      recommendations.push({
        id: 'workout-variety-001',
        type: 'workout',
        priority: 'medium',
        title: 'Increase Workout Variety',
        description: 'Add more diverse workout types to prevent adaptation plateaus',
        reasoning: 'Current training shows limited variety which can lead to stagnation',
        confidence: 78,
        expectedImprovement: 15,
        timeToEffect: '3-4 weeks',
        implementationDifficulty: 'easy',
        currentValue: workoutTypes.size,
        targetValue: 4,
        metrics: ['strength_improvement', 'endurance_gain', 'skill_development'],
        evidence: [
          {
            type: 'performance_trend',
            description: 'Performance plateauing in recent weeks',
            strength: 75,
            data: { plateauDuration: 3 }
          }
        ],
        actionItems: [
          {
            id: 'add-agility',
            description: 'Add 1 agility workout per week',
            category: 'immediate',
            estimatedTime: '30 minutes',
            difficulty: 'easy'
          },
          {
            id: 'add-conditioning',
            description: 'Incorporate conditioning intervals',
            category: 'short_term',
            estimatedTime: '45 minutes',
            difficulty: 'moderate'
          }
        ],
        categories: ['training_variety', 'adaptation'],
        estimatedROI: 120,
        riskLevel: 'low'
      });
    }

    // Analyze workout intensity distribution
    const intensities = context.trainingHistory.map(w => w.intensity);
    const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    
    if (avgIntensity > 85) {
      recommendations.push({
        id: 'intensity-balance-001',
        type: 'workout',
        priority: 'high',
        title: 'Reduce Training Intensity',
        description: 'High average intensity increases injury risk and burnout',
        reasoning: 'Sustained high intensity training can lead to overtraining syndrome',
        confidence: 85,
        expectedImprovement: 25,
        timeToEffect: '2-3 weeks',
        implementationDifficulty: 'moderate',
        currentValue: avgIntensity,
        targetValue: 75,
        metrics: ['injury_prevention', 'recovery_improvement', 'consistency'],
        evidence: [
          {
            type: 'fatigue_pattern',
            description: 'Elevated fatigue markers detected',
            strength: 82,
            data: { avgFatigue: 7.2, threshold: 6.0 }
          }
        ],
        actionItems: [
          {
            id: 'add-recovery-days',
            description: 'Add 1 additional recovery day per week',
            category: 'immediate',
            estimatedTime: 'N/A',
            difficulty: 'easy'
          },
          {
            id: 'reduce-volume',
            description: 'Reduce training volume by 20%',
            category: 'immediate',
            estimatedTime: 'N/A',
            difficulty: 'moderate'
          }
        ],
        categories: ['intensity_management', 'injury_prevention'],
        estimatedROI: 180,
        riskLevel: 'medium'
      });
    }

    return recommendations;
  }

  private async analyzeLoadOptimization(
    context: PerformanceContext
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    if (!context.workloadData) {
      return recommendations;
    }

    const { acuteChronicRatio, monotony, strain } = context.workloadData;

    // Analyze acute:chronic ratio
    if (acuteChronicRatio > 1.5) {
      recommendations.push({
        id: 'load-management-001',
        type: 'load',
        priority: 'high',
        title: 'Reduce Acute Training Load',
        description: 'High acute:chronic ratio significantly increases injury risk',
        reasoning: 'A/C ratio above 1.5 is associated with 2-3x higher injury risk',
        confidence: 92,
        expectedImprovement: 35,
        timeToEffect: '1-2 weeks',
        implementationDifficulty: 'moderate',
        currentValue: acuteChronicRatio,
        targetValue: 1.2,
        metrics: ['injury_prevention', 'training_consistency'],
        evidence: [
          {
            type: 'injury_risk',
            description: 'Elevated injury risk based on load progression',
            strength: 88,
            data: { riskMultiplier: 2.3 }
          }
        ],
        actionItems: [
          {
            id: 'reduce-weekly-volume',
            description: 'Reduce this week\'s training volume by 25%',
            category: 'immediate',
            estimatedTime: 'N/A',
            difficulty: 'easy'
          },
          {
            id: 'gradual-progression',
            description: 'Implement 10% weekly load increases',
            category: 'long_term',
            estimatedTime: 'Ongoing',
            difficulty: 'moderate'
          }
        ],
        categories: ['load_management', 'injury_prevention'],
        estimatedROI: 200,
        riskLevel: 'high'
      });
    }

    // Analyze training monotony
    if (monotony > 2.5) {
      recommendations.push({
        id: 'monotony-reduction-001',
        type: 'schedule',
        priority: 'medium',
        title: 'Increase Training Variability',
        description: 'High training monotony reduces adaptation and increases fatigue',
        reasoning: 'Monotony above 2.5 indicates insufficient training variation',
        confidence: 76,
        expectedImprovement: 18,
        timeToEffect: '2-3 weeks',
        implementationDifficulty: 'moderate',
        currentValue: monotony,
        targetValue: 2.0,
        metrics: ['adaptation_rate', 'motivation', 'fatigue_reduction'],
        evidence: [
          {
            type: 'fatigue_pattern',
            description: 'Monotonous training pattern detected',
            strength: 73,
            data: { variationScore: 0.3 }
          }
        ],
        actionItems: [
          {
            id: 'vary-intensities',
            description: 'Alternate between high/moderate/low intensity days',
            category: 'immediate',
            estimatedTime: '15 minutes planning',
            difficulty: 'easy'
          },
          {
            id: 'periodize-training',
            description: 'Implement block periodization',
            category: 'long_term',
            estimatedTime: '2 hours planning',
            difficulty: 'complex'
          }
        ],
        categories: ['periodization', 'adaptation'],
        estimatedROI: 140,
        riskLevel: 'low'
      });
    }

    return recommendations;
  }

  private async analyzeRecoveryOptimization(
    context: PerformanceContext
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    if (!context.recoveryMetrics) {
      return recommendations;
    }

    const { sleepQuality, perceivedRecovery, soreness, stress } = context.recoveryMetrics;

    // Analyze sleep quality
    if (sleepQuality < 6) {
      recommendations.push({
        id: 'recovery-sleep-001',
        type: 'recovery',
        priority: 'high',
        title: 'Improve Sleep Quality',
        description: 'Poor sleep quality significantly impacts recovery and performance',
        reasoning: 'Sleep quality below 6/10 impairs protein synthesis and hormone production',
        confidence: 89,
        expectedImprovement: 30,
        timeToEffect: '1-2 weeks',
        implementationDifficulty: 'moderate',
        currentValue: sleepQuality,
        targetValue: 7.5,
        metrics: ['recovery_rate', 'performance_consistency', 'mood'],
        evidence: [
          {
            type: 'performance_trend',
            description: 'Performance decline correlates with poor sleep',
            strength: 84,
            data: { correlation: -0.72 }
          }
        ],
        actionItems: [
          {
            id: 'sleep-hygiene',
            description: 'Implement sleep hygiene protocol',
            category: 'immediate',
            estimatedTime: '30 minutes education',
            difficulty: 'easy'
          },
          {
            id: 'recovery-tracking',
            description: 'Monitor sleep patterns with wearable device',
            category: 'short_term',
            estimatedTime: '1 hour setup',
            difficulty: 'easy'
          }
        ],
        categories: ['sleep_optimization', 'recovery'],
        estimatedROI: 160,
        riskLevel: 'low'
      });
    }

    // Analyze stress levels
    if (stress > 7) {
      recommendations.push({
        id: 'stress-management-001',
        type: 'recovery',
        priority: 'medium',
        title: 'Implement Stress Management',
        description: 'High stress levels interfere with training adaptations',
        reasoning: 'Chronic stress elevates cortisol and impairs recovery',
        confidence: 81,
        expectedImprovement: 22,
        timeToEffect: '2-4 weeks',
        implementationDifficulty: 'moderate',
        currentValue: stress,
        targetValue: 5,
        metrics: ['recovery_quality', 'training_readiness', 'consistency'],
        evidence: [
          {
            type: 'fatigue_pattern',
            description: 'High stress correlates with poor recovery',
            strength: 79,
            data: { stressRecoveryCorrelation: -0.68 }
          }
        ],
        actionItems: [
          {
            id: 'breathing-exercises',
            description: 'Add 10 minutes daily breathing exercises',
            category: 'immediate',
            estimatedTime: '10 minutes daily',
            difficulty: 'easy'
          },
          {
            id: 'meditation-program',
            description: 'Implement mindfulness meditation program',
            category: 'short_term',
            estimatedTime: '20 minutes daily',
            difficulty: 'moderate'
          }
        ],
        categories: ['stress_management', 'mental_health'],
        estimatedROI: 135,
        riskLevel: 'low'
      });
    }

    return recommendations;
  }

  private async analyzeExerciseOptimization(
    context: PerformanceContext
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    if (!context.trainingHistory || !context.performanceMetrics) {
      return recommendations;
    }

    // Analyze exercise selection based on performance gaps
    const strengthMetrics = context.performanceMetrics.strength;
    const weakestAreas = Object.entries(strengthMetrics)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 3)
      .map(([area]) => area);

    if (weakestAreas.length > 0) {
      recommendations.push({
        id: 'exercise-selection-001',
        type: 'exercise',
        priority: 'medium',
        title: 'Target Weakness Areas',
        description: `Focus on improving ${weakestAreas.join(', ')} performance`,
        reasoning: 'Addressing weakest areas provides greatest performance gains',
        confidence: 83,
        expectedImprovement: 20,
        timeToEffect: '4-6 weeks',
        implementationDifficulty: 'moderate',
        metrics: ['strength_balance', 'injury_prevention', 'performance'],
        evidence: [
          {
            type: 'performance_trend',
            description: 'Identified strength imbalances',
            strength: 80,
            data: { weaknesses: weakestAreas }
          }
        ],
        actionItems: [
          {
            id: 'specific-exercises',
            description: `Add 2-3 exercises targeting ${weakestAreas[0]}`,
            category: 'immediate',
            estimatedTime: '15 minutes per session',
            difficulty: 'easy'
          },
          {
            id: 'progression-plan',
            description: 'Create 6-week progression plan',
            category: 'short_term',
            estimatedTime: '1 hour planning',
            difficulty: 'moderate'
          }
        ],
        categories: ['exercise_selection', 'strength_development'],
        estimatedROI: 150,
        riskLevel: 'low'
      });
    }

    return recommendations;
  }

  private async analyzeScheduleOptimization(
    context: PerformanceContext
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    if (!context.trainingHistory) {
      return recommendations;
    }

    // Analyze training frequency
    const weeklyFrequency = context.trainingHistory.length / 4; // Assuming 4 weeks of data
    
    if (weeklyFrequency > 6) {
      recommendations.push({
        id: 'schedule-frequency-001',
        type: 'schedule',
        priority: 'medium',
        title: 'Optimize Training Frequency',
        description: 'High training frequency may be limiting recovery',
        reasoning: 'More than 6 sessions per week increases overtraining risk',
        confidence: 74,
        expectedImprovement: 15,
        timeToEffect: '2-3 weeks',
        implementationDifficulty: 'easy',
        currentValue: weeklyFrequency,
        targetValue: 5,
        metrics: ['recovery_quality', 'training_quality', 'consistency'],
        evidence: [
          {
            type: 'fatigue_pattern',
            description: 'High frequency correlates with elevated fatigue',
            strength: 71,
            data: { frequencyFatigueCorrelation: 0.65 }
          }
        ],
        actionItems: [
          {
            id: 'add-rest-day',
            description: 'Add one additional rest day per week',
            category: 'immediate',
            estimatedTime: 'N/A',
            difficulty: 'easy'
          },
          {
            id: 'quality-focus',
            description: 'Focus on session quality over quantity',
            category: 'short_term',
            estimatedTime: 'Ongoing',
            difficulty: 'moderate'
          }
        ],
        categories: ['frequency_optimization', 'recovery'],
        estimatedROI: 125,
        riskLevel: 'low'
      });
    }

    return recommendations;
  }

  async calculateConfidenceScore(
    evidence: OptimizationEvidence[],
    context: PerformanceContext
  ): Promise<number> {
    if (evidence.length === 0) return 50; // Default confidence

    const evidenceStrength = evidence.reduce((sum, e) => sum + e.strength, 0) / evidence.length;
    const evidenceCount = Math.min(evidence.length / 3, 1); // Cap at 3 pieces of evidence
    const contextCompleteness = this.calculateContextCompleteness(context);

    return Math.round(evidenceStrength * 0.6 + evidenceCount * 20 + contextCompleteness * 20);
  }

  private calculateContextCompleteness(context: PerformanceContext): number {
    const fields = [
      'trainingHistory',
      'performanceMetrics',
      'workloadData',
      'recoveryMetrics'
    ];

    const completedFields = fields.filter(field => 
      context[field as keyof PerformanceContext] !== undefined
    ).length;

    return completedFields / fields.length;
  }
}