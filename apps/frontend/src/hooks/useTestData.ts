import { useState, useEffect } from 'react';
import { useGetTestsQuery, useGetTestBatchesQuery } from '@/store/api/trainingApi';

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  team?: string;
}

export interface TestBatch {
  id: number;
  name: string;
  date: string;
  completedTests: number;
  totalTests: number;
  status?: 'active' | 'completed' | 'scheduled';
}

export interface TestResult {
  id: string;
  playerId: string;
  testBatchId: number;
  testType: string;
  value: number;
  unit: string;
  date: string;
  percentile?: number;
  previousValue?: number;
  change?: number;
}

export interface PhysicalTestData {
  players: Player[];
  testBatches: TestBatch[];
  testResults: TestResult[];
  isLoading: boolean;
  error: any;
}

export function useTestData(): PhysicalTestData {
  // TODO: Replace with actual RTK Query hooks when training service API is implemented
  const [testData, setTestData] = useState<PhysicalTestData>({
    players: [],
    testBatches: [],
    testResults: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      // Mock data for development
      const mockPlayers: Player[] = [
        { id: '1', name: 'Erik Andersson', number: 15, position: 'Forward', team: 'A-Team' },
        { id: '2', name: 'Marcus Lindberg', number: 7, position: 'Defenseman', team: 'A-Team' },
        { id: '3', name: 'Viktor Nilsson', number: 23, position: 'Goalie', team: 'A-Team' },
        { id: '4', name: 'Johan Bergström', number: 12, position: 'Forward', team: 'J20 Team' },
        { id: '5', name: 'Anders Johansson', number: 3, position: 'Defenseman', team: 'J20 Team' },
        { id: '6', name: 'Lars Svensson', number: 18, position: 'Forward', team: 'U18 Team' },
        { id: '7', name: 'Per Olsson', number: 5, position: 'Defenseman', team: 'U18 Team' },
        { id: '8', name: 'Niklas Gustafsson', number: 30, position: 'Goalie', team: 'U16 Team' }
      ];

      const mockTestBatches: TestBatch[] = [
        { 
          id: 1, 
          name: 'Pre-Season 2024', 
          date: '2024-01-15', 
          completedTests: 45, 
          totalTests: 50,
          status: 'completed'
        },
        { 
          id: 2, 
          name: 'Mid-Season Check', 
          date: '2024-03-20', 
          completedTests: 38, 
          totalTests: 50,
          status: 'active'
        },
        { 
          id: 3, 
          name: 'Spring Testing', 
          date: '2024-05-10', 
          completedTests: 0, 
          totalTests: 50,
          status: 'scheduled'
        }
      ];

      const mockTestResults: TestResult[] = [
        {
          id: '1',
          playerId: '1',
          testBatchId: 1,
          testType: 'Vertical Jump',
          value: 65,
          unit: 'cm',
          date: '2024-01-15',
          percentile: 85,
          previousValue: 62,
          change: 4.8
        },
        {
          id: '2',
          playerId: '1',
          testBatchId: 1,
          testType: 'Bench Press 1RM',
          value: 120,
          unit: 'kg',
          date: '2024-01-15',
          percentile: 78,
          previousValue: 115,
          change: 4.3
        },
        {
          id: '3',
          playerId: '1',
          testBatchId: 1,
          testType: 'VO2 Max',
          value: 58,
          unit: 'ml/kg/min',
          date: '2024-01-15',
          percentile: 82,
          previousValue: 56,
          change: 3.6
        },
        {
          id: '4',
          playerId: '2',
          testBatchId: 1,
          testType: 'Vertical Jump',
          value: 58,
          unit: 'cm',
          date: '2024-01-15',
          percentile: 72,
          previousValue: 55,
          change: 5.5
        },
        {
          id: '5',
          playerId: '2',
          testBatchId: 1,
          testType: 'Bench Press 1RM',
          value: 110,
          unit: 'kg',
          date: '2024-01-15',
          percentile: 70,
          previousValue: 108,
          change: 1.9
        }
      ];

      setTestData({
        players: mockPlayers,
        testBatches: mockTestBatches,
        testResults: mockTestResults,
        isLoading: false,
        error: null,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return testData;
}

// Additional hook for filtering test results by player or batch
export function useFilteredTestResults(
  testResults: TestResult[],
  playerId?: string,
  testBatchId?: number
): TestResult[] {
  return testResults.filter(result => {
    if (playerId && result.playerId !== playerId) return false;
    if (testBatchId && result.testBatchId !== testBatchId) return false;
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