// @ts-nocheck - Recovery tracking with complex entity relationships
import { Repository } from 'typeorm';
import { RecoveryTracking, ReturnToPlayProtocol, Injury } from '../entities';

export interface RecoveryMilestone {
  id: string;
  name: string;
  phase: string;
  targetWeek: number;
  description: string;
  requirements: {
    painLevel?: { max: number };
    functionLevel?: { min: number };
    rangeOfMotion?: { joint: string; movement: string; minPercent: number }[];
    strengthTests?: { muscle: string; minPercent: number }[];
    performanceTests?: { test: string; passingScore: number }[];
  };
  isCompleted: boolean;
  completedDate?: Date;
  assessmentResults?: any[];
}

export interface RecoveryTrend {
  metric: string;
  timeframe: 'week' | 'month' | 'phase';
  dataPoints: {
    date: Date;
    value: number;
    target?: number;
    notes?: string;
  }[];
  trend: 'improving' | 'declining' | 'stable' | 'plateau';
  trendStrength: number; // 0-1
  projectedOutcome: {
    expectedValue: number;
    confidenceLevel: number;
    estimatedTimeToTarget: number; // days
  };
}

export interface RecoveryComparison {
  playerId: string;
  injuryType: string;
  currentRecovery: {
    daysSinceInjury: number;
    currentProgress: number;
    currentPhase: string;
  };
  benchmarkData: {
    averageRecoveryTime: number;
    percentileRank: number; // How this recovery compares to others
    similarCases: {
      averageDays: number;
      fastestRecovery: number;
      slowestRecovery: number;
      sampleSize: number;
    };
  };
  predictedOutcome: {
    estimatedCompletionDate: Date;
    confidenceLevel: number;
    riskFactors: string[];
    acceleratingFactors: string[];
  };
}

export interface RecoveryAlert {
  id: string;
  playerId: string;
  injuryId: string;
  protocolId?: string;
  type: 'setback' | 'plateau' | 'complication' | 'milestone_missed' | 'compliance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  triggeredBy: {
    metric: string;
    currentValue: number;
    threshold: number;
    trend?: string;
  };
  recommendations: {
    action: string;
    priority: 'immediate' | 'urgent' | 'moderate' | 'routine';
    assignee: 'medical_staff' | 'physical_trainer' | 'coach' | 'player';
  }[];
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export class RecoveryTrackingService {
  constructor(
    private recoveryRepository: Repository<RecoveryTracking>,
    private protocolRepository: Repository<ReturnToPlayProtocol>,
    private injuryRepository: Repository<Injury>
  ) {}

  async recordRecoveryAssessment(
    playerId: string,
    injuryId: string,
    assessmentData: {
      recoveryPhase: string;
      weekNumber: number;
      painLevel: number;
      functionLevel: number;
      rangeOfMotion?: any[];
      strengthMeasurements?: any[];
      performanceTests?: any[];
      activityModifications: any;
      treatmentCompliance: number;
      psychologicalReadiness?: number;
      returnToPlayConfidence?: number;
      clinicalNotes?: string;
    }
  ): Promise<RecoveryTracking> {
    const tracking = new RecoveryTracking();
    tracking.playerId = playerId;
    tracking.injuryId = injuryId;
    tracking.recoveryPhase = assessmentData.recoveryPhase;
    tracking.weekNumber = assessmentData.weekNumber;
    tracking.assessmentDate = new Date();
    tracking.painLevel = assessmentData.painLevel;
    tracking.functionLevel = assessmentData.functionLevel;
    tracking.rangeOfMotion = assessmentData.rangeOfMotion;
    tracking.strengthMeasurements = assessmentData.strengthMeasurements;
    tracking.performanceTests = assessmentData.performanceTests;
    tracking.activityModifications = assessmentData.activityModifications;
    tracking.treatmentCompliance = assessmentData.treatmentCompliance;
    tracking.psychologicalReadiness = assessmentData.psychologicalReadiness;
    tracking.returnToPlayConfidence = assessmentData.returnToPlayConfidence;
    tracking.clinicalNotes = assessmentData.clinicalNotes;

    // Calculate expected recovery timeline
    tracking.expectedRecoveryTimeline = await this.generateRecoveryTimeline(injuryId, assessmentData.recoveryPhase);
    
    // Calculate progress vs expected
    tracking.actualProgressVsExpected = await this.calculateProgressVsExpected(tracking);

    // Set next assessment date
    const nextAssessment = new Date();
    nextAssessment.setDate(nextAssessment.getDate() + 7); // Weekly assessments
    tracking.nextAssessmentDate = nextAssessment;

    const savedTracking = await this.recoveryRepository.save(tracking);

    // Check for alerts after saving
    await this.checkRecoveryAlerts(playerId, injuryId);

    return savedTracking;
  }

  async getRecoveryMilestones(injuryId: string): Promise<RecoveryMilestone[]> {
    const injury = await this.injuryRepository.findOne({
      where: { id: injuryId }
    });

    if (!injury) {
      throw new Error(`Injury ${injuryId} not found`);
    }

    const trackingHistory = await this.recoveryRepository.find({
      where: { injuryId },
      order: { assessmentDate: 'ASC' }
    });

    return this.generateMilestonesForInjury(injury, trackingHistory);
  }

  async getRecoveryTrends(injuryId: string, metrics: string[]): Promise<RecoveryTrend[]> {
    const trackingHistory = await this.recoveryRepository.find({
      where: { injuryId },
      order: { assessmentDate: 'ASC' }
    });

    const trends: RecoveryTrend[] = [];

    for (const metric of metrics) {
      const dataPoints = trackingHistory.map(tracking => ({
        date: new Date(tracking.assessmentDate),
        value: this.extractMetricValue(tracking, metric),
        target: this.getTargetValue(metric, tracking.weekNumber),
        notes: tracking.clinicalNotes
      })).filter(point => point.value !== null);

      if (dataPoints.length > 2) {
        const trend = this.calculateTrend(dataPoints);
        trends.push({
          metric,
          timeframe: 'week',
          dataPoints,
          trend: trend.direction,
          trendStrength: trend.strength,
          projectedOutcome: this.projectOutcome(dataPoints, metric)
        });
      }
    }

    return trends;
  }

  async compareRecoveryProgress(playerId: string, injuryId: string): Promise<RecoveryComparison> {
    const injury = await this.injuryRepository.findOne({
      where: { id: injuryId }
    });

    if (!injury) {
      throw new Error(`Injury ${injuryId} not found`);
    }

    const currentTracking = await this.recoveryRepository.findOne({
      where: { injuryId },
      order: { assessmentDate: 'DESC' }
    });

    if (!currentTracking) {
      throw new Error(`No tracking data found for injury ${injuryId}`);
    }

    const daysSinceInjury = Math.floor(
      (new Date().getTime() - new Date(injury.injuryDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get benchmark data for similar injuries
    const benchmarkData = await this.getBenchmarkData(injury.injuryType, injury.bodyPart);

    // Calculate percentile rank
    const percentileRank = this.calculatePercentileRank(
      daysSinceInjury,
      currentTracking.functionLevel,
      benchmarkData
    );

    return {
      playerId,
      injuryType: injury.injuryType,
      currentRecovery: {
        daysSinceInjury,
        currentProgress: currentTracking.functionLevel,
        currentPhase: currentTracking.recoveryPhase
      },
      benchmarkData: {
        averageRecoveryTime: benchmarkData.averageRecoveryTime,
        percentileRank,
        similarCases: benchmarkData.similarCases
      },
      predictedOutcome: await this.predictRecoveryOutcome(injuryId, currentTracking)
    };
  }

  async getRecoveryAlerts(playerId?: string, severity?: string[]): Promise<RecoveryAlert[]> {
    // This would typically query a alerts table, for now we'll generate based on current data
    const alerts: RecoveryAlert[] = [];

    let trackingData: RecoveryTracking[];
    
    if (playerId) {
      trackingData = await this.recoveryRepository.find({
        where: { playerId },
        order: { assessmentDate: 'DESC' },
        take: 10
      });
    } else {
      trackingData = await this.recoveryRepository.find({
        order: { assessmentDate: 'DESC' },
        take: 50
      });
    }

    // Generate alerts based on tracking data
    for (const tracking of trackingData) {
      const generatedAlerts = await this.generateAlertsForTracking(tracking);
      alerts.push(...generatedAlerts);
    }

    // Filter by severity if specified
    if (severity && severity.length > 0) {
      return alerts.filter(alert => severity.includes(alert.severity));
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  async recordSetback(
    injuryId: string,
    setbackData: {
      type: string;
      severity: 'minor' | 'moderate' | 'major';
      cause: string;
      impactOnTimeline: number;
      description: string;
      actionsTaken: string[];
    }
  ): Promise<void> {
    const latestTracking = await this.recoveryRepository.findOne({
      where: { injuryId },
      order: { assessmentDate: 'DESC' }
    });

    if (!latestTracking) return;

    // Add setback to tracking record
    const setbacks = latestTracking.setbacksDocumented || [];
    setbacks.push({
      date: new Date().toISOString(),
      type: setbackData.type,
      severity: setbackData.severity,
      cause: setbackData.cause,
      impact_on_timeline: setbackData.impactOnTimeline
    });

    latestTracking.setbacksDocumented = setbacks;

    // Recalculate expected timeline
    latestTracking.expectedRecoveryTimeline = await this.adjustTimelineForSetback(
      latestTracking.expectedRecoveryTimeline,
      setbackData.impactOnTimeline
    );

    await this.recoveryRepository.save(latestTracking);

    // Create alert
    await this.createSetbackAlert(injuryId, setbackData);
  }

  // Private helper methods
  private async generateRecoveryTimeline(injuryId: string, currentPhase: string): Promise<any[]> {
    const injury = await this.injuryRepository.findOne({
      where: { id: injuryId }
    });

    if (!injury) return [];

    // Generate timeline based on injury type and current phase
    const phases = [
      { phase: 'acute', start_week: 0, end_week: 2, key_milestones: ['Pain control', 'Reduce inflammation'] },
      { phase: 'subacute', start_week: 2, end_week: 6, key_milestones: ['Restore mobility', 'Begin strengthening'] },
      { phase: 'chronic', start_week: 6, end_week: 12, key_milestones: ['Build strength', 'Sport-specific training'] },
      { phase: 'return_to_play', start_week: 12, end_week: 16, key_milestones: ['Full clearance', 'Performance testing'] }
    ];

    return phases;
  }

  private async calculateProgressVsExpected(tracking: RecoveryTracking): Promise<number> {
    // Calculate expected progress for this week
    const expectedFunction = this.getExpectedFunctionLevel(tracking.weekNumber, tracking.recoveryPhase);
    const actualFunction = tracking.functionLevel;
    
    if (expectedFunction === 0) return 0;
    return Math.round(((actualFunction - expectedFunction) / expectedFunction) * 100);
  }

  private getExpectedFunctionLevel(weekNumber: number, phase: string): number {
    // Simplified expected function level calculation
    const baselineByPhase = {
      'acute': 20,
      'subacute': 40,
      'chronic': 70,
      'return_to_play': 90
    };

    const baseline = baselineByPhase[phase as keyof typeof baselineByPhase] || 50;
    const weeklyIncrease = 5;
    
    return Math.min(100, baseline + (weekNumber * weeklyIncrease));
  }

  private generateMilestonesForInjury(injury: Injury, trackingHistory: RecoveryTracking[]): RecoveryMilestone[] {
    const milestones: RecoveryMilestone[] = [
      {
        id: 'pain-control',
        name: 'Pain Control',
        phase: 'acute',
        targetWeek: 1,
        description: 'Achieve adequate pain control and reduce inflammation',
        requirements: {
          painLevel: { max: 3 }
        },
        isCompleted: false
      },
      {
        id: 'mobility-restoration',
        name: 'Mobility Restoration',
        phase: 'subacute',
        targetWeek: 3,
        description: 'Restore full range of motion',
        requirements: {
          rangeOfMotion: [
            { joint: injury.bodyPart, movement: 'flexion', minPercent: 80 },
            { joint: injury.bodyPart, movement: 'extension', minPercent: 80 }
          ]
        },
        isCompleted: false
      },
      {
        id: 'strength-building',
        name: 'Strength Building',
        phase: 'chronic',
        targetWeek: 6,
        description: 'Achieve 80% strength compared to uninjured side',
        requirements: {
          strengthTests: [
            { muscle: injury.bodyPart, minPercent: 80 }
          ]
        },
        isCompleted: false
      },
      {
        id: 'sport-readiness',
        name: 'Sport Readiness',
        phase: 'return_to_play',
        targetWeek: 10,
        description: 'Pass all sport-specific performance tests',
        requirements: {
          functionLevel: { min: 90 },
          performanceTests: [
            { test: 'sport_specific_movement', passingScore: 85 }
          ]
        },
        isCompleted: false
      }
    ];

    // Check completion status based on tracking history
    for (const milestone of milestones) {
      const relevantTracking = trackingHistory.find(t => t.weekNumber >= milestone.targetWeek);
      if (relevantTracking) {
        milestone.isCompleted = this.checkMilestoneCompletion(milestone, relevantTracking);
        if (milestone.isCompleted) {
          milestone.completedDate = new Date(relevantTracking.assessmentDate);
        }
      }
    }

    return milestones;
  }

  private checkMilestoneCompletion(milestone: RecoveryMilestone, tracking: RecoveryTracking): boolean {
    const req = milestone.requirements;
    
    if (req.painLevel && tracking.painLevel > req.painLevel.max) return false;
    if (req.functionLevel && tracking.functionLevel < req.functionLevel.min) return false;
    
    // Check range of motion requirements
    if (req.rangeOfMotion && tracking.rangeOfMotion) {
      for (const romReq of req.rangeOfMotion) {
        const romData = tracking.rangeOfMotion.find(r => 
          r.joint === romReq.joint && r.movement === romReq.movement
        );
        if (!romData || romData.percentage_of_normal < romReq.minPercent) return false;
      }
    }
    
    // Check strength requirements
    if (req.strengthTests && tracking.strengthMeasurements) {
      for (const strengthReq of req.strengthTests) {
        const strengthData = tracking.strengthMeasurements.find(s => 
          s.muscle_group === strengthReq.muscle
        );
        if (!strengthData || strengthData.percentage_of_baseline < strengthReq.minPercent) return false;
      }
    }
    
    return true;
  }

  private extractMetricValue(tracking: RecoveryTracking, metric: string): number | null {
    switch (metric) {
      case 'pain_level':
        return tracking.painLevel;
      case 'function_level':
        return tracking.functionLevel;
      case 'compliance':
        return tracking.treatmentCompliance;
      case 'psychological_readiness':
        return tracking.psychologicalReadiness || null;
      case 'return_to_play_confidence':
        return tracking.returnToPlayConfidence || null;
      default:
        return null;
    }
  }

  private getTargetValue(metric: string, weekNumber: number): number {
    // Simplified target value calculation
    const targets = {
      'pain_level': Math.max(0, 5 - weekNumber),
      'function_level': Math.min(100, 30 + (weekNumber * 8)),
      'compliance': 85,
      'psychological_readiness': Math.min(100, 50 + (weekNumber * 5)),
      'return_to_play_confidence': Math.min(100, 40 + (weekNumber * 6))
    };
    
    return targets[metric as keyof typeof targets] || 50;
  }

  private calculateTrend(dataPoints: any[]): { direction: 'improving' | 'declining' | 'stable' | 'plateau'; strength: number } {
    if (dataPoints.length < 3) return { direction: 'stable', strength: 0 };
    
    // Simple linear regression to determine trend
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, _, i) => sum + i, 0);
    const sumY = dataPoints.reduce((sum, point) => sum + point.value, 0);
    const sumXY = dataPoints.reduce((sum, point, i) => sum + (i * point.value), 0);
    const sumXX = dataPoints.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const strength = Math.abs(slope) / 10; // Normalize to 0-1 range
    
    if (Math.abs(slope) < 0.5) return { direction: 'stable', strength };
    if (slope > 0) return { direction: 'improving', strength };
    return { direction: 'declining', strength };
  }

  private projectOutcome(dataPoints: any[], metric: string): any {
    // Simple projection based on current trend
    const recentPoints = dataPoints.slice(-3);
    const avgValue = recentPoints.reduce((sum, p) => sum + p.value, 0) / recentPoints.length;
    const target = this.getTargetValue(metric, 12); // 12-week target
    
    const estimatedDaysToTarget = Math.abs(target - avgValue) * 7; // Rough estimate
    
    return {
      expectedValue: Math.min(100, avgValue + 5), // Conservative improvement
      confidenceLevel: 70,
      estimatedTimeToTarget: estimatedDaysToTarget
    };
  }

  private async getBenchmarkData(injuryType: string, bodyPart: string): Promise<any> {
    // In practice, this would query historical data
    const benchmarks = {
      'Ankle Sprain': { averageRecoveryTime: 21, similarCases: { averageDays: 21, fastestRecovery: 14, slowestRecovery: 35, sampleSize: 150 } },
      'Knee Injury': { averageRecoveryTime: 42, similarCases: { averageDays: 42, fastestRecovery: 28, slowestRecovery: 84, sampleSize: 95 } },
      'Shoulder Injury': { averageRecoveryTime: 35, similarCases: { averageDays: 35, fastestRecovery: 21, slowestRecovery: 56, sampleSize: 75 } }
    };
    
    return benchmarks[injuryType as keyof typeof benchmarks] || { 
      averageRecoveryTime: 28, 
      similarCases: { averageDays: 28, fastestRecovery: 14, slowestRecovery: 42, sampleSize: 50 } 
    };
  }

  private calculatePercentileRank(daysSinceInjury: number, functionLevel: number, benchmarkData: any): number {
    // Simplified percentile calculation
    const expectedFunction = this.getExpectedFunctionLevel(Math.floor(daysSinceInjury / 7), 'chronic');
    const performanceRatio = functionLevel / expectedFunction;
    
    if (performanceRatio >= 1.2) return 90;
    if (performanceRatio >= 1.1) return 75;
    if (performanceRatio >= 0.9) return 50;
    if (performanceRatio >= 0.8) return 25;
    return 10;
  }

  private async predictRecoveryOutcome(injuryId: string, currentTracking: RecoveryTracking): Promise<any> {
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + 14); // 2 weeks estimate
    
    return {
      estimatedCompletionDate: estimatedCompletion,
      confidenceLevel: 75,
      riskFactors: this.identifyRiskFactors(currentTracking),
      acceleratingFactors: this.identifyAcceleratingFactors(currentTracking)
    };
  }

  private identifyRiskFactors(tracking: RecoveryTracking): string[] {
    const factors = [];
    
    if (tracking.treatmentCompliance < 70) factors.push('Low treatment compliance');
    if (tracking.painLevel > 5) factors.push('Persistent high pain levels');
    if (tracking.psychologicalReadiness && tracking.psychologicalReadiness < 60) factors.push('Low psychological readiness');
    
    return factors;
  }

  private identifyAcceleratingFactors(tracking: RecoveryTracking): string[] {
    const factors = [];
    
    if (tracking.treatmentCompliance > 90) factors.push('Excellent compliance');
    if (tracking.functionLevel > this.getExpectedFunctionLevel(tracking.weekNumber, tracking.recoveryPhase)) {
      factors.push('Ahead of expected progress');
    }
    
    return factors;
  }

  private async generateAlertsForTracking(tracking: RecoveryTracking): Promise<RecoveryAlert[]> {
    const alerts: RecoveryAlert[] = [];
    
    // Pain level alert
    if (tracking.painLevel > 7) {
      alerts.push({
        id: `pain-${tracking.id}-${Date.now()}`,
        playerId: tracking.playerId,
        injuryId: tracking.injuryId,
        type: 'setback',
        severity: 'high',
        title: 'High Pain Level Detected',
        description: `Pain level of ${tracking.painLevel} exceeds safe threshold`,
        triggeredBy: {
          metric: 'pain_level',
          currentValue: tracking.painLevel,
          threshold: 7
        },
        recommendations: [
          {
            action: 'Medical evaluation required',
            priority: 'immediate',
            assignee: 'medical_staff'
          },
          {
            action: 'Modify training intensity',
            priority: 'urgent',
            assignee: 'physical_trainer'
          }
        ],
        createdAt: new Date()
      });
    }
    
    // Compliance alert
    if (tracking.treatmentCompliance < 60) {
      alerts.push({
        id: `compliance-${tracking.id}-${Date.now()}`,
        playerId: tracking.playerId,
        injuryId: tracking.injuryId,
        type: 'compliance_issue',
        severity: 'medium',
        title: 'Low Treatment Compliance',
        description: `Compliance rate of ${tracking.treatmentCompliance}% is below acceptable levels`,
        triggeredBy: {
          metric: 'compliance',
          currentValue: tracking.treatmentCompliance,
          threshold: 60
        },
        recommendations: [
          {
            action: 'Patient education session',
            priority: 'urgent',
            assignee: 'medical_staff'
          },
          {
            action: 'Adjust treatment plan',
            priority: 'moderate',
            assignee: 'physical_trainer'
          }
        ],
        createdAt: new Date()
      });
    }
    
    return alerts;
  }

  private async createSetbackAlert(injuryId: string, setbackData: any): Promise<void> {
    // In practice, this would save to an alerts table
    console.log(`Setback alert created for injury ${injuryId}:`, setbackData);
  }

  private async adjustTimelineForSetback(timeline: any[], impactDays: number): Promise<any[]> {
    // Adjust all future milestones by the impact days
    return timeline.map(phase => ({
      ...phase,
      start_week: phase.start_week + Math.floor(impactDays / 7),
      end_week: phase.end_week + Math.floor(impactDays / 7)
    }));
  }

  private async checkRecoveryAlerts(playerId: string, injuryId: string): Promise<void> {
    // Check for various alert conditions after each assessment
    const latestTracking = await this.recoveryRepository.findOne({
      where: { injuryId },
      order: { assessmentDate: 'DESC' }
    });

    if (!latestTracking) return;

    const alerts = await this.generateAlertsForTracking(latestTracking);
    
    // In practice, alerts would be saved to database and notifications sent
    for (const alert of alerts) {
      console.log(`Recovery alert generated:`, alert.title);
    }
  }
}