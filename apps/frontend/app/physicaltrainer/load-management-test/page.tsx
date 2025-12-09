'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Import both versions
import { LoadManagementPanel } from '@/features/physical-trainer/components/analytics/LoadManagementPanel';
import { LoadManagementPanelOptimized } from '@/features/physical-trainer/components/analytics/LoadManagementPanelOptimized';

import { FeatureFlagDashboard } from '@/features/physical-trainer/components/shared/FeatureFlagDashboard';
import { useFeatureFlag } from '@/features/physical-trainer/utils/featureFlags';

// Mock data
import { 
  PlayerPerformanceData, 
  LoadManagementData 
} from '@/features/physical-trainer/types/performance-analytics.types';

// Generate mock load history
const generateLoadHistory = (playerId: string, baseLoad: number = 1000): any[] => {
  const history = [];
  const today = new Date();
  
  for (let i = 28; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const variation = Math.random() * 200 - 100;
    const acuteLoad = baseLoad + variation + (Math.random() * 50);
    const chronicLoad = baseLoad + (Math.random() * 30);
    const ratio = acuteLoad / chronicLoad;
    
    history.push({
      date: date.toISOString(),
      acuteLoad,
      chronicLoad,
      ratio,
      wellness: 6 + Math.random() * 4,
      performance: 6 + Math.random() * 4,
      dailyLoad: acuteLoad
    });
  }
  
  return history;
};

const mockPlayers: PlayerPerformanceData[] = [
  {
    playerId: 'player-1',
    playerName: 'Connor McDavid',
    position: 'Center',
    metrics: {
      strengthIndex: 80,
      powerOutput: 900,
      oneRepMaxEstimate: 140,
      vo2Max: 55,
      lactateThreshold: 4,
      heartRateRecovery: 25,
      reactionTime: 0.25,
      changOfDirectionSpeed: 7.5,
      footSpeed: 8.2,
      rpeAverage: 6.5,
      sleepQuality: 7.8,
      wellnessScore: 7.2,
      sessionAttendance: 95,
      completionRate: 90,
      punctuality: 98,
      weeklyLoad: 1200,
      acuteLoad: 1250,
      chronicLoad: 980,
      acuteChronicRatio: 1.28,
    },
    workoutHistory: [],
    injuryRisk: { overall: 'low', factors: [], recommendations: [] },
    progressTrends: { strength: [], conditioning: [], agility: [], recovery: [] }
  },
  {
    playerId: 'player-2',
    playerName: 'Nathan MacKinnon',
    position: 'Center',
    metrics: {
      strengthIndex: 85,
      powerOutput: 950,
      oneRepMaxEstimate: 150,
      vo2Max: 58,
      lactateThreshold: 4.2,
      heartRateRecovery: 27,
      reactionTime: 0.23,
      changOfDirectionSpeed: 7.8,
      footSpeed: 8.6,
      rpeAverage: 6.8,
      sleepQuality: 8.0,
      wellnessScore: 7.6,
      sessionAttendance: 97,
      completionRate: 92,
      punctuality: 99,
      weeklyLoad: 1300,
      acuteLoad: 1450,
      chronicLoad: 950,
      acuteChronicRatio: 1.53,
    },
    workoutHistory: [],
    injuryRisk: { overall: 'moderate', factors: ['load'], recommendations: [] },
    progressTrends: { strength: [], conditioning: [], agility: [], recovery: [] }
  },
  {
    playerId: 'player-3',
    playerName: 'Auston Matthews',
    position: 'Center',
    metrics: {
      strengthIndex: 78,
      powerOutput: 880,
      oneRepMaxEstimate: 135,
      vo2Max: 52,
      lactateThreshold: 3.8,
      heartRateRecovery: 24,
      reactionTime: 0.26,
      changOfDirectionSpeed: 7.3,
      footSpeed: 8.0,
      rpeAverage: 6.2,
      sleepQuality: 7.5,
      wellnessScore: 7.0,
      sessionAttendance: 93,
      completionRate: 88,
      punctuality: 97,
      weeklyLoad: 1100,
      acuteLoad: 850,
      chronicLoad: 920,
      acuteChronicRatio: 0.92,
    },
    workoutHistory: [],
    injuryRisk: { overall: 'low', factors: [], recommendations: [] },
    progressTrends: { strength: [], conditioning: [], agility: [], recovery: [] }
  }
];

const mockLoadData: LoadManagementData[] = [
  {
    playerId: 'player-1',
    currentLoad: {
      acute: 1250,
      chronic: 980,
      ratio: 1.28,
      recommendation: {
        action: 'maintain',
        percentage: 0,
        duration: '7d' as any,
        reasoning: 'Load ratio approaching high threshold - monitor closely'
      }
    },
    loadHistory: generateLoadHistory('player-1', 1000),
    riskFactors: [
      { type: 'load', description: 'Acute load increased 25% in last week', severity: 'moderate', recommendation: 'monitor' as any }
    ],
    adaptationStatus: 'positive'
  },
  {
    playerId: 'player-2',
    currentLoad: {
      acute: 1450,
      chronic: 950,
      ratio: 1.53,
      recommendation: {
        action: 'decrease',
        percentage: 20,
        duration: '7d' as any,
        reasoning: 'High injury risk - immediate load reduction required'
      }
    },
    loadHistory: generateLoadHistory('player-2', 1100),
    riskFactors: [
      { type: 'load', description: 'Acute:Chronic ratio exceeds 1.5', severity: 'high', recommendation: 'reduce' as any },
      { type: 'fatigue', description: 'Wellness scores declining', severity: 'moderate', recommendation: 'rest' as any }
    ],
    adaptationStatus: 'overreaching'
  },
  {
    playerId: 'player-3',
    currentLoad: {
      acute: 850,
      chronic: 920,
      ratio: 0.92,
      recommendation: {
        action: 'maintain',
        percentage: 0,
        duration: '7d' as any,
        reasoning: 'Optimal load balance - continue current program'
      }
    },
    loadHistory: generateLoadHistory('player-3', 900),
    riskFactors: [],
    adaptationStatus: 'positive'
  }
];

export default function LoadManagementTestPage() {
  const [showFeatureFlags, setShowFeatureFlags] = useState(false);
  const [showOptimized, setShowOptimized] = useState(false);
  const useLightweightCharts = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  const filters = {
    dateRange: { from: new Date('2025-01-01'), to: new Date() },
    players: [] as string[],
    teams: [] as string[],
    workoutTypes: [] as any[],
    metrics: [],
    groupBy: 'player' as const,
    aggregation: 'average' as const,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Load Management Panel Test</h1>
          <p className="text-gray-600 mt-2">
            Compare original vs. optimized chart implementations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={useLightweightCharts ? 'success' : 'secondary'}>
            {useLightweightCharts ? 'Lightweight Charts' : 'Recharts'}
          </Badge>
          <Button onClick={() => setShowOptimized(!showOptimized)}>
            {showOptimized ? 'Show Original' : 'Show Optimized'}
          </Button>
          <Button variant="outline" onClick={() => setShowFeatureFlags(!showFeatureFlags)}>
            Feature Flags
          </Button>
        </div>
      </div>

      {/* Component Display */}
      <Card>
        <CardHeader>
          <CardTitle>
            {showOptimized ? 'Optimized Version (SimpleChartAdapter)' : 'Original Version (Recharts)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showOptimized ? (
            <LoadManagementPanelOptimized
              players={mockPlayers}
              loadData={mockLoadData}
              filters={filters}
              isLoading={false}
              error={null}
              onPlayerSelect={(playerId) => console.log('Player selected:', playerId)}
            />
          ) : (
            <LoadManagementPanel
              players={mockPlayers}
              loadData={mockLoadData}
              filters={filters}
              isLoading={false}
              error={null}
              onPlayerSelect={(playerId) => console.log('Player selected:', playerId)}
            />
          )}
        </CardContent>
      </Card>

      {/* Feature Flag Dashboard */}
      {showFeatureFlags && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Feature Flag Dashboard</h2>
              <Button variant="ghost" onClick={() => setShowFeatureFlags(false)}>
                Close
              </Button>
            </div>
            <div className="p-4">
              <FeatureFlagDashboard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}