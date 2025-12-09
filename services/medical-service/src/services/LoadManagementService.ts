import { CachedInjuryRepository, CachedWellnessRepository, CachedPlayerAvailabilityRepository } from '../repositories';
import { Injury, WellnessEntry, PlayerAvailability } from '../entities';
import { CacheKeyBuilder, RedisCacheManager } from '@hockey-hub/shared-lib';

export interface LoadManagementData {
  playerId: string;
  baselineLoad: number;
  currentLoad: number;
  recommendedLoad: number;
  loadReduction: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: LoadFactor[];
  recommendations: string[];
  durationDays: number;
  lastUpdated: Date;
}

export interface LoadFactor {
  type: 'injury' | 'wellness' | 'performance' | 'recovery';
  severity: number; // 1-10 scale
  description: string;
  impact: number; // percentage impact on load
}

export interface LoadTrend {
  playerId: string;
  date: Date;
  load: number;
  actual: boolean; // true if actual workout, false if planned
  compliance: boolean;
  notes?: string;
}

export class LoadManagementService {
  private injuryRepository: CachedInjuryRepository;
  private wellnessRepository: CachedWellnessRepository;
  private availabilityRepository: CachedPlayerAvailabilityRepository;
  private cacheManager: RedisCacheManager;
  private loadTrends: Map<string, LoadTrend[]> = new Map();

  constructor() {
    this.injuryRepository = new CachedInjuryRepository();
    this.wellnessRepository = new CachedWellnessRepository();
    this.availabilityRepository = new CachedPlayerAvailabilityRepository();
    this.cacheManager = new RedisCacheManager();
  }

  /**
   * Calculate optimal load management for a player
   */
  async calculateLoadManagement(playerId: string, currentWorkoutLoad: number = 100): Promise<LoadManagementData> {
    const cacheKey = CacheKeyBuilder.build('load_management', playerId);
    
    // Check cache first
    const cached = await this.cacheManager.get<LoadManagementData>(cacheKey);
    if (cached && (Date.now() - cached.lastUpdated.getTime()) < 300000) { // 5 minutes
      return cached;
    }

    // Get medical data
    const [injuries, wellness, availability] = await Promise.all([
      this.injuryRepository.findByPlayerId(parseInt(playerId)),
      this.wellnessRepository.findLatestByPlayerId(parseInt(playerId)),
      this.availabilityRepository.findCurrentByPlayerId(parseInt(playerId))
    ]);

    const activeInjuries = injuries.filter(injury => injury.recoveryStatus === 'active');
    const factors: LoadFactor[] = [];
    let totalLoadReduction = 0;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Analyze injury factors
    for (const injury of activeInjuries) {
      const injuryImpact = this.calculateInjuryLoadImpact(injury);
      factors.push({
        type: 'injury',
        severity: injury.severityLevel,
        description: `Active ${injury.injuryType} (${injury.bodyPart})`,
        impact: injuryImpact
      });
      totalLoadReduction += injuryImpact;

      // Update risk level based on injury severity
      if (injury.severityLevel >= 4) {
        riskLevel = 'critical';
      } else if (injury.severityLevel >= 3 && riskLevel !== 'critical') {
        riskLevel = 'high';
      } else if (injury.severityLevel >= 2 && riskLevel === 'low') {
        riskLevel = 'medium';
      }
    }

    // Analyze wellness factors
    if (wellness) {
      const wellnessImpact = this.calculateWellnessLoadImpact(wellness);
      if (wellnessImpact.impact > 0) {
        factors.push(wellnessImpact);
        totalLoadReduction += wellnessImpact.impact;

        // Update risk level based on wellness concerns
        if (wellnessImpact.severity >= 8 && riskLevel === 'low') {
          riskLevel = 'medium';
        } else if (wellnessImpact.severity >= 9 && riskLevel !== 'critical') {
          riskLevel = 'high';
        }
      }
    }

    // Analyze availability status
    if (availability?.availabilityStatus === 'load_management') {
      factors.push({
        type: 'recovery',
        severity: 5,
        description: 'Currently under load management protocol',
        impact: 30
      });
      totalLoadReduction += 30;
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }

    // Calculate recommended load
    const baselineLoad = 100;
    const recommendedLoad = Math.max(baselineLoad - totalLoadReduction, 20); // Minimum 20%
    const actualReduction = ((baselineLoad - recommendedLoad) / baselineLoad) * 100;

    // Generate recommendations
    const recommendations = this.generateLoadRecommendations(factors, recommendedLoad);

    // Determine duration
    const durationDays = this.calculateRecommendedDuration(factors, riskLevel);

    const loadManagementData: LoadManagementData = {
      playerId,
      baselineLoad,
      currentLoad: currentWorkoutLoad,
      recommendedLoad,
      loadReduction: actualReduction,
      riskLevel,
      factors,
      recommendations,
      durationDays,
      lastUpdated: new Date()
    };

    // Cache the result
    await this.cacheManager.set(cacheKey, loadManagementData, 300); // 5 minutes

    return loadManagementData;
  }

  /**
   * Track load compliance over time
   */
  async recordLoadCompliance(
    playerId: string, 
    plannedLoad: number, 
    actualLoad: number, 
    sessionDate: Date = new Date(),
    notes?: string
  ): Promise<void> {
    const compliance = Math.abs(actualLoad - plannedLoad) <= 10; // Within 10% is considered compliant

    const loadTrend: LoadTrend = {
      playerId,
      date: sessionDate,
      load: actualLoad,
      actual: true,
      compliance,
      notes
    };

    // Store in memory map (in production, this would be in database)
    if (!this.loadTrends.has(playerId)) {
      this.loadTrends.set(playerId, []);
    }

    const playerTrends = this.loadTrends.get(playerId)!;
    playerTrends.push(loadTrend);

    // Keep only last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.loadTrends.set(
      playerId, 
      playerTrends.filter(trend => trend.date >= thirtyDaysAgo)
    );

    // Update cache
    const cacheKey = CacheKeyBuilder.build('load_trends', playerId);
    await this.cacheManager.set(cacheKey, playerTrends, 3600); // 1 hour
  }

  /**
   * Get load compliance history for a player
   */
  async getLoadTrends(playerId: string, days: number = 30): Promise<LoadTrend[]> {
    const cacheKey = CacheKeyBuilder.build('load_trends', playerId);
    const cached = await this.cacheManager.get<LoadTrend[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const trends = this.loadTrends.get(playerId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return trends.filter(trend => trend.date >= cutoffDate);
  }

  /**
   * Get load management recommendations for multiple players
   */
  async getBatchLoadRecommendations(playerIds: string[]): Promise<Record<string, LoadManagementData>> {
    const results: Record<string, LoadManagementData> = {};

    await Promise.all(
      playerIds.map(async (playerId) => {
        try {
          results[playerId] = await this.calculateLoadManagement(playerId);
        } catch (error) {
          console.error(`Failed to calculate load management for player ${playerId}:`, error);
        }
      })
    );

    return results;
  }

  /**
   * Update player load based on real-time factors
   */
  async updateRealTimeLoad(
    playerId: string, 
    currentMetrics: {
      heartRate?: number;
      rpe?: number; // Rate of Perceived Exertion
      powerOutput?: number;
      duration?: number;
    }
  ): Promise<{ recommendedAdjustment: number; reason: string } | null> {
    const loadData = await this.calculateLoadManagement(playerId);
    let adjustment = 0;
    const reasons: string[] = [];

    // Check RPE
    if (currentMetrics.rpe && currentMetrics.rpe > 8) {
      adjustment -= 20;
      reasons.push('High perceived exertion');
    }

    // Check heart rate (if we have wellness data for max HR)
    const wellness = await this.wellnessRepository.findLatestByPlayerId(parseInt(playerId));
    if (currentMetrics.heartRate && wellness?.maxHeartRate) {
      const hrPercentage = (currentMetrics.heartRate / wellness.maxHeartRate) * 100;
      if (hrPercentage > 95) {
        adjustment -= 30;
        reasons.push('Heart rate exceeding safe threshold');
      } else if (hrPercentage > 90) {
        adjustment -= 15;
        reasons.push('Heart rate approaching maximum');
      }
    }

    // Check duration for injured players
    if (loadData.factors.some(f => f.type === 'injury') && currentMetrics.duration) {
      if (currentMetrics.duration > 60) { // More than 60 minutes
        adjustment -= 10;
        reasons.push('Extended duration with active injury');
      }
    }

    if (adjustment < 0) {
      return {
        recommendedAdjustment: adjustment,
        reason: reasons.join('; ')
      };
    }

    return null;
  }

  /**
   * Calculate injury impact on training load
   */
  private calculateInjuryLoadImpact(injury: Injury): number {
    const baseSeverityImpact = injury.severityLevel * 10; // 10-50% based on severity
    
    // Body part specific modifiers
    const bodyPartModifiers: Record<string, number> = {
      'knee': 1.5,
      'acl': 2.0,
      'mcl': 1.5,
      'ankle': 1.3,
      'shoulder': 1.2,
      'back': 1.8,
      'spine': 2.0,
      'wrist': 0.8,
      'hand': 0.6
    };

    const bodyPart = injury.bodyPart.toLowerCase();
    const modifier = bodyPartModifiers[bodyPart] || 1.0;

    return Math.min(baseSeverityImpact * modifier, 70); // Cap at 70% reduction
  }

  /**
   * Calculate wellness impact on training load
   */
  private calculateWellnessLoadImpact(wellness: WellnessEntry): LoadFactor {
    let totalImpact = 0;
    const concerns: string[] = [];
    let maxSeverity = 0;

    // Sleep impact
    if (wellness.sleepHours < 6) {
      totalImpact += 25;
      concerns.push('severe sleep deprivation');
      maxSeverity = Math.max(maxSeverity, 9);
    } else if (wellness.sleepHours < 7) {
      totalImpact += 15;
      concerns.push('insufficient sleep');
      maxSeverity = Math.max(maxSeverity, 6);
    }

    // Stress impact
    if (wellness.stressLevel > 8) {
      totalImpact += 20;
      concerns.push('high stress');
      maxSeverity = Math.max(maxSeverity, 8);
    } else if (wellness.stressLevel > 6) {
      totalImpact += 10;
      concerns.push('elevated stress');
      maxSeverity = Math.max(maxSeverity, 6);
    }

    // Soreness impact
    if (wellness.sorenessLevel > 8) {
      totalImpact += 15;
      concerns.push('high muscle soreness');
      maxSeverity = Math.max(maxSeverity, 8);
    } else if (wellness.sorenessLevel > 6) {
      totalImpact += 8;
      concerns.push('muscle soreness');
      maxSeverity = Math.max(maxSeverity, 6);
    }

    // Energy impact
    if (wellness.energyLevel < 4) {
      totalImpact += 15;
      concerns.push('low energy');
      maxSeverity = Math.max(maxSeverity, 7);
    }

    return {
      type: 'wellness',
      severity: maxSeverity,
      description: `Wellness concerns: ${concerns.join(', ')}`,
      impact: Math.min(totalImpact, 50) // Cap at 50% reduction
    };
  }

  /**
   * Generate load management recommendations
   */
  private generateLoadRecommendations(factors: LoadFactor[], recommendedLoad: number): string[] {
    const recommendations: string[] = [];

    if (recommendedLoad < 50) {
      recommendations.push('Consider active recovery session instead of high-intensity training');
    } else if (recommendedLoad < 70) {
      recommendations.push('Focus on technique and light conditioning');
    } else if (recommendedLoad < 85) {
      recommendations.push('Moderate intensity with extended warm-up and cool-down');
    }

    // Factor-specific recommendations
    for (const factor of factors) {
      switch (factor.type) {
        case 'injury':
          recommendations.push('Avoid exercises that stress the injured area');
          recommendations.push('Include injury-specific modifications');
          break;
        case 'wellness':
          if (factor.description.includes('sleep')) {
            recommendations.push('Prioritize recovery and sleep quality');
          }
          if (factor.description.includes('stress')) {
            recommendations.push('Include stress-reducing activities');
          }
          if (factor.description.includes('soreness')) {
            recommendations.push('Extended warm-up and mobility work');
          }
          break;
        case 'recovery':
          recommendations.push('Monitor closely throughout session');
          recommendations.push('Be prepared to reduce intensity further if needed');
          break;
      }
    }

    // General safety recommendations
    if (factors.length > 0) {
      recommendations.push('Maintain open communication with medical staff');
      recommendations.push('Stop immediately if symptoms worsen');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Calculate recommended duration for load management
   */
  private calculateRecommendedDuration(factors: LoadFactor[], riskLevel: string): number {
    let baseDuration = 3; // 3 days default

    // Adjust based on risk level
    switch (riskLevel) {
      case 'critical':
        baseDuration = 14;
        break;
      case 'high':
        baseDuration = 7;
        break;
      case 'medium':
        baseDuration = 5;
        break;
      case 'low':
        baseDuration = 3;
        break;
    }

    // Adjust based on injury severity
    const injuryFactors = factors.filter(f => f.type === 'injury');
    if (injuryFactors.length > 0) {
      const maxSeverity = Math.max(...injuryFactors.map(f => f.severity));
      baseDuration += Math.floor(maxSeverity / 2);
    }

    // Adjust based on number of factors
    baseDuration += Math.floor(factors.length / 2);

    return Math.min(baseDuration, 21); // Cap at 3 weeks
  }
}