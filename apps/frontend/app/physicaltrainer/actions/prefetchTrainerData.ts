import { cache } from 'react';
import { prefetchAllTrainerData } from '../lib/serverApi';

interface TrainerInitialData {
  players: any[];
  sessions: any[];
  calendarEvents: any[];
  teams: any[];
  stats: {
    totalPlayers: number;
    activeSessions: number;
    todaysSessions: number;
    weeklyProgress: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

// Cache the function to prevent multiple calls during a single request
export const prefetchTrainerData = cache(async (): Promise<TrainerInitialData> => {
  try {
    // Fetch all data in parallel on the server
    const data = await prefetchAllTrainerData();
    
    // Return with mock user for now
    return {
      ...data,
      user: {
        id: 'trainer-1',
        name: 'John Smith',
        email: 'trainer@hockeyhub.com',
        role: 'physical_trainer',
      },
    };
  } catch (error) {
    console.error('Error prefetching trainer data:', error);
    
    // Return empty data on error
    return {
      players: [],
      sessions: [],
      calendarEvents: [],
      teams: [],
      stats: {
        totalPlayers: 0,
        activeSessions: 0,
        todaysSessions: 0,
        weeklyProgress: 0,
      },
      user: null,
    };
  }
});