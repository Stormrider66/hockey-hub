import { useMemo } from 'react';
import { usePerformanceAnalytics } from './usePerformanceAnalytics';
import { AnalyticsDashboardFilters } from '../types/performance-analytics.types';

interface AnalyticsFilters {
  period: string;
  teamId?: string;
  playerId?: string;
  workoutType?: string;
}

export function useAnalyticsData(filters: AnalyticsFilters) {
  // Convert simple filters to dashboard filters
  const dashboardFilters: AnalyticsDashboardFilters = useMemo(() => ({
    timeRange: filters.period || 'week',
    teamIds: filters.teamId ? [filters.teamId] : [],
    playerIds: filters.playerId ? [filters.playerId] : [],
    workoutTypes: filters.workoutType ? [filters.workoutType as any] : [],
    showComparisons: true,
    comparisonType: 'period',
    includeInjured: false,
    groupBy: 'position'
  }), [filters]);

  const { 
    data: analyticsData, 
    isLoading, 
    error, 
    insights, 
    recommendations,
    refresh 
  } = usePerformanceAnalytics(dashboardFilters);

  // Transform data to match expected format
  const data = useMemo(() => {
    if (!analyticsData) {
      return {
        team: null,
        players: [],
        workouts: [],
        comparisons: []
      };
    }

    // Get the first team data or create a mock one
    const teamData = analyticsData.teams?.[0] || {
      id: 'team-1',
      name: 'Hockey Hub Team',
      overallHealth: 85,
      metrics: {
        averageAttendance: { value: 92, trend: 'up' as const, change: 3 },
        averageIntensity: { value: 78, trend: 'stable' as const, change: 0 },
        injuryRate: { value: 5, trend: 'down' as const, change: -2 },
        performanceIndex: { value: 88, trend: 'up' as const, change: 5 }
      },
      playerCount: analyticsData.players?.length || 0,
      activePlayers: analyticsData.players?.filter(p => p.readiness.status === 'ready').length || 0,
      injuredPlayers: analyticsData.players?.filter(p => p.readiness.status === 'injured').length || 0
    };

    return {
      team: teamData,
      players: analyticsData.players || [],
      workouts: analyticsData.workoutEffectiveness || [],
      comparisons: analyticsData.comparisons || []
    };
  }, [analyticsData]);

  return {
    data,
    isLoading,
    error: error || null,
    insights: insights || [],
    recommendations: recommendations || [],
    refresh
  };
}