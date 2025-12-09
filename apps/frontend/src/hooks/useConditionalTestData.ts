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
  jerseyNumber?: number;
  role?: string;
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

export function useConditionalTestData(enabled: boolean = true, selectedTeamId?: string | null): PhysicalTestData {
  // Get organization ID from local storage or context
  const currentUser = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('user_data') || localStorage.getItem('mock_user') || '{}')
    : {};
  const organizationId = currentUser.organizationId || '';
  // Use selectedTeamId if provided, otherwise fall back to user's teamId
  const teamId = selectedTeamId && selectedTeamId !== 'all' && selectedTeamId !== 'personal' 
    ? selectedTeamId 
    : currentUser.teamId;

  // Fetch players - only when enabled
  const {
    data: playersData,
    isLoading: isLoadingPlayers,
    error: playersError
  } = useGetPlayersQuery({ organizationId, teamId }, { skip: !enabled });

  // Fetch test batches - only when enabled
  const {
    data: testBatchesData,
    isLoading: isLoadingBatches,
    error: batchesError
  } = useGetTestBatchesQuery({ teamId }, { skip: !enabled });

  // Fetch test results - only when enabled
  const {
    data: testResultsData,
    isLoading: isLoadingTests,
    error: testsError
  } = useGetTestsQuery({}, { skip: !enabled });

  // Transform players data to match the expected interface
  const players = useMemo<Player[]>(() => {
    if (!enabled || !playersData) return [];
    
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
  }, [enabled, playersData]);

  // Transform test batches data
  const testBatches = useMemo<TestBatch[]>(() => {
    if (!enabled || !testBatchesData) return [];
    
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
  }, [enabled, testBatchesData]);

  // Transform test results data
  const testResults = useMemo<TestResult[]>(() => {
    if (!enabled || !testResultsData) return [];
    
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
  }, [enabled, testResultsData]);

  // Determine overall loading state
  const isLoading = enabled && (isLoadingPlayers || isLoadingBatches || isLoadingTests);

  // Combine errors
  const error = enabled ? (playersError || batchesError || testsError) : null;

  // Provide fallback empty arrays if data is undefined
  return {
    players: players || [],
    testBatches: testBatches || [],
    testResults: testResults || [],
    isLoading,
    error
  };
}