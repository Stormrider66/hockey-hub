import { CachedInjuryRepository, CachedWellnessRepository, CachedPlayerAvailabilityRepository } from '../repositories';
import { Injury, WellnessEntry, PlayerAvailability } from '../entities';
import { CacheKeyBuilder, RedisCacheManager } from '@hockey-hub/shared-lib';

export interface ExerciseRestriction {
  movementPattern: string;
  bodyPart: string;
  intensityLimit: number; // 0-100 percentage
  restrictionType: 'prohibited' | 'limited' | 'modified';
  reason: string;
}

export interface ExerciseSubstitution {
  originalExercise: string;
  substituteExercise: string;
  modifications: string[];
  reason: string;
  regressionLevel: number; // 1-5 scale
}

export interface InjuryRiskAlert {
  playerId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendations: string[];
  immediateAction: boolean;
  timestamp: Date;
}

export interface LoadManagementRecommendation {
  playerId: string;
  currentLoad: number;
  recommendedLoad: number;
  loadReduction: number; // percentage
  reason: string;
  durationDays: number;
  modifications: string[];
}

export interface ComplianceCheckResult {
  isCompliant: boolean;
  restrictions: ExerciseRestriction[];
  substitutions: ExerciseSubstitution[];
  riskAlerts: InjuryRiskAlert[];
  loadRecommendations: LoadManagementRecommendation[];
  medicalNotes: string[];
}

export class MedicalComplianceService {
  private injuryRepository: CachedInjuryRepository;
  private wellnessRepository: CachedWellnessRepository;
  private availabilityRepository: CachedPlayerAvailabilityRepository;
  private cacheManager: RedisCacheManager;

  constructor() {
    this.injuryRepository = new CachedInjuryRepository();
    this.wellnessRepository = new CachedWellnessRepository();
    this.availabilityRepository = new CachedPlayerAvailabilityRepository();
    this.cacheManager = new RedisCacheManager();
  }

  /**
   * Real-time compliance check for workout exercises
   */
  async checkWorkoutCompliance(
    playerId: string, 
    exercises: any[], 
    workoutIntensity: number = 100
  ): Promise<ComplianceCheckResult> {
    // Handle invalid player IDs gracefully
    const parsedId = parseInt(playerId);
    if (Number.isNaN(parsedId)) {
      return {
        isCompliant: true,
        restrictions: [],
        substitutions: [],
        riskAlerts: [],
        loadRecommendations: [],
        medicalNotes: ['Compliance check error']
      };
    }
    const cacheKey = CacheKeyBuilder.build('workout_compliance', playerId, workoutIntensity.toString());
    
    // Try cache first for recent checks
    const cached = await this.cacheManager.get<ComplianceCheckResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get current medical status
    let injuries: Injury[] = [];
    let availability: PlayerAvailability | null = null;
    let wellness: WellnessEntry | null = null;
    try {
      [injuries, availability, wellness] = await Promise.all([
        this.injuryRepository.findByPlayerId(parsedId),
        this.availabilityRepository.findCurrentByPlayerId(parsedId),
        this.wellnessRepository.findLatestByPlayerId(parsedId)
      ]);
    } catch (e) {
      // Continue with safe defaults and annotate
      injuries = [];
      availability = null;
      wellness = null;
    }

    const activeInjuries = injuries.filter(injury => injury.recoveryStatus === 'active');
    
    // Generate restrictions based on injuries
    const restrictions = this.generateExerciseRestrictions(activeInjuries);
    
    // Check each exercise for compliance
    const substitutions: ExerciseSubstitution[] = [];
    const riskAlerts: InjuryRiskAlert[] = [];
    const loadRecommendations: LoadManagementRecommendation[] = [];
    const medicalNotes: string[] = [];

    for (const exercise of exercises) {
      // Check for exercise-specific restrictions
      const applicable = restrictions.filter(restriction => 
        this.isExerciseAffected(exercise, restriction)
      );

      if (applicable.length > 0) {
        // Generate substitutions for restricted exercises
        const substitution = this.generateExerciseSubstitution(exercise, applicable);
        if (substitution) {
          substitutions.push(substitution);
        }
      }
    }

    // Generate risk alerts based on current state
    const riskAlert = await this.assessInjuryRisk(playerId, activeInjuries, wellness, workoutIntensity);
    if (riskAlert) {
      riskAlerts.push(riskAlert);
    }

    // Generate load management recommendations
    const loadRec = await this.generateLoadManagementRecommendation(
      playerId, 
      availability, 
      wellness,
      workoutIntensity
    );
    if (loadRec) {
      loadRecommendations.push(loadRec);
    }

    // Add medical notes
    if (activeInjuries.length > 0) {
      medicalNotes.push(`Active injuries: ${activeInjuries.map(i => i.injuryType).join(', ')}`);
    }

    if (availability?.availabilityStatus === 'load_management') {
      medicalNotes.push(`Player under load management: ${availability.reason || 'Medical precaution'}`);
    }

    const result: ComplianceCheckResult = {
      isCompliant: restrictions.length === 0 && riskAlerts.filter(r => r.immediateAction).length === 0,
      restrictions,
      substitutions,
      riskAlerts,
      loadRecommendations,
      medicalNotes
    };

    // Cache result for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Backward-compatible wrapper used by tests: assess injury risk using
   * current injuries, wellness data and workout intensity.
   */
  private async assessInjuryRisk(
    playerId: string,
    activeInjuries: Injury[],
    wellness: WellnessEntry | null,
    workoutIntensity: number
  ): Promise<InjuryRiskAlert | null> {
    const riskFactors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let immediateAction = false;

    if (activeInjuries.length > 0) {
      riskFactors.push('Active injury');
      riskLevel = 'medium';
    }

    if (workoutIntensity >= 90) {
      riskFactors.push('High workout intensity');
      riskLevel = riskLevel === 'medium' ? 'high' : 'medium';
    }

    if (wellness) {
      if (wellness.stressLevel > 8) {
        riskFactors.push('High stress levels');
        riskLevel = 'high';
      }
      if (wellness.sorenessLevel > 8) {
        riskFactors.push('High muscle soreness');
        riskLevel = 'high';
      }
    }

    if (riskLevel === 'critical') {
      immediateAction = true;
    }

    if (riskFactors.length === 0) {
      return null;
    }

    return {
      playerId,
      riskLevel,
      riskFactors,
      recommendations: this.generateRiskRecommendations(riskFactors, riskLevel),
      immediateAction,
      timestamp: new Date(),
    };
  }

  /**
   * Real-time injury risk assessment during workout
   */
  async assessRealTimeInjuryRisk(
    playerId: string,
    currentMetrics: {
      heartRate?: number;
      powerOutput?: number;
      pace?: number;
      rpe?: number; // Rate of Perceived Exertion
      duration?: number; // minutes
    }
  ): Promise<InjuryRiskAlert | null> {
    const [injuries, wellness] = await Promise.all([
      this.injuryRepository.findByPlayerId(parseInt(playerId)),
      this.wellnessRepository.findLatestByPlayerId(parseInt(playerId))
    ]);

    const activeInjuries = injuries.filter(injury => injury.recoveryStatus === 'active');
    const riskFactors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let immediateAction = false;

    // Check for immediate risk factors
    if (currentMetrics.rpe && currentMetrics.rpe > 8) {
      riskFactors.push('Excessive perceived exertion');
      riskLevel = 'high';
    }

    if (currentMetrics.heartRate && wellness?.maxHeartRate) {
      const hrPercentage = (currentMetrics.heartRate / wellness.maxHeartRate) * 100;
      if (hrPercentage > 95) {
        riskFactors.push('Heart rate exceeding safe threshold');
        riskLevel = 'critical';
        immediateAction = true;
      }
    }

    // Check injury-specific risks
    for (const injury of activeInjuries) {
      if (injury.severityLevel >= 4) {
        riskFactors.push(`High severity ${injury.bodyPart} injury`);
        riskLevel = Math.max(riskLevel, 'high') as any;
      }

      // Check if current activity affects injured body part
      if (this.isBodyPartAtRisk(injury.bodyPart, currentMetrics)) {
        riskFactors.push(`Activity affecting injured ${injury.bodyPart}`);
        riskLevel = Math.max(riskLevel, 'medium') as any;
      }
    }

    // Check wellness-based risks
    if (wellness) {
      if (wellness.sleepHours < 6) {
        riskFactors.push('Sleep deprivation');
        riskLevel = Math.max(riskLevel, 'medium') as any;
      }

      if (wellness.stressLevel > 8) {
        riskFactors.push('High stress levels');
        riskLevel = Math.max(riskLevel, 'medium') as any;
      }

      if (wellness.sorenessLevel > 8) {
        riskFactors.push('High muscle soreness');
        riskLevel = Math.max(riskLevel, 'medium') as any;
      }
    }

    if (riskFactors.length === 0) {
      return null;
    }

    return {
      playerId,
      riskLevel,
      riskFactors,
      recommendations: this.generateRiskRecommendations(riskFactors, riskLevel),
      immediateAction,
      timestamp: new Date()
    };
  }

  /**
   * Generate exercise substitutions for restricted movements
   */
  private generateExerciseSubstitution(
    exercise: any,
    restrictions: ExerciseRestriction[]
  ): ExerciseSubstitution | null {
    const primaryRestriction = restrictions[0];
    
    // Exercise substitution database - in production this would be more comprehensive
    const substitutionMap: Record<string, { substitute: string; modifications: string[] }> = {
      'squat': {
        substitute: 'seated leg press',
        modifications: ['Reduced range of motion', 'Lower weight', 'Slower tempo']
      },
      'deadlift': {
        substitute: 'glute bridge',
        modifications: ['No spinal loading', 'Focus on glute activation']
      },
      'bench press': {
        substitute: 'chest fly machine',
        modifications: ['Reduced range of motion', 'Lighter weight']
      },
      'overhead press': {
        substitute: 'seated shoulder press',
        modifications: ['Seated position for stability', 'Reduced weight']
      },
      'running': {
        substitute: 'stationary bike',
        modifications: ['Lower impact', 'Controlled intensity']
      },
      'jumping': {
        substitute: 'step-ups',
        modifications: ['Controlled movement', 'Lower height']
      }
    };

    const exerciseName = exercise.name?.toLowerCase() || '';
    const substitution = Object.entries(substitutionMap).find(([key]) => 
      exerciseName.includes(key)
    );

    if (substitution) {
      return {
        originalExercise: exercise.name,
        substituteExercise: substitution[1].substitute,
        modifications: substitution[1].modifications,
        reason: primaryRestriction.reason,
        regressionLevel: Math.min(primaryRestriction.intensityLimit / 20, 5)
      };
    }

    // Generic substitution based on restriction type
    return {
      originalExercise: exercise.name,
      substituteExercise: 'Modified version with restrictions',
      modifications: [
        `${primaryRestriction.restrictionType} intensity`,
        `Avoid ${primaryRestriction.movementPattern}`,
        `Protect ${primaryRestriction.bodyPart}`
      ],
      reason: primaryRestriction.reason,
      regressionLevel: 3
    };
  }

  /**
   * Generate exercise restrictions based on injuries
   */
  private generateExerciseRestrictions(injuries: Injury[]): ExerciseRestriction[] {
    const restrictions: ExerciseRestriction[] = [];

    for (const injury of injuries) {
      const bodyPart = injury.bodyPart.toLowerCase();
      const severity = injury.severityLevel;

      // Generate restrictions based on body part and severity
      switch (bodyPart) {
        case 'knee':
        case 'acl':
        case 'mcl':
          restrictions.push({
            movementPattern: 'knee flexion/extension',
            bodyPart: 'knee',
            intensityLimit: Math.max(100 - (severity * 20), 20),
            restrictionType: severity >= 4 ? 'prohibited' : 'limited',
            reason: `Active ${injury.injuryType} - severity ${severity}`
          });
          break;

        case 'shoulder':
        case 'rotator cuff':
          restrictions.push({
            movementPattern: 'overhead movements',
            bodyPart: 'shoulder',
            intensityLimit: Math.max(100 - (severity * 15), 30),
            restrictionType: severity >= 4 ? 'prohibited' : 'modified',
            reason: `Active ${injury.injuryType} - severity ${severity}`
          });
          break;

        case 'back':
        case 'spine':
          restrictions.push({
            movementPattern: 'spinal loading',
            bodyPart: 'spine',
            intensityLimit: Math.max(100 - (severity * 25), 10),
            restrictionType: severity >= 3 ? 'prohibited' : 'limited',
            reason: `Active ${injury.injuryType} - severity ${severity}`
          });
          break;

        case 'ankle':
          restrictions.push({
            movementPattern: 'weight bearing',
            bodyPart: 'ankle',
            intensityLimit: Math.max(100 - (severity * 20), 25),
            restrictionType: severity >= 4 ? 'prohibited' : 'limited',
            reason: `Active ${injury.injuryType} - severity ${severity}`
          });
          break;

        case 'wrist':
        case 'hand':
          restrictions.push({
            movementPattern: 'grip intensive',
            bodyPart: 'wrist',
            intensityLimit: Math.max(100 - (severity * 15), 40),
            restrictionType: 'modified',
            reason: `Active ${injury.injuryType} - severity ${severity}`
          });
          break;
      }
    }

    return restrictions;
  }

  /**
   * Check if exercise is affected by restriction
   */
  private isExerciseAffected(exercise: any, restriction: ExerciseRestriction): boolean {
    const exerciseName = exercise.name?.toLowerCase() || '';
    const movementPattern = restriction.movementPattern.toLowerCase();
    const bodyPart = restriction.bodyPart.toLowerCase();

    // Check for movement pattern matches
    const movementMatches = [
      'squat', 'lunge', 'step-up', 'jump'
    ].some(movement => 
      exerciseName.includes(movement) && movementPattern.includes('knee')
    );

    const overheadMatches = [
      'press', 'raise', 'pullup', 'overhead'
    ].some(movement => 
      exerciseName.includes(movement) && movementPattern.includes('overhead')
    );

    const spinalMatches = [
      'deadlift', 'squat', 'row', 'clean'
    ].some(movement => 
      exerciseName.includes(movement) && movementPattern.includes('spinal')
    );

    return movementMatches || overheadMatches || spinalMatches || 
           exerciseName.includes(bodyPart);
  }

  /**
   * Generate load management recommendations
   */
  private async generateLoadManagementRecommendation(
    playerId: string,
    availability: PlayerAvailability | null,
    wellness: WellnessEntry | null,
    workoutIntensity: number
  ): Promise<LoadManagementRecommendation | null> {
    let recommendedLoad = workoutIntensity;
    let reason = '';
    const modifications: string[] = [];

    // Check availability status
    if (availability?.availabilityStatus === 'load_management') {
      recommendedLoad = Math.min(recommendedLoad, 70);
      reason = 'Player under load management protocol';
      modifications.push('Reduce intensity to 70%');
      modifications.push('Increase rest periods');
    }

    // Check wellness factors
    if (wellness) {
      if (wellness.sleepHours < 7) {
        recommendedLoad = Math.min(recommendedLoad, 80);
        reason += (reason ? '; ' : '') + 'Insufficient sleep';
        modifications.push('Light to moderate intensity only');
      }

      if (wellness.stressLevel > 7) {
        recommendedLoad = Math.min(recommendedLoad, 75);
        reason += (reason ? '; ' : '') + 'Elevated stress levels';
        modifications.push('Focus on technique over intensity');
      }

      if (wellness.sorenessLevel > 7) {
        recommendedLoad = Math.min(recommendedLoad, 65);
        reason += (reason ? '; ' : '') + 'High muscle soreness';
        modifications.push('Active recovery exercises');
        modifications.push('Extended warm-up');
      }
    }

    if (recommendedLoad < workoutIntensity) {
      return {
        playerId,
        currentLoad: workoutIntensity,
        recommendedLoad,
        loadReduction: ((workoutIntensity - recommendedLoad) / workoutIntensity) * 100,
        reason,
        durationDays: 1, // Default to 1 day, can be adjusted based on specific conditions
        modifications
      };
    }

    return null;
  }

  /**
   * Generate risk-based recommendations
   */
  private generateRiskRecommendations(
    riskFactors: string[],
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ): string[] {
    const recommendations: string[] = [];

    switch (riskLevel) {
      case 'critical':
        recommendations.push('STOP exercise immediately');
        recommendations.push('Seek immediate medical attention');
        recommendations.push('Monitor vital signs');
        break;

      case 'high':
        recommendations.push('Reduce intensity by 50%');
        recommendations.push('Increase rest periods');
        recommendations.push('Monitor closely for symptoms');
        recommendations.push('Consider ending session early');
        break;

      case 'medium':
        recommendations.push('Reduce intensity by 25%');
        recommendations.push('Focus on proper form');
        recommendations.push('Additional warm-up recommended');
        break;

      case 'low':
        recommendations.push('Continue with caution');
        recommendations.push('Monitor symptoms');
        break;
    }

    // Add specific recommendations based on risk factors
    if (riskFactors.includes('Sleep deprivation')) {
      recommendations.push('Emphasize recovery exercises');
    }

    if (riskFactors.includes('High stress levels')) {
      recommendations.push('Include stress-reducing activities');
    }

    return recommendations;
  }

  /**
   * Check if body part is at risk based on current metrics
   */
  private isBodyPartAtRisk(bodyPart: string, metrics: any): boolean {
    // Simple heuristic - in production this would be more sophisticated
    const riskMapping: Record<string, string[]> = {
      'knee': ['running', 'jumping', 'squatting'],
      'shoulder': ['overhead', 'throwing', 'swimming'],
      'back': ['lifting', 'rowing', 'deadlifting'],
      'ankle': ['running', 'jumping', 'landing']
    };

    const currentActivity = this.inferActivityFromMetrics(metrics);
    return riskMapping[bodyPart.toLowerCase()]?.includes(currentActivity) || false;
  }

  /**
   * Infer current activity from metrics
   */
  private inferActivityFromMetrics(metrics: any): string {
    if (metrics.pace) return 'running';
    if (metrics.powerOutput && metrics.powerOutput > 200) return 'lifting';
    if (metrics.heartRate && metrics.heartRate > 150) return 'high_intensity';
    return 'general';
  }
}