import { useState, useMemo } from 'react';
import { useGetSessionsQuery } from '@/store/api/trainingApi';
import { WorkoutSession, TodaySession } from '../types';

interface CurrentSession {
  team: string;
  type: string;
  teamId: string;
  fullSessionData?: TodaySession;
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

    // Team-specific sessions with proper workout types
    const teamSpecificSessions: Record<string, TodaySession[]> = {
      'a-team': [
        {
          id: 'session-001',
          time: '06:00',
          team: 'A-Team',
          type: 'strength', // Maps to strength viewer
          location: 'weightRoom',
          players: 25,
          status: 'completed' as const,
          intensity: 'high' as const,
          description: 'Max strength testing - 1RM squats and deadlifts',
          duration: 90
        },
        {
          id: 'session-002',
          time: '08:30',
          team: 'A-Team',
          type: 'conditioning', // Maps to interval viewer
          location: 'track',
          players: 23,
          status: 'active' as const,
          intensity: 'high' as const,
          description: 'High intensity intervals - 4x4min at 90% max HR',
          duration: 60
        },
        {
          id: 'session-003',
          time: '10:00',
          team: 'A-Team',
          type: 'hybrid', // Maps to hybrid viewer
          location: 'gym',
          players: 24,
          status: 'upcoming' as const,
          intensity: 'medium' as const,
          description: 'Elite power circuit - strength + cardio blocks',
          duration: 75
        },
        {
          id: 4,
          time: '15:00',
          team: 'A-Team',
          type: 'agility', // Maps to agility viewer
          location: 'field',
          players: 22,
          status: 'upcoming' as const,
          intensity: 'medium' as const,
          description: 'Cone drills and ladder work'
        },
        {
          id: 5,
          time: '17:00',
          team: 'A-Team',
          type: 'recovery',
          location: 'gym',
          players: 25,
          status: 'upcoming' as const,
          intensity: 'low' as const,
          description: 'Yoga and stretching session'
        }
      ],
      'j20': [
        {
          id: 6,
          time: '07:00',
          team: 'J20',
          type: 'agility', // Maps to agility viewer
          location: 'field',
          players: 20,
          status: 'completed' as const,
          intensity: 'high' as const,
          description: 'Speed ladder and reaction drills'
        },
        {
          id: 7,
          time: '09:30',
          team: 'J20',
          type: 'strength', // Maps to strength viewer
          location: 'weightRoom',
          players: 18,
          status: 'active' as const,
          intensity: 'medium' as const,
          description: 'Upper body hypertrophy - bench press focus'
        },
        {
          id: 8,
          time: '13:00',
          team: 'J20',
          type: 'hybrid', // Maps to hybrid viewer
          location: 'gym',
          players: 19,
          status: 'upcoming' as const,
          intensity: 'high' as const,
          description: 'CrossFit-style WOD - Olympic lifts + sprints'
        },
        {
          id: 9,
          time: '16:00',
          team: 'J20',
          type: 'conditioning', // Maps to interval viewer
          location: 'track',
          players: 22,
          status: 'upcoming' as const,
          intensity: 'high' as const,
          description: '400m repeats x8 with 90s rest'
        }
      ],
      'u18': [
        {
          id: 10,
          time: '08:00',
          team: 'U18',
          type: 'conditioning', // Maps to interval viewer
          location: 'field',
          players: 18,
          status: 'completed' as const,
          intensity: 'medium' as const,
          description: 'Aerobic base building - 30min tempo run'
        },
        {
          id: 11,
          time: '11:00',
          team: 'U18',
          type: 'hybrid', // Maps to hybrid viewer
          location: 'gym',
          players: 17,
          status: 'active' as const,
          intensity: 'medium' as const,
          description: 'Functional fitness - TRX + battle ropes'
        },
        {
          id: 12,
          time: '14:00',
          team: 'U18',
          type: 'strength', // Maps to strength viewer
          location: 'weightRoom',
          players: 16,
          status: 'upcoming' as const,
          intensity: 'high' as const,
          description: 'Lower body power - jump squats and cleans'
        },
        {
          id: 13,
          time: '16:30',
          team: 'U18',
          type: 'agility', // Maps to agility viewer
          location: 'field',
          players: 20,
          status: 'upcoming' as const,
          intensity: 'medium' as const,
          description: 'T-drills and 5-10-5 shuttle runs'
        }
      ],
      'u16': [
        {
          id: 14,
          time: '09:00',
          team: 'U16',
          type: 'agility', // Maps to agility viewer
          location: 'field',
          players: 16,
          status: 'completed' as const,
          intensity: 'low' as const,
          description: 'Basic coordination and footwork patterns'
        },
        {
          id: 15,
          time: '12:00',
          team: 'U16',
          type: 'strength', // Maps to strength viewer
          location: 'gym',
          players: 15,
          status: 'active' as const,
          intensity: 'low' as const,
          description: 'Bodyweight fundamentals - proper form focus'
        },
        {
          id: 16,
          time: '15:00',
          team: 'U16',
          type: 'conditioning', // Maps to interval viewer
          location: 'track',
          players: 18,
          status: 'upcoming' as const,
          intensity: 'medium' as const,
          description: 'Fun relay races and team challenges'
        }
      ],
      'womens': [
        {
          id: 17,
          time: '06:30',
          team: "Women's Team",
          type: 'hybrid', // Maps to hybrid viewer
          location: 'gym',
          players: 21,
          status: 'completed' as const,
          intensity: 'high' as const,
          description: 'Boot camp - plyometrics + core circuits'
        },
        {
          id: 18,
          time: '09:00',
          team: "Women's Team",
          type: 'strength', // Maps to strength viewer
          location: 'weightRoom',
          players: 19,
          status: 'active' as const,
          intensity: 'medium' as const,
          description: 'Full body strength - compound movements'
        },
        {
          id: 19,
          time: '11:30',
          team: "Women's Team",
          type: 'agility', // Maps to agility viewer
          location: 'field',
          players: 23,
          status: 'upcoming' as const,
          intensity: 'high' as const,
          description: 'Sport-specific agility patterns'
        },
        {
          id: 20,
          time: '14:30',
          team: "Women's Team",
          type: 'conditioning', // Maps to interval viewer
          location: 'track',
          players: 20,
          status: 'upcoming' as const,
          intensity: 'medium' as const,
          description: 'Fartlek training - varied pace intervals'
        }
      ]
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
        team: 'A-Team',
        type: 'conditioning',
        location: 'track',
        players: 18,
        status: 'active' as const,
        intensity: 'high' as const,
        description: 'Interval training - 4x4min at 90% HR'
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
      // Show a mix of sessions from different teams
      return [
        teamSpecificSessions['a-team'][1], // A-Team conditioning (active)
        teamSpecificSessions['j20'][1], // J20 strength (active)
        teamSpecificSessions['u18'][1], // U18 hybrid (active)
        teamSpecificSessions['a-team'][0], // A-Team strength (completed)
        teamSpecificSessions['womens'][3], // Women's conditioning (upcoming)
        teamSpecificSessions['u16'][2], // U16 conditioning (upcoming)
        teamSpecificSessions['j20'][2], // J20 hybrid (upcoming)
        teamSpecificSessions['u18'][3] // U18 agility (upcoming)
      ];
    } else if (effectiveTeamId === 'personal') {
      // Show personal training sessions
      return [
        {
          id: 100,
          time: '06:30',
          team: 'individual',
          type: 'strength',
          location: 'gym',
          players: 1,
          status: 'completed' as const,
          intensity: 'high' as const,
          description: 'Personal strength program - deadlift focus'
        },
        {
          id: 101,
          time: '10:00',
          team: 'individual',
          type: 'conditioning',
          location: 'track',
          players: 1,
          status: 'active' as const,
          intensity: 'medium' as const,
          description: 'Recovery run - 5km at easy pace'
        },
        {
          id: 102,
          time: '13:00',
          team: 'individual',
          type: 'hybrid',
          location: 'gym',
          players: 3,
          status: 'upcoming' as const,
          intensity: 'high' as const,
          description: 'Small group training - circuit workout'
        },
        {
          id: 103,
          time: '15:30',
          team: 'individual',
          type: 'agility',
          location: 'field',
          players: 2,
          status: 'upcoming' as const,
          intensity: 'medium' as const,
          description: 'Specialized agility work - goalie training'
        }
      ];
    } else if (effectiveTeamId && teamSpecificSessions[effectiveTeamId]) {
      // Return team-specific sessions
      return teamSpecificSessions[effectiveTeamId];
    }

    // Fallback to base sessions
    return baseSessions;
  }, [effectiveTeamId]);

  // Use API sessions when available, fall back to mock data
  const todaysSessions = useMemo(() => {
    // Use mock data only if API fails or returns empty data
    if (!apiSessions || apiSessions.length === 0 || error) {
      return mockSessions;
    }
    
    // Map API sessions to the expected format
    return apiSessions.map(session => ({
      id: session.id,
      time: session.time,
      team: session.team,
      type: session.type, // Use session.type instead of session.name
      location: session.location,
      players: session.players || session.currentParticipants,
      status: session.status === 'active' ? 'active' : 
              session.status === 'completed' ? 'completed' : 'upcoming',
      intensity: session.intensity,
      description: session.description || ''
    })) as TodaySession[];
  }, [apiSessions, mockSessions, error]);

  const launchSession = (session: TodaySession) => {
    setCurrentSession({ 
      team: session.team, 
      type: session.type,
      teamId: session.id.toString(),
      fullSessionData: session
    });
    setShowSessionViewer(true);
  };

  const closeSessionViewer = () => {
    setShowSessionViewer(false);
    setCurrentSession(null);
  };

  const getSessionIntervals = () => {
    // Handle both old 'cardioIntervals' and new 'conditioning' types
    if (currentSession?.type === 'cardioIntervals' || currentSession?.type === 'conditioning') {
      // Return default conditioning intervals - in production this would come from the session data
      return [
        { phase: 'work' as const, duration: 240 }, // 4 minutes
        { phase: 'rest' as const, duration: 120 }, // 2 minutes
        { phase: 'work' as const, duration: 240 },
        { phase: 'rest' as const, duration: 120 },
        { phase: 'work' as const, duration: 240 },
        { phase: 'rest' as const, duration: 120 },
        { phase: 'work' as const, duration: 240 },
        { phase: 'rest' as const, duration: 120 },
      ];
    }
    return [];
  };

  // Get mock hybrid blocks based on session
  const getHybridBlocks = () => {
    if (currentSession?.type === 'hybrid') {
      // Return sample hybrid blocks
      return [
        {
          id: '1',
          type: 'exercise' as const,
          name: 'Warm-Up Circuit',
          duration: 300, // 5 minutes
          exercises: [
            { name: 'Jumping Jacks', reps: 20 },
            { name: 'Arm Circles', reps: 15 },
            { name: 'Leg Swings', reps: 10 }
          ]
        },
        {
          id: '2',
          type: 'interval' as const,
          name: 'Cardio Blast',
          duration: 480, // 8 minutes
          intervals: [
            { phase: 'work' as const, duration: 60, intensity: 'high' },
            { phase: 'rest' as const, duration: 30 },
            { phase: 'work' as const, duration: 60, intensity: 'high' },
            { phase: 'rest' as const, duration: 30 }
          ]
        },
        {
          id: '3',
          type: 'exercise' as const,
          name: 'Strength Circuit',
          duration: 600, // 10 minutes
          exercises: [
            { name: 'Squats', sets: 3, reps: 15 },
            { name: 'Push-ups', sets: 3, reps: 12 },
            { name: 'Lunges', sets: 3, reps: 10 }
          ]
        },
        {
          id: '4',
          type: 'transition' as const,
          name: 'Active Recovery',
          duration: 180, // 3 minutes
          description: 'Light walking and stretching'
        },
        {
          id: '5',
          type: 'interval' as const,
          name: 'Finisher',
          duration: 300, // 5 minutes
          intervals: [
            { phase: 'work' as const, duration: 30, intensity: 'max' },
            { phase: 'rest' as const, duration: 30 }
          ]
        }
      ];
    }
    return [];
  };

  // Get mock agility session based on current session
  const getAgilitySession = () => {
    if (currentSession?.type === 'agility') {
      return {
        id: 'agility-1',
        name: 'Hockey Agility Training',
        description: 'Sport-specific agility drills',
        phases: [
          {
            id: 'warmup',
            name: 'Dynamic Warm-Up',
            type: 'warmup' as const,
            duration: 300, // 5 minutes
            drills: []
          },
          {
            id: 'main',
            name: 'Main Drills',
            type: 'drills' as const,
            duration: 1800, // 30 minutes
            drills: [
              {
                id: 'd1',
                name: 'T-Drill',
                sets: 3,
                reps: 5,
                restBetweenSets: 60,
                pattern: {
                  type: 't-drill' as const,
                  cones: [
                    { x: 50, y: 10, label: 'Start' },
                    { x: 50, y: 40, label: 'A' },
                    { x: 20, y: 40, label: 'B' },
                    { x: 80, y: 40, label: 'C' }
                  ]
                }
              },
              {
                id: 'd2',
                name: '5-10-5 Shuttle',
                sets: 3,
                reps: 3,
                restBetweenSets: 90,
                pattern: {
                  type: '5-10-5' as const,
                  cones: [
                    { x: 20, y: 50, label: 'L' },
                    { x: 50, y: 50, label: 'C' },
                    { x: 80, y: 50, label: 'R' }
                  ]
                }
              },
              {
                id: 'd3',
                name: 'Ladder Drills',
                sets: 2,
                reps: 1,
                restBetweenSets: 60,
                pattern: {
                  type: 'ladder' as const,
                  variations: ['In-In-Out-Out', 'Lateral Shuffle', 'Crossover']
                }
              }
            ]
          },
          {
            id: 'cooldown',
            name: 'Cool Down',
            type: 'cooldown' as const,
            duration: 300, // 5 minutes
            drills: []
          }
        ]
      };
    }
    return null;
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
    getSessionIntervals,
    getHybridBlocks,
    getAgilitySession
  };
}