/**
 * Fatigue Prediction Service
 * 
 * Implements ACWR (Acute:Chronic Workload Ratio) and EWMA (Exponentially Weighted Moving Average)
 * for predicting player fatigue and recovery needs using internal algorithms.
 */

import type { PlayerAIProfile } from './PlayerDistributionAI';
import type { WorkoutSession, PlayerReadiness } from '../types';

// Types for fatigue prediction
export interface WorkloadData {
  playerId: string;
  date: string;
  sessionId: string;
  sessionType: 'strength' | 'conditioning' | 'hybrid' | 'agility' | 'recovery';
  plannedLoad: number; // 0-100
  actualLoad?: number; // 0-100
  duration: number; // minutes
  intensity: 'low' | 'medium' | 'high' | 'max';
  rpe?: number; // Rate of Perceived Exertion 1-10
  heartRateData?: {
    avgHR: number;
    maxHR: number;
    timeInZones: number[]; // minutes in each HR zone
  };
}

export interface ACWRCalculation {
  playerId: string;
  playerName: string;
  date: string;
  acuteLoad: number; // 7-day load
  chronicLoad: number; // 28-day load
  ratio: number; // acute:chronic ratio
  status: 'low-risk' | 'moderate-risk' | 'high-risk' | 'very-high-risk';
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendedAction: string;
}

export interface EWMAMetrics {
  playerId: string;
  currentEWMA: number;
  trend: number[]; // Last 14 days
  volatility: number; // Measure of load variability
  smoothedLoad: number;
  prediction: {
    next7Days: number[];
    confidence: number; // 0-100
    factors: string[];
  };
}

export interface RecoveryPrediction {
  playerId: string;
  playerName: string;
  currentFatigue: number; // 0-100
  estimatedRecoveryTime: number; // hours
  readinessScore: number; // 0-100
  recommendations: RecoveryRecommendation[];
  nextSessionRecommendations: {
    earliestDate: string;
    recommendedIntensity: 'low' | 'medium' | 'high';
    restrictions: string[];
  };
}

export interface RecoveryRecommendation {
  type: 'active-recovery' | 'rest' | 'nutrition' | 'sleep' | 'therapy';
  priority: 'low' | 'medium' | 'high';
  description: string;
  duration: string;
  expectedImpact: number; // 0-100
}

export interface PerformanceTrend {
  playerId: string;
  timeframe: 'week' | 'month' | 'season';
  metrics: {
    workloadTrend: number; // -50 to 50 (% change)
    performanceChange: number; // -50 to 50 (% change)
    consistencyScore: number; // 0-100
    improvementRate: number; // -50 to 50 (% per month)
  };
  predictedPlatteau?: {
    date: string;
    confidence: number;
    interventions: string[];
  };
  injuryRiskTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface FatigueAlert {
  playerId: string;
  playerName: string;
  severity: 'info' | 'warning' | 'critical';
  type: 'high-load' | 'rapid-increase' | 'poor-recovery' | 'injury-risk' | 'plateau';
  message: string;
  recommendations: string[];
  triggerDate: string;
  resolved?: boolean;
  resolvedDate?: string;
}

export class FatiguePrediction {
  private readonly ACUTE_WINDOW = 7; // days
  private readonly CHRONIC_WINDOW = 28; // days
  private readonly EWMA_ALPHA = 0.2; // smoothing factor
  private readonly ACWR_LOW_RISK = 0.8;
  private readonly ACWR_MODERATE_RISK = 1.3;
  private readonly ACWR_HIGH_RISK = 1.5;

  // Mock historical data storage
  private workloadHistory: Map<string, WorkloadData[]> = new Map();
  private ewmaHistory: Map<string, EWMAMetrics> = new Map();

  /**
   * Initialize player workload history with mock data
   */
  initializePlayerHistory(players: PlayerAIProfile[]): void {
    players.forEach(player => {
      if (!this.workloadHistory.has(player.id)) {
        this.workloadHistory.set(player.id, this.generateMockWorkloadHistory(player));
        this.ewmaHistory.set(player.id, this.initializeEWMAMetrics(player));
      }
    });
  }

  /**
   * Calculate ACWR for a player
   */
  calculateACWR(playerId: string, referenceDate: Date = new Date()): ACWRCalculation {
    const history = this.workloadHistory.get(playerId) || [];
    const player = this.getPlayerInfo(playerId);
    
    // Calculate acute load (7 days)
    const acuteLoad = this.calculatePeriodLoad(
      history,
      referenceDate,
      this.ACUTE_WINDOW
    );

    // Calculate chronic load (28 days)
    const chronicLoad = this.calculatePeriodLoad(
      history,
      referenceDate,
      this.CHRONIC_WINDOW
    );

    // Calculate ratio
    const ratio = chronicLoad > 0 ? acuteLoad / chronicLoad : 1;

    // Determine status
    let status: ACWRCalculation['status'];
    if (ratio < this.ACWR_LOW_RISK) {
      status = 'low-risk';
    } else if (ratio < this.ACWR_MODERATE_RISK) {
      status = 'moderate-risk';
    } else if (ratio < this.ACWR_HIGH_RISK) {
      status = 'high-risk';
    } else {
      status = 'very-high-risk';
    }

    // Calculate trend
    const previousACWR = this.calculatePreviousACWR(playerId, referenceDate);
    const trend: ACWRCalculation['trend'] = 
      ratio > previousACWR + 0.1 ? 'increasing' :
      ratio < previousACWR - 0.1 ? 'decreasing' : 'stable';

    return {
      playerId,
      playerName: player.name,
      date: referenceDate.toISOString().split('T')[0],
      acuteLoad,
      chronicLoad,
      ratio,
      status,
      trend,
      recommendedAction: this.getACWRRecommendation(ratio, trend)
    };
  }

  /**
   * Calculate EWMA metrics for a player
   */
  calculateEWMA(playerId: string, referenceDate: Date = new Date()): EWMAMetrics {
    const history = this.workloadHistory.get(playerId) || [];
    const existingMetrics = this.ewmaHistory.get(playerId);

    // Get last 14 days of data
    const recentHistory = this.getRecentHistory(history, referenceDate, 14);
    
    // Calculate EWMA
    let ewma = existingMetrics?.currentEWMA || 50; // Start with moderate load
    const trend: number[] = [];

    recentHistory.forEach((session, index) => {
      const load = session.actualLoad || session.plannedLoad;
      ewma = this.EWMA_ALPHA * load + (1 - this.EWMA_ALPHA) * ewma;
      trend.push(ewma);
    });

    // Calculate volatility (standard deviation of recent loads)
    const loads = recentHistory.map(s => s.actualLoad || s.plannedLoad);
    const avgLoad = loads.reduce((sum, load) => sum + load, 0) / loads.length || 0;
    const volatility = Math.sqrt(
      loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / loads.length || 0
    );

    // Generate predictions
    const prediction = this.generateLoadPrediction(trend, volatility, playerId);

    const metrics: EWMAMetrics = {
      playerId,
      currentEWMA: ewma,
      trend,
      volatility,
      smoothedLoad: ewma,
      prediction
    };

    // Update stored metrics
    this.ewmaHistory.set(playerId, metrics);

    return metrics;
  }

  /**
   * Predict recovery time and status
   */
  predictRecovery(playerId: string, lastSessionDate?: Date): RecoveryPrediction {
    const player = this.getPlayerInfo(playerId);
    const acwr = this.calculateACWR(playerId);
    const ewma = this.calculateEWMA(playerId);
    
    // Calculate current fatigue based on multiple factors
    const currentFatigue = this.calculateCurrentFatigue(playerId, acwr, ewma);
    
    // Estimate recovery time using linear regression model
    const recoveryTime = this.estimateRecoveryTime(currentFatigue, player);
    
    // Calculate readiness score
    const readinessScore = Math.max(0, 100 - currentFatigue);
    
    // Generate recommendations
    const recommendations = this.generateRecoveryRecommendations(currentFatigue, acwr);
    
    // Calculate next session recommendations
    const nextSession = this.calculateNextSessionRecommendations(
      recoveryTime,
      acwr.status,
      currentFatigue
    );

    return {
      playerId,
      playerName: player.name,
      currentFatigue,
      estimatedRecoveryTime: recoveryTime,
      readinessScore,
      recommendations,
      nextSessionRecommendations: nextSession
    };
  }

  /**
   * Analyze performance trends
   */
  analyzePerformanceTrends(
    playerId: string,
    timeframe: 'week' | 'month' | 'season' = 'month'
  ): PerformanceTrend {
    const history = this.workloadHistory.get(playerId) || [];
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
    
    const recentHistory = this.getRecentHistory(history, new Date(), days);
    const previousHistory = this.getRecentHistory(
      history,
      new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      days
    );

    // Calculate workload trend
    const recentAvgLoad = this.calculateAverageLoad(recentHistory);
    const previousAvgLoad = this.calculateAverageLoad(previousHistory);
    const workloadTrend = previousAvgLoad > 0 
      ? ((recentAvgLoad - previousAvgLoad) / previousAvgLoad) * 100 
      : 0;

    // Simulate performance change based on workload consistency
    const consistency = this.calculateConsistency(recentHistory);
    const performanceChange = this.estimatePerformanceChange(workloadTrend, consistency);

    // Calculate improvement rate (simplified)
    const improvementRate = Math.min(50, Math.max(-50, workloadTrend * 0.3 + consistency * 0.1));

    // Predict plateau
    const plateauPrediction = this.predictPlateau(recentHistory);

    // Analyze injury risk trend
    const acwr = this.calculateACWR(playerId);
    const injuryRiskTrend = this.analyzeInjuryRiskTrend(playerId, acwr);

    return {
      playerId,
      timeframe,
      metrics: {
        workloadTrend,
        performanceChange,
        consistencyScore: consistency,
        improvementRate
      },
      predictedPlatteau: plateauPrediction,
      injuryRiskTrend
    };
  }

  /**
   * Generate fatigue alerts for a player
   */
  generateFatigueAlerts(playerId: string): FatigueAlert[] {
    const alerts: FatigueAlert[] = [];
    const player = this.getPlayerInfo(playerId);
    const acwr = this.calculateACWR(playerId);
    const recovery = this.predictRecovery(playerId);
    const trends = this.analyzePerformanceTrends(playerId);

    // High ACWR alert
    if (acwr.status === 'high-risk' || acwr.status === 'very-high-risk') {
      alerts.push({
        playerId,
        playerName: player.name,
        severity: acwr.status === 'very-high-risk' ? 'critical' : 'warning',
        type: 'high-load',
        message: `ACWR ratio of ${acwr.ratio.toFixed(2)} indicates ${acwr.status.replace('-', ' ')}`,
        recommendations: [
          'Reduce training intensity for next 2-3 sessions',
          'Focus on recovery activities',
          'Monitor for injury symptoms'
        ],
        triggerDate: new Date().toISOString()
      });
    }

    // High fatigue alert
    if (recovery.currentFatigue > 75) {
      alerts.push({
        playerId,
        playerName: player.name,
        severity: recovery.currentFatigue > 85 ? 'critical' : 'warning',
        type: 'poor-recovery',
        message: `High fatigue level (${recovery.currentFatigue.toFixed(0)}%)`,
        recommendations: [
          `Estimated recovery time: ${recovery.estimatedRecoveryTime}h`,
          'Consider rest day or active recovery',
          'Evaluate sleep and nutrition'
        ],
        triggerDate: new Date().toISOString()
      });
    }

    // Rapid load increase alert
    if (acwr.trend === 'increasing' && acwr.ratio > 1.2) {
      alerts.push({
        playerId,
        playerName: player.name,
        severity: 'warning',
        type: 'rapid-increase',
        message: 'Training load increasing rapidly',
        recommendations: [
          'Gradual load progression recommended',
          'Monitor recovery indicators',
          'Consider load distribution adjustments'
        ],
        triggerDate: new Date().toISOString()
      });
    }

    // Performance plateau alert
    if (trends.predictedPlatteau && trends.predictedPlatteau.confidence > 70) {
      alerts.push({
        playerId,
        playerName: player.name,
        severity: 'info',
        type: 'plateau',
        message: 'Performance plateau predicted',
        recommendations: trends.predictedPlatteau.interventions,
        triggerDate: new Date().toISOString()
      });
    }

    return alerts;
  }

  /**
   * Add new workout session data
   */
  addWorkoutSession(session: WorkloadData): void {
    const history = this.workloadHistory.get(session.playerId) || [];
    history.push(session);
    
    // Keep only last 90 days
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const filteredHistory = history.filter(s => new Date(s.date) >= cutoffDate);
    
    this.workloadHistory.set(session.playerId, filteredHistory);
    
    // Update EWMA
    this.calculateEWMA(session.playerId);
  }

  /**
   * Get batch predictions for multiple players
   */
  getBatchPredictions(playerIds: string[]): {
    acwr: ACWRCalculation[];
    recovery: RecoveryPrediction[];
    alerts: FatigueAlert[];
  } {
    const acwr = playerIds.map(id => this.calculateACWR(id));
    const recovery = playerIds.map(id => this.predictRecovery(id));
    const alerts = playerIds.flatMap(id => this.generateFatigueAlerts(id));

    return { acwr, recovery, alerts };
  }

  // Private helper methods

  private generateMockWorkloadHistory(player: PlayerAIProfile): WorkloadData[] {
    const history: WorkloadData[] = [];
    const startDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000); // 45 days ago
    
    for (let i = 0; i < 45; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      
      // Skip some days (rest days)
      if (Math.random() > 0.7) continue;
      
      const sessionTypes: WorkloadData['sessionType'][] = ['strength', 'conditioning', 'hybrid', 'agility'];
      const intensities: WorkloadData['intensity'][] = ['low', 'medium', 'high'];
      
      const baseLoad = 50 + player.fitnessLevel.overall * 0.3;
      const variation = (Math.random() - 0.5) * 30;
      const plannedLoad = Math.max(20, Math.min(100, baseLoad + variation));
      
      history.push({
        playerId: player.id,
        date: date.toISOString().split('T')[0],
        sessionId: `session-${i}`,
        sessionType: sessionTypes[Math.floor(Math.random() * sessionTypes.length)],
        plannedLoad,
        actualLoad: plannedLoad + (Math.random() - 0.5) * 20,
        duration: 45 + Math.random() * 30,
        intensity: intensities[Math.floor(Math.random() * intensities.length)],
        rpe: Math.max(1, Math.min(10, plannedLoad / 10 + (Math.random() - 0.5) * 2))
      });
    }
    
    return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private initializeEWMAMetrics(player: PlayerAIProfile): EWMAMetrics {
    return {
      playerId: player.id,
      currentEWMA: 50 + player.fitnessLevel.overall * 0.2,
      trend: [],
      volatility: 15 + Math.random() * 10,
      smoothedLoad: 50,
      prediction: {
        next7Days: [],
        confidence: 75,
        factors: ['Historical patterns', 'Fitness level', 'Recovery capacity']
      }
    };
  }

  private calculatePeriodLoad(
    history: WorkloadData[],
    referenceDate: Date,
    days: number
  ): number {
    const cutoffDate = new Date(referenceDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    const periodSessions = history.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= cutoffDate && sessionDate <= referenceDate;
    });

    if (periodSessions.length === 0) return 0;

    // Calculate weighted load (considering intensity and duration)
    const totalLoad = periodSessions.reduce((sum, session) => {
      const load = session.actualLoad || session.plannedLoad;
      const intensityMultiplier = {
        'low': 0.7,
        'medium': 1.0,
        'high': 1.3,
        'max': 1.6
      }[session.intensity] || 1.0;
      
      const durationMultiplier = session.duration / 60; // Normalize to 1 hour
      
      return sum + (load * intensityMultiplier * durationMultiplier);
    }, 0);

    return totalLoad / days; // Average daily load
  }

  private calculatePreviousACWR(playerId: string, referenceDate: Date): number {
    const previousWeek = new Date(referenceDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const history = this.workloadHistory.get(playerId) || [];
    
    const acuteLoad = this.calculatePeriodLoad(history, previousWeek, this.ACUTE_WINDOW);
    const chronicLoad = this.calculatePeriodLoad(history, previousWeek, this.CHRONIC_WINDOW);
    
    return chronicLoad > 0 ? acuteLoad / chronicLoad : 1;
  }

  private getACWRRecommendation(ratio: number, trend: ACWRCalculation['trend']): string {
    if (ratio < this.ACWR_LOW_RISK) {
      return trend === 'decreasing' ? 
        'Consider gradually increasing training load' :
        'Maintain current training progression';
    } else if (ratio < this.ACWR_MODERATE_RISK) {
      return 'Monitor closely and maintain current load';
    } else if (ratio < this.ACWR_HIGH_RISK) {
      return 'Reduce training intensity and volume';
    } else {
      return 'Immediate load reduction recommended - high injury risk';
    }
  }

  private getRecentHistory(
    history: WorkloadData[],
    referenceDate: Date,
    days: number
  ): WorkloadData[] {
    const cutoffDate = new Date(referenceDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    return history.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= cutoffDate && sessionDate <= referenceDate;
    });
  }

  private generateLoadPrediction(
    trend: number[],
    volatility: number,
    playerId: string
  ): EWMAMetrics['prediction'] {
    const predictions: number[] = [];
    const lastValue = trend[trend.length - 1] || 50;
    
    // Simple linear extrapolation with noise
    for (let i = 1; i <= 7; i++) {
      const trendComponent = trend.length > 1 ? 
        (trend[trend.length - 1] - trend[trend.length - 2]) * i : 0;
      const noiseComponent = (Math.random() - 0.5) * volatility * 0.5;
      
      predictions.push(Math.max(0, Math.min(100, lastValue + trendComponent + noiseComponent)));
    }
    
    const confidence = Math.max(50, Math.min(95, 85 - volatility * 2));
    
    return {
      next7Days: predictions,
      confidence,
      factors: [
        'Recent training patterns',
        `Load volatility: ${volatility.toFixed(1)}`,
        'Player fitness profile'
      ]
    };
  }

  private calculateCurrentFatigue(
    playerId: string,
    acwr: ACWRCalculation,
    ewma: EWMAMetrics
  ): number {
    let fatigue = 30; // Base fatigue level
    
    // ACWR contribution
    if (acwr.ratio > 1.5) fatigue += 35;
    else if (acwr.ratio > 1.3) fatigue += 25;
    else if (acwr.ratio > 1.1) fatigue += 15;
    
    // EWMA contribution
    fatigue += ewma.currentEWMA * 0.4;
    
    // Volatility contribution (inconsistent training increases fatigue)
    fatigue += ewma.volatility * 0.8;
    
    // Random individual variation
    fatigue += (Math.random() - 0.5) * 20;
    
    return Math.max(0, Math.min(100, fatigue));
  }

  private estimateRecoveryTime(fatigue: number, player: PlayerAIProfile): number {
    // Base recovery model: linear relationship with fatigue
    let recoveryHours = fatigue * 0.8; // 80% of fatigue level in hours
    
    // Adjust for player fitness level
    const fitnessMultiplier = 1 - (player.fitnessLevel.recovery / 200);
    recoveryHours *= (1 + fitnessMultiplier);
    
    // Adjust for age (simulated)
    const ageMultiplier = 1 + Math.random() * 0.3; // 0-30% increase
    recoveryHours *= ageMultiplier;
    
    // Minimum recovery time
    return Math.max(8, Math.round(recoveryHours));
  }

  private generateRecoveryRecommendations(
    fatigue: number,
    acwr: ACWRCalculation
  ): RecoveryRecommendation[] {
    const recommendations: RecoveryRecommendation[] = [];
    
    if (fatigue > 70) {
      recommendations.push({
        type: 'rest',
        priority: 'high',
        description: 'Complete rest or very light activity',
        duration: '24-48 hours',
        expectedImpact: 30
      });
    }
    
    if (acwr.ratio > 1.3) {
      recommendations.push({
        type: 'active-recovery',
        priority: 'high',
        description: 'Light aerobic exercise, stretching, mobility work',
        duration: '30-45 minutes',
        expectedImpact: 25
      });
    }
    
    recommendations.push({
      type: 'sleep',
      priority: fatigue > 50 ? 'high' : 'medium',
      description: 'Ensure 8-9 hours of quality sleep',
      duration: 'Nightly',
      expectedImpact: 35
    });
    
    if (fatigue > 40) {
      recommendations.push({
        type: 'nutrition',
        priority: 'medium',
        description: 'Focus on post-workout nutrition and hydration',
        duration: '24-48 hours post-session',
        expectedImpact: 20
      });
    }
    
    return recommendations;
  }

  private calculateNextSessionRecommendations(
    recoveryTime: number,
    acwrStatus: ACWRCalculation['status'],
    fatigue: number
  ): RecoveryPrediction['nextSessionRecommendations'] {
    const earliestDate = new Date(Date.now() + recoveryTime * 60 * 60 * 1000);
    
    let intensity: 'low' | 'medium' | 'high' = 'medium';
    const restrictions: string[] = [];
    
    if (acwrStatus === 'very-high-risk' || fatigue > 80) {
      intensity = 'low';
      restrictions.push('No high-intensity intervals');
      restrictions.push('Limit session to 45 minutes');
    } else if (acwrStatus === 'high-risk' || fatigue > 60) {
      intensity = 'medium';
      restrictions.push('Avoid maximum efforts');
    }
    
    return {
      earliestDate: earliestDate.toISOString().split('T')[0],
      recommendedIntensity: intensity,
      restrictions
    };
  }

  private calculateAverageLoad(history: WorkloadData[]): number {
    if (history.length === 0) return 0;
    
    return history.reduce((sum, session) => 
      sum + (session.actualLoad || session.plannedLoad), 0
    ) / history.length;
  }

  private calculateConsistency(history: WorkloadData[]): number {
    if (history.length < 2) return 100;
    
    const loads = history.map(s => s.actualLoad || s.plannedLoad);
    const mean = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / loads.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to consistency score (lower std dev = higher consistency)
    return Math.max(0, Math.min(100, 100 - (standardDeviation * 2)));
  }

  private estimatePerformanceChange(workloadTrend: number, consistency: number): number {
    // Simplified model: consistent, moderate load increases lead to performance gains
    let change = 0;
    
    // Workload trend contribution
    if (workloadTrend > 0 && workloadTrend < 20) {
      change += workloadTrend * 0.5; // Gradual increase is good
    } else if (workloadTrend > 20) {
      change -= (workloadTrend - 20) * 0.3; // Too rapid increase is bad
    } else if (workloadTrend < -10) {
      change += workloadTrend * 0.2; // Detraining effect
    }
    
    // Consistency contribution
    change += (consistency - 50) * 0.1;
    
    return Math.max(-50, Math.min(50, change));
  }

  private predictPlateau(history: WorkloadData[]): PerformanceTrend['predictedPlatteau'] | undefined {
    if (history.length < 14) return undefined;
    
    // Simple plateau detection: little change in recent performance
    const recent = history.slice(-7);
    const previous = history.slice(-14, -7);
    
    const recentAvg = this.calculateAverageLoad(recent);
    const previousAvg = this.calculateAverageLoad(previous);
    
    const change = Math.abs(recentAvg - previousAvg);
    const consistency = this.calculateConsistency(recent);
    
    if (change < 5 && consistency > 85) {
      return {
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        confidence: 75,
        interventions: [
          'Vary training intensity',
          'Introduce new exercise modalities',
          'Adjust periodization',
          'Consider brief recovery period'
        ]
      };
    }
    
    return undefined;
  }

  private analyzeInjuryRiskTrend(
    playerId: string,
    acwr: ACWRCalculation
  ): PerformanceTrend['injuryRiskTrend'] {
    // Compare current ACWR with historical trend
    const previousACWR = this.calculatePreviousACWR(playerId, new Date());
    
    if (acwr.ratio > previousACWR + 0.2) return 'increasing';
    if (acwr.ratio < previousACWR - 0.2) return 'decreasing';
    return 'stable';
  }

  private getPlayerInfo(playerId: string): { name: string } {
    // Mock player lookup - in real implementation, this would query the player service
    return {
      name: `Player ${playerId.slice(-4)}`
    };
  }
}

export const fatiguePrediction = new FatiguePrediction();