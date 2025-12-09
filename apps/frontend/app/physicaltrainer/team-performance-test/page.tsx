'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Import both versions
import { TeamPerformanceView } from '@/features/physical-trainer/components/analytics/TeamPerformanceView';
import { TeamPerformanceViewOptimized } from '@/features/physical-trainer/components/analytics/TeamPerformanceViewOptimized';

import { FeatureFlagDashboard } from '@/features/physical-trainer/components/shared/FeatureFlagDashboard';
import { useFeatureFlag } from '@/features/physical-trainer/utils/featureFlags';

// Mock data
import { TeamPerformanceData } from '@/features/physical-trainer/types/performance-analytics.types';

const mockTeams: TeamPerformanceData[] = [
  {
    teamId: 'team-1',
    teamName: 'Senior Team',
    playerCount: 25,
    metrics: {
      averageAttendance: 0.92,
      averageCompletionRate: 0.88,
      averageWellness: 7.8,
      teamReadiness: 85,
      totalWorkouts: 156,
      activeInjuries: 2
    },
    workoutDistribution: {
      strength: 35,
      conditioning: 30,
      hybrid: 25,
      agility: 10
    },
    performanceTrends: {
      strength: [
        { date: '2025-01-01', average: 78, median: 78, standardDeviation: 5, participantCount: 25 },
        { date: '2025-01-08', average: 80, median: 80, standardDeviation: 5, participantCount: 25 },
        { date: '2025-01-15', average: 82, median: 82, standardDeviation: 5, participantCount: 25 },
        { date: '2025-01-22', average: 81, median: 81, standardDeviation: 5, participantCount: 25 }
      ],
      conditioning: [
        { date: '2025-01-01', average: 75, median: 75, standardDeviation: 6, participantCount: 25 },
        { date: '2025-01-08', average: 77, median: 77, standardDeviation: 6, participantCount: 25 },
        { date: '2025-01-15', average: 79, median: 79, standardDeviation: 6, participantCount: 25 },
        { date: '2025-01-22', average: 80, median: 80, standardDeviation: 6, participantCount: 25 }
      ],
      agility: [
        { date: '2025-01-01', average: 82, median: 82, standardDeviation: 4, participantCount: 25 },
        { date: '2025-01-08', average: 84, median: 84, standardDeviation: 4, participantCount: 25 },
        { date: '2025-01-15', average: 85, median: 85, standardDeviation: 4, participantCount: 25 },
        { date: '2025-01-22', average: 86, median: 86, standardDeviation: 4, participantCount: 25 }
      ],
      attendance: [
        { date: '2025-01-01', average: 90, median: 90, standardDeviation: 3, participantCount: 25 },
        { date: '2025-01-08', average: 92, median: 92, standardDeviation: 3, participantCount: 25 },
        { date: '2025-01-15', average: 91, median: 91, standardDeviation: 3, participantCount: 25 },
        { date: '2025-01-22', average: 93, median: 93, standardDeviation: 3, participantCount: 25 }
      ]
    },
    comparisonData: { vsLastMonth: [], vsTarget: [] }
  },
  {
    teamId: 'team-2',
    teamName: 'Junior Team',
    playerCount: 22,
    metrics: {
      averageAttendance: 0.85,
      averageCompletionRate: 0.82,
      averageWellness: 7.5,
      teamReadiness: 78,
      totalWorkouts: 142,
      activeInjuries: 3
    },
    workoutDistribution: {
      strength: 30,
      conditioning: 35,
      hybrid: 20,
      agility: 15
    },
    performanceTrends: {
      strength: [
        { date: '2025-01-01', average: 72, median: 72, standardDeviation: 5, participantCount: 22 },
        { date: '2025-01-08', average: 74, median: 74, standardDeviation: 5, participantCount: 22 },
        { date: '2025-01-15', average: 76, median: 76, standardDeviation: 5, participantCount: 22 },
        { date: '2025-01-22', average: 75, median: 75, standardDeviation: 5, participantCount: 22 }
      ],
      conditioning: [
        { date: '2025-01-01', average: 70, median: 70, standardDeviation: 6, participantCount: 22 },
        { date: '2025-01-08', average: 72, median: 72, standardDeviation: 6, participantCount: 22 },
        { date: '2025-01-15', average: 74, median: 74, standardDeviation: 6, participantCount: 22 },
        { date: '2025-01-22', average: 75, median: 75, standardDeviation: 6, participantCount: 22 }
      ],
      agility: [
        { date: '2025-01-01', average: 78, median: 78, standardDeviation: 4, participantCount: 22 },
        { date: '2025-01-08', average: 80, median: 80, standardDeviation: 4, participantCount: 22 },
        { date: '2025-01-15', average: 81, median: 81, standardDeviation: 4, participantCount: 22 },
        { date: '2025-01-22', average: 82, median: 82, standardDeviation: 4, participantCount: 22 }
      ],
      attendance: [
        { date: '2025-01-01', average: 83, median: 83, standardDeviation: 3, participantCount: 22 },
        { date: '2025-01-08', average: 85, median: 85, standardDeviation: 3, participantCount: 22 },
        { date: '2025-01-15', average: 84, median: 84, standardDeviation: 3, participantCount: 22 },
        { date: '2025-01-22', average: 86, median: 86, standardDeviation: 3, participantCount: 22 }
      ]
    },
    comparisonData: { vsLastMonth: [], vsTarget: [] }
  },
  {
    teamId: 'team-3',
    teamName: 'U18 Team',
    playerCount: 28,
    metrics: {
      averageAttendance: 0.88,
      averageCompletionRate: 0.90,
      averageWellness: 8.1,
      teamReadiness: 88,
      totalWorkouts: 168,
      activeInjuries: 1
    },
    workoutDistribution: {
      strength: 25,
      conditioning: 25,
      hybrid: 30,
      agility: 20
    },
    performanceTrends: {
      strength: [
        { date: '2025-01-01', average: 76, median: 76, standardDeviation: 5, participantCount: 28 },
        { date: '2025-01-08', average: 78, median: 78, standardDeviation: 5, participantCount: 28 },
        { date: '2025-01-15', average: 80, median: 80, standardDeviation: 5, participantCount: 28 },
        { date: '2025-01-22', average: 82, median: 82, standardDeviation: 5, participantCount: 28 }
      ],
      conditioning: [
        { date: '2025-01-01', average: 78, median: 78, standardDeviation: 6, participantCount: 28 },
        { date: '2025-01-08', average: 80, median: 80, standardDeviation: 6, participantCount: 28 },
        { date: '2025-01-15', average: 82, median: 82, standardDeviation: 6, participantCount: 28 },
        { date: '2025-01-22', average: 83, median: 83, standardDeviation: 6, participantCount: 28 }
      ],
      agility: [
        { date: '2025-01-01', average: 85, median: 85, standardDeviation: 4, participantCount: 28 },
        { date: '2025-01-08', average: 87, median: 87, standardDeviation: 4, participantCount: 28 },
        { date: '2025-01-15', average: 88, median: 88, standardDeviation: 4, participantCount: 28 },
        { date: '2025-01-22', average: 90, median: 90, standardDeviation: 4, participantCount: 28 }
      ],
      attendance: [
        { date: '2025-01-01', average: 86, median: 86, standardDeviation: 3, participantCount: 28 },
        { date: '2025-01-08', average: 88, median: 88, standardDeviation: 3, participantCount: 28 },
        { date: '2025-01-15', average: 87, median: 87, standardDeviation: 3, participantCount: 28 },
        { date: '2025-01-22', average: 89, median: 89, standardDeviation: 3, participantCount: 28 }
      ]
    },
    comparisonData: { vsLastMonth: [], vsTarget: [] }
  }
];

export default function TeamPerformanceTestPage() {
  const [showFeatureFlags, setShowFeatureFlags] = useState(false);
  const [showOptimized, setShowOptimized] = useState(false);
  const useLightweightCharts = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Performance View Test</h1>
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
            <TeamPerformanceViewOptimized
              teams={mockTeams}
              isLoading={false}
              error={null}
              detailed={true}
              selectedTeamIds={['team-1']}
              onTeamSelect={(teamId) => console.log('Team selected:', teamId)}
              onPlayerSelect={(playerId) => console.log('Player selected:', playerId)}
            />
          ) : (
            <TeamPerformanceView
              teams={mockTeams}
              isLoading={false}
              error={null}
              detailed={true}
              selectedTeamIds={['team-1']}
              onTeamSelect={(teamId) => console.log('Team selected:', teamId)}
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