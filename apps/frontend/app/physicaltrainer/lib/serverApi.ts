import { cache } from 'react';

// Types
interface APIResponse<T> {
  data: T;
  error?: string;
}

// Mock API delay for realistic behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Cached API functions for server-side data fetching
export const getPlayers = cache(async (teamId?: string): Promise<APIResponse<any[]>> => {
  await delay(50);
  
  const allPlayers = [
    {
      id: '1',
      name: 'Connor McDavid',
      position: 'Center',
      team: 'U18 Elite',
      teamId: 'u18-elite',
      status: 'healthy',
      jersey: '97',
      avatar: '/api/placeholder/32/32',
    },
    {
      id: '2',
      name: 'Sidney Crosby',
      position: 'Center',
      team: 'U18 Elite',
      teamId: 'u18-elite',
      status: 'injured',
      jersey: '87',
      avatar: '/api/placeholder/32/32',
      medicalStatus: {
        status: 'injured',
        restrictions: ['No lower body exercises', 'Limited ice time'],
        returnDate: '2025-02-01',
      },
    },
    {
      id: '3',
      name: 'Nathan MacKinnon',
      position: 'Center',
      team: 'U18 Elite',
      teamId: 'u18-elite',
      status: 'limited',
      jersey: '29',
      avatar: '/api/placeholder/32/32',
      medicalStatus: {
        status: 'limited',
        restrictions: ['No high intensity cardio'],
      },
    },
    {
      id: '4',
      name: 'Auston Matthews',
      position: 'Center',
      team: 'U16 AAA',
      teamId: 'u16-aaa',
      status: 'healthy',
      jersey: '34',
      avatar: '/api/placeholder/32/32',
    },
    {
      id: '5',
      name: 'Leon Draisaitl',
      position: 'Center',
      team: 'U16 AAA',
      teamId: 'u16-aaa',
      status: 'healthy',
      jersey: '29',
      avatar: '/api/placeholder/32/32',
    },
  ];

  const players = teamId 
    ? allPlayers.filter(p => p.teamId === teamId)
    : allPlayers;

  return { data: players };
});

export const getSessions = cache(async (teamId?: string): Promise<APIResponse<any[]>> => {
  await delay(50);
  
  const today = new Date();
  const sessions = [
    {
      id: '1',
      title: 'Morning Strength Training',
      date: today.toISOString().split('T')[0],
      time: '06:00',
      type: 'strength',
      participants: 12,
      status: 'scheduled',
      teamId: 'u18-elite',
      duration: 90,
      location: 'Gym A',
    },
    {
      id: '2',
      title: 'Afternoon Conditioning',
      date: today.toISOString().split('T')[0],
      time: '14:00',
      type: 'conditioning',
      participants: 8,
      status: 'scheduled',
      teamId: 'u16-aaa',
      duration: 60,
      location: 'Track',
    },
    {
      id: '3',
      title: 'Evening Hybrid Workout',
      date: today.toISOString().split('T')[0],
      time: '18:00',
      type: 'hybrid',
      participants: 15,
      status: 'scheduled',
      teamId: 'u18-elite',
      duration: 75,
      location: 'Gym B',
    },
    {
      id: '4',
      title: 'Agility Training',
      date: today.toISOString().split('T')[0],
      time: '16:00',
      type: 'agility',
      participants: 10,
      status: 'in-progress',
      teamId: 'u14-aa',
      duration: 45,
      location: 'Ice Rink',
    },
  ];

  const filteredSessions = teamId
    ? sessions.filter(s => s.teamId === teamId)
    : sessions;

  return { data: filteredSessions };
});

export const getTeams = cache(async (): Promise<APIResponse<any[]>> => {
  await delay(30);
  
  const teams = [
    { id: 'u18-elite', name: 'U18 Elite', players: 22, color: '#1e40af' },
    { id: 'u16-aaa', name: 'U16 AAA', players: 20, color: '#7c3aed' },
    { id: 'u14-aa', name: 'U14 AA', players: 18, color: '#dc2626' },
  ];

  return { data: teams };
});

export const getCalendarEvents = cache(async (teamId?: string): Promise<APIResponse<any[]>> => {
  await delay(50);
  
  const today = new Date();
  const events = [
    {
      id: 'evt-1',
      title: 'Team Practice - U18 Elite',
      start: new Date(today.setHours(9, 0)).toISOString(),
      end: new Date(today.setHours(11, 0)).toISOString(),
      type: 'practice',
      teamId: 'u18-elite',
      color: '#3b82f6',
      location: 'Main Rink',
    },
    {
      id: 'evt-2',
      title: 'Strength Training - U16 AAA',
      start: new Date(today.setHours(14, 0)).toISOString(),
      end: new Date(today.setHours(15, 30)).toISOString(),
      type: 'training',
      teamId: 'u16-aaa',
      color: '#8b5cf6',
      location: 'Weight Room',
    },
    {
      id: 'evt-3',
      title: 'Game Day - U18 Elite vs Rivals',
      start: new Date(today.setHours(19, 0)).toISOString(),
      end: new Date(today.setHours(21, 0)).toISOString(),
      type: 'game',
      teamId: 'u18-elite',
      color: '#ef4444',
      location: 'Arena A',
    },
  ];

  const filteredEvents = teamId
    ? events.filter(e => e.teamId === teamId)
    : events;

  return { data: filteredEvents };
});

// Aggregate function for prefetching all data
export const prefetchAllTrainerData = cache(async () => {
  const [players, sessions, teams, events] = await Promise.all([
    getPlayers(),
    getSessions(),
    getTeams(),
    getCalendarEvents(),
  ]);

  return {
    players: players.data || [],
    sessions: sessions.data || [],
    teams: teams.data || [],
    calendarEvents: events.data || [],
    stats: {
      totalPlayers: players.data?.length || 0,
      activeSessions: sessions.data?.filter(s => s.status === 'in-progress').length || 0,
      todaysSessions: sessions.data?.length || 0,
      weeklyProgress: 85,
    },
  };
});