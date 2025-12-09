import { useState, useMemo, useEffect, useCallback } from 'react';
import { useConditionalTestData } from '@/hooks/useConditionalTestData';
import { mockPlayerReadiness } from '../constants/mockData';
import { SessionTemplate, TestFormData, Player, TestBatch, TestResult } from '../types';
import { useAuth } from "@/contexts/AuthContext";

// Function to generate mock data with correct team ID - Using Skellefteå AIK players
const generateMockPlayers = (teamId: string): Player[] => {
  // Skellefteå AIK players for different teams
  const teamPlayers: Record<string, Player[]> = {
    'a-team': [
      // A-Team (SHL) - Main roster
      { id: '1', name: 'Jonathan Pudas', number: 44, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '2', name: 'Oscar Möller', number: 89, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '3', name: 'Linus Söderström', number: 32, position: 'Goalie', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '4', name: 'Rickard Hugg', number: 18, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '5', name: 'Max Lindholm', number: 7, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '6', name: 'Pär Lindholm', number: 26, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '7', name: 'Andreas Johnson', number: 11, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '8', name: 'Jonathan Johnson', number: 72, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '9', name: 'Linus Lindström', number: 95, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '10', name: 'Anton Heikkinen', number: 21, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '11', name: 'Dylan Sikura', number: 15, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '12', name: 'Filip Sandberg', number: 48, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '13', name: 'Simon Robertsson', number: 20, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '14', name: 'Arvid Lundberg', number: 53, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '15', name: 'Oskar Nilsson', number: 13, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    ],
    'j20': [
      // J20 SuperElit
      { id: '16', name: 'Viktor Nordin', number: 28, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '17', name: 'Axel Sandin-Pellikka', number: 45, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '18', name: 'Oliver Tärnström', number: 35, position: 'Goalie', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '19', name: 'Leo Sahlin Wallenius', number: 29, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '20', name: 'Elias Salomonsson', number: 24, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '21', name: 'Filip Eriksson', number: 19, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '22', name: 'Albin Sundsvik', number: 14, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '23', name: 'Max Grönlund', number: 22, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '24', name: 'Jacob Olofsson', number: 77, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '25', name: 'Anton Gradin', number: 17, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '26', name: 'William Strömgren', number: 10, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '27', name: 'Felix Rosdahl', number: 91, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    ],
    'u18': [
      // U18 Elit
      { id: '28', name: 'Adam Engström', number: 8, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '29', name: 'Noah Dower Nilsson', number: 27, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '30', name: 'Calle Sjöström', number: 30, position: 'Goalie', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '31', name: 'Viggo Gustafsson', number: 23, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '32', name: 'Isak Garfvé', number: 12, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '33', name: 'Hugo Fransson', number: 16, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '34', name: 'Elliot Nyström', number: 25, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '35', name: 'Vincent Borgesi', number: 88, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '36', name: 'Adrian Bergström', number: 5, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '37', name: 'Lucas Andersson', number: 9, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    ],
    'u16': [
      // U16 
      { id: '38', name: 'Theo Lindberg', number: 4, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '39', name: 'Arvid Henriksson', number: 36, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '40', name: 'Hugo Alnefelt', number: 1, position: 'Goalie', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '41', name: 'Erik Wållberg', number: 62, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '42', name: 'William Wallinder', number: 3, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '43', name: 'Felix Nilsson', number: 63, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '44', name: 'Oliver Johansson', number: 56, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '45', name: 'Nils Höglander', number: 33, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    ],
    'womens': [
      // Women's team
      { id: '46', name: 'Michelle Löwenhielm', number: 9, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '47', name: 'Anna Kjellbin', number: 24, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '48', name: 'Sandra Borg', number: 31, position: 'Goalie', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '49', name: 'Emma Forsgren', number: 17, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '50', name: 'Sara Säkkinen', number: 19, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '51', name: 'Wilma Carlsson', number: 6, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '52', name: 'Johanna Fällman', number: 43, position: 'Defense', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '53', name: 'Maja Nylén Persson', number: 21, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '54', name: 'Ida Karlsson', number: 71, position: 'Forward', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      { id: '55', name: 'Mikaela Beattie', number: 35, position: 'Goalie', teamId, status: 'active', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
    ]
  };
  
  // Return team-specific players or default players  
  return teamPlayers[teamId] || teamPlayers['a-team'];
};

export function useLazyPhysicalTrainerData() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dataLoaded, setDataLoaded] = useState<Record<string, boolean>>({});
  
  // Team selection state with localStorage persistence
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(() => {
    const saved = localStorage.getItem('physicalTrainer_selectedTeamId');
    // For development/mock mode, always accept saved value
    if (saved) {
      return saved;
    }
    // Default to 'all' if no saved value
    return 'all';
  });
  
  // Persist team selection to localStorage
  useEffect(() => {
    if (selectedTeamId) {
      localStorage.setItem('physicalTrainer_selectedTeamId', selectedTeamId);
    }
  }, [selectedTeamId]);
  
  // Load test data when testing, status, or overview tab is active (overview needs players for roster)
  const shouldLoadTestData = useMemo(() => {
    return activeTab === 'testing' || activeTab === 'status' || activeTab === 'overview';
  }, [activeTab]);
  
  // Use conditional hook to only make API calls when needed
  const testDataResult = useConditionalTestData(shouldLoadTestData, selectedTeamId);
  
  // Mark data as loaded for specific tabs
  useEffect(() => {
    if (shouldLoadTestData && !dataLoaded.testData) {
      setDataLoaded(prev => ({ ...prev, testData: true }));
    }
  }, [shouldLoadTestData, dataLoaded.testData]);
  
  // Get effective team ID for data filtering
  const teamId = selectedTeamId === 'all' || selectedTeamId === 'personal' 
    ? (user?.teams?.[0]?.id || 'default-team')
    : selectedTeamId || 'default-team';
  
  // Use mock data if there's an error or no data, only when tab needs it
  const effectivePlayers = useMemo(() => {
    if (!shouldLoadTestData) {
      return [];
    }
    
    let playerData = testDataResult.players;
    
    // Always use mock data for now since API isn't filtering properly
    // or if there's an error or no data
    if (true || testDataResult.error || (!testDataResult.isLoading && testDataResult.players.length === 0)) {
      // For 'all' view, combine players from all teams
      if (selectedTeamId === 'all') {
        playerData = [
          ...generateMockPlayers('a-team'),
          ...generateMockPlayers('j20'),
          ...generateMockPlayers('u18'),
          ...generateMockPlayers('u16'),
          ...generateMockPlayers('womens')
        ];
      } else if (selectedTeamId === 'personal') {
        // For personal view, show specific individual training players
        playerData = generateMockPlayers('a-team').slice(0, 5); // Just show a few key players
      } else {
        // For specific team, use that team's players
        playerData = generateMockPlayers(selectedTeamId || 'a-team');
      }
    }
    
    // No need to filter if we already generated team-specific data
    return playerData;
  }, [shouldLoadTestData, testDataResult.players, testDataResult.error, testDataResult.isLoading, selectedTeamId]);
  
  // Memoize expensive computations
  const playerReadiness = useMemo(() => {
    if (activeTab !== 'status' && activeTab !== 'overview') {
      return [];
    }
    
    // Generate team-specific player readiness data
    const playerNames: Record<string, string[]> = {
      'a-team': ['Jonathan Pudas', 'Oscar Möller', 'Linus Söderström', 'Rickard Hugg', 'Max Lindholm'],
      'j20': ['Viktor Nordin', 'Axel Sandin-Pellikka', 'Oliver Tärnström', 'Leo Sahlin Wallenius'],
      'u18': ['Adam Engström', 'Noah Dower Nilsson', 'Calle Sjöström'],
      'womens': ['Michelle Löwenhielm', 'Anna Kjellbin', 'Sandra Borg', 'Emma Forsgren']
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
      return [
        ...getReadinessForTeam('a-team'),
        ...getReadinessForTeam('j20'),
        ...getReadinessForTeam('u18'),
        ...getReadinessForTeam('womens')
      ];
    } else if (selectedTeamId === 'personal') {
      return [
        { id: 1, playerId: '1', name: 'Sidney Crosby', status: 'caution' as const, load: 65, fatigue: 'medium' as const, trend: 'up' as const, lastUpdated: new Date().toISOString() },
        { id: 2, playerId: '2', name: 'Nathan MacKinnon', status: 'rest' as const, load: 45, fatigue: 'high' as const, trend: 'stable' as const, lastUpdated: new Date().toISOString() },
        { id: 3, playerId: '3', name: 'Connor McDavid', status: 'ready' as const, load: 85, fatigue: 'low' as const, trend: 'up' as const, lastUpdated: new Date().toISOString() }
      ];
    } else if (selectedTeamId && playerNames[selectedTeamId]) {
      return getReadinessForTeam(selectedTeamId);
    }

    return mockPlayerReadiness;
  }, [activeTab, selectedTeamId]);
  
  const todaysSessions = useMemo(() => {
    if (activeTab !== 'overview' && activeTab !== 'calendar') {
      return [];
    }
    // Return mock sessions only when needed
    return [];
  }, [activeTab]);
  
  // Navigation handlers using callbacks
  const navigateToTab = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const navigateToPlayerStatus = useCallback(() => {
    setActiveTab('status');
  }, []);

  const navigateToCalendar = useCallback(() => {
    setActiveTab('calendar');
  }, []);

  // Template handling
  const handleApplyTemplate = useCallback((template: SessionTemplate, date?: Date, time?: string) => {
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
    
    console.log('Applying template:', sessionData);
    return sessionData;
  }, []);
  
  // Use callbacks for functions to prevent re-creation
  const handleTestSubmit = useCallback(async (formData: TestFormData) => {
    console.log('Test submitted:', formData);
    return { success: true };
  }, []);
  
  const handleTestSaveDraft = useCallback(async (formData: TestFormData) => {
    console.log('Test draft saved:', formData);
    return { success: true };
  }, []);
  
  // Only return test batches and results when needed
  const effectiveTestBatches = useMemo(() => {
    if (!shouldLoadTestData) {
      return [];
    }
    return testDataResult.testBatches;
  }, [shouldLoadTestData, testDataResult.testBatches]);
  
  const effectiveTestResults = useMemo(() => {
    if (!shouldLoadTestData) {
      return [];
    }
    return testDataResult.testResults;
  }, [shouldLoadTestData, testDataResult.testResults]);
  
  // Clear error if we're using mock data or not loading test data
  const effectiveError = shouldLoadTestData 
    ? (testDataResult.error && !testDataResult.isLoading && testDataResult.players.length === 0) ? null : testDataResult.error
    : null;
  // Don't show loading if we're not supposed to load test data yet
  const effectiveLoading = shouldLoadTestData ? testDataResult.isLoading : false;
  
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
    playerReadiness,
    todaysSessions,
    navigateToTab,
    navigateToPlayerStatus,
    navigateToCalendar,
    handleApplyTemplate,
    handleTestSubmit,
    handleTestSaveDraft,
    dataLoaded
  };
}