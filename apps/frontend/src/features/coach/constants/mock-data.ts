import type {
  Player,
  Session,
  GamePerformance,
  LineCombination,
  UpcomingGame,
  SpecialTeamsStats,
  PlayerDevelopment,
} from '../types/coach-dashboard.types';

export const mockPlayers: Player[] = [
  {
    id: 1,
    name: 'Erik Andersson',
    position: 'Forward',
    number: '15',
    status: 'available',
    goals: 12,
    assists: 18,
    plusMinus: 8,
    faceoffPercentage: 52.3,
    shots: 89,
    hits: 45,
    blocks: 12,
    pim: 16,
    toi: '18:32',
  },
  {
    id: 2,
    name: 'Marcus Lindberg',
    position: 'Defense',
    number: '7',
    status: 'limited',
    goals: 3,
    assists: 15,
    plusMinus: 12,
    shots: 67,
    hits: 98,
    blocks: 87,
    pim: 28,
    toi: '22:15',
  },
  {
    id: 3,
    name: 'Viktor Nilsson',
    position: 'Goalie',
    number: '23',
    status: 'available',
    gamesPlayed: 18,
    wins: 12,
    losses: 4,
    otl: 2,
    gaa: 2.34,
    savePercentage: 0.918,
    shutouts: 2,
  },
  {
    id: 4,
    name: 'Johan Bergström',
    position: 'Forward',
    number: '14',
    status: 'available',
    goals: 8,
    assists: 12,
    plusMinus: 5,
    faceoffPercentage: 48.7,
    shots: 54,
    hits: 23,
    blocks: 8,
    pim: 6,
    toi: '15:23',
  },
  {
    id: 5,
    name: 'Anders Johansson',
    position: 'Defense',
    number: '22',
    status: 'unavailable',
    goals: 2,
    assists: 8,
    plusMinus: -3,
    shots: 45,
    hits: 76,
    blocks: 92,
    pim: 32,
    toi: '19:45',
  },
];

export const todaysSessions: Session[] = [
  {
    id: 1,
    time: '06:00',
    duration: 60,
    type: 'ice-training',
    title: 'Morning Skate',
    location: 'Main Rink',
    focus: 'Power Play Practice',
    attendees: 18,
    status: 'completed',
  },
  {
    id: 2,
    time: '10:00',
    duration: 45,
    type: 'meeting',
    title: 'Video Review',
    location: 'Meeting Room',
    focus: 'Opponent Analysis - Northern Knights',
    attendees: 22,
    status: 'completed',
  },
  {
    id: 3,
    time: '16:00',
    duration: 90,
    type: 'ice-training',
    title: 'Full Team Practice',
    location: 'Main Rink',
    focus: 'Defensive Zone Coverage',
    attendees: 22,
    status: 'upcoming',
  },
];

export const teamPerformance: GamePerformance[] = [
  { game: 1, goals: 3, goalsAgainst: 2, shots: 32, shotsAgainst: 28 },
  { game: 2, goals: 2, goalsAgainst: 3, shots: 29, shotsAgainst: 35 },
  { game: 3, goals: 5, goalsAgainst: 1, shots: 38, shotsAgainst: 22 },
  { game: 4, goals: 2, goalsAgainst: 2, shots: 31, shotsAgainst: 30 },
  { game: 5, goals: 4, goalsAgainst: 3, shots: 36, shotsAgainst: 27 },
];

export const lineupCombinations: LineCombination[] = [
  {
    name: 'Line 1',
    forwards: ['Erik Andersson', 'Johan Bergström', 'Lucas Holm'],
    iceTime: '18:45',
    goalsFor: 8,
    goalsAgainst: 3,
    corsi: 58.2,
  },
  {
    name: 'Line 2',
    forwards: ['Maria Andersson', 'Alex Nilsson', 'Filip Berg'],
    iceTime: '16:32',
    goalsFor: 6,
    goalsAgainst: 4,
    corsi: 52.1,
  },
  {
    name: 'Defense Pair 1',
    defense: ['Marcus Lindberg', 'Anders Johansson'],
    iceTime: '22:15',
    goalsFor: 12,
    goalsAgainst: 6,
    corsi: 55.7,
  },
];

export const upcomingGames: UpcomingGame[] = [
  {
    id: 1,
    date: '2024-01-22',
    time: '19:00',
    opponent: 'Northern Knights',
    location: 'Away',
    venue: 'North Arena',
    importance: 'League',
    record: 'W-L-W',
    keyPlayer: 'Max Johnson - 23G, 31A',
  },
  {
    id: 2,
    date: '2024-01-25',
    time: '18:30',
    opponent: 'Ice Breakers',
    location: 'Home',
    venue: 'Home Arena',
    importance: 'Playoff',
    record: 'W-W-L',
    keyPlayer: 'Sarah Smith - .925 SV%',
  },
  {
    id: 3,
    date: '2024-02-01',
    time: '17:00',
    opponent: 'Polar Bears',
    location: 'Away',
    venue: 'Polar Stadium',
    importance: 'League',
    record: 'L-W-W',
    keyPlayer: 'Tom Wilson - 19G, 28A',
  },
];

export const specialTeamsStats: SpecialTeamsStats = {
  powerPlay: {
    percentage: 18.5,
    opportunities: 87,
    goals: 16,
    trend: 'up',
  },
  penaltyKill: {
    percentage: 82.3,
    timesShorthanded: 79,
    goalsAllowed: 14,
    trend: 'stable',
  },
};

export const playerDevelopment: PlayerDevelopment[] = [
  {
    player: 'Erik Andersson',
    goals: [
      { skill: 'Shot Accuracy', target: 85, current: 72, progress: 84 },
      { skill: 'Defensive Positioning', target: 80, current: 65, progress: 81 },
      { skill: 'Faceoff Win %', target: 55, current: 52.3, progress: 95 },
    ],
  },
  {
    player: 'Marcus Lindberg',
    goals: [
      { skill: 'First Pass Success', target: 90, current: 82, progress: 91 },
      { skill: 'Gap Control', target: 85, current: 78, progress: 92 },
      { skill: 'Shot Blocking', target: 100, current: 87, progress: 87 },
    ],
  },
];

// Utility function to calculate availability stats
export function calculateAvailabilityStats(players: Player[]) {
  return {
    available: players.filter((p) => p.status === 'available').length,
    limited: players.filter((p) => p.status === 'limited').length,
    unavailable: players.filter((p) => p.status === 'unavailable').length,
  };
}



