/**
 * Dashboard Metrics Utilities
 * Calculate actionable metrics for Physical Trainer dashboard
 */

import type { PlayerReadiness, TodaySession, TestResult } from '../types';

export interface InjuryRiskMetrics {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  highRiskPlayers: string[];
}

export interface LoadDistributionMetrics {
  optimal: number;
  under: number;
  over: number;
  totalPlayers: number;
  optimalPercentage: number;
  weekTrend: number; // percentage change from last week
}

export interface RecoveryMetrics {
  recoveredPercentage: number;
  needingAttention: number;
  belowBaselineHRV: number;
  avgRecoveryScore: number;
  criticalPlayers: string[];
}

export interface PerformanceMetrics {
  weeklyIndex: number; // percentage improvement
  topMetric: string;
  topMetricValue: number;
  plateauingPlayers: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Calculate injury risk based on multiple factors
 */
export function calculateInjuryRisk(
  players: PlayerReadiness[],
  testResults?: TestResult[]
): InjuryRiskMetrics {
  const riskScores = players.map(player => {
    let riskScore = 0;
    
    // Factor 1: Fatigue level
    if (player.fatigue === 'high') riskScore += 40;
    else if (player.fatigue === 'medium') riskScore += 20;
    
    // Factor 2: Load percentage
    if (player.load > 100) riskScore += 30;
    else if (player.load > 90) riskScore += 15;
    
    // Factor 3: Status
    if (player.status === 'rest') riskScore += 25;
    else if (player.status === 'caution') riskScore += 15;
    
    // Factor 4: Recovery metrics
    if (player.metrics) {
      if (player.metrics.hrv && player.metrics.hrv < 50) riskScore += 20;
      if (player.metrics.sleepQuality && player.metrics.sleepQuality < 60) riskScore += 15;
      if (player.metrics.soreness && player.metrics.soreness > 7) riskScore += 15;
    }
    
    // Factor 5: Trend
    if (player.trend === 'down') riskScore += 10;
    
    return {
      playerId: player.playerId,
      playerName: player.name,
      riskScore: Math.min(100, riskScore)
    };
  });
  
  const highRisk = riskScores.filter(p => p.riskScore >= 70);
  const mediumRisk = riskScores.filter(p => p.riskScore >= 40 && p.riskScore < 70);
  const lowRisk = riskScores.filter(p => p.riskScore < 40);
  
  return {
    highRisk: highRisk.length,
    mediumRisk: mediumRisk.length,
    lowRisk: lowRisk.length,
    highRiskPlayers: highRisk.slice(0, 3).map(p => p.playerName)
  };
}

/**
 * Calculate load distribution across the team
 */
export function calculateLoadDistribution(players: PlayerReadiness[]): LoadDistributionMetrics {
  const optimal = players.filter(p => p.load >= 70 && p.load <= 90);
  const under = players.filter(p => p.load < 70);
  const over = players.filter(p => p.load > 90);
  
  const optimalPercentage = players.length > 0 
    ? Math.round((optimal.length / players.length) * 100)
    : 0;
    
  // Mock week trend - in production, compare with previous week's data
  const weekTrend = Math.floor(Math.random() * 21) - 10; // -10 to +10
  
  return {
    optimal: optimal.length,
    under: under.length,
    over: over.length,
    totalPlayers: players.length,
    optimalPercentage,
    weekTrend
  };
}

/**
 * Calculate recovery status and identify players needing attention
 */
export function calculateRecoveryStatus(players: PlayerReadiness[]): RecoveryMetrics {
  let totalRecoveryScore = 0;
  let belowBaselineHRV = 0;
  const criticalPlayers: string[] = [];
  
  players.forEach(player => {
    // Calculate individual recovery score (0-100)
    let recoveryScore = 100;
    
    // Deduct based on fatigue
    if (player.fatigue === 'high') recoveryScore -= 40;
    else if (player.fatigue === 'medium') recoveryScore -= 20;
    
    // Consider metrics if available
    if (player.metrics) {
      if (player.metrics.hrv) {
        if (player.metrics.hrv < 50) {
          belowBaselineHRV++;
          recoveryScore -= 20;
        }
      }
      if (player.metrics.sleepQuality) {
        recoveryScore -= Math.max(0, (100 - player.metrics.sleepQuality) / 5);
      }
      if (player.metrics.soreness) {
        recoveryScore -= player.metrics.soreness * 3;
      }
    }
    
    // Check load
    if (player.load > 100) recoveryScore -= 15;
    
    recoveryScore = Math.max(0, recoveryScore);
    totalRecoveryScore += recoveryScore;
    
    // Identify critical players (recovery < 50%)
    if (recoveryScore < 50) {
      criticalPlayers.push(player.name);
    }
  });
  
  const avgRecoveryScore = players.length > 0 
    ? Math.round(totalRecoveryScore / players.length)
    : 0;
    
  const needingAttention = players.filter(p => 
    p.status === 'caution' || p.status === 'rest' || p.fatigue === 'high'
  ).length;
  
  return {
    recoveredPercentage: avgRecoveryScore,
    needingAttention,
    belowBaselineHRV,
    avgRecoveryScore,
    criticalPlayers: criticalPlayers.slice(0, 3)
  };
}

/**
 * Calculate performance trending based on recent data
 */
export function calculatePerformanceTrending(
  players: PlayerReadiness[],
  testResults?: TestResult[]
): PerformanceMetrics {
  // Calculate weekly performance index
  // In production, this would compare actual test results over time
  const weeklyIndex = Math.floor(Math.random() * 15) + 1; // 1-15% improvement
  
  // Determine top improving metric
  const metrics = ['Power', 'Speed', 'Endurance', 'Strength', 'Agility'];
  const topMetric = metrics[Math.floor(Math.random() * metrics.length)];
  const topMetricValue = Math.floor(Math.random() * 12) + 3; // 3-15% improvement
  
  // Count plateauing players (those with stable trend and low improvement)
  const plateauingPlayers = players.filter(p => 
    p.trend === 'stable' || (p.trend === 'down' && p.load < 80)
  ).length;
  
  // Determine overall trend
  const upTrending = players.filter(p => p.trend === 'up').length;
  const downTrending = players.filter(p => p.trend === 'down').length;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (upTrending > downTrending * 1.5) trend = 'up';
  else if (downTrending > upTrending * 1.5) trend = 'down';
  
  return {
    weeklyIndex,
    topMetric,
    topMetricValue,
    plateauingPlayers,
    trend
  };
}

/**
 * Generate smart insights based on current data
 */
export function generateSmartInsights(
  players: PlayerReadiness[],
  sessions: TodaySession[]
): string[] {
  const insights: string[] = [];
  
  // Check for overloaded players
  const overloaded = players.filter(p => p.load > 100);
  if (overloaded.length > 0) {
    insights.push(`${overloaded.length} players above 100% load`);
  }
  
  // Check for fatigue patterns
  const highFatigue = players.filter(p => p.fatigue === 'high');
  if (highFatigue.length >= 3) {
    insights.push(`High team fatigue detected`);
  }
  
  // Check for upcoming high-intensity sessions
  const highIntensitySessions = sessions.filter(s => 
    s.status === 'upcoming' && s.intensity === 'high'
  );
  if (highIntensitySessions.length > 0 && highFatigue.length > 2) {
    insights.push(`Consider reducing intensity today`);
  }
  
  // Check recovery needs
  const needRest = players.filter(p => p.status === 'rest');
  if (needRest.length > 0) {
    insights.push(`${needRest.length} players need rest`);
  }
  
  return insights.slice(0, 3); // Return top 3 insights
}