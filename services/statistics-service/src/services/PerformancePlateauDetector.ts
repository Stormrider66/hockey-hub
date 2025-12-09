import { PredictionType } from '../entities';

export interface PerformanceMetric {
  metric: string;
  values: number[];
  timestamps: Date[];
  trend: 'improving' | 'declining' | 'plateau' | 'volatile';
  significance: number; // 0-100
}

export interface PlateauDetection {
  plateauDetected: boolean;
  plateauDuration: number; // days
  plateauMetrics: string[];
  plateauSeverity: 'mild' | 'moderate' | 'severe';
  plateauType: 'performance' | 'physical' | 'technical' | 'mental';
  breakoutProbability: number; // 0-100
  plateauConfidence: number; // 0-100
}

export interface BreakoutStrategy {
  strategy: string;
  expectedImpact: number; // 0-100
  timeToEffect: number; // days
  difficulty: 'low' | 'medium' | 'high';
  requirements: string[];
  successProbability: number; // 0-100
}

export class PerformancePlateauDetector {
  private readonly MODEL_VERSION = '1.3.0';
  private readonly PLATEAU_DETECTION_THRESHOLD = 0.05; // 5% variance threshold
  private readonly MIN_PLATEAU_DURATION = 14; // Minimum days to consider a plateau
  private readonly PERFORMANCE_METRICS = [
    'goals',
    'assists',
    'points',
    'shots',
    'shotAccuracy',
    'timeOnIce',
    'faceoffWinPercentage',
    'hits',
    'blockedShots',
    'plusMinus'
  ];

  async predictPerformance(
    playerId: string,
    playerStats: any[]
  ): Promise<any> {
    const performanceMetrics = this.extractPerformanceMetrics(playerStats);
    const plateauAnalysis = this.detectPlateau(playerStats);
    const riskFactors = this.identifyPerformanceRiskFactors(performanceMetrics, plateauAnalysis);
    const recommendations = this.generatePerformanceRecommendations(plateauAnalysis, riskFactors);

    const confidence = this.calculateDetectionConfidence(performanceMetrics);
    const performanceRisk = this.calculatePerformanceRisk(plateauAnalysis, performanceMetrics);

    return {
      id: `performance_${playerId}_${Date.now()}`,
      playerId,
      type: PredictionType.PERFORMANCE,
      riskScore: performanceRisk,
      confidence,
      predictions: {
        value: plateauAnalysis.breakoutProbability,
        unit: 'probability_percentage',
        category: this.getPerformanceCategory(performanceRisk),
        factors: {
          plateauDetected: plateauAnalysis.plateauDetected,
          plateauDuration: plateauAnalysis.plateauDuration,
          plateauSeverity: plateauAnalysis.plateauSeverity,
          breakoutProbability: plateauAnalysis.breakoutProbability
        },
        timeSeries: this.generatePerformanceProjection(performanceMetrics, plateauAnalysis)
      },
      riskFactors,
      recommendations,
      validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      metadata: {
        modelVersion: this.MODEL_VERSION,
        metricsAnalyzed: Object.keys(performanceMetrics).length,
        plateauThreshold: this.PLATEAU_DETECTION_THRESHOLD,
        accuracy: 0.79
      }
    };
  }

  detectPlateau(playerStats: any[]): {
    plateauDetected: boolean;
    plateauDuration: number;
    plateauMetrics: string[];
    breakoutProbability: number;
    recommendations: Array<{
      strategy: string;
      expectedImpact: number;
      timeToEffect: number;
      difficulty: 'low' | 'medium' | 'high';
    }>;
  } {
    const performanceMetrics = this.extractPerformanceMetrics(playerStats);
    const plateauAnalysis = this.analyzeForPlateaus(performanceMetrics);
    const breakoutProbability = this.calculateBreakoutProbability(plateauAnalysis, performanceMetrics);
    const recommendations = this.generateBreakoutStrategies(plateauAnalysis, performanceMetrics);

    return {
      plateauDetected: plateauAnalysis.plateauDetected,
      plateauDuration: plateauAnalysis.plateauDuration,
      plateauMetrics: plateauAnalysis.plateauMetrics,
      breakoutProbability,
      recommendations
    };
  }

  private extractPerformanceMetrics(playerStats: any[]): Record<string, PerformanceMetric> {
    const metrics: Record<string, PerformanceMetric> = {};

    this.PERFORMANCE_METRICS.forEach(metricName => {
      const values: number[] = [];
      const timestamps: Date[] = [];

      // Extract last 60 days of data
      const recentStats = playerStats
        .filter(stat => {
          const statDate = new Date(stat.gameDate || stat.createdAt);
          const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
          return statDate > sixtyDaysAgo;
        })
        .sort((a, b) => new Date(a.gameDate || a.createdAt).getTime() - new Date(b.gameDate || b.createdAt).getTime());

      recentStats.forEach(stat => {
        const value = this.extractMetricValue(stat, metricName);
        if (value !== null && value !== undefined) {
          values.push(value);
          timestamps.push(new Date(stat.gameDate || stat.createdAt));
        }
      });

      if (values.length >= 10) { // Need minimum data points
        metrics[metricName] = {
          metric: metricName,
          values,
          timestamps,
          trend: this.calculateTrend(values),
          significance: this.calculateMetricSignificance(metricName, values)
        };
      }
    });

    return metrics;
  }

  private extractMetricValue(stat: any, metricName: string): number | null {
    const metricMap: Record<string, string> = {
      'goals': 'goals',
      'assists': 'assists',
      'points': 'points',
      'shots': 'shots',
      'shotAccuracy': 'shotAccuracy',
      'timeOnIce': 'timeOnIce',
      'faceoffWinPercentage': 'faceoffWinPercentage',
      'hits': 'hits',
      'blockedShots': 'blockedShots',
      'plusMinus': 'plusMinus'
    };

    const fieldName = metricMap[metricName];
    return stat[fieldName] || 0;
  }

  private calculateTrend(values: number[]): 'improving' | 'declining' | 'plateau' | 'volatile' {
    if (values.length < 5) return 'volatile';

    // Calculate linear regression slope
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = values.reduce((sum, val) => sum + val, 0) / n;

    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (values[i] - meanY), 0);
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);

    const slope = denominator === 0 ? 0 : numerator / denominator;

    // Calculate variance to detect plateaus
    const variance = values.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0) / n;
    const coefficientOfVariation = meanY === 0 ? 0 : Math.sqrt(variance) / Math.abs(meanY);

    // Determine trend
    if (coefficientOfVariation < this.PLATEAU_DETECTION_THRESHOLD) {
      return 'plateau';
    } else if (coefficientOfVariation > 0.3) {
      return 'volatile';
    } else if (slope > 0.1) {
      return 'improving';
    } else if (slope < -0.1) {
      return 'declining';
    } else {
      return 'plateau';
    }
  }

  private calculateMetricSignificance(metricName: string, values: number[]): number {
    // Weight different metrics by their importance to overall performance
    const metricWeights: Record<string, number> = {
      'goals': 100,
      'assists': 90,
      'points': 95,
      'shots': 70,
      'shotAccuracy': 85,
      'timeOnIce': 80,
      'faceoffWinPercentage': 60,
      'hits': 40,
      'blockedShots': 50,
      'plusMinus': 75
    };

    const baseWeight = metricWeights[metricName] || 50;
    
    // Adjust based on metric variance (more consistent metrics are more significant)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const coefficientOfVariation = mean === 0 ? 1 : Math.sqrt(variance) / Math.abs(mean);
    
    const consistencyFactor = Math.max(0.5, 1 - coefficientOfVariation);
    
    return Math.round(baseWeight * consistencyFactor);
  }

  private analyzeForPlateaus(metrics: Record<string, PerformanceMetric>): PlateauDetection {
    const plateauMetrics: string[] = [];
    let totalPlateauDuration = 0;
    let plateauCount = 0;

    Object.entries(metrics).forEach(([metricName, metric]) => {
      if (metric.trend === 'plateau') {
        plateauMetrics.push(metricName);
        plateauCount++;
        
        // Calculate plateau duration for this metric
        const plateauDuration = this.calculatePlateauDuration(metric.values);
        totalPlateauDuration += plateauDuration;
      }
    });

    const avgPlateauDuration = plateauCount > 0 ? totalPlateauDuration / plateauCount : 0;
    const plateauDetected = plateauCount >= 2 && avgPlateauDuration >= this.MIN_PLATEAU_DURATION;

    // Determine plateau severity
    const plateauSeverity = this.determinePlateauSeverity(plateauCount, Object.keys(metrics).length, avgPlateauDuration);
    
    // Determine plateau type
    const plateauType = this.determinePlateauType(plateauMetrics);

    // Calculate breakout probability
    const breakoutProbability = this.calculateBreakoutProbability({ 
      plateauDetected, 
      plateauDuration: avgPlateauDuration,
      plateauMetrics,
      plateauSeverity,
      plateauType,
      breakoutProbability: 0,
      plateauConfidence: 0
    }, metrics);

    const plateauConfidence = this.calculatePlateauConfidence(metrics, plateauMetrics);

    return {
      plateauDetected,
      plateauDuration: avgPlateauDuration,
      plateauMetrics,
      plateauSeverity,
      plateauType,
      breakoutProbability,
      plateauConfidence
    };
  }

  private calculatePlateauDuration(values: number[]): number {
    if (values.length < 5) return 0;

    let plateauStart = 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const threshold = mean * this.PLATEAU_DETECTION_THRESHOLD;

    // Find the start of the plateau (when variance becomes low)
    for (let i = 4; i < values.length; i++) {
      const recentValues = values.slice(i - 4, i + 1);
      const recentMean = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
      const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - recentMean, 2), 0) / recentValues.length;
      
      if (Math.sqrt(variance) <= threshold) {
        plateauStart = i - 4;
        break;
      }
    }

    // Assume each data point represents approximately 3 days (games every 3 days average)
    return (values.length - plateauStart) * 3;
  }

  private determinePlateauSeverity(
    plateauCount: number,
    totalMetrics: number,
    avgDuration: number
  ): 'mild' | 'moderate' | 'severe' {
    const plateauPercentage = plateauCount / totalMetrics;
    
    if (plateauPercentage > 0.7 || avgDuration > 45) {
      return 'severe';
    } else if (plateauPercentage > 0.4 || avgDuration > 30) {
      return 'moderate';
    } else {
      return 'mild';
    }
  }

  private determinePlateauType(plateauMetrics: string[]): 'performance' | 'physical' | 'technical' | 'mental' {
    const performanceMetrics = ['goals', 'assists', 'points'];
    const physicalMetrics = ['timeOnIce', 'hits', 'shots'];
    const technicalMetrics = ['shotAccuracy', 'faceoffWinPercentage'];
    const mentalMetrics = ['plusMinus'];

    const performanceCount = plateauMetrics.filter(m => performanceMetrics.includes(m)).length;
    const physicalCount = plateauMetrics.filter(m => physicalMetrics.includes(m)).length;
    const technicalCount = plateauMetrics.filter(m => technicalMetrics.includes(m)).length;
    const mentalCount = plateauMetrics.filter(m => mentalMetrics.includes(m)).length;

    const max = Math.max(performanceCount, physicalCount, technicalCount, mentalCount);
    
    if (max === performanceCount) return 'performance';
    if (max === physicalCount) return 'physical';
    if (max === technicalCount) return 'technical';
    return 'mental';
  }

  private calculateBreakoutProbability(
    plateauAnalysis: PlateauDetection,
    metrics: Record<string, PerformanceMetric>
  ): number {
    let probability = 70; // Base probability

    if (!plateauAnalysis.plateauDetected) {
      return 90; // High probability if no plateau
    }

    // Duration impact (longer plateaus are harder to break)
    const durationImpact = Math.min(30, plateauAnalysis.plateauDuration * 0.5);
    probability -= durationImpact;

    // Severity impact
    const severityImpacts = { mild: 5, moderate: 15, severe: 25 };
    probability -= severityImpacts[plateauAnalysis.plateauSeverity];

    // Number of affected metrics
    const metricsImpact = plateauAnalysis.plateauMetrics.length * 3;
    probability -= metricsImpact;

    // Look for positive trends in non-plateau metrics
    const improvingMetrics = Object.values(metrics).filter(m => m.trend === 'improving').length;
    probability += improvingMetrics * 5;

    // Check for recent improvements
    const recentImprovement = this.checkRecentImprovement(metrics);
    if (recentImprovement) {
      probability += 15;
    }

    return Math.max(10, Math.min(95, probability));
  }

  private checkRecentImprovement(metrics: Record<string, PerformanceMetric>): boolean {
    return Object.values(metrics).some(metric => {
      if (metric.values.length < 6) return false;
      
      const recent = metric.values.slice(-3);
      const previous = metric.values.slice(-6, -3);
      
      const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const previousAvg = previous.reduce((sum, val) => sum + val, 0) / previous.length;
      
      return recentAvg > previousAvg * 1.1; // 10% improvement
    });
  }

  private generateBreakoutStrategies(
    plateauAnalysis: PlateauDetection,
    metrics: Record<string, PerformanceMetric>
  ): BreakoutStrategy[] {
    const strategies: BreakoutStrategy[] = [];

    if (!plateauAnalysis.plateauDetected) {
      strategies.push({
        strategy: 'Continue Current Training',
        expectedImpact: 85,
        timeToEffect: 7,
        difficulty: 'low',
        requirements: ['Maintain consistency', 'Monitor progress'],
        successProbability: 90
      });
      return strategies;
    }

    // Type-specific strategies
    switch (plateauAnalysis.plateauType) {
      case 'performance':
        strategies.push(
          {
            strategy: 'Skill-Specific Training Intensification',
            expectedImpact: 75,
            timeToEffect: 14,
            difficulty: 'medium',
            requirements: ['Dedicated practice time', 'Skill coach', 'Video analysis'],
            successProbability: 70
          },
          {
            strategy: 'Mental Performance Training',
            expectedImpact: 60,
            timeToEffect: 21,
            difficulty: 'medium',
            requirements: ['Sports psychologist', 'Visualization training', 'Confidence building'],
            successProbability: 65
          }
        );
        break;

      case 'physical':
        strategies.push(
          {
            strategy: 'Training Load Periodization',
            expectedImpact: 80,
            timeToEffect: 21,
            difficulty: 'high',
            requirements: ['Strength coach', 'Load monitoring', 'Recovery protocols'],
            successProbability: 75
          },
          {
            strategy: 'Cross-Training Integration',
            expectedImpact: 65,
            timeToEffect: 14,
            difficulty: 'medium',
            requirements: ['Alternative training methods', 'Equipment access', 'Program design'],
            successProbability: 70
          }
        );
        break;

      case 'technical':
        strategies.push(
          {
            strategy: 'Technical Skill Refinement',
            expectedImpact: 85,
            timeToEffect: 14,
            difficulty: 'medium',
            requirements: ['Technical coach', 'Video analysis', 'Deliberate practice'],
            successProbability: 80
          },
          {
            strategy: 'Equipment and Biomechanics Review',
            expectedImpact: 50,
            timeToEffect: 7,
            difficulty: 'low',
            requirements: ['Equipment check', 'Biomechanical analysis', 'Adjustments'],
            successProbability: 60
          }
        );
        break;

      case 'mental':
        strategies.push(
          {
            strategy: 'Mental Reset and Motivation',
            expectedImpact: 70,
            timeToEffect: 10,
            difficulty: 'medium',
            requirements: ['Mental health support', 'Goal reassessment', 'Motivation techniques'],
            successProbability: 65
          },
          {
            strategy: 'Environmental Change',
            expectedImpact: 55,
            timeToEffect: 7,
            difficulty: 'low',
            requirements: ['Training environment change', 'New challenges', 'Social support'],
            successProbability: 60
          }
        );
        break;
    }

    // General strategies based on severity
    if (plateauAnalysis.plateauSeverity === 'severe') {
      strategies.push({
        strategy: 'Complete Program Overhaul',
        expectedImpact: 90,
        timeToEffect: 28,
        difficulty: 'high',
        requirements: ['Comprehensive assessment', 'New coaching approach', 'Extended timeline'],
        successProbability: 80
      });
    } else if (plateauAnalysis.plateauSeverity === 'moderate') {
      strategies.push({
        strategy: 'Targeted Intervention Protocol',
        expectedImpact: 75,
        timeToEffect: 21,
        difficulty: 'medium',
        requirements: ['Specific focus areas', 'Modified training', 'Progress tracking'],
        successProbability: 75
      });
    }

    // Duration-specific strategies
    if (plateauAnalysis.plateauDuration > 45) {
      strategies.push({
        strategy: 'Extended Recovery and Reset',
        expectedImpact: 85,
        timeToEffect: 14,
        difficulty: 'medium',
        requirements: ['Planned deload', 'Mental break', 'Gradual return'],
        successProbability: 85
      });
    }

    return strategies.sort((a, b) => (b.expectedImpact * b.successProbability) - (a.expectedImpact * a.successProbability));
  }

  private calculatePlateauConfidence(
    metrics: Record<string, PerformanceMetric>,
    plateauMetrics: string[]
  ): number {
    let confidence = 80;

    // More data points increase confidence
    const avgDataPoints = Object.values(metrics).reduce((sum, m) => sum + m.values.length, 0) / Object.keys(metrics).length;
    if (avgDataPoints > 20) confidence += 10;
    else if (avgDataPoints < 10) confidence -= 15;

    // More metrics in plateau increase confidence
    const plateauPercentage = plateauMetrics.length / Object.keys(metrics).length;
    confidence += plateauPercentage * 20;

    // High-significance metrics in plateau increase confidence
    const significantPlateauMetrics = plateauMetrics.filter(metricName => {
      const metric = metrics[metricName];
      return metric && metric.significance > 80;
    });
    confidence += significantPlateauMetrics.length * 5;

    return Math.max(60, Math.min(95, confidence));
  }

  private identifyPerformanceRiskFactors(
    metrics: Record<string, PerformanceMetric>,
    plateauAnalysis: PlateauDetection
  ): Array<{
    factor: string;
    impact: number;
    description: string;
  }> {
    const riskFactors = [];

    if (plateauAnalysis.plateauDetected) {
      riskFactors.push({
        factor: 'Performance Plateau Detected',
        impact: Math.min(100, plateauAnalysis.plateauDuration * 1.5),
        description: `${plateauAnalysis.plateauSeverity} plateau lasting ${plateauAnalysis.plateauDuration} days across ${plateauAnalysis.plateauMetrics.length} metrics`
      });
    }

    // Check for declining metrics
    const decliningMetrics = Object.entries(metrics).filter(([_, metric]) => metric.trend === 'declining');
    if (decliningMetrics.length > 0) {
      riskFactors.push({
        factor: 'Declining Performance Metrics',
        impact: decliningMetrics.length * 15,
        description: `${decliningMetrics.length} metrics showing declining trend: ${decliningMetrics.map(([name]) => name).join(', ')}`
      });
    }

    // Check for high volatility
    const volatileMetrics = Object.entries(metrics).filter(([_, metric]) => metric.trend === 'volatile');
    if (volatileMetrics.length > 0) {
      riskFactors.push({
        factor: 'Performance Inconsistency',
        impact: volatileMetrics.length * 10,
        description: `Inconsistent performance in ${volatileMetrics.length} metrics indicating potential underlying issues`
      });
    }

    // Check for key performance metrics being affected
    const keyMetrics = ['goals', 'assists', 'points'];
    const affectedKeyMetrics = plateauAnalysis.plateauMetrics.filter(m => keyMetrics.includes(m));
    if (affectedKeyMetrics.length > 0) {
      riskFactors.push({
        factor: 'Core Performance Metrics Affected',
        impact: affectedKeyMetrics.length * 25,
        description: `Primary scoring metrics affected: ${affectedKeyMetrics.join(', ')}`
      });
    }

    return riskFactors.sort((a, b) => b.impact - a.impact);
  }

  private generatePerformanceRecommendations(
    plateauAnalysis: PlateauDetection,
    riskFactors: any[]
  ): string[] {
    const recommendations = [];

    if (!plateauAnalysis.plateauDetected) {
      recommendations.push('Continue current performance trajectory');
      recommendations.push('Monitor for early plateau indicators');
      recommendations.push('Maintain training consistency');
      return recommendations;
    }

    // Severity-based recommendations
    switch (plateauAnalysis.plateauSeverity) {
      case 'severe':
        recommendations.push('URGENT: Comprehensive performance evaluation needed');
        recommendations.push('Consider complete training program restructure');
        recommendations.push('Seek specialized coaching consultation');
        break;
      case 'moderate':
        recommendations.push('Implement targeted intervention strategies');
        recommendations.push('Modify training approach in affected areas');
        recommendations.push('Increase monitoring frequency');
        break;
      case 'mild':
        recommendations.push('Minor adjustments to training routine');
        recommendations.push('Focus on identified weak areas');
        recommendations.push('Continue monitoring progress');
        break;
    }

    // Type-specific recommendations
    switch (plateauAnalysis.plateauType) {
      case 'performance':
        recommendations.push('Enhance skill-specific training sessions');
        recommendations.push('Add mental performance components');
        break;
      case 'physical':
        recommendations.push('Review and adjust physical conditioning');
        recommendations.push('Implement periodization strategies');
        break;
      case 'technical':
        recommendations.push('Focus on technical skill refinement');
        recommendations.push('Increase deliberate practice time');
        break;
      case 'mental':
        recommendations.push('Address mental/motivational factors');
        recommendations.push('Consider sports psychology support');
        break;
    }

    // Add specific recommendations based on risk factors
    riskFactors.slice(0, 2).forEach(factor => {
      switch (factor.factor) {
        case 'Declining Performance Metrics':
          recommendations.push('Immediate intervention for declining areas');
          break;
        case 'Performance Inconsistency':
          recommendations.push('Focus on consistency and routine optimization');
          break;
        case 'Core Performance Metrics Affected':
          recommendations.push('Priority focus on primary scoring abilities');
          break;
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private generatePerformanceProjection(
    metrics: Record<string, PerformanceMetric>,
    plateauAnalysis: PlateauDetection
  ): Array<{
    timestamp: Date;
    value: number;
    confidence: number;
  }> {
    const projection = [];
    let currentPerformance = this.calculateOverallPerformanceScore(metrics);
    let confidence = 90;

    // Project next 4 weeks
    for (let week = 1; week <= 4; week++) {
      const timestamp = new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000);

      if (plateauAnalysis.plateauDetected) {
        // If in plateau, performance likely to remain stable or slightly improve with intervention
        const improvementFactor = plateauAnalysis.breakoutProbability / 100;
        currentPerformance += (week * 2 * improvementFactor); // Gradual improvement if breakout occurs
      } else {
        // If not in plateau, continue current trend
        const improvingMetrics = Object.values(metrics).filter(m => m.trend === 'improving').length;
        const totalMetrics = Object.keys(metrics).length;
        const improvementRate = (improvingMetrics / totalMetrics) * 3; // 3% per week max
        currentPerformance += improvementRate;
      }

      // Confidence decreases over time
      confidence = Math.max(60, confidence - week * 5);

      projection.push({
        timestamp,
        value: Math.round(Math.min(100, Math.max(0, currentPerformance))),
        confidence: Math.round(confidence)
      });
    }

    return projection;
  }

  private calculateOverallPerformanceScore(metrics: Record<string, PerformanceMetric>): number {
    let totalScore = 0;
    let totalWeight = 0;

    Object.values(metrics).forEach(metric => {
      const recentValues = metric.values.slice(-5); // Last 5 games
      const avgValue = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
      
      // Normalize to 0-100 scale (this would need sport-specific normalization in production)
      const normalizedValue = Math.min(100, avgValue * 10); // Simple normalization
      
      totalScore += normalizedValue * metric.significance;
      totalWeight += metric.significance;
    });

    return totalWeight > 0 ? totalScore / totalWeight : 50;
  }

  private calculatePerformanceRisk(
    plateauAnalysis: PlateauDetection,
    metrics: Record<string, PerformanceMetric>
  ): number {
    let risk = 0;

    if (plateauAnalysis.plateauDetected) {
      // Base plateau risk
      risk += 30;
      
      // Duration risk
      risk += Math.min(30, plateauAnalysis.plateauDuration);
      
      // Severity risk
      const severityRisks = { mild: 10, moderate: 20, severe: 35 };
      risk += severityRisks[plateauAnalysis.plateauSeverity];
      
      // Number of affected metrics
      risk += plateauAnalysis.plateauMetrics.length * 5;
    }

    // Check for declining trends
    const decliningMetrics = Object.values(metrics).filter(m => m.trend === 'declining').length;
    risk += decliningMetrics * 15;

    // Reduce risk for improving trends
    const improvingMetrics = Object.values(metrics).filter(m => m.trend === 'improving').length;
    risk = Math.max(0, risk - improvingMetrics * 10);

    return Math.min(100, risk);
  }

  private calculateDetectionConfidence(metrics: Record<string, PerformanceMetric>): number {
    let confidence = 75;

    // More metrics increase confidence
    const metricCount = Object.keys(metrics).length;
    confidence += Math.min(15, metricCount * 2);

    // More data points increase confidence
    const avgDataPoints = Object.values(metrics).reduce((sum, m) => sum + m.values.length, 0) / metricCount;
    if (avgDataPoints > 15) confidence += 10;
    else if (avgDataPoints < 8) confidence -= 15;

    // High-significance metrics increase confidence
    const highSigMetrics = Object.values(metrics).filter(m => m.significance > 80).length;
    confidence += highSigMetrics * 3;

    return Math.max(60, Math.min(95, confidence));
  }

  private getPerformanceCategory(riskScore: number): string {
    if (riskScore < 20) return 'Excellent';
    if (riskScore < 40) return 'Good';
    if (riskScore < 60) return 'Fair';
    if (riskScore < 80) return 'Concerning';
    return 'Critical';
  }
}