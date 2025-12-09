import { Repository } from 'typeorm';
import { 
  InjuryCorrelation, 
  RecoveryTracking, 
  MedicalPerformanceCorrelation, 
  Injury,
  ReturnToPlayProtocol,
  ProtocolStatus 
} from '../entities';

export interface InjuryPattern {
  injuryType: string;
  bodyPart: string;
  frequency: number;
  averageSeverity: number;
  commonCauses: string[];
  recoveryTimeAvg: number;
  recurrenceRate: number;
  seasonalTrends: {
    month: string;
    occurrences: number;
  }[];
}

export interface RecoveryAnalysis {
  playerId: string;
  injuryId: string;
  currentPhase: string;
  progressPercentage: number;
  daysInRecovery: number;
  expectedDaysRemaining: number;
  complianceScore: number;
  riskFactors: string[];
  nextMilestone: {
    description: string;
    targetDate: string;
    requirements: string[];
  };
}

export interface MedicalRiskAssessment {
  playerId: string;
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: {
    factor: string;
    impact: number;
    category: 'workload' | 'medical_history' | 'biomechanical' | 'environmental';
  }[];
  recommendations: {
    priority: 'immediate' | 'short_term' | 'long_term';
    intervention: string;
    rationale: string;
  }[];
  monitoringPlan: {
    frequency: string;
    metrics: string[];
    alertThresholds: Record<string, number>;
  };
}

export interface TeamMedicalMetrics {
  totalActiveInjuries: number;
  playersInRecovery: number;
  averageRecoveryTime: number;
  injuryRate: number;
  returnToPlaySuccessRate: number;
  complianceRate: number;
  injuryTrends: {
    period: string;
    newInjuries: number;
    recoveredPlayers: number;
    trend: 'improving' | 'declining' | 'stable';
  }[];
  highRiskPlayers: {
    playerId: string;
    riskScore: number;
    primaryConcerns: string[];
  }[];
}

export class MedicalAnalyticsService {
  constructor(
    private injuryRepository: Repository<Injury>,
    private correlationRepository: Repository<InjuryCorrelation>,
    private recoveryRepository: Repository<RecoveryTracking>,
    private performanceRepository: Repository<MedicalPerformanceCorrelation>,
    private protocolRepository: Repository<ReturnToPlayProtocol>
  ) {}

  async analyzeInjuryPatterns(
    teamId?: string,
    timeframe?: { startDate: Date; endDate: Date }
  ): Promise<InjuryPattern[]> {
    const queryBuilder = this.injuryRepository.createQueryBuilder('injury')
      .leftJoinAndSelect('injury.treatments', 'treatment')
      .leftJoinAndSelect('injury.returnToPlayProtocols', 'protocol');

    if (teamId) {
      // Assuming we can join with player/team data
      queryBuilder.where('injury.team_id = :teamId', { teamId });
    }

    if (timeframe) {
      queryBuilder.andWhere('injury.injury_date BETWEEN :startDate AND :endDate', {
        startDate: timeframe.startDate,
        endDate: timeframe.endDate
      });
    }

    const injuries = await queryBuilder.getMany();

    // Group injuries by type and body part
    const patterns = new Map<string, InjuryPattern>();

    for (const injury of injuries) {
      const key = `${injury.injuryType}-${injury.bodyPart}`;
      
      if (!patterns.has(key)) {
        patterns.set(key, {
          injuryType: injury.injuryType,
          bodyPart: injury.bodyPart,
          frequency: 0,
          averageSeverity: 0,
          commonCauses: [],
          recoveryTimeAvg: 0,
          recurrenceRate: 0,
          seasonalTrends: []
        });
      }

      const pattern = patterns.get(key)!;
      pattern.frequency += 1;
      pattern.averageSeverity += injury.severityLevel;

      if (injury.mechanismOfInjury) {
        pattern.commonCauses.push(injury.mechanismOfInjury);
      }

      // Calculate recovery time if completed
      if (injury.returnToPlayProtocols?.length > 0) {
        const protocol = injury.returnToPlayProtocols[0];
        if (protocol.actualCompletionDate) {
          const recoveryDays = Math.floor(
            (new Date(protocol.actualCompletionDate).getTime() - 
             new Date(protocol.startDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          pattern.recoveryTimeAvg += recoveryDays;
        }
      }
    }

    // Calculate averages and clean up data
    return Array.from(patterns.values()).map(pattern => ({
      ...pattern,
      averageSeverity: pattern.averageSeverity / pattern.frequency,
      recoveryTimeAvg: pattern.recoveryTimeAvg / pattern.frequency,
      commonCauses: [...new Set(pattern.commonCauses)].slice(0, 3), // Top 3 unique causes
      seasonalTrends: this.calculateSeasonalTrends(injuries.filter(
        i => i.injuryType === pattern.injuryType && i.bodyPart === pattern.bodyPart
      ))
    }));
  }

  async getRecoveryAnalysis(injuryId: string): Promise<RecoveryAnalysis | null> {
    const protocol = await this.protocolRepository.findOne({
      where: { injuryId, isActive: true },
      relations: ['injury', 'rehabilitationSessions']
    });

    if (!protocol) return null;

    const latestTracking = await this.recoveryRepository.findOne({
      where: { injuryId },
      order: { assessmentDate: 'DESC' }
    });

    if (!latestTracking) return null;

    const daysInRecovery = Math.floor(
      (new Date().getTime() - new Date(protocol.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const expectedDaysRemaining = protocol.expectedCompletionDate
      ? Math.max(0, Math.floor(
          (new Date(protocol.expectedCompletionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ))
      : 0;

    return {
      playerId: protocol.playerId,
      injuryId,
      currentPhase: latestTracking.recoveryPhase,
      progressPercentage: protocol.completionPercentage,
      daysInRecovery,
      expectedDaysRemaining,
      complianceScore: protocol.complianceScore || 0,
      riskFactors: protocol.riskFactors?.map(rf => rf.factor) || [],
      nextMilestone: this.getNextMilestone(protocol, latestTracking)
    };
  }

  async assessMedicalRisk(playerId: string): Promise<MedicalRiskAssessment> {
    // Get current injuries and medical history
    const activeInjuries = await this.injuryRepository.find({
      where: { playerId, isActive: true }
    });

    const correlations = await this.correlationRepository.find({
      where: { playerId },
      order: { injuryDate: 'DESC' },
      take: 10 // Last 10 injuries for pattern analysis
    });

    const latestPerformanceCorr = await this.performanceRepository.findOne({
      where: { playerId },
      order: { correlationDate: 'DESC' }
    });

    // Calculate risk factors
    const riskFactors = [];
    let riskScore = 0;

    // Active injuries factor
    if (activeInjuries.length > 0) {
      riskFactors.push({
        factor: 'Active injuries present',
        impact: activeInjuries.length * 20,
        category: 'medical_history' as const
      });
      riskScore += activeInjuries.length * 20;
    }

    // Injury frequency factor
    const recentInjuries = correlations.filter(c => {
      const injuryDate = new Date(c.injuryDate);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return injuryDate > sixMonthsAgo;
    });

    if (recentInjuries.length > 2) {
      riskFactors.push({
        factor: 'High injury frequency',
        impact: recentInjuries.length * 10,
        category: 'medical_history' as const
      });
      riskScore += recentInjuries.length * 10;
    }

    // Workload factors
    if (latestPerformanceCorr?.loadTolerance.injury_resilience_score < 60) {
      riskFactors.push({
        factor: 'Low injury resilience',
        impact: 25,
        category: 'workload' as const
      });
      riskScore += 25;
    }

    // Wellness factors
    if (latestPerformanceCorr?.wellnessIndicators.fatigue_level_avg > 7) {
      riskFactors.push({
        factor: 'High fatigue levels',
        impact: 15,
        category: 'environmental' as const
      });
      riskScore += 15;
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 80) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';
    else riskLevel = 'low';

    return {
      playerId,
      overallRiskScore: Math.min(100, riskScore),
      riskLevel,
      riskFactors,
      recommendations: this.generateRecommendations(riskLevel, riskFactors),
      monitoringPlan: this.createMonitoringPlan(riskLevel)
    };
  }

  async getTeamMedicalMetrics(teamId: string): Promise<TeamMedicalMetrics> {
    // This would need to be implemented with proper team-player relationships
    // For now, providing the structure
    
    const activeInjuries = await this.injuryRepository.count({
      where: { isActive: true }
    });

    const protocols = await this.protocolRepository.find({
      where: { status: ProtocolStatus.IN_PROGRESS }
    });

    return {
      totalActiveInjuries: activeInjuries,
      playersInRecovery: protocols.length,
      averageRecoveryTime: await this.calculateAverageRecoveryTime(teamId),
      injuryRate: await this.calculateInjuryRate(teamId),
      returnToPlaySuccessRate: await this.calculateReturnToPlaySuccessRate(teamId),
      complianceRate: await this.calculateComplianceRate(teamId),
      injuryTrends: await this.calculateInjuryTrends(teamId),
      highRiskPlayers: await this.getHighRiskPlayers(teamId)
    };
  }

  private calculateSeasonalTrends(injuries: Injury[]) {
    const monthCounts = new Map<string, number>();
    
    injuries.forEach(injury => {
      const month = new Date(injury.injuryDate).toLocaleString('default', { month: 'long' });
      monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
    });

    return Array.from(monthCounts.entries()).map(([month, occurrences]) => ({
      month,
      occurrences
    }));
  }

  private getNextMilestone(protocol: ReturnToPlayProtocol, tracking: RecoveryTracking) {
    // Logic to determine next milestone based on current phase and progress
    const milestones = [
      { phase: 'rest', description: 'Complete rest period', requirements: ['Pain level < 3', 'No swelling'] },
      { phase: 'light_activity', description: 'Begin light activity', requirements: ['Pain-free daily activities', 'Full range of motion'] },
      { phase: 'sport_specific', description: 'Sport-specific training', requirements: ['Strength at 80% baseline', 'No pain during movement'] },
      { phase: 'non_contact_training', description: 'Non-contact training', requirements: ['Full strength', 'Sport-specific skills demonstrated'] },
      { phase: 'full_contact_practice', description: 'Full contact practice', requirements: ['Medical clearance', 'Psychological readiness'] },
      { phase: 'game_clearance', description: 'Game clearance', requirements: ['Full practice participation', 'Coach approval'] }
    ];

    const currentIndex = milestones.findIndex(m => m.phase === protocol.currentPhase);
    const nextMilestone = milestones[Math.min(currentIndex + 1, milestones.length - 1)];

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7); // Default to 1 week

    return {
      description: nextMilestone.description,
      targetDate: targetDate.toISOString().split('T')[0],
      requirements: nextMilestone.requirements
    };
  }

  private generateRecommendations(riskLevel: string, riskFactors: any[]) {
    const recommendations = [];

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push({
        priority: 'immediate' as const,
        intervention: 'Medical evaluation required',
        rationale: 'High risk factors present requiring immediate attention'
      });
    }

    if (riskFactors.some(rf => rf.category === 'workload')) {
      recommendations.push({
        priority: 'short_term' as const,
        intervention: 'Workload modification',
        rationale: 'Current training load exceeds safe thresholds'
      });
    }

    recommendations.push({
      priority: 'long_term' as const,
      intervention: 'Injury prevention program',
      rationale: 'Proactive approach to reduce future injury risk'
    });

    return recommendations;
  }

  private createMonitoringPlan(riskLevel: string) {
    const baseMetrics = ['pain_level', 'function_level', 'fatigue_level'];
    const frequency = riskLevel === 'critical' ? 'daily' : 
                     riskLevel === 'high' ? 'every_2_days' : 'weekly';

    return {
      frequency,
      metrics: baseMetrics,
      alertThresholds: {
        pain_level: 5,
        function_level: 70,
        fatigue_level: 8
      }
    };
  }

  // Placeholder methods for team metrics calculation
  private async calculateAverageRecoveryTime(teamId: string): Promise<number> {
    // Implementation would calculate based on completed protocols
    return 21; // Default 3 weeks
  }

  private async calculateInjuryRate(teamId: string): Promise<number> {
    // Implementation would calculate injuries per 1000 training hours
    return 2.5;
  }

  private async calculateReturnToPlaySuccessRate(teamId: string): Promise<number> {
    // Implementation would calculate successful returns vs total attempts
    return 85;
  }

  private async calculateComplianceRate(teamId: string): Promise<number> {
    // Implementation would calculate average compliance across all protocols
    return 78;
  }

  private async calculateInjuryTrends(teamId: string): Promise<any[]> {
    // Implementation would analyze trends over time
    return [
      { period: 'Current Month', newInjuries: 3, recoveredPlayers: 5, trend: 'improving' },
      { period: 'Last Month', newInjuries: 7, recoveredPlayers: 4, trend: 'declining' }
    ];
  }

  private async getHighRiskPlayers(teamId: string): Promise<any[]> {
    // Implementation would identify players with highest risk scores
    return [
      { playerId: 'player-1', riskScore: 85, primaryConcerns: ['High workload', 'Recent injury'] },
      { playerId: 'player-2', riskScore: 72, primaryConcerns: ['Poor compliance', 'Fatigue'] }
    ];
  }
}