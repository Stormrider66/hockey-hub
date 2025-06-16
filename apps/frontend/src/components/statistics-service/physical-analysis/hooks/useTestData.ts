import { useState, useEffect } from 'react';
import { TestData, PlayerData, TestBatch, TeamStatistics } from '../types';

interface UseTestDataReturn {
  teamData: PlayerData[];
  testBatches: TestBatch[];
  teamStats: TeamStatistics | null;
  loading: boolean;
  error: Error | null;
}

// Mock data for demonstration
const mockTeamData: PlayerData[] = [
  {
    id: 'player1',
    name: 'Erik Andersson',
    position: 'Forward',
    age: 22,
    dateOfBirth: '2002-03-15',
    skillLevel: 'elite',
    team: 'Team A',
    jerseyNumber: 15,
    dominantHand: 'right',
    testResults: {
      date: '2024-01-15',
      height: 185,
      weight: 88,
      bodyFat: 12.5,
      verticalJump: 58.5,
      standingLongJump: 262,
      sprint30m: 4.12,
      sprint6m: 1.08,
      powerClean1RM: 95,
      squat1RM: 140,
      slideBoard: 42,
      onIce30m: 4.25,
      onIce6m: 1.12,
      corneringSTest: 8.45,
      vo2Max: 58.5,
      gripStrengthLeft: 52,
      gripStrengthRight: 54
    }
  },
  {
    id: 'player2',
    name: 'Magnus Lindberg',
    position: 'Defense',
    age: 24,
    dateOfBirth: '2000-07-22',
    skillLevel: 'elite',
    team: 'Team A',
    jerseyNumber: 4,
    dominantHand: 'left',
    testResults: {
      date: '2024-01-15',
      height: 190,
      weight: 95,
      bodyFat: 14.2,
      verticalJump: 52.3,
      standingLongJump: 248,
      sprint30m: 4.28,
      sprint6m: 1.15,
      powerClean1RM: 105,
      squat1RM: 160,
      slideBoard: 38,
      onIce30m: 4.42,
      onIce6m: 1.18,
      corneringSTest: 8.72,
      vo2Max: 54.2,
      gripStrengthLeft: 58,
      gripStrengthRight: 60
    }
  },
  {
    id: 'player3',
    name: 'Johan Nilsson',
    position: 'Forward',
    age: 20,
    dateOfBirth: '2004-01-10',
    skillLevel: 'sub-elite',
    team: 'Team A',
    jerseyNumber: 21,
    dominantHand: 'right',
    testResults: {
      date: '2024-01-15',
      height: 182,
      weight: 84,
      bodyFat: 13.8,
      verticalJump: 54.2,
      standingLongJump: 251,
      sprint30m: 4.22,
      sprint6m: 1.10,
      powerClean1RM: 85,
      squat1RM: 125,
      slideBoard: 40,
      onIce30m: 4.35,
      onIce6m: 1.14,
      corneringSTest: 8.58,
      vo2Max: 56.0,
      gripStrengthLeft: 48,
      gripStrengthRight: 50
    }
  }
];

const mockTestBatches: TestBatch[] = [
  {
    id: 'batch1',
    name: 'Pre-Season Testing 2024',
    date: '2024-01-15',
    testAdministrator: 'John Smith',
    location: 'Team Training Facility',
    status: 'completed',
    testTypes: ['anthropometric', 'power', 'speed', 'strength'],
    totalPlayers: 25,
    completedPlayers: ['player1', 'player2', 'player3'],
    notes: 'All tests completed successfully. Good weather conditions.'
  },
  {
    id: 'batch2',
    name: 'Mid-Season Check',
    date: '2024-03-10',
    testAdministrator: 'John Smith',
    location: 'Team Training Facility',
    status: 'in-progress',
    testTypes: ['power', 'speed'],
    totalPlayers: 25,
    completedPlayers: ['player1'],
    notes: 'Focus on key performance indicators only.'
  },
  {
    id: 'batch3',
    name: 'Post-Season Evaluation',
    date: '2024-05-20',
    testAdministrator: 'John Smith',
    location: 'Team Training Facility',
    status: 'planned',
    testTypes: ['anthropometric', 'power', 'speed', 'strength', 'aerobic'],
    totalPlayers: 25,
    completedPlayers: []
  }
];

export function useTestData(teamId?: string): UseTestDataReturn {
  const [teamData, setTeamData] = useState<PlayerData[]>([]);
  const [testBatches, setTestBatches] = useState<TestBatch[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In real implementation, fetch from API
        // const response = await fetch(`/api/teams/${teamId}/test-data`);
        // const data = await response.json();
        
        // For now, use mock data
        setTeamData(mockTeamData);
          setTestBatches(mockTestBatches);
          
          // Calculate team statistics
          const stats: TeamStatistics = {
          teamId: teamId || 'team1',
          averages: calculateTeamAverages(mockTeamData),
          improvements: {
            verticalJump: 5.2,
            sprint30m: 2.1,
            slideBoard: 8.5,
            squat1RM: 7.3
          },
          topPerformers: {
            verticalJump: 'Erik Andersson',
            sprint30m: 'Erik Andersson',
            slideBoard: 'Erik Andersson',
            squat1RM: 'Magnus Lindberg'
          },
          needsImprovement: {
            verticalJump: ['player4', 'player5'],
            sprint30m: ['player6', 'player7'],
            slideBoard: ['player8', 'player9']
          }
        };
        
        setTeamStats(stats);
        
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [teamId]);

  return { teamData, testBatches, teamStats, loading, error };
}

// Helper function to calculate team averages
function calculateTeamAverages(players: PlayerData[]): Partial<TestData> {
  const averages: Partial<TestData> = {};
  
  if (players.length === 0) return averages;
  
  // Calculate average for each numeric test
  const testKeys: (keyof TestData)[] = [
    'height', 'weight', 'bodyFat', 'verticalJump', 'standingLongJump',
    'sprint30m', 'sprint6m', 'squat1RM', 'slideBoard', 'vo2Max'
  ];
  
  testKeys.forEach(key => {
    const values = players
      .map(p => p.testResults[key] as number)
      .filter(v => v !== undefined && v !== null);
    
    if (values.length > 0) {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      (averages as any)[key] = avg;
    }
  });
  
  return averages;
}