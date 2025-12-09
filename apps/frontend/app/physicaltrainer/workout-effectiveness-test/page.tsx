'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import both versions
import { WorkoutEffectivenessMetrics } from '@/features/physical-trainer/components/analytics/WorkoutEffectivenessMetrics';
import { WorkoutEffectivenessMetricsOptimized } from '@/features/physical-trainer/components/analytics/WorkoutEffectivenessMetricsOptimized';

import { FeatureFlagDashboard } from '@/features/physical-trainer/components/shared/FeatureFlagDashboard';
import { useFeatureFlag } from '@/features/physical-trainer/utils/featureFlags';

// Mock data
import { WorkoutEffectivenessData } from '@/features/physical-trainer/types/performance-analytics.types';

const mockData: WorkoutEffectivenessData[] = [
  {
    workoutType: 'strength',
    effectiveness: {
      overall: 8.2,
      strength: 9.1,
      conditioning: 7.5,
      engagement: 8.3,
      safety: 8.5,
      progression: 7.6
    },
    improvementRate: 15.3,
    retentionRate: 82,
    totalSessions: 45,
    averageCompletion: 88,
    averageRPE: 7.2,
    averageIntensity: 78,
    topExercises: [
      {
        exerciseId: '1',
        exerciseName: 'Barbell Squat',
        frequency: 32,
        averageImprovement: 18.5,
        playerFeedback: 4.3,
        progressionRate: 85,
        injuryRate: 0.02
      },
      {
        exerciseId: '2',
        exerciseName: 'Bench Press',
        frequency: 28,
        averageImprovement: 16.2,
        playerFeedback: 4.5,
        progressionRate: 80,
        injuryRate: 0.03
      }
    ],
    recommendedAdjustments: [
      'Consider increasing load progression for advanced players',
      'Add more variety in accessory movements',
      'Monitor form closely on high-intensity days'
    ]
  },
  {
    workoutType: 'conditioning',
    effectiveness: {
      overall: 7.8,
      strength: 6.2,
      conditioning: 9.2,
      engagement: 7.5,
      safety: 8.1,
      progression: 8.0
    },
    improvementRate: 12.8,
    retentionRate: 75,
    totalSessions: 38,
    averageCompletion: 82,
    averageRPE: 8.5,
    averageIntensity: 85,
    topExercises: [
      {
        exerciseId: '3',
        exerciseName: 'Interval Sprints',
        frequency: 25,
        averageImprovement: 22.3,
        playerFeedback: 3.8,
        progressionRate: 78,
        injuryRate: 0.04
      },
      {
        exerciseId: '4',
        exerciseName: 'Rowing Intervals',
        frequency: 30,
        averageImprovement: 19.5,
        playerFeedback: 4.2,
        progressionRate: 82,
        injuryRate: 0.01
      }
    ],
    recommendedAdjustments: [
      'Reduce intensity for players showing fatigue signs',
      'Add more recovery time between high-intensity intervals',
      'Consider heart rate zone training for better personalization'
    ]
  },
  {
    workoutType: 'hybrid',
    effectiveness: {
      overall: 8.5,
      strength: 7.8,
      conditioning: 8.1,
      engagement: 9.0,
      safety: 8.3,
      progression: 8.3
    },
    improvementRate: 18.2,
    retentionRate: 88,
    totalSessions: 52,
    averageCompletion: 91,
    averageRPE: 7.8,
    averageIntensity: 82,
    topExercises: [
      {
        exerciseId: '5',
        exerciseName: 'Circuit Training',
        frequency: 40,
        averageImprovement: 20.5,
        playerFeedback: 4.6,
        progressionRate: 88,
        injuryRate: 0.02
      }
    ],
    recommendedAdjustments: [
      'Excellent engagement levels - maintain current variety',
      'Consider adding more sport-specific movements',
      'Great balance between strength and conditioning'
    ]
  },
  {
    workoutType: 'agility',
    effectiveness: {
      overall: 8.0,
      strength: 6.5,
      conditioning: 7.2,
      engagement: 8.8,
      safety: 8.5,
      progression: 9.0
    },
    improvementRate: 20.5,
    retentionRate: 85,
    totalSessions: 35,
    averageCompletion: 94,
    averageRPE: 6.5,
    averageIntensity: 72,
    topExercises: [
      {
        exerciseId: '6',
        exerciseName: 'Ladder Drills',
        frequency: 35,
        averageImprovement: 24.2,
        playerFeedback: 4.7,
        progressionRate: 92,
        injuryRate: 0.01
      }
    ],
    recommendedAdjustments: [
      'Increase complexity for advanced players',
      'Add reaction-based drills',
      'Incorporate more game-like scenarios'
    ]
  }
];

export default function WorkoutEffectivenessTestPage() {
  const [showFeatureFlags, setShowFeatureFlags] = useState(false);
  const [showOptimized, setShowOptimized] = useState(false);
  const useLightweightCharts = useFeatureFlag('LIGHTWEIGHT_CHARTS');

  const filters = {
    dateRange: { from: new Date('2025-01-01'), to: new Date() },
    players: [] as string[],
    teams: [] as string[],
    workoutTypes: [] as any[],
    metrics: [],
    groupBy: 'team' as const,
    aggregation: 'average' as const,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workout Effectiveness Metrics Test</h1>
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
            <WorkoutEffectivenessMetricsOptimized
              data={mockData}
              filters={filters}
              isLoading={false}
              error={null}
              onFilterChange={() => {}}
            />
          ) : (
            <WorkoutEffectivenessMetrics
              data={mockData}
              filters={filters}
              isLoading={false}
              error={null}
              onFilterChange={() => {}}
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