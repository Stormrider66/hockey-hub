import { createApi } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from './mockBaseQuery';

// Types based on backend services
export interface PlayerMedicalSummary {
  playerId: string;
  playerName: string;
  activeInjuries: number;
  recoveryProtocols: number;
  injuryRiskScore: number;
  medicalStatus: 'healthy' | 'injured' | 'recovering' | 'limited';
  clearanceLevel: 'full' | 'limited' | 'restricted' | 'no_clearance';
  returnToPlayConfidence?: number;
  performanceImpact: number;
  lastInjuryDate?: string;
  daysSinceLastInjury?: number;
  restrictionCount: number;
}

export interface TeamMedicalOverview {
  totalPlayers: number;
  healthyPlayers: number;
  injuredPlayers: number;
  recoveringPlayers: number;
  limitedPlayers: number;
  averageInjuryRisk: number;
  totalActiveInjuries: number;
  playerSummaries: PlayerMedicalSummary[];
}

export interface InjuryTrendAnalysis {
  totalInjuries: number;
  injuryRate: number;
  commonInjuryTypes: Array<{
    type: string;
    bodyPart: string;
    count: number;
    averageSeverity: number;
    averageRecoveryDays: number;
  }>;
  seasonalPatterns: Array<{
    month: number;
    injuryCount: number;
    severity: number;
  }>;
  workloadCorrelations: Array<{
    loadPattern: string;
    injuryRisk: number;
    correlationStrength: number;
  }>;
}

export interface RecoveryAnalytics {
  averageRecoveryTime: number;
  recoverySuccessRate: number;
  protocolCompliance: number;
  phaseBreakdown: Array<{
    phase: string;
    averageDays: number;
    successRate: number;
    commonSetbacks: string[];
  }>;
  performanceReturnRates: {
    speed: number;
    power: number;
    endurance: number;
    agility: number;
    strength: number;
    overall: number;
  };
  psychologicalReadiness: number;
  reinjuryRate: number;
}

export interface MedicalAlert {
  alertId: string;
  playerId: string;
  playerName: string;
  alertType: 'injury_risk' | 'recovery_setback' | 'clearance_needed' | 'compliance_issue' | 'performance_decline';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendedAction: string;
  createdAt: string;
  isResolved: boolean;
  metadata: Record<string, any>;
}

export interface InjuryPredictionModel {
  playerId: string;
  playerName: string;
  injuryRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  topRiskFactors: Array<{
    factor: string;
    impact: number;
    category: 'workload' | 'medical_history' | 'biomechanical' | 'environmental' | 'psychological';
    confidence: number;
  }>;
  recommendedInterventions: Array<{
    intervention: string;
    priority: 'immediate' | 'high' | 'medium' | 'low';
    expectedImpact: number;
    timeframe: string;
  }>;
  predictedInjuryTypes: Array<{
    injuryType: string;
    bodyPart: string;
    probability: number;
    timeWindow: 'next_week' | 'next_month' | 'next_3_months';
  }>;
}

export interface RecoveryTracking {
  trackingId: string;
  playerId: string;
  playerName: string;
  injuryId: string;
  injuryType: string;
  recoveryPhase: string;
  weekNumber: number;
  assessmentDate: string;
  painLevel: number;
  functionLevel: number;
  treatmentCompliance: number;
  psychologicalReadiness?: number;
  returnToPlayConfidence?: number;
  progressVsExpected: number;
  nextMilestone: {
    description: string;
    targetDate: string;
    requirements: string[];
  };
}

export interface ReturnToPlayProtocol {
  protocolId: string;
  playerId: string;
  playerName: string;
  injuryId: string;
  injuryType: string;
  currentPhase: string;
  status: 'in_progress' | 'completed' | 'paused' | 'cancelled';
  startDate: string;
  expectedCompletionDate: string;
  actualCompletionDate?: string;
  completionPercentage: number;
  clearanceLevel: 'full' | 'limited' | 'restricted' | 'no_clearance';
  complianceScore: number;
  phases: Array<{
    phase: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    requirements: Array<{
      requirementId: string;
      description: string;
      type: 'medical' | 'functional' | 'performance' | 'psychological';
      isMet: boolean;
    }>;
  }>;
}

export interface MedicalReport {
  reportId: string;
  title: string;
  reportType: string;
  generatedAt: string;
  parameters: {
    timeframe: {
      startDate: string;
      endDate: string;
    };
    teamId?: string;
    playerId?: string;
  };
  sections: Array<{
    sectionId: string;
    title: string;
    type: string;
    keyMetrics: Array<{
      metric: string;
      value: string | number;
      trend?: 'up' | 'down' | 'stable';
    }>;
  }>;
  downloadUrl?: string;
}

// Mock data generators
const generateMockPlayerSummaries = (): PlayerMedicalSummary[] => {
  const players = [
    { id: 'player-1', name: 'Sidney Crosby' },
    { id: 'player-2', name: 'Nathan MacKinnon' },
    { id: 'player-3', name: 'Connor McDavid' },
    { id: 'player-4', name: 'Leon Draisaitl' },
    { id: 'player-5', name: 'Erik Karlsson' },
    { id: 'player-6', name: 'Kris Letang' },
    { id: 'player-7', name: 'Evgeni Malkin' },
    { id: 'player-8', name: 'Jake Guentzel' },
    { id: 'player-9', name: 'Bryan Rust' },
    { id: 'player-10', name: 'Rickard Rakell' }
  ];

  return players.map(player => {
    const riskScore = Math.floor(Math.random() * 100);
    const hasInjury = Math.random() < 0.3;
    const isRecovering = Math.random() < 0.2;
    
    let medicalStatus: PlayerMedicalSummary['medicalStatus'] = 'healthy';
    let clearanceLevel: PlayerMedicalSummary['clearanceLevel'] = 'full';
    
    if (hasInjury) {
      medicalStatus = 'injured';
      clearanceLevel = 'restricted';
    } else if (isRecovering) {
      medicalStatus = 'recovering';
      clearanceLevel = 'limited';
    } else if (riskScore > 70) {
      medicalStatus = 'limited';
      clearanceLevel = 'limited';
    }

    return {
      playerId: player.id,
      playerName: player.name,
      activeInjuries: hasInjury ? Math.floor(Math.random() * 2) + 1 : 0,
      recoveryProtocols: isRecovering ? 1 : 0,
      injuryRiskScore: riskScore,
      medicalStatus,
      clearanceLevel,
      returnToPlayConfidence: isRecovering ? Math.floor(Math.random() * 50) + 50 : undefined,
      performanceImpact: hasInjury ? Math.floor(Math.random() * 20) + 5 : 0,
      lastInjuryDate: hasInjury ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      daysSinceLastInjury: hasInjury ? Math.floor(Math.random() * 90) : undefined,
      restrictionCount: hasInjury ? Math.floor(Math.random() * 3) + 1 : 0
    };
  });
};

const generateMockAlerts = (): MedicalAlert[] => {
  const alertTypes = ['injury_risk', 'recovery_setback', 'clearance_needed', 'compliance_issue', 'performance_decline'] as const;
  const severities = ['low', 'medium', 'high', 'critical'] as const;
  
  return Array.from({ length: 8 }, (_, index) => {
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const playerId = `player-${Math.floor(Math.random() * 10) + 1}`;
    
    const titles = {
      injury_risk: 'High Injury Risk Detected',
      recovery_setback: 'Recovery Progress Setback',
      clearance_needed: 'Medical Clearance Required',
      compliance_issue: 'Low Treatment Compliance',
      performance_decline: 'Performance Decline Detected'
    };

    const descriptions = {
      injury_risk: 'Player showing elevated injury risk based on workload and medical history',
      recovery_setback: 'Recovery progress has plateaued or declined in recent assessments',
      clearance_needed: 'Player requires medical clearance before returning to activity',
      compliance_issue: 'Treatment compliance has dropped below acceptable thresholds',
      performance_decline: 'Significant performance decline detected in recent training'
    };

    const actions = {
      injury_risk: 'Implement immediate workload reduction and preventive measures',
      recovery_setback: 'Reassess rehabilitation protocol and consider modifications',
      clearance_needed: 'Schedule comprehensive medical evaluation',
      compliance_issue: 'Conduct patient education session and review treatment plan',
      performance_decline: 'Evaluate underlying causes and adjust training protocols'
    };

    return {
      alertId: `alert-${index + 1}`,
      playerId,
      playerName: `Player ${playerId.split('-')[1]}`,
      alertType,
      severity,
      title: titles[alertType],
      description: descriptions[alertType],
      recommendedAction: actions[alertType],
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      isResolved: Math.random() < 0.3,
      metadata: {
        riskScore: alertType === 'injury_risk' ? Math.floor(Math.random() * 30) + 70 : undefined,
        complianceRate: alertType === 'compliance_issue' ? Math.floor(Math.random() * 30) + 40 : undefined
      }
    };
  });
};

const generateMockRecoveryTracking = (): RecoveryTracking[] => {
  const injuryTypes = ['Muscle Strain', 'Joint Sprain', 'Concussion', 'Shoulder Injury', 'Knee Injury'];
  const phases = ['acute', 'subacute', 'recovery', 'return_to_play'];
  
  return Array.from({ length: 6 }, (_, index) => {
    const playerId = `player-${Math.floor(Math.random() * 5) + 1}`;
    const injuryType = injuryTypes[Math.floor(Math.random() * injuryTypes.length)];
    const phase = phases[Math.floor(Math.random() * phases.length)];
    const weekNumber = Math.floor(Math.random() * 12) + 1;
    
    return {
      trackingId: `tracking-${index + 1}`,
      playerId,
      playerName: `Player ${playerId.split('-')[1]}`,
      injuryId: `injury-${index + 1}`,
      injuryType,
      recoveryPhase: phase,
      weekNumber,
      assessmentDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      painLevel: Math.floor(Math.random() * 8) + 1,
      functionLevel: Math.floor(Math.random() * 40) + 60,
      treatmentCompliance: Math.floor(Math.random() * 30) + 70,
      psychologicalReadiness: Math.floor(Math.random() * 40) + 60,
      returnToPlayConfidence: Math.floor(Math.random() * 40) + 50,
      progressVsExpected: Math.floor(Math.random() * 40) - 20,
      nextMilestone: {
        description: 'Complete functional movement screening',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requirements: ['Pain level < 3', 'Function level > 85%', 'Full range of motion']
      }
    };
  });
};

const generateMockProtocols = (): ReturnToPlayProtocol[] => {
  const injuryTypes = ['Muscle Strain', 'Joint Sprain', 'Concussion', 'Shoulder Injury'];
  const phases = ['rest', 'light_activity', 'sport_specific_training', 'non_contact_training', 'full_contact_practice'];
  const statuses = ['in_progress', 'completed', 'paused'] as const;
  
  return Array.from({ length: 5 }, (_, index) => {
    const playerId = `player-${index + 1}`;
    const injuryType = injuryTypes[Math.floor(Math.random() * injuryTypes.length)];
    const currentPhase = phases[Math.floor(Math.random() * phases.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      protocolId: `protocol-${index + 1}`,
      playerId,
      playerName: `Player ${index + 1}`,
      injuryId: `injury-${index + 1}`,
      injuryType,
      currentPhase,
      status,
      startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      expectedCompletionDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      actualCompletionDate: status === 'completed' ? new Date().toISOString() : undefined,
      completionPercentage: Math.floor(Math.random() * 100),
      clearanceLevel: status === 'completed' ? 'full' : ['limited', 'restricted', 'no_clearance'][Math.floor(Math.random() * 3)] as any,
      complianceScore: Math.floor(Math.random() * 30) + 70,
      phases: phases.map(phase => ({
        phase,
        status: phases.indexOf(phase) <= phases.indexOf(currentPhase) ? 'completed' : 'pending' as any,
        requirements: [
          {
            requirementId: `req-${phase}-1`,
            description: `Complete ${phase} requirements`,
            type: 'functional' as const,
            isMet: phases.indexOf(phase) < phases.indexOf(currentPhase)
          }
        ]
      }))
    };
  });
};

export const medicalAnalyticsApi = createApi({
  reducerPath: 'medicalAnalyticsApi',
  baseQuery: mockBaseQuery,
  tagTypes: ['TeamMedical', 'InjuryTrends', 'Recovery', 'Alerts', 'Protocols', 'Reports'],
  endpoints: (builder) => ({
    // Team medical overview
    getTeamMedicalOverview: builder.query<TeamMedicalOverview, { teamId: string }>({
      query: ({ teamId }) => ({
        url: `/medical-analytics/team/${teamId}/overview`,
        method: 'GET'
      }),
      providesTags: ['TeamMedical'],
      transformResponse: (): TeamMedicalOverview => {
        const playerSummaries = generateMockPlayerSummaries();
        
        return {
          totalPlayers: playerSummaries.length,
          healthyPlayers: playerSummaries.filter(p => p.medicalStatus === 'healthy').length,
          injuredPlayers: playerSummaries.filter(p => p.medicalStatus === 'injured').length,
          recoveringPlayers: playerSummaries.filter(p => p.medicalStatus === 'recovering').length,
          limitedPlayers: playerSummaries.filter(p => p.medicalStatus === 'limited').length,
          averageInjuryRisk: Math.round(playerSummaries.reduce((sum, p) => sum + p.injuryRiskScore, 0) / playerSummaries.length),
          totalActiveInjuries: playerSummaries.reduce((sum, p) => sum + p.activeInjuries, 0),
          playerSummaries
        };
      }
    }),

    // Injury trend analysis
    getInjuryTrendAnalysis: builder.query<InjuryTrendAnalysis, { 
      teamId?: string; 
      startDate: string; 
      endDate: string; 
    }>({
      query: ({ teamId, startDate, endDate }) => ({
        url: '/medical-analytics/injury-trends',
        method: 'GET',
        params: { teamId, startDate, endDate }
      }),
      providesTags: ['InjuryTrends'],
      transformResponse: (): InjuryTrendAnalysis => ({
        totalInjuries: 42,
        injuryRate: 12.5,
        commonInjuryTypes: [
          { type: 'Muscle Strain', bodyPart: 'Hamstring', count: 8, averageSeverity: 2.3, averageRecoveryDays: 14 },
          { type: 'Joint Sprain', bodyPart: 'Ankle', count: 6, averageSeverity: 2.8, averageRecoveryDays: 21 },
          { type: 'Concussion', bodyPart: 'Head', count: 5, averageSeverity: 3.2, averageRecoveryDays: 10 },
          { type: 'Shoulder Injury', bodyPart: 'Shoulder', count: 4, averageSeverity: 2.5, averageRecoveryDays: 28 }
        ],
        seasonalPatterns: [
          { month: 9, injuryCount: 8, severity: 2.1 },
          { month: 10, injuryCount: 12, severity: 2.4 },
          { month: 11, injuryCount: 10, severity: 2.2 },
          { month: 12, injuryCount: 6, severity: 1.8 },
          { month: 1, injuryCount: 4, severity: 1.9 },
          { month: 2, injuryCount: 2, severity: 1.5 }
        ],
        workloadCorrelations: [
          { loadPattern: 'High intensity spikes', injuryRisk: 85, correlationStrength: 0.73 },
          { loadPattern: 'Insufficient recovery', injuryRisk: 78, correlationStrength: 0.68 },
          { loadPattern: 'Training monotony', injuryRisk: 62, correlationStrength: 0.54 }
        ]
      })
    }),

    // Recovery analytics
    getRecoveryAnalytics: builder.query<RecoveryAnalytics, { 
      teamId?: string; 
      playerId?: string; 
    }>({
      query: ({ teamId, playerId }) => ({
        url: '/medical-analytics/recovery',
        method: 'GET',
        params: { teamId, playerId }
      }),
      providesTags: ['Recovery'],
      transformResponse: (): RecoveryAnalytics => ({
        averageRecoveryTime: 18.5,
        recoverySuccessRate: 87,
        protocolCompliance: 82,
        phaseBreakdown: [
          { phase: 'Acute', averageDays: 5, successRate: 95, commonSetbacks: ['Pain flare-up', 'Swelling'] },
          { phase: 'Subacute', averageDays: 8, successRate: 88, commonSetbacks: ['Range of motion loss'] },
          { phase: 'Recovery', averageDays: 12, successRate: 82, commonSetbacks: ['Psychological barriers'] },
          { phase: 'Return to Play', averageDays: 6, successRate: 90, commonSetbacks: ['Confidence issues'] }
        ],
        performanceReturnRates: {
          speed: 92,
          power: 89,
          endurance: 94,
          agility: 87,
          strength: 91,
          overall: 90
        },
        psychologicalReadiness: 78,
        reinjuryRate: 12
      })
    }),

    // Medical alerts
    getMedicalAlerts: builder.query<MedicalAlert[], { 
      teamId?: string; 
      severity?: string[]; 
    }>({
      query: ({ teamId, severity }) => ({
        url: '/medical-analytics/alerts',
        method: 'GET',
        params: { teamId, severity: severity?.join(',') }
      }),
      providesTags: ['Alerts'],
      transformResponse: (): MedicalAlert[] => generateMockAlerts()
    }),

    // Injury prediction
    getInjuryPrediction: builder.query<InjuryPredictionModel, { playerId: string }>({
      query: ({ playerId }) => ({
        url: `/medical-analytics/prediction/${playerId}`,
        method: 'GET'
      }),
      transformResponse: ({ playerId }): InjuryPredictionModel => ({
        playerId,
        playerName: `Player ${playerId.split('-')[1]}`,
        injuryRiskScore: Math.floor(Math.random() * 40) + 60,
        riskLevel: ['medium', 'high', 'critical'][Math.floor(Math.random() * 3)] as any,
        topRiskFactors: [
          {
            factor: 'High recent injury frequency',
            impact: 75,
            category: 'medical_history',
            confidence: 85
          },
          {
            factor: 'Workload spikes detected',
            impact: 60,
            category: 'workload',
            confidence: 78
          }
        ],
        recommendedInterventions: [
          {
            intervention: 'Immediate medical evaluation and workload reduction',
            priority: 'immediate',
            expectedImpact: 60,
            timeframe: '24-48 hours'
          }
        ],
        predictedInjuryTypes: [
          {
            injuryType: 'Muscle Strain',
            bodyPart: 'Hamstring',
            probability: 35,
            timeWindow: 'next_month'
          }
        ]
      })
    }),

    // Recovery tracking
    getRecoveryTracking: builder.query<RecoveryTracking[], { 
      teamId?: string; 
      playerId?: string; 
    }>({
      query: ({ teamId, playerId }) => ({
        url: '/medical-analytics/recovery-tracking',
        method: 'GET',
        params: { teamId, playerId }
      }),
      providesTags: ['Recovery'],
      transformResponse: (): RecoveryTracking[] => generateMockRecoveryTracking()
    }),

    // Return-to-play protocols
    getReturnToPlayProtocols: builder.query<ReturnToPlayProtocol[], { 
      teamId?: string; 
      playerId?: string; 
    }>({
      query: ({ teamId, playerId }) => ({
        url: '/medical-analytics/return-to-play',
        method: 'GET',
        params: { teamId, playerId }
      }),
      providesTags: ['Protocols'],
      transformResponse: (): ReturnToPlayProtocol[] => generateMockProtocols()
    }),

    // Generate medical report
    generateMedicalReport: builder.mutation<MedicalReport, {
      reportType: string;
      parameters: {
        timeframe: { startDate: string; endDate: string };
        teamId?: string;
        playerId?: string;
      };
    }>({
      query: ({ reportType, parameters }) => ({
        url: '/medical-analytics/reports/generate',
        method: 'POST',
        body: { reportType, parameters }
      }),
      invalidatesTags: ['Reports'],
      transformResponse: ({ reportType, parameters }): MedicalReport => ({
        reportId: `report-${Date.now()}`,
        title: `${reportType.replace('_', ' ').toUpperCase()} Report`,
        reportType,
        generatedAt: new Date().toISOString(),
        parameters,
        sections: [
          {
            sectionId: 'overview',
            title: 'Executive Summary',
            type: 'overview',
            keyMetrics: [
              { metric: 'Total Injuries', value: 42, trend: 'down' },
              { metric: 'Recovery Rate', value: '87%', trend: 'up' },
              { metric: 'Average Risk Score', value: 35, trend: 'stable' }
            ]
          }
        ],
        downloadUrl: `/reports/download/report-${Date.now()}.pdf`
      })
    }),

    // Resolve medical alert
    resolveMedicalAlert: builder.mutation<void, { alertId: string; resolution: string }>({
      query: ({ alertId, resolution }) => ({
        url: `/medical-analytics/alerts/${alertId}/resolve`,
        method: 'POST',
        body: { resolution }
      }),
      invalidatesTags: ['Alerts']
    }),

    // Update recovery tracking
    updateRecoveryTracking: builder.mutation<void, {
      trackingId: string;
      data: Partial<RecoveryTracking>;
    }>({
      query: ({ trackingId, data }) => ({
        url: `/medical-analytics/recovery-tracking/${trackingId}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Recovery']
    })
  })
});

export const {
  useGetTeamMedicalOverviewQuery,
  useGetInjuryTrendAnalysisQuery,
  useGetRecoveryAnalyticsQuery,
  useGetMedicalAlertsQuery,
  useGetInjuryPredictionQuery,
  useGetRecoveryTrackingQuery,
  useGetReturnToPlayProtocolsQuery,
  useGenerateMedicalReportMutation,
  useResolveMedicalAlertMutation,
  useUpdateRecoveryTrackingMutation
} = medicalAnalyticsApi;