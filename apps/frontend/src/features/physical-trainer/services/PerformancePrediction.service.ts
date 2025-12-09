import { WorkoutSession, PlayerAnalytics, TestResult, Exercise } from '../types';

export interface PerformancePrediction {
  playerId: string;
  playerName: string;
  predictions: {
    strength: PredictionDetails;
    endurance: PredictionDetails;
    speed: PredictionDetails;
    agility: PredictionDetails;
    overall: PredictionDetails;
  };
  recommendations: Recommendation[];
  injuryRisk: RiskAssessment;
  nextMilestone: Milestone;
  confidence: number;
}

interface PredictionDetails {
  currentLevel: number; // 0-100
  predictedLevel: number; // 0-100 after X weeks
  trend: 'improving' | 'maintaining' | 'declining';
  confidence: number; // 0-100
  factors: string[];
  timeframe: number; // weeks
}

interface Recommendation {
  type: 'increase' | 'decrease' | 'maintain' | 'modify';
  area: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  exercises?: Exercise[];
  targetMetrics?: Record<string, number>;
}

interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  factors: RiskFactor[];
  preventionStrategies: string[];
  confidence: number;
}

interface RiskFactor {
  name: string;
  impact: number; // 0-100
  description: string;
}

interface Milestone {
  name: string;
  targetDate: Date;
  requirements: string[];
  probability: number; // 0-100
}

export class PerformancePredictionService {
  private readonly PREDICTION_WINDOW = 4; // weeks
  private readonly MIN_DATA_POINTS = 5;
  private readonly CONFIDENCE_THRESHOLD = 70;

  /**
   * Generate performance predictions for a player based on their workout history
   */
  async predictPlayerPerformance(
    playerId: string,
    workoutHistory: WorkoutSession[],
    testResults: TestResult[],
    analytics: PlayerAnalytics
  ): Promise<PerformancePrediction> {
    // Sort workouts by date
    const sortedWorkouts = [...workoutHistory].sort(
      (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );

    // Calculate current performance levels
    const currentLevels = this.calculateCurrentLevels(sortedWorkouts, testResults);

    // Generate predictions for each performance area
    const predictions = {
      strength: this.predictStrength(sortedWorkouts, testResults, currentLevels.strength),
      endurance: this.predictEndurance(sortedWorkouts, testResults, currentLevels.endurance),
      speed: this.predictSpeed(sortedWorkouts, testResults, currentLevels.speed),
      agility: this.predictAgility(sortedWorkouts, testResults, currentLevels.agility),
      overall: this.predictOverall(currentLevels),
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(predictions, analytics);

    // Assess injury risk
    const injuryRisk = this.assessInjuryRisk(workoutHistory, analytics);

    // Calculate next milestone
    const nextMilestone = this.calculateNextMilestone(predictions, testResults);

    // Calculate overall confidence
    const confidence = this.calculateConfidence(workoutHistory, testResults);

    return {
      playerId,
      playerName: analytics.playerName,
      predictions,
      recommendations,
      injuryRisk,
      nextMilestone,
      confidence,
    };
  }

  /**
   * Predict performance trends for multiple players
   */
  async predictTeamPerformance(
    playerIds: string[],
    workoutHistory: Map<string, WorkoutSession[]>,
    testResults: Map<string, TestResult[]>,
    analytics: Map<string, PlayerAnalytics>
  ): Promise<Map<string, PerformancePrediction>> {
    const predictions = new Map<string, PerformancePrediction>();

    for (const playerId of playerIds) {
      const playerWorkouts = workoutHistory.get(playerId) || [];
      const playerTests = testResults.get(playerId) || [];
      const playerAnalytics = analytics.get(playerId);

      if (playerAnalytics && playerWorkouts.length >= this.MIN_DATA_POINTS) {
        const prediction = await this.predictPlayerPerformance(
          playerId,
          playerWorkouts,
          playerTests,
          playerAnalytics
        );
        predictions.set(playerId, prediction);
      }
    }

    return predictions;
  }

  /**
   * Calculate current performance levels based on recent data
   */
  private calculateCurrentLevels(
    workouts: WorkoutSession[],
    testResults: TestResult[]
  ): Record<string, number> {
    const recentWorkouts = workouts.slice(-10); // Last 10 workouts
    const recentTests = testResults.filter(
      t => new Date(t.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    );

    // Base levels on test results
    const testBasedLevels = this.calculateTestBasedLevels(recentTests);

    // Adjust based on workout performance
    const workoutAdjustments = this.calculateWorkoutAdjustments(recentWorkouts);

    return {
      strength: Math.min(100, testBasedLevels.strength + workoutAdjustments.strength),
      endurance: Math.min(100, testBasedLevels.endurance + workoutAdjustments.endurance),
      speed: Math.min(100, testBasedLevels.speed + workoutAdjustments.speed),
      agility: Math.min(100, testBasedLevels.agility + workoutAdjustments.agility),
    };
  }

  /**
   * Predict strength improvements
   */
  private predictStrength(
    workouts: WorkoutSession[],
    testResults: TestResult[],
    currentLevel: number
  ): PredictionDetails {
    const strengthWorkouts = workouts.filter(w => 
      w.type === 'strength' || w.exercises.some(e => e.category === 'strength')
    );

    // Calculate weekly volume trend
    const volumeTrend = this.calculateVolumeTrend(strengthWorkouts);
    
    // Calculate intensity progression
    const intensityProgression = this.calculateIntensityProgression(strengthWorkouts);

    // Find relevant test results
    const strengthTests = testResults.filter(t => 
      ['benchPress1RM', 'squat1RM', 'deadlift1RM'].includes(t.testType)
    );

    // Calculate prediction
    let predictedImprovement = 0;
    const factors: string[] = [];

    if (volumeTrend > 0) {
      predictedImprovement += volumeTrend * 2;
      factors.push('Progressive volume increase');
    }

    if (intensityProgression > 0) {
      predictedImprovement += intensityProgression * 3;
      factors.push('Consistent intensity progression');
    }

    // Test-based improvements
    const testImprovement = this.calculateTestImprovement(strengthTests);
    if (testImprovement > 0) {
      predictedImprovement += testImprovement;
      factors.push('Positive test results trend');
    }

    // Apply diminishing returns
    predictedImprovement *= (100 - currentLevel) / 100;

    const predictedLevel = Math.min(100, currentLevel + predictedImprovement);
    const trend = predictedImprovement > 2 ? 'improving' : 
                  predictedImprovement < -2 ? 'declining' : 'maintaining';

    return {
      currentLevel,
      predictedLevel,
      trend,
      confidence: this.calculateAreaConfidence(strengthWorkouts, strengthTests),
      factors,
      timeframe: this.PREDICTION_WINDOW,
    };
  }

  /**
   * Predict endurance improvements
   */
  private predictEndurance(
    workouts: WorkoutSession[],
    testResults: TestResult[],
    currentLevel: number
  ): PredictionDetails {
    const enduranceWorkouts = workouts.filter(w => 
      w.type === 'conditioning' || w.exercises.some(e => e.category === 'conditioning')
    );

    // Calculate weekly duration trend
    const durationTrend = this.calculateDurationTrend(enduranceWorkouts);
    
    // Calculate heart rate improvements
    const hrImprovement = this.calculateHeartRateImprovement(enduranceWorkouts);

    // Find relevant test results
    const enduranceTests = testResults.filter(t => 
      ['vo2Max', 'cooperTest', 'yoyoTest'].includes(t.testType)
    );

    // Calculate prediction
    let predictedImprovement = 0;
    const factors: string[] = [];

    if (durationTrend > 0) {
      predictedImprovement += durationTrend * 2.5;
      factors.push('Increasing training duration');
    }

    if (hrImprovement > 0) {
      predictedImprovement += hrImprovement * 2;
      factors.push('Improving heart rate efficiency');
    }

    // Frequency bonus
    const frequency = enduranceWorkouts.length / workouts.length;
    if (frequency > 0.3) {
      predictedImprovement += 3;
      factors.push('High conditioning frequency');
    }

    // Apply diminishing returns
    predictedImprovement *= (100 - currentLevel) / 100;

    const predictedLevel = Math.min(100, currentLevel + predictedImprovement);
    const trend = predictedImprovement > 2 ? 'improving' : 
                  predictedImprovement < -2 ? 'declining' : 'maintaining';

    return {
      currentLevel,
      predictedLevel,
      trend,
      confidence: this.calculateAreaConfidence(enduranceWorkouts, enduranceTests),
      factors,
      timeframe: this.PREDICTION_WINDOW,
    };
  }

  /**
   * Predict speed improvements
   */
  private predictSpeed(
    workouts: WorkoutSession[],
    testResults: TestResult[],
    currentLevel: number
  ): PredictionDetails {
    const speedWorkouts = workouts.filter(w => 
      w.exercises.some(e => 
        e.category === 'agility' || 
        e.name.toLowerCase().includes('sprint') ||
        e.targetMetrics?.speed
      )
    );

    // Find relevant test results
    const speedTests = testResults.filter(t => 
      ['sprint10m', 'sprint30m'].includes(t.testType)
    );

    // Calculate prediction based on training specificity
    let predictedImprovement = 0;
    const factors: string[] = [];

    const speedFrequency = speedWorkouts.length / workouts.length;
    if (speedFrequency > 0.2) {
      predictedImprovement += 4;
      factors.push('Regular speed training');
    }

    // Power development correlation
    const powerExercises = workouts.flatMap(w => 
      w.exercises.filter(e => e.name.toLowerCase().includes('jump') || e.name.toLowerCase().includes('explosive'))
    );
    if (powerExercises.length > 5) {
      predictedImprovement += 3;
      factors.push('Power development focus');
    }

    // Test improvements
    const testImprovement = this.calculateTestImprovement(speedTests);
    if (testImprovement > 0) {
      predictedImprovement += testImprovement;
      factors.push('Improving sprint times');
    }

    // Apply diminishing returns
    predictedImprovement *= (100 - currentLevel) / 100;

    const predictedLevel = Math.min(100, currentLevel + predictedImprovement);
    const trend = predictedImprovement > 2 ? 'improving' : 
                  predictedImprovement < -2 ? 'declining' : 'maintaining';

    return {
      currentLevel,
      predictedLevel,
      trend,
      confidence: this.calculateAreaConfidence(speedWorkouts, speedTests),
      factors,
      timeframe: this.PREDICTION_WINDOW,
    };
  }

  /**
   * Predict agility improvements
   */
  private predictAgility(
    workouts: WorkoutSession[],
    testResults: TestResult[],
    currentLevel: number
  ): PredictionDetails {
    const agilityWorkouts = workouts.filter(w => 
      w.type === 'agility' || w.exercises.some(e => e.category === 'agility')
    );

    // Find relevant test results
    const agilityTests = testResults.filter(t => 
      ['agility5105', 'reactionTime'].includes(t.testType)
    );

    // Calculate prediction
    let predictedImprovement = 0;
    const factors: string[] = [];

    const agilityFrequency = agilityWorkouts.length / workouts.length;
    if (agilityFrequency > 0.15) {
      predictedImprovement += 5;
      factors.push('Consistent agility training');
    }

    // Variety bonus
    const uniqueDrills = new Set(
      agilityWorkouts.flatMap(w => w.exercises.map(e => e.name))
    ).size;
    if (uniqueDrills > 10) {
      predictedImprovement += 3;
      factors.push('High drill variety');
    }

    // Balance and coordination correlation
    const balanceWork = workouts.some(w => 
      w.exercises.some(e => e.name.toLowerCase().includes('balance'))
    );
    if (balanceWork) {
      predictedImprovement += 2;
      factors.push('Balance training included');
    }

    // Apply diminishing returns
    predictedImprovement *= (100 - currentLevel) / 100;

    const predictedLevel = Math.min(100, currentLevel + predictedImprovement);
    const trend = predictedImprovement > 2 ? 'improving' : 
                  predictedImprovement < -2 ? 'declining' : 'maintaining';

    return {
      currentLevel,
      predictedLevel,
      trend,
      confidence: this.calculateAreaConfidence(agilityWorkouts, agilityTests),
      factors,
      timeframe: this.PREDICTION_WINDOW,
    };
  }

  /**
   * Calculate overall performance prediction
   */
  private predictOverall(currentLevels: Record<string, number>): PredictionDetails {
    const areas = ['strength', 'endurance', 'speed', 'agility'];
    const currentAverage = areas.reduce((sum, area) => sum + currentLevels[area], 0) / areas.length;

    // Overall improvement is weighted average of area improvements
    const predictedAverage = currentAverage + 3; // Conservative overall improvement

    return {
      currentLevel: Math.round(currentAverage),
      predictedLevel: Math.round(predictedAverage),
      trend: 'improving',
      confidence: 85,
      factors: ['Balanced training program', 'Consistent progression'],
      timeframe: this.PREDICTION_WINDOW,
    };
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    predictions: Record<string, PredictionDetails>,
    analytics: PlayerAnalytics
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Find weakest area
    const areas = Object.entries(predictions).filter(([key]) => key !== 'overall');
    const weakestArea = areas.reduce((min, [key, pred]) => 
      pred.predictedLevel < predictions[min].predictedLevel ? key : min
    , 'strength');

    // Recommend focus on weak areas
    if (predictions[weakestArea].predictedLevel < 70) {
      recommendations.push({
        type: 'increase',
        area: weakestArea,
        priority: 'high',
        description: `Focus on improving ${weakestArea} - currently your weakest area`,
        targetMetrics: { 
          weeklyFrequency: 3,
          sessionDuration: 45,
        },
      });
    }

    // Check for overtraining
    if (analytics.averageLoad > 85 && analytics.injuryRisk !== 'low') {
      recommendations.push({
        type: 'decrease',
        area: 'overall load',
        priority: 'high',
        description: 'Reduce training load to prevent overtraining and injury',
        targetMetrics: { 
          weeklyLoad: 70,
          restDays: 2,
        },
      });
    }

    // Suggest variety if needed
    const uniqueExercises = new Set(
      analytics.improvementAreas.flatMap(area => area.exercises)
    ).size;
    if (uniqueExercises < 20) {
      recommendations.push({
        type: 'modify',
        area: 'exercise variety',
        priority: 'medium',
        description: 'Increase exercise variety to prevent plateaus',
      });
    }

    // Recovery recommendations
    if (analytics.averageLoad > 75) {
      recommendations.push({
        type: 'increase',
        area: 'recovery',
        priority: 'medium',
        description: 'Add more recovery sessions to support high training load',
        targetMetrics: {
          recoverySessionsPerWeek: 2,
        },
      });
    }

    return recommendations;
  }

  /**
   * Assess injury risk based on training patterns
   */
  private assessInjuryRisk(
    workouts: WorkoutSession[],
    analytics: PlayerAnalytics
  ): RiskAssessment {
    const factors: RiskFactor[] = [];
    let totalRisk = 0;

    // Load spike detection
    const loadSpike = this.detectLoadSpike(analytics.workloadTrend);
    if (loadSpike > 1.5) {
      factors.push({
        name: 'Rapid load increase',
        impact: 40,
        description: `Training load increased by ${Math.round((loadSpike - 1) * 100)}% recently`,
      });
      totalRisk += 40;
    }

    // Fatigue accumulation
    const highFatigueDays = analytics.workloadTrend.filter(load => load > 85).length;
    if (highFatigueDays > 3) {
      factors.push({
        name: 'Fatigue accumulation',
        impact: 30,
        description: `${highFatigueDays} high-load days in recent period`,
      });
      totalRisk += 30;
    }

    // Recovery deficit
    const recoveryWorkouts = workouts.filter(w => w.type === 'recovery').length;
    const recoveryRatio = recoveryWorkouts / workouts.length;
    if (recoveryRatio < 0.1) {
      factors.push({
        name: 'Insufficient recovery',
        impact: 25,
        description: 'Less than 10% of sessions focused on recovery',
      });
      totalRisk += 25;
    }

    // Determine risk level
    const level = totalRisk > 60 ? 'high' : totalRisk > 30 ? 'medium' : 'low';

    // Prevention strategies
    const preventionStrategies = this.generatePreventionStrategies(factors);

    return {
      level,
      factors,
      preventionStrategies,
      confidence: Math.min(95, 70 + workouts.length),
    };
  }

  /**
   * Calculate next performance milestone
   */
  private calculateNextMilestone(
    predictions: Record<string, PredictionDetails>,
    testResults: TestResult[]
  ): Milestone {
    // Find area with best improvement potential
    const bestImprovement = Object.entries(predictions)
      .filter(([key]) => key !== 'overall')
      .reduce((best, [key, pred]) => {
        const improvement = pred.predictedLevel - pred.currentLevel;
        return improvement > (best.improvement || 0) ? 
          { area: key, improvement, prediction: pred } : best;
      }, {} as any);

    // Define milestone based on best improvement area
    let milestone: Milestone;

    switch (bestImprovement.area) {
      case 'strength':
        milestone = {
          name: '10% Strength Increase',
          targetDate: new Date(Date.now() + this.PREDICTION_WINDOW * 7 * 24 * 60 * 60 * 1000),
          requirements: [
            'Complete 12+ strength sessions',
            'Progressive overload each week',
            'Maintain nutrition plan',
          ],
          probability: bestImprovement.prediction.confidence,
        };
        break;

      case 'endurance':
        milestone = {
          name: 'VO2 Max Improvement',
          targetDate: new Date(Date.now() + this.PREDICTION_WINDOW * 7 * 24 * 60 * 60 * 1000),
          requirements: [
            'Complete 3 conditioning sessions per week',
            'Include interval training',
            'Track heart rate zones',
          ],
          probability: bestImprovement.prediction.confidence,
        };
        break;

      case 'speed':
        milestone = {
          name: '0.1s Sprint Time Reduction',
          targetDate: new Date(Date.now() + this.PREDICTION_WINDOW * 7 * 24 * 60 * 60 * 1000),
          requirements: [
            'Sprint training 2x per week',
            'Power development exercises',
            'Proper warm-up protocol',
          ],
          probability: bestImprovement.prediction.confidence,
        };
        break;

      case 'agility':
        milestone = {
          name: 'Elite Agility Score',
          targetDate: new Date(Date.now() + this.PREDICTION_WINDOW * 7 * 24 * 60 * 60 * 1000),
          requirements: [
            'Complete agility ladder drills',
            'Cone drill progressions',
            'Reaction time training',
          ],
          probability: bestImprovement.prediction.confidence,
        };
        break;

      default:
        milestone = {
          name: 'Overall Performance Boost',
          targetDate: new Date(Date.now() + this.PREDICTION_WINDOW * 7 * 24 * 60 * 60 * 1000),
          requirements: [
            'Maintain training consistency',
            'Balance all fitness areas',
            'Track progress weekly',
          ],
          probability: 80,
        };
    }

    return milestone;
  }

  /**
   * Helper methods
   */
  private calculateTestBasedLevels(tests: TestResult[]): Record<string, number> {
    // Group tests by type
    const strengthTests = tests.filter(t => ['benchPress1RM', 'squat1RM', 'deadlift1RM'].includes(t.testType));
    const enduranceTests = tests.filter(t => ['vo2Max', 'cooperTest'].includes(t.testType));
    const speedTests = tests.filter(t => ['sprint10m', 'sprint30m'].includes(t.testType));
    const agilityTests = tests.filter(t => ['agility5105'].includes(t.testType));

    return {
      strength: this.averagePercentile(strengthTests),
      endurance: this.averagePercentile(enduranceTests),
      speed: this.averagePercentile(speedTests),
      agility: this.averagePercentile(agilityTests),
    };
  }

  private calculateWorkoutAdjustments(workouts: WorkoutSession[]): Record<string, number> {
    // Calculate adjustments based on recent workout performance
    const strengthWorkouts = workouts.filter(w => w.type === 'strength').length;
    const conditioningWorkouts = workouts.filter(w => w.type === 'conditioning').length;
    const agilityWorkouts = workouts.filter(w => w.type === 'agility').length;

    return {
      strength: Math.min(10, strengthWorkouts * 2),
      endurance: Math.min(10, conditioningWorkouts * 2),
      speed: Math.min(10, (agilityWorkouts + conditioningWorkouts)),
      agility: Math.min(10, agilityWorkouts * 3),
    };
  }

  private calculateVolumeTrend(workouts: WorkoutSession[]): number {
    if (workouts.length < 2) return 0;

    // Calculate total volume for each workout
    const volumes = workouts.map(w => 
      w.exercises.reduce((sum, ex) => 
        sum + (ex.sets || 0) * (ex.reps || 0) * (ex.weight || 0), 0
      )
    );

    // Calculate trend
    const firstHalf = volumes.slice(0, Math.floor(volumes.length / 2));
    const secondHalf = volumes.slice(Math.floor(volumes.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    return ((avgSecond - avgFirst) / avgFirst) * 100;
  }

  private calculateIntensityProgression(workouts: WorkoutSession[]): number {
    const intensityMap = { low: 1, medium: 2, high: 3, max: 4 };
    const intensities = workouts.map(w => intensityMap[w.intensity] || 2);

    if (intensities.length < 2) return 0;

    // Calculate average intensity change
    let progression = 0;
    for (let i = 1; i < intensities.length; i++) {
      progression += (intensities[i] - intensities[i-1]) / intensities[i-1];
    }

    return (progression / (intensities.length - 1)) * 100;
  }

  private calculateDurationTrend(workouts: WorkoutSession[]): number {
    if (workouts.length < 2) return 0;

    const durations = workouts.map(w => w.metadata?.duration || 0);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const recentAvg = durations.slice(-3).reduce((a, b) => a + b, 0) / 3;

    return ((recentAvg - avgDuration) / avgDuration) * 100;
  }

  private calculateHeartRateImprovement(workouts: WorkoutSession[]): number {
    // Simulate HR improvement based on workout data
    // In real implementation, this would use actual HR data
    const consistentWorkouts = workouts.filter((w, i) => 
      i > 0 && new Date(w.scheduledDate).getTime() - new Date(workouts[i-1].scheduledDate).getTime() < 4 * 24 * 60 * 60 * 1000
    );

    return consistentWorkouts.length > workouts.length * 0.7 ? 5 : 0;
  }

  private calculateTestImprovement(tests: TestResult[]): number {
    if (tests.length < 2) return 0;

    // Sort by date
    const sortedTests = [...tests].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Compare first and last test
    const first = sortedTests[0];
    const last = sortedTests[sortedTests.length - 1];

    if (first.previousValue && last.value) {
      const improvement = ((last.value - first.previousValue) / first.previousValue) * 100;
      return Math.max(0, improvement);
    }

    return 0;
  }

  private calculateAreaConfidence(workouts: WorkoutSession[], tests: TestResult[]): number {
    let confidence = 50; // Base confidence

    // More data = higher confidence
    confidence += Math.min(30, workouts.length * 2);
    confidence += Math.min(20, tests.length * 5);

    // Recency bonus
    const recentWorkouts = workouts.filter(w => 
      new Date(w.scheduledDate).getTime() > Date.now() - 14 * 24 * 60 * 60 * 1000
    );
    if (recentWorkouts.length > 3) confidence += 10;

    return Math.min(95, confidence);
  }

  private calculateConfidence(workouts: WorkoutSession[], tests: TestResult[]): number {
    let confidence = 60; // Base confidence

    // Data volume
    confidence += Math.min(20, workouts.length);
    confidence += Math.min(10, tests.length * 2);

    // Data recency
    const recentData = workouts.filter(w => 
      new Date(w.scheduledDate).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    ).length;
    confidence += Math.min(10, recentData * 2);

    return Math.min(95, confidence);
  }

  private averagePercentile(tests: TestResult[]): number {
    if (tests.length === 0) return 50; // Default to average
    
    const percentiles = tests.map(t => t.percentile || 50);
    return percentiles.reduce((a, b) => a + b, 0) / percentiles.length;
  }

  private detectLoadSpike(trend: number[]): number {
    if (trend.length < 7) return 1;

    const lastWeek = trend.slice(-7);
    const previousWeek = trend.slice(-14, -7);

    const lastAvg = lastWeek.reduce((a, b) => a + b, 0) / lastWeek.length;
    const prevAvg = previousWeek.reduce((a, b) => a + b, 0) / previousWeek.length;

    return prevAvg > 0 ? lastAvg / prevAvg : 1;
  }

  private generatePreventionStrategies(factors: RiskFactor[]): string[] {
    const strategies: string[] = [];

    factors.forEach(factor => {
      switch (factor.name) {
        case 'Rapid load increase':
          strategies.push('Implement gradual load progression (10% rule)');
          strategies.push('Add deload week every 4th week');
          break;
        case 'Fatigue accumulation':
          strategies.push('Incorporate active recovery sessions');
          strategies.push('Monitor sleep quality and duration');
          strategies.push('Use RPE to adjust daily loads');
          break;
        case 'Insufficient recovery':
          strategies.push('Add 1-2 recovery/mobility sessions per week');
          strategies.push('Implement recovery monitoring (HRV, wellness scores)');
          break;
      }
    });

    // Always add general strategies
    strategies.push('Maintain proper warm-up and cool-down protocols');
    strategies.push('Regular communication with medical staff');

    return [...new Set(strategies)]; // Remove duplicates
  }
}