import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AnalyticsDashboardFilters,
  PlayerPerformanceData,
  TeamPerformanceData,
  WorkoutEffectivenessData,
  LoadManagementData,
  PerformanceInsight,
  PerformanceRecommendation,
  PerformanceAlerts,
  ExportOptions,
  ComparisonResult,
  WorkoutType
} from '../types/performance-analytics.types';

interface PerformanceAnalyticsData {
  players: PlayerPerformanceData[];
  teams: TeamPerformanceData[];
  workoutEffectiveness: WorkoutEffectivenessData[];
  loadManagement: LoadManagementData[];
  comparisons?: ComparisonResult[];
  lastUpdated: Date;
}

interface UsePerformanceAnalyticsReturn {
  data: PerformanceAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  insights: PerformanceInsight[];
  recommendations: PerformanceRecommendation[];
  alerts: PerformanceAlerts[];
  refresh: () => Promise<void>;
  exportData: (options: ExportOptions) => Promise<void>;
}

// Mock data generation functions
function generateMockPlayerData(count: number = 20): PlayerPerformanceData[] {
  const positions = ['Forward', 'Defense', 'Goalie'];
  const names = [
    'Sidney Crosby', 'Connor McDavid', 'Nathan MacKinnon', 'Alex Ovechkin',
    'Leon Draisaitl', 'Artemi Panarin', 'Erik Karlsson', 'Cale Makar',
    'Victor Hedman', 'Andrei Vasilevskiy', 'Auston Matthews', 'Mitch Marner',
    'John Tavares', 'William Nylander', 'Morgan Rielly', 'Frederik Andersen',
    'Patrick Kane', 'Jonathan Toews', 'Tyler Seguin', 'Jamie Benn'
  ];

  return Array.from({ length: count }, (_, index) => {
    const baseMetrics = {
      strengthIndex: 75 + Math.random() * 25,
      powerOutput: 800 + Math.random() * 400,
      oneRepMaxEstimate: 200 + Math.random() * 100,
      vo2Max: 50 + Math.random() * 15,
      lactateThreshold: 160 + Math.random() * 20,
      heartRateRecovery: 20 + Math.random() * 10,
      reactionTime: 0.15 + Math.random() * 0.05,
      changOfDirectionSpeed: 4.5 + Math.random() * 0.8,
      footSpeed: 6.0 + Math.random() * 1.0,
      rpeAverage: 5 + Math.random() * 3,
      sleepQuality: 6 + Math.random() * 3,
      wellnessScore: 70 + Math.random() * 30,
      sessionAttendance: 0.7 + Math.random() * 0.3,
      completionRate: 0.8 + Math.random() * 0.2,
      punctuality: 0.85 + Math.random() * 0.15,
      weeklyLoad: 1000 + Math.random() * 500,
      acuteLoad: 1200 + Math.random() * 400,
      chronicLoad: 1100 + Math.random() * 300,
      acuteChronicRatio: 0.8 + Math.random() * 0.6
    };

    return {
      playerId: `player-${index + 1}`,
      playerName: names[index] || `Player ${index + 1}`,
      position: positions[index % positions.length],
      metrics: baseMetrics,
      workoutHistory: generateMockWorkoutHistory(30),
      injuryRisk: {
        overall: baseMetrics.acuteChronicRatio > 1.3 ? 'high' : 
               baseMetrics.acuteChronicRatio > 1.1 ? 'moderate' : 'low',
        factors: baseMetrics.acuteChronicRatio > 1.3 ? 
          ['High training load', 'Poor recovery metrics'] : 
          ['Well managed load'],
        recommendations: baseMetrics.acuteChronicRatio > 1.3 ? 
          ['Reduce training volume', 'Focus on recovery'] : 
          ['Maintain current approach']
      },
      progressTrends: {
        strength: generateTrendData('strength', 30),
        conditioning: generateTrendData('conditioning', 30),
        agility: generateTrendData('agility', 30),
        recovery: generateTrendData('recovery', 30)
      }
    };
  });
}

function generateMockWorkoutHistory(days: number) {
  const workoutTypes: WorkoutType[] = ['strength', 'conditioning', 'hybrid', 'agility'];
  
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    
    return {
      sessionId: `session-${index}`,
      workoutType: workoutTypes[Math.floor(Math.random() * workoutTypes.length)],
      date: date.toISOString(),
      duration: 45 + Math.random() * 60,
      completionRate: 0.7 + Math.random() * 0.3,
      averageIntensity: 6 + Math.random() * 3,
      peakHeartRate: 170 + Math.random() * 30,
      averageHeartRate: 140 + Math.random() * 20,
      rpe: 5 + Math.random() * 4,
      exercises: generateMockExerciseResults(),
      notes: Math.random() > 0.7 ? 'Great session!' : undefined
    };
  });
}

function generateMockExerciseResults() {
  const exercises = [
    'Squat', 'Deadlift', 'Bench Press', 'Pull-ups', 'Sprint Intervals',
    'Agility Ladder', 'Box Jumps', 'Russian Twists', 'Burpees', 'Plank'
  ];
  
  return exercises.slice(0, 3 + Math.floor(Math.random() * 4)).map((name, index) => ({
    exerciseId: `exercise-${index}`,
    exerciseName: name,
    sets: Array.from({ length: 3 + Math.floor(Math.random() * 2) }, () => ({
      reps: 8 + Math.floor(Math.random() * 7),
      weight: name.includes('Press') || name.includes('Squat') ? 100 + Math.random() * 150 : undefined,
      duration: name.includes('Plank') ? 30 + Math.random() * 60 : undefined,
      distance: name.includes('Sprint') ? 100 + Math.random() * 300 : undefined,
      restTime: 60 + Math.random() * 120,
      rpe: 6 + Math.random() * 3
    })),
    totalVolume: 1000 + Math.random() * 2000,
    personalRecord: Math.random() > 0.9
  }));
}

function generateTrendData(category: string, days: number) {
  const baseValue = 50 + Math.random() * 30;
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    
    return {
      date: date.toISOString(),
      value: baseValue + Math.sin(index * 0.1) * 10 + Math.random() * 5,
      workoutType: (['strength', 'conditioning', 'hybrid', 'agility'] as WorkoutType[])[Math.floor(Math.random() * 4)],
      metric: category
    };
  });
}

function generateMockTeamData(count: number = 5): TeamPerformanceData[] {
  const teamNames = ['Junior A', 'Junior B', 'Bantam', 'Midget', 'Senior'];
  
  return Array.from({ length: count }, (_, index) => ({
    teamId: `team-${index + 1}`,
    teamName: teamNames[index] || `Team ${index + 1}`,
    playerCount: 15 + Math.floor(Math.random() * 10),
    metrics: {
      averageAttendance: 0.75 + Math.random() * 0.25,
      averageCompletionRate: 0.8 + Math.random() * 0.2,
      averageWellness: 70 + Math.random() * 25,
      totalWorkouts: 50 + Math.floor(Math.random() * 100),
      activeInjuries: Math.floor(Math.random() * 5),
      teamReadiness: 70 + Math.random() * 30
    },
    workoutDistribution: {
      strength: 25 + Math.random() * 15,
      conditioning: 30 + Math.random() * 15,
      hybrid: 20 + Math.random() * 10,
      agility: 15 + Math.random() * 10
    },
    performanceTrends: {
      strength: generateTeamTrendData(30),
      conditioning: generateTeamTrendData(30),
      agility: generateTeamTrendData(30),
      attendance: generateTeamTrendData(30)
    },
    comparisonData: {
      vsLastMonth: generateComparisonMetrics(),
      vsTarget: generateComparisonMetrics(),
      vsLeague: Math.random() > 0.5 ? generateComparisonMetrics() : undefined
    }
  }));
}

function generateTeamTrendData(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const average = 50 + Math.random() * 30;
    
    return {
      date: date.toISOString(),
      average,
      median: average + (Math.random() - 0.5) * 5,
      standardDeviation: 5 + Math.random() * 10,
      participantCount: 12 + Math.floor(Math.random() * 8)
    };
  });
}

function generateComparisonMetrics() {
  const metrics = ['strength', 'conditioning', 'agility', 'attendance', 'wellness'];
  return metrics.map(metric => ({
    id: metric,
    name: metric.charAt(0).toUpperCase() + metric.slice(1),
    value: 50 + Math.random() * 40,
    unit: metric === 'attendance' ? '%' : 'points',
    change: (Math.random() - 0.5) * 20,
    trend: Math.random() > 0.5 ? 'up' as const : 'down' as const,
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    category: metric as any
  }));
}

function generateMockWorkoutEffectiveness(): WorkoutEffectivenessData[] {
  const workoutTypes: WorkoutType[] = ['strength', 'conditioning', 'hybrid', 'agility'];
  
  return workoutTypes.map(type => ({
    workoutType: type,
    totalSessions: 100 + Math.floor(Math.random() * 200),
    averageCompletion: 0.8 + Math.random() * 0.2,
    averageIntensity: 6 + Math.random() * 3,
    averageRPE: 5 + Math.random() * 3,
    improvementRate: 0.6 + Math.random() * 0.3,
    retentionRate: 0.75 + Math.random() * 0.25,
    effectiveness: {
      overall: 6 + Math.random() * 3,
      strength: type === 'strength' ? 8 + Math.random() * 2 : 5 + Math.random() * 3,
      conditioning: type === 'conditioning' ? 8 + Math.random() * 2 : 5 + Math.random() * 3,
      engagement: 6 + Math.random() * 3,
      safety: 8 + Math.random() * 2,
      progression: 6 + Math.random() * 3
    },
    topExercises: generateTopExercises(type),
    recommendedAdjustments: generateRecommendations(type)
  }));
}

function generateTopExercises(workoutType: WorkoutType) {
  const exercisesByType = {
    strength: ['Squat', 'Deadlift', 'Bench Press', 'Pull-ups', 'Overhead Press'],
    conditioning: ['Sprint Intervals', 'Bike Intervals', 'Rowing', 'Burpees', 'Mountain Climbers'],
    hybrid: ['Squat to Press', 'Deadlift High Pull', 'Push-up Burpees', 'Kettlebell Swings', 'Battle Ropes'],
    agility: ['Ladder Drills', 'Cone Drills', 'T-Drill', '5-10-5 Shuttle', 'Box Jumps']
  };
  
  return exercisesByType[workoutType].slice(0, 3).map((name, index) => ({
    exerciseId: `${workoutType}-ex-${index}`,
    exerciseName: name,
    frequency: Math.floor(Math.random() * 50) + 10,
    averageImprovement: Math.random() * 20 + 5,
    playerFeedback: 6 + Math.random() * 3,
    injuryRate: Math.random() * 0.05,
    progressionRate: 0.7 + Math.random() * 0.3
  }));
}

function generateRecommendations(workoutType: WorkoutType) {
  const recommendations = {
    strength: ['Increase progressive overload', 'Add more compound movements', 'Focus on weak points'],
    conditioning: ['Vary interval lengths', 'Include more sport-specific movements', 'Monitor recovery between sessions'],
    hybrid: ['Balance strength and cardio components', 'Ensure proper transitions', 'Adjust complexity based on skill level'],
    agility: ['Increase drill complexity', 'Add decision-making elements', 'Focus on change of direction speed']
  };
  
  return recommendations[workoutType].slice(0, 2);
}

function generateMockLoadManagement(playerCount: number): LoadManagementData[] {
  return Array.from({ length: playerCount }, (_, index) => {
    const acuteLoad = 1000 + Math.random() * 500;
    const chronicLoad = 1100 + Math.random() * 300;
    const ratio = acuteLoad / chronicLoad;
    
    return {
      playerId: `player-${index + 1}`,
      currentLoad: {
        acute: acuteLoad,
        chronic: chronicLoad,
        ratio,
        recommendation: {
          action: ratio > 1.3 ? 'decrease' : ratio < 0.8 ? 'increase' : 'maintain',
          percentage: Math.abs(ratio - 1) * 20,
          reasoning: ratio > 1.3 ? 'High acute:chronic ratio indicates overreaching' :
                    ratio < 0.8 ? 'Low ratio suggests undertraining' :
                    'Load is well balanced',
          duration: ratio > 1.3 ? '1-2 weeks' : '1 week'
        }
      },
      loadHistory: generateLoadHistory(28),
      riskFactors: generateRiskFactors(ratio),
      adaptationStatus: ratio > 1.5 ? 'overreaching' :
                       ratio > 1.2 ? 'declining' :
                       ratio > 0.9 ? 'positive' : 'maintaining'
    };
  });
}

function generateLoadHistory(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const dailyLoad = 800 + Math.random() * 400;
    
    return {
      date: date.toISOString(),
      dailyLoad,
      acuteLoad: dailyLoad * (0.9 + Math.random() * 0.2),
      chronicLoad: dailyLoad * (0.95 + Math.random() * 0.1),
      ratio: 0.8 + Math.random() * 0.6,
      wellness: 6 + Math.random() * 3,
      performance: 6 + Math.random() * 3
    };
  });
}

function generateRiskFactors(ratio: number) {
  const factors = [];
  
  if (ratio > 1.3) {
    factors.push({
      type: 'load' as const,
      severity: 'high' as const,
      description: 'Acute load significantly higher than chronic baseline',
      recommendation: 'Reduce training volume by 15-25%'
    });
  }
  
  if (Math.random() > 0.7) {
    factors.push({
      type: 'wellness' as const,
      severity: 'moderate' as const,
      description: 'Reported fatigue levels above normal',
      recommendation: 'Monitor wellness scores daily'
    });
  }
  
  return factors;
}

function generateMockInsights(): PerformanceInsight[] {
  return [
    {
      id: 'insight-1',
      type: 'positive',
      title: 'Strength Training Showing Excellent Results',
      description: 'Players in the Junior A team have shown 15% improvement in 1RM estimates over the past month.',
      impact: 'high',
      category: 'performance',
      entities: ['team-1'],
      recommendations: ['Continue current strength protocol', 'Consider progression to more advanced movements'],
      dataPoints: [],
      confidence: 0.87,
      timestamp: new Date()
    },
    {
      id: 'insight-2',
      type: 'warning',
      title: 'High Injury Risk Detected',
      description: 'Three players showing elevated acute:chronic load ratios above 1.5.',
      impact: 'high',
      category: 'injury',
      entities: ['player-3', 'player-7', 'player-12'],
      recommendations: ['Immediate load reduction', 'Enhanced recovery protocols'],
      dataPoints: [],
      confidence: 0.92,
      timestamp: new Date()
    },
    {
      id: 'insight-3',
      type: 'neutral',
      title: 'Conditioning Plateau Identified',
      description: 'VO2 max improvements have stalled across multiple players.',
      impact: 'medium',
      category: 'performance',
      entities: ['team-2'],
      recommendations: ['Vary training stimulus', 'Introduce new conditioning methods'],
      dataPoints: [],
      confidence: 0.75,
      timestamp: new Date()
    }
  ];
}

function generateMockRecommendations(): PerformanceRecommendation[] {
  return [
    {
      id: 'rec-1',
      type: 'workout',
      priority: 'high',
      title: 'Implement Power Development Phase',
      description: 'Transition strength-focused players to power development training.',
      rationale: 'Strength gains are plateauing, power development will improve on-ice performance.',
      targetEntities: ['team-1'],
      expectedOutcome: '8-12% improvement in power output metrics',
      implementationSteps: [
        'Reduce max strength training volume by 30%',
        'Add plyometric exercises 2x per week',
        'Include Olympic lift variations',
        'Monitor power output weekly'
      ],
      timeline: '4-6 weeks',
      successMetrics: ['Power output increase', 'Sprint performance', 'Jump height improvement']
    },
    {
      id: 'rec-2',
      type: 'recovery',
      priority: 'high',
      title: 'Enhanced Recovery Protocol',
      description: 'Implement structured recovery for high-risk players.',
      rationale: 'Elevated injury risk requires immediate intervention.',
      targetEntities: ['player-3', 'player-7', 'player-12'],
      expectedOutcome: 'Reduced injury risk and improved performance sustainability',
      implementationSteps: [
        'Mandatory rest day after high-intensity sessions',
        'Daily wellness monitoring',
        'Cold therapy post-training',
        'Sleep optimization program'
      ],
      timeline: '2-3 weeks',
      successMetrics: ['Reduced acute:chronic ratio', 'Improved wellness scores', 'Maintained performance']
    }
  ];
}

function generateMockAlerts(): PerformanceAlerts[] {
  return [
    {
      id: 'alert-1',
      playerId: 'player-3',
      type: 'overtraining',
      severity: 'error',
      title: 'Overtraining Risk - Sidney Crosby',
      message: 'Acute:chronic load ratio of 1.7 indicates high overtraining risk.',
      triggeredAt: new Date(),
      acknowledged: false,
      actions: [
        { id: 'action-1', label: 'View Player Details', action: 'view-player', params: { playerId: 'player-3' } },
        { id: 'action-2', label: 'Adjust Training Load', action: 'adjust-load', params: { playerId: 'player-3' } }
      ]
    },
    {
      id: 'alert-2',
      playerId: 'player-1',
      type: 'milestone',
      severity: 'success',
      title: 'Personal Record Achieved',
      message: 'Connor McDavid achieved new 1RM in bench press (+15 lbs).',
      triggeredAt: new Date(Date.now() - 3600000),
      acknowledged: false,
      actions: [
        { id: 'action-3', label: 'View Achievement', action: 'view-achievement' },
        { id: 'action-4', label: 'Update Training Plan', action: 'update-plan' }
      ]
    }
  ];
}

export function usePerformanceAnalytics(
  filters: AnalyticsDashboardFilters
): UsePerformanceAnalyticsReturn {
  const [data, setData] = useState<PerformanceAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate insights, recommendations, and alerts
  const insights = useMemo(() => generateMockInsights(), []);
  const recommendations = useMemo(() => generateMockRecommendations(), []);
  const alerts = useMemo(() => generateMockAlerts(), []);

  // Fetch data function
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Generate mock data based on filters
      const playerCount = filters.teams.length > 0 ? filters.teams.length * 16 : 20;
      const teamCount = filters.teams.length > 0 ? filters.teams.length : 5;

      const mockData: PerformanceAnalyticsData = {
        players: generateMockPlayerData(playerCount),
        teams: generateMockTeamData(teamCount),
        workoutEffectiveness: generateMockWorkoutEffectiveness(),
        loadManagement: generateMockLoadManagement(playerCount),
        lastUpdated: new Date()
      };

      // Apply filters
      let filteredData = { ...mockData };

      if (filters.players.length > 0) {
        filteredData.players = mockData.players.filter(p => 
          filters.players.includes(p.playerId)
        );
      }

      if (filters.teams.length > 0) {
        filteredData.teams = mockData.teams.filter(t => 
          filters.teams.includes(t.teamId)
        );
      }

      if (filters.workoutTypes.length > 0) {
        filteredData.workoutEffectiveness = mockData.workoutEffectiveness.filter(w =>
          filters.workoutTypes.includes(w.workoutType)
        );
      }

      setData(filteredData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Export function
  const exportData = useCallback(async (options: ExportOptions) => {
    // Simulate export processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, this would generate and download the file
    console.log('Exporting data with options:', options);
    
    // Create a simple CSV export for demonstration
    if (options.format === 'csv' && data) {
      const csvData = data.players.map(player => ({
        Name: player.playerName,
        Position: player.position,
        'Strength Index': player.metrics.strengthIndex.toFixed(1),
        'VO2 Max': player.metrics.vo2Max.toFixed(1),
        'Attendance': (player.metrics.sessionAttendance * 100).toFixed(1) + '%',
        'Wellness Score': player.metrics.wellnessScore.toFixed(1)
      }));
      
      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [data]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    insights,
    recommendations,
    alerts,
    refresh,
    exportData
  };
}