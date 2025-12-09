// Coach Dashboard Types

export type CoachTab =
  | 'overview'
  | 'tactical'
  | 'calendar'
  | 'team'
  | 'training'
  | 'games'
  | 'statistics'
  | 'development'
  | 'broadcasts'
  | 'parents';

export type PlayerStatus = 'available' | 'limited' | 'unavailable';

export interface Player {
  id: number;
  name: string;
  position: string;
  number: string;
  status: PlayerStatus;
  goals?: number;
  assists?: number;
  plusMinus?: number;
  faceoffPercentage?: number;
  shots?: number;
  hits?: number;
  blocks?: number;
  pim?: number;
  toi?: string;
  // Goalie-specific stats
  gamesPlayed?: number;
  wins?: number;
  losses?: number;
  otl?: number;
  gaa?: number;
  savePercentage?: number;
  shutouts?: number;
}

export interface Session {
  id: number;
  time: string;
  duration: number;
  type: 'ice-training' | 'meeting' | 'physical-training';
  title: string;
  location: string;
  focus: string;
  attendees: number;
  status: 'completed' | 'upcoming' | 'in-progress';
}

export interface GamePerformance {
  game: number;
  goals: number;
  goalsAgainst: number;
  shots: number;
  shotsAgainst: number;
}

export interface LineCombination {
  name: string;
  forwards?: string[];
  defense?: string[];
  iceTime: string;
  goalsFor: number;
  goalsAgainst: number;
  corsi: number;
}

export interface UpcomingGame {
  id: number;
  date: string;
  time: string;
  opponent: string;
  location: 'Home' | 'Away';
  venue: string;
  importance: 'League' | 'Playoff' | 'Tournament';
  record: string;
  keyPlayer: string;
}

export interface SpecialTeamsStats {
  powerPlay: {
    percentage: number;
    opportunities: number;
    goals: number;
    trend: 'up' | 'down' | 'stable';
  };
  penaltyKill: {
    percentage: number;
    timesShorthanded: number;
    goalsAllowed: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface SkillGoal {
  skill: string;
  target: number;
  current: number;
  progress: number;
}

export interface PlayerDevelopment {
  player: string;
  goals: SkillGoal[];
}

export interface AvailabilityStats {
  available: number;
  limited: number;
  unavailable: number;
}

export interface TrainingTemplate {
  id: string;
  name: string;
  duration: number;
  description: string;
  exercises: Array<{
    name: string;
    duration: number;
    type: string;
  }>;
}

// Props interfaces for tab components
export interface OverviewTabProps {
  availabilityStats: AvailabilityStats;
  selectedTeamId: string | null;
  specialTeamsStats: SpecialTeamsStats;
  onNavigateToTab: (tab: CoachTab) => void;
}

export interface TeamManagementTabProps {
  players: Player[];
  lineupCombinations: LineCombination[];
  selectedPlayer: string | null;
  onSelectPlayer: (playerId: string | null) => void;
}

export interface GamesTabProps {
  upcomingGames: UpcomingGame[];
  specialTeamsStats: SpecialTeamsStats;
  onNavigateToTactical: () => void;
}

export interface StatisticsTabProps {
  teamPerformance: GamePerformance[];
  specialTeamsStats: SpecialTeamsStats;
}

export interface DevelopmentTabProps {
  playerDevelopment: PlayerDevelopment[];
}

export interface ParentChannelsTabProps {
  channels: Array<{
    id: string;
    playerName: string;
    parentName: string;
    unreadCount: number;
    hasPendingMeetingRequest: boolean;
  }>;
  loading: boolean;
  onChannelSelect: (channelId: string) => void;
}



