import { useState, useMemo, useEffect } from 'react';
import { useTestData } from '@/hooks/useTestData';
import { mockPlayerReadiness } from '../constants/mockData';
import { SessionTemplate, TestFormData, Player, TestBatch, TestResult } from '../types';
import { useAuth } from "@/contexts/AuthContext";

// Function to generate mock data with correct team ID
const generateMockPlayers = (teamId: string): Player[] => {
  // Different player names based on team
  const teamPlayers: Record<string, Player[]> = {
    'a-team': [
      { id: '1', name: 'Erik Andersson', number: 11, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '2', name: 'Marcus Lindberg', number: 23, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '3', name: 'Viktor Nilsson', number: 1, position: 'Goalie', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '4', name: 'Johan Bergström', number: 8, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '5', name: 'Anders Johansson', number: 15, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    ],
    'j20': [
      { id: '6', name: 'Oskar Svensson', number: 10, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '7', name: 'Filip Eriksson', number: 21, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '8', name: 'Lucas Pettersson', number: 35, position: 'Goalie', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '9', name: 'Anton Karlsson', number: 14, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    ],
    'u18': [
      { id: '10', name: 'William Larsson', number: 7, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '11', name: 'Alexander Olsson', number: 19, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '12', name: 'Hugo Magnusson', number: 30, position: 'Goalie', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    ],
    'womens': [
      { id: '13', name: 'Emma Andersson', number: 9, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '14', name: 'Sofia Lindberg', number: 24, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '15', name: 'Anna Nilsson', number: 31, position: 'Goalie', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '16', name: 'Maria Svensson', number: 17, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    ]
  };

  // Return team-specific players or default players
  return teamPlayers[teamId] || teamPlayers['a-team'];
};

const generateMockTestBatches = (teamId: string): TestBatch[] => {
  const teamNameMap: Record<string, string> = {
    'a-team': 'A-Team',
    'j20': 'J20',
    'u18': 'U18',
    'womens': 'Women\'s Team',
    'default-team': 'Team'
  };
  
  const teamName = teamNameMap[teamId] || 'Team';
  
  return [
    { 
      id: '1', 
      name: `${teamName} Pre-Season 2024`, 
      date: '2024-08-15', 
      teamId,
      status: 'completed',
      completedTests: 25,
      totalTests: 25,
      notes: `Initial fitness assessment for ${teamName}`,
      createdAt: '2024-08-15T08:00:00Z',
      updatedAt: '2024-08-15T12:00:00Z'
    },
    { 
      id: '2', 
      name: `${teamName} Mid-Season Check`, 
      date: '2024-11-20', 
      teamId,
      status: 'active',
      completedTests: 12,
      totalTests: 25,
      notes: `Progress evaluation for ${teamName}`,
      createdAt: '2024-11-20T08:00:00Z',
      updatedAt: '2024-11-20T10:30:00Z'
    }
  ];
};

const mockTestResults: TestResult[] = [
  {
    id: '1',
    playerId: '1',
    playerName: 'Erik Andersson',
    testBatchId: '1',
    testType: 'verticalJump',
    value: 65.5,
    unit: 'cm',
    percentile: 85,
    previousValue: 62.0,
    change: 5.6,
    changeDirection: 'improvement',
    notes: 'Great improvement',
    createdAt: '2024-08-15T09:00:00Z',
    updatedAt: '2024-08-15T09:00:00Z'
  },
  {
    id: '2',
    playerId: '2',
    playerName: 'Marcus Lindberg',
    testBatchId: '1',
    testType: 'benchPress1RM',
    value: 120,
    unit: 'kg',
    percentile: 75,
    previousValue: 115,
    change: 4.3,
    changeDirection: 'improvement',
    notes: '',
    createdAt: '2024-08-15T09:15:00Z',
    updatedAt: '2024-08-15T09:15:00Z'
  },
  {
    id: '3',
    playerId: '3',
    playerName: 'Viktor Nilsson',
    testBatchId: '1',
    testType: 'vo2Max',
    value: 58.2,
    unit: 'ml/kg/min',
    percentile: 70,
    previousValue: 56.5,
    change: 3.0,
    changeDirection: 'improvement',
    notes: 'Good endurance',
    createdAt: '2024-08-15T09:30:00Z',
    updatedAt: '2024-08-15T09:30:00Z'
  },
  {
    id: '4',
    playerId: '4',
    playerName: 'Johan Bergström',
    testBatchId: '2',
    testType: 'sprint30m',
    value: 4.12,
    unit: 'seconds',
    percentile: 90,
    previousValue: 4.18,
    change: -1.4,
    changeDirection: 'improvement',
    notes: 'Excellent speed',
    createdAt: '2024-11-20T09:00:00Z',
    updatedAt: '2024-11-20T09:00:00Z'
  },
  {
    id: '5',
    playerId: '5',
    playerName: 'Anders Johansson',
    testBatchId: '2',
    testType: 'agility5105',
    value: 12.3,
    unit: 'seconds',
    percentile: 80,
    previousValue: 12.8,
    change: -3.9,
    changeDirection: 'improvement',
    notes: 'Improved agility',
    createdAt: '2024-11-20T09:15:00Z',
    updatedAt: '2024-11-20T09:15:00Z'
  }
];

export function usePhysicalTrainerData() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Team selection state with localStorage persistence
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() => {
    const saved = localStorage.getItem('physicalTrainer_selectedTeamId');
    if (saved && (saved === 'all' || saved === 'personal' || user?.teams?.some(t => t.id === saved))) {
      return saved;
    }
    return user?.teams?.[0]?.id || 'all';
  });
  
  // Persist team selection to localStorage
  useEffect(() => {
    if (selectedTeamId) {
      localStorage.setItem('physicalTrainer_selectedTeamId', selectedTeamId);
    }
  }, [selectedTeamId]);
  
  // Use the real hook for test data
  const { players, testBatches, testResults, isLoading, error } = useTestData();
  
  // Get effective team ID for data filtering
  const teamId = selectedTeamId === 'all' || selectedTeamId === 'personal' 
    ? (user?.teams?.[0]?.id || 'default-team')
    : selectedTeamId || 'default-team';
  
  // Use mock data if there's an error or no data
  const effectivePlayers = useMemo(() => {
    let playerData = players;
    
    if (error || (!isLoading && players.length === 0)) {
      playerData = generateMockPlayers(teamId);
    }
    
    // Filter players based on selectedTeamId
    if (selectedTeamId && selectedTeamId !== 'all' && selectedTeamId !== 'personal') {
      return playerData.filter(player => player.teamId === selectedTeamId);
    }
    
    // For 'personal' view, you might want to filter differently
    // For now, return all players for 'all' and 'personal'
    return playerData;
  }, [players, error, isLoading, teamId, selectedTeamId]);
  
  const effectiveTestBatches = useMemo(() => {
    let batchData = testBatches;
    
    if (error || (!isLoading && testBatches.length === 0)) {
      batchData = generateMockTestBatches(teamId);
    }
    
    // Filter test batches based on selectedTeamId
    if (selectedTeamId && selectedTeamId !== 'all' && selectedTeamId !== 'personal') {
      return batchData.filter(batch => batch.teamId === selectedTeamId);
    }
    
    return batchData;
  }, [testBatches, error, isLoading, teamId, selectedTeamId]);
  
  const effectiveTestResults = useMemo(() => {
    if (error || (!isLoading && testResults.length === 0)) {
      return mockTestResults;
    }
    return testResults;
  }, [testResults, error, isLoading]);
  
  // Generate team-specific player readiness data
  const effectivePlayerReadiness = useMemo(() => {
    const playerNames: Record<string, string[]> = {
      'a-team': ['Erik Andersson', 'Marcus Lindberg', 'Viktor Nilsson', 'Johan Bergström', 'Anders Johansson'],
      'j20': ['Oskar Svensson', 'Filip Eriksson', 'Lucas Pettersson', 'Anton Karlsson'],
      'u18': ['William Larsson', 'Alexander Olsson', 'Hugo Magnusson'],
      'womens': ['Emma Andersson', 'Sofia Lindberg', 'Anna Nilsson', 'Maria Svensson']
    };

    const getReadinessForTeam = (team: string) => {
      const names = playerNames[team] || playerNames['a-team'];
      return names.map((name, index) => ({
        id: index + 1,
        playerId: `${index + 1}`,
        name,
        status: ['ready', 'caution', 'rest'][index % 3] as 'ready' | 'caution' | 'rest',
        load: 70 + (index * 10) % 40,
        fatigue: ['low', 'medium', 'high'][index % 3] as 'low' | 'medium' | 'high',
        trend: ['up', 'stable', 'down'][index % 3] as 'up' | 'stable' | 'down',
        lastUpdated: new Date().toISOString()
      }));
    };

    if (selectedTeamId === 'all') {
      // Combine players from all teams
      return [
        ...getReadinessForTeam('a-team'),
        ...getReadinessForTeam('j20'),
        ...getReadinessForTeam('u18'),
        ...getReadinessForTeam('womens')
      ];
    } else if (selectedTeamId === 'personal') {
      // Show specific individuals being trained
      return [
        { id: 1, playerId: '1', name: 'Sidney Crosby', status: 'caution' as const, load: 65, fatigue: 'medium' as const, trend: 'up' as const, lastUpdated: new Date().toISOString() },
        { id: 2, playerId: '2', name: 'Nathan MacKinnon', status: 'rest' as const, load: 45, fatigue: 'high' as const, trend: 'stable' as const, lastUpdated: new Date().toISOString() },
        { id: 3, playerId: '3', name: 'Connor McDavid', status: 'ready' as const, load: 85, fatigue: 'low' as const, trend: 'up' as const, lastUpdated: new Date().toISOString() }
      ];
    } else if (selectedTeamId && playerNames[selectedTeamId]) {
      return getReadinessForTeam(selectedTeamId);
    }

    // Default fallback
    return mockPlayerReadiness;
  }, [selectedTeamId]);

  // Clear error if we're using mock data
  const effectiveError = (error && !isLoading && players.length === 0) ? null : error;
  const effectiveLoading = isLoading && players.length === 0;
  
  // Navigation handlers
  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
  };

  const navigateToPlayerStatus = () => {
    setActiveTab('status');
  };

  const navigateToCalendar = () => {
    setActiveTab('calendar');
  };

  // Template handling
  const handleApplyTemplate = (template: SessionTemplate, date?: Date, time?: string) => {
    // Create a new session based on the template
    const sessionData = {
      name: template.name,
      type: template.type,
      duration: template.duration,
      description: template.description,
      exercises: template.exercises,
      date: date || new Date(),
      time: time || '09:00',
      targetPlayers: template.targetPlayers,
    };
    
    // Could pass this data to the create modal
    console.log('Applying template:', sessionData);
    
    // Return the session data for the parent component to use
    return sessionData;
  };

  // Test submission handlers
  const handleTestSubmit = (data: TestFormData) => {
    console.log('Test data submitted:', data);
    // In a real app, this would call an API
  };

  const handleTestSaveDraft = (data: TestFormData) => {
    console.log('Draft saved:', data);
    // In a real app, this would save to local storage or API
  };

  return {
    activeTab,
    setActiveTab,
    selectedTeamId,
    setSelectedTeamId,
    players: effectivePlayers,
    testBatches: effectiveTestBatches,
    testResults: effectiveTestResults,
    isLoading: effectiveLoading,
    error: effectiveError,
    playerReadiness: effectivePlayerReadiness,
    navigateToTab,
    navigateToPlayerStatus,
    navigateToCalendar,
    handleApplyTemplate,
    handleTestSubmit,
    handleTestSaveDraft
  };
}