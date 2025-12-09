import { createApi } from '@reduxjs/toolkit/query/react';
import { mockBaseQuery } from './mockBaseQuery';

// Types for predictive analytics
export interface PredictiveInsight {
  id: string;
  playerId: string;
  type: 'fatigue' | 'injury_risk' | 'performance' | 'readiness';
  riskScore: number;
  confidence: number;
  predictions: any;
  recommendations: string[];
  riskFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  validUntil: Date;
  metadata: any;
}

export interface TeamRiskProfile {
  playerId: string;
  playerName: string;
  position: string;
  overallRiskScore: number;
  fatigueRisk: number;
  injuryRisk: number;
  performanceRisk: number;
  topRiskFactors: string[];
  urgentRecommendations: string[];
  nextAssessmentDate: Date;
}

export interface FatigueMonitoringData {
  currentFatigueLevel: number;
  fatigueVelocity: number;
  projectedPeakFatigue: Date;
  recoveryRecommendations: string[];
  warningThresholds: {
    yellow: number;
    red: number;
  };
}

export interface RecoveryOptimization {
  estimatedRecoveryTime: number;
  optimizedRecoveryPlan: Array<{
    phase: string;
    duration: number;
    activities: string[];
    intensity: 'low' | 'moderate' | 'high';
  }>;
  factors: {
    accelerating: string[];
    hindering: string[];
  };
  monitoringPoints: Array<{
    timestamp: Date;
    metrics: string[];
    expectedValues: Record<string, number>;
  }>;
}

export interface PlateauDetection {
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
}

export interface LoadManagementOptimization {
  teamOptimization: {
    currentLoadDistribution: Record<string, number>;
    recommendedAdjustments: Array<{
      playerId: string;
      currentLoad: number;
      recommendedLoad: number;
      adjustment: number;
      reasoning: string;
    }>;
    projectedOutcomes: {
      injuryRiskReduction: number;
      performanceImprovement: number;
      fatigueOptimization: number;
    };
  };
  individualRecommendations: Array<{
    playerId: string;
    recommendations: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface PredictiveDashboardData {
  overview: {
    totalPlayersMonitored: number;
    highRiskPlayers: number;
    averageRiskScore: number;
    trendsImproving: number;
    trendsStable: number;
    trendsDecreasing: number;
  };
  riskDistribution: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  topRiskFactors: Array<{
    factor: string;
    count: number;
  }>;
  recommendationCategories: {
    immediate: number;
    shortTerm: number;
    longTerm: number;
  };
  modelAccuracy: {
    fatigue: number;
    injury: number;
    performance: number;
    recovery: number;
  };
}

export const predictiveAnalyticsApi = createApi({
  reducerPath: 'predictiveAnalyticsApi',
  baseQuery: mockBaseQuery,
  tagTypes: [
    'PredictiveInsights',
    'TeamRiskProfile', 
    'FatigueMonitoring',
    'RecoveryOptimization',
    'PlateauDetection',
    'LoadManagement',
    'PredictiveDashboard'
  ],
  endpoints: (builder) => ({
    // Get predictive insights for a player
    getPredictiveInsights: builder.query<
      { success: boolean; data: PredictiveInsight[]; generated_at: string },
      { playerId: string; organizationId: string; types?: string[] }
    >({
      query: ({ playerId, organizationId, types }) => ({
        url: `/statistics-service/api/predictive/insights/${playerId}`,
        method: 'GET',
        params: { 
          organizationId, 
          types: types?.join(',') 
        }
      }),
      providesTags: (result, error, { playerId }) => [
        { type: 'PredictiveInsights', id: playerId }
      ],
      transformResponse: (response: any) => {
        // Mock transformation - in production this would be real API data
        const mockInsights: PredictiveInsight[] = [
          {
            id: 'insight_001',
            playerId: response.playerId || 'player1',
            type: 'fatigue',
            riskScore: 68,
            confidence: 87,
            predictions: {
              nextWeek: 72,
              twoWeeks: 65,
              trend: 'increasing'
            },
            recommendations: [
              'Reduce training intensity by 30%',
              'Focus on recovery protocols',
              'Monitor sleep quality closely'
            ],
            riskFactors: [
              {
                factor: 'High Training Load',
                impact: 25,
                description: 'Training load 20% above seasonal average'
              },
              {
                factor: 'Poor Sleep Quality',
                impact: 18,
                description: 'Sleep efficiency below 85% for 3 consecutive days'
              }
            ],
            validUntil: new Date(Date.now() + 8 * 60 * 60 * 1000),
            metadata: { modelVersion: '1.2.0', dataPoints: 847 }
          },
          {
            id: 'insight_002',
            playerId: response.playerId || 'player1',
            type: 'injury_risk',
            riskScore: 42,
            confidence: 82,
            predictions: {
              riskAreas: ['groin', 'knee', 'shoulder'],
              timeframe: '4_weeks'
            },
            recommendations: [
              'Implement targeted prevention exercises',
              'Address biomechanical asymmetries',
              'Monitor workload progression'
            ],
            riskFactors: [
              {
                factor: 'Recent Injury History',
                impact: 20,
                description: '1 injury in last 6 months'
              }
            ],
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
            metadata: { modelVersion: '2.1.0', accuracy: 0.82 }
          }
        ];

        return {
          success: true,
          data: mockInsights,
          generated_at: new Date().toISOString()
        };
      }
    }),

    // Get team risk profile
    getTeamRiskProfile: builder.query<
      { success: boolean; data: TeamRiskProfile[]; generated_at: string },
      { teamId: string; organizationId: string }
    >({
      query: ({ teamId, organizationId }) => ({
        url: `/statistics-service/api/predictive/team/${teamId}/risk-profile`,
        method: 'GET',
        params: { organizationId }
      }),
      providesTags: (result, error, { teamId }) => [
        { type: 'TeamRiskProfile', id: teamId }
      ],
      transformResponse: () => {
        const mockTeamRiskProfile: TeamRiskProfile[] = [
          {
            playerId: 'player1',
            playerName: 'Sidney Crosby',
            position: 'C',
            overallRiskScore: 75,
            fatigueRisk: 68,
            injuryRisk: 42,
            performanceRisk: 25,
            topRiskFactors: ['High training load', 'Poor sleep quality', 'Recent injury'],
            urgentRecommendations: ['Reduce intensity', 'Monitor fatigue', 'Recovery focus'],
            nextAssessmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
          },
          {
            playerId: 'player2',
            playerName: 'Connor McDavid',
            position: 'C',
            overallRiskScore: 32,
            fatigueRisk: 35,
            injuryRisk: 28,
            performanceRisk: 15,
            topRiskFactors: ['High velocity training'],
            urgentRecommendations: ['Continue current approach'],
            nextAssessmentDate: new Date(Date.now() + 48 * 60 * 60 * 1000)
          }
        ];

        return {
          success: true,
          data: mockTeamRiskProfile,
          generated_at: new Date().toISOString()
        };
      }
    }),

    // Get fatigue monitoring data
    getFatigueMonitoring: builder.query<
      { success: boolean; data: FatigueMonitoringData; generated_at: string },
      { playerId: string; organizationId: string }
    >({
      query: ({ playerId, organizationId }) => ({
        url: `/statistics-service/api/predictive/fatigue/${playerId}/monitoring`,
        method: 'GET',
        params: { organizationId }
      }),
      providesTags: (result, error, { playerId }) => [
        { type: 'FatigueMonitoring', id: playerId }
      ],
      transformResponse: () => {
        const mockFatigueData: FatigueMonitoringData = {
          currentFatigueLevel: 68,
          fatigueVelocity: 3.2,
          projectedPeakFatigue: new Date(Date.now() + 36 * 60 * 60 * 1000),
          recoveryRecommendations: [
            'Active recovery sessions only',
            'Reduce training intensity by 50%',
            'Increase nutrition focus',
            'Monitor fatigue progression closely'
          ],
          warningThresholds: {
            yellow: 65,
            red: 80
          }
        };

        return {
          success: true,
          data: mockFatigueData,
          generated_at: new Date().toISOString()
        };
      }
    }),

    // Get recovery optimization
    getRecoveryOptimization: builder.query<
      { success: boolean; data: RecoveryOptimization; generated_at: string },
      { playerId: string; targetDate?: string }
    >({
      query: ({ playerId, targetDate }) => ({
        url: `/statistics-service/api/predictive/recovery/${playerId}/optimization`,
        method: 'GET',
        params: { targetDate }
      }),
      providesTags: (result, error, { playerId }) => [
        { type: 'RecoveryOptimization', id: playerId }
      ],
      transformResponse: () => {
        const mockRecoveryData: RecoveryOptimization = {
          estimatedRecoveryTime: 18,
          optimizedRecoveryPlan: [
            {
              phase: 'Immediate Recovery',
              duration: 6,
              activities: ['Complete rest', 'Hydration', 'Light nutrition'],
              intensity: 'low'
            },
            {
              phase: 'Active Recovery',
              duration: 8,
              activities: ['Light movement', 'Stretching', 'Mobility work'],
              intensity: 'low'
            },
            {
              phase: 'Preparation Phase',
              duration: 4,
              activities: ['Dynamic warm-up', 'Movement prep', 'Activation'],
              intensity: 'moderate'
            }
          ],
          factors: {
            accelerating: ['Good sleep quality', 'Proper nutrition', 'Stress management'],
            hindering: ['High ambient stress', 'Poor hydration', 'Training residual fatigue']
          },
          monitoringPoints: [
            {
              timestamp: new Date(Date.now() + 6 * 60 * 60 * 1000),
              metrics: ['HRV', 'RPE', 'Sleep quality'],
              expectedValues: { HRV: 45, RPE: 3, SleepQuality: 85 }
            }
          ]
        };

        return {
          success: true,
          data: mockRecoveryData,
          generated_at: new Date().toISOString()
        };
      }
    }),

    // Get plateau detection
    getPlateauDetection: builder.query<
      { success: boolean; data: PlateauDetection; generated_at: string },
      { playerId: string }
    >({
      query: ({ playerId }) => ({
        url: `/statistics-service/api/predictive/plateau/${playerId}/detection`,
        method: 'GET'
      }),
      providesTags: (result, error, { playerId }) => [
        { type: 'PlateauDetection', id: playerId }
      ],
      transformResponse: () => {
        const mockPlateauData: PlateauDetection = {
          plateauDetected: true,
          plateauDuration: 18,
          plateauMetrics: ['Power output', 'VO2 max', 'Speed'],
          breakoutProbability: 73,
          recommendations: [
            {
              strategy: 'Periodization Reset',
              expectedImpact: 85,
              timeToEffect: 14,
              difficulty: 'medium'
            },
            {
              strategy: 'Movement Variability',
              expectedImpact: 72,
              timeToEffect: 7,
              difficulty: 'low'
            }
          ]
        };

        return {
          success: true,
          data: mockPlateauData,
          generated_at: new Date().toISOString()
        };
      }
    }),

    // Get load management optimization
    getLoadManagementOptimization: builder.query<
      { success: boolean; data: LoadManagementOptimization; generated_at: string },
      { teamId: string; timeframeWeeks?: number }
    >({
      query: ({ teamId, timeframeWeeks = 4 }) => ({
        url: `/statistics-service/api/predictive/load-management/${teamId}/optimization`,
        method: 'GET',
        params: { weeks: timeframeWeeks }
      }),
      providesTags: (result, error, { teamId }) => [
        { type: 'LoadManagement', id: teamId }
      ],
      transformResponse: () => {
        const mockLoadData: LoadManagementOptimization = {
          teamOptimization: {
            currentLoadDistribution: {
              'player1': 850,
              'player2': 720,
              'player3': 680,
              'player4': 740
            },
            recommendedAdjustments: [
              {
                playerId: 'player1',
                currentLoad: 850,
                recommendedLoad: 680,
                adjustment: -20,
                reasoning: 'High fatigue and injury risk detected'
              },
              {
                playerId: 'player2',
                currentLoad: 720,
                recommendedLoad: 790,
                adjustment: 10,
                reasoning: 'Strong recovery indicators, can handle increased load'
              }
            ],
            projectedOutcomes: {
              injuryRiskReduction: 22,
              performanceImprovement: 8.5,
              fatigueOptimization: 15
            }
          },
          individualRecommendations: [
            {
              playerId: 'player1',
              recommendations: ['Reduce high-intensity work', 'Focus on recovery'],
              priority: 'high'
            }
          ]
        };

        return {
          success: true,
          data: mockLoadData,
          generated_at: new Date().toISOString()
        };
      }
    }),

    // Get predictive dashboard data
    getPredictiveDashboard: builder.query<
      { success: boolean; data: PredictiveDashboardData; generated_at: string },
      { organizationId: string; teamId?: string; limit?: number }
    >({
      query: ({ organizationId, teamId, limit }) => ({
        url: `/statistics-service/api/predictive/dashboard/${organizationId}`,
        method: 'GET',
        params: { teamId, limit }
      }),
      providesTags: (result, error, { organizationId, teamId }) => [
        { type: 'PredictiveDashboard', id: `${organizationId}-${teamId || 'all'}` }
      ],
      transformResponse: () => {
        const mockDashboardData: PredictiveDashboardData = {
          overview: {
            totalPlayersMonitored: 25,
            highRiskPlayers: 4,
            averageRiskScore: 32,
            trendsImproving: 8,
            trendsStable: 12,
            trendsDecreasing: 5
          },
          riskDistribution: {
            low: 15,
            moderate: 6,
            high: 3,
            critical: 1
          },
          topRiskFactors: [
            { factor: 'High Training Load', count: 8 },
            { factor: 'Poor Sleep Quality', count: 6 },
            { factor: 'Recent Injury History', count: 4 },
            { factor: 'Biomechanical Asymmetries', count: 3 }
          ],
          recommendationCategories: {
            immediate: 3,
            shortTerm: 8,
            longTerm: 12
          },
          modelAccuracy: {
            fatigue: 87,
            injury: 82,
            performance: 79,
            recovery: 84
          }
        };

        return {
          success: true,
          data: mockDashboardData,
          generated_at: new Date().toISOString()
        };
      }
    })
  })
});

export const {
  useGetPredictiveInsightsQuery,
  useGetTeamRiskProfileQuery,
  useGetFatigueMonitoringQuery,
  useGetRecoveryOptimizationQuery,
  useGetPlateauDetectionQuery,
  useGetLoadManagementOptimizationQuery,
  useGetPredictiveDashboardQuery
} = predictiveAnalyticsApi;