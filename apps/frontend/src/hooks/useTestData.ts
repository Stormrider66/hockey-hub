import { useState, useEffect, useMemo } from 'react';
import { 
  useGetTestsQuery, 
  useGetTestBatchesQuery,
  useGetTestAnalyticsQuery,
  useGetTestHistoryQuery
} from '@/store/api/trainingApi';
import { useGetPlayersQuery } from '@/store/api/userApi';

export interface Player {
  id: string;
  name: string;
  number?: number;
  position?: string;
  team?: string;
  jerseyNumber?: number; // Alias for number
  role?: string; // Alias for position
}

export interface TestBatch {
  id: string | number;
  name: string;
  date: string;
  completedTests: number;
  totalTests: number;
  status?: 'active' | 'completed' | 'scheduled';
  teamId?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestResult {
  id: string;
  playerId: string;
  testBatchId: string | number;
  testType: string;
  value: number;
  unit: string;
  date: string;
  percentile?: number;
  previousValue?: number;
  change?: number;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface PhysicalTestData {
  players: Player[];
  testBatches: TestBatch[];
  testResults: TestResult[];
  isLoading: boolean;
  error: any;
}

export function useTestData(): PhysicalTestData {
  // Get organization ID from local storage or context
  const currentUser = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('current_user') || '{}')
    : {};
  const organizationId = currentUser.organizationId || '';
  const teamId = currentUser.teamId;

  // Fetch players
  const {
    data: playersData,
    isLoading: isLoadingPlayers,
    error: playersError
  } = useGetPlayersQuery({ organizationId, teamId });

  // Fetch test batches
  const {
    data: testBatchesData,
    isLoading: isLoadingBatches,
    error: batchesError
  } = useGetTestBatchesQuery({ teamId });

  // Fetch test results
  const {
    data: testResultsData,
    isLoading: isLoadingTests,
    error: testsError
  } = useGetTestsQuery({});

  // Transform players data to match the expected interface
  const players = useMemo<Player[]>(() => {
    if (!playersData) return [];
    
    // Handle the response format from getPlayers query which returns { players: [...] }
    const playersArray = playersData.players || playersData;
    if (!Array.isArray(playersArray)) return [];
    
    return playersArray.map((user: any) => ({
      id: user.id,
      name: user.name || `${user.firstName} ${user.lastName}`.trim(),
      number: user.jerseyNumber || user.number,
      position: user.position || user.role || 'Player',
      team: user.teamName || user.teamId,
      jerseyNumber: user.jerseyNumber || user.number,
      role: user.position || user.role
    }));
  }, [playersData]);

  // Transform test batches data
  const testBatches = useMemo<TestBatch[]>(() => {
    if (!testBatchesData) return [];
    
    return testBatchesData.map((batch: any) => ({
      id: batch.id,
      name: batch.name,
      date: batch.date,
      completedTests: batch.completedTests || 0,
      totalTests: batch.totalTests || 0,
      status: batch.status || 'scheduled',
      teamId: batch.teamId,
      notes: batch.notes,
      createdBy: batch.createdBy,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt
    }));
  }, [testBatchesData]);

  // Transform test results data
  const testResults = useMemo<TestResult[]>(() => {
    if (!testResultsData) return [];
    
    // Handle the response format from getTests query which returns { results: [...] }
    const testsArray = testResultsData.results || testResultsData;
    if (!Array.isArray(testsArray)) return [];
    
    return testsArray.map((test: any) => ({
      id: test.id,
      playerId: test.playerId,
      testBatchId: test.testBatchId,
      testType: test.testType,
      value: test.value,
      unit: test.unit,
      date: test.date || test.createdAt,
      percentile: test.percentile,
      previousValue: test.previousValue,
      change: test.change,
      notes: test.notes,
      createdBy: test.createdBy,
      createdAt: test.createdAt
    }));
  }, [testResultsData]);

  // Determine overall loading state
  const isLoading = isLoadingPlayers || isLoadingBatches || isLoadingTests;

  // Combine errors
  const error = playersError || batchesError || testsError;

  // Provide fallback empty arrays if data is undefined
  return {
    players: players || [],
    testBatches: testBatches || [],
    testResults: testResults || [],
    isLoading,
    error
  };
}

// Additional hook for filtering test results by player or batch
export function useFilteredTestResults(
  testResults: TestResult[],
  playerId?: string,
  testBatchId?: string | number
): TestResult[] {
  return testResults.filter(result => {
    if (playerId && result.playerId !== playerId) return false;
    if (testBatchId && String(result.testBatchId) !== String(testBatchId)) return false;
    return true;
  });
}

// Hook for calculating test statistics
export function useTestStatistics(testResults: TestResult[]) {
  const stats = {
    averageImprovement: 0,
    topPerformers: [] as { playerId: string; improvement: number }[],
    testTypeDistribution: {} as Record<string, number>,
  };

  if (testResults.length === 0) return stats;

  // Calculate average improvement
  const improvements = testResults
    .filter(r => r.change !== undefined)
    .map(r => r.change!);
  
  stats.averageImprovement = improvements.length > 0
    ? improvements.reduce((sum, val) => sum + val, 0) / improvements.length
    : 0;

  // Calculate test type distribution
  testResults.forEach(result => {
    stats.testTypeDistribution[result.testType] = 
      (stats.testTypeDistribution[result.testType] || 0) + 1;
  });

  // Find top performers by average improvement
  const playerImprovements: Record<string, number[]> = {};
  testResults.forEach(result => {
    if (result.change !== undefined) {
      if (!playerImprovements[result.playerId]) {
        playerImprovements[result.playerId] = [];
      }
      playerImprovements[result.playerId].push(result.change);
    }
  });

  stats.topPerformers = Object.entries(playerImprovements)
    .map(([playerId, changes]) => ({
      playerId,
      improvement: changes.reduce((sum, val) => sum + val, 0) / changes.length
    }))
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 5);

  return stats;
}

// Hook for fetching test analytics
export function useTestAnalytics(teamId?: string, dateFrom?: string, dateTo?: string) {
  const { data, isLoading, error } = useGetTestAnalyticsQuery(
    { teamId, dateFrom, dateTo },
    { skip: !teamId }
  );

  return {
    analytics: data,
    isLoading,
    error
  };
}

// Hook for fetching test history
export function useTestHistory(playerId?: string, teamId?: string, limit?: number) {
  const { data, isLoading, error } = useGetTestHistoryQuery(
    { playerId, teamId, limit },
    { skip: !playerId && !teamId }
  );

  return {
    history: data,
    isLoading,
    error
  };
}