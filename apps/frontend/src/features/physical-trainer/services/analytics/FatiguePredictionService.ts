/**
 * Fatigue Prediction Service
 * Calculates and predicts player fatigue using ACWR and training load metrics
 */

import {
  FatiguePrediction,
  WorkloadData,
  PlayerMetrics,
  TimeSeriesData,
  AnalyticsAlert,
  AnalyticsConfig
} from './analytics.types';

export class FatiguePredictionService {
  private static instance: FatiguePredictionService;
  private config: AnalyticsConfig;

  private constructor() {
    this.config = {
      acwrThresholds: {
        low: 0.8,
        moderate: 1.3,
        high: 1.5,
        critical: 2.0
      },
      fatigueThresholds: {
        low: 30,
        moderate: 50,
        high: 70,
        critical: 85
      },
      injuryRiskWeights: {
        workload: 0.4,
        history: 0.2,
        biomechanics: 0.15,
        recovery: 0.15,
        age: 0.1
      },
      updateFrequency: 60, // minutes
      historicalDataWindow: 42 // 6 weeks
    };
  }

  static getInstance(): FatiguePredictionService {
    if (!FatiguePredictionService.instance) {
      FatiguePredictionService.instance = new FatiguePredictionService();
    }
    return FatiguePredictionService.instance;
  }

  /**
   * Calculate current fatigue level for a player
   */
  async calculateFatigue(
    playerId: string,
    workloadHistory: WorkloadData[],
    playerMetrics: PlayerMetrics
  ): Promise<FatiguePrediction> {
    // Sort workload by date
    const sortedWorkload = [...workloadHistory].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    // Calculate acute load (7 days)
    const acuteLoad = this.calculateLoad(sortedWorkload, 7);
    
    // Calculate chronic load (28 days)
    const chronicLoad = this.calculateLoad(sortedWorkload, 28);
    
    // Calculate ACWR
    const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
    
    // Calculate current fatigue based on multiple factors
    const currentFatigue = this.calculateCurrentFatigue(
      acuteLoad,
      chronicLoad,
      acwr,
      sortedWorkload,
      playerMetrics
    );
    
    // Predict future fatigue based on trends
    const predictedFatigue = this.predictFutureFatigue(
      currentFatigue,
      sortedWorkload,
      acwr
    );
    
    // Determine trend
    const trend = this.determineFatigueTrend(sortedWorkload);
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(
      currentFatigue,
      predictedFatigue,
      acwr,
      trend
    );
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(currentFatigue, acwr);
    
    // Calculate confidence score
    const confidenceScore = this.calculateConfidence(sortedWorkload.length);

    return {
      playerId,
      currentFatigue,
      predictedFatigue,
      trend,
      acuteLoad,
      chronicLoad,
      acwr,
      recommendation,
      riskLevel,
      confidenceScore
    };
  }

  /**
   * Calculate training load over a specific period
   */
  private calculateLoad(workloadData: WorkloadData[], days: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const relevantWorkloads = workloadData.filter(w => w.date >= cutoffDate);
    
    if (relevantWorkloads.length === 0) return 0;
    
    // Calculate exponentially weighted load
    const totalLoad = relevantWorkloads.reduce((sum, workout) => {
      const daysSinceWorkout = Math.floor(
        (new Date().getTime() - workout.date.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Exponential decay factor (more recent workouts have more impact)
      const decayFactor = Math.exp(-0.1 * daysSinceWorkout);
      
      // Training Stress Score calculation
      const tss = workout.tss || this.calculateTSS(workout);
      
      return sum + (tss * decayFactor);
    }, 0);
    
    return totalLoad / days;
  }

  /**
   * Calculate Training Stress Score if not provided
   */
  private calculateTSS(workout: WorkloadData): number {
    const intensityFactor = workout.intensity / 10;
    const durationHours = workout.duration / 60;
    
    // Base TSS calculation
    let tss = 100 * durationHours * Math.pow(intensityFactor, 2);
    
    // Adjust for workout type
    const typeMultipliers: Record<string, number> = {
      strength: 0.8,
      conditioning: 1.0,
      hybrid: 0.9,
      agility: 0.7,
      game: 1.2,
      practice: 0.9
    };
    
    tss *= typeMultipliers[workout.type] || 1.0;
    
    // Cap TSS at reasonable values
    return Math.min(tss, 300);
  }

  /**
   * Calculate current fatigue level
   */
  private calculateCurrentFatigue(
    acuteLoad: number,
    chronicLoad: number,
    acwr: number,
    workloadHistory: WorkloadData[],
    playerMetrics: PlayerMetrics
  ): number {
    let fatigue = 0;
    
    // Base fatigue from acute load (40% weight)
    const acuteFatigue = Math.min((acuteLoad / 100) * 100, 100) * 0.4;
    
    // ACWR contribution (30% weight)
    let acwrFatigue = 0;
    if (acwr < 0.8) {
      acwrFatigue = 20; // Undertraining
    } else if (acwr <= 1.3) {
      acwrFatigue = 30; // Optimal
    } else if (acwr <= 1.5) {
      acwrFatigue = 50; // Moderate risk
    } else {
      acwrFatigue = 80; // High risk
    }
    acwrFatigue *= 0.3;
    
    // Recovery factor (20% weight)
    const recoveryFatigue = this.calculateRecoveryFatigue(workloadHistory) * 0.2;
    
    // Age factor (10% weight)
    const ageFatigue = this.calculateAgeFatigue(playerMetrics.age) * 0.1;
    
    fatigue = acuteFatigue + acwrFatigue + recoveryFatigue + ageFatigue;
    
    // Apply position-specific adjustments
    const positionMultipliers: Record<string, number> = {
      'forward': 1.1,
      'defense': 1.0,
      'goalie': 0.9
    };
    
    fatigue *= positionMultipliers[playerMetrics.position.toLowerCase()] || 1.0;
    
    return Math.min(Math.max(fatigue, 0), 100);
  }

  /**
   * Calculate recovery-related fatigue
   */
  private calculateRecoveryFatigue(workloadHistory: WorkloadData[]): number {
    if (workloadHistory.length < 2) return 0;
    
    // Check rest days in last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentWorkouts = workloadHistory.filter(w => w.date >= oneWeekAgo);
    const restDays = 7 - recentWorkouts.length;
    
    // Insufficient rest increases fatigue
    if (restDays < 2) return 80;
    if (restDays < 3) return 60;
    if (restDays < 4) return 40;
    return 20;
  }

  /**
   * Calculate age-related fatigue factor
   */
  private calculateAgeFatigue(age: number): number {
    if (age < 23) return 20;
    if (age < 28) return 30;
    if (age < 32) return 50;
    if (age < 35) return 70;
    return 85;
  }

  /**
   * Predict future fatigue based on current trends
   */
  private predictFutureFatigue(
    currentFatigue: number,
    workloadHistory: WorkloadData[],
    acwr: number
  ): number {
    // Simple linear regression on recent fatigue trend
    const recentDays = 7;
    const dailyFatigues = this.calculateDailyFatigues(workloadHistory, recentDays);
    
    if (dailyFatigues.length < 3) {
      // Not enough data, use current fatigue with ACWR adjustment
      return currentFatigue * (acwr > 1.3 ? 1.1 : 0.95);
    }
    
    // Calculate trend slope
    const slope = this.calculateTrendSlope(dailyFatigues);
    
    // Project 3 days forward
    let predictedFatigue = currentFatigue + (slope * 3);
    
    // Apply ACWR modifier
    if (acwr > 1.5) {
      predictedFatigue *= 1.15; // High risk, increase prediction
    } else if (acwr < 0.8) {
      predictedFatigue *= 0.9; // Undertraining, decrease prediction
    }
    
    return Math.min(Math.max(predictedFatigue, 0), 100);
  }

  /**
   * Calculate daily fatigue values for trend analysis
   */
  private calculateDailyFatigues(
    workloadHistory: WorkloadData[],
    days: number
  ): TimeSeriesData<number>[] {
    const dailyFatigues: TimeSeriesData<number>[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayWorkouts = workloadHistory.filter(w => {
        const workoutDate = new Date(w.date);
        return workoutDate.toDateString() === date.toDateString();
      });
      
      const dayLoad = dayWorkouts.reduce((sum, w) => sum + (w.tss || 50), 0);
      const dayFatigue = Math.min((dayLoad / 200) * 100, 100);
      
      dailyFatigues.push({
        timestamp: date,
        value: dayFatigue
      });
    }
    
    return dailyFatigues.reverse();
  }

  /**
   * Calculate trend slope using linear regression
   */
  private calculateTrendSlope(data: TimeSeriesData<number>[]): number {
    if (data.length < 2) return 0;
    
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    data.forEach((point, index) => {
      sumX += index;
      sumY += point.value;
      sumXY += index * point.value;
      sumXX += index * index;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * Determine fatigue trend
   */
  private determineFatigueTrend(
    workloadHistory: WorkloadData[]
  ): 'increasing' | 'stable' | 'decreasing' {
    const dailyFatigues = this.calculateDailyFatigues(workloadHistory, 7);
    const slope = this.calculateTrendSlope(dailyFatigues);
    
    if (slope > 5) return 'increasing';
    if (slope < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate fatigue management recommendation
   */
  private generateRecommendation(
    currentFatigue: number,
    predictedFatigue: number,
    acwr: number,
    trend: 'increasing' | 'stable' | 'decreasing'
  ): string {
    const recommendations: string[] = [];
    
    // ACWR-based recommendations
    if (acwr > 1.5) {
      recommendations.push('Reduce training load immediately to prevent injury');
    } else if (acwr > 1.3) {
      recommendations.push('Monitor closely and consider reducing intensity');
    } else if (acwr < 0.8) {
      recommendations.push('Gradually increase training load to maintain fitness');
    }
    
    // Fatigue-based recommendations
    if (currentFatigue > 70) {
      recommendations.push('Prioritize recovery: extra sleep, nutrition, and light activity');
    } else if (currentFatigue > 50) {
      recommendations.push('Include active recovery sessions and monitor response');
    }
    
    // Trend-based recommendations
    if (trend === 'increasing' && predictedFatigue > currentFatigue + 10) {
      recommendations.push('Schedule a recovery day within the next 48 hours');
    }
    
    return recommendations.length > 0 
      ? recommendations.join('. ')
      : 'Maintain current training program with regular monitoring';
  }

  /**
   * Determine risk level based on fatigue and ACWR
   */
  private determineRiskLevel(
    fatigue: number,
    acwr: number
  ): 'low' | 'moderate' | 'high' | 'critical' {
    // Critical if either metric is in danger zone
    if (fatigue > this.config.fatigueThresholds.critical || 
        acwr > this.config.acwrThresholds.critical) {
      return 'critical';
    }
    
    // High if either metric is high
    if (fatigue > this.config.fatigueThresholds.high || 
        acwr > this.config.acwrThresholds.high) {
      return 'high';
    }
    
    // Moderate if either metric is moderate
    if (fatigue > this.config.fatigueThresholds.moderate || 
        acwr > this.config.acwrThresholds.moderate) {
      return 'moderate';
    }
    
    return 'low';
  }

  /**
   * Calculate confidence score based on available data
   */
  private calculateConfidence(dataPoints: number): number {
    // Minimum 7 days of data for basic confidence
    if (dataPoints < 7) return 0.3;
    if (dataPoints < 14) return 0.5;
    if (dataPoints < 28) return 0.7;
    if (dataPoints < 42) return 0.85;
    return 0.95;
  }

  /**
   * Generate fatigue alerts for a player
   */
  generateAlerts(
    prediction: FatiguePrediction,
    playerName: string
  ): AnalyticsAlert[] {
    const alerts: AnalyticsAlert[] = [];
    
    if (prediction.riskLevel === 'critical') {
      alerts.push({
        id: `fatigue-critical-${prediction.playerId}-${Date.now()}`,
        playerId: prediction.playerId,
        playerName,
        type: 'fatigue',
        severity: 'critical',
        title: 'Critical Fatigue Level',
        message: `${playerName} is showing critical fatigue levels (${Math.round(prediction.currentFatigue)}%). Immediate rest required.`,
        recommendations: [
          'Cancel next training session',
          'Schedule recovery assessment',
          'Monitor closely for 48 hours'
        ],
        timestamp: new Date(),
        acknowledged: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    } else if (prediction.riskLevel === 'high') {
      alerts.push({
        id: `fatigue-high-${prediction.playerId}-${Date.now()}`,
        playerId: prediction.playerId,
        playerName,
        type: 'fatigue',
        severity: 'warning',
        title: 'High Fatigue Warning',
        message: `${playerName} is experiencing high fatigue (${Math.round(prediction.currentFatigue)}%). Consider load reduction.`,
        recommendations: [
          'Reduce training intensity by 30%',
          'Focus on recovery activities',
          'Reassess in 24 hours'
        ],
        timestamp: new Date(),
        acknowledged: false,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      });
    }
    
    // ACWR alerts
    if (prediction.acwr > 1.5) {
      alerts.push({
        id: `acwr-high-${prediction.playerId}-${Date.now()}`,
        playerId: prediction.playerId,
        playerName,
        type: 'load',
        severity: 'warning',
        title: 'High Training Load Ratio',
        message: `${playerName}'s acute:chronic workload ratio is ${prediction.acwr.toFixed(2)} (danger zone > 1.5)`,
        recommendations: [
          'Reduce acute load over next 3-5 days',
          'Monitor for injury symptoms',
          'Focus on recovery modalities'
        ],
        timestamp: new Date(),
        acknowledged: false
      });
    }
    
    return alerts;
  }
}