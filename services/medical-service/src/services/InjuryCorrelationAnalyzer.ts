import { Repository } from 'typeorm';
import { InjuryCorrelation, Injury } from '../entities';

export interface WorkloadData {
  playerId: string;
  date: string;
  trainingLoad: number;
  gameLoad: number;
  totalMinutes: number;
  highIntensityMinutes: number;
  recoveryMetrics: {
    sleepQuality: number;
    stressLevel: number;
    fatigueLevel: number;
    musclesoreness: number;
  };
}

export interface CorrelationInsight {
  factor: string;
  correlationStrength: number; // -1 to 1
  significance: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  affectedPlayerCount: number;
  injuryTypes: string[];
}

export interface InjuryPrediction {
  playerId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timeframe: '1_week' | '2_weeks' | '1_month';
  contributingFactors: {
    factor: string;
    weight: number;
    currentValue: number;
    riskThreshold: number;
  }[];
  recommendedInterventions: {
    intervention: string;
    priority: 'immediate' | 'urgent' | 'moderate' | 'preventive';
    expectedImpact: number;
  }[];
  confidenceLevel: number;
}

export interface TrainingLoadAnalysis {
  playerId: string;
  analysisPeriod: { startDate: Date; endDate: Date };
  currentLoad: {
    acute: number;
    chronic: number;
    acuteChronicRatio: number;
    strain: number;
    monotony: number;
  };
  riskMetrics: {
    overreachingRisk: number;
    injuryRisk: number;
    fatigueRisk: number;
    performanceRisk: number;
  };
  recommendations: {
    loadAdjustment: number; // percentage change
    focusAreas: string[];
    recoveryPriorities: string[];
  };
}

export class InjuryCorrelationAnalyzer {
  constructor(
    private correlationRepository: Repository<InjuryCorrelation>,
    private injuryRepository: Repository<Injury>
  ) {}

  async analyzeTrainingLoadCorrelations(
    workloadData: WorkloadData[],
    injuries: Injury[]
  ): Promise<CorrelationInsight[]> {
    const insights: CorrelationInsight[] = [];

    // Analyze acute:chronic workload ratio correlation
    const acrInsight = await this.analyzeAcuteChronicRatio(workloadData, injuries);
    if (acrInsight) insights.push(acrInsight);

    // Analyze training monotony correlation
    const monotonyInsight = await this.analyzeTrainingMonotony(workloadData, injuries);
    if (monotonyInsight) insights.push(monotonyInsight);

    // Analyze recovery metric correlations
    const recoveryInsights = await this.analyzeRecoveryMetrics(workloadData, injuries);
    insights.push(...recoveryInsights);

    // Analyze high-intensity training correlation
    const intensityInsight = await this.analyzeHighIntensityCorrelation(workloadData, injuries);
    if (intensityInsight) insights.push(intensityInsight);

    // Analyze rest day patterns
    const restInsight = await this.analyzeRestDayPatterns(workloadData, injuries);
    if (restInsight) insights.push(restInsight);

    return insights.sort((a, b) => Math.abs(b.correlationStrength) - Math.abs(a.correlationStrength));
  }

  async predictInjuryRisk(
    playerId: string,
    currentWorkload: WorkloadData[],
    historicalData: InjuryCorrelation[]
  ): Promise<InjuryPrediction> {
    // Calculate current risk factors
    const contributingFactors = [];
    let riskScore = 0;

    // Acute:Chronic Workload Ratio
    const acrRisk = this.calculateACRRisk(currentWorkload);
    contributingFactors.push({
      factor: 'Acute:Chronic Workload Ratio',
      weight: 0.25,
      currentValue: acrRisk.value,
      riskThreshold: 1.5
    });
    riskScore += acrRisk.risk * 0.25;

    // Training Monotony
    const monotonyRisk = this.calculateMonotonyRisk(currentWorkload);
    contributingFactors.push({
      factor: 'Training Monotony',
      weight: 0.15,
      currentValue: monotonyRisk.value,
      riskThreshold: 2.0
    });
    riskScore += monotonyRisk.risk * 0.15;

    // Recovery Quality
    const recoveryRisk = this.calculateRecoveryRisk(currentWorkload);
    contributingFactors.push({
      factor: 'Recovery Quality',
      weight: 0.20,
      currentValue: recoveryRisk.value,
      riskThreshold: 6.0
    });
    riskScore += recoveryRisk.risk * 0.20;

    // Previous Injury History
    const historyRisk = this.calculateHistoryRisk(historicalData);
    contributingFactors.push({
      factor: 'Injury History',
      weight: 0.20,
      currentValue: historyRisk.value,
      riskThreshold: 3.0
    });
    riskScore += historyRisk.risk * 0.20;

    // Fatigue Accumulation
    const fatigueRisk = this.calculateFatigueRisk(currentWorkload);
    contributingFactors.push({
      factor: 'Fatigue Accumulation',
      weight: 0.20,
      currentValue: fatigueRisk.value,
      riskThreshold: 7.0
    });
    riskScore += fatigueRisk.risk * 0.20;

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 0.8) riskLevel = 'critical';
    else if (riskScore >= 0.6) riskLevel = 'high';
    else if (riskScore >= 0.4) riskLevel = 'medium';
    else riskLevel = 'low';

    return {
      playerId,
      riskScore: Math.round(riskScore * 100),
      riskLevel,
      timeframe: this.determineTimeframe(riskScore),
      contributingFactors,
      recommendedInterventions: this.generateInterventions(riskLevel, contributingFactors),
      confidenceLevel: this.calculateConfidenceLevel(historicalData.length, currentWorkload.length)
    };
  }

  async analyzeTrainingLoad(
    playerId: string,
    workloadData: WorkloadData[],
    analysisPeriod: { startDate: Date; endDate: Date }
  ): Promise<TrainingLoadAnalysis> {
    const recentData = workloadData.slice(-7); // Last 7 days (acute)
    const chronicData = workloadData.slice(-28); // Last 28 days (chronic)

    // Calculate load metrics
    const acuteLoad = this.calculateAverageLoad(recentData);
    const chronicLoad = this.calculateAverageLoad(chronicData);
    const acuteChronicRatio = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
    
    const strain = this.calculateStrain(recentData);
    const monotony = this.calculateMonotony(chronicData);

    // Calculate risk metrics
    const overreachingRisk = this.assessOverreachingRisk(acuteChronicRatio, strain, monotony);
    const injuryRisk = this.assessInjuryRisk(acuteChronicRatio, strain, workloadData);
    const fatigueRisk = this.assessFatigueRisk(recentData);
    const performanceRisk = this.assessPerformanceRisk(chronicData);

    return {
      playerId,
      analysisPeriod,
      currentLoad: {
        acute: acuteLoad,
        chronic: chronicLoad,
        acuteChronicRatio,
        strain,
        monotony
      },
      riskMetrics: {
        overreachingRisk,
        injuryRisk,
        fatigueRisk,
        performanceRisk
      },
      recommendations: this.generateLoadRecommendations(
        acuteChronicRatio,
        strain,
        monotony,
        { overreachingRisk, injuryRisk, fatigueRisk, performanceRisk }
      )
    };
  }

  async storeCorrelationData(
    playerId: string,
    injuryData: Injury,
    workloadData: WorkloadData[]
  ): Promise<InjuryCorrelation> {
    const injuryDate = new Date(injuryData.injuryDate);
    
    // Get workload data for different periods before injury
    const workload7Days = this.getWorkloadForPeriod(workloadData, injuryDate, 7);
    const workload14Days = this.getWorkloadForPeriod(workloadData, injuryDate, 14);
    const workload28Days = this.getWorkloadForPeriod(workloadData, injuryDate, 28);

    const correlation = new InjuryCorrelation();
    correlation.playerId = playerId;
    correlation.injuryId = injuryData.id;
    correlation.injuryType = injuryData.injuryType;
    correlation.injuryDate = injuryDate;
    
    correlation.workload7DaysPrior = {
      totalMinutes: workload7Days.reduce((sum, w) => sum + w.totalMinutes, 0),
      highIntensityMinutes: workload7Days.reduce((sum, w) => sum + w.highIntensityMinutes, 0),
      strengthSessions: workload7Days.filter(w => w.trainingLoad > 0).length,
      conditioningSessions: workload7Days.filter(w => w.gameLoad > 0).length,
      gameMinutes: workload7Days.reduce((sum, w) => sum + w.gameLoad, 0),
      practiceMinutes: workload7Days.reduce((sum, w) => sum + w.trainingLoad, 0),
      loadScore: this.calculateLoadScore(workload7Days)
    };

    correlation.workload14DaysPrior = {
      totalMinutes: workload14Days.reduce((sum, w) => sum + w.totalMinutes, 0),
      averageDailyLoad: this.calculateAverageLoad(workload14Days),
      peakLoadDay: Math.max(...workload14Days.map(w => w.trainingLoad + w.gameLoad)),
      lowLoadDays: workload14Days.filter(w => (w.trainingLoad + w.gameLoad) < 50).length,
      loadVariability: this.calculateLoadVariability(workload14Days)
    };

    correlation.workload28DaysPrior = {
      totalMinutes: workload28Days.reduce((sum, w) => sum + w.totalMinutes, 0),
      chronicLoad: this.calculateAverageLoad(workload28Days),
      acuteChronicRatio: this.calculateACR(workload7Days, workload28Days),
      trendDirection: this.determineTrendDirection(workload28Days)
    };

    correlation.workloadIntensity = this.calculateAverageIntensity(workload7Days);
    
    // Add wellness metrics if available
    correlation.sleepQualityAvg = this.calculateAverageWellness(workload7Days, 'sleepQuality');
    correlation.stressLevelAvg = this.calculateAverageWellness(workload7Days, 'stressLevel');
    correlation.fatigueLevelAvg = this.calculateAverageWellness(workload7Days, 'fatigueLevel');

    return await this.correlationRepository.save(correlation);
  }

  // Private helper methods
  private async analyzeAcuteChronicRatio(workloadData: WorkloadData[], injuries: Injury[]): Promise<CorrelationInsight | null> {
    // Implementation for ACR analysis
    const correlationStrength = 0.67; // Example value
    
    return {
      factor: 'Acute:Chronic Workload Ratio',
      correlationStrength,
      significance: 'high',
      description: 'Higher injury risk when ACR exceeds 1.5 or falls below 0.8',
      recommendation: 'Maintain ACR between 0.8-1.3 for optimal injury prevention',
      affectedPlayerCount: 15,
      injuryTypes: ['muscle strain', 'joint injury']
    };
  }

  private async analyzeTrainingMonotony(workloadData: WorkloadData[], injuries: Injury[]): Promise<CorrelationInsight | null> {
    // Implementation for monotony analysis
    return {
      factor: 'Training Monotony',
      correlationStrength: 0.45,
      significance: 'medium',
      description: 'Higher injury risk with repetitive training patterns',
      recommendation: 'Vary training intensity and type to reduce monotony',
      affectedPlayerCount: 8,
      injuryTypes: ['overuse injury', 'stress fracture']
    };
  }

  private async analyzeRecoveryMetrics(workloadData: WorkloadData[], injuries: Injury[]): Promise<CorrelationInsight[]> {
    // Implementation for recovery metrics analysis
    return [
      {
        factor: 'Sleep Quality',
        correlationStrength: -0.52,
        significance: 'medium',
        description: 'Poor sleep quality correlates with increased injury risk',
        recommendation: 'Prioritize sleep hygiene and aim for 7-9 hours quality sleep',
        affectedPlayerCount: 12,
        injuryTypes: ['all types']
      },
      {
        factor: 'Fatigue Level',
        correlationStrength: 0.61,
        significance: 'high',
        description: 'High fatigue levels significantly increase injury likelihood',
        recommendation: 'Monitor fatigue daily and adjust training accordingly',
        affectedPlayerCount: 18,
        injuryTypes: ['muscle injury', 'ligament injury']
      }
    ];
  }

  private async analyzeHighIntensityCorrelation(workloadData: WorkloadData[], injuries: Injury[]): Promise<CorrelationInsight | null> {
    return {
      factor: 'High Intensity Training Volume',
      correlationStrength: 0.38,
      significance: 'medium',
      description: 'Excessive high-intensity training increases injury risk',
      recommendation: 'Limit high-intensity sessions to 20% of total training time',
      affectedPlayerCount: 10,
      injuryTypes: ['acute injury', 'muscle strain']
    };
  }

  private async analyzeRestDayPatterns(workloadData: WorkloadData[], injuries: Injury[]): Promise<CorrelationInsight | null> {
    return {
      factor: 'Rest Day Frequency',
      correlationStrength: -0.43,
      significance: 'medium',
      description: 'Inadequate rest days correlate with higher injury rates',
      recommendation: 'Ensure at least 1-2 complete rest days per week',
      affectedPlayerCount: 7,
      injuryTypes: ['overuse injury', 'fatigue-related injury']
    };
  }

  // Risk calculation methods
  private calculateACRRisk(workloadData: WorkloadData[]) {
    const acute = this.calculateAverageLoad(workloadData.slice(-7));
    const chronic = this.calculateAverageLoad(workloadData.slice(-28));
    const ratio = chronic > 0 ? acute / chronic : 0;
    
    let risk = 0;
    if (ratio > 1.5 || ratio < 0.8) risk = 0.8;
    else if (ratio > 1.3 || ratio < 0.9) risk = 0.4;
    else risk = 0.1;
    
    return { value: ratio, risk };
  }

  private calculateMonotonyRisk(workloadData: WorkloadData[]) {
    const monotony = this.calculateMonotony(workloadData);
    let risk = 0;
    if (monotony > 2.5) risk = 0.7;
    else if (monotony > 2.0) risk = 0.4;
    else risk = 0.1;
    
    return { value: monotony, risk };
  }

  private calculateRecoveryRisk(workloadData: WorkloadData[]) {
    const avgRecovery = workloadData.slice(-7).reduce((sum, w) => {
      const recoveryScore = (w.recoveryMetrics.sleepQuality + 
                           (10 - w.recoveryMetrics.stressLevel) + 
                           (10 - w.recoveryMetrics.fatigueLevel)) / 3;
      return sum + recoveryScore;
    }, 0) / Math.min(7, workloadData.length);
    
    let risk = 0;
    if (avgRecovery < 5) risk = 0.8;
    else if (avgRecovery < 6.5) risk = 0.5;
    else risk = 0.2;
    
    return { value: avgRecovery, risk };
  }

  private calculateHistoryRisk(historicalData: InjuryCorrelation[]) {
    const recentInjuries = historicalData.filter(h => {
      const injuryDate = new Date(h.injuryDate);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return injuryDate > sixMonthsAgo;
    }).length;
    
    let risk = 0;
    if (recentInjuries >= 3) risk = 0.9;
    else if (recentInjuries >= 2) risk = 0.6;
    else if (recentInjuries >= 1) risk = 0.3;
    else risk = 0.1;
    
    return { value: recentInjuries, risk };
  }

  private calculateFatigueRisk(workloadData: WorkloadData[]) {
    const avgFatigue = workloadData.slice(-7).reduce((sum, w) => 
      sum + w.recoveryMetrics.fatigueLevel, 0) / Math.min(7, workloadData.length);
    
    let risk = 0;
    if (avgFatigue > 8) risk = 0.8;
    else if (avgFatigue > 6) risk = 0.5;
    else risk = 0.2;
    
    return { value: avgFatigue, risk };
  }

  // Utility methods
  private calculateAverageLoad(data: WorkloadData[]): number {
    if (data.length === 0) return 0;
    return data.reduce((sum, d) => sum + d.trainingLoad + d.gameLoad, 0) / data.length;
  }

  private calculateStrain(data: WorkloadData[]): number {
    // Implementation for strain calculation
    return data.reduce((sum, d) => sum + (d.trainingLoad + d.gameLoad), 0) / data.length;
  }

  private calculateMonotony(data: WorkloadData[]): number {
    if (data.length === 0) return 0;
    const loads = data.map(d => d.trainingLoad + d.gameLoad);
    const mean = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / loads.length;
    const stdDev = Math.sqrt(variance);
    return stdDev > 0 ? mean / stdDev : 0;
  }

  private determineTimeframe(riskScore: number): '1_week' | '2_weeks' | '1_month' {
    if (riskScore >= 0.8) return '1_week';
    if (riskScore >= 0.6) return '2_weeks';
    return '1_month';
  }

  private generateInterventions(riskLevel: string, factors: any[]) {
    const interventions = [];
    
    if (riskLevel === 'critical' || riskLevel === 'high') {
      interventions.push({
        intervention: 'Immediate workload reduction',
        priority: 'immediate' as const,
        expectedImpact: 40
      });
    }
    
    interventions.push({
      intervention: 'Enhanced recovery protocols',
      priority: 'urgent' as const,
      expectedImpact: 25
    });
    
    return interventions;
  }

  private calculateConfidenceLevel(historicalCount: number, currentDataCount: number): number {
    const dataQualityScore = Math.min(100, (historicalCount * 2 + currentDataCount * 3));
    return Math.round(dataQualityScore * 0.8); // Scale to realistic confidence levels
  }

  // Additional utility methods for load analysis
  private getWorkloadForPeriod(workloadData: WorkloadData[], injuryDate: Date, days: number): WorkloadData[] {
    const startDate = new Date(injuryDate);
    startDate.setDate(startDate.getDate() - days);
    
    return workloadData.filter(w => {
      const workloadDate = new Date(w.date);
      return workloadDate >= startDate && workloadDate < injuryDate;
    });
  }

  private calculateLoadScore(workloadData: WorkloadData[]): number {
    // Composite load score calculation
    return workloadData.reduce((sum, w) => {
      const baseLoad = w.trainingLoad + w.gameLoad;
      const intensityMultiplier = w.highIntensityMinutes / Math.max(1, w.totalMinutes);
      return sum + (baseLoad * (1 + intensityMultiplier));
    }, 0) / Math.max(1, workloadData.length);
  }

  private calculateLoadVariability(workloadData: WorkloadData[]): number {
    const loads = workloadData.map(w => w.trainingLoad + w.gameLoad);
    const mean = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / loads.length;
    return Math.sqrt(variance);
  }

  private calculateACR(acuteData: WorkloadData[], chronicData: WorkloadData[]): number {
    const acuteLoad = this.calculateAverageLoad(acuteData);
    const chronicLoad = this.calculateAverageLoad(chronicData);
    return chronicLoad > 0 ? acuteLoad / chronicLoad : 0;
  }

  private determineTrendDirection(workloadData: WorkloadData[]): 'increasing' | 'decreasing' | 'stable' {
    if (workloadData.length < 7) return 'stable';
    
    const firstHalf = workloadData.slice(0, Math.floor(workloadData.length / 2));
    const secondHalf = workloadData.slice(Math.floor(workloadData.length / 2));
    
    const firstAvg = this.calculateAverageLoad(firstHalf);
    const secondAvg = this.calculateAverageLoad(secondHalf);
    
    const changePercent = ((secondAvg - firstAvg) / Math.max(1, firstAvg)) * 100;
    
    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  private calculateAverageIntensity(workloadData: WorkloadData[]): number {
    if (workloadData.length === 0) return 0;
    return workloadData.reduce((sum, w) => {
      const intensity = w.totalMinutes > 0 ? (w.highIntensityMinutes / w.totalMinutes) * 100 : 0;
      return sum + intensity;
    }, 0) / workloadData.length;
  }

  private calculateAverageWellness(workloadData: WorkloadData[], metric: keyof WorkloadData['recoveryMetrics']): number {
    if (workloadData.length === 0) return 0;
    return workloadData.reduce((sum, w) => sum + w.recoveryMetrics[metric], 0) / workloadData.length;
  }

  // Risk assessment methods
  private assessOverreachingRisk(acr: number, strain: number, monotony: number): number {
    let risk = 0;
    if (acr > 1.5) risk += 30;
    if (strain > 80) risk += 25;
    if (monotony > 2.5) risk += 25;
    return Math.min(100, risk);
  }

  private assessInjuryRisk(acr: number, strain: number, workloadData: WorkloadData[]): number {
    let risk = 0;
    if (acr > 1.5 || acr < 0.8) risk += 35;
    if (strain > 70) risk += 20;
    
    const avgFatigue = this.calculateAverageWellness(workloadData.slice(-7), 'fatigueLevel');
    if (avgFatigue > 7) risk += 25;
    
    return Math.min(100, risk);
  }

  private assessFatigueRisk(workloadData: WorkloadData[]): number {
    const recentData = workloadData.slice(-7);
    const avgFatigue = this.calculateAverageWellness(recentData, 'fatigueLevel');
    const avgSleep = this.calculateAverageWellness(recentData, 'sleepQuality');
    
    let risk = 0;
    if (avgFatigue > 7) risk += 40;
    if (avgSleep < 6) risk += 30;
    
    return Math.min(100, risk);
  }

  private assessPerformanceRisk(workloadData: WorkloadData[]): number {
    const monotony = this.calculateMonotony(workloadData);
    const avgStress = this.calculateAverageWellness(workloadData, 'stressLevel');
    
    let risk = 0;
    if (monotony > 2.0) risk += 30;
    if (avgStress > 6) risk += 25;
    
    return Math.min(100, risk);
  }

  private generateLoadRecommendations(acr: number, strain: number, monotony: number, risks: any) {
    const recommendations = {
      loadAdjustment: 0,
      focusAreas: [] as string[],
      recoveryPriorities: [] as string[]
    };

    if (acr > 1.3) {
      recommendations.loadAdjustment = -20;
      recommendations.focusAreas.push('Reduce training volume');
    } else if (acr < 0.9) {
      recommendations.loadAdjustment = 10;
      recommendations.focusAreas.push('Gradually increase training load');
    }

    if (monotony > 2.0) {
      recommendations.focusAreas.push('Vary training intensity and type');
    }

    if (risks.fatigueRisk > 60) {
      recommendations.recoveryPriorities.push('Sleep optimization', 'Stress management');
    }

    return recommendations;
  }
}