import { useState, useMemo } from 'react';
import { useGetSessionsQuery } from '@/store/api/trainingApi';
import { WorkoutSession, TodaySession } from '../types';

interface CurrentSession {
  team: string;
  type: string;
  teamId: string;
}

export function useSessionManagement(teamId?: string | null) {
  const [showSessionViewer, setShowSessionViewer] = useState(false);
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch today's sessions from API with optional team filter
  const today = new Date().toISOString().split('T')[0];
  const queryParams: any = { date: today };
  
  // Add team filter if not 'all' or 'personal'
  if (teamId && teamId !== 'all' && teamId !== 'personal') {
    queryParams.teamId = teamId;
  }
  
  const { data: apiSessions, isLoading: sessionsLoading, error } = useGetSessionsQuery(queryParams);

  // Use 'all' as default if teamId is null or undefined
  const effectiveTeamId = teamId || 'all';
  
  // Generate mock sessions based on selected team
  const mockSessions = useMemo(() => {
    const teamNames: Record<string, string> = {
      'a-team': 'A-Team',
      'j20': 'J20',
      'u18': 'U18',
      'u16': 'U16',
      'womens': "Women's Team"
    };

    const baseSessions: TodaySession[] = [
      {
        id: 1,
        time: '07:30',
        team: 'team',
        type: 'recoverySession',
        location: 'gym',
        players: 22,
        status: 'completed' as const,
        intensity: 'low' as const,
        description: 'activeRecoveryMobility'
      },
      {
        id: 2,
        time: '09:00',
        team: 'team',
        type: 'strengthTraining',
        location: 'weightRoom',
        players: 18,
        status: 'active' as const,
        intensity: 'high' as const,
        description: 'olympicLiftsPlyometrics'
      },
      {
        id: 3,
        time: '11:00',
        team: 'team',
        type: 'cardioIntervals',
        location: 'field',
        players: 20,
        status: 'upcoming' as const,
        intensity: 'high' as const,
        description: 'highIntensityIntervalTraining'
      },
      {
        id: 4,
        time: '14:00',
        team: 'team',
        type: 'speedAgility',
        location: 'field',
        players: 16,
        status: 'upcoming' as const,
        intensity: 'medium' as const,
        description: 'sprintDrillsLadderWork'
      },
      {
        id: 5,
        time: '15:30',
        team: 'team',
        type: 'powerDevelopment',
        location: 'weightRoom',
        players: 14,
        status: 'upcoming' as const,
        intensity: 'medium' as const,
        description: 'explosivePowerTraining'
      }
    ];

    if (effectiveTeamId === 'all') {
      // Show sessions from multiple teams
      return [
        { ...baseSessions[0], id: 1, team: 'aTeam', players: 25 },
        { ...baseSessions[1], id: 2, team: 'j20Team', players: 22 },
        { ...baseSessions[2], id: 3, team: 'u18Team', players: 20 },
        { ...baseSessions[3], id: 4, team: 'u16Team', players: 18 },
        { ...baseSessions[4], id: 5, team: 'womensTeam', players: 23 }
      ];
    } else if (effectiveTeamId === 'personal') {
      // Show personal training sessions
      return [
        {
          id: 6,
          time: '06:30',
          team: 'individual',
          type: 'personalTraining',
          location: 'gym',
          players: 1,
          status: 'completed' as const,
          intensity: 'high' as const,
          description: 'personalRecoveryProgram'
        },
        {
          id: 7,
          time: '10:00',
          team: 'individual',
          type: 'rehabSession',
          location: 'medicalCenter',
          players: 1,
          status: 'active' as const,
          intensity: 'low' as const,
          description: 'kneeRehabilitation'
        },
        {
          id: 8,
          time: '13:00',
          team: 'individual',
          type: 'sprintTraining',
          location: 'track',
          players: 3,
          status: 'upcoming' as const,
          intensity: 'high' as const,
          description: 'speedDevelopmentProgram'
        }
      ];
    } else if (effectiveTeamId && teamNames[effectiveTeamId]) {
      // Show sessions for specific team with team-specific times
      const teamName = teamNames[effectiveTeamId];
      const playerCounts: Record<string, number> = {
        'a-team': 25,
        'j20': 22,
        'u18': 20,
        'u16': 18,
        'womens': 23
      };
      
      // Different time slots for different teams
      const teamTimes: Record<string, string[]> = {
        'a-team': ['06:00', '08:30', '10:00', '15:00', '17:00'],
        'j20': ['07:00', '09:30', '13:00', '16:00', '18:00'],
        'u18': ['08:00', '11:00', '14:00', '16:30', '18:30'],
        'u16': ['09:00', '12:00', '15:00', '17:00', '19:00'],
        'womens': ['06:30', '09:00', '11:30', '14:30', '16:00']
      };
      
      const times = teamTimes[effectiveTeamId] || teamTimes['a-team'];
      
      return baseSessions.map((session, index) => ({
        ...session,
        id: index + 1,
        time: times[index],
        team: teamName,
        players: playerCounts[effectiveTeamId] || 20,
        // Make the second session always active for each team
        status: index === 1 ? 'active' as const : session.status
      }));
    }

    return baseSessions;
  }, [effectiveTeamId]);

  // Always use mock sessions for now to ensure team filtering works
  const todaysSessions = useMemo(() => {
    // Force use of mock data for development
    return mockSessions;
    
    // Original code commented out for now
    // if (!apiSessions || apiSessions.length === 0 || error) {
    //   return mockSessions;
    // }
    // 
    // return apiSessions.map(session => ({
    //   id: session.id,
    //   time: session.time,
    //   team: session.team,
    //   type: session.name,
    //   location: session.location,
    //   players: session.currentParticipants,
    //   status: session.status === 'active' ? 'active' : 
    //           session.status === 'completed' ? 'completed' : 'upcoming',
    //   intensity: session.intensity,
    //   description: session.description || ''
    // })) as TodaySession[];
  }, [mockSessions]);

  const launchSession = (session: TodaySession) => {
    setCurrentSession({ 
      team: session.team, 
      type: session.type,
      teamId: session.id.toString()
    });
    setShowSessionViewer(true);
  };

  const closeSessionViewer = () => {
    setShowSessionViewer(false);
    setCurrentSession(null);
  };

  const getSessionIntervals = () => {
    if (currentSession?.type === 'cardioIntervals') {
      // Return default cardio intervals - in production this would come from the session data
      return [
        { phase: 'work' as const, duration: 30 },
        { phase: 'rest' as const, duration: 20 },
        { phase: 'work' as const, duration: 30 },
        { phase: 'rest' as const, duration: 20 },
        { phase: 'work' as const, duration: 30 },
        { phase: 'rest' as const, duration: 20 },
      ];
    }
    return [];
  };

  return {
    todaysSessions,
    sessionsLoading,
    showSessionViewer,
    currentSession,
    showCreateModal,
    setShowCreateModal,
    launchSession,
    closeSessionViewer,
    getSessionIntervals
  };
}