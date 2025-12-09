import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkoutAnalytics } from '../entities/WorkoutAnalytics';
import { PlayerPerformanceStats } from '../entities/PlayerPerformanceStats';

export interface WorkoutOptimizationSuggestion {
  id: string;
  workoutId: string;
  category: 'duration' | 'intensity' | 'exercise_order' | 'rest_periods' | 'volume' | 'progression';
  title: string;
  description: string;
  currentValue: string | number;
  suggestedValue: string | number;
  reasoning: string;
  confidence: number;
  expectedImprovement: string;
  evidenceType: 'data_driven' | 'research_based' | 'performance_pattern' | 'fatigue_analysis';
  implementationComplexity: 'low' | 'medium' | 'high';
  safetyRating: number; // 1-10
  applicablePlayerTypes: string[];
  seasonPhase: string[];
  prerequisites: string[];
  alternatives: WorkoutAlternative[];
  metrics: OptimizationMetrics;
}

export interface WorkoutAlternative {
  description: string;
  pros: string[];
  cons: string[];
  applicability: string;
}

export interface OptimizationMetrics {
  currentEffectiveness: number;
  predictedEffectiveness: number;
  fatigueScore: number;
  adaptationPotential: number;
  injuryRisk: number;
  timeEfficiency: number;
}

export interface ExerciseOptimization {
  exerciseId: string;
  exerciseName: string;
  currentPosition: number;
  suggestedPosition: number;
  reasoning: string;
  energySystemImpact: 'aerobic' | 'anaerobic_power' | 'anaerobic_capacity' | 'neuromuscular';
  fatigueImpact: number; // 1-10
  skillComplexity: number; // 1-10
  optimalPlacement: 'early' | 'middle' | 'late' | 'finisher';
}

export interface RestPeriodOptimization {
  exerciseId: string;
  currentRest: number; // seconds
  suggestedRest: number; // seconds
  reasoning: string;
  energySystemRecovery: {
    phosphocreatine: number; // % recovery
    lactate: number; // % clearance
    neuromuscular: number; // % recovery
  };
  goalAlignment: string;
}

export interface VolumeOptimization {
  metric: 'sets' | 'reps' | 'load' | 'total_volume';
  currentValue: number;
  suggestedValue: number;
  reasoning: string;
  progressionType: 'linear' | 'undulating' | 'block' | 'autoregulation';
  deloadRecommendation: {
    frequency: string;
    reduction: number; // percentage
    duration: string;
  };
}

export interface ProgressionOptimization {
  type: 'load' | 'volume' | 'intensity' | 'complexity';
  currentProgression: string;
  suggestedProgression: string;
  timeline: string;
  markers: ProgressionMarker[];
  autoregulationRules: AutoregulationRule[];
}

export interface ProgressionMarker {
  metric: string;
  currentValue: number;
  targetValue: number;
  timeframe: string;
  milestone: string;
}

export interface AutoregulationRule {
  condition: string;
  action: string;
  reasoning: string;
}

@Injectable()
export class WorkoutOptimizationService {
  constructor(
    @InjectRepository(WorkoutAnalytics)
    private readonly workoutAnalyticsRepository: Repository<WorkoutAnalytics>,
    @InjectRepository(PlayerPerformanceStats)
    private readonly playerPerformanceRepository: Repository<PlayerPerformanceStats>
  ) {}

  async optimizeWorkout(
    workoutId: string,
    playerId: string,
    context: {
      goals: string[];
      constraints: string[];
      availableTime: number;
      equipment: string[];
      injuryHistory: string[];
      currentFitness: Record<string, number>;
      seasonPhase: string;
    }
  ): Promise<WorkoutOptimizationSuggestion[]> {
    const suggestions: WorkoutOptimizationSuggestion[] = [];

    // Get workout analytics and player performance data
    const workoutData = await this.getWorkoutAnalytics(workoutId);
    const playerData = await this.getPlayerPerformanceData(playerId);

    // Generate optimization suggestions
    const durationOptimizations = await this.optimizeDuration(workoutData, context);
    const intensityOptimizations = await this.optimizeIntensity(workoutData, playerData, context);
    const exerciseOrderOptimizations = await this.optimizeExerciseOrder(workoutData, context);
    const restPeriodOptimizations = await this.optimizeRestPeriods(workoutData, context);
    const volumeOptimizations = await this.optimizeVolume(workoutData, playerData, context);
    const progressionOptimizations = await this.optimizeProgression(workoutData, playerData, context);

    suggestions.push(
      ...durationOptimizations,
      ...intensityOptimizations,
      ...exerciseOrderOptimizations,
      ...restPeriodOptimizations,
      ...volumeOptimizations,
      ...progressionOptimizations
    );

    // Sort by potential impact and confidence
    return suggestions.sort((a, b) => {
      const aScore = a.confidence * parseFloat(a.expectedImprovement.replace('%', ''));
      const bScore = b.confidence * parseFloat(b.expectedImprovement.replace('%', ''));
      return bScore - aScore;
    });
  }

  private async optimizeDuration(
    workoutData: any,
    context: any
  ): Promise<WorkoutOptimizationSuggestion[]> {
    const suggestions: WorkoutOptimizationSuggestion[] = [];

    const currentDuration = workoutData?.averageDuration || 60; // Default 60 minutes
    const availableTime = context.availableTime;

    if (currentDuration > availableTime + 10) {
      suggestions.push({
        id: `duration-${workoutData?.id || 'opt'}-001`,
        workoutId: workoutData?.id || 'unknown',
        category: 'duration',
        title: 'Reduce Workout Duration',
        description: 'Optimize workout to fit available time while maintaining effectiveness',
        currentValue: `${currentDuration} minutes`,
        suggestedValue: `${availableTime} minutes`,
        reasoning: 'Shorter, focused workouts can be more effective than lengthy sessions',
        confidence: 82,
        expectedImprovement: '15%',
        evidenceType: 'research_based',
        implementationComplexity: 'medium',
        safetyRating: 9,
        applicablePlayerTypes: ['all'],
        seasonPhase: ['regular', 'playoffs'],
        prerequisites: ['exercise_prioritization'],
        alternatives: [
          {
            description: 'Split workout into two shorter sessions',
            pros: ['Maintain total volume', 'Better recovery', 'Higher intensity'],
            cons: ['Requires scheduling flexibility', 'More time commitment'],
            applicability: 'Players with flexible schedules'
          },
          {
            description: 'Focus on compound movements only',
            pros: ['Time efficient', 'Functional strength', 'Athletic transfer'],
            cons: ['Less isolation work', 'Potential imbalances'],
            applicability: 'Strength-focused athletes'
          }
        ],
        metrics: {
          currentEffectiveness: 75,
          predictedEffectiveness: 88,
          fatigueScore: 65,
          adaptationPotential: 85,
          injuryRisk: 25,
          timeEfficiency: 92
        }
      });
    }

    if (currentDuration < 30 && context.goals.includes('strength')) {
      suggestions.push({
        id: `duration-${workoutData?.id || 'opt'}-002`,
        workoutId: workoutData?.id || 'unknown',
        category: 'duration',
        title: 'Extend Workout Duration',
        description: 'Increase workout length to allow adequate volume for strength gains',
        currentValue: `${currentDuration} minutes`,
        suggestedValue: '45-60 minutes',
        reasoning: 'Strength development requires sufficient volume and rest periods',
        confidence: 78,
        expectedImprovement: '22%',
        evidenceType: 'research_based',
        implementationComplexity: 'low',
        safetyRating: 8,
        applicablePlayerTypes: ['strength-focused'],
        seasonPhase: ['offseason', 'preseason'],
        prerequisites: ['time_availability'],
        alternatives: [
          {
            description: 'Increase training frequency instead',
            pros: ['Better recovery', 'More practice', 'Flexible scheduling'],
            cons: ['More days required', 'Potential overuse'],
            applicability: 'Players with daily availability'
          }
        ],
        metrics: {
          currentEffectiveness: 60,
          predictedEffectiveness: 82,
          fatigueScore: 45,
          adaptationPotential: 90,
          injuryRisk: 20,
          timeEfficiency: 75
        }
      });
    }

    return suggestions;
  }

  private async optimizeIntensity(
    workoutData: any,
    playerData: any,
    context: any
  ): Promise<WorkoutOptimizationSuggestion[]> {
    const suggestions: WorkoutOptimizationSuggestion[] = [];

    const currentIntensity = workoutData?.averageIntensity || 75;
    const recentFatigue = playerData?.fatigueLevel || 5;

    if (currentIntensity > 85 && recentFatigue > 7) {
      suggestions.push({
        id: `intensity-${workoutData?.id || 'opt'}-001`,
        workoutId: workoutData?.id || 'unknown',
        category: 'intensity',
        title: 'Reduce Training Intensity',
        description: 'Lower intensity to promote recovery and prevent overtraining',
        currentValue: `${currentIntensity}%`,
        suggestedValue: '70-75%',
        reasoning: 'High fatigue levels indicate need for reduced training stress',
        confidence: 88,
        expectedImprovement: '25%',
        evidenceType: 'fatigue_analysis',
        implementationComplexity: 'low',
        safetyRating: 9,
        applicablePlayerTypes: ['fatigued', 'high-volume'],
        seasonPhase: ['regular', 'playoffs'],
        prerequisites: ['fatigue_monitoring'],
        alternatives: [
          {
            description: 'Maintain intensity but reduce volume',
            pros: ['Preserves neural adaptations', 'Maintains skill', 'Less time'],
            cons: ['May not address fatigue', 'Limited recovery'],
            applicability: 'Skill-dependent athletes'
          },
          {
            description: 'Add deload week',
            pros: ['Complete recovery', 'Supercompensation', 'Mental break'],
            cons: ['Temporary fitness loss', 'Schedule disruption'],
            applicability: 'Planned periodization'
          }
        ],
        metrics: {
          currentEffectiveness: 70,
          predictedEffectiveness: 85,
          fatigueScore: 80,
          adaptationPotential: 75,
          injuryRisk: 40,
          timeEfficiency: 85
        }
      });
    }

    if (currentIntensity < 60 && context.goals.includes('power')) {
      suggestions.push({
        id: `intensity-${workoutData?.id || 'opt'}-002`,
        workoutId: workoutData?.id || 'unknown',
        category: 'intensity',
        title: 'Increase Training Intensity',
        description: 'Higher intensity needed for power development adaptations',
        currentValue: `${currentIntensity}%`,
        suggestedValue: '80-90%',
        reasoning: 'Power development requires high-intensity neural stimulation',
        confidence: 85,
        expectedImprovement: '30%',
        evidenceType: 'research_based',
        implementationComplexity: 'medium',
        safetyRating: 7,
        applicablePlayerTypes: ['power-focused', 'advanced'],
        seasonPhase: ['offseason', 'preseason'],
        prerequisites: ['movement_competency', 'adequate_recovery'],
        alternatives: [
          {
            description: 'Periodize intensity within session',
            pros: ['Progressive loading', 'Skill development', 'Fatigue management'],
            cons: ['Complex programming', 'Longer sessions'],
            applicability: 'Advanced athletes'
          }
        ],
        metrics: {
          currentEffectiveness: 55,
          predictedEffectiveness: 85,
          fatigueScore: 35,
          adaptationPotential: 95,
          injuryRisk: 30,
          timeEfficiency: 80
        }
      });
    }

    return suggestions;
  }

  private async optimizeExerciseOrder(
    workoutData: any,
    context: any
  ): Promise<WorkoutOptimizationSuggestion[]> {
    const suggestions: WorkoutOptimizationSuggestion[] = [];

    // Mock exercise order optimization based on energy systems and complexity
    const exercises = workoutData?.exercises || this.getMockExercises();
    
    const orderOptimizations = this.analyzeExerciseOrder(exercises);
    
    if (orderOptimizations.length > 0) {
      suggestions.push({
        id: `order-${workoutData?.id || 'opt'}-001`,
        workoutId: workoutData?.id || 'unknown',
        category: 'exercise_order',
        title: 'Optimize Exercise Sequence',
        description: 'Reorder exercises for better performance and adaptation',
        currentValue: 'Current order',
        suggestedValue: 'Optimized sequence',
        reasoning: 'Complex movements should precede simple ones when neural system is fresh',
        confidence: 79,
        expectedImprovement: '18%',
        evidenceType: 'performance_pattern',
        implementationComplexity: 'low',
        safetyRating: 9,
        applicablePlayerTypes: ['all'],
        seasonPhase: ['all'],
        prerequisites: [],
        alternatives: [
          {
            description: 'Pre-fatigue specific muscles',
            pros: ['Target weak muscles', 'Reduce dominance', 'Metabolic stress'],
            cons: ['Reduced total load', 'More fatigue', 'Complex timing'],
            applicability: 'Corrective training'
          }
        ],
        metrics: {
          currentEffectiveness: 72,
          predictedEffectiveness: 85,
          fatigueScore: 60,
          adaptationPotential: 88,
          injuryRisk: 25,
          timeEfficiency: 90
        }
      });
    }

    return suggestions;
  }

  private async optimizeRestPeriods(
    workoutData: any,
    context: any
  ): Promise<WorkoutOptimizationSuggestion[]> {
    const suggestions: WorkoutOptimizationSuggestion[] = [];

    const avgRestPeriod = workoutData?.averageRestPeriod || 90; // seconds

    if (context.goals.includes('strength') && avgRestPeriod < 120) {
      suggestions.push({
        id: `rest-${workoutData?.id || 'opt'}-001`,
        workoutId: workoutData?.id || 'unknown',
        category: 'rest_periods',
        title: 'Increase Rest Periods',
        description: 'Longer rest periods needed for strength development',
        currentValue: `${avgRestPeriod} seconds`,
        suggestedValue: '180-300 seconds',
        reasoning: 'Phosphocreatine system needs 3-5 minutes for full recovery',
        confidence: 86,
        expectedImprovement: '20%',
        evidenceType: 'research_based',
        implementationComplexity: 'low',
        safetyRating: 9,
        applicablePlayerTypes: ['strength-focused'],
        seasonPhase: ['offseason', 'preseason'],
        prerequisites: ['time_availability'],
        alternatives: [
          {
            description: 'Active recovery between sets',
            pros: ['Time efficient', 'Maintains temperature', 'Light movement'],
            cons: ['Not full recovery', 'May impact performance'],
            applicability: 'Time-constrained sessions'
          }
        ],
        metrics: {
          currentEffectiveness: 70,
          predictedEffectiveness: 88,
          fatigueScore: 50,
          adaptationPotential: 92,
          injuryRisk: 20,
          timeEfficiency: 65
        }
      });
    }

    if (context.goals.includes('conditioning') && avgRestPeriod > 120) {
      suggestions.push({
        id: `rest-${workoutData?.id || 'opt'}-002`,
        workoutId: workoutData?.id || 'unknown',
        category: 'rest_periods',
        title: 'Reduce Rest Periods',
        description: 'Shorter rest periods enhance conditioning adaptations',
        currentValue: `${avgRestPeriod} seconds`,
        suggestedValue: '60-90 seconds',
        reasoning: 'Incomplete recovery improves lactate buffering and cardiovascular adaptations',
        confidence: 82,
        expectedImprovement: '25%',
        evidenceType: 'research_based',
        implementationComplexity: 'medium',
        safetyRating: 8,
        applicablePlayerTypes: ['conditioning-focused'],
        seasonPhase: ['preseason', 'regular'],
        prerequisites: ['cardiovascular_base'],
        alternatives: [
          {
            description: 'Density circuits with timed stations',
            pros: ['High metabolic stress', 'Time efficient', 'Sport-specific'],
            cons: ['High fatigue', 'Skill degradation', 'Recovery demands'],
            applicability: 'Advanced conditioning'
          }
        ],
        metrics: {
          currentEffectiveness: 65,
          predictedEffectiveness: 85,
          fatigueScore: 75,
          adaptationPotential: 90,
          injuryRisk: 35,
          timeEfficiency: 95
        }
      });
    }

    return suggestions;
  }

  private async optimizeVolume(
    workoutData: any,
    playerData: any,
    context: any
  ): Promise<WorkoutOptimizationSuggestion[]> {
    const suggestions: WorkoutOptimizationSuggestion[] = [];

    const currentVolume = workoutData?.totalVolume || 1000; // kg
    const recentRecovery = playerData?.recoveryScore || 7;

    if (currentVolume > 1500 && recentRecovery < 6) {
      suggestions.push({
        id: `volume-${workoutData?.id || 'opt'}-001`,
        workoutId: workoutData?.id || 'unknown',
        category: 'volume',
        title: 'Reduce Training Volume',
        description: 'Lower volume to improve recovery and prevent overreaching',
        currentValue: `${currentVolume} kg`,
        suggestedValue: '1200-1300 kg',
        reasoning: 'Poor recovery indicates excessive training stress',
        confidence: 84,
        expectedImprovement: '22%',
        evidenceType: 'fatigue_analysis',
        implementationComplexity: 'medium',
        safetyRating: 9,
        applicablePlayerTypes: ['high-volume', 'fatigued'],
        seasonPhase: ['regular', 'playoffs'],
        prerequisites: ['recovery_monitoring'],
        alternatives: [
          {
            description: 'Maintain volume but improve recovery protocols',
            pros: ['Preserves fitness', 'Continues adaptation', 'No detraining'],
            cons: ['May not address root cause', 'Requires additional resources'],
            applicability: 'Athletes with access to recovery modalities'
          }
        ],
        metrics: {
          currentEffectiveness: 68,
          predictedEffectiveness: 85,
          fatigueScore: 75,
          adaptationPotential: 80,
          injuryRisk: 45,
          timeEfficiency: 85
        }
      });
    }

    return suggestions;
  }

  private async optimizeProgression(
    workoutData: any,
    playerData: any,
    context: any
  ): Promise<WorkoutOptimizationSuggestion[]> {
    const suggestions: WorkoutOptimizationSuggestion[] = [];

    const progressionRate = playerData?.progressionRate || 0.05; // 5% per week

    if (progressionRate > 0.1) {
      suggestions.push({
        id: `progression-${workoutData?.id || 'opt'}-001`,
        workoutId: workoutData?.id || 'unknown',
        category: 'progression',
        title: 'Moderate Progression Rate',
        description: 'Slower progression reduces injury risk and improves long-term gains',
        currentValue: `${(progressionRate * 100).toFixed(1)}% per week`,
        suggestedValue: '5-8% per week',
        reasoning: 'Rapid progression increases injury risk and may compromise technique',
        confidence: 87,
        expectedImprovement: '28%',
        evidenceType: 'research_based',
        implementationComplexity: 'low',
        safetyRating: 9,
        applicablePlayerTypes: ['aggressive-progressors'],
        seasonPhase: ['all'],
        prerequisites: ['baseline_establishment'],
        alternatives: [
          {
            description: 'Autoregulation based on readiness',
            pros: ['Individualized', 'Responsive', 'Optimal timing'],
            cons: ['Complex monitoring', 'Requires education', 'Variable progress'],
            applicability: 'Advanced athletes with good body awareness'
          }
        ],
        metrics: {
          currentEffectiveness: 65,
          predictedEffectiveness: 88,
          fatigueScore: 45,
          adaptationPotential: 92,
          injuryRisk: 25,
          timeEfficiency: 85
        }
      });
    }

    return suggestions;
  }

  private async getWorkoutAnalytics(workoutId: string): Promise<any> {
    // In a real implementation, this would query the database
    return {
      id: workoutId,
      averageDuration: 75,
      averageIntensity: 82,
      totalVolume: 1350,
      averageRestPeriod: 135,
      exercises: this.getMockExercises()
    };
  }

  private async getPlayerPerformanceData(playerId: string): Promise<any> {
    // In a real implementation, this would query the database
    return {
      id: playerId,
      fatigueLevel: 6,
      recoveryScore: 7,
      progressionRate: 0.08,
      strengthLevel: 85,
      conditioningLevel: 78
    };
  }

  private getMockExercises(): any[] {
    return [
      { id: '1', name: 'Squats', complexity: 8, energySystem: 'anaerobic_power', position: 1 },
      { id: '2', name: 'Bench Press', complexity: 6, energySystem: 'anaerobic_power', position: 2 },
      { id: '3', name: 'Rows', complexity: 5, energySystem: 'anaerobic_capacity', position: 3 },
      { id: '4', name: 'Bicep Curls', complexity: 3, energySystem: 'anaerobic_capacity', position: 4 }
    ];
  }

  private analyzeExerciseOrder(exercises: any[]): ExerciseOptimization[] {
    // Simple optimization: complex exercises first
    const optimizations: ExerciseOptimization[] = [];
    
    exercises.forEach((exercise, index) => {
      if (exercise.complexity > 6 && index > 1) {
        optimizations.push({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          currentPosition: index + 1,
          suggestedPosition: 1,
          reasoning: 'High complexity exercises should be performed when neural system is fresh',
          energySystemImpact: exercise.energySystem,
          fatigueImpact: 8,
          skillComplexity: exercise.complexity,
          optimalPlacement: 'early'
        });
      }
    });

    return optimizations;
  }
}